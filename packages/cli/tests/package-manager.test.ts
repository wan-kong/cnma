import { expect, test } from "vite-plus/test";
import {
  detectPackageManager,
  getInstallCommand,
  getRunCommand,
} from "../src/lib/package-manager.ts";

test("detectPackageManager always returns pnpm", () => {
  expect(detectPackageManager()).toBe("pnpm");
});

test("getInstallCommand returns pnpm install", () => {
  expect(getInstallCommand("pnpm")).toEqual({
    command: "pnpm",
    args: ["install"],
    display: "pnpm install",
  });
});

test("getRunCommand returns pnpm script commands", () => {
  expect(getRunCommand("pnpm", "dev")).toBe("pnpm dev");
});
