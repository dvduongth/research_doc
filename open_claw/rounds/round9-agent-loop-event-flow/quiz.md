# Quiz: Agent Loop Event Flow (Round 9)

---

## Câu 1: Khởi tạo và luồng chính

**Q1:** Khi gọi `agent.prompt(input)`, phương thức nào trong `Agent` được gọi đầu tiên để xử lý luồng?
- A. `agentLoop()`
- B. `_runLoop(msgs)`
- C. `streamAssistantResponse()`
- D. `runLoop()`

**Q2:** Phát biểu nào đúng về `_runLoop(messages?)`?
- A. Nếu `messages` được cung cấp, nó sẽ xem như `prompt()`, ngược lại là `continue()`.
- B. Luôn tạo `newMessages` mới từ `context.messages`.
- C. Luôn phát `turn_start` ngay cả cho turn đầu tiên.
- D. Không bao giờ xử lý `context.messages`.

**Q3:** Sự khác biệt chính giữa `agent.prompt(input)` và `agent.continue()` là gì?
- A. `prompt()` thêm messages mới, `continue()` dùng context hiện tại.
- B. `continue()` có thể chạy khi đang streaming, `prompt()` không.
- C. `prompt()` luôn gọi `agentLoopContinue()`.
- D. `continue()` yêu cầu `context.messages` rỗng.

---

## Câu 2: Outer vs Inner Loop

**Q4:** Khi nào outer loop lặp lại sau khi inner loop kết thúc?
- A. Khi có `pendingMessages` (steering) trong inner loop.
- B. Khi có follow-up messages sau khi inner loop xong.
- C. Khi assistant có tool calls.
- D. Khi user gửi message mới.

**Q5:** Điều kiện lặp của inner loop là gì?
- A. `hasMoreToolCalls && pendingMessages.length > 0`
- B. `hasMoreToolCalls || pendingMessages.length > 0`
- C. `pendingMessages.length > 0`
- D. `hasMoreToolCalls`

**Q6:** Khi nào `turn_start` được phát?
- A. Luôn phát ở mỗi turn, kể cả turn đầu.
- B. Chỉ phát cho turn thứ hai trở đi.
- C. Chỉ phát khi có seguence.
- D. Không bao giờ phát.

---

## Câu 3: Event Types

**Q7:** Event nào được phát **ngay sau** user prompt được inject vào context?
- A. `message_start`
- B. `message_update`
- C. `turn_start`
- D. `agent_start`

**Q8:** Trong event `message_update`, payload chứa gì?
- A. Chỉ `message` (AssistantMessage partial).
- B. Chỉ `assistantMessageEvent` (raw delta).
- C. Cả `message` và `assistantMessageEvent`.
- D. Không có payload.

**Q9:** Event `turn_end` phát khi nào?
- A. Ngay sau khi assistant message kết thúc và các tool calls đã xử lý xong.
- B. Trước khi assistant message bắt đầu.
- C. Khi agent bắt đầu.
- D. Khi có error.

**Q10:** Event nào có thể được dùng để biết provider request sắp gửi?
- A. `before_provider_request`
- B. `context`
- C. `turn_start`
- D. `tool_execution_start`

**Q11:** Event `context` trả về giá trị gì?
- A. Không có gì, chỉ phát thông tin.
- B. Có thể trả về `{ messages?: AgentMessage[] }` để sửa messages.
- C. Luôn trả về `{ abort: boolean }`.
- D. Không áp dụng.

---

## Câu 4: Tool Execution

**Q12:** Khi assistant có nhiều tool calls, chúng được thực thi như thế nào?
- A. Song song (parallel).
- B. Từng cái một (sequential).
- C. Chỉ cái đầu tiên, còn lại bỏ.
- D. Tùy cấu hình.

**Q13:** Trong `executeToolCalls()`, nếu `getSteeringMessages()` trả về messages sau một tool, điều gì xảy ra?
- A. Các tools còn lại bị bỏ qua.
- B. Các tools còn lại vẫn chạy.
- C. Agent dừng ngay lập tức với error.
- D. Không có effect.

