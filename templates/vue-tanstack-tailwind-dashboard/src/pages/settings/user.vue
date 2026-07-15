<script setup lang="ts">
import UserManagementPanel from "@/components/settings/UserManagementPanel.vue";

definePage({
  name: "settingsUser",
  meta: { title: "用户管理", permissionKey: "settingsUser", super: true },
});
</script>

<template>
  <UserManagementPanel />
</template>
