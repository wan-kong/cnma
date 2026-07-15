<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { RiSideBarLine } from "@remixicon/vue";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useSidebar } from "./utils";

const props = defineProps<{
  class?: HTMLAttributes["class"];
}>();

const { toggleSidebar } = useSidebar();
</script>

<template>
  <Button
    data-sidebar="trigger"
    data-slot="sidebar-trigger"
    variant="ghost"
    size="icon"
    :class="cn('h-7 w-7', props.class)"
    @click="toggleSidebar"
  >
    <RiSideBarLine />
    <span class="sr-only">切换侧边栏</span>
  </Button>
</template>
