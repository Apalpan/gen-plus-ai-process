import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";

const directory = mkdtempSync(join(tmpdir(), "ai-process-api-"));
const port = 8791;
const child = spawn(process.execPath, ["server/index.mjs"], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    AI_PROCESS_PORT: String(port),
    AI_PROCESS_DB_PATH: join(directory, "test.sqlite"),
  },
  stdio: ["ignore", "pipe", "pipe"],
});

await new Promise((resolve, reject) => {
  child.stdout.on(
    "data",
    (chunk) => chunk.toString().includes("listening") && resolve(),
  );
  child.on("error", reject);
  child.on("exit", (code) =>
    reject(new Error(`server stopped during boot (${code})`)),
  );
});

const base = `http://127.0.0.1:${port}`;
async function request(path, { method = "GET", cookie, body } = {}) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      ...(cookie ? { cookie } : {}),
      ...(body ? { "content-type": "application/json", origin: base } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const content = response.status === 204 ? null : await response.json();
  return {
    response,
    content,
    cookie: response.headers.get("set-cookie")?.split(";")[0],
  };
}

async function register(name, role) {
  const result = await request("/api/auth/register", {
    method: "POST",
    body: {
      email: `${role}@example.test`,
      password: randomBytes(20).toString("base64url"),
      displayName: name,
    },
  });
  assert.equal(result.response.status, 201);
  return { user: result.content.user, cookie: result.cookie };
}

