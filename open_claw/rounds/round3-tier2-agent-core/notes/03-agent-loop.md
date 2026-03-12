# Agent Loop

## 🔄 Core Functions

### `agentLoop(prompts, context, config, signal?, streamFn?)`

Bắt đầu một vòng agent mới với một hoặc nhiều prompt messages. Các prompts được thêm vào context và emitted dưới dạng `message_start`/`message_end`.

**Parameters**:
- `prompts`: `AgentMessage[]` (thường là user messages)
- `context`: `AgentContext` (systemPrompt, messages, tools)
- `config`: `AgentLoopConfig`
- `signal?`: `AbortSignal` để hủy
- `streamFn?`: custom stream function

**Returns**: `EventStream<AgentEvent, AgentMessage[]>` (async iterable + `.result()` trả về tất cả new messages).

---

### `agentLoopContinue(context, config, signal?, streamFn?)`

Tiếp tục từ context hiện tại mà không thêm message mới. Dùng cho retry sau lỗi.

**Yêu cầu**: message cuối trong `context.messages` phải convert được thành `user` hoặc `toolResult` (không được `assistant`).

---

## 🌀 Event Sequence

### High-level

```
agentLoop()
├─ agent_start
├─ turn_start
├─ (for each prompt)
│  ├─ message_start (prompt)
│  └─ message_end (prompt)
│
├─ runLoop() ─────────────┐
│                         │
│  ┌─────────────────────▼─────────────────────┐
│  │ while (hasMoreToolCalls || pendingMsgs) │
│  │   if not firstTurn: turn_start          │
│  │   if pendingMsgs: inject them           │
│  │   streamAssistantResponse()             │
│  │     ├─ message_start (assistant)        │
│  │     ├─ message_update (many)            │
│  │     └─ message_end (assistant)          │
│  │   check tool calls                      │
│  │   if tool calls:                        │
│  │     executeToolCalls()                  │
│  │       ├─ tool_execution_start           │
│  │       ├─ tool_execution_update (nhiều) │
│  │       └─ tool_execution_end             │
│  │       push toolResult messages          │
│  │       check steering after each tool    │
│  │   turn_end                              │
│  │   check steering (nếu có)               │
│  └─────────────────────────────────────────┘
│
├─ check follow-up messages
│  ├─ nếu có: quay lại inner loop (pending = follow-ups)
│  └─ nếu không: break
│
├─ agent_end
└─ stream.end(newMessages)
```

---

## 🧩 Key Functions

### `streamAssistantResponse(...)`

- Apply `config.transformContext` (optional) để prune/inject.
- Apply `config.convertToLlm` để chuyển `AgentMessage[]` → `Message[]` (LLM format).
- Gọi `streamFn` (default `streamSimple`) với `llmContext`.
- Stream events, update `context.messages` với partial assistant message.
- Khi `done`/`error`, lấy final message từ `response.result()`, replace/append vào `context.messages`.
- Return final `AssistantMessage`.

---

### `executeToolCalls(tools, assistantMessage, signal, stream, getSteeringMessages)`

- Lọc `toolCall` từ `assistantMessage.content`.
- Với mỗi tool call:
  - `tool_execution_start`
  - Tìm tool trong `tools` array (by name). Nếu không tìm thấy → error.
  - Validate arguments: `validateToolArguments(tool, toolCall)` (sẽ throw nếu invalid).
  - Gọi `tool.execute(toolCallId, validatedArgs, signal, onUpdate)`.
  - `onUpdate` → emit `tool_execution_update`.
  - Catch errors → tạo result với `isError: true`.
  - `tool_execution_end`
  - Tạo `ToolResultMessage` và push vào `context.messages`, emit `message_start`/`message_end`.
  - Sau mỗi tool, kiểm tra `getSteeringMessages` (nếu có steering, skip các tools còn lại).
- Return `{ toolResults, steeringMessages }`.

---

### `skipToolCall(...)`

Khi steering interrupt, tạo `ToolResultMessage` với text "Skipped due to queued user message." và `isError: true` cho các tools bị bỏ qua.

---

## 🎮 Steering & Follow-up trong Loop

Steering được check:
- Trước mỗi turn (pending messages từ queue).
- Sau mỗi tool execution (`getSteeringMessages`).

Nếu steering messages có mặt:
- Các tool còn lại bị skip.
- Steering messages được inject.
- LLM sẽ phản hồi lại (next turn).

Follow-up được check khi agent sẵn sàng dừng (không còn tool calls, không steering):
- Nếu follow-up messages tồn tại, set `pendingMessages` và tiếp tục inner loop.

---

## 🛑 Termination Conditions

Agent loop dừng khi:
- `message.stopReason` là `'error'` or `'aborted'` → emit `agent_end` và exit.
- Sau khi hết tool calls, không có pending messages (steering/follow-up) → break outer loop, emit `agent_end`.

---

**Lưu ý**: Event stream xử lý rất chi tiết: mỗi assistant message được push như một partial, cập nhật qua `message_update`, và cuối cùng `message_end`. Tool execution cũng có events riêng. Đây là nền tảng cho UI responsive.
