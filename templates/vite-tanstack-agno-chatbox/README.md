# Vite TanStack Agno Chatbox

一个面向 AgentOS 的通用聊天模板，使用 Vite+、React 19、TanStack Router、TanStack Query、Tailwind CSS 和 shadcn/ui。

## 功能

- Agent 与 Team 选择、流式对话、附件、Markdown、推理内容和通用工具调用展示
- 会话列表、新建、切换、重命名与删除
- 固定通过同源 `/api` 连接 AgentOS
- 文件路由：`/chat`、`/chat/$session`

模板不包含 Workflow、Dashboard、Settings、Web 端连接配置、用户注册登录或业务定制工具渲染。

## 开始使用

要求 Node.js 24+，并已安装 Vite+ 的 `vp` CLI。

```bash
vp install
vp dev
```

Web 端始终请求同源 `/api`。开发环境由 `vite.config.ts` 将 `/api` 代理到 `http://localhost:7777`；部署时应由网关或 Web 服务将 `/api` 转发至 AgentOS。

## AgentOS 接口

后端需提供 `/config`、Agent/Team run 和 sessions 系列接口。Agent 的人工确认流程还需要 continue run 接口。模板附带的 `scripts/openapi.json` 仅保留聊天所需接口。

重新生成 SDK：

```bash
vp run agno:sdk
```

生成目录 `src/lib/sdk/agno/gen` 不应手工修改。

## 验证

```bash
vp check
vp test
vp build
```
