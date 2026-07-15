import { createRouter, createWebHistory } from "vue-router";
import { routes, handleHotUpdate } from "vue-router/auto-routes";
import { toast } from "vue-sonner";
import { navigation } from "@/layouts/navigation";
import { usePermissionStore } from "@/stores/permission";
import { useUserStore } from "@/stores/user";
import { APP_TITLE, HOME_PATH, LOGIN_PATH } from "./constants";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL ?? ""),
  routes,
});

function firstSuperPath() {
  return router.getRoutes().find((route) => route.meta.super)?.path ?? HOME_PATH;
}

/**
 * 全局前置守卫——登录拦截与鉴权：
 * 1. 已登录访问登录页 → 跳回首页；
 * 2. 未登录访问受保护页 → 跳登录页并记录回跳地址；
 * 3. 已登录但本地无用户档案（如刷新后被清理） → 拉取校验会话，失败则登出回登录页；
 * 4. 拉取后端菜单路由，按菜单 name / 页面 name 判断当前页面是否可访问；
 * 5. 路由声明 meta.roles 时做角色级鉴权。
 */
router.beforeEach(async (to) => {
  const user = useUserStore();
  const permission = usePermissionStore();

  if (to.path === LOGIN_PATH) {
    // URL Token 登录应覆盖旧会话，并由登录页立即清除地址栏中的 token 后重新校验。
    if (typeof to.query.token === "string" && to.query.token) return true;
    if (user.isAuthenticated) {
      // 超级管理员登录后直接进入超级管理首页
      return user.isSuperuser ? { path: firstSuperPath() } : { path: HOME_PATH };
    }
    return true;
  }

  if (!to.meta.public && !user.isAuthenticated) {
    return { path: LOGIN_PATH, query: { ...to.query, redirect: to.path } };
  }

  if (user.isAuthenticated && !to.meta.public) {
    try {
      await user.ensureProfile();
    } catch {
      await user.logout({ callApi: false });
      return { path: LOGIN_PATH, query: { ...to.query, redirect: to.path } };
    }

    try {
      await permission.ensureLoaded({ isSuperuser: user.isSuperuser });
    } catch {
      await user.logout({ callApi: false });
      return { path: LOGIN_PATH, query: { ...to.query, redirect: to.path } };
    }

    if (!permission.hasAnyMenu) {
      toast.warning("当前账号无任何菜单权限，请联系系统管理员");
      await user.logout({ callApi: false });
      return { path: LOGIN_PATH };
    }

    const hasRoutePermission =
      permission.hasRouteName(to.name) || permission.hasPage(to.meta.permissionKey);

    if (!hasRoutePermission) {
      toast.error("无访问权限");
      const fallback = navigation.find((item) => permission.hasPage(item.permissionKey));
      if (fallback) return { path: fallback.to };
      await user.logout({ callApi: false });
      return { path: LOGIN_PATH };
    }

    if (to.meta.roles?.length && !to.meta.roles.some((role) => user.hasRole(role))) {
      toast.error("无访问权限");
      return { path: HOME_PATH };
    }
  }

  return true;
});

// 同步浏览器标签标题。
router.afterEach((to) => {
  const title = to.meta.title;
  document.title = title ? `${title} · ${APP_TITLE}` : APP_TITLE;
});

router.onError((error) => {
  console.warn("路由错误", error);
});

export { router };

if (import.meta.hot) {
  handleHotUpdate(router);
}
