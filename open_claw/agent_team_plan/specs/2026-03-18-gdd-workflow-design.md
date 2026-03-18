# Design Spec: agent_gd GDD Workflow — Round 2
**Date**: 2026-03-18
**Author**: William Đào 👌
**Status**: Approved (v2 — post spec-review fixes)
**Reference**: `D:\PROJECT\CCN2\research_doc\GDD_Overview_v2_ElementalHunter.md`

---

## Summary

Build a hierarchical GDD workflow cho agent_gd (Designia). Agent tự động:
1. Đọc concept files → generate Feature GDDs
2. Self-eval trước khi save (score-gated)
3. Khi đủ features → synthesize Game GDD tổng hợp
4. agent_qc chạy eval độc lập → kết quả authoritative

Reference chuẩn chất lượng: `GDD_Overview_v2_ElementalHunter.md` (Elemental Hunter v2.3)

---

## Fixes Applied (from spec review)

| ID | Severity | Fix |
|----|----------|-----|
| C1 | CRITICAL | Currency resolution rule: **DIAMOND is authoritative**. Agent_gd luôn dùng DIAMOND (không dùng KC / Ladder Points). Nếu concept file dùng KC → agent_gd map sang DIAMOND khi viết GDD. |
| W1 | WARNING | Eval Gate 50–69: save với `Status: Draft` trong header **VÀ** gửi Telegram notify "[agent_gd] GDD WARNING: <name> score=XX/100 — saved as Draft". |
| W2 | WARNING | "new Feature GDD" trong synthesis trigger = GDD với `Status: Review` (score ≥ 70). Draft không count vào trigger. |
| W3 | WARNING | Thêm **agent_qc AGENTS.md upgrade** vào Deliverables — agent_qc cần eval workflow: load rubric từ `eval/GDD-EVAL-RUBRIC.md`, score GDD tương ứng (Feature mode cho GDD-FEATURE-*, Game mode cho GDD-GAME-*), save result vào `eval/`. |
| W4 | WARNING | Thêm **schema update cho agent_gd_processed.json** vào Deliverables. New fields: `game_gdd_last_synced` (ISO datetime), `features_included` (array of filenames). |
| W5 | WARNING | AGENTS.md upgrade = **overwrite toàn bộ**, nhưng **giữ nguyên Round 1 logic** (hash scan, 8→10 section template ref, Telegram notify pattern) + thêm Round 2 logic (eval gate, synthesis flow). Round 1 logic không bị xóa. |

---

## Section 1: File Architecture

```
ccn2_workspace/
├── design/
│   ├── GDD-TEMPLATE-FEATURE.md     ← template feature (upgrade, 10 sections)
│   ├── GDD-TEMPLATE-GAME.md        ← template game overview (mới, format Elemental Hunter)
│   ├── GDD-FEATURE-<name>.md       ← output agent_gd (1 file / 1 concept)
│   └── GDD-GAME-CCN2.md            ← tổng hợp (auto-synthesized only)
│
├── eval/                           ← thư mục mới
│   ├── GDD-EVAL-RUBRIC.md          ← rubric chấm điểm (Feature + Game mode)
│   └── GDD-EVAL-<name>-<date>.md   ← kết quả eval mỗi lần chạy
│
└── .state/
    └── agent_gd_processed.json     ← thêm fields: game_gdd_last_synced, features_included[]
```

**Naming conventions:**
- Feature GDD: `GDD-FEATURE-<kebab-case>.md`
- Game GDD: `GDD-GAME-CCN2.md` (1 file duy nhất, overwrite khi sync)
- Eval output: `GDD-EVAL-<name>-YYYY-MM-DD.md`

---

## Section 2: Feature Template (`GDD-TEMPLATE-FEATURE.md`)

10 sections — upgrade từ 8 sections cũ. Header bổ sung Change Log, Version, Status, Author.

```markdown
# GDD-FEATURE: <Feature Name>
**Source**: concepts/<filename.md>
**Version**: v1
**Created**: YYYY-MM-DD
**Updated**: YYYY-MM-DD
**Status**: Draft | Review | Approved
**Author**: agent_gd (Designia)

## Change Log
| Version | Date | Changed By | Summary |
|---------|------|------------|---------|

---

## 1. Overview
2–3 câu. Feature là gì, vai trò trong CCN2.

## 2. Core Mechanics
Step-by-step. Đủ để dev implement không cần hỏi.
Sub-sections 2.1, 2.2... nếu mechanic phức tạp.
Include: state variables, triggers, conditions, outcomes.

## 3. Win/Lose Conditions
Ảnh hưởng đến win state. Nếu không liên quan → "N/A — does not affect win condition."

## 4. Edge Cases                    [min 3, format: "If X then Y."]
- If X then Y.
- If X then Y.
- If X then Y.

## 5. UI/UX Notes
- Visual: ...
- Audio: ...
- Animation: ...

## 6. Balance & Config
| Parameter | Value | Notes |
|-----------|-------|-------|
(Dùng số cụ thể. Không để "TBD" trong cột Value — nếu chưa biết, ghi "TBD — pending playtesting" trong Notes.)

## 7. Metrics
| Metric | Description | Target | How to Measure |
|--------|-------------|--------|----------------|
(≥ 1 user behavior metric + ≥ 1 balance metric)

## 8. Dependencies
- Depends on GDDs: [list by filename]
- Server changes needed: yes / no
- Client changes needed: yes / no
- Config keys needed: [list]

## 9. Test Scenarios               [min 5, Given/When/Then]
1. Given <state>, When <action>, Then <expected>.
...

## 10. Open Questions / TBD
| # | Question | Owner | Status |
|---|----------|-------|--------|
```

