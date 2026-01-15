import { dirname } from "https://deno.land/std@0.224.0/path/mod.ts";
import { DB } from "https://deno.land/x/sqlite@v3.9.1/mod.ts";
import { createApp } from "./src/router.ts";

const port = Number(Deno.env.get("PORT") ?? "8000");
const dbPath = Deno.env.get("DB_PATH") ?? "./data/schemas.db";

if (dbPath !== ":memory:") {
	const dir = dirname(dbPath);
	await Deno.mkdir(dir, { recursive: true });
}

const db = new DB(dbPath);
const handler = createApp(db);

console.log(`Deno API listening on http://localhost:${port}`);
Deno.serve({ port }, handler);
