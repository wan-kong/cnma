import { createHttpClient } from "@/lib/http";
import { mockFetch } from "./mock-fetch";

// Demo 默认使用可注入的内存 Fetch 适配器。接入真实后端时删除 fetch 配置即可。
export const http = createHttpClient({
  baseUrl: "/api",
  fetch: mockFetch,
  defaultHeaders: { accept: "application/json" },
});
