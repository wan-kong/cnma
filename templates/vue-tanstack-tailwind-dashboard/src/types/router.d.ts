// Module augmentation: extend Vue Router's route meta with our layout switch.
// The side-effect import makes this file a module so `declare module` *augments*
// vue-router instead of replacing it.
import "vue-router";

declare module "vue-router" {
  interface RouteMeta {
    layout?: "blank";
    /** 公开页面，无需登录即可访问（如登录页）。 */
    public?: boolean;
    /** 浏览器标签标题，会拼接应用名展示。 */
    title?: string;
    /** 复用某个菜单 name 的页面级权限；未设置时使用 route record name 判断。 */
    permissionKey?: string;
    /** 允许访问的角色；为空表示登录即可访问。 */
    roles?: string[];
    /** superadmin 允许的菜单 */
    super?: boolean;
  }
}
