import { assertEquals } from "jsr:@std/assert@1";
import { SchemaService } from "./schema_service.ts";

async function openCleanKv() {
  const kv = await Deno.openKv();
  for await (const entry of kv.list({ prefix: ["schema"] })) {
    await kv.delete(entry.key);
  }
  return kv;
}

Deno.test("SchemaService creates and retrieves schema", async () => {
  const kv = await openCleanKv();
  const service = new SchemaService(kv);

  const created = await service.upsert({
    id: "form-1",
    name: "Contact Form",
    namespace: "forms",
    tags: ["contact", "v1"],
    schema: { type: "object" },
  });

  const fetched = await service.get("form-1");
  assertEquals(fetched?.id, "form-1");
  assertEquals(fetched?.name, created.name);
  assertEquals(fetched?.namespace, "forms");
  assertEquals(fetched?.tags, ["contact", "v1"]);

  kv.close();
});

Deno.test("SchemaService updates schema", async () => {
  const kv = await openCleanKv();
  const service = new SchemaService(kv);

  await service.upsert({ id: "foo", name: "v1", namespace: "core", tags: ["alpha"], schema: {} });
  const updated = await service.upsert({ id: "foo", name: "v2", namespace: "core", tags: ["beta"], schema: { version: 2 } });

  assertEquals(updated.name, "v2");
  assertEquals(updated.schema, { version: 2 });
  assertEquals(updated.tags, ["beta"]);

  kv.close();
});

Deno.test("SchemaService lists schemas with cursor", async () => {
  const kv = await openCleanKv();
  const service = new SchemaService(kv);

  await service.upsert({ id: "a", name: "A", schema: {} });
  await service.upsert({ id: "b", name: "B", schema: {} });

  const firstPage = await service.list(1, 0);
  assertEquals(firstPage.items.length, 1);
  if (!firstPage.cursor) throw new Error("cursor expected");

  const secondPage = await service.list(10, Number(firstPage.cursor));
  assertEquals(secondPage.items.length, 1);

  kv.close();
});

Deno.test("SchemaService filters and sorts", async () => {
  const kv = await openCleanKv();
  const service = new SchemaService(kv);

  await service.upsert({ id: "one", name: "Alpha", namespace: "core", tags: ["a"], schema: {} });
  await service.upsert({ id: "two", name: "Beta", namespace: "extensions", tags: ["b"], schema: {} });
  await service.upsert({ id: "three", name: "Gamma", namespace: "core", tags: ["b", "c"], schema: {} });

  const core = await service.list(10, 0, { namespace: "core" });
  assertEquals(core.items.map((i) => i.id).sort(), ["one", "three"].sort());

  const tagB = await service.list(10, 0, { tag: "b", sort: "name" });
  assertEquals(tagB.items.map((i) => i.name), ["Beta", "Gamma"]);

  const search = await service.list(10, 0, { q: "gam" });
  assertEquals(search.items[0].id, "three");

  kv.close();
});

Deno.test("SchemaService namespaces and suggest", async () => {
  const kv = await openCleanKv();
  const service = new SchemaService(kv);

  await service.upsert({ id: "one", name: "Alpha Form", namespace: "core", tags: ["forms"], schema: {} });
  await service.upsert({ id: "two", name: "Beta Thing", namespace: "addons", tags: ["ext"], schema: {} });

  assertEquals(await service.listNamespaces(), ["addons", "core"]);

  const suggestions = await service.searchSuggest("form", 5);
  assertEquals(suggestions[0].id, "one");

  kv.close();
});

Deno.test("SchemaService delete result", async () => {
  const kv = await openCleanKv();
  const service = new SchemaService(kv);
  await service.upsert({ id: "dead", name: "To delete", schema: {} });

  const removed = await service.remove("dead");
  assertEquals(removed, true);
  const missing = await service.remove("missing");
  assertEquals(missing, false);
  kv.close();
});
