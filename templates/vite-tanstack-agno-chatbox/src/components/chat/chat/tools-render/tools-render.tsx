import { WrenchIcon } from "lucide-react";
import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
} from "@/components/ai-elements/chain-of-thought";
import { ToolInput } from "@/components/ai-elements/tool";
import type { ToolExecution, ToolResultExecution, ToolRunExecution } from "../utils";

export const ToolRender = ({ tool }: { tool: ToolRunExecution }) => {
  return (
    <ChainOfThought>
      <ChainOfThoughtHeader icon={WrenchIcon}>调用工具：{tool.tool_name}</ChainOfThoughtHeader>
      <ChainOfThoughtContent className="ml-1 border-l-2">
        <ToolInput input={tool.tool_args ?? {}} />
      </ChainOfThoughtContent>
    </ChainOfThought>
  );
};

/** Check if tool arguments are empty or have no meaningful content */
const isEmptyArgs = (args: Record<string, unknown> | null | undefined): boolean => {
  if (!args) return true;
  return Object.keys(args).length === 0;
};

export const ToolResultRender = ({ tool }: { tool: ToolResultExecution }) => {
  const parsedArgs = JSON.parse(tool.function.arguments || "{}");
  const hasContent = !isEmptyArgs(parsedArgs);
  const toolName = tool.function.name;

  return (
    <ChainOfThought>
      <ChainOfThoughtHeader icon={WrenchIcon} withArrow={hasContent}>
        {toolName}
      </ChainOfThoughtHeader>
      {hasContent && (
        <ChainOfThoughtContent className="ml-1 border-l-2">
          <ToolInput input={parsedArgs} />
        </ChainOfThoughtContent>
      )}
    </ChainOfThought>
  );
};

export const ToolsRender = ({ tools }: { tools: ToolExecution[] }) => {
  return (
    <>
      {tools.map((tool) =>
        tool?.type === "function" ? (
          // @ts-expect-error -- tool is ToolResultExecution ---
          <ToolResultRender key={tool.id} tool={tool} />
        ) : (
          // @ts-expect-error -- tool is ToolExecution ---
          <ToolRender key={tool.tool_call_id} tool={tool} />
        ),
      )}
    </>
  );
};
