# Skill Discovery & Loading
**Round 11: Skill System**

---

## Discovery Sources (Thứ tự ưu tiên)

Source: `skills.ts` lines 355-459, `docs/skills.md` lines 20-40

1. **CLI Arguments**: `--skill <path>` (có thể lặp, additive ngay cả với `--no-skills`)
2. **Project-level**:
   - `.pi/skills/` (trong cwd)
   - `.agents/skills/` (trong cwd và các thư mục cha, lên đến git root hoặc filesystem root)
3. **Global**:
   - `~/.pi/agent/skills/`
   - `~/.agents/skills/`
4. **Settings**: Mảng `skills` trong `settings.json`
5. **Packages**: Thư mục `skills/` hoặc entries `pi.skills` trong `package.json`

---

## Cấu trúc thư mục Skill

```
skills/
├── my-skill/
│   └── SKILL.md          (bắt buộc)
├── another-skill/
│   └── SKILL.md
└── standalone-file.md     (skill đơn lẻ — chỉ ở root khi includeRootFiles=true)
```

Có 2 cách nhận diện skill:
- **File `.md` trực tiếp** ở root thư mục skills (khi `includeRootFiles=true`)
- **File `SKILL.md`** trong subdirectory (cách chính)

---

## Quy trình Discovery

### Khởi động agent

1. Agent gọi `loadSkills(options)` với các paths từ settings + CLI + defaults
2. Với mỗi thư mục skills:
   - Scan subdirectories tìm `SKILL.md`
   - Tôn trọng `.gitignore`, `.ignore`, `.fdignore` (source: lines 15-64)
   - Follow symlinks, detect duplicates qua `realpathSync()`
3. Parse YAML frontmatter của mỗi file
4. Validate: `description` bắt buộc, `name` kiểm tra quy tắc
5. Build catalog: mảng `Skill[]`

### Collision Detection

Source: `skills.ts` lines 382-398

- Skill đầu tiên với tên đã cho **thắng** (first-wins)
- Collision được report dạng diagnostic `type: "collision"`
- File trùng (qua symlink) bị skip im lặng

---

## LoadSkills API

```typescript
export interface LoadSkillsOptions {
  cwd?: string;               // Default: process.cwd()
  agentDir?: string;          // Default: ~/.pi/agent
  skillPaths?: string[];      // Đường dẫn skill explicit
  includeDefaults?: boolean;  // Default: true
}

export interface LoadSkillsResult {
  skills: Skill[];
  diagnostics: ResourceDiagnostic[];
}
```

---

## Source Types

Mỗi skill có `source` field cho biết nguồn gốc:

| Source | Ý nghĩa |
|--------|---------|
| `"user"` | Từ `~/.pi/agent/skills/` (global) |
| `"project"` | Từ `.pi/skills/` hoặc `.agents/skills/` (project-level) |
| `"path"` | Từ `--skill` CLI arg hoặc settings paths |

---

## Ignore Rules

Source: `skills.ts` lines 15-64

Skill discovery tôn trọng các file ignore:
- `.gitignore`
- `.ignore`
- `.fdignore`

Hỗ trợ negation patterns (`!important-skill/`).

---

## Hot Reload

Skill catalog được refresh khi:
- User chạy `/reload` command
- Extension gọi `ctx.reload()`

Không có file watcher tự động — cần trigger thủ công.

---

## Error Handling

- SKILL.md bị lỗi YAML → **bỏ qua**, log diagnostic
- Thiếu `description` → **bỏ qua**, log diagnostic
- Tên không hợp lệ → **warning**, vẫn load
- Thư mục trống (không có SKILL.md) → **bỏ qua** im lặng

---

## Không có Registry

**Quan trọng**: Pi-mono **không có** package manager hay registry cho skills. Skills được quản lý thủ công:
- Copy file SKILL.md vào thư mục skills
- Hoặc dùng packages với field `pi.skills` trong `package.json`
- Hoặc chỉ định đường dẫn trong `settings.json`

---

**End of discovery & loading**.
