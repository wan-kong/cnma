import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { expect, test } from "vite-plus/test";
import {
  DEFAULT_PROJECT_NAME,
  DEFAULT_TEMPLATE,
  getCdCommand,
  resolveTargetDirectory,
  runPostCreateSetup,
  SetupStepError,
  validateProjectName,
} from "../src/lib/create-flow.ts";
import type { CommandSpec } from "../src/types.ts";
import { normalizeCreateArgs } from "../src/commands/create.ts";

test("uses the requested interactive defaults", () => {
  expect(DEFAULT_PROJECT_NAME).toBe("cnma-app");
  expect(DEFAULT_TEMPLATE).toBe("vite-react-tanstack-router");
});

test("supports both direct and create-prefixed invocation", () => {
  expect(normalizeCreateArgs(["my-app", "--yes"])).toEqual(["my-app", "--yes"]);
  expect(normalizeCreateArgs(["create", "my-app", "--yes"])).toEqual(["my-app", "--yes"]);
});

test("next-step command preserves a nested target path", () => {
  expect(getCdCommand("/workspace/apps/my-app", "/workspace")).toBe("cd 'apps/my-app'");
});

test.each([
  "Uppercase",
  "has spaces",
  "../escape",
  "_private",
  "-leading-dash",
  "node_modules",
  "a".repeat(215),
])("rejects invalid project name %s", (name) => expect(validateProjectName(name)).toBeDefined());

test("empty project name passes validation (defaults to cnma-app)", () => {
  expect(validateProjectName("")).toBeUndefined();
});

test.each(["cnma-app", "app_2", "web123"])("accepts valid project name %s", (name) => {
  expect(validateProjectName(name)).toBeUndefined();
});

test("project target must stay below the current directory", () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "cnma-target-"));
  try {
    expect(resolveTargetDirectory("nested/app", cwd)).toBe(path.join(cwd, "nested", "app"));
    expect(() => resolveTargetDirectory(".", cwd)).toThrow(/child/);
    expect(() => resolveTargetDirectory("..", cwd)).toThrow(/child/);
    expect(() => resolveTargetDirectory(path.dirname(cwd), cwd)).toThrow(/child/);
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});

test("project target cannot escape through a symbolic-link parent", () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "cnma-target-"));
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), "cnma-outside-"));
  try {
    fs.symlinkSync(outside, path.join(cwd, "linked"), "dir");
    expect(() => resolveTargetDirectory("linked/app", cwd)).toThrow(/outside/);
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
    fs.rmSync(outside, { recursive: true, force: true });
  }
});

test("post-create setup runs in the required order", async () => {
  const targetDir = fs.mkdtempSync(path.join(os.tmpdir(), "cnma-setup-"));
  const commands: string[] = [];
  try {
    await runPostCreateSetup({
      targetDir,
      packageManager: "pnpm",
      git: { initializeGit: true, installPrehook: true },
      run: async (command) => {
        commands.push(command.display);
        if (command.display === "vp config") {
          fs.mkdirSync(path.join(targetDir, ".vite-hooks"), { recursive: true });
          fs.writeFileSync(path.join(targetDir, ".vite-hooks", "pre-commit"), "vp staged\n");
        }
      },
    });
    expect(commands).toEqual([
      "pnpm install",
      "npx --yes skills experimental_install",
      "git init",
      "vp config",
    ]);
    expect(fs.readFileSync(path.join(targetDir, ".vite-hooks", "pre-commit"), "utf8")).toBe(
      "vp staged\n",
    );
  } finally {
    fs.rmSync(targetDir, { recursive: true, force: true });
  }
});

test("existing parent Git installs a child-scoped prehook without git init", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "cnma-parent-setup-"));
  const targetDir = path.join(root, "apps", "web");
  const commands: string[] = [];
  try {
    fs.mkdirSync(targetDir, { recursive: true });
    await runPostCreateSetup({
      targetDir,
      packageManager: "pnpm",
      git: { gitRoot: root, initializeGit: false, installPrehook: true },
      run: async (command) => {
        commands.push(command.display);
        if (command.display === "vp config") {
          fs.mkdirSync(path.join(targetDir, ".vite-hooks"), { recursive: true });
          fs.writeFileSync(path.join(targetDir, ".vite-hooks", "pre-commit"), "vp staged\n");
        }
      },
    });
    expect(commands).toEqual([
      "pnpm install",
      "npx --yes skills experimental_install",
      "vp config",
    ]);
    expect(fs.readFileSync(path.join(targetDir, ".vite-hooks/pre-commit"), "utf8")).toBe(
      "vp staged --cwd 'apps/web'\n",
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("failed prehook configuration restores the previous hooksPath", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "cnma-hook-rollback-"));
  const targetDir = path.join(root, "apps", "web");
  try {
    fs.mkdirSync(targetDir, { recursive: true });
    expect(spawnSync("git", ["init", "-q", root]).status).toBe(0);
    expect(spawnSync("git", ["-C", root, "config", "core.hooksPath", ".husky/_"]).status).toBe(0);

    await expect(
      runPostCreateSetup({
        targetDir,
        packageManager: "pnpm",
        git: {
          gitRoot: root,
          previousHooksPath: ".husky/_",
          initializeGit: false,
          installPrehook: true,
        },
        run: async (command) => {
          if (command.display === "vp config") {
            expect(
              spawnSync("git", ["-C", root, "config", "core.hooksPath", "apps/web/.vite-hooks/_"])
                .status,
            ).toBe(0);
          }
        },
      }),
    ).rejects.toBeInstanceOf(SetupStepError);

    expect(
      spawnSync("git", ["-C", root, "config", "--get", "core.hooksPath"], {
        encoding: "utf8",
      }).stdout.trim(),
    ).toBe(".husky/_");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("post-create setup stops at the first failed command", async () => {
  const commands: string[] = [];
  const runner = async (command: CommandSpec): Promise<void> => {
    commands.push(command.display);
    if (command.display.includes("skills")) throw new Error("network unavailable");
  };

  await expect(
    runPostCreateSetup({
      targetDir: "/tmp/cnma-failure-test",
      packageManager: "pnpm",
      git: { initializeGit: true, installPrehook: true },
      run: runner,
    }),
  ).rejects.toBeInstanceOf(SetupStepError);
  expect(commands).toEqual(["pnpm install", "npx --yes skills experimental_install"]);
});
