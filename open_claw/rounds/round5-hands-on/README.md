# Round 5: Hands-on Phase - Thử nghiệm thực tế
**Mục tiêu**: Trải nghiệm pi-mono bằng cách tạo conversation, thử tool execution, và ghi nhận kết quả.

---

## 🎯 Mục tiêu chi tiết

### Phase 1: Cài đặt & khởi chạy
- [ ] Clone/check pi-mono repo (nếu chưa có)
- [ ] Build packages (nếu cần)
- [ ] Cài đặt dependencies (npm install)
- [ ] Chạy `pi` lần đầu (setup auth)
- [ ] Xác minh interactive mode hoạt động

### Phase 2: Tạo conversation cơ bản
- [ ] Gửi message text đơn giản
- [ ] Kiểm tra streaming display
- [ ] Verify messages được lưu vào session file
- [ ] Xem session file structure (JSONL)

### Phase 3: Thử tool execution (built-in tools)
- [ ] Dùng tool `read` để đọc file
- [ ] Dùng tool `bash` để chạy lệnh đơn giản (ví dụ `ls`, `pwd`)
- [ ] Dùng tool `write` để tạo file mới
- [ ] Dùng tool `edit` để sửa file
- [ ] Ghi lại tool call args và results

### Phase 4: Quản lý session
- [ ] Tạo session mới (`/new`)
- [ ] Resume session cũ (`/resume`)
- [ ] Xem session tree (`/tree`)
- [ ] Fork session (`/fork`)
- [ ] Manual compaction (`/compact`)

### Phase 5: Custom tool (nếu thời gian cho phép)
- [ ] Tạo extension đơn giản với custom tool
- [ ] Load extension
- [ ] Gọi custom tool từ chat
- [ ] Verify tool execution và result

### Phase 6: Logging & ghi nhớ
- [ ] Ghi lại tất cả output, errors
- [ ] Chụp màn hình (nếu cần)
- [ ] Tóm tắt lessons learned

---

## 📂 Nguồn dữ liệu & Môi trường

- **Repo**: `D:\PROJECT\CCN2\pi-mono\`
- **Build**: `npm install` trong packages/coding-agent (hoặc root)
- **CLI**: `npx @mariozechner/pi-coding-agent` hoặc `node packages/coding-agent/src/cli.ts`
- **Session dir**: `~/.pi/agent/sessions/` (Windows: `%USERPROFILE%\.pi\agent\sessions`)

---

## 📋 Checklist chung

- [ ] **Environment ready**: Node.js, npm, dependencies installed.
- [ ] **Authentication**: Đã login provider (Anthropic/OpenAI/etc.) qua `/login` hoặc env vars.
- [ ] **Model available**: `pi --list-models` hiển thị ít nhất 1 model.
- [ ] **Basic conversation**: Gửi text, nhận response.
- [ ] **Tool calls**: Dùng ít nhất 3 built-in tools.
- [ ] **Session ops**: `/new`, `/resume`, `/tree`.
- [ ] **File evidence**: Session file được tạo, có entries đúng format.
- [ ] **Error handling**: Biết cách xử lý tool error, aborted requests.

---

## 🗂️ Cấu trúc output

```
round5-hands-on/
├── README.md                  (plan này)
├── PROGRESS.md                (tiến độ từng bước, ghi nhớ)
├── checklist.md               (bạn đánh dấu [x])
├── notes/
│   ├── 01-setup.md           (cài đặt, build, auth)
│   ├── 02-conversation.md    (conversation cơ bản, session file)
│   ├── 03-tool-execution.md  (thử từng tool, args, results)
│   ├── 04-session-ops.md     (new, resume, tree, fork, compact)
│   ├── 05-custom-tool.md     (nếu làm)
│   └── 06-lessons.md         (kết luận, issues, insights)
└── artifacts/                (screenshots, session file samples, logs)
```

---

## 🕐 Timeline đề xuất

1. **Setup** (30 phút): clone, install, auth.
2. **Conversation** (20 phút): gửi vài message, xem session file.
3. **Tool execution** (40 phút): thử từng tool.
4. **Session ops** (20 phút): `/new`, `/resume`, `/tree`.
5. **Custom tool** (30 phút, optional): tạo extension đơn giản.
6. **Report** (30 phút): tổng hợp notes.

**Tổng ~2.5 giờ**.

---

**Tiến độ**: Chưa bắt đầu.

---

*File này sẽ update khi tiến độ thay đổi.*
