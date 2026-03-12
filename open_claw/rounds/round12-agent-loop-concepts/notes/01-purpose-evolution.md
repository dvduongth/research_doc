# Agent Loop Purpose & Evolution
**Round 12: Agent Loop - Core Concepts**

---

## The Problem

Early LLM interfaces were **stateless request-response**: send a prompt, get a completion. This works for问答但 không cho phép:

- **Multi-step reasoning** with intermediate actions.
- **Tool use**: The model cannot affect the external world.
- **Long-running conversations** with memory.
- **Interruptibility**: User wants to change direction mid-stream.

---

## Evolution

1. **Chat Completions** (OpenAI 2020): stateless, message arrays.
2. **Function Calling** (OpenAI 2023): Model can request function execution, but the loop was still **single turn**: assistant emits tool calls, the client executes them and must make a **follow-up request** to continue. This is a multi-turn process but not a single agent loop; the client orchestrates.
3. **Agent Frameworks** (LangChain, AutoGPT, pi-agent): Encapsulate the **entire lifecycle** in a single `agent.run()` call that internally handles:
   - Streaming assistant response.
   - Detecting tool calls.
   - Executing tools.
   - Injecting tool results.
   - Deciding whether to continue or stop.
   - This is the **agent loop**.

---

## Agent Loop Purpose

The agent loop is a **unified runtime** that:

- Manages **conversation state** (`messages` array).
- Streams assistant partials to the client in real-time.
- Executes tools **asynchronously** as they appear.
- Handles **errors** and **aborts** gracefully.
- Supports **steering** (interrupts) and **follow-up** (post-idle messages).
- Provides **hooks** for extensions to modify behavior.
- Emits **events** for observability.

Essentially: the agent loop is the **orchestrator** that turns a stateless LLM into a stateful, tool-using, interruptible agent.

---

## pi-agent Loop Structure

Recall from Round 9:

- `_runLoop(messages?)`: entry point. Sets `isStreaming=true`.
- `agentLoop()` or `agentLoopContinue()`: outer + inner loops.
- Inner loop processes a turn: assistant → tools (if any) → possibly more turns if steering.
- Outer loop handles follow-up after inner completes.

---

## Comparison with Simple Request-Response

| Feature | Simple Request-Response | Agent Loop |
|---------|------------------------|------------|
| Streaming | No (wait for full) | Yes (text_delta, thinking) |
| Tools | No | Yes (auto-execute) |
| Multi-turn | Client must re-prompt | Automatic (until stop) |
| Steering | Not possible | Yes (interrupt during tools) |
| Follow-up | Client sends new message | Automatic (queued messages) |
| Events | None | Rich event stream |
| Hooks | None | transformContext, etc. |
| Error handling | Return error | Emit error event, continue? |

---

## Why Outer + Inner?

- **Inner loop**: Handles **assistant message + tool calls** in one logical turn. The assistant may emit multiple tool calls; the agent executes them sequentially, possibly with steering interruptions after each tool. This inner loop continues as long as there are tool calls or pending steering messages.
- **Outer loop**: After the inner loop concludes (no more tools, no immediate steering), we check for **follow-up** messages that arrived while the agent was busy. If any, we start a new inner loop iteration (a new turn) with those follow-up messages. This allows the agent to process a backlog of user messages without the client having to manually re-prompt.

Together, they enable:
- Steering interrupts **within** a turn (inner).
- Follow-up processing **between** turns (outer).
- A single `agent.prompt()` call can result in multiple turns (inner iterations) and multiple outer iterations (if follow-ups queued).

---

## Key Innovation: Steering & Follow-up

Most agent frameworks treat user messages as discrete turns. pi-agent's steering/follow-up queues allow:

- **Steering**: While the agent is streaming or executing tools, the user can send a message that will be processed **immediately after the current tool** (or after current assistant delta if no tool). This provides a responsive, interruptible UX.
- **Follow-up**: If the agent is busy (streaming, tools), subsequent user messages are queued as follow-up and processed automatically once the agent becomes idle. This reduces client complexity: the client doesn't need to wait for `agent_end` to send the next message; it can just send and the agent will handle it in order.

This dual-queue design is a powerful abstraction for **real-time conversational agents**.

---

## Event Stream as API

The agent loop exposes an **EventStream** of `AgentEvent`s. This is the primary API for clients and extensions:

- `agent_start` / `agent_end`: lifecycle.
- `turn_start` / `turn_end`: boundaries.
- `message_start` / `message_update` / `message_end`: assistant stream.
- `tool_execution_*`: tool progress.
- `context`, `before_provider_request`: advanced hooks.

Clients can consume this stream to update UI in real-time, log, or steer.

---

## Extensibility Points

- **Hooks** (`transformContext`, `convertToLlm`): modify LLM input/output.
- **Events**: subscribe to any phase.
- **Config**: agent options (model, thinking, tools).
- **State**: read-only access to messages, streaming status.

---

## Design Trade-offs

- **Complexity**: Double loop + queues adds complexity, but provides smooth UX.
- **Determinism**: Sequential tool execution ensures state consistency (no parallel race conditions).
- **Backpressure**: Streaming events allow client to render progressively; steering provides user control.
- **Extensibility**: Hooks allow deep customization without forking core.

---

## Next Steps

We'll dive deeper into each concept in subsequent notes.

---

**End of purpose & evolution**.
