<script setup lang="ts">
import type { DataTableColumnDef } from "@/components/ui/data-table";
import type { BackendUserApiKey, UserApiKeyPayload } from "@/api/settings";
import { RiAddLine, RiRefreshLine, RiSearchLine } from "@remixicon/vue";
import { computed, reactive, shallowRef, watch } from "vue";
import { toast } from "vue-sonner";
import { addUserApiKey, deleteUserApiKey, editUserApiKey, getUserApiKeyList } from "@/api/settings";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DateTimePicker } from "@/components/DataTimeRangePicker";
import { DataTable } from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime, formatPayloadDateTime, parseDateTime } from "@/utils/date";
import { useUserStore } from "@/stores/user";

interface ApiKeyItem {
  id: string;
  name: string;
  key: string;
  enabled: boolean;
  authStartTime?: string;
  authEndTime?: string;
  remark: string;
}

const open = defineModel<boolean>("open", { default: false });

const userStore = useUserStore();
const currentUserId = shallowRef<number>();
const currentUsername = shallowRef("");
const page = shallowRef(1);
const pageSize = shallowRef(5);
const total = shallowRef(0);
const nameKeyword = shallowRef("");
const apiKeys = shallowRef<ApiKeyItem[]>([]);
const loading = shallowRef(false);
const saving = shallowRef(false);
const editorOpen = shallowRef(false);
const deleteConfirmOpen = shallowRef(false);
const editingId = shallowRef<string>();
const deletingItem = shallowRef<ApiKeyItem>();

const canEditKey = computed(() => userStore.isSuperuser);
const defaultTime = { hours: 0, minutes: 0, seconds: 0 };

const form = reactive({
  name: "",
  key: "",
  enabled: true,
  authStartTime: undefined as Date | undefined,
  authEndTime: undefined as Date | undefined,
  remark: "",
});

const columns: DataTableColumnDef<ApiKeyItem>[] = [
  {
    accessorKey: "name",
    header: () => "名称",
    size: 150,
    pin: "left",
    enableHiding: false,
  },
  {
    accessorKey: "key",
    header: () => "APIKey",
    size: 280,
  },
  {
    accessorKey: "enabled",
    header: () => "状态",
    size: 100,
  },
  {
    accessorKey: "authStartTime",
    header: () => "开始时间",
    size: 180,
  },
  {
    accessorKey: "authEndTime",
    header: () => "结束时间",
    size: 180,
  },
  {
    accessorKey: "remark",
    header: () => "备注",
    size: 220,
  },
  {
    id: "operation",
    header: () => "操作",
    size: 140,
    pin: "right",
    enableHiding: false,
  },
];

function hashApiKey(value: string) {
  return value ? value.replace(/(?<=.{4}).(?=.{4})/g, "*") : "";
}

function mapApiKey(item: BackendUserApiKey): ApiKeyItem {
  return {
    id: String(item.id),
    name: item.name,
    key: item.key ?? "",
    enabled: item.is_enable ?? true,
    authStartTime: formatDateTime(item.auth_start_time),
    authEndTime: formatDateTime(item.auth_end_time),
    remark: item.remark ?? "",
  };
}

async function loadApiKeys() {
  if (!currentUserId.value) return;
  loading.value = true;
  try {
    const res = await getUserApiKeyList({
      page: page.value,
      page_size: pageSize.value,
      user: currentUserId.value,
      name: nameKeyword.value.trim() || undefined,
    });
    apiKeys.value = res.data.map(mapApiKey);
    total.value = res.total;
  } finally {
    loading.value = false;
  }
}

function resetEditor(item?: ApiKeyItem) {
  editingId.value = item?.id;
  form.name = item?.name ?? "";
  form.key = item?.key ?? "";
  form.enabled = item?.enabled ?? true;
  form.authStartTime = parseDateTime(item?.authStartTime);
  form.authEndTime = parseDateTime(item?.authEndTime);
  form.remark = item?.remark ?? "";
}

function show(user: { id: string; username: string }) {
  currentUserId.value = Number(user.id);
  currentUsername.value = user.username;
  page.value = 1;
  nameKeyword.value = "";
  open.value = true;
  void loadApiKeys();
}

