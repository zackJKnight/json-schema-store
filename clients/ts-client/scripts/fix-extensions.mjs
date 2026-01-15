import { promises as fs } from "node:fs";
import { join } from "node:path";

async function main() {
  const distDir = new URL("../dist", import.meta.url);
  const files = await fs.readdir(distDir, { withFileTypes: true });
  await Promise.all(files.map((entry) => processEntry(distDir, entry)));
}

async function processEntry(base, entry) {
  const full = join(base.pathname, entry.name);
  if (entry.isDirectory()) {
    const inner = await fs.readdir(full, { withFileTypes: true });
    await Promise.all(inner.map((e) => processEntry(new URL(`${full}/`, import.meta.url), e)));
    return;
  }
  if (!entry.name.endsWith(".js")) return;
  const content = await fs.readFile(full, "utf8");
  const updated = content.replace(/(from|import)\s+(["'])(\.\.\/[^"']+|\.\/[^"']+)(\2)/g, (m, kw, quote, spec, end) => {
    if (spec.endsWith(".js") || spec.endsWith(".json")) return m;
    return `${kw} ${quote}${spec}.js${end}`;
  }).replace(/export\s+\*\s+from\s+(["'])(\.\.\/[^"']+|\.\/[^"']+)(\1)/g, (m, quote, spec, end) => {
    if (spec.endsWith(".js") || spec.endsWith(".json")) return m;
    return `export * from ${quote}${spec}.js${end}`;
  });
  if (updated !== content) {
    await fs.writeFile(full, updated, "utf8");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
