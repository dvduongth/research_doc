# Agent Loop Event Flow - Checklist

---

## ✅ Phase 1: Core Flow Overview

- [ ] Đọc `agent-loop.ts`: `agentLoop()` và `agentLoopContinue()`.
- [ ] Hiểu `runLoop()` structure: outer loop + inner loop.
- [ ] Xác định event stream: `EventStream<AgentEvent, AgentMessage[]>`.
- [ ] Ghi `notes/01-prompt-vs-continue.md` (so sánh).
- [ ] Ghi `notes/02-outer-inner-loops.md` (loop purposes).

---

## ✅ Phase 2: Event Types

- [ ] Liệt kê đầy đủ `AgentEvent` types từ `types.ts`:
  - `agent_start`, `agent_end`
  - `turn_start`, `turn_end`
  - `message_start`, `message_update`, `message_end`
  - `tool_execution_start`, `tool_execution_update`, `tool_execution_end`
- [ ] Với mỗi event, nêu:
  - [ ] Khi nào phát (trong flow nào)
  - [ ] Payload fields
  - [ ] Có return value không?
- [ ] Ghi `notes/03-event-types-detailed.md`.

---

## ✅ Phase 3: Tool Execution

- [ ] `executeToolCalls()` flow:
  - [ ] Lọc toolCalls từ assistant message.
  - [ ]Validate arguments (`validateToolArguments`).
  - [ ] Call `tool.execute()` với `signal`, `onUpdate`.
  - [ ] Catch errors → isError.
  - [ ] Push events: `tool_execution_start`, `tool_execution_update` (nếu có), `tool_execution_end`.
  - [ ] Tạo `ToolResultMessage` và push `message_start`/`message_end`.
- [ ] Steering sau mỗi tool: check `getSteeringMessages()`, nếu có → skip remaining.
- [ ] `skipToolCall()` tạo result với text "Skipped due to queued user message."
- [ ] Ghi `notes/04-tool-execution-flow.md`.

---

## ✅ Phase 4: Steering & Follow-up

- [ ] Steering: `steer()` queue, `dequeueSteeringMessages()`, modes (`all`, `one-at-a-time`).
- [ ] Follow-up: `followUp()` queue, `dequeueFollowUpMessages()`.
- [ ] Khi nào check steering? Trong `executeToolCalls()` sau mỗi tool, và trong inner loop trước assistant response (`pendingMessages`).
- [ ] Khi nào check follow-up? Sau khi inner loop kết thúc (không còn tool calls, không có pending messages), trong outer loop.
- [ ] Delivery modes: `steer` (interrupt after current tool), `followUp` (wait idle), `nextTurn`.
- [ ] Ghi `notes/05-steering-followup.md`.

---

## ✅ Phase 5: State Management

- [ ] `AgentState` fields:
  - `systemPrompt`, `model`, `thinkingLevel`, `tools`, `messages`
  - `isStreaming`, `streamMessage`, `pendingToolCalls`
  - `error`
- [ ] Agent methods: `setSystemPrompt`, `setModel`, `setThinkingLevel`, `setTools`, `replaceMessages`, `appendMessage`.
- [ ] Steering/follow-up queues: `steeringQueue`, `followUpQueue`.
- [ ] `isStreaming` set/reset trong `_runLoop`.
- [ ] `pendingToolCalls` được update trong `runLoop` (switch case).
- [ ] Ghi `notes/06-state-management.md`.

---

## ✅ Phase 6: Transform & Convert

- [ ] `transformContext`: optional hook gọi trước mỗi LLM call, nhận `messages`, trả về modified `messages`.
- [ ] `convertToLlm`: default filters to user/assistant/toolResult; convert attachments.
- [ ] Cả hai được gọi trong `streamAssistantResponse()`:
  - First apply `transformContext` (if set)
  - Then `convertToLlm`
- [ ] Use cases: context pruning, custom message types, provider-specific formats.
- [ ] Ghi `notes/07-transform-convert.md`.

---

## ✅ Phase 7: Error & Abort

- [ ] `AbortController` tạo trong `_runLoop`, `signal` passed down.
- [ ] Nếu `signal.aborted`, `stopReason` = "aborted".
- [ ] Try/catch trong `_runLoop`: nếu error, tạo `errorMessage` assistant message với `stopReason: "error"`.
- [ ] Tool execution errors: caught in `executeToolCalls`, set `isError: true`.
- [ ] Partial message handling: nếu partial chỉ có empty content, và abort → throw "Request was aborted".
- [ ] Ghi `notes/08-error-abort-handling.md`.

---

## ✅ Phase 8: Compaction & Branching (Application Layer)

- [ ] Compaction: tạo summary entry, old messages bị loại bỏ khi build context (SessionManager, không phải agent-core).
- [ ] Branching: session tree với `parentId`, resume từ entry (SessionManager).
- [ ] Agent loop không biết compaction/branching; nó chỉ nhận messages từ SessionManager.
- [ ] Ghi `notes/09-compaction-branching.md`.

---

## ✅ Phase 9: Diagrams

- [ ] Sequence diagram: `agent.prompt()` → events.
- [ ] Sequence diagram: `agent.continue()`.
- [ ] Diagram: inner loop detail (assistant → tools → steering → next?).
- [ ] Diagram: tool execution flow.
- [ ] Diagram: AgentState transitions (idle → streaming → idle, pendingToolCalls).
- [ ] Lưu vào `diagrams/`.

---

## ✅ Phase 10: Quiz & Finalize

- [ ] Tạo quiz 15-20 câu:
  - Event order
  - Loop conditions
  - Tool execution details
  - Steering vs follow-up
  - State fields
  - Transform/convert
  - Error/abort
  - Compaction/branching
- [ ] Lưu `quiz.md`.
- [ ] Cập nhật `PROGRESS.md`.
- [ ] Đánh dấu checklist.

---

**Bắt đầu đọc code và viết notes!**
