<script setup lang="ts">
import RoleManagementPanel from "@/components/settings/RoleManagementPanel.vue";

definePage({
  name: "settingsRole",
  meta: { title: "角色管理", permissionKey: "settingsRole", super: true },
});
</script>

<template>
  <RoleManagementPanel />
</template>
