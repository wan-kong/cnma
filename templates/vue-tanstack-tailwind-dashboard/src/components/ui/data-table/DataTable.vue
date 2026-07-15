<script setup lang="ts" generic="TData">
import type {
  Column,
  ColumnPinningState,
  Row,
  RowPinningState,
  RowSelectionState,
  SortingState,
  Table as TableInstance,
  VisibilityState,
} from "@tanstack/vue-table";
import { FlexRender, getCoreRowModel, useVueTable } from "@tanstack/vue-table";
import type { ComponentPublicInstance, CSSProperties } from "vue";
import {
  computed,
  getCurrentInstance,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  useTemplateRef,
  watch,
} from "vue";
import { Checkbox } from "@/components/ui/checkbox";
import SortIcon from "@/components/ui/data-table/SortIcon.vue";
import DataTableViewOptions from "@/components/ui/data-table/DataTableViewOptions.vue";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationInfo,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
  PaginationSize,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import "./column-meta";
import type { DataTableColumnDef } from "./column-meta";

const props = withDefaults(
  defineProps<{
    /** 列定义，由业务组件提供；列上可声明 pin: "left" | "right" 固定该列。 */
    columns: DataTableColumnDef<TData>[];
    /** 当前页数据（分页交由后端，表格仅渲染本页）。 */
    data: TData[];
    /** 是否正在请求（含翻页/筛选时的后台刷新）。 */
    loading?: boolean;
    /** 行唯一 id，用于当前页行选择与固定行等状态。 */
    getRowId?: (row: TData) => string;
    /** 是否开启行选择（配合 select 列与 v-model:rowSelection）；选中态仅作用于当前页。 */
    enableRowSelection?: boolean;
    /** 是否展示「列显隐」下拉（顶部工具栏右侧）。 */
    enableColumnHiding?: boolean;
    /**
     * 固定行：按行 id 声明置顶/置底，sticky 吸附。{ top: [...id], bottom: [...id] }。
     * 注意分页为后端处理，被固定的行需存在于当前页 data 中才能渲染。
     */
    rowPinning?: RowPinningState;
    /** 是否允许拖拽调整列宽（开启后表格切换为固定布局 + 横向滚动）。 */
    enableResizing?: boolean;
    /** 总条数；传入即渲染底部分页区，省略则无分页。 */
    total?: number;
    /** 空态文案。 */
    emptyText?: string;
    /** 首次加载时骨架行数。 */
    skeletonRows?: number;
  }>(),
  {
    loading: false,
    enableRowSelection: false,
    enableColumnHiding: false,
    enableResizing: false,
    rowPinning: () => ({ top: [], bottom: [] }),
    emptyText: "暂无数据",
    skeletonRows: 5,
  },
);

const emit = defineEmits<{
  /** 点击数据行（点击交互元素——按钮/链接/勾选框等——不触发）。 */
  rowClick: [row: TData];
}>();

// 解析列 id：显式 id 优先，否则取 accessorKey（与 table-core 的 column.id 规则一致）。
function columnDefId(col: DataTableColumnDef<TData>): string | undefined {
  if ("id" in col && col.id != null) return col.id;
  if ("accessorKey" in col && col.accessorKey != null) return String(col.accessorKey);
  return undefined;
}

// 约定列：列定义中 id 为 "select" 时，DataTable 内部直接渲染全选/单选 Checkbox，
// 业务侧只需声明该列（可控制 size/pin 等），无需重复书写勾选逻辑。
const SELECT_COLUMN_ID = "select";
const hasSelectColumn = computed(() =>
  props.columns.some((col) => columnDefId(col) === SELECT_COLUMN_ID),
);

// 列固定状态：直接从列定义的 pin 字段推导，固定声明与列绑定，无需外部维护数组。
// 按列顺序入栈，保证 getStart/getAfter 的偏移累计与视觉顺序一致。
const columnPinning = computed<ColumnPinningState>(() => {
  const left: string[] = [];
  const right: string[] = [];
  for (const col of props.columns) {
    const id = columnDefId(col);
    if (!id) continue;
    if (col.pin === "left") left.push(id);
    else if (col.pin === "right") right.push(id);
  }
  return { left, right };
});

