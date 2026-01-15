import { HttpError } from "./http_error.ts";
import { NewSchemaPayload } from "./types.ts";

const MAX_BODY_BYTES = 1_000_000; // ~1MB

export async function parseJsonBody(req: Request): Promise<unknown> {
  const body = req.body;
  if (!body) throw new HttpError(400, "Request body is required");
  const buffer = await req.arrayBuffer();
  if (buffer.byteLength > MAX_BODY_BYTES) throw new HttpError(413, "Payload too large");
  try {
    return JSON.parse(new TextDecoder().decode(buffer)) as unknown;
  } catch {
    throw new HttpError(400, "Invalid JSON body");
  }
}

interface ValidationOptions {
  allowClientId: boolean;
}

export function validateSchemaPayload(raw: unknown, opts: ValidationOptions): NewSchemaPayload {
  if (!isRecord(raw)) throw new HttpError(400, "Body must be an object");

  const name = raw.name;
  if (typeof name !== "string" || !name.trim()) {
    throw new HttpError(400, "name is required");
  }

  const description = raw.description;
  if (description !== undefined && typeof description !== "string") {
    throw new HttpError(400, "description must be a string if provided");
  }

  const namespace = raw.namespace;
  if (namespace !== undefined) {
    if (typeof namespace !== "string" || !namespace.trim()) {
      throw new HttpError(400, "namespace must be a non-empty string when provided");
    }
  }

  const tags = raw.tags;
  if (tags !== undefined) {
    if (!Array.isArray(tags)) throw new HttpError(400, "tags must be an array of strings when provided");
    for (const t of tags) {
      if (typeof t !== "string" || !t.trim()) {
        throw new HttpError(400, "tags must contain non-empty strings");
      }
    }
  }

  const schema = raw.schema;
  if (!isRecord(schema)) {
    throw new HttpError(400, "schema is required and must be an object");
  }

  const id = raw.id;
  if (id !== undefined) {
    if (!opts.allowClientId) {
      throw new HttpError(400, "id cannot be set in this operation");
    }
    if (typeof id !== "string" || !id.trim()) {
      throw new HttpError(400, "id must be a non-empty string when provided");
    }
  }

  return { id, name: name.trim(), description, namespace: namespace?.trim(), tags, schema };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
