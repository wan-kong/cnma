export type ContentType = "str";

export interface Metrics {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  cache_read_tokens: number;
  reasoning_tokens: number;
  time_to_first_token: number;
  duration: number;
}

export interface ModelProviderData {
  id: string;
  [key: string]: unknown;
}

export interface Image {
  [key: string]: unknown;
}

export interface Video {
  [key: string]: unknown;
}

export interface Audio {
  [key: string]: unknown;
}

export interface File {
  [key: string]: unknown;
}

export interface Message {
  [key: string]: unknown;
}

export interface ReasoningStep {
  [key: string]: unknown;
}

export interface MessageReferences {
  [key: string]: unknown;
}

export interface Citations {
  [key: string]: unknown;
}

export interface SessionSummary {
  [key: string]: unknown;
}

export interface RunInput {
  [key: string]: unknown;
}

export interface ToolRunExecution {
  tool_call_id: string;
  type: string;
  tool_name: string;
  tool_args: Record<string, unknown>;
  tool_call_error: boolean | null;
  result: unknown;
  metrics: Metrics | null;
  child_run_id: string | null;
  stop_after_tool_call: boolean;
  created_at: number;
  requires_confirmation: boolean | null;
  confirmed: boolean | null;
  confirmation_note: string | null;
  requires_user_input: boolean | null;
  user_input_schema: Record<string, unknown> | null;
  answered: boolean | null;
  external_execution_required: boolean | null;
}

export interface ToolResultExecution {
  type: "function";
  id: string;
  function: {
    name: string;
    // string with json
    arguments: string;
  };
}

export type ToolExecution = ToolRunExecution | ToolResultExecution;

/**
 * Base event attributes inherited by all events
 */
export interface BaseEvent {
  created_at: number;
  event: string;
  agent_id: string;
  agent_name: string;
  run_id?: string | null;
  session_id?: string | null;
  workflow_id?: string | null;
  workflow_run_id?: string | null;
  step_id?: string | null;
  step_name?: string | null;
  step_index?: number | null;
  tools?: ToolExecution[] | null;
  content?: unknown;
}

/**
 * Event emitted when an agent run starts
 * Reference: https://docs.agno.com/reference/agents/run-response#runstartedevent
 */
export interface RunStartedEvent extends BaseEvent {
  event: "RunStarted";
  model: string;
  model_provider: string;
}

/**
 * Event emitted for each content chunk during streaming
 * Reference: https://docs.agno.com/reference/agents/run-response#runcontentevent
 */
export interface RunContentEvent extends BaseEvent {
  event: "RunContent";
  content?: unknown;
  content_type: ContentType;
  reasoning_content?: string | null;
  citations?: Citations | null;
  model_provider_data?: ModelProviderData | null;
  response_audio?: Audio | null;
  image?: Image | null;
  references?: MessageReferences[] | null;
  additional_input?: Message[] | null;
  reasoning_steps?: ReasoningStep[] | null;
  reasoning_messages?: Message[] | null;
}

/**
 * Event emitted when content streaming completes
 * Reference: https://docs.agno.com/reference/agents/run-response#runcontentcompletedevent
 */
export interface RunContentCompletedEvent extends BaseEvent {
  event: "RunContentCompleted";
}

/**
 * Event emitted when a tool call starts
 * Reference: https://docs.agno.com/reference/agents/run-response#toolcallstartedevent
 */
export interface ToolCallStartedEvent extends BaseEvent {
  event: "ToolCallStarted";
  tool?: ToolExecution | null;
}

export interface ToolCallErrorEvent extends BaseEvent {
  event: "ToolCallError";
  tool?: ToolExecution | null;
}

/**
 * Event emitted when a tool call completes
 * Reference: https://docs.agno.com/reference/agents/run-response#toolcallcompletedevent
 */
export interface ToolCallCompletedEvent extends BaseEvent {
  event: "ToolCallCompleted";
  tool?: ToolExecution | null;
  content?: unknown;
  images?: Image[] | null;
  videos?: Video[] | null;
  audio?: Audio[] | null;
}

/**
 * Event emitted when the entire run completes successfully
 * Reference: https://docs.agno.com/reference/agents/run-response#runcompletedevent
 */
