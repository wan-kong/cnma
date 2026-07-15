# create-cnma

前端项目脚手架。一行命令即可创建预配置好 Vite+ 的 React 或 Vue 前端项目。

## 特性

- 🚀 **零配置启动** — 交互式选择模板，自动安装依赖和项目集成
- 🎨 **开箱即用** — 内置 React/TanStack Router 与 Vue/Pinia 管理后台模板
- 🛠 **标准化工具链** — 统一使用 [Vite+](https://viteplus.dev) 管理构建、测试、Lint、格式化
- 🔧 **Git 集成** — 可选初始化 Git 仓库并安装 Vite+ pre-commit hook
- 📦 **模板系统** — 自动发现 `templates/` 目录下的模板，按 `package.json` 描述展示

## 前提条件

- **Node.js** >= 24
- **pnpm** >= 11.11.0（如果未安装，Vite+ 会自动下载）

## 使用

```bash
# 推荐方式（无需全局安装）
pnpm create cnma

# 或全局安装后直接运行
pnpm add -g create-cnma
cnma
```

### CLI 选项

| 选项              | 说明                     | 默认值                      |
| ----------------- | ------------------------ | --------------------------- |
| `[dir]`           | 项目目录名（位置参数）   | 交互式输入，默认 `cnma-app` |
| `--template <id>` | 指定模板 ID              | 交互式选择                  |
| `--force`         | 强制覆盖已有目录         | `false`                     |
| `--yes`           | 跳过所有交互，使用默认值 | `false`                     |

**示例：**

```bash
# 在 my-app 目录下用默认模板创建项目
cnma my-app --yes

# 在 my-app 目录下指定模板，跳过确认
cnma my-app --template vite-react-tanstack-router --yes

# 创建 Vue 管理后台模板
cnma my-dashboard --template vue-tanstack-tailwind-dashboard --yes

# 强制覆盖已有目录
cnma my-app --force
```

### 交互流程

1. **项目名称** — 输入项目目录名，默认 `cnma-app`
2. **模板选择** — 从可用模板列表中选择
3. **Git 初始化** — 如果当前目录不在 Git 仓库中，询问是否 `git init`
4. **Pre-commit Hook** — 询问是否安装 Vite+ pre-commit hook（自动运行 `vp staged`）
5. **自动安装** — 执行 `pnpm install`、安装 Skills、配置 Git hooks

成功后，CLI 会显示进入项目并启动开发服务器的命令。

### 可用模板

| 模板 ID                              | 技术栈                                                                               |
| ------------------------------------ | ------------------------------------------------------------------------------------ |
| `vite-react-tanstack-router`（默认） | React 19 + TanStack Router + Tailwind CSS 4 + shadcn/ui                              |
| `vite-tanstack-agno-chatbox`         | React + TanStack Router + Agno Chat SDK                                              |
| `vue-tanstack-tailwind-dashboard`    | Vue 3 + Vue Router + Pinia Colada + TanStack Vue Table + Tailwind CSS 4 + shadcn-vue |

模板通过 `templates/` 目录自动发现。添加新模板只需在 `templates/` 下新建目录，放入 `package.json` 即可。

## 项目结构

```
cnma/
├── packages/
│   └── cli/                    # create-cnma CLI 包
│       ├── src/
│       │   ├── index.ts        # CLI 入口（citty 命令定义）
│       │   ├── commands/
│       │   │   └── create.ts   # create 命令
│       │   ├── lib/
│       │   │   ├── create-flow.ts   # 创建流程编排
│       │   │   ├── scaffold.ts      # 模板脚手架
│       │   │   ├── templates.ts     # 模板发现
│       │   │   ├── git.ts           # Git 相关操作
│       │   │   ├── package-manager.ts # 包管理器
│       │   │   ├── skills.ts        # Skills 安装
│       │   │   └── logger.ts        # 结构化日志
│       │   └── types.ts         # 共享类型
│       ├── scripts/
│       │   └── copy-templates.mjs   # 构建时将模板复制到 dist/
│       └── tests/
├── templates/
│   ├── vite-react-tanstack-router/  # 默认模板
│   ├── vite-tanstack-agno-chatbox/  # Agno Chat 模板
│   └── vue-tanstack-tailwind-dashboard/ # Vue 管理后台模板
└── vite.config.ts               # 根 Vite+ 配置
```

## 开发

### 环境准备

```bash
# 安装依赖
vp install
```

推荐在 VS Code 中安装推荐的扩展包（`.vscode/extensions.json`）。

### 常用命令

| 命令                                     | 说明                        |
| ---------------------------------------- | --------------------------- |
| `pnpm dev`                               | 监听 CLI 源码变化并重新构建 |
| `vp check`                               | 格式化 + Lint + 类型检查    |
| `vp check --fix`                         | 自动修复格式和 Lint 问题    |
| `vp run -r test`                         | 运行所有工作区的测试        |
| `vp run -r build`                        | 构建所有工作区              |
| `vp check && vp test && vp run -r build` | 完整验证                    |
| `pnpm release`                           | ready + 发布 CLI 包         |

### 本地测试 CLI

```bash
# 构建 CLI
vp check && vp test && vp run -r build

# 直接用 node 运行
node packages/cli/dist/index.mjs my-test-app --yes

# 或用 pnpm link 全局测试
cd packages/cli
pnpm link --global
cnma my-test-app --yes
```

## 发布

### 版本号

使用 [bumpp](https://github.com/unjs/bumpp) 管理版本号，自动同步 `package.json` 和 `packages/cli/package.json` 并创建 Git tag：

```bash
# 自动检测版本类型并 bump
pnpm bump

# 指定版本类型
pnpm bump patch   # 0.0.1 → 0.0.2
pnpm bump minor   # 0.0.1 → 0.1.0
pnpm bump major   # 0.0.1 → 1.0.0

# 指定具体版本
pnpm bump 1.2.3
```

CI 会监听 `v*` tag 的 push 事件自动触发 `.github/workflows/publish.yml` 发布到 npm。

### 手动发布

```bash
# 1. bump 版本号（同步 package.json + 创建 git tag）
pnpm bump patch

# 2. 推送到 GitHub（tag 会触发 CI 自动发布）
git push --follow-tags

# 或本地直接发布
pnpm release
```

### CI 发布流程

推送 `v*` tag 到 GitHub 后，`.github/workflows/publish.yml` 自动执行：

```
checkout → pnpm install → check + test + build → pnpm publish
```

需要在 GitHub 仓库配置 `NPM_TOKEN` secret。

## 发布前检查清单

- [ ] **版本号** — `package.json` 和 `packages/cli/package.json` 中的 `version` 已更新
- [ ] **依赖检查** — `vp install` 无报错，无 outdated 关键依赖
- [ ] **质量门禁** — `vp check && vp test && vp run -r build` 全部通过
- [ ] **模板完整** — `packages/cli/dist/templates/` 包含正确的模板文件
- [ ] **bin 入口** — `packages/cli/dist/index.mjs` 存在且第一行为 `#!/usr/bin/env node`
- [ ] **files 字段** — `packages/cli/package.json` 的 `files` 包含 `dist`
- [ ] **本地验证** — `node packages/cli/dist/index.mjs test-app --yes` 能正常创建项目
- [ ] **Git 状态** — 所有改动已提交，工作区干净
- [ ] **CHANGELOG** — 如有 CHANGELOG，已更新发布说明
- [ ] **.npmrc** — 确认 registry 配置正确（如使用内部 registry）
- [ ] **发布** — `pnpm release` 或 `cd packages/cli && pnpm publish`

## 技术栈

- [Vite+](https://viteplus.dev) — 统一前端工具链
- [citty](https://github.com/unjs/citty) — 轻量 CLI 框架
- [@clack/prompts](https://github.com/natemoo-re/clack) — 美观的交互式终端提示
- [pnpm](https://pnpm.io) — 高效的包管理器
- TypeScript
