import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import type { SessionSchema } from "@/lib/sdk/agno/gen";
import {
  createSessionMutation,
  deleteSessionMutation,
  getSessionByIdOptions,
  getSessionsOptions,
  renameSessionMutation,
} from "@/lib/sdk/agno/gen/@tanstack/react-query.gen";
import type { ChatListItem } from "../chat/chat/hooks";
import { useAgnoContext } from "./agno-provider";

export const DEFAULT_SESSION_NAME = "新会话";

// Session detail can be any of the three types
type SessionDetail = {
  session_id: string;
  session_name?: string;
  chat_history?: ChatListItem[];
  [key: string]: unknown;
};

export interface SessionContextValue {
  // Session state
  currentSessionId: string | null;
  currentSession: SessionSchema | null;
  sessionList: SessionSchema[];
  sessionListLoading: boolean;
  sessionListReady: boolean;

  // Chat history for current session
  chatHistory: ChatListItem[];
  chatHistoryLoading: boolean;

  // Session operations
  handleNewSession: () => Promise<string | undefined>;
  handleSelectSession: (sessionId: string) => void;
  /** Sync session ID from URL without triggering navigation */
  syncSessionFromUrl: (sessionId: string) => void;
  handleDeleteSession: (sessionId: string) => Promise<void>;
  handleRenameSession: (sessionId: string, name?: string) => Promise<string | undefined>;

  // Chat state
  isResponding: boolean;
  setIsResponding: (state: boolean) => void;
  handleRefreshChatHistory: () => void;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export const useSessionContext = () => {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSessionContext must be used within a SessionProvider");
  }
  return ctx;
};

interface SessionProviderProps {
  children: ReactNode;
  initialSessionId?: string;
}

