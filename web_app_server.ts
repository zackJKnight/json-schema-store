import { serveDir } from "https://deno.land/std@0.224.0/http/file_server.ts";

const fsRoot = Deno.env.get("WEB_APP_DIST") ?? "./clients/examples/web-app/dist";

Deno.serve((req) => serveDir(req, { fsRoot, quiet: true }));
