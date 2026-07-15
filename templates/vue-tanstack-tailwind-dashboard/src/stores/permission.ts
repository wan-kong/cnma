import { computed, shallowRef } from "vue";
import { defineStore } from "pinia";
import { getAuthMenuRoutes, type BackendMenuRoute } from "@/api/menu";
import { collectMenuNames, hasMenuPermission } from "@/lib/menu-permissions";

const SUPER_MENU_ROUTES: BackendMenuRoute[] = [
  {
    path: "/settings",
    is_selected: true,
    name: "settings",
    front_end_path: {
      path: "/settings",
      name: "settings",
      meta: { title: "系统设置" },
    },
    children: [
      {
        path: "/settings/user",
        is_selected: true,
        name: "settingsUser",
        front_end_path: {
          name: "settingsUser",
          path: "/settings/user",
          meta: { title: "用户管理" },
        },
      },
      {
        path: "/settings/role",
        is_selected: true,
        name: "settingsRole",
        front_end_path: {
          name: "settingsRole",
          path: "/settings/role",
          meta: { title: "角色管理" },
        },
      },
    ],
  },
];

export const usePermissionStore = defineStore("permission", () => {
  const loaded = shallowRef(false);
  const rawMenus = shallowRef<BackendMenuRoute[]>([]);
  const allowedNameSet = shallowRef<ReadonlySet<string>>(new Set());
  let pending: Promise<void> | undefined;

  const hasAnyMenu = computed(() => allowedNameSet.value.size > 0);

  async function ensureLoaded(options: { isSuperuser?: boolean } = {}) {
    if (loaded.value) return;
    if (pending) return pending;

    const loadMenus = options.isSuperuser
      ? Promise.resolve(SUPER_MENU_ROUTES)
      : getAuthMenuRoutes();

    pending = loadMenus
      .then((routes) => {
        rawMenus.value = routes;
        allowedNameSet.value = new Set(collectMenuNames(routes));
        loaded.value = true;
      })
      .finally(() => {
        pending = undefined;
      });

    return pending;
  }

  function reset() {
    loaded.value = false;
    rawMenus.value = [];
    allowedNameSet.value = new Set();
    pending = undefined;
  }

  function hasPage(name?: string | null) {
    return hasMenuPermission(allowedNameSet.value, name);
  }

  function hasRouteName(name: string | symbol | undefined | null) {
    return typeof name === "string" && hasPage(name);
  }

  return {
    loaded,
    rawMenus,
    allowedNameSet,
    hasAnyMenu,
    ensureLoaded,
    reset,
    hasPage,
    hasRouteName,
  };
});