export interface RunCompletedEvent extends BaseEvent {
  event: "RunCompleted";
  content?: unknown;
  content_type: ContentType;
  reasoning_content?: string | null;
  citations?: Citations | null;
  model_provider_data?: ModelProviderData | null;
  images?: Image[] | null;
  videos?: Video[] | null;
  audio?: Audio[] | null;
  response_audio?: Audio | null;
  references?: MessageReferences[] | null;
  additional_input?: Message[] | null;
  reasoning_steps?: ReasoningStep[] | null;
  reasoning_messages?: Message[] | null;
  metadata?: Record<string, unknown> | null;
  metrics?: Metrics | null;
}

/**
 * Event emitted for intermediate content chunks (when output_model is set)
 * Reference: https://docs.agno.com/reference/agents/run-response#intermediateruncontentevent
 */
export interface IntermediateRunContentEvent extends BaseEvent {
  event: "RunIntermediateContent";
  content?: unknown;
  content_type: ContentType;
}

/**
 * Event emitted when a run is paused for user interaction
 * Reference: https://docs.agno.com/reference/agents/run-response#runpausedevent
 */
export interface RunPausedEvent extends BaseEvent {
  event: "RunPaused";
  tools?: ToolExecution[] | null;
}

/**
 * Event emitted when a paused run is resumed
 * Reference: https://docs.agno.com/reference/agents/run-response#runcontinuedevent
 */
export interface RunContinuedEvent extends BaseEvent {
  event: "RunContinued";
}

/**
 * Event emitted when an error occurs during run execution
 * Reference: https://docs.agno.com/reference/agents/run-response#runerrorevent
 */
export interface RunErrorEvent extends BaseEvent {
  event: "RunError";
  content?: string | null;
}

/**
 * Event emitted when a run is cancelled
 * Reference: https://docs.agno.com/reference/agents/run-response#runcancelledevent
 */
export interface RunCancelledEvent extends BaseEvent {
  event: "RunCancelled";
  reason?: string | null;
}

/**
 * Event emitted when a pre-hook starts execution
 * Reference: https://docs.agno.com/reference/agents/run-response#prehookstartedevent
 */
export interface PreHookStartedEvent extends BaseEvent {
  event: "PreHookStarted";
  pre_hook_name?: string | null;
  run_input?: RunInput | null;
}

/**
 * Event emitted when a pre-hook completes execution
 * Reference: https://docs.agno.com/reference/agents/run-response#prehookcompletedevent
 */
export interface PreHookCompletedEvent extends BaseEvent {
  event: "PreHookCompleted";
  pre_hook_name?: string | null;
  run_input?: RunInput | null;
}

/**
 * Event emitted when a post-hook starts execution
 * Reference: https://docs.agno.com/reference/agents/run-response#posthookstartedevent
 */
export interface PostHookStartedEvent extends BaseEvent {
  event: "PostHookStarted";
  post_hook_name?: string | null;
}

/**
 * Event emitted when a post-hook completes execution
 * Reference: https://docs.agno.com/reference/agents/run-response#posthookcompletedevent
 */
export interface PostHookCompletedEvent extends BaseEvent {
  event: "PostHookCompleted";
  post_hook_name?: string | null;
}

/**
 * Event emitted when reasoning process starts
 * Reference: https://docs.agno.com/reference/agents/run-response#reasoningstartedevent
 */
export interface ReasoningStartedEvent extends BaseEvent {
  event: "ReasoningStarted";
}

/**
 * Event emitted for each reasoning step
 * Reference: https://docs.agno.com/reference/agents/run-response#reasoningstepevent
 */
export interface ReasoningStepEvent extends BaseEvent {
  event: "ReasoningStep";
  content?: unknown;
  content_type: ContentType;
  reasoning_content: string;
}

/**
 * Event emitted when reasoning process completes
 * Reference: https://docs.agno.com/reference/agents/run-response#reasoningcompletedevent
 */
export interface ReasoningCompletedEvent extends BaseEvent {
  event: "ReasoningCompleted";
  content?: unknown;
  content_type: ContentType;
}

/**
 * Event emitted when memory update starts
 * Reference: https://docs.agno.com/reference/agents/run-response#memoryupdatestartedevent
 */
export interface MemoryUpdateStartedEvent extends BaseEvent {
  event: "MemoryUpdateStarted";
}

/**
 * Event emitted when memory update completes
 * Reference: https://docs.agno.com/reference/agents/run-response#memoryupdatecompletedevent
 */
export interface MemoryUpdateCompletedEvent extends BaseEvent {
  event: "MemoryUpdateCompleted";
}