// 选中态按行 id 存储；由父级通过 v-model:rowSelection 持有，仅作用于当前页。
// 数据变化（翻页/筛选/刷新）后清空选中，避免跨页选择带来的歧义。
const rowSelection = defineModel<RowSelectionState>("rowSelection", { default: () => ({}) });
watch(
  () => props.data,
  () => {
    rowSelection.value = {};
  },
);
const page = defineModel<number>("page");
const pageSize = defineModel<number>("pageSize");
// 列显隐状态；父级可选用 v-model:columnVisibility 持久化。
const columnVisibility = defineModel<VisibilityState>("columnVisibility", { default: () => ({}) });

// 排序状态对外为单字段字符串：「-字段」降序、「字段」(或「+字段」)升序，空串表示不排序。
// 仅允许单列排序，便于直接作为后端排序参数（如 sort=-latestAlertTime）。
const sort = defineModel<string>("sort");
const sorting = computed<SortingState>(() => {
  const value = sort.value;
  if (!value) return [];
  const id = value.replace(/^[+-]/, "");
  return id ? [{ id, desc: value.startsWith("-") }] : [];
});

const table = useVueTable({
  get data() {
    return props.data;
  },
  get columns() {
    return props.columns;
  },
  state: {
    get rowSelection() {
      return rowSelection.value;
    },
    get columnPinning() {
      return columnPinning.value;
    },
    get rowPinning() {
      return props.rowPinning;
    },
    get sorting() {
      return sorting.value;
    },
    get columnVisibility() {
      return columnVisibility.value;
    },
  },
  onColumnVisibilityChange: (updater) => {
    columnVisibility.value =
      typeof updater === "function" ? updater(columnVisibility.value) : updater;
  },
  // 排序交由后端处理，仅单列；表格只维护状态并把结果写回 sort 字符串。
  manualSorting: true,
  enableMultiSort: false,
  // 列默认不可排序，需在列定义显式 enableSorting: true 才开启。
  // （用 defaultColumn 而非表级 enableSorting:false——后者会一刀切关闭所有列排序。）
  defaultColumn: { enableSorting: false },
  onSortingChange: (updater) => {
    const next = typeof updater === "function" ? updater(sorting.value) : updater;
    const first = next[0];
    sort.value = first ? `${first.desc ? "-" : ""}${first.id}` : "";
  },
  enableRowPinning: true,
  // 即使固定行被筛除也保留渲染（这里主要用于声明式置顶/置底）。
  keepPinnedRows: true,
  getRowId: props.getRowId,
  // 显式开启，或存在 select 约定列时自动开启行选择。
  get enableRowSelection() {
    return props.enableRowSelection || hasSelectColumn.value;
  },
  onRowSelectionChange: (updater) => {
    rowSelection.value = typeof updater === "function" ? updater(rowSelection.value) : updater;
  },
  enableColumnResizing: props.enableResizing,
  // onChange：拖拽过程中实时更新列宽，所见即所得。
  columnResizeMode: "onChange",
  getCoreRowModel: getCoreRowModel(),
  // 分页由后端处理，表格仅负责渲染当前页。
  manualPagination: true,
});

// 仅当父级绑定了 @row-click 时，行才呈现可点击样式（hover/cursor）。
const instance = getCurrentInstance();
const rowClickable = computed(() => Boolean(instance?.vnode.props?.onRowClick));

function handleRowClick(event: MouseEvent, row: Row<TData>) {
  // 点击交互元素（按钮/链接/输入/勾选框等）不触发整行点击，避免误导航。
  const target = event.target as HTMLElement | null;
  if (target?.closest("button, a, input, label, [role='checkbox']")) return;
  emit("rowClick", row.original);
}

// 渲染顺序：置顶固定行 → 中间行 → 置底固定行；DOM 顺序保证 sticky 堆叠正确。
const displayRows = computed(() => {
  void table.getState().rowPinning;
  return [...table.getTopRows(), ...table.getCenterRows(), ...table.getBottomRows()];
});

