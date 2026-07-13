"use client";

import {
  BotIcon,
  CheckCircle2Icon,
  ChevronDownIcon,
  CircleIcon,
  CircleXIcon,
  ClockIcon,
  Loader2Icon,
  SparklesIcon,
  UsersIcon,
  XCircleIcon,
} from "lucide-react";
import { Reasoning, ReasoningContent, ReasoningTrigger } from "@/components/ai-elements/reasoning";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { Markdown } from "../markdown/markdown";
import type { MemberResponse, MessageStatus } from "./hooks";
import { ToolsRender } from "./tools-render";

interface MemberCardProps {
  member: MemberResponse;
  isNested?: boolean;
}

function getStatusIcon(status: MessageStatus) {
  switch (status) {
    case "streaming":
    case "reasoning":
      return <Loader2Icon className="size-3.5 animate-spin text-blue-500" />;
    case "success":
      return <CheckCircle2Icon className="size-3.5 text-green-500" />;
    case "error":
      return <CircleXIcon className="size-3.5 text-red-500" />;
    case "pending":
      return <CircleIcon className="size-3.5 text-yellow-500" />;
    case "cancelled":
      return <XCircleIcon className="size-3.5 text-gray-500" />;
    default:
      return <CircleIcon className="size-3.5 text-muted-foreground" />;
  }
}

function getStatusBadgeVariant(
  status: MessageStatus,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "success":
      return "default";
    case "streaming":
    case "reasoning":
      return "secondary";
    case "error":
      return "destructive";
    default:
      return "outline";
  }
}

function getStatusText(status: MessageStatus) {
  switch (status) {
    case "streaming":
      return "响应中";
    case "reasoning":
      return "思考中";
    case "success":
      return "已完成";
    case "error":
      return "错误";
    case "pending":
      return "等待中";
    case "cancelled":
      return "已取消";
    default:
      return "未知";
  }
}

function MemberIcon({ type }: { type: "agent" | "team" }) {
  if (type === "team") {
    return <UsersIcon className="size-4 text-muted-foreground" />;
  }
  return <BotIcon className="size-4 text-muted-foreground" />;
}

/** Get a short preview of the content (first 80 chars) */
function getContentPreview(content: string | undefined): string | null {
  if (!content) return null;
  const cleaned = content.replace(/\s+/g, " ").trim();
  if (cleaned.length <= 80) return cleaned;
  return `${cleaned.slice(0, 80)}...`;
}

function MemberCard({ member, isNested = false }: MemberCardProps) {
  const isStreaming = member.status === "streaming" || member.status === "reasoning";
  const isCompleted = member.status === "success";
  const contentPreview = getContentPreview(member.content);

  return (
    <Collapsible defaultOpen={isStreaming || !isNested}>
      <div
        className={cn(
          "overflow-hidden rounded-lg border transition-colors",
          isNested ? "bg-muted/30" : "bg-card",
          isStreaming && "border-blue-200 bg-blue-50/30 dark:bg-blue-950/20",
          member.status === "error" && "border-red-200 bg-red-50/30 dark:bg-red-950/20",
        )}
      >
        <CollapsibleTrigger className="flex w-full items-center gap-2.5 p-3 text-left transition-colors hover:bg-muted/50">
          {/* Status icon */}
          <div className="shrink-0">{getStatusIcon(member.status)}</div>

          {/* Member type icon */}
          <MemberIcon type={member.member_type} />

          {/* Member name */}
          <span className="font-medium text-sm">{member.member_name}</span>

          {/* Role badge */}
          {member.role && (
            <Badge variant="outline" className="text-xs">
              {member.role}
            </Badge>
          )}

          {/* Status badge */}
          <Badge variant={getStatusBadgeVariant(member.status)} className="ml-auto text-xs">
            {getStatusText(member.status)}
          </Badge>

          {/* Chevron */}
          <ChevronDownIcon className="size-4 shrink-0 in-data-[state=open]:rotate-180 text-muted-foreground transition-transform" />
        </CollapsibleTrigger>

        {/* Content preview when collapsed (only if completed with content) */}
        {isCompleted && contentPreview && (
          <div className="in-data-[state=open]:hidden border-t px-3 py-2 text-muted-foreground text-xs">
            <span className="line-clamp-1">{contentPreview}</span>
          </div>
        )}

        <CollapsibleContent>
          <div className="space-y-3 border-t px-3 pt-3 pb-3">
            {/* Reasoning */}
            {member.reasoning_content && (
              <Reasoning isStreaming={member.status === "reasoning"}>
                <ReasoningTrigger />
                <ReasoningContent>{member.reasoning_content}</ReasoningContent>
              </Reasoning>
            )}

            {/* Tool calls */}
            {member.tool_calls && member.tool_calls.length > 0 && (
              <ToolsRender tools={member.tool_calls} />
            )}

            {/* Content */}
            {member.content && (
              <div>
                <Markdown content={member.content} isAnimating={member.status === "streaming"} />
              </div>
            )}

            {/* Nested member responses (for sub-teams) */}
            {member.member_responses && member.member_responses.length > 0 && (
              <div className="space-y-2 border-muted border-l-2 pl-3">
                <p className="flex items-center gap-1.5 text-muted-foreground text-xs">
                  <UsersIcon className="size-3" />
                  子团队成员 ({member.member_responses.length})
                </p>
                {member.member_responses.map((nestedMember) => (
                  <MemberCard key={nestedMember.member_id} member={nestedMember} isNested />
                ))}
              </div>
            )}

            {/* Metrics */}
            {member.metrics && isCompleted && (
              <div className="flex flex-wrap items-center gap-3 border-t pt-2 text-muted-foreground text-xs">
                {member.metrics.total_tokens > 0 && (
                  <span className="flex items-center gap-1">
                    <SparklesIcon className="size-3" />
                    {member.metrics.total_tokens.toLocaleString()} tokens
                  </span>
                )}
                {member.metrics.duration > 0 && (
                  <span className="flex items-center gap-1">
                    <ClockIcon className="size-3" />
                    {(member.metrics.duration / 1000).toFixed(2)}s
                  </span>
                )}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

interface MemberResponsesProps {
  members: MemberResponse[];
}

export function MemberResponses({ members }: MemberResponsesProps) {
  if (!members || members.length === 0) {
    return null;
  }

  // Calculate progress
  const completedMembers = members.filter(
    (m) => m.status === "success" || m.status === "error",
  ).length;
  const activeMembers = members.filter(
    (m) => m.status === "streaming" || m.status === "reasoning",
  ).length;
  const totalMembers = members.length;
  const progressPercent = (completedMembers / totalMembers) * 100;

  return (
    <div className="mb-3 space-y-2">
      {/* Header with progress */}
      <div className="flex items-center gap-2">
        <UsersIcon className="size-4 text-muted-foreground" />
        <span className="text-muted-foreground text-xs">
          团队成员 ({completedMembers}/{totalMembers})
        </span>
        {activeMembers > 0 && (
          <span className="flex items-center gap-1 text-blue-500 text-xs">
            <Loader2Icon className="size-3 animate-spin" />
            {activeMembers} 个执行中
          </span>
        )}
        {/* Progress bar */}
        <div className="ml-auto h-1.5 w-24 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-green-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Member cards */}
      <div className="space-y-2">
        {members.map((member) => (
          <MemberCard key={member.member_id} member={member} />
        ))}
      </div>
    </div>
  );
}
