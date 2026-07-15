export interface NavItem {
  title: string;
  to: string;
  permissionKey: string;
}

export const navigation: NavItem[] = [
  { title: "概览", to: "/", permissionKey: "alarm" },
  { title: "数据记录", to: "/records", permissionKey: "alarm" },
  { title: "数据分析", to: "/analytics", permissionKey: "analysis" },
  { title: "系统设置", to: "/settings", permissionKey: "settings" },
];
