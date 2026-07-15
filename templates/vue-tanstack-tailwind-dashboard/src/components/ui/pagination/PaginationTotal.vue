<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { computed } from "vue";
import { cn } from "@/lib/utils";

const props = defineProps<{
  /** 总条数。 */
  total: number;
  class?: HTMLAttributes["class"];
}>();

// 千分位格式化，避免大数字难读。
const formatted = computed(() => new Intl.NumberFormat("zh-CN").format(props.total));
</script>

<template>
  <div
    data-slot="pagination-total"
    :class="cn('text-muted-foreground text-sm whitespace-nowrap', props.class)"
  >
    <slot :total="total" :formatted="formatted">共 {{ formatted }} 条</slot>
  </div>
</template>
