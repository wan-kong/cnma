<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";

const props = defineProps<{
  class?: HTMLAttributes["class"];
}>();
</script>

<template>
  <tr data-slot="table-row" :class="cn('group/row transition-colors', props.class)">
    <slot />
  </tr>
</template>
