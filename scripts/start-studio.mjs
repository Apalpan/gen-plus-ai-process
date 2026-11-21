import { spawn } from "node:child_process";
const children = [];
let closing = false;
function close(code) {
  if (closing) return;
  closing = true;
  for (const child of children) child.kill();
  process.exitCode = code;
}
for (const args of [
  ["--watch", "server/index.mjs"],
  ["node_modules/vite/bin/vite.js"],
]) {
  const child = spawn(process.execPath, args, {
    stdio: "inherit",
    windowsHide: true,
  });
  children.push(child);
  child.on("error", () => close(1));
  child.on("exit", (code) => close(code ?? 1));
}
process.on("SIGINT", () => close(0));
process.on("SIGTERM", () => close(0));
