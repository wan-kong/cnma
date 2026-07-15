import type { DateValue } from "reka-ui";
import type { HTMLAttributes } from "vue";

/** 时间精度。minute 精确到分，second 精确到秒。 */
import type { DateTimePrecision, TimeParts } from "@/utils/date";
export type { DateTimePrecision, TimeParts };

/** 时间范围，闭区间 [from, to]。空值统一用 undefined。 */
export interface DateTimeRange {
  from?: Date;
  to?: Date;
}

/** 开始与结束必须同时存在的完整范围。 */
export interface CompleteDateTimeRange {
  from: Date;
  to: Date;
}

/** 快捷选项。value 可以是静态范围，也可以是每次点击时计算的函数。 */
export interface DateTimeRangePreset {
  label: string;
  value: DateTimeRange | (() => DateTimeRange);
  disabled?: boolean;
}

/** 值提交模式。immediate 实时提交，confirm 点确认后提交。 */
export type CommitMode = "immediate" | "confirm";

export type DateTimeRangeInvalidReason =
  | "incomplete"
  | "start-after-end"
  | "before-min"
  | "after-max"
  | "range-too-short"
  | "range-too-long"
  | "disabled-date"
  | "custom";

export interface DateTimeRangeValidationResult {
  valid: boolean;
  reason?: DateTimeRangeInvalidReason;
  message?: string;
}

export interface DateTimeRangePickerProps {
  /** 占位文本。 */
  placeholder?: string;
  /** 是否禁用整个组件。 */
  disabled?: boolean;
  /** 是否只读（可查看不可编辑）。 */
  readonly?: boolean;
  /** 是否允许清空。 */
  clearable?: boolean;
  /** 是否要求开始时间与结束时间同时存在。 */
  required?: boolean;
  /** 时间精度。 */
  precision?: DateTimePrecision;
  /** 日历显示月份数量。 */
  numberOfMonths?: number;
  /** 一周从星期几开始。0 为周日，1 为周一。 */
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  /** 最小可选时间。 */
  minDateTime?: Date;
  /** 最大可选时间。 */
  maxDateTime?: Date;
  /** 最短时间范围，单位毫秒。 */
  minDuration?: number;
  /** 最长时间范围，单位毫秒。 */
  maxDuration?: number;
  /** 自定义时间禁用函数。 */
  isDateTimeDisabled?: (date: Date, boundary: "from" | "to") => boolean;
  /** 快捷选项。不传则使用内置默认项。 */
  presets?: DateTimeRangePreset[];
  /** 是否显示快捷选项。 */
  showPresets?: boolean;
  /** 是否显示时间选择。 */
  showTime?: boolean;
  /** 时间选择器是否使用 12 小时制（带 AM/PM）。 */
  use12HourFormat?: boolean;
  /** 值提交模式。 */
  commitMode?: CommitMode;
  /** 选择完整范围后是否自动关闭（仅 immediate 模式生效）。 */
  closeOnComplete?: boolean;
  /** 选择单日时的默认开始时间。 */
  defaultStartTime?: TimeParts;
  /** 选择单日时的默认结束时间。 */
  defaultEndTime?: TimeParts;
  /** 自定义校验，在内置校验通过后执行。 */
  validate?: (value: DateTimeRange | undefined) => DateTimeRangeValidationResult;
  /** 外部错误信息。 */
  error?: string;
  /** 区域设置，用于日历显示。 */
  locale?: string;
  /** 无障碍标签。 */
  ariaLabel?: string;
  /** 触发器 class。 */
  class?: HTMLAttributes["class"];
  /** 浮层 class。 */
  contentClass?: HTMLAttributes["class"];
  /** 浮层对齐方式。 */
  align?: "start" | "center" | "end";
}

export interface DateTimePickerProps {
  /** 占位文本。 */
  placeholder?: string;
  /** 空值时展示的文案；不传则使用 placeholder。 */
  emptyText?: string;
  /** 时间选择区域标题。 */
  timeLabel?: string;
  /** 清空区域提示。 */
  clearHint?: string;
  /** 是否禁用整个组件。 */
  disabled?: boolean;
  /** 是否只读（可查看不可编辑）。 */
  readonly?: boolean;
  /** 是否允许清空。 */
  clearable?: boolean;
  /** 时间精度。 */
  precision?: DateTimePrecision;
  /** 选择日期时使用的默认时分秒。 */
  defaultTime?: TimeParts;
  /** 时间选择器是否使用 12 小时制（带 AM/PM）。 */
  use12HourFormat?: boolean;
  /** 区域设置，用于日历显示。 */
  locale?: string;
  /** 无障碍标签。 */
  ariaLabel?: string;
  /** 触发器 class。 */
  class?: HTMLAttributes["class"];
  /** 浮层 class。 */
  contentClass?: HTMLAttributes["class"];
  /** 浮层对齐方式。 */
  align?: "start" | "center" | "end";
}

/** reka-ui 日历使用的 DateValue 范围。 */
export interface CalendarRange {
  start?: DateValue;
  end?: DateValue;
}

/** 可查询的时间字段选项。 */
export interface DateTimeFieldOption {
  label: string;
  value: string;
  disabled?: boolean;
}
