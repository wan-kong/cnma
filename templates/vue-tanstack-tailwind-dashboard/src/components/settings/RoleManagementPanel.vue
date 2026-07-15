<script setup lang="ts">
import type { DataTableColumnDef } from "@/components/ui/data-table";
import type { SystemRole, BackendRoleMenu, RolePermissionPayload } from "@/api/settings";
import type { PermissionNode, RoleStatus } from "./settings-data";
import { toTypedSchema } from "@vee-validate/zod";
import { RiAddLine, RiRefreshLine, RiSearchLine } from "@remixicon/vue";
import { useForm } from "vee-validate";
import { computed, onMounted, reactive, shallowRef, watch } from "vue";
import { toast } from "vue-sonner";
import * as z from "zod";
import {
  addRole,
  deleteRole as deleteRoleApi,
  editRole,
  getRoleDetail,
  getRoleList,
  getRolePermissionMenus,
} from "@/api/settings";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import PermissionTreeNode from "./PermissionTreeNode.vue";
import { collectPermissionIds, fixedPermissionTree } from "./settings-data";
import { formatTime } from "@/utils/date";

const roles = defineModel<SystemRole[]>("roles", { default: () => [] });

const page = shallowRef(1);
const pageSize = shallowRef(10);
const total = shallowRef(0);
const editorOpen = shallowRef(false);
const editingId = shallowRef<string | undefined>();
const loading = shallowRef(false);
const saving = shallowRef(false);
const permissionLoading = shallowRef(false);
const permissionTree = shallowRef<PermissionNode[]>(fixedPermissionTree);
const statusConfirmOpen = shallowRef(false);
const deleteConfirmOpen = shallowRef(false);
const pendingStatusRole = shallowRef<SystemRole | undefined>();
const deletingRole = shallowRef<SystemRole | undefined>();
const pendingStatus = shallowRef<RoleStatus>("enabled");

const filterSchema = toTypedSchema(
  z.object({
    name: z.string().trim().optional(),
  }),
);

const {
  handleSubmit: handleFilterSubmit,
  resetForm: resetFilterForm,
  values: filterValues,
} = useForm({
  validationSchema: filterSchema,
  initialValues: {
    name: "",
  },
});

const form = reactive({
  name: "",
  status: "enabled" as RoleStatus,
  description: "",
  permissions: [] as string[],
});

const allPermissionIds = computed(() => collectPermissionIds(permissionTree.value));

const roleNodeMap = computed(() => {
  const map = new Map<string, PermissionNode>();
  const visit = (nodes: PermissionNode[]) => {
    nodes.forEach((node) => {
      map.set(node.id, node);
      visit(node.children ?? []);
    });
  };
  visit(permissionTree.value);
  return map;
});

const columns: DataTableColumnDef<SystemRole>[] = [
  {
    accessorKey: "role_name",
    header: () => "角色",
    size: 180,
    pin: "left",
    enableHiding: false,
  },
  {
    accessorKey: "is_use",
    header: () => "状态",
    size: 100,
  },
  {
    accessorKey: "cst_update",
    header: () => "更新时间",
    size: 180,
  },
  {
    id: "operation",
    header: () => "操作",
    size: 140,
    pin: "right",
    enableHiding: false,
  },
];

function descendantIds(node: PermissionNode): string[] {
  return [node.id, ...(node.children ?? []).flatMap((child) => descendantIds(child))];
}

function getRoleStatus(role: SystemRole): RoleStatus {
  const value = role.is_use;
  return value === "0" || value === 0 || value === false ? "disabled" : "enabled";
}

function getRolePermissionIds(role: SystemRole) {
  return (role.rmp ?? []).flatMap((rmp) => {
    const ids = [String(rmp.menu)];
    if (rmp.permission != null) ids.push(`${rmp.menu}_${rmp.permission}`);
    return ids;
  });
}

function mapPermissionTree(items: BackendRoleMenu[], parent: number | null): PermissionNode[] {
  return items
    .filter((item) => item.parent === parent)
    .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
    .map((item) => {
      const children = mapPermissionTree(items, item.id);
      const permissions = (item.permissions ?? []).map((permission) => ({
        id: `${item.id}_${permission.id}`,
        name: permission.name,
        menuId: item.id,
        permissionId: permission.id,
      }));
      return {
        id: String(item.id),
        name: item.front_end_path?.meta?.title ?? item.name ?? String(item.id),
        menuId: item.id,
        permissionId: null,
        children: [...children, ...permissions],
      };
    });
}

function toRolePermissionPayload(selected: string[]): RolePermissionPayload[] {
  const payload = new Map<string, RolePermissionPayload>();
  selected.forEach((id) => {
    const node = roleNodeMap.value.get(id);
    if (!node?.menuId) return;
    const key = `${node.menuId}:${node.permissionId ?? ""}`;
    payload.set(key, {
      menu: node.menuId,
      permission: node.permissionId ?? null,
    });
  });
  return Array.from(payload.values());
}

