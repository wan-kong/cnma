import type { ColumnDef, RowData } from "@tanstack/vue-table";

declare module "@tanstack/vue-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    /** 附加到表头与单元格的 class（用于固定列等样式）。 */
    class?: string;
    /** 列的可读名称，用于「列显隐」下拉等场景（表头为渲染函数时无法直接取文案）。 */
    title?: string;
  }
}

/**
 * DataTable 的列定义：在标准 ColumnDef 之上声明固定列。
 * pin: "left" | "right" —— 该列吸附到左/右侧，固定逻辑由 DataTable 内部处理。
 */
export type DataTableColumnDef<TData> = ColumnDef<TData, any> & {
  pin?: "left" | "right";
};
