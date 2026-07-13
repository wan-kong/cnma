import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { type AgnoApp, useAgnoContext } from "@/components/provider/agno-provider";
import { useSessionContext } from "@/components/provider/session-provider";
import { api } from "@/lib/sdk/agno";
import {
  type Audio,
  type Citations,
  handleStream,
  type Image,
  type MemberRunOutput,
  type MessageReferences,
  type Metrics,
  type ModelProviderData,
  type ToolExecution,
  type ToolRunExecution,
  type Video,
} from "./utils";

// ============================================================================
// Types
// ============================================================================

/** Executor type for the response */
export type ExecutorType = "agent" | "team";

/** Status of a message or step */
export type MessageStatus =
  | "pending"
  | "reasoning"
  | "streaming"
  | "paused"
  | "success"
  | "error"
  | "cancelled";

/** Member response for team execution */
export interface MemberResponse {
  member_id: string;
  member_name: string;
  member_type: "agent" | "team"; // Can be nested team
  role?: string;
  content: string;
  status: MessageStatus;
  tool_calls?: ToolExecution[];
  reasoning_content?: string;
  metrics?: Metrics;
  // Nested member responses (for sub-teams)
  member_responses?: MemberResponse[];
  created_at: number;
}

/** Unified chat message structure supporting agent/team */
export interface ChatMessage {
  id?: string;
  role: "user" | "system" | "assistant";
  content: string;
  status?: MessageStatus;
  error?: string;

  // Metadata
  created_at: number;
  updated_at?: number;

  // Executor info (what generated this response)
  executor_type?: ExecutorType;
  executor_id?: string;
  executor_name?: string;

  // Run info
  run_id?: string;
  session_id?: string;
  model?: string;
  model_provider?: string;
  model_provider_data?: ModelProviderData | null;

  // Rich content
  tool_calls?: ToolExecution[];
  images?: Image[];
  videos?: Video[];
  audio?: Audio[];

  // Reasoning
  reasoning_content?: string;
  // biome-ignore lint/suspicious/noExplicitAny: reasoning_steps is a list of any type
  reasoning_steps?: any[];

  // Extra info
  metrics?: Metrics;
  citations?: Citations;
  references?: MessageReferences[];

  // Team-specific: member responses
  member_responses?: MemberResponse[];

  // HITL (Human-in-the-loop): tools awaiting user confirmation
  pending_tools?: ToolRunExecution[];

  // Legacy/Optional
  form_history?: boolean;
  stop_after_tool_call?: boolean;
}

/** Alias for backward compatibility */
export type ChatListItem = ChatMessage;
export type AgentChatMessage = ChatMessage;

export type OnSend = (message: string) => void;
export type OnContinueRun = (messageId: string, approved: boolean, note?: string) => void;

// ============================================================================
// Helpers
// ============================================================================

/**
 * Convert MemberRunOutput from API to MemberResponse for UI
 */
const convertMemberRunOutput = (m: MemberRunOutput): MemberResponse => ({
  member_id: m.member_id,
  member_name: m.member_name,
  member_type: m.member_type,
  role: m.role ?? undefined,
  content: m.content,
  status: "success" as MessageStatus,
  tool_calls: m.tool_calls ?? undefined,
  reasoning_content: m.reasoning_content ?? undefined,
  metrics: m.metrics ?? undefined,
  member_responses: m.member_responses?.map(convertMemberRunOutput),
  created_at: m.created_at,
});

// ============================================================================
// API Helpers
// ============================================================================

/**
 * Create a run with the specified app (agent/team)
 */
const createAppRun = async (app: AgnoApp, sessionId: string, message: string) => {
  switch (app.type) {
    case "agent":
      return api.createAgentRun({
        path: { agent_id: app.id },
        body: {
          session_id: sessionId,
          message,
          stream: true,
        },
        parseAs: "stream",
      });
    case "team":
      return api.createTeamRun({
        path: { team_id: app.id },
        body: {
          session_id: sessionId,
          message,
          stream: true,
        },
        parseAs: "stream",
      });
    default:
      throw new Error(`Unknown app type: ${(app as AgnoApp).type}`);
  }
};

// ============================================================================
// useChat Hook
// ============================================================================

/**
 * Chat hook that manages message state and streaming responses.
 * Integrates with SessionContext and AgnoContext.
 */
