import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { expect, test } from "vite-plus/test";

const packageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("package exposes both supported CLI names", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(packageDir, "package.json"), "utf8")) as {
    name: string;
    bin: Record<string, string>;
    files: string[];
  };
  expect(manifest.name).toBe("create-cnma");
  expect(manifest.bin).toEqual({
    cnma: "./dist/index.mjs",
    "create-cnma": "./dist/index.mjs",
  });
  expect(manifest.files).toEqual(["dist"]);
});

test("template packaging copies required files and excludes generated directories", () => {
  const destination = fs.mkdtempSync(path.join(os.tmpdir(), "cnma-packaging-"));
  try {
    const result = spawnSync(
      process.execPath,
      [path.join(packageDir, "scripts/copy-templates.mjs"), destination],
      {
        cwd: packageDir,
        encoding: "utf8",
      },
    );
    expect(result.status, result.stderr).toBe(0);

    const reactTemplateDir = path.join(destination, "vite-react-tanstack-router");
    expect(fs.existsSync(path.join(reactTemplateDir, "skills-lock.json"))).toBe(true);
    expect(fs.existsSync(path.join(reactTemplateDir, "_gitignore"))).toBe(true);
    expect(fs.existsSync(path.join(reactTemplateDir, "_npmrc"))).toBe(true);

    const vueTemplateDir = path.join(destination, "vue-tanstack-tailwind-dashboard");
    for (const required of [
      "skills-lock.json",
      "_gitignore",
      "Dockerfile",
      "Makefile",
      "docker-compose.yml",
      "nginx/default.conf.template",
      "src/components/ui/button/Button.vue",
    ]) {
      expect(fs.existsSync(path.join(vueTemplateDir, required))).toBe(true);
    }

    for (const templateDir of [reactTemplateDir, vueTemplateDir]) {
      for (const excluded of [
        "node_modules",
        ".tanstack",
        "dist",
        ".agents",
        ".vite-hooks",
        ".git",
      ]) {
        expect(fs.existsSync(path.join(templateDir, excluded))).toBe(false);
      }
    }
  } finally {
    fs.rmSync(destination, { recursive: true, force: true });
  }
});