export const SessionProvider = ({ children, initialSessionId }: SessionProviderProps) => {
  const navigate = useNavigate();
  const search = useSearch({ strict: false });
  const { currentApp } = useAgnoContext();

  // State
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(initialSessionId ?? null);
  const [isResponding, setIsResponding] = useState(false);
  const creatingSessionRef = useRef<Promise<string | undefined> | null>(null);

  // Fetch all sessions (no type filter - global list)
  const {
    data: sessionList = [],
    isLoading: sessionListLoading,
    isFetching: sessionListFetching,
    isSuccess: sessionListSuccess,
    refetch: refetchSessionList,
  } = useQuery({
    ...getSessionsOptions({
      query: {
        limit: 100,
        sort_by: "created_at",
        sort_order: "desc",
      },
    }),
    select: (data) => (data?.data ?? []) as SessionSchema[],
    staleTime: 0,
  });
  const sessionListReady = sessionListSuccess && !sessionListFetching;

  // Fetch current session detail (including chat history)
  const {
    data: sessionDetail,
    isLoading: chatHistoryLoading,
    refetch: refetchChatHistory,
  } = useQuery({
    ...getSessionByIdOptions({
      path: {
        session_id: currentSessionId ?? "",
      },
    }),
    enabled: !!currentSessionId,
    staleTime: 0,
  });

  // Extract chat history from session detail
  const chatHistory = useMemo(() => {
    if (!sessionDetail) return [];
    const detail = sessionDetail as SessionDetail;
    return (detail.chat_history ?? []) as ChatListItem[];
  }, [sessionDetail]);

  // Current session from list
  const currentSession = useMemo(() => {
    return sessionList.find((s) => s.session_id === currentSessionId) ?? null;
  }, [sessionList, currentSessionId]);

  // Mutations
  const createSession = useMutation({
    ...createSessionMutation(),
    onSuccess: (data) => {
      if (data?.session_id) {
        setCurrentSessionId(data.session_id);
        void refetchSessionList();
      }
    },
    onError: (error) => {
      console.error("Failed to create session:", error);
      toast.error("创建会话失败");
    },
  });

  const deleteSession = useMutation({
    ...deleteSessionMutation(),
    onSuccess: () => {
      toast.success("删除成功");
    },
    onError: (error) => {
      console.error("Failed to delete session:", error);
      toast.error("删除失败");
    },
  });

  const updateSession = useMutation({
    ...renameSessionMutation(),
    onSuccess: () => {
      toast.success("修改成功");
      void refetchSessionList();
    },
    onError: (error) => {
      console.error("Failed to rename session:", error);
      toast.error("修改失败");
    },
  });

  // Handlers
  const handleNewSession = useCallback(async () => {
    if (creatingSessionRef.current) {
      return creatingSessionRef.current;
    }

    const createSessionTask = (async () => {
      try {
        const result = await createSession.mutateAsync({
          query: {
            type: currentApp?.type ?? "agent",
          },
          body: {
            session_name: DEFAULT_SESSION_NAME,
          },
        });
        if (result?.session_id) {
          // Navigate to new session
          const app = (search as Record<string, string>).app;
          void navigate({
            to: "/chat/$session",
            params: { session: result.session_id },
            search: app ? { app } : undefined,
          });
          return result.session_id;
        }
      } catch {
        // Error handled in mutation
      } finally {
        creatingSessionRef.current = null;
      }
    })();

    creatingSessionRef.current = createSessionTask;
    return createSessionTask;
  }, [createSession, navigate, search, currentApp]);

  const handleSelectSession = useCallback(
    (sessionId: string) => {
      // Only navigate - state sync is handled by $session route via syncSessionFromUrl
      const app = (search as Record<string, string>).app;
      return navigate({
        to: "/chat/$session",
        params: { session: sessionId },
        search: app ? { app } : undefined,
      });
    },
    [navigate, search],
  );

  // Sync session ID from URL without triggering navigation
  const syncSessionFromUrl = useCallback(
    (sessionId: string) => {
      // Only update if actually different to prevent duplicate renders
      if (sessionId !== currentSessionId) {
        setCurrentSessionId(sessionId);
      }
    },
    [currentSessionId],
  );

  const handleDeleteSession = useCallback(
    async (sessionId: string) => {
      if (deleteSession.isPending) return;

      const isCurrentSession = sessionId === currentSessionId;

      // Find next session before deleting
      const nextSession = isCurrentSession
        ? sessionList.find((s) => s.session_id !== sessionId)
        : null;

      try {
        await deleteSession.mutateAsync({
          path: { session_id: sessionId },
        });

        // Switch to next session or create new one
        if (isCurrentSession) {
          if (nextSession) {
            await handleSelectSession(nextSession.session_id);
          } else {
            await handleNewSession();
          }
        }

        await refetchSessionList();
      } catch {
        // Error handled in mutation
      }
    },
    [
      deleteSession,
      currentSessionId,
      sessionList,
      handleSelectSession,
      handleNewSession,
      refetchSessionList,
    ],
  );

  const handleRenameSession = useCallback(
    async (sessionId: string, newName?: string) => {
      if (updateSession.isPending) return;

      try {
        const result = await updateSession.mutateAsync({
          path: { session_id: sessionId },
          body: {
            session_name: newName?.trim() || DEFAULT_SESSION_NAME,
          },
        });
        return result?.session_name;
      } catch {
        // Error handled in mutation
      }
    },
    [updateSession],
  );

  const handleRefreshChatHistory = useCallback(() => {
    return refetchChatHistory();
  }, [refetchChatHistory]);

  // Auto-select first session if none selected
  useEffect(() => {
    if (sessionList.length > 0 && !currentSessionId) {
      setCurrentSessionId(sessionList[0]?.session_id ?? null);
    }
  }, [sessionList, currentSessionId]);

  const value: SessionContextValue = {
    currentSessionId,
    currentSession,
    sessionList,
    sessionListLoading,
    sessionListReady,
    chatHistory,
    chatHistoryLoading,
    isResponding,
    setIsResponding,
    handleNewSession,
    handleSelectSession,
    syncSessionFromUrl,
    handleDeleteSession,
    handleRenameSession,
    handleRefreshChatHistory,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};
