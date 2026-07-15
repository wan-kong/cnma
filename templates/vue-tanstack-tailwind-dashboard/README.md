# Vue TanStack Tailwind Dashboard

可独立运行的 Vue 管理后台模板，默认使用本地 Mock API，无需后端即可体验登录、鉴权、数据看板和后台管理。

## 技术栈

- Vue 3、Vue Router 5 文件路由、Pinia、Pinia Colada
- Axios、TanStack Vue Table、Unovis、VueUse
- Tailwind CSS 4、shadcn-vue（完整保留 `src/components/ui`）
- VeeValidate、Zod、Markstream、Vite+
- Docker、Nginx、可配置子路径部署

## 开始使用

```bash
vp install
vp dev
```

默认使用 Mock 模式，演示登录信息为：

- 用户名：`admin`
- 密码：`admin123`
- 验证码：`1234`

建议从 `.env.example` 复制本地环境文件：

```bash
cp .env.example .env.development.local
```

## 页面

- `/`：统计卡片、趋势图和最近记录
- `/records`：搜索、日期筛选、排序、分页、行选择及详情弹窗
- `/analytics`：趋势、状态和分类汇总
- `/settings`：系统配置
- `/settings/user`：用户与 API Key 管理
- `/settings/role`：角色与权限管理

## API 模式

| 变量                    | 默认值                             | 说明                                                         |
| ----------------------- | ---------------------------------- | ------------------------------------------------------------ |
| `VITE_API_MODE`         | `mock`                             | `mock` 使用模板内置 API；`remote` 连接真实鉴权和后台管理接口 |
| `VITE_GLOBAL_APP_TITLE` | 项目名称                           | 页面标题和品牌名称                                           |
| `VITE_ROOT_PREFIX_URL`  | 空                                 | 部署根路径，例如 `/dashboard`，不要以 `/` 结尾               |
| `VITE_PROXY_BASE`       | `["/api","http://localhost:8000"]` | 仅开发服务器使用的代理配置                                   |

`remote` 模式保留 `/api/v1/captcha/`、`/api/v1/login/`、`/api/v1/user/info/`、`/api/v1/user/logout/`、`/api/v1/menu/router/` 及用户、角色、API Key 接口协议。概览、记录和分析页面始终通过 `/api/v1/demo/*` 使用本地 Mock 数据，不依赖真实业务后端。

登录协议保留图形验证码、XOR + Base64 参数加密、JWT、URL Token 登录、会话恢复和 401/40100 统一登出。兼容的后端菜单权限键如下：

URL Token 会在发起校验请求前从地址栏移除，并通过 `Referrer-Policy: no-referrer` 避免后续请求泄露来源。远程身份服务仍应下发短时、一次性或可快速撤销的 Token，避免入口访问日志中的查询参数被长期复用。

| 页面           | 权限键         |
| -------------- | -------------- |
| 概览、数据记录 | `alarm`        |
| 数据分析       | `analysis`     |
| 系统设置       | `settings`     |
| 用户管理       | `settingsUser` |
| 角色管理       | `settingsRole` |

## 验证

```bash
vp check
vp test
vp build
```

## Docker 部署

根路径 Mock 部署：

```bash
make build
```

子路径、远程 API 部署：

```bash
make build ROOT_PREFIX=/dashboard API_MODE=remote APP_TITLE="My Dashboard"
```

也可以使用 `docker compose up --build`，通过同名环境变量设置构建参数，并用 `BACKEND_URL` 指定 Nginx 的后端代理目标。
