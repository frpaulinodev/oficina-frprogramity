// Compila el frontend: esbuild (TypeScript + React) y Tailwind CSS v4 -> dist/
// Uso: node build.mjs        (o npm run build)
import { build } from "esbuild";
import { compile } from "tailwindcss";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const root = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const dist = path.join(root, "dist");
const assets = path.join(dist, "assets");
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(assets, { recursive: true });

// 1) JavaScript
await build({
  entryPoints: [path.join(root, "src/main.tsx")],
  bundle: true, minify: true, format: "esm", target: "es2020", jsx: "automatic",
  outfile: path.join(assets, "app.js"), sourcemap: false, legalComments: "none",
  nodePaths: process.env.NODE_PATH ? process.env.NODE_PATH.split(path.delimiter) : [],
  define: { "process.env.NODE_ENV": '"production"' }, logLevel: "info",
});

// 2) CSS con Tailwind (escanea las clases usadas en src/)
const twDir = path.dirname(require.resolve("tailwindcss/package.json"));
const loadStylesheet = async (id, base) => {
  const file = id === "tailwindcss" ? path.join(twDir, "index.css") : path.resolve(base, id);
  return { path: file, base: path.dirname(file), content: fs.readFileSync(file, "utf8") };
};
const candidates = new Set();
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => {
  const p = path.join(d, e.name);
  if (e.isDirectory()) return walk(p);
  if (/\.(tsx?|html)$/.test(e.name)) for (const t of fs.readFileSync(p, "utf8").split(/[\s"'`{}<>]+/)) if (t) candidates.add(t);
});
walk(path.join(root, "src"));
for (const t of fs.readFileSync(path.join(root, "index.html"), "utf8").split(/[\s"'`<>]+/)) candidates.add(t);
const compiler = await compile(fs.readFileSync(path.join(root, "src/styles.css"), "utf8"), { base: path.join(root, "src"), loadStylesheet });
fs.writeFileSync(path.join(assets, "app.css"), compiler.build([...candidates]));

// 3) HTML
fs.copyFileSync(path.join(root, "index.html"), path.join(dist, "index.html"));
console.log("Frontend compilado en", dist);
