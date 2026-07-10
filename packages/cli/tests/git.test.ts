import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { expect, test } from "vite-plus/test";
import {
  findGitRoot,
  findGitHooksPath,
  getPrecommitCommand,
  resolveGitSetupChoices,
  writePrecommitCommand,
} from "../src/lib/git.ts";

test("existing Git repository only asks whether to install the prehook", async () => {
  const messages: string[] = [];
  const initialValues: Array<boolean | undefined> = [];
  const result = await resolveGitSetupChoices({
    gitRoot: "/repo",
    existingHooksPath: ".husky/_",
    targetDir: "/repo/app",
    yes: false,
    confirm: async (message, initialValue) => {
      messages.push(message);
      initialValues.push(initialValue);
      return true;
    },
  });
  expect(result).toEqual({
    gitRoot: "/repo",
    previousHooksPath: ".husky/_",
    initializeGit: false,
    installPrehook: true,
  });
  expect(messages).toHaveLength(1);
  expect(messages[0]).toContain("core.hooksPath");
  expect(messages[0]).toContain("disable those hooks");
  expect(initialValues).toEqual([false]);
});

test("existing Git repository can leave prehook configuration unchanged", async () => {
  const result = await resolveGitSetupChoices({
    gitRoot: "/repo",
    targetDir: "/repo/app",
    yes: false,
    confirm: async () => false,
  });
  expect(result).toEqual({ gitRoot: "/repo", initializeGit: false, installPrehook: false });
});

test("declining Git initialization also skips the prehook prompt", async () => {
  let prompts = 0;
  const result = await resolveGitSetupChoices({
    targetDir: "/tmp/app",
    yes: false,
    confirm: async () => {
      prompts += 1;
      return false;
    },
  });
  expect(result).toEqual({ initializeGit: false, installPrehook: false });
  expect(prompts).toBe(1);
});

test("Git initialization and prehook use separate confirmations", async () => {
  const answers = [true, false];
  const result = await resolveGitSetupChoices({
    targetDir: "/tmp/app",
    yes: false,
    confirm: async () => answers.shift() ?? false,
  });
  expect(result).toEqual({ initializeGit: true, installPrehook: false });
  expect(answers).toHaveLength(0);
});

test("yes mode enables Git initialization and prehook without prompting", async () => {
  const result = await resolveGitSetupChoices({
    targetDir: "/tmp/app",
    yes: true,
    confirm: async () => {
      throw new Error("confirm should not be called");
    },
  });
  expect(result).toEqual({ initializeGit: true, installPrehook: true });
});

test("findGitRoot detects an inherited parent repository", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "cnma-git-root-"));
  const target = path.join(root, "nested", "app");
  try {
    expect(spawnSync("git", ["init", "-q", root]).status).toBe(0);
    expect(spawnSync("git", ["-C", root, "config", "core.hooksPath", ".husky/_"]).status).toBe(0);
    expect(findGitRoot(target)).toBe(fs.realpathSync(root));
    expect(findGitHooksPath(root)).toBe(".husky/_");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("prehook uses the child project as Vite+ cwd", () => {
  expect(getPrecommitCommand("/repo/apps/my-app", "/repo")).toBe("vp staged --cwd 'apps/my-app'");
  expect(getPrecommitCommand("/repo", "/repo")).toBe("vp staged");
});

test("prehook refuses a project outside the detected Git root", () => {
  expect(() => getPrecommitCommand("/other/app", "/repo")).toThrow(/outside Git root/);
});

test("writePrecommitCommand updates the generated Vite+ hook", () => {
  const target = fs.mkdtempSync(path.join(os.tmpdir(), "cnma-hook-"));
  try {
    fs.mkdirSync(path.join(target, ".vite-hooks"));
    fs.writeFileSync(path.join(target, ".vite-hooks", "pre-commit"), "vp staged\n");
    writePrecommitCommand(target, "vp staged --cwd 'apps/test'");
    expect(fs.readFileSync(path.join(target, ".vite-hooks", "pre-commit"), "utf8")).toBe(
      "vp staged --cwd 'apps/test'\n",
    );
  } finally {
    fs.rmSync(target, { recursive: true, force: true });
  }
});
