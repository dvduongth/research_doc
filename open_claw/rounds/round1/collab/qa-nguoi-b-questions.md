# Câu hỏi Attendees có thể hỏi — Người B

> **Phạm vi**: Agent Loop, Event Flow, Concepts (Turn, Steering, Compaction, Branching)
> Dùng file này để luyện tập. Câu trả lời gợi ý ở [file đáp án](qa-nguoi-b-answers.md).

---

## Nhóm 1: Agent Loop cơ bản

**Q1.** Agent loop khác gì một hàm chat thông thường (gửi message → nhận response)? Tại sao cần "loop"?

**Q2.** Khi agent gọi tool, LLM có "chờ" tool chạy xong không? Hay chạy song song?

**Q3.** Có giới hạn số lần agent loop được lặp (số turns) không? Nếu agent gọi tool vô hạn thì sao?

---

## Nhóm 2: Event System

**Q4.** Tại sao cần hệ thống events phức tạp (11 bước)? Không thể đơn giản hóa thành "gọi LLM → nhận kết quả" được sao?

**Q5.** `before_agent_start` cho phép "inject message, modify system prompt" — cho 1 use case thực tế mà extension cần làm điều này.

**Q6.** Event `context` và `transformContext()` có liên quan gì không? Cái nào chạy trước?

**Q7.** Nếu 2 extensions cùng subscribe event `before_provider_request` và cả 2 đều modify payload, chuyện gì xảy ra?

---

## Nhóm 3: Concepts chi tiết

**Q8.** Giải thích "Turn" bằng ví dụ cụ thể: user hỏi "tạo file hello.py", agent dùng tool write → đó là bao nhiêu turns?

**Q9.** Steering vs Follow-up — trong thực tế khi dùng pi CLI, user trigger 2 cái này bằng cách nào?

**Q10.** Compaction summarize old messages — LLM nào dùng để summarize? Có phải cùng LLM đang chat không?

**Q11.** Khi compaction chạy, user có biết không? Có prompt nào hỏi user trước khi summarize không?

---

## Nhóm 4: Kỹ thuật sâu

**Q12.** `transformContext()` "prune messages" — prune theo tiêu chí gì? FIFO? Theo token count? Theo relevance?

**Q13.** `convertToLlm()` "filter custom types" — custom types nào bị filter? Tại sao không gửi hết cho LLM?

**Q14.** Session tree dùng `parentId` — khi branch, messages cũ có bị duplicate không? Memory overhead thế nào?

**Q15.** `agentLoop()` vs `agentLoopContinue()` — khi nào dùng `continue`? Cho ví dụ cụ thể.

---

## Nhóm 5: Câu hỏi "bẫy" (có thể khó)

**Q16.** Nếu tool execution bị timeout (ví dụ chạy bash command quá 5 phút), agent xử lý thế nào?

**Q17.** Agent loop có thread-safe không? Nếu 2 users dùng cùng 1 agent instance thì sao?

**Q18.** So sánh event model của pi-mono agent với ReAct (Reasoning + Acting) pattern — giống/khác?
