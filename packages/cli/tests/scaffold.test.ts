import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { expect, test } from "vite-plus/test";
import { scaffoldProject, scaffoldTemplate } from "../src/lib/scaffold.ts";

function createTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "cnma-scaffold-"));
}

test("scaffoldTemplate creates a standalone project from the root template", () => {
  const targetDir = createTempDir();
  try {
    scaffoldTemplate({
      template: "vite-react-tanstack-router",
      targetDir,
      projectName: "my-awesome-app",
    });

    const manifest = JSON.parse(fs.readFileSync(path.join(targetDir, "package.json"), "utf8")) as {
      name: string;
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
    };
    expect(manifest.name).toBe("my-awesome-app");
    expect(
      Object.values({ ...manifest.dependencies, ...manifest.devDependencies }).some((version) =>
        version.startsWith("catalog:"),
      ),
    ).toBe(false);
    expect(fs.readFileSync(path.join(targetDir, "index.html"), "utf8")).toContain(
      "<title>my-awesome-app</title>",
    );
    expect(fs.existsSync(path.join(targetDir, ".gitignore"))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, "_gitignore"))).toBe(false);
    expect(fs.existsSync(path.join(targetDir, "_npmrc"))).toBe(false);
    expect(fs.existsSync(path.join(targetDir, "skills-lock.json"))).toBe(true);
    expect(fs.readFileSync(path.join(targetDir, ".npmrc"), "utf8")).toContain(
      "legacy-peer-deps=true",
    );
    expect(fs.existsSync(path.join(targetDir, "src/components/ui/button.tsx"))).toBe(true);
  } finally {
    fs.rmSync(targetDir, { recursive: true, force: true });
  }
});

test("scaffoldTemplate creates the standalone Vue dashboard", () => {
  const targetDir = createTempDir();
  try {
    scaffoldTemplate({
      template: "vue-tanstack-tailwind-dashboard",
      targetDir,
      projectName: "team-dashboard",
    });

    const manifest = JSON.parse(fs.readFileSync(path.join(targetDir, "package.json"), "utf8")) as {
      name: string;
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
    };
    expect(manifest.name).toBe("team-dashboard");
    expect(
      Object.values({ ...manifest.dependencies, ...manifest.devDependencies }).some((version) =>
        version.startsWith("catalog:"),
      ),
    ).toBe(false);
    expect(fs.readFileSync(path.join(targetDir, "index.html"), "utf8")).toContain(
      "<title>team-dashboard</title>",
    );
    expect(fs.readFileSync(path.join(targetDir, ".env.example"), "utf8")).toContain(
      'VITE_GLOBAL_APP_TITLE="team-dashboard"',
    );
    expect(fs.readFileSync(path.join(targetDir, "Makefile"), "utf8")).toContain(
      "IMAGE ?= team-dashboard",
    );
    expect(fs.existsSync(path.join(targetDir, ".gitignore"))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, "_gitignore"))).toBe(false);
    expect(fs.existsSync(path.join(targetDir, "skills-lock.json"))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, "Dockerfile"))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, "nginx/default.conf.template"))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, "src/components/ui/button/Button.vue"))).toBe(true);
  } finally {
    fs.rmSync(targetDir, { recursive: true, force: true });
  }
});

test("scaffoldTemplate excludes generated template directories", () => {
  const targetDir = createTempDir();
  try {
    scaffoldTemplate({
      template: "vite-react-tanstack-router",
      targetDir,
      projectName: "test-app",
    });
    expect(fs.existsSync(path.join(targetDir, "node_modules"))).toBe(false);
    expect(fs.existsSync(path.join(targetDir, ".tanstack"))).toBe(false);
    expect(fs.existsSync(path.join(targetDir, ".agents"))).toBe(false);
    expect(fs.existsSync(path.join(targetDir, ".vite-hooks"))).toBe(false);
  } finally {
    fs.rmSync(targetDir, { recursive: true, force: true });
  }
});

test("scaffoldProject atomically replaces content and preserves Git", () => {
  const root = createTempDir();
  const targetDir = path.join(root, "existing-project");
  try {
    fs.mkdirSync(targetDir);
    fs.mkdirSync(path.join(targetDir, ".git"));
    fs.writeFileSync(path.join(targetDir, ".git", "config"), "existing");
    fs.writeFileSync(path.join(targetDir, "old.txt"), "remove me");
    scaffoldProject({
      template: "vite-react-tanstack-router",
      targetDir,
      projectName: "existing-project",
    });
    expect(fs.readFileSync(path.join(targetDir, ".git", "config"), "utf8")).toBe("existing");
    expect(fs.existsSync(path.join(targetDir, "old.txt"))).toBe(false);
    expect(fs.existsSync(path.join(targetDir, "package.json"))).toBe(true);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("scaffoldProject refuses to overwrite a symbolic link", () => {
  const root = createTempDir();
  const destination = createTempDir();
  const link = path.join(root, "linked-project");
  try {
    fs.symlinkSync(destination, link, "dir");
    expect(() =>
      scaffoldProject({
        template: "vite-react-tanstack-router",
        targetDir: link,
        projectName: "linked-project",
      }),
    ).toThrow(/symbolic link/);
    expect(fs.existsSync(destination)).toBe(true);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(destination, { recursive: true, force: true });
  }
});

test("scaffoldProject leaves existing content intact when template validation fails", () => {
  const root = createTempDir();
  const targetDir = path.join(root, "existing-project");
  try {
    fs.mkdirSync(targetDir);
    fs.writeFileSync(path.join(targetDir, "keep.txt"), "keep me");
    expect(() =>
      scaffoldProject({
        template: "non-existent-template",
        targetDir,
        projectName: "existing-project",
      }),
    ).toThrow(/not found/);
    expect(fs.readFileSync(path.join(targetDir, "keep.txt"), "utf8")).toBe("keep me");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("scaffoldTemplate throws for an unknown template", () => {
  expect(() =>
    scaffoldTemplate({
      template: "non-existent-template",
      targetDir: path.join(os.tmpdir(), "cnma-should-not-exist"),
      projectName: "test",
    }),
  ).toThrow(/not found/);
});
