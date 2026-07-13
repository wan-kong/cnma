"use client";

import { Code, Lightbulb, MessageSquare, Sparkles } from "lucide-react";
import { GradientText } from "@/components/ui/gradient-text";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { cn } from "@/lib/utils";
import type { OnSend } from "./hooks";

interface ChatEmptyStateProps {
  onSend?: OnSend;
  className?: string;
}

const suggestions = [
  {
    icon: Sparkles,
    title: "Get creative",
    prompt: "Help me brainstorm ideas for a new project",
  },
  {
    icon: Code,
    title: "Write code",
    prompt: "Write a function that validates email addresses",
  },
  {
    icon: Lightbulb,
    title: "Learn something",
    prompt: "Explain how machine learning works in simple terms",
  },
  {
    icon: MessageSquare,
    title: "Have a chat",
    prompt: "Tell me something interesting about space exploration",
  },
];

export function ChatEmptyState({ onSend, className }: ChatEmptyStateProps) {
  return (
    <div className={cn("flex h-full flex-col items-center justify-center px-4", className)}>
      <div className="mb-8 text-center">
        <GradientText
          className="px-4 font-bold text-4xl"
          colors={["#6366f1", "#8b5cf6", "#a855f7", "#d946ef"]}
          animationSpeed={6}
        >
          How can I help you today?
        </GradientText>
        <p className="mt-3 text-muted-foreground">
          Start a conversation or try one of these suggestions
        </p>
      </div>

      <div className="grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
        {suggestions.map((suggestion) => (
          <SpotlightCard
            key={suggestion.title}
            className="cursor-pointer p-4 transition-transform hover:scale-[1.02]"
            spotlightColor="rgba(139, 92, 246, 0.15)"
          >
            <button
              type="button"
              onClick={() => onSend?.(suggestion.prompt)}
              className="flex w-full items-start gap-3 text-left"
            >
              <div className="rounded-lg bg-primary/10 p-2">
                <suggestion.icon className="size-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-medium">{suggestion.title}</h3>
                <p className="mt-1 line-clamp-2 text-muted-foreground text-sm">
                  {suggestion.prompt}
                </p>
              </div>
            </button>
          </SpotlightCard>
        ))}
      </div>
    </div>
  );
}
