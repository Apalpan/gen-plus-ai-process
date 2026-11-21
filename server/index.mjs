import {
  createHash,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { createServer } from "node:http";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { serveClient } from "./web.mjs";

const host = process.env.AI_PROCESS_HOST ?? "127.0.0.1";
const configuredOrigin =
  process.env.AI_PROCESS_TEAM_ORIGIN ??
  process.env.VERCEL_PROJECT_PRODUCTION_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);
const teamOrigin = configuredOrigin
  ? new URL(
      configuredOrigin.startsWith("http")
        ? configuredOrigin
        : `https://${configuredOrigin}`,
    )
  : null;
const cloudRuntime = Boolean(process.env.VERCEL);
const cloudOrigins = new Set(
  [
    teamOrigin?.origin,
    process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`,
    process.env.VERCEL_BRANCH_URL &&
      `https://${process.env.VERCEL_BRANCH_URL}`,
  ].filter(Boolean),
);
if (teamOrigin && teamOrigin.protocol !== "https:")
  throw Error("El origen compartido requiere HTTPS.");
if (
  !cloudRuntime &&
  !["127.0.0.1", "localhost", "::1"].includes(host) &&
  !teamOrigin
)
  throw Error(
    "Configura AI_PROCESS_TEAM_ORIGIN para escuchar fuera de loopback.",
  );
const port = Number(process.env.AI_PROCESS_PORT ?? 8787);
const databasePath = resolve(
  process.env.AI_PROCESS_DB_PATH ?? "server/data/ai-process.sqlite",
);
mkdirSync(dirname(databasePath), { recursive: true });

