# Checklist cá nhân — Người B: Vận hành & Chi tiết

> **Phạm vi**: Agent Loop + Event Flow + Concepts (Turn, Steering, Compaction, Branching)
> **Deadline**: 12/03 tối — hoàn thành nghiên cứu; 13/03 sáng — sẵn sàng trình bày

---

## Phase 1: Đọc hiểu (14:00 – 17:30)

### Event Flow từ Agent README — ~45 phút
- [ ] Đọc `packages/agent/README.md` (toàn bộ)
- [ ] Hiểu `prompt()` flow — 11 bước:
  - [ ] 1. `agent_start`
  - [ ] 2. `turn_start`
  - [ ] 3. `message_start` (user)
  - [ ] 4. `message_end` (user)
  - [ ] 5. `message_start` (assistant)
  - [ ] 6. `message_update` (streaming)
  - [ ] 7. `message_end` (assistant)
  - [ ] 8. Tool calls: `tool_execution_start` → `update` → `end` → `message_start/end` (toolResult)
  - [ ] 9. `turn_end`
  - [ ] 10. Nếu cần tiếp tục → quay lại bước 5
  - [ ] 11. `agent_end`
- [ ] Hiểu khi nào agent loop tiếp tục vs dừng lại
- [ ] Hiểu `continue()` để resume

### Event Flow từ Extensions.md (chi tiết hơn) — ~50 phút
- [ ] Đọc `packages/coding-agent/docs/extensions.md` — phần events
- [ ] Pre-agent events:
  - [ ] `before_agent_start` — inject message, modify system prompt
  - [ ] `context` — modify messages trước LLM call
  - [ ] `before_provider_request` — inspect/replace payload
- [ ] Agent events: `agent_start`, `turn_start`, `message_*`, `tool_*`, `turn_end`, `agent_end`
- [ ] Session events: `session_start`, `session_before_*`, `session_*`, `session_shutdown`
- [ ] Model events: `model_select`
- [ ] Input event: `input` (trước khi expand skill/template)
- [ ] Hiểu `return { block: true }` — chặn sự kiện
- [ ] Hiểu `return { handled: true }` — xử lý xong, skip agent

### Concepts — ~40 phút
- [ ] **Turn**: Một LLM response + các tool calls đi kèm
- [ ] **Steering vs Follow-up**:
  - [ ] Steering: interrupt trong khi tools đang chạy
  - [ ] Follow-up: chờ agent idle rồi mới chạy
  - [ ] Khi nào dùng cái nào
- [ ] **`transformContext()`**: prune messages, inject external context — chi tiết flow
- [ ] **`convertToLlm()`**: filter custom types, convert AgentMessage → LLM Message — chi tiết
- [ ] **Compaction**: khi nào trigger, cách summarize, giữ lại bao nhiêu messages
  - [ ] Đọc `packages/coding-agent/docs/compaction.md` (nếu có)
- [ ] **Branching**: session tree với `parentId`, tạo branch không cần file mới
  - [ ] Đọc `packages/coding-agent/docs/session.md` — phần branching

### Checkpoint 1 (17:00)
- [ ] Hoàn thành self-quiz (file riêng)
- [ ] Ghi lại ít nhất 3 câu hỏi chưa rõ để hỏi Người A

---

## Phase 2: Source Code Deep Dive (19:00 – 21:00)

### Đọc `agent-loop.ts` (~1.150 dòng) — ~60 phút
- [ ] Tìm và đọc `packages/agent/src/agent-loop.ts`
- [ ] Xác định entry point: `agentLoop()` function signature
- [ ] Xác định `agentLoopContinue()` — khác gì với `agentLoop()`
- [ ] Trace flow cho 1 turn hoàn chỉnh:
  - [ ] Nhận messages → build context → gọi LLM → nhận response
  - [ ] Parse tool calls → execute tools → gửi results lại
  - [ ] Kiểm tra điều kiện dừng vs tiếp tục
- [ ] Tìm nơi `transformContext()` và `convertToLlm()` được gọi
- [ ] Tìm nơi events được emit
- [ ] Hiểu error handling trong loop

### Vẽ Sequence Diagram — ~30 phút
- [ ] Vẽ sequence diagram cho 1 prompt hoàn chỉnh (có tool call)
- [ ] Ghi chú event nào được emit ở đâu
- [ ] Ghi chú extension interception points

### Checkpoint 2 (21:00)
- [ ] Có bản nháp phần trình bày
- [ ] Sequence diagram đã hoàn chỉnh
- [ ] Đã trả lời được: `agentLoop()` vs `agentLoopContinue()`

---

## Phase 3: Chuẩn bị trình bày (21:00 – 22:30)

- [ ] Tham gia Sync Call 15 phút với Người A
- [ ] Thống nhất thuật ngữ tiếng Việt
- [ ] Chuẩn bị slides/notes cho:
  - [ ] Agent Loop — trình bày flow step by step
  - [ ] Event system — bảng tổng hợp các events
  - [ ] Concepts — giải thích Turn, Steering, Compaction, Branching
  - [ ] Sequence diagram — dùng để demo
- [ ] Review lại câu hỏi attendees có thể hỏi (file riêng)

---

## Phase 4: Review & Rehearsal (13/03 sáng)

- [ ] Đọc nhanh phần trình bày của Người A
- [ ] Phát hiện mâu thuẫn / lỗ hổng
- [ ] Chạy thử trình bày 15 phút
- [ ] Sẵn sàng trả lời Q&A phần mình

---

## Tài liệu cần đọc (tổng hợp)

| Ưu tiên | File | Mục đích |
|---------|------|----------|
| 1 | `packages/agent/README.md` | Agent loop, events |
| 2 | `packages/coding-agent/docs/extensions.md` | Extension events chi tiết |
| 3 | `packages/agent/src/agent-loop.ts` | Source code agent loop |
| 4 | `packages/coding-agent/docs/session.md` | Session, branching |
| 5 | `packages/coding-agent/docs/compaction.md` | Compaction chi tiết |
| 6 | `packages/agent/src/agent.ts` | Agent class |
