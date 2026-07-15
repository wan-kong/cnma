<script lang="ts" setup>
import type { LabelProps } from "reka-ui";
import type { HTMLAttributes } from "vue";
import { inject } from "vue";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { FORM_ITEM_INLINE_INJECTION_KEY } from "./injectionKeys";
import { useFormField } from "./useFormField";

const props = defineProps<LabelProps & { class?: HTMLAttributes["class"] }>();

const { error, formItemId } = useFormField();
// 同行布局时 label 不应被压缩换行。
const inline = inject(FORM_ITEM_INLINE_INJECTION_KEY, undefined);
</script>

<template>
  <Label
    data-slot="form-label"
    :data-error="!!error"
    :class="cn('data-[error=true]:text-destructive', inline && 'shrink-0', props.class)"
    :for="formItemId"
  >
    <slot />
  </Label>
</template>
