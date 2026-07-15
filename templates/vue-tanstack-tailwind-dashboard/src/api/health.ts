import { request } from "@/utils/request";
import { URL_CONFIG } from "./config";

export interface HealthStatus {
  status: "ok" | "degraded" | "down";
  timestamp: string;
}

export function getHealth(): Promise<HealthStatus> {
  return request.get<HealthStatus>(`${URL_CONFIG.BASE}/health`);
}
