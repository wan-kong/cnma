import type { DateTimeRangePreset } from "./types";
import { addDays, endOfDay, startOfDay } from "@/utils/date";

/**
 * 内置默认快捷选项。
 *
 * 「最近 N 天」语义为「包含今天在内的 N 个自然日」。
 * 动态范围在点击时才计算，避免每次渲染执行 new Date()。
 */
export const defaultPresets: DateTimeRangePreset[] = [
  {
    label: "最近15分钟",
    value: () => {
      const to = new Date();
      return { from: new Date(to.getTime() - 15 * 60 * 1000), to };
    },
  },
  {
    label: "最近1小时",
    value: () => {
      const to = new Date();
      return { from: new Date(to.getTime() - 60 * 60 * 1000), to };
    },
  },
  {
    label: "今天",
    value: () => ({ from: startOfDay(new Date()), to: endOfDay(new Date()) }),
  },
  {
    label: "昨天",
    value: () => {
      const yesterday = addDays(new Date(), -1);
      return { from: startOfDay(yesterday), to: endOfDay(yesterday) };
    },
  },
  {
    label: "最近7天",
    value: () => ({ from: startOfDay(addDays(new Date(), -6)), to: endOfDay(new Date()) }),
  },
  {
    label: "最近30天",
    value: () => ({ from: startOfDay(addDays(new Date(), -29)), to: endOfDay(new Date()) }),
  },
];
