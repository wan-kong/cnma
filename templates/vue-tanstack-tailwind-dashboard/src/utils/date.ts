/** 时间精度。minute 精确到分，second 精确到秒。 */
export type DateTimePrecision = "minute" | "second";

/** 时分秒。 */
export interface TimeParts {
  hours: number;
  minutes: number;
  seconds?: number;
}

// ---------------------------------------------------------------------------
// 基础校验
// ---------------------------------------------------------------------------

/** 判断是否为合法的 Date 对象。 */
export function isValidDate(date: unknown): date is Date {
  return date instanceof Date && !Number.isNaN(date.getTime());
}

// ---------------------------------------------------------------------------
// 日期计算
// ---------------------------------------------------------------------------

/** 返回当天 00:00:00.000 的新 Date。 */
export function startOfDay(date: Date): Date {
  const result = new Date(date.getTime());
  result.setHours(0, 0, 0, 0);
  return result;
}

/** 返回当天 23:59:59.000 的新 Date（毫秒归零，与界面显示一致）。 */
export function endOfDay(date: Date): Date {
  const result = new Date(date.getTime());
  result.setHours(23, 59, 59, 0);
  return result;
}

/** 在给定日期上加减天数，返回新 Date。 */
export function addDays(date: Date, amount: number): Date {
  const result = new Date(date.getTime());
  result.setDate(result.getDate() + amount);
  return result;
}

/** 是否为同一自然日。 */
export function isSameDay(a?: Date, b?: Date): boolean {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** 将精度外的字段归零（minute 清零秒和毫秒，second 清零毫秒）。 */
export function normalizePrecision(date: Date, precision: DateTimePrecision): Date {
  const result = new Date(date.getTime());
  if (precision === "minute") {
    result.setSeconds(0, 0);
  } else {
    result.setMilliseconds(0);
  }
  return result;
}

// ---------------------------------------------------------------------------
// 日期/时间合并
// ---------------------------------------------------------------------------

/** 将日期的日历部分与给定时分秒合并成新 Date（不修改入参）。 */
export function mergeDateAndTime(date: Date, time: TimeParts): Date {
  const result = new Date(date.getTime());
  result.setHours(time.hours, time.minutes, time.seconds ?? 0, 0);
  return result;
}

/** 取出 Date 的时分秒。 */
export function getTimeParts(date: Date): Required<TimeParts> {
  return {
    hours: date.getHours(),
    minutes: date.getMinutes(),
    seconds: date.getSeconds(),
  };
}

// ---------------------------------------------------------------------------
// 解析
// ---------------------------------------------------------------------------

/** 解析 "HH:mm" 或 "HH:mm:ss"。非法输入返回 undefined。 */
export function parseTimeValue(value: string): Required<TimeParts> | undefined {
  if (!value) return undefined;
  const parts = value.split(":").map(Number);
  const [hours = 0, minutes = 0, seconds = 0] = parts;
  if (parts.some((n) => Number.isNaN(n))) return undefined;
  if (hours < 0 || hours > 23) return undefined;
  if (minutes < 0 || minutes > 59) return undefined;
  if (seconds < 0 || seconds > 59) return undefined;
  return { hours, minutes, seconds };
}

/**
 * 解析日期时间字符串，支持：
 * - "YYYY-MM-DD"
 * - "YYYY-MM-DD HH:mm:ss"（可用 T 替代空格）
 */
export function parseDateTime(value?: string): Date | undefined {
  if (!value) return undefined;
  const normalized = value.trim().replace("T", " ");
  const match = normalized.match(
    /^(\d{4})-(\d{1,2})-(\d{1,2})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/,
  );
  if (!match) return undefined;
  const [, year, month, day, hour = "0", minute = "0", second = "0"] = match;
  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
  );
  return Number.isNaN(date.getTime()) ? undefined : date;
}

// ---------------------------------------------------------------------------
// 格式化
// ---------------------------------------------------------------------------

/** 日期格式化选项。 */
export interface DateFormatOptions {
  /** 精度：minute 省略秒，second 包含秒。默认 "second"。 */
  precision?: DateTimePrecision;
  /** 仅返回时间部分（HH:mm / HH:mm:ss），省略日期。默认 false。 */
  timeOnly?: boolean;
}

/**
 * 统一日期时间格式化。
 * 入参可为 Date、ISO 字符串、null/undefined；null/空串返回 ""。
 *
 * @example
 * formatDateTime(new Date())                              // "2024-01-15 14:30:00"
 * formatDateTime(new Date(), "minute")                    // "2024-01-15 14:30"  (向后兼容)
 * formatDateTime(new Date(), { precision: "minute" })     // "2024-01-15 14:30"
 * formatDateTime(new Date(), { timeOnly: true })          // "14:30:00"
 * formatDateTime("2024-01-15T14:30:00")                   // "2024-01-15 14:30:00"
 */
export function formatDateTime(
  value: Date | string | null | undefined,
  precisionOrOptions?: DateTimePrecision | DateFormatOptions,
): string {
  if (value == null || value === "") return "";
  const date = isValidDate(value) ? (value as Date) : new Date(value as string);
  if (!isValidDate(date)) return "";

  const opts: DateFormatOptions =
    typeof precisionOrOptions === "string"
      ? { precision: precisionOrOptions }
      : (precisionOrOptions ?? {});

  const { precision = "second", timeOnly = false } = opts;

  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  const time =
    precision === "minute"
      ? `${hh}:${mm}`
      : `${hh}:${mm}:${String(date.getSeconds()).padStart(2, "0")}`;

  if (timeOnly) return time;

  const y = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${mo}-${d} ${time}`;
}

/** 将 Date 格式化为 API 传输用的字符串（精确到秒，null 安全）。 */
export function formatPayloadDateTime(value?: Date): string | null {
  return value ? formatDateTime(normalizePrecision(value, "second"), "second") : null;
}

// ---------------------------------------------------------------------------
// 便捷方法
// ---------------------------------------------------------------------------

/** 将 ISO 日期字符串格式化为 "YYYY-MM-DD HH:MM"。保留以兼容旧代码。 */
export function formatTime(value?: string) {
  if (!value) return "";
  return formatDateTime(value, { precision: "minute" });
}
