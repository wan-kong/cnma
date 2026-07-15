<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { computed } from "vue";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const { options = [10, 20, 50, 100], class: className } = defineProps<{
  /** 可选的每页条数。 */
  options?: number[];
  class?: HTMLAttributes["class"];
}>();

const pageSize = defineModel<number>({ required: true });

// reka-ui Select 的值是字符串，做数值 ↔ 字符串转换。
const selected = computed({
  get: () => String(pageSize.value),
  set: (value) => {
    pageSize.value = Number(value);
  },
});
</script>

<template>
  <Select v-model="selected">
    <SelectTrigger data-slot="pagination-size" size="sm" :class="className" aria-label="每页条数">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem v-for="option in options" :key="option" :value="String(option)">
        {{ option }} 条/页
      </SelectItem>
    </SelectContent>
  </Select>
</template>
