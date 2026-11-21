import { createReadStream, existsSync, statSync } from "node:fs";
import { resolve, sep, extname } from "node:path";
const root = resolve("dist");
const mime = {
  ".js": "text/javascript",
  ".css": "text/css",
  ".html": "text/html",
  ".woff2": "font/woff2",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".json": "application/json",
  ".txt": "text/plain",
};
export function serveClient(method, pathname, response) {
  if (method !== "GET" && method !== "HEAD") return false;
  let name;
  try {
    name = decodeURIComponent(pathname);
  } catch {
    return false;
  }
  if (name.includes("\\") || name.includes("\0")) return false;
  const path = resolve(root, "." + (name === "/" ? "/index.html" : name));
  if (
    !path.startsWith(root + sep) ||
    !existsSync(path) ||
    !statSync(path).isFile()
  )
    return false;
  response.writeHead(200, {
    "Content-Type": mime[extname(path)] || "application/octet-stream",
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": path.includes(sep + "assets" + sep)
      ? "public,max-age=31536000,immutable"
      : "no-cache",
  });
  if (method === "HEAD") response.end();
  else
    createReadStream(path)
      .on("error", () => response.destroy())
      .pipe(response);
  return true;
}
