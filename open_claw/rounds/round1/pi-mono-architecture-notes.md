# Round 1: Agent Loop - Chi tiết
**Ngày**: 2026-03-12
**Source**: `packages/agent/src/agent-loop.ts`, `packages/agent/src/agent.ts`

---

## 🔄 Event Flow chi tiết

Dựa trên code `agentLoop()` và `streamAssistantResponse()`, đây là đầy đủ sequence:

### 1. Khi gọi `agent.prompt(messages)` hoặc `agent.continue()`

**Phase A: Setup**
- `Agent._runLoop()` được gọi.
- Tạo `AgentContext` với `systemPrompt`, `messages` (current + new), `tools`.
- Tạo `AgentLoopConfig` với:
  - `model`, `reasoning`, `sessionId`
  - `convertToLlm`, `transformContext`
  - `getSteeringMessages`, `getFollowUpMessages`
  - `transport`, `thinkingBudgets`, `onPayload`, `getApiKey`

**Phase B: agentLoop() startup**
```typescript
stream.push({ type: "agent_start" });
stream.push({ type: "turn_start" });
for each prompt:
  stream.push({ type: "message_start", message: prompt });
  stream.push({ type: "message_end", message: prompt });
```
→ Như vậy, user messages mới được emit start/end ngay.

**Phase C: runLoop() - Outer & Inner loops**

```
Outer loop (while true):  // cho follow-up messages
  Inner loop (while hasMoreToolCalls || pendingMessages):
    if not firstTurn:
      push turn_start
    else: firstTurn = false

    // Inject pending messages (steering hoặc follow-up)
    if pendingMessages.length > 0:
      for each msg:
        push message_start/end
        currentContext.messages.push(msg)
        newMessages.push(msg)
      pendingMessages = []

    // Assistant response
    message = await streamAssistantResponse(...)  // ← streaming events diễn ra ở đây
    newMessages.push(message)

    if message.stopReason === "error" or "aborted":
      push turn_end
      push agent_end
      stream.end()
      return

    // Kiểm tra tool calls
    toolCalls = message.content.filter(c => c.type === "toolCall")
    hasMoreToolCalls = toolCalls.length > 0

    toolResults = []
    if hasMoreToolCalls:
      toolExecution = await executeToolCalls(...)
      toolResults.push(...toolExecution.toolResults)
      steeringAfterTools = toolExecution.steeringMessages ?? null
      for result in toolResults:
        currentContext.messages.push(result)
        newMessages.push(result)

    push turn_end (với toolResults)

    // Sau turn, check steering
    if steeringAfterTools?.length > 0:
      pendingMessages = steeringAfterTools
    else:
      pendingMessages = await config.getSteeringMessages() || []

  // Inner loop kết thúc (không còn tool calls, không có pending messages)

  // Check follow-up
  followUp = await config.getFollowUpMessages() || []
  if followUp.length > 0:
    pendingMessages = followUp
    continue  // Outer loop tiếp tục

  break  // Không còn follow-up → thoát

push agent_end
stream.end(newMessages)
```

---

## 🧠 Concepts giải thích

### Turn
- Một **Turn** là một LLM response (assistant message) cùng với tất cả tool calls đi kèm (nếu có).
- Turn bắt đầu bằng `turn_start`, kết thúc bằng `turn_end`.
- Trong một turn, assistant message được stream (`message_start`, `message_update` × N, `message_end`).
- Sau `message_end`, nếu có tool calls, chúng được execute tuần tự.
- Mỗi tool call:
  - `tool_execution_start`
  - `tool_execution_update` (nếu tool stream)
  - `tool_execution_end`
  - Theo sau là `message_start`/`message_end` với `ToolResultMessage`.
- Sau tất cả tools, `turn_end` được phát.

### Steering vs Follow-up

**Steering** (làm trệ hướng):
- User gửi message trong khi agent đang chạy (đang streaming hoặc đang chạy tools).
- Message được queue vào `steeringQueue`.
- Trong `executeToolCalls()`, sau mỗi tool, check `getSteeringMessages()`.
- Nếu steering message có mặt:
  - Các tools còn lại bị **skip** (tạo `skipToolCall()` với `isError: true`, text "Skipped due to queued user message.").
  - Steering messages được inject vào `pendingMessages` và sẽ được xử lý ở turn tiếp theo.
- Steering mode `"one-at-a-time"`: mỗi turn chỉ xử lý 1 steering message, các còn lại chờ.
- Steering mode `"all"`: tất cả steering messages được xử lý cùng lúc.

**Follow-up** (tiếp theo):
- Message được queue vào `followUpQueue` sau khi agent kết thúc turn (assistant message không còn tool calls).
- Chỉ được check **sau khi** inner loop kết thúc (không còn tool calls, không có pending messages).
- Nếu follow-up có, nó được inject và outer loop tiếp tục (tạo turn mới).
- Follow-up mode tương tự: `"one-at-a-time"` hoặc `"all"`.

