# Core Abstractions
**Round 12: Agent Loop - Core Concepts**

---

## Turn

A **turn** is a logical unit of agent processing. It starts when the agent begins generating a response to the current context (which may include injected messages) and ends after all tool calls (if any) have been executed and results added to context.

- A single `agent.prompt()` may result in **multiple turns** if:
  - The assistant emits tool calls, and after tool execution, there is still more to say (the model can generate more content after seeing tool results). Actually in pi-agent, after tool results, the inner loop continues automatically: new turn starts with pendingSteering? Wait: The inner loop continues if there are pending messages (steering) after turn_end. But does the assistant automatically generate more after tool results without steering? In typical agent loops, after tool results are added, the agent would produce another assistant message (another turn) if the model's response included more content after tool calls? In pi-agent code, after tool results are pushed, `hasMoreToolCalls` is set based on whether the current assistant message had more tool calls (if there were multiple tool calls in one message, they are all executed sequentially, and `hasMoreToolCalls` would be true if there are more in that same message). But after finishing all tool calls from that assistant message, the loop ends that iteration. Then `pendingMessages` is checked; if none, inner loop ends. There is no automatic generation of a new assistant message without a new user/ tool result input. However, after tool results, the context now includes those results. The next turn would require another assistant generation, but what triggers it? In ReAct style, after tool observation, the model generates another thought/action. In pi-agent, after tool results, the `turn_end` is emitted. Then the inner loop condition: `hasMoreToolCalls` (false) and `pendingMessages` (initially from steering check, but we also check getSteeringMessages which likely returns empty). So inner loop ends. Then outer loop checks follow-up; if none, agent_end. So the agent does **not** automatically continue after tool results unless there is a steering or follow-up. That means the assistant's single message can contain multiple tool calls, and those are all executed in one turn, but the assistant does not produce a new message after seeing tool results unless the user sends another message (steering/follow-up). That is different from ReAct where after each tool observation the model generates a new step. In pi-agent, it's more like: the assistant emits a message that may contain multiple tool calls; the agent executes them all (or until steering), then stops. The assistant does not generate additional text after the tool calls as part of the same message; any response after tool calls would be a separate assistant message in a subsequent turn, which requires new user input (or maybe a follow-up from extension?).

But there is also the possibility that after tool results, the assistant message that was originally streamed might have included text before tool calls and maybe after? In the streaming model, tool calls are part of the same assistant message content, interleaved with text? Actually in pi-ai streaming, toolCall deltas can appear after text deltas, all within the same assistant message. So the assistant's single message can contain both text and tool calls. The agent will execute the tool calls after the message is complete. The text part is already in the message. After tool results are added, the turn ends. The assistant does not generate additional text automatically; if the conversation requires a follow-up, the user must prompt. That is a design choice: the assistant's response is atomic; tool calls are considered part of the response, not triggers for further generation.

Thus, **turn** = one assistant message (may contain tool calls) + execution of those tool calls + emission of `turn_end`. No automatic continuation.

However, if `getSteeringMessages` returns something (like an extension queued a follow-up), then the inner loop continues with a new turn (another assistant generation) without user intervention. That could be used for autonomous multi-step reasoning? Possibly.

For clarity: A turn in pi-agent is bounded by:
- Start: injection of messages (user or steering) followed by assistant generation.
- End: after tool execution (if any) and emission of `turn_end`.
- Next turn only if there are pending messages (steering) or outer follow-up.

So turn is not exactly the same as an LLM "turn" (assistant generation); it includes tool execution too.

---

## Message

AgentMessage union types (from pi-agent types):

- `UserMessage`: `{ role: "user", content: MessageContent[], ... }`
- `AssistantMessage`: `{ role: "assistant", content: MessageContent[], stopReason, ... }`
- `ToolResultMessage`: `{ role: "toolResult", toolCallId, toolName, content, details, isError }`

Also potentially `SystemMessage`? Usually system prompt is set via config, not a message in the array. But could be included as a user or assistant message? Typically system prompt is separate.

Message content items: `{ type: "text", text: string }` or `{ type: "image", ... }` or `{ type: "thinking", thinking: string }` or `{ type: "toolCall", name, arguments, id }`.

---

## Tool Call

A tool call is a content item in an AssistantMessage with `type: "toolCall"`. It includes:

- `id`: unique identifier for this call (used to match with ToolResultMessage).
- `name`: tool name (string).
- `arguments`: JSON object (or sometimes string) with parameters.

Multiple tool calls can appear in a single assistant message, possibly alongside text. They are executed in the order they appear in the content array? The code filters all `toolCall` items and executes them sequentially by index.

---

## Steering vs Follow-up

Both are queues of `AgentMessage` (typically UserMessage). Difference:

- **Steering**: Processed **immediately after the current turn** (right after `turn_end`). Checked in two places: inside `executeToolCalls` after each tool (to interrupt remaining tools), and after `turn_end` when determining `pendingMessages` for next inner iteration. Steering interrupts the current turn's remaining work and injects a new user message before the next assistant generation.
- **Follow-up**: Processed **only after the inner loop finishes** (no pending steering). Checked in outer loop. If follow-up exists, outer loop continues, causing inner to inject those messages and start a new turn.

Thus:
- Steering: higher priority, can interrupt tool execution, processed within same outer iteration.
- Follow-up: lower priority, processed after agent becomes idle (no more tools, no steering).

---

## Context

The `messages` array in `AgentContext` represents the full conversation history. It is built from persistent session state (`AgentState.messages`) plus any new messages passed to `_runLoop`. The context is read-only within a run? Actually `currentContext.messages` is a copy of `context.messages` (the persistent state) extended with new messages. During run, new messages (assistant, toolResult) are appended to both `currentContext.messages` and `newMessages`. At the end, `newMessages` are appended to persistent state (outside `_runLoop`). So context accumulates.

---

## Tool vs Tool Call

- **Tool**: The registered callable function (with name, description, parameters) known to the agent.
- **Tool Call**: An instance of the agent deciding to invoke a tool, with specific arguments and a unique call ID.

---

## Event Stream

The agent loop produces an `EventStream` that emits objects with `type` and payload. Consumers (UI, extensions) subscribe to these events to observe the agent's inner workings.

---

## Hooks vs Events

- **Hooks** (config callbacks) allow modifying the flow (e.g., transform messages). They are synchronous or async functions that return modified data.
- **Events** are notifications; listeners can observe but not directly modify (except the `context` event may allow in-place mutation). Events are for side effects (logging, UI updates).

---

## Idle vs Busy

- **Busy**: `isStreaming = true` (agent is inside `_runLoop`).
- **Idle**: `isStreaming = false`. At this point, follow-up messages can be processed (by triggering a new `prompt()` via outer loop? Actually follow-up is processed automatically within the same `_runLoop` call if outer loop finds follow-up. So the agent may not become idle until after all follow-ups are handled. But conceptually, after inner loop ends, before checking follow-up, the agent is at a quiescent point.

---

## Summary

These abstractions form a coherent model for building stateful, interruptible agents. Understanding them is key to extending pi-agent.

---

**End of core abstractions**.
