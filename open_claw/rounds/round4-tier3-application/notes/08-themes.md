# Themes & Styling

Pi sử dụng `pi-tui` để render UI trong terminal. Themes xác định màu sắc và style.

---

## 🎨 Built-in Themes

- `dark`: Dark background, light text (default).
- `light`: Light background, dark text.

---

## 📁 Custom Themes

Định nghĩa theme trong file:

- `.pi/themes/<name>.theme.json` (project)
- `~/.pi/agent/themes/<name>.theme.json` (global)
- Hoặc `.theme.js` export object.

**Theme JSON structure**:

```json
{
  "name": "my-theme",
  "author": "Your Name",
  "description": "Custom theme",
  "colors": {
    "fg": "#ffffff",
    "bg": "#000000",
    "primary": "#00ff00",
    "secondary": "#ff00ff",
    "accent": "#ffff00"
  },
  "styles": {
    "user": { "fg": "cyan", "bold": true },
    "assistant": { "fg": "white" },
    "tool": { "fg": "yellow", "dim": true },
    "error": { "fg": "red" }
  }
}
```

Màu có thể là tên màu chuẩn (red, blue, etc.), hex, hoặc 256-color numbers.

---

## 🔄 Hot Reload

Khi sửa file theme, pi phát hiện thay đổi và apply ngay lập tức (nhờ file watcher). Dùng `/reload` nếu cần.

---

## 🧩 Theme Resolution

1. `--theme` CLI flag.
2. Settings `theme` key.
3. Mặc định: `"default"` (dựa trên terminal background detection).

Nếu user theme không tìm thấy, fall back về `"default"`.

---

## 🎨 Styling trong Code

Extensions và UI components sử dụng theme colors qua `ctx.theme`:

```typescript
ctx.ui?.writeLine('Hello', { style: 'primary' });
```

Hoặc dùng trực tiếp `Theme` object.

---

**Lưu ý**: Themes giúp cá nhân hóa giao diện terminal mà không cần sửa code.
