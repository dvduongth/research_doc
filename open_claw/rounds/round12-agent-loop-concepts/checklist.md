# Agent Loop Concepts - Checklist

## ✅ Phase 1: Agent Loop Purpose & Evolution

- [ ] Phân tích tại sao cần agent loop (stateful, multi-turn, tool use).
- [ ] So sánh với simple request-response (single turn).
- [ ] Lịch sử: từ chat completion đến function calling đến agentic loops.
- [ ] Ghi `notes/01-purpose-evolution.md`.

---

## ✅ Phase 2: Core Abstractions

- [ ] Khái niệm: Turn, Message (User, Assistant, ToolResult), Tool Call.
- [ ] Steering và Follow-up làm gì?
- [ ] Context: messages array, its role in LLM calls.
- [ ] Ghi `notes/02-core-abstractions.md`.

---

## ✅ Phase 3: Outer vs Inner Loop

- [ ] Tại sao cần hai vòng lặp?
- [ ] Outer loop: follow-up handling.
- [ ] Inner loop: tool calls & steering.
- [ ] Cơ chế chuyển tiếp giữa chúng.
- [ ] Ghi `notes/03-outer-inner-loops.md`.

---

## ✅ Phase 4: State Management & Streaming

- [ ] `AgentState` fields và ý nghĩa.
- [ ] `isStreaming`, `streamMessage`, `pendingToolCalls`.
- [ ] Streaming partial messages và cập nhật.
- [ ] Ghi `notes/04-state-streaming.md`.

---

## ✅ Phase 5: Hook System

- [ ] `transformContext`: mục đích, use cases.
- [ ] `convertToLlm`: default implementation, overriding.
- [ ] `before_provider_request`: khi nào dùng.
- [ ] `context` event.
- [ ] Ghi `notes/05-hook-system.md`.

---

## ✅ Phase 6: Tool Execution Model

- [ ] Sequential vs parallel.
- [ ] Validation (`validateToolArguments`).
- [ ] Error handling: isError, skip on steering.
- [ ] Events: start, update, end.
- [ ] Ghi `notes/06-tool-execution-model.md`.

---

## ✅ Phase 7: Context Management

- [ ] Compaction: why, when, how (application layer).
- [ ] Branching: session tree, navigation.
- [ ] Retrieval integration (RAG).
- [ ] Ghi `notes/07-context-management.md`.

---

## ✅ Phase 8: Comparison with Other Frameworks

- [ ] ReAct (thought, action, observation).
- [ ] OpenAI function calling (tool_choice, parallel).
- [ ] LangChain agents (AgentExecutor, loops).
- [ ] pi-mono so sánh: outer/inner, steering, hooks.
- [ ] Ghi `notes/08-comparison-other-frameworks.md`.

---

## ✅ Phase 9: Design Principles

- [ ] Interruptibility (steering).
- [ ] Extensibility (hooks, events).
- [ ] Determinism (sequential tools, ordering).
- [ ] Transparency (events, logging).
- [ ] Ghi `notes/09-design-principles.md`.

---

## ✅ Phase 10: Diagrams & Quiz

- [ ] Vẽ diagrams: concept map, outer/inner loop purpose, comparison table.
- [ ] Tạo quiz 20-30 câu.
- [ ] Lưu vào `diagrams/` và `quiz.md`.
- [ ] Finalize checklist & PROGRESS.

---

**Hoàn thành**: Tất cả notes, diagrams, quiz.