/**
 * Event emitted when session summary generation starts
 * Reference: https://docs.agno.com/reference/agents/run-response#sessionsummarystartedevent
 */
export interface SessionSummaryStartedEvent extends BaseEvent {
  event: "SessionSummaryStarted";
}

/**
 * Event emitted when session summary generation completes
 * Reference: https://docs.agno.com/reference/agents/run-response#sessionsummarycompletedevent
 */
export interface SessionSummaryCompletedEvent extends BaseEvent {
  event: "SessionSummaryCompleted";
  session_summary?: SessionSummary | null;
}

/**
 * Event emitted when parser model response processing starts
 * Reference: https://docs.agno.com/reference/agents/run-response#parsermodelresponsestartedevent
 */
export interface ParserModelResponseStartedEvent extends BaseEvent {
  event: "ParserModelResponseStarted";
}

/**
 * Event emitted when parser model response processing completes
 * Reference: https://docs.agno.com/reference/agents/run-response#parsermodelresponsecompletedevent
 */
export interface ParserModelResponseCompletedEvent extends BaseEvent {
  event: "ParserModelResponseCompleted";
}

/**
 * Event emitted when output model response processing starts
 * Reference: https://docs.agno.com/reference/agents/run-response#outputmodelresponsestartedevent
 */
export interface OutputModelResponseStartedEvent extends BaseEvent {
  event: "OutputModelResponseStarted";
}

/**
 * Event emitted when output model response processing completes
 * Reference: https://docs.agno.com/reference/agents/run-response#outputmodelresponsecompletedevent
 */
export interface OutputModelResponseCompletedEvent extends BaseEvent {
  event: "OutputModelResponseCompleted";
}

/**
 * Event for custom user-defined events
 * Reference: https://docs.agno.com/reference/agents/run-response#customevent
 */
export interface CustomEvent extends BaseEvent {
  event: "CustomEvent";
}

/**
 * Union type for all possible Agno agent run events
 */
export type AgentRunEvent =
  | RunStartedEvent
  | RunContentEvent
  | IntermediateRunContentEvent
  | RunContentCompletedEvent
  | ToolCallStartedEvent
  | ToolCallErrorEvent
  | ToolCallCompletedEvent
  | RunCompletedEvent
  | RunPausedEvent
  | RunContinuedEvent
  | RunErrorEvent
  | RunCancelledEvent
  | PreHookStartedEvent
  | PreHookCompletedEvent
  | PostHookStartedEvent
  | PostHookCompletedEvent
  | ReasoningStartedEvent
  | ReasoningStepEvent
  | ReasoningCompletedEvent
  | MemoryUpdateStartedEvent
  | MemoryUpdateCompletedEvent
  | SessionSummaryStartedEvent
  | SessionSummaryCompletedEvent
  | ParserModelResponseStartedEvent
  | ParserModelResponseCompletedEvent
  | OutputModelResponseStartedEvent
  | OutputModelResponseCompletedEvent
  | CustomEvent;

// ============================================================================
// Team Run Events
// Reference: https://docs.agno.com/reference/teams/team-response
// ============================================================================

/**
 * Base event attributes for team events
 */
export interface BaseTeamEvent {
  created_at: number;
  event: string;
  team_id: string;
  team_name: string;
  run_id?: string | null;
  session_id?: string | null;
  content?: unknown;
}

/**
 * Event emitted when a team run starts
 */
export interface TeamRunStartedEvent extends BaseTeamEvent {
  event: "TeamRunStarted";
  model: string;
  model_provider: string;
}

/**
 * Event emitted for each content chunk during team streaming
 */
export interface TeamRunContentEvent extends BaseTeamEvent {
  event: "TeamRunContent";
  content?: unknown;
  content_type: ContentType;
  reasoning_content?: string | null;
}

/**
 * Event emitted when team content streaming completes
 */
export interface TeamRunContentCompletedEvent extends BaseTeamEvent {
  event: "TeamRunContentCompleted";
}

/**
 * Event emitted when the team run completes
 */
export interface TeamRunCompletedEvent extends BaseTeamEvent {
  event: "TeamRunCompleted";
  content?: unknown;
  content_type: ContentType;
  reasoning_content?: string | null;
  metrics?: Metrics | null;
  citations?: Citations | null;
  references?: MessageReferences[] | null;
  // Member responses - can be nested for sub-teams
  member_responses?: MemberRunOutput[] | null;
}