// 把每列宽度发布成 CSS 变量挂在 <table> 上，单元格通过 var() 读取，避免逐格重算。
// 依赖 columnSizing / columnSizingInfo 以在拖拽时保持响应式。
const tableStyle = computed(() => {
  if (!props.enableResizing) return undefined;
  void table.getState().columnSizingInfo;
  void table.getState().columnSizing;
  const vars: Record<string, string> = { width: `${table.getTotalSize()}px` };
  for (const header of table.getFlatHeaders()) {
    vars[`--header-${header.id}-size`] = `${header.getSize()}px`;
    vars[`--col-${header.column.id}-size`] = `${header.column.getSize()}px`;
  }
  return vars;
});

// 固定列/固定行均用单表 + sticky 方案。z-index 分层（sticky 表头为 z-20）：
//   表头：固定列单元格 z-30，横向滚动时盖住普通表头与拖拽手柄(z-20)。
//   表体：交叉(固定行且固定列) > 固定行 > 固定列 > 普通，且都 < 20，
//        这样纵向滚动时固定单元格会滑到 sticky 表头之下，不会盖住表头。

// 滚动容器（Table 的内层 container），用于监听滚动 + 实测固定行高度。
const tableRef = useTemplateRef<ComponentPublicInstance | null>("tableRef");
function scrollEl(): HTMLElement | undefined {
  return tableRef.value?.$el as HTMLElement | undefined;
}

// ── 固定列阴影 ──
// 仅在「有内容被遮住」时给固定列与内容区的边界投影：
//   左固定列组的最右一列在向右滚动后（scrollLeft>0）出现右向阴影；右固定列组同理。
const scrolled = ref({ left: false, right: false });
function updateScrolled() {
  const el = scrollEl();
  if (!el) return;
  scrolled.value = {
    left: el.scrollLeft > 0,
    right: Math.ceil(el.scrollLeft + el.clientWidth) < el.scrollWidth,
  };
}
const pinBoundary = computed(() => ({
  left: columnPinning.value.left?.at(-1),
  right: columnPinning.value.right?.[0],
}));
function pinShadowClass(column: Column<TData>): string {
  const pinned = column.getIsPinned();
  if (pinned === "left" && column.id === pinBoundary.value.left && scrolled.value.left) {
    return "shadow-[6px_0_6px_-4px_rgba(0,0,0,0.12)]";
  }
  if (pinned === "right" && column.id === pinBoundary.value.right && scrolled.value.right) {
    return "shadow-[-6px_0_6px_-4px_rgba(0,0,0,0.12)]";
  }
  return "";
}

// ── 固定行偏移（实测高度，支持多行 + 不等高） ──
// sticky 偏移需累计前序固定行的真实高度；用 DOM 实测而非假设固定行高，
// 这样行内容换行、表头多行等情况下多条固定行也能正确堆叠。
const ROW_HEIGHT_FALLBACK = 40; // 首帧未测得前的兜底（h-10）。
const headerHeight = ref(0);
const rowHeights = ref<Record<string, number>>({});
const pinnedRowIds = computed(() => [
  ...(props.rowPinning.top ?? []),
  ...(props.rowPinning.bottom ?? []),
]);

function measure() {
  const el = scrollEl();
  if (!el) return;
  const thead = el.querySelector("thead");
  if (thead) headerHeight.value = thead.getBoundingClientRect().height;
  const heights: Record<string, number> = {};
  for (const id of pinnedRowIds.value) {
    const tr = el.querySelector<HTMLElement>(`[data-row-id="${CSS.escape(id)}"]`);
    if (tr) heights[id] = tr.getBoundingClientRect().height;
  }
  rowHeights.value = heights;
}

// 每个固定行的纵向 sticky 偏移：置顶行从「表头底部」起依次累加；置底行从底部向上累加。
const rowPinStyles = computed<Record<string, { top?: string; bottom?: string }>>(() => {
  const styles: Record<string, { top?: string; bottom?: string }> = {};
  let top = headerHeight.value;
  for (const row of table.getTopRows()) {
    styles[row.id] = { top: `${top}px` };
    top += rowHeights.value[row.id] ?? ROW_HEIGHT_FALLBACK;
  }
  const bottom = table.getBottomRows();
  let acc = 0;
  for (let i = bottom.length - 1; i >= 0; i--) {
    const row = bottom[i];
    styles[row.id] = { bottom: `${acc}px` };
    acc += rowHeights.value[row.id] ?? ROW_HEIGHT_FALLBACK;
  }
  return styles;
});

