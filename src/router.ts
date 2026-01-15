import { DB } from "https://deno.land/x/sqlite@v3.9.1/mod.ts";
import * as jsonpatch from "npm:fast-json-patch@3.1.1";
import openapiSpec from "../openapi.json" with { type: "json" };
import { HttpError, handleError, jsonResponse } from "./http_error.ts";
import { SchemaService } from "./schema_service.ts";
import { ensureValidJsonSchema, validateDataAgainstSchema } from "./schema_validation.ts";
import { parseJsonBody, validateSchemaPayload } from "./validation.ts";

//

export function createApp(db: DB) {
  const service = new SchemaService(db);

  return async function handler(req: Request): Promise<Response> {
    try {
      const url = new URL(req.url);

      if (url.pathname === "/health" && req.method === "GET") {
        return jsonResponse({ ok: true, timestamp: new Date().toISOString() });
      }

      if (url.pathname === "/openapi.json" && req.method === "GET") {
        return jsonResponse(openapiSpec);
      }

      if (url.pathname === "/docs" && req.method === "GET") {
        return new Response(swaggerHtml, {
          status: 200,
          headers: {
            "content-type": "text/html; charset=utf-8",
          },
        });
      }

      if (url.pathname === "/namespaces" && req.method === "GET") {
        const namespaces = service.listNamespaces();
        return jsonResponse({ items: namespaces });
      }

      if (url.pathname === "/schemas/suggest" && req.method === "GET") {
        const q = url.searchParams.get("q")?.trim();
        if (!q) throw new HttpError(400, "q is required");
        const limit = parseLimit(url.searchParams.get("limit"), 10);
        const suggestions = service.searchSuggest(q, limit);
        return jsonResponse({ items: suggestions });
      }

      if (url.pathname === "/schemas" && req.method === "GET") {
        const limit = parseLimit(url.searchParams.get("limit"));
        const cursor = parseCursor(url.searchParams.get("cursor"));
        const q = url.searchParams.get("q")?.trim();
        const namespace = url.searchParams.get("namespace")?.trim();
        const tag = url.searchParams.get("tag")?.trim();
        const sort = parseSort(url.searchParams.get("sort"));
        const result = await service.list(limit, cursor, { q: q || undefined, namespace: namespace || undefined, tag: tag || undefined, sort });
        return jsonResponse(result);
      }

      if (url.pathname === "/schemas" && req.method === "POST") {
        enforceJson(req);
        const body = await parseJsonBody(req);
        const payload = validateSchemaPayload(body, { allowClientId: true });
        await ensureValidJsonSchema(payload.schema);
        const id = payload.id ?? crypto.randomUUID();
        const existing = await service.get(id);
        if (existing) {
          throw new HttpError(409, "Schema already exists", { id });
        }
        const created = await service.upsert({ ...payload, id });
        return jsonResponse(created, 201);
      }

      const parts = url.pathname.split("/").filter(Boolean);
      if (parts[0] === "schemas" && parts[1]) {
        const id = decodeURIComponent(parts[1]);

        if (req.method === "GET" && parts[2] === "fragment") {
          const schema = await service.get(id);
          if (!schema) throw new HttpError(404, "Schema not found", { id });
          const pointer = url.searchParams.get("pointer");
          if (!pointer) throw new HttpError(400, "pointer query param is required");
          const value = getByPointer(schema.schema, pointer);
          if (value === undefined) throw new HttpError(404, "Pointer not found", { pointer });
          return jsonResponse({ pointer, value });
        }

        if (req.method === "GET") {
          const found = await service.get(id);
          if (!found) throw new HttpError(404, "Schema not found", { id });
          return jsonResponse(found, 200, { etag: found.updatedAt });
        }

        if (req.method === "PUT") {
          enforceJson(req);
          const body = await parseJsonBody(req);
          const payload = validateSchemaPayload(body, { allowClientId: false });
          await ensureValidJsonSchema(payload.schema);
          const existing = await service.get(id);
          const saved = await service.upsert({ ...payload, id });
          return jsonResponse(saved, existing ? 200 : 201);
        }

        if (req.method === "PATCH") {
          const existing = await service.get(id);
          if (!existing) throw new HttpError(404, "Schema not found", { id });
          enforcePatchContentType(req);
          const body = await parseJsonBody(req);

          const ifMatch = req.headers.get("if-match");
          if (ifMatch && ifMatch !== existing.updatedAt) {
            throw new HttpError(412, "Precondition failed", { expected: existing.updatedAt });
          }

          let nextSchema: Record<string, unknown>;
          let nextRecord: Record<string, unknown>;
          if (isMergePatch(req)) {
            nextRecord = applyMergePatch(existing, body as Record<string, unknown>);
            nextRecord.id = existing.id;
            nextSchema = (nextRecord.schema ?? existing.schema) as Record<string, unknown>;
          } else {
            if (!Array.isArray(body)) {
              throw new HttpError(400, "JSON Patch body must be an array");
            }
            const applyPatchFn = (jsonpatch as { applyPatch?: unknown; default?: { applyPatch?: unknown } })
              .applyPatch ?? jsonpatch.default?.applyPatch;
            if (typeof applyPatchFn !== "function") {
              throw new HttpError(500, "Patch handler unavailable");
            }
            const result = (applyPatchFn as (
              doc: unknown,
              patch: unknown,
              validate?: boolean,
              mutate?: boolean,
            ) => { newDocument: unknown })(structuredClone(existing), body, true, false);
            nextRecord = result.newDocument as Record<string, unknown>;
            nextRecord.id = existing.id;
            nextSchema = (nextRecord.schema ?? existing.schema) as Record<string, unknown>;
          }

          if (typeof nextSchema !== "object" || nextSchema === null || Array.isArray(nextSchema)) {
            throw new HttpError(400, "schema must remain an object after patch");
          }

          await ensureValidJsonSchema(nextSchema);
          const saved = await service.upsert({
            id: existing.id,
            name: (nextRecord?.name as string) ?? existing.name,
            description: (nextRecord?.description as string | undefined) ?? existing.description,
            namespace: resolveNamespace(nextRecord, existing.namespace),
            tags: resolveTags(nextRecord, existing.tags),
            schema: nextSchema,
          });
          return jsonResponse(saved, 200, { etag: saved.updatedAt });
        }

        if (req.method === "DELETE") {
          const removed = await service.remove(id);
          if (!removed) throw new HttpError(404, "Schema not found", { id });
          return jsonResponse({ deleted: true });
        }

        if (req.method === "POST" && parts[2] === "validate") {
          enforceJson(req);
          const body = await parseJsonBody(req);
          const schema = await service.get(id);
          if (!schema) throw new HttpError(404, "Schema not found", { id });
          const result = await validateDataAgainstSchema(schema.schema, body);
          return jsonResponse(result, result.valid ? 200 : 422);
        }
      }

      throw new HttpError(404, "Route not found");
    } catch (err) {
      return handleError(err);
    }
  };
}