/**
 * Event emitted when a team run errors
 */
export interface TeamRunErrorEvent extends BaseTeamEvent {
  event: "TeamRunError";
  content?: string | null;
}

/**
 * Event emitted when a team run is cancelled
 */
export interface TeamRunCancelledEvent extends BaseTeamEvent {
  event: "TeamRunCancelled";
  reason?: string | null;
}

/**
 * Event emitted when a member run starts
 */
export interface MemberRunStartedEvent extends BaseTeamEvent {
  event: "MemberRunStarted";
  member_id: string;
  member_name: string;
  member_type: "agent" | "team";
  role?: string | null;
  model?: string | null;
  model_provider?: string | null;
}

/**
 * Event emitted for each content chunk during member streaming
 */
export interface MemberRunContentEvent extends BaseTeamEvent {
  event: "MemberRunContent";
  member_id: string;
  member_name: string;
  content?: unknown;
  content_type: ContentType;
  reasoning_content?: string | null;
}

/**
 * Event emitted when a member run completes
 */
export interface MemberRunCompletedEvent extends BaseTeamEvent {
  event: "MemberRunCompleted";
  member_id: string;
  member_name: string;
  member_type: "agent" | "team";
  role?: string | null;
  content?: unknown;
  content_type: ContentType;
  reasoning_content?: string | null;
  metrics?: Metrics | null;
  tool_calls?: ToolExecution[] | null;
  // Nested member responses for sub-teams
  member_responses?: MemberRunOutput[] | null;
}

/**
 * Member run output structure (used in TeamRunCompletedEvent.member_responses)
 */
export interface MemberRunOutput {
  member_id: string;
  member_name: string;
  member_type: "agent" | "team";
  role?: string | null;
  content: string;
  content_type: ContentType;
  reasoning_content?: string | null;
  metrics?: Metrics | null;
  tool_calls?: ToolExecution[] | null;
  created_at: number;
  // Nested responses for sub-teams
  member_responses?: MemberRunOutput[] | null;
}

/**
 * Team tool call started event
 */
export interface TeamToolCallStartedEvent extends BaseTeamEvent {
  event: "TeamToolCallStarted";
  tool?: ToolExecution | null;
  member_id?: string | null;
  member_name?: string | null;
}

/**
 * Team tool call completed event
 */
export interface TeamToolCallCompletedEvent extends BaseTeamEvent {
  event: "TeamToolCallCompleted";
  tool?: ToolExecution | null;
  member_id?: string | null;
  member_name?: string | null;
  content?: unknown;
  images?: Image[] | null;
  videos?: Video[] | null;
  audio?: Audio[] | null;
}

/**
 * Union type for all team run events
 */
export type TeamRunEvent =
  | TeamRunStartedEvent
  | TeamRunContentEvent
  | TeamRunContentCompletedEvent
  | TeamRunCompletedEvent
  | TeamRunErrorEvent
  | TeamRunCancelledEvent
  | MemberRunStartedEvent
  | MemberRunContentEvent
  | MemberRunCompletedEvent
  | TeamToolCallStartedEvent
  | TeamToolCallCompletedEvent;

// ============================================================================
// Workflow Run Events
// Reference: https://docs.agno.com/reference/workflows/run-output
// ============================================================================

/**
 * Base event attributes for workflow events
 */
export interface BaseWorkflowEvent {
  created_at: number;
  event: string;
  workflow_id: string;
  workflow_name: string;
  run_id?: string | null;
  session_id?: string | null;
  step_id?: string | null;
  parent_step_id?: string | null;
}

/**
 * Event emitted when a workflow starts
 */
export interface WorkflowStartedEvent extends BaseWorkflowEvent {
  event: "WorkflowStarted";
}

/**
 * Event emitted when a workflow completes
 */
export interface WorkflowCompletedEvent extends BaseWorkflowEvent {
  event: "WorkflowCompleted";
  content?: unknown;
  content_type?: ContentType | null;
  step_results?: StepOutput[] | null;
  metrics?: Metrics | null;
}

/**
 * Event emitted when a workflow is cancelled
 */
export interface WorkflowCancelledEvent extends BaseWorkflowEvent {
  event: "WorkflowCancelled";
  reason?: string | null;
}

/**
 * Event emitted when a workflow errors
 */
