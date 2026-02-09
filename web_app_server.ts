import { serveDir } from "https://deno.land/std@0.224.0/http/file_server.ts";

const envRoot = Deno.env.get("WEB_APP_DIST");
const resolvedFsRoot = envRoot
	? envRoot
	: new URL("./clients/examples/web-app/dist", import.meta.url).pathname;

const hasDist = await exists(resolvedFsRoot);

Deno.serve(async (req) => {
	if (!hasDist) {
		return new Response(`dist missing at ${resolvedFsRoot}`, { status: 500 });
	}
	try {
		return await serveDir(req, {
			fsRoot: resolvedFsRoot,
			quiet: true,
		});
	} catch (err) {
		return new Response(`static error: ${err?.message ?? "unknown"}`, { status: 500 });
	}
});

async function exists(path: string): Promise<boolean> {
	try {
		const stat = await Deno.stat(path);
		return stat.isDirectory;
	} catch {
		return false;
	}
}
