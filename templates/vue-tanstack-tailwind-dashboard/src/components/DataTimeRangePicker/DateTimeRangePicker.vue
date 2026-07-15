<script setup lang="ts">
import type { DateValue } from "reka-ui";
import { RiCalendar2Line, RiCloseLine } from "@remixicon/vue";
import { computed, ref, watch } from "vue";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RangeCalendar } from "@/components/ui/range-calendar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { defaultPresets } from "./presets";
import SimpleTimePicker from "./SimpleTimePicker.vue";
import type {
  CalendarRange,
  DateTimeRange,
  DateTimeRangePickerProps,
  DateTimeRangePreset,
} from "./types";
import {
  calendarDateToDate,
  cloneRange,
  dateToCalendarDate,
  formatDateTimeRange,
  isSameRange,
  normalizeDateTimeRange,
  validateDateTimeRange,
} from "./utils";
import { getTimeParts, mergeDateAndTime } from "@/utils/date.ts";

const {
  placeholder = "请选择日期时间范围",
  disabled = false,
  readonly = false,
  clearable = true,
  required = false,
  precision = "second",
  numberOfMonths = 2,
  weekStartsOn = 1,
  minDateTime,
  maxDateTime,
  minDuration,
  maxDuration,
  isDateTimeDisabled,
  presets,
  showPresets = true,
  showTime = true,
  use12HourFormat = false,
  commitMode = "confirm",
  closeOnComplete = false,
  defaultStartTime = { hours: 0, minutes: 0, seconds: 0 },
  defaultEndTime = { hours: 23, minutes: 59, seconds: 59 },
  validate,
  error,
  locale = "zh-CN",
  ariaLabel = "选择日期时间范围",
  class: triggerClass,
  contentClass,
  align = "start",
} = defineProps<DateTimeRangePickerProps>();

const emit = defineEmits<{
  confirm: [value: DateTimeRange | undefined];
  cancel: [];
  clear: [];
}>();

/** 已提交的正式值。 */
const value = defineModel<DateTimeRange | undefined>();
/** 浮层开关。 */
const open = defineModel<boolean>("open", { default: false });
/** 用户在浮层内编辑、尚未确认的临时值。 */
const draft = ref<DateTimeRange | undefined>();

const activePresets = computed<DateTimeRangePreset[]>(() => presets ?? defaultPresets);

// 浮层打开时把正式值克隆到临时值，编辑过程只操作临时值。
watch(open, (next, prev) => {
  if (next && !prev) draft.value = cloneRange(value.value);
});

// 喂给日历的 DateRange（仅年月日）。
const calendarRange = computed<CalendarRange>(() => ({
  start: draft.value?.from ? dateToCalendarDate(draft.value.from) : undefined,
  end: draft.value?.to ? dateToCalendarDate(draft.value.to) : undefined,
}));

// 始终返回一个 DateValue：reka-ui 的 RangeCalendar 在 placeholder 由有值变为
// undefined 时会读取 placeholder.calendar 而崩溃（如选中快捷项后点取消）。
const calendarPlaceholder = computed<DateValue>(() =>
  draft.value?.from ? dateToCalendarDate(draft.value.from) : dateToCalendarDate(new Date()),
);

const minValue = computed(() => (minDateTime ? dateToCalendarDate(minDateTime) : undefined));
const maxValue = computed(() => (maxDateTime ? dateToCalendarDate(maxDateTime) : undefined));

// 校验：内置规则通过后再跑外部 validate。
const validation = computed(() => {
  const builtin = validateDateTimeRange(draft.value, {
    required,
    minDateTime,
    maxDateTime,
    minDuration,
    maxDuration,
    isDateTimeDisabled,
  });
  if (!builtin.valid) return builtin;
  return validate?.(draft.value) ?? { valid: true };
});

const internalError = computed(() =>
  validation.value.valid ? undefined : validation.value.message,
);
// 外部错误优先于内部校验错误。
const displayError = computed(() => error ?? internalError.value);

const hasValue = computed(() => Boolean(value.value?.from || value.value?.to));
const displayLabel = computed(() => formatDateTimeRange(value.value, precision, placeholder));

const showSeconds = computed(() => precision === "second");

// immediate 模式下提交临时值；confirm 模式仅保留草稿。
function commitImmediate(next: DateTimeRange | undefined) {
  value.value = normalizeDateTimeRange(next, precision);
  if (closeOnComplete && next?.from && next?.to) open.value = false;
}

function updateDraft(next: DateTimeRange | undefined) {
  draft.value = next;
  if (commitMode === "immediate") commitImmediate(next);
}

function onCalendarUpdate(range: CalendarRange | undefined) {
  if (readonly) return;
  const start = range?.start ? calendarDateToDate(range.start) : undefined;
  const end = range?.end ? calendarDateToDate(range.end) : undefined;
  // 保留已编辑的时分秒，新边界使用默认时间。
  const from = start
    ? mergeDateAndTime(start, draft.value?.from ? getTimeParts(draft.value.from) : defaultStartTime)
    : undefined;
  const to = end
    ? mergeDateAndTime(end, draft.value?.to ? getTimeParts(draft.value.to) : defaultEndTime)
    : undefined;
  updateDraft({ from, to });
}

function onStartTimeChange(date: Date) {
  if (readonly || !draft.value?.from) return;
  updateDraft({ from: date, to: draft.value.to });
}

function onEndTimeChange(date: Date) {
  if (readonly || !draft.value?.to) return;
  updateDraft({ from: draft.value.from, to: date });
}

function applyPreset(preset: DateTimeRangePreset) {
  if (readonly || preset.disabled) return;
  const range = typeof preset.value === "function" ? preset.value() : preset.value;
  updateDraft(cloneRange(range));
}

