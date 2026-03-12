# prompt() vs continue()
**Round 9: Agent Loop Event Flow**

---

## agent.prompt(input)

**Mục đích**: Bắt đầu một turn mới với user message (hoặc array of messages) mới.

**Luồng**:
- Nếu `isStreaming` → throw error.
- Build `msgs` từ input:
  - Nếu string → tạo `UserMessage` với content text (và optional images).
  - Nếu AgentMessage[] → dùng directly.
- Gọi `_runLoop(msgs)`.

`_runLoop`:
- Tạo `currentContext.messages = [...context.messages, ...msgs]`.
- `newMessages` bắt đầu với `msgs`.
- Vào `agentLoop(messages, context, config, signal, streamFn)`.

`agentLoop`:
- Phát `agent_start`.
- `turn_start`.
- Với mỗi prompt: `message_start` (prompt), `message_end` (prompt).
- Sau đó vào `runLoop()` với `newMessages` chứa prompts.

---

## agent.continue()

**Mục đích**: Tiếp tục từ context hiện tại, không thêm messages mới. Dùng khi:
- Sau tool results (agent tự động continue? Thực tế, trong `executeToolCalls`, sau khi push toolResult messages, agent loop sẽ tiếp tục vì `hasMoreToolCalls` hoặc `pendingMessages` still? Actually, sau tool results, inner loop sẽ tiếp tục nếu assistant có thêm tool calls (không có thì turn_end). Outer loop sẽ check follow-up. `continue()` thường được gọi từ extension hoặc command để tiếp tục sau khi đã inject messages? More commonly, `continue()` is used when the agent was paused and you want to resume, e.g., after a `steer()` queued a message while streaming, the agent automatically calls `continue()`? Actually, `Agent.continue()` is public method, but internal flow: sau khi user steer during streaming, agent sẽ auto-continue? Code trong `agent-loop`: trong `runLoop`, sau `turn_end`, nếu `steeringAfterTools` có, nó set `pendingMessages` và inner loop tiếp tục ngay; không cần gọi `continue()` manually. `continue()` được dùng khi bên ngoài muốn tiếp tục Sau khi đã thêm messages vào context (ví dụ: extension gửi user message và gọi `continue()` để chạy turn). Hoặc khi agent kết thúc với `error`? Hmm.

Từ code `Agent.continue()`:
- Kiểm tra `isStreaming`: nếu đang streaming → throw.
- `messages = this._state.messages`.
- Nếu empty → throw.
- Nếu message cuối assistant → throw (cannot continue from assistant).
- Nếu assistant cuối có tool calls, sau khi push tool results, context kết thúc bằng toolResult, nên `continue()` hợp lệ.
- Nếu user message mới được thêm (steer), context kết thúc bằng user, `continue()` hợp lệ.

Thực tế, `continue()` thường được gọi sau khi một message được thêm vào context (ví dụ: extension gọi `sendUserMessage` với `deliverAs: "followUp"` sẽ queue vào followUpQueue và sau đó `continue()` được gọi? Không, `sendUserMessage` sẽ gọi `steer()` or `followUp()` tùy delivery, và agent sẽ tự động xử lý trong loops. `continue()` có thể được gọi từ command để resume sau khi pause.

Anyway, tôi sẽ mô tả đúng theo code: `continue()` will call `_runLoop(undefined)` (no new messages). Trong `_runLoop` nếu messages undefined, sử dụng `context.messages` hiện tại. Và nếu `context.messages` cuối là assistant, nó sẽ lỗi; nếu là user hoặc toolResult, thì tiếp tục.

---

## So sánh

| Đặc điểm | prompt() | continue() |
|----------|----------|------------|
| Thêm messages mới | Có | Không |
| Messages nguồn gốc | Từ input parameter | Từ `this._state.messages` |
| Context ban đầu | `context.messages` + `msgs` | Chỉ `context.messages` |
| Khi nào dùng | User chat, normal turn | Sau khi đã inject messages (ví dụ steering, follow-up) và muốn tiếp tục; hoặc retry? |
| Lỗi nếu streaming? | Có | Có |
| Lỗi nếu context rỗng? | Không (msgs có) | Có (phải có messages) |
| Lỗi nếu last message là assistant? | Không (msgs mới là user, nên ok) | Có (last message phải là user hoặc toolResult) |

---

**Flow trong code**:

`_runLoop(messages?: AgentMessage[], options?)`:
- Nếu `messages` provided (prompt), `newMessages = [...messages]`, `currentContext.messages = [...context.messages, ...messages]`.
- Nếu `messages` undefined (continue), `newMessages = []`, `currentContext.messages = [...context.messages]` (sao chép).

Sau đó chung `runLoop(currentContext, newMessages, ...)`.

---

**Kết luận**: `prompt()` để bắt đầu với input mới; `continue()` để tiếp tục từ context hiện tại (đã có user/ assistant/ toolResult). Trong hầu hết user-facing trường hợp, `prompt()` được dùng; `continue()` được dùng nội bộ hoặc bởi extensions.
