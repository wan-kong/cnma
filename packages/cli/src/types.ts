export type PackageManager = "npm" | "pnpm" | "yarn" | "bun";

export interface Template {
  id: string;
  label: string;
  hint: string;
}

export interface CreateFlowArgs {
  dir?: string;
  template?: string;
  force?: boolean;
  yes?: boolean;
}

export interface CommandSpec {
  command: string;
  args: string[];
  display: string;
  prependLocalBin?: boolean;
}