function isPresetActive(preset: DateTimeRangePreset): boolean {
  if (typeof preset.value === "function") return false;
  return isSameRange(draft.value, preset.value);
}

function doConfirm() {
  if (!validation.value.valid) return;
  const next = normalizeDateTimeRange(draft.value, precision);
  value.value = next;
  emit("confirm", next);
  open.value = false;
}

function doCancel() {
  draft.value = cloneRange(value.value);
  emit("cancel");
  open.value = false;
}

// 清空是明确操作：立即提交 undefined 并关闭（两种模式一致）。
function doClear(event?: Event) {
  console.log("event", event);
  event?.stopPropagation();
  draft.value = undefined;
  value.value = undefined;
  emit("clear");
  open.value = false;
}

// 浮层关闭（点击外部 / Escape）：confirm 模式视为取消，丢弃临时值。
function onOpenChange(next: boolean) {
  if (!next && commitMode === "confirm") {
    draft.value = cloneRange(value.value);
    emit("cancel");
  }
  open.value = next;
}

const errorId = "datetime-range-error";
</script>

<template>
  <Popover :open @update:open="onOpenChange">
    <PopoverTrigger as-child>
      <Button
        type="button"
        variant="outline"
        :disabled
        :aria-label="ariaLabel"
        :aria-expanded="open"
        aria-haspopup="dialog"
        :aria-invalid="Boolean(displayError)"
        :aria-describedby="displayError ? errorId : undefined"
        :class="
          cn(
            'w-full min-w-0 justify-start gap-2 font-normal relative',
            !hasValue && 'text-muted-foreground',
            displayError && 'border-destructive',
            triggerClass,
          )
        "
      >
        <RiCalendar2Line class="size-4 shrink-0" />
        <span class="truncate">{{ displayLabel }}</span>
        <span
          v-if="clearable && hasValue && !disabled && !readonly"
          @click.stop="doClear"
          @pointerdown.stop
          class="absolute right-2.5"
        >
          <RiCloseLine
            class="size-4 shrink-0 cursor-pointer opacity-60 transition-opacity hover:opacity-100 pointer-events-auto"
        /></span>
      </Button>
    </PopoverTrigger>

    <PopoverContent :align :class="cn('w-auto p-0', contentClass)">
      <div class="flex flex-col sm:flex-row">
        <!-- 快捷选项 -->
        <template v-if="showPresets && activePresets.length">
          <div class="flex max-h-72 flex-col gap-1 overflow-y-auto p-2 sm:w-32 sm:shrink-0">
            <Button
              v-for="preset in activePresets"
              :key="preset.label"
              type="button"
              variant="ghost"
              size="sm"
              :disabled="preset.disabled || readonly"
              :class="
                cn(
                  'justify-start font-normal',
                  isPresetActive(preset) && 'bg-accent text-accent-foreground',
                )
              "
              @click="applyPreset(preset)"
            >
              {{ preset.label }}
            </Button>
          </div>
          <Separator orientation="vertical" class="hidden h-auto sm:block" />
        </template>

        <div class="flex flex-col">
          <!-- 日历 -->
          <RangeCalendar
            :model-value="calendarRange as never"
            :number-of-months
            :week-starts-on
            :locale
            :min-value="minValue as never"
            :max-value="maxValue as never"
            :placeholder="calendarPlaceholder as never"
            @update:model-value="onCalendarUpdate"
          />

          <!-- 时间 -->
          <template v-if="showTime">
            <Separator />
            <div class="grid grid-cols-2 gap-3 p-3">
              <div class="flex flex-col gap-1.5">
                <Label class="text-muted-foreground text-xs">开始时间</Label>
                <SimpleTimePicker
                  v-if="draft?.from"
                  :model-value="draft.from"
                  :show-seconds
                  :use12-hour-format="use12HourFormat"
                  :min="minDateTime"
                  :max="maxDateTime"
                  :disabled="readonly"
                  @update:model-value="onStartTimeChange"
                />
                <Button
                  v-else
                  type="button"
                  variant="outline"
                  class="justify-start font-normal"
                  disabled
                >
                  请先选择开始日期
                </Button>
              </div>
              <div class="flex flex-col gap-1.5">
                <Label class="text-muted-foreground text-xs">结束时间</Label>
                <SimpleTimePicker
                  v-if="draft?.to"
                  :model-value="draft.to"
                  :show-seconds
                  :use12-hour-format="use12HourFormat"
                  :min="minDateTime"
                  :max="maxDateTime"
                  :disabled="readonly"
                  @update:model-value="onEndTimeChange"
                />
                <Button
                  v-else
                  type="button"
                  variant="outline"
                  class="justify-start font-normal"
                  disabled
                >
                  请先选择结束日期
                </Button>
              </div>
            </div>
          </template>

          <!-- 错误提示 + 操作区 -->
          <Separator />
          <div class="flex items-center justify-between gap-2 p-3">
            <p
              v-if="displayError"
              :id="errorId"
              role="alert"
              class="text-destructive truncate text-sm"
            >
              {{ displayError }}
            </p>
            <span v-else class="text-muted-foreground text-xs">
              {{ commitMode === "confirm" ? "选择后点击确定生效" : "" }}
            </span>

            <div v-if="!readonly" class="flex shrink-0 items-center gap-2">
              <Button v-if="clearable" type="button" variant="ghost" size="sm" @click="doClear">
                清空
              </Button>
              <template v-if="commitMode === 'confirm'">
                <Button type="button" variant="outline" size="sm" @click="doCancel">取消</Button>
                <Button type="button" size="sm" :disabled="!validation.valid" @click="doConfirm">
                  确定
                </Button>
              </template>
            </div>
          </div>
        </div>
      </div>
    </PopoverContent>
  </Popover>
</template>
