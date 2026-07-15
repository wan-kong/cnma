<script setup lang="ts">
import RecordTable from "@/components/records/RecordTable.vue";

definePage({ name: "records", meta: { title: "数据记录", permissionKey: "alarm" } });
defineOptions({ name: "Records" });
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col gap-5">
    <div>
      <h1 class="text-xl font-semibold tracking-tight">数据记录</h1>
      <p class="text-muted-foreground mt-1 text-sm">
        基于 TanStack Vue Table 的服务端分页、排序、筛选和详情示例。
      </p>
    </div>
    <RecordTable />
  </div>
</template>
