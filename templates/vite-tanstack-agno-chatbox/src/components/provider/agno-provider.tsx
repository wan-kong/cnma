import { useNavigate, useSearch } from "@tanstack/react-router";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ConfigResponse } from "@/lib/sdk/agno/gen";

export type AgnoAppType = "agent" | "team";
export interface AgnoApp {
  type: AgnoAppType;
  id: string;
  name: string;
  description?: string;
  db_id?: string;
}
interface AgnoContextValue extends ConfigResponse {
  apps: AgnoApp[];
  agentApps: AgnoApp[];
  teamApps: AgnoApp[];
  currentApp: AgnoApp | null;
  setApp: (app: AgnoApp) => void;
}

const AgnoContext = createContext<AgnoContextValue | undefined>(undefined);
export function useAgnoContext() {
  const value = useContext(AgnoContext);
  if (!value) throw new Error("useAgnoContext must be used within AgnoProvider");
  return value;
}

function parseApp(value?: string): { type: AgnoAppType; id: string } | null {
  if (!value) return null;
  const [type, id] = value.split(":");
  return id && (type === "agent" || type === "team") ? { type, id } : null;
}

export function AgnoProvider({
  children,
  config,
}: {
  children: ReactNode;
  config: ConfigResponse;
}) {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as Record<string, string | undefined>;
  const agentApps = useMemo(
    () =>
      config.agents
        .filter((item) => item.id)
        .map((item) => ({
          type: "agent" as const,
          id: item.id!,
          name: item.name ?? "Unnamed Agent",
          description: item.description ?? undefined,
          db_id: item.db_id ?? undefined,
        })),
    [config.agents],
  );
  const teamApps = useMemo(
    () =>
      config.teams
        .filter((item) => item.id)
        .map((item) => ({
          type: "team" as const,
          id: item.id!,
          name: item.name ?? "Unnamed Team",
          description: item.description ?? undefined,
          db_id: item.db_id ?? undefined,
        })),
    [config.teams],
  );
  const apps = useMemo(() => [...agentApps, ...teamApps], [agentApps, teamApps]);
  const resolveApp = useCallback(() => {
    const parsed = parseApp(search.app);
    return (
      (parsed && apps.find((app) => app.type === parsed.type && app.id === parsed.id)) ||
      agentApps[0] ||
      teamApps[0] ||
      null
    );
  }, [search.app, apps, agentApps, teamApps]);
  const [currentApp, setCurrentApp] = useState<AgnoApp | null>(() => resolveApp());

  useEffect(() => {
    const resolved = resolveApp();
    if (resolved && (resolved.id !== currentApp?.id || resolved.type !== currentApp.type))
      setCurrentApp(resolved);
  }, [resolveApp, currentApp]);

  const setApp = useCallback(
    (app: AgnoApp) => {
      setCurrentApp(app);
      void navigate({
        search: (previous: Record<string, unknown>) => ({
          ...previous,
          app: `${app.type}:${app.id}`,
        }),
        replace: true,
      } as never);
    },
    [navigate],
  );

  return (
    <AgnoContext.Provider value={{ ...config, apps, agentApps, teamApps, currentApp, setApp }}>
      {children}
    </AgnoContext.Provider>
  );
}
