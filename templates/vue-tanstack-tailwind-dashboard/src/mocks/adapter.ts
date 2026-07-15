import { AxiosHeaders, type AxiosAdapter, type AxiosResponse } from "axios";
import type {
  BackendRoleMenu,
  BackendUserApiKey,
  GConfigDto,
  RolePayload,
  SystemRole,
  SystemUser,
  UserApiKeyPayload,
  UserPayload,
} from "../api/settings";
import type {
  DemoAnalytics,
  DemoCategoryMetric,
  DemoRecord,
  DemoRecordQuery,
  DemoSummary,
  DemoTrendPoint,
} from "../api/demo";
import { IS_MOCK_API, SUCCESS_CODE, UNAUTHORIZED_CODE } from "../api/config";
import { decrypt } from "../utils/encrypt";
import { getMockState, nextMockId, saveMockState } from "./state";

export const MOCK_TOKEN = "mock-jwt-token";
export const MOCK_CAPTCHA_KEY = "mock-captcha-key";

export interface MockRequest {
  method: string;
  url: string;
  data?: unknown;
  params?: Record<string, unknown>;
  authorization?: string;
  responseType?: string;
}

export interface MockResponse {
  status: number;
  data: unknown;
  headers?: Record<string, string>;
}

interface ApiResult<T> {
  code: number;
  message?: string;
  data: T;
}

function success<T>(data: T): MockResponse {
  return { status: 200, data: { code: SUCCESS_CODE, data } satisfies ApiResult<T> };
}

function failure(message: string, code = 40000): MockResponse {
  return { status: 200, data: { code, message, data: null } satisfies ApiResult<null> };
}

function parseBody<T>(data: unknown): T {
  if (typeof data === "string") return JSON.parse(data) as T;
  return (data ?? {}) as T;
}

