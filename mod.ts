import { createApp } from "./src/router.ts";
import { SchemaService } from "./src/schema_service.ts";
import { ensureValidJsonSchema } from "./src/schema_validation.ts";
import { sampleSchemas } from "./src/sample_schemas.ts";

const port = Number(Deno.env.get("PORT") ?? "8000");
const kv = await Deno.openKv(Deno.env.get("KV_PATH"));
const seedService = new SchemaService(kv);

const seedEnabled = (() => {
	const flag = Deno.env.get("SEED_SAMPLES");
	if (flag !== null && flag !== undefined) return flag !== "0";
	return (Deno.env.get("DENO_ENV") ?? "").toLowerCase() === "development";
})();

if (seedEnabled) {
	await seedSamples(seedService);
}

const handler = createApp(kv);

// Deno Deploy ignores the port option; on local dev we still respect PORT.
if (Deno.env.get("DENO_DEPLOYMENT_ID")) {
	console.log("Deno API starting on Deno Deploy");
	Deno.serve(handler);
} else {
	console.log(`Deno API listening on http://localhost:${port}`);
	Deno.serve({ port }, handler);
}

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
