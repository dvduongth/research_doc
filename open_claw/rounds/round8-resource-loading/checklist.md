# Resource Loading - Checklist

---

## ✅ Phase 1: Discovery Paths

- [ ] Đọc `DefaultResourceLoader` constructor, xác định default paths:
  - [ ] Context files: global agent dir + walk cwd upward.
  - [ ] Skills: `./skills/`, `~/.pi/agent/skills/`.
  - [ ] Extensions: `~/.pi/agent/extensions/`, `.pi/extensions/`, `additionalExtensionPaths`.
  - [ ] Prompt templates: `./prompts/`, `~/.pi/agent/prompts/`.
  - [ ] Themes: `./themes/`, `~/.pi/agent/themes/`.
- [ ] Xác định cách packages cung cấp resources qua `PackageManager.resolve()`.
- [ ] Ghi vào `notes/01-discovery-paths.md`.

---

## ✅ Phase 2: Loading Order & Precedence

- [ ] Xác định order trong `reload()`:
  1. Resolve packages (get resources from installed packages)
  2. Get enabled paths (filter by settings)
  3. Load từng loại: skills, extensions, prompts, themes.
  4. Load context files (AGENTS.md, CLAUDE.md) – đã load sớm?
  5. System prompt (default/override/append)
- [ ] Hiểu `extendResources()` cho dynamic addition.
- [ ] Ghi vào `notes/01-discovery-paths.md` (thêm order).

---

## ✅ Phase 3: Override System

- [ ] Đọc `DefaultResourceLoaderOptions`: tất cả `*_Override` functions.
- [ ] Hiểu cách override được apply trong `reload()` sau khi resource loaded.
- [ ] Ví dụ: `skillsOverride(base) => { skills: [...], diagnostics: [...] }`.
- [ ] Use case: testing, custom launchers.
- [ ] Ghi chi tiết vào `notes/02-override-system.md`.

---

## ✅ Phase 4: Settings Filtering

- [ ] Đọc `SettingsManager`: cách đọc global vs project settings.
- [ ] Cách filter resources enabled/disabled:
  - `extensions.enabled` / `extensions.disabled`
  - `skills.enabled` / `skills.disabled`
  - `prompts.enabled` / `prompts.disabled`
  - `themes.enabled` / `themes.disabled`
- [ ] Logic: if enabled list non-empty, only those in list; else if disabled list non-empty, exclude those; else all.
- [ ] Path metadata giữ nguyên source info.
- [ ] Ghi vào `notes/03-filtering-settings.md`.

---

## ✅ Phase 5: Hot Reload

- [ ] `/reload` triggers `DefaultResourceLoader.reload()`.
- [ ] Sequence:
  1. `await packageManager.resolve()` (lấy resources từ packages)
  2. `getEnabledResources()` cho mỗi type (filter enabled)
  3. Build path lists (skills, prompts, themes, extensions)
  4. `updateSkillsFromPaths`, `updatePromptsFromPaths`, `updateThemesFromPaths` – load/merge.
  5. Extensions: `loadExtensions()` → new runtime.
  6. Phát events: `session_shutdown` (old), `session_start` (new).
- [ ] Extensions cũ được disposed? Runtime replaced.
- [ ] `extendResources()` dùng khi thêm paths sau reload (ví dụ package install).
- [ ] Ghi vào `notes/04-hot-reload.md`.

---

## ✅ Phase 6: Package Integration

- [ ] `DefaultPackageManager` responsibilities.
- [ ] `resolve()`: lấy tất cả resources từ packages (đọc package.json, tìm entry points).
- [ ] `resolveExtensionSources()` cho extensions (với `temporary` flag cho CLI -e).
- [ ] `extendResources()` gọi từ package manager sau khi install package.
- [ ] Metadata: `source: "package"`, `origin: package-name`.
- [ ] Ghi vào `notes/05-package-integration.md`.

---

## ✅ Phase 7: Diagnostics & Metadata

- [ ] `ResourceDiagnostic` types: errors, warnings (missing file, parse error, duplicate).
- [ ] `PathMetadata` fields: source, origin, originalPath, isPackage.
- [ ] How diagnostics are collected during load (try/catch, push to array).
- [ ] How path metadata used for reload (không cần rediscover từ filesystem nếu already known).
- [ ] Ghi vào `notes/06-diagnostics-metadata.md`.

---

## ✅ Phase 8: Diagrams

- [ ] Vẽ overall resource loading pipeline (mermaid).
- [ ] Vẽ filtering flow (settings enable/disable).
- [ ] Vẽ override flow (các override functions).
- [ ] Lưu vào `diagrams/`.

---

## ✅ Phase 9: Quiz

- [ ] Tạo 10-15 câu về resource loading:
  - [ ] Discovery paths for each type
  - [ ] Loading order
  - [ ] Override functions
  - [ ] Settings filtering
  - [ ] Hot reload steps
  - [ ] Package integration
  - [ ] Diagnostics
- [ ] Lưu vào `quiz.md`.

---

## ✅ Phase 10: Finalize

- [ ] Cập nhật `PROGRESS.md` với các bước đã làm.
- [ ] Đánh dấu [x] checklist.
- [ ] Review notes.

---

**Ghi chú**: Mỗi phase điền vào notes tương ứng. Sau khi xong, tất cả notes nên đầy đủ.