try {
  const owner = await register("Andrea Owner", "owner");
  const editorOne = await register("Bruno Editor", "editor-one");
  const editorTwo = await register("Carla Editor", "editor-two");
  const reviewer = await register("Diego Reviewer", "reviewer");
  const reader = await register("Elena Reader", "reader");
  const outsider = await register("Fabian Outside", "outside");

  const profile = await request("/api/auth/profile", {
    method: "POST",
    cookie: owner.cookie,
    body: { displayName: "Andrea VDC" },
  });
  assert.equal(profile.response.status, 200);
  assert.equal(profile.content.user.displayName, "Andrea VDC");

  const workspaceResult = await request("/api/workspaces", {
    method: "POST",
    cookie: owner.cookie,
    body: { name: "Piloto de prefabricados" },
  });
  assert.equal(workspaceResult.response.status, 201);
  const workspaceId = workspaceResult.content.workspace.id;

  for (const [person, role] of [
    [editorOne, "editor"],
    [editorTwo, "editor"],
    [reviewer, "reviewer"],
    [reader, "reader"],
  ]) {
    const result = await request(`/api/workspaces/${workspaceId}/members`, {
      method: "POST",
      cookie: owner.cookie,
      body: { email: person.user.email, role },
    });
    assert.equal(result.response.status, 201);
  }
  const boardResult = await request("/api/boards", {
    method: "POST",
    cookie: owner.cookie,
    body: {
      workspaceId,
      title: "Diseño a montaje",
      entities: [
        {
          id: "co-arranque",
          kind: "objective",
          data: { level: "CO", title: "Inicio operativo" },
        },
        {
          id: "fc-preread",
          kind: "factor",
          data: { level: "FC", title: "Pre-read 24 h" },
        },
      ],
    },
  });
  assert.equal(boardResult.response.status, 201);
  const boardId = boardResult.content.board.id;
  const overviewUrl = `/api/workspaces/${workspaceId}/overview`;
  const overview = await request(overviewUrl, { cookie: reader.cookie });
  assert.equal(overview.response.status, 200);
  assert.equal(overview.content.boards[0].id, boardId);
  assert.equal(overview.content.boards[0].steps, 0);
  const privateOverview = await request(overviewUrl, { cookie: outsider.cookie });
  assert.equal(privateOverview.response.status, 403);

  const workspaces = await request("/api/workspaces", { cookie: owner.cookie });
  assert.equal(workspaces.content.workspaces[0].boards[0].id, boardId);
  assert.equal(workspaces.content.workspaces[0].role, "owner");

  const initial = await request(`/api/boards/${boardId}`, {
    cookie: editorOne.cookie,
  });
  assert.equal(initial.response.status, 200);
  assert.equal(initial.content.board.role, "editor");
  assert.equal(initial.content.board.entities.length, 2);

  const mutation = {
    kind: "objective",
    data: { level: "CO", title: "Inicio operativo con QA" },
    expectedRev: 1,
    idempotencyKey: "owner-update-1",
  };
  const edited = await request(`/api/boards/${boardId}/entities/co-arranque`, {
    method: "POST",
    cookie: editorOne.cookie,
    body: mutation,
  });
  assert.equal(edited.response.status, 200);
  assert.equal(edited.content.event.entity.rev, 2);
  const replay = await request(`/api/boards/${boardId}/entities/co-arranque`, {
    method: "POST",
    cookie: editorOne.cookie,
    body: mutation,
  });
  assert.equal(replay.response.status, 200);
  assert.equal(replay.content.idempotent, true);

  const conflict = await request(
    `/api/boards/${boardId}/entities/co-arranque`,
    {
      method: "POST",
      cookie: editorTwo.cookie,
      body: { ...mutation, idempotencyKey: "editor-two-stale" },
    },
  );
  assert.equal(conflict.response.status, 409);
  assert.equal(conflict.content.entity.rev, 2);

  const batch = await request(`/api/boards/${boardId}/batch`, {
    method: "POST",
    cookie: editorTwo.cookie,
    body: {
      idempotencyKey: "batch-ice-1",
      changes: [
        {
          id: "prod-ice",
          kind: "metric",
          data: { level: "ProdO", title: "Decisiones dentro de plazo" },
          expectedRev: 0,
        },
        {
          id: "fc-preread",
          kind: "factor",
          data: {
            level: "FC",
            title: "Pre-read entregado 24 h antes",
            executed: true,
          },
          expectedRev: 1,
        },
      ],
    },
  });
  assert.equal(batch.response.status, 200);
  assert.equal(batch.content.event.entities.length, 2);

  const proposedAction = await request(
    `/api/boards/${boardId}/entities/ice-01`,
    {
      method: "POST",
      cookie: editorOne.cookie,
      body: {
        kind: "ice-action",
        data: { status: "propuesto", title: "Validar pre-read" },
        expectedRev: 0,
        idempotencyKey: "ice-proposed",
      },
    },
  );
  assert.equal(proposedAction.response.status, 200);
  const editorApproval = await request(
    `/api/boards/${boardId}/entities/ice-01`,
    {
      method: "POST",
      cookie: editorOne.cookie,
      body: {
        kind: "ice-action",
        data: {
          status: "aceptado",
          owner: "Bruno",
          due: "2026-11-27",
          title: "Validar pre-read",
        },
        expectedRev: 1,
        idempotencyKey: "editor-approval",
      },
    },
  );
  assert.equal(editorApproval.response.status, 403);
  const reviewerApproval = await request(
    `/api/boards/${boardId}/entities/ice-01`,
    {
      method: "POST",
      cookie: reviewer.cookie,
      body: {
        kind: "ice-action",
        data: {
          status: "aceptado",
          owner: "Bruno",
          due: "2026-11-27",
          title: "Validar pre-read",
        },
        expectedRev: 1,
        idempotencyKey: "reviewer-approval",
      },
    },
  );
  assert.equal(reviewerApproval.response.status, 200);
  const editorExecution = await request(
    `/api/boards/${boardId}/entities/ice-01`,
    {
      method: "POST",
      cookie: editorOne.cookie,
      body: {
        kind: "ice-action",
        data: {
          status: "ejecutado",
          owner: "Bruno",
          due: "2026-11-27",
          title: "Validar pre-read",
          evidence: ["evidence-01"],
        },
        expectedRev: 2,
        idempotencyKey: "editor-execution",
      },
    },
  );
  assert.equal(editorExecution.response.status, 200);
  const reviewerVerification = await request(
    `/api/boards/${boardId}/entities/ice-01`,
    {
      method: "POST",
      cookie: reviewer.cookie,
      body: {
        kind: "ice-action",
        data: {
          status: "verificado",
          owner: "Bruno",
          due: "2026-11-27",
          title: "Validar pre-read",
          evidence: ["evidence-01"],
        },
        expectedRev: 3,
        idempotencyKey: "reviewer-verification",
      },
    },
  );
  assert.equal(reviewerVerification.response.status, 200);

  const viewerWrite = await request(
    `/api/boards/${boardId}/entities/read-only`,
    {
      method: "POST",
      cookie: reader.cookie,
      body: {
        kind: "note",
        data: {},
        expectedRev: 0,
        idempotencyKey: "reader-write",
      },
    },
  );
  assert.equal(viewerWrite.response.status, 403);
  const outsideRead = await request(`/api/boards/${boardId}`, {
    cookie: outsider.cookie,
  });
  assert.equal(outsideRead.response.status, 403);

  const presenceOne = await request(`/api/boards/${boardId}/presence`, {
    method: "POST",
    cookie: editorOne.cookie,
    body: { cursor: { x: 10, y: 20 }, selection: ["prod-ice"] },
  });
  assert.equal(presenceOne.response.status, 200);
  const presenceTwo = await request(`/api/boards/${boardId}/presence`, {
    method: "POST",
    cookie: editorTwo.cookie,
    body: { cursor: { x: 30, y: 40 }, selection: ["fc-preread"] },
  });
  assert.equal(presenceTwo.content.peers.length, 2);

  const published = await request(`/api/boards/${boardId}/publish`, {
    method: "POST",
    cookie: reviewer.cookie,
    body: {},
  });
  assert.equal(published.response.status, 201);
  const revision = await request(
    `/api/revisions/${published.content.revision.id}`,
    { cookie: reader.cookie },
  );
  assert.equal(revision.response.status, 200);
  assert.equal(revision.content.revision.snapshot.entities.length, 4);

  const revoke = await request(
    `/api/workspaces/${workspaceId}/members/${editorTwo.user.id}`,
    { method: "DELETE", cookie: owner.cookie },
  );
  assert.equal(revoke.response.status, 204);
  const revokedWrite = await request(
    `/api/boards/${boardId}/entities/after-revocation`,
    {
      method: "POST",
      cookie: editorTwo.cookie,
      body: {
        kind: "note",
        data: {},
        expectedRev: 0,
        idempotencyKey: "revoked-write",
      },
    },
  );
  assert.equal(revokedWrite.response.status, 403);

  const session = await request("/api/auth/session", { cookie: owner.cookie });
  assert.equal(session.content.user.email, owner.user.email);
  const logout = await request("/api/auth/logout", {
    method: "POST",
    cookie: owner.cookie,
    body: {},
  });
  assert.equal(logout.response.status, 204);
  const afterLogout = await request("/api/auth/session", {
    cookie: owner.cookie,
  });
  assert.equal(afterLogout.content.user, null);
  console.log(
    "API test passed: five collaborators, RBAC, isolation, conflict, idempotency, presence, publication and revocation.",
  );
} finally {
  const exited = new Promise((resolve) => child.once("exit", resolve));
  child.kill();
  await exited;
  rmSync(directory, { recursive: true, force: true });
}
