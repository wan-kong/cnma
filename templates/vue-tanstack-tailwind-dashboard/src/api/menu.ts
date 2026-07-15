import { request } from "@/utils/request";
import { URL_CONFIG } from "./config";

export interface BackendMenuRoute {
  id?: number;
  parent?: number | null;
  is_del?: boolean;
  is_selected?: boolean;
  path?: string;
  name?: string;
  front_end_path?: {
    path?: string;
    name?: string;
    component?: string;
    meta?: {
      title?: string;
      isHide?: boolean;
    };
  };
  children?: BackendMenuRoute[];
}

export function getAuthMenuRoutes() {
  return request.get<BackendMenuRoute[]>(`${URL_CONFIG.BASE}/menu/router/`);
}
