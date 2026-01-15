import { assertEquals } from "jsr:@std/assert@1";
import { DB } from "https://deno.land/x/sqlite@v3.9.1/mod.ts";
import { createApp } from "./router.ts";

function json(body: unknown): string {
  return JSON.stringify(body);
}

Deno.test("PATCH merge-patch updates schema and respects validation", async () => {
  const db = new DB(":memory:");
  const handler = createApp(db);

  const createRes = await handler(new Request("http://localhost/schemas", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: json({ name: "Form", schema: { type: "object", properties: { title: { type: "string" } } } }),
  }));
  assertEquals(createRes.status, 201);
  const created = await createRes.json();

  const patchRes = await handler(new Request(`http://localhost/schemas/${created.id}`, {
    method: "PATCH",
    headers: { "content-type": "application/merge-patch+json" },
    body: json({ schema: { properties: { title: { type: "string", minLength: 3 } } } }),
  }));
  assertEquals(patchRes.status, 200);
  const patched = await patchRes.json();
  assertEquals(patched.schema.properties.title.minLength, 3);

  db.close();
});

Deno.test("PATCH json-patch adds property", async () => {
  const db = new DB(":memory:");
  const handler = createApp(db);

  const createRes = await handler(new Request("http://localhost/schemas", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: json({ name: "Form", schema: { type: "object", properties: {} } }),
  }));
  const created = await createRes.json();

  const patchOps = [
    { op: "add", path: "/schema/properties/age", value: { type: "integer" } },
  ];
  const patchRes = await handler(new Request(`http://localhost/schemas/${created.id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json-patch+json" },
    body: json(patchOps),
  }));
  assertEquals(patchRes.status, 200);
  const patched = await patchRes.json();
  assertEquals(patched.schema.properties.age.type, "integer");

  db.close();
});

Deno.test("GET fragment returns pointer value", async () => {
  const db = new DB(":memory:");
  const handler = createApp(db);

  const createRes = await handler(new Request("http://localhost/schemas", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: json({ name: "Form", schema: { type: "object", properties: { title: { type: "string" } } } }),
  }));
  const created = await createRes.json();

  const fragRes = await handler(new Request(`http://localhost/schemas/${created.id}/fragment?pointer=/properties/title`));
  assertEquals(fragRes.status, 200);
  const fragment = await fragRes.json();
  assertEquals(fragment.value.type, "string");

  db.close();
});

Deno.test("PATCH fails on ETag mismatch", async () => {
  const db = new DB(":memory:");
  const handler = createApp(db);

  const createRes = await handler(new Request("http://localhost/schemas", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: json({ name: "Form", schema: { type: "object" } }),
  }));
  const created = await createRes.json();

  const res = await handler(new Request(`http://localhost/schemas/${created.id}`, {
    method: "PATCH",
    headers: { "content-type": "application/merge-patch+json", "if-match": "stale" },
    body: json({ name: "New" }),
  }));
  assertEquals(res.status, 412);

  db.close();
});

Deno.test("Discovery endpoints list namespaces and filter", async () => {
  const db = new DB(":memory:");
  const handler = createApp(db);

  await handler(new Request("http://localhost/schemas", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: json({ id: "forms", name: "Form", namespace: "forms", tags: ["ui"], schema: { type: "object" } }),
  }));

  await handler(new Request("http://localhost/schemas", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: json({ id: "billing", name: "Billing", namespace: "billing", tags: ["payments"], schema: { type: "object" } }),
  }));

  const namespacesRes = await handler(new Request("http://localhost/namespaces"));
  assertEquals(namespacesRes.status, 200);
  const namespaces = await namespacesRes.json();
  assertEquals(namespaces.items, ["billing", "forms"]);

  const filteredRes = await handler(new Request("http://localhost/schemas?namespace=forms"));
  assertEquals(filteredRes.status, 200);
  const filtered = await filteredRes.json();
  assertEquals(filtered.items.length, 1);
  assertEquals(filtered.items[0].id, "forms");

  db.close();
});

Deno.test("Suggest endpoint returns matches", async () => {
  const db = new DB(":memory:");
  const handler = createApp(db);

  await handler(new Request("http://localhost/schemas", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: json({ id: "searchable", name: "Search Me", namespace: "core", schema: { type: "object" } }),
  }));

  const suggestRes = await handler(new Request("http://localhost/schemas/suggest?q=search"));
  assertEquals(suggestRes.status, 200);
  const suggestions = await suggestRes.json();
  assertEquals(suggestions.items[0].id, "searchable");

  db.close();
});
