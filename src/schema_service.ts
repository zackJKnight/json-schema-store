import { SchemaInput, SchemaRecord } from "./types.ts";

type StoredSchema = SchemaRecord;

export class SchemaService {
  #kv: Deno.Kv;

  constructor(kv: Deno.Kv) {
    this.#kv = kv;
  }

  async list(
    limit: number,
    offset: number,
    filters: { q?: string; namespace?: string; tag?: string; sort?: "updatedAt" | "name" } = {},
  ): Promise<{ items: SchemaRecord[]; cursor: string | null }> {
    const all: SchemaRecord[] = [];
    for await (const entry of this.#kv.list<StoredSchema>({ prefix: ["schema"] })) {
      all.push(entry.value);
    }

    const filtered = all.filter((item) => this.#matchesFilters(item, filters));
    const sorted = filters.sort === "name"
      ? filtered.sort((a, b) => a.name.localeCompare(b.name))
      : filtered.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

    const slice = sorted.slice(offset, offset + limit);
    const nextCursor = sorted.length > offset + limit ? String(offset + limit) : null;
    return { items: slice, cursor: nextCursor };
  }

  async get(id: string): Promise<SchemaRecord | null> {
    const res = await this.#kv.get<StoredSchema>(["schema", id]);
    return res.value ?? null;
  }

  async upsert(input: SchemaInput): Promise<SchemaRecord> {
    const now = new Date().toISOString();
    const existing = await this.get(input.id);
    const record: SchemaRecord = {
      ...input,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    await this.#kv.set(["schema", input.id], record);
    return record;
  }

  async remove(id: string): Promise<boolean> {
    const existing = await this.#kv.get<StoredSchema>(["schema", id]);
    if (!existing.value) return false;
    await this.#kv.delete(["schema", id]);
    return true;
  }

  async listNamespaces(): Promise<string[]> {
    const namespaces = new Set<string>();
    for await (const entry of this.#kv.list<StoredSchema>({ prefix: ["schema"] })) {
      if (entry.value.namespace) namespaces.add(entry.value.namespace);
    }
    return Array.from(namespaces).sort((a, b) => a.localeCompare(b));
  }

  async searchSuggest(
    q: string,
    limit: number,
  ): Promise<Array<Pick<SchemaRecord, "id" | "name" | "namespace" | "description" | "updatedAt">>> {
    const term = q.toLowerCase();
    const hits: Array<Pick<SchemaRecord, "id" | "name" | "namespace" | "description" | "updatedAt">> = [];
    for await (const entry of this.#kv.list<StoredSchema>({ prefix: ["schema"] })) {
      const v = entry.value;
      if (v.name.toLowerCase().includes(term) || (v.description ?? "").toLowerCase().includes(term)) {
        hits.push({ id: v.id, name: v.name, description: v.description, namespace: v.namespace, updatedAt: v.updatedAt });
      }
    }
    return hits
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, limit);
  }

  #matchesFilters(record: SchemaRecord, filters: { q?: string; namespace?: string; tag?: string }): boolean {
    if (filters.namespace && record.namespace !== filters.namespace) return false;
    if (filters.tag && !(record.tags ?? []).includes(filters.tag)) return false;
    if (filters.q) {
      const term = filters.q.toLowerCase();
      if (!record.name.toLowerCase().includes(term) && !(record.description ?? "").toLowerCase().includes(term)) return false;
    }
    return true;
  }
}
