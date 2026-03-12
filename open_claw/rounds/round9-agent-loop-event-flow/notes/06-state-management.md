# State Management
**Round 9: Agent Loop Event Flow**

---

## AgentState

Located in `Agent` class as `private _state`.

```typescript
interface AgentState {
  systemPrompt: string;
  model: Model<any>;
  thinkingLevel: ThinkingLevel;
  tools: AgentTool<any>[];
  messages: AgentMessage[];       // Full conversation context
  isStreaming: boolean;           // True while agent is running
  streamMessage: AssistantMessage | null;  // Partial assistant message being streamed
  pendingToolCalls: Set<string>;  // Set of toolCallId currently executing
  error: string | undefined;      // Last error message (if any)
}
```

---

## State Mutators (public methods)

- `setSystemPrompt(v: string)`
- `setModel(m: Model)`
- `setThinkingLevel(l: ThinkingLevel)`
- `setSteeringMode(mode)`
- `setFollowUpMode(mode)`
- `setTools(t: AgentTool[])`
- `replaceMessages(ms: AgentMessage[])` – replace entire context.
- `appendMessage(m: AgentMessage)` – add to context.
- `clearMessages()`
- `abort()` – abort current request.
- `reset()` – clear messages, streaming flags, pending tools, error, queues.

---

## Queues

- `steeringQueue: AgentMessage[]` – messages to be processed immediately (interrupts).
- `followUpQueue: AgentMessage[]` – messages to be processed after agent becomes idle.

Both are manipulated via:
- `steer(m)`, `followUp(m)`
- `clearSteeringQueue()`, `clearFollowUpQueue()`, `clearAllQueues()`
- `hasQueuedMessages(): boolean`
- `dequeueSteeringMessages(): AgentMessage[]` (respects `steeringMode`)
- `dequeueFollowUpMessages(): AgentMessage[]` (respects `followUpMode`)

---

## State Transitions During run

### Start (`_runLoop`)

```typescript
this._state.isStreaming = true;
this._state.streamMessage = null;
this._state.error = undefined;
this.abortController = new AbortController();
```

### During streaming

- `message_start` (assistant): `this._state.streamMessage = event.message;`
- `message_update` (assistant): `this._state.streamMessage = event.message;`
- `message_end` (assistant): `this._state.streamMessage = null; this.appendMessage(event.message);`

### During tool execution

- `tool_execution_start`: `this._state.pendingToolCalls.add(toolCallId);`
- `tool_execution_end`: `this._state.pendingToolCalls.delete(toolCallId);`

### End of turn

- `turn_end`: If `message.stopReason` is "error", set `this._state.error`.

### Completion or Error

- `agent_end` (normal): `this._state.isStreaming = false; this._state.streamMessage = null;`
- In `catch` block:
  ```typescript
  const errorMsg: AgentMessage = { ... stopReason: this.abortController?.signal.aborted ? "aborted" : "error", errorMessage: err?.message };
  this.appendMessage(errorMsg);
  this._state.error = err?.message;
  this.emit({ type: "agent_end", messages: [errorMsg] });
  ```

### Finally

```typescript
this._state.isStreaming = false;
this._state.streamMessage = null;
this._state.pendingToolCalls = new Set();
this.abortController = undefined;
this.resolveRunningPrompt?.();
this.runningPrompt = undefined;
```

---

## Accessors

- `get state(): AgentState` – read-only snapshot (but note mutable arrays: `messages` can be modified externally? It returns the actual `_state` object, so caller could mutate. Not ideal, but ok.
- `sessionId` getter/setter.
- `thinkingBudgets` getter/setter.
- `transport` getter/setter.
- `maxRetryDelayMs` getter/setter.

---

## Subscription

- `subscribe(fn: (e: AgentEvent) => void): () => void` – adds listener to `this.listeners` set.
- `emit(e: AgentEvent)` – calls all listeners.

---

## Usage Patterns

- **Check if agent busy**: `agent.state.isStreaming`.
- **Check pending tools**: `agent.state.pendingToolCalls.size`.
- **Abort**: `agent.abort()`.
- **Wait for idle**: `await agent.waitForIdle()` (returns `this.runningPrompt` promise).
- **Add custom messages** (steer/follow-up): `agent.steer(msg)`, `agent.followUp(msg)`.
- **Modify context**: `agent.replaceMessages(ms)` (caution: may break tool call associations).
- **Change model**: `agent.setModel(model)`. Affects subsequent turns.

---

## Thread Safety

Agent class is not designed for concurrent use from multiple threads. All methods should be called from the same async context (event loop) to avoid race conditions. For example, calling `prompt()` while streaming throws an error.

---

**End of state management notes**.