**Tại sao cần phân biệt?**
- Steering: người dùng muốn thay đổi hướng trước khi agent hoàn thành công việc. Có thể interrupt.
- Follow-up: người dùng muốn tiếp tục/hỏi thêm sau khi agent đã trả lời xong.

### transformContext()
- Hook được gọi **trước** mỗi lần gọi LLM (trong `streamAssistantResponse`).
- Input: `AgentMessage[]` (toàn bộ context hiện tại), có thể prune, reorder, inject external data.
- Output: `AgentMessage[]` mới (hoặc undefined để giữ nguyên).
- Ví dụ: context compaction (summary), inject retrieved docs, filter sensitive messages.

### convertToLlm()
- Chuyển `AgentMessage[]` → `Message[]` (llm-compatible) cho provider.
- Default: giữ lại `user`, `assistant`, `toolResult`; convert attachments (images) sang format của provider.
- Có thể override để giữ custom types nếu provider hỗ trợ (vd: Claude's thinking).

### Compaction
- Không nằm trong agent loop code, mà nằm ở SessionManager (application layer).
- Compaction tạo summary message và old messages bị loại bỏ khi build context.
- Agent loop không biết compaction; nó chỉ nhận messages đã được SessionManager chuẩn bị.

### Branching
- Cũng nằm ở SessionManager (application).
- Branch tạo entry mới với `parentId` trỏ vào entry trước đó.
- Không tạo file mới; cùng session file.
- Resume từ branch: SessionManager.loadContextFromEntry(entryId) sẽ build context từ parent chain.

---

## 📊 Event Types đầy đủ

Theo `AgentEvent` type và code:

| Type | Khi nào phát | Payload | Ghi chú |
|------|--------------|---------|---------|
| `agent_start` | Bắt đầu agent run | `{}` | |
| `turn_start` | Bắt đầu một turn (có thể có pending messages) | `{}` | |
| `message_start` | Một message (user/assistant/toolResult) bắt đầu | `{ message: AgentMessage }` | |
| `message_update` | Assistant message đang stream (text/thinking/toolCall delta) | `{ message: AssistantMessage, assistantMessageEvent: StreamEvent }` | `assistantMessageEvent` chứa delta |
| `message_end` | Một message kết thúc | `{ message: AgentMessage }` | |
| `tool_execution_start` | Bắt đầu execute một tool call | `{ toolCallId, toolName, args }` | |
| `tool_execution_update` | Tool đang stream progress | `{ toolCallId, toolName, args, partialResult }` | Nếu tool hỗ trợ onUpdate |
| `tool_execution_end` | Tool execute xong | `{ toolCallId, toolName, result, isError }` | |
| `turn_end` | Kết thúc một turn (sau tất cả tools) | `{ message: AssistantMessage, toolResults: ToolResultMessage[] }` | |
| `agent_end` | Agent kết thúc hoàn toàn | `{ messages: AgentMessage[] }` | stream.end() với messages |

**Lưu ý**: `message_start`/`end` cho user messages được phát ngay trong `agentLoop` trước khi streaming assistant. `tool_execution_start`/`end`/`update` đi kèm với `message_start`/`end` cho toolResult messages.

---

## 🎯 agentLoop vs agentLoopContinue

- **agentLoop**: Nhận `prompts: AgentMessage[]` (user messages mới). Serialize:
  - `agent_start` → `turn_start` → (message_start/end × prompts) → runLoop.

- **agentLoopContinue**: Không có prompts mới. Context phải kết thúc bằng `user` hoặc `toolResult`. Phát:
  - `agent_start` → `turn_start` → runLoop.

Cả hai đều dùng chung `runLoop()`.

---

## 🛠️ Tool Execution Details

**Flow trong `executeToolCalls()`**:

1. Lấy tất cả `toolCall` từ assistant message.
2. Với mỗi toolCall (theo thứ tự):
   - `tool_execution_start` (stream)
   - Tìm tool trong `tools` array.
   - `validateToolArguments(tool, toolCall)`: kiểm tra args khớp schema.
   - `await tool.execute(toolCall.id, validatedArgs, signal, onUpdate)`.
   - Nếu error: tạo `AgentToolResult` với text error, `isError=true`.
   - `tool_execution_end` (stream).
   - Tạo `ToolResultMessage` (role `toolResult`) và push vào context/newMessages.
   - `message_start`/`message_end` cho toolResult.
   - **Ngay sau tool execution xong**, check `getSteeringMessages()`:
     - Nếu có steering → skip remaining tools, set `steeringMessages`.
   - Tiếp tục tool tiếp theo (nếu không có steering).

**Skip logic**:
- Nếu steering message được queued giữa các tools, `skipToolCall()` tạo:
  - `tool_execution_start`
  - `tool_execution_end` với result text "Skipped due to queued user message." và `isError=true`
  - `message_start`/`message_end` với toolResult.
- Điều này đảm bảo assistant nhận được tool result cho tất cả các tool calls (kể cả bị skip).

---

## 🔄 Outer vs Inner Loop

**Inner loop** (`while (hasMoreToolCalls || pendingMessages.length > 0)`):
- Xử lý lần lượt:
  1. Inject pending messages (steering từ trước hoặc follow-up đã chuyển thành pending).
  2. Stream assistant response → assistant message.
  3. Execute tất cả tool calls trong message đó (tuần tự).
  4. push `turn_end`.
  5. Lấy steering messages mới → set `pendingMessages` nếu có.
- Inner loop kết thúc khi:
  - Assistant message không có tool calls (`hasMoreToolCalls=false`)
  - Và không có pending messages.

**Outer loop**:
- Sau inner loop kết thúc, check follow-up messages.
- Nếu có follow-up → đặt vào `pendingMessages` và `continue` (outer loop lặp lại, inner loop sẽ xử lý).
- Nếu không có follow-up → `break`, kết thúc agent run.

**Ví dụ**:
- Turn 1: assistant có 2 tool calls → cả hai executed.
- Sau turn 1, follow-up có → pendingMessages = follow-up, outer loop tiếp tục.
- Turn 2: Assistant không có tools → inner loop kết thúc.
- Không còn follow-up → agent_end.

---

## 📌 State Management trong Agent class

`AgentState`:
- `systemPrompt`: system prompt string.
- `model`: Model instance.
- `thinkingLevel`: "off" | "minimal" | ...
- `tools`: `AgentTool[]`.
- `messages`: `AgentMessage[]` (toàn bộ conversation).
- `isStreaming`: boolean.
- `streamMessage`: partial assistant message hiện tại.
- `pendingToolCalls`: Set of toolCallId đang chạy.
- `error`: lỗi nếu có.

**Queues**:
- `steeringQueue`: message đang chờ xử lý (interrupt).
- `followUpQueue`: message chờ sau khi agent idle.

**Mode**:
- `steeringMode`: `"all"` hoặc `"one-at-a-time"`.
- `followUpMode`: tương tự.

**Methods**:
- `steer(msg)`: push vào steeringQueue.
- `followUp(msg)`: push vào followUpQueue.
- `dequeueSteeringMessages()`/`dequeueFollowUpMessages()`: tuân theo mode.
- `abort()`: hủy request.

**Event subscription**:
- `subscribe(fn)`: listener nhận `AgentEvent`.

---

## 🎪 Event Summary theo use case

### Basic conversation (no tools)
1. `agent_start`
2. `turn_start`
3. `message_start` (user)
4. `message_end` (user)
5. `message_start` (assistant) + `message_update` × N (streaming)
6. `message_end` (assistant)
7. `turn_end`
8. `agent_end`

### With tools (1 tool)
1-6. Tương tự đến `message_end` (assistant, có toolCall)
7. `tool_execution_start`
8. `tool_execution_end` (có thể có `tool_execution_update`)
9. `message_start` (toolResult)
10. `message_end` (toolResult)
11. `turn_end`
12. `agent_end` (nếu assistant không có thêm tool calls)

### With tools + steering
Sau bước tool execution, trước `turn_end`:
- Check steering → nếu có:
  - Skip remaining tools (nếu assistant có nhiều tool calls).
  - Set `pendingMessages = steering`.
  - Inner loop tiếp tục với pendingMessages → turn mới.
- `turn_end` vẫn được phát cho turn hiện tại.

### With follow-up
Sau `agent_end`:
- Check follow-up → nếu có:
  - Outer loop tiếp tục, pendingMessages = follow-up.
  - Inner loop chạy turn mới (assistant respond to follow-up).
  - Có thể lặp lại nhiều lần.

---

## 📖 Cross-reference với Extensions.md

Extensions.md mô tả events tương tự nhưng có thêm:

- **Pre-agent events**: `before_agent_start`, `context`, `before_provider_request`.
- **Model events**: `model_select`.
- **Input event**: `input` (trước khi expand skill/template).
- **Session events**: `session_start`, `session_before_*`, `session_*`, `session_shutdown`.

Những events này được phát bởi các thành phần application layer (coding-agent), không phải agent-core.

Agent-core chỉ phát các event trong danh sách trên (agent_start, turn_start, message_*, tool_*, turn_end, agent_end).

---

**Đã tóm tắt đủ cho Checklist Agent Loop** (Event Flow và Concepts). Có thể đánh dấu [x] trong checklist.
