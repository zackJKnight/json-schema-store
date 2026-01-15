import { DB } from "https://deno.land/x/sqlite@v3.9.1/mod.ts";
import { SchemaInput, SchemaRecord } from "./types.ts";

export class SchemaService {
  #db: DB;

  constructor(db: DB) {
    this.#db = db;
    this.#db.execute(`
      CREATE TABLE IF NOT EXISTS schemas (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        namespace TEXT,
        tags_json TEXT,
        schema_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
    this.#ensureColumns();
  }

  async list(
    limit: number,
    offset: number,
    filters: { q?: string; namespace?: string; tag?: string; sort?: "updatedAt" | "name" } = {},
  ): Promise<{ items: SchemaRecord[]; cursor: string | null }> {
    const clauses: string[] = [];
    const params: unknown[] = [];

    if (filters.q) {
      const like = `%${filters.q.toLowerCase()}%`;
      clauses.push("(lower(name) LIKE ? OR lower(description) LIKE ?)");
      params.push(like, like);
    }

    if (filters.namespace) {
      clauses.push("namespace = ?");
      params.push(filters.namespace);
    }

    if (filters.tag) {
      clauses.push("tags_json LIKE ?");
      params.push(`%\"${filters.tag}\"%`);
    }

    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    const order = filters.sort === "name" ? "ORDER BY name COLLATE NOCASE ASC" : "ORDER BY updated_at DESC";

    const rows = this.#db.queryEntries<{
      id: string;
      name: string;
      description: string | null;
      namespace: string | null;
      tags_json: string | null;
      schema_json: string;
      created_at: string;
      updated_at: string;
    }>(
      `SELECT id, name, description, namespace, tags_json, schema_json, created_at, updated_at
       FROM schemas
       ${where}
       ${order}
       LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );

    const items: SchemaRecord[] = rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description ?? undefined,
      namespace: row.namespace ?? undefined,
      tags: row.tags_json ? (JSON.parse(row.tags_json) as string[]) : undefined,
      schema: JSON.parse(row.schema_json) as Record<string, unknown>,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    const nextCursor = rows.length === limit ? String(offset + limit) : null;
    return { items, cursor: nextCursor };
  }

  async get(id: string): Promise<SchemaRecord | null> {
    const rows = this.#db.queryEntries<{
      id: string;
      name: string;
      description: string | null;
      namespace: string | null;
      tags_json: string | null;
      schema_json: string;
      created_at: string;
      updated_at: string;
    }>(
      `SELECT id, name, description, namespace, tags_json, schema_json, created_at, updated_at FROM schemas WHERE id = ?`,
      [id],
    );

    const row = rows.at(0);
    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      description: row.description ?? undefined,
      namespace: row.namespace ?? undefined,
      tags: row.tags_json ? (JSON.parse(row.tags_json) as string[]) : undefined,
      schema: JSON.parse(row.schema_json) as Record<string, unknown>,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async upsert(input: SchemaInput): Promise<SchemaRecord> {
    const now = new Date().toISOString();
    const existing = await this.get(input.id);
    const tagsJson = input.tags ? JSON.stringify(input.tags) : null;

    if (existing) {
      this.#db.query(
        `UPDATE schemas SET name = ?, description = ?, namespace = ?, tags_json = ?, schema_json = ?, updated_at = ? WHERE id = ?`,
        [
          input.name,
          input.description ?? null,
          input.namespace ?? null,
          tagsJson,
          JSON.stringify(input.schema),
          now,
          input.id,
        ],
      );
      return { ...existing, ...input, updatedAt: now };
    }

    const createdAt = now;
    this.#db.query(
      `INSERT INTO schemas (id, name, description, namespace, tags_json, schema_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.id,
        input.name,
        input.description ?? null,
        input.namespace ?? null,
        tagsJson,
        JSON.stringify(input.schema),
        createdAt,
        now,
      ],
    );

    return { ...input, createdAt, updatedAt: now };
  }

  async remove(id: string): Promise<boolean> {
    this.#db.query(`DELETE FROM schemas WHERE id = ?`, [id]);
    return this.#db.changes > 0;
  }

  listNamespaces(): string[] {
    const rows = this.#db.queryEntries<{ namespace: string }>(
      `SELECT DISTINCT namespace FROM schemas WHERE namespace IS NOT NULL AND namespace != '' ORDER BY namespace COLLATE NOCASE ASC`,
    );
    return rows.map((row) => row.namespace);
  }

  searchSuggest(q: string, limit: number): Array<Pick<SchemaRecord, "id" | "name" | "namespace" | "description" | "updatedAt">> {
    const like = `%${q.toLowerCase()}%`;
    const rows = this.#db.queryEntries<{
      id: string;
      name: string;
      description: string | null;
      namespace: string | null;
      updated_at: string;
    }>(
      `SELECT id, name, description, namespace, updated_at
       FROM schemas
       WHERE lower(name) LIKE ? OR lower(description) LIKE ?
       ORDER BY updated_at DESC
       LIMIT ?`,
      [like, like, limit],
    );

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description ?? undefined,
      namespace: row.namespace ?? undefined,
      updatedAt: row.updated_at,
    }));
  }

  #ensureColumns() {
    const rows = this.#db.queryEntries<{ name: string }>(`PRAGMA table_info(schemas)`);
    const names = new Set(rows.map((row) => row.name));

    if (!names.has("namespace")) {
      this.#db.execute("ALTER TABLE schemas ADD COLUMN namespace TEXT");
    }

    if (!names.has("tags_json")) {
      this.#db.execute("ALTER TABLE schemas ADD COLUMN tags_json TEXT");
    }
  }
}
