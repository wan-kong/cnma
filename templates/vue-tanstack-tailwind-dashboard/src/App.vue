<script setup lang="ts">
import { computed } from "vue";
import { RouterView, useRoute } from "vue-router";
import DashboardLayout from "@/layouts/DashboardLayout.vue";
import BlankLayout from "@/layouts/BlankLayout.vue";
import { Toaster } from "@/components/ui/sonner";
import "vue-sonner/style.css";

const route = useRoute();
const layout = computed(() => (route.meta.layout === "blank" ? BlankLayout : DashboardLayout));
</script>

<template>
  <component :is="layout">
    <RouterView />
  </component>
  <Toaster position="top-center" />
</template>
