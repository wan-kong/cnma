import { computed, ref } from "vue";
import { defineStore } from "pinia";
import {
  getUserInfo,
  login as loginApi,
  logout as logoutApi,
  type LoginPayload,
  profileFromLogin,
  type UserProfile,
} from "@/api/auth";
import {
  clearAuthStorage,
  getStoredProfile,
  getToken,
  setStoredProfile,
  setToken,
} from "@/lib/auth-storage";

export const useUserStore = defineStore("user", () => {
  // 从 localStorage 恢复会话，刷新后保持登录态。
  const token = ref<string>(getToken());
  const profile = ref<UserProfile | null>(getStoredProfile<UserProfile>());
  // localStorage 仅用于首屏展示；特权字段必须在本次运行中经后端重新确认。
  const profileVerified = ref(false);

  const isAuthenticated = computed(() => Boolean(token.value));
  const name = computed(() => profile.value?.name ?? "");
  const email = computed(() => profile.value?.email ?? "");
  const role = computed(() => profile.value?.roles?.[0] ?? "");
  const initials = computed(() => (profile.value?.name ?? "").slice(0, 1).toUpperCase());
  const isSuperuser = computed(
    () => profileVerified.value && (profile.value?.isSuperUser ?? false),
  );

  function setProfile(next: UserProfile) {
    profile.value = next;
    profileVerified.value = true;
    setStoredProfile(next);
  }

  function setSession(nextToken: string, nextProfile: UserProfile) {
    token.value = nextToken;
    setToken(nextToken);
    setProfile(nextProfile);
  }

  async function login(payload: LoginPayload) {
    const { usePermissionStore } = await import("@/stores/permission");
    const result = await loginApi(payload);
    usePermissionStore().reset();
    setSession(`JWT ${result.token}`, profileFromLogin(result));
    return result;
  }

  // 从 URL token 直接建立会话（单点登录回跳），随后拉取用户档案。
  async function loginByToken(nextToken: string) {
    const { usePermissionStore } = await import("@/stores/permission");
    usePermissionStore().reset();
    clearAuthStorage();
    token.value = nextToken;
    profile.value = null;
    profileVerified.value = false;
    setToken(nextToken);
    try {
      await fetchProfile();
    } catch {
      token.value = "";
      profile.value = null;
      profileVerified.value = false;
      clearAuthStorage();
      throw new Error("URL Token 校验失败");
    }
  }

  // 拉取并刷新当前用户档案（会话校验）。
  async function fetchProfile() {
    const next = await getUserInfo();
    setProfile(next);
    return next;
  }

  // 每次应用启动都向后端复验本地会话，不能信任 localStorage 中的特权字段。
  async function ensureProfile() {
    if (!token.value || profileVerified.value) return;
    await fetchProfile();
  }

  /**
   * 退出登录。
   * @param options.callApi 是否通知后端注销 token，默认 true；
   *   401 拦截触发的登出应传 false，避免与失效请求互相循环。
   */
  async function logout(options: { callApi?: boolean } = {}) {
    const { usePermissionStore } = await import("@/stores/permission");
    const { callApi = true } = options;
    if (callApi && token.value) {
      try {
        await logoutApi();
      } catch {
        // 注销接口失败不应阻断本地登出。
      }
    }
    token.value = "";
    profile.value = null;
    profileVerified.value = false;
    usePermissionStore().reset();
    clearAuthStorage();
  }

  function hasRole(target: string) {
    return profile.value?.roles?.includes(target) ?? false;
  }

  return {
    token,
    profile,
    isAuthenticated,
    name,
    email,
    role,
    initials,
    login,
    loginByToken,
    fetchProfile,
    ensureProfile,
    logout,
    hasRole,
    isSuperuser,
  };
});
