import { Tool, ToolContent, ToolHeader, ToolInput } from "@/components/ai-elements/tool";
import type { ToolRunExecution } from "../utils";

export const BasicRunTool = ({ tool }: { tool: ToolRunExecution }) => {
  const hasContent = tool.tool_args != null && Object.keys(tool.tool_args).length > 0;

  return (
    <Tool>
      <ToolHeader
        title={tool.tool_name}
        state="output-available"
        type={`tool-${tool.tool_name}`}
        collapsible={hasContent}
      />
      {hasContent && (
        <ToolContent>
          <ToolInput input={tool.tool_args} />
        </ToolContent>
      )}
    </Tool>
  );
};
