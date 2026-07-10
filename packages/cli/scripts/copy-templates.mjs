import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const sourceDir = path.resolve(scriptDir, "../../../templates");
const destinationDir = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.resolve(scriptDir, "../dist/templates");
const excludedEntries = new Set([
  "node_modules",
  ".tanstack",
  "dist",
  "dist-ssr",
  ".agents",
  ".vite-hooks",
  ".git",
]);

fs.rmSync(destinationDir, { recursive: true, force: true });
fs.cpSync(sourceDir, destinationDir, {
  recursive: true,
  filter(source) {
    return !excludedEntries.has(path.basename(source));
  },
});
