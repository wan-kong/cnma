const normalizeRootPrefix = (value?: string) => {
  const prefix = value?.trim();
  if (!prefix || prefix === "/") return "";
  return `/${prefix.replace(/^\/+|\/+$/g, "")}`;
};

// 接口请求的根前缀，优先读取显式配置，未配置时跟随 Vite base。
export const URL_ROOT = normalizeRootPrefix(import.meta.env.BASE_URL);

export const URL_CONFIG = {
  BASE: `/api/v1`,
} as const;

/** 业务成功码。后端返回该 code 时视为成功并解包 data。 */
export const SUCCESS_CODE = 10200;
/** 业务侧未授权码（区别于 HTTP 401）。 */
export const UNAUTHORIZED_CODE = 40100;

/**
 * 验证码 key 的本地存储键。
 * 真实后端在验证码接口的响应头 `key` 中下发，登录时随表单回传校验。
 */
export const CAPTCHA_KEY = "__PROJECT_NAME__.captcha-key";

/** 是否使用模板内置 Mock API。 */
export const IS_MOCK_API = import.meta.env.VITE_API_MODE !== "remote";
