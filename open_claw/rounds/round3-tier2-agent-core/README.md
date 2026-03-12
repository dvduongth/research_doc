# Round 3: Tier 2 - Agent Core (`pi-agent-core`)
**Mục tiêu**: Hiểu sâu `@mariozechner/pi-agent-core` - agent runtime với event loop, tool execution, state management.

---

## 🎯 Mục tiêu chi tiết

1. **Agent Class**: Khởi tạo, state, lifecycle.
2. **Event Loop**: `agentLoop()`, `agentLoopContinue()`, event sequence.
3. **Message Types**: `AgentMessage` vs `Message` (LLM), `UserMessage`, `AssistantMessage`, `ToolResultMessage`.
4. **Context Transformation**: `transformContext()`, `convertToLlm()`.
5. **Tool Execution**: `AgentTool` interface, execution flow, error handling.
6. **Steering & Follow-up**: Hàng đợi, xử lý thế nào.
7. **SessionManager**: Lưu session (JSONL), branching, compaction (cơ bản).
8. **Custom Message Types**: Extension declarations.
9. **Low-Level API**: Dùng trực tiếp `agentLoop` nếu cần.

---

## 📂 Nguồn dữ liệu

- `D:\PROJECT\CCN2\pi-mono\packages\agent\`
- Files chính:
  - `README.md` (đã đọc một phần)
  - `src/types.ts`
  - `src/agent.ts`
  - `src/loop.ts` (hoặc tương tự)
  - `src/tools.ts`
  - `src/session-manager.ts` (có thể ở `packages/coding-agent`)

---

## 📋 Checklist

- [ ] **Agent Class**:
  - [ ] `new Agent({ initialState, convertToLlm, transformContext, steeringMode, followUpMode, ... })`
  - [ ] `agent.state` (systemPrompt, model, thinkingLevel, tools, messages, isStreaming, ...)
  - [ ] Methods: `prompt()`, `continue()`, `setSystemPrompt()`, `setModel()`, `setTools()`, `replaceMessages()`, `appendMessage()`, `clearMessages()`, `reset()`, `abort()`, `waitForIdle()`.
  - [ ] `subscribe(event)` và event types.

- [ ] **Event Loop**:
  - [ ] `agentLoop(messages, context, config)` và `agentLoopContinue(context, config)`.
  - [ ] Sequence events: `agent_start` → `turn_start` → `message_*` → (tool calls → `tool_*`) → `turn_end` (có thể lặp) → `agent_end`.
  - [ ] Context building: `transformContext()` → `convertToLlm()`.

- [ ] **Message Types**:
  - [ ] `AgentMessage` union: `UserMessage`, `AssistantMessage`, `ToolResultMessage`, `BashExecutionMessage`, `CustomMessage`, `BranchSummaryMessage`, `CompactionSummaryMessage`.
  - [ ] Difference between `AgentMessage` and `LLM Message` (from pi-ai).
  - [ ] `ToolResultMessage` structure: `toolCallId`, `toolName`, `content`, `details`, `isError`.

- [ ] **Tool Execution**:
  - [ ] `AgentTool` interface: `name`, `label`, `description`, `parameters`, `execute()`.
  - [ ] Tool execution flow: agent calls `execute(toolCallId, params, signal, onUpdate, ctx)`.
  - [ ] `onUpdate` cho streaming progress.
  - [ ] Error throwing vs returning.
  - [ ] Built-in tools: `read`, `bash`, `edit`, `write`, `grep`, `find`, `ls`.

- [ ] **Steering & Follow-up**:
  - [ ] `setSteeringMode('one-at-a-time' | 'all')`
  - [ ] `setFollowUpMode('one-at-a-time' | 'all')`
  - [ ] `agent.steer(message)` và `agent.followUp(message)`.
  - [ ] Steering interrupts remaining tools; follow-up waits until idle.

- [ ] **SessionManager** (from coding-agent, but agent-core may have basic session):
  - [ ] Session file format (JSONL, tree).
  - `SessionManager` API: `newSession()`, `appendMessage()`, `getLeafId()`, `getBranch()`, `buildSessionContext()`, `compact()`, etc.

- [ ] **Custom Message Types**: Declaration merging để thêm `custom` roles.

- [ ] **Low-Level API**: Dùng `agentLoop()` trực tiếp khi cần custom integration.

---

## 📍 File cần đọc

| # | File | Mục tiêu |
|---|------|----------|
| 1 | `packages/agent/README.md` (đã đọc 1 phần) | Agent class, events, tools, state |
| 2 | `packages/agent/src/types.ts` | Core types: `AgentMessage`, `AgentTool`, `AgentContext`, events |
| 3 | `packages/agent/src/agent.ts` | Agent implementation: state, methods, subscription |
| 4 | `packages/agent/src/loop.ts` (or similar) | `agentLoop`, `agentLoopContinue` implementation |
| 5 | `packages/agent/src/tools.ts` | Built-in tool implementations (read, bash, edit, write, ...) |
| 6 | `packages/coding-agent/src/core/session-manager.ts` | SessionManager (nếu không ở agent package) |

---

**Tiến độ**: Chưa bắt đầu.

---

*File này sẽ update khi tiến độ thay đổi.*
