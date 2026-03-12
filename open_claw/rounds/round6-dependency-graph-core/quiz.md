# Dependency Graph - Quiz xác nhận hiểu

---

## 🎯 Câu hỏi

**Q1**: Liệt kê đầy đủ core packages của pi-mono theo thứ tự từ dưới lên (tier 1 đến tier 3).

**Q2**: Vẽ sơ đồ (text) direction của dependencies giữa 3 core packages. Có cyclic dependencies không? Giải thích.

**Q3**: `pi-coding-agent` dùng `pi-tui` để làm gì? `pi-tui` có phụ thuộc vào `pi-agent-core` không? Tại sao?

**Q4**: Nếu bạn muốn thêm một provider mới (ví dụ Ollama), bạn sẽ sửa package nào? Tại sao?

**Q5**: Khi `pi-coding-agent` cần stream LLM response, nó gọi qua `pi-agent-core` và `pi-ai`. Hãy mô tả flow function calls (roughly).

**Q6**: `pi-agent-core` chỉ phụ thuộc vào `pi-ai`. Điều này mang lại lợi ích gì cho kiến trúc?

**Q7**: External dependency nào trong `pi-ai` để gọi Anthropic API? Điều này có ý nghĩa gì đối với bundle size?

**Q8**: Package nào chứa logic cho tool execution? Tại sao nên đặt tool execution ở tier 2 thay vì tier 1 hoặc tier 3?

**Q9**: `pi-coding-agent` có rất nhiều dependencies (chalk, diff, extract-zip...). Chúng thuộc category nào? Tại sao không đặt chúng vào `pi-ai` hoặc `pi-agent-core`?

**Q10**: Giải thích tại sao `pi-mom`, `pi-web-ui`, `pi-pods` không nằm trong core dependency chain nhưng vẫn là phần của monorepo. Chúng có thể dùng chung `pi-ai` không?

---

## ✅ Đáp án (không xem trước)

1. Tier 1: `@mariozechner/pi-ai`; Tier 2: `@mariozechner/pi-agent-core`; Tier 3: `@mariozechner/pi-coding-agent`. `pi-tui` là supporting package.
2. `pi-coding-agent` → `pi-agent-core` → `pi-ai`. Không cyclic (mỗi package chỉ depend lên lower tier).
3. `pi-coding-agent` dùng `pi-tui` để render TUI (header, messages, editor). `pi-tui` không phụ thuộc `pi-agent-core` vì nó là pure UI lib, độc lập.
4. Thêm provider mới vào `pi-ai`, vì nó là LLM abstraction layer. Các tier khác không cần biết provider chi tiết.
5. `pi-coding-agent` → `Agent.prompt()` (agent-core) → `agentLoop()` → `streamAssistantResponse()` → `convertToLlm()` → `pi-ai.streamSimple()` → provider SDK.
6. `pi-agent-core` chỉ phụ thuộc `pi-ai` nên nó có thể hoạt động độc lập với CLI (có thể dùng trong services, web UI, etc.). Separation of concerns: agent logic tách biệt UI.
7. `@anthropic-ai/sdk`. Các provider SDKs là peer dependencies, không bundle vào package (users cài riêng). Điều này giúp bundle size nhỏ.
8. Tool execution nằm trong `pi-agent-core` vì nó là agent runtime responsibility. Nếu đặt ở tier 1 (pi-ai) sẽ trộn provider logic với agent logic. Nếu đặt ở tier 3 thì mỗi CLI application phải tự implement.
9. Chúng là application-level utilities (UI, file ops, formatting). Không nên đặt vào lower tiers vì sẽ làm tăng dependencies chung, ảnh hưởng đến tất cả consumers.
10. Chúng là optional packages, có thể standalone hoặc dùng chung `pi-ai` nếu cần LLM. Monorepo tổ chức theo feature: `pi-mom` (message-of-the-day?), `pi-web-ui` (web UI), `pi-pods` (sandboxed envs). Chúng có thể import `pi-ai` để dùng LLM mà không cần agent-core.

---

**Lưu ý**: Sau khi trả lời, so sánh với notes `01-package-deps.md` và `02-architecture-insights.md`.
