<script setup lang="ts">
import SystemPreferencePanel from "@/components/settings/SystemPreferencePanel.vue";

definePage({ meta: { title: "系统设置", permissionKey: "settings", super: true } });
</script>

<template>
  <SystemPreferencePanel />
</template>
