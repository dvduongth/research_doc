# Diagnostics & Metadata
**Round 8: Resource Loading**

---

## PathMetadata

Mỗi resource path được gán `PathMetadata`:

```typescript
interface PathMetadata {
  source: "auto" | "package";   // "auto" = filesystem discovery, "package" = từ installed package
  origin?: string;              // package name nếu source="package"
  originalPath?: string;        // path gốc (có thể là symlink hoặc package entry path)
  isPackage?: boolean;          // true nếu source=="package"
}
```

**Usage**:
- Hiển thị trong diagnostics: "Extension from package 'foo'".
- Hot reload: biết resource nào từ package để tránh `fs` stat lại (package resources không cần watch).
- Duplicate detection? (có thể dùng path làm key).

**Ví dụ**:
- Filesystem extension: `{ source: "auto", isPackage: false, originalPath: "/home/user/.pi/agent/extensions/myext.ts" }`
- Package extension: `{ source: "package", origin: "my-pi-ext", originalPath: "extensions/myext.ts" }`

---

## ResourceDiagnostic

Khi load resources, errors và warnings được thu thập vào `ResourceDiagnostic[]`.

```typescript
type ResourceDiagnostic =
  | { type: "error"; message: string; path?: string }
  | { type: "warning"; message: string; path?: string };
```

Các trường hợp thường gặp:

| Type | Condition | Example |
|------|-----------|---------|
| `error` | File không đọc được (permission, not found) | `Could not read file /path/to/skill.ts: ENOENT` |
| `error` | Parse error (syntax error, invalid export) | `Skill load error: Unexpected token` |
| `error` | Extension factory không phải function | `Extension must export default function` |
| `error` | Tool registration lỗi (duplicate name?) | `Tool 'read' already registered` (có thể warning) |
| `warning` | Resource bị disabled by settings | `Skill at ./skills/old.skill.ts is disabled` |
| `warning` | Duplicate resource name (skills? prompts?) | `Prompt 'foo' already exists, skipping` |
| `warning` | Unknown resource type trong package manifest | `Package 'pkg' specifies unknown resource type 'foo'` |

Diagnostics được trả về cùng với resources từ `getSkills()`, `getExtensions()`, `getPrompts()`, `getThemes()`:

```typescript
{
  skills: Skill[];
  diagnostics: ResourceDiagnostic[];
}
```

---

## Collection Mechanism

Trong `loadSkillsFromPaths()`:

- Duyệt qua từng path.
- Nếu path là directory, duyệt file `*.skill.ts`/`.js`.
- Với mỗi file:
  - Check disabled via settings (nếu disabled, push warning `Diagnostic` và skip).
  - Try `jiti.import(file)`.
  - Nếu lỗi, push error diagnostic.
  - Nếu exported default class, instantiate, check instanceof Skill, push vào skills array.
  - Nếu không phải class, push warning.

Tương tự cho prompts, themes.

Extensions: `loadExtensions()`:
- Cho mỗi extension path:
  - Check disabled.
  - Try `jiti.import`.
  - Nếu lỗi, push error vào `LoadExtensionsResult.errors`.
  - Nếu không có default function, push error.
  - Nếu có, gọi function với `pi` runtime, catch errors (push to errors? Actually `loadExtensionFromFactory` catch errors and return `{ error, extension }`).
  - Extension được add vào runtime.

---

## Diagnostics Display

Khi pi startup (interactive mode), resource loader logs:

- Errors: màu đỏ, có thể hiển thị path và message.
- Warnings: màu vàng.

Sau khi load, user có thể xem diagnostics qua command (nếu có) hoặc logs.

---

## DebuggingResource Issues

Khi resource không nhận thấy:

1. Kiểm tra path discovery: đúng thư mục không?
2. Kiểm tra settings: enabled/disabled lists.
3. Kiểm tra diagnostics (logs).
4. Kiểm tra file syntax (TypeScript compile errors).
5. Kiểm tra package manifest (đúng field `pi` không).
6. Check permissions.

---

## Metadata Usage in Reload

`pathMetadata` map (path → PathMetadata) được giữ lạiAcross reloads. Khi reload:

- `this.pathMetadata` được reset: `this.pathMetadata = new Map();`
- Sau khi resolve packages và lấy enabled resources, populate lại.
- Điều này giúp tránh phải stat lại filesystem cho resources đã biết (ví dụ package resources). Tuy nhiên, filesystem resources vẫn cần check existence mỗi lần load? Trong `updateSkillsFromPaths`, với mỗi path, nó check `statSync` để xem là file hay directory, rồi load. Vẫn cần I/O.

---

## Performance Implications

- Diagnostics collect thêm overhead (try/catch, logging).
- Metadata storage nhỏ (Map).
- Reload với nhiều resources có thể chậm do I/O và compilation (TypeScript via jiti).
- Có thể cache compiled modules? Jiti có cache?

---

## Future Improvements

- Add more diagnostics (deprecation warnings).
- Provide suggestions to fix errors.
- Allow disabling specific diagnostics.
- Show resource summary after load (counts by source).

---

**End of diagnostics & metadata**.