export interface WorkflowErrorEvent extends BaseWorkflowEvent {
  event: "WorkflowError";
  content?: string | null;
}

/**
 * Event emitted when a workflow step starts
 */
export interface StepStartedEvent extends BaseWorkflowEvent {
  event: "StepStarted";
  step_id: string;
  step_name: string;
  step_index: number;
}

/**
 * Event emitted when a workflow step completes
 */
export interface StepCompletedEvent extends BaseWorkflowEvent {
  event: "StepCompleted";
  session_id?: string;
  run_id?: string;
  step_id?: string;
  step_name?: string;
  step_index?: number;
  content?: string;
  content_type?: ContentType;
  step_response?: {
    content: string;
    executor_type?: "agent" | "team" | null;
    executor_name?: string | null;
    step_run_id: string;
    metrics?: Metrics | null;
  };
}

/**
 * Event emitted when a step errors
 */
export interface StepErrorEvent extends BaseWorkflowEvent {
  event: "StepError";
  step_id: string;
  step_name: string;
  step_index: number;
  content?: string | null;
}

/**
 * Step content event during streaming
 */
export interface StepContentEvent extends BaseWorkflowEvent {
  event: "StepContent";
  step_id: string;
  step_name: string;
  step_index: number;
  content?: unknown;
  content_type: ContentType;
  reasoning_content?: string | null;
}

/**
 * Step output structure (used in WorkflowCompletedEvent.step_results)
 */
export interface StepOutput {
  step_id: string;
  step_name: string;
  step_index: number;
  executor_type?: "agent" | "team" | null;
  executor_id?: string | null;
  executor_name?: string | null;
  content?: unknown;
  metrics?: Metrics | null;
  success?: boolean | null;
  error?: boolean | null;
  // Nested steps for parallel/loop execution
  nested_steps?: StepOutput[] | null;
}

/**
 * Parallel execution started event
 */
export interface ParallelExecutionStartedEvent extends BaseWorkflowEvent {
  event: "ParallelExecutionStarted";
  step_ids: string[];
}

/**
 * Parallel execution completed event
 */
export interface ParallelExecutionCompletedEvent extends BaseWorkflowEvent {
  event: "ParallelExecutionCompleted";
  step_results: StepOutput[];
}

/**
 * Loop execution started event
 */
export interface LoopExecutionStartedEvent extends BaseWorkflowEvent {
  event: "LoopExecutionStarted";
  loop_id: string;
  total_iterations?: number | null;
}

/**
 * Loop iteration started event
 */
export interface LoopIterationStartedEvent extends BaseWorkflowEvent {
  event: "LoopIterationStarted";
  loop_id: string;
  iteration_index: number;
}

/**
 * Loop iteration completed event
 */
export interface LoopIterationCompletedEvent extends BaseWorkflowEvent {
  event: "LoopIterationCompleted";
  loop_id: string;
  iteration_index: number;
  content?: unknown;
}

/**
 * Loop execution completed event
 */
export interface LoopExecutionCompletedEvent extends BaseWorkflowEvent {
  event: "LoopExecutionCompleted";
  loop_id: string;
  iteration_results: StepOutput[];
}

/**
 * Union type for all workflow run events
 */
export type WorkflowRunEvent =
  | WorkflowStartedEvent
  | WorkflowCompletedEvent
  | WorkflowCancelledEvent
  | WorkflowErrorEvent
  | StepStartedEvent
  | StepCompletedEvent
  | StepErrorEvent
  | StepContentEvent
  | ParallelExecutionStartedEvent
  | ParallelExecutionCompletedEvent
  | LoopExecutionStartedEvent
  | LoopIterationStartedEvent
  | LoopIterationCompletedEvent
  | LoopExecutionCompletedEvent;

/**
 * Union type for all Agno run events (agent, team, workflow)
 */
export type AgnoRunEvent = AgentRunEvent | TeamRunEvent | WorkflowRunEvent;

/**
 * Handle streaming response from Agno agent run API
 * @param res - Response object from fetch
 * @param callbacks - Event handler callbacks for different event types
 */
