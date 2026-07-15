# DataTable 使用说明

`DataTable` 是基于 `@tanstack/vue-table` 和项目内 shadcn-vue 表格组件封装的服务端列表组件。它只负责渲染当前页数据，并把分页、排序、列显隐、行选择等状态通过 props / v-model 暴露给业务组件。

## 基本用法

```vue
<script setup lang="ts">
import type { DataTableColumnDef } from "@/components/ui/data-table";
import { DataTable } from "@/components/ui/data-table";

interface RowItem {
  id: string;
  name: string;
  createdAt: string;
}

const columns: DataTableColumnDef<RowItem>[] = [
  {
    accessorKey: "name",
    header: () => "名称",
    meta: { title: "名称" },
  },
  {
    accessorKey: "createdAt",
    header: () => "创建时间",
    enableSorting: true,
    meta: { title: "创建时间" },
  },
];
</script>

<template>
  <DataTable :columns="columns" :data="rows" :loading="loading" empty-text="暂无数据" />
</template>
```

## Props

| Prop                 | 类型                          | 默认值                    | 说明                                                                  |
| -------------------- | ----------------------------- | ------------------------- | --------------------------------------------------------------------- |
| `columns`            | `DataTableColumnDef<TData>[]` | 必填                      | 列定义。支持 TanStack `ColumnDef`，并扩展 `pin?: "left" \| "right"`。 |
| `data`               | `TData[]`                     | 必填                      | 当前页数据。组件不做客户端分页。                                      |
| `loading`            | `boolean`                     | `false`                   | 请求中状态。首次无数据时显示骨架；已有数据刷新时置灰。                |
| `getRowId`           | `(row: TData) => string`      | TanStack 默认行索引       | 行唯一 id。使用行选择、固定行或数据会刷新时建议必传。                 |
| `enableRowSelection` | `boolean`                     | `false`                   | 开启行选择。存在 `id: "select"` 的列时会自动开启。                    |
| `enableColumnHiding` | `boolean`                     | `false`                   | 展示列显隐下拉。可隐藏列由 `column.getCanHide()` 决定。               |
| `rowPinning`         | `RowPinningState`             | `{ top: [], bottom: [] }` | 固定行 id。固定行必须存在于当前页 `data` 中才会渲染。                 |
| `enableResizing`     | `boolean`                     | `false`                   | 开启列宽拖拽。开启后表格使用固定布局并支持横向滚动。                  |
| `total`              | `number`                      | `undefined`               | 总条数。配合 `v-model:page` 和 `v-model:page-size` 渲染分页区。       |
| `emptyText`          | `string`                      | `"暂无数据"`              | 空态文案。                                                            |
| `skeletonRows`       | `number`                      | `5`                       | 首次加载骨架行数。                                                    |

## v-model

| 模型                        | 类型                | 说明                                                                                      |
| --------------------------- | ------------------- | ----------------------------------------------------------------------------------------- |
| `v-model:row-selection`     | `RowSelectionState` | 当前页选中态。`data` 引用变化时会清空，不支持跨页保留。                                   |
| `v-model:page`              | `number`            | 当前页码。传入 `total`、`page`、`pageSize` 后才会显示分页信息。                           |
| `v-model:page-size`         | `number`            | 每页条数。业务侧通常需要在变化后把页码重置为 `1`。                                        |
| `v-model:column-visibility` | `VisibilityState`   | 列显隐状态。需要持久化列配置时由父组件持有。                                              |
| `v-model:sort`              | `string`            | 服务端排序字符串。`"-field"` 表示降序，`"field"` 或 `"+field"` 表示升序，空串表示不排序。 |

排序是服务端模式：列只有设置 `enableSorting: true` 才能点击排序；父组件需要绑定 `v-model:sort` 并按该值重新请求数据。组件不会对 `data` 做客户端排序。

## 列定义约定

列 id 的解析规则与 TanStack Table 保持一致：显式 `id` 优先，否则使用 `accessorKey`。需要固定列、列插槽、列显隐或排序时，列必须能解析出稳定 id。

