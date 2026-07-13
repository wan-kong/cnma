"use client";

import { cjk } from "@streamdown/cjk";
import { code } from "@streamdown/code";
import { math } from "@streamdown/math";
import { mermaid } from "@streamdown/mermaid";
import type { ComponentProps } from "react";
import { Streamdown } from "streamdown";
import { cn } from "@/lib/utils";
import { LinkSafetyModal } from "./link-modal";
import "katex/dist/katex.min.css";

function MarkdownStreamdown({
  className,
  content,
  ...props
}: ComponentProps<typeof Streamdown> & { content: string }) {
  return (
    <Streamdown
      className={cn(
        "wrap-break-word size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        className,
      )}
      linkSafety={{
        enabled: true,
        renderModal: (props) => <LinkSafetyModal {...props} />,
      }}
      caret="circle"
      plugins={{
        code,
        mermaid,
        cjk,
        math,
      }}
      {...props}
    >
      {content}
    </Streamdown>
  );
}

export const Markdown = ({
  className,
  content,
  ...props
}: ComponentProps<typeof Streamdown> & { content: string }) => {
  return (
    <div className="typeset typeset-docs max-w-[37em]">
      <MarkdownStreamdown className={className} content={content} {...props} />
    </div>
  );
};