**Q14:** Function `skipToolCall()` dùng để làm gì?
- A. Bỏ qua tool và không tạo result.
- B. Tạo `ToolResultMessage` với nội dung "Skipped due to queued user message." và phát events tương ứng.
- C. Chỉ log warning.
- D. Thực thi tool nhưng với args rỗng.

**Q15:** Tool execution errors được xử lý thế nào?
- A. Lao toàn bộ agent run.
- B. Được catch, tạo `ToolResultMessage` với `isError = true`.
- C. Bị ignore.
- D. Hỏi lại user.

---

## Câu 5: Steering & Follow-up

**Q16:** `steer()` và `followUp()` khác nhau ở điểm nào chính?
- A. Steering ngắt quãng tức thời, follow-up chờ agent idle.
- B. Follow-up ngắt quãng, steering chờ idle.
- C. Chỉ khác nhau về tên.
- D. Steering chỉ dùng cho tools, follow-up cho user.

**Q17:** Khi nào agent kiểm tra steering messages?
- A. Trong `executeToolCalls` sau mỗi tool, và sau `turn_end` trước assistant response tiếp theo.
- B. Chỉ ở đầu mỗi turn.
- C. Chỉ sau khi agent kết thúc.
- D. Mỗi khi user gửi tin nhắn.

**Q18:** Follow-up messages được kiểm tra khi nào?
- A. Sau khi inner loop kết thúc (không còn tools, không pending).
- B. Trong mỗi turn.
- C. Trước mỗi tool.
- D. Khi agent đang streaming.

**Q19:** Mode `"all"` của steering/follow-up có nghĩa là gì?
- A. Dequeue tất cả messages queued.
- B. Chỉ dequeue một message.
- C. Không bao giờ dequeue.
- D. Dequeue theo thứ tự ngược.

---

## Câu 6: State & Transformation

**Q20:** `transformContext` được gọi khi nào và để làm gì?
- A. Sau mỗi turn để prune messages.
- B. Trước mỗi LLM call để sửa `AgentMessage[]` (ví dụ: inject context, prune).
- C. Sau tool execution để format results.
- D. Trong `convertToLlm` để convert types.

**Q21:** `convertToLlm` mặc định làm gì với custom message types (`customType`)?
- A. Giữ nguyên.
- B. Chuyển thành text.
- C. Filter bỏ (không đưa vào LLM messages).
- D. Lỗi.

**Q22:** Field `pendingToolCalls` trong `AgentState` dùng để làm gì?
- A. Theo dõi set các `toolCallId` đang executing.
- B. Lưu messages chờ xử lý.
- C. Lưu tool calls cần thực thi.
- D. Lưu results của tools.

---

## Câu 7: Error, Abort, và Completion

**Q23:** Khi `agent.abort()` được gọi, signal như thế nào?
- A. `signal.aborted` đặt là true.
- B. `signal` bị dispose.
- C. Không có effect.
- D. Chỉ dừng tools.

**Q24:** Nếu LLM stream gặp lỗi (network), ` Agent._runLoop` sẽ:
- A. Bỏ qua và tiếp tục.
- B. Catch và tạo assistant message với `stopReason="error"`.
- C. Thử lại tự động.
- D. Gọi `agent.reset()`.

**Q25:** Tool execution error sẽ:
- A. Dừng toàn bộ agent run.
- B. Đưa vào `ToolResultMessage` với `isError=true` và agent tiếp tục.
- C. Bị swallow và không có thông báo.
- D. Yêu cầu user xác nhận.

---

## Câu 8: Compaction & Branching

**Q26:** Compaction và branching được xử lý ở lớp nào?
- A. Trong `Agent` class.
- B. Trong `AgentLoop`.
- C. Ở Application layer (SessionManager).
- D. Trong `EventStream`.

**Q27:** Khi session compact, agent nhận context như thế nào?
- A. Nhận tất cả messages cũ.
- B. Nhận một summary message thay vì các messages cũ.
- C. Bị drop messages.
- D. Compaction không ảnh hưởng agent.

