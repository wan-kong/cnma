import { setCustomComponents, MarkdownCodeBlockNode } from "markstream-vue";
import GuardedMarkdownLink from "./GuardedMarkdownLink.vue";

export const MARKDOWN_VIEW_CUSTOM_ID = "dashboard-markdown-view";

setCustomComponents(MARKDOWN_VIEW_CUSTOM_ID, {
  link: GuardedMarkdownLink,
  code_block: MarkdownCodeBlockNode,
});