const db = new DatabaseSync(databasePath);
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, display_name TEXT NOT NULL,
    password_hash TEXT, is_guest INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY, token_hash TEXT NOT NULL UNIQUE, user_id TEXT NOT NULL,
    expires_at INTEGER NOT NULL, revoked_at TEXT, created_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS user_profiles (
    user_id TEXT PRIMARY KEY REFERENCES users(id), discipline TEXT NOT NULL, job_role TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS workspaces (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, created_by TEXT NOT NULL, created_at TEXT NOT NULL,
    FOREIGN KEY(created_by) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS memberships (
    workspace_id TEXT NOT NULL, user_id TEXT NOT NULL, role TEXT NOT NULL,
    revoked_at TEXT, created_at TEXT NOT NULL,
    PRIMARY KEY(workspace_id, user_id),
    FOREIGN KEY(workspace_id) REFERENCES workspaces(id), FOREIGN KEY(user_id) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS boards (
    id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL, title TEXT NOT NULL,
    board_rev INTEGER NOT NULL DEFAULT 0, created_by TEXT NOT NULL, created_at TEXT NOT NULL,
    FOREIGN KEY(workspace_id) REFERENCES workspaces(id), FOREIGN KEY(created_by) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS entities (
    board_id TEXT NOT NULL, id TEXT NOT NULL, kind TEXT NOT NULL, data_json TEXT NOT NULL,
    rev INTEGER NOT NULL, deleted_at TEXT, updated_by TEXT NOT NULL, updated_at TEXT NOT NULL,
    PRIMARY KEY(board_id, id), FOREIGN KEY(board_id) REFERENCES boards(id)
  );
  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT, board_id TEXT NOT NULL, board_rev INTEGER NOT NULL,
    entity_id TEXT, action TEXT NOT NULL, actor_id TEXT NOT NULL, payload_json TEXT NOT NULL,
    idempotency_key TEXT, created_at TEXT NOT NULL, UNIQUE(board_id, idempotency_key)
  );
  CREATE TABLE IF NOT EXISTS publications (
    id TEXT PRIMARY KEY, board_id TEXT NOT NULL, board_rev INTEGER NOT NULL,
    snapshot_json TEXT NOT NULL, published_by TEXT NOT NULL, created_at TEXT NOT NULL
  );
`);

const presence = new Map();
const now = () => new Date().toISOString();
const id = (prefix) => `${prefix}_${randomBytes(12).toString("base64url")}`;
const json = (value) => JSON.stringify(value);
const parse = (value) => JSON.parse(value);

function passwordHash(password) {
  const salt = randomBytes(16).toString("base64url");
  return `${salt}.${scryptSync(password, salt, 32).toString("base64url")}`;
}

function passwordMatches(password, stored) {
  if (!stored) return false;
  const [salt, expected] = stored.split(".");
  const actual = scryptSync(password, salt, 32).toString("base64url");
  return timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
}

const tokenHash = (token) =>
  createHash("sha256").update(token).digest("base64url");

function createSession(user) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = Date.now() + 1000 * 60 * 60 * 12;
  db.prepare("INSERT INTO sessions VALUES (?, ?, ?, ?, NULL, ?)").run(
    id("session"),
    tokenHash(token),
    user.id,
    expiresAt,
    now(),
  );
  return token;
}

function cookies(request) {
  return Object.fromEntries(
    (request.headers.cookie ?? "")
      .split(";")
      .filter(Boolean)
      .map((part) => {
        const [key, ...value] = part.trim().split("=");
        return [key, decodeURIComponent(value.join("="))];
      }),
  );
}

function userFromRequest(request) {
  const token = cookies(request).ai_process_session;
  if (!token) return null;
  return (
    db
      .prepare(
        `SELECT u.id, u.email, u.display_name, u.is_guest, s.id AS session_id
    FROM sessions s JOIN users u ON u.id=s.user_id
    WHERE s.token_hash=? AND s.revoked_at IS NULL AND s.expires_at > ?`,
      )
      .get(tokenHash(token), Date.now()) ?? null
  );
}

function requiresLoopbackOrigin(request) {
  const origin = request.headers.origin;
  if (!origin) return true;
  try {
    const url = new URL(origin);
    if (cloudRuntime) {
      return cloudOrigins.has(url.origin);
    }
    if (teamOrigin) return url.origin === teamOrigin.origin;
    return ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname);
  } catch {
    return false;
  }
}

function membership(workspaceId, userId) {
  return (
    db
      .prepare(
        "SELECT role FROM memberships WHERE workspace_id = ? AND user_id = ? AND revoked_at IS NULL",
      )
      .get(workspaceId, userId) ?? null
  );
}

function requireBoard(boardId, user, allowed) {
  const board = db.prepare("SELECT * FROM boards WHERE id = ?").get(boardId);
  if (!board) throw httpError(404, "board_not_found");
  const member = membership(board.workspace_id, user.id);
  if (!member || !allowed.includes(member.role))
    throw httpError(403, "forbidden");
  return { board, member };
}

const iceEntityKinds = new Set([
  "ice-action",
  "ice-decision",
  "ice-restriction",
]);
function authorizeEntityChange(role, existing, change, actor) {
  if (!["editor", "owner", "reviewer"].includes(role))
    throw httpError(403, "forbidden");
  if (existing && existing.kind !== change.kind)
    throw httpError(400, "El tipo de la entidad es inmutable.");
  if (change.kind === "comment") {
    if (!existing && !change.remove) {
      change.data.authorId = actor.id;
      change.data.author = actor.display_name;
      change.data.createdAt = now();
    } else if (role !== "owner" && existing?.data.authorId !== actor.id)
      throw httpError(403, "Este comentario pertenece a otra persona.");
    return;
  }
  if (!iceEntityKinds.has(change.kind)) {
    if (role === "reviewer")
      throw httpError(403, "El revisor solo puede validar asuntos ICE.");
    return;
  }
  const previous = existing?.data.status;
  const next = change.data?.status;
  if (change.remove)
    throw httpError(400, "Descarta el asunto para conservar su historial.");
  const permitted = {
    propuesto: ["propuesto", "aceptado", "descartado"],
    aceptado: ["aceptado", "ejecutado", "propuesto"],
    ejecutado: ["ejecutado", "verificado", "propuesto"],
    verificado: ["propuesto"],
    descartado: ["propuesto"],
  };
  if (!(previous ? permitted[previous]?.includes(next) : next === "propuesto"))
    throw httpError(400, "Transición ICE inválida.");
  if (
    role === "editor" &&
    (next === "descartado" ||
      next === "verificado" ||
      next === "aceptado" ||
      (next === "propuesto" && previous && previous !== "propuesto"))
  )
    throw httpError(403, "La transición requiere un revisor.");
  if (
    ["aceptado", "ejecutado", "verificado"].includes(next) &&
    (!String(change.data.owner || "").trim() ||
      !/^\d{4}-\d{2}-\d{2}$/.test(change.data.due || ""))
  )
    throw httpError(400, "Confirma responsable y fecha.");
  if (next === "verificado" && !String(change.data.evidence || "").trim())
    throw httpError(400, "El cierre requiere evidencia.");
}

function httpError(status, code, extra = {}) {
  return Object.assign(new Error(code), { status, code, ...extra });
}

function readBody(request) {
  if (request.body !== undefined) {
    const body = request.body;
    const bytes = Buffer.isBuffer(body) ? body : Buffer.from(typeof body === "string" ? body : JSON.stringify(body));
    if (bytes.length > 1_000_000) throw httpError(413, "payload_too_large");
    try { return Promise.resolve(bytes.length ? JSON.parse(bytes.toString("utf8")) : {}); }
    catch { throw httpError(400, "invalid_json"); }
  }
  return new Promise((resolveBody, reject) => {
    let raw = "";
    request.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) reject(httpError(413, "payload_too_large"));
    });
    request.on("end", () => {
      try {
        resolveBody(raw ? parse(raw) : {});
      } catch {
        reject(httpError(400, "invalid_json"));
      }
    });
    request.on("error", reject);
  });
}

function respond(response, status, body, headers = {}) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    ...headers,
  });
  response.end(json(body));
}

function publicUser(user) {
  const profile = db
    .prepare(
      "SELECT discipline,job_role AS jobRole FROM user_profiles WHERE user_id=?",
    )
    .get(user.id);
  return {
    id: user.id,
    email: user.email,
    displayName: user.display_name,
    guest: Boolean(user.is_guest),
    ...(profile || {}),
  };
}

function entityRow(row) {
  return {
    id: row.id,
    kind: row.kind,
    data: parse(row.data_json),
    rev: row.rev,
    deletedAt: row.deleted_at,
    updatedBy: row.updated_by,
    updatedAt: row.updated_at,
  };
}

function boardPayload(boardId) {
  const board = db.prepare("SELECT * FROM boards WHERE id = ?").get(boardId);
  const entities = db
    .prepare(
      "SELECT * FROM entities WHERE board_id = ? AND deleted_at IS NULL ORDER BY id",
    )
    .all(boardId)
    .map(entityRow);
  return {
    id: board.id,
    workspaceId: board.workspace_id,
    title: board.title,
    boardRev: board.board_rev,
    entities,
  };
}

function boardWithRole(boardId, userId) {
  const payload = boardPayload(boardId);
  const role = membership(payload.workspaceId, userId)?.role;
  return { ...payload, revision: payload.boardRev, role };
}

function cookieHeader(token) {
  return `ai_process_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=43200${teamOrigin || cloudRuntime ? "; Secure" : ""}`;
}

async function handler(request, response) {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`);
    if (
      cloudRuntime
        ? !cloudOrigins.has(`https://${request.headers.host}`)
        : teamOrigin
          ? url.host !== teamOrigin.host
          : !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
    )
      throw httpError(403, "host_forbidden");
    const path = url.pathname;
    const method = request.method;
    if (!path.startsWith("/api/")) {
      if (!serveClient(method, path, response))
        throw httpError(404, "not_found");
      return;
    }
    const currentUser = userFromRequest(request);
    if (
      ["POST", "PUT", "PATCH", "DELETE"].includes(method) &&
      !requiresLoopbackOrigin(request)
    )
      throw httpError(403, "origin_forbidden");

    if (method === "POST" && path === "/api/auth/register") {
      const { email, password, displayName } = await readBody(request);
      if (!email || !password || password.length < 10 || !displayName)
        throw httpError(400, "invalid_registration");
      const user = {
        id: id("usr"),
        email: String(email).trim().toLowerCase(),
        display_name: String(displayName).trim(),
        password_hash: passwordHash(password),
        created_at: now(),
      };
      try {
        db.prepare("INSERT INTO users VALUES (?, ?, ?, ?, 0, ?)").run(
          user.id,
          user.email,
          user.display_name,
          user.password_hash,
          user.created_at,
        );
      } catch {
        throw httpError(409, "email_in_use");
      }
      return respond(
        response,
        201,
        { user: publicUser(user) },
        { "set-cookie": cookieHeader(createSession(user)) },
      );
    }
    if (method === "POST" && path === "/api/auth/login") {
      const { email, password } = await readBody(request);
      const user = db
        .prepare("SELECT * FROM users WHERE email = ? AND is_guest = 0")
        .get(
          String(email ?? "")
            .trim()
            .toLowerCase(),
        );
      if (!user || !passwordMatches(String(password), user.password_hash))
        throw httpError(401, "invalid_credentials");
      return respond(
        response,
        200,
        { user: publicUser(user) },
        { "set-cookie": cookieHeader(createSession(user)) },
      );
    }
    if (method === "POST" && path === "/api/auth/guest") {
      const displayName = (await readBody(request)).displayName || "Invitado";
      const user = {
        id: id("guest"),
        email: `${id("guest")}@local.invalid`,
        display_name: String(displayName).slice(0, 80),
        is_guest: 1,
        created_at: now(),
      };
      db.prepare("INSERT INTO users VALUES (?, ?, ?, NULL, 1, ?)").run(
        user.id,
        user.email,
        user.display_name,
        user.created_at,
      );
      return respond(
        response,
        201,
        { user: publicUser(user) },
        { "set-cookie": cookieHeader(createSession(user)) },
      );
    }
    if (method === "GET" && path === "/api/auth/session") {
      return respond(response, 200, {
        user: currentUser ? publicUser(currentUser) : null,
      });
    }
    if (method === "POST" && path === "/api/auth/profile") {
      if (!currentUser) throw httpError(401, "unauthenticated");
      const { displayName, discipline, jobRole } = await readBody(request);
      if (!displayName || String(displayName).trim().length > 80)
        throw httpError(400, "invalid_profile");
      db.prepare("UPDATE users SET display_name=? WHERE id=?").run(
        String(displayName).trim(),
        currentUser.id,
      );
      if (discipline !== undefined || jobRole !== undefined) {
        const old = publicUser(currentUser);
        db.prepare(
          "INSERT INTO user_profiles VALUES(?,?,?) ON CONFLICT(user_id) DO UPDATE SET discipline=excluded.discipline,job_role=excluded.job_role",
        ).run(
          currentUser.id,
          String(discipline ?? old.discipline ?? "").slice(0, 100),
          String(jobRole ?? old.jobRole ?? "").slice(0, 100),
        );
      }
      return respond(response, 200, {
        user: publicUser({
          ...currentUser,
          display_name: String(displayName).trim(),
        }),
      });
    }
    if (method === "POST" && path === "/api/auth/logout") {
      if (currentUser?.session_id)
        db.prepare("UPDATE sessions SET revoked_at=? WHERE id=?").run(
          now(),
          currentUser.session_id,
        );
      return respond(response, 204, null, {
        "set-cookie":
          `ai_process_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${teamOrigin || cloudRuntime ? "; Secure" : ""}`,
      });
    }
    if (!currentUser) throw httpError(401, "unauthenticated");

    if (path === "/api/workspaces" && method === "GET") {
      const workspaces = db
        .prepare(
          `SELECT w.*, m.role FROM workspaces w JOIN memberships m ON m.workspace_id = w.id WHERE m.user_id = ? AND m.revoked_at IS NULL ORDER BY w.created_at DESC`,
        )
        .all(currentUser.id)
        .map((row) => ({
          id: row.id,
          name: row.name,
          role: row.role,
          boards: db
            .prepare(
              "SELECT id, title, board_rev AS revision, created_at AS createdAt FROM boards WHERE workspace_id=? ORDER BY created_at DESC",
            )
            .all(row.id)
            .map((board) => ({
              ...board,
              revisions: db
                .prepare(
                  "SELECT id, board_rev AS boardRev, created_at AS createdAt FROM publications WHERE board_id=? ORDER BY created_at DESC",
                )
                .all(board.id),
            })),
        }));
      return respond(response, 200, { workspaces });
    }
    if (path === "/api/workspaces" && method === "POST") {
      const { name } = await readBody(request);
      if (!name?.trim()) throw httpError(400, "invalid_workspace");
      const workspace = {
        id: id("ws"),
        name: String(name).trim(),
        created_by: currentUser.id,
        created_at: now(),
      };
      db.exec("BEGIN IMMEDIATE");
      try {
        db.prepare("INSERT INTO workspaces VALUES (?, ?, ?, ?)").run(
          workspace.id,
          workspace.name,
          workspace.created_by,
          workspace.created_at,
        );
        db.prepare("INSERT INTO memberships VALUES (?, ?, ?, NULL, ?)").run(
          workspace.id,
          currentUser.id,
          "owner",
          now(),
        );
        db.exec("COMMIT");
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
      return respond(response, 201, {
        workspace: { ...workspace, role: "owner" },
      });
    }
    const overviewMatch = path.match(/^\/api\/workspaces\/([^/]+)\/overview$/);
    if (overviewMatch && method === "GET") {
      const workspaceId = overviewMatch[1];
      if (!membership(workspaceId, currentUser.id)) throw httpError(403, "forbidden");
      const boards = db.prepare(`
        SELECT b.id, b.title, b.board_rev AS revision,
          COUNT(CASE WHEN e.kind='step' THEN 1 END) AS steps,
          COUNT(CASE WHEN e.kind='vdc-objective' THEN 1 END) AS objectives,
          COUNT(CASE WHEN e.kind IN ('ice-action','ice-restriction','ice-decision')
            AND COALESCE(json_extract(e.data_json,'$.status'),'') NOT IN ('verificado','descartado') THEN 1 END) AS openIce,
          COALESCE(MAX(e.updated_at), b.created_at) AS updatedAt
        FROM boards b LEFT JOIN entities e ON e.board_id=b.id AND e.deleted_at IS NULL
        WHERE b.workspace_id=? GROUP BY b.id ORDER BY updatedAt DESC, b.id
      `).all(workspaceId);
      return respond(response, 200, { boards });
    }
    const memberMatch = path.match(
      /^\/api\/workspaces\/([^/]+)\/members(?:\/([^/]+))?$/,
    );
    if (memberMatch) {
      const [, workspaceId, targetUserId] = memberMatch;
      const own = membership(workspaceId, currentUser.id);
      if (!own) throw httpError(403, "forbidden");
      if (method === "GET") {
        const members = db
          .prepare(
            `SELECT u.id,u.email,u.display_name,m.role,p.discipline,p.job_role AS jobRole FROM memberships m JOIN users u ON u.id=m.user_id LEFT JOIN user_profiles p ON p.user_id=u.id WHERE m.workspace_id=? AND m.revoked_at IS NULL`,
          )
          .all(workspaceId)
          .map((member) => ({
            id: member.id,
            ...(own.role === "owner" ? { email: member.email } : {}),
            displayName: member.display_name,
            role: member.role,
            discipline: member.discipline,
            jobRole: member.jobRole,
          }));
        return respond(response, 200, { members });
      }
      if (own.role !== "owner") throw httpError(403, "forbidden");
      if (method === "POST") {
        const { userId, email, role } = await readBody(request);
        const memberUser = userId
          ? db.prepare("SELECT id FROM users WHERE id=?").get(userId)
          : db.prepare("SELECT id FROM users WHERE email=?").get(
              String(email ?? "")
                .trim()
                .toLowerCase(),
            );
        if (
          !["owner", "editor", "reviewer", "reader"].includes(role) ||
          !memberUser
        )
          throw httpError(400, "invalid_member");
        if (memberUser.id === currentUser.id && role !== "owner")
          throw httpError(400, "Conserva el propietario del espacio.");
        db.prepare(
          `INSERT INTO memberships(workspace_id,user_id,role,revoked_at,created_at) VALUES(?,?,?,NULL,?) ON CONFLICT(workspace_id,user_id) DO UPDATE SET role=excluded.role, revoked_at=NULL`,
        ).run(workspaceId, memberUser.id, role, now());
        return respond(response, 201, { userId: memberUser.id, role });
      }
      if (method === "DELETE" && targetUserId) {
        if (targetUserId === currentUser.id)
          throw httpError(400, "cannot_revoke_self");
        db.prepare(
          "UPDATE memberships SET revoked_at=? WHERE workspace_id=? AND user_id=?",
        ).run(now(), workspaceId, targetUserId);
        return respond(response, 204, null);
      }
    }
    if (path === "/api/boards" && method === "POST") {
      const { workspaceId, title, entities = [] } = await readBody(request);
      const member = membership(workspaceId, currentUser.id);
      if (!member || !["owner", "editor"].includes(member.role))
        throw httpError(403, "forbidden");
      if (!title?.trim() || !Array.isArray(entities))
        throw httpError(400, "invalid_board");
      const board = {
        id: id("board"),
        workspace_id: workspaceId,
        title: String(title).trim(),
        created_by: currentUser.id,
        created_at: now(),
      };
      db.exec("BEGIN IMMEDIATE");
      try {
        db.prepare(
          "INSERT INTO boards(id,workspace_id,title,board_rev,created_by,created_at) VALUES(?,?,?,0,?,?)",
        ).run(
          board.id,
          board.workspace_id,
          board.title,
          board.created_by,
          board.created_at,
        );
        const insert = db.prepare(
          "INSERT INTO entities VALUES (?, ?, ?, ?, 1, NULL, ?, ?)",
        );
        for (const entity of entities) {
          if (!entity?.id || !entity?.kind || typeof entity.data !== "object")
            throw httpError(400, "invalid_entity");
          if (iceEntityKinds.has(entity.kind)) {
            entity.data = {
              ...entity.data,
              importedStatus: entity.data.status,
              status: "propuesto",
              verifiedBy: null,
            };
          }
          insert.run(
            board.id,
            String(entity.id),
            String(entity.kind),
            json(entity.data),
            currentUser.id,
            now(),
          );
        }
        db.exec("COMMIT");
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
      return respond(response, 201, { board: boardPayload(board.id) });
    }
    const boardMatch = path.match(
      /^\/api\/boards\/([^/]+)(?:\/entities\/([^/]+)|\/(?:events|publish|agents|batch))?$/,
    );
    if (boardMatch) {
      const [, boardId, entityId] = boardMatch;
      if (path.endsWith("/events") && method === "GET") {
        requireBoard(boardId, currentUser, [
          "owner",
          "editor",
          "reviewer",
          "reader",
        ]);
        const after = Number(url.searchParams.get("after") ?? 0);
        const events = db
          .prepare("SELECT * FROM events WHERE board_id=? AND id>? ORDER BY id")
          .all(boardId, after)
          .map((event) => ({
            id: event.id,
            boardRev: event.board_rev,
            entityId: event.entity_id,
            action: event.action,
            actorId: event.actor_id,
            payload: parse(event.payload_json),
            createdAt: event.created_at,
          }));
        return respond(response, 200, { events });
      }
      if (path.endsWith("/publish") && method === "POST") {
        requireBoard(boardId, currentUser, ["owner", "reviewer"]);
        const options = await readBody(request);
        const current = boardPayload(boardId);
        if (
          options.expectedRev !== undefined &&
          options.expectedRev !== current.boardRev
        )
          throw httpError(409, "La revisión cambió antes de publicar.");
        const revision = {
          id: id("revision"),
          boardId,
          boardRev: current.boardRev,
          publishedBy: currentUser.id,
          createdAt: now(),
        };
        db.prepare("INSERT INTO publications VALUES(?,?,?,?,?,?)").run(
          revision.id,
          boardId,
          revision.boardRev,
          json(current),
          revision.publishedBy,
          revision.createdAt,
        );
        db.prepare(
          "INSERT INTO events(board_id,board_rev,entity_id,action,actor_id,payload_json,created_at) VALUES(?,?,?,?,?,?,?)",
        ).run(
          boardId,
          current.boardRev,
          null,
          "published",
          currentUser.id,
          json({ revisionId: revision.id }),
          revision.createdAt,
        );
        return respond(response, 201, { revision });
      }
      if (path.endsWith("/agents") && method === "POST") {
        requireBoard(boardId, currentUser, ["owner", "editor"]);
        const requestBody = await readBody(request);
        try {
          const { runAnalysis } = await import("../intelligence/run.mjs");
          const board = boardWithRole(boardId, currentUser.id);
          const proposal = await runAnalysis({
            entities: board.entities,
            revision: board.revision,
            userId: currentUser.id,
            request: requestBody,
          });
          return respond(response, 200, { proposal, revision: board.revision });
        } catch (error) {
          if (error.code) throw error;
          throw httpError(503, "agent_unavailable");
        }
      }
      if (path.endsWith("/batch") && method === "POST") {
        const { changes, idempotencyKey } = await readBody(request);
        const access = requireBoard(boardId, currentUser, [
          "owner",
          "editor",
          "reviewer",
        ]);
        if (
          !Array.isArray(changes) ||
          !changes.length ||
          !idempotencyKey ||
          changes.length > 500
        )
          throw httpError(400, "invalid_batch");
        if (new Set(changes.map((c) => c?.id)).size !== changes.length)
          throw httpError(400, "IDs duplicados en el lote.");
        const repeated = db
          .prepare(
            "SELECT * FROM events WHERE board_id=? AND idempotency_key=?",
          )
          .get(boardId, idempotencyKey);
        if (repeated)
          return respond(response, 200, {
            idempotent: true,
            event: { id: repeated.id, payload: parse(repeated.payload_json) },
          });
        db.exec("BEGIN IMMEDIATE");
        try {
          const result = [];
          for (const change of changes) {
            if (
              !change?.id ||
              !change.kind ||
              typeof change.data !== "object" ||
              !Number.isInteger(change.expectedRev)
            )
              throw httpError(400, "invalid_batch_change");
            const row = db
              .prepare("SELECT * FROM entities WHERE board_id=? AND id=?")
              .get(boardId, change.id);
            const entity = row ? entityRow(row) : null;
            if ((entity?.rev ?? 0) !== change.expectedRev)
              throw httpError(409, "revision_conflict", {
                entity,
                conflictedId: change.id,
              });
            authorizeEntityChange(
              access.member.role,
              entity,
              change,
              currentUser,
            );
            if (
              change.kind === "agent-run" &&
              change.data.status === "aprobado"
            ) {
              if (entity?.data.status !== "propuesto")
                throw httpError(400, "La propuesta ya fue resuelta.");
              const outdated = (entity.data.sources || []).some((ref) => {
                const source = db
                  .prepare(
                    "SELECT rev,deleted_at FROM entities WHERE board_id=? AND id=?",
                  )
                  .get(boardId, ref.id);
                return !source || source.deleted_at || source.rev !== ref.rev;
              });
              if (outdated)
                throw httpError(
                  422,
                  "Las fuentes cambiaron. Genera una propuesta nueva.",
                );
            }
          }
          const at = now();
          for (const change of changes) {
            const row = db
              .prepare("SELECT * FROM entities WHERE board_id=? AND id=?")
              .get(boardId, change.id);
            const rev = change.expectedRev + 1;
            if (row)
              db.prepare(
                "UPDATE entities SET kind=?, data_json=?, rev=?, deleted_at=?, updated_by=?, updated_at=? WHERE board_id=? AND id=?",
              ).run(
                change.kind,
                json(change.data),
                rev,
                change.remove ? at : null,
                currentUser.id,
                at,
                boardId,
                change.id,
              );
            else
              db.prepare("INSERT INTO entities VALUES(?,?,?,?,?, ?,?,?)").run(
                boardId,
                change.id,
                change.kind,
                json(change.data),
                rev,
                change.remove ? at : null,
                currentUser.id,
                at,
              );
            result.push(
              entityRow(
                db
                  .prepare("SELECT * FROM entities WHERE board_id=? AND id=?")
                  .get(boardId, change.id),
              ),
            );
          }
          const board = db
            .prepare(
              "UPDATE boards SET board_rev=board_rev+1 WHERE id=? RETURNING board_rev",
            )
            .get(boardId);
          const payload = {
            entities: result,
            removed: changes
              .filter((change) => change.remove)
              .map((change) => change.id),
          };
          const event = db
            .prepare(
              "INSERT INTO events(board_id,board_rev,entity_id,action,actor_id,payload_json,idempotency_key,created_at) VALUES(?,?,?,?,?,?,?,?) RETURNING id",
            )
            .get(
              boardId,
              board.board_rev,
              null,
              "entities_batched",
              currentUser.id,
              json(payload),
              idempotencyKey,
              at,
            );
          db.exec("COMMIT");
          const resultEvent = {
            id: event.id,
            boardRev: board.board_rev,
            ...payload,
          };
          return respond(response, 200, { event: resultEvent });
        } catch (error) {
          db.exec("ROLLBACK");
          throw error;
        }
      }
      if (entityId && method === "POST") {
        const access = requireBoard(boardId, currentUser, [
          "owner",
          "editor",
          "reviewer",
        ]);
        const {
          kind,
          data,
          expectedRev,
          idempotencyKey,
          deleted = false,
        } = await readBody(request);
        if (
          !kind ||
          typeof data !== "object" ||
          !Number.isInteger(expectedRev) ||
          !idempotencyKey
        )
          throw httpError(400, "invalid_mutation");
        const existingEvent = db
          .prepare(
            "SELECT * FROM events WHERE board_id=? AND idempotency_key=?",
          )
          .get(boardId, idempotencyKey);
        if (existingEvent)
          return respond(response, 200, {
            idempotent: true,
            event: {
              id: existingEvent.id,
              payload: parse(existingEvent.payload_json),
            },
          });
        db.exec("BEGIN IMMEDIATE");
        try {
          const row = db
            .prepare("SELECT * FROM entities WHERE board_id=? AND id=?")
            .get(boardId, entityId);
          const entity = row ? entityRow(row) : null;
          if ((entity?.rev ?? 0) !== expectedRev)
            throw httpError(409, "revision_conflict", { entity });
          authorizeEntityChange(
            access.member.role,
            entity,
            {
              kind,
              data,
              remove: deleted,
            },
            currentUser,
          );
          const revision = expectedRev + 1;
          const at = now();
          if (row)
            db.prepare(
              "UPDATE entities SET kind=?, data_json=?, rev=?, deleted_at=?, updated_by=?, updated_at=? WHERE board_id=? AND id=?",
            ).run(
              kind,
              json(data),
              revision,
              deleted ? at : null,
              currentUser.id,
              at,
              boardId,
              entityId,
            );
          else
            db.prepare("INSERT INTO entities VALUES(?,?,?,?,?, ?,?,?)").run(
              boardId,
              entityId,
              kind,
              json(data),
              revision,
              deleted ? at : null,
              currentUser.id,
              at,
            );
          const board = db
            .prepare(
              "UPDATE boards SET board_rev=board_rev+1 WHERE id=? RETURNING board_rev",
            )
            .get(boardId);
          const updated = db
            .prepare("SELECT * FROM entities WHERE board_id=? AND id=?")
            .get(boardId, entityId);
          const payload = { entity: entityRow(updated), deleted };
          const event = db
            .prepare(
              "INSERT INTO events(board_id,board_rev,entity_id,action,actor_id,payload_json,idempotency_key,created_at) VALUES(?,?,?,?,?,?,?,?) RETURNING id",
            )
            .get(
              boardId,
              board.board_rev,
              entityId,
              "entity_mutated",
              currentUser.id,
              json(payload),
              idempotencyKey,
              at,
            );
          db.exec("COMMIT");
          const result = {
            id: event.id,
            boardRev: board.board_rev,
            ...payload,
          };
          return respond(response, 200, { event: result });
        } catch (error) {
          db.exec("ROLLBACK");
          throw error;
        }
      }
      if (!entityId && method === "GET") {
        requireBoard(boardId, currentUser, [
          "owner",
          "editor",
          "reviewer",
          "reader",
        ]);
        return respond(response, 200, {
          board: boardWithRole(boardId, currentUser.id),
        });
      }
    }
    const boardRevisionsMatch = path.match(
      /^\/api\/boards\/([^/]+)\/revisions$/,
    );
    if (boardRevisionsMatch && method === "GET") {
      const boardId = boardRevisionsMatch[1];
      requireBoard(boardId, currentUser, [
        "owner",
        "editor",
        "reviewer",
        "reader",
      ]);
      const revisions = db
        .prepare(
          "SELECT id, board_rev AS boardRev, published_by AS publishedBy, created_at AS createdAt FROM publications WHERE board_id=? ORDER BY created_at DESC",
        )
        .all(boardId);
      return respond(response, 200, { revisions });
    }
    const revisionMatch = path.match(/^\/api\/revisions\/([^/]+)$/);
    if (revisionMatch && method === "GET") {
      const revision = db
        .prepare(
          "SELECT p.*, b.workspace_id FROM publications p JOIN boards b ON b.id=p.board_id WHERE p.id=?",
        )
        .get(revisionMatch[1]);
      if (!revision) throw httpError(404, "revision_not_found");
      if (!membership(revision.workspace_id, currentUser.id))
        throw httpError(403, "forbidden");
      return respond(response, 200, {
        revision: {
          id: revision.id,
          boardId: revision.board_id,
          boardRev: revision.board_rev,
          snapshot: parse(revision.snapshot_json),
          publishedBy: revision.published_by,
          createdAt: revision.created_at,
        },
      });
    }
    const presenceMatch = path.match(/^\/api\/boards\/([^/]+)\/presence$/);
    if (presenceMatch) {
      const boardId = presenceMatch[1];
      const access = requireBoard(boardId, currentUser, [
        "owner",
        "editor",
        "reviewer",
        "reader",
      ]);
      const group = presence.get(boardId) ?? new Map();
      presence.set(boardId, group);
      for (const [userId, value] of group)
        if (value.expiresAt <= Date.now()) group.delete(userId);
      if (method === "POST") {
        const { cursor, selection, view } = await readBody(request);
        group.set(currentUser.id, {
          user: { id: currentUser.id, displayName: currentUser.display_name },
          cursor,
          selection,
          view,
          expiresAt: Date.now() + 30_000,
        });
        return respond(response, 200, {
          boardRev: access.board.board_rev,
          role: access.member.role,
          peers: [...group.values()].map(({ expiresAt, ...peer }) => peer),
        });
      }
      if (method === "GET")
        return respond(response, 200, {
          peers: [...group.values()].map(({ expiresAt, ...peer }) => peer),
        });
    }
    throw httpError(404, "not_found");
  } catch (error) {
    respond(response, error.status ?? 500, {
      error: error.code ?? "internal_error",
      entity: error.entity,
    });
  }
}

const snapshotTables = [
  "users",
  "sessions",
  "user_profiles",
  "workspaces",
  "memberships",
  "boards",
  "entities",
  "events",
  "publications",
];

/**
 * A transport-neutral snapshot for a durable store. The local development
 * server continues to use SQLite directly. Vercel hydrates this snapshot in
 * a temporary SQLite database for each serialized request, then commits the
 * next snapshot through PostgreSQL while holding a row lock.
 */
export function exportSnapshot() {
  return Object.fromEntries(
    snapshotTables.map((table) => [
      table,
      db.prepare(`SELECT * FROM ${table}`).all(),
    ]),
  );
}

export function importSnapshot(snapshot = {}) {
  db.exec("PRAGMA foreign_keys = OFF; BEGIN IMMEDIATE");
  try {
    for (const table of [...snapshotTables].reverse()) {
      db.prepare(`DELETE FROM ${table}`).run();
    }
    for (const table of snapshotTables) {
      const rows = Array.isArray(snapshot[table]) ? snapshot[table] : [];
      for (const row of rows) {
        const keys = Object.keys(row);
        if (!keys.length) continue;
        const marks = keys.map(() => "?").join(",");
        db.prepare(
          `INSERT INTO ${table}(${keys.join(",")}) VALUES(${marks})`,
        ).run(...keys.map((key) => row[key]));
      }
    }
    db.exec("COMMIT; PRAGMA foreign_keys = ON");
  } catch (error) {
    db.exec("ROLLBACK; PRAGMA foreign_keys = ON");
    throw error;
  }
}

export function exportPresence() {
  return [...presence.entries()].flatMap(([boardId, group]) =>
    [...group.entries()].map(([userId, value]) => ({
      boardId,
      userId,
      ...value,
    })),
  );
}

export function importPresence(records = []) {
  presence.clear();
  for (const record of records) {
    if (!record?.boardId || !record?.userId || !record?.expiresAt) continue;
    if (Number(record.expiresAt) <= Date.now()) continue;
    const group = presence.get(record.boardId) ?? new Map();
    group.set(record.userId, {
      user: record.user,
      cursor: record.cursor,
      selection: record.selection,
      view: record.view,
      expiresAt: Number(record.expiresAt),
    });
    presence.set(record.boardId, group);
  }
}

export { handler };

if (process.env.AI_PROCESS_EMBEDDED !== "1") {
  const server = createServer(handler);
  server.listen(port, host, () =>
    console.log(`AI Process server listening on http://${host}:${port}`),
  );
}
