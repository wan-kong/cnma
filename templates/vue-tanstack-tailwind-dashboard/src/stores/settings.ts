import { ref } from "vue";
import { defineStore } from "pinia";
import type { SystemRole, SystemUser } from "@/api/settings";

export const useSettingsStore = defineStore("settings", () => {
  const roles = ref<SystemRole[]>([]);
  const users = ref<SystemUser[]>([]);

  return {
    roles,
    users,
  };
});
