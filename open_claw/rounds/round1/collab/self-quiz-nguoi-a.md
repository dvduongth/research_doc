# Self Quiz — Người A: Nền tảng & Kết nối

> **Hướng dẫn**: Tự trả lời mỗi câu **không nhìn tài liệu**. Đánh `[x]` nếu trả lời được, `[ ]` nếu cần ôn lại.
> **Mục tiêu**: Hoàn thành trước Checkpoint 1 (17:00 ngày 12/03)
> **Đáp án gợi ý**: [self-quiz-nguoi-a-answers.md](self-quiz-nguoi-a-answers.md)

---

## Tier 1: AI Layer (`pi-ai`)

### Câu hỏi nhận biết (nhớ)
- [ ] Q1: Package `pi-ai` giải quyết vấn đề gì? Tại sao không gọi thẳng API của từng provider?
- [ ] Q2: Kể tên ít nhất 5 LLM providers mà `pi-ai` hỗ trợ.
- [ ] Q3: `ModelRegistry` dùng để làm gì? Nó khác gì với Provider Registry?
- [ ] Q4: Hàm `getModel()` nhận tham số gì và trả về gì?

### Câu hỏi hiểu (giải thích)
- [ ] Q5: Giải thích bằng ví dụ đời thường tại sao cần "unified API" cho nhiều providers.
- [ ] Q6: Nếu muốn thêm 1 provider mới (ví dụ: DeepSeek), cần làm gì ở tầng `pi-ai`?

### Câu hỏi vận dụng
- [ ] Q7: Trong code SDK example `02-custom-model.ts`, model được chọn như thế nào? Có thể override per-session không?

---

## Tier 2: Agent Core (`pi-agent-core`)

### Câu hỏi nhận biết
- [ ] Q8: `AgentMessage` và `LLM Message` khác nhau như thế nào? Cho 1 ví dụ cụ thể.
- [ ] Q9: `convertToLlm()` được gọi ở đâu trong flow và làm gì?
- [ ] Q10: `transformContext()` được gọi ở đâu và mục đích là gì?

### Câu hỏi hiểu
- [ ] Q11: Tại sao Agent cần state management? Nếu không có, chuyện gì xảy ra?
- [ ] Q12: Event streaming phục vụ ai? Tại sao không đợi response hoàn chỉnh rồi mới gửi?

### Câu hỏi vận dụng
- [ ] Q13: Nếu bạn viết 1 tool mới cho agent, tool đó nhận input và trả output ở format nào?

---

## Tier 3: CLI/Application Layer (`pi-coding-agent`)

### Câu hỏi nhận biết
- [ ] Q14: ResourceLoader load resources theo thứ tự nào? (5 bước)
- [ ] Q15: Session được lưu ở format nào? Giải thích cấu trúc `id` + `parentId`.
- [ ] Q16: Commands (/) system hoạt động như thế nào?

### Câu hỏi hiểu
- [ ] Q17: Tại sao session dùng tree structure (JSONL + parentId) thay vì flat list?
- [ ] Q18: Override mechanism (`skillsOverride`, `extensionsOverride`) hữu ích trong trường hợp nào?

---

## Dependency Graph & Extension System

### Câu hỏi nhận biết
- [ ] Q19: Vẽ dependency chain chính (3 packages, dùng mũi tên →).
- [ ] Q20: Extension được discover từ những đường dẫn nào?
- [ ] Q21: `ExtensionAPI` cung cấp bao nhiêu phương thức đăng ký? Kể tên.

### Câu hỏi hiểu
- [ ] Q22: Extension có thể override built-in tools — điều này có ý nghĩa kiến trúc gì? Lợi và hại?
- [ ] Q23: Tại sao Resource Loading có thứ tự cố định? Nếu đảo thứ tự thì sao?

### Câu hỏi tổng hợp
- [ ] Q24: Nếu attendee hỏi "Pi-mono khác gì Claude Code về mặt kiến trúc?", bạn trả lời thế nào? (3 điểm chính)
- [ ] Q25: Vẽ sơ đồ tổng quan: từ user gõ command → qua 3 tiers → nhận response. Ghi tên các component chính.

---

## Kết quả tự đánh giá

| Mức | Số câu đúng | Đánh giá |
|-----|-------------|----------|
| Tốt | 20-25 | Sẵn sàng trình bày |
| Khá | 15-19 | Ôn lại phần yếu |
| Cần cải thiện | <15 | Đọc lại tài liệu gốc |

**Số câu trả lời được**: ___/25
**Phần cần ôn lại**: ___
