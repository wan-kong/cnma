import { afterAll, beforeEach, describe, expect, test, vi } from "vite-plus/test";
import type { BackendMenuRoute } from "../api/menu";
import type { RolePayload, UserPayload } from "../api/settings";
import { collectMenuNames, hasMenuPermission } from "../lib/menu-permissions";
import { encrypt, decrypt } from "../utils/encrypt";
import { dispatchMockRequest, MOCK_CAPTCHA_KEY, MOCK_TOKEN, type MockResponse } from "./adapter";
import { resetMockState } from "./state";

class MemoryStorage implements Storage {
  readonly #data = new Map<string, string>();

  get length() {
    return this.#data.size;
  }

  clear() {
    this.#data.clear();
  }

  getItem(key: string) {
    return this.#data.get(key) ?? null;
  }

  key(index: number) {
    return [...this.#data.keys()][index] ?? null;
  }

  removeItem(key: string) {
    this.#data.delete(key);
  }

  setItem(key: string, value: string) {
    this.#data.set(key, value);
  }
}

interface MockEnvelope<T> {
  code: number;
  message?: string;
  data: T;
}

const storage = new MemoryStorage();
const authorization = `JWT ${MOCK_TOKEN}`;

function envelope<T>(response: MockResponse): MockEnvelope<T> {
  return response.data as MockEnvelope<T>;
}

function request(
  method: string,
  url: string,
  options: { data?: unknown; params?: Record<string, unknown>; authorized?: boolean } = {},
) {
  return dispatchMockRequest({
    method,
    url,
    data: options.data,
    params: options.params,
    authorization: options.authorized === false ? undefined : authorization,
  });
}

vi.stubGlobal("localStorage", storage);

beforeEach(() => {
  storage.clear();
  resetMockState();
});

afterAll(() => {
  vi.unstubAllGlobals();
});

describe("登录协议", () => {
  test("XOR 与 Base64 加解密可以往返 Unicode 内容", () => {
    const source = JSON.stringify({ username: "admin", note: "中文与 emoji 🚀" });
    expect(decrypt(encrypt(source))).toBe(source);
  });

  test("Mock 登录校验账号、密码、验证码和 captcha key", () => {
    const valid = {
      username: "admin",
      password: "admin123",
      captcha: "1234",
      key: MOCK_CAPTCHA_KEY,
    };
    const success = request("post", "/api/v1/login/", {
      authorized: false,
      data: { value: encrypt(JSON.stringify(valid)) },
    });
    expect(envelope<{ token: string }>(success)).toMatchObject({
      code: 10200,
      data: { token: MOCK_TOKEN },
    });

    const failure = request("post", "/api/v1/login/", {
      authorized: false,
      data: { value: encrypt(JSON.stringify({ ...valid, password: "wrong" })) },
    });
    expect(envelope(failure)).toMatchObject({
      code: 40001,
      message: "用户名、密码或验证码错误",
    });
  });

  test("受保护接口在没有 JWT 时返回 40100", () => {
    const response = request("get", "/api/v1/menu/router/", { authorized: false });
    expect(envelope(response)).toMatchObject({ code: 40100, message: "登录失效，请重新登录" });
  });
});

describe("菜单权限与记录查询", () => {
  test("保留后端菜单名并正确收集嵌套权限", () => {
    const response = request("get", "/api/v1/menu/router/");
    const menus = envelope<BackendMenuRoute[]>(response).data;
    expect(collectMenuNames(menus)).toEqual([
      "alarm",
      "analysis",
      "settings",
      "settingsUser",
      "settingsRole",
    ]);
    expect(
      collectMenuNames([
        { name: "kept", is_selected: true },
        { name: "hidden", is_selected: false },
        { name: "deleted", is_del: true },
      ]),
    ).toEqual(["kept"]);
    const allowed = new Set(["alarm"]);
    expect(hasMenuPermission(allowed, "alarm")).toBe(true);
    expect(hasMenuPermission(allowed, undefined)).toBe(false);
  });

  test("记录接口支持搜索、排序和服务端分页", () => {
    const response = request("get", "/api/v1/demo/records/", {
      params: { search: "Alex Chen", ordering: "-amount", page: 2, page_size: 4 },
    });
    const result = envelope<{ total: number; data: Array<{ amount: number }> }>(response).data;
    expect(result.total).toBe(10);
    expect(result.data).toHaveLength(4);
    expect(result.data[0]!.amount).toBeGreaterThanOrEqual(result.data[1]!.amount);
  });
});

describe("后台管理 Mock 持久化", () => {
  test("用户和角色 CRUD 会同步写入 localStorage", () => {
    const rolePayload: RolePayload = { role_name: "测试角色", is_use: "1", rmp: [] };
    const createdRole = envelope<{ id: number }>(
      request("post", "/api/v1/role/", { data: rolePayload }),
    ).data;
    request("patch", `/api/v1/role/${createdRole.id}/`, {
      data: { ...rolePayload, role_name: "已更新角色" },
    });

    const userPayload: UserPayload = {
      login_name: "template-user",
      real_name: "模板用户",
      role: [createdRole.id],
      is_use: "1",
      email: "template@example.com",
    };
    const createdUser = envelope<{ id: number }>(
      request("post", "/api/v1/user/", { data: userPayload }),
    ).data;
    request("patch", `/api/v1/user/${createdUser.id}/`, {
      data: { ...userPayload, real_name: "已更新用户" },
    });

    const usersAfterRoleRename = envelope<{
      data: Array<{ id: number; role: Array<{ role_name: string }> }>;
    }>(request("get", "/api/v1/user/", { params: { page: 1, page_size: 100 } })).data.data;
    expect(
      usersAfterRoleRename.find((user) => user.id === createdUser.id)?.role[0]?.role_name,
    ).toBe("已更新角色");

    const roleInUse = request("delete", `/api/v1/role/${createdRole.id}/`);
    expect(envelope(roleInUse)).toMatchObject({
      code: 40900,
      message: "该角色仍被用户使用，无法删除",
    });

    request("post", "/api/v1/user/apikey/", {
      data: { name: "临时密钥", is_enable: true, user: createdUser.id },
    });

    const persisted = JSON.parse(storage.getItem("__PROJECT_NAME__.mock-api.v1") ?? "{}") as {
      roles: Array<{ id: number; role_name: string }>;
      users: Array<{ id: number; real_name: string }>;
    };
    expect(persisted.roles.find((role) => role.id === createdRole.id)?.role_name).toBe(
      "已更新角色",
    );
    expect(persisted.users.find((user) => user.id === createdUser.id)?.real_name).toBe(
      "已更新用户",
    );

    request("delete", `/api/v1/user/${createdUser.id}/`);
    request("delete", `/api/v1/role/${createdRole.id}/`);
    const keysAfterUserDelete = envelope<{ total: number }>(
      request("get", "/api/v1/user/apikey/", { params: { user: createdUser.id } }),
    ).data;
    expect(keysAfterUserDelete.total).toBe(0);

    const nextUser = envelope<{ id: number }>(
      request("post", "/api/v1/user/", { data: { ...userPayload, role: [1] } }),
    ).data;
    expect(nextUser.id).toBeGreaterThan(createdUser.id);
    const afterDelete = JSON.parse(storage.getItem("__PROJECT_NAME__.mock-api.v1") ?? "{}") as {
      roles: Array<{ id: number }>;
      users: Array<{ id: number }>;
    };
    expect(afterDelete.roles.some((role) => role.id === createdRole.id)).toBe(false);
    expect(afterDelete.users.some((user) => user.id === createdUser.id)).toBe(false);
  });
});
