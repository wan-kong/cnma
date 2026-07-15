<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  RiEyeLine,
  RiEyeOffLine,
  RiLockPasswordLine,
  RiRefreshLine,
  RiShieldKeyholeLine,
  RiUser3Line,
} from "@remixicon/vue";
import { getCaptcha } from "@/api/auth";
import { IS_MOCK_API } from "@/api/config";
import Logo from "@/components/base/Logo.vue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUserStore } from "@/stores/user";

defineOptions({
  name: "Login",
});
definePage({ meta: { layout: "blank", public: true, title: "登录" } });

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const username = ref("");
const password = ref("");
const captcha = ref("");
const captchaImg = ref("");
const showPassword = ref(false);
const loading = ref(false);
// URL token 登录进行中：先展示加载态，避免闪现登录表单。
const tokenLogging = ref(false);
const error = ref("");
const isMockMode = IS_MOCK_API;

// Vue Router 已完成 query 解码；仅接受站内绝对路径，避免异常编码或外部跳转。
function resolveRedirect(): string {
  const redirect = route.query.redirect;
  return typeof redirect === "string" && redirect.startsWith("/") && !redirect.startsWith("//")
    ? redirect
    : "/";
}

async function refreshCaptcha() {
  try {
    captchaImg.value = await getCaptcha();
  } catch {
    captchaImg.value = "";
  }
}

async function handleSubmit() {
  error.value = "";
  if (!username.value || !password.value) {
    error.value = "请输入用户名和密码";
    return;
  }
  if (!captcha.value) {
    error.value = "请输入验证码";
    return;
  }
  loading.value = true;
  try {
    await userStore.login({
      username: username.value,
      password: password.value,
      captcha: captcha.value,
    });
    router.replace(resolveRedirect());
  } catch (e) {
    error.value = e instanceof Error ? e.message : "登录失败，请重试";
    captcha.value = "";
    void refreshCaptcha();
  } finally {
    loading.value = false;
  }
}

// 支持从 URL 取 token 直接登录（单点登录回跳）：?token=xxx
async function tryUrlTokenLogin(): Promise<boolean> {
  const token = route.query.token;
  if (typeof token !== "string" || !token) return false;
  tokenLogging.value = true;
  try {
    const redirect = resolveRedirect();
    const sanitizedQuery = { ...route.query };
    delete sanitizedQuery.token;
    // 在任何携带 Authorization 的异步请求前清除地址栏 token，减少历史与 Referer 泄露。
    await userStore.logout({ callApi: false });
    await router.replace({ path: route.path, query: sanitizedQuery, hash: route.hash });
    await userStore.loginByToken(token);
    await router.replace(redirect);
    return true;
  } catch {
    tokenLogging.value = false;
    return false;
  }
}

onMounted(async () => {
  if (await tryUrlTokenLogin()) return;
  void refreshCaptcha();
});
</script>

<template>
  <!-- URL token 登录中：覆盖整页加载态，避免闪现登录表单。 -->
  <div
    v-if="tokenLogging"
    class="bg-background text-muted-foreground flex min-h-dvh flex-col items-center justify-center gap-3 text-sm"
  >
    <Logo :show-text="false" icon-class="size-8 animate-pulse" />
    正在登录…
  </div>

  <div v-else class="grid min-h-dvh lg:grid-cols-2">
    <!-- Brand panel -->
    <div
      class="bg-sidebar text-sidebar-foreground relative hidden flex-col justify-between overflow-hidden p-12 lg:flex"
    >
      <div
        class="bg-primary/10 pointer-events-none absolute -top-24 -right-24 size-96 rounded-full blur-3xl"
      />
      <div
        class="bg-primary/5 pointer-events-none absolute -bottom-32 -left-24 size-96 rounded-full blur-3xl"
      />

      <Logo
        class="relative"
        icon-class="size-9"
        text-class="text-base font-semibold tracking-tight"
      />

      <div class="relative space-y-4">
        <h1 class="text-4xl leading-tight font-bold tracking-tight">
          从数据到决策<br />让工作一目了然
        </h1>
        <p class="text-muted-foreground max-w-md text-sm leading-relaxed">
          一套开箱即用的 Vue 管理后台模板，覆盖数据展示、权限管理和工程化部署能力。
        </p>
      </div>

      <div class="text-muted-foreground relative text-xs"></div>
    </div>

    <!-- Form panel -->
    <div class="flex items-center justify-center p-6 sm:p-12">
      <div class="w-full max-w-sm space-y-8">
        <div class="space-y-2 text-center lg:hidden">
          <Logo :show-text="false" icon-class="mx-auto size-11" />
        </div>

        <div class="space-y-2">
          <h2 class="text-2xl font-semibold tracking-tight">欢迎回来</h2>
          <p class="text-muted-foreground text-sm">请登录您的账户以继续</p>
        </div>

        <div v-if="isMockMode" class="bg-muted/50 rounded-lg border px-4 py-3 text-sm">
          <div class="font-medium">本地演示账号</div>
          <div class="text-muted-foreground mt-1">admin / admin123 · 验证码 1234</div>
        </div>

        <form class="space-y-5" @submit.prevent="handleSubmit">
          <div class="space-y-2">
            <Label for="username">用户名</Label>
            <div class="relative">
              <RiUser3Line
                class="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
              />
              <Input
                id="username"
                v-model="username"
                type="text"
                placeholder="请输入用户名"
                autocomplete="username"
                class="pl-9"
              />
            </div>
          </div>

          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <Label for="password">密码</Label>
            </div>
            <div class="relative">
              <RiLockPasswordLine
                class="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
              />
              <Input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="请输入密码"
                autocomplete="current-password"
                class="px-9"
              />
              <button
                type="button"
                class="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                :aria-label="showPassword ? '隐藏密码' : '显示密码'"
                @click="showPassword = !showPassword"
              >
                <RiEyeOffLine v-if="showPassword" class="size-4" />
                <RiEyeLine v-else class="size-4" />
              </button>
            </div>
          </div>

          <div class="space-y-2">
            <Label for="captcha">验证码</Label>
            <div class="flex items-center gap-3">
              <div class="relative flex-1">
                <RiShieldKeyholeLine
                  class="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
                />
                <Input
                  id="captcha"
                  v-model="captcha"
                  type="text"
                  placeholder="请输入验证码"
                  autocomplete="off"
                  maxlength="6"
                  class="pl-9"
                />
              </div>
              <button
                type="button"
                class="border-input bg-muted/40 hover:bg-muted relative flex h-8 w-25 items-center justify-center overflow-hidden rounded-md border"
                aria-label="点击刷新验证码"
                @click="refreshCaptcha"
              >
                <img
                  v-if="captchaImg"
                  :src="captchaImg"
                  alt="验证码"
                  class="h-full w-full object-fill"
                />
                <RiRefreshLine v-else class="text-muted-foreground size-4" />
              </button>
            </div>
          </div>

          <p v-if="error" class="text-destructive text-sm">{{ error }}</p>

          <Button type="submit" class="w-full" :disabled="loading">
            {{ loading ? "登录中…" : "登录" }}
          </Button>
        </form>
      </div>
    </div>
  </div>
</template>
