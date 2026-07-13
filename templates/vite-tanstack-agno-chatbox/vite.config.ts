import { defineConfig } from "vite-plus";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { fileURLToPath } from "node:url";
import babel from "@rolldown/plugin-babel";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  build: {
    chunkSizeWarningLimit: 1000,
  },
  test: {
    passWithNoTests: true,
  },
  plugins: [
    // MUST be before @vitejs/plugin-react
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    react({}),
    babel({
      presets: [reactCompilerPreset()],
    }),
    tailwindcss(),
  ],
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  server: {
    port: 7930,
    proxy: {
      "/api": {
        target: "https://127.0.0.1:7777/",
        changeOrigin: true,
        secure: false,
        rewrite: (p) => p.replace(/^\/api/, ""),
      },
    },
  },
  // VitePlus: lint via Oxlint (replaces Biome)
  lint: {
    ignorePatterns: ["src/lib/sdk/agno/gen/**", "src/routeTree.gen.ts", "dist/**", ".claude"],
  },
  // VitePlus: format via Oxfmt (replaces Biome)
  fmt: {
    singleQuote: true,
    semi: true,
    ignorePatterns: [
      "src/lib/sdk/agno/gen/**",
      "src/routeTree.gen.ts",
      "src/typeset.css",
      "dist/**",
      ".claude",
      "pnpm-lock.yaml",
    ],
  },
});
