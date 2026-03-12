# Câu hỏi Attendees + Gợi ý trả lời — Người B

> **Phạm vi**: Agent Loop, Event Flow, Concepts
> Câu hỏi không có đáp án: xem [file câu hỏi](qa-nguoi-b-questions.md)

---

## Nhóm 1: Agent Loop cơ bản

**Q1. Agent loop khác gì chat thông thường? Tại sao cần "loop"?**

> **Gợi ý**:
> - Chat thông thường: User → LLM → Response. **1 lượt, xong.**
> - Agent loop: User → LLM → "Tôi cần đọc file" → Tool chạy → Kết quả → LLM → "Tôi cần chạy lệnh" → Tool chạy → … → Response cuối
> - **Cần loop vì**: LLM không thể tự đọc file/chạy lệnh — cần tool execution, và sau mỗi tool result, LLM có thể quyết định dùng thêm tool khác
> - Ví dụ đời thường: Như bác sĩ khám bệnh — hỏi triệu chứng → yêu cầu xét nghiệm → đọc kết quả → yêu cầu thêm xét nghiệm → ... → kê đơn

**Q2. LLM có chờ tool chạy xong không?**

> **Gợi ý**: **Có, chờ tuần tự**. Trong pi-mono:
> - LLM gửi tool call request → Agent execute tool → Nhận result → Gửi lại LLM
> - LLM CÓ THỂ request nhiều tool calls cùng lúc, nhưng agent execute chúng tuần tự (sequential)
> - Lý do: đảm bảo consistency, tool B có thể phụ thuộc kết quả tool A

**Q3. Giới hạn số turns?**

> **Gợi ý**: Cần verify trong source code (`agent-loop.ts`). Thông thường có:
> - Max turns config (ví dụ: 50 turns mặc định)
> - Token budget — nếu context window gần đầy, trigger compaction hoặc dừng
> - User có thể interrupt (Steering)
> - Nếu chưa chắc con số cụ thể, nói: "Có giới hạn, cần verify config mặc định"

---

## Nhóm 2: Event System

**Q4. Tại sao events phức tạp? Không đơn giản hóa được?**

> **Gợi ý**:
> - **Cho UI**: `message_update` (streaming) cho phép hiện text realtime, không đợi hết
> - **Cho Extensions**: Cần hook vào đúng thời điểm (trước LLM call, sau tool call, v.v.)
> - **Cho Debugging**: Log chi tiết từng bước giúp debug khi agent hành xử lạ
> - **Nếu đơn giản hóa**: Mất khả năng customize → extensions không thể modify behavior → pi-mono thành CLI cứng nhắc
>
> Tóm tắt: Phức tạp cho developer nhưng cần thiết cho flexibility

**Q5. Use case cho `before_agent_start` inject message?**

> **Gợi ý**: Ví dụ thực tế:
> - **Auto-context**: Extension đọc `.git/HEAD` và inject "Bạn đang ở branch `feature/login`" vào system prompt
> - **Safety guardrails**: Inject "Không bao giờ xóa file production" vào system prompt
> - **Team conventions**: Inject "Dùng tabs, không dùng spaces. Follow ESLint config."

**Q6. Event `context` vs `transformContext()`?**

> **Gợi ý**:
> - `transformContext()` là internal function trong agent core — chạy tự động
> - Event `context` cho phép extension CAN THIỆP vào quá trình này
> - Flow: `transformContext()` chạy → emit event `context` → extension có thể modify → kết quả cuối gửi cho LLM
> - Thứ tự: `transformContext()` trước, event `context` cho phép extension thay đổi kết quả

**Q7. 2 extensions cùng modify payload?**

> **Gợi ý**: Extensions chạy theo thứ tự đăng ký (registration order). Extension thứ 2 nhận payload đã bị modify bởi extension thứ 1. Đây là pipeline pattern — giống middleware trong Express.js. Rủi ro: 2 extensions conflict → kết quả không mong muốn. Pi-mono không có cơ chế conflict resolution.

---

## Nhóm 3: Concepts chi tiết

**Q8. Ví dụ "Turn" cụ thể?**

> **Gợi ý**: User hỏi "tạo file hello.py":
> - **Turn 1**: LLM response: "Tôi sẽ tạo file hello.py" + tool call `writeFile("hello.py", "print('hello')")`
> - Tool execution (không tính turn)
> - **Turn 2**: LLM response: "Đã tạo xong file hello.py với nội dung..."
>
> → **2 turns**. Turn = 1 LLM response (có thể kèm tool calls). Tool execution nằm giữa 2 turns.