function searchApiKeys() {
  page.value = 1;
  void loadApiKeys();
}

function resetSearch() {
  nameKeyword.value = "";
  page.value = 1;
  void loadApiKeys();
}

function openCreate() {
  resetEditor();
  editorOpen.value = true;
}

function openEdit(item: ApiKeyItem) {
  resetEditor(item);
  editorOpen.value = true;
}

function openDeleteConfirm(item: ApiKeyItem) {
  deletingItem.value = item;
  deleteConfirmOpen.value = true;
}

function validateForm() {
  if (!form.name.trim()) {
    toast.error("请输入 APIKey 名称");
    return false;
  }
  if (canEditKey.value && editingId.value) {
    if (!form.key.trim()) {
      toast.error("请输入 APIKey");
      return false;
    }
    if (form.key.trim().length < 6) {
      toast.error("APIKey 长度不能小于 6 位");
      return false;
    }
  }
  if (form.authStartTime && form.authEndTime) {
    const start = form.authStartTime.getTime();
    const end = form.authEndTime.getTime();
    if (start > end) {
      toast.error("结束时间不能小于开始时间");
      return false;
    }
  }
  return true;
}

function buildPayload(): UserApiKeyPayload | undefined {
  if (!currentUserId.value) return undefined;
  const payload: UserApiKeyPayload = {
    name: form.name.trim(),
    is_enable: form.enabled,
    user: currentUserId.value,
    auth_start_time: formatPayloadDateTime(form.authStartTime),
    auth_end_time: formatPayloadDateTime(form.authEndTime),
    remark: form.remark.trim(),
  };
  if (canEditKey.value && form.key.trim()) {
    payload.key = form.key.trim();
  }
  return payload;
}

async function submitApiKey() {
  if (!validateForm()) return;
  const payload = buildPayload();
  if (!payload) return;

  saving.value = true;
  try {
    if (editingId.value) {
      await editUserApiKey(Number(editingId.value), payload);
    } else {
      await addUserApiKey(payload);
      page.value = 1;
    }
    editorOpen.value = false;
    toast.success(editingId.value ? "APIKey 已更新" : "APIKey 已新增");
    await loadApiKeys();
  } finally {
    saving.value = false;
  }
}

async function confirmDelete() {
  const item = deletingItem.value;
  if (!item) return;
  loading.value = true;
  try {
    await deleteUserApiKey(Number(item.id));
    deleteConfirmOpen.value = false;
    deletingItem.value = undefined;
    toast.success("APIKey 已删除");
    await loadApiKeys();
  } finally {
    loading.value = false;
  }
}

async function copyApiKey(value: string) {
  if (!value) return;
  try {
    await navigator.clipboard.writeText(value);
    toast.success("APIKey 已复制");
  } catch {
    toast.error("复制失败，请手动复制");
  }
}

watch([page, pageSize], () => {
  if (open.value) void loadApiKeys();
});

