/// <reference types="vite/client" />
/// <reference types="vite-plus/client" />

// Fallback declaration so tooling without the Vue language plugin can resolve
// `*.vue` imports. `vue-tsc` generates precise per-component types that take
// precedence over this ambient glob.
declare module "*.vue" {
  import type { DefineComponent } from "vue";

  const component: DefineComponent<Record<string, never>, Record<string, never>, unknown>;
  export default component;
}

interface ImportMetaEnv {
  readonly VITE_API_MODE?: "mock" | "remote";
  readonly VITE_GLOBAL_APP_TITLE?: string;
  readonly VITE_ROOT_PREFIX_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
