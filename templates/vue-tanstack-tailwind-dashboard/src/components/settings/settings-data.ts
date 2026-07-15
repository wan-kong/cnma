export type UserStatus = "enabled" | "disabled" | "locked";
export type RoleStatus = "enabled" | "disabled";

export interface PermissionNode {
  id: string;
  name: string;
  menuId?: number;
  permissionId?: number | null;
  children?: PermissionNode[];
}

export const fixedPermissionTree: PermissionNode[] = [
  { id: "alarm", name: "概览与数据记录" },
  { id: "analysis", name: "数据分析" },
  {
    id: "settings",
    name: "系统设置",
    children: [
      { id: "settings:index", name: "系统设置" },
      { id: "settings:user", name: "用户管理" },
      { id: "settings:role", name: "角色管理" },
    ],
  },
];

export function collectPermissionIds(nodes: PermissionNode[]): string[] {
  return nodes.flatMap((node) => [node.id, ...collectPermissionIds(node.children ?? [])]);
}
