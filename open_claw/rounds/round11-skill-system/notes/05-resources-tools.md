# Skill Resources & Tools
**Round 11: Skill System**

---

## Skill trong System Prompt

Source: `skills.ts` lines 290-316

Hàm `formatSkillsForPrompt()` chuyển danh sách skills thành text XML inject vào system prompt:

```xml
<skills>
The following skills provide specialized instructions...

<skill>
  <name>pdf</name>
  <description>Extract and analyze PDF documents</description>
  <location>/home/user/.pi/agent/skills/pdf/SKILL.md</location>
</skill>

<skill>
  <name>code-review</name>
  <description>Review code for quality, security, and best practices</description>
  <location>/project/.pi/skills/code-review/SKILL.md</location>
</skill>
</skills>
```

**Điều kiện inject**: Tool `read` phải available (agent cần read để đọc SKILL.md).

---

## ParsedSkillBlock

Source: `agent-session.ts` lines 88-109

Khi skill được gọi qua `/skill:name`, nội dung được parse thành:

```typescript
export interface ParsedSkillBlock {
  name: string;          // Tên skill
  location: string;      // Đường dẫn đến SKILL.md
  content: string;       // Nội dung SKILL.md (đã strip frontmatter)
  userMessage: string | undefined;  // Arguments từ user (phần sau /skill:name)
}
```

---

## DefaultResourceLoader Integration

Source: `resource-loader.ts` lines 249, 277, 447-472

`DefaultResourceLoader` quản lý skills cùng với các resource khác:

```typescript
class DefaultResourceLoader {
  getSkills(): { skills: Skill[]; diagnostics: ResourceDiagnostic[] }
  extendResources(paths: ResourceExtensionPaths): void  // Thêm skill paths động
  updateSkillsFromPaths(skillPaths: string[], extensionPaths?: ...): void
}
```

---

## Skills Override (SDK)

Source: `resource-loader.ts` lines 131-134

SDK cho phép override hoàn toàn skill loading:

```typescript
new DefaultResourceLoader({
  skillsOverride: (base) => {
    // base.skills = skills mặc định đã load
    const filtered = base.skills.filter(s => s.name.includes("browser"));
    return {
      skills: [...filtered, customSkill],
      diagnostics: base.diagnostics,
    };
  },
});
```

Use cases:
- Lọc bỏ skills không cần thiết
- Thêm virtual skills (không cần file thật)
- Thay thế hoàn toàn skill catalog

---

## Extension Interaction với Skills

Extensions có thể mở rộng skill paths qua event `resources_discover`:

```typescript
pi.on("resources_discover", (event, ctx) => {
  return {
    skillPaths: ["/additional/skills/path"],
  };
});
```

Điều này cho phép extensions cung cấp thêm skills mà không cần user cấu hình thủ công.

---

## Public Exports

Source: `packages/coding-agent/src/index.ts`

Các API liên quan đến skills được export công khai:
- `Skill` — type
- `formatSkillsForPrompt` — hàm format skills cho system prompt
- `loadSkills` — hàm load skills từ disk
- `loadSkillsFromDir` — hàm load từ một thư mục cụ thể
- `ParsedSkillBlock` — type
- `parseSkillBlock` — hàm parse skill XML block

---

## Settings Configuration

Source: `settings-manager.ts` lines 82-85

```typescript
// Trong settings.json
{
  "skills": ["/path/to/skill1", "/path/to/skill2"],
  "enableSkillCommands": true  // default: true
}
```

Accessor methods:
- `getSkillPaths(): string[]`
- `setSkillPaths(paths: string[]): void`
- `getEnableSkillCommands(): boolean`
- `setEnableSkillCommands(enabled: boolean): void`

---

## Backward Compatibility

Source: `settings-manager.ts` lines 328-345

Settings manager tự migrate format cũ sang mới:
- Format cũ: `skills` là object với `enableSkillCommands` và `customDirectories`
- Format mới: `skills` là mảng string, `enableSkillCommands` là field riêng

---

**End of resources & tools**.
