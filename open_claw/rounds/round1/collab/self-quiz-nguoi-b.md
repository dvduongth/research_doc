# Self Quiz — Người B: Vận hành & Chi tiết

> **Hướng dẫn**: Tự trả lời mỗi câu **không nhìn tài liệu**. Đánh `[x]` nếu trả lời được, `[ ]` nếu cần ôn lại.
> **Mục tiêu**: Hoàn thành trước Checkpoint 1 (17:00 ngày 12/03)
> **Đáp án gợi ý**: [self-quiz-nguoi-b-answers.md](self-quiz-nguoi-b-answers.md)

---

## Event Flow từ Agent README

### Câu hỏi nhận biết (nhớ)
- [ ] Q1: Liệt kê đủ 11 bước trong `prompt()` flow, đúng thứ tự.
- [ ] Q2: Khi agent gọi tool, có bao nhiêu events được emit? Kể tên.
- [ ] Q3: Điều kiện nào khiến agent loop tiếp tục (quay lại bước 5) thay vì kết thúc?
- [ ] Q4: `continue()` dùng khi nào? Khác gì `prompt()`?

### Câu hỏi hiểu (giải thích)
- [ ] Q5: Tại sao `message_start` và `message_end` được emit cho cả user message lẫn assistant message? Ai là consumer của events này?
- [ ] Q6: Giải thích flow khi agent gọi 2 tools liên tiếp — events nào emit, theo thứ tự nào?

---

## Event Flow từ Extensions.md

### Câu hỏi nhận biết
- [ ] Q7: Kể tên 3 pre-agent events. Mỗi event cho phép làm gì?
- [ ] Q8: `before_agent_start` khác `agent_start` ở điểm nào?
- [ ] Q9: Liệt kê các nhóm events: Pre-agent, Agent, Session, Model, Input.
- [ ] Q10: `return { block: true }` trong event handler có tác dụng gì?

### Câu hỏi hiểu
- [ ] Q11: Tại sao cần event `context` tách riêng với `before_agent_start`? Chúng không thể gộp làm 1 được sao?
- [ ] Q12: Event `before_provider_request` cho phép "inspect/replace payload" — cho 1 use case thực tế.
- [ ] Q13: `return { handled: true }` khác gì `return { block: true }`?

---

## Concepts

### Câu hỏi nhận biết
- [ ] Q14: Định nghĩa "Turn" trong context của pi-mono agent.
- [ ] Q15: Phân biệt Steering và Follow-up — cho ví dụ cho từng loại.
- [ ] Q16: Compaction là gì? Khi nào nó được trigger?
- [ ] Q17: Branching hoạt động thế nào? Tại sao dùng `parentId` thay vì tạo file session mới?

### Câu hỏi hiểu
- [ ] Q18: `transformContext()` và `convertToLlm()` — cái nào chạy trước? Tại sao thứ tự quan trọng?
- [ ] Q19: Nếu context window sắp đầy, agent có 2 lựa chọn: compaction hoặc branching. Khi nào nên dùng cái nào?
- [ ] Q20: Giải thích bằng timeline: User gõ prompt → `transformContext()` làm gì → `convertToLlm()` làm gì → LLM nhận gì.

---

## Source Code Deep Dive

### Câu hỏi nhận biết
- [ ] Q21: `agentLoop()` nhận những tham số chính nào?
- [ ] Q22: `agentLoopContinue()` khác `agentLoop()` ở điểm nào? Khi nào dùng?
- [ ] Q23: Trong `agent-loop.ts`, event nào được emit đầu tiên và cuối cùng?

### Câu hỏi vận dụng
- [ ] Q24: Trace 1 prompt cụ thể: User hỏi "đọc file README.md" → Agent dùng tool ReadFile → Trả lời. Liệt kê từng event emit theo thứ tự.
- [ ] Q25: Nếu extension chặn (`block: true`) event `before_provider_request`, chuyện gì xảy ra với agent loop?

---

## Kết quả tự đánh giá

| Mức | Số câu đúng | Đánh giá |
|-----|-------------|----------|
| Tốt | 20-25 | Sẵn sàng trình bày |
| Khá | 15-19 | Ôn lại phần yếu |
| Cần cải thiện | <15 | Đọc lại tài liệu gốc |

**Số câu trả lời được**: ___/25
**Phần cần ôn lại**: ___
