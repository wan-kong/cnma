<script setup lang="ts">
import { useRouter } from "vue-router";
import { RiHome3Line } from "@remixicon/vue";
import { HOME_PATH } from "@/router/constants";
import { Button } from "@/components/ui/button";

defineOptions({
  name: "NotFound",
});
definePage({ meta: { layout: "blank", public: true, title: "页面未找到" } });

const router = useRouter();

function goHome() {
  router.replace(HOME_PATH);
}
</script>

<template>
  <div class="bg-background flex min-h-dvh flex-col items-center justify-center gap-6 px-4">
    <div class="text-primary/60 text-[140px] leading-none font-bold tracking-tighter select-none">
      404
    </div>

    <div class="text-center space-y-1.5">
      <h1 class="text-foreground text-xl font-semibold tracking-tight">页面未找到</h1>
      <p class="text-muted-foreground max-w-sm text-sm">
        您访问的页面不存在或已被移除，请检查链接地址是否正确。
      </p>
    </div>

    <Button @click="goHome">
      <RiHome3Line class="size-4" />
      返回首页
    </Button>
  </div>
</template>
