import { dirname } from "https://deno.land/std@0.224.0/path/mod.ts";
import { DB } from "https://deno.land/x/sqlite@v3.9.1/mod.ts";
import { createApp } from "./src/router.ts";
import { SchemaService } from "./src/schema_service.ts";
import { ensureValidJsonSchema } from "./src/schema_validation.ts";
import { sampleSchemas } from "./src/sample_schemas.ts";

const port = Number(Deno.env.get("PORT") ?? "8000");
const dbPath = Deno.env.get("DB_PATH") ?? "./data/schemas.db";

if (dbPath !== ":memory:") {
	const dir = dirname(dbPath);
	await Deno.mkdir(dir, { recursive: true });
}

const db = new DB(dbPath);
const seedService = new SchemaService(db);

const seedEnabled = (() => {
	const flag = Deno.env.get("SEED_SAMPLES");
	if (flag !== null && flag !== undefined) return flag !== "0";
	return (Deno.env.get("DENO_ENV") ?? "").toLowerCase() === "development";
})();

if (seedEnabled) {
	await seedSamples(seedService);
}

const handler = createApp(db);

console.log(`Deno API listening on http://localhost:${port}`);
Deno.serve({ port }, handler);

async function seedSamples(service: SchemaService) {
	let seeded = 0;

	for (const schema of sampleSchemas) {
		const existing = await service.get(schema.id);
		if (existing) continue;
		await ensureValidJsonSchema(schema.schema);
		await service.upsert(schema);
		seeded += 1;
	}

	if (seeded > 0) {
		const ids = sampleSchemas.map((s) => s.id).join(", ");
		console.log(`Seeded ${seeded} sample schemas: ${ids}`);
	}
}
