import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: "./scripts/openapi.json",
  output: "src/lib/sdk/agno/gen",
  plugins: [
    {
      name: "@hey-api/client-next",
      exportFromIndex: false,
      runtimeConfigPath: "@/lib/sdk/agno/config",
    },
    {
      name: "@tanstack/react-query",
    },
    {
      name: "@hey-api/typescript",
      exportFromIndex: true,
    },
    {
      name: "@hey-api/sdk",
      examples: true,
      operations: {
        strategy: "single",
      },
      exportFromIndex: false,
      paramsStructure: "grouped",
      auth: true,
    },
  ],
});