export const handleStream = (
  res: Response,
  {
    // Agent events
    onRunStarted,
    onRunContent,
    onIntermediateRunContent,
    onRunContentCompleted,
    onToolCallStarted,
    onToolCallError,
    onToolCallCompleted,
    onRunCompleted,
    onRunPaused,
    onRunContinued,
    onRunError,
    onRunCancelled,
    onPreHookStarted,
    onPreHookCompleted,
    onPostHookStarted,
    onPostHookCompleted,
    onReasoningStarted,
    onReasoningStep,
    onReasoningCompleted,
    onMemoryUpdateStarted,
    onMemoryUpdateCompleted,
    onSessionSummaryStarted,
    onSessionSummaryCompleted,
    onParserModelResponseStarted,
    onParserModelResponseCompleted,
    onOutputModelResponseStarted,
    onOutputModelResponseCompleted,
    onCustomEvent,
    // Team events
    onTeamRunStarted,
    onTeamRunContent,
    onTeamRunContentCompleted,
    onTeamRunCompleted,
    onTeamRunError,
    onTeamRunCancelled,
    onMemberRunStarted,
    onMemberRunContent,
    onMemberRunCompleted,
    onTeamToolCallStarted,
    onTeamToolCallCompleted,
    // Workflow events
    onWorkflowStarted,
    onWorkflowCompleted,
    onWorkflowCancelled,
    onWorkflowError,
    onStepStarted,
    onStepCompleted,
    onStepError,
    onStepContent,
    onParallelExecutionStarted,
    onParallelExecutionCompleted,
    onLoopExecutionStarted,
    onLoopIterationStarted,
    onLoopIterationCompleted,
    onLoopExecutionCompleted,
  }: {
    // Agent event callbacks
    onRunStarted?: (event: RunStartedEvent) => void;
    onRunContent?: (event: RunContentEvent) => void;
    onIntermediateRunContent?: (event: IntermediateRunContentEvent) => void;
    onRunContentCompleted?: (event: RunContentCompletedEvent) => void;
    onToolCallStarted?: (event: ToolCallStartedEvent) => void;
    onToolCallError?: (event: ToolCallErrorEvent) => void;
    onToolCallCompleted?: (event: ToolCallCompletedEvent) => void;
    onRunCompleted?: (event: RunCompletedEvent) => void;
    onRunPaused?: (event: RunPausedEvent) => void;
    onRunContinued?: (event: RunContinuedEvent) => void;
    onRunError?: (event: RunErrorEvent) => void;
    onRunCancelled?: (event: RunCancelledEvent) => void;
    onPreHookStarted?: (event: PreHookStartedEvent) => void;
    onPreHookCompleted?: (event: PreHookCompletedEvent) => void;
    onPostHookStarted?: (event: PostHookStartedEvent) => void;
    onPostHookCompleted?: (event: PostHookCompletedEvent) => void;
    onReasoningStarted?: (event: ReasoningStartedEvent) => void;
    onReasoningStep?: (event: ReasoningStepEvent) => void;
    onReasoningCompleted?: (event: ReasoningCompletedEvent) => void;
    onMemoryUpdateStarted?: (event: MemoryUpdateStartedEvent) => void;
    onMemoryUpdateCompleted?: (event: MemoryUpdateCompletedEvent) => void;
    onSessionSummaryStarted?: (event: SessionSummaryStartedEvent) => void;
    onSessionSummaryCompleted?: (event: SessionSummaryCompletedEvent) => void;
    onParserModelResponseStarted?: (event: ParserModelResponseStartedEvent) => void;
    onParserModelResponseCompleted?: (event: ParserModelResponseCompletedEvent) => void;
    onOutputModelResponseStarted?: (event: OutputModelResponseStartedEvent) => void;
    onOutputModelResponseCompleted?: (event: OutputModelResponseCompletedEvent) => void;
    onCustomEvent?: (event: CustomEvent) => void;
    // Team event callbacks
    onTeamRunStarted?: (event: TeamRunStartedEvent) => void;
    onTeamRunContent?: (event: TeamRunContentEvent) => void;
    onTeamRunContentCompleted?: (event: TeamRunContentCompletedEvent) => void;
    onTeamRunCompleted?: (event: TeamRunCompletedEvent) => void;
    onTeamRunError?: (event: TeamRunErrorEvent) => void;
    onTeamRunCancelled?: (event: TeamRunCancelledEvent) => void;
    onMemberRunStarted?: (event: MemberRunStartedEvent) => void;
    onMemberRunContent?: (event: MemberRunContentEvent) => void;
    onMemberRunCompleted?: (event: MemberRunCompletedEvent) => void;
    onTeamToolCallStarted?: (event: TeamToolCallStartedEvent) => void;
    onTeamToolCallCompleted?: (event: TeamToolCallCompletedEvent) => void;
    // Workflow event callbacks
    onWorkflowStarted?: (event: WorkflowStartedEvent) => void;
    onWorkflowCompleted?: (event: WorkflowCompletedEvent) => void;
    onWorkflowCancelled?: (event: WorkflowCancelledEvent) => void;
    onWorkflowError?: (event: WorkflowErrorEvent) => void;
    onStepStarted?: (event: StepStartedEvent) => void;
    onStepCompleted?: (event: StepCompletedEvent) => void;
    onStepError?: (event: StepErrorEvent) => void;
    onStepContent?: (event: StepContentEvent) => void;
    onParallelExecutionStarted?: (event: ParallelExecutionStartedEvent) => void;
    onParallelExecutionCompleted?: (event: ParallelExecutionCompletedEvent) => void;
    onLoopExecutionStarted?: (event: LoopExecutionStartedEvent) => void;
    onLoopIterationStarted?: (event: LoopIterationStartedEvent) => void;
    onLoopIterationCompleted?: (event: LoopIterationCompletedEvent) => void;
    onLoopExecutionCompleted?: (event: LoopExecutionCompletedEvent) => void;
  },
) => {
  if (!res.ok) {
    throw new Error(`Network response was not ok: ${res.status}`);
  }

  const reader = res.body?.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  function dispatchEvent(event: AgnoRunEvent): void {
    switch (event.event) {
      // ============ Agent Events ============
      case "RunStarted":
        onRunStarted?.(event as RunStartedEvent);
        break;
      case "RunContent":
        onRunContent?.(event as RunContentEvent);
        break;
      case "RunIntermediateContent":
        onIntermediateRunContent?.(event as IntermediateRunContentEvent);
        break;
      case "RunContentCompleted":
        onRunContentCompleted?.(event as RunContentCompletedEvent);
        break;
      case "ToolCallStarted":
        onToolCallStarted?.(event as ToolCallStartedEvent);
        break;
      case "ToolCallError":
        onToolCallError?.(event as ToolCallErrorEvent);
        break;
      case "ToolCallCompleted":
        onToolCallCompleted?.(event as ToolCallCompletedEvent);
        break;
      case "RunCompleted":
        onRunCompleted?.(event as RunCompletedEvent);
        break;
      case "RunPaused":
        onRunPaused?.(event as RunPausedEvent);
        break;
      case "RunContinued":
        onRunContinued?.(event as RunContinuedEvent);
        break;
      case "RunError":
        onRunError?.(event as RunErrorEvent);
        break;
      case "RunCancelled":
        onRunCancelled?.(event as RunCancelledEvent);
        break;
      case "PreHookStarted":
        onPreHookStarted?.(event as PreHookStartedEvent);
        break;
      case "PreHookCompleted":
        onPreHookCompleted?.(event as PreHookCompletedEvent);
        break;
      case "PostHookStarted":
        onPostHookStarted?.(event as PostHookStartedEvent);
        break;
      case "PostHookCompleted":
        onPostHookCompleted?.(event as PostHookCompletedEvent);
        break;
      case "ReasoningStarted":
        onReasoningStarted?.(event as ReasoningStartedEvent);
        break;
      case "ReasoningStep":
        onReasoningStep?.(event as ReasoningStepEvent);
        break;
      case "ReasoningCompleted":
        onReasoningCompleted?.(event as ReasoningCompletedEvent);
        break;
      case "MemoryUpdateStarted":
        onMemoryUpdateStarted?.(event as MemoryUpdateStartedEvent);
        break;
      case "MemoryUpdateCompleted":
        onMemoryUpdateCompleted?.(event as MemoryUpdateCompletedEvent);
        break;
      case "SessionSummaryStarted":
        onSessionSummaryStarted?.(event as SessionSummaryStartedEvent);
        break;
      case "SessionSummaryCompleted":
        onSessionSummaryCompleted?.(event as SessionSummaryCompletedEvent);
        break;
      case "ParserModelResponseStarted":
        onParserModelResponseStarted?.(event as ParserModelResponseStartedEvent);
        break;
      case "ParserModelResponseCompleted":
        onParserModelResponseCompleted?.(event as ParserModelResponseCompletedEvent);
        break;
      case "OutputModelResponseStarted":
        onOutputModelResponseStarted?.(event as OutputModelResponseStartedEvent);
        break;
      case "OutputModelResponseCompleted":
        onOutputModelResponseCompleted?.(event as OutputModelResponseCompletedEvent);
        break;
      case "CustomEvent":
        onCustomEvent?.(event as CustomEvent);
        break;

      // ============ Team Events ============
      case "TeamRunStarted":
        onTeamRunStarted?.(event as TeamRunStartedEvent);
        break;
      case "TeamRunContent":
        onTeamRunContent?.(event as TeamRunContentEvent);
        break;
      case "TeamRunContentCompleted":
        onTeamRunContentCompleted?.(event as TeamRunContentCompletedEvent);
        break;
      case "TeamRunCompleted":
        onTeamRunCompleted?.(event as TeamRunCompletedEvent);
        break;
      case "TeamRunError":
        onTeamRunError?.(event as TeamRunErrorEvent);
        break;
      case "TeamRunCancelled":
        onTeamRunCancelled?.(event as TeamRunCancelledEvent);
        break;
      case "MemberRunStarted":
        onMemberRunStarted?.(event as MemberRunStartedEvent);
        break;
      case "MemberRunContent":
        onMemberRunContent?.(event as MemberRunContentEvent);
        break;
      case "MemberRunCompleted":
        onMemberRunCompleted?.(event as MemberRunCompletedEvent);
        break;
      case "TeamToolCallStarted":
        onTeamToolCallStarted?.(event as TeamToolCallStartedEvent);
        break;
      case "TeamToolCallCompleted":
        onTeamToolCallCompleted?.(event as TeamToolCallCompletedEvent);
        break;

      // ============ Workflow Events ============
      case "WorkflowStarted":
        onWorkflowStarted?.(event as WorkflowStartedEvent);
        break;
      case "WorkflowCompleted":
        onWorkflowCompleted?.(event as WorkflowCompletedEvent);
        break;
      case "WorkflowCancelled":
        onWorkflowCancelled?.(event as WorkflowCancelledEvent);
        break;
      case "WorkflowError":
        onWorkflowError?.(event as WorkflowErrorEvent);
        break;
      case "StepStarted":
        onStepStarted?.(event as StepStartedEvent);
        break;
      case "StepCompleted":
        onStepCompleted?.(event as StepCompletedEvent);
        break;
      case "StepError":
        onStepError?.(event as StepErrorEvent);
        break;
      case "StepContent":
        onStepContent?.(event as StepContentEvent);
        break;
      case "ParallelExecutionStarted":
        onParallelExecutionStarted?.(event as ParallelExecutionStartedEvent);
        break;
      case "ParallelExecutionCompleted":
        onParallelExecutionCompleted?.(event as ParallelExecutionCompletedEvent);
        break;
      case "LoopExecutionStarted":
        onLoopExecutionStarted?.(event as LoopExecutionStartedEvent);
        break;
      case "LoopIterationStarted":
        onLoopIterationStarted?.(event as LoopIterationStartedEvent);
        break;
      case "LoopIterationCompleted":
        onLoopIterationCompleted?.(event as LoopIterationCompletedEvent);
        break;
      case "LoopExecutionCompleted":
        onLoopExecutionCompleted?.(event as LoopExecutionCompletedEvent);
        break;

      default:
        break;
    }
  }

  function read(): void {
    reader
      ?.read()
      .then((result) => {
        if (result.done) {
          return;
        }

        buffer += decoder.decode(result.value, { stream: true });
        const lines = buffer.split("\n");

        buffer = lines[lines.length - 1] ?? "";
        const completeLines = lines.slice(0, -1);

        for (const line of completeLines) {
          if (!line.trim()) continue;

          if (line.startsWith("data: ")) {
            try {
              const eventData = JSON.parse(line.substring(6)) as AgnoRunEvent;

              if (eventData && typeof eventData === "object" && "event" in eventData) {
                dispatchEvent(eventData);
              }
            } catch (error) {
              console.error("Failed to parse SSE event:", line, error);
            }
          }
        }

        read();
      })
      .catch((error) => {
        console.error("Stream read error:", error);
        const errorEvent: RunErrorEvent = {
          event: "RunError",
          created_at: Date.now(),
          agent_id: "",
          agent_name: "",
          content: error instanceof Error ? error.message : String(error),
        };
        onRunError?.(errorEvent);
      });
  }

  read();
};
