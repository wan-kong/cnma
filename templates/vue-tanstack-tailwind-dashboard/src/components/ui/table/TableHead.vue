<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";

const props = defineProps<{
  class?: HTMLAttributes["class"];
}>();
</script>

<template>
  <th
    data-slot="table-head"
    :class="
      cn(
        'text-sm text-muted-foreground border-border bg-table-header has-data-sort:text-foreground h-10 select-none border-b px-3 text-left align-middle font-mono! font-medium uppercase! whitespace-nowrap **:font-mono! **:uppercase!',
        props.class,
      )
    "
  >
    <slot />
  </th>
</template>
