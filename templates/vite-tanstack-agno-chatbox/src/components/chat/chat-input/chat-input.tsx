import { useCallback } from "react";
import { useStickToBottomContext } from "use-stick-to-bottom";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  type PromptInputMessage,
  PromptInputProvider,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { AppSelector } from "../app-selector";
import type { OnSend } from "../chat/hooks";

export const ChatInput = ({
  isResponding,
  handleSubmit,
}: {
  isResponding?: boolean;
  handleSubmit?: OnSend;
}) => {
  const { scrollToBottom } = useStickToBottomContext();

  const handleScrollToBottom = useCallback(() => {
    return scrollToBottom();
  }, [scrollToBottom]);

  const onSubmit = useCallback(
    ({ text }: PromptInputMessage) => {
      handleSubmit?.(text);
      void handleScrollToBottom();
    },
    [handleSubmit, handleScrollToBottom],
  );

  return (
    <div className="sticky bottom-0 z-10 flex w-full items-center justify-center bg-background pb-2">
      <div className="-mx-4 w-full max-w-5xl">
        <PromptInputProvider>
          <PromptInput onSubmit={onSubmit}>
            <PromptInputBody>
              <PromptInputTextarea />
            </PromptInputBody>
            <PromptInputFooter>
              <PromptInputTools>
                <AppSelector />
              </PromptInputTools>
              <PromptInputSubmit status={isResponding ? "streaming" : "ready"} />
            </PromptInputFooter>
          </PromptInput>
        </PromptInputProvider>
      </div>
    </div>
  );
};
