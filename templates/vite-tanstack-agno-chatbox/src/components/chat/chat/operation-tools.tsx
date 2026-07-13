"use client";

import { Check, Clock, Copy, Sparkles, Zap } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn, parseTime } from "@/lib/utils";
import type { ChatListItem } from "./hooks";

interface OperationToolsProps {
  item: ChatListItem;
  onRegenerate?: () => void;
  className?: string;
}

function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms.toFixed(2)}ms`;
  }
  const seconds = ms / 1000;
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
}

function formatTokens(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
}

export const OperationTools = ({ item, className }: OperationToolsProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!item.content) return;

    try {
      await navigator.clipboard.writeText(item.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  }, [item.content]);

  const isAssistant = item.role === "assistant";
  const isCompleted = item.role === "user" || item.status === "success" || item.status === "error";
  const hasMetrics = isAssistant && item.metrics;

  return (
    <div className={cn("flex items-center gap-1 text-muted-foreground text-xs", className)}>
      {/* Timestamp */}
      <Tooltip>
        <TooltipTrigger
          render={<span className="flex cursor-default items-center gap-1 px-1.5 py-1" />}
        >
          <Clock className="size-3" />
          <span>{parseTime(item.created_at, "{h}:{i}:{s}")}</span>
        </TooltipTrigger>
        <TooltipContent>{parseTime(item.created_at)}</TooltipContent>
      </Tooltip>

      {/* Metrics - only for completed assistant messages */}
      {hasMetrics && item.metrics && (
        <>
          <span className="text-muted-foreground/50">|</span>

          {/* Duration */}
          {item.metrics.duration > 0 && (
            <Tooltip>
              <TooltipTrigger
                render={<span className="flex cursor-default items-center gap-1 px-1.5 py-1" />}
              >
                <Zap className="size-3" />
                <span>{formatDuration(item.metrics.duration)}</span>
              </TooltipTrigger>
              <TooltipContent>
                <div className="flex flex-col gap-1">
                  <div>耗时: {formatDuration(item.metrics.duration)}</div>
                  {item.metrics.time_to_first_token > 0 && (
                    <div>首 Token: {formatDuration(item.metrics.time_to_first_token)}</div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Tokens */}
          {item.metrics.total_tokens > 0 && (
            <Tooltip>
              <TooltipTrigger
                render={<span className="flex cursor-default items-center gap-1 px-1.5 py-1" />}
              >
                <Sparkles className="size-3" />
                <span>{formatTokens(item.metrics.total_tokens)} tokens</span>
              </TooltipTrigger>
              <TooltipContent>
                <div className="flex flex-col gap-1">
                  <div>输入: {formatTokens(item.metrics.input_tokens)}</div>
                  <div>输出: {formatTokens(item.metrics.output_tokens)}</div>
                  {item.metrics.reasoning_tokens > 0 && (
                    <div>推理: {formatTokens(item.metrics.reasoning_tokens)}</div>
                  )}
                  {item.metrics.cache_read_tokens > 0 && (
                    <div>缓存: {formatTokens(item.metrics.cache_read_tokens)}</div>
                  )}
                  <div className="border-muted-foreground/30 border-t pt-1">
                    总计: {formatTokens(item.metrics.total_tokens)}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          )}
        </>
      )}

      {/* Model info */}
      {isAssistant && item.model && (
        <>
          <span className="text-muted-foreground/50">|</span>
          <Tooltip>
            <TooltipTrigger
              render={<span className="max-w-30 cursor-default truncate px-1.5 py-1" />}
            >
              {item.model}
            </TooltipTrigger>
            <TooltipContent>
              <div className="flex flex-col gap-1">
                <div>模型: {item.model}</div>
                {item.model_provider && <div>提供商: {item.model_provider}</div>}
              </div>
            </TooltipContent>
          </Tooltip>
        </>
      )}

      {/* Action buttons - only show when completed */}
      {isCompleted && (
        <>
          <span className="text-muted-foreground/50">|</span>

          {/* Copy button */}
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="size-7"
                  onClick={handleCopy}
                  disabled={!item.content}
                />
              }
            >
              {copied ? (
                <Check className="size-3.5 text-green-500" />
              ) : (
                <Copy className="size-3.5" />
              )}
            </TooltipTrigger>
            <TooltipContent>{copied ? "已复制" : "复制内容"}</TooltipContent>
          </Tooltip>

          {/* Regenerate button - only for assistant messages */}
          {/* {isAssistant && onRegenerate && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="size-7"
                  onClick={onRegenerate}
                >
                  <RefreshCw className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>重新生成</TooltipContent>
            </Tooltip>
          )} */}
        </>
      )}
    </div>
  );
};
