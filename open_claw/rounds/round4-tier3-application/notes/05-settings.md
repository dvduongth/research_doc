# Settings System

Settings quản lý cấu hình của pi. Có hai cấp: global và project.

---

## 📂 Files

- **Global**: `~/.pi/agent/settings.json`
- **Project**: `.pi/settings.json` (overrides global)

Settings được parse và merge: project > global > defaults.

---

## 🔧 Common Options

```json
{
  "thinkingLevel": "off" | "minimal" | "low" | "medium" | "high" | "xhigh",
  "theme": "dark" | "light" | "default",
  "transport": "sse" | "websocket" | "auto",
  "toolConcurrency": number,
  "compaction": {
    "enabled": boolean,
    "tokens": number,
    "strategy": "summarize" | "drop-oldest"
  },
  "models": {
    "scoped": Array<{ provider: string, model: string }>  // Ctrl+P pool
  },
  "extensions": {
    "enabled": string[],   // Allowlist (empty = all)
    "disabled": string[]   // Denylist
  },
  "skills": {
    "enabled": string[],
    "disabled": string[]
  },
  "prompts": {
    "enabled": string[],
    "disabled": string[]
  },
  "themes": {
    "enabled": string[],
    "disabled": string[]
  }
}
```

---

## 🎛️ Editing Settings

- `/settings`: Mở editor (mặc định $EDITOR) để chỉnh sửa settings JSON.
- Hoặc chỉnh trực tiếp file.
- Sau khi lưu, settings tự động reload (hoặc cần `/reload`).

---

## 🔄 Interaction với Resource Loading

Settings kiểm soát:

- **Extensions**: `extensions.enabled/disabled` → filter extensions sau khi load.
- **Skills**, **Prompts**, **Themes**: tương tự.
- **Models scoped**: Xác định danh sách models khi Ctrl+P cycling.
- **Thinking level**: default nếu không set qua `--thinking`.

---

## 📍 Where Settings are Used

- `SettingsManager` đọc và merge global + project.
- `DefaultResourceLoader` nhận `SettingsManager` để biết filter resources.
- `InteractiveMode` dùng settings cho theme, thinking level, model cycling.
- `createAgentSession()` nhận settings qua options.

---

**Lưu ý**: Settings là nơi tùy chỉnh hành vi pi một cách linh hoạt, từ disabled resources đến model preferences.
