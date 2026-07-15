<script setup lang="ts" generic="TData">
import type { Table } from "@tanstack/vue-table";
import { RiLayoutColumnLine } from "@remixicon/vue";
import { computed } from "vue";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const props = defineProps<{
  table: Table<TData>;
}>();

// 可隐藏的列：取叶子列中 getCanHide() 为真者。标签优先 meta.title，回退列 id。
const hideableColumns = computed(() =>
  props.table.getAllLeafColumns().filter((column) => column.getCanHide()),
);
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button
        variant="ghost"
        size="icon-sm"
        class="text-muted-foreground hover:text-foreground rounded-none"
        aria-label="列设置"
      >
        <RiLayoutColumnLine class="size-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-40">
      <DropdownMenuLabel>显示列</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuCheckboxItem
        v-for="column in hideableColumns"
        :key="column.id"
        :model-value="column.getIsVisible()"
        @update:model-value="(value) => column.toggleVisibility(!!value)"
        @select="(event) => event.preventDefault()"
      >
        {{ column.columnDef.meta?.title ?? column.id }}
      </DropdownMenuCheckboxItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
