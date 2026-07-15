<script setup lang="ts">
import { RiCheckLine, RiTimeLine } from "@remixicon/vue";
import { computed, nextTick, ref, watch } from "vue";
import { Button, buttonVariants } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const {
  showSeconds = true,
  min,
  max,
  disabled = false,
} = defineProps<{
  /** 是否显示秒列。 */
  showSeconds?: boolean;
  /** 可选最小时间（含）。 */
  min?: Date;
  /** 可选最大时间（含）。 */
  max?: Date;
  /** 是否禁用。 */
  disabled?: boolean;
}>();

/** 被编辑的时间（保留日期部分，仅改时分秒）。 */
const value = defineModel<Date>({ required: true });

const open = ref(false);

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => i);
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, i) => i);
const SECOND_OPTIONS = MINUTE_OPTIONS;

const h24 = computed(() => value.value.getHours());
const minute = computed(() => value.value.getMinutes());
const second = computed(() => value.value.getSeconds());
// 12 小时制下展示的小时（1-12）。
const displayHour = computed(() => {
  return h24.value;
});

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

// 触发器展示文案，例如 09:30:00 / 09:30 PM。
const displayLabel = computed(() => {
  const time = showSeconds
    ? `${pad(displayHour.value)}:${pad(minute.value)}:${pad(second.value)}`
    : `${pad(displayHour.value)}:${pad(minute.value)}`;
  return time;
});

/** 克隆当前值并写入时分秒（秒列隐藏时归零）。 */
function buildDate(hours: number, minutes: number, seconds: number): Date {
  const next = new Date(value.value.getTime());
  next.setHours(hours, minutes, showSeconds ? seconds : 0, 0);
  return next;
}

/** 给定时间区间 [start, end] 是否完全落在 [min, max] 之外。 */
function outOfRange(start: Date, end: Date): boolean {
  if (min && end.getTime() < min.getTime()) return true;
  if (max && start.getTime() > max.getTime()) return true;
  return false;
}

function isHourDisabled(hourOption: number): boolean {
  const hours = hourOption;
  return outOfRange(buildDate(hours, 0, 0), buildDate(hours, 59, 59));
}
function isMinuteDisabled(m: number): boolean {
  return outOfRange(buildDate(h24.value, m, 0), buildDate(h24.value, m, showSeconds ? 59 : 0));
}
function isSecondDisabled(s: number): boolean {
  const t = buildDate(h24.value, minute.value, s);
  return outOfRange(t, t);
}

function selectHour(hourOption: number) {
  const hours = hourOption;
  value.value = buildDate(hours, minute.value, second.value);
}
function selectMinute(m: number) {
  value.value = buildDate(h24.value, m, second.value);
}
function selectSecond(s: number) {
  value.value = buildDate(h24.value, minute.value, s);
}

// 选中项滚动到列中央：弹层打开时执行。
const hourEl = ref<HTMLElement>();
const minuteEl = ref<HTMLElement>();
const secondEl = ref<HTMLElement>();
const ampmEl = ref<HTMLElement>();

function scrollToSelected() {
  void nextTick(() => {
    for (const el of [hourEl.value, minuteEl.value, secondEl.value, ampmEl.value]) {
      el?.scrollIntoView({ block: "center" });
    }
  });
}

watch(open, (next) => {
  if (next) scrollToSelected();
});

const cellClass = (selected: boolean) =>
  cn(
    buttonVariants({ variant: selected ? "default" : "ghost", size: "sm" }),
    "h-7 w-full justify-between px-2 tabular-nums",
  );
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <Button
        type="button"
        variant="outline"
        :disabled
        :class="cn('w-full justify-between gap-2 font-normal tabular-nums')"
      >
        <span>{{ displayLabel }}</span>
        <RiTimeLine class="size-4 shrink-0 opacity-60" />
      </Button>
    </PopoverTrigger>

    <PopoverContent class="p-0 w-50" align="start">
      <div class="flex h-52 divide-x">
        <!-- 时 -->
        <div class="flex flex-col">
          <div class="text-muted-foreground py-1 text-center text-xs">时</div>
          <div class="min-h-0 flex-1 overflow-y-auto scroll-fade scroll-fade-24">
            <div class="flex w-16 flex-col gap-0.5 p-1">
              <button
                v-for="h in HOUR_OPTIONS"
                :key="`h-${h}`"
                :ref="
                  (el) => {
                    if (h === displayHour) hourEl = el as HTMLElement;
                  }
                "
                type="button"
                :disabled="isHourDisabled(h)"
                :class="cellClass(h === displayHour)"
                @click="selectHour(h)"
              >
                <span>{{ pad(h) }}</span>
                <RiCheckLine v-if="h === displayHour" class="size-3.5" />
              </button>
            </div>
          </div>
        </div>

        <!-- 分 -->
        <div class="flex flex-col">
          <div class="text-muted-foreground py-1 text-center text-xs">分</div>
          <div class="min-h-0 flex-1 overflow-y-auto scroll-fade scroll-fade-24">
            <div class="flex w-16 flex-col gap-0.5 p-1">
              <button
                v-for="m in MINUTE_OPTIONS"
                :key="`m-${m}`"
                :ref="
                  (el) => {
                    if (m === minute) minuteEl = el as HTMLElement;
                  }
                "
                type="button"
                :disabled="isMinuteDisabled(m)"
                :class="cellClass(m === minute)"
                @click="selectMinute(m)"
              >
                <span>{{ pad(m) }}</span>
                <RiCheckLine v-if="m === minute" class="size-3.5" />
              </button>
            </div>
          </div>
        </div>

        <!-- 秒 -->
        <div v-if="showSeconds" class="flex flex-col">
          <div class="text-muted-foreground py-1 text-center text-xs">秒</div>
          <div class="min-h-0 flex-1 overflow-y-auto scroll-fade scroll-fade-24">
            <div class="flex w-16 flex-col gap-0.5 p-1">
              <button
                v-for="s in SECOND_OPTIONS"
                :key="`s-${s}`"
                :ref="
                  (el) => {
                    if (s === second) secondEl = el as HTMLElement;
                  }
                "
                type="button"
                :disabled="isSecondDisabled(s)"
                :class="cellClass(s === second)"
                @click="selectSecond(s)"
              >
                <span>{{ pad(s) }}</span>
                <RiCheckLine v-if="s === second" class="size-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </PopoverContent>
  </Popover>
</template>