```ts
const columns: DataTableColumnDef<RowItem>[] = [
  {
    id: "select",
    size: 40,
    pin: "left",
    enableHiding: false,
    enableSorting: false,
  },
  {
    accessorKey: "name",
    pin: "left",
    enableSorting: true,
    meta: { title: "名称", class: "min-w-40" },
    header: () => "名称",
  },
];
```

注意事项：

- `id: "select"` 是保留列 id。声明后，表头和单元格会由 `DataTable` 内部渲染全选/单选 Checkbox，业务侧不要再给它写普通 `cell` 或同名 slot。
- 使用行选择时建议传 `getRowId`。不传时 TanStack 默认使用行索引，刷新或翻页后容易造成选择状态不稳定。
- `rowSelection` 只代表当前页。翻页、筛选、刷新等导致 `data` 引用变化时会清空。
- 固定列通过 `pin: "left" | "right"` 声明。固定列需要稳定列 id。
- 列显隐下拉优先使用 `columnDef.meta.title` 作为展示文案；没有 `title` 时回退为列 id。
- 若列 header 使用渲染函数，建议同时补 `meta.title`，否则列显隐菜单只能显示 id。
- 默认所有列不可排序，必须在列定义上显式设置 `enableSorting: true`。

## Slots

| Slot         | Props                           | 说明                                                  |
| ------------ | ------------------------------- | ----------------------------------------------------- |
| `toolbar`    | `{ table }`                     | 顶部工具栏左侧内容。                                  |
| `actions`    | `{ table }`                     | 底部工具区内容，常用于批量操作。                      |
| `[columnId]` | `{ row, index, value, column }` | 按列 id 覆盖单元格渲染。优先级高于 `columnDef.cell`。 |

列单元格渲染优先级为：同名列 slot > 显式 `columnDef.cell` > 默认 `cell.getValue()`。

`toolbar` 和 `actions` 是保留 slot 名。业务列 id 不建议命名为 `toolbar` 或 `actions`，否则会和布局 slot 语义冲突。

```vue
<DataTable :columns="columns" :data="rows">
  <template #name="{ row }">
    <span class="font-medium">{{ row.name }}</span>
  </template>

  <template #actions="{ table }">
    <Button size="sm" :disabled="!table.getSelectedRowModel().rows.length">批量处理</Button>
  </template>
</DataTable>
```

## Emits 与暴露实例

| API                       | 说明                                                                                             |
| ------------------------- | ------------------------------------------------------------------------------------------------ |
| `@row-click`              | 点击数据行时触发，参数为 `row.original`。点击按钮、链接、输入框、Checkbox 等交互元素不会触发。   |
| `defineExpose({ table })` | 暴露 TanStack Table 实例，用于读取选中行等高级能力。业务代码应优先使用 props / v-model / emits。 |

只有父组件绑定了 `@row-click` 时，数据行才会显示可点击样式。

## 分页

分页由后端处理。传入 `total`、`v-model:page`、`v-model:page-size` 后，底部会显示分页信息；当 `total > pageSize` 时显示分页器。

```vue
<DataTable
  v-model:page="page"
  v-model:page-size="pageSize"
  :columns="columns"
  :data="rows"
  :total="total"
/>
```

组件不会自动请求数据。父组件需要监听 `page`、`pageSize`、`sort` 或筛选条件变化，并触发查询。

## 行选择

推荐做法：

```vue
<script setup lang="ts">
import type { RowSelectionState } from "@tanstack/vue-table";
import { ref } from "vue";

const rowSelection = ref<RowSelectionState>({});
</script>

<template>
  <DataTable
    v-model:row-selection="rowSelection"
    :columns="columns"
    :data="rows"
    :get-row-id="(row) => row.id"
  />
</template>
```

行选择只作用于当前页。批量操作成功后，业务侧也可以主动清空：

```ts
rowSelection.value = {};
```

## 布局要求

`DataTable` 根节点是 `flex flex-1 flex-col`，表格区域使用内部滚动容器。父容器最好提供确定高度，例如 `flex-1`、`h-full`、`min-h-0` 等组合。若放在普通文档流中，需要确认父级高度，否则内部滚动和 sticky 表头可能不符合预期。

## 验证建议

修改 `DataTable` 或调用方后，至少运行：

```bash
vp check
```

涉及构建产物时再运行：

```bash
vp build
```
