# Skill Execution Model
**Round 11: Skill System**

---

## Core Concept

Skill **không chạy code** — skill cung cấp **tài liệu hướng dẫn** mà agent đọc và làm theo. Cơ chế hoạt động: system prompt injection + read tool.

---

## Cách 1: Auto-invocation qua System Prompt

Source: `skills.ts` lines 290-316

Khi skill được inject vào system prompt, agent thấy danh sách skills với mô tả. Khi user request khớp với mô tả skill, agent tự quyết định đọc file SKILL.md bằng tool `read`.

**Ví dụ:**

System prompt chứa:
```xml
<skill>
  <name>pdf</name>
  <description>Extract text and analyze PDF documents</description>
  <location>/home/user/.pi/agent/skills/pdf/SKILL.md</location>
</skill>
```

User: "Hãy phân tích file report.pdf"

Agent: Nhận thấy skill `pdf` phù hợp → gọi `read("/home/user/.pi/agent/skills/pdf/SKILL.md")` → đọc hướng dẫn → thực hiện theo.

---

## Cách 2: Slash Command `/skill:name`

Source: `agent-session.ts` lines 979-1007

User gõ trực tiếp:
```
/skill:pdf Hãy phân tích file report.pdf
```

**Xử lý trong `_expandSkillCommand()`:**

1. Extract tên skill từ `/skill:pdf`
2. Tìm skill theo name trong `resourceLoader.getSkills()`
3. Đọc nội dung SKILL.md (strip frontmatter)
4. Bọc trong XML format:

```xml
<skill name="pdf" location="/path/to/pdf/SKILL.md">
References are relative to /path/to/pdf.

[nội dung SKILL.md]
</skill>

Hãy phân tích file report.pdf
```

5. Arguments (phần sau tên skill) trở thành user message bên dưới skill block.

---

## Slash Command Registration

Source: `interactive-mode.ts` lines 338-347

- Skill commands được đăng ký dạng `skill:skill-name` trong autocomplete
- Chỉ đăng ký khi `settingsManager.getEnableSkillCommands()` là `true`
- Lưu trong Map `skillCommands`: name → filePath

---

## Hiển thị trong UI

Source: `skill-invocation-message.ts`

Khi skill được gọi, UI hiển thị:
- **Thu gọn**: `[skill] pdf (E to expand)`
- **Mở rộng**: Toàn bộ nội dung skill render dạng Markdown

Dùng màu nền riêng cho message skill.

---

## Relative Path Resolution

Khi SKILL.md chứa đường dẫn tương đối, agent resolve dựa trên thư mục cha của SKILL.md:

```
SKILL.md location: /home/user/.pi/agent/skills/pdf/SKILL.md
Relative path in SKILL.md: ./templates/extract.sh
Resolved: /home/user/.pi/agent/skills/pdf/templates/extract.sh
```

System prompt text hướng dẫn:
> "When a skill file references a relative path, resolve it against the skill directory (parent of SKILL.md / dirname of the path) and use that absolute path in tool commands."

---

## disableModelInvocation

Source: `skills.ts` lines 290-291

Khi `disableModelInvocation: true`:
- Skill **bị loại khỏi** `formatSkillsForPrompt()` → không xuất hiện trong system prompt
- Agent **không tự gọi** skill này
- User vẫn có thể gọi qua `/skill:name` → vẫn hoạt động
- Use case: Skills tùy chọn, specialist skills mà không muốn agent tự kích hoạt

---

## RPC Mode Exposure

Source: `rpc-mode.ts` lines 565-574

Trong RPC mode, skills được expose qua `get_commands` response:

```typescript
{
  name: `skill:${skill.name}`,
  description: skill.description,
  source: "skill",
  location: skill.source,  // "user" | "project" | "path"
  path: skill.filePath
}
```

---

## SDK Usage

Source: `examples/sdk/04-skills.ts`

Tạo skill programmatic:

```typescript
const customSkill: Skill = {
  name: "my-skill",
  description: "Custom project instructions",
  filePath: "/virtual/SKILL.md",
  baseDir: "/virtual",
  source: "path",
  disableModelInvocation: false,
};

const loader = new DefaultResourceLoader({
  skillsOverride: (current) => ({
    skills: [...current.skills, customSkill],
    diagnostics: current.diagnostics,
  }),
});
```

---

## Execution Flow Diagram

```
User request
  │
  ├── Matches skill description in system prompt?
  │   └── YES → Agent uses read tool → Reads SKILL.md → Follows instructions
  │
  └── User types /skill:name?
      └── YES → _expandSkillCommand() → Inject XML block + content → Send to LLM
```

---

## Khác biệt so với Extension Tools

| Feature | Skill Execution | Extension Tool Execution |
|---------|----------------|------------------------|
| Cơ chế | Agent đọc Markdown rồi tự quyết định | Agent gọi function trực tiếp |
| Deterministic | Không — phụ thuộc LLM interpretation | Có — function execute code cụ thể |
| Overhead | Đọc file → thêm context cho LLM | Gọi function → trả kết quả |
| Linh hoạt | Rất cao — skill viết bất cứ gì | Bị giới hạn bởi function parameters |
| Rủi ro | LLM có thể hiểu sai instructions | Code chạy đúng hoặc throw error |

---

**End of execution model**.