let resizeObserver: ResizeObserver | undefined;
function remeasure() {
  updateScrolled();
  measure();
}
onMounted(() => {
  const el = scrollEl();
  if (!el) return;
  el.addEventListener("scroll", updateScrolled, { passive: true });
  resizeObserver = new ResizeObserver(remeasure);
  resizeObserver.observe(el);
  const innerTable = el.querySelector("table");
  if (innerTable) resizeObserver.observe(innerTable);
  nextTick(remeasure);
});
onBeforeUnmount(() => {
  scrollEl()?.removeEventListener("scroll", updateScrolled);
  resizeObserver?.disconnect();
});
// 按引用监听即可（父级通常每次传入新的 data/rowPinning）；列宽变化由 ResizeObserver 兜底。
watch([() => props.data, () => props.rowPinning, () => props.columns], () => nextTick(remeasure));

// 表头单元格样式：列宽（resize）+ 固定列横向吸附（z-30）。
function headStyle(headerId: string, column: Column<TData>): CSSProperties {
  const pinned = column.getIsPinned();
  return {
    ...(props.enableResizing ? { width: `var(--header-${headerId}-size)` } : {}),
    ...(pinned
      ? {
          position: "sticky",
          zIndex: 30,
          left: pinned === "left" ? `${column.getStart("left")}px` : undefined,
          right: pinned === "right" ? `${column.getAfter("right")}px` : undefined,
        }
      : {}),
  };
}

// 表体单元格样式：列宽 + 固定列横向吸附 + 固定行纵向吸附（实测偏移） + z 分层。
function cellStyle(row: Row<TData>, column: Column<TData>): CSSProperties {
  const colPinned = column.getIsPinned();
  const rowPinned = row.getIsPinned();
  const style: CSSProperties = props.enableResizing
    ? { width: `var(--col-${column.id}-size)` }
    : {};
  if (colPinned) {
    style.position = "sticky";
    style.left = colPinned === "left" ? `${column.getStart("left")}px` : undefined;
    style.right = colPinned === "right" ? `${column.getAfter("right")}px` : undefined;
  }
  if (rowPinned) {
    style.position = "sticky";
    Object.assign(style, rowPinStyles.value[row.id]);
  }
  style.zIndex = colPinned && rowPinned ? 12 : rowPinned ? 11 : colPinned ? 10 : undefined;
  return style;
}

// 固定列朝向内容区一侧加分隔线 + 滚动时的投影：左固定列加右边线，右固定列加左边线。
function pinClass(column: Column<TData>): string {
  const pinned = column.getIsPinned();
  if (!pinned) return "";
  const divider = pinned === "left" ? "border-border border-r" : "border-border border-l";
  return `${divider} ${pinShadowClass(column)}`;
}

// 单元格渲染优先级：同名插槽（就近覆盖）> columnDef.cell > 默认 row[accessorKey]。
// table-core 会注入默认 cell，故需从原始 columns 判断「用户是否显式写了 cell」，
// 用来区分第 2 级（有 cell）与第 3 级（回退原始值），不能用合并后的 columnDef.cell。
const explicitCellIds = computed(() => {
  const ids = new Set<string>();
  for (const col of props.columns) {
    const id = columnDefId(col);
    if (id != null && "cell" in col && col.cell != null) ids.add(id);
  }
  return ids;
});

// 动态列插槽：以列 id（accessorKey 列的 id 即 accessorKey）为名提供单元格插槽，
// 父级写 <template #<columnId>="{ row, index, value, column }"> 即可覆盖该列默认渲染。
// 另有保留插槽 actions：底部工具区（批量操作等）。
defineSlots<
  {
    /** 顶部工具栏左侧自定义内容（列显隐下拉固定在右侧）。 */
    toolbar?: (props: { table: TableInstance<TData> }) => unknown;
    /** 底部工具区（批量操作等），与分页解耦：有内容即渲染。 */
    actions?: (props: { table: TableInstance<TData> }) => unknown;
  } & {
    [columnId: string]:
      | ((props: { row: TData; index: number; value: unknown; column: Column<TData> }) => unknown)
      | undefined;
  }
