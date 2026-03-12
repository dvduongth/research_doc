# Quiz: Agent Loop Concepts (Round 12)

---

## Part 1: Purpose & Evolution

**Q1:** What was the key limitation of early LLM interfaces that led to agent loops?
- A. They could not stream responses.
- B. They were stateless and could not use tools or multi-step reasoning.
- C. They required too many tokens.
- D. They only supported text, not images.

**Q2:** How does OpenAI function calling differ from an integrated agent loop?
- A. Function calls are handled in a single turn without loop.
- B. The client must orchestrate tool execution and send back results in a separate request.
- C. It does not support streaming.
- D. It only supports one tool per turn.

**Q3:** What is the main benefit of having the tool execution inside the agent loop (vs client-driven)?
- A. Reduces number of LLM calls.
- B. Allows the agent to decide when to continue automatically.
- C. Both A and B.
- D. No benefit, just abstraction.

---

## Part 2: Core Abstractions

**Q4:** What is a "turn" in pi-agent?
- A. One LLM call (assistant message).
- B. Assistant message + execution of its tool calls + turn_end.
- C. One user message + one assistant message.
- D. One tool execution.

**Q5:** Which message role is used for tool results?
- A. "user"
- B. "assistant"
- C. "toolResult"
- D. "system"

**Q6:** Steering messages are:
- A. Sent after the agent finishes.
- B. Queued and processed immediately after the current turn (interrupt).
- C. Same as follow-up.
- D. Only used for error recovery.

**Q7:** Follow-up messages are:
- A. Processed as soon as they arrive.
- B. Processed after the inner loop ends and agent becomes idle.
- C. Ignored if agent is busy.
- D. Higher priority than steering.

**Q8:** The `messages` array in `AgentContext` contains:
- A. Only the current user and assistant messages.
- B. Full conversation history (user, assistant, toolResult, summaries).
- C. Only the latest turn.
- D. Only tool results.

---

## Part 3: Double Loop

**Q9:** What triggers the outer loop to repeat?
- A. Presence of `pendingMessages` from steering.
- B. Presence of follow-up messages after inner loop ends.
- C. A tool call returning an error.
- D. The agent's `isStreaming` flag.

**Q10:** What is the purpose of the inner loop's condition `hasMoreToolCalls || pendingMessages.length > 0`?
- A. To keep executing tools until none left, and also handle steering injections.
- B. To limit the number of turns.
- C. To wait for user input.
- D. To handle both streaming and non-streaming.

**Q11:** Where is `steeringAfterTools` set?
- A. After each tool execution if `getSteeringMessages()` returns non-empty.
- B. Only at the start of a turn.
- C. In the outer loop.
- D. Never; it's a misnomer.

**Q12:** If steering arrives during tool execution, what happens to remaining tools?
- A. They run anyway.
- B. They are canceled via `signal`.
- C. They are skipped, and `skipToolCall` creates error results.
- D. They are queued for later.

**Q13:** When does the outer loop check for follow-up?
- A. After every turn.
- B. Only after inner loop finishes with no pending steering.
- C. Before starting the first turn.
- D. When the user sends a special command.

**Q14:** What ensures that follow-up does not interrupt a turn in progress?
- A. Follow-up is only checked after inner loop ends (no pending tools/steering).
- B. Follow-up has lower priority.
- C. Follow-up is always discarded if agent busy.
- D. Follow-up is queued as steering instead.

---

## Part 4: State & Streaming

**Q15:** `AgentState.streamMessage` holds:
- A. The final assistant message.
- B. The partial assistant message currently being streamed.
- C. The last tool result.
- D. The system prompt.

**Q16:** `AgentState.pendingToolCalls` is a:
- A. Array of tool call objects.
- B. Set of toolCallId strings currently executing.
- C. Map of tool names to promises.
- D. Count of tools.

**Q17:** How is `isStreaming` manipulated?
- A. Set to true at `_runLoop` start, false in `finally` block.
- B. Set to true on `agent_start`, false on `agent_end`.
- C. Set by each tool during execution.
- D. It's read-only derived from `streamMessage != null`.

**Q18:** During streaming, `message_update` events contain:
- A. Only the delta since last update.
- B. The entire partial AssistantMessage.
- C. The final message.
- D. Just the tool calls.

**Q19:** What happens if a tool's `execute` throws?
- A. The agent aborts.
- B. The exception is caught and turned into a ToolResultMessage with `isError=true`.
- C. The tool is retried automatically.
- D. The agent ignores and moves to next tool without recording error.

**Q20:** The `abortController`'s signal is passed to:
- A. LLM provider's `streamFn`.
- B. Each tool's `execute`.
- C. `transformContext` hook.
- D. Both A and B.

---

## Part 5: Hooks

**Q21:** `transformContext` receives which arguments?
- A. `(messages)`
- B. `(messages, signal)`
- C. `(context)`
- D. `(agent)`

**Q22:** Where is `before_provider_request` invoked?
- A. Before `transformContext`.
- B. After `convertToLlm`, just before HTTP request.
- C. After the LLM response arrives.
- D. At agent shutdown.

**Q23:** How can an extension modify the final LLM messages in-place?
- A. Via `transformContext`.
- B. Via `convertToLlm`.
- C. Via the `context` event (mutate `event.messages`).
- D. Both A and C.

**Q24:** If two extensions both provide `transformContext`, how are they combined?
- A. Only the last one wins.
- B. They run in load order (dependencies first), each wrapping the previous.
- C. They run in reverse load order.
- D. They are merged by concatenation.

