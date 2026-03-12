# Câu hỏi Attendees có thể hỏi — Người A

> **Phạm vi**: Kiến trúc 3 Tiers, Dependency Graph, Extension System
> Dùng file này để luyện tập. Câu trả lời gợi ý ở [file đáp án](qa-nguoi-a-answers.md).

---

## Nhóm 1: Kiến trúc tổng quan

**Q1.** Tại sao pi-mono chọn kiến trúc 3 tiers thay vì monolith? Lợi ích thực tế là gì?

**Q2.** Nếu tôi chỉ muốn dùng phần LLM abstraction (pi-ai) mà không cần agent, có được không? Cách tách ra?

**Q3.** Pi-mono dùng lockstep versioning — tức tất cả packages cùng version. Tại sao không versioning độc lập cho từng package?

---

## Nhóm 2: Provider & Model

**Q4.** Hiện pi-ai hỗ trợ bao nhiêu providers? Nếu provider mới ra mắt (ví dụ: xAI Grok), thêm vào có khó không?

**Q5.** `ModelRegistry` khác gì OpenAI SDK khi gọi `openai.chat.completions.create(model: "gpt-4")`? Tại sao cần thêm một lớp abstraction?

**Q6.** Nếu 2 providers cùng có model tên "gpt-4o" thì `getModel()` resolve thế nào?

---

## Nhóm 3: Dependencies & Extension

**Q7.** Extension có thể override built-in tools — vậy có rủi ro bảo mật không? Pi-mono xử lý vấn đề này thế nào?

**Q8.** So sánh Extension System của pi-mono với plugin system của VS Code — giống và khác gì?

**Q9.** ResourceLoader load theo thứ tự cố định (Skills → Extensions → Prompts → Context → System Prompt). Nếu tôi muốn extension load trước skills thì sao?

**Q10.** `ExtensionAPI` có `pi.registerProvider()` — vậy custom provider đăng ký qua extension khác gì provider built-in trong `pi-ai`?

---

## Nhóm 4: So sánh & Thực tiễn

**Q11.** Pi-mono so với Claude Code — kiến trúc khác nhau cơ bản ở điểm nào?

**Q12.** Ai nên dùng pi-mono SDK thay vì dùng trực tiếp Anthropic/OpenAI SDK?

**Q13.** Pi-mono có 22k+ stars nhưng có vẻ ít người biết ở Việt Nam. Bạn nghĩ tại sao?

---

## Nhóm 5: Câu hỏi "bẫy" (có thể khó)

**Q14.** Nếu `pi-ai` gặp rate limit từ 1 provider, có fallback tự động sang provider khác không?

**Q15.** Pi-mono handle multi-modal (hình ảnh, audio) như thế nào ở tầng `pi-ai`?
