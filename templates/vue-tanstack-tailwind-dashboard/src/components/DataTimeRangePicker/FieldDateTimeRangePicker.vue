<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import DateTimeRangePicker from "./DateTimeRangePicker.vue";
import type { DateTimePrecision, DateTimeRange } from "./types";

/** 可查询的时间字段选项。 */
export interface DateTimeFieldOption {
  label: string;
  value: string;
  disabled?: boolean;
}

const {
  fields,
  placeholder = "请选择日期时间范围",
  precision = "second",
  commitMode = "confirm",
  clearable = true,
  disabled = false,
  fieldClass = "w-28",
  class: rootClass,
} = defineProps<{
  /** 时间字段下拉选项。 */
  fields: DateTimeFieldOption[];
  /** 范围占位文案。 */
  placeholder?: string;
  /** 时间精度。 */
  precision?: DateTimePrecision;
  /** 值提交模式。 */
  commitMode?: "immediate" | "confirm";
  /** 是否允许清空范围。 */
  clearable?: boolean;
  /** 是否禁用。 */
  disabled?: boolean;
  /** 字段下拉宽度。 */
  fieldClass?: HTMLAttributes["class"];
  /** 容器 class。 */
  class?: HTMLAttributes["class"];
}>();

/** 当前查询的时间字段（仅允许一个）。 */
const field = defineModel<string>("field", { required: true });
/** 当前时间范围。 */
const range = defineModel<DateTimeRange | undefined>();
</script>

<template>
  <div
    :class="
      cn(
        'focus-within:border-ring focus-within:ring-ring/50 flex items-center rounded-md border shadow-xs transition-[color,box-shadow] focus-within:ring-3',
        disabled && 'pointer-events-none opacity-50',
        rootClass,
      )
    "
  >
    <Select v-model="field" :disabled>
      <SelectTrigger
        :class="
          cn('shrink-0 pr-0 rounded-r-none border-0 shadow-none focus-visible:ring-0', fieldClass)
        "
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem
          v-for="opt in fields"
          :key="opt.value"
          :value="opt.value"
          :disabled="opt.disabled"
        >
          {{ opt.label }}
        </SelectItem>
      </SelectContent>
    </Select>

    <Separator orientation="vertical" decorative class="h-5" />

    <DateTimeRangePicker
      v-model="range"
      class="flex-1 rounded-l-none border-0 shadow-none focus-visible:ring-0"
      :placeholder
      :precision
      :commit-mode="commitMode"
      :clearable
      :disabled
    />
  </div>
</template>
