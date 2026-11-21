/**
 * Vercel serverless adapter.
 *
 * The domain engine deliberately stays the same SQLite implementation used
 * locally. In a serverless runtime its data is hydrated from one locked
 * PostgreSQL snapshot, handled, and committed before the HTTP response is
 * released. This retains the existing transaction, revision and audit
 * semantics without writing durable state to Vercel's ephemeral filesystem.
 */
import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;
const runtimeKey =
  process.env.VERCEL_DEPLOYMENT_ID ?? `local-${process.pid}`;
const tempDatabase = join(
  tmpdir(),
  `ai-process-${runtimeKey}.sqlite`,
);
let enginePromise;
let pool;
let schemaPromise;
let exclusive = Promise.resolve();
let loadedVersion = null;

function engine() {
  if (!enginePromise) {
    mkdirSync(dirname(tempDatabase), { recursive: true });
    process.env.AI_PROCESS_EMBEDDED = "1";
    process.env.AI_PROCESS_DB_PATH = tempDatabase;
    enginePromise = import("../server/index.mjs");
  }
  return enginePromise;
}

function postgres() {
  if (!databaseUrl) throw new Error("DATABASE_URL is required for the Vercel deployment.");
  if (!pool) {
    pool = new Pool({
      connectionString: databaseUrl,
      max: 1,
    });
    // pg otherwise treats an idle-client network failure as an uncaught error.
    // Keep diagnostics generic because the error can carry connection details.
    pool.on("error", () => undefined);
  }
  return pool;
}

async function schema() {
  if (!schemaPromise) {
    schemaPromise = postgres().query(`
      SELECT pg_advisory_xact_lock(hashtext('ai-process-schema-v1'));
      CREATE TABLE IF NOT EXISTS ai_process_state (
        id TEXT PRIMARY KEY,
        version BIGINT NOT NULL,
        snapshot JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS ai_process_presence (
        board_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        payload JSONB NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        PRIMARY KEY (board_id, user_id)
      );
      CREATE INDEX IF NOT EXISTS ai_process_presence_expiry
        ON ai_process_presence (expires_at);
      INSERT INTO ai_process_state(id,version,snapshot)
        VALUES('primary',0,'{}'::jsonb)
        ON CONFLICT(id) DO NOTHING;
    `).catch((error) => {
      schemaPromise = undefined;
      throw error;
    });
  }
  return schemaPromise;
}

class BufferedResponse {
  constructor() {
    this.statusCode = 200;
    this.headers = {};
    this.chunks = [];
  }

  writeHead(statusCode, headers = {}) {
    this.statusCode = statusCode;
    this.headers = { ...this.headers, ...headers };
    return this;
  }

  setHeader(name, value) {
    this.headers[name] = value;
  }

  getHeader(name) {
    return this.headers[name];
  }

  end(chunk) {
    if (chunk) this.chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
  }

  destroy() {
    this.statusCode = 500;
  }

  body() {
    return Buffer.concat(this.chunks);
  }
}

function queued(work) {
  const current = exclusive.then(work, work);
  exclusive = current.catch(() => undefined);
  return current;
}

function isMutation(request) {
  return ["POST", "PUT", "PATCH", "DELETE"].includes(request.method ?? "GET");
}

function isPresence(request) {
  return /^\/api\/boards\/[^/]+\/presence$/.test(
    new URL(request.url, "https://app.invalid").pathname,
  );
}

function pathOf(request) {
  return new URL(request.url, "https://app.invalid").pathname;
}

function boardIdOfPresence(request) {
  return pathOf(request).match(/^\/api\/boards\/([^/]+)\/presence$/)?.[1];
}

function isAgentRequest(request) {
  return /^\/api\/boards\/[^/]+\/agents$/.test(pathOf(request));
}

function mutatesSnapshot(request) {
  return isMutation(request) && !isPresence(request) && !isAgentRequest(request);
}

async function readPresence(client, boardId) {
  if (!boardId) return [];
  const { rows } = await client.query(
    `SELECT board_id AS "boardId", user_id AS "userId", payload
       FROM ai_process_presence
       WHERE board_id=$1 AND expires_at > NOW()`,
    [boardId],
  );
  return rows.map((row) => ({
    boardId: row.boardId,
    userId: row.userId,
    ...row.payload,
  }));
}

