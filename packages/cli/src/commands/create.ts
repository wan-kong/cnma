export const createArgs = {
  dir: {
    type: "positional" as const,
    description: "Project directory name",
    required: false,
  },
  template: {
    type: "string" as const,
    description: "Template to use",
    required: false,
  },
  force: {
    type: "boolean" as const,
    description: "Overwrite an existing directory",
    default: false,
  },
  yes: {
    type: "boolean" as const,
    description: "Use defaults for all prompts",
    default: false,
  },
};

export async function runCreateCommand({ args }: { args: Record<string, unknown> }): Promise<void> {
  const { runCreateFlow } = await import("../lib/create-flow.ts");
  await runCreateFlow(args);
}

export function normalizeCreateArgs(rawArgs: string[]): string[] {
  return rawArgs[0] === "create" ? rawArgs.slice(1) : rawArgs;
}
