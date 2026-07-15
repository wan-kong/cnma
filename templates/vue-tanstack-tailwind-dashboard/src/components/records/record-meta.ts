import type { DemoRecordStatus } from "@/api/demo";

export const RECORD_STATUS_META: Record<
  DemoRecordStatus,
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  active: { label: "进行中", variant: "default" },
  pending: { label: "待处理", variant: "secondary" },
  archived: { label: "已归档", variant: "outline" },
};

export const RECORD_STATUS_OPTIONS = (Object.keys(RECORD_STATUS_META) as DemoRecordStatus[]).map(
  (value) => ({ value, label: RECORD_STATUS_META[value].label }),
);
