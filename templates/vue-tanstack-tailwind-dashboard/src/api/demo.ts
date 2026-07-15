import type { AxiosRequestConfig } from "axios";
import { request } from "@/utils/request";
import { mockApiAdapter } from "@/mocks/adapter";
import { URL_CONFIG } from "./config";

export type DemoRecordStatus = "active" | "pending" | "archived";

export interface DemoRecord {
  id: number;
  name: string;
  owner: string;
  category: string;
  status: DemoRecordStatus;
  progress: number;
  amount: number;
  updated_at: string;
  description: string;
  tags: string[];
}

export interface DemoRecordQuery {
  page?: number;
  page_size?: number;
  search?: string;
  status?: DemoRecordStatus;
  ordering?: string;
  updated_after?: string;
  updated_before?: string;
}

export interface DemoRecordList {
  total: number;
  data: DemoRecord[];
}

export interface DemoTrendPoint {
  label: string;
  value: number;
  secondary: number;
}

export interface DemoCategoryMetric {
  label: string;
  value: number;
}

export interface DemoSummary {
  total: number;
  active: number;
  pending: number;
  completionRate: number;
  trend: DemoTrendPoint[];
  recent: DemoRecord[];
}

export interface DemoAnalytics {
  trend: DemoTrendPoint[];
  categories: DemoCategoryMetric[];
  status: DemoCategoryMetric[];
}

function mockConfig(config: AxiosRequestConfig = {}): AxiosRequestConfig {
  return { ...config, adapter: mockApiAdapter };
}

export function getDemoSummary() {
  return request.get<DemoSummary>(`${URL_CONFIG.BASE}/demo/summary/`, mockConfig());
}

export function getDemoRecords(params: DemoRecordQuery) {
  return request.get<DemoRecordList>(`${URL_CONFIG.BASE}/demo/records/`, mockConfig({ params }));
}

export function getDemoRecord(id: number) {
  return request.get<DemoRecord>(`${URL_CONFIG.BASE}/demo/records/${id}/`, mockConfig());
}

export function updateDemoRecord(id: number, data: Partial<Pick<DemoRecord, "status">>) {
  return request.patch<DemoRecord>(`${URL_CONFIG.BASE}/demo/records/${id}/`, data, mockConfig());
}

export function getDemoAnalytics() {
  return request.get<DemoAnalytics>(`${URL_CONFIG.BASE}/demo/analytics/`, mockConfig());
}
