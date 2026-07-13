# Vite + React + TanStack Router + shadcn/ui

基于 Vite+ 工具链的 React SPA 模板，预配置了 TanStack Router（文件路由）、TanStack Query、统一 Fetch 请求层、Tailwind CSS v4 和完整的 shadcn/ui 组件库。

## 技术栈

- **[Vite+](https://viteplus.dev)** — 统一前端工具链（构建/Lint/格式化/测试）
- **[React](https://react.dev)** 19 — UI 框架
- **[TanStack Router](https://tanstack.com/router)** — 类型安全的文件路由
- **[TanStack Query](https://tanstack.com/query)** — 服务端状态、缓存与 Mutation 管理
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
├── api/
│   ├── client.ts         # HTTP Client 实例与 Fetch 适配器
│   ├── mock-fetch.ts     # Todo Demo 的本地模拟接口
│   └── todos.ts          # Todo DTO 与 CRUD 接口
├── queries/
│   └── todos.ts          # Query Key、查询配置与 Mutation
├── routes/
│   ├── __root.tsx        # 根布局
│   └── index.tsx         # 首页
├── components/
│   └── ui/               # shadcn/ui 组件
├── hooks/                # 自定义 Hooks
└── lib/
    ├── http.ts           # 统一 Fetch 请求封装
    ├── http.test.ts      # HTTP 层单元测试
    ├── query-client.ts   # TanStack Query 全局配置
    └── utils.ts          # cn() 等工具函数
```

## 请求与 Query 分层

- `lib/http.ts` 只处理协议层能力：Base URL、查询参数、JSON/FormData、超时、取消请求、响应解析与 `HttpError`。
- `api/*.ts` 定义领域 DTO 和接口函数，不在组件中拼接 URL。
- `queries/*.ts` 定义稳定的 Query Key、缓存策略、Mutation 以及失效范围。
- `routes` 和组件只负责交互与渲染，不直接调用 `fetch`。

Todo Demo 默认向 `createHttpClient` 注入 `mockFetch`，数据保存在 `localStorage`，无需启动后端。接入真实接口时，在 `src/api/client.ts` 中删除 `fetch: mockFetch`，并按需配置 `baseUrl` 即可。

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