**Currency rule:** Luôn dùng **DIAMOND** (không dùng KC, Ladder Points, hay tên cũ).

---

## Section 3: Game Template (`GDD-TEMPLATE-GAME.md`)

Mirror cấu trúc Elemental Hunter — synthesize từ Feature GDDs, không viết tay.

```markdown
# <Game Name> — Game Design Document

## Overview
| Field         | Value |
|---------------|-------|
| Game Name     |       |
| Author        | agent_gd (Designia) |
| Date          | YYYY-MM-DD |
| Last Modified | YYYY-MM-DD |
| Version       | vN    |
| Status        | Draft |

## Change Log
| Version | Date | Changed By | Summary |

## Related Documents
<!-- Auto-populated: list of GDD-FEATURE-*.md files included -->

---

## Mechanics

### 1. Board & Turn Structure
  1.1 Bàn cờ
  1.2 Token
  1.3 Lượt chơi (Turn)
  1.4 Di chuyển Token
  1.5 Điều kiện Thắng/Thua

### 2. <System Name>
  <!-- Pulled từ GDD-FEATURE-<x>.md -->

### N. ...

---

## Balance & Config
| Parameter | Value | Notes | Source GDD |
|-----------|-------|-------|------------|
<!-- Aggregated từ tất cả Feature GDDs. Dedup by Parameter. Conflicts → ⚠️ CONFLICT comment -->

---

## Metrics

### Hành vi người chơi (User Behavior)
| Metric | Description | Target | How to Measure |

### Cân bằng (Balance)
| Metric | Description | Target | How to Measure |

---

## Open Questions / TBD
| # | Question | Owner | Status | Source GDD |
<!-- Merged từ Feature GDDs -->

---

## Glossary
| Term | Definition | Code Reference |
<!-- Alphabetical. Mọi capitalized term phải có entry ở đây. -->
```

**Synthesis triggers:**
- `game-overview.md` xuất hiện trong `concepts/`
- ≥ 3 Feature GDDs với `Status: Review` kể từ `game_gdd_last_synced`

**Synthesis input filter:**
- Chỉ load GDD-FEATURE-*.md có `Status: Review` hoặc `Status: Approved`
- Loại trừ GDD score < 50 (không include vào Game GDD)

---

## Section 4: Eval Rubric (`GDD-EVAL-RUBRIC.md`)

### Feature Rubric (100pt — pass ≥ 70)

| Dimension | Weight | Pass Criteria |
|-----------|--------|---------------|
| Completeness | 25pt | 10 sections đủ, không section nào bỏ trống không lý do |
| Specificity | 25pt | Balance table có số cụ thể, state variable names được dùng |
| Implementability | 20pt | Dev đọc không cần hỏi thêm; không có "etc.", "appropriately", "handles normally" |
| Edge Cases | 15pt | ≥ 3, format "If X then Y", cover ít nhất 1 concurrent state |
| Test Scenarios | 10pt | ≥ 5, Given/When/Then, ít nhất 1 failure path |
| Metrics | 5pt | ≥ 1 user behavior + ≥ 1 balance, có "How to Measure" column |

**Score gates:**
- `< 50` → KHÔNG save. Telegram: `[agent_gd] EVAL FAILED: <name> score=XX/100 — not saved`
- `50–69` → Save `Status: Draft`. Telegram: `[agent_gd] GDD WARNING: <name> score=XX/100 — saved as Draft`
- `≥ 70` → Save `Status: Review`. Telegram: `[agent_gd] GDD ready: <name> score=XX/100`

### Game Rubric (100pt — pass ≥ 75)

| Dimension | Weight | Pass Criteria |
|-----------|--------|---------------|
| Feature Coverage | 30pt | ≥ 80% Feature GDDs (Review/Approved) referenced trong Mechanics |
| Balance Consolidation | 25pt | Aggregate đủ từ Feature GDDs, không silent contradictions |
| Metrics Quality | 20pt | ≥ 3 user behavior + ≥ 3 balance metrics, targets có số hoặc "TBD — sau playtesting" |
| Glossary | 15pt | Mọi capitalized term có entry + Code Reference |
| Cross-references | 10pt | Related Documents đầy đủ, Open Questions merged từ Feature GDDs |

### Eval Output Format

