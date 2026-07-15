<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { reactiveOmit } from "@vueuse/core";
import { cn } from "@/lib/utils";
import TableCell from "./TableCell.vue";
import TableRow from "./TableRow.vue";

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes["class"];
    colspan?: number;
  }>(),
  {
    colspan: 1,
  },
);

const delegatedProps = reactiveOmit(props, "class");
</script>

<template>
  <TableRow>
    <TableCell
      :class="cn('text-muted-foreground p-4 text-sm whitespace-nowrap align-middle', props.class)"
      v-bind="delegatedProps"
    >
      <div
        data-slot="empty"
        class="flex min-h-[20rem] flex-col items-center justify-center gap-2 py-10 text-center"
      >
        <slot />
      </div>
    </TableCell>
  </TableRow>
</template>
