<script setup lang="ts">
import { computed } from "vue";
import { useDemoAnalyticsQuery } from "@/queries/demo";
import TrendChart from "@/components/dashboard/TrendChart.vue";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

definePage({ name: "analytics", meta: { title: "数据分析", permissionKey: "analysis" } });
defineOptions({ name: "Analytics" });

const { data, isLoading } = useDemoAnalyticsQuery();
const categoryTotal = computed(() =>
  (data.value?.categories ?? []).reduce((total, item) => total + item.value, 0),
);
const statusLabels: Record<string, string> = {
  active: "进行中",
  pending: "待处理",
  archived: "已归档",
};
</script>

<template>
  <div class="flex flex-col gap-5">
    <div>
      <h1 class="text-xl font-semibold tracking-tight">数据分析</h1>
      <p class="text-muted-foreground mt-1 text-sm">用于替换真实业务指标的中性可视化示例。</p>
    </div>

    <div class="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle>趋势对比</CardTitle>
          <CardDescription>展示 Unovis 双折线图与响应式容器。</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton v-if="isLoading && !data" class="h-72 w-full" />
          <TrendChart v-else :data="data?.trend ?? []" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>状态分布</CardTitle>
          <CardDescription>当前模拟记录的处理状态。</CardDescription>
        </CardHeader>
        <CardContent class="flex flex-col gap-5">
          <template v-if="isLoading && !data">
            <Skeleton v-for="index in 3" :key="index" class="h-12 w-full" />
          </template>
          <div
            v-for="item in data?.status ?? []"
            v-else
            :key="item.label"
            class="flex flex-col gap-2"
          >
            <div class="flex items-center justify-between text-sm">
              <span>{{ statusLabels[item.label] ?? item.label }}</span>
              <span class="font-medium">{{ item.value }}</span>
            </div>
            <Progress :model-value="(item.value / Math.max(categoryTotal, 1)) * 100" />
          </div>
        </CardContent>
      </Card>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>分类占比</CardTitle>
        <CardDescription>模拟数据按业务分类聚合后的占比。</CardDescription>
      </CardHeader>
      <CardContent class="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div v-for="item in data?.categories ?? []" :key="item.label" class="rounded-lg border p-4">
          <div class="text-muted-foreground text-sm">{{ item.label }}</div>
          <div class="mt-2 text-2xl font-semibold">{{ item.value }}</div>
          <div class="text-muted-foreground mt-1 text-xs">
            {{ Math.round((item.value / Math.max(categoryTotal, 1)) * 100) }}%
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
