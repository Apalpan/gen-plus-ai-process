import durableHandler from "../server/vercel.mjs";

/**
 * Vercel rewrites every API route here. Reconstruct the path before passing
 * the original Node request to the domain handler so its normal route and
 * permission checks remain in force.
 */
export default async function entry(request, response) {
  const url = new URL(request.url, `https://${request.headers.host ?? "invalid"}`);
  const suffix = url.searchParams.get("__path") ?? (url.pathname.startsWith("/api/") && url.pathname !== "/api/entry" ? url.pathname.slice(5) : "");
  if (
    suffix.startsWith("/") ||
    suffix.includes("\\") ||
    suffix.split("/").some((part) => part === "..")
  ) {
    response.statusCode = 400;
    response.setHeader("content-type", "application/json; charset=utf-8");
    response.end(JSON.stringify({ error: "invalid_api_path" }));
    return;
  }
  url.searchParams.delete("__path");
  const query = url.searchParams.toString();
  request.url = `/api/${suffix}${query ? `?${query}` : ""}`;
  return durableHandler(request, response);
}
