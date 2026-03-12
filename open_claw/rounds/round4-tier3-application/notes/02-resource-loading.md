# Resource Loading

`DefaultResourceLoader` là lớp quản lý tất cả resources: extensions, skills, prompt templates, themes, context files, system prompt.

---

## 📁 Loading Order & Sources

### Skills

- Project: `.pi/skills/`
- Global: `~/.pi/agent/skills/`
- Parent directories (walk up to root)
- Additional paths: `--skill` flag, `additionalSkillPaths` option

Skills được load bằng `loadSkills()`. Mỗi skill là thư mục có `SKILL.md` và các file hỗ trợ.

---

### Extensions

- Project: `.pi/extensions/`
- Global: `~/.pi/agent/extensions/`
- Additional paths: `--extension`, `additionalExtensionPaths`
- Package resources: từ `settings.json` packages (có thể include extensions)

Extensions được load bằng `loadExtensions()`. Hỗ trợ TypeScript trực tiếp (via `jiti`). Có thể multi-file với `index.ts` entry.

---

### Prompt Templates

- Project: `.pi/prompts/`
- Global: `~/.pi/agent/prompts/`
- Additional: `--prompt-template`, `additionalPromptTemplatePaths`

Load bằng `loadPromptTemplates()`. Mỗi template là file Markdown hoặc plain text. Gọi bằng `/templatename`.

---

### Context Files (AGENTS.md / CLAUDE.md)

- Load từ `cwd` lên đến root (từng thư mục).
- Các file: `AGENTS.md` hoặc `CLAUDE.md`.
- Nội dung được concatenate theo thứ tự từ root → cwd (hoặc ngược? cần check).
- Purpose: cung cấp context cho LLM về project, team rules, etc.

Đọc qua `loadProjectContextFiles()`.

---

### System Prompt

- Project: `.pi/SYSTEM.md`
- Global: `~/.pi/agent/SYSTEM.md`
- Append: `APPEND_SYSTEM.md` (ở project hoặc global)
- Override: `--system-prompt`, `--append-system-prompt` CLI flags
- `systemPrompt` option khi tạo `DefaultResourceLoader`

`getSystemPrompt()` trả về system prompt (nếu `systemPrompt` option có thì dùng, nếu không thì từ file).
`getAppendSystemPrompt()` trả về mảng strings để append.

---

### Themes

- Built-in: `dark`, `light` (from `pi-tui`).
- Project: `.pi/themes/`
- Global: `~/.pi/agent/themes/`
- Additional: `--theme` flag, `additionalThemePaths`

Load bằng `loadThemeFromPath()`. Mỗi theme là file `.theme.json` hoặc `.theme.js` export theme object.

---

## 🔄 Override Mechanisms

Khi tạo `DefaultResourceLoader`, bạn có thể truyền override functions:

```typescript
new DefaultResourceLoader({
  extensionsOverride: (base) => ({ extensions: [...], errors: [...], runtime: ... }),
  skillsOverride: (base) => ({ skills: [...], diagnostics: [...] }),
  promptsOverride: ...,
  themesOverride: ...,
  agentsFilesOverride: (base) => ({ agentsFiles: [...] }),
  systemPromptOverride: (base) => string | undefined,
  appendSystemPromptOverride: (base) => string[],
});
```

Override này cho phép bạn thay đổi hoàn toàn cách load từng loại resource, hoặc filter/transform sau khi load.

---

## 🔄 Hot Reload (`/reload`)

- `resourceLoader.reload()` được gọi.
- Extensions: unload tất cả, load lại từ đầu (emit `session_shutdown` cho các extension cũ, rồi `session_start` cho mới).
- Skills, prompts, themes: reload.
- Context files: reload.
- System prompt: reload.

Sau reload, tất cả các resources mới có hiệu lực trong session hiện tại.

---

## 📊 Diagnostics

Mỗi resource loader trả về diagnostics (errors, warnings) khi load. Có thể retrieved qua `getSkills()`, `getPrompts()`, `getThemes()` → object có `diagnostics` array.

---

## 🔗 Integration với Settings

`DefaultResourceLoader` dùng `SettingsManager` để biết:
- Nên load extension nào (settings `extensions.enable`/`disable`).
- Package paths để load từ installed packages.
- Theme được chọn.

---

**Lưu ý**: Resource loading xảy ra một lần khi khởi động pi, và mỗi lần `/reload`. Các resources có thể bị disabled qua settings (`extensions.disabled`, `skills.disabled`, etc.).
