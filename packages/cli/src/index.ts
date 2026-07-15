#!/usr/bin/env node
import { defineCommand, runMain } from "citty";
import { createArgs, normalizeCreateArgs, runCreateCommand } from "./commands/create.ts";
import pkg from "../package.json" with { type: "json" };

const mainCommand = defineCommand({
  meta: {
    name: "cnma",
    version: pkg.version,
    description: "Create a project from an opinionated template.",
  },
  args: createArgs,
  run: runCreateCommand,
});

void runMain(mainCommand, { rawArgs: normalizeCreateArgs(process.argv.slice(2)) });