**Q9. Steering vs Follow-up — user trigger thế nào?**

> **Gợi ý**:
> - **Steering**: User gõ text **trong khi** agent đang chạy (tool đang execute) → interrupt, agent nhận input mới giữa chừng
> - **Follow-up**: User đợi agent trả lời xong (idle) → gõ prompt mới → agent chạy prompt mới
> - Trong CLI: Steering = gõ khi thấy spinner/loading; Follow-up = gõ khi thấy prompt `>`

**Q10. LLM nào dùng để summarize trong compaction?**

> **Gợi ý**: Cần verify, nhưng thường là **cùng LLM đang chat** hoặc model nhỏ hơn (cheaper). Compaction prompt thường đơn giản: "Summarize this conversation, keeping key decisions and context." Dùng model nhỏ để tiết kiệm tokens nếu có config.

**Q11. User có biết khi compaction chạy không?**

> **Gợi ý**: Compaction có thể chạy tự động (khi context gần đầy) hoặc manual (user gõ `/compact`). Khi tự động:
> - Agent emit event → UI có thể hiện thông báo
> - Nhưng không hỏi user permission trước — transparent process
> - Sau compaction, user có thể thấy "conversation has been compacted"

---

## Nhóm 4: Kỹ thuật sâu

**Q12. `transformContext()` prune theo tiêu chí gì?**

> **Gợi ý**: Cần verify source code. Thông thường:
> - **Token-based**: Đếm tokens, giữ messages gần nhất, prune cũ nhất
> - **System prompt always kept**: System prompt không bao giờ bị prune
> - **Tool results có thể truncate**: Tool output dài có thể bị cắt
> - Không phải relevance-based (quá đắt để compute)

**Q13. Custom types bị filter bởi `convertToLlm()`?**

> **Gợi ý**:
> - `AgentMessage` có thể chứa metadata, internal state, extension data — LLM không hiểu
> - `convertToLlm()` giữ lại: role, content, tool_calls, tool_results
> - Filter bỏ: internal IDs, parent references, extension metadata, steering flags
> - Lý do: LLM chỉ hiểu format chuẩn (OpenAI-compatible messages)

**Q14. Branching — messages cũ có duplicate không?**

> **Gợi ý**: **Không duplicate**. Nhờ tree structure:
> - Messages gốc giữ nguyên
> - Branch mới chỉ tạo node mới với `parentId` trỏ về điểm rẽ
> - Khi load branch: traverse từ root → parentId chain → đến leaf
> - Memory efficient — chỉ store diff, không copy toàn bộ history

**Q15. `agentLoop()` vs `agentLoopContinue()`?**

> **Gợi ý**:
> - `agentLoop(messages, context, config)`: Bắt đầu mới — nhận messages ban đầu, tạo context mới
> - `agentLoopContinue(context, config)`: Resume — dùng context có sẵn (ví dụ: sau khi load session, hoặc sau steering interrupt)
> - Ví dụ: User mở lại session cũ → `agentLoopContinue()` thay vì `agentLoop()`

---

## Nhóm 5: Câu hỏi "bẫy"

**Q16. Tool execution timeout?**

> **Gợi ý**: Cần verify source code. Dự kiến:
> - Có timeout configurable per tool
> - Khi timeout: tool trả về error result → LLM nhận error → quyết định retry hoặc báo lỗi
> - Bash tool thường có timeout riêng (ví dụ: 120s)
> - Nếu chưa chắc, nói rõ: "Cần kiểm tra implementation cụ thể"

**Q17. Thread-safe? 2 users cùng 1 instance?**

> **Gợi ý**:
> - Agent instance là **stateful** — mỗi instance giữ state riêng
> - **Không nên** share 1 instance giữa 2 users
> - Đúng cách: tạo instance riêng cho mỗi user/session
> - `createAgentSession()` tạo session mới → state độc lập

**Q18. Pi-mono vs ReAct pattern?**

> **Gợi ý**:
> - **Giống**: Cả hai đều: Observe → Think → Act → Observe loop
> - **Khác**:
>   - ReAct: Pattern trừu tượng, không quy định implementation
>   - Pi-mono: Implementation cụ thể với event system, extension hooks, session management
>   - ReAct thường có explicit "Thought" step; Pi-mono để LLM tự quyết (implicit reasoning)
>   - Pi-mono thêm: Steering, Compaction, Branching — không có trong ReAct paper gốc
