import { ArrowUpIcon, SquareIcon } from "lucide-react";
import {
  createContext,
  type ComponentProps,
  type FormEvent,
  type HTMLAttributes,
  type ReactNode,
  useContext,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export interface PromptInputMessage {
  text: string;
}

interface PromptContextValue {
  text: string;
  setText: (value: string) => void;
}

const PromptContext = createContext<PromptContextValue | null>(null);

function usePromptContext() {
  const context = useContext(PromptContext);
  if (!context) throw new Error("Prompt input components must be used inside PromptInput");
  return context;
}

export function PromptInputProvider({ children }: { children: ReactNode }) {
  return children;
}

export function PromptInput({
  children,
  className,
  onSubmit,
}: Omit<HTMLAttributes<HTMLFormElement>, "onSubmit"> & {
  onSubmit?: (
    message: PromptInputMessage,
    event: FormEvent<HTMLFormElement>,
  ) => void | Promise<void>;
}) {
  const [text, setText] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = text.trim();
    if (!message) return;
    await onSubmit?.({ text: message }, event);
    setText("");
  }

  return (
    <PromptContext.Provider value={{ text, setText }}>
      <form
        className={cn("overflow-hidden rounded-xl border bg-background shadow-sm", className)}
        onSubmit={submit}
      >
        {children}
      </form>
    </PromptContext.Provider>
  );
}

export function PromptInputBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-3 pt-3", className)} {...props} />;
}

export function PromptInputTextarea() {
  const { text, setText } = usePromptContext();
  return (
    <Textarea
      value={text}
      onChange={(event) => setText(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          event.currentTarget.form?.requestSubmit();
        }
      }}
      placeholder="输入消息…"
      className="min-h-20 resize-none border-0 p-0 shadow-none focus-visible:ring-0"
    />
  );
}

export function PromptInputFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-center justify-between gap-2 p-2", className)} {...props} />
  );
}

export function PromptInputTools({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center gap-1", className)} {...props} />;
}

export function PromptInputButton({
  className,
  variant = "ghost",
  size = "sm",
  ...props
}: ComponentProps<typeof Button>) {
  return <Button type="button" variant={variant} size={size} className={className} {...props} />;
}

export function PromptInputSubmit({ status = "ready" }: { status?: "ready" | "streaming" }) {
  const { text } = usePromptContext();
  return (
    <Button type="submit" size="icon" disabled={status === "streaming" || !text.trim()}>
      {status === "streaming" ? (
        <SquareIcon className="size-4" />
      ) : (
        <ArrowUpIcon className="size-4" />
      )}
      <span className="sr-only">发送</span>
    </Button>
  );
}
