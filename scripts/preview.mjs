// A dependency-free local preview for the exported site, bound to this device.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { dirname, extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../out");
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".webp": "image/webp", ".ico": "image/x-icon", ".woff2": "font/woff2", ".txt": "text/plain; charset=utf-8" };
const port = Number(process.env.PORT || 3000);
try { await stat(join(root, "index.html")); }
catch { console.error("Build the site first: npm run build"); process.exit(1); }
const server = createServer(async (request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") { response.writeHead(405); response.end(); return; }
  try {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    let path = resolve(root, `.${pathname}`);
    const relativePath = relative(root, path);
    if (relativePath.startsWith(`..${sep}`) || relativePath === ".." || relativePath.includes(":")) { response.writeHead(403); response.end(); return; }
    if ((await stat(path)).isDirectory()) path = join(path, "index.html");
    const body = await readFile(path);
    response.writeHead(200, { "Content-Type": types[extname(path)] || "application/octet-stream", "Content-Length": body.length, "X-Content-Type-Options": "nosniff" });
    response.end(request.method === "HEAD" ? undefined : body);
  } catch { response.writeHead(404, { "Content-Type": "text/plain" }); response.end("Not found"); }
});
server.listen(port, "127.0.0.1", () => console.log(`Study Room preview: http://127.0.0.1:${port}`));
