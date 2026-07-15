<script setup lang="ts">
import type { DataTableColumnDef } from "@/components/ui/data-table";
import type { SystemRole, SystemUser } from "@/api/settings";
import type { UserStatus } from "./settings-data";
import { toTypedSchema } from "@vee-validate/zod";
import { RiAddLine, RiLockPasswordLine, RiRefreshLine, RiSearchLine } from "@remixicon/vue";
import { useForm } from "vee-validate";
import { computed, onMounted, reactive, shallowRef, watch } from "vue";
import { toast } from "vue-sonner";
import * as z from "zod";
import {
  addUser,
  deleteUser as deleteUserApi,
  editUser,
  getRoleList,
  getUserList,
  resetUserPassword,
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
import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
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
import { formatDateTime, formatPayloadDateTime, parseDateTime } from "@/utils/date";
import ApiKeyManagementDialog from "./ApiKeyManagementDialog.vue";

const users = defineModel<SystemUser[]>("users", { default: () => [] });

const page = shallowRef(1);
const pageSize = shallowRef(10);
const total = shallowRef(0);
const editorOpen = shallowRef(false);
const resetOpen = shallowRef(false);
const deleteConfirmOpen = shallowRef(false);
const editingId = shallowRef<string | undefined>();
const resetUser = shallowRef<SystemUser | undefined>();
const deletingUser = shallowRef<SystemUser | undefined>();
const roles = shallowRef<SystemRole[]>([]);
const loading = shallowRef(false);
const saving = shallowRef(false);
const resetLoading = shallowRef(false);
const statusConfirmOpen = shallowRef(false);
const pendingStatusUser = shallowRef<SystemUser | undefined>();
const pendingStatus = shallowRef<Exclude<UserStatus, "locked">>("enabled");
const apiKeyDialogRef = shallowRef<InstanceType<typeof ApiKeyManagementDialog>>();
const apiKeyDialogOpen = shallowRef(false);

const filterSchema = toTypedSchema(
  z.object({
    username: z.string().trim().optional(),
    roleId: z.string(),
    status: z.enum(["all", "enabled", "disabled", "locked"]),
  }),
);

const {
  handleSubmit: handleFilterSubmit,
  resetForm: resetFilterForm,
  values: filterValues,
} = useForm({
  validationSchema: filterSchema,
  initialValues: {
    username: "",
    roleId: "all",
    status: "all",
  },
});

const form = reactive({
  username: "",
  realName: "",
  roleId: "",
  email: "",
  phone: "",
  status: "enabled" as UserStatus,
  expireAt: undefined as Date | undefined,
  password: "",
  confirmPassword: "",
});

const resetForm = reactive({
  password: "",
  confirmPassword: "",
});

const roleByIdMap = computed(() => new Map(roles.value.map((role) => [String(role.id), role])));
const activeRoles = computed(() => roles.value.filter((role) => getRoleStatus(role) === "enabled"));
const expireDefaultTime = { hours: 23, minutes: 59, seconds: 59 };

const columns: DataTableColumnDef<SystemUser>[] = [
  {
    accessorKey: "login_name",
    header: () => "用户名",
    size: 140,
    pin: "left",
    enableHiding: false,
  },
  {
    accessorKey: "real_name",
    header: () => "真实姓名",
    size: 140,
  },
  {
    accessorKey: "role",
    header: () => "角色",
    size: 160,
  },
  {
    accessorKey: "email",
    header: () => "电子邮箱",
    size: 200,
  },
  {
    accessorKey: "phone",
    header: () => "手机号",
    size: 140,
  },
  {
    accessorKey: "cst_expire",
    header: () => "有效期",
    size: 180,
  },
  {
    accessorKey: "is_use",
    header: () => "状态",
    size: 100,
  },
  {
    accessorKey: "last_login",
    header: () => "最后登录时间",
    size: 180,
  },
  {
    id: "operation",
    header: () => "操作",
    size: 220,
    pin: "right",
    enableHiding: false,
  },
];

const statusText: Record<UserStatus, string> = {
  enabled: "启用",
  disabled: "停用",
  locked: "锁定",
};

function getRoleStatus(role: SystemRole) {
  const value = role.is_use;
  return value === "0" || value === 0 || value === false ? "disabled" : "enabled";
}

function roleDisplayName(role: SystemRole) {
  return getRoleStatus(role) === "disabled" ? `${role.role_name}（已禁用）` : role.role_name;
}

function userRoleDisplayName(user: SystemUser) {
  const role = roleByIdMap.value.get(getUserRoleId(user));
  return role ? roleDisplayName(role) : "未分配";
}

function getUserStatus(user: SystemUser): UserStatus {
  const value = user.is_use;
  if (value === "2" || value === 2) return "locked";
  return value === "0" || value === 0 ? "disabled" : "enabled";
}

function statusToBackend(value?: UserStatus): "0" | "1" | "2" {
  if (value === "locked") return "2";
  return value === "disabled" ? "0" : "1";
}

function getUserRoleId(user: SystemUser) {
  return String(user.role?.[0]?.id ?? "");
}

async function loadRoles() {
  const res = await getRoleList({ page: 1, page_size: 100 });
  roles.value = res.data;
}

async function loadUsers() {
  loading.value = true;
  try {
    const res = await getUserList({
      page: page.value,
      page_size: pageSize.value,
      username: filterValues.username?.trim() || undefined,
      role_id: filterValues.roleId === "all" ? undefined : Number(filterValues.roleId),
      status: filterValues.status === "all" ? undefined : statusToBackend(filterValues.status),
    });
    users.value = res.data;
    total.value = res.total;
  } finally {
    loading.value = false;
  }
}

function resetEditor(roleId = String(activeRoles.value[0]?.id ?? "")) {
  form.username = "";
  form.realName = "";
  form.roleId = roleId;
  form.email = "";
  form.phone = "";
  form.status = "enabled";
  form.expireAt = undefined;
  form.password = "";
  form.confirmPassword = "";
}

function openCreate() {
  editingId.value = undefined;
  resetEditor();
  editorOpen.value = true;
}

function openEdit(user: SystemUser) {
  editingId.value = String(user.id);
  form.username = user.login_name;
  form.realName = user.real_name;
  form.roleId = getUserRoleId(user);
  form.email = user.email ?? "";
  form.phone = user.phone ?? "";
  form.status = getUserStatus(user);
  form.expireAt = parseDateTime(user.cst_expire ?? undefined);
  form.password = "";
  form.confirmPassword = "";
  editorOpen.value = true;
}

function validateForm() {
  const username = form.username.trim();
  const realName = form.realName.trim();
  const email = form.email.trim();
  const phone = form.phone.trim();

  if (!/^[a-z][a-z0-9_]{3,19}$/i.test(username)) {
    toast.error("用户名需为 4-20 位字母、数字或下划线，并以字母开头");
    return false;
  }
  if (!realName) {
    toast.error("请输入真实姓名");
    return false;
  }
  if (!form.roleId) {
    toast.error("请选择角色");
    return false;
  }
  if (!email) {
    toast.error("请输入电子邮箱");
    return false;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    toast.error("请输入正确的邮箱地址");
    return false;
  }
  if (!phone) {
    toast.error("请输入手机号");
    return false;
  }
  if (!/^1[3-9]\d{9}$/.test(phone)) {
    toast.error("请输入正确的手机号");
    return false;
  }
  if (!editingId.value) {
    if (!/^(?=.*[A-Za-z])(?=.*\d).{6,20}$/.test(form.password)) {
      toast.error("密码需包含字母和数字，长度 6-20 位");
      return false;
    }
    if (form.password !== form.confirmPassword) {
      toast.error("两次密码不一致");
      return false;
    }
  }
  return true;
}

async function submitUser() {
  if (!validateForm()) return;

  const payload = {
    login_name: form.username.trim(),
    real_name: form.realName.trim(),
    role: [Number(form.roleId)],
    is_use: statusToBackend(form.status),
    cst_expire: formatPayloadDateTime(form.expireAt),
    email: form.email.trim(),
    phone: form.phone.trim(),
    ...(!editingId.value ? { cipher: form.password } : {}),
  };

  saving.value = true;
  try {
    if (editingId.value) {
      await editUser(Number(editingId.value), payload);
    } else {
      await addUser(payload);
      page.value = 1;
    }
    editorOpen.value = false;
    toast.success(editingId.value ? "用户已更新" : "用户已新增");
    await loadUsers();
  } finally {
    saving.value = false;
  }
}

function openDeleteConfirm(user: SystemUser) {
  deletingUser.value = user;
  deleteConfirmOpen.value = true;
}

async function confirmDeleteUser() {
  const user = deletingUser.value;
  if (!user) return;
  loading.value = true;
  try {
    await deleteUserApi(Number(user.id));
    deleteConfirmOpen.value = false;
    deletingUser.value = undefined;
    toast.success("用户已删除");
    await loadUsers();
  } finally {
    loading.value = false;
  }
}

function openStatusConfirm(user: SystemUser, checked: boolean) {
  pendingStatusUser.value = user;
  pendingStatus.value = checked ? "enabled" : "disabled";
  statusConfirmOpen.value = true;
}

async function confirmStatusChange() {
  const user = pendingStatusUser.value;
  if (!user) return;
  saving.value = true;
  try {
    await editUser(Number(user.id), {
      login_name: user.login_name,
      real_name: user.real_name,
      role: getUserRoleId(user) ? [Number(getUserRoleId(user))] : [],
      is_use: statusToBackend(pendingStatus.value),
      cst_expire: user.cst_expire ?? null,
      email: user.email ?? "",
      phone: user.phone ?? "",
    });
    statusConfirmOpen.value = false;
    toast.success(`用户已${pendingStatus.value === "enabled" ? "启用" : "禁用"}`);
    await loadUsers();
  } finally {
    saving.value = false;
  }
}

function openReset(user: SystemUser) {
  resetUser.value = user;
  resetForm.password = "";
  resetForm.confirmPassword = "";
  resetOpen.value = true;
}

function openApiKeyManagement(user: SystemUser) {
  apiKeyDialogRef.value?.show({ id: String(user.id), username: user.login_name });
}

async function submitReset() {
  if (!resetUser.value) return;
  if (!/^(?=.*[A-Za-z])(?=.*\d).{6,20}$/.test(resetForm.password)) {
    toast.error("密码需包含字母和数字，长度 6-20 位");
    return;
  }
  if (resetForm.password !== resetForm.confirmPassword) {
    toast.error("两次密码不一致");
    return;
  }
  resetLoading.value = true;
  try {
    await resetUserPassword([Number(resetUser.value.id)], resetForm.password);
    resetOpen.value = false;
    toast.success(`已重置 ${resetUser.value.login_name} 的密码`);
  } finally {
    resetLoading.value = false;
  }
}

const searchUsers = handleFilterSubmit(() => {
  page.value = 1;
  void loadUsers();
});

function resetFilters() {
  resetFilterForm();
  page.value = 1;
  void loadUsers();
}

watch([page, pageSize], () => {
  void loadUsers();
});

onMounted(() => {
  void loadRoles();
  void loadUsers();
});
</script>

<template>
  <Card class="h-full">
    <CardContent class="flex h-full flex-1 flex-col gap-3">
      <form
        class="flex flex-wrap items-end gap-2"
        @submit.prevent="searchUsers"
        @reset.prevent="resetFilters"
      >
        <FormField v-slot="{ componentField }" name="username">
          <FormItem class="w-full sm:w-64">
            <FormControl>
              <div class="relative">
                <RiSearchLine
                  class="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
                />
                <Input v-bind="componentField" class="pl-9" placeholder="搜索用户名" />
              </div>
            </FormControl>
          </FormItem>
        </FormField>
        <FormField v-slot="{ componentField }" name="roleId">
          <FormItem inline>
            <FormLabel>角色：</FormLabel>
            <Select v-bind="componentField">
              <FormControl>
                <SelectTrigger class="w-full sm:w-40">
                  <SelectValue placeholder="角色" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">全部角色</SelectItem>
                  <SelectItem v-for="role in roles" :key="role.id" :value="String(role.id)">
                    {{ roleDisplayName(role) }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </FormItem>
        </FormField>
        <FormField v-slot="{ componentField }" name="status">
          <FormItem inline>
            <FormLabel>状态：</FormLabel>
            <Select v-bind="componentField">
              <FormControl>
                <SelectTrigger class="w-full sm:w-32">
                  <SelectValue placeholder="状态" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="enabled">启用</SelectItem>
                  <SelectItem value="disabled">停用</SelectItem>
                  <SelectItem value="locked">锁定</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
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
          新增用户
        </Button>
      </form>

      <DataTable
        v-model:page="page"
        v-model:page-size="pageSize"
        :columns="columns"
        :data="users"
        :total="total"
        :loading="loading"
        :get-row-id="(row) => String(row.id)"
        enable-column-hiding
        empty-text="暂无用户"
      >
        <template #role="{ row }">
          {{ userRoleDisplayName(row) }}
        </template>
        <template #cst_expire="{ row }">
          <span class="text-muted-foreground">{{
            formatDateTime(row.cst_expire) || "长期有效"
          }}</span>
        </template>
        <template #last_login="{ row }">
          <span class="text-muted-foreground">{{
            formatDateTime(row.last_login) || "从未登录"
          }}</span>
        </template>
        <template #is_use="{ row }">
          <div class="flex items-center gap-2">
            <Switch
              :model-value="getUserStatus(row) === 'enabled'"
              :disabled="saving"
              :aria-label="`${getUserStatus(row) === 'enabled' ? '禁用' : '启用'}用户${row.login_name}`"
              @update:model-value="(checked: boolean) => openStatusConfirm(row, checked)"
            />
            <span class="text-muted-foreground text-sm">{{ statusText[getUserStatus(row)] }}</span>
          </div>
        </template>
        <template #operation="{ row }">
          <div class="flex flex-wrap items-center gap-1">
            <Button variant="ghost" size="sm" @click="openEdit(row)">编辑</Button>
            <Button variant="ghost" size="sm" @click="openReset(row)">重置密码</Button>
            <Button variant="ghost" size="sm" @click="openApiKeyManagement(row)">
              APIKey管理
            </Button>
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
        <DialogTitle>{{ editingId ? "编辑用户" : "新增用户" }}</DialogTitle>
        <DialogDescription>用户只绑定一个角色，不再配置组织架构。</DialogDescription>
      </DialogHeader>
      <FieldGroup class="min-h-0 overflow-y-auto px-6 py-5 sm:grid sm:grid-cols-2 sm:gap-5">
        <Field>
          <FieldLabel>用户名</FieldLabel>
          <Input
            v-model="form.username"
            required
            autocomplete="username"
            placeholder="请输入用户名"
          />
          <FieldDescription>4-20 位字母、数字或下划线，并以字母开头。</FieldDescription>
        </Field>
        <Field>
          <FieldLabel>真实姓名</FieldLabel>
          <Input
            v-model="form.realName"
            required
            autocomplete="name"
            placeholder="请输入真实姓名"
          />
        </Field>
        <Field>
          <FieldLabel>角色</FieldLabel>
          <Select v-model="form.roleId">
            <SelectTrigger class="w-full">
              <SelectValue placeholder="请选择角色" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem
                  v-for="role in roles"
                  :key="role.id"
                  :value="String(role.id)"
                  :disabled="getRoleStatus(role) === 'disabled'"
                >
                  {{ roleDisplayName(role) }}
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel>有效期</FieldLabel>
          <DateTimePicker
            v-model="form.expireAt"
            empty-text="长期有效"
            time-label="到期时间"
            clear-hint="清除后视为长期有效"
            :default-time="expireDefaultTime"
          />
        </Field>
        <Field>
          <FieldLabel>电子邮箱</FieldLabel>
          <Input
            v-model="form.email"
            required
            type="email"
            autocomplete="email"
            placeholder="请输入邮箱"
          />
        </Field>
        <Field>
          <FieldLabel>手机号</FieldLabel>
          <Input
            v-model="form.phone"
            required
            type="tel"
            autocomplete="tel"
            placeholder="请输入手机号"
          />
        </Field>
        <template v-if="!editingId">
          <Field>
            <FieldLabel>初始密码</FieldLabel>
            <Input v-model="form.password" type="password" placeholder="请输入初始密码" />
            <FieldDescription>密码需包含字母和数字，长度 6-20 位。</FieldDescription>
          </Field>
          <Field>
            <FieldLabel>确认密码</FieldLabel>
            <Input v-model="form.confirmPassword" type="password" placeholder="请再次输入" />
          </Field>
        </template>
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
                <SelectItem value="locked">锁定</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
      </FieldGroup>
      <DialogFooter class="shrink-0 border-t px-6 py-4">
        <Button variant="outline" :disabled="saving" @click="editorOpen = false">取消</Button>
        <Button :disabled="saving" @click="submitUser">提交</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <AlertDialog v-model:open="statusConfirmOpen">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>
          确定{{ pendingStatus === "enabled" ? "启用" : "禁用" }}用户？
        </AlertDialogTitle>
        <AlertDialogDescription>
          将{{ pendingStatus === "enabled" ? "启用" : "禁用" }}用户「{{
            pendingStatusUser?.login_name
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
        <AlertDialogTitle>确定删除用户？</AlertDialogTitle>
        <AlertDialogDescription>
          将删除用户「{{ deletingUser?.login_name }}」，删除后无法在列表中继续使用该账号。
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel :disabled="loading">取消</AlertDialogCancel>
        <AlertDialogAction :disabled="loading" @click="confirmDeleteUser">删除</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>

  <Dialog v-model:open="resetOpen">
    <DialogContent class="flex max-h-[calc(100vh-2rem)] flex-col gap-0 p-0">
      <DialogHeader class="shrink-0 border-b px-6 py-4 pr-12">
        <DialogTitle>重置密码</DialogTitle>
        <DialogDescription>重置用户：{{ resetUser?.login_name }}</DialogDescription>
      </DialogHeader>
      <FieldGroup class="min-h-0 overflow-y-auto px-6 py-5">
        <Field>
          <FieldLabel>新密码</FieldLabel>
          <Input v-model="resetForm.password" type="password" placeholder="请输入新密码" />
          <FieldDescription>密码需包含字母和数字，长度 6-20 位。</FieldDescription>
        </Field>
        <Field>
          <FieldLabel>确认密码</FieldLabel>
          <Input v-model="resetForm.confirmPassword" type="password" placeholder="请再次输入" />
        </Field>
      </FieldGroup>
      <DialogFooter class="shrink-0 border-t px-6 py-4">
        <Button variant="outline" :disabled="resetLoading" @click="resetOpen = false">取消</Button>
        <Button :disabled="resetLoading" @click="submitReset">
          <RiLockPasswordLine data-icon="inline-start" />
          提交
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <ApiKeyManagementDialog ref="apiKeyDialogRef" v-model:open="apiKeyDialogOpen" />
</template>