```markdown
# GDD Eval: <name> — YYYY-MM-DD
**Mode**: Feature | Game
**Score**: XX/100 — PASS | FAIL | FLAG

## Dimension Scores
| Dimension | Score | Max | Notes |
|-----------|-------|-----|-------|

## Issues Found
- [CRITICAL] ...
- [WARNING] ...

## Recommendation
<!-- PASS → agent_qc có thể viết test scenarios -->
<!-- FAIL → agent_gd cần revise: [list issues] -->
<!-- FLAG → cần human review -->
```

**Ownership:**
- `agent_gd`: self-eval (gate trước khi save — không authoritative)
- `agent_qc`: independent eval sau khi nhận GDD → save vào `eval/` → **authoritative**
- Nếu agent_qc score thấp hơn agent_gd self-score ≥ 20pt → flag cho human

---

## Section 5: agent_gd AGENTS.md Workflow

### Upgrade scope
Overwrite toàn bộ AGENTS.md. **Giữ nguyên Round 1 logic** (hash scan, Telegram notify, 8-section→10-section template ref). Thêm Round 2 logic (eval gate, synthesis flow) ngay sau Round 1 workflow.

### Trigger Map

| Trigger | Action |
|---------|--------|
| `WORKSPACE_SCAN` (cron 15 phút) | Scan concepts/ → Feature GDDs |
| concept file hash changed | Regenerate GDD-FEATURE-<name>.md |
| `game-overview.md` in concepts/ | Full Game GDD synthesis |
| ≥ 3 Feature GDDs `Status: Review` since `game_gdd_last_synced` | Auto Game GDD synthesis |
| Telegram message từ Daniel | Respond + trigger WORKSPACE_SCAN ngay |

### Feature GDD Flow

```
1. READ concept file
2. GENERATE GDD-FEATURE-<name>.md theo GDD-TEMPLATE-FEATURE.md
   - Currency: DIAMOND (không dùng KC hay tên cũ)
   - Bám sát CCN2 mechanics: 44 tiles, 2–4 players, 2 tokens/player
   - Balance numbers: format theo GDD_Overview_v2_ElementalHunter.md
3. SELF-EVAL theo Feature Rubric (GDD-EVAL-RUBRIC.md)
   - Score < 50  → KHÔNG save; Telegram EVAL FAILED
   - Score 50–69 → Save Status: Draft; Telegram WARNING
   - Score ≥ 70  → Save Status: Review; Telegram GDD ready
4. UPDATE .state/agent_gd_processed.json
   { "hash": "<md5>", "processedAt": "<ISO>", "lastScore": XX, "status": "Review|Draft" }
5. NOTIFY Telegram (max 1 per WORKSPACE_SCAN run — batch nếu nhiều GDD)
```

### Game GDD Synthesis Flow

```
1. LOAD tất cả GDD-FEATURE-*.md có Status: Review hoặc Approved
   (loại trừ: score < 50, Status: Draft)
2. MAP mỗi feature → đúng Mechanics section trong GDD-GAME-CCN2.md
3. AGGREGATE Balance & Config
   - Dedup by Parameter name
   - Contradiction → giữ cả hai, flag: "⚠️ CONFLICT: GDD-FEATURE-X says Y, GDD-FEATURE-Z says W"
4. MERGE Open Questions từ tất cả Feature GDDs (thêm cột "Source GDD")
5. BUILD Glossary: aggregate tất cả terms, sort alphabetical
6. WRITE GDD-GAME-CCN2.md (overwrite, version += 1, update Change Log)
7. UPDATE state:
   { "game_gdd_last_synced": "<ISO>", "features_included": ["<list of filenames>"] }
8. NOTIFY: "[agent_gd] Game GDD updated: GDD-GAME-CCN2.md (vN, X features)"
```

### Constraints

- `GDD-GAME-CCN2.md` chỉ ghi từ synthesis — KHÔNG viết tay bất kỳ section nào
- Score < 50 → không save, không include vào Game GDD
- Max 1 Telegram notification per WORKSPACE_SCAN (batch nhiều GDD thành 1 message)
- Balance contradiction → flag `⚠️ CONFLICT`, không silently chọn 1 bên
- NEVER modify `concepts/`, `src/`, `reports/`

---

## Deliverables Checklist

- [ ] `design/GDD-TEMPLATE-FEATURE.md` — 10-section template với currency rule
- [ ] `design/GDD-TEMPLATE-GAME.md` — Game overview template (Elemental Hunter format)
- [ ] `eval/` folder created
- [ ] `eval/GDD-EVAL-RUBRIC.md` — Feature rubric + Game rubric + eval output format
- [ ] `openclaw/agents/agent_gd/AGENTS.md` — upgraded (keep Round 1 + add Round 2)
- [ ] `openclaw/agents/agent_qc/AGENTS.md` — add eval workflow (load rubric, score, save to eval/)
- [ ] `.state/agent_gd_processed.json` schema: add `game_gdd_last_synced`, `features_included[]`, `lastScore`, `status`
- [ ] Sample output: `design/GDD-FEATURE-ladder-mechanic.md` (generated từ existing concept)
- [ ] `progress/PROGRESS.md` updated: Round 1 ✅, Round 2 in-progress
