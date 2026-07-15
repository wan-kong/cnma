<script setup lang="ts">
import { nextTick, onMounted, shallowRef, watch } from "vue";
import { toast } from "vue-sonner";
import { getGConfig, updateGConfig } from "@/api/settings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";

const AUTO_REFRESH_KEY = "AUTO_REFRESH";

const loading = shallowRef(true);
const saving = shallowRef(false);
const aiAssistEnabled = shallowRef(false);
let configId: number | null = null;
/** 跳过挂载阶段由赋值触发的首次 watch，避免多余的 PATCH 请求。 */
let skipInitialWatch = true;
/** 请求失败回滚开关时，跳过回滚值触发的下一次 watch。 */
let rollingBack = false;

onMounted(async () => {
  try {
    const config = await getGConfig(AUTO_REFRESH_KEY);
    configId = config.id;
    aiAssistEnabled.value = config.value === "1";
    // 等当前 tick 的 watch 执行完毕（被 skipInitialWatch 拦截）后再放开
    await nextTick();
    skipInitialWatch = false;
  } finally {
    loading.value = false;
  }
});

watch(aiAssistEnabled, async (enabled) => {
  if (rollingBack) {
    rollingBack = false;
    return;
  }
  if (skipInitialWatch || configId == null) return;
  saving.value = true;
  try {
    await updateGConfig(configId, { value: enabled ? "1" : "0" });
    toast.success(enabled ? "概览自动刷新已启用" : "概览自动刷新已停用");
  } catch {
    // 请求失败时回滚开关状态，保持 UI 与服务端一致
    rollingBack = true;
    aiAssistEnabled.value = !enabled;
  } finally {
    saving.value = false;
  }
});
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>概览偏好</CardTitle>
    </CardHeader>
    <CardContent>
      <template v-if="loading">
        <Skeleton class="h-16 w-full rounded-md" />
        <Skeleton class="mt-4 h-4 w-32" />
      </template>
      <template v-else>
        <div
          class="flex flex-col gap-4 rounded-md border p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div class="flex flex-col gap-1">
            <div class="font-medium">自动刷新数据</div>
            <p class="text-muted-foreground text-sm">
              开启后，概览页面可以按项目需要定时刷新统计指标与最新记录。
            </p>
          </div>
          <Switch v-model="aiAssistEnabled" :disabled="saving" aria-label="启用概览自动刷新" />
        </div>
        <p class="text-muted-foreground mt-4 text-sm">
          <template v-if="saving">保存中...</template>
          <template v-else-if="aiAssistEnabled"
            >自动刷新已开启，可在实际项目中接入轮询间隔配置。</template
          >
          <template v-else>自动刷新已关闭，页面仅在进入或手动操作时重新请求数据。</template>
        </p>
      </template>
    </CardContent>
  </Card>
</template>
