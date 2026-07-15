<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { RiLoader4Line } from "@remixicon/vue";
import { cn } from "@/lib/utils";

const props = defineProps<{
  class?: HTMLAttributes["class"];
}>();
</script>

<template>
  <RiLoader4Line
    role="status"
    aria-label="加载中"
    :class="cn('size-4 animate-spin', props.class)"
  />
</template>
