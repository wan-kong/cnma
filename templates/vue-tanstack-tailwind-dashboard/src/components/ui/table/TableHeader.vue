<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";

const props = defineProps<{
  class?: HTMLAttributes["class"];
}>();
</script>

<template>
  <thead
    data-slot="table-header"
    :class="
      cn(
        'sticky top-0 z-20 [&_tr:first-child_th:first-child]:rounded-tl-[5px] [&_tr:first-child_th:last-child]:rounded-tr-[5px]',
        props.class,
      )
    "
  >
    <slot />
  </thead>
</template>
