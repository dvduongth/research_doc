# Extension Events
**Round 7: Dependency Graph - Extension System**

---

## Event Categories

1. **Session events**: lifecycle của session.
2. **Agent events**: agent run, turns, messages, tools.
3. **Model events**: model selection.
4. **Tool events**: before/after tool execution.
5. **User bash events**: `!` commands.
6. **Input event**: trước khi expand skill/template.

---

## Session Events

| Event | When | Payload | Return value (to modify) |
|-------|------|---------|--------------------------|
| `session_directory` | CLI startup, trước khi tạo session manager | `{ cwd }` | `{ sessionDir: string }` (last wins) |
| `session_start` | Sau khi session manager được tạo | `_event`, `ctx` | none |
| `session_before_switch` | Trước `/new` hoặc `/resume` | `{ reason: "new" \| "resume", targetSessionFile? }` | `{ cancel: true }` |
| `session_switch` | Sau khi switch | `{ reason, previousSessionFile }` | none |
| `session_before_fork` | Trước `/fork` | `{ entryId }` | `{ cancel: true }` hoặc `{ skipConversationRestore: true }` |
| `session_fork` | Sau khi fork | `{ previousSessionFile }` | none |
| `session_before_compact` | Trước compaction (manual/auto) | `{ preparation, branchEntries, customInstructions, signal }` | `{ cancel: true }` hoặc `{ compaction: { summary, firstKeptEntryId, tokensBefore } }` |
| `session_compact` | Sau compaction | `{ compactionEntry, fromExtension }` | none |
| `session_before_tree` | Trước `/tree` navigation | `{ preparation, signal }` | `{ cancel: true }` hoặc `{ summary: { summary, details } }` |
| `session_tree` | Sau tree navigation | `{ newLeafId, oldLeafId, summaryEntry, fromExtension }` | none |
| `session_shutdown` | Khi exit (Ctrl+C, Ctrl+D, SIGTERM) | `_event`, `ctx` | none |

---

## Agent Events

| Event | When | Payload | Return |
|-------|------|---------|--------|
| `before_agent_start` | Sau khi user submit prompt, trước agent loop | `{ prompt, images, systemPrompt }` | `{ message?, systemPrompt? }` (inject message, replace system prompt) |
| `agent_start` | Bắt đầu agent run (sau `before_agent_start`) | `_event`, `ctx` | none |
| `turn_start` | Bắt đầu một turn (có thể có pending messages) | `{ turnIndex, timestamp }` | none |
| `message_start` | Message bắt đầu (user, assistant, toolResult) | `{ message }` | none |
| `message_update` | Assistant message streaming (delta) | `{ message, assistantMessageEvent }` | none |
| `message_end` | Message kết thúc | `{ message }` | none |
| `context` | Trước mỗi LLM call, sau transformContext | `{ messages }` | `{ messages }` (filter, prune) |
| `before_provider_request` | Sau khi payload provider-built, trước gửi request | `{ payload, model, aborted }` | `payload` để replace request |
| `tool_execution_start` | Bắt đầu tool call | `{ toolCallId, toolName, args }` | none |
| `tool_execution_update` | Tool đang stream progress | `{ toolCallId, toolName, args, partialResult }` | none |
| `tool_execution_end` | Tool kết thúc | `{ toolCallId, toolName, result, isError }` | none |
| `turn_end` | Kết thúc turn (sau tất cả tools) | `{ turnIndex, message, toolResults }` | none |
| `agent_end` | Kết thúc agent run | `{ messages }` | none |

---

## Tool Events

### `tool_call`

- **When**: before tool executes.
- **Payload**: `{ toolName, toolCallId, input }` (input là params object).
- **Return**: `{ block: true, reason: string }` để chặn tool. Nếu any handler returns block, tool bị skip (isError, message là reason).
- **Typing**: Dùng `isToolCallEventType(name, event)` để type guard. Built-in tools có types sẵn.

### `tool_result`

- **When**: sau khi tool execute xong.
- **Payload**: `{ toolName, toolCallId, input, content, details, isError }`
- **Return**: Có thể patch result: `{ content?, details?, isError? }`. Partial merge, handlers chạy theo load order.

---

## Input Event

- **When**: Sau khi extension commands checked (nếu không tìm thấy), trước skill/template expansion, trước agent processing.
- **Payload**: `{ text, images?, source: "interactive" | "rpc" | "extension" }`
- **Return**:
  - `{ action: "continue" }` (default) – pass through.
  - `{ action: "transform", text?, images? }` – modify rồi continue.
  - `{ action: "handled" }` – skip agent entirely.
- Handlers chain: transformations được merge, first "handled" wins.

---

## User Bash Event

- **When**: Khi user nhập `!cmd` hoặc `!!cmd` (editor).
- **Payload**: `{ command, excludeFromContext, cwd }`
- **Return**:
  - `{ operations }` – cung cấp custom operations (remote exec).
  - `{ result }` – hoàn toàn replace result (stdout, stderr, exitCode, cancelled, truncated).
  - Không return → default local bash execution.

---

## Model Event

| Event | When | Payload | Return |
|-------|------|---------|--------|
| `model_select` | Khi model thay đổi qua `/model`, Ctrl+P, hoặc session restore | `{ model, previousModel, source: "set" \| "cycle" \| "restore" }` | none |

---

## Order & Chaining

- **Load order**: Extensions được load theo discovery order (thường alphabetical). Handlers đăng ký theo load order.
- **Event dispatch**: Khi event xảy ra, tất cả handlers của tất cả extensions được gọi theo load order.
- **Blocking**: `tool_call` và `session_before_*` handlers có thể `cancel`/`block`. First to return block wins (others skip).
- **Transformation**: `context` và `tool_result` handlers chain: mỗi handler nhận kết quả sau đã apply bởi previous.
- **Input**: `input` handlers: transformations chain, `handled` stops processing.

---

## Event Payload Types

Các event có types cụ thể (typescript) trong `src/core/extensions/types.ts`:
- `SessionBeforeSwitchEvent`, `SessionSwitchEvent`, ...
- `AgentEvent` (base), `BeforeAgentStartEvent`, `MessageStartEvent`, `ToolCallEvent`, `ToolResultEvent`, ...
- `ModelSelectEvent`
- `UserBashEvent`
- `InputEvent`

Sử dụng type guards khi cần (ví dụ: `isToolCallEventType("bash", event)`).

---

**Lưu ý**: Events cung cấp hook vào mọi giai đoạn của agent lifecycle và session management. Extensions nên only subscribe events họ cần để tránh overhead.