function parseLimit(raw: string | null, defaultValue = 20): number {
  if (!raw) return defaultValue;
  const num = Number(raw);
  if (!Number.isInteger(num) || num < 1) throw new HttpError(400, "limit must be a positive integer");
  return Math.min(num, 100);
}

function parseSort(raw: string | null): "updatedAt" | "name" | undefined {
  if (!raw) return undefined;
  if (raw === "updatedAt" || raw === "name") return raw;
  throw new HttpError(400, "sort must be 'updatedAt' or 'name'");
}

function parseCursor(raw: string | null): number {
  if (!raw) return 0;
  const num = Number(raw);
  if (!Number.isInteger(num) || num < 0) throw new HttpError(400, "cursor must be a non-negative integer");
  return num;
}

function enforceJson(req: Request) {
  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    throw new HttpError(415, "Content-Type must be application/json");
  }
}

function enforcePatchContentType(req: Request) {
  const contentType = req.headers.get("content-type") ?? "";
  if (isMergePatch(req) || contentType.includes("json-patch+json")) return;
  throw new HttpError(415, "PATCH requires application/merge-patch+json or application/json-patch+json");
}

function isMergePatch(req: Request): boolean {
  const contentType = req.headers.get("content-type") ?? "";
  return contentType.includes("merge-patch+json");
}

function applyMergePatch(target: unknown, patch: Record<string, unknown>): Record<string, unknown> {
  if (patch === null || typeof patch !== "object" || Array.isArray(patch)) {
    return patch as Record<string, unknown>;
  }
  const base = (target && typeof target === "object" && !Array.isArray(target))
    ? structuredClone(target as Record<string, unknown>)
    : {} as Record<string, unknown>;

  for (const [key, value] of Object.entries(patch)) {
    if (value === null) {
      delete base[key];
      continue;
    }
    if (typeof value === "object" && !Array.isArray(value)) {
      base[key] = applyMergePatch(base[key], value as Record<string, unknown>);
    } else {
      base[key] = value;
    }
  }
  return base;
}

function resolveNamespace(candidate: Record<string, unknown>, existing?: string): string | undefined {
  const hasNamespace = Object.prototype.hasOwnProperty.call(candidate, "namespace");
  if (!hasNamespace) return existing;
  const value = candidate.namespace;
  if (value === null || value === undefined) return undefined;
  if (typeof value !== "string" || !value.trim()) {
    throw new HttpError(400, "namespace must be a non-empty string when provided");
  }
  return value.trim();
}

function resolveTags(candidate: Record<string, unknown>, existing?: string[]): string[] | undefined {
  const hasTags = Object.prototype.hasOwnProperty.call(candidate, "tags");
  if (!hasTags) return existing;
  const value = candidate.tags;
  if (value === null || value === undefined) return undefined;
  if (!Array.isArray(value)) throw new HttpError(400, "tags must be an array of strings when provided");
  const cleaned = value.map((item) => {
    if (typeof item !== "string" || !item.trim()) {
      throw new HttpError(400, "tags must contain non-empty strings");
    }
    return item.trim();
  });
  return cleaned;
}

function getByPointer(obj: unknown, pointer: string): unknown {
  if (pointer === "") return obj;
  if (!pointer.startsWith("/")) throw new HttpError(400, "pointer must start with '/'");
  const segments = pointer
    .slice(1)
    .split("/")
    .map((s) => s.replace(/~1/g, "/").replace(/~0/g, "~"));
  let current: unknown = obj;
  for (const seg of segments) {
    if (current === null || typeof current !== "object" || Array.isArray(current)) return undefined;
    const rec = current as Record<string, unknown>;
    if (!(seg in rec)) return undefined;
    current = rec[seg];
  }
  return current;
}

const swaggerHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>JSON Schema API Docs</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.onload = () => {
      SwaggerUIBundle({
        url: '/openapi.json',
        dom_id: '#swagger-ui',
        presets: [SwaggerUIBundle.presets.apis],
      });
    };
  </script>
</body>
</html>`;
