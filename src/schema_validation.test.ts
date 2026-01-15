import { assertEquals, assertRejects } from "jsr:@std/assert@1";
import { ensureValidJsonSchema, validateDataAgainstSchema } from "./schema_validation.ts";

Deno.test("ensureValidJsonSchema accepts valid schema", async () => {
  await ensureValidJsonSchema({
    $schema: "https://json-schema.org/draft/2020-12/schema",
    type: "object",
    properties: {
      name: { type: "string" },
    },
    required: ["name"],
  });
});

Deno.test("ensureValidJsonSchema rejects invalid schema", async () => {
  await assertRejects(() => ensureValidJsonSchema({ type: "not-a-real-type" } as never));
});

Deno.test("validateDataAgainstSchema reports errors", async () => {
  const result = await validateDataAgainstSchema(
    {
      type: "object",
      properties: { count: { type: "integer" } },
      required: ["count"],
    },
    { count: "oops" },
  );
  assertEquals(result.valid, false);
  if (!result.errors || result.errors.length === 0) {
    throw new Error("expected errors");
  }
});
