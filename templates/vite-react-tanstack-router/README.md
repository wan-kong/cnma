# Vite + React + TanStack Router + shadcn/ui

基于 Vite+ 工具链的 React SPA 模板，预配置了 TanStack Router（文件路由）、Tailwind CSS v4 和完整的 shadcn/ui 组件库。

## 技术栈

- **[Vite+](https://viteplus.dev)** — 统一前端工具链（构建/Lint/格式化/测试）
- **[React](https://react.dev)** 19 — UI 框架
- **[TanStack Router](https://tanstack.com/router)** — 类型安全的文件路由
- **[Tailwind CSS](https://tailwindcss.com)** v4 — 原子化 CSS 框架
- **[shadcn/ui](https://ui.shadcn.com)** — 可复制的 UI 组件库

## 快速开始

```bash
pnpm install
pnpm dev
```

## 命令

| 命令             | 说明                     |
| ---------------- | ------------------------ |
| `pnpm dev`       | 启动开发服务器           |
| `pnpm build`     | 生产构建                 |
| `pnpm preview`   | 预览生产构建             |
| `pnpm test`      | 运行测试（Vitest）       |
| `pnpm format`    | 格式化 + Lint 修复       |
| `vp check --fix` | 格式化 + Lint + 类型检查 |

## 项目结构

```
src/
├── main.tsx              # 应用入口
├── router.tsx            # TanStack Router 配置
├── styles.css            # Tailwind CSS 入口
├── routeTree.gen.ts      # 自动生成的路由树（勿手动编辑）
├── routes/
│   ├── __root.tsx        # 根布局
│   └── index.tsx         # 首页
├── components/
│   └── ui/               # shadcn/ui 组件
├── hooks/                # 自定义 Hooks
└── lib/
    └── utils.ts          # cn() 等工具函数
```

## 路由

使用 TanStack Router 的**文件路由**：`src/routes/` 下的文件自动映射为路由。

```tsx
// src/routes/about.tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  component: AboutPage,
});

function AboutPage() {
  return <div>About</div>;
}
```

路由树文件 `src/routeTree.gen.ts` 由 `@tanstack/router-plugin` 自动生成，无需手动维护。

## 组件

shadcn/ui 组件位于 `src/components/ui/`，按需使用。用 shadcn CLI 添加新组件：

```bash
npx shadcn add dialog
```

## 测试

使用 [Vitest](https://vitest.dev) + [Testing Library](https://testing-library.com)：

```bash
pnpm test
```

## Demo 文件

模板包含完整的 shadcn/ui 组件作为开发参考。与业务无关的 demo 文件可以安全删除。
