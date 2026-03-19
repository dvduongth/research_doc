# concepts/ — Feature Concept Files

**Human viết vào đây. Designia (agent_gd) đọc và xử lý.**

---

## Cách viết concept

Tạo file tên `<feature-kebab-name>.md` theo template:

```markdown
# Feature: <Tên feature>
**Priority**: High / Medium / Low
**Requester**: <your name>
**Date**: YYYY-MM-DD

## Description
<Mô tả ngắn gameplay mechanic / feature>

## Core Mechanics
- Mechanic 1: ...
- Mechanic 2: ...

## Edge Cases
- Case 1: ...

## References
- GDD section: ...
- Similar mechanic: ...
```

---

## Rules

- File name: `<feature>.md` (kebab-case, không có dấu cách)
- Designia (agent_gd) pick up file mới / thay đổi trong vòng 15 phút
- **KHÔNG edit** files trong `design/` — đó là territory của Designia
- **KHÔNG tạo** GDD thủ công — để Designia xử lý

---

## Pipeline sau khi viết concept

```
concepts/<feature>.md   ← [Anh viết ở đây]
        ↓  (~15 phút)
design/GDD-FEATURE-<name>.md   ← [Designia output]
        ↓  (~30 phút)
analysis/REQ-<name>.md + dispatch   ← [Codera output]
        ↓  (~60 phút)
playtest/client/src/<feature>.js    ← [Pixel output]
playtest/server/src/main/kotlin/playtest/<Feature>.kt   ← [Forge output]
src/admin/<feature>/                ← [Panel output]
        ↓  (~15 phút)
reports/code-review-<name>-*.md    ← [Verita output]
```

---

## Nếu concept có lỗi / bug

Nếu concept dẫn đến GDD sai → tạo bug report trong `bugs/`:
- `domain: gd` để Designia tự fix GDD
- Xem `docs/RUNBOOK-bugs.md` để biết cách tạo bug report
