# Resource Loading - Quiz

---

## Câu hỏi

**Q1**: Liệt kê đầy đủ các resource types mà `DefaultResourceLoader` load.

**Q2**: Thứ tự load (precedence) của resources là gì? (từ đầu đến cuối)

**Q3**: Context files (AGENTS.md, CLAUDE.md) được load từ đâu? Walk từ thư mục nào đến thư mục nào?

**Q4**:Skills được load từ những paths nào? (Có còn quan trọng không?)

**Q5**: Extensions discovery paths? (global, project, packages, additional)

**Q6**: Prompt templates và themes được load từ đâu?

**Q7**: System prompt có thể được override bằng cách nào? Có `appendSystemPrompt` là gì?

**Q8**: Các `*_Override` functions dùng để làm gì? Ví dụ: `skillsOverride`, `extensionsOverride`.

**Q9**: Settings `skills.enabled` và `skills.disabled` hoạt động thế nào? Nếu both empty thì sao?

**Q10**: Hot reload (`reload()`) làm những bước gì? Có phát events gì?

**Q11**: `PackageManager.resolve()` trả về cấu trúc gì? Nó được dùng như thế nào trong resource loader?

**Q12**: `PathMetadata` chứa những gì? Tại sao cần lưu metadata?

**Q13**: `extendResources(paths)` dùng khi nào? Nó update các path lists như thế nào?

**Q14**: Diagnostics được thu thập khi nào? Ví dụ lỗi nào có thể xảy ra khi load resource?

**Q15**: Nếu bạn muốn thêm một resource path mới (ví dụ custom prompts directory) mà không đặt trong cwd, bạn làm gì?

---

## Đáp án (cheat sheet)

1. Skills, extensions, prompt templates, themes, context files (AGENTS.md, CLAUDE.md), system prompt, append system prompt.
2. Order trong `reload()`:
   - Resolve packages (get resources from installed packages)
   - Get enabled paths (filter by settings)
   - Load skills, extensions, prompts, themes (merge from filesystem + packages)
   - Load context files (global + walk ancestors)
   - System prompt (default or override) + append
3. Context files: `loadProjectContextFiles()` walk từ `cwd` lên root, tìm AGENTS.md/CLAUDE.md trong mỗi thư mục. Ngoài ra, load từ global agent dir.
4. Skills paths: `./skills/` và `~/.pi/agent/skills/`. Skills hiện đã deprecated nhưng vẫn supported.Không còn quan trọng bằng extensions.
5. Extensions: global `~/.pi/agent/extensions/`, project `.pi/extensions/`, packages (qua `pi install`), `additionalExtensionPaths` (flags -e). Directory with `index.ts` or single `.ts`.
6. Prompt templates: `./prompts/`, `~/.pi/agent/prompts/`. Themes: `./themes/`, `~/.pi/agent/themes/`.
7. Override qua CLI `--system-prompt <file>` hoặc option `systemPrompt` khi tạo resource loader. `appendSystemPrompt` là array của strings được append vào system prompt (ví dụ from context files? Actually là separate option).
8. `*_Override` functions allow programmatic customization of loaded resources. Ví dụ: `skillsOverride(base)` nhận base skills array, trả về modified skills array. Dùng cho testing hoặc custom modification.
9. `enabled` array: nếu non-empty, chỉ resources in list được giữ. `disabled` array: nếu non-empty, loại bỏ các resource trong list. Nếu both empty, tất cả resources được giữ (không filter).
10. `/reload` calls `resourceLoader.reload()`. Steps: resolve packages, get enabled paths, load resources (skills, extensions, prompts, themes) với `update*FromPaths`, load extensions mới (emits `session_shutdown` old, `session_start` new). Events: `session_shutdown` (old runtime), `session_start` (new runtime), `resources_discover` (reason "reload").
11. `resolve()` trả về `LoadExtensionsResult` nhưng với fields `extensions`, `skills`, `prompts`, `themes` (mỗi cái là array of `{ path, enabled, metadata }`). Resource loader dùng để lấy enabled paths và metadata.
12. `PathMetadata` chứa: `source` ("auto" or "package"), `origin` (package name nếu từ package), `originalPath`, `isPackage`. Dùng để track nguồn resource, cho hot reload và diagnostics.
13. `extendResources(paths)` được gọi khi thêm paths mới (ví dụ sau khi install package, hoặc CLI -e). Nó merge paths vào các list đang lưu (`lastSkillPaths`, `lastPromptPaths`, `lastThemePaths`) và gọi `update*FromPaths` để load ngay.
14. Diagnostics được thu thập trong `loadSkills()`, `loadPromptTemplates()`, `loadThemes()` (try/catch parse errors, file not found). Mỗi `get*()` trả về `{ resources, diagnostics }`.
15. Dùng `--extension` (CLI) với path tương đối hoặc tuyệt đối; `-e` thêm vào `additionalExtensionPaths`. Hoặc đặt vào `settings.json` mục `extensions` array.

---

**Lưu ý**: Quiz 15 câu, bao phủ discovery, order, override, filtering, hot reload, packages, diagnostics.
