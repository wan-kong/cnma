import type { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import axios from "axios";
import { toast } from "vue-sonner";
import { CAPTCHA_KEY, IS_MOCK_API, SUCCESS_CODE, UNAUTHORIZED_CODE, URL_ROOT } from "@/api/config";
import { getToken } from "@/lib/auth-storage";
import { mockApiAdapter } from "@/mocks/adapter";
import { LOGIN_PATH } from "@/router/constants";

/** 后端统一响应结构。 */
export interface Result<T = unknown> {
  code: number;
  message?: string;
  msg?: string;
  data: T;
}

// 同一错误文案在 1s 内只提示一次，避免批量请求失败时刷屏。
let lastErrorAt = 0;
let lastErrorMsg = "";
function notifyError(message: string) {
  const now = Date.now();
  if (message === lastErrorMsg && now - lastErrorAt < 1000) return;
  lastErrorAt = now;
  lastErrorMsg = message;
  toast.error(message);
}

// 登录失效：清理会话并跳转登录页（带 redirect 回跳）。懒加载 store/router 以打破循环依赖。
let handlingUnauthorized = false;
async function handleUnauthorized() {
  if (handlingUnauthorized) return;
  handlingUnauthorized = true;
  try {
    const [{ useUserStore }, { router }] = await Promise.all([
      import("@/stores/user"),
      import("@/router"),
    ]);
    // token 已失效，本地登出即可，无需再调用注销接口（会再次触发 401）。
    await useUserStore().logout({ callApi: false });
    const current = router.currentRoute.value;
    if (current.path !== LOGIN_PATH) {
      await router.push({ path: LOGIN_PATH, query: { redirect: current.fullPath } });
    }
  } finally {
    handlingUnauthorized = false;
  }
}

const service: AxiosInstance = axios.create({
  baseURL: URL_ROOT,
  timeout: 30_000,
  adapter: IS_MOCK_API ? mockApiAdapter : undefined,
});

/* 请求拦截器：注入 token 与时间戳。 */
service.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = config.headers.Authorization ?? token;
    }
    config.headers["X-Timestamp"] = Math.floor(Date.now() / 1000);
    return config;
  },
  (error: AxiosError) => {
    notifyError(error.message);
    return Promise.reject(error);
  },
);

/* 响应拦截器：解包业务数据、处理业务错误。 */
service.interceptors.response.use(
  (response: AxiosResponse) => {
    // 验证码接口在响应头下发 key，缓存供登录时回传校验。
    const captchaKey = response.headers?.key;
    if (typeof captchaKey === "string") {
      localStorage.setItem(CAPTCHA_KEY, captchaKey);
    }

    // 文件流直接返回原始响应。
    if (response.config.responseType === "blob") return response;

    const { code, message, msg, data } = response.data as Result;

    if (code === SUCCESS_CODE) {
      // 解包业务数据；真实类型由 request.get<T, T> 等方法在调用处约束。
      return data as AxiosResponse;
    }

    if (code === UNAUTHORIZED_CODE) {
      void handleUnauthorized();
      return Promise.reject(response.data);
    }

    // 业务错误。
    if (!response.config.hiddenError) {
      notifyError(message || msg || "请求失败");
    }
    return Promise.reject(response.data);
  },
  (error: AxiosError) => {
    // HTTP 网络错误。
    const status = error.response?.status;
    let message = "网络请求失败";
    switch (status) {
      case 401:
        message = "登录失效，请重新登录";
        void handleUnauthorized();
        break;
      case 403:
        message = "无访问权限";
        break;
      case 404:
        message = "请求的资源不存在";
        break;
      case 500:
        message = "服务器内部错误";
        break;
    }
    if (!error.config?.hiddenError) {
      notifyError(message);
    }
    return Promise.reject(error);
  },
);

/* 封装的请求方法，返回解包后的业务数据。 */
export const request = {
  get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return service.get<T, T>(url, config);
  },
  post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return service.post<T, T>(url, data, config);
  },
  put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return service.put<T, T>(url, data, config);
  },
  patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return service.patch<T, T>(url, data, config);
  },
  delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return service.delete<T, T>(url, config);
  },
};

export const axiosInstance = service;