**Q25:** Which hook would you use to add a custom header to the provider request?
- A. `transformContext`
- B. `convertToLlm`
- C. `before_provider_request`
- D. `context`

---

## Part 6: Tool Execution

**Q26:** Tools are executed:
- A. In parallel by default.
- B. Sequentially in the order they appear.
- C. In random order.
- D. Only if `parallel:true` in tool options.

**Q27:** Argument validation uses:
- A. A custom function provided by extension.
- B. `validateToolArguments` against tool's JSON Schema.
- C. No validation.
- D. The provider's schema validation.

**Q28:** When a tool call is skipped due to steering, `skipToolCall` creates:
- A. A ToolResultMessage with empty content.
- B. A ToolResultMessage with text "Skipped due to queued user message." and `isError=true`.
- C. No result, just remove the tool call.
- D. A special `ToolSkippedMessage`.

**Q29:** What event(s) are emitted for a tool execution?
- A. `tool_start` and `tool_end`.
- B. `tool_execution_start`, `tool_execution_update` (optional), `tool_execution_end`.
- C. `tool_begin`, `tool_progress`, `tool_done`.
- D. Only `turn_end`.

**Q30:** The `onUpdate` callback in `tool.execute` is used for:
- A. Sending partial results to client via `tool_execution_update`.
- B. Logging only.
- C. Aborting the tool.
- D. Nothing; it's optional.

---

## Part 7: Context & Events

**Q31:** Compaction is typically implemented:
- A. Inside the agent loop.
- B. In the application layer (SessionManager).
- C. In an extension's `transformContext`.
- D. In the provider.

**Q32:** Branching allows:
- A. Multiple users to edit the same conversation.
- B. Creating alternate conversation timelines from a point.
- C. Parallel tool execution.
- D. Summarizing old messages.

**Q33:** The `context` event is:
- A. Synchronous.
- B. Asynchronous (await listeners).
- C. Only emitted once per turn.
- D. Used to transform LLM messages (synchronous mutation).

**Q34:** Which event is emitted first for a user prompt?
- A. `agent_start`
- B. `turn_start`
- C. `message_start`
- D. `context`

---

## Part 8: Design Principles

**Q35:** The principle of **interruptibility** is realized through:
- A. Steering queue and post-tool checks.
- B. AbortController.
- C. Sequential tool execution.
- D. Hooks.

**Q36:** How does the agent achieve **transparency**?
- A. By exposing `AgentState` and emitting rich events.
- B. By logging every detail to a file.
- C. By allowing user to read provider API key.
- D. By open-sourcing the code.

**Q37:** Determinism is ensured by:
- A. Sequential tool execution and ordered hook composition.
- B. Using a fixed random seed.
- C. Avoiding LLM randomness.
- D. Single-threaded event loop.

**Q38:** The separation between application and agent core helps with:
- A. Letting the agent focus on runtime, app handle persistence.
- B. Making the agent larger.
- C. Reducing extensibility.
- D. None.

---

## Part 9: Misc & Troubleshooting

**Q39:** If the agent never exits, a possible cause is:
- A. An extension keeps queuing steering or follow-up messages.
- B. The LLM is too slow.
- C. Tools are stuck.
- D. The outer loop condition is wrong.

**Q40:** To inspect the current partial assistant message, you would:
- A. Listen to `message_update`.
- B. Read `agent.state.streamMessage`.
- C. Both A and B.
- D. Only after `message_end`.

**Q41:** Which is NOT a typical place to modify messages before they reach the LLM?
- A. `transformContext`
- B. `convertToLlm`
- C. `before_provider_request`
- D. `getSteeringMessages`

**Q42:** True or False: The agent loop can run multiple turns within a single `agent.prompt()` call.
- A. True
- B. False

**Q43:** Which event signals the end of the entire agent run?
- A. `turn_end`
- B. `message_end`
- C. `agent_end`
- D. `agent_stop`

**Q44:** What is the relationship between `newMessages` and `context.messages`?
- A. `newMessages` are the messages generated during this run; they get appended to persistent context after run.
- B. They are the same.
- C. `newMessages` is a snapshot of `context.messages`.
- D. `context.messages` is a subset of `newMessages`.

**Q45:** What does the `context` event's payload contain?
- A. `{ messages: Message[] }`
- B. `{ payload: any }`
- C. `{ event: string }`
- D. `{ agent: Agent }`

**Q46:** Which of these is a valid way to add a tool?
- A. `agent.tools.push(tool)`
- B. `agent.setTools([...])`
- C. `agent.addTool(tool)`
- D. `agent.config.tools = [...]`

**Q47:** What happens to `pendingMessages` after a steering interrupt?
- A. They become the next turn's injected messages (inner loop continues).
- B. They are discarded.
- C. They are moved to follow-up queue.
- D. They cause an error.

**Q48:** In the `AgentState`, what does `error` store?
- A. The last tool error.
- B. The last LLM API error.
- C. Any error message from the current or most recent run.
- D. It is unused.

**Q49:** Which of these is a key difference between pi-agent and ReAct?
- A. ReAct uses multiple LLM calls per step; pi-agent batches tool calls.
- B. ReAct supports streaming; pi-agent does not.
- C. ReAct has steering; pi-agent does not.
- D. ReAct uses events; pi-agent does not.

**Q50:** What is the purpose of the `getFollowUpMessages` hook?
- A. To return messages that should be processed after the agent becomes idle.
- B. To return messages that interrupt the current turn.
- C. To retrieve past messages from storage.
- D. To provide tool results.

---

**End of quiz**.
