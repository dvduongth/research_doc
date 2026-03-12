# Round 3: Agent Core - Bộ câu hỏi xác nhận hiểu
**Dựa trên `agent-core-checklist.md`**

---

## ✅ Agent Class & State

**Q1**: Giải thích sự khác biệt giữa `agent.prompt(message)` và `agent.continue()`. Khi nào dùng cái nào?

**Q2**: `AgentState` chứa những trường nào? `isStreaming`, `streamMessage`, `pendingToolCalls` dùng để làm gì?

**Q3**: Làm thế nào để thay đổi model của agent sau khi đã tạo? Gọi `setModel()` có ảnh hưởng đến các messages hiện có không?

**Q4**: Phương thức `steer(message)` và `followUp(message)` khác nhau thế nào về mặt mục đích và thời điểm xử lý trong agent loop?

---

## ✅ Event Loop

**Q5**: Liệt kê đầy đủ sequence của events khi gọi `agent.prompt()`, từ `agent_start` đến `agent_end`. Nhấn mạnh khi nào `turn_end` xảy ra.

**Q6**: Hãy mô tả flow trong `runLoop()` (outer loop vs inner loop). Khi nào outer loop lặp lại?

**Q7**: `transformContext` và `convertToLlm` khác nhau thế nào? Tại sao cần cả hai?

**Q8**: Trong `streamAssistantResponse()`, partial assistant message được push như thế nào vào `context.messages`? Tại sao cần `addedPartial` flag?

---

## ✅ Message Types

**Q9**: Union `AgentMessage` gồm những loại nào? Phân biệt `UserMessage`, `AssistantMessage` (từ pi-ai), `ToolResultMessage`, và các custom messages.

**Q10**: `ToolResultMessage` có những trường bắt buộc nào? `isError` và `details` dùng để làm gì?

**Q11**: `BashExecutionMessage` là gì? Nó khác `ToolResultMessage` ra sao?

**Q12**: Làm sao để thêm custom message type vào `AgentMessage`? (declaration merging)

---

## ✅ Tool System

**Q13**: `AgentTool` interface mở rộng từ `Tool` bằng những gì? Tại sao cần `label` và `execute`?

**Q14**: Trong `executeToolCalls()`, tại sao `validateToolArguments` được gọi trước khi `tool.execute()`? Điều gì xảy ra nếu validation fail?

**Q15**: `AgentToolUpdateCallback` dùng để làm gì? Trong tool execution, khi nào callback này được gọi?

**Q16**: Built-in tools nằm ở đâu? Làm thế nào để override built-in tool trong extensions?

---

## ✅ Steering & Follow-up

**Q17**: Steering mode `"one-at-a-time"` và `"all"` khác nhau thế nào? Hãy cho ví dụ.

**Q18**: Trong `executeToolCalls()`, steering messages được check sau mỗi tool. Nếu steering có mặt, các tools còn lại sẽ bị skip và `skipToolCall()` tạo `ToolResultMessage` với `isError: true` và message là gì?

**Q19**: Follow-up messages được check khi nào? Nếu follow-up có, agent sẽ làm gì tiếp theo?

---

## ✅ SessionManager (Application Layer)

**Q20**: Session file JSONL có những entry type chính nào? Giải thích ý nghĩa của `SessionHeader`, `SessionMessageEntry`, `CompactionEntry`, `BranchSummaryEntry`.

**Q21**: `SessionManager.buildSessionContext()` xử lý compaction và branch summary thế nào? Nó đảm bảo context đúng khi resume từ một branch.

**Q22**: Phương thức `branch(entryId)` và `branchWithSummary(entryId, summary)` khác nhau thế nào? Khi nào dùng cái nào?

**Q23**: Session file lưu ở đâu? Cách đặt tên file? Làm sao để resume một session cụ thể qua CLI?

---

## 🔄 Integration

**Q24**: `Agent` class dùng `agentLoop` như thế nào? `Agent.prompt()` bên trong gọi `agentLoop` với options gì?

**Q25**: Làm thế nào để đăng ký listener nhận `AgentEvent`? Ví dụ: ghi log mỗi khi `tool_execution_end`.

**Q26**: Nếu bạn muốn thêm một custom message type (ví dụ `systemNotification`) vào `AgentMessage`, bạn làm gì? Có cần sửa code `pi-agent-core` không?

---

**Đáp án ngắn**: Hãy trả lời mỗi câu với 1-2 câu tiếng Việt. Nếu chưa chắc, xem lại notes.

---

Sau khi hoàn thành, đánh dấu `[x]` trong `agent-core-checklist.md` và cập nhật `PROGRESS.md` với self-assessment.