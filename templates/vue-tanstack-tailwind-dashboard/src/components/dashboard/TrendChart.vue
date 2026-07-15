<script setup lang="ts">
import { VisAxis, VisLine, VisXYContainer } from "@unovis/vue";
import type { DemoTrendPoint } from "@/api/demo";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";

const { data } = defineProps<{ data: DemoTrendPoint[] }>();

const config = {
  value: { label: "新增", color: "var(--chart-2)" },
  secondary: { label: "完成", color: "var(--chart-4)" },
} satisfies ChartConfig;

const x = (_point: DemoTrendPoint, index: number) => index;
const primary = (point: DemoTrendPoint) => point.value;
const secondary = (point: DemoTrendPoint) => point.secondary;
const formatTick = (index: number) => data[index]?.label ?? "";
</script>

<template>
  <ChartContainer :config class="h-72 w-full" cursor>
    <VisXYContainer :data>
      <VisLine :x :y="primary" color="var(--chart-2)" :line-width="3" />
      <VisLine :x :y="secondary" color="var(--chart-4)" :line-width="3" />
      <VisAxis type="x" :tick-format="formatTick" :grid-line="false" />
      <VisAxis type="y" :grid-line="true" />
    </VisXYContainer>
  </ChartContainer>
</template>
