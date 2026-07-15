<script setup lang="ts">
import {
  RiArrowDownSLine,
  RiDownloadLine,
  RiErrorWarningLine,
  RiFileTextLine,
  RiInboxArchiveLine,
  RiLoader4Line,
} from "@remixicon/vue";
import { computed, shallowRef } from "vue";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { DisplayFile, FileStackListItem } from "./types.ts";
import FileStackItem from "./FileStackItem.vue";
import { formatSize, getExtension, getToneClass } from "./utils.ts";
const props = withDefaults(
  defineProps<{
    files?: FileStackListItem[] | null;
    label?: string;
    emptyText?: string;
    emptyDescription?: string;
    loading?: boolean;
    errorText?: string;
    maxPreview?: number;
    downloadingIds?: Array<string | number>;
    downloadingAll?: boolean;
    allowDownloadAll?: boolean;
  }>(),
  {
    files: null,
    label: "文件列表",
    emptyText: "暂无文件",
    emptyDescription: "上传文件后将在此处显示",
    loading: false,
    errorText: "",
    maxPreview: 3,
    downloadingIds: () => [],
    downloadingAll: false,
    allowDownloadAll: true,
  },
);

const emit = defineEmits<{
  download: [file: FileStackListItem];
  downloadAll: [];
}>();

const open = shallowRef(false);

const displayFiles = computed<DisplayFile[]>(() =>
  (props.files ?? []).flatMap((file) => {
    const name = file.name.trim();
    if (!name) return [];

    const extension = getExtension(name, file.type);
    return {
      ...file,
      name,
      extension,
      sizeLabel: formatSize(file.size),
      toneClass: getToneClass(extension),
    };
  }),
);
const hasFiles = computed(() => displayFiles.value.length > 0);
const previewFiles = computed(() => displayFiles.value.slice(0, Math.max(props.maxPreview, 0)));
const hiddenCount = computed(() =>
  Math.max(displayFiles.value.length - previewFiles.value.length, 0),
);
const countLabel = computed(() =>
  hasFiles.value ? `${displayFiles.value.length} 个文件` : props.emptyText,
);
const triggerTitle = computed(() =>
  hasFiles.value ? displayFiles.value.map((file) => file.name).join("\n") : props.emptyText,
);
const panelCountLabel = computed(() => `${props.label}（${displayFiles.value.length}）`);
const canDownloadAll = computed(
  () =>
    props.allowDownloadAll && displayFiles.value.length > 1 && !props.errorText && !props.loading,
);

function isDownloading(file: FileStackListItem) {
  return props.downloadingAll || props.downloadingIds.includes(file.id);
}

function onDownload(file: FileStackListItem) {
  if (file.disabled || isDownloading(file)) return;
  emit("download", file);
}
</script>

