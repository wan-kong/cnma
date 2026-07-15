<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { RiRefreshLine, RiSearchLine } from "@remixicon/vue";
import type { RowSelectionState } from "@tanstack/vue-table";
import type { DemoRecord, DemoRecordStatus } from "@/api/demo";
import type { DateTimeRange } from "@/components/DataTimeRangePicker";
import type { DataTableColumnDef } from "@/components/ui/data-table";
import { useDemoRecordsQuery } from "@/queries/demo";
import { formatDateTime } from "@/utils/date";
import { DateTimeRangePicker } from "@/components/DataTimeRangePicker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import RecordDetailDialog from "./RecordDetailDialog.vue";
import { RECORD_STATUS_META, RECORD_STATUS_OPTIONS } from "./record-meta";

const page = ref(1);
const pageSize = ref(10);
const sort = ref("-updated_at");
const searchInput = ref("");
const search = ref("");
const status = ref<DemoRecordStatus | "all">("all");
const updatedRange = ref<DateTimeRange>();
const detailOpen = ref(false);
const selectedId = ref<number | null>(null);
const rowSelection = ref<RowSelectionState>({});

const queryParams = () => ({
  page: page.value,
  page_size: pageSize.value,
  search: search.value || undefined,
  status: status.value === "all" ? undefined : status.value,
  ordering: sort.value || undefined,
  updated_after: updatedRange.value?.from?.toISOString(),
  updated_before: updatedRange.value?.to?.toISOString(),
});

const { data, isLoading, refresh } = useDemoRecordsQuery(queryParams);
const rows = computed(() => data.value?.data ?? []);
const total = computed(() => data.value?.total ?? 0);
const selectedCount = computed(() => Object.keys(rowSelection.value).length);

const columns: DataTableColumnDef<DemoRecord>[] = [
  {
    id: "select",
    header: () => "选择",
    pin: "left",
    size: 44,
    enableHiding: false,
    meta: { title: "选择", class: "w-11" },
  },
  {
    accessorKey: "name",
    header: () => "记录名称",
    enableSorting: true,
    pin: "left",
    meta: { title: "记录名称", class: "min-w-44" },
  },
  { accessorKey: "owner", header: () => "负责人", meta: { title: "负责人" } },
  { accessorKey: "category", header: () => "分类", meta: { title: "分类" } },
  { accessorKey: "status", header: () => "状态", meta: { title: "状态" } },
  {
    accessorKey: "progress",
    header: () => "进度",
    enableSorting: true,
    meta: { title: "进度" },
  },
  {
    accessorKey: "amount",
    header: () => "预算",
    enableSorting: true,
    meta: { title: "预算" },
  },
  {
    accessorKey: "updated_at",
    header: () => "更新时间",
    enableSorting: true,
    meta: { title: "更新时间", class: "min-w-40" },
  },
];

watch([pageSize, status, updatedRange], () => {
  page.value = 1;
});

function applySearch() {
  search.value = searchInput.value.trim();
  page.value = 1;
}

function resetFilters() {
  searchInput.value = "";
  search.value = "";
  status.value = "all";
  updatedRange.value = undefined;
  sort.value = "-updated_at";
  page.value = 1;
}

function openDetail(record: DemoRecord) {
  selectedId.value = record.id;
  detailOpen.value = true;
}
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col gap-3">
    <form
      class="grid gap-2 lg:grid-cols-[minmax(220px,1fr)_180px_320px_auto]"
      @submit.prevent="applySearch"
    >
      <div class="relative">
        <RiSearchLine
          class="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
        />
        <Input v-model="searchInput" class="pl-9" placeholder="搜索名称、负责人或分类" />
      </div>
      <Select v-model="status">
        <SelectTrigger class="w-full"><SelectValue placeholder="全部状态" /></SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem v-for="item in RECORD_STATUS_OPTIONS" :key="item.value" :value="item.value">
              {{ item.label }}
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      <DateTimeRangePicker v-model="updatedRange" :show-time="false" placeholder="筛选更新时间" />
      <div class="flex gap-2">
        <Button type="submit">查询</Button>
        <Button type="button" variant="outline" @click="resetFilters">重置</Button>
        <Button type="button" size="icon" variant="ghost" aria-label="刷新" @click="refresh()">
          <RiRefreshLine />
        </Button>
      </div>
    </form>

    <DataTable
      v-model:row-selection="rowSelection"
      v-model:page="page"
      v-model:page-size="pageSize"
      v-model:sort="sort"
      :columns
      :data="rows"
      :total
      :loading="isLoading"
      :get-row-id="(record) => String(record.id)"
      enable-column-hiding
      enable-resizing
      empty-text="没有符合条件的模拟记录"
      @row-click="openDetail"
    >
      <template #status="{ row }">
        <Badge :variant="RECORD_STATUS_META[row.status].variant">
          {{ RECORD_STATUS_META[row.status].label }}
        </Badge>
      </template>
      <template #progress="{ row }">{{ row.progress }}%</template>
      <template #amount="{ row }">¥{{ row.amount.toLocaleString("zh-CN") }}</template>
      <template #updated_at="{ row }">{{ formatDateTime(row.updated_at) }}</template>
      <template #actions>
        <div v-if="selectedCount" class="flex items-center gap-2 text-sm">
          <span class="text-muted-foreground">已选择 {{ selectedCount }} 条</span>
          <Button size="sm" variant="ghost" @click="rowSelection = {}">取消选择</Button>
        </div>
      </template>
    </DataTable>

    <RecordDetailDialog v-model="detailOpen" :record-id="selectedId" />
  </div>
</template>