async function loadPermissions() {
  permissionLoading.value = true;
  try {
    const menus = await getRolePermissionMenus();
    permissionTree.value = mapPermissionTree(menus, null);
  } finally {
    permissionLoading.value = false;
  }
}

async function loadRoles() {
  loading.value = true;
  try {
    const res = await getRoleList({
      page: page.value,
      page_size: pageSize.value,
      name: filterValues.name?.trim() || undefined,
    });
    roles.value = res.data;
    total.value = res.total;
  } finally {
    loading.value = false;
  }
}

function resetEditor() {
  form.name = "";
  form.status = "enabled";
  form.description = "";
  form.permissions = [];
}

function openCreate() {
  editingId.value = undefined;
  resetEditor();
  editorOpen.value = true;
}

async function openEdit(role: SystemRole) {
  editingId.value = String(role.id);
  resetEditor();
  editorOpen.value = true;
  saving.value = true;
  try {
    const detail = await getRoleDetail(Number(role.id));
    form.name = detail.role_name;
    form.status = getRoleStatus(detail);
    form.description = "";
    form.permissions = getRolePermissionIds(detail);
  } finally {
    saving.value = false;
  }
}

function togglePermission(node: PermissionNode, checked: boolean) {
  const ids = descendantIds(node);
  const next = new Set(form.permissions);
  if (checked) {
    ids.forEach((id) => next.add(id));
  } else {
    ids.forEach((id) => next.delete(id));
  }
  form.permissions = [...next];
}

function selectAll() {
  form.permissions = [...allPermissionIds.value];
}

function clearAll() {
  form.permissions = [];
}

function openStatusConfirm(role: SystemRole, checked: boolean) {
  pendingStatusRole.value = role;
  pendingStatus.value = checked ? "enabled" : "disabled";
  statusConfirmOpen.value = true;
}

async function submitRole() {
  if (!form.name.trim()) {
    toast.error("请输入角色名");
    return;
  }
  if (!form.permissions.length) {
    toast.error("请至少选择一个权限");
    return;
  }

  const payload = {
    role_name: form.name,
    is_use: form.status === "enabled" ? "1" : "0",
    rmp: toRolePermissionPayload(form.permissions),
  } as const;

  saving.value = true;
  try {
    if (editingId.value) {
      await editRole(Number(editingId.value), payload);
    } else {
      await addRole(payload);
      page.value = 1;
    }
    editorOpen.value = false;
    toast.success(editingId.value ? "角色已更新" : "角色已新增");
    await loadRoles();
  } finally {
    saving.value = false;
  }
}

async function confirmStatusChange() {
  const role = pendingStatusRole.value;
  if (!role) return;
  saving.value = true;
  try {
    const detail = await getRoleDetail(Number(role.id));
    await editRole(Number(role.id), {
      role_name: detail.role_name,
      is_use: pendingStatus.value === "enabled" ? "1" : "0",
      rmp: (detail.rmp ?? []).map((item) => ({
        menu: item.menu,
        permission: item.permission ?? null,
      })),
    });
    statusConfirmOpen.value = false;
    toast.success(`角色已${pendingStatus.value === "enabled" ? "启用" : "禁用"}`);
    await loadRoles();
  } finally {
    saving.value = false;
  }
}

function openDeleteConfirm(role: SystemRole) {
  deletingRole.value = role;
  deleteConfirmOpen.value = true;
}

async function confirmDeleteRole() {
  const role = deletingRole.value;
  if (!role) return;
  loading.value = true;
  try {
    await deleteRoleApi(Number(role.id));
    deleteConfirmOpen.value = false;
    deletingRole.value = undefined;
    toast.success("角色已删除");
    await loadRoles();
  } finally {
    loading.value = false;
  }
}

const searchRoles = handleFilterSubmit(() => {
  page.value = 1;
  void loadRoles();
});

function resetFilters() {
  resetFilterForm();
  page.value = 1;
  void loadRoles();
}

watch([page, pageSize], () => {
  void loadRoles();
});

onMounted(() => {
  void loadPermissions();
  void loadRoles();
});
</script>

