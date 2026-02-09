import { createApp } from "./src/router.ts";
import { SchemaService } from "./src/schema_service.ts";
import { UiSchemaService } from "./src/ui_schema_service.ts";
import { ensureValidJsonSchema } from "./src/schema_validation.ts";
import { sampleSchemas } from "./src/sample_schemas.ts";
import { sampleUiSchemas } from "./src/sample_ui_schemas.ts";

const port = Number(Deno.env.get("PORT") ?? "8000");
const kv = await Deno.openKv(Deno.env.get("KV_PATH"));
const seedService = new SchemaService(kv);
const seedUiService = new UiSchemaService(kv);

const seedEnabled = (() => {
	const flag = Deno.env.get("SEED_SAMPLES");
	if (flag !== null && flag !== undefined) return flag !== "0";
	// Default to seeding on Deploy unless explicitly disabled.
	if (Deno.env.get("DENO_DEPLOYMENT_ID")) return true;
	return (Deno.env.get("DENO_ENV") ?? "").toLowerCase() === "development";
})();

if (seedEnabled) {
	await seedSamples(seedService, seedUiService);
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

async function seedSamples(schemaService: SchemaService, uiService: UiSchemaService) {
	let seededSchemas = 0;
	let seededUiSchemas = 0;

	for (const schema of sampleSchemas) {
		const existing = await schemaService.get(schema.id);
		if (existing) continue;
		await ensureValidJsonSchema(schema.schema);
		await schemaService.upsert(schema);
		seededSchemas += 1;
	}

	for (const ui of sampleUiSchemas) {
		const existing = await uiService.get(ui.id);
		if (existing) continue;
		await uiService.upsert({ ...ui, id: ui.id });
		seededUiSchemas += 1;
	}

	if (seededSchemas > 0) {
		const ids = sampleSchemas.map((s) => s.id).join(", ");
		console.log(`Seeded ${seededSchemas} sample schemas: ${ids}`);
	}

	if (seededUiSchemas > 0) {
		const ids = sampleUiSchemas.map((s) => s.id).join(", ");
		console.log(`Seeded ${seededUiSchemas} sample UI schemas: ${ids}`);
	}
}
