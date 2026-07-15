<template>
  <li
    :class="
      cn(
        'grid w-full items-center gap-2 rounded-sm px-2 py-1.5 transition-colors duration-150 hover:bg-accent/60 motion-reduce:transition-none',
        hasSizeInfo
          ? 'grid-cols-[1.5rem_minmax(0,1fr)_4.75rem_2rem]'
          : 'grid-cols-[1.5rem_minmax(0,1fr)_2rem]',
        props.class,
      )
    "
  >
    <span
      class="inline-flex size-5 shrink-0 items-center justify-center rounded-sm font-bold leading-none tracking-normal shadow-xs text-xs"
      :class="file.toneClass"
      aria-hidden="true"
    >
      <span class="scale-65"> {{ file.extension.slice(0, 3) }}</span>
    </span>

    <Tooltip>
      <TooltipTrigger as-child>
        <span class="min-w-0 truncate text-sm leading-5 text-left">{{ file.name }}</span>
      </TooltipTrigger>
      <TooltipContent side="top" align="start" class="max-w-80 text-background">
        {{ file.name }}
      </TooltipContent>
    </Tooltip>

    <span
      v-if="hasSizeInfo"
      class="min-w-0 shrink-0 truncate text-right text-xs leading-5 text-muted-foreground"
    >
      {{ file.sizeLabel || "-" }}
    </span>

    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      class="size-7 rounded-md transition-[background-color,color,transform] active:scale-95 motion-reduce:transition-none"
      :class="file.disabled ? 'opacity-50' : ''"
      :disabled="file.disabled || props.loading"
      :aria-label="`下载 ${file.name}`"
      :title="`下载 ${file.name}`"
      @click.stop="emits('download')"
    >
      <RiLoader4Line v-if="props.loading" class="size-4 animate-spin" />
      <RiDownloadLine v-else class="size-4" />
    </Button>
  </li>
</template>

<script setup lang="ts" name="FileStackItem">
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { DisplayFile } from "./types";
import { Button } from "@/components/ui/button";
import { RiDownloadLine, RiLoader4Line } from "@remixicon/vue";
import { computed, type HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";

const props = defineProps<{
  file: DisplayFile;
  loading?: boolean;
  class?: HTMLAttributes["class"];
}>();
const emits = defineEmits(["download"]);

const hasSizeInfo = computed(() => !!props.file.sizeLabel);
</script>

<style scoped lang="scss"></style>
