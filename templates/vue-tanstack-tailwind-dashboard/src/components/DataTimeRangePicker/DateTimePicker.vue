<script setup lang="ts">
import type { DateValue } from "reka-ui";
import type { DateTimePickerProps } from "./types";
import { RiCalendar2Line, RiCloseLine } from "@remixicon/vue";
import { computed } from "vue";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import SimpleTimePicker from "./SimpleTimePicker.vue";
import { calendarDateToDate, dateToCalendarDate, formatDateTime } from "./utils";
import { getTimeParts, mergeDateAndTime, normalizePrecision } from "@/utils/date.ts";

const {
  placeholder = "请选择日期时间",
  emptyText,
  timeLabel = "时间",
  clearHint = "清除后视为空",
  disabled = false,
  readonly = false,
  clearable = true,
  precision = "second",
  defaultTime = { hours: 0, minutes: 0, seconds: 0 },
  use12HourFormat = false,
  locale = "zh-CN",
  ariaLabel = "选择日期时间",
  class: triggerClass,
  contentClass,
  align = "start",
} = defineProps<DateTimePickerProps>();

const emit = defineEmits<{
  clear: [];
}>();

const value = defineModel<Date | undefined>();
const open = defineModel<boolean>("open", { default: false });

const hasValue = computed(() => Boolean(value.value));
const showSeconds = computed(() => precision === "second");
const displayLabel = computed(() =>
  value.value ? formatDateTime(value.value, precision) : (emptyText ?? placeholder),
);
const calendarPlaceholder = computed<DateValue>(() =>
  value.value ? dateToCalendarDate(value.value) : dateToCalendarDate(new Date()),
);

function updateDate(next: DateValue | undefined) {
  if (readonly) return;
  if (!next) {
    value.value = undefined;
    return;
  }
  const date = calendarDateToDate(next);
  const time = value.value ? getTimeParts(value.value) : defaultTime;
  value.value = normalizePrecision(mergeDateAndTime(date, time), precision);
}

function updateTime(date: Date) {
  if (readonly || !value.value) return;
  value.value = normalizePrecision(date, precision);
}

function clear(event?: Event) {
  event?.stopPropagation();
  if (readonly || disabled) return;
  value.value = undefined;
  emit("clear");
  open.value = false;
}
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <Button
        type="button"
        variant="outline"
        :disabled
        :aria-label="ariaLabel"
        :aria-expanded="open"
        aria-haspopup="dialog"
        :class="
          cn(
            'relative w-full min-w-0 justify-start gap-2 font-normal',
            !hasValue && 'text-muted-foreground',
            triggerClass,
          )
        "
      >
        <RiCalendar2Line class="size-4 shrink-0" />
        <span class="truncate">{{ displayLabel }}</span>
        <span
          v-if="clearable && hasValue && !disabled && !readonly"
          class="absolute right-2.5"
          @click.stop="clear"
          @pointerdown.stop
        >
          <RiCloseLine
            class="pointer-events-auto size-4 shrink-0 cursor-pointer opacity-60 transition-opacity hover:opacity-100"
          />
        </span>
      </Button>
    </PopoverTrigger>

    <PopoverContent :align :class="cn('w-auto p-0', contentClass)">
      <div class="flex flex-col">
        <Calendar
          :model-value="value ? (dateToCalendarDate(value) as never) : undefined"
          :placeholder="calendarPlaceholder as never"
          :locale
          @update:model-value="(next) => updateDate(next as DateValue | undefined)"
        />
        <Separator />
        <div class="flex flex-col gap-2 p-3">
          <div class="text-muted-foreground text-xs">{{ timeLabel }}</div>
          <SimpleTimePicker
            v-if="value"
            :model-value="value"
            :show-seconds
            :use12-hour-format="use12HourFormat"
            :disabled="readonly"
            @update:model-value="updateTime"
          />
          <Button v-else type="button" variant="outline" class="justify-start font-normal" disabled>
            请先选择日期
          </Button>
        </div>
        <Separator />
        <div class="flex items-center justify-between gap-2 p-3">
          <span class="text-muted-foreground text-xs">{{ clearHint }}</span>
          <div class="flex shrink-0 items-center gap-2">
            <Button
              v-if="clearable && !readonly"
              type="button"
              variant="ghost"
              size="sm"
              :disabled
              @click="clear"
            >
              清除
            </Button>
            <Button type="button" size="sm" @click="open = false">确定</Button>
          </div>
        </div>
      </div>
    </PopoverContent>
  </Popover>
</template>