export const useChat = () => {
  const { currentSessionId, chatHistory, chatHistoryLoading, isResponding, setIsResponding } =
    useSessionContext();

  const { currentApp } = useAgnoContext();

  // Local chat state for streaming (synced with chatHistory from backend)
  const [chatList, setChatList] = useState<ChatListItem[]>([]);

  // Sync local chat list with chat history from context
  useEffect(() => {
    setChatList(chatHistory);
  }, [chatHistory]);

  // Helper to update the last assistant message
  const updateLastMessage = useCallback((updater: (msg: ChatListItem) => ChatListItem) => {
    setChatList((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      if (last.role !== "assistant") return prev;
      const updated = updater(last);
      return [...prev.slice(0, -1), updated];
    });
  }, []);

  // Send a message
  const handleSend: OnSend = useCallback(
    async (message: string) => {
      if (!currentSessionId) {
        toast.error("请先选择或创建会话");
        return;
      }

      if (!currentApp) {
        toast.error("请先选择一个 Agent 或 Team");
        return;
      }

      if (isResponding) {
        toast.error("请等待回答结束后再发送消息");
        return;
      }

      const currentMessageTempId = Date.now();

      const questionItem: ChatListItem = {
        id: `question-${currentMessageTempId}`,
        role: "user",
        content: message,
        created_at: Date.now(),
        status: "success",
      };

      const answerItem: ChatListItem = {
        id: `answer-${currentMessageTempId}`,
        role: "assistant",
        content: "",
        reasoning_content: "",
        created_at: Date.now(),
        status: "pending",
        // Executor info
        executor_type: currentApp.type,
        executor_id: currentApp.id,
        executor_name: currentApp.name,
        // Legacy fields (for backwards compat with Answer component)
        model: currentApp.name,
        model_provider: currentApp.type,
        // Team specific
        member_responses: currentApp.type === "team" ? [] : undefined,
      };

      setChatList((prev) => [...prev, questionItem, answerItem]);
      setIsResponding(true);

      try {
        const { response } = await createAppRun(currentApp, currentSessionId, message);

        // Helpers for shared stream handling logic
        const updateToolCall = (toolCalls: ToolExecution[] | undefined, tool: ToolExecution) =>
          (toolCalls || []).map((t) =>
            (t as ToolRunExecution).tool_call_id === (tool as ToolRunExecution).tool_call_id
              ? tool
              : t,
          );

        const updateToolError = (toolCalls: ToolExecution[] | undefined, tool: ToolExecution) =>
          (toolCalls || []).map((t) =>
            (t as ToolRunExecution).tool_call_id === (tool as ToolRunExecution).tool_call_id
              ? { ...t, status: "error" }
              : t,
          );

        const onStreamStart = () => {
          updateLastMessage((msg) => ({ ...msg, status: "streaming" }));
        };

        const onStreamContent = (content: unknown, reasoning?: string | null) => {
          updateLastMessage((msg) => ({
            ...msg,
            content: msg.content + (typeof content === "string" ? content : ""),
            status: reasoning ? "reasoning" : "streaming",
            reasoning_content: (msg.reasoning_content || "") + (reasoning || ""),
          }));
        };

        const onStreamCompleted = (data: {
          content?: unknown;
          metrics?: Metrics | null;
          citations?: Citations | null;
          references?: MessageReferences[] | null;
          memberResponses?: MemberRunOutput[] | null;
        }) => {
          updateLastMessage((msg) => ({
            ...msg,
            status: "success",
            content: typeof data.content === "string" ? data.content : msg.content,
            metrics: data.metrics ?? undefined,
            citations: data.citations ?? undefined,
            references: data.references ?? undefined,
            member_responses:
              data.memberResponses?.map(convertMemberRunOutput) ?? msg.member_responses,
          }));
          setIsResponding(false);
        };

        const onStreamError = (error: string) => {
          updateLastMessage((msg) => ({
            ...msg,
            status: "error",
            error,
          }));
          setIsResponding(false);
          toast.error(error || "An error occurred during the run");
        };

        handleStream(response, {
          // ============ Agent Events ============
          onRunStarted: () => onStreamStart(),
          onRunContent: (e) => onStreamContent(e.content, e.reasoning_content),
          onReasoningStep: (e) => onStreamContent("", e.reasoning_content),
          onToolCallStarted: (e) => {
            if (e.tool) {
              updateLastMessage((msg) => ({
                ...msg,
                tool_calls: [...(msg.tool_calls || []), e.tool!],
              }));
            }
          },
          onToolCallCompleted: (e) => {
            if (e.tool) {
              updateLastMessage((msg) => ({
                ...msg,
                tool_calls: updateToolCall(msg.tool_calls, e.tool!),
              }));
            }
          },
          onToolCallError: (e) => {
            if (e.tool) {
              updateLastMessage((msg) => ({
                ...msg,
                tool_calls: updateToolError(msg.tool_calls, e.tool!),
              }));
            }
          },
          onRunCompleted: (e) =>
            onStreamCompleted({
              content: e.content,
              metrics: e.metrics,
              citations: e.citations,
              references: e.references,
            }),
          onRunPaused: (e) => {
            const pendingTools = (e.tools ?? []).filter(
              (t): t is ToolRunExecution =>
                "tool_call_id" in t && (t as ToolRunExecution).requires_confirmation === true,
            );
            updateLastMessage((msg) => ({
              ...msg,
              status: "paused",
              content: typeof e.content === "string" && e.content ? e.content : msg.content,
              run_id: e.run_id ?? msg.run_id,
              executor_id: e.agent_id ?? msg.executor_id,
              pending_tools: pendingTools,
            }));
            setIsResponding(false);
          },
          onRunError: (e) => onStreamError(e.content ?? "Unknown error"),

          // ============ Team Events ============
          onTeamRunStarted: () => onStreamStart(),
          onTeamRunContent: (e) => onStreamContent(e.content, e.reasoning_content),
          onTeamToolCallStarted: (e) => {
            if (!e.tool) return;
            const memberId = e.member_id ?? undefined;
            if (memberId) {
              updateLastMessage((msg) => {
                const members = msg.member_responses || [];
                const memberIndex = members.findIndex((m) => m.member_id === memberId);
                if (memberIndex >= 0) {
                  const updatedMembers = [...members];
                  updatedMembers[memberIndex] = {
                    ...updatedMembers[memberIndex],
                    tool_calls: [...(updatedMembers[memberIndex].tool_calls || []), e.tool!],
                  };
                  return { ...msg, member_responses: updatedMembers };
                }
                return msg;
              });
            } else {
              updateLastMessage((msg) => ({
                ...msg,
                tool_calls: [...(msg.tool_calls || []), e.tool!],
              }));
            }
          },
          onTeamToolCallCompleted: (e) => {
            if (!e.tool) return;
            const memberId = e.member_id ?? undefined;
            if (memberId) {
              updateLastMessage((msg) => {
                const members = msg.member_responses || [];
                const memberIndex = members.findIndex((m) => m.member_id === memberId);
                if (memberIndex >= 0) {
                  const member = members[memberIndex];
                  const updatedMembers = [...members];
                  updatedMembers[memberIndex] = {
                    ...member,
                    tool_calls: updateToolCall(member.tool_calls, e.tool!),
                  };
                  return { ...msg, member_responses: updatedMembers };
                }
                return msg;
              });
            } else {
              updateLastMessage((msg) => ({
                ...msg,
                tool_calls: updateToolCall(msg.tool_calls, e.tool!),
              }));
            }
          },
          onMemberRunStarted: (e) => {
            updateLastMessage((msg) => ({
              ...msg,
              member_responses: [
                ...(msg.member_responses || []),
                {
                  member_id: e.member_id,
                  member_name: e.member_name,
                  member_type: e.member_type,
                  role: e.role ?? undefined,
                  content: "",
                  status: "streaming" as MessageStatus,
                  created_at: Date.now(),
                },
              ],
            }));
          },
          onMemberRunContent: (e) => {
            updateLastMessage((msg) => {
              const members = msg.member_responses || [];
              const memberIndex = members.findIndex((m) => m.member_id === e.member_id);
              if (memberIndex >= 0) {
                const updatedMembers = [...members];
                updatedMembers[memberIndex] = {
                  ...updatedMembers[memberIndex],
                  content:
                    updatedMembers[memberIndex].content +
                    (typeof e.content === "string" ? e.content : ""),
                  reasoning_content:
                    (updatedMembers[memberIndex].reasoning_content || "") +
                    (e.reasoning_content || ""),
                  status: e.reasoning_content ? "reasoning" : "streaming",
                };
                return { ...msg, member_responses: updatedMembers };
              }
              return msg;
            });
          },
          onMemberRunCompleted: (e) => {
            updateLastMessage((msg) => {
              const members = msg.member_responses || [];
              const memberIndex = members.findIndex((m) => m.member_id === e.member_id);
              if (memberIndex >= 0) {
                const updatedMembers = [...members];
                updatedMembers[memberIndex] = convertMemberRunOutput({
                  member_id: e.member_id,
                  member_name: e.member_name,
                  member_type: e.member_type,
                  role: e.role,
                  content: typeof e.content === "string" ? e.content : "",
                  content_type: e.content_type,
                  reasoning_content: e.reasoning_content,
                  metrics: e.metrics,
                  tool_calls: e.tool_calls,
                  created_at: e.created_at,
                  member_responses: e.member_responses,
                });
                return { ...msg, member_responses: updatedMembers };
              }
              return msg;
            });
          },
          onTeamRunCompleted: (e) =>
            onStreamCompleted({
              content: e.content,
              metrics: e.metrics,
              citations: e.citations,
              references: e.references,
              memberResponses: e.member_responses,
            }),
          onTeamRunError: (e) => onStreamError(e.content ?? "Unknown team error"),
        });
      } catch (error) {
        console.error("Failed to create run:", error);
        updateLastMessage((msg) => ({
          ...msg,
          status: "error",
          error: error instanceof Error ? error.message : "Network error",
        }));
        setIsResponding(false);
        toast.error("发送消息失败");
      }
    },
    [currentSessionId, currentApp, isResponding, setIsResponding, updateLastMessage],
  );

  // Continue a paused run (approve or reject tool execution)
  const handleContinueRun: OnContinueRun = useCallback(
    async (messageId: string, approved: boolean, note?: string) => {
      // Find the paused message
      const pausedMessage = chatList.find((m) => m.id === messageId && m.status === "paused");
      if (!pausedMessage?.pending_tools?.length) return;
      if (!pausedMessage.executor_id || !pausedMessage.run_id) return;

      // Build confirmed tools payload
      const confirmedTools = pausedMessage.pending_tools.map((t) => ({
        ...t,
        confirmed: approved,
        confirmation_note: note ?? null,
      }));

      // Clear pending state, resume streaming
      // Merge confirmed tools into existing tool_calls (update if exists, append if not)
      updateLastMessage((msg) => {
        const existingIds = new Set(
          (msg.tool_calls ?? []).map((t) => (t as ToolRunExecution).tool_call_id),
        );
        const updatedToolCalls = (msg.tool_calls ?? []).map((t) => {
          const match = confirmedTools.find(
            (ct) => ct.tool_call_id === (t as ToolRunExecution).tool_call_id,
          );
          return match ? { ...match, result: approved ? null : "已拒绝" } : t;
        });
        // Append any tools not already in tool_calls
        const newTools = confirmedTools
          .filter((ct) => !existingIds.has(ct.tool_call_id))
          .map((t) => ({
            ...t,
            result: approved ? null : ("已拒绝" as unknown),
          }));

        return {
          ...msg,
          status: "streaming",
          pending_tools: undefined,
          tool_calls: [...updatedToolCalls, ...newTools],
        };
      });
      setIsResponding(true);

      try {
        const { response } = await api.continueAgentRun({
          path: {
            agent_id: pausedMessage.executor_id,
            run_id: pausedMessage.run_id,
          },
          body: {
            tools: JSON.stringify(confirmedTools),
            session_id: currentSessionId ?? undefined,
            stream: true,
          },
          parseAs: "stream",
        });

        // Reuse the same stream helpers
        const updateToolCall = (toolCalls: ToolExecution[] | undefined, tool: ToolExecution) =>
          (toolCalls || []).map((t) =>
            (t as ToolRunExecution).tool_call_id === (tool as ToolRunExecution).tool_call_id
              ? tool
              : t,
          );

        const onStreamCompleted = (data: {
          content?: unknown;
          metrics?: Metrics | null;
          citations?: Citations | null;
          references?: MessageReferences[] | null;
        }) => {
          updateLastMessage((msg) => ({
            ...msg,
            status: "success",
            content: typeof data.content === "string" ? data.content : msg.content,
            metrics: data.metrics ?? undefined,
            citations: data.citations ?? undefined,
            references: data.references ?? undefined,
          }));
          setIsResponding(false);
        };

        const onStreamError = (error: string) => {
          updateLastMessage((msg) => ({
            ...msg,
            status: "error",
            error,
          }));
          setIsResponding(false);
          toast.error(error || "An error occurred during the run");
        };

        handleStream(response, {
          onRunStarted: () => {
            updateLastMessage((msg) => ({ ...msg, status: "streaming" }));
          },
          onRunContent: (e) => {
            updateLastMessage((msg) => ({
              ...msg,
              content: msg.content + (typeof e.content === "string" ? e.content : ""),
              status: e.reasoning_content ? "reasoning" : "streaming",
              reasoning_content: (msg.reasoning_content || "") + (e.reasoning_content || ""),
            }));
          },
          onReasoningStep: (e) => {
            updateLastMessage((msg) => ({
              ...msg,
              reasoning_content: (msg.reasoning_content || "") + (e.reasoning_content || ""),
              status: "reasoning",
            }));
          },
          onToolCallStarted: (e) => {
            if (e.tool) {
              updateLastMessage((msg) => ({
                ...msg,
                tool_calls: [...(msg.tool_calls || []), e.tool!],
              }));
            }
          },
          onToolCallCompleted: (e) => {
            if (e.tool) {
              updateLastMessage((msg) => ({
                ...msg,
                tool_calls: updateToolCall(msg.tool_calls, e.tool!),
              }));
            }
          },
          onRunCompleted: (e) =>
            onStreamCompleted({
              content: e.content,
              metrics: e.metrics,
              citations: e.citations,
              references: e.references,
            }),
          onRunPaused: (e) => {
            const pendingTools = (e.tools ?? []).filter(
              (t): t is ToolRunExecution =>
                "tool_call_id" in t && (t as ToolRunExecution).requires_confirmation === true,
            );
            updateLastMessage((msg) => ({
              ...msg,
              status: "paused",
              content: typeof e.content === "string" && e.content ? e.content : msg.content,
              run_id: e.run_id ?? msg.run_id,
              pending_tools: pendingTools,
            }));
            setIsResponding(false);
          },
          onRunError: (e) => onStreamError(e.content ?? "Unknown error"),
          onRunContinued: () => {
            updateLastMessage((msg) => ({ ...msg, status: "streaming" }));
          },
        });
      } catch (error) {
        console.error("Failed to continue run:", error);
        updateLastMessage((msg) => ({
          ...msg,
          status: "error",
          error: error instanceof Error ? error.message : "Failed to continue run",
        }));
        setIsResponding(false);
        toast.error("继续运行失败");
      }
    },
    [chatList, currentSessionId, setIsResponding, updateLastMessage],
  );

  // Stop responding
  const handleStop = useCallback(() => {
    // TODO: Implement cancel run API
    setIsResponding(false);
    setChatList((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      if (last.role === "assistant" && (last.status === "pending" || last.status === "streaming")) {
        return [...prev.slice(0, -1), { ...last, status: "cancelled" }];
      }
      return prev;
    });
  }, [setIsResponding]);

  // Regenerate last response
  const handleRegenerate = useCallback(() => {
    // TODO: Implement regenerate
  }, []);

  // Filtered message list (only show if we have a session)
  const messageList = useMemo(() => {
    if (currentSessionId || chatList.length > 1) return chatList;
    return [];
  }, [chatList, currentSessionId]);

  // App info for display
  const appInfo = useMemo(
    () => ({
      id: currentApp?.id ?? "",
      name: currentApp?.name ?? "",
      description: currentApp?.description ?? "",
      db_id: currentApp?.db_id ?? "",
    }),
    [currentApp],
  );

  return {
    // State
    chatList: messageList,
    chatListLoading: chatHistoryLoading,
    isResponding,
    currentApp: appInfo,

    // Actions
    handleSend,
    handleStop,
    handleRegenerate,
    handleContinueRun,
  };
};
