<script setup lang="ts">
import type { PermissionNode } from "./settings-data";
import { computed } from "vue";
import { Checkbox } from "@/components/ui/checkbox";

const props = defineProps<{
  node: PermissionNode;
  selected: string[];
}>();

const emit = defineEmits<{
  toggle: [node: PermissionNode, checked: boolean];
}>();

defineOptions({ name: "PermissionTreeNode" });

const checked = computed(() => props.selected.includes(props.node.id));
</script>

<template>
  <div class="flex flex-col gap-2">
    <label class="flex items-center gap-2 text-sm">
      <Checkbox
        :model-value="checked"
        @update:model-value="(value) => emit('toggle', node, value === true)"
      />
      <span>{{ node.name }}</span>
    </label>
    <div v-if="node.children?.length" class="ml-6 flex flex-col gap-2">
      <PermissionTreeNode
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :selected="selected"
        @toggle="(item, value) => emit('toggle', item, value)"
      />
    </div>
  </div>
</template>
