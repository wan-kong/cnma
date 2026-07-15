<script lang="ts" setup>
import type { HTMLAttributes } from "vue";
import { useId } from "reka-ui";
import { provide, toRef } from "vue";
import { cn } from "@/lib/utils";
import { FORM_ITEM_INLINE_INJECTION_KEY, FORM_ITEM_INJECTION_KEY } from "./injectionKeys";

const { inline = false, class: className } = defineProps<{
  class?: HTMLAttributes["class"];
  // 为 true 时 label 与控件同行排列，否则 label 堆叠在控件上方。
  inline?: boolean;
}>();

const id = useId();
provide(FORM_ITEM_INJECTION_KEY, id);
provide(
  FORM_ITEM_INLINE_INJECTION_KEY,
  toRef(() => inline),
);
</script>

<template>
  <div
    data-slot="form-item"
    :data-inline="inline"
    :class="cn(inline ? 'flex items-center gap-2' : 'grid gap-2', className)"
  >
    <slot />
  </div>
</template>
