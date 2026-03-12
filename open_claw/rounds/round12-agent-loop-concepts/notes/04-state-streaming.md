# State Management & Streaming
**Round 12: Agent Loop - Core Concepts**

---

## AgentState Snapshot

The agent's `_state` is a mutable object storing runtime state:

```typescript
{
  systemPrompt: string;
  model: Model<any>;
  thinkingLevel: ThinkingLevel;
  tools: AgentTool[];
  messages: AgentMessage[];       // Full conversation
  isStreaming: boolean;           // True while _runLoop active
  streamMessage: AssistantMessage | null;  // Partial being streamed
  pendingToolCalls: Set<string>;  // IDs of currently executing tools
  error: string | undefined;      // Last error message
}
```

This state is **per-agent**, not per-run. It persists across multiple `prompt()` calls (the agent is reused). The `messages` array grows until cleared (`reset()` or `clearMessages()`).

---

## Streaming Model

When the agent generates a response, it streams events to the client. The flow:

1. `streamAssistantResponse()` is called.
2. It calls `config.transformContext` (if set) to possibly modify messages.
3. Calls `config.convertToLlm(messages)` to get LLM messages.
4. Builds `llmContext` and calls `streamFn(model, llmContext, options)`.
5. `streamFn` returns an `EventStream` (async iterator).
6. The loop consumes events:
   - `start`: creates a new `partial` AssistantMessage, sets `streamMessage`, emits `message_start`.
   - `text_start`/`text_delta`/`text_end`: updates `partial.content` (adds text block).
   - `thinking_start`/`thinking_delta`/`thinking_end`: updates thinking content.
   - `toolcall_start`/`toolcall_delta`/`toolcall_end`: builds toolCall item.
   - `done`/`error`: finalizes the message, emits `message_end`, returns the final `AssistantMessage`.
7. During streaming, `streamMessage` holds the current partial; external consumers can read `agent.state.streamMessage` to get the latest partial (e.g., for UI).
8. After `message_end`, `streamMessage` is set to `null`.

---

## Streaming vs Non-Streaming

The agent is designed around streaming; even non-streaming calls (like OpenAI non-stream) can be wrapped to produce similar events by emitting the full message at once (`start` then `end`). The agent loop expects a stream of events.

---

## Partial Message Construction

The `partial` AssistantMessage is built incrementally:

- `content` is an array of content items (text, thinking, toolCall). Each item is created on `*_start` and updated on `*_delta`. On `*_end`, the item is finalized.
- The `partial` message is updated on each delta; the `message_update` event emits the entire partial (not just delta). This allows subscribers to simply replace the previous message with the new one.

---

## Tool Execution and State

When the assistant message is complete, `executeToolCalls` is called:

- It iterates over toolCall items.
- For each tool, it sets `pendingToolCalls.add(toolCallId)` on start, deletes on end.
- If multiple tools run sequentially, `pendingToolCalls` will contain the currently executing tool's ID (only one at a time because sequential).
- Tool execution may emit `tool_execution_update` via the `onUpdate` callback provided to `tool.execute()`.

---

## Concurrency Limits

The agent runs entirely on a single async thread (Node.js event loop). Tools are `await`ed sequentially, so there is no parallel tool execution. This ensures deterministic ordering and avoids race conditions on shared state.

An extension could spawn parallel sub-tasks inside a single tool (using `Promise.all`), but that's internal to the tool; the agent still sees the tool as one call.

---

## Abort Signal

`_runLoop` creates an `AbortController` and stores `abortController` in state? Actually it's `this.abortController = new AbortController()`. The `signal` is passed to:
- `streamFn` (so the provider can abort).
- `tool.execute` (so tools can abort).
Extensions can also listen to `signal` if they capture it.

Calling `agent.abort()` triggers `this.abortController.abort()`. The signal's `aborted` flag is checked at various points.

---

## Error Propagation

If an error occurs during streaming (e.g., network error, provider error, abort), it bubbles up to the `_runLoop` catch block. There, an `errorMsg` assistant message is constructed with `stopReason = "error"` (or `"aborted"`) and `errorMessage` containing the error text. This message is appended to `context.messages` and emitted via `agent_end`.

If a tool throws, `executeToolCalls` catches it and produces a `ToolResultMessage` with `isError=true` and error text. The agent continues to next tool (unless steering).

---

## State Mutators

Public methods that mutate state:

- `setSystemPrompt(v)`: updates `systemPrompt` and may affect subsequent LLM calls (need to re-run `_runLoop`? Usually done between runs).
- `setModel(m)`: updates `model`.
- `setThinkingLevel(l)`: updates `thinkingLevel`.
- `setTools(tools)`: replaces `tools` array.
- `appendMessage(msg)`: adds to `messages` (used by `_runLoop` automatically for new messages).
- `replaceMessages(msgs)`: replaces entire message history (dangerous, may break tool call association).
- `abort()`: aborts current run.
- `reset()`: clears messages, streaming flags, pending tools, error, queues.

These mutators are not thread-safe; should be called from same event loop.

---

## Streaming Backpressure

The `EventStream` pushes events to subscribers. If a subscriber is slow (e.g., UI rendering lag), the emitter does not apply backpressure (it's not a Node.js stream with backpressure). Events are emitted as they happen; if a subscriber throws an exception, the loop may break? The agent should catch subscriber errors to avoid crashing.

---

## Memory Considerations

Because `messages` is an ever-growing array (unless compaction applied), the agent can run out of memory for long conversations. Solutions:
- Application-level compaction (SessionManager) summarizes old messages.
- Agent could have a config `maxMessages` and prune oldest when exceeded.
- Extensions can implement `transformContext` to prune.

The agent itself does not automatically prune; it assumes the application manages context size.

---

## Observability

`AgentState` provides read-only snapshot (though the object is mutable). Monitoring tools can poll `agent.state` to see:
- `isStreaming`: busy or idle.
- `messages.length`: conversation length.
- `pendingToolCalls.size`: number of tools currently executing.
- `error`: last error.

Combined with event subscription, this gives full observability.

---

## Example: Real-time UI Update

UI component:

```javascript
agent.on('message_update', (e) => {
  const partial = e.message;
  renderPartial(partial);
});
```

It can also show a spinner when `agent.state.isStreaming` and no recent update? Spinner could be on `agent_start` and off on `agent_end`.

---

## End of State & streaming.