function stringParam(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function pageResult<T>(items: T[], params: Record<string, unknown> = {}) {
  const page = Math.max(1, Number(params.page ?? 1));
  const pageSize = Math.max(1, Number(params.page_size ?? 10));
  const start = (page - 1) * pageSize;
  return { total: items.length, data: items.slice(start, start + pageSize) };
}

function isAuthorized(authorization?: string): boolean {
  if (!authorization) return false;
  return IS_MOCK_API ? authorization === `JWT ${MOCK_TOKEN}` : true;
}

function normalizePath(url: string): string {
  const pathname = url.split("?")[0] || "/";
  return pathname.replace(/\/+/g, "/");
}

function mockProfile() {
  return {
    token: MOCK_TOKEN,
    user_id: 1,
    username: "admin",
    real_name: "模板管理员",
    roles: ["管理员"],
    is_superuser: false,
  };
}

function mockMenuRoutes() {
  return [
    { path: "/", name: "alarm", is_selected: true },
    { path: "/analytics", name: "analysis", is_selected: true },
    {
      path: "/settings",
      name: "settings",
      is_selected: true,
      children: [
        { path: "/settings/user", name: "settingsUser", is_selected: true },
        { path: "/settings/role", name: "settingsRole", is_selected: true },
      ],
    },
  ];
}

function permissionMenus(): BackendRoleMenu[] {
  return [
    { id: 1, parent: null, name: "alarm", front_end_path: { meta: { title: "概览与记录" } } },
    { id: 2, parent: null, name: "analysis", front_end_path: { meta: { title: "数据分析" } } },
    {
      id: 3,
      parent: null,
      name: "settings",
      front_end_path: { meta: { title: "系统设置" } },
      permissions: [
        { id: 31, name: "用户管理" },
        { id: 32, name: "角色管理" },
      ],
    },
  ];
}

function demoTrend(): DemoTrendPoint[] {
  return [
    { label: "周一", value: 42, secondary: 31 },
    { label: "周二", value: 56, secondary: 38 },
    { label: "周三", value: 49, secondary: 44 },
    { label: "周四", value: 68, secondary: 47 },
    { label: "周五", value: 74, secondary: 52 },
    { label: "周六", value: 63, secondary: 55 },
    { label: "周日", value: 82, secondary: 61 },
  ];
}

function demoSummary(records: DemoRecord[]): DemoSummary {
  const active = records.filter((record) => record.status === "active").length;
  const pending = records.filter((record) => record.status === "pending").length;
  const completed = records.filter((record) => record.status === "archived").length;
  return {
    total: records.length,
    active,
    pending,
    completionRate: Math.round((completed / records.length) * 100),
    trend: demoTrend(),
    recent: [...records].sort((a, b) => b.updated_at.localeCompare(a.updated_at)).slice(0, 6),
  };
}

function demoAnalytics(records: DemoRecord[]): DemoAnalytics {
  const countBy = (values: string[]): DemoCategoryMetric[] =>
    [...new Set(values)].map((label) => ({
      label,
      value: values.filter((value) => value === label).length,
    }));
  return {
    trend: demoTrend(),
    categories: countBy(records.map((record) => record.category)),
    status: countBy(records.map((record) => record.status)),
  };
}

function handleDemo(request: MockRequest, path: string): MockResponse | undefined {
  const state = getMockState();
  if (path === "/api/v1/demo/summary/" && request.method === "get") {
    return success(demoSummary(state.records));
  }
  if (path === "/api/v1/demo/analytics/" && request.method === "get") {
    return success(demoAnalytics(state.records));
  }
  if (path === "/api/v1/demo/records/" && request.method === "get") {
    const params = request.params ?? {};
    const query = params as DemoRecordQuery;
    let records = [...state.records];
    if (query.search) {
      const keyword = query.search.toLowerCase();
      records = records.filter((record) =>
        [record.name, record.owner, record.category].some((value) =>
          value.toLowerCase().includes(keyword),
        ),
      );
    }
    if (query.status) records = records.filter((record) => record.status === query.status);
    if (query.updated_after) {
      records = records.filter((record) => record.updated_at >= query.updated_after!);
    }
    if (query.updated_before) {
      records = records.filter((record) => record.updated_at <= query.updated_before!);
    }
    const ordering = query.ordering ?? "-updated_at";
    const descending = ordering.startsWith("-");
    const key = ordering.replace(/^[+-]/, "") as keyof DemoRecord;
    records.sort((left, right) => {
      const result = String(left[key] ?? "").localeCompare(String(right[key] ?? ""), "zh-CN", {
        numeric: true,
      });
      return descending ? -result : result;
    });
    return success(pageResult(records, params));
  }

  const detailMatch = path.match(/^\/api\/v1\/demo\/records\/(\d+)\/$/);
  if (detailMatch) {
    const id = Number(detailMatch[1]);
    const record = state.records.find((item) => item.id === id);
    if (!record) return failure("记录不存在", 40400);
    if (request.method === "get") return success(record);
    if (request.method === "patch") {
      const payload = parseBody<Partial<DemoRecord>>(request.data);
      if (payload.status) record.status = payload.status;
      record.updated_at = new Date().toISOString();
      saveMockState(state);
      return success(record);
    }
  }
  return undefined;
}

function handleRoles(request: MockRequest, path: string): MockResponse | undefined {
  const state = getMockState();
  if (path === "/api/v1/menu/role_mp/" && request.method === "get") {
    return success(permissionMenus());
  }
  if (path === "/api/v1/role/" && request.method === "get") {
    const name = stringParam(request.params?.name).toLowerCase();
    const roles = name
      ? state.roles.filter((role) => role.role_name.toLowerCase().includes(name))
      : state.roles;
    return success(pageResult(roles, request.params));
  }
  if (path === "/api/v1/role/" && request.method === "post") {
    const payload = parseBody<RolePayload>(request.data);
    const role: SystemRole = {
      id: nextMockId(state, "roles"),
      role_name: payload.role_name,
      is_use: payload.is_use,
      cst_update: new Date().toISOString(),
      rmp: payload.rmp,
    };
    state.roles.push(role);
    saveMockState(state);
    return success(role);
  }
  const match = path.match(/^\/api\/v1\/role\/(\d+)\/$/);
  if (!match) return undefined;
  const id = Number(match[1]);
  const role = state.roles.find((item) => item.id === id);
  if (!role) return failure("角色不存在", 40400);
  if (request.method === "get") return success(role);
  if (request.method === "patch") {
    Object.assign(role, parseBody<RolePayload>(request.data), {
      cst_update: new Date().toISOString(),
    });
    state.users.forEach((user) => {
      user.role.forEach((assignedRole) => {
        if (assignedRole.id === role.id) assignedRole.role_name = role.role_name;
      });
    });
    saveMockState(state);
    return success(role);
  }
  if (request.method === "delete") {
    if (state.users.some((user) => user.role.some((assignedRole) => assignedRole.id === id))) {
      return failure("该角色仍被用户使用，无法删除", 40900);
    }
    state.roles = state.roles.filter((item) => item.id !== id);
    saveMockState(state);
    return success(null);
  }
  return undefined;
}

function handleUsers(request: MockRequest, path: string): MockResponse | undefined {
  const state = getMockState();
  if (path === "/api/v1/user/reset/" && request.method === "post") return success(null);
  if (path === "/api/v1/user/" && request.method === "get") {
    const username = stringParam(request.params?.username).toLowerCase();
    const roleId = Number(request.params?.role_id ?? 0);
    const status = stringParam(request.params?.status);
    const users = state.users.filter((user) => {
      if (username && !user.login_name.toLowerCase().includes(username)) return false;
      if (roleId && !user.role.some((role) => role.id === roleId)) return false;
      if (status && String(user.is_use) !== status) return false;
      return true;
    });
    return success(pageResult(users, request.params));
  }
  if (path === "/api/v1/user/" && request.method === "post") {
    const payload = parseBody<UserPayload>(request.data);
    const roles = state.roles
      .filter((role) => payload.role.includes(role.id))
      .map((role) => ({ id: role.id, role_name: role.role_name }));
    const user: SystemUser = {
      id: nextMockId(state, "users"),
      login_name: payload.login_name,
      real_name: payload.real_name,
      role: roles,
      phone: payload.phone,
      email: payload.email,
      cst_expire: payload.cst_expire,
      is_use: payload.is_use,
      last_login: null,
    };
    state.users.push(user);
    saveMockState(state);
    return success(user);
  }
  const match = path.match(/^\/api\/v1\/user\/(\d+)\/$/);
  if (!match) return undefined;
  const id = Number(match[1]);
  const user = state.users.find((item) => item.id === id);
  if (!user) return failure("用户不存在", 40400);
  if (request.method === "patch") {
    const payload = parseBody<UserPayload>(request.data);
    Object.assign(user, payload, {
      role: state.roles
        .filter((role) => payload.role.includes(role.id))
        .map((role) => ({ id: role.id, role_name: role.role_name })),
    });
    saveMockState(state);
    return success(user);
  }
  if (request.method === "delete") {
    state.users = state.users.filter((item) => item.id !== id);
    state.apiKeys = state.apiKeys.filter((item) => item.user !== id);
    saveMockState(state);
    return success(null);
  }
  return undefined;
}

function handleApiKeys(request: MockRequest, path: string): MockResponse | undefined {
  const state = getMockState();
  if (path === "/api/v1/user/apikey/" && request.method === "get") {
    const userId = Number(request.params?.user ?? 0);
    const name = stringParam(request.params?.name).toLowerCase();
    const keys = state.apiKeys.filter((key) => {
      if (userId && key.user !== userId) return false;
      return !name || key.name.toLowerCase().includes(name);
    });
    return success(pageResult(keys, request.params));
  }
  if (path === "/api/v1/user/apikey/" && request.method === "post") {
    const payload = parseBody<UserApiKeyPayload>(request.data);
    const item: BackendUserApiKey = {
      ...payload,
      id: nextMockId(state, "apiKeys"),
      key: payload.key || `demo-${crypto.randomUUID()}`,
    };
    state.apiKeys.push(item);
    saveMockState(state);
    return success(item);
  }
  const match = path.match(/^\/api\/v1\/user\/apikey\/(\d+)\/$/);
  if (!match) return undefined;
  const id = Number(match[1]);
  const key = state.apiKeys.find((item) => item.id === id);
  if (!key) return failure("API Key 不存在", 40400);
  if (request.method === "patch") {
    Object.assign(key, parseBody<UserApiKeyPayload>(request.data));
    saveMockState(state);
    return success(key);
  }
  if (request.method === "delete") {
    state.apiKeys = state.apiKeys.filter((item) => item.id !== id);
    saveMockState(state);
    return success(null);
  }
  return undefined;
}

function handleConfig(request: MockRequest, path: string): MockResponse | undefined {
  const state = getMockState();
  if (path === "/api/v1/configuration/gconfig/detail/" && request.method === "get") {
    const key = stringParam(request.params?.key);
    return success(state.configs.find((config) => config.key === key) ?? state.configs[0]);
  }
  const match = path.match(/^\/api\/v1\/configuration\/gconfig\/(\d+)\/$/);
  if (!match || request.method !== "patch") return undefined;
  const id = Number(match[1]);
  const config = state.configs.find((item) => item.id === id);
  if (!config) return failure("配置不存在", 40400);
  Object.assign(config, parseBody<Partial<GConfigDto>>(request.data), {
    updated_at: new Date().toISOString(),
  });
  saveMockState(state);
  return success(config);
}

export function dispatchMockRequest(request: MockRequest): MockResponse {
  const path = normalizePath(request.url);
  const method = request.method.toLowerCase();
  const normalized = { ...request, method };

  if (path === "/api/v1/captcha/" && method === "get") {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="40"><rect width="120" height="40" rx="6" fill="#f0fdfa"/><text x="60" y="27" text-anchor="middle" font-family="monospace" font-size="22" font-weight="700" fill="#0f766e">1234</text></svg>`;
    return {
      status: 200,
      data: new Blob([svg], { type: "image/svg+xml" }),
      headers: { key: MOCK_CAPTCHA_KEY, "content-type": "image/svg+xml" },
    };
  }

  if (path === "/api/v1/login/" && method === "post") {
    try {
      const body = parseBody<{ value?: string }>(normalized.data);
      const payload = JSON.parse(decrypt(body.value ?? "")) as {
        username?: string;
        password?: string;
        captcha?: string;
        key?: string | null;
      };
      if (
        payload.username !== "admin" ||
        payload.password !== "admin123" ||
        payload.captcha !== "1234" ||
        payload.key !== MOCK_CAPTCHA_KEY
      ) {
        return failure("用户名、密码或验证码错误", 40001);
      }
      return success(mockProfile());
    } catch {
      return failure("登录参数无法解析", 40002);
    }
  }

  if (!isAuthorized(normalized.authorization)) {
    return failure("登录失效，请重新登录", UNAUTHORIZED_CODE);
  }

  if (path === "/api/v1/user/info/" && method === "get") return success(mockProfile());
  if (path === "/api/v1/user/logout/" && method === "get") return success(null);
  if (path === "/api/v1/menu/router/" && method === "get") return success(mockMenuRoutes());

  return (
    handleDemo(normalized, path) ??
    handleRoles(normalized, path) ??
    handleUsers(normalized, path) ??
    handleApiKeys(normalized, path) ??
    handleConfig(normalized, path) ??
    failure(`Mock API 未实现：${method.toUpperCase()} ${path}`, 40400)
  );
}

export const mockApiAdapter: AxiosAdapter = async (config) => {
  await new Promise((resolve) => setTimeout(resolve, 120));
  const authorizationHeader = config.headers?.get("Authorization");
  const authorization = typeof authorizationHeader === "string" ? authorizationHeader : "";
  const response = dispatchMockRequest({
    method: config.method ?? "get",
    url: config.url ?? "/",
    data: config.data,
    params: config.params as Record<string, unknown> | undefined,
    authorization,
    responseType: config.responseType,
  });
  return {
    data: response.data,
    status: response.status,
    statusText: response.status === 200 ? "OK" : "Error",
    headers: AxiosHeaders.from(response.headers),
    config,
  } satisfies AxiosResponse;
};
