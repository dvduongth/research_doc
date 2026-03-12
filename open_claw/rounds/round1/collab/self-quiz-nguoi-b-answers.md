# Self Quiz + Đáp án gợi ý — Người B: Vận hành & Chi tiết

> Câu hỏi không có đáp án: [self-quiz-nguoi-b.md](self-quiz-nguoi-b.md)

---

## Event Flow từ Agent README

### Câu hỏi nhận biết (nhớ)

**[Q1](#): Liệt kê đủ 11 bước trong `prompt()` flow.**

> 1. `agent_start`
> 2. `turn_start`
> 3. `message_start` (user)
> 4. `message_end` (user)
> 5. `message_start` (assistant)
> 6. `message_update` (streaming — nhiều lần)
> 7. `message_end` (assistant)
> 8. Nếu có tool calls:
>    - `tool_execution_start`
>    - `tool_execution_update` (nếu stream)
>    - `tool_execution_end`
>    - `message_start` + `message_end` (toolResult)
> 9. `turn_end`
> 10. Nếu cần tiếp tục (có tool calls) → quay lại bước 5
> 11. `agent_end`

**[Q2](#): Khi agent gọi tool, bao nhiêu events?**

> 4-5 events per tool call:
> 1. `tool_execution_start` — bắt đầu chạy tool
> 2. `tool_execution_update` — progress (optional, nếu tool stream)
> 3. `tool_execution_end` — tool chạy xong, có result
> 4. `message_start` (toolResult) — bắt đầu message chứa kết quả
> 5. `message_end` (toolResult) — kết thúc message kết quả

**[Q3](#): Điều kiện tiếp tục vs dừng?**

> - **Tiếp tục** (quay bước 5): LLM response chứa tool calls → cần execute tools → gửi results → LLM trả lời tiếp
> - **Dừng** (`agent_end`): LLM response KHÔNG chứa tool calls → đó là response cuối → agent kết thúc
> - Cũng dừng nếu: max turns reached, token budget hết, user interrupt

**[Q4](#): `continue()` dùng khi nào?**

> - Dùng để **resume** agent đã tạm dừng (ví dụ: load lại session cũ, sau steering interrupt)
> - Khác `prompt()`: `prompt()` bắt đầu từ user message mới; `continue()` tiếp tục từ state hiện tại
> - Ví dụ: App crash → reload → `continue()` để resume đúng chỗ đang chạy

### Câu hỏi hiểu (giải thích)

**[Q5](#): Tại sao emit events cho cả user và assistant message?**

> - **Consumer chính**: UI layer (TUI/Web) — cần biết khi nào render message nào
> - **User message events**: UI hiện message user vừa gõ, đánh dấu "đã gửi"
> - **Assistant message events**: UI hiện response streaming realtime
> - **Extensions**: Có thể intercept bất kỳ message nào — ví dụ: log tất cả messages, filter content

**[Q6](#): Flow khi gọi 2 tools liên tiếp?**

> ```
> message_start (assistant) → message_update → message_end (assistant)
>   → tool_execution_start (tool 1)
>   → tool_execution_end (tool 1)
>   → message_start (toolResult 1) → message_end (toolResult 1)
>   → tool_execution_start (tool 2)
>   → tool_execution_end (tool 2)
>   → message_start (toolResult 2) → message_end (toolResult 2)
> → turn_end
> → turn_start (new turn — LLM nhận cả 2 tool results)
> → message_start (assistant) → message_update → message_end (assistant)
> ```
> Tools chạy **tuần tự**, mỗi tool có bộ events riêng.

---

## Event Flow từ Extensions.md

### Câu hỏi nhận biết

**[Q7](#): 3 pre-agent events?**

> 1. **`before_agent_start`**: Inject messages, modify system prompt — chạy TRƯỚC agent loop bắt đầu
> 2. **`context`**: Modify messages trước LLM call — chạy MỖI turn
> 3. **`before_provider_request`**: Inspect/replace LLM payload — chạy ngay trước khi gửi API

**[Q8](#): `before_agent_start` vs `agent_start`?**

> - **`before_agent_start`**: Extension event — chạy TRƯỚC, CÓ THỂ modify (inject message, change prompt)
> - **`agent_start`**: Agent event — chạy SAU, chỉ để **thông báo** agent đã bắt đầu (read-only, không modify)
> - Tương tự pattern: `beforeX` = can modify, `X` = notification

**[Q9](#): 5 nhóm events?**

> 1. **Pre-agent**: `before_agent_start`, `context`, `before_provider_request`
> 2. **Agent**: `agent_start`, `turn_start`, `message_*`, `tool_*`, `turn_end`, `agent_end`
> 3. **Session**: `session_start`, `session_before_*`, `session_*`, `session_shutdown`
> 4. **Model**: `model_select`
> 5. **Input**: `input` (trước khi expand skill/template)

**[Q10](#): `return { block: true }`?**

> - **Chặn sự kiện**: Event không được propagate tiếp, action bị cancel
> - Ví dụ: Extension chặn `before_provider_request` → LLM call KHÔNG xảy ra
> - Dùng cho: safety guardrails, conditional blocking, custom handling

### Câu hỏi hiểu

**[Q11](#): Tại sao `context` tách riêng `before_agent_start`?**

> - **`before_agent_start`**: Chạy 1 lần khi agent bắt đầu — setup ban đầu
> - **`context`**: Chạy MỖI turn — vì context có thể thay đổi giữa các turns
> - Ví dụ: Extension đọc git status → inject vào context. Giữa 2 turns, user có thể commit → git status thay đổi → cần re-inject
> - Không gộp được vì timing khác nhau

**[Q12](#): Use case `before_provider_request`?**

> - **Logging/Audit**: Log toàn bộ payload gửi cho LLM (compliance requirement)
> - **Token counting**: Đếm tokens trước khi gửi, alert nếu quá budget
> - **PII filtering**: Scan payload, redact thông tin nhạy cảm trước khi gửi external API
> - **Model routing**: Thay đổi model dựa trên content (câu hỏi đơn giản → model rẻ)

**[Q13](#): `{ handled: true }` vs `{ block: true }`?**

> - **`{ block: true }`**: Cancel action — sự kiện bị chặn, KHÔNG xảy ra gì
> - **`{ handled: true }`**: "Tôi đã xử lý xong" — skip phần xử lý mặc định, nhưng flow tiếp tục
> - Ví dụ: `input` event + `{ handled: true }` → extension tự handle input, agent KHÔNG chạy prompt
> - Ví dụ: `input` event + `{ block: true }` → input bị cancel hoàn toàn

---

## Concepts

### Câu hỏi nhận biết

**[Q14](#): Định nghĩa "Turn"?**

> 1 Turn = **1 lần LLM response** + **tất cả tool calls đi kèm response đó**
> - Turn bắt đầu: `turn_start`
> - Turn kết thúc: `turn_end`
> - 1 agent session có thể có nhiều turns (mỗi lần LLM cần thêm tool results → turn mới)

**[Q15](#): Steering vs Follow-up?**

> - **Steering**: User gõ **trong khi** agent đang chạy (tool executing) → interrupt giữa chừng
>   - Ví dụ: Agent đang chạy `npm install` (chậm) → User gõ "dừng lại, dùng yarn thay npm"
> - **Follow-up**: User đợi agent **idle** (đã trả lời xong) → gõ prompt mới
>   - Ví dụ: Agent trả lời xong → User gõ "giờ thêm tests cho code vừa viết"

**[Q16](#): Compaction?**

> - **Là gì**: Summarize messages cũ thành 1 message tóm tắt ngắn, giải phóng context window
> - **Trigger khi**: Context window gần đầy (tự động) hoặc user gõ `/compact` (thủ công)
> - **Cách hoạt động**: Giữ messages gần nhất + system prompt, summarize phần còn lại

**[Q17](#): Branching?**

> - Session tree: mỗi message có `id` + `parentId`
> - Branch = tạo message mới với `parentId` trỏ về **điểm rẽ** (không phải message cuối)
> - Không cần file mới — cùng 1 JSONL file, append thêm messages với parentId khác
> - Lợi ích: thử nhiều hướng, dễ so sánh, memory efficient (không copy history)

### Câu hỏi hiểu

**[Q18](#): `transformContext()` hay `convertToLlm()` chạy trước?**

> **`transformContext()` chạy TRƯỚC**, vì:
> 1. `transformContext()`: Prune messages cũ, inject external context → output vẫn là AgentMessage[]
> 2. `convertToLlm()`: Chuyển AgentMessage[] → LLM Message[] (bỏ metadata)
> 3. Nếu đảo: `convertToLlm()` trước → mất metadata → `transformContext()` không biết message nào cần prune

**[Q19](#): Compaction vs Branching — khi nào dùng cái nào?**

> - **Compaction**: Khi muốn **tiếp tục conversation** nhưng context đầy → summarize cũ, giữ mạch
> - **Branching**: Khi muốn **thử hướng khác** từ 1 điểm → giữ nguyên history, tạo nhánh mới
> - Analogy: Compaction = "xóa tin nhắn cũ trong chat"; Branching = "save game rồi thử con đường khác"

**[Q20](#): Timeline chi tiết?**

> ```
> User gõ: "đọc file README.md"
>     ↓
> transformContext():
>   - Giữ messages gần nhất (prune cũ nếu cần)
>   - Inject: system prompt, AGENTS.md content, active skills
>   - Output: AgentMessage[] đã prune + enriched
>     ↓
> convertToLlm():
>   - Bỏ: id, parentId, extension metadata, steering flags
>   - Giữ: role, content, tool_calls, tool_results
>   - Output: LLM Message[] (OpenAI-compatible)
>     ↓
> LLM nhận:
>   [system prompt, ...context, { role: "user", content: "đọc file README.md" }]
> ```

---

## Source Code Deep Dive

### Câu hỏi nhận biết

**[Q21](#): `agentLoop()` parameters?**

> - `messages`: AgentMessage[] — conversation history ban đầu
> - `context`: AgentContext — chứa tools, model, config, session state
> - `config`: AgentConfig — max turns, timeout, streaming options
> (Cần verify exact signature trong source code)

**[Q22](#): `agentLoopContinue()` vs `agentLoop()`?**

> - **`agentLoop(messages, context, config)`**: Bắt đầu mới — tạo context mới từ messages
> - **`agentLoopContinue(context, config)`**: Resume — dùng context CÓ SẴN, không cần messages mới
> - Dùng `continue` khi: reload session, sau steering, sau crash recovery

**[Q23](#): Event đầu tiên và cuối cùng?**

> - Đầu tiên: `agent_start`
> - Cuối cùng: `agent_end`
> - Giữa 2 cái này: tất cả turn/message/tool events

### Câu hỏi vận dụng

**[Q24](#): Trace "đọc file README.md"?**

> ```
> 1. agent_start
> 2. turn_start
> 3. message_start (user: "đọc file README.md")
> 4. message_end (user)
> 5. message_start (assistant: "Tôi sẽ đọc file README.md")
> 6. message_update (streaming text)
> 7. message_end (assistant) — chứa tool_call: ReadFile("README.md")
> 8. tool_execution_start (ReadFile)
> 9. tool_execution_end (ReadFile → file content)
> 10. message_start (toolResult: file content)
> 11. message_end (toolResult)
> 12. turn_end
> --- Có tool call → tiếp tục ---
> 13. turn_start
> 14. message_start (assistant: "Đây là nội dung README.md:...")
> 15. message_update (streaming)
> 16. message_end (assistant) — không có tool_call
> 17. turn_end
> --- Không có tool call → kết thúc ---
> 18. agent_end
> ```

**[Q25](#): Extension block `before_provider_request`?**

> - LLM call **KHÔNG xảy ra** — payload bị chặn trước khi gửi
> - Agent loop sẽ: nhận empty/error response → có thể retry hoặc emit error event
> - Hệ quả: Agent không có response → không có tool calls → `agent_end`
> - Use case hợp lệ: Rate limiting extension, content filter chặn harmful prompts
