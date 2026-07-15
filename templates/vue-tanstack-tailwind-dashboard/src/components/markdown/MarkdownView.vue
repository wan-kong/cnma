<script setup lang="ts">
import { MarkdownRender } from "markstream-vue";
import { MARKDOWN_VIEW_CUSTOM_ID } from "./config";

const props = defineProps<{
  /** 待渲染的 Markdown 原文。 */
  source: string;
}>();
</script>

<template>
  <div class="markdown-body">
    <MarkdownRender
      :content="props.source ?? ''"
      mode="minimal"
      :final="true"
      :render-code-blocks-as-pre="true"
      :smooth-streaming="false"
      :fade="false"
      :custom-id="MARKDOWN_VIEW_CUSTOM_ID"
    />
  </div>
</template>
