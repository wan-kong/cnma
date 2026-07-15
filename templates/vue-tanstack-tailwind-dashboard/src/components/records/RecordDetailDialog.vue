<script setup lang="ts">
import { computed } from "vue";
import { toast } from "vue-sonner";
import type { DemoRecordStatus } from "@/api/demo";
import { useDemoRecordQuery, useDemoRecordStatusMutation } from "@/queries/demo";
import { formatDateTime } from "@/utils/date";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { RECORD_STATUS_META } from "./record-meta";

const open = defineModel<boolean>({ default: false });
const { recordId } = defineProps<{ recordId: number | null }>();

const currentId = computed(() => recordId);
const { data: record, isLoading } = useDemoRecordQuery(currentId);
const { mutateAsync: updateStatus, isLoading: updating } = useDemoRecordStatusMutation();

async function setStatus(status: DemoRecordStatus) {
  if (!record.value) return;
  await updateStatus({ id: record.value.id, status });
  toast.success(`记录已更新为${RECORD_STATUS_META[status].label}`);
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-xl">
      <DialogHeader>
        <DialogTitle>{{ record?.name ?? "记录详情" }}</DialogTitle>
        <DialogDescription>查看模拟记录信息，并体验状态 Mutation 与缓存失效。</DialogDescription>
      </DialogHeader>

      <div v-if="isLoading && !record" class="flex flex-col gap-3 py-2">
        <Skeleton class="h-6 w-40" />
        <Skeleton class="h-24 w-full" />
      </div>
      <div v-else-if="record" class="grid gap-4 py-2 sm:grid-cols-2">
        <div class="flex flex-col gap-1">
          <span class="text-muted-foreground text-xs">负责人</span>
          <span class="text-sm font-medium">{{ record.owner }}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-muted-foreground text-xs">分类</span>
          <span class="text-sm font-medium">{{ record.category }}</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-muted-foreground text-xs">当前状态</span>
          <Badge :variant="RECORD_STATUS_META[record.status].variant">
            {{ RECORD_STATUS_META[record.status].label }}
          </Badge>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-muted-foreground text-xs">最近更新</span>
          <span class="text-sm font-medium">{{ formatDateTime(record.updated_at) }}</span>
        </div>
        <div class="flex flex-col gap-1 sm:col-span-2">
          <span class="text-muted-foreground text-xs">说明</span>
          <p class="text-sm leading-6">{{ record.description }}</p>
        </div>
        <div class="flex flex-wrap gap-2 sm:col-span-2">
          <Badge v-for="tag in record.tags" :key="tag" variant="outline">{{ tag }}</Badge>
        </div>
      </div>

      <DialogFooter v-if="record" class="sm:justify-between">
        <Button variant="outline" @click="open = false">关闭</Button>
        <div class="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            :disabled="updating || record.status === 'pending'"
            @click="setStatus('pending')"
          >
            标为待处理
          </Button>
          <Button
            :disabled="updating || record.status === 'archived'"
            @click="setStatus('archived')"
          >
            归档记录
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
