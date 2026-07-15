import * as p from "@clack/prompts";
import fs from "node:fs";
import path from "node:path";
import { delimiter } from "node:path";
import { spawn } from "cross-spawn";
import pc from "picocolors";
import type { CommandSpec, CreateFlowArgs, PackageManager } from "../types.ts";
import {
  findGitRoot,
  findGitHooksPath,
  getPrecommitCommand,
  resolveGitSetupChoices,
  restoreGitHooksPath,
  writePrecommitCommand,
  type GitSetupChoices,
} from "./git.ts";
import { logger } from "./logger.ts";
import { getInstallCommand, getRunCommand } from "./package-manager.ts";
import { scaffoldProject } from "./scaffold.ts";
import { getSkillsInstallCommand } from "./skills.ts";
import { getTemplate, TEMPLATES } from "./templates.ts";

export const DEFAULT_PROJECT_NAME = "cnma-app";
export const DEFAULT_TEMPLATE = TEMPLATES[0]?.id;

export function validateProjectName(value: string): string | undefined {
  const name = value.trim();
  if (!name) return; // empty input → use default
  if (name.length > 214) return "Project name must be 214 characters or fewer";
  if (!/^[a-z0-9][a-z0-9-_]*$/.test(name)) {
    return "Start with a lowercase letter or number; then use letters, numbers, hyphens, or underscores";
  }
  if (name === "node_modules" || name === "favicon.ico")
    return `Project name "${name}" is reserved`;
  return;
}

export function resolveTargetDirectory(input: string, cwd: string): string {
  const resolvedCwd = path.resolve(cwd);
  const targetDir = path.resolve(resolvedCwd, input);
  const relativeTarget = path.relative(resolvedCwd, targetDir);
  if (
    !relativeTarget ||
    relativeTarget === ".." ||
    relativeTarget.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativeTarget)
  ) {
    throw new Error("Project directory must be a child of the current directory");
  }
  if (fs.existsSync(targetDir) && fs.lstatSync(targetDir).isSymbolicLink()) {
    throw new Error("Project directory cannot be a symbolic link");
  }

  const canonicalCwd = fs.realpathSync(resolvedCwd);
  const canonicalAncestor = fs.realpathSync(nearestExistingDirectory(targetDir));
  const physicalRelative = path.relative(canonicalCwd, canonicalAncestor);
  if (
    physicalRelative === ".." ||
    physicalRelative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(physicalRelative)
  ) {
    throw new Error("Project directory resolves outside the current directory");
  }
  return targetDir;
}

export function getCdCommand(targetDir: string, cwd: string): string {
  const relativeTarget = path.relative(cwd, targetDir).split(path.sep).join("/");
  return `cd ${shellQuote(relativeTarget)}`;
}

export interface SetupOptions {
  targetDir: string;
  packageManager: PackageManager;
  git: GitSetupChoices;
  run?: typeof runCommand;
}

export class SetupStepError extends Error {
  constructor(
    readonly step: string,
    readonly command: CommandSpec,
    options: ErrorOptions,
  ) {
    super(`${step} failed: ${command.display}`, options);
  }
}

class OperationCancelled extends Error {}

export async function runPostCreateSetup(options: SetupOptions): Promise<void> {
  const run = options.run ?? runCommand;
  logger.beginStep("post-create-setup");

  await runSetupStep(
    "Dependency installation",
    getInstallCommand(options.packageManager),
    run,
    options,
  );
  await runSetupStep("Skill installation", getSkillsInstallCommand(), run, options);

  let gitRoot = options.git.gitRoot;
  if (options.git.initializeGit) {
    const command = { command: "git", args: ["init"], display: "git init" };
    await runSetupStep("Git initialization", command, run, options);
    gitRoot = options.targetDir;
  }

  if (options.git.installPrehook) {
    const command: CommandSpec = {
      command: "vp",
      args: ["config"],
      display: "vp config",
      prependLocalBin: true,
    };
    if (!gitRoot) {
      logger.error("Git root unavailable for prehook installation");
      throw new SetupStepError("Vite+ prehook installation", command, {
        cause: new Error("Git root is unavailable after hook installation"),
      });
    }
    let precommitCommand: string;
    try {
      precommitCommand = getPrecommitCommand(options.targetDir, gitRoot);
      logger.info("Precommit command computed", {
        precommitCommand,
        targetDir: options.targetDir,
        gitRoot,
      });
    } catch (error) {
      logger.error("Prehook validation failed", {
        error: error instanceof Error ? error.message : String(error),
        targetDir: options.targetDir,
        gitRoot,
      });
      throw new SetupStepError("Vite+ prehook validation", command, { cause: error });
    }
    try {
      await runSetupStep("Vite+ prehook installation", command, run, options);
      writePrecommitCommand(options.targetDir, precommitCommand);
      logger.info("Precommit hook written", {
        targetDir: options.targetDir,
        content: precommitCommand,
      });
    } catch (error) {
      logger.warn("Prehook setup failed, attempting rollback");
      try {
        restoreGitHooksPath(gitRoot, options.git.previousHooksPath);
        logger.info("Git hooksPath restored after prehook failure");
      } catch {
        logger.warn("Failed to restore git hooksPath (best-effort rollback)");
        // Preserve the original setup error; rollback is best-effort.
      }
      if (error instanceof SetupStepError) throw error;
      throw new SetupStepError("Vite+ prehook configuration", command, { cause: error });
    }
  }

  logger.endStep("post-create-setup");
}

