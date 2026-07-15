import fs from "node:fs";
import path from "node:path";
import { logger } from "./logger.ts";
import { TEMPLATES_DIR } from "./templates.ts";

const EXCLUDED_TEMPLATE_ENTRIES = new Set([
  "node_modules",
  ".tanstack",
  "dist",
  "dist-ssr",
  ".agents",
  ".vite-hooks",
  ".git",
]);

export interface ScaffoldOptions {
  template: string;
  targetDir: string;
  projectName: string;
}

export function scaffoldProject(options: ScaffoldOptions): void {
  logger.beginStep("scaffold-project");
  logger.info("Starting project scaffold", {
    template: options.template,
    targetDir: options.targetDir,
    projectName: options.projectName,
  });

  const parentDir = path.dirname(options.targetDir);
  fs.mkdirSync(parentDir, { recursive: true });
  if (fs.existsSync(options.targetDir) && fs.lstatSync(options.targetDir).isSymbolicLink()) {
    logger.error("Target is a symbolic link, refusing to overwrite", {
      targetDir: options.targetDir,
    });
    throw new Error(`Refusing to overwrite symbolic link ${options.targetDir}`);
  }

  const stagingDir = fs.mkdtempSync(path.join(parentDir, `.cnma-${options.projectName}-`));
  logger.info("Created staging directory", { stagingDir });
  try {
    scaffoldTemplate({ ...options, targetDir: stagingDir });
    replaceTargetDirectory(stagingDir, options.targetDir);
    logger.info("Project scaffolded successfully", { targetDir: options.targetDir });
  } finally {
    fs.rmSync(stagingDir, { recursive: true, force: true });
    logger.debug("Cleaned up staging directory", { stagingDir });
  }
  logger.endStep("scaffold-project");
}

function replaceTargetDirectory(stagingDir: string, targetDir: string): void {
  if (!fs.existsSync(targetDir)) {
    logger.debug("Target directory does not exist, renaming staging directly", {
      stagingDir,
      targetDir,
    });
    fs.renameSync(stagingDir, targetDir);
    return;
  }

  const backupDir = `${targetDir}.cnma-backup-${process.pid}-${Date.now()}`;
  logger.info("Replacing existing target directory", { targetDir, backupDir });
  fs.renameSync(targetDir, backupDir);
  let installed = false;
  let gitMoved = false;
  try {
    fs.renameSync(stagingDir, targetDir);
    installed = true;
    const previousGit = path.join(backupDir, ".git");
    if (fs.existsSync(previousGit)) {
      fs.renameSync(previousGit, path.join(targetDir, ".git"));
      gitMoved = true;
      logger.debug("Preserved existing .git directory", { targetDir });
    }
  } catch (error) {
    logger.warn("Atomic replacement failed, rolling back", {
      error: error instanceof Error ? error.message : String(error),
    });
    if (gitMoved) {
      fs.renameSync(path.join(targetDir, ".git"), path.join(backupDir, ".git"));
    }
    if (installed) fs.rmSync(targetDir, { recursive: true, force: true });
    fs.renameSync(backupDir, targetDir);
    throw error;
  }

  fs.rmSync(backupDir, { recursive: true, force: true });
  logger.debug("Backup directory cleaned up", { backupDir });
}

export function scaffoldTemplate(options: ScaffoldOptions): void {
  const templateDir = path.join(TEMPLATES_DIR, options.template);
  logger.debug("Looking up template", { templateDir, templatesBase: TEMPLATES_DIR });

  if (!fs.existsSync(templateDir)) {
    logger.error("Template not found", { template: options.template, templateDir });
    throw new Error(`Template "${options.template}" not found at ${templateDir}`);
  }

  fs.mkdirSync(options.targetDir, { recursive: true });
  const fileCount = copyDir(templateDir, options.targetDir, { PROJECT_NAME: options.projectName });
  updatePackageName(options.targetDir, options.projectName);
  logger.info("Template files copied", {
    template: options.template,
    targetDir: options.targetDir,
    fileCount,
  });
}

function copyDir(src: string, dest: string, vars: Record<string, string>): number {
  const entries = fs.readdirSync(src, { withFileTypes: true });
  let count = 0;

  for (const entry of entries) {
    if (EXCLUDED_TEMPLATE_ENTRIES.has(entry.name)) continue;
    const srcPath = path.join(src, entry.name);
    const destName =
      entry.name === "_gitignore" ? ".gitignore" : entry.name === "_npmrc" ? ".npmrc" : entry.name;
    const destPath = path.join(dest, destName);

    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      count += copyDir(srcPath, destPath, vars);
    } else if (isTextFile(entry.name)) {
      const raw = fs.readFileSync(srcPath, "utf8");
      fs.writeFileSync(destPath, replaceTemplateVars(raw, vars));
      count++;
    } else {
      fs.copyFileSync(srcPath, destPath);
      count++;
    }
  }
  return count;
}

function updatePackageName(targetDir: string, projectName: string): void {
  const manifestPath = path.join(targetDir, "package.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as Record<string, unknown>;
  manifest.name = projectName;
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

function replaceTemplateVars(content: string, vars: Record<string, string>): string {
  return content.replace(/__(\w+)__/g, (_, key: string) => vars[key] ?? `__${key}__`);
}

function isTextFile(filename: string): boolean {
  if (["Dockerfile", "Makefile"].includes(filename)) return true;
  return [
    ".json",
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".css",
    ".html",
    ".md",
    ".yml",
    ".yaml",
    ".svg",
    ".txt",
    ".gitignore",
    ".example",
    ".template",
  ].some((extension) => filename.endsWith(extension));
}
