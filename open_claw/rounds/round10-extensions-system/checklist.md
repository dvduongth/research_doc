# Extensions System - Checklist

## ✅ Phase 1: Extension Discovery & Loading

- [ ] Đọc `extension-manager.ts`: `loadExtensions()`, `discoverExtensions()`.
- [ ] Hiểu locations: `extensions/` folder, `extensions.json`, global paths.
- [ ] Extension manifest: `extension.json` fields (id, name, version, dependencies, main, etc.).
- [ ] Dynamic import: `importExtension()`.
- [ ] Ghi `notes/01-discovery-loading.md`.

---

## ✅ Phase 2: Extension Lifecycle

- [ ] Lifecycle hooks: `init()`, `enable()`, `disable()`.
- [ ] `ExtensionContext` object: `agent`, `log`, `config`, `provide`, `consume`, `event`, `on`, `off`.
- [ ] State: enabled/disabled, error handling.
- [ ] Ghi `notes/02-lifecycle.md`.

---

## ✅ Phase 3: Event System

- [ ] `ExtensionContext.on(event, handler)`, `once()`, `off()`.
- [ ] Event namespaces: prefix `extension:`.
- [ ] Propagation: how extensions listen to agent events.
- [ ] Ghi `notes/03-event-system.md`.

---

## ✅ Phase 4: Hook Points

- [ ] `transformContext` hook.
- [ ] `convertToLlm` hook.
- [ ] `getSteeringMessages`, `getFollowUpMessages` injection.
- [ ] `before_provider_request` hook.
- [ ] `context` event (modify messages pre-LLM).
- [ ] Ghi `notes/04-hook-points.md`.

---

## ✅ Phase 5: Provided Resources

- [ ] Tools: `provide.tools()`.
- [ ] Prompts: `provide.prompts()`.
- [ ] Themes: `provide.themes()`.
- [ ] Contexts: `provide.contexts()`.
- [ ] Integration into agent (tools, prompts, etc).
- [ ] Ghi `notes/05-provided-resources.md`.

---

## ✅ Phase 6: Dependencies & Ordering

- [ ] Manifest `dependencies` field (ext ids).
- [ ] Topological sort để load order.
- [ ] Conflict resolution?
- [ ] Ghi `notes/06-dependencies-ordering.md`.

---

## ✅ Phase 7: Context & Isolation

- [ ] ExtensionContext isolation: mỗi extension có context riêng.
- [ ] Sharing data via `provide`/`consume`.
- [ ] Versioning & compatibility.
- [ ] Ghi `notes/07-context-isolation.md`.

---

## ✅ Phase 8: Extension API Deep Dive

- [ ] `provide.tool(name, fn)` signature.
- [ ] `provide.prompt(template)`.
- [ ] `provide.theme(colors, fonts)`.
- [ ] `provide.context(schema)`.
- [ ] Consuming other extensions: `consume(extensionId)`.
- [ ] Ghi `notes/08-extension-api.md`.

---

## ✅ Phase 9: Debugging & Dev Workflow

- [ ] Logging: `ExtensionContext.log`.
- [ ] Errors during extension load/init.
- [ ] Hot-reload? Reloading extensions.
- [ ] Testing extensions.
- [ ] Ghi `notes/09-debugging-dev.md`.

---

## ✅ Phase 10: Diagrams & Quiz

- [ ] Vẽ diagrams: extension loading sequence, event flow, hook invocation.
- [ ] Tạo quiz (15-20 câu).
- [ ] Lưu vào `diagrams/` và `quiz.md`.
- [ ] Finalize checklist & PROGRESS.

---

**Hoàn thành**: Tất cả notes, diagrams, quiz.
