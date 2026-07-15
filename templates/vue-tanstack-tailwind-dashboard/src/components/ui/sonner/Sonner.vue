<script lang="ts" setup>
import type { ToasterProps } from "vue-sonner";
import {
  RiAlertFill,
  RiCheckboxCircleFill,
  RiCloseLine,
  RiErrorWarningFill,
  RiInformationFill,
  RiLoader4Line,
} from "@remixicon/vue";
import { Toaster as Sonner } from "vue-sonner";
import { cn } from "@/lib/utils";

const props = defineProps<ToasterProps>();
</script>

<template>
  <Sonner
    :class="cn('toaster group', props.class)"
    :style="{
      '--normal-bg': 'var(--popover)',
      '--normal-text': 'var(--popover-foreground)',
      '--normal-border': 'var(--border)',
      '--border-radius': 'var(--radius)',
    }"
    v-bind="props"
  >
    <template #success-icon>
      <RiCheckboxCircleFill class="size-4" />
    </template>
    <template #info-icon>
      <RiInformationFill class="size-4" />
    </template>
    <template #warning-icon>
      <RiAlertFill class="size-4" />
    </template>
    <template #error-icon>
      <RiErrorWarningFill class="size-4" />
    </template>
    <template #loading-icon>
      <div>
        <RiLoader4Line class="size-4 animate-spin" />
      </div>
    </template>
    <template #close-icon>
      <RiCloseLine class="size-4" />
    </template>
  </Sonner>
</template>
