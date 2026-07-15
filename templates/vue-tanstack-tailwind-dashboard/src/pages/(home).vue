<script setup lang="ts">
import { computed } from "vue";
import { RouterLink } from "vue-router";
import { RiArrowRightLine } from "@remixicon/vue";
import { useDemoSummaryQuery } from "@/queries/demo";
import { formatDateTime } from "@/utils/date";
import SummaryCards from "@/components/dashboard/SummaryCards.vue";
import TrendChart from "@/components/dashboard/TrendChart.vue";
import { RECORD_STATUS_META } from "@/components/records/record-meta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

definePage({ name: "dashboard", meta: { title: "概览", permissionKey: "alarm" } });
defineOptions({ name: "Dashboard" });

const { data, isLoading } = useDemoSummaryQuery();
const recent = computed(() => data.value?.recent ?? []);
</script>

<template>
  <div class="flex flex-col gap-5">
    <div class="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-xl font-semibold tracking-tight">工作台概览</h1>
        <p class="text-muted-foreground mt-1 text-sm">
          使用 Mock API 展示查询缓存、图表和表格能力。
        </p>
      </div>
      <Button as-child variant="outline">
        <RouterLink to="/records">查看全部记录 <RiArrowRightLine /></RouterLink>
      </Button>
    </div>

    <SummaryCards :summary="data" :loading="isLoading" />

    <div class="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle>本周趋势</CardTitle>
          <CardDescription>新增与完成记录的模拟变化。</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton v-if="isLoading && !data" class="h-72 w-full" />
          <TrendChart v-else :data="data?.trend ?? []" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-start justify-between gap-3">
          <div class="flex flex-col gap-1.5">
            <CardTitle>最近更新</CardTitle>
            <CardDescription>最近发生变化的六条记录。</CardDescription>
          </div>
        </CardHeader>
        <CardContent class="px-0">
          <div v-if="isLoading && !recent.length" class="flex flex-col gap-2 px-6">
            <Skeleton v-for="index in 5" :key="index" class="h-10 w-full" />
          </div>
          <Table v-else>
            <TableHeader>
              <TableRow>
                <TableHead>名称</TableHead>
                <TableHead>状态</TableHead>
                <TableHead class="text-right">更新时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="record in recent" :key="record.id">
                <TableCell>
                  <div class="font-medium">{{ record.name }}</div>
                  <div class="text-muted-foreground text-xs">{{ record.owner }}</div>
                </TableCell>
                <TableCell>
                  <Badge :variant="RECORD_STATUS_META[record.status].variant">
                    {{ RECORD_STATUS_META[record.status].label }}
                  </Badge>
                </TableCell>
                <TableCell class="text-muted-foreground text-right text-xs">
                  {{ formatDateTime(record.updated_at, "minute") }}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
