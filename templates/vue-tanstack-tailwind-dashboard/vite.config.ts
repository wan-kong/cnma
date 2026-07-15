import { fileURLToPath, URL } from "node:url";
import { defineConfig, loadEnv } from "vite-plus";
import vue from "@vitejs/plugin-vue";
import VueRouter from "vue-router/vite";
import tailwindcss from "@tailwindcss/vite";
import vueDevTools from "vite-plugin-vue-devtools";
import { createViteProxy } from "./build/proxy";
import { analyzer } from "vite-bundle-analyzer";

export default defineConfig(({ mode }) => {
  // 加载当前 mode 下的环境变量（含 .env.* 与 VITE_PROXY_* 代理配置）。
  const env = loadEnv(mode, process.cwd());

  return {
    base: env.VITE_ROOT_PREFIX_URL ? `${env.VITE_ROOT_PREFIX_URL}/` : "/",
    // VueRouter must be registered before the Vue plugin so generated routes are
    // available when SFCs are compiled.
    plugins: [
      VueRouter(),
      vue(),
      tailwindcss(),
      vueDevTools(),
      analyzer({
        analyzerMode: "static",
        openAnalyzer: false,
      }),
    ],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    server: {
      // 代理配置抽离至 .env 文件，由 createViteProxy 解析 VITE_PROXY_* 生成。
      proxy: createViteProxy(env),
    },
    staged: {
      "*": "vp check --fix",
    },
    fmt: {
      ignorePatterns: [".agents/**", "typed-router.d.ts"],
    },
    lint: {
      ignorePatterns: [".agents/**"],
      jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
      rules: { "vite-plus/prefer-vite-plus-imports": "error" },
      options: { typeAware: true, typeCheck: true },
    },
    build: {
      // https://github.com/vueuse/vueuse/issues/5387#issuecomment-4734186040
      rollupOptions: {
        onLog(level, log, defaultHandler) {
          if (log.code === "INVALID_ANNOTATION") return;
          else defaultHandler(level, log);
        },
      },
    },
  };
});
