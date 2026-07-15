<script setup lang="ts">
import type { LinkNodeProps } from "markstream-vue";
import { RiCheckboxCircleLine, RiFileCopyLine } from "@remixicon/vue";
import { onBeforeUnmount, shallowRef, watch } from "vue";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "vue-sonner";

const props = defineProps<LinkNodeProps>();
const isDialogOpen = shallowRef(false);
const isCopied = shallowRef(false);
let copyResetTimer: ReturnType<typeof setTimeout> | undefined;

function handleClick() {
  isDialogOpen.value = true;
}

function resetCopyState() {
  isCopied.value = false;
  if (copyResetTimer) {
    clearTimeout(copyResetTimer);
    copyResetTimer = undefined;
  }
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(props.node.href);
    isCopied.value = true;
    toast.success("复制成功！");

    if (copyResetTimer) clearTimeout(copyResetTimer);
    copyResetTimer = setTimeout(() => {
      isCopied.value = false;
      copyResetTimer = undefined;
    }, 1800);
  } catch {
    toast.error("复制失败，请手动复制");
  }
}

watch(isDialogOpen, (open) => {
  if (!open) resetCopyState();
});

onBeforeUnmount(resetCopyState);
</script>

<template>
  <div>
    <button
      type="button"
      :title="props.node.title ?? undefined"
      :class="cn(buttonVariants({ variant: 'link' }), 'px-0 text-base')"
      @click="handleClick"
    >
      {{ props.node.text || props.node.href }}
    </button>

    <Dialog v-model:open="isDialogOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>请勿直接访问外部链接</DialogTitle>
          <DialogDescription>
            为避免意外跳转，模板默认拦截直接打开链接。你可以复制链接后自行确认访问。
          </DialogDescription>
        </DialogHeader>

        <Input :model-value="props.node.href" readonly />

        <DialogFooter>
          <Button
            type="button"
            :class="cn('min-w-28', isCopied && 'bg-emerald-600 hover:bg-emerald-600')"
            :aria-label="isCopied ? '链接已复制' : '复制链接'"
            @click="copyLink"
          >
            <RiCheckboxCircleLine v-if="isCopied" class="size-4" aria-hidden="true" />
            <RiFileCopyLine v-else class="size-4" aria-hidden="true" />
            <span aria-live="polite">{{ isCopied ? "已复制" : "复制链接" }}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