async function runSetupStep(
  step: string,
  command: CommandSpec,
  run: typeof runCommand,
  options: SetupOptions,
): Promise<void> {
  logger.info(`Running setup step: ${step}`, { command: command.display, cwd: options.targetDir });
  try {
    await run(command, options.targetDir);
    logger.info(`Setup step completed: ${step}`);
  } catch (error) {
    logger.error(`Setup step failed: ${step}`, {
      command: command.display,
      error: error instanceof Error ? error.message : String(error),
    });
    throw new SetupStepError(step, command, { cause: error });
  }
}

export async function runCreateFlow(rawArgs: Record<string, unknown>): Promise<void> {
  const args = rawArgs as CreateFlowArgs;
  logger.beginStep("create-flow");
  logger.info("CLI invoked", { args: rawArgs, cwd: process.cwd() });

  try {
    p.intro(pc.bold(pc.cyan("cnma")));

    const projectInput = await resolveProjectName(args);
    if (!projectInput) return;
    const { projectName, targetDir } = projectInput;

    if (!(await confirmTargetDirectory(targetDir, projectName, args))) return;

    const template = await resolveTemplate(args);
    if (!template) return;

    const gitRoot = findGitRoot(targetDir);
    let git: GitSetupChoices;
    try {
      git = await resolveGitSetupChoices({
        gitRoot,
        existingHooksPath: gitRoot ? findGitHooksPath(gitRoot) : undefined,
        targetDir,
        yes: Boolean(args.yes),
        confirm: confirmOrCancel,
      });
    } catch (error) {
      if (error instanceof OperationCancelled) return;
      throw error;
    }

    const scaffoldSpinner = p.spinner();
    scaffoldSpinner.start("Scaffolding project files...");
    try {
      logger.info("Scaffolding project", { template, targetDir, projectName });
      scaffoldProject({ template, targetDir, projectName });
      scaffoldSpinner.stop("Project scaffolded successfully");
      logger.info("Project scaffolded successfully");
    } catch (error) {
      scaffoldSpinner.stop("Project scaffolding failed", 1);
      logger.error("Project scaffolding failed", {
        error: error instanceof Error ? error.message : String(error),
        template,
        targetDir,
      });
      reportFailure("Project scaffolding", undefined, targetDir, error);
      return;
    }

    const packageManager: PackageManager = "pnpm";
    const setupSpinner = p.spinner();
    setupSpinner.start("Installing dependencies and project integrations...");
    try {
      logger.info("Starting post-create setup", { targetDir, packageManager, git });
      await runPostCreateSetup({ targetDir, packageManager, git });
      setupSpinner.stop("Dependencies and project integrations installed");
      logger.info("Post-create setup completed successfully");
    } catch (error) {
      setupSpinner.stop("Setup failed", 1);
      if (error instanceof SetupStepError) {
        logger.error(`Setup step failed: ${error.step}`, {
          step: error.step,
          command: error.command.display,
          cause: error.cause instanceof Error ? error.cause.message : String(error.cause),
        });
        reportFailure(error.step, error.command, targetDir, error.cause);
      } else {
        logger.error("Project setup failed", {
          error: error instanceof Error ? error.message : String(error),
        });
        reportFailure("Project setup", undefined, targetDir, error);
      }
      return;
    }

    const gitStatus = git.initializeGit
      ? git.installPrehook
        ? "Git initialized and prehook installed"
        : "Git initialized; prehook skipped"
      : git.gitRoot
        ? git.installPrehook
          ? `Prehook installed for ${git.gitRoot}`
          : "Existing Git repository left unchanged"
        : "Git initialization and prehook skipped";

    p.log.info(gitStatus);
    p.outro(pc.green("Project created successfully! 🚀"));
    p.note(
      `${getCdCommand(targetDir, process.cwd())}\n${getRunCommand(packageManager, "dev")}`,
      "Get started with",
    );

    logger.info("Flow completed successfully", {
      projectName,
      targetDir,
      template,
      gitStatus,
    });
    logger.clear();
  } catch (error) {
    logger.fail(error);
    process.exitCode = 1;
  }
}

