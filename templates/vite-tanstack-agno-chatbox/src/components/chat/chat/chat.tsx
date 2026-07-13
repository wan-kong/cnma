import { Conversation, ConversationContent } from "@/components/ai-elements/conversation";
import { ProgressiveBlur } from "@/components/ui/progressive-blur";
import type { AgentSummaryResponse } from "@/lib/sdk/agno/gen";
import { ChatInput } from "../chat-input";
import { Answer } from "./answer";
import { ChatEmptyState } from "./chat-empty-state";
import type { ChatListItem, OnContinueRun, OnSend } from "./hooks";
import { Question } from "./question";

export interface ChatWrapperProps {
  app: AgentSummaryResponse;
  chatList: ChatListItem[];
  chatListLoading?: boolean;
  isResponding?: boolean;
  onStopResponding?: () => void;
  onSend?: OnSend;
  onRegenerate?: () => void;
  onContinueRun?: OnContinueRun;
}

export function Chat({
  isResponding,
  onSend,
  onRegenerate,
  onContinueRun,
  chatList,
  chatListLoading,
}: ChatWrapperProps) {
  // Find the last assistant message index for regenerate button
  const lastAssistantIndex = chatList.findLastIndex((item) => item.role === "assistant");

  return (
    <Conversation>
      <ConversationContent className="pb-0">
        <div className="grow pt-10 pb-0">
          {chatList.length === 0 && !chatListLoading && <ChatEmptyState onSend={onSend} />}
          {
            <div className="space-y-4 p-[max(1rem,calc(100%-64rem)/2)] py-10">
              {chatList.map((item, index) => {
                if (item.role === "user") {
                  return <Question key={item.id} item={item} />;
                }
                if (item.role === "assistant" || item.role === "system") {
                  // Only show regenerate on the last assistant message
                  const isLastAssistant = index === lastAssistantIndex;
                  const showTool =
                    index === chatList.length - 1 || chatList[index + 1].role === "user";
                  return (
                    <Answer
                      showTool={showTool}
                      key={item.id}
                      item={item}
                      onRegenerate={isLastAssistant ? onRegenerate : undefined}
                      onContinueRun={onContinueRun}
                    />
                  );
                }
                return null;
              })}
            </div>
          }
        </div>
        <ProgressiveBlur position="bottom" height="160px" />
        <ChatInput isResponding={isResponding} handleSubmit={onSend} />
      </ConversationContent>
    </Conversation>
  );
}
