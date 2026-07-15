import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
    dts: false,
    exports: false,
  },
  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  test: {
    include: ["tests/**/*.test.ts"],
  },
  fmt: {},
});
