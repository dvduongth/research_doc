# Round 2 — GDD Workflow Plan: agent_gd (Designia)
**Date**: 2026-03-18
**Approach**: Hierarchical (Feature GDDs → Game GDD synthesis)
**Reference**: `GDD_Overview_v2_ElementalHunter.md`
**Spec**: `specs/2026-03-18-gdd-workflow-design.md`

---

## Section 1: File Architecture

```
ccn2_workspace/
├── design/
│   ├── GDD-TEMPLATE-FEATURE.md     ← template feature (10 sections)
│   ├── GDD-TEMPLATE-GAME.md        ← game overview (Elemental Hunter format)
│   ├── GDD-FEATURE-<name>.md       ← output agent_gd (1 file / 1 concept)
│   └── GDD-GAME-CCN2.md            ← synthesis output (auto only)
│
├── eval/
│   ├── GDD-EVAL-RUBRIC.md          ← rubric Feature + Game
│   └── GDD-EVAL-<name>-<date>.md   ← eval results
│
└── .state/
    └── agent_gd_processed.json     ← thêm: game_gdd_last_synced, features_included[], lastScore, status
```

**Naming:**
- Feature: `GDD-FEATURE-<kebab-case>.md`
- Game: `GDD-GAME-CCN2.md`
- Eval: `GDD-EVAL-<name>-YYYY-MM-DD.md`

---

## Section 2: Feature Template — `GDD-TEMPLATE-FEATURE.md`

**10 sections** (upgrade từ 8):

| # | Section | Required | Notes |
|---|---------|----------|-------|
| header | Metadata | ✅ | Version, Status, Author, Change Log |
| 1 | Overview | ✅ | 2–3 câu |
| 2 | Core Mechanics | ✅ | Sub-sections 2.1, 2.2... nếu phức tạp |
| 3 | Win/Lose Conditions | ✅ | "N/A" nếu không liên quan |
| 4 | Edge Cases | ✅ min 3 | Format: "If X then Y." |
| 5 | UI/UX Notes | ✅ | Visual / Audio / Animation |
| 6 | Balance & Config | ✅ | Table với exact numbers, không TBD trong Value |
| 7 | Metrics | ✅ | ≥1 user behavior + ≥1 balance |
| 8 | Dependencies | ✅ | GDDs, Server/Client/Config |
| 9 | Test Scenarios | ✅ min 5 | Given/When/Then |
| 10 | Open Questions | optional | Table với Owner + Status |

**Currency rule:** Luôn dùng **DIAMOND** (không KC, không Ladder Points).

---

## Section 3: Game Template — `GDD-TEMPLATE-GAME.md`

Mirror Elemental Hunter structure. **Synthesize từ Feature GDDs — không viết tay.**

**Structure:**
```
Overview table (Game Name, Author, Date, Version, Status)
Change Log
Related Documents (auto-populated)
Mechanics
  1. Board & Turn Structure (1.1–1.5)
  2. <System> (pulled từ GDD-FEATURE-*.md)
  N. ...
Balance & Config (aggregated, dedup, ⚠️ CONFLICT nếu mâu thuẫn)
Metrics
  - User Behavior
  - Balance
Open Questions / TBD (merged từ Feature GDDs, thêm cột Source GDD)
Glossary (alphabetical, với Code Reference)
```

**Synthesis triggers:**
- `game-overview.md` in `concepts/`
- ≥ 3 Feature GDDs `Status: Review` kể từ `game_gdd_last_synced`

**Input filter:**
- Chỉ load `Status: Review` hoặc `Status: Approved`
- Loại trừ score < 50

---

## Section 4: Eval Rubric — `GDD-EVAL-RUBRIC.md`

### Feature Rubric (100pt — pass ≥ 70)

| Dimension | Weight | Pass Criteria |
|-----------|--------|---------------|
| Completeness | 25pt | 10 sections đủ |
| Specificity | 25pt | Balance table số cụ thể, state variable names |
| Implementability | 20pt | Không "etc.", "appropriately", "handles normally" |
| Edge Cases | 15pt | ≥3, "If X then Y", ≥1 concurrent state |
| Test Scenarios | 10pt | ≥5, Given/When/Then, ≥1 failure path |
| Metrics | 5pt | ≥1 UB + ≥1 Balance, How to Measure column |

### Game Rubric (100pt — pass ≥ 75)

