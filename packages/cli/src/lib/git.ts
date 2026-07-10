import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { logger } from "./logger.ts";

export interface GitSetupChoices {
  gitRoot?: string;
  previousHooksPath?: string;
  initializeGit: boolean;
  installPrehook: boolean;
}

export interface GitSetupPromptOptions {
  gitRoot?: string;
  existingHooksPath?: string;
  targetDir: string;
  yes: boolean;
  confirm: (message: string, initialValue?: boolean) => Promise<boolean>;
}

function nearestExistingDirectory(targetDir: string): string {
  let current = targetDir;
  while (!fs.existsSync(current)) {
    const parent = path.dirname(current);
    if (parent === current) return current;
    current = parent;
  }
  return current;
}

export function findGitRoot(targetDir: string): string | undefined {
  const probeDir = nearestExistingDirectory(targetDir);
  logger.debug("Probing for git root", { targetDir, probeDir });

  const result = spawnSync("git", ["-C", probeDir, "rev-parse", "--show-toplevel"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });

  if (result.status !== 0) {
    logger.info("No git repository found", { probeDir });
    return;
  }
  const root = result.stdout.trim();
  const resolved = root ? path.resolve(root) : undefined;
  logger.info(resolved ? `Git root found: ${resolved}` : "No git root found", {
    probeDir,
    gitRoot: resolved,
  });
  return resolved;
}

export function findGitHooksPath(gitRoot: string): string | undefined {
  const result = spawnSync("git", ["-C", gitRoot, "config", "--get", "core.hooksPath"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
  if (result.status !== 0) {
    logger.debug("No core.hooksPath configured", { gitRoot });
    return;
  }
  const hooksPath = result.stdout.trim();
  logger.debug("Found existing hooksPath", { gitRoot, hooksPath: hooksPath || "(unset)" });
  return hooksPath || undefined;
}

export async function resolveGitSetupChoices(
  options: GitSetupPromptOptions,
): Promise<GitSetupChoices> {
  logger.beginStep("resolve-git-setup");
  logger.info("Resolving git setup choices", {
    gitRoot: options.gitRoot,
    hasExistingHooksPath: Boolean(options.existingHooksPath),
    targetDir: options.targetDir,
    yes: options.yes,
  });

  if (options.gitRoot) {
    const replacementWarning = options.existingHooksPath
      ? ` Current core.hooksPath is "${options.existingHooksPath}"; continuing will replace it and disable those hooks.`
      : "";
    const installPrehook =
      options.yes ||
      (await options.confirm(
        `Git repository detected at "${options.gitRoot}". Install the Vite+ pre-commit hook? This will update that repository's core.hooksPath.${replacementWarning}`,
        options.existingHooksPath ? false : true,
      ));
    logger.info("Git setup decision (existing repo)", {
      gitRoot: options.gitRoot,
      initializeGit: false,
      installPrehook,
      previousHooksPath: options.existingHooksPath,
    });
    logger.endStep("resolve-git-setup");
    return {
      gitRoot: options.gitRoot,
      initializeGit: false,
      installPrehook,
      ...(options.existingHooksPath ? { previousHooksPath: options.existingHooksPath } : {}),
    };
  }

  const initializeGit =
    options.yes || (await options.confirm("No Git repository detected. Initialize Git?"));
  if (!initializeGit) {
    logger.info("User declined git initialization");
    logger.endStep("resolve-git-setup");
    return { initializeGit: false, installPrehook: false };
  }

  const installPrehook =
    options.yes ||
    (await options.confirm("Install the Vite+ pre-commit hook after Git is initialized?"));
  logger.info("Git setup decision (new repo)", { initializeGit: true, installPrehook });
  logger.endStep("resolve-git-setup");
  return { initializeGit: true, installPrehook };
}

export function getPrecommitCommand(targetDir: string, gitRoot: string): string {
  const canonicalTarget = canonicalPath(targetDir);
  const canonicalRoot = canonicalPath(gitRoot);
  const relativeTarget = path.relative(canonicalRoot, canonicalTarget) || ".";
  if (relativeTarget === ".." || relativeTarget.startsWith(`..${path.sep}`)) {
    logger.error("Project outside git root", { canonicalTarget, canonicalRoot });
    throw new Error(`Project directory ${canonicalTarget} is outside Git root ${canonicalRoot}`);
  }
  const command =
    relativeTarget === "."
      ? "vp staged"
      : `vp staged --cwd ${shellQuote(relativeTarget.split(path.sep).join("/"))}`;
  logger.debug("Precommit command generated", { targetDir, gitRoot, command });
  return command;
}

export function writePrecommitCommand(targetDir: string, command: string): void {
  const hookPath = path.join(targetDir, ".vite-hooks", "pre-commit");
  if (!fs.existsSync(hookPath)) {
    logger.error("Pre-commit hook not found at expected path", { hookPath });
    throw new Error(`Vite+ pre-commit hook was not created at ${hookPath}`);
  }
  fs.writeFileSync(hookPath, `${command}\n`, { mode: 0o755 });
  logger.info("Precommit hook written", { hookPath, command });
}

export function restoreGitHooksPath(gitRoot: string, previousHooksPath: string | undefined): void {
  const args = previousHooksPath
    ? ["-C", gitRoot, "config", "core.hooksPath", previousHooksPath]
    : ["-C", gitRoot, "config", "--unset-all", "core.hooksPath"];
  logger.debug("Restoring git hooksPath", { gitRoot, previousHooksPath });
  const result = spawnSync("git", args, { stdio: "ignore" });
  if (previousHooksPath && result.status !== 0) {
    logger.error("Failed to restore core.hooksPath", {
      gitRoot,
      previousHooksPath,
      exitCode: result.status,
    });
    throw new Error(`Failed to restore core.hooksPath for ${gitRoot}`);
  }
}

function shellQuote(value: string): string {
  return `'${value.replaceAll("'", `'"'"'`)}'`;
}

function canonicalPath(value: string): string {
  return fs.existsSync(value) ? fs.realpathSync(value) : path.resolve(value);
}