**Q28:** Branching cho phép:
- A. Cùng một session file có nhiều nhánh lịch sử.
- B. Chỉ một nhánh duy nhất.
- C. Tạo file mới mỗi lần.
- D. Không thể điều hướng.

---

## Câu 9: Diagram/Flow Hiểu đúng

**Q29:** Trong sequence diagram của `prompt()`, sau khi `message_end` của assistant (có tool calls), luồng đi đến:
- A. `turn_end` rồi tiếp tục inner loop.
- B. `agent_end` ngay.
- C. `turn_start` mới.
- D. `context` event.

**Q30:** Khi nào `agent_end` được phát?
- A. Sau khi inner loop kết thúc và không có follow-up.
- B. Sau mỗi turn.
- C. Khi có tool calls.
- D. Khi user disconnect.

---

## Câu 10: Tổng hợp

**Q31:** Khi nào `firstTurn` được set về false?
- A. Ở đầu `agentLoop`, trước khi phát turn đầu.
- B. Trong inner loop, nếu `firstTurn` đang true.
- C. Sau `agent_end`.
- D. Trong `streamAssistantResponse`.

**Q32:** `pendingMessages` trong inner loop thường chứa gì?
- A. User prompts mới.
- B. Steering messages hoặc follow-up messages.
- C. Tool results.
- D. Assistant messages.

**Q33:** Sau `turn_end`, nếu không có steering, agent sẽ lấy gì cho `pendingMessages`?
- A. `getSteeringMessages()`.
- B. `getFollowUpMessages()`.
- C. `context.messages`.
- D. Không có gì.

**Q34:** Nếu `hasMoreToolCalls` true và `pendingMessages` cũng >0, inner loop sẽ làm gì?
- A. Ưu tiên pendingMessages (inject trước assistant response).
- B. Thực thi tools trước.
- C. Bỏ qua cả hai.
- D. Lỗi.

**Q35:** Trong `_runLoop`, sau khi stream kết thúc, code có xử lý `partial` chưa finalized. Điều kiện nào để throw lỗi?
- A. Partial rỗng hoặc chỉ chứa content rỗng và `signal.aborted`.
- B. Partial có text.
- C. Bất kỳ partial nào.
- D. Chỉ khi có tool calls.

---

## Câu 11: Message Flow

**Q36:** Thứ tự đúng của events cho một user prompt **không** có tools là gì?
- A. agent_start → turn_start → message_start(user) → message_end(user) → message_start(assistant) → message_update xN → message_end(assistant) → turn_end → agent_end
- B. agent_start → message_start(user) → message_end(user) → message_start(assistant) → turn_start → message_end(assistant) → turn_end → agent_end
- C. agent_start → turn_start → message_start(user) → message_end(user) → message_start(assistant) → message_end(assistant) → turn_end → agent_end (không có message_update vì không stream?)
- D. agent_start → message_start(user) → turn_start → message_end(user) → ...

**Q37:** Khi streaming, event `message_update` được phát:
- A. Chỉ khi có text_delta.
- B. Cho bất kỳ delta nào (text, thinking, toolCall).
- C. Chỉ khi toolCall delta.
- D. Chỉ khi thinking delta.

**Q38:** Assistant message có tool call sẽ có content chứa:
- A. Chỉ text.
- B. Chỉ toolCall objects.
- C. Có thể kết hợp text và toolCall.
- D. Chỉ thinking.

---

## Câu 12: Context & Messages

**Q39:** `currentContext.messages` trong `agentLoop` là gì?
- A. Chỉ messages mới từ input.
- B. Toàn bộ conversation history (context.messages + msgs).
- C. Chỉ assistant messages.
- D. Chỉ tool results.

**Q40:** `newMessages` được dùng để:
- A. Thay thế context.
- B. Lưu các message mới được tạo ra trong turn này (prompts, assistant, toolResults).
- C. Lưu tất cả messages.
- D. Không dùng.

---

**Kết thúc quiz.** Đáp án đúng sẽ được cung cấp sau. 🎓
