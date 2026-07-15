<script setup lang="ts">
import { APP_TITLE } from "@/router/constants";
import Logo from "@/assets/logo.svg?url";
withDefaults(
  defineProps<{
    showText?: boolean;
    iconClass?: string;
    textClass?: string;
  }>(),
  {
    showText: true,
    iconClass: "size-7",
    textClass: "text-sm font-semibold tracking-tight",
  },
);
</script>

<template>
  <div class="inline-flex items-center gap-2">
    <img :src="Logo" :alt="showText ? '' : APP_TITLE" :class="iconClass" />
    <span v-if="showText" :class="textClass">{{ APP_TITLE }}</span>
  </div>
</template>
