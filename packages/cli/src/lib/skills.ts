import type { CommandSpec } from "../types.ts";

export function getSkillsInstallCommand(): CommandSpec {
  return {
    command: "npx",
    args: ["--yes", "skills", "experimental_install"],
    display: "npx --yes skills experimental_install",
  };
}
