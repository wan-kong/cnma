import { useEffect } from "react";
import { ChatWrapper } from "@/components/chat";
import { useSessionContext } from "@/components/provider/session-provider";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/chat/$session")({
  component: SessionChatPage,
});

function SessionChatPage() {
  const { session } = Route.useParams();
  const { currentSessionId, syncSessionFromUrl } = useSessionContext();

  useEffect(() => {
    if (session && session !== "new" && session !== currentSessionId) {
      syncSessionFromUrl(session);
    }
  }, [session, currentSessionId, syncSessionFromUrl]);

  return <ChatWrapper />;
}
