# Hot Reload
**Round 8: Resource Loading**

---

## Triggering Reload

- User gõ `/reload` trong interactive mode.
- Extension hoặc command gọi `ctx.reload()`.
- (Có thể) sau khi `pi install` một package, user cần `/reload` để load extensions mới từ package.

---

## Reload Sequence

`DefaultResourceLoader.reload()` (async):

1. **Resolve packages**:
   ```typescript
   const resolvedPaths = await this.packageManager.resolve();
   ```
   - Lấy tất cả resources từ installed packages (read package.json, check `pi` field).
   - Trả về `LoadExtensionsResult` với fields `extensions`, `skills`, `prompts`, `themes` (mỗi cái là array of `{ path, enabled, metadata }`).

2. **Get enabled paths**:
   ```typescript
   const getEnabledPaths = (resources) => getEnabledResources(resources).map(r => r.path);
   const enabledExtensions = getEnabledPaths(resolvedPaths.extensions);
   const enabledSkillResources = getEnabledResources(resolvedPaths.skills);
   const enabledPrompts = getEnabledPaths(resolvedPaths.prompts);
   const enabledThemes = getEnabledPaths(resolvedPaths.themes);
   ```
   - Đồng thời, populate `this.pathMetadata` map.

3. **Update path lists**:
   - `this.lastSkillPaths = this.mergePaths(this.lastSkillPaths, enabledSkillResources.map(r => r.path))`
   - Tương tự cho prompts, themes.
   - Extensions: dùng trực tiếp `enabledExtensions` (không lưu vào `last*Paths`? Extensions không có `last*Paths`, vì extensions được load riêng qua `loadExtensions()`).

4. **Update resources**:
   - Skills: `this.updateSkillsFromPaths(this.lastSkillPaths, enabledSkillResources)`
   - Prompts: `this.updatePromptsFromPaths(this.lastPromptPaths, enabledPrompts)`
   - Themes: `this.updateThemesFromPaths(this.lastThemePaths, enabledThemes)`
   - Extensions: `this.extensionsResult = await loadExtensions(enabledExtensions, this.extensionsResult.runtime)` – tạo runtime mới.

5. **Runtime switch**:
   - Extensions: `this.extensionsResult.runtime` replaced. Old extensions are disposed (but still in memory until GC). Events `session_shutdown` (old) và `session_start` (new) được phát bởi whoever calls reload? Thực tế, `reload()` trong resource loader không phát events; nó chỉ prepare resources. Events được phát bởi `SessionManager.reload()` hoặc command handler. Kiểm tra lại: Trong code, `reload()` của resource loader chỉ load lại resources, không phát events. Session manager sẽ gọi `resourceLoader.reload()`, sau đó recreate session (hoặc emit events). Cần xác nhận.
   - Skills, prompts, themes: arrays replaced, diagnostics updated.

6. **Apply overrides** (nếu có):
   - Sau khi update resources, constructor options `*_Override` được apply (trong reload, chúng được apply ngay trong các `update*FromPaths`? Actually override được áp dụng trong constructor và có lẽ trong `reload()` sau khi update? Code: `updateSkillsFromPaths` gọi `this.skills = loadedSkills`, sau đó nếu `this.skillsOverride` có, sẽ gọi override. Tương tự cho các loại khác.

7. **Result**: ResourceLoader mới resources, extensions mới runtime, skills/prompts/themes mới arrays.

---

## Extension Runtime Transition

Khi extensions được reload:

- Old runtime: extensions có thể đang subscribe events, có listeners. Cần gỡ bỏ.
- New runtime: extensions mới load, register handlers.
- Events:
  - `session_shutdown` được phát trên **old runtime** (trước khi discard). Extensions cũ có thể cleanup.
  - `session_start` được phát trên **new runtime** (sau khi load xong). Extensions mới initialize.
  - `resources_discover` event với reason `"reload"` được phát (từ resource loader?) Có thể.

---

## What Gets Reloaded?

- **Extensions** (full reload).
- **Skills** (full reload).
- **Prompt templates** (full reload).
- **Themes** (full reload).
- **System prompt**? Nếu có `--system-prompt` flag hoặc option, nó vẫn giữ nguyên (không reload từ file). Nếu muốn reload system prompt file, cần restart? Có thể override system prompt qua option mới.

**Context files** (AGENTS.md, CLAUDE.md) **không được reload**. Chỉ load lúc startup (constructor). Để thay đổi, cần restart pi.

---

## Performance Considerations

- Reload có thể mất thời gian nếu có nhiều extensions, packages lớn.
- Extensions được compile (TypeScript) khi load, có thể delay.
- Nên reload only khi cần (sau khi install package, sửa extension).
- Reload trong khi agent đang streaming? Pi có thể delay reload until idle (từ `ctx.reload()` mô tả). Khi user gõ `/reload`, pi sẽ chờ agent idle trước khi thực hiện.

---

## Error Handling

- Nếu một extension lỗi khi load, lỗi được catch và thêm vào `extensionsResult.errors`. Các extensions khác vẫn load.
- Reload không fail nếu có lỗi; chỉ báo lỗi.
- Sau reload, extensions lỗi sẽ không hoạt động nhưng không crash app.

---

## Using `extendResources()`

Trong some scenarios, resources được thêm động mà không cần full reload (ví dụ: sau `pi install`, package manager gọi `extendResources()` với paths mới từ package).

`extendResources(paths: ResourceExtensionPaths)`:
- Merge paths vào `last*Paths`.
- Gọi `update*FromPaths` để load thêm resources (not replace).
- Không gọi overrides? Có vẻ override vẫn apply (vì `update*FromPaths` sẽ gọi override sau khi merge).

Điều này cho phép incremental resource addition.

---

## Summary Flowchart

```
User types /reload
   |
   v
SessionManager (or command) calls resourceLoader.reload()
   |
   v
packageManager.resolve() -> packages resources
   |
   v
Filter enabled paths (settings)
   |
   v
Load extensions (new runtime) + load skills/prompts/themes
   |
   v
Apply overrides (if any)
   |
   v
Emit events:
  - session_shutdown (old runtime)
  - session_start (new runtime)
  - resources_discover (reason: "reload")
   |
   v
User sees "Reloaded resources" message
```

---

**End of hot reload notes**.
