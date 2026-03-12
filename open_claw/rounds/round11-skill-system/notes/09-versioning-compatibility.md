# Skill Versioning & Compatibility
**Round 11: Skill System**

---

## Agent Skills Standard

Pi-mono implement [Agent Skills Standard](https://agentskills.io/specification):
- Spec reference cho frontmatter: https://agentskills.io/specification#frontmatter-required
- Spec reference cho integration: https://agentskills.io/integrate-skills

---

## Không có Version Management

Pi-mono **không quản lý version** cho skills:
- Không có field `version` trong frontmatter
- Không có registry hay package manager
- Không có `install`, `update`, `upgrade` commands
- Không có changelog hay release system

---

## Quản lý Skills trong thực tế

Skills được quản lý thủ công:

### 1. Git
```
.pi/skills/
├── my-skill/
│   └── SKILL.md
```
→ Track trong git cùng project. Version = git commit.

### 2. Packages (npm)
Trong `package.json`:
```json
{
  "pi": {
    "skills": ["./skills/"]
  }
}
```
→ Skill đi kèm package. Version = package version.

### 3. Copy thủ công
Copy file SKILL.md vào `~/.pi/agent/skills/` hoặc `.pi/skills/`.

---

## Compatibility

### Field `compatibility` trong frontmatter

```yaml
---
name: docker-deploy
description: Deploy Docker containers
compatibility: Requires Docker CLI installed. Linux/macOS only.
---
```

Field này **chỉ mang tính thông tin** — agent có thể đọc nhưng không enforce.

### Với pi-mono versions

Skills không có constraint trên phiên bản pi-mono. Tuy nhiên:
- Skill dùng `allowed-tools` cần pi-mono version hỗ trợ field đó
- Skill dựa vào tool cụ thể (vd: `edit`) cần tool đó available
- Nội dung SKILL.md có thể giả định tính năng chỉ có ở version mới

---

## Constants và Limits

Source: `skills.ts`

```typescript
MAX_NAME_LENGTH = 64         // Tên tối đa 64 ký tự
MAX_DESCRIPTION_LENGTH = 1024  // Mô tả tối đa 1024 ký tự
```

Ignore files: `.gitignore`, `.ignore`, `.fdignore`

---

## Lenient Validation

Pi-mono validate **khoan dung** (lenient):
- Hầu hết vi phạm chỉ tạo **warning**, skill vẫn load
- Chỉ 2 trường hợp **chặn** load:
  1. Thiếu `description`
  2. YAML frontmatter không hợp lệ

Triết lý: Skill là plain Markdown file — dù metadata không hoàn hảo, nội dung vẫn có giá trị.

---

## Test Fixtures (Tham khảo)

Source: `packages/coding-agent/test/fixtures/skills/`

| Test Case | Kết quả |
|-----------|---------|
| `valid-skill/` | Load thành công, không warning |
| `missing-description/` | Bị chặn load |
| `no-frontmatter/` | Bị chặn load |
| `invalid-yaml/` | Bị chặn load |
| `invalid-name-chars/` | Warning, vẫn load |
| `long-name/` | Warning, vẫn load |
| `name-mismatch/` | Warning, vẫn load |
| `consecutive-hyphens/` | Warning, vẫn load |
| `unknown-field/` | Silent, vẫn load |
| `disable-model-invocation/` | Load nhưng ẩn khỏi system prompt |
| `nested/child-skill/` | Load recursive |

---

## Tương lai

Agent Skills Standard là spec mở — có thể phát triển thêm:
- Version field trong frontmatter
- Dependency declarations giữa skills
- Registry/marketplace cho skills
- Automatic validation tools

Nhưng hiện tại (v0.57.1), skill system giữ **đơn giản tối đa** — chỉ là Markdown files.

---

**End of versioning & compatibility**.
