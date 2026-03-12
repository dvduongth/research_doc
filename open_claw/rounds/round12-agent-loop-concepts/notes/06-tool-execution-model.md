# Tool Execution Model
**Round 12: Agent Loop - Core Concepts**

---

## Tool Registration

Tools are functions provided to the agent via `AgentOptions.tools` array or later via `agent.setTools()`. Each tool has:

- `name`: unique string.
- `description`: for LLM to understand.
- `parameters`: JSON Schema for arguments.
- `execute`: async function `(toolCallId, args, signal, onUpdate?) => ToolResult`.

---

## Execution Trigger

When the assistant message is complete (`done` event), the agent extracts all content items with `type === "toolCall"` from that message. These become the list of tool calls to execute.

---

## Sequential Execution

Tool calls are executed **one at a time**, in the order they appear in the message content array. The algorithm:

```typescript
for (let i = 0; i < toolCalls.length; i++) {
  const toolCall = toolCalls[i];
  // 1. emit tool_execution_start
  // 2. validate arguments against tool's parameters schema (throws if invalid)
  // 3. const result = await tool.execute(toolCall.id, validatedArgs, signal, (partial) => { emit tool_execution_update });
  // 4. catch errors -> result = { content: [text error], isError: true }
  // 5. emit tool_execution_end
  // 6. create ToolResultMessage with role="toolResult", toolCallId, toolName, content, details, isError, timestamp
  // 7. push ToolResultMessage to context.messages and newMessages
  // 8. emit message_start and message_end for toolResult
  // 9. Check getSteeringMessages(); if any, set steeringAfterTools and break loop (skip remaining tools)
}
```

---

## Validation

Before executing, `validateToolArguments(tool, toolCall)` ensures the provided arguments match the JSON Schema. This is crucial because the LLM may generate malformed calls. Validation errors are thrown and caught, resulting in an error tool result.

---

## Error Handling in Tools

If `tool.execute()` throws, the catch block creates an error result. The tool's `isError` flag is set to `true`. The agent continues to the next tool (unless steering interrupts). The error result will be visible to the assistant in subsequent turns (if any).

---

## Steering During Execution

After each tool completes, `executeToolCalls` calls `config.getSteeringMessages()`. If any steering messages are returned, execution stops (remaining tools are skipped) and `steeringAfterTools` is set. The skipped tools are still recorded as `ToolResultMessage` with `isError=true` and text "Skipped due to queued user message." This gives a clear audit trail.

---

## Tool Result as Message

The `ToolResultMessage` has `role: "toolResult"` (not user or assistant). It is added to the messages array. The LLM will see these in subsequent turns when it generates the next assistant message (if any). In pi-agent, after tool results, the turn ends; the next assistant message would require a new turn (triggered by steering/follow-up). The tool results are thus part of the context for that next turn.

---

## Tool Update Progress

Tools can provide incremental updates by calling the `onUpdate(partialResult)` function passed to `execute`. The agent will emit `tool_execution_update` events with that partial. This is useful for long-running tools to report progress (e.g., "Downloaded 50%").

---

## Comparison with OpenAI Function Calling

OpenAI's API allows **parallel** tool calls in a single assistant message. The client can execute them in parallel (or sequentially) and then return an array of tool results in a **single** user or tool message? Actually the spec: When assistant message contains `tool_calls`, the client must respond with a `tool` message (role="tool") containing results for each tool call, typically all in one go. The assistant will then generate a new response considering all results. This is a **two-turn** interaction: assistant (with tool calls) → tool results (as separate messages) → assistant final.

In pi-agent:
- Tools are executed **sequentially** inside the same turn.
- Each tool result is added as a separate `toolResult` message immediately after execution.
- The turn ends after all tools (or after steering).
- If there are multiple tool calls in the same assistant message, they are all part of the same turn, and the results are streamed as they complete.

Differences:
- Parallelism: OpenAI allows parallel; pi-agent sequential (simpler, deterministic).
- Result delivery: OpenAI sends all results in one batch; pi-agent sends interleaved as each finishes.
- Steering: pi-agent can interrupt after any tool; OpenAI requires you to not send remaining results? Actually if you want to interrupt, you would not send results for remaining tools and instead send a user message; the assistant would stop waiting for those tool results. That is possible but less integrated.

---

## Comparison with ReAct

ReAct (Reasoning + Acting) framework typically does:
- Thought → Action → Observation → Thought → Action... until answer.
Each step is a separate LLM call. The agent loop in ReAct is essentially:
```text
while not done:
  generate thought + action (tool call)
  execute tool
  append observation as user message
```
That's a multi-turn loop where each tool call triggers a new LLM call. In pi-agent, the assistant can emit multiple tool calls in a single message, and they are all executed without additional LLM calls between them. This reduces LLM calls and latency, but loses the ability for the model to reason after each individual tool result before deciding next action. However, the model could have included a plan with multiple tool calls ahead of time. The trade-off: batch vs stepwise.

---

## Tool Abstraction

The tool interface is simple:
- `execute(toolCallId, args, signal, onUpdate?) => ToolResult`
- The agent doesn't care what the tool does; it could call an external API, run a shell command, query a database, etc.

Tools are **synchronous** from the agent's perspective (the `execute` returns a promise; the agent awaits). Tools can be long-running; `signal` allows abort.

---

## Tool Discovery & Documentation

The LLM knows which tools are available because the agent includes them in the `tools` field of the LLM context (usually as part of the system message or a separate `tools` parameter, depending on provider). The agent's `convertToLlm` includes a `tools` array derived from `this.state.tools`, each with `name`, `description`, `parameters`. This is sent to the provider along with messages.

---

## Tool Call ID Matching

Each tool call gets a unique `id` (usually a short UUID). The `ToolResultMessage` must have the same `toolCallId` to match. This is how the LLM knows which result corresponds to which call when multiple results are present.

---

## Handling Tool-Only Extensions

Some extensions may provide tools. They register via `provide.tool(name, fn)` and the extension manager adds them to the agent's tool list (usually by calling `agent.setTools([...existing, ...new])`). The agent's `tools` array is the union of all provided tools.

If two tools have same name, last one wins (or error). The extension manager should avoid duplicates.

---

## Tool Result Format

A `ToolResult` has:
- `content`: Array of content items (usually text, but could be images). This becomes the `content` of the `ToolResultMessage`.
- `details`: optional metadata (e.g., HTTP status, file path).

Examples:
```typescript
// Text result
{ content: [{ type: 'text', text: 'The weather is 72°F.' }], details: {} }

// Error result
{ content: [{ type: 'text', text: 'Error: city not found' }], details: { isError: true } }

// Image result (if tool returns an image)
{ content: [{ type: 'image', data: 'base64...', mimeType: 'image/png' }], details: {} }
```

---

## Tool Execution Timeout

There is no per-tool timeout in core, but the `signal` has an associated `AbortController` that could be set to auto-abort after some time. The agent's `_runLoop` sets a global `timeoutMs`? Actually `_runLoop` doesn't set a timeout; the `AbortController` is created without a timeout. A higher-level wrapper could set a timeout on the entire `_runLoop` (the `runTimeoutSeconds` option in `sessions_spawn`). That's separate.

---

## Tool Safety

Because tools execute with the agent's privileges, a malicious or buggy tool could harm. The trust model: tools are provided by installed extensions, which should be from trusted sources. The agent does not sandbox tools. Future: implement tool permissions (ask user before running certain tools).

---

## Summary

The tool execution model is straightforward but powerful. Sequential execution with steering interrupts provides a balance of control and efficiency.

---

**End of tool execution model**.
