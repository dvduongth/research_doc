# Round 2: GDD Workflow Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build hierarchical GDD workflow cho agent_gd — Feature GDDs (per concept) + Game GDD synthesis + Eval rubric + agent_qc eval integration.

**Architecture:** 2 templates (Feature 10-section + Game overview) → agent_gd generates Feature GDDs score-gated, synthesizes Game GDD when ≥3 Review features. agent_qc runs independent eval (authoritative). All files are Markdown, no build step.

**Tech Stack:** Markdown files, PowerShell (agent reads), JSON state, Telegram notify (OpenClaw built-in)

**Spec:** `specs/2026-03-18-gdd-workflow-design.md`
**Reference:** `D:/PROJECT/CCN2/research_doc/GDD_Overview_v2_ElementalHunter.md`

---

## Chunk 1: Templates

### Task 1: GDD-TEMPLATE-FEATURE.md (upgrade từ 8→10 sections)

**Files:**
- Overwrite: `D:/PROJECT/CCN2/research_doc/open_claw/agent_team_plan/ccn2_workspace/design/GDD-TEMPLATE-FEATURE.md`

- [ ] **Step 1: Verify existing file trước khi overwrite**

  Read file hiện tại để confirm nó là 8-section template cũ (không phải file khác).
  Expected: file bắt đầu bằng `# GDD: <Feature Name>`

