# create-cnma

前端项目脚手架 CLI。基于 [citty](https://github.com/unjs/citty) 和 [@clack/prompts](https://github.com/natemoo-re/clack) 构建，提供交互式项目创建体验。

## 安装

```bash
# 无需全局安装（推荐）
pnpm create cnma

# 全局安装
pnpm add -g create-cnma
cnma
```

## CLI 参考

```
cnma [dir] [options]
```

### 参数

| 参数    | 类型         | 说明                                            |
| ------- | ------------ | ----------------------------------------------- |
| `[dir]` | `positional` | 项目目录名。不提供时交互式输入，默认 `cnma-app` |

### 选项

| 选项              | 类型      | 默认值  | 说明                         |
| ----------------- | --------- | ------- | ---------------------------- |
| `--template <id>` | `string`  | —       | 指定模板 ID，跳过模板选择    |
| `--force`         | `boolean` | `false` | 强制覆盖已有非空目录         |
| `--yes`           | `boolean` | `false` | 跳过所有交互，全部使用默认值 |

### 退出码

| 码  | 含义               |
| --- | ------------------ |
| `0` | 成功               |
| `1` | 用户取消或执行失败 |

## 架构

```
src/
├── index.ts              # CLI 入口，citty 命令定义
├── commands/
│   └── create.ts         # create 命令的 args / run / normalize
└── lib/
    ├── create-flow.ts    # 核心流程编排
    ├── scaffold.ts       # 项目脚手架（模板复制 + 变量替换）
    ├── templates.ts      # 模板自动发现
    ├── git.ts            # Git 操作（detect/init/hooksPath/pre-commit）
    ├── package-manager.ts # 包管理器命令生成
    ├── skills.ts         # Skills 安装命令
    └── logger.ts         # 结构化日志（内存缓冲 + 失败时写 ~/.cnma/）
```

### 核心流程（`create-flow.ts`）

```
resolveProjectName → confirmTargetDirectory → resolveTemplate
→ resolveGitSetupChoices → scaffoldProject → runPostCreateSetup
```

`runPostCreateSetup` 依次执行：

1. `pnpm install`
2. `npx --yes skills experimental_install`
3. 可选：`git init`
4. 可选：`vp config` + 写入 pre-commit hook 脚本

### 脚手架（`scaffold.ts`）

- 使用**临时目录（staging directory）**避免部分写入：先在 `.cnma-{name}-` 下构建完整项目，再原子 rename 到目标目录
- 已有目录会被备份到 `{targetDir}.cnma-backup-{pid}-{timestamp}` 后再替换，保留原有 `.git` 目录
- 替换规则：
  - `__PROJECT_NAME__` → 实际项目名（在文本文件中）
  - `_gitignore` → `.gitignore`
  - `_npmrc` → `.npmrc`
  - `package.json` 的 `name` 字段自动更新为项目名
  - 排除 `node_modules`、`.tanstack`、`dist`、`.agents`、`.vite-hooks`、`.git`

### 模板发现（`templates.ts`）

- 自动扫描 `templates/` 目录
- 每个子目录是一个模板，`id` 为目录名
- 模板的 `label` 和 `hint` 从 `package.json` 的 `name` 和 `description` 字段读取
- 解析顺序：`dist/templates` → 工作区 `templates/`（开发模式自动回退）

### 错误处理

- 成功时静默退出
- 失败时：
  - 在终端输出错误信息
  - 写入结构化日志到 `~/.cnma/cnma-error-{timestamp}.log`
  - 保持项目文件不动，方便手动修复

## 添加新模板

在 `templates/` 目录下新建子目录，包含完整的项目文件和 `package.json`：

```json
{
  "name": "my-template",
  "description": "Vite + Vue + ...",
  "private": true,
  "version": "0.0.0"
}
```

模板中的文本文件支持 `__PROJECT_NAME__` 变量替换。构建时 `copy-templates.mjs` 会自动将其复制到 `dist/templates/`。

当前内置模板：

- `vite-react-tanstack-router`（默认）
- `vite-tanstack-agno-chatbox`
- `vue-tanstack-tailwind-dashboard`

## 开发

```bash
# 安装依赖
pnpm install

# 监听构建
pnpm dev

# 检查 + 测试
vp check && vp test

# 本地运行
node dist/index.mjs test-app --yes
```
