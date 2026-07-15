import type { ProxyOptions } from "vite-plus";

const isHttps = (url: string) => url.startsWith("https://");

type ProxyTargetList = Record<string, ProxyOptions>;

/**
 * 依据 `.env` 中的 `VITE_PROXY_*` 变量生成 Vite dev server 代理表。
 *
 * 每条代理值为 JSON 数组 `[prefix, target, rewrite?]`：
 * - prefix：拦截的请求前缀，会自动拼上 `VITE_ROOT_PREFIX_URL`；
 * - target：转发到的后端地址；
 * - rewrite：可选，转发前从路径中剔除的片段。
 *
 * 配置保持为通用的环境变量驱动形式，便于脚手架项目独立部署。
 */
export const createViteProxy = (list: Record<string, string>): ProxyTargetList => {
  const VITE_ROOT_PREFIX_URL = list.VITE_ROOT_PREFIX_URL ?? "";
  let proxyList: [string, string, string?][] = [];
  try {
    proxyList = Object.keys(list)
      .filter((item) => item.startsWith("VITE_PROXY_"))
      .map((key) => JSON.parse(list[key]));
  } catch (e) {
    console.error("【VITE_PROXY】", "代理配置格式错误");
    console.log(e);
  }

  const rest: ProxyTargetList = {};
  for (const [prefix, target, rewrite] of proxyList) {
    rest[`${VITE_ROOT_PREFIX_URL}${prefix}`] = {
      target,
      changeOrigin: true,
      ws: true,
      rewrite: (path: string) => {
        let tmp = path;
        if (VITE_ROOT_PREFIX_URL) {
          tmp = tmp.replace(VITE_ROOT_PREFIX_URL, "");
        }
        if (rewrite) {
          tmp = tmp.replace(rewrite, "");
        }
        return tmp;
      },
      ...(isHttps(target) ? { secure: false } : {}),
    };
  }
  return rest;
};
