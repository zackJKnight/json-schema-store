# Deno JSON Schema API

[![Live API](https://img.shields.io/badge/API-deno--api--zk.deno.dev-1e90ff)](https://deno-api-zk.deno.dev)
[![Live Web App](https://img.shields.io/badge/Web%20App-deno--api--web--zk.deno.dev-32cd32)](https://deno-api-web-zk.deno.dev)

Simple Deno HTTP API that stores and serves JSON schemas for a WYSIWYG UI builder using Deno KV for persistence (Deploy-friendly).

## Endpoints

- GET /health — health probe
- GET /openapi.json — OpenAPI spec
- GET /docs — Swagger UI backed by /openapi.json
- GET /schemas?limit=20&cursor=...&q=...&namespace=...&tag=...&sort=name|updatedAt — list schemas with optional filters
- GET /schemas/:id — fetch one
- POST /schemas — create (body: { id?, name, description?, namespace?, tags?, schema })
- PUT /schemas/:id — create or update
- PATCH /schemas/:id — merge-patch or json-patch schema (supports If-Match with ETag)
- DELETE /schemas/:id — remove
- POST /schemas/:id/validate — validate arbitrary JSON against a stored schema
- GET /schemas/:id/fragment?pointer=/... — return a JSON Pointer fragment of the stored schema (pointer is relative to the schema root, e.g., /properties/title)
- GET /schemas/suggest?q=... — lightweight search suggestions (limit optional)
- GET /namespaces — list distinct namespaces present in stored schemas

Responses are JSON. Errors return `{ "error": string, "details": object | null }`.

## Running

```sh
deno run --unstable-kv --allow-net --allow-read --allow-write --allow-env mod.ts
```

or with watch mode via tasks (includes KV seeding in dev):

```sh
deno task dev
```

Sample schemas seed automatically when running the dev task (`SEED_SAMPLES=1`). To disable, set `SEED_SAMPLES=0`. You can also seed on a one-off run with:

```sh
SEED_SAMPLES=1 deno task start
```

## Live Demo

- API: https://deno-api-zk.deno.dev (Swagger UI at `/docs`)
- Web app: https://deno-api-web-zk.deno.dev (reads from the API above by default)

## TypeScript client + sample app

- Generated client lives at `clients/ts-client` (fetch-based). Regenerate with:

```sh
cd clients/ts-client && npm run build
```

- Sample web app that consumes the client: `clients/examples/web-app`

```sh
cd clients/examples/web-app
npm install
npm run dev  # runs Vite; set API base in the UI (defaults to https://deno-api-zk.deno.dev)
```

Set `PORT` to override the default 8000. Set `KV_PATH` to point to a local KV store path (defaults to Deno KV’s default). Deno Deploy works out of the box with Deno KV.

## Deploying to Deno Deploy

1) Install the CLI: `deno install -A -r https://dash.deno.com/install/deployctl`
2) Authenticate: `deployctl login` (opens browser). Verify with `deployctl projects list`.
3) Deploy: `deployctl deploy --project <your-project> mod.ts` (uses `deno.json` for flags).
4) Visit the provided URL and check `/docs` for the Swagger UI.

Notes: Deno Deploy provides managed KV by default; no `KV_PATH` needed. Set `SEED_SAMPLES=1` in project env vars to auto-load sample schemas.

## Testing

```sh
deno task test
```

## Notes

- Storage is Deno KV (durable on Deploy; local path configurable via `KV_PATH`).
- Payloads larger than ~1MB are rejected.
- Content-Type must be `application/json` for write endpoints.
