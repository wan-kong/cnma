<script setup lang="ts">
import { computed } from "vue";
import { RouterView, useRoute, useRouter } from "vue-router";
import { usePermissionStore } from "@/stores/permission";

definePage({
  name: "settings",
  meta: { title: "系统设置", super: true },
});

const route = useRoute();
const router = useRouter();
const permissionStore = usePermissionStore();

const tabs = [
  { value: "system", title: "系统设置", path: "/settings", permissionKey: "settings" },
  { value: "user", title: "用户管理", path: "/settings/user", permissionKey: "settingsUser" },
  { value: "role", title: "角色管理", path: "/settings/role", permissionKey: "settingsRole" },
] as const;

const visibleTabs = computed(() =>
  tabs.filter((tab) => permissionStore.hasPage(tab.permissionKey)),
);

const activeTab = computed({
  get() {
    if (route.path.endsWith("/user")) return "user";
    if (route.path.endsWith("/role")) return "role";
    return "system";
  },
  set(value: string) {
    const tab = visibleTabs.value.find((item) => item.value === value);
    if (tab && route.path !== tab.path) void router.push(tab.path);
  },
});

function navigateTo(path: string) {
  if (route.path !== path) void router.push(path);
}
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col gap-5">
    <div class="shrink-0">
      <h1 class="text-xl font-semibold tracking-tight">系统设置</h1>
      <p class="text-muted-foreground mt-1 text-sm">配置系统开关、用户账号和角色权限。</p>
    </div>

    <div class="grid min-h-0 flex-1 gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside class="bg-card rounded-xl border p-2 lg:min-h-full">
        <nav class="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
          <button
            v-for="tab in visibleTabs"
            :key="tab.value"
            type="button"
            class="hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring flex min-w-28 items-center justify-between rounded-md px-3 py-2 text-left text-sm font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:outline-hidden lg:min-w-0"
            :class="
              activeTab === tab.value
                ? 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground'
                : 'text-muted-foreground'
            "
            @click="navigateTo(tab.path)"
          >
            <span>{{ tab.title }}</span>
          </button>
        </nav>
      </aside>

      <main class="min-w-0">
        <RouterView />
      </main>
    </div>
  </div>
</template>
