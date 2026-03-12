# Resource Discovery Paths
**Round 8: Resource Loading**

---

## Tổng quan

`DefaultResourceLoader` discover và load resources từ nhiều nguồn:

- **Filesystem**: Global (`~/.pi/agent/`), project-relative (`./`, `.pi/`).
- **Packages**: Installed via `pi install`.
- **CLI flags**: `--extension`, `--skill`, `--prompt`, `--theme` (có thể không có, nhưng có `additional*Paths` options).
- **Settings**: `extensions`, `skills`, `prompts`, `themes` arrays (dài hạn).

---

## Resource Types & Default Paths

| Resource | Global Path | Project Path | Additional | Package |
|----------|-------------|--------------|------------|---------|
| **Skills** | `~/.pi/agent/skills/*.skill.ts`<br>`~/.pi/agent/skills/*/index.ts` | `./skills/*.skill.ts`<br>`./skills/*/index.ts` | `additionalSkillPaths` | `package.pi.skills` |
| **Extensions** | `~/.pi/agent/extensions/*.ts`<br>`~/.pi/agent/extensions/*/index.ts` | `.pi/extensions/*.ts`<br>`.pi/extensions/*/index.ts` | `additionalExtensionPaths` | `package.pi.extensions` |
| **Prompt Templates** | `~/.pi/agent/prompts/*.md` | `./prompts/*.md` | `additionalPromptTemplatePaths` | `package.pi.prompts` |
| **Themes** | `~/.pi/agent/themes/*.theme.json`<br>`~/.pi/agent/themes/*.theme.js` | `./themes/*.theme.json`<br>`./themes/*.theme.js` | `additionalThemePaths` | `package.pi.themes` |
| **Context Files** | `~/.pi/agent/AGENTS.md`<br>`~/.pi/agent/CLAUDE.md` | Walk cwd upward (từ current directory lên root) tìm file trong mỗi thư mục | Không | Không |

**File patterns**:
- Skills: `*.skill.ts` or `.js` (extensionless?).
- Extensions: `*.ts` (single file) or directory with `index.ts`.
- Prompt templates: `*.md`.
- Themes: `*.theme.json` or `*.theme.js`.
- Context files: `AGENTS.md` or `CLAUDE.md` (first found in each dir).

---

## Discovery Process

### Constructor

`DefaultResourceLoader` constructor gọi `loadSkillsFromPaths()`, `loadPromptTemplatesFromPaths()`, `loadThemesFromPaths()` với các path lists ban đầu (từ discovery). Nó cũng gọi `loadProjectContextFiles()` ngay để load context files.

Các path lists ban đầu được xác định bằng `discoverSkillsPaths()`, `discoverExtensionsPaths()`, etc., mỗi function walk các thư mục mặc định.

### reload()

Khi `/reload` được gọi, `reload()`:

1. Gọi `packageManager.resolve()` để lấy resources từ packages (kể cả extensions, skills, prompts, themes).
2. Merge với `additiona*Paths` từ CLI flags.
3. Lọc enabled resources qua `getEnabledResources()`.
4. Cập nhật `lastSkillPaths`, `lastPromptPaths`, `lastThemePaths` với paths mới.
5. Gọi `updateSkillsFromPaths()`, `updatePromptsFromPaths()`, `updateThemesFromPaths()` để load/merge resources mới.
6. Với extensions, gọi `loadExtensions()` với enabled extension paths, tạo `ExtensionRuntime` mới.

---

## Package Resource Discovery

`DefaultPackageManager.resolve()`:

- Đọc `settings.json` (global và project) để lấy `packages` array.
- Với mỗi package source (npm, git, local path):
  - Nếu chưa install, resolve và install (trong `ensurePackage`).
  - Đọc `package.json` của package.
  - Kiểm tra field `pi` để xác định entry points:
    - `pi.extensions`: array of paths (relative to package root).
    - `pi.skills`
    - `pi.prompts`
    - `pi.themes`
  - Trả về `{ extensions, skills, prompts, themes }` với `{ path, enabled, metadata }` cho mỗi entry.
    - `enabled`: check against settings enable/disabled lists.
    - `metadata`: `{ source: "package", origin: packageName, originalPath: ... }`.

---

## Path Metadata

Mỗi resource được gán `PathMetadata`:

```typescript
interface PathMetadata {
  source: "auto" | "package"; // "auto" = filesystem discovery, "package" = từ package
  origin?: string; // package name nếu source="package"
  originalPath?: string; // path gốc trước khi resolve symlink/expand
  isPackage?: boolean; // alias: source==="package"
}
```

Metadata dùng để:
- Hiển thị source trong diagnostics (ví dụ: "from package foo").
- Hot reload: biết file nào từ package để không duyệt lại filesystem.
- Tracking.

---

## Context Files Cách loading

`loadProjectContextFiles()`:

1. Xác định `agentDir` (global agent dir, thường `~/.pi/agent/`) và `cwd`.
2. Load từ `agentDir` nếu có `AGENTS.md` hoặc `CLAUDE.md` → thêm vào list.
3. Từ `cwd`, walk lên root (theo `path.split(sep)`), với mỗi thư mục, thử load `AGENTS.md` hoặc `CLAUDE.md`. Nếu tìm thấy, thêm vào list.
4. Trả về array `{ path, content }`. Content được prepend vào system prompt sau (ở mức độ `DefaultResourceLoader.getAppendSystemPrompt()`? Actually context files content được added to `appendSystemPrompt` trong constructor).

Lưu ý: Context files không có hot reload (chỉ load lúc startup). Để thay đổi, phải `/reload`? Thực tế, `reload()` không gọi lại `loadProjectContextFiles()`. Vậy context files chỉ load once khi `DefaultResourceLoader` được tạo lần đầu (startup). Nếu muốn reload context files, cần recreate loader (thường chỉ khi restart pi).

---

## Skills: Legacy nhưng vẫn supported

Skills là định dạng cũ, `*.skill.ts` với class extends `BaseSkill`. Extensions đã thay thế skills. Tuy nhiên, `pi` vẫn support load skills từ paths và packages.

Skills được load bằng `loadSkills()`:
- Đọc file, compile TypeScript (jiti? Actually `loadSkillsFromPaths` dùng `jiti` để require file).
- File export default class implements `Skill` interface.
- Instantiate class, lưu vào `skills` array.

---

## Loading Order Cuối cùng

Trong `DefaultResourceLoader.reload()`:

1. **Packages resolve** → lấy package resources.
2. **Extensions**: `getEnabledPaths(resolvedPaths.extensions)` + `additionalExtensionPaths` → `loadExtensions()`.
3. **Skills**: `updateSkillsFromPaths()` (path list merged from packages + additional).
4. **Prompts**: `updatePromptsFromPaths()`.
5. **Themes**: `updateThemesFromPaths()`.
6. **Context files**: đã loaded trong constructor, không reload.
7. **System prompt**: lấy từ options (`systemPrompt`) hoặc default.

Vậy order thực tế: extensions, skills, prompts, themes. System prompt xử lý riêng.

---

**End of discovery paths & loading order**.