<template>
  <TooltipProvider>
    <Popover v-model:open="open">
      <PopoverTrigger as-child>
        <button
          type="button"
          class="group inline-flex h-10 w-full min-w-0 items-center gap-3 rounded-md border border-border/80 bg-background px-2.5 text-foreground shadow-xs outline-none transition-all duration-150 hover:border-ring/40 hover:bg-accent/70 hover:shadow-sm focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 motion-reduce:transition-none sm:w-[min(100%,20rem)] sm:min-w-45"
          :class="[
            open ? 'border-ring/40 bg-accent/70 shadow-sm' : '',
            loading ? 'pointer-events-none' : '',
            errorText ? 'text-destructive' : '',
          ]"
          :title="triggerTitle"
          :aria-label="`查看${panelCountLabel}`"
        >
          <template v-if="loading">
            <div class="inline-flex shrink-0 items-center pl-0.5 [&>*+*]:-ml-1.5">
              <Skeleton v-for="index in 3" :key="index" class="size-6 rounded-sm shadow-xs" />
            </div>
            <Skeleton class="h-4 w-16" />
          </template>

          <template v-else-if="hasFiles">
            <FileStackItem
              v-if="displayFiles.length === 1"
              :file="displayFiles[0]"
              :loading="isDownloading(displayFiles[0])"
              @download="onDownload(displayFiles[0])"
              class="p-0"
            ></FileStackItem>

            <template v-else>
              <div
                class="inline-flex shrink-0 items-center pl-0.5 [&>*+*]:-ml-1.5"
                aria-hidden="true"
              >
                <span
                  v-for="file in previewFiles"
                  :key="file.id"
                  class="inline-flex size-6 shrink-0 items-center justify-center rounded-sm text-xs border border-background font-bold leading-none tracking-normal shadow-xs"
                  :class="file.toneClass"
                >
                  <span class="scale-75"> {{ file.extension.slice(0, 3) }}</span>
                </span>
                <span
                  v-if="hiddenCount > 0"
                  class="inline-flex size-6 shrink-0 items-center justify-center rounded-sm border border-border/70 bg-muted text-[11px] font-bold leading-none text-muted-foreground shadow-xs"
                >
                  +{{ hiddenCount }}
                </span>
              </div>
              <span
                class="min-w-0 flex-1 text-right truncate text-muted-foreground text-sm font-medium leading-5"
                >{{ countLabel }}</span
              >
              <RiArrowDownSLine
                class="size-4 shrink-0 text-muted-foreground transition-transform duration-150 motion-reduce:transition-none"
                :class="open ? 'rotate-180' : ''"
              />
            </template>
          </template>

          <template v-else>
            <span
              class="inline-flex size-6 shrink-0 items-center justify-center rounded-sm bg-muted/70 text-muted-foreground"
              aria-hidden="true"
            >
              <RiFileTextLine class="size-4" />
            </span>
            <span class="min-w-0 truncate text-sm font-medium leading-5 text-muted-foreground">
              {{ emptyText }}
            </span>
          </template>
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" class="w-105 max-w-[calc(100vw-2rem)] p-0">
        <div class="flex h-10 items-center justify-between gap-3 border-b px-4">
          <div class="min-w-0 truncate text-sm font-medium">{{ panelCountLabel }}</div>
          <Button
            v-if="canDownloadAll"
            type="button"
            variant="ghost"
            size="sm"
            class="h-7 px-2 text-xs"
            :disabled="downloadingAll"
            :aria-label="`下载全部${label}`"
            @click.stop="emit('downloadAll')"
          >
            <RiLoader4Line v-if="downloadingAll" class="size-3.5 animate-spin" />
            <RiDownloadLine v-else class="size-3.5" />
            全部下载
          </Button>
        </div>

        <div v-if="loading" class="space-y-2 p-3">
          <div
            v-for="index in 4"
            :key="index"
            class="grid grid-cols-[1.5rem_minmax(0,1fr)_2rem] items-center gap-3 px-1 py-1.5"
          >
            <Skeleton class="size-5 rounded-sm" />
            <Skeleton class="h-4 min-w-0" />
            <Skeleton class="size-7 rounded-md" />
          </div>
        </div>

        <div
          v-else-if="errorText"
          class="flex min-h-24 items-center justify-center gap-3 px-4 py-6"
        >
          <RiErrorWarningLine class="size-8 shrink-0 text-destructive/80" />
          <div class="min-w-0">
            <div class="text-sm font-medium text-destructive">文件列表异常</div>
            <p class="mt-0.5 text-xs leading-5 text-muted-foreground">{{ errorText }}</p>
          </div>
        </div>

        <div
          v-else-if="!hasFiles"
          class="flex min-h-24 items-center justify-center gap-3 px-4 py-6"
        >
          <div
            class="flex size-11 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground/70"
          >
            <RiInboxArchiveLine class="size-7" />
          </div>
          <div class="min-w-0">
            <div class="text-sm font-medium">{{ emptyText }}</div>
            <p class="mt-0.5 text-xs leading-5 text-muted-foreground">{{ emptyDescription }}</p>
          </div>
        </div>

        <ol v-else class="scrollbar-sm max-h-80 overflow-y-auto p-2">
          <FileStackItem
            v-for="file in displayFiles"
            :key="file.id"
            :file="file"
            :loading="isDownloading(file)"
            @download="onDownload(file)"
          >
          </FileStackItem>
        </ol>
      </PopoverContent>
    </Popover>
  </TooltipProvider>
</template>