<template>
  <Card class="h-full">
    <CardContent class="flex h-full flex-1 flex-col gap-3">
      <form
        class="flex flex-wrap items-end gap-2"
        @submit.prevent="searchRoles"
        @reset.prevent="resetFilters"
      >
        <FormField v-slot="{ componentField }" name="name">
          <FormItem class="w-full sm:w-64">
            <FormControl>
              <div class="relative">
                <RiSearchLine
                  class="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
                />
                <Input v-bind="componentField" class="pl-9" placeholder="搜索角色名" />
              </div>
            </FormControl>
          </FormItem>
        </FormField>
        <Button type="submit" :disabled="loading">
          <RiSearchLine data-icon="inline-start" />
          查询
        </Button>
        <Button type="reset" variant="outline" :disabled="loading">
          <RiRefreshLine data-icon="inline-start" />
          重置
        </Button>
        <Button type="button" class="w-full sm:ml-auto sm:w-auto" @click="openCreate">
          <RiAddLine data-icon="inline-start" />
          新增角色
        </Button>
      </form>

      <DataTable
        v-model:page="page"
        v-model:page-size="pageSize"
        :columns="columns"
        :data="roles"
        :total="total"
        :loading="loading"
        :get-row-id="(row) => String(row.id)"
        enable-column-hiding
        empty-text="暂无角色"
      >
        <template #is_use="{ row }">
          <div class="flex items-center gap-2">
            <Switch
              :model-value="getRoleStatus(row) === 'enabled'"
              :disabled="saving"
              :aria-label="`${getRoleStatus(row) === 'enabled' ? '禁用' : '启用'}角色${row.role_name}`"
              @update:model-value="(checked) => openStatusConfirm(row, checked)"
            />
            <span class="text-muted-foreground text-sm">
              {{ getRoleStatus(row) === "enabled" ? "启用" : "禁用" }}
            </span>
          </div>
        </template>
        <template #cst_update="{ row }">
          <span class="text-muted-foreground">{{ formatTime(row.cst_update) || "-" }}</span>
        </template>
        <template #operation="{ row }">
          <div class="flex items-center gap-1">
            <Button variant="ghost" size="sm" @click="openEdit(row)">编辑</Button>
            <Button
              variant="ghost"
              size="sm"
              class="text-destructive"
              @click="openDeleteConfirm(row)"
            >
              删除
            </Button>
          </div>
        </template>
      </DataTable>
    </CardContent>
  </Card>

  <Dialog v-model:open="editorOpen">
    <DialogContent class="flex max-h-[calc(100vh-2rem)] flex-col gap-0 p-0 sm:max-w-3xl">
      <DialogHeader class="shrink-0 border-b px-6 py-4 pr-12">
        <DialogTitle>{{ editingId ? "编辑角色" : "新增角色" }}</DialogTitle>
        <DialogDescription
          >角色权限来自当前系统固定菜单，不包含组织架构与数据权限。</DialogDescription
        >
      </DialogHeader>
      <FieldGroup class="min-h-0 overflow-y-auto px-6 py-5">
        <div class="grid gap-5 sm:grid-cols-2">
          <Field>
            <FieldLabel>角色名</FieldLabel>
            <Input v-model="form.name" placeholder="请输入角色名" />
          </Field>
          <Field>
            <FieldLabel>状态</FieldLabel>
            <Select v-model="form.status">
              <SelectTrigger class="w-full">
                <SelectValue placeholder="请选择状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="enabled">启用</SelectItem>
                  <SelectItem value="disabled">停用</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        </div>
        <Field>
          <div class="flex items-center justify-between gap-3">
            <FieldLabel>权限</FieldLabel>
            <div class="flex items-center gap-2">
              <Button variant="outline" size="sm" @click="selectAll">全选</Button>
              <Button variant="outline" size="sm" @click="clearAll">清空</Button>
            </div>
          </div>
          <div class="max-h-[min(42vh,24rem)] overflow-auto rounded-md border p-3">
            <div v-if="permissionLoading" class="text-muted-foreground py-8 text-center text-sm">
              正在加载权限...
            </div>
            <div v-else class="flex flex-col gap-3">
              <PermissionTreeNode
                v-for="node in permissionTree"
                :key="node.id"
                :node="node"
                :selected="form.permissions"
                @toggle="togglePermission"
              />
            </div>
          </div>
        </Field>
      </FieldGroup>
      <DialogFooter class="shrink-0 border-t px-6 py-4">
        <Button variant="outline" :disabled="saving" @click="editorOpen = false">取消</Button>
        <Button :disabled="saving" @click="submitRole">提交</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <AlertDialog v-model:open="statusConfirmOpen">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>
          确定{{ pendingStatus === "enabled" ? "启用" : "禁用" }}角色？
        </AlertDialogTitle>
        <AlertDialogDescription>
          将{{ pendingStatus === "enabled" ? "启用" : "禁用" }}角色「{{
            pendingStatusRole?.role_name
          }}」，确认后会立即生效。
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel :disabled="saving">取消</AlertDialogCancel>
        <AlertDialogAction :disabled="saving" @click="confirmStatusChange">确定</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>

  <AlertDialog v-model:open="deleteConfirmOpen">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>确定删除角色？</AlertDialogTitle>
        <AlertDialogDescription>
          将删除角色「{{ deletingRole?.role_name }}」，已绑定该角色的用户可能需要重新分配角色。
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel :disabled="loading">取消</AlertDialogCancel>
        <AlertDialogAction :disabled="loading" @click="confirmDeleteRole">删除</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
