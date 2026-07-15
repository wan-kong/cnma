/** 系统模式编码枚举 */
export enum SystemModeCode {
  COMMON = 0,
}

/** 模式项 */
export interface ModeItem {
  name: string;
  key: SystemModeCode;
  logo?: string;
  icon?: string;
  hidden?: boolean;
}

/** 菜单元信息（对应路由 meta） */
export interface MenuMeta {
  title?: string;
  icon?: string;
  sort?: number;
  order?: number;
  isHide?: boolean;
  isKeepAlive?: boolean;
  isLink?: string | boolean;
  isSingle?: boolean;
  isFull?: boolean;
  isPure?: boolean;
  isFixed?: boolean;
  isAffix?: boolean;
  isCollapse?: boolean;
  activePath?: string;
  props?: boolean;
}

/** 前端路由路径配置 */
export interface FrontEndPath {
  path?: string;
  name?: string;
  component?: string;
  redirect?: string;
  meta?: MenuMeta;
}

/** 菜单项 */
export interface MenuItem {
  id: number | null;
  _type: "menu";
  _disabled?: boolean;
  _collapse?: boolean;
  name: string;
  parent: number | null;
  remark: string;
  permissions: number[];
  sort: number;
  is_selected: boolean;
  mode: number;
  front_end_path: FrontEndPath;
  children: MenuOrRole[];
}

/** 角色/权限项 */
export interface RoleItem {
  id: number | null;
  _type: "role";
  _disabled?: boolean;
  name: string;
  app_name: string;
  url_path: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  is_selected: boolean;
  sort: number;
  is_whitelist: boolean;
  remark: string;
}

/** 按应用分组的角色 */
export interface RenderRoles {
  id: number;
  name: string;
  _collapse?: boolean;
  roles: RoleItem[];
}

/** 菜单或角色的联合类型 */
export type MenuOrRole = MenuItem | RoleItem;

/** 菜单编辑表单数据 */
export interface MenuFormData {
  _isLink?: boolean;
  parent: number | null;
  name: string;
  sort: number;
  type: number;
  remark: string;
  front_end_path: {
    name: string;
    redirect: string;
    component: string;
    path: string;
    meta: Required<MenuMeta>;
  };
}

/** 创建菜单表单 */
export function createEmptyMenuForm(): MenuFormData {
  return {
    parent: null,
    name: "",
    sort: 0,
    type: 0,
    remark: "",
    front_end_path: {
      name: "",
      redirect: "",
      component: "",
      path: "",
      meta: {
        title: "",
        icon: "",
        sort: 0,
        order: 0,
        isHide: false,
        isKeepAlive: true,
        isLink: false,
        isSingle: false,
        isFull: false,
        isPure: false,
        isFixed: true,
        isAffix: false,
        isCollapse: false,
        activePath: "",
        props: false,
      },
    },
  };
}

/** 角色编辑表单数据 */
export interface RoleFormData {
  name: string;
  app_name: string;
  url_path: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  sort: number;
  is_whitelist: boolean;
  remark: string;
}

/** 创建角色表单 */
export function createEmptyRoleForm(): RoleFormData {
  return {
    name: "",
    app_name: "",
    url_path: "",
    method: "GET",
    sort: 0,
    is_whitelist: false,
    remark: "",
  };
}
