import { request } from "@/utils/request";
import { URL_CONFIG } from "./config";

export interface PageQuery {
  page?: number;
  page_size?: number;
  [key: string]: unknown;
}

export interface PageResult<T> {
  data: T[];
  total: number;
}

export interface RolePermissionPayload {
  menu: number;
  permission: number | null;
}

export interface SystemRole {
  id: number;
  role_name: string;
  is_use?: "0" | "1" | 0 | 1 | boolean;
  cst_update?: string;
  rmp?: Array<{
    id?: number;
    menu: number;
    permission: number | null;
  }>;
}

export interface RolePayload {
  role_name: string;
  is_use: "0" | "1";
  rmp: RolePermissionPayload[];
}

export interface BackendMenuPermission {
  id: number;
  name: string;
}

export interface BackendRoleMenu {
  id: number;
  parent: number | null;
  mode?: number;
  sort?: number;
  name?: string;
  front_end_path?: {
    meta?: {
      title?: string;
    };
  };
  permissions?: BackendMenuPermission[];
}

export interface BackendUserRole {
  id: number;
  role_name: string;
}

export interface SystemUser {
  id: number;
  login_name: string;
  real_name: string;
  role: BackendUserRole[];
  phone?: string;
  email?: string;
  cst_expire?: string | null;
  is_use: "0" | "1" | "2" | 0 | 1 | 2;
  last_login?: string | null;
}

export interface UserPayload {
  login_name: string;
  real_name: string;
  role: number[];
  is_use: "0" | "1" | "2";
  cst_expire?: string | null;
  phone?: string;
  email?: string;
  cipher?: string;
}

export interface BackendUserApiKey {
  id: number;
  name: string;
  key?: string;
  is_enable?: boolean;
  auth_start_time?: string | null;
  auth_end_time?: string | null;
  remark?: string;
  user?: number;
}

export interface UserApiKeyPayload {
  name: string;
  is_enable: boolean;
  user: number;
  key?: string;
  auth_start_time?: string | null;
  auth_end_time?: string | null;
  remark?: string;
}

function normalizePageResult<T>(res: PageResult<T> | T[]): PageResult<T> {
  if (Array.isArray(res)) {
    return { data: res, total: res.length };
  }
  return {
    data: Array.isArray(res.data) ? res.data : [],
    total: Number(res.total ?? res.data?.length ?? 0),
  };
}

export async function getRoleList(params?: PageQuery): Promise<PageResult<SystemRole>> {
  const res = await request.get<PageResult<SystemRole> | SystemRole[]>(`${URL_CONFIG.BASE}/role/`, {
    params,
  });
  return normalizePageResult(res);
}

export function getRoleDetail(id: number) {
  return request.get<SystemRole>(`${URL_CONFIG.BASE}/role/${id}/`);
}

export function addRole(data: RolePayload) {
  return request.post(`${URL_CONFIG.BASE}/role/`, data);
}

export function editRole(id: number, data: RolePayload) {
  return request.patch(`${URL_CONFIG.BASE}/role/${id}/`, data);
}

export function deleteRole(id: number) {
  return request.delete(`${URL_CONFIG.BASE}/role/${id}/`);
}

export function getRolePermissionMenus() {
  return request.get<BackendRoleMenu[]>(`${URL_CONFIG.BASE}/menu/role_mp/`);
}

export async function getUserList(params?: PageQuery): Promise<PageResult<SystemUser>> {
  const res = await request.get<PageResult<SystemUser> | SystemUser[]>(`${URL_CONFIG.BASE}/user/`, {
    params,
  });
  return normalizePageResult(res);
}

export function addUser(data: UserPayload) {
  return request.post(`${URL_CONFIG.BASE}/user/`, data);
}

export function editUser(id: number, data: UserPayload) {
  return request.patch(`${URL_CONFIG.BASE}/user/${id}/`, data);
}

export function resetUserPassword(ids: number[], pwd: string) {
  return request.post(`${URL_CONFIG.BASE}/user/reset/`, { ids, pwd });
}

export function deleteUser(id: number) {
  return request.delete(`${URL_CONFIG.BASE}/user/${id}/`);
}

export async function getUserApiKeyList(
  params?: PageQuery,
): Promise<PageResult<BackendUserApiKey>> {
  const res = await request.get<PageResult<BackendUserApiKey> | BackendUserApiKey[]>(
    `${URL_CONFIG.BASE}/user/apikey/`,
    { params },
  );
  return normalizePageResult(res);
}

export function addUserApiKey(data: UserApiKeyPayload) {
  return request.post(`${URL_CONFIG.BASE}/user/apikey/`, data);
}

export function editUserApiKey(id: number, data: UserApiKeyPayload) {
  return request.patch(`${URL_CONFIG.BASE}/user/apikey/${id}/`, data);
}

export function deleteUserApiKey(id: number) {
  return request.delete(`${URL_CONFIG.BASE}/user/apikey/${id}/`);
}

// ---------------------------------------------------------------------------
// 系统配置
// ---------------------------------------------------------------------------

/** 系统配置项 DTO。 */
export interface GConfigDto {
  id: number;
  key: string;
  value: string;
  name: string;
  type: string;
  mask: boolean;
  status: number;
  remark: string;
  uuid: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

/** 获取系统配置详情（按 key 查询）。 */
export function getGConfig(key: string) {
  return request.get<GConfigDto>(`${URL_CONFIG.BASE}/configuration/gconfig/detail/`, {
    params: { key },
  });
}

/** 更新系统配置。 */
export function updateGConfig(id: number, data: { value: string }) {
  return request.patch(`${URL_CONFIG.BASE}/configuration/gconfig/${id}/`, data);
}
