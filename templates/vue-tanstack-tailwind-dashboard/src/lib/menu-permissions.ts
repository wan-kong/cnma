import type { BackendMenuRoute } from "../api/menu";

/** 将后端树形菜单压平成前端可直接判断的权限名集合。 */
export function collectMenuNames(routes: BackendMenuRoute[]): string[] {
  return routes.flatMap((route) => {
    if (route.is_del || route.is_selected === false) return [];
    const names = [route.name, route.front_end_path?.name].filter((name): name is string =>
      Boolean(name),
    );
    return [...names, ...collectMenuNames(route.children ?? [])];
  });
}

/** 权限键缺失时按无权限处理，避免未声明 meta 的受保护页面失败开放。 */
export function hasMenuPermission(
  allowedNames: ReadonlySet<string>,
  name?: string | null,
): boolean {
  return typeof name === "string" && allowedNames.has(name);
}
