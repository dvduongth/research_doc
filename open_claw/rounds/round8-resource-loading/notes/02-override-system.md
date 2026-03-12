# Override System
**Round 8: Resource Loading**

---

## Tổng quan

`DefaultResourceLoaderOptions` cung cấp các override functions để programmatically thay đổi kết quả resource loading. Chúng hữu ích cho testing, custom launchers, hoặc dynamic modification.

---

## Override Functions

```typescript
interface DefaultResourceLoaderOptions {
  // ... many fields
  extensionsOverride?: (base: LoadExtensionsResult) => LoadExtensionsResult;
  skillsOverride?: (base: { skills: Skill[]; diagnostics: ResourceDiagnostic[] }) => { skills: Skill[]; diagnostics: ResourceDiagnostic[] };
  promptsOverride?: (base: { prompts: PromptTemplate[]; diagnostics: ResourceDiagnostic[] }) => { prompts: PromptTemplate[]; diagnostics: ResourceDiagnostic[] };
  themesOverride?: (base: { themes: Theme[]; diagnostics: ResourceDiagnostic[] }) => { themes: Theme[]; diagnostics: ResourceDiagnostic[] };
  agentsFilesOverride?: (base: { agentsFiles: Array<{ path: string; content: string }> }) => { agentsFiles: Array<{ path: string; content: string }> };
  systemPromptOverride?: (base: string | undefined) => string | undefined;
  appendSystemPromptOverride?: (base: string[]) => string[];
}
```

---

## Khi nào Override Được Apply?

Trong `DefaultResourceLoader.reload()` (và constructor), sau khi resources được load thông thường:

1. Extensions loaded → `this.extensionsResult`.
2. Skills loaded → `this.skills`, `this.skillDiagnostics`.
3. Prompts loaded → `this.prompts`, `this.promptDiagnostics`.
4. Themes loaded → `this.themes`, `this.themeDiagnostics`.
5. Context files loaded → `this.agentsFiles` (một lần, trong constructor).
6. System prompt: từ options `systemPrompt` hoặc default.

Sau đó, nếu các `*_Override` được cung cấp, chúng được gọi để thay thế kết quả:

- `this.extensionsResult = opts.extensionsOverride?.(this.extensionsResult) ?? this.extensionsResult;`
- Tương tự cho skills, prompts, themes.
- `this.agentsFiles = opts.agentsFilesOverride?.(this.agentsFiles) ?? this.agentsFiles;`
- `this.systemPrompt = opts.systemPromptOverride?.(this.systemPrompt) ?? this.systemPrompt;`
- `this.appendSystemPrompt = opts.appendSystemPromptOverride?.(this.appendSystemPrompt) ?? this.appendSystemPrompt;`

Vậy override có thể:
- Thêm, loại bỏ, sửa đổi resources.
- Thêm diagnostics.
- Thay đổi system prompt.

---

## Ví dụ Override

### Filter skills theo tag

```typescript
skillsOverride: (base) => {
  const filtered = base.skills.filter(s => s.tags.includes("experimental"));
  return { skills: filtered, diagnostics: base.diagnostics };
}
```

### Inject custom extension

```typescript
extensionsOverride: (base) => {
  const myExt = loadMyExtensionFromMemory(); // custom function
  return { extensions: [...base.extensions, myExt], errors: base.errors };
}
```

### Replace system prompt

```typescript
systemPromptOverride: (base) => {
  return base + "\n\nYou are a helpful assistant.";
}
```

---

## Lưu ý

- Override **không** phải là nơi chính để enable/disable resources. Dùng settings(`*_enabled/disabled`) cho việc đó.
- Override thay đổi objects/arrays **in-place**? Thực tế, override function được gọi với base values, và bạn trả về value mới (có thể là mutated cũng được, nhưng nên immutable).
- Override chỉ áp dụng khi `DefaultResourceLoader` được construct (với options) và trong `reload()` (vì override functions được lưu trong instance và dùng lại mỗi lần reload).
- Nếu override function thay đổi, cần gọi `reload()` để apply.

---

## Use Cases

1. **Testing**: Mock một số resources.
2. **Custom launcher**: Piper app muốn thêm resource từ memory hoặc network.
3. **Dynamic configuration**: Dựa trên env vars, feature flags.
4. **Migration**: Chuyển đổi resource format cũ sang mới.

---

**End of override system**.
