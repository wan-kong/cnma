// 路由相关常量，集中管理路径与标题，供 router / request / store 共用，避免硬编码散落各处。
export const LOGIN_PATH = "/login";
export const HOME_PATH = "/";

/** 浏览器标签页基础标题，拼接到具体页面标题之后。 */
export const APP_TITLE = import.meta.env.VITE_GLOBAL_APP_TITLE || "__PROJECT_NAME__";