>();

// 暴露表格实例，便于父级访问选中行等高级能力。
defineExpose({ table: table as TableInstance<TData> });

// 首次加载（尚无任何数据）时展示骨架；已有数据的后台刷新只做轻微置灰。
const showSkeleton = () => props.loading && props.data.length === 0;
</script>

<template>
  <div class="flex flex-1 flex-col w-full">
    <!-- 顶部工具栏：仅在提供 #toolbar 时渲染（列显隐已移入表头右上角）。 -->
    <div v-if="$slots.toolbar" class="flex flex-wrap items-center gap-2 pb-2">
      <slot name="toolbar" :table="table" />
    </div>
    <!-- relative 包裹：让列设置触发器锚定在滚动区右上角（表头处），且不随滚动移动。 -->
    <div class="relative h-0 flex-1 basis-0">
      <div
        class="h-full overflow-auto pb-2 transition-opacity"
        :class="{ 'opacity-60': loading && data.length > 0 }"
        :aria-busy="loading"
      >
        <Table
          ref="tableRef"
          container-class="max-h-full"
          :class="enableResizing ? 'table-fixed' : undefined"
          :table-style="tableStyle"
        >
          <TableHeader>
            <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
              <TableHead
                v-for="header in headerGroup.headers"
                :key="header.id"
                :class="[
                  header.column.columnDef.meta?.class,
                  pinClass(header.column),
                  enableResizing ? 'relative' : '',
                ]"
                :style="headStyle(header.id, header.column)"
                :aria-sort="
                  header.column.getCanSort()
                    ? header.column.getIsSorted() === 'asc'
                      ? 'ascending'
                      : header.column.getIsSorted() === 'desc'
                        ? 'descending'
                        : 'none'
                    : undefined
                "
              >
                <!-- select 约定列：渲染全选本页的 Checkbox。 -->
                <Checkbox
                  v-if="header.column.id === SELECT_COLUMN_ID"
                  :model-value="
                    table.getIsAllPageRowsSelected()
                      ? true
                      : table.getIsSomePageRowsSelected()
                        ? 'indeterminate'
                        : false
                  "
                  aria-label="全选本页"
                  @update:model-value="(value: any) => table.toggleAllPageRowsSelected(!!value)"
                />
                <!-- 可排序列：用 button 承载，支持键盘 Enter/Space；否则普通容器。 -->
                <component
                  :is="header.column.getCanSort() ? 'button' : 'div'"
                  v-else-if="!header.isPlaceholder"
                  :type="header.column.getCanSort() ? 'button' : undefined"
                  class="flex items-center gap-1 text-left"
                  :class="
                    header.column.getCanSort()
                      ? 'hover:text-foreground cursor-pointer transition-colors select-none'
                      : undefined
                  "
                  @click="header.column.getToggleSortingHandler()?.($event)"
                >
                  <FlexRender
                    :render="header.column.columnDef.header"
                    :props="header.getContext()"
                  />
                  <SortIcon
                    v-if="header.column.getCanSort()"
                    :direction="header.column.getIsSorted()"
                  />
                </component>
                <!-- 列宽拖拽手柄：吸附在表头右缘，hover/拖拽时高亮。 -->
                <div
                  v-if="enableResizing && header.column.getCanResize()"
                  class="hover:bg-primary absolute top-0 -right-px z-20 h-full w-0.5 cursor-col-resize touch-none select-none"
                  :class="header.column.getIsResizing() ? 'bg-primary' : 'bg-transparent'"
                  @mousedown="header.getResizeHandler()($event)"
                  @touchstart="header.getResizeHandler()($event)"
                  @click.stop
                />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <!-- 首次加载骨架 -->
            <template v-if="showSkeleton()">
              <TableRow v-for="n in skeletonRows" :key="`sk-${n}`">
                <TableCell v-for="col in columns.length" :key="col">
                  <Skeleton class="h-5 w-full" />
                </TableCell>
              </TableRow>
            </template>

            <!-- 数据行（置顶固定行 → 中间行 → 置底固定行） -->
            <template v-else-if="displayRows.length">
              <TableRow
                v-for="row in displayRows"
                :key="row.id"
                :data-row-id="row.id"
                :data-state="row.getIsSelected() ? 'selected' : undefined"
                :class="rowClickable ? 'cursor-pointer' : undefined"
                @click="rowClickable ? handleRowClick($event, row) : undefined"
              >
                <TableCell
                  v-for="cell in row.getVisibleCells()"
                  :key="cell.id"
                  :class="[cell.column.columnDef.meta?.class, pinClass(cell.column)]"
                  :style="cellStyle(cell.row, cell.column)"
                >
                  <!-- select 约定列：渲染选择当前行的 Checkbox。 -->
                  <Checkbox
                    v-if="cell.column.id === SELECT_COLUMN_ID"
                    :model-value="cell.row.getIsSelected()"
                    aria-label="选择该行"
                    @update:model-value="(value: any) => cell.row.toggleSelected(!!value)"
                  />
                  <!-- 渲染优先级：同名插槽 > 显式 cell > 默认 row[accessorKey]。 -->
                  <slot
                    v-else-if="$slots[cell.column.id]"
                    :name="cell.column.id"
                    :row="cell.row.original"
                    :index="cell.row.index"
                    :value="cell.getValue()"
                    :column="cell.column"
                  />
                  <FlexRender
                    v-else-if="explicitCellIds.has(cell.column.id)"
                    :render="cell.column.columnDef.cell"
                    :props="cell.getContext()"
                  />
                  <template v-else>{{ cell.getValue() }}</template>
                </TableCell>
              </TableRow>
            </template>

            <!-- 空态 -->
            <TableEmpty v-else :colspan="columns.length" class="text-muted-foreground">
              {{ emptyText }}
            </TableEmpty>
          </TableBody>
        </Table>
      </div>
      <!-- 列设置触发器：集成在表头右上角，横/纵向滚动均保持可见。 -->
      <div
        v-if="enableColumnHiding"
        class="border-border absolute top-0 right-0.5 z-40 flex items-center rounded-tr-md"
        :style="{ height: headerHeight ? `${headerHeight}px` : undefined }"
      >
        <DataTableViewOptions :table="table" />
      </div>
    </div>

    <!-- 底部工具区：批量操作（与分页解耦，有插槽即渲染）+ 分页信息/分页器。 -->
    <div
      v-if="$slots.actions || (total !== undefined && page !== undefined && pageSize !== undefined)"
      class="flex flex-col gap-3 border-t border-solid pt-2 sm:flex-row sm:items-center sm:justify-between"
    >
      <div class="flex flex-wrap items-center gap-3">
        <PaginationInfo
          v-if="total !== undefined && page !== undefined && pageSize !== undefined"
          :page="page"
          :page-size="pageSize"
          :total="total"
        />
        <!-- 批量操作等自定义内容，slot props 暴露表格实例 -->
        <slot name="actions" :table="table" />
      </div>
      <div class="flex items-center gap-3">
        <Pagination
          v-if="
            total !== undefined && page !== undefined && pageSize !== undefined && total > pageSize
          "
          v-slot="{ page: current }"
          v-model:page="page"
          :total="total"
          :items-per-page="pageSize"
          :sibling-count="1"
          show-edges
          class="mx-0 w-auto justify-end"
        >
          <PaginationContent v-slot="{ items }">
            <PaginationSize v-model="pageSize" />
            <PaginationPrevious />
            <template v-for="(item, index) in items" :key="index">
              <PaginationItem
                v-if="item.type === 'page'"
                :value="item.value"
                :is-active="item.value === current"
              >
                {{ item.value }}
              </PaginationItem>
              <PaginationEllipsis v-else :index="index" />
            </template>
            <PaginationNext />
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  </div>
</template>
