import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Template } from "../types.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Resolve the templates root directory (mirrors scaffold.ts resolution logic). */
export const TEMPLATES_DIR = (() => {
  const fromDist = path.resolve(__dirname, "templates");
  if (fs.existsSync(fromDist)) return fromDist;
  const fromDistWorkspace = path.resolve(__dirname, "../../../templates");
  if (fs.existsSync(fromDistWorkspace)) return fromDistWorkspace;
  const fromWorkspace = path.resolve(__dirname, "../../../../templates");
  if (fs.existsSync(fromWorkspace)) return fromWorkspace;
  return fromDist;
})();

/**
 * Auto-discover templates from the templates directory by scanning
 * subdirectories and reading their package.json for metadata.
 */
function discoverTemplates(): Template[] {
  if (!fs.existsSync(TEMPLATES_DIR)) return [];

  return fs
    .readdirSync(TEMPLATES_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const manifestPath = path.join(TEMPLATES_DIR, entry.name, "package.json");
      let label = entry.name;
      let hint = "";
      if (fs.existsSync(manifestPath)) {
        try {
          const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as {
            name?: string;
            description?: string;
          };
          label = manifest.name || entry.name;
          hint = manifest.description || "";
        } catch {
          // Malformed package.json — fall back to directory name.
        }
      }
      return { id: entry.name, label, hint };
    });
}

export const TEMPLATES: Template[] = discoverTemplates();

export function getTemplate(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
