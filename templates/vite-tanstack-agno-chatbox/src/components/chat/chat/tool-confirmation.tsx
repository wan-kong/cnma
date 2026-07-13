import { CheckIcon, ShieldAlertIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { CodeBlock } from "@/components/ai-elements/code-block";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { OnContinueRun } from "./hooks";
import type { ToolRunExecution } from "./utils";

const TOOL_TO_NAME: Record<string, string> = {
  duckduckgo_search: "DuckDuckGo搜索",
  duckduckgo_news: "DuckDuckGo新闻",
  delegate_task_to_member: "分配任务给成员",
  get_weather: "查询天气",
  get_weekend_dates: "查询周末日期",
  send_email: "发送邮件",
  get_github_releases: "查询 GitHub Release",
};

interface ToolConfirmationProps {
  messageId: string;
  pendingTools: ToolRunExecution[];
  onContinueRun: OnContinueRun;
}

export const ToolConfirmation = ({
  messageId,
  pendingTools,
  onContinueRun,
}: ToolConfirmationProps) => {
  const [showNote, setShowNote] = useState(false);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAction = (approved: boolean) => {
    setIsSubmitting(true);
    onContinueRun(messageId, approved, note || undefined);
  };

  return (
    <div className="space-y-3 rounded-lg border border-yellow-500/30 bg-yellow-50/50 p-4 dark:bg-yellow-950/20">
      <div className="flex items-center gap-2 font-medium text-sm text-yellow-700 dark:text-yellow-400">
        <ShieldAlertIcon className="size-4" />
        <span>以下工具需要你的确认才能执行</span>
      </div>

      {/* Render each pending tool */}
      <div className="space-y-2">
        {pendingTools.map((tool) => (
          <div key={tool.tool_call_id} className="rounded-md border bg-background p-3">
            <div className="mb-2 font-medium text-sm">
              {TOOL_TO_NAME[tool.tool_name] ?? tool.tool_name}
            </div>
            {tool.tool_args && Object.keys(tool.tool_args).length > 0 && (
              <div className="rounded-md bg-muted/50">
                <CodeBlock code={JSON.stringify(tool.tool_args, null, 2)} language="json" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Optional note */}
      {showNote && (
        <Textarea
          placeholder="添加备注（可选）..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          className="text-sm"
        />
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={() => handleAction(true)}
          disabled={isSubmitting}
          className={cn(
            "gap-1.5",
            "bg-green-600 text-white hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600",
          )}
        >
          <CheckIcon className="size-3.5" />
          批准执行
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleAction(false)}
          disabled={isSubmitting}
          className="gap-1.5 border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950/30"
        >
          <XIcon className="size-3.5" />
          拒绝
        </Button>
        {!showNote && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowNote(true)}
            disabled={isSubmitting}
            className="text-muted-foreground text-xs"
          >
            添加备注
          </Button>
        )}
      </div>
    </div>
  );
};
