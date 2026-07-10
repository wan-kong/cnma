import { expect, test } from "vite-plus/test";
import { getSkillsInstallCommand } from "../src/lib/skills.ts";

test("installs the skills declared by the template lock file", () => {
  expect(getSkillsInstallCommand()).toEqual({
    command: "npx",
    args: ["--yes", "skills", "experimental_install"],
    display: "npx --yes skills experimental_install",
  });
});
