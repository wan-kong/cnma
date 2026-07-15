<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { computed } from "vue";
import { cn } from "@/lib/utils";

const props = defineProps<{
  /** 当前页码（从 1 开始）。 */
  page: number;
  /** 每页条数。 */
  pageSize: number;
  /** 总条数。 */
  total: number;
  class?: HTMLAttributes["class"];
}>();

const numberFormatter = new Intl.NumberFormat("zh-CN");

// 当前页对应的数据区间，total 为 0 时归零。
const display = computed(() => {
  if (props.total <= 0) {
    return { start: 0, end: 0, text: "共 0 条" };
  }
  const start = (props.page - 1) * props.pageSize + 1;
  const end = Math.min(props.page * props.pageSize, props.total);
  return {
    start,
    end,
    text: `第 ${numberFormatter.format(start)}-${numberFormatter.format(end)} 条 / 共 ${numberFormatter.format(props.total)} 条`,
  };
});
</script>

<template>
  <div
    data-slot="pagination-info"
    :class="cn('text-muted-foreground text-sm whitespace-nowrap', props.class)"
  >
    <slot :start="display.start" :end="display.end" :total="total">{{ display.text }}</slot>
  </div>
</template>
