import { Chat } from "./chat";
import { useChat } from "./hooks";

/**
 * Session chat component - renders the chat UI using useChat hook.
 * All logic is handled by the hook, this component only renders.
 */
export const ChatWrapper = () => {
  const {
    chatList,
    chatListLoading,
    isResponding,
    currentApp,
    handleSend,
    handleStop,
    handleRegenerate,
    handleContinueRun,
  } = useChat();

  return (
    <Chat
      app={currentApp}
      isResponding={isResponding}
      onSend={handleSend}
      chatListLoading={chatListLoading}
      onRegenerate={handleRegenerate}
      onStopResponding={handleStop}
      onContinueRun={handleContinueRun}
      chatList={chatList}
    />
  );
};
