# Comparison with Other Agent Frameworks
**Round 12: Agent Loop - Core Concepts**

---

## ReAct (Reasoning + Acting)

**Pattern**:
- Thought → Action → Observation → Thought → Action... until answer.
- Each step is a separate LLM call.
- The "agent loop" is essentially:
  ```text
  while not done:
    response = llm(prompt + history)
    if response contains action:
      result = execute(action)
      append observation to history
    else:
      done = true
  ```

**Differences from pi-agent**:
- **Granularity**: ReAct uses one tool call per LLM turn. pi-agent allows **multiple tool calls in a single assistant message**.
- **Number of LLM calls**: ReAct may require many LLM calls for multi-step tasks; pi-agent can batch tool calls, reducing latency and cost.
- **Steering**: Re-act: new user input would be appended as a new user message and would naturally cause a new thought. Interrupting mid-turn (while waiting for tool result) is not part of the loop; the client would have to cancel the current run and start a new one. pi-agent's steering can interrupt after a tool, before remaining tools.
- **Follow-up**: Similar: user messages get appended to history; next LLM call will see them.

**Similarity**: Both maintain a message history and iterate until done.

---

## OpenAI Function Calling (Chat Completions with tools)

**Pattern**:
- Client sends messages + `tools` definitions to `/chat/completions`.
- Assistant responds with `finish_reason="tool_calls"` and includes one or more `tool_call` objects.
- Client must respond with a `tool` message (role="tool") containing **an array of results**, one per tool call. Usually all results are sent together in one response.
- Assistant then produces a final response (or more tool calls).

**Key characteristics**:
- **Parallel tool execution encouraged**: Because the assistant emits all tool calls at once, the client can execute them in parallel and send back results in a single batch.
- **Two-turn minimum** for any tool use: assistant (tool calls) → tool results → assistant final.
- **Stateless**: The client is responsible for maintaining the message array. The provider doesn't loop internally; each request is independent.

**Differences from pi-agent**:
- pi-agent does **sequential** tool execution by default.
- pi-agent's loop is internal; the client sends one `prompt()` and gets a stream of events including tool results as they happen. No need for client to batch results.
- pi-agent supports steering/follow-up queuing; OpenAI client must implement its own queue if desired.
- pi-agent's event stream is richer (turn_start, tool_execution_update, etc.).
- OpenAI's function calling can be used to build an agent loop; pi-agent already has the loop built-in.

---

## LangChain AgentExecutor

LangChain provides various agent types (e.g., `openai-functions`, `react-docstore`). The `AgentExecutor` runs a loop:

```typescript
while should_continue:
  # call LLM with tools
  # parse output (maybe includes action and input)
  # if action is tool, execute tool (synchronously, can be parallel? Usually sequential).
  # add observation to intermediate steps
```

LangChain's loop is similar to ReAct: one action per LLM call. It can handle multiple tools in one response? Some agents support multiple tool calls in one go; the `openai-functions` agent can parse multiple `tool_calls` and execute them sequentially (or parallel if specified). There is config `returnIntermediateSteps` to include observations in final answer.

LangChain also has `StreamingAgentExecutor` that streams events.

**Differences**:
- LangChain is language-specific (Python/JS); pi-agent is Node/TS.
- LangChain separates the agent (decides actions) from the executor (runs loop); pi-agent combines both.
- pi-agent's steering/follow-up is not a standard LangChain concept; you'd need to implement custom callback handlers to inject new user messages mid-run.
- pi-agent's hooks (`transformContext`) are similar to LangChain's "prompt templates" and "output parsers".

---

## AutoGPT / BabyAGI

These are autonomous agents that run for many steps, often with self-directed goals. Their loops are similar to ReAct but include additional components like task prioritization, memory summarization, etc.

**Differences**:
- pi-agent is more of a **runtime** for building such agents; it doesn't prescribe a goal-loop strategy. Extensions could implement AutoGPT-like behavior on top of pi-agent.
- AutoGPT usually has a "continuous mode" where it keeps running until stop condition. pi-agent's outer loop follow-up can emulate continuous mode if the agent itself queues follow-up messages (e.g., "continue").
- pi-agent's steering allows human intervention, which AutoGPT may lack.

---

## Claude Code / Codex Agents

These are specialized coding agents with their own orchestration. Claude Code runs as a separate process; it reads files, writes patches, etc. Its internal loop likely is a ReAct-style with specialized tools (read, write, search). It does not embed into a larger agent; it is the agent.

pi-agent is a general framework; a coding agent could be built as an extension with tools like `read_file`, `write_file`, `search`. Or use the external coding agents (Codex, Claude Code) via skills, as seen in `coding-agent` skill.

---

## Key Differentiators of pi-agent

1. **Dual-queue Steering/Follow-up**: Unique design for managing concurrent user messages during an ongoing run. Most frameworks treat each user message as starting a new run.
2. **EventStream API**: Fine-grained events for observability and UI.
3. **Hook composition**: Flexible modification points (transformContext, convertToLlm) with chaining.
4. **Extensions system**: Allows modular addition of tools, prompts, hooks without forking core.
5. **Sequential tool execution by default**: Simpler mental model, avoids race conditions. Parallel can be implemented in a custom tool if needed.
6. **Explicit state management**: `AgentState` exposed; agents are reusable.
7. **Abortability**: Cancel mid-stream via `agent.abort()`.
8. **No built-in memory/compaction**: Leaves that to application, making it more low-level.

---

## When to Use pi-agent vs Others

- **pi-agent**: Building a custom chat-based agent with fine-grained control over streaming, tool execution order, and needing to handle concurrent user messages gracefully. Good for embedded in a larger system where you want to own the loop.
- **ReAct**: Simple research, step-by-step reasoning where each tool call should be followed by LLM reflection.
- **OpenAI functions**: Quick integration with OpenAI, leveraging their hosted models; if you don't need complex interrupt handling.
- **LangChain**: If you need a batteries-included framework with many pre-built tools, integrations, and memory modules; also if you want to switch LLM providers easily.
- **AutoGPT**: Autonomous goal-driven agents; but often you need to customize heavily.

---

## Influence and Similarities

pi-agent's design appears influenced by:
- **OpenAI function calling**: tool call messages.
- **Anthropic's streaming**: `message_start`, `content_block_start`, etc.
- **LangChain's agent events**: similar event types.
- **Slack's Real-Time Messaging**: event-driven architecture.

The combination of double loop + queues is a fresh take on conversational interruptibility.

---

## Conclusion

pi-agent is a **low-level, event-driven agent runtime** emphasizing flexibility, observability, and concurrent user interaction. It's less opinionated about high-level strategies (like ReAct's thought-action cycle) and more about providing the plumbing. This makes it suitable as a foundation for building custom agent architectures.

---

**End of comparison**.
