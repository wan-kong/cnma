import type { CommandSpec, PackageManager } from "../types.ts";

export function detectPackageManager(): PackageManager {
  // 仅使用pnpm
  return "pnpm";
}

export function getInstallCommand(pm: PackageManager): CommandSpec {
  switch (pm) {
    case "yarn":
      return { command: "yarn", args: [], display: "yarn" };
    case "pnpm":
      return { command: "pnpm", args: ["install"], display: "pnpm install" };
    case "bun":
      return { command: "bun", args: ["install"], display: "bun install" };
    default:
      return { command: "npm", args: ["install"], display: "npm install" };
  }
}

export function getRunCommand(pm: PackageManager, script: string): string {
  switch (pm) {
    case "yarn":
      return `yarn ${script}`;
    case "pnpm":
      return `pnpm ${script}`;
    case "bun":
      return `bun ${script}`;
    default:
      return `npm run ${script}`;
  }
}
