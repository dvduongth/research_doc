# Round 4: Application Layer - Bộ câu hỏi xác nhận hiểu
**Dựa trên `application-layer-checklist.md`**

---

## ✅ CLI & Modes

**Q1**: Giải thích sự khác biệt giữa các mode: interactive, print, json, rpc. Khi nào dùng mỗi mode?

**Q2**: Các flag `--tools`, `--no-tools`, `--extension`, `--no-extensions` dùng để làm gì? Chúng ảnh hưởng thế nào đến resource loading?

**Q3**: Environment variable `PI_CODING_AGENT_DIR` và `PI_PACKAGE_DIR` dùng để làm gì?

**Q4**: Làm sao để chạy `pi` ở JSON mode? Kết quả output là gì?

---

## ✅ TUI Architecture

**Q5**: Mô tả layout của interactive mode: header, messages, editor, footer. Mỗi phần hiển thị thông tin gì?

**Q6**: Keybinding `Ctrl+O` và `Ctrl+T` dùng để làm gì?

**Q7**: Khi user nhập message,editor hỗ trợ những tính năng đặc biệt nào (`@` file ref, `!` bash, paste ảnh)?

**Q8**: Làm thế nào để message của user được gửi đi nhanh (steering) hay đợi sau khi agent idle (follow-up)?

---

## ✅ Resource Loading

**Q9**: Thứ tự load resources là gì? (skills, extensions, prompts, context files, system prompt). Nêu trình tự ưu tiên.

**Q10**: `DefaultResourceLoader` load context files (`AGENTS.md`/`CLAUDE.md`) như thế nào? Nó walk từ thư mục nào đến thư mục nào?

**Q11**: System prompt có thể được override bằng những cách nào? (file, CLI flags, options).

**Q12**: Override functions (`extensionsOverride`, `skillsOverride`, ...) dùng để làm gì? Khi nào cần dùng chúng?

---

## ✅ Commands System

**Q13**: Resolution order của commands khi user nhập `/something` là gì? (extensions, templates, skills, built-in).

**Q14**: Extension đăng ký command qua `pi.registerCommand()` với những trường nào? (`description`, `handler`, `getArgumentCompletions`).

**Q15**: Prompt template command là gì? Tạo file template trong thư mục nào và gọi thế nào?

**Q16**: Skill command có dạng `/skill:name`. Làm sao để skill đăng ký command mới (có thể không dùng prefix `skill:`)?

---

## ✅ Session Management

**Q17**: Session file được lưu ở đâu? Tên file có dạng gì? Ví dụ: `~/.pi/agent/sessions/--path--/20240303_123456_abcdef.jsonl`.

**Q18**: Command `/new` làm gì? Nó emit những event nào? (`session_before_switch`, `session_switch`)

**Q19**: Command `/tree` cho phép bạn làm gì? Branch summary được tạo khi nào?

**Q20**: `/fork` khác `/new` như thế nào? Khi nào dùng `/fork` thay vì `/tree`?

---

## ✅ Settings

**Q21**: Settings global và project lưu ở đâu? Project settings override global như thế nào?

**Q22**: Một số options quan trọng trong settings là gì? (`thinkingLevel`, `theme`, `transport`, `toolConcurrency`, `compaction`, `models.scoped`).

**Q23**: Làm sao để edit settings? Command `/settings` mở editor nào?

**Q24**: Settings kiểm soát việc enable/disable resources thế nào? Ví dụ với `extensions.enabled` và `extensions.disabled`.

---

## ✅ Extensions Lifecycle

**Q25**: Extension discovery paths là gì? (global vs project). Ai tìm extensions trước?

**Q26**: Extension được load bằng công cụ nào? (jiti). Có hot-reload không? Làm thế nào?

**Q27**: Khi `/reload`, những event gì được emit? (`session_shutdown` cũ, `session_start` mới).

**Q28**: Extension command có thể override built-in command không? Đề xuất nên dùng tên trùng không?

---

## ✅ Themes

**Q29**: Theme file có định dạng gì? `.theme.json` vs `.theme.js`. Cấu trúc theme object gồm những gì?

**Q30**: Theme resolution: ưu tiên nào? (CLI flag > settings > default). Nếu theme không tìm thấy thì sao?

**Q31**: Làm sao để extension dùng theme colors trong UI? (ctx.theme, style keys).

---

## ✅ Package Management

**Q32**: Các lệnh package là gì? (`install`, `remove`, `update`, `list`). Source format nào được hỗ trợ?

**Q33**: Package manifest (`package.json`) phải có trường `pi` để khai báo resources. Ví dụ: `"pi": { "extensions": ["dist/ext.js"], ... }`.

**Q34**: Install locations: global vs project-local. Làm sao để install vào project (`-l` flag)?

**Q35**: `pi config` dùng để làm gì? (enable/disable package resources).

---

## ✅ RPC & JSON Modes

**Q36**: RPC mode làm gì? Giao tiếp với external process thế nào? (stdin/stdout JSON).

**Q37**: JSON mode khác RPC mode như thế nào? JSON mode chỉ là event stream, không có request/response.

**Q38**: Khi nào nên dùng RPC mode? (ví dụ tích hợp với OpenClaw).

---

## ✅ Special Features

**Q39**: `!` và `!!` prefix trong editor là gì? (bash execution, exclude from context).

**Q40**: `@` file reference làm gì? (import file content vào message).

**Q41**: Image paste (Ctrl+V) được xử lý thế nào? (read from clipboard, base64).

**Q42**: Compaction automatic vs manual? Khi nào automatic compaction xảy ra?

**Q43**: Label entry dùng để làm gì? (bookmark cho `/tree`).

---

**Lời nhắn**: Trả lời ngắn gọn 1-2 câu. Nếu chưa chắc, xem lại notes.

---

Sau khi hoàn thành, đánh dấu `[x]` trong `application-layer-checklist.md` và cập nhật `PROGRESS.md`.