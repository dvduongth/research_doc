# Hands-on Checklist

## ✅ Phase 1: Setup & Environment

- [ ] Pi-mono repo đã clone (nếu chưa: `git clone https://github.com/badlogic/pi-mono.git`)
- [ ] `npm install` trong `packages/coding-agent` (hoặc root) đã chạy thành công.
- [ ] Build thành công (nếu cần `npm run build`).
- [ ] Có thể chạy `pi` command (test: `pi --version`).
- [ ] Đã login provider: `/login` (Anthropic/OpenAI/Google) hoặc set API key qua env vars.
- [ ] `pi --list-models` hiển thị ít nhất 1 model.
- [ ] Biết location session dir (`~/.pi/agent/sessions/`).
- [ ] Terminal hỗ trợ colors (kiểm tra TUI hiển thị đúng).

---

## ✅ Phase 2: Basic Conversation

- [ ] Chạy `pi` (interactive mode).
- [ ] Gửi message: "Xin chào, bạn là ai?"
- [ ] Verify assistant response hiển thị (streaming text).
- [ ] Verify message xuất hiện trong session (sau khi exit, check JSONL file).
- [ ] Mở session file, xem entry `type: "message"` với roles đúng.
- [ ] Đọc được `usage` (tokens, cost) trong assistant message.
- [ ] Thử gửi ảnh (nếu model hỗ trợ): paste ảnh vào editor (Ctrl+V).
- [ ] Verify ảnh được gửi (có `type: "image"` trong user message).

---

## ✅ Phase 3: Tool Execution (Built-in Tools)

### Tool `read`
- [ ] Gửi: "Đọc file README.md trong thư mục hiện tại"
- [ ] Verify tool call xuất hiện trong streaming (toolcall_start/delta/end).
- [ ] Verify tool result hiển thị (content đầy đủ).
- [ ] Check session: có `type: "message"` role `toolResult`.
- [ ] Tool result `isError` là `false`.

### Tool `bash`
- [ ] Gửi: "Chạy lệnh `ls` (hoặc `dir` trên Windows)"
- [ ] Verify tool call và result.
- [ ] Result chứa output của lệnh.
- [ ] Thử lệnh lỗi: "Chạy lệnh `false`" → verify `isError: true` và error message.
- [ ] Thử `!!` prefix để exclude từ context (không cần thiết nhưng nên biết).

### Tool `write`
- [ ] Gửi: "Tạo file `test.txt` với nội dung 'Hello world'"
- [ ] Verify file được tạo.
- [ ] Check tool result: success.
- [ ] Dùng `read` để xác nhận nội dung file.

### Tool `edit`
- [ ] Gửi: "Sửa file `test.txt` thay 'Hello' thành 'Hi'"
- [ ] Verify file được sửa.
- [ ] Check tool result.

### Tool khác (nếu có thời gian)
- [ ] `grep`: tìm kiếm text.
- [ ] `find`: tìm file.
- [ ] `ls`: liệt kê thư mục.

---

## ✅ Phase 4: Session Management

- [ ] Trong interactive, gõ `/new` → tạo session mới.
  - Verify session file mới được tạo.
  - Verify old session vẫn có trong `~/.pi/agent/sessions/`.
- [ ] Gõ `/resume` → chọn session cũ, resume.
  - Verify messages cũ hiển thị.
  - Gửi message mới, verify được append vào session cũ.
- [ ] Gõ `/tree` → điều hướng session tree.
  - Chọn một entry cũ, branch sang đó.
  - Verify messages sau branch khác với trước.
  - Verify `branch_summary` entry được tạo.
- [ ] Gõ `/fork` → tạo session mới từ current branch.
  - Verify file mới được tạo.
  - Verify session parent được set.
- [ ] Gõ `/compact` → manual compaction.
  - Verify `compaction` entry được thêm.
  - Verify summary message trong session.

---

## ✅ Phase 5: Custom Tool (Optional)

- [ ] Tạo extension đơn giản (ví dụ: `my-tool-extension`):
  - `index.ts` đăng ký custom tool `echo`.
  - Tool nhận input `text`, trả về `text` giống input.
- [ ] Đặt extension vào `.pi/extensions/` hoặc dùng `--extension`.
- [ ] Reload (`/reload`) để load extension.
- [ ] Verify extension loaded (có log hoặc `/extensions` command nếu có).
- [ ] Gọi tool từ chat: "Hãy chạy tool echo với text 'Hello from custom tool!'"
- [ ] Verify tool call và result.
- [ ] Check session: tool call name đúng, result đúng.

---

## ✅ Phase 6: Logging & Artifacts

- [ ] Ghi lại các lỗi gặp phải (nếu có).
- [ ] Chụp màn hình (screenshot) các bước quan trọng (nếu có thể).
- [ ] Lưu sample session file (1 file.jsonl) vào `artifacts/`.
- [ ] Ghi notes về:
  - Điều bất ngờ.
  - Tính năng nào mạnh mẽ.
  - Khó khăn gặp phải.
  - Questions dư lại.

---

## 🎯 Success Criteria

- [ ] Chạy được pi interactive mode.
- [ ] Gửi được text và nhận response.
- [ ] Dùng được ít nhất 3 built-in tools.
- [ ] Thao tác session: new, resume, tree.
- [ ] Nếu làm custom tool: tool đó chạy được.
- [ ] Có bằng chứng (logs, session files, notes).

---

**Ghi chú**: Đánh dấu `[x]` khi hoàn thành mỗi item. Ghi chú vào `notes/*.md` với timestamp.
