<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";

const props = defineProps<{
  class?: HTMLAttributes["class"];
}>();
</script>

<template>
  <tbody
    data-slot="table-body"
    :class="
      cn(
        '[&_tr:last-child_td]:border-b-0 [&_tr:last-child_td:first-child]:rounded-bl-[5px] [&_tr:last-child_td:last-child]:rounded-br-[5px]',
        props.class,
      )
    "
  >
    <slot />
  </tbody>
</template>