defineExpose({ show });
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="flex max-h-[calc(100vh-2rem)] flex-col gap-0 p-0 sm:max-w-6xl">
      <DialogHeader class="shrink-0 border-b px-6 py-4 pr-12">
        <DialogTitle>APIKey管理</DialogTitle>
        <DialogDescription>当前用户：{{ currentUsername }}</DialogDescription>
      </DialogHeader>
      <div class="flex min-h-96 flex-1 flex-col gap-3 overflow-hidden p-6">
        <form
          class="flex flex-wrap items-end gap-2"
          @submit.prevent="searchApiKeys"
          @reset.prevent="resetSearch"
        >
          <div class="relative w-full sm:w-64">
            <RiSearchLine
              class="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            />
            <Input v-model="nameKeyword" class="pl-9" placeholder="APIKey名称" />
          </div>
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
            新增APIKey
          </Button>
        </form>
        <div class="flex-1 flex-col flex">
          <DataTable
            v-model:page="page"
            v-model:page-size="pageSize"
            :columns="columns"
            :data="apiKeys"
            :total="total"
            :loading="loading"
            :get-row-id="(row) => row.id"
            empty-text="暂无 APIKey"
          >
            <template #key="{ row }">
              <button
                type="button"
                class="text-muted-foreground hover:text-foreground max-w-full truncate font-mono text-xs"
                :title="row.key ? '点击复制 APIKey' : ''"
                @click="copyApiKey(row.key)"
              >
                {{ hashApiKey(row.key) || "-" }}
              </button>
            </template>
            <template #enabled="{ row }">
              <Badge :variant="row.enabled ? 'default' : 'destructive'">
                {{ row.enabled ? "启用" : "禁用" }}
              </Badge>
            </template>
            <template #authStartTime="{ row }">
              <span class="text-muted-foreground">{{ row.authStartTime ?? "-" }}</span>
            </template>
            <template #authEndTime="{ row }">
              <span class="text-muted-foreground">{{ row.authEndTime ?? "永久" }}</span>
            </template>
            <template #remark="{ row }">
              <span class="text-muted-foreground">{{ row.remark || "-" }}</span>
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
        </div>
      </div>
    </DialogContent>
  </Dialog>

  <Dialog v-model:open="editorOpen">
    <DialogContent class="flex max-h-[calc(100vh-2rem)] flex-col gap-0 p-0 sm:max-w-xl">
      <DialogHeader class="shrink-0 border-b px-6 py-4 pr-12">
        <DialogTitle>{{ editingId ? "编辑APIKey" : "新增APIKey" }}</DialogTitle>
        <DialogDescription>不填写结束时间则永久有效。</DialogDescription>
      </DialogHeader>
      <FieldGroup class="min-h-0 overflow-y-auto px-6 py-5">
        <Field>
          <FieldLabel>是否启用</FieldLabel>
          <div class="flex items-center gap-2">
            <Switch v-model="form.enabled" :disabled="saving" aria-label="是否启用 APIKey" />
            <span class="text-muted-foreground text-sm">{{ form.enabled ? "启用" : "禁用" }}</span>
          </div>
        </Field>
        <Field>
          <FieldLabel>APIKey名称</FieldLabel>
          <Input v-model="form.name" :disabled="saving" placeholder="请输入APIKey名称" />
        </Field>
        <Field v-if="canEditKey">
          <FieldLabel>APIKey</FieldLabel>
          <Input
            v-model="form.key"
            :disabled="saving"
            clearable
            placeholder="请输入APIKey，留空则自动生成"
          />
          <FieldDescription v-if="editingId"
            >编辑时填写的 APIKey 长度不能小于 6 位。</FieldDescription
          >
        </Field>
        <Field>
          <FieldLabel>开始时间</FieldLabel>
          <DateTimePicker
            v-model="form.authStartTime"
            empty-text="未设置"
            time-label="开始时间"
            clear-hint="清除后视为立即生效"
            :default-time="defaultTime"
            :disabled="saving"
          />
        </Field>
        <Field>
          <FieldLabel>结束时间</FieldLabel>
          <DateTimePicker
            v-model="form.authEndTime"
            empty-text="未设置"
            time-label="结束时间"
            clear-hint="清除后视为永久有效"
            :default-time="defaultTime"
            :disabled="saving"
          />
        </Field>
        <Field>
          <FieldLabel>备注</FieldLabel>
          <Textarea
            v-model="form.remark"
            :disabled="saving"
            class="min-h-24"
            placeholder="请输入备注，例如：用于xxx"
          />
        </Field>
      </FieldGroup>
      <DialogFooter class="shrink-0 border-t px-6 py-4">
        <Button variant="outline" :disabled="saving" @click="editorOpen = false">取消</Button>
        <Button :disabled="saving" @click="submitApiKey">提交</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <AlertDialog v-model:open="deleteConfirmOpen">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>确定删除APIKey？</AlertDialogTitle>
        <AlertDialogDescription>
          将删除 APIKey「{{ deletingItem?.name }}」，删除后无法恢复。
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel :disabled="loading">取消</AlertDialogCancel>
        <AlertDialogAction :disabled="loading" @click="confirmDelete">删除</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