async function resolveProjectName(
  args: CreateFlowArgs,
): Promise<{ projectName: string; targetDir: string } | undefined> {
  logger.beginStep("resolve-project-name");
  let input = args.dir ?? "";
  if (!input) {
    logger.info("No project name provided, prompting user");
    const result = await p.text({
      message: "Project name:",
      placeholder: DEFAULT_PROJECT_NAME,
      defaultValue: DEFAULT_PROJECT_NAME,
      validate: validateProjectName,
    });
    if (p.isCancel(result)) {
      logger.info("User cancelled project name prompt");
      return cancel();
    }
    input = result.trim() || DEFAULT_PROJECT_NAME;
  }
  logger.info("Project name resolved", { input });

  let targetDir: string;
  try {
    targetDir = resolveTargetDirectory(input, process.cwd());
    logger.info("Target directory resolved", { targetDir, cwd: process.cwd() });
  } catch (error) {
    logger.error("Target directory resolution failed", {
      input,
      error: error instanceof Error ? error.message : String(error),
    });
    p.log.error(error instanceof Error ? error.message : "Invalid project directory");
    process.exitCode = 1;
    return;
  }
  const projectName = path.basename(targetDir);
  const error = validateProjectName(projectName);
  if (error) {
    logger.error("Project name validation failed", { projectName, error });
    p.log.error(error);
    process.exitCode = 1;
    return;
  }
  logger.endStep("resolve-project-name");
  return { projectName, targetDir };
}

async function confirmTargetDirectory(
  targetDir: string,
  projectName: string,
  args: CreateFlowArgs,
): Promise<boolean> {
  if (!fs.existsSync(targetDir) || fs.readdirSync(targetDir).length === 0) {
    logger.info("Target directory is empty or does not exist, proceeding", { targetDir });
    return true;
  }
  if (args.force) {
    logger.info("--force flag set, overwriting existing directory", { targetDir });
    return true;
  }
  if (args.yes) {
    logger.warn("Directory not empty but --yes mode cannot force overwrite", {
      targetDir,
      projectName,
    });
    p.log.error(`Directory "${projectName}" is not empty. Use --force to overwrite it.`);
    process.exitCode = 1;
    return false;
  }
  const result = await p.confirm({
    message: `Directory "${projectName}" is not empty. Remove its contents and continue?`,
    initialValue: false,
  });
  if (p.isCancel(result) || !result) {
    logger.info("User declined to overwrite existing directory", { targetDir });
    cancel();
    return false;
  }
  logger.info("User confirmed overwrite of existing directory", { targetDir });
  return true;
}

async function resolveTemplate(args: CreateFlowArgs): Promise<string | undefined> {
  if (args.template) {
    if (getTemplate(args.template)) {
      logger.info("Template specified via CLI arg", { template: args.template });
      return args.template;
    }
    logger.error("Unknown template specified", { template: args.template });
    p.log.error(`Unknown template "${args.template}"`);
    process.exitCode = 1;
    return;
  }
  if (args.yes) {
    logger.info("Using default template (--yes mode)", { template: DEFAULT_TEMPLATE });
    return DEFAULT_TEMPLATE;
  }

  const result = await p.select({
    message: "Select a template:",
    options: TEMPLATES.map((template) => ({
      value: template.id,
      label: template.label,
      hint: template.hint,
    })),
    initialValue: DEFAULT_TEMPLATE,
  });
  if (p.isCancel(result)) {
    logger.info("User cancelled template selection");
    return cancel();
  }
  logger.info("Template selected", { template: result });
  return result;
}

async function confirmOrCancel(message: string, initialValue = true): Promise<boolean> {
  const result = await p.confirm({ message, initialValue });
  if (p.isCancel(result)) {
    cancel();
    throw new OperationCancelled();
  }
  return result;
}

function cancel(): undefined {
  p.cancel("Operation cancelled");
  return;
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

function shellQuote(value: string): string {
  return `'${value.replaceAll("'", `'"'"'`)}'`;
}

function reportFailure(
  step: string,
  command: CommandSpec | undefined,
  targetDir: string,
  cause: unknown,
): void {
  p.log.error(`${step} failed${cause instanceof Error ? `: ${cause.message}` : ""}`);
  const details = [
    `Project files were kept at ${targetDir}`,
    command ? `Failed command: ${command.display}` : undefined,
  ].filter(Boolean);
  p.note(details.join("\n"), "Setup stopped");
  process.exitCode = 1;
}

export function runCommand(command: CommandSpec, cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const env = { ...process.env };
    if (command.prependLocalBin) {
      env.PATH = `${path.join(cwd, "node_modules", ".bin")}${delimiter}${env.PATH ?? ""}`;
    }

    logger.debug("Spawning command", {
      command: command.command,
      args: command.args,
      cwd,
      prependLocalBin: command.prependLocalBin ?? false,
    });

    const child = spawn(command.command, command.args, { cwd, env, stdio: "pipe" });
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (data: Buffer) => {
      stdout += data.toString();
    });
    child.stderr?.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    child.on("close", (code) => {
      if (code === 0) {
        logger.debug("Command succeeded", {
          command: command.display,
          exitCode: code,
          stdout: stdout.trim().slice(0, 500) || "(empty)",
        });
        resolve();
      } else {
        logger.error("Command failed", {
          command: command.display,
          exitCode: code,
          stdout: stdout.trim().slice(0, 500),
          stderr: stderr.trim().slice(0, 500),
        });
        const message =
          [stdout.trim(), stderr.trim()].filter(Boolean).join("\n") ||
          `Command exited with code ${code}`;
        reject(new Error(message));
      }
    });
    child.on("error", (err) => {
      logger.error("Command spawn error", {
        command: command.display,
        error: err.message,
      });
      reject(err);
    });
  });
}
