import { useQuery } from "@tanstack/react-query";
import { Suspense, useState } from "react";
import Loading from "@/components/chat/loading";
import { AppSidebar } from "@/components/chat/sidebar";
import { AgnoProvider } from "@/components/provider/agno-provider";
import { SessionProvider } from "@/components/provider/session-provider";
import { SIDEBAR_COOKIE_NAME, SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
// Generated TanStack Query helpers resolve their SDK through Sdk.__registry.
// Importing the SDK entrypoint creates and registers the shared instance.
import "@/lib/sdk/agno";
import { getConfigOptions } from "@/lib/sdk/agno/gen/@tanstack/react-query.gen";
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/chat")({
  component: ChatLayout,
});

function ChatLayout() {
  const [opened, setOpened] = useState(() => localStorage.getItem(SIDEBAR_COOKIE_NAME) !== "false");

  const setSidebarOpened = (state: boolean) => {
    localStorage.setItem(SIDEBAR_COOKIE_NAME, String(state));
    setOpened(state);
  };

  const {
    data: configData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    ...getConfigOptions(),
  });

  if (isLoading) {
    return (
      <div className="h-svh w-svw">
        <Loading />
      </div>
    );
  }

  if (isError || !configData) {
    return (
      <div className="flex h-svh items-center justify-center p-6 text-center">
        <div>
          <h1 className="font-semibold text-xl">无法连接 AgentOS</h1>
          <p className="mt-2 text-muted-foreground text-sm">请确认 `/api` 代理和后端服务可用。</p>
          <Button className="mt-4" onClick={() => void refetch()}>
            重试
          </Button>
        </div>
      </div>
    );
  }

  if (configData.agents.length === 0 && configData.teams.length === 0) {
    return (
      <div className="flex h-svh items-center justify-center p-6 text-center">
        <div>
          <h1 className="font-semibold text-xl">没有可用的 Agent 或 Team</h1>
          <p className="mt-2 text-muted-foreground text-sm">
            请在 AgentOS 中注册至少一个 Agent 或 Team。
          </p>
        </div>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="h-svh w-svw">
          <Loading />
        </div>
      }
    >
      <AgnoProvider config={configData}>
        <SessionProvider>
          <SidebarProvider open={opened} onOpenChange={setSidebarOpened}>
            <AppSidebar />
            <SidebarInset>
              <Outlet />
            </SidebarInset>
          </SidebarProvider>
        </SessionProvider>
      </AgnoProvider>
    </Suspense>
  );
}
