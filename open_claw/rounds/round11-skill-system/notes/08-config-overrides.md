# Skill Configuration & Overrides
**Round 11: Skill System**

---

## Settings Configuration

Source: `settings-manager.ts` lines 82-85, 756-811

### settings.json

```json
{
  "skills": [
    "/path/to/custom/skills",
    "/another/path"
  ],
  "enableSkillCommands": true
}
```

- `skills`: Mảng đường dẫn bổ sung cho skill discovery
- `enableSkillCommands`: Bật/tắt slash commands `/skill:name` (default: `true`)

### Accessor Methods

```typescript
getSkillPaths(): string[]
setSkillPaths(paths: string[]): void
setProjectSkillPaths(paths: string[]): void  // Project-level settings
getEnableSkillCommands(): boolean
setEnableSkillCommands(enabled: boolean): void
```

---

## CLI Overrides

```bash
# Thêm skill paths
pi --skill /path/to/skill1 --skill /path/to/skill2

# Tắt tất cả default skills (chỉ giữ --skill args)
pi --no-skills --skill /path/to/essential-skill
```

- `--skill <path>`: Additive — luôn thêm, kể cả khi dùng `--no-skills`
- `--no-skills`: Tắt discovery mặc định (project, global)

---

## SDK Override (DefaultResourceLoader)

Source: `resource-loader.ts` lines 131-134

```typescript
const loader = new DefaultResourceLoader({
  skillsOverride: (base) => {
    // base.skills = tất cả skills đã load từ default paths
    // Trả về skills muốn dùng
    return {
      skills: base.skills.filter(s => s.name !== "unwanted-skill"),
      diagnostics: base.diagnostics,
    };
  },
});
```

Override function nhận skills mặc định → trả về skills cuối cùng. Cho phép:
- Lọc bỏ skills
- Thêm virtual skills
- Thay đổi metadata
- Thay thế hoàn toàn catalog

---

## Extension Resources Discover

Extensions có thể inject thêm skill paths qua event:

```typescript
pi.on("resources_discover", (event, ctx) => {
  return {
    skillPaths: ["/extension/provides/skills"],
  };
});
```

---

## Backward Compatibility

Source: `settings-manager.ts` lines 328-345

Settings manager tự migrate format cũ:

**Format cũ:**
```json
{
  "skills": {
    "enableSkillCommands": true,
    "customDirectories": ["/path/to/skills"]
  }
}
```

**Format mới (hiện tại):**
```json
{
  "skills": ["/path/to/skills"],
  "enableSkillCommands": true
}
```

Migration tự động khi đọc settings.

---

## Không có Per-Skill Config

Skills không có config schema riêng (khác với extensions). Nếu skill cần configuration:
- Viết hướng dẫn trong SKILL.md cho user đặt environment variables
- Hoặc skill đọc file config từ thư mục dự án (`.pi/config.yaml`, v.v.)
- Agent tự quyết định dựa trên context

---

## Thứ tự ưu tiên tổng hợp

```
1. --skill CLI args                    (cao nhất)
2. .pi/skills/ (project)
3. .agents/skills/ (project + parents)
4. ~/.pi/agent/skills/ (global)
5. ~/.agents/skills/ (global)
6. settings.json skills array
7. Packages (pi.skills trong package.json)
8. Extension resources_discover         (thấp nhất)
```

Name collision: skill đầu tiên thắng → skill ưu tiên cao hơn ghi đè.

---

**End of configuration & overrides**.
