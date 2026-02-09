import { UiSchemaInput, UiSchemaRecord } from "./types.ts";

const PREFIX = ["ui-schema"] as const;

export class UiSchemaService {
  #kv: Deno.Kv;

  constructor(kv: Deno.Kv) {
    this.#kv = kv;
  }

  async list(
    limit: number,
    offset: number,
    filters: { schemaId?: string; fragment?: string; namespace?: string; tag?: string; q?: string; sort?: "updatedAt" | "name" } = {},
  ): Promise<{ items: UiSchemaRecord[]; cursor: string | null }> {
    const all: UiSchemaRecord[] = [];
    for await (const entry of this.#kv.list<UiSchemaRecord>({ prefix: PREFIX })) {
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

  async get(id: string): Promise<UiSchemaRecord | null> {
    const res = await this.#kv.get<UiSchemaRecord>([...PREFIX, id]);
    return res.value ?? null;
  }

  async upsert(input: UiSchemaInput): Promise<UiSchemaRecord> {
    const now = new Date().toISOString();
    const existing = await this.get(input.id);
    const initialPrimary = input.primary ?? existing?.primary ?? false;
    const record: UiSchemaRecord = {
      ...input,
      primary: initialPrimary,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    if (record.primary) {
      await this.#clearPrimaryForSchema(record.schemaId, record.id);
    } else if (!existing) {
      // If no primary exists for this schema yet, make the first one primary.
      const hasPrimary = await this.#hasPrimary(record.schemaId);
      if (!hasPrimary) {
        record.primary = true;
        await this.#clearPrimaryForSchema(record.schemaId, record.id);
      }
    }

    await this.#kv.set(["ui-schema", input.id], record);
    return record;
  }

  async remove(id: string): Promise<boolean> {
    const existing = await this.get(id);
    if (!existing) return false;
    await this.#kv.delete(["ui-schema", id]);
    return true;
  }

  #matchesFilters(record: UiSchemaRecord, filters: { schemaId?: string; fragment?: string; namespace?: string; tag?: string; q?: string }): boolean {
    if (filters.schemaId && record.schemaId !== filters.schemaId) return false;
    if (filters.fragment && record.fragment !== filters.fragment) return false;
    if (filters.namespace && record.namespace !== filters.namespace) return false;
    if (filters.tag && !(record.tags ?? []).includes(filters.tag)) return false;
    if (filters.q) {
      const term = filters.q.toLowerCase();
      if (!record.name.toLowerCase().includes(term) && !(record.description ?? "").toLowerCase().includes(term)) return false;
    }
    return true;
  }

  async #clearPrimaryForSchema(schemaId: string, keepId: string): Promise<void> {
    for await (const entry of this.#kv.list<UiSchemaRecord>({ prefix: PREFIX })) {
      const ui = entry.value;
      if (ui.schemaId === schemaId && ui.id !== keepId && ui.primary) {
        await this.#kv.set(entry.key, { ...ui, primary: false, updatedAt: new Date().toISOString() });
      }
    }
  }

  async #hasPrimary(schemaId: string): Promise<boolean> {
    for await (const entry of this.#kv.list<UiSchemaRecord>({ prefix: PREFIX })) {
      const ui = entry.value;
      if (ui.schemaId === schemaId && ui.primary) return true;
    }
    return false;
  }
}
