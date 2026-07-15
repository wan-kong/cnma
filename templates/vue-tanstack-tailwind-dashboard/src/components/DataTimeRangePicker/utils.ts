import type { DateValue } from "reka-ui";
import { CalendarDate } from "@internationalized/date";
import type { DateTimePrecision, DateTimeRange, DateTimeRangeValidationResult } from "./types";
import {
  formatDateTime,
  isSameDay,
  isValidDate,
  normalizePrecision,
  parseTimeValue,
} from "@/utils/date";

/** 深拷贝范围，避免原地修改父组件传入的 Date。 */
export function cloneRange(value?: DateTimeRange): DateTimeRange | undefined {
  if (!value) return undefined;
  return {
    from: isValidDate(value.from) ? new Date(value.from.getTime()) : undefined,
    to: isValidDate(value.to) ? new Date(value.to.getTime()) : undefined,
  };
}

/** 按精度归一化整个范围。 */
export function normalizeDateTimeRange(
  value: DateTimeRange | undefined,
  precision: DateTimePrecision,
): DateTimeRange | undefined {
  if (!value) return undefined;
  return {
    from: value.from ? normalizePrecision(value.from, precision) : undefined,
    to: value.to ? normalizePrecision(value.to, precision) : undefined,
  };
}

/** 解析 "HH:mm" 或 "HH:mm:ss"。非法返回 undefined。 */
export { parseTimeValue };

/** 格式化单个时间用于触发器展示。 */
export { formatDateTime };

/** 格式化整个范围用于触发器展示。 */
export function formatDateTimeRange(
  value: DateTimeRange | undefined,
  precision: DateTimePrecision,
  placeholder: string,
): string {
  if (!value?.from && !value?.to) return placeholder;
  if (value.from && !value.to) return `${formatDateTime(value.from, precision)} - 结束时间`;
  if (!value.from && value.to) return `开始时间 - ${formatDateTime(value.to, precision)}`;
  return `${formatDateTime(value.from!, precision)} - ${formatDateTime(value.to!, precision)}`;
}

/** Date → reka-ui CalendarDate（仅保留年月日）。 */
export function dateToCalendarDate(date: Date): CalendarDate {
  return new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

/** CalendarDate（DateValue）→ 当天 00:00 的本地 Date。 */
export function calendarDateToDate(value: DateValue): Date {
  return new Date(value.year, value.month - 1, value.day);
}

/** 是否为同一自然日。 */
export { isSameDay };

/** 在允许误差内比较两个范围，用于快捷项选中态。 */
export function isSameRange(
  left?: DateTimeRange,
  right?: DateTimeRange,
  tolerance = 1000,
): boolean {
  if (!left?.from || !left.to || !right?.from || !right.to) return false;
  return (
    Math.abs(left.from.getTime() - right.from.getTime()) <= tolerance &&
    Math.abs(left.to.getTime() - right.to.getTime()) <= tolerance
  );
}

interface ValidateOptions {
  required?: boolean;
  minDateTime?: Date;
  maxDateTime?: Date;
  minDuration?: number;
  maxDuration?: number;
  isDateTimeDisabled?: (date: Date, boundary: "from" | "to") => boolean;
}

/** 内置范围校验，按设计文档的顺序逐项检查。 */
export function validateDateTimeRange(
  value: DateTimeRange | undefined,
  options: ValidateOptions,
): DateTimeRangeValidationResult {
  const { required, minDateTime, maxDateTime, minDuration, maxDuration, isDateTimeDisabled } =
    options;

  if (!value?.from && !value?.to) {
    if (required) {
      return { valid: false, reason: "incomplete", message: "请选择时间范围" };
    }
    return { valid: true };
  }

  if (!value.from || !value.to) {
    return {
      valid: false,
      reason: "incomplete",
      message: "请选择完整的开始时间和结束时间",
    };
  }

  const fromTime = value.from.getTime();
  const toTime = value.to.getTime();

  if (fromTime > toTime) {
    return { valid: false, reason: "start-after-end", message: "结束时间不能早于开始时间" };
  }
  if (minDateTime && fromTime < minDateTime.getTime()) {
    return { valid: false, reason: "before-min", message: "开始时间早于允许选择的最小时间" };
  }
  if (maxDateTime && toTime > maxDateTime.getTime()) {
    return { valid: false, reason: "after-max", message: "结束时间晚于允许选择的最大时间" };
  }

  const duration = toTime - fromTime;
  if (minDuration !== undefined && duration < minDuration) {
    return { valid: false, reason: "range-too-short", message: "选择的时间范围过短" };
  }
  if (maxDuration !== undefined && duration > maxDuration) {
    return { valid: false, reason: "range-too-long", message: "选择的时间范围过长" };
  }

  if (isDateTimeDisabled?.(value.from, "from") || isDateTimeDisabled?.(value.to, "to")) {
    return { valid: false, reason: "disabled-date", message: "选择的时间不可用" };
  }

  return { valid: true };
}
