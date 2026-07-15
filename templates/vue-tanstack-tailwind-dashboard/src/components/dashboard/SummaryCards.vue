<script setup lang="ts">
import { RiArchiveLine, RiCheckboxCircleLine, RiFolderChartLine, RiTimeLine } from "@remixicon/vue";
import type { Component } from "vue";
import type { DemoSummary } from "@/api/demo";
import AnimatedNumber from "@/components/AnimatedNumber.vue";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const { summary, loading = false } = defineProps<{
  summary?: DemoSummary;
  loading?: boolean;
}>();

const items: Array<{
  key: keyof Pick<DemoSummary, "total" | "active" | "pending" | "completionRate">;
  label: string;
  suffix?: string;
  icon: Component;
}> = [
  { key: "total", label: "全部记录", icon: RiFolderChartLine },
  { key: "active", label: "进行中", icon: RiCheckboxCircleLine },
  { key: "pending", label: "待处理", icon: RiTimeLine },
  { key: "completionRate", label: "归档率", suffix: "%", icon: RiArchiveLine },
];
</script>

<template>
  <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
    <Card v-for="item in items" :key="item.key">
      <CardHeader class="flex flex-row items-center justify-between gap-3 pb-2">
        <CardTitle class="text-muted-foreground text-sm font-medium">{{ item.label }}</CardTitle>
        <component :is="item.icon" class="text-muted-foreground size-4" />
      </CardHeader>
      <CardContent>
        <Skeleton v-if="loading && !summary" class="h-8 w-24" />
        <div v-else class="text-2xl font-semibold tracking-tight">
          <AnimatedNumber :value="Number(summary?.[item.key] ?? 0)" />{{ item.suffix }}
        </div>
      </CardContent>
    </Card>
  </div>
</template>
