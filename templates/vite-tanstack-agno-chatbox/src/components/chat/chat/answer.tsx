"use client";

import { Reasoning, ReasoningContent, ReasoningTrigger } from "@/components/ai-elements/reasoning";
import { Markdown } from "../markdown/markdown";
import type { ChatListItem, OnContinueRun } from "./hooks";
import { MemberResponses } from "./member-responses";
import { OperationTools } from "./operation-tools";
import { ToolConfirmation } from "./tool-confirmation";
import { ToolsRender } from "./tools-render";

interface AnswerProps {
  item: ChatListItem;
  showTool?: boolean;
  onRegenerate?: () => void;
  onContinueRun?: OnContinueRun;
}

const PendingPlaceholder = () => (
  <div className="size-5 animate-spin rounded-full border-2 border-current border-t-transparent opacity-40" />
);

export const Answer = ({ item, onRegenerate, showTool, onContinueRun }: AnswerProps) => {
  return (
    <div className="flex max-w-full flex-col space-y-4 overflow-x-hidden">
      {/* Pending placeholder */}
      {item.status === "pending" && <PendingPlaceholder />}
      {/* Reasoning (for agent responses) */}
      {item.reasoning_content && (
        <Reasoning isStreaming={item.status === "reasoning"}>
          <ReasoningTrigger />
          <ReasoningContent>{item.reasoning_content}</ReasoningContent>
        </Reasoning>
      )}
      {/* Tool calls (for agent responses) */}
      {item.tool_calls && item.tool_calls.length > 0 && <ToolsRender tools={item.tool_calls} />}

      {/* Team member responses */}
      {item.member_responses && item.member_responses.length > 0 && (
        <MemberResponses members={item.member_responses} />
      )}

      {/* Main content */}
      {item.content && (
        <Markdown
          content={item.content}
          animated={true}
          isAnimating={item.status === "streaming"}
        />
      )}

      {/* HITL: Tool confirmation (when run is paused) */}
      {item.status === "paused" &&
        item.pending_tools &&
        item.pending_tools.length > 0 &&
        item.id &&
        onContinueRun && (
          <ToolConfirmation
            messageId={item.id}
            pendingTools={item.pending_tools}
            onContinueRun={onContinueRun}
          />
        )}

      {showTool && <OperationTools item={item} onRegenerate={onRegenerate} className="mt-2" />}
    </div>
  );
};
