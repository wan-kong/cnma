<script setup lang="ts">
import type { SortDirection } from "@tanstack/vue-table";
import { RiArrowDownLongLine, RiArrowUpDownFill, RiArrowUpLongLine } from "@remixicon/vue";
import type { HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";

const props = defineProps<{
  /** 当前排序方向：false 未排序 / "asc" 升序 / "desc" 降序。 */
  direction: false | SortDirection;
  class?: HTMLAttributes["class"];
}>();

// 三态各用一枚图标；以 direction 为 key 让每次切换都触发过渡。
const ICON = {
  asc: RiArrowUpLongLine,
  desc: RiArrowDownLongLine,
  none: RiArrowUpDownFill,
} as const;
</script>

<template>
  <span
    :class="cn('relative inline-flex size-3.5 shrink-0 items-center justify-center', props.class)"
  >
    <!-- 绝对定位叠放，过渡期重叠交叉；竖直方向轻微位移呼应排序方向。 -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 translate-y-1"
      leave-active-class="transition duration-200 ease-out"
      leave-to-class="opacity-0 -translate-y-1"
    >
      <component
        :is="ICON[direction || 'none']"
        :key="direction || 'none'"
        class="absolute size-full"
        :class="direction ? 'text-foreground' : 'text-muted-foreground/40'"
      />
    </Transition>
  </span>
</template>