- [ ] **Step 2: Write GDD-TEMPLATE-FEATURE.md**

  Overwrite với nội dung sau (10 sections + Change Log header):

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
  | v1 | YYYY-MM-DD | agent_gd | Initial draft |

  ---

  ## 1. Overview
  <!-- 2–3 câu. Feature là gì, vai trò trong CCN2. -->

  ## 2. Core Mechanics
  <!-- Step-by-step. Dev đọc xong không cần hỏi thêm. -->
  <!-- Include: state variables, triggers, conditions, outcomes. -->
  <!-- Dùng sub-sections 2.1, 2.2... nếu mechanic phức tạp. -->
  <!-- CURRENCY RULE: Luôn dùng DIAMOND (không KC, không Ladder Points). -->

  ## 3. Win/Lose Conditions
  <!-- Ảnh hưởng đến win state. Nếu không liên quan → ghi: "N/A — does not affect win condition." -->

  ## 4. Edge Cases
  <!-- Min 3. Format: "If X then Y." Cover ít nhất 1 concurrent state (2 players cùng lúc). -->
  - If X then Y.
  - If X then Y.
  - If X then Y.

  ## 5. UI/UX Notes
  - Visual: ...
  - Audio: ...
  - Animation: ...

  ## 6. Balance & Config
  <!-- Dùng số cụ thể. Không để "TBD" trong cột Value — nếu chưa biết → ghi "pending playtesting" trong Notes. -->
  | Parameter | Value | Notes |
  |-----------|-------|-------|
  | example_param | 0 | Description |

  ## 7. Metrics
  <!-- Min 1 user behavior metric + 1 balance metric. How to Measure là bắt buộc. -->
  | Metric | Description | Target | How to Measure |
  |--------|-------------|--------|----------------|
  | user_behavior_metric | Description | target value | measurement method |
  | balance_metric | Description | target value | measurement method |

  ## 8. Dependencies
  - Depends on GDDs: (list by GDD filename, or "None")
  - Server changes needed: yes / no
  - Client changes needed: yes / no
  - Config keys needed: (list or "None")

  ## 9. Test Scenarios
  <!-- Min 5. Given/When/Then. Ít nhất 1 failure path (Given invalid state...). -->
  1. Given <state>, When <action>, Then <expected>.
  2. Given <state>, When <action>, Then <expected>.
  3. Given <state>, When <action>, Then <expected>.
  4. Given <state>, When <action>, Then <expected>.
  5. Given <state>, When <action>, Then <expected>.

  ## 10. Open Questions / TBD
  <!-- Optional. Xóa section này nếu không có câu hỏi nào. -->
  | # | Question | Owner | Status |
  |---|----------|-------|--------|
  ```

- [ ] **Step 3: Verify file đã ghi đúng**

  Read file vừa ghi. Kiểm tra:
  - Có đủ 10 sections (1–10) ✓
  - Có Change Log header ✓
  - Có CURRENCY RULE comment trong Section 2 ✓
  - Có "pending playtesting" hướng dẫn trong Section 6 ✓

---

### Task 2: GDD-TEMPLATE-GAME.md (mới hoàn toàn)

**Files:**
- Create: `D:/PROJECT/CCN2/research_doc/open_claw/agent_team_plan/ccn2_workspace/design/GDD-TEMPLATE-GAME.md`

- [ ] **Step 1: Confirm file chưa tồn tại**

  Check design/ folder. Nếu đã có GDD-TEMPLATE-GAME.md → read để xem nội dung, quyết định overwrite hay bỏ qua.

- [ ] **Step 2: Write GDD-TEMPLATE-GAME.md**

  ```markdown
  # <Game Name> — Game Design Document
  <!-- AGENT_GD INSTRUCTION: File này được SYNTHESIZE từ GDD-FEATURE-*.md. KHÔNG viết tay. -->
  <!-- Run synthesis flow trong AGENTS.md khi trigger điều kiện. -->

  ## Overview
  | Field         | Value |
  |---------------|-------|
  | Game Name     | CCN2  |
  | Author        | agent_gd (Designia) |
  | Date          | YYYY-MM-DD |
  | Last Modified | YYYY-MM-DD |
  | Version       | v1    |
  | Status        | Draft |

  ## Change Log
  | Version | Date | Changed By | Summary |
  |---------|------|------------|---------|
  | v1 | YYYY-MM-DD | agent_gd | Initial synthesis |

  ## Related Documents
  <!-- Auto-populated by synthesis. DO NOT edit manually. -->
  <!-- FORMAT: - [GDD-FEATURE-<name>.md](./GDD-FEATURE-<name>.md) -->

  ---

  ## Mechanics

  ### 1. Board & Turn Structure
  <!-- Source: GDD-FEATURE-board.md (or equivalent) -->
  #### 1.1 Bàn cờ
  #### 1.2 Token
  #### 1.3 Lượt chơi (Turn)
  #### 1.4 Di chuyển Token
  #### 1.5 Điều kiện Thắng/Thua

  ### 2. <System Name>
  <!-- Source: GDD-FEATURE-<x>.md -->
  <!-- Paste hoặc summarize nội dung Section 2 (Core Mechanics) của Feature GDD tương ứng -->

  ### N. <System Name>
  <!-- Thêm section cho mỗi major system -->

  ---

  ## Balance & Config
  <!-- Aggregated từ tất cả Feature GDDs. Dedup by Parameter. -->
  <!-- Nếu contradiction: ⚠️ CONFLICT: GDD-FEATURE-X says Y, GDD-FEATURE-Z says W -->
  | Parameter | Value | Notes | Source GDD |
  |-----------|-------|-------|------------|

  ---

  ## Metrics

  ### Hành vi người chơi (User Behavior)
  <!-- Min 3 metrics. Aggregate từ Feature GDDs Section 7. -->
  | Metric | Description | Target | How to Measure |
  |--------|-------------|--------|----------------|

  ### Cân bằng (Balance)
  <!-- Min 3 metrics. Aggregate từ Feature GDDs Section 7. -->
  | Metric | Description | Target | How to Measure |
  |--------|-------------|--------|----------------|

  ---

  ## Open Questions / TBD
  <!-- Merged từ Feature GDDs Section 10. Thêm cột Source GDD. -->
  | # | Question | Owner | Status | Source GDD |
  |---|----------|-------|--------|------------|

  ---

  ## Glossary
  <!-- Alphabetical. Mọi term viết hoa lần đầu PHẢI có entry ở đây. -->
  <!-- Include Code Reference nếu có (ví dụ: `player.diamond`, `TileType.LADDER`) -->
  | Term | Definition | Code Reference |
  |------|------------|----------------|
  | DIAMOND | Currency dùng để mở gate thắng. Tích lũy khi đáp REWARD tiles. | `player.diamond` |
  | LADDER tile | Ô đích để thắng (4 tiles, mỗi màu 1). ID: 41=Green,42=Red,43=Blue,44=Yellow. | `TileType.LADDER` |
  ```

- [ ] **Step 3: Verify file**

  Read file vừa ghi. Kiểm tra:
  - Có comment "AGENT_GD INSTRUCTION: SYNTHESIZE" ở đầu ✓
  - Có Balance & Config table với cột "Source GDD" ✓
  - Có Glossary với 2 seed entries (DIAMOND, LADDER tile) ✓
  - Có ⚠️ CONFLICT comment hướng dẫn ✓

---

## Chunk 2: Eval System

### Task 3: Tạo eval/ folder + GDD-EVAL-RUBRIC.md

**Files:**
- Create folder: `D:/PROJECT/CCN2/research_doc/open_claw/agent_team_plan/ccn2_workspace/eval/`
- Create: `D:/PROJECT/CCN2/research_doc/open_claw/agent_team_plan/ccn2_workspace/eval/GDD-EVAL-RUBRIC.md`

- [ ] **Step 1: Tạo eval/ folder**

  Tạo file placeholder hoặc RUBRIC.md trực tiếp (folder sẽ được tạo cùng).

- [ ] **Step 2: Write GDD-EVAL-RUBRIC.md**

  ```markdown
  # GDD Eval Rubric
  **Version**: v1
  **Date**: 2026-03-18
  **Reference quality bar**: GDD_Overview_v2_ElementalHunter.md

  ---

  ## Feature Rubric (100pt — pass ≥ 70)

  | Dimension | Weight | Pass Criteria |
  |-----------|--------|---------------|
  | Completeness | 25pt | Đủ 10 sections (1–10), không section nào bỏ trống không lý do. Header có Version, Status, Author. |
  | Specificity | 25pt | Balance & Config table dùng số cụ thể (không "TBD" trong cột Value). Core Mechanics dùng state variable names (ví dụ: `player.diamond`, `token.position`). |
  | Implementability | 20pt | Dev đọc xong không cần hỏi thêm câu nào. Không có: "etc.", "handles appropriately", "as expected", "in a reasonable way". |
  | Edge Cases | 15pt | ≥ 3 edge cases, format "If X then Y.", cover ít nhất 1 concurrent state (2 players cùng lúc / 2 sự kiện cùng turn). |
  | Test Scenarios | 10pt | ≥ 5 scenarios, đúng "Given / When / Then" format. Ít nhất 1 failure path (Given invalid state). |
  | Metrics | 5pt | ≥ 1 user behavior metric + ≥ 1 balance metric. Cột "How to Measure" được điền. |

  ### Score Gates (Feature)

  | Score Range | Action |
  |-------------|--------|
  | < 50 | KHÔNG save file. Telegram: `[agent_gd] EVAL FAILED: <name> score=XX/100 — not saved` |
  | 50–69 | Save với `Status: Draft` trong header. Telegram: `[agent_gd] GDD WARNING: <name> score=XX/100 — saved as Draft` |
  | ≥ 70 | Save với `Status: Review` trong header. Telegram: `[agent_gd] GDD ready: <name> score=XX/100` |

  ---

  ## Game Rubric (100pt — pass ≥ 75)

  | Dimension | Weight | Pass Criteria |
  |-----------|--------|---------------|
  | Feature Coverage | 30pt | ≥ 80% số GDD-FEATURE-*.md có Status: Review hoặc Approved được reference trong Related Documents và Mechanics sections. |
  | Balance Consolidation | 25pt | Balance & Config table aggregate đủ từ tất cả Feature GDDs. Không có silent contradictions — mâu thuẫn phải được flag bằng ⚠️ CONFLICT. |
  | Metrics Quality | 20pt | ≥ 3 user behavior metrics + ≥ 3 balance metrics. Targets có số cụ thể hoặc "TBD — xác định sau playtesting" (không để trống). |
  | Glossary | 15pt | Mọi term viết hoa lần đầu xuất hiện trong document đều có entry trong Glossary. Glossary có cột Code Reference. |
  | Cross-references | 10pt | Related Documents list được auto-populated. Open Questions được merge từ Feature GDDs với cột Source GDD. |

  ---

  ## Eval Output Format

  Khi chạy eval, tạo file: `eval/GDD-EVAL-<name>-YYYY-MM-DD.md`

  ```markdown
  # GDD Eval: <name> — YYYY-MM-DD
  **Mode**: Feature | Game
  **Evaluator**: agent_gd (self) | agent_qc (authoritative)
  **Score**: XX/100 — PASS | FAIL | FLAG

  ## Dimension Scores
  | Dimension | Score | Max | Notes |
  |-----------|-------|-----|-------|
  | Completeness | X | 25 | ... |
  | Specificity | X | 25 | ... |
  | Implementability | X | 20 | ... |
  | Edge Cases | X | 15 | ... |
  | Test Scenarios | X | 10 | ... |
  | Metrics | X | 5 | ... |
  | **Total** | **XX** | **100** | |

  ## Issues Found
  - [CRITICAL] ...
  - [WARNING] ...

  ## Recommendation
  <!-- PASS → agent_qc có thể viết test scenarios từ GDD này -->
  <!-- FAIL → agent_gd cần revise: [list specific issues] -->
  <!-- FLAG → score agent_qc thấp hơn agent_gd ≥20pt → cần human review -->
  ```

  ---

  ## Eval Ownership

  | Role | Action | Authoritative? |
  |------|--------|----------------|
  | agent_gd | Self-eval trước khi save (Feature Rubric) | ❌ No — gate only |
  | agent_qc | Independent eval sau khi GDD saved (Feature + Game) | ✅ Yes |

  **Flag condition:** Nếu agent_qc score thấp hơn agent_gd self-score ≥ 20pt → ghi FLAG trong eval output + notify Telegram: `⚠️ [CCN2 QC] Score discrepancy on <name>: agent_gd=XX, agent_qc=YY — human review needed`
  ```

- [ ] **Step 3: Verify**

  Read file. Kiểm tra:
  - Feature Rubric có 6 dimensions với weights cộng đúng = 100 ✓
  - Game Rubric có 5 dimensions với weights cộng đúng = 100 ✓
  - Score gates table rõ ràng (3 ranges: <50, 50-69, ≥70) ✓
  - Eval output format có Evaluator field (agent_gd vs agent_qc) ✓
  - FLAG condition được định nghĩa rõ (≥20pt discrepancy) ✓

---

## Chunk 3: agent_gd AGENTS.md Upgrade

### Task 4: Upgrade openclaw/agents/agent_gd/AGENTS.md

**Files:**
- Overwrite: `D:/PROJECT/CCN2/research_doc/open_claw/agent_team_plan/openclaw/agents/agent_gd/AGENTS.md`

- [ ] **Step 1: Read AGENTS.md hiện tại**

  Đọc để nắm Round 1 logic cần giữ nguyên (hash scan, state update, Telegram notify, PowerShell commands).

- [ ] **Step 2: Write upgraded AGENTS.md**

  Giữ toàn bộ Round 1 sections. Thêm Round 2 sections sau Round 1.

  ```markdown
  # agent_gd — CCN2 Game Designer (Designia)

  ## Identity
  You are **Designia**, the Game Designer for the CCN2 board game project.
  Your specialty: converting gameplay concepts into detailed, structured GDD documents.
  You write clear, implementation-ready design specs that developers and QA can act on directly.

  ## Session Startup
  Before doing anything else:
  1. Read `SOUL.md` — this is who you are
  2. Read `USER.md` — this is who you're helping
  3. Read `memory/YYYY-MM-DD.md` (today + yesterday) for recent context

  ## Workspace
  - **ccn2_workspace root**: `D:/PROJECT/CCN2/research_doc/open_claw/agent_team_plan/ccn2_workspace`
  - **Read from**: `concepts/*.md`, `eval/GDD-EVAL-RUBRIC.md`
  - **Write to**: `design/GDD-FEATURE-*.md`, `design/GDD-GAME-CCN2.md`, `eval/GDD-EVAL-*.md`, `.state/agent_gd_processed.json`
  - **Never touch**: `src/`, `reports/`, `concepts/` (read only)

  ## CCN2 Game Context
  - 44-tile circular board, 2–4 players, 2 tokens each
  - Win: 600 DIAMOND → gate opens → reach LADDER tile for player's color
  - **Currency: DIAMOND** (never KC, never Ladder Points — always DIAMOND)
  - Safe zones: tiles 1 (Green), 11 (Red), 21 (Blue), 31 (Yellow)
  - REWARD tiles (5,10,15,20,25,30,35,40) → grant DIAMOND on landing
  - LADDER tiles: 41=Green, 42=Red, 43=Blue, 44=Yellow (win condition)
  - Doubles = 1 extra turn (max 1 per turn, tracked via `player.extraTurnUsed`)
  - Server-authoritative; client is a pure renderer
  - Full GDD: `D:/PROJECT/CCN2/DEMO/GameDesignDocument.md`
  - Quality reference: `D:/PROJECT/CCN2/research_doc/GDD_Overview_v2_ElementalHunter.md`

  ---

  ## Trigger Map

  | Trigger | Action |
  |---------|--------|
  | `WORKSPACE_SCAN` (cron 15 phút) | Run Full Scan (Round 1 + Round 2 checks) |
  | concept file hash changed | Regenerate GDD-FEATURE-<name>.md |
  | `game-overview.md` in concepts/ | Trigger Game GDD synthesis |
  | ≥ 3 Feature GDDs Status: Review since `game_gdd_last_synced` | Auto Game GDD synthesis |
  | Telegram message từ Daniel | Respond + trigger WORKSPACE_SCAN immediately |

  ---

  ## Round 1: Feature GDD Generation (on WORKSPACE_SCAN)

  ```
  1. Read .state/agent_gd_processed.json
     - If missing: initialize to {}

  2. List concepts/*.md:
     exec: Get-ChildItem "D:/PROJECT/CCN2/research_doc/open_claw/agent_team_plan/ccn2_workspace/concepts" -Filter "*.md" -File

  3. For each .md file (excluding README.md):
     a. Compute hash:
        (Get-FileHash 'D:/PROJECT/CCN2/research_doc/open_claw/agent_team_plan/ccn2_workspace/concepts/<filename>' -Algorithm MD5).Hash
     b. Compare with stored hash in state
     c. If hash differs (new or changed):
        → Run Round 2 Feature GDD Generation (see below)

  4. Write updated state to:
     D:/PROJECT/CCN2/research_doc/open_claw/agent_team_plan/ccn2_workspace/.state/agent_gd_processed.json
  ```

  ---

  ## Round 2: Feature GDD Generation (per changed concept)

  ```
  1. READ concept file fully

  2. GENERATE GDD-FEATURE-<name>.md using GDD-TEMPLATE-FEATURE.md
     Rules:
     - Feature name: kebab-case from concept filename (ladder-mechanic.md → GDD-FEATURE-ladder-mechanic.md)
     - Currency: ALWAYS use DIAMOND. If concept says "KC" or "Ladder Points" → translate to DIAMOND
     - CCN2 context: 44 tiles, 2–4 players, 2 tokens/player
     - Balance numbers: use exact values from spec or mark "pending playtesting" in Notes column
     - All 10 sections mandatory — never skip any section
     - If GDD-FEATURE-<name>.md already exists → add new entry to Change Log, increment version

  3. SELF-EVAL against eval/GDD-EVAL-RUBRIC.md (Feature Rubric)
     Score each dimension honestly. Record dimension scores.

  4. APPLY score gate:
     - Score < 50:
       → DO NOT save GDD
       → Save eval result to: eval/GDD-EVAL-<name>-<YYYY-MM-DD>.md (Evaluator: agent_gd, Result: FAIL)
       → Add to batch_notify: "[agent_gd] EVAL FAILED: <name> score=XX/100 — not saved"
       → Update state: { "hash": "<new>", "processedAt": "<ISO>", "lastScore": XX, "status": "FAILED" }

     - Score 50–69:
       → SAVE GDD with Status: Draft in header
       → Save eval result to: eval/GDD-EVAL-<name>-<YYYY-MM-DD>.md (Evaluator: agent_gd, Result: WARNING)
       → Add to batch_notify: "[agent_gd] GDD WARNING: <name> score=XX/100 — saved as Draft"
       → Update state: { "hash": "<new>", "processedAt": "<ISO>", "lastScore": XX, "status": "Draft" }

     - Score ≥ 70:
       → SAVE GDD with Status: Review in header
       → Save eval result to: eval/GDD-EVAL-<name>-<YYYY-MM-DD>.md (Evaluator: agent_gd, Result: PASS)
       → Add to batch_notify: "[agent_gd] GDD ready: <name> score=XX/100"
       → Update state: { "hash": "<new>", "processedAt": "<ISO>", "lastScore": XX, "status": "Review" }

  5. AFTER processing all changed concepts:
     → Send 1 Telegram notification (batch all messages from this scan run)
  ```

  ---

  ## Round 2: Game GDD Synthesis (triggered separately)

  Trigger conditions (check after Feature GDD generation loop):
  - `game-overview.md` exists in concepts/ → run synthesis
  - Count GDDs in state with status "Review" created/updated after `game_gdd_last_synced` → if ≥ 3, run synthesis

  ```
  1. LOAD all GDD-FEATURE-*.md where Status = "Review" OR Status = "Approved"
     (exclude: Status = "Draft", lastScore < 50)

  2. MAP each feature to its Mechanics section number in GDD-GAME-CCN2.md
     (Board/Turn → Section 1, other systems → Section 2, 3, 4... in order of creation date)

  3. AGGREGATE Balance & Config:
     - For each parameter: if same parameter appears in multiple GDDs:
       → If values match: use once
       → If values differ: keep both with comment:
         "⚠️ CONFLICT: GDD-FEATURE-X says [value], GDD-FEATURE-Y says [value]"
     - Add "Source GDD" column

  4. MERGE Open Questions from all Feature GDDs Section 10:
     - Renumber sequentially
     - Add "Source GDD" column

  5. BUILD Glossary:
     - Collect all terms from Feature GDDs glossary / inline definitions
     - Sort alphabetically
     - Include Code Reference column

  6. WRITE GDD-GAME-CCN2.md using GDD-TEMPLATE-GAME.md:
     - Increment version number
     - Add Change Log entry: "vN — synthesized from X Feature GDDs"
     - Auto-populate Related Documents list

  7. UPDATE state:
     {
       "game_gdd_last_synced": "<ISO datetime>",
       "features_included": ["GDD-FEATURE-<name1>.md", "GDD-FEATURE-<name2>.md", ...]
     }

  8. NOTIFY Telegram (separate from batch Feature notifications):
     "[agent_gd] Game GDD updated: GDD-GAME-CCN2.md (vN, X features included)"
  ```

  ---

  ## GDD Template Reference

  **Feature template**: `D:/PROJECT/CCN2/research_doc/open_claw/agent_team_plan/ccn2_workspace/design/GDD-TEMPLATE-FEATURE.md`
  **Game template**: `D:/PROJECT/CCN2/research_doc/open_claw/agent_team_plan/ccn2_workspace/design/GDD-TEMPLATE-GAME.md`
  **Eval rubric**: `D:/PROJECT/CCN2/research_doc/open_claw/agent_team_plan/ccn2_workspace/eval/GDD-EVAL-RUBRIC.md`

  ---

  ## Constraints
  - NEVER modify `concepts/`, `src/`, or `reports/`
  - NEVER create duplicate GDDs — check `design/` before creating
  - NEVER skip sections — all 10 sections required even if brief
  - `GDD-GAME-CCN2.md` is SYNTHESIS-ONLY — never write it manually section by section
  - Currency: ALWAYS DIAMOND. Translate KC/Ladder Points on the fly
  - Max 1 batch Telegram notification per WORKSPACE_SCAN run
  - Balance contradiction → flag ⚠️ CONFLICT, NEVER silently pick one value

  ## Memory
  - Daily notes: `memory/YYYY-MM-DD.md` — log GDDs created, eval scores, issues encountered
  - Long-term: `MEMORY.md` — decisions, patterns learned, recurring issues
  ```

- [ ] **Step 3: Verify**

  Read AGENTS.md vừa ghi. Kiểm tra:
  - Có DIAMOND currency rule rõ ràng trong cả Identity section và Round 2 flow ✓
  - Có score gate 3 levels (<50, 50-69, ≥70) ✓
  - Synthesis trigger kiểm tra "Status: Review" (không phải Draft) ✓
  - Max 1 Telegram per scan constraint ✓
  - Round 1 hash scan logic được giữ nguyên ✓

---

## Chunk 4: agent_qc Eval Integration

### Task 5: Thêm Part C (Eval Workflow) vào agent_qc/AGENTS.md

**Files:**
- Modify: `D:/PROJECT/CCN2/research_doc/open_claw/agent_team_plan/openclaw/agents/agent_qc/AGENTS.md`

- [ ] **Step 1: Read AGENTS.md hiện tại**

  Xác nhận file có Part A (GDD→Testcases) và Part B (Code→Tests). Tìm vị trí chèn Part C.

- [ ] **Step 2: Cập nhật Workspace section**

  Thêm `eval/GDD-EVAL-*.md` vào Write To:
  ```
  - **Write to**: `src/tests/*.test.js`, `reports/testcases-*.md`, `reports/quality-*.md`, `eval/GDD-EVAL-*.md`, `.state/agent_qc_processed.json`
  ```

- [ ] **Step 3: Chèn Part C sau Part B, trước "End of WORKSPACE_SCAN"**

  ```markdown
  ### Part C — GDD Eval (Independent Quality Assessment)

  ```
  1. List design/GDD-FEATURE-*.md AND design/GDD-GAME-CCN2.md
  2. For each GDD file, compute hash and compare with stored hash in state
  3. If hash differs (new or changed GDD):
     a. Determine mode: GDD-FEATURE-* → Feature Rubric; GDD-GAME-* → Game Rubric
     b. Load rubric from: eval/GDD-EVAL-RUBRIC.md
     c. Score each dimension of the rubric honestly
     d. Compare with agent_gd self-eval score (if eval/GDD-EVAL-<name>-*.md exists):
        - If agent_qc score < agent_gd score by ≥ 20pt: set result = FLAG
     e. Save result to: eval/GDD-EVAL-<name>-<YYYY-MM-DD>.md (Evaluator: agent_qc)
     f. Update state with new hash + eval score
  4. Telegram notifications:
     - PASS (≥70 Feature / ≥75 Game):
       "✅ [CCN2 QC] GDD Eval PASS: <name> score=XX/100"
     - FAIL:
       "⚠️ [CCN2 QC] GDD Eval FAIL: <name> score=XX/100 — see eval/GDD-EVAL-<name>-<date>.md"
     - FLAG (score discrepancy):
       "⚠️ [CCN2 QC] Score discrepancy on <name>: agent_gd=XX, agent_qc=YY — human review needed"
  ```
  ```

- [ ] **Step 4: Thêm eval state tracking**

  Sau phần constraints, thêm note:
  ```markdown
  ## State Schema Addition (agent_qc_processed.json)
  GDD eval entries follow same hash-track pattern:
  { "GDD-FEATURE-<name>": { "hash": "<md5>", "evalScore": XX, "evalDate": "<ISO>", "result": "PASS|FAIL|FLAG" } }
  ```

- [ ] **Step 5: Verify**

  Read AGENTS.md. Kiểm tra:
  - Part C tồn tại sau Part B ✓
  - eval/ folder trong Write To list ✓
  - FLAG condition (≥20pt discrepancy) được handle ✓
  - Telegram notify 3 cases (PASS, FAIL, FLAG) ✓

---

## Chunk 5: State Schema + Sample GDD + Progress Update

### Task 6: Update .state/agent_gd_processed.json schema

**Files:**
- Overwrite: `D:/PROJECT/CCN2/research_doc/open_claw/agent_team_plan/ccn2_workspace/.state/agent_gd_processed.json`

- [ ] **Step 1: Read current file**

  Xem nội dung hiện tại (dự kiến: `{}`).

- [ ] **Step 2: Write schema template với empty values + Round 2 fields**

  ```json
  {
    "game_gdd_last_synced": null,
    "features_included": []
  }
  ```

  Giải thích:
  - `game_gdd_last_synced`: null → chưa có synthesis nào chạy
  - `features_included`: [] → sẽ được populate khi synthesis chạy
  - Per-concept entries được thêm dynamically bởi agent_gd, format:
    `"<filename>": { "hash": "<md5>", "processedAt": "<ISO>", "lastScore": 0, "status": "Review|Draft|FAILED" }`

---

### Task 7: Generate Sample GDD — GDD-FEATURE-ladder-mechanic.md

**Files:**
- Create: `D:/PROJECT/CCN2/research_doc/open_claw/agent_team_plan/ccn2_workspace/design/GDD-FEATURE-ladder-mechanic.md`

Context: Concept file `concepts/ladder-mechanic.md` dùng `KC` và `Ladder Points` (cũ) — phải translate sang `DIAMOND`.

- [ ] **Step 1: Read concept file**

  Path: `D:/PROJECT/CCN2/research_doc/open_claw/agent_team_plan/ccn2_workspace/concepts/ladder-mechanic.md`
  Note: concept dùng `player.kc` và 600 KC threshold — translate thành `player.diamond` và 600 DIAMOND.

- [ ] **Step 2: Write GDD-FEATURE-ladder-mechanic.md**

  ```markdown
  # GDD-FEATURE: Ladder Mechanic
  **Source**: concepts/ladder-mechanic.md
  **Version**: v1
  **Created**: 2026-03-18
  **Status**: Review
  **Author**: agent_gd (Designia)

  ## Change Log
  | Version | Date | Changed By | Summary |
  |---------|------|------------|---------|
  | v1 | 2026-03-18 | agent_gd | Initial draft from concept |

  ---

  ## 1. Overview
  The Ladder Mechanic is the primary win-condition pathway in CCN2. A player accumulates DIAMOND by landing on REWARD tiles; once reaching 600 DIAMOND and landing on a Safe Zone, their gate opens, allowing tokens to enter the Ladder Lane and reach their color's Final LADDER tile to trigger a win.

  ## 2. Core Mechanics

  ### 2.1 DIAMOND Accumulation
  - State variable: `player.diamond` (integer, starts at 0)
  - REWARD tiles: IDs 5, 10, 15, 20, 25, 30, 35, 40
  - When a token lands on a REWARD tile: `player.diamond += CONFIG.REWARD_TILE_GRANT`
  - `player.diamond` never decreases during normal play

  ### 2.2 Gate Open Condition
  - Checked after every token landing
  - Condition: `player.diamond >= 600` AND landing tile is a Safe Zone (IDs: 1, 11, 21, 31)
  - If condition met: `player.gateOpen = true`
  - Gate open is permanent once triggered — not reversible

  ### 2.3 Ladder Lane Routing
  - When `player.gateOpen = true`, player may choose to route their token toward the Ladder Lane instead of continuing the main loop
  - Ladder Lane entry is only available when gate is open
  - Only the moving token's player's colored LADDER tile is the valid final destination

  ### 2.4 Win Trigger
  - LADDER tile IDs: 41 (Green), 42 (Red), 43 (Blue), 44 (Yellow)
  - When a token reaches its player's LADDER tile: `triggerWin(playerId)`
  - Only 1 win per game — first player to reach their LADDER tile wins immediately

  ## 3. Win/Lose Conditions
  - **Win:** Token reaches the player's colored LADDER tile (IDs 41–44 respectively).
  - **First-wins:** Only 1 win per game. The first player to trigger `triggerWin()` wins; the game ends immediately.

  ## 4. Edge Cases
  - If `player.diamond >= 600` but token lands on a non-Safe Zone tile → gate does NOT open. Player must land on a Safe Zone tile to trigger gate open.
  - If `player.diamond = 599` and token lands on a Safe Zone → gate does NOT open (threshold is strictly ≥ 600).
  - If two players both reach 600 DIAMOND in the same round → both gates open simultaneously; game becomes a race to each player's respective LADDER tile.
  - If a player with `gateOpen = true` gets kicked back to a Safe Zone by an opponent → gate remains open (`gateOpen` is not reset on kick).
  - If a token overshoots the Final LADDER tile (roll exceeds remaining steps) → token bounces back the excess steps (does not wrap to main loop).

  ## 5. UI/UX Notes
  - Visual: Gate opening → animated barrier disappears at Ladder Lane entrance; player's color highlight activates on Ladder Lane path.
  - Audio: Distinct "gate open" sound effect triggered once when `gateOpen` transitions to true.
  - Animation: Token entering Ladder Lane plays a different movement animation than normal main loop movement (e.g., ascending motion).

  ## 6. Balance & Config
  | Parameter | Value | Notes |
  |-----------|-------|-------|
  | DIAMOND threshold to open gate | 600 | `CONFIG.WIN_DIAMOND_THRESHOLD` |
  | REWARD_TILE_GRANT | TBD | pending playtesting — see GameDesignDocument.md for current value |
  | REWARD tile IDs | 5, 10, 15, 20, 25, 30, 35, 40 | 8 tiles evenly spaced on 44-tile board |
  | Safe Zone tile IDs | 1, 11, 21, 31 | One per player color |
  | LADDER tile IDs | 41 (Green), 42 (Red), 43 (Blue), 44 (Yellow) | Win tiles |
  | Gate open: reversible? | No | Once `gateOpen = true`, stays true for the game |

  ## 7. Metrics
  | Metric | Description | Target | How to Measure |
  |--------|-------------|--------|----------------|
  | Rounds to gate open (avg) | Average number of rounds before first player opens gate | 8–12 rounds | Track `currentRound` when first `gateOpen = true` fires |
  | Gate-to-win conversion rate | % of players who open gate and successfully reach LADDER tile before opponent | ≥ 60% | `(wins with gate open) / (total gate open events)` |
  | DIAMOND at game end (non-winner) | Average DIAMOND of losing player when game ends | < 600 (KO before gate) or ≥ 600 (race lost) | `player.diamond` at `triggerWin()` for non-winner |

  ## 8. Dependencies
  - Depends on GDDs: GDD-FEATURE-board-movement.md (token movement rules), GDD-FEATURE-reward-tiles.md (DIAMOND grant logic)
  - Server changes needed: yes — `gateOpen` flag in player state, Ladder Lane routing logic
  - Client changes needed: yes — gate animation, Ladder Lane visual path, `gateOpen` state rendering
  - Config keys needed: `CONFIG.WIN_DIAMOND_THRESHOLD` (600), `CONFIG.REWARD_TILE_IDS`, `CONFIG.SAFE_ZONE_IDS`, `CONFIG.LADDER_TILE_IDS`

  ## 9. Test Scenarios
  1. Given `player.diamond = 599` and token lands on Safe Zone tile 1, When turn ends, Then `player.gateOpen` remains false.
  2. Given `player.diamond = 600` and token lands on Safe Zone tile 11, When turn ends, Then `player.gateOpen` becomes true.
  3. Given `player.diamond = 700` and token lands on non-Safe Zone tile 7, When turn ends, Then `player.gateOpen` remains false (non-Safe Zone, gate does not open).
  4. Given `player.gateOpen = true` and opponent kicks player's token back to Safe Zone 1, When kick resolves, Then `player.gateOpen` remains true (kick does not reset gate).
  5. Given `player.gateOpen = true` and token has 2 steps remaining to LADDER tile but rolls 5, When movement resolves, Then token stops at LADDER tile (bounces back 3 steps, not overshoot).
  6. Given Player1 and Player2 both reach `player.diamond = 600` in same round, When both land on Safe Zones, Then both `gateOpen` flags become true — game enters race mode.
  7. Given `player.gateOpen = true` and token reaches LADDER tile 41 (Green), When landing resolves, Then `triggerWin(playerId)` is called and game ends immediately.

  ## 10. Open Questions / TBD
  | # | Question | Owner | Status |
  |---|----------|-------|--------|
  | 1 | Exact value of REWARD_TILE_GRANT — how much DIAMOND per REWARD tile landing? | Designer | Open |
  | 2 | Can a player choose NOT to enter Ladder Lane when gate is open (strategic delay)? | Designer | Open |
  ```

- [ ] **Step 3: Verify**

  Read file. Kiểm tra:
  - Không có "KC" hay "Ladder Points" nào (chỉ có "DIAMOND") ✓
  - Section 6 Balance table có exact IDs ✓
  - 7 Test Scenarios (>= min 5) ✓
  - 5 Edge Cases (>= min 3) ✓
  - Section 7 Metrics có "How to Measure" column ✓

---

### Task 8: Update PROGRESS.md

**Files:**
- Modify: `D:/PROJECT/CCN2/research_doc/open_claw/agent_team_plan/ccn2_workspace/progress/PROGRESS.md`

- [ ] **Step 1: Read PROGRESS.md hiện tại**

  Xác nhận vị trí Round 1 completion block và Round 2 table.

- [ ] **Step 2: Update Round 1 status**

  Mark Phase 1.4 (Smoke Test) là ✅ DONE — anh đã hoàn thành 2 manual steps.

  Tìm:
  ```
  | Test agent_gd responds to message | ⬜ TODO |
  | Test agent_dev responds to message | ⬜ TODO |
  | Test agent_qc responds to message | ⬜ TODO |
  | Verify heartbeat + cron chạy | ⬜ TODO |
  ```
  Đổi thành:
  ```
  | Test agent_gd responds to message | ✅ DONE | 2026-03-18 | Manual — anh confirm |
  | Test agent_dev responds to message | ✅ DONE | 2026-03-18 | Manual — anh confirm |
  | Test agent_qc responds to message | ✅ DONE | 2026-03-18 | Manual — anh confirm |
  | Verify heartbeat + cron chạy | ✅ DONE | 2026-03-18 | Manual — anh confirm |
  ```

- [ ] **Step 3: Update Round 2 table**

  Tìm:
  ```
  ## Round 2 — Specialization
  | Phase | Status |
  |-------|--------|
  | agent_gd GDD Workflow | ⬜ TODO |
  ```
  Đổi thành:
  ```
  ## Round 2 — Specialization
  | Phase | Status | Date | Notes |
  |-------|--------|------|-------|
  | agent_gd GDD Workflow | 🔄 IN PROGRESS | 2026-03-18 | Templates + Eval Rubric + AGENTS.md upgrade |
  | agent_dev Code Workflow | ⬜ TODO | — | — |
  | agent_qc Test Workflow | ⬜ TODO | — | — |
  ```

- [ ] **Step 4: Update header timestamp**

  Đổi dòng đầu "Last updated":
  ```
  > Last updated: 2026-03-18 (Round 1 ✅ COMPLETE — Phase 1.1–1.4 all done; Round 2 🔄 IN PROGRESS — agent_gd GDD Workflow)
  ```

- [ ] **Step 5: Verify**

  Read PROGRESS.md. Kiểm tra:
  - Phase 1.4 rows đều ✅ ✓
  - Round 2 table có status column ✓
  - Header timestamp cập nhật ✓

---

## Summary

| Task | File | Est. Time |
|------|------|-----------|
| 1 | GDD-TEMPLATE-FEATURE.md | 3 min |
| 2 | GDD-TEMPLATE-GAME.md | 3 min |
| 3 | eval/GDD-EVAL-RUBRIC.md | 4 min |
| 4 | agent_gd/AGENTS.md upgrade | 5 min |
| 5 | agent_qc/AGENTS.md + Part C | 4 min |
| 6 | .state/agent_gd_processed.json | 1 min |
| 7 | GDD-FEATURE-ladder-mechanic.md (sample) | 5 min |
| 8 | PROGRESS.md update | 2 min |
| **Total** | **8 files** | **~27 min** |
