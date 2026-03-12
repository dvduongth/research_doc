# Skill System - Checklist

## ✅ Phase 1: Skill Definition & Metadata

- [ ] Đọc ví dụ skill: `SKILL.md` format, mô tả, triggers.
- [ ] `skill.json` fields: id, name, version, description, triggers, dependencies, runtime, etc.
- [ ] Phân biệt `SKILL.md` (documentation) vs `skill.json` (metadata).
- [ ] Ghi `notes/01-definition-metadata.md`.

---

## ✅ Phase 2: Skill Discovery & Loading

- [ ] ClawHub: remote registry, `clawhub search`, `clawhub install`.
- [ ] Local discovery: `skills/` folder, global `~/.openclaw/skills/`.
- [ ] Loading mechanism: dynamic import, transpile? Tích hợp với extension manager?
- [ ] Ghi `notes/02-discovery-loading.md`.

---

## ✅ Phase 3: Skill Lifecycle

- [ ] Lifecycle: `install` → `enable` → `run` → `disable` → `uninstall`.
- [ ] Skill context: `SkillContext` (agent, config, log, etc.)
- [ ] Hooks: `init()`, `onEnable()`, `onDisable()`.
- [ ] Ghi `notes/03-lifecycle.md`.

---

## ✅ Phase 4: Skill Execution Model

- [ ] Execution modes: `run` (one-shot), `session` (persistent thread), `subagent` (isolated), `acp` (harness).
- [ ] `sessions_spawn` parameters: `runtime`, `thread`, `mode`, `agentId`.
- [ ] Resource mounting: `attachAs`, `attachments`.
- [ ] Ghi `notes/04-execution-model.md`.

---

## ✅ Phase 5: Skill Resources & Tools

- [ ] Skill có thể cung cấp: tools, prompts, themes, contexts giống extension?
- [ ] Khả năng expose CLI commands? Tích hợp với OpenClaw CLI?
- [ ] Skill-provided tools: đăng ký vào agent như extension?
- [ ] Ghi `notes/05-resources-tools.md`.

---

## ✅ Phase 6: Skill Dependencies & Conflicts

- [ ] `dependencies` field trong `skill.json`.
- [ ] Conflict với extensions? Extension vs skill là hai hệ thống riêng?
- [ ] Resolve dependencies (topological sort).
- [ ] Ghi `notes/06-dependencies-conflicts.md`.

---

## ✅ Phase 7: Skill Isolation & Security

- [ ] Isolation: subagent sandbox, vm, worker thread?
- [ ] Permissions: file access, network, exec?
- [ ] Sandbox modes: `non-main`, `all`.
- [ ] Ghi `notes/07-isolation-security.md`.

---

## ✅ Phase 8: Skill Configuration & Overrides

- [ ] Skill config schema trong `skill.json`.
- [ ] Overrides qua `gateway config patch` hoặc `config.apply`.
- [ ] Runtime config access: `ctx.config`.
- [ ] Ghi `notes/08-config-overrides.md`.

---

## ✅ Phase 9: Skill Versioning & Compatibility

- [ ] Semantic versioning, constraints.
- [ ] Compatibility với OpenClaw versions (`engines.openclaw`).
- [ ] Cập nhật: `clawhub update`, `skill update`.
- [ ] Ghi `notes/09-versioning-compatibility.md`.

---

## ✅ Phase 10: Diagrams & Quiz

- [ ] Vẽ diagrams: skill loading flow, execution pipeline.
- [ ] Tạo quiz 15-20 câu.
- [ ] Lưu vào `diagrams/` và `quiz.md`.
- [ ] Finalize checklist & PROGRESS.

---

**Hoàn thành**: Tất cả notes, diagrams, quiz.
