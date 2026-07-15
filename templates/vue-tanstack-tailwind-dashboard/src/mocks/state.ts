import type { BackendUserApiKey, GConfigDto, SystemRole, SystemUser } from "../api/settings";
import type { DemoRecord, DemoRecordStatus } from "../api/demo";

export interface MockState {
  schemaVersion: 1;
  nextIds: {
    roles: number;
    users: number;
    apiKeys: number;
  };
  roles: SystemRole[];
  users: SystemUser[];
  apiKeys: BackendUserApiKey[];
  configs: GConfigDto[];
  records: DemoRecord[];
}

const STORAGE_KEY = "__PROJECT_NAME__.mock-api.v1";
let memoryState: MockState | undefined;

const owners = ["Alex Chen", "Jamie Lin", "Morgan Wu", "Taylor Zhao", "Robin Xu"];
const categories = ["增长", "运营", "产品", "客户", "财务"];
const statuses: DemoRecordStatus[] = ["active", "pending", "archived"];

function createRecords(): DemoRecord[] {
  return Array.from({ length: 48 }, (_, index) => {
    const id = index + 1;
    const status = statuses[index % statuses.length] ?? "pending";
    return {
      id,
      name: `示例项目 ${String(id).padStart(2, "0")}`,
      owner: owners[index % owners.length] ?? "Alex Chen",
      category: categories[index % categories.length] ?? "产品",
      status,
      progress: status === "archived" ? 100 : 28 + ((index * 13) % 67),
      amount: 12_000 + ((index * 7_919) % 85_000),
      updated_at: new Date(Date.UTC(2026, 6, 15 - (index % 28), 8 + (index % 9))).toISOString(),
      description: "这是一条用于展示筛选、排序、分页和详情交互的模拟记录。",
      tags: [categories[index % categories.length] ?? "产品", status],
    };
  });
}

function createSeedState(): MockState {
  const now = new Date().toISOString();
  return {
    schemaVersion: 1,
    nextIds: { roles: 4, users: 3, apiKeys: 2 },
    roles: [
      {
        id: 1,
        role_name: "管理员",
        is_use: "1",
        cst_update: now,
        rmp: [
          { menu: 1, permission: null },
          { menu: 2, permission: null },
          { menu: 3, permission: null },
        ],
      },
      { id: 2, role_name: "运营成员", is_use: "1", cst_update: now, rmp: [] },
      { id: 3, role_name: "只读成员", is_use: "0", cst_update: now, rmp: [] },
    ],
    users: [
      {
        id: 1,
        login_name: "admin",
        real_name: "模板管理员",
        role: [{ id: 1, role_name: "管理员" }],
        email: "admin@example.com",
        phone: "13800000000",
        is_use: "1",
        last_login: now,
      },
      {
        id: 2,
        login_name: "operator",
        real_name: "运营示例",
        role: [{ id: 2, role_name: "运营成员" }],
        email: "operator@example.com",
        is_use: "1",
        last_login: now,
      },
    ],
    apiKeys: [
      {
        id: 1,
        name: "Dashboard Integration",
        key: "demo-key-••••••••",
        is_enable: true,
        remark: "仅用于本地 Mock 演示",
        user: 1,
      },
    ],
    configs: [
      {
        id: 1,
        key: "AUTO_REFRESH",
        value: "1",
        name: "自动刷新",
        type: "boolean",
        mask: false,
        status: 1,
        remark: "控制概览数据是否自动刷新",
        uuid: "mock-auto-refresh",
        created_at: now,
        updated_at: now,
        is_deleted: false,
      },
    ],
    records: createRecords(),
  };
}

function getStorage(): Storage | undefined {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isArrayOf<T>(value: unknown, predicate: (item: unknown) => item is T): value is T[] {
  return Array.isArray(value) && value.every(predicate);
}

function isRole(value: unknown): value is SystemRole {
  return isObject(value) && isNumber(value.id) && typeof value.role_name === "string";
}

function isUser(value: unknown): value is SystemUser {
  return (
    isObject(value) &&
    isNumber(value.id) &&
    typeof value.login_name === "string" &&
    typeof value.real_name === "string" &&
    Array.isArray(value.role)
  );
}

function isApiKey(value: unknown): value is BackendUserApiKey {
  return isObject(value) && isNumber(value.id) && typeof value.name === "string";
}

function isConfig(value: unknown): value is GConfigDto {
  return (
    isObject(value) &&
    isNumber(value.id) &&
    typeof value.key === "string" &&
    typeof value.value === "string"
  );
}

function isRecord(value: unknown): value is DemoRecord {
  return (
    isObject(value) &&
    isNumber(value.id) &&
    typeof value.name === "string" &&
    typeof value.owner === "string" &&
    typeof value.category === "string" &&
    statuses.includes(value.status as DemoRecordStatus) &&
    isNumber(value.progress) &&
    isNumber(value.amount) &&
    typeof value.updated_at === "string" &&
    typeof value.description === "string" &&
    Array.isArray(value.tags) &&
    value.tags.every((tag) => typeof tag === "string")
  );
}

function nextAfter(items: Array<{ id: number }>): number {
  return Math.max(0, ...items.map((item) => item.id)) + 1;
}

function normalizeStoredState(value: unknown): MockState | undefined {
  if (!isObject(value)) return undefined;
  if (
    !isArrayOf(value.roles, isRole) ||
    !isArrayOf(value.users, isUser) ||
    !isArrayOf(value.apiKeys, isApiKey) ||
    !isArrayOf(value.configs, isConfig) ||
    !isArrayOf(value.records, isRecord)
  ) {
    return undefined;
  }

  const storedNextIds = isObject(value.nextIds) ? value.nextIds : undefined;
  return {
    schemaVersion: 1,
    nextIds: {
      roles: isNumber(storedNextIds?.roles)
        ? Math.max(storedNextIds.roles, nextAfter(value.roles))
        : nextAfter(value.roles),
      users: isNumber(storedNextIds?.users)
        ? Math.max(storedNextIds.users, nextAfter(value.users))
        : nextAfter(value.users),
      apiKeys: isNumber(storedNextIds?.apiKeys)
        ? Math.max(storedNextIds.apiKeys, nextAfter(value.apiKeys))
        : nextAfter(value.apiKeys),
    },
    roles: value.roles,
    users: value.users,
    apiKeys: value.apiKeys,
    configs: value.configs,
    records: value.records,
  };
}

export function getMockState(): MockState {
  if (memoryState) return memoryState;
  const raw = getStorage()?.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const storedState = normalizeStoredState(JSON.parse(raw));
      if (storedState) {
        memoryState = storedState;
        saveMockState(storedState);
        return storedState;
      }
      getStorage()?.removeItem(STORAGE_KEY);
    } catch {
      getStorage()?.removeItem(STORAGE_KEY);
    }
  }
  memoryState = createSeedState();
  saveMockState(memoryState);
  return memoryState;
}

export function saveMockState(state: MockState): void {
  memoryState = state;
  getStorage()?.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function resetMockState(): MockState {
  getStorage()?.removeItem(STORAGE_KEY);
  memoryState = createSeedState();
  saveMockState(memoryState);
  return memoryState;
}

export function nextMockId(state: MockState, collection: keyof MockState["nextIds"]): number {
  const next = state.nextIds[collection];
  state.nextIds[collection] += 1;
  return next;
}
