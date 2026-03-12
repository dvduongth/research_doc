# Commands System

Pi có hệ thống commands phong phú, được truy cập qua `/` trong interactive mode.

---

## 📋 Built-in Commands

Danh sách chính (từ README):

- `/login`: Authenticate với provider (OAuth).
- `/logout`: Clear credentials.
- `/model`: Select model via interactive picker.
- `/scoped-models`: Set scoped models cho Ctrl+P.
- `/settings`: Open settings editor (JSON).
- `/resume`: Session picker để resume.
- `/new`: Tạo session mới.
- `/name <tên>`: Đặt tên session (hiển thị trong picker).
- `/session`: Show current session file path.
- `/tree`: Navigate session tree.
- `/fork`: Tạo session mới từ current branch.
- `/compact`: Manual compaction.
- `/copy`: Copy last assistant response.
- `/export`: Export conversation to HTML.
- `/share`: Share lên GitHub gist.
- `/reload`: Reload extensions, skills, prompts, themes (hot-reload).
- `/hotkeys`: Show keybindings.
- `/changelog`: Show version changes.
- `/quit`: Thoát (Ctrl+Q cũng được).

Một số command có alias (ví dụ `/q` cho `/quit`).

---

## 🔌 Extension Commands

Extensions đăng ký command qua:

```typescript
pi.registerCommand("my-cmd", {
  description: "Do something",
  handler: async (args, ctx) => {
    // args là string sau command
    // ctx là ExtensionCommandContext (có thể dùng ctx.ui, ctx.sessionManager, etc.)
  },
  getArgumentCompletions?: (prefix: string) => AutocompleteItem[] | null,
});
```

Commands của extensions có thể được gọi `/my-cmd arg1 arg2`.

---

## 🎯 Command Resolution Order

Khi user nhập `/something`:

1. **Extension commands** được check trước. Nếu tìm thấy, handler chạy và dừng (không tiếp tục).
2. Nếu không, **prompt template commands** (từ `.pi/prompts/`) được check.
3. Nếu không, **skill commands** (`/skill:name`) được expand.
4. Nếu không, có thể built-in commands (một số built-in như `/model` được xử lý riêng trong interactive mode trước khi vào event `input`).

Do đó, extensions có thể override built-in commands nếu đặt tên trùng (không khuyến nghị).

---

## 📝 Creating Prompt Templates

File trong `.pi/prompts/`:

```markdown
## /mytemplate
This is a prompt template.

You can use variables like {{cwd}} or {{date}}.
```

Gọi bằng `/mytemplate` – nội dung file sẽ được expand thành user message.

---

## 🧩 Skill Commands

Skills đăng ký command qua `skills.registerCommand()` (có thể là `/skill:name` hoặc command khác). Skill commands cũng tham gia resolution.

---

## ⌨️ Command Handler in Interactive Mode

Trong `InteractiveMode`, commands được xử lý trước khi tạo `Agent` input. Có thể:

- Xử lý trực tiếp trong `handleInput()` của interactive mode (built-in commands).
- Hoặc phát ra event `input` cho extensions.

---

**Lưu ý**: Commands cung cấp sự mở rộng mạnh mẽ: bạn có thể tạo command tùy chỉnh, có UI (dùng `ctx.ui`), thay đổi settings, quản lý session, etc.
