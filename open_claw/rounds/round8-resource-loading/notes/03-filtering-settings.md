# Settings-Based Filtering
**Round 8: Resource Loading**

---

## Settings Structure

Settings (global `~/.pi/agent/settings.json` và project `.pi/settings.json`) chứa các keys:

```json
{
  "extensions": { "enabled": [], "disabled": [] },
  "skills": { "enabled": [], "disabled": [] },
  "prompts": { "enabled": [], "disabled": [] },
  "themes": { "enabled": [], "disabled": [] },
  // ... other settings
}
```

Cũng có thể có `"extensions": ["path1", "path2"]` (deprecated?) Thực tế, settings cũ có `extensions` array trực tiếp; settings mới dùng object với enabled/disabled. `SettingsManager` hỗ trợ cả hai.

---

## Filtering Logic

`DefaultResourceLoader` sử dụng `SettingsManager` để filter resources sau khi discovery.

Hàm `getEnabledResources(resources)`:

```typescript
function getEnabledResources(
  resources: Array<{ path: string; enabled: boolean; metadata: PathMetadata }>,
): Array<{ path: string; enabled: boolean; metadata: PathMetadata }> {
  for (const r of resources) {
    if (!this.pathMetadata.has(r.path)) {
      this.pathMetadata.set(r.path, r.metadata);
    }
  }
  return resources.filter((r) => r.enabled);
}
```

Nhưng `enabled` flag đã được tính bởi `PackageManager` hoặc file discovery dựa trên settings.

**Cách tính `enabled`**:

Trong `DefaultPackageManager.resolve()`, với mỗi resource từ package:

```typescript
const enabled = this.isResourceEnabled(resourcePath, settings.enabled, settings.disabled);
```

Logic `isResourceEnabled` (có thể trong `SettingsManager`):

- Nếu `enabled` list non-empty → resource path phải in `enabled` list.
- Nếu `disabled` list non-empty → resource path không được in `disabled` list.
- Nếu cả hai empty → enabled = true.

Tương tự cho filesystem resources: khi `discover*Paths()` tìm thấy file, nó check xem file đó có bị disable không (qua `isResourceEnabled`).

---

## Path Matching

Resource paths được so sánh dạng absolute path với các entries trong `enabled`/`disabled` lists.

- Settings entries có thể là absolute paths hoặc relative paths (resolve relative to cwd?).
- Package resources: path thường là absolute path đến package directory/file.
- So sánh: `isEnabledOrNotDisabled(path, enabled, disabled)` – kiểm tra path equals or startsWith? Thường là exact match hoặc prefix? Code thực tế: sử dụng `isResourceEnabled` với `path` và `settings.enabled` array. Có thể dùng `startsWith` để cho phép disable entire directory.

Xem code `isResourceEnabled` trong `SettingsManager`:

```typescript
isResourceEnabled(path: string, enabled: string[], disabled: string[]): boolean {
  const abs = resolve(path);
  if (enabled.length > 0) {
    return enabled.some(p => resolve(p) === abs || abs.startsWith(resolve(p) + sep));
  }
  if (disabled.length > 0) {
    return !disabled.some(p => resolve(p) === abs || abs.startsWith(resolve(p) + sep));
  }
  return true;
}
```

(Có thể, nhưng cần check code thực tế). Điều này cho phép disable entire directory (ví dụ: `".pi/extensions/malicious"`).

---

## Settings Precedence

- Project settings (`.pi/settings.json`) override global settings (`~/.pi/agent/settings.json`).
- `SettingsManager` load global trước, sau đó merge project (deep merge). Project có thể override `extensions.enabled` etc.

---

## CLI Flags

Có một số flags liên quan:

- `--no-extensions`: tắt tất cả extensions → tương đương `extensions.disabled` với tất cả discovered paths? Thực tế, `noExtensions` option trong loader bypasses extension loading hoàn toàn.
- `--no-tools`: tắt built-in tools, không liên quan đến resource loading.
- `--extension` (`-e`): thêm path vào `additionalExtensionPaths`. Vẫn có thể bị filter bởi enabled/disabled.

---

## Effect on Resource Loading

- **Extensions**: Nếu `extensions.enabled` có entries, chỉ extensions trong list được load. Nếu `extensions.disabled` có entries, extensions trong list bị bỏ qua.
- **Skills, Prompts, Themes**: tương tự.
- Resources từ packages cũng chịu same filter (dựa trên path của package resource).

---

## Debugging Filtering

Khi `pi` chạy, resource loader logs errors và warnings (ví dụ: "Extension X disabled by settings"). Có thể xem diagnostics từ `getExtensions().errors`.

Để kiểm tra resource nào bị filter:
- Xem `settings.json`.
- Xem logs khi load.
- Dùng command (nếu có) để list resources.

---

## Best Practices

- Use explicit `enabled` list để allow only known good resources (security).
- Use `disabled` list để block problematic resources mà không cần remove files.
- Keep project settings under version control để share config với team.
- Review `settings.json` sau khi `pi install` packages mới.

---

**End of filtering settings**.