async function writePresence(client, before, records) {
  await client.query("DELETE FROM ai_process_presence WHERE expires_at <= NOW()");
  const previous = new Map(
    before.map((record) => [
      `${record.boardId}:${record.userId}`,
      JSON.stringify(record),
    ]),
  );
  for (const record of records.filter(
    (record) =>
      previous.get(`${record.boardId}:${record.userId}`) !==
      JSON.stringify(record),
  )) {
    if (Number(record.expiresAt) <= Date.now()) continue;
    await client.query(
      `INSERT INTO ai_process_presence(board_id,user_id,payload,expires_at)
       VALUES($1,$2,$3::jsonb,to_timestamp($4 / 1000.0))
       ON CONFLICT(board_id,user_id) DO UPDATE
       SET payload=EXCLUDED.payload, expires_at=EXCLUDED.expires_at`,
      [
        record.boardId,
        record.userId,
        JSON.stringify({
          user: record.user,
          cursor: record.cursor,
          selection: record.selection,
          view: record.view,
          expiresAt: record.expiresAt,
        }),
        Number(record.expiresAt),
      ],
    );
  }
}

function release(response, buffered) {
  for (const [name, value] of Object.entries(buffered.headers)) {
    response.setHeader(name, value);
  }
  response.statusCode = buffered.statusCode;
  response.end(buffered.body());
}

async function run(request, response) {
  const mutation = mutatesSnapshot(request);
  const presence = isPresence(request);
  const presenceWrite = presence && request.method === "POST";
  const presenceBoardId = boardIdOfPresence(request);
  let client;
  let version;

  try {
    await schema();
    const runtime = await engine();
    client = await postgres().connect();
    if (mutation) {
      await client.query("BEGIN");
      const state = await client.query(
        "SELECT version,snapshot FROM ai_process_state WHERE id='primary' FOR UPDATE",
      );
      version = Number(state.rows[0].version);
      if (loadedVersion !== version) {
        runtime.importSnapshot(state.rows[0].snapshot);
        loadedVersion = version;
      }
    } else {
      const versionResult = await client.query(
        "SELECT version FROM ai_process_state WHERE id='primary'",
      );
      version = Number(versionResult.rows[0].version);
      if (loadedVersion !== version) {
        const state = await client.query(
          "SELECT version,snapshot FROM ai_process_state WHERE id='primary'",
        );
        runtime.importSnapshot(state.rows[0].snapshot);
        loadedVersion = Number(state.rows[0].version);
      }
    }
    const existingPresence = await readPresence(client, presenceBoardId);
    runtime.importPresence(existingPresence);
    if (isAgentRequest(request)) {
      // Agent generation is read-only. Do not retain a database connection or
      // a PostgreSQL row lock while Ollama or its deterministic fallback runs.
      client.release();
      client = null;
    }

    const buffered = new BufferedResponse();
    await runtime.handler(request, buffered);
    const successful = buffered.statusCode >= 200 && buffered.statusCode < 400;

    if (mutation && successful) {
      await client.query(
        `INSERT INTO ai_process_state(id,version,snapshot,updated_at)
         VALUES('primary',$1,$2::jsonb,NOW())
         ON CONFLICT(id) DO UPDATE
         SET version=$1,snapshot=$2::jsonb,updated_at=NOW()`,
        [version + 1, JSON.stringify(runtime.exportSnapshot())],
      );
    }
    if (presenceWrite && successful)
      await writePresence(client, existingPresence, runtime.exportPresence());
    if (mutation && !successful) {
      await client.query("ROLLBACK");
      // The domain handler may have touched temporary SQLite before rejecting.
      // Rehydrate confirmed state for the next request.
      loadedVersion = null;
    } else if (mutation) {
      await client.query("COMMIT");
      loadedVersion = version + 1;
    }
    release(response, buffered);
  } catch (error) {
    if (mutation && client)
      await client.query("ROLLBACK").catch(() => undefined);
    loadedVersion = null;
    response.statusCode = 503;
    response.setHeader("content-type", "application/json; charset=utf-8");
    response.end(
      JSON.stringify({
        error: "service_unavailable",
        requestId: randomUUID(),
      }),
    );
  } finally {
    client?.release();
  }
}

export default async function vercelHandler(request, response) {
  return queued(() => run(request, response));
}
