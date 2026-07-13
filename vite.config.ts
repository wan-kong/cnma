import { defineConfig } from "vite-plus";

export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  fmt: {
    ignorePatterns: [
      "templates/**/src/routeTree.gen.ts",
      "templates/**/src/lib/sdk/agno/gen/**",
      "templates/**/src/typeset.css",
      "templates/**/pnpm-lock.yaml",
    ],
  },
  lint: {
    ignorePatterns: ["templates/**/src/lib/sdk/agno/gen/**"],
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    rules: { "vite-plus/prefer-vite-plus-imports": "error" },
    options: { typeAware: true, typeCheck: true },
  },
  run: {
    cache: true,
  },
});
