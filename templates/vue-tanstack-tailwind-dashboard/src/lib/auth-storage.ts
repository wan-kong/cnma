// 鉴权相关的 localStorage 读写，集中管理 key，供 store 与 request 共用，避免循环依赖。
export const TOKEN_KEY = "__PROJECT_NAME__.token";
export const PROFILE_KEY = "__PROJECT_NAME__.profile";

export function getToken(): string {
  return localStorage.getItem(TOKEN_KEY) ?? "";
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getStoredProfile<T>(): T | null {
  const raw = localStorage.getItem(PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function setStoredProfile(profile: unknown): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function clearAuthStorage(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(PROFILE_KEY);
}
