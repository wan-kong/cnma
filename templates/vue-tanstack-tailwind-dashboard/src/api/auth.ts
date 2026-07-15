import type { AxiosResponse } from "axios";
import { encrypt } from "@/utils/encrypt";
import { request } from "@/utils/request";
import { CAPTCHA_KEY, URL_CONFIG } from "./config";

export interface LoginPayload {
  username: string;
  password: string;
  /** 图形验证码。 */
  captcha: string;
}

/** 后端登录响应结构，与参考项目 `Login.ResLogin` 对齐。 */
export interface LoginResult {
  token: string;
  user_id: number;
  username: string;
  real_name: string;
  roles: string[];
  is_superuser: boolean;
}

/** 前端内部使用的用户档案。 */
export interface UserProfile {
  id: string;
  username: string;
  name: string;
  isSuperUser?: boolean;
  email: string;
  roles: string[];
  avatar?: string;
}

/** 将后端登录响应映射为前端用户档案。 */
export function profileFromLogin(info: LoginResult): UserProfile {
  return {
    id: String(info.user_id ?? ""),
    username: info.username,
    isSuperUser: info.is_superuser ?? false,
    name: info.is_superuser ? "超级管理员" : info.real_name || info.username,
    email: "",
    roles: info.is_superuser ? ["超级管理员"] : info.roles,
  };
}

/**
 * 获取图形验证码，返回可直接用于 `<img :src>` 的地址。
 *
 * 真实后端：返回图片二进制（blob），并在响应头 `key` 中下发验证码 key，
 * 由 request 响应拦截器写入 localStorage，登录时随表单回传。
 */
export async function getCaptcha(): Promise<string> {
  const res = (await request.get(`${URL_CONFIG.BASE}/captcha/`, {
    responseType: "blob",
    hiddenError: true,
  })) as unknown as AxiosResponse<Blob>;
  return URL.createObjectURL(res.data);
}

/**
 * 登录请求，接口与参考项目一致：
 * 将 `{ username, password, captcha, key }` 加密后以 `{ value }` 提交。
 */
export async function login(payload: LoginPayload): Promise<LoginResult> {
  const origin = { ...payload, key: localStorage.getItem(CAPTCHA_KEY) };
  const value = encrypt(JSON.stringify(origin));
  return request.post<LoginResult>(`${URL_CONFIG.BASE}/login/`, { value }, { hiddenError: true });
}

/**
 * 获取当前登录用户信息，用于刷新页面或 URL token 登录后恢复用户档案、校验会话。
 * token 失效时后端返回未授权码，由 request 拦截器统一登出。
 */
export async function getUserInfo(): Promise<UserProfile> {
  const info = await request.get<LoginResult>(`${URL_CONFIG.BASE}/user/info/`);
  return profileFromLogin(info);
}

/** 注销登录，通知后端使 token 失效。 */
export async function logout(): Promise<void> {
  await request.get(`${URL_CONFIG.BASE}/user/logout/`, { hiddenError: true });
}
