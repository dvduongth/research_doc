# Agent Event Types (Detailed)
**Round 9: Agent Loop Event Flow**

---

## Core Agent Events

These events are emitted by the agent loop (`agent-loop.ts`). Extensions also register handlers for these.

### agent_start

- **When**: At the very beginning of `agentLoop()` or `agentLoopContinue()`.
- **Payload**: `{}` (empty object).
- **Return**: none.
- **Notes**: Indicates a new agent run has started. Does not include prompts; prompts are emitted as separate `message_start/end` events.

### turn_start

- **When**: At the start of each turn within the run. The first turn gets `turn_start` after `agent_start` (but `firstTurn` flag prevents duplicate? Actually code: `if (!firstTurn) stream.push({ type: "turn_start" }); else firstTurn = false;`. So for the very first turn in `agentLoop`, there is no `turn_start` because prompts already signaled start? Wait: In `agentLoop`, after emitting prompts, it calls `runLoop()`. Inside `runLoop`, before first iteration, `firstTurn = true`. In the inner loop start: `if (!firstTurn) { stream.push({ type: "turn_start" }); } else { firstTurn = false; }`. That means for the **first** turn, there is **no** `turn_start` emitted? Actually, `firstTurn` initially true, so the if condition false, we go to else, set `firstTurn = false`. So no `turn_start` for the first turn. For subsequent turns (inner loop iterations after break? Actually inner loop may continue without leaving; but outer loop can cause new inner loop iterations; then `firstTurn` is false, so `turn_start` will be emitted. So `turn_start` is emitted for every turn **except** the very first one of the run. That is a nuance.
- **Payload**: `{ turnIndex?: number; timestamp?: number }`. `turnIndex` may be set elsewhere (maybe from context). Not in code snippet we saw; likely added elsewhere.
- **Return**: none.

### message_start

- **When**: When a message (user, assistant, or toolResult) begins.
- **Payload**: `{ message: AgentMessage }`.
- **Return**: none.
- **Notes**: For user prompts, emitted in `agentLoop` right after `turn_start` (or immediately for first turn). For assistant, emitted in `streamAssistantResponse` when `event.type === "start"`. For toolResult, emitted in `executeToolCalls` after creating `ToolResultMessage`.

### message_update

- **When**: During assistant streaming, for each delta (text, thinking, toolCall).
- **Payload**: `{ message: AssistantMessage, assistantMessageEvent: StreamEvent }`. `assistantMessageEvent` is the raw event from pi-ai (e.g., `text_delta`, `thinking_delta`, etc.).
- **Return**: none.
- **Notes**: Only for assistant messages. The `message` is the partial assistant message up to that point.

### message_end

- **When**: When a message is complete.
- **Payload**: `{ message: AgentMessage }`.
- **Return**: none.
- **Notes**: For user (immediately after `message_start`), for assistant after `done`/`error` from stream, for toolResult after execution.

### tool_execution_start

- **When**: Right before calling `tool.execute()`.
- **Payload**: `{ toolCallId: string; toolName: string; args: any }`.
- **Return**: none.

### tool_execution_update

- **When**: If the tool's `execute` function calls `onUpdate(partialResult)` during execution.
- **Payload**: `{ toolCallId; toolName; args; partialResult }`.
- **Return**: none.
- **Notes**: Optional; many tools may not stream updates.

### tool_execution_end

- **When**: After tool execution completes (success or error).
- **Payload**: `{ toolCallId; toolName; result: AgentToolResult; isError: boolean }`.
- **Return**: none.

### turn_end

- **When**: After all tool calls for the current turn have been processed (or if no tools). Emitted at the end of the inner loop iteration.
- **Payload**: `{ turnIndex?, message: AssistantMessage, toolResults: ToolResultMessage[] }`.
- **Return**: none.
- **Notes**: Signals that the turn is complete. After this, the agent may start a new turn if there are pending messages (steering) or follow-up.

### agent_end

- **When**: When the agent run finishes (after all turns, or after error/abort).
- **Payload**: `{ messages: AgentMessage[] }`. The `messages` array is the collection of new messages generated during this run (the `newMessages` array accumulated).
- **Return**: none.
- **Notes**: This event marks the end of the `EventStream`. After `agent_end`, the stream is closed (`stream.end(newMessages)`).

---

## Context & Provider Events

### context

- **When**: Before each LLM call, after `transformContext` (if any) and before `convertToLlm`.
- **Payload**: `{ messages: AgentMessage[] }`. The messages that will be converted and sent to the provider (after transform).
- **Return**: `{ messages?: AgentMessage[] }` to modify the messages (filter, prune, add).
- **Notes**: Handlers can inspect and modify messages. Runs in extension load order. Useful for compaction, retrieval injection, etc.

### before_provider_request

- **When**: After the provider-specific payload has been built (by pi-ai), right before the HTTP request is sent.
- **Payload**: `{ payload: any; model: Model; aborted: boolean }`.
- **Return**: Any value to replace the payload; `undefined` keeps original.
- **Notes**: Useful for debugging, logging, or modifying the request (e.g., adjust temperature). Only for advanced use.

---

## Event Emission Order Example (No Tools)

1. `agent_start`
2. (maybe `turn_start` if not first turn)
3. `message_start` (user prompt)
4. `message_end` (user prompt)
5. `message_start` (assistant partial)
6. `message_update` × N (streaming)
7. `message_end` (assistant)
8. `turn_end` (with `toolResults: []`)
9. `agent_end`

---

## Event Order with Tools (1 tool)

1. `agent_start`
2. `turn_start` (maybe)
3. `message_start` (user)
4. `message_end` (user)
5. `message_start` (assistant)
6. `message_update` × N (streaming, may include toolCall delta)
7. `message_end` (assistant, with toolCall)
8. `tool_execution_start`
9. (optional `tool_execution_update` × N)
10. `tool_execution_end`
11. `message_start` (toolResult)
12. `message_end` (toolResult)
13. `turn_end` (with `toolResults` array containing that toolResult)
14. `agent_end`

If assistant has multiple tool calls, steps 8-12 repeat for each tool in sequence. If steering occurs after a tool, remaining tools are skipped and a new turn begins (step 2 onward) with the steering message injected.

---

## Notes on Streaming

- The `message_update` event carries the current partial `AssistantMessage`. The entire message is replaced on each update.
- The `assistantMessageEvent` inside `message_update` is the raw event from the provider (e.g., `text_delta`, `thinking_delta`, `toolcall_delta`). This allows rendering with more detail.

---

**End of event types reference**.
