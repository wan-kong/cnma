<script setup lang="ts">
import { computed } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { RiLogoutBoxRLine, RiMoonLine, RiSunLine } from "@remixicon/vue";
import { useDark, useToggle } from "@vueuse/core";
import Logo from "@/components/base/Logo.vue";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUserStore } from "@/stores/user";
import { usePermissionStore } from "@/stores/permission";
import { navigation } from "./navigation";

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const permissionStore = usePermissionStore();

const effectiveNavigation = computed(() => {
  return navigation.filter((item) => permissionStore.hasPage(item.permissionKey));
});

function navTarget(item: (typeof navigation)[number]) {
  return item.to;
}

// 暗色模式：useDark 切换 <html> 上的 .dark 类并持久化到 localStorage，初始跟随系统偏好。
const isDark = useDark();
const toggleDark = useToggle(isDark);

function isActive(to: string) {
  return to === "/" ? route.path === "/" : route.path.startsWith(to);
}

async function handleLogout() {
  await userStore.logout();
  router.push("/login");
}
</script>

<template>
  <div class="bg-background/30 h-dvh flex flex-col relative overflow-hidden">
    <header class="bg-background/80 sticky top-0 z-30 border-b backdrop-blur">
      <div class="grid h-12 grid-cols-3 items-center px-3 sm:px-4">
        <!-- Left: system name -->
        <RouterLink to="/" class="justify-self-start">
          <Logo />
        </RouterLink>

        <!-- Center: primary nav -->
        <nav class="hidden items-center gap-1 justify-self-center md:flex">
          <RouterLink
            v-for="item in effectiveNavigation"
            :key="item.to"
            :to="navTarget(item)"
            class="rounded-md px-4 py-2 text-sm font-medium transition-colors"
            :class="
              isActive(item.to)
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:bg-accent/60 hover:text-accent-foreground'
            "
          >
            {{ item.title }}
          </RouterLink>
        </nav>

        <!-- Right: user info -->
        <div class="flex items-center gap-2 justify-self-end">
          <DropdownMenu>
            <DropdownMenuTrigger
              class="focus-visible:ring-ring rounded-full outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              aria-label="用户菜单"
            >
              <Avatar class="size-8">
                <AvatarFallback class="bg-primary text-primary-foreground text-xs font-medium">
                  {{ userStore.initials }}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" class="w-56">
              <DropdownMenuLabel class="flex flex-col gap-0.5">
                <span class="text-sm font-medium">{{ userStore.name }}</span>
                <span class="text-muted-foreground text-xs font-normal">{{ userStore.email }}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <!-- @select.prevent 阻止选中后关闭菜单，方便连续切换主题 -->
              <DropdownMenuItem class="cursor-pointer" @select.prevent="toggleDark()">
                <component :is="isDark ? RiSunLine : RiMoonLine" class="size-4" />
                {{ isDark ? "浅色模式" : "深色模式" }}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem class="cursor-pointer" @select="handleLogout">
                <RiLogoutBoxRLine class="size-4" />
                退出登录
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <!-- Mobile nav -->
      <nav class="flex items-center gap-1 overflow-x-auto border-t px-4 py-2 md:hidden">
        <RouterLink
          v-for="item in effectiveNavigation"
          :key="item.to"
          :to="navTarget(item)"
          class="shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
          :class="
            isActive(item.to)
              ? 'bg-accent text-accent-foreground'
              : 'text-muted-foreground hover:bg-accent/60 hover:text-accent-foreground'
          "
        >
          {{ item.title }}
        </RouterLink>
      </nav>
    </header>
    <!-- min-h-0 让页面可在固定视口内收缩，从而把滚动交给页面内部的滚动容器；
         overflow-y-auto 兜底处理未自管滚动的长内容页面（如设置/分析占位页）。 -->
    <main class="p-3 flex-1 flex flex-col min-h-0 overflow-y-auto">
      <slot />
    </main>
  </div>
</template>
