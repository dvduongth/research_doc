# Round 11: Skill System
**Mục tiêu**: Hiểu chi tiết Skill System trong pi-mono: cấu trúc SKILL.md, metadata, discovery, loading, execution qua slash commands, và mối quan hệ với Extensions.

---

## Phases

1. Skill definition & metadata (`SKILL.md`, YAML frontmatter)
2. Skill discovery & loading (project, global, packages, CLI args)
3. Skill lifecycle (scan → validate → catalog → system prompt injection)
4. Skill execution model (`/skill:name`, system prompt auto-invocation)
5. Skill resources & tools (formatSkillsForPrompt, SDK override)
6. Skill dependencies & conflicts (name collision, precedence)
7. Skill isolation & security (disableModelInvocation, allowed-tools)
8. Skill configuration & overrides (settings.json, DefaultResourceLoader)
9. Skill versioning & compatibility (Agent Skills Standard)

---

**Source**: `packages/coding-agent/src/core/skills.ts`, `packages/coding-agent/docs/skills.md`
**Start**: 2026-03-12 15:02 GMT+7
**Status**: ✅ Đã sửa lại từ source code thật (2026-03-12)

> **Lưu ý**: Phiên bản trước bị lỗi nghiêm trọng — mô tả hệ thống "OpenClaw"/"ClawHub" không tồn tại. Đã viết lại hoàn toàn dựa trên source code pi-mono v0.57.1.
