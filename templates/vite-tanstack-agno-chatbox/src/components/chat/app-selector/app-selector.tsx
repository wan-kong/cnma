import { BotIcon, CheckIcon, UsersIcon } from "lucide-react";
import { useState } from "react";
import { PromptInputButton } from "@/components/ai-elements/prompt-input";
import { type AgnoApp, useAgnoContext } from "@/components/provider/agno-provider";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export function AppSelector() {
  const { currentApp, setApp, agentApps, teamApps } = useAgnoContext();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const groups = [
    { label: "Agents", icon: BotIcon, apps: agentApps },
    { label: "Teams", icon: UsersIcon, apps: teamApps },
  ].map((group) => ({
    ...group,
    apps: group.apps.filter((app) =>
      `${app.name} ${app.description ?? ""}`.toLowerCase().includes(query.toLowerCase()),
    ),
  }));

  function select(app: AgnoApp) {
    setApp(app);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<PromptInputButton />}>
        {currentApp?.type === "team" ? <UsersIcon /> : <BotIcon />}
        <span className="max-w-32 truncate">{currentApp?.name ?? "选择 Agent/Team"}</span>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-2">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索 Agent 或 Team…"
          className="mb-2"
        />
        <ScrollArea className="max-h-72">
          {groups.map(
            ({ label, icon: Icon, apps }) =>
              apps.length > 0 && (
                <div key={label} className="mb-2">
                  <p className="flex items-center gap-2 px-2 py-1 font-medium text-muted-foreground text-xs">
                    <Icon className="size-3.5" />
                    {label}
                  </p>
                  {apps.map((app) => (
                    <button
                      key={`${app.type}:${app.id}`}
                      type="button"
                      onClick={() => select(app)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-accent",
                        currentApp?.id === app.id && currentApp.type === app.type && "bg-accent",
                      )}
                    >
                      <span className="min-w-0 flex-1 truncate">{app.name}</span>
                      {currentApp?.id === app.id && currentApp.type === app.type && (
                        <CheckIcon className="size-4" />
                      )}
                    </button>
                  ))}
                </div>
              ),
          )}
          {groups.every((group) => group.apps.length === 0) && (
            <p className="p-4 text-center text-muted-foreground text-sm">没有可用结果</p>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
