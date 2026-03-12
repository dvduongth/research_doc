# Design Principles
**Round 12: Agent Loop - Core Concepts**

---

## Interruptibility

**Definition**: The agent can be redirected by user input at well-defined points, even while executing long-running tools.

**Implementation**:
- Steering queue checked after each tool execution.
- Remaining tools in the current turn are skipped when steering arrives.
- The user's message is injected immediately for the next assistant turn.

**Benefits**:
- Responsive UX: user doesn't have to wait for a long tool chain to finish.
- Safety: user can abort a misguided sequence early.
- Control: human-in-the-loop for critical decisions.

**Trade-offs**:
- Requires careful state management to skip tools cleanly.
- Tools must be cancellable via `signal` to avoid wasted work.

---

## Extensibility

**Definition**: The agent's behavior can be customized without modifying core code.

**Mechanisms**:
- **Extensions**: loadable modules with lifecycle, event hooks, resource provision.
- **Config hooks**: `transformContext`, `convertToLlm`, `getSteeringMessages`, `getFollowUpMessages`, `before_provider_request`.
- **Event subscriptions**: `agent.on('turn_end', ...)` etc.
- **Tool registration**: dynamic `setTools()`.

**Design**:
- The agent core is minimal; it delegates many concerns to config callbacks and extensions.
- Hooks are **composable**: multiple extensions can provide them, and they are chained.
- The `AgentContext` and `AgentState` are read-only to extensions? Actually state is mutable but extensions can call public setters; this is deliberate to allow control.

**Trade-offs**:
- Composing hooks correctly requires understanding of order and chaining.
- Overriding hooks can break other extensions if not done carefully.
- No sandbox: extensions run in same process, so a buggy extension can crash the agent.

---

## Determinism

**Definition**: Given the same initial state and inputs, the agent's behavior is predictable and repeatable.

**Aspects**:
- **Tool execution order**: Sequential, follows the order in the assistant message.
- **Message ordering**: The `messages` array order is well-defined; new messages are appended.
- **Hook order**: Determined by extension load order and dependency graph (topological sort). This is deterministic if dependencies are acyclic.
- **Randomness**: LLM generation itself is non-deterministic by default, but can be fixed with `seed` if the provider supports it. The agent does not affect this.

**Why deterministic**:
- Easier to debug: you can reproduce a run.
- Predictable state changes.

**Trade-offs**:
- Sequential tool execution may be slower than parallel, but avoids race conditions.
- Strict ordering may limit optimizations.

---

## Transparency & Observability

**Definition**: The agent's internal state and progress are visible to clients and extensions.

**Mechanisms**:
- **EventStream**: All major steps emit events (`agent_start`, `turn_start`, `message_update`, `tool_execution_start`, etc.).
- **State access**: `agent.state` provides snapshot (isStreaming, pendingToolCalls, messages).
- **Logging**: Extensions can use `context.log`. Core also logs.
- **Hooks**: `before_provider_request` can log the exact payload.

**Benefits**:
- UI can render real-time updates (typing indicators, progress bars).
- Debugging: trace the entire run.
- Monitoring: collect metrics (latency per tool, turns count).

**Trade-offs**:
- Event flood: many events can overwhelm slow subscribers. Should be async and catch errors.
- Sensitive data: events may contain PII; need redaction in logs.

---

## Separation of Concerns

The agent loop separates:

- **LLM interaction** (via `streamFn`) from tool execution.
- **State persistence** (application) from runtime loop.
- **Hooks** for transformations from core orchestration.
- **Extensions** (resource provision) from core.

This allows each piece to evolve independently.

---

## Safety and Error Handling

- **Abort**: `AbortController` propagates to LLM and tools, enabling cancellation.
- **Error isolation**: Tool errors are caught and turned into `ToolResultMessage` with `isError`, not crashing the agent.
- **Agent errors**: caught in `_runLoop` and turned into error assistant message; agent ends gracefully.
- **No top-level leaks**: All errors are converted to messages or emitted events.

---

## Simplicity vs Flexibility

The agent core is relatively simple (~300 lines for `_runLoop`?), but it's flexible enough to support complex use cases via hooks and extensions. This is a good balance: core stays maintainable, power users can extend.

---

## Backpressure and Flow Control

The agent emits events as they happen; there is no built-in backpressure. If a subscriber is slow, events queue in Node event loop. If memory becomes an issue, subscribers should be efficient or drop events. The agent could add a option to throttle (e.g., only emit `message_update` every N ms or when content changes by >M chars), but not currently.

---

## Extensibility vs Security

Because extensions run in the same process and have full access to `agent`, they can do anything. This is powerful but risky. The design trusts extensions. In a multi-tenant environment, you'd need sandboxing (worker threads, VM). This is left to future work.

---

## Idempotency and Resume

The agent is **not** designed for automatic resume after crash. If the process dies, the session state (messages) is stored by application, but the in-memory state (isStreaming, pendingToolCalls) is lost. The application would need to restart the agent and feed context up to the last known point. This is feasible because all messages are persisted; but the current `sessions_spawn` with `mode="session"` likely persists state. The agent can be re-instantiated with the same `messages` and continue. However, any in-progress tool would have been interrupted; you might need to re-run. Not a primary design goal, but possible.

---

## Testability

The agent loop is deterministic given a stubbed LLM (controlling stream events) and mock tools. This makes unit tests possible. The use of `streamFn` abstraction allows injecting a fake EventStream.

---

## Performance

- **Sequential tools**: latency = sum of tool latencies. Could be improved by parallel execution for independent tools. But the design deliberately avoids parallel to reduce complexity and avoid race conditions on shared state (like agent's `messages`). If an extension needs parallel, it can create a tool that internally runs parallel sub-tasks and aggregates results (so the agent still sees one tool call).
- **Streaming**: Events emitted as soon as LLM produces deltas; UI can start rendering immediately, reducing perceived latency.
- **Memory**: `messages` array grows; compaction needed for long sessions.

---

## Future-Proofing

The hook system and event types are designed to be extensible. New event types can be added without breaking existing subscribers (they just ignore unknown types). Hooks can be added as new config fields. This allows evolution.

---

## Summary of Principles

| Principle | How it's Manifested |
|-----------|---------------------|
| Interruptibility | Steering queue, post-tool checks |
| Extensibility | Config hooks, extensions, events |
| Determinism | Sequential tool exec, ordered hooks |
| Transparency | EventStream, state access |
| Safety | Error isolation, abort propagation |
| Simplicity | Core loop minimal, delegate to hooks |
| Separation | Application handles persistence, agent handles runtime |

These principles guided the pi-agent design and are evident in the code structure.

---

**End of design principles**.
