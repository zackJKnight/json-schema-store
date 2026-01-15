# Deno JSON Schema API

Simple Deno HTTP API that stores and serves JSON schemas for a WYSIWYG UI builder using SQLite for persistence.

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
deno run --allow-net --allow-read --allow-write --allow-env mod.ts
```

or with watch mode via tasks:

```sh
deno task dev
```

Set `PORT` to override the default 8000. Set `DB_PATH` to control where the SQLite file lives (defaults to `./data/schemas.db`). Use `:memory:` for ephemeral runs.

## Testing

```sh
deno task test
```

## Notes

- SQLite is used for storage; by default it creates `data/schemas.db`.
- Payloads larger than ~1MB are rejected.
- Content-Type must be `application/json` for write endpoints.
