# AI Process local collaboration server

The server provides a durable loopback implementation for the v2 product
workflow. It uses Node 24 `node:sqlite`, an opaque HttpOnly session cookie with a server-side token hash,
role checks, entity revisions, append-only events, immutable publications and
an authenticated polling presence channel.

## Run

```powershell
node server/index.mjs
```

The default address is `http://127.0.0.1:8787`. Use `AI_PROCESS_DB_PATH` to
choose a local SQLite file. The default database is `server/data/ai-process.sqlite`.

## Vercel

The public function is `api/entry.mjs`. It uses `server/vercel.mjs` to
persist the same domain engine in Neon PostgreSQL. Set `DATABASE_URL` in all
Vercel environments that serve the application. The adapter stores the
transactional application state in `ai_process_state` and active board
presence in `ai_process_presence`, where records expire after 30 seconds.

Use `AI_PROCESS_TEAM_ORIGIN` for a custom production domain. Otherwise the
function accepts only the deployment origins supplied by Vercel. The Vercel
runtime uses a temporary SQLite file for a request's domain work. It never
uses this local file as durable storage.

## API

- `POST /api/auth/register`, `/api/auth/login`, `/api/auth/guest`
- `GET /api/auth/session`, `POST /api/auth/logout`
- `GET|POST /api/workspaces`
- `GET|POST|DELETE /api/workspaces/:id/members`
- `GET /api/boards/:id`, `POST /api/boards`
- `POST /api/boards/:id/entities/:entityId`
- `POST /api/boards/:id/batch`
- `GET /api/boards/:id/events?after=<event id>`
- `POST /api/boards/:id/publish`
- `POST /api/boards/:id/agents`
- `GET|POST /api/boards/:id/presence`
- `GET /api/revisions/:revisionId`

Mutations require `expectedRev` and an `idempotencyKey`. A stale entity returns
HTTP 409 with the confirmed entity so the client can present a merge choice.
Presence uses the authenticated session cookie. It expires after 30 seconds of
inactivity and contains only cursor and selection state.

## Test

```powershell
node server/tests/api.test.mjs
```

The test starts an isolated temporary database and verifies five identities,
RBAC, workspace isolation, idempotency, revision conflicts, publication,
revocation and polling presence.
