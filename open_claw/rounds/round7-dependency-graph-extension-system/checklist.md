# Extension System - Checklist

---

## ✅ Phase 1: Overview & Discovery

- [ ] Đọc `extensions.md` (docs) để hiểu tổng quan.
- [ ] Xác định extension discovery paths:
  - [ ] Global: `~/.pi/agent/extensions/*.ts` và `*/index.ts`
  - [ ] Project: `.pi/extensions/*.ts` và `*/index.ts`
  - [ ] Additional paths từ settings.json
  - [ ] Packages (pi install)
- [ ] Hiểu extension styles: single file, directory, package with deps.
- [ ] Ghi vào `notes/01-extension-api.md` (overview).

---

## ✅ Phase 2: Extension Loading Mechanism

- [ ] Đọc `packages/coding-agent/src/core/extensions/loader.ts`.
- [ ] Hiểu jiti: runtime TypeScript loader, không cần compile.
- [ ] Hiểu `loadExtensionFromFactory` và `loadExtensions`.
- [ ] Biết cách extensions được instantiate: default function với `ExtensionAPI`.
- [ ] Extension runtime isolation: mỗi extension chạy trong context riêng? (no strict isolation, có thể chia sẻ state qua pi.events).
- [ ] Hot-reload: `/reload` gọi `reload()` trên resource loader, extensions được unload/reload.
- [ ] Ghi vào `notes/03-extension-loading.md`.

---

## ✅ Phase 3: ExtensionAPI Methods

- [ ] Liệt kê tất cả methods của `ExtensionAPI` (từ docs):
  - [ ] Event subscription: `pi.on(event, handler)`
  - [ ] Tools: `pi.registerTool`, `pi.getActiveTools`, `pi.getAllTools`, `pi.setActiveTools`
  - [ ] Commands: `pi.registerCommand`, `pi.getCommands`
  - [ ] Shortcuts: `pi.registerShortcut`
  - [ ] Flags: `pi.registerFlag`, `pi.getFlag`
  - [ ] Providers: `pi.registerProvider`, `pi.unregisterProvider`
  - [ ] Messages: `pi.sendMessage`, `pi.sendUserMessage`
  - [ ] State: `pi.appendEntry`, `pi.setSessionName`, `pi.getSessionName`, `pi.setLabel`
  - [ ] Model: `pi.setModel`, `pi.setThinkingLevel`, `pi.getThinkingLevel`
  - [ ] Actions: `pi.compact`, `pi.reload`, `pi.shutdown`
  - [ ] Execution: `pi.exec`
  - [ ] Events bus: `pi.events.on`, `pi.events.emit`
- [ ] Đọc các type definitions trong `packages/coding-agent/src/core/extensions/types.ts` để xác định signatures.
- [ ] Ghi đầy đủ vào `notes/01-extension-api.md`.

---

## ✅ Phase 4: ExtensionContext

- [ ] Đọc docs về `ExtensionContext`.
- [ ] Liệt kê tất cả properties và methods:
  - [ ] `ctx.ui` (UI methods)
  - [ ] `ctx.hasUI`
  - [ ] `ctx.cwd`
  - [ ] `ctx.sessionManager`
  - [ ] `ctx.modelRegistry`, `ctx.model`
  - [ ] `ctx.isIdle()`, `ctx.abort()`, `ctx.hasPendingMessages()`
  - [ ] `ctx.getContextUsage()`
  - [ ] `ctx.compact()`, `ctx.reload()`, `ctx.shutdown()`
  - [ ] `ctx.getSystemPrompt()`
- [ ] Ghi vào `notes/01-extension-api.md` (hoặc file riêng).

---

## ✅ Phase 5: Events

- [ ] Từ docs, liệt kê tất cả event types, grouped by category:
  - [ ] Session events (`session_directory`, `session_start`, `session_before_switch`, `session_switch`, `session_before_fork`, `session_fork`, `session_before_compact`, `session_compact`, `session_before_tree`, `session_tree`, `session_shutdown`)
  - [ ] Agent events (`before_agent_start`, `agent_start`, `turn_start`, `message_start`, `message_update`, `message_end`, `tool_execution_start`, `tool_execution_update`, `tool_execution_end`, `context`, `before_provider_request`, `turn_end`, `agent_end`)
  - [ ] Model events (`model_select`)
  - [ ] Tool events (`tool_call`, `tool_result`)
  - [ ] User bash (`user_bash`)
  - [ ] Input (`input`)
- [ ] Với mỗi event, nêu:
  - [ ] Khi nào phát
  - [ ] Payload (event object)
  - [ ] Return value (có thể modify flow không?)
- [ ] Ghi đầy đủ vào `notes/02-extension-events.md` (có thể dạng bảng).

---

## ✅ Phase 6: Custom Tools

- [ ] Tool definition structure (từ docs).
- [ ] `parameters` schema với `Type.Object` và `StringEnum`.
- [ ] `execute` signature và `onUpdate`.
- [ ] Custom rendering: `renderCall`, `renderResult`.
- [ ] Overriding built-in tools.
- [ ] Truncation requirements (50KB/2000 lines) và utilities.
- [ ] Remote execution: operations interfaces, spawn hook.
- [ ] Ghi vào `notes/01-extension-api.md` (mục Custom Tools).

---

## ✅ Phase 7: Custom UI

- [ ] `ctx.ui` methods: notify, select, confirm, input, editor, setStatus, setWidget, setFooter, setTitle, setEditorText, setEditorComponent, custom, getAllThemes, getTheme, setTheme, etc.
- [ ] `ctx.ui.custom<T>(factory, options?)` để tạo modal component.
- [ ] Custom message renderer: `pi.registerMessageRenderer(customType, renderer)`.
- [ ] Theme colors: `theme.fg`, `theme.bold`, etc.
- [ ] Syntax highlighting: `highlightCode`.
- [ ] Ghi vào `notes/01-extension-api.md` (mục Custom UI) hoặc file `04-extension-arch.md`.

---

## ✅ Phase 8: State Management & Persistence

- [ ] State reconstruction from tool result `details`.
- [ ] `pi.appendEntry(customType, data)` để lưu state.
- [ ] Session events để restore state.
- [ ] Ghi vào `notes/04-extension-arch.md`.

---

## ✅ Phase 9: Extension Composition & Communication

- [ ] Extensions độc lập, có thể communicate qua `pi.events`.
- [ ] Order of loading: discovery order (alphabetical?).
- [ ] Handler execution order: load order.
- [ ] Override precedence (ví dụ: tool override, command override).
- [ ] Ghi vào `notes/04-extension-arch.md`.

---

## ✅ Phase 10: Diagram & Quiz

- [ ] Vẽ extension lifecycle mermaid (`diagrams/extension-lifecycle.mmd`).
- [ ] Vẽ extension dependencies trong 3-tier (`diagrams/extension-dependencies.mmd`).
- [ ] Tạo quiz (10-15 câu) về:
  - [ ] Discovery & loading
  - [ ] ExtensionAPI methods
  - [ ] Events
  - [ ] Tools & UI
  - [ ] State & persistence
  - [ ] Dependencies
- [ ] Lưu vào `quiz.md`.

---

## ✅ Phase 11: PROGRESS & Finalize

- [ ] Cập nhật `PROGRESS.md` với các steps đã làm.
- [ ] Kiểm tra checklist, đánh dấu [x].
- [ ] Review notes for clarity.

---

**Ghi chú**: Mỗi phase điền vào notes tương ứng. Sau khi hoàn thành, tất cả notes nên đầy đủ.