| Dimension | Weight | Pass Criteria |
|-----------|--------|---------------|
| Feature Coverage | 30pt | ≥80% Feature GDDs referenced |
| Balance Consolidation | 25pt | Aggregate đủ, no silent contradictions |
| Metrics Quality | 20pt | ≥3 UB + ≥3 Balance metrics |
| Glossary | 15pt | Mọi capitalized term có entry + Code Reference |
| Cross-references | 10pt | Related Docs đầy đủ, Open Questions merged |

### Score Gates (Feature)

| Score | Action |
|-------|--------|
| < 50 | KHÔNG save. Telegram: `[agent_gd] EVAL FAILED: <name> score=XX` |
| 50–69 | Save `Status: Draft`. Telegram: `[agent_gd] GDD WARNING: <name> score=XX — saved as Draft` |
| ≥ 70 | Save `Status: Review`. Telegram: `[agent_gd] GDD ready: <name> score=XX` |

### Eval Output Format

```markdown
# GDD Eval: <name> — YYYY-MM-DD
**Mode**: Feature | Game
**Score**: XX/100 — PASS | FAIL | FLAG

## Dimension Scores
| Dimension | Score | Max | Notes |

## Issues Found
- [CRITICAL] ...
- [WARNING] ...

## Recommendation
PASS | FAIL | FLAG
```

**Ownership:**
- `agent_gd`: self-eval (gate trước khi save — không authoritative)
- `agent_qc`: independent eval → save `eval/` → **authoritative**
- agent_qc score thấp hơn agent_gd ≥20pt → flag human

---

## Section 5: agent_gd AGENTS.md Workflow

### Upgrade scope
Overwrite AGENTS.md. **Giữ Round 1 logic + thêm Round 2.** Không xóa hash scan, notify pattern cũ.

### Trigger Map

| Trigger | Action |
|---------|--------|
| `WORKSPACE_SCAN` (cron 15 phút) | Scan concepts/ → Feature GDDs |
| concept hash changed | Regenerate GDD-FEATURE-<name>.md |
| `game-overview.md` in concepts/ | Full synthesis |
| ≥3 Review GDDs since last sync | Auto synthesis |
| Telegram từ Daniel | Respond + WORKSPACE_SCAN ngay |

### Feature GDD Flow

```
1. READ concept file
2. GENERATE GDD-FEATURE-<name>.md (GDD-TEMPLATE-FEATURE.md)
   - Currency: DIAMOND
   - CCN2 context: 44 tiles, 2–4 players, 2 tokens/player
3. SELF-EVAL (Feature Rubric)
   - <50 → không save, Telegram FAIL
   - 50-69 → save Draft, Telegram WARNING
   - ≥70 → save Review, Telegram ready
4. UPDATE .state/agent_gd_processed.json
   { hash, processedAt, lastScore, status }
5. NOTIFY (max 1 Telegram/scan — batch)
```

### Game GDD Synthesis Flow

```
1. LOAD GDD-FEATURE-*.md (Status: Review|Approved, score ≥ 50)
2. MAP features → Mechanics sections
3. AGGREGATE Balance & Config (dedup; ⚠️ CONFLICT nếu mâu thuẫn)
4. MERGE Open Questions (thêm cột Source GDD)
5. BUILD Glossary (alphabetical)
6. WRITE GDD-GAME-CCN2.md (version+1, update Change Log)
7. UPDATE state: game_gdd_last_synced, features_included[]
8. NOTIFY: "[agent_gd] Game GDD updated: vN, X features"
```

### Constraints

- `GDD-GAME-CCN2.md` synthesis-only, KHÔNG viết tay
- Score < 50 → không include vào Game GDD
- Max 1 Telegram/WORKSPACE_SCAN
- Contradiction → `⚠️ CONFLICT`, không pick silently
- NEVER modify `concepts/`, `src/`, `reports/`

---

## Deliverables Checklist

| # | File | Status |
|---|------|--------|
| 1 | `design/GDD-TEMPLATE-FEATURE.md` | ⬜ |
| 2 | `design/GDD-TEMPLATE-GAME.md` | ⬜ |
| 3 | `eval/` folder | ⬜ |
| 4 | `eval/GDD-EVAL-RUBRIC.md` | ⬜ |
| 5 | `openclaw/agents/agent_gd/AGENTS.md` upgraded | ⬜ |
| 6 | `openclaw/agents/agent_qc/AGENTS.md` + eval workflow | ⬜ |
| 7 | `.state/agent_gd_processed.json` schema updated | ⬜ |
| 8 | `design/GDD-FEATURE-ladder-mechanic.md` sample | ⬜ |
| 9 | `progress/PROGRESS.md` updated | ⬜ |
