# Skill Lifecycle
**Round 11: Skill System**

---

## Lifecycle đơn giản

Skills trong pi-mono có lifecycle rất đơn giản so với extensions — không có `init()`, `enable()`, `disable()`, không có event handlers, không có runtime code.

---

## Các giai đoạn

### 1. Discovery (Scan)

Agent khởi động → `loadSkills()` quét các thư mục → tìm file SKILL.md → parse frontmatter → validate → tạo catalog `Skill[]`.

### 2. System Prompt Injection

Source: `skills.ts` lines 290-316, `system-prompt.ts` lines 85-88

Sau khi load, skills được format và inject vào system prompt:

```typescript
formatSkillsForPrompt(skills: Skill[]): string
```

Hàm này:
- Lọc bỏ skills có `disableModelInvocation: true`
- Trả về chuỗi rỗng nếu không có skill nào visible
- Bọc mỗi skill trong tag XML: `<skill>` với `<name>`, `<description>`, `<location>`
- Thêm hướng dẫn sử dụng ở đầu

**Điều kiện**: Chỉ inject khi tool `read` available (agent cần read để đọc file SKILL.md).

**Text hướng dẫn trong system prompt:**
> "The following skills provide specialized instructions for specific tasks. Use the read tool to load a skill's file when the task matches its description. When a skill file references a relative path, resolve it against the skill directory..."

### 3. Invocation (Gọi skill)

Có 2 cách gọi:

**a) Tự động (model-driven):**
Agent đọc system prompt, thấy skill phù hợp → dùng tool `read` để đọc file SKILL.md → làm theo hướng dẫn.

**b) Thủ công (user-driven):**
User gõ `/skill:my-skill [arguments]` → agent expand thành nội dung skill + arguments.

### 4. Reload

User chạy `/reload` → `DefaultResourceLoader` load lại tất cả resources (bao gồm skills) từ disk.

### 5. Removal

Xóa file SKILL.md khỏi thư mục → reload → skill biến mất khỏi catalog.

---

## Không có Activation/Deactivation

Tất cả skills đã load đều "active" — trừ khi có `disableModelInvocation: true` (bị ẩn khỏi system prompt nhưng vẫn gọi được qua `/skill:name`).

---

## Lifecycle Flow

```
Startup
  │
  ▼
loadSkills() → Scan dirs → Parse SKILL.md → Validate → Skill[]
  │
  ▼
formatSkillsForPrompt() → Inject vào system prompt (trừ disableModelInvocation)
  │
  ▼
Agent nhận prompt → Thấy skill phù hợp → read SKILL.md → Làm theo hướng dẫn
  │                                         ▲
  ▼                                         │
User gõ /skill:name ──────────────────────► Expand thành XML block + content
  │
  ▼
/reload → Load lại từ disk
```

---

## So sánh với Extension Lifecycle

| Giai đoạn | Skill | Extension |
|-----------|-------|-----------|
| Load | Parse SKILL.md, validate metadata | Import TypeScript module, gọi factory function |
| Activate | Inject vào system prompt | Factory đăng ký tools, events, commands |
| Runtime | Agent đọc file khi cần | Event handlers chạy liên tục |
| Deactivate | Không có | Không có (unload khi restart) |
| Reload | `/reload` scan lại disk | `/reload` import lại modules |

---

## Không có Versioning System

Pi-mono **không quản lý phiên bản skill**. Không có version field trong frontmatter, không có update command, không có registry. Skill là static file — quản lý bằng git, copy thủ công, hoặc packages.

---

**End of lifecycle notes**.
