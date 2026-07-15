<script setup lang="ts">
import { TransitionPresets, useTransition } from "@vueuse/core";
import { computed, ref, watch } from "vue";

const { value, duration = 800 } = defineProps<{
  /** 目标数值。 */
  value: number;
  /** 动画时长（ms）。 */
  duration?: number;
}>();

// 从 0 缓动到目标值；目标变化时重新缓动。
const source = ref(0);
const output = useTransition(source, {
  duration,
  transition: TransitionPresets.easeOutCubic,
});

watch(
  () => value,
  (next) => {
    source.value = next;
  },
  { immediate: true },
);

const formatter = new Intl.NumberFormat("zh-CN");
const display = computed(() => formatter.format(Math.round(output.value)));
</script>

<template>{{ display }}</template>
