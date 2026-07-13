import { useEffect, useRef } from "react";
import Loading from "@/components/chat/loading";
import { useAgnoContext } from "@/components/provider/agno-provider";
import { useSessionContext } from "@/components/provider/session-provider";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/chat/")({
  component: ChatLandingPage,
});

function ChatLandingPage() {
  const navigate = Route.useNavigate();
  const { sessionList, sessionListLoading, sessionListReady, handleNewSession } =
    useSessionContext();
  const { currentApp } = useAgnoContext();
  const hasRequestedSessionRef = useRef(false);

  useEffect(() => {
    if (sessionListLoading || !sessionListReady) return;

    if (sessionList.length > 0) {
      hasRequestedSessionRef.current = false;
      const mostRecentSession = sessionList[0];
      void navigate({
        to: "/chat/$session",
        params: { session: mostRecentSession.session_id },
        search: currentApp ? { app: `${currentApp.type}:${currentApp.id}` } : undefined,
        replace: true,
      });
      return;
    }

    if (hasRequestedSessionRef.current) return;

    hasRequestedSessionRef.current = true;
    void handleNewSession();
  }, [sessionListLoading, sessionListReady, sessionList, currentApp, navigate, handleNewSession]);

  return (
    <div className="h-full w-full">
      <Loading />
    </div>
  );
}
