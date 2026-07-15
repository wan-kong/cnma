<script setup lang="ts">
import type { HTMLAttributes, StyleValue } from "vue";
import { cn } from "@/lib/utils";

const props = defineProps<{
  class?: HTMLAttributes["class"];
  /** 作用于外层滚动容器（边框、圆角、最小高度等）。 */
  containerClass?: HTMLAttributes["class"];
  /** 作用于内层 <table>（列宽 CSS 变量、固定布局总宽等）。 */
  tableStyle?: StyleValue;
}>();
</script>

<template>
  <div
    data-slot="table-container"
    :class="
      cn(
        'border-border bg-table-cell scrollbar-sm relative w-full overflow-auto overscroll-x-none rounded-md border has-data-[slot=empty]:overflow-x-hidden',
        props.containerClass,
      )
    "
  >
    <table
      data-slot="table"
      :style="props.tableStyle"
      :class="cn('w-full caption-bottom border-separate border-spacing-0 text-sm', props.class)"
    >
      <slot />
    </table>
  </div>
</template>
