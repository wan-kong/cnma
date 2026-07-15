<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";

const props = defineProps<{
  class?: HTMLAttributes["class"];
}>();
</script>

<template>
  <td
    data-slot="table-cell"
    :class="
      cn(
        'text-card-foreground border-border bg-table-cell group-hover/row:bg-table-cell-hover group-data-[state=selected]/row:bg-table-cell-active h-12 border-b px-3 py-2 align-middle whitespace-nowrap transition-colors has-[[role=checkbox]]:pr-0 *:[[role=checkbox]]:translate-y-0.5',
        props.class,
      )
    "
  >
    <slot />
  </td>
</template>
