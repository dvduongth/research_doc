# Phân Tích Skill: eval-harness

**Người phân tích:** Kẹo Đào 🪄  
**Ngày:** 2025-06-20  
**Source skill:** `D:\workspace\CCN2\.claude\skills\eval-harness\SKILL.md`  
**Lưu trữ:** `D:\workspace\CCN2\research_doc\evals\Eval-Harness-Skill-Analysis`

---

## 1. Tổng Quan

**eval-harness** là một skill (framework) để tự động hóa đánh giá (evaluation) cho AI agents. Nó được thiết kế theo kiến trúc modular, hỗ trợ đa dạng agent types (coding, conversational, research, computer-use, sub-agent), và implements Swiss Cheese Model (6 layers).

**Cơ sở:** Anthropic Engineering blog post "Demystifying Evals for AI Agents" (2026-01-09)

**Mục tiêu:** Cung cấp全套 công cụ để:
- Setup eval suite cho project
- Tạo và quản lý tasks
- Chạy evals với metrics pass@k/pass^k
- Tích hợp CI/CD
- Monitor production
- Track saturation và regression

---

## 2. Kiến Trúc & Thành Phần

### 2.1 Cấu Trúc Thư Mục Mẫu

```
evals/
├── eval.config.yaml          # Config chính
├── tasks/
│   ├── coding/              # Tasks cho coding agents
│   ├── conversational/      # Tasks cho conversational agents
│   ├── research/            # Tasks cho research agents
│   ├── computer-use/        # Tasks cho computer-use agents
│   └── sub-agent/           # Tasks cho orchestrator agents
├── graders/
│   └── rubrics/             # LLM rubric files (.md)
├── runs/                    # SQLite DB (eval.db)
├── reports/                 # Generated reports
└── human-review/
    └── pending/             # Human review queue
```

### 2.2 Các Loại Graders

#### Code-Based (Deterministic, Fast, Cheap)
| Type | Mục đích | Example |
|------|----------|---------|
| `unit_tests` | Chạy pytest/unittest | `files: [tests/test_auth.py]` |
| `static_analysis` | Linters, security scanners | `tools: [ruff, mypy, bandit]` |
| `state_check` | Kiểm tra environment state (DB, filesystem) | `check: "db.orders['123'].status == 'refunded'"` |
| `dom_check` | Kiểm tra HTML DOM | `selector: ".success-message"` |
| `file_exists` | Kiểm tra output files tồn tại | `files: [report.md, results.json]` |
| `efficiency` | Kiểm tra turn count, token usage | `max_turns: 8, max_tokens: 10000` |

#### Model-Based (Flexible, Async, Nuanced)
| Type | Mục đích | Example |
|------|----------|---------|
| `llm_rubric` | LLM score theo rubric file | `rubric: rubrics/code-quality.md` |
| `coverage_check` | Kiểm tra coverage của topics | `required_topics: ["auth", "security"]` |
| `groundedness` | Kiểm tra claims có source | `check: "every claim has source URL"` |
| `hallucination_check` | Phát hiện thông tin sai | `weight: 0.2` |
| `screenshot_verify` | Verify screenshot mô tả | `description: "Form submitted successfully"` |

#### Human (Gold Standard, Async)
| Type | Mục đích | Example |
|------|----------|---------|
| `human` | Expert review, calibration | `queue: expert_review, weight: 0.1` |

**Quy tắc:** Tất cả grader weights trong một task phải sum to 1.0.

### 2.3 Execution Order

1. **code_grader** (sync, fast) — chạy đầu tiên
2. **model_grader** (async) — chạy song song sau code graders
3. **human_grader** (enqueue) — không block, chạy cuối

### 2.4 Metrics

#### pass@k (Capability)
```
p = c/n (c = passed trials, n = total trials)
pass@k = 1 - (1-p)^k
```
Use cho: capability building, development phase.

**Ví dụ:** k=3, p=0.667 → pass@3 = 1 - (0.333)^3 = 0.963

#### pass^k (Reliability)
```
pass^k = p^k
```
Use cho: production agents, customer-facing, regression testing.

**Ví dụ:** k=3, p=0.667 → pass^3 = 0.667^3 = 0.296

#### Saturation & Regression
- **Saturation:** avg pass rate > 80% → cần harder tasks
- **Regression:** current score < previous - 0.05 (5% drop) → alert

---

## 3. Swiss Cheese Model — 6 Layers

```
Layer 1: Automated Evals       ← /eval-harness run (every commit/PR)
Layer 2: Production Monitoring ← /eval-harness monitor
Layer 3: A/B Testing          ← external tools (Optimizely, LaunchDarkly)
Layer 4: User Feedback        ← collect ratings, triage weekly
Layer 5: Transcript Review    ← /eval-harness transcript (weekly sampling)
Layer 6: Human Studies        ← expert review (monthly/quarterly)
```

**Nguyên tắc:** Không có layer nào catch everything. Kết hợp nhiều layers → failures slip through one layer bị caught by another.

---

## 4. Các Command Chính

### 4.1 Setup & Initialization

| Command | Mục đích | Output |
|---------|----------|--------|
| `/eval-harness init` | Scaffold eval suite |evals/ directory with full structure |
| `/eval-harness task create` | Tạo task mới từ template | `evals/tasks/<type>/<name>.yaml` |
| `/eval-harness task validate` | Kiểm tra task có valid không | Pass% từ frontier model trial |
| `/eval-harness ci setup` | Generate CI config | `.github/workflows/eval.yml`, etc. |

### 4.2 Running & Grading

| Command | Mục đích |
|---------|----------|
| `/eval-harness run` | Chạy eval suite hoặc task cụ thể |
| `/eval-harness grade` | Re-grade existing run (code/model/human) |
| `/eval-harness grader add` | Thêm grader vào task |
| `/eval-harness grader test` | Test grader với sample transcript |

### 4.3 Monitoring & Reporting

| Command | Mục đích |
|---------|----------|
| `/eval-harness report` | Generate report (md/json/html) |
| `/eval-harness metrics` | View metrics over time, trends, saturation |
| `/eval-harness transcript` | Xem trial transcript/trace |
| `/eval-harness status` | Overview của eval suite |

### 4.4 Human Review

| Command | Mục đích |
|---------|----------|
| `/eval-harness human-review schedule` | Tạo review queue |
| `/eval-harness human-review list` | List pending reviews |
| `/eval-harness human-review submit` | Import review results vào DB |

### 4.5 CI/CD Integration

| Command | Mục đích |
|---------|----------|
| `/eval-harness ci setup` | Generate CI config cho GitHub/GitLab/Jenkins |
| `/eval-harness ci run` | Run evals trong CI context (fail nếu regression) |

---

## 5. Agent-Type Specific Guidance

Từ `references/agent-types.md`:

### 5.1 Coding Agent

**Benchmarks:** SWE-Bench Verified, Terminal-Bench  
**Metric:** pass-at-k  
**Primary graders:**
- Bug fix: tests(50%) + static(30%) + rubric(20%)
- Feature add: tests(40%) + rubric(35%) + static(25%)
- Refactor: tests(30%) + rubric(40%) + static(30%)

**Environment isolation:** `reset: git_clean` (git clean -fdx trước mỗi trial)

**Tracked metrics:** n_turns, n_tool_calls, n_tokens, latency_ms

**Saturation signal:** SWE-Bench Verified approaching 80% for frontier models.

### 5.2 Conversational Agent

**Benchmarks:** τ-Bench (retail), τ2-Bench (airline)  
**Metric:** pass-pow-k (production reliability)  
**Primary graders:** state_check(50%) + llm_rubric(30%) + efficiency(20%)

**Key pattern:** Use `simulated_user` environment — LLM đóng vai user persona.

**Watch for:** Agent finding better policy paths — grade OUTCOMES not PATHS.

### 5.3 Research Agent

**Benchmarks:** BrowseComp ("needles in haystacks")  
**Metric:** pass-at-k  
**Primary graders:** coverage_check(40%) + groundedness(30%) + hallucination_check(20%) + human(10%)

**Challenge:** Ground truth thay đổi theo thời gian. Dùng `expected_topics` not exact answers.

**Human grader always recommended** (min 10% weight).

### 5.4 Computer Use Agent

**Benchmarks:** WebArena (browser), OSWorld (full OS)  
**Metric:** pass-at-k  
**Primary graders:** dom_check(50%) + state_check(40%) + screenshot_verify(10%)

**Environment isolation:**
```yaml
reset:
  - clear_cookies
  - run_sql: "DELETE FROM <table> WHERE test=true"
snapshot_before: true  # capture DB state before trial
```

**state_check dùng snapshot object:**
```yaml
check: "db.users.count() == snapshot.users_count + 1"
```

**Trade-off:** dom_check (fast, accurate, high tokens) vs screenshot_verify (lower tokens, any UI).

### 5.5 Sub-Agent (Orchestrator + Workers)

**No standard benchmark yet.**  
**Metric:** pass-at-k  
**Primary graders:** file_exists(30%) + final_output(70%)

**Key rule:** Grade OBSERVABLE OUTPUTS (files created, final report), không count internal spawns.

---

## 6. Error Handling Rules

| Error Type | Handling |
|------------|----------|
| **timeout** | `passed=false, error="timeout"` — KHÔNG retry |
| **crash** | `passed=false, error=traceback` — show traceback |
| **grader error** | `grader_score=null, error=msg` — KHÔNG fail whole run |
| **0% pass rate on validate** | "Task is BROKEN, not agent is bad" |

---

## 7. CI/CD Integration

### 7.1 Required Environment Variables

```
ANTHROPIC_API_KEY    # Claude API for agent + model grader
EVAL_DB_PATH         # Path to eval.db
EVAL_SUITE           # Suite name to run
EVAL_MODEL           # Model ID
```

### 7.2 Template Configs

**GitHub Actions:** `.github/workflows/eval.yml` — run on push/PR, fail nếu avg score < threshold  
**GitLab CI:** Append eval job to `.gitlab-ci.yml`  
**Jenkins:** Add stage to `Jenkinsfile`  
**Generic:** `scripts/run-evals.sh`

---

## 8. Strengths & Weaknesses

### 8.1 Strengths

✅ **Comprehensive:** Cover full eval lifecycle từ init → run → grade → report → monitor  
✅ **Modular:** Graders decoupled, có thể mix & match  
✅ **Flexible metrics:** pass@k vs pass^k cho different use cases  
✅ **Swiss Cheese approach:** Multi-layer detection  
✅ **CI/CD ready:** Built-in adapters cho major platforms  
✅ **Human review integration:** Async, non-blocking  
✅ **Good documentation:** Detailed references, examples, error handling  
✅ **Based on industry best practices:** từ Anthropic's real experience  

### 8.2 Weaknesses / Gaps

❌ **Framework implementation unclear:** SKILL.md describes commands nhưng không thấy runner Python code (có thể nằm ở `/runner/` module)  
❌ **Templates missing:** Trong `templates/` không có files (coding.yaml, conv.yaml, etc.)  
❌ **No demo/example suite:** Không có sample tasks để học fast  
❌ **Agent-specific:** Thiết kế cho AI agents, không phải cho traditional software testing (như game logic)  
❌ **Anthropic API dependency:** Model graders require Claude API — không dùng được với local/open-source models  
❌ **Complexity:** Nhiều concepts, cần learning curve để setup đúng  

---

## 9. Applicability To CCN2 Demo

### 9.1 CCN2 Demo Context

- **Project type:** HTML5 Canvas hotseat board game (no AI agent)
- **Tech stack:** Vanilla JS, Canvas API
- **Testing needs:**
  - Game logic correctness (board generation, dice rolling, token movement)
  - UI behavior (HUD updates, click responses)
  - Edge cases (invalid moves, rapid input)
  - Performance (FPS, memory)
  - Asset loading

### 9.2 Can We Use eval-harness Directly?

**Partially, but with adaptation:**

✅ **Structure (evals/)** — Có thể dùng luôn cấu trúc thư mục  
✅ **Graders concept** — Code-based graders rất phù hợp (unit tests, state checks)  
✅ **Metrics** — pass@k có thể adapt cho game scenarios  
✅ **CI/CD integration** — Dùng được templates  
✅ **Swiss Cheese layers** — Áp dụng nguyên tắc cho game testing  

❌ **Agent harness** — eval-harness được designed để eval AI agents (với tool calls, LLM reasoning). CCN2 không có agent  
❌ **Model-based graders** — LLM rubric cho UX có thể dùng, nhưng cần Claude API  
❌ **Task format** — YAML format với `input.prompt` và `agent_type` là cho AI agents, cần adapt cho game  
❌ **No game-specific templates** — Không có templates cho unit testing, integration testing của game  

### 9.3 Gap Analysis

| eval-harness Feature | CCN2 Demo Fit | Adaptation Needed |
|----------------------|---------------|------------------|
| Task YAML format | ❌ No | Tạo custom task schema cho game scenarios |
| Agent harness | ❌ No | Replace với test harness (Jest/Mocha/ custom runner) |
| Code-based graders | ✅ Yes | Dùng unit tests, integration tests, state checks |
| Model-based graders | ⚠️ Partial | Có thể dùng LLM rubric cho UX quality, nhưng require API |
| Human review | ✅ Yes | Dùng cho playtesting feedback |
| pass@k / pass^k | ⚠️ Partial | Adapt metrics: success rate trong N playthroughs |
| CI/CD integration | ✅ Yes | Directly usable |
| Swiss Cheese layers | ✅ Yes | Áp dụng nguyên tắc: automated tests + manual playtesting + user feedback |
| Environment isolation | ✅ Yes | Game state reset giữa trials (cần implement) |
| Transcript/trace | ✅ Yes | Game log/action trace thay vì agent transcript |

---

## 10. Recommended Adaptation Strategy

Vì eval-harness được thiết kế cho AI agents, tôi đề xuất **không dùng trực tiếp** mà **adapt các nguyên tắc** để build custom eval system cho CCN2 Demo.

### 10.1 Two Approaches

#### Approach A: Custom Lightweight Eval Harness (Recommended)

Xây dựng system đơn giản, tailored for game testing:

**Structure:**
```
evals/
├── config.yaml              # Suite config
├── tasks/
│   ├── unit/               # Unit test scenarios
│   ├── integration/        # Full game playthroughs
│   ├── ui/                 # UI interaction tests
│   └── performance/        # FPS, memory tests
├── test-harness/           # Custom JS/TS test runner
├── reports/
└── human-review/
```

**Custom test harness** (`test-harness/`):
- Mô phỏng game states, player actions
- Reset game state trước mỗi trial
- Capture outcomes: board state, score, errors
- Generate transcripts: action logs, screenshots (nếu cần)

**Graders:**
- Code-based: Unit tests (Jest), integration tests, state validation
- Model-based (optional): LLM rubric cho UX (tone, clarity of HUD)
- Human: Playtesting reviews

**Metrics:**
- pass@k: % playthroughs thành công trong k tries
- pass^k: % playthroughs luôn thành công (tất cả k tries)
- Performance: avg FPS, memory usage, load time

**CI/CD:**
- Dùng Promptfoo (như Anthropic recommendation) hoặc custom GitHub Actions
- Run evals mỗi commit/PR

#### Approach B: Adapt eval-harness (Advanced)

Nếu muốn dùng framework sẵn có:

1. **Fork và modify runner** để hỗ trợ non-agent tasks
2. **Tạo new agent type** `game` trong `references/agent-types.md`
3. **Implement custom harness** cho game (không cần LLM agent)
4. **Define task schema** mới cho game scenarios
5. **Implement runners** cho unit tests, playthrough simulation

**Lợi ích:** Dùng được tất cả infra (DB, reports, metrics, CI adapters)  
**Nhược điểm:** Cần đáng kể effort để modify framework, maintenance overhead

---

## 11. Implementation Plan (Approach A — Custom Lightweight)

### Phase 1: Setup Infrastructure (Week 1)

1. **Tạo cấu trúc evals/**
   ```
   evals/
   ├── config.yaml
   ├── tasks/
   │   ├── unit/
   │   ├── integration/
   │   ├── ui/
   │   └── performance/
   ├── test-harness/
   ├── reports/
   └── human-review/
   ```

2. **Setup config.yaml**
   ```yaml
   suite_name: "CCN2 Demo Evals"
   default_k: 3
   default_metric: pass-at-k
   regression_threshold: 0.05  # 5% drop
   saturation_threshold: 0.80
   ci:
     fail_threshold: 80
   models:
     llm_grader: claude-sonnet-4-6  # optional
   ```

3. **Chọn framework testing:**
   - **Unit tests:** Jest (hoặc Mocha) — đã có sẵn nếu project dùng?
   - **Integration/playthrough:** Custom harness (Node.js script)
   - **UI tests:** Puppeteer/Playwright (nếu cần browser automation)

### Phase 2: Build Custom Test Harness (Week 1-2)

**File:** `evals/test-harness/runner.js`

**Chức năng:**
1. Load game code (src/*.js) trong môi trường controlled (JSDOM hoặc headless browser)
2. Khởi tạo game state sạch
3. Thực hiện action sequence từ task definition:
   - Unit test: call specific functions, assert results
   - Integration: simulate player moves, dice rolls, UI clicks
   - Performance: measure FPS, memory, load time
4. Capture outcome:
   - Final board state
   - Game result (winner, score)
   - Errors, exceptions
   - Turn count, token usage
5. Generate transcript (JSON):
   ```json
   {
     "task_id": "token-move-001",
     "trial_id": "t1",
     "actions": [...],
     "outcome": {...},
     "metrics": {
       "n_turns": 15,
       "n_errors": 0,
       "latency_ms": 2450,
       "fps_avg": 60
     }
   }
   ```

**API task definition (YAML):**
```yaml
task:
  id: "board-generation-001"
  type: unit
  description: "Validate board generates 40 tiles equally spaced on circle"
  input:
    module: "src/board.js"
    function: "buildPath"
    params: {}
  graders:
    - type: state_check
      check: "board.tiles.length === 40"
      weight: 0.5
    - type: state_check
      check: "all tiles equally spaced on circle radius=245"
      weight: 0.3
    - type: efficiency
      max_turns: 1
      weight: 0.2
```

**API integration/playthrough task:**
```yaml
task:
  id: "full-game-001"
  type: integration
  description: "Complete full game with 2 players, 600 KC win"
  input:
    scenario: "two-player-hotseat"
    actions:
      - player: 1, action: roll_dice
      - player: 1, action: choose_die, die: 3
      - ... (more actions)
  expected:
    winner: player1
    final_score: 600
    max_turns: 100
  graders:
    - type: state_check
      check: "game.winner === 'player1'"
      weight: 0.4
    - type: state_check
      check: "game.players[0].kc === 600"
      weight: 0.3
    - type: efficiency
      max_turns: 100
      weight: 0.2
    - type: llm_rubric  # optional
      rubric: rubrics/game-flow.md
      weight: 0.1
```

### Phase 3: Implement Graders (Week 2)

**Code-based graders (JS/TS):**
- `unit_tests`: Run Jest tests, parse JSON results
- `state_check`: Evaluate JS expressions against game state
- `file_exists`: Check output files (replay logs, screenshots)
- `efficiency`: Check n_turns, latency, FPS against thresholds

**Model-based graders (optional):**
- `llm_rubric`: Gọi Claude API với rubric file, pass transcript
- Implementation: `graders/model_grader.js` (async)

**Human grader:**
- Simple: enqueue markdown files for playtesting team
- Format: YAML front-matter + transcript + reviewer notes

### Phase 4: Runner & CLI (Week 2-3)

**File:** `evals/run.js` (Node.js CLI)

**Commands:**
```bash
node evals/run.js init                  # Setup evals/ structure
node evals/run.js task create --type unit --name "board-generation"
node evals/run.js task validate --all
node evals/run.js run --k 3 --mode pass-at-k
node evals/run.js report --format html
node evals/run.js metrics --trend
node evals/run.js transcript --failed-only
```

**Database:** SQLite (hoặc JSON files đơn giản) để store:
- tasks
- trials (transcript, outcome, scores)
- runs (aggregated results)
- human_reviews

**Implementation:**
- Dùng `better-sqlite3` cho SQLite
- Store transcripts como JSON strings
- Index theo task_id, run_id, timestamp

### Phase 5: CI/CD Integration (Week 3)

**GitHub Actions workflow:**

```yaml
# .github/workflows/evals.yml
name: Eval Regression
on:
  push:
    branches: [main, dev]
  pull_request:

jobs:
  eval:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
      - name: Install dependencies
        run: npm ci
      - name: Run regression evals
        run: node evals/run.js run --mode regression --fail-threshold 80
      - name: Upload report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: eval-report
          path: evals/reports/
```

### Phase 6: Monitoring & Swiss Cheese (Week 4)

**Layer 1 (Automated):** CI/CD mỗi commit — done

**Layer 2 (Production Monitoring):**
- Hook vào game logs (nếu có)
- Track: error rates, crash reports, FPS drops
- Import vào eval DB `feedback` table
- Command: `node evals/run.js monitor --source logs`

**Layer 4 (User Feedback):**
- Collect in-app ratings (1-5 stars) or bug reports
- API endpoint để submit feedback
- Import vào DB: `node evals/run.js feedback import`

**Layer 5 (Transcript Review):**
- Weekly: `node evals/run.js transcript --failed-only --sample 10`
- Generate human review files: `node evals/run.js human-review schedule --sample 10`

**Layer 6 (Human Studies):**
- Monthly expert playtesting sessions
- Submit reviews: `node evals/run.js human-review submit --file <review.md>`

---

## 12. Sample Task Definitions for CCN2 Demo

### Task 1: Unit Test — Board Generation

```yaml
task:
  id: "board-generation-001"
  type: unit
  description: "Board generates exactly 40 tiles on circle with correct radius and positions"
  module: "src/board.js"
  function: "buildPath"
  input:
    params: {}
  graders:
    - type: state_check
      check: "result.tiles.length === 40"
      weight: 0.4
    - type: state_check
      check: "result.tiles.every(t => Math.abs(t.distanceFromCenter - 245) < 0.001)"
      weight: 0.3
    - type: state_check
      check: "tiles equally spaced (angle difference = 2π/40)"
      weight: 0.3
```

### Task 2: Integration — Full Game Win Condition

```yaml
task:
  id: "game-win-600kc-001"
  type: integration
  description: "Two-player hotseat game ends when player lands on LADDER tile 6 times (600 KC)"
  scenario:
    players: 2
    mode: hotseat
    dice_mode: standard
  actions:
    # Simulate 20-30 turns với random dice but deterministic seed
    seed: "test-suite-2025-06-20"
    max_turns: 50
  expected:
    winner: player1
    win_condition: "ladder_landings >= 6"
    min_score: 600
  graders:
    - type: state_check
      check: "game.state === 'END_GAME'"
      weight: 0.3
    - type: state_check
      check: "game.winner === 'player1'"
      weight: 0.3
    - type: state_check
      check: "game.players[0].ladderLandings >= 6"
      weight: 0.2
    - type: efficiency
      max_turns: 50
      weight: 0.2
```

### Task 3: UI — HUD Updates

```yaml
task:
  id: "hud-turn-indicator-001"
  type: ui
  description: "HUD displays current player turn correctly after each dice roll"
  ui_framework: "canvas"  # or "dom" if HUD uses HTML overlay
  scenario:
    initial_state: "SETUP"
    actions:
      - click: "btn-start-game"
      - wait: 100ms
      - assert: "HUD shows 'Player 1 Turn'"
      - click: "btn-roll-dice"
      - wait: 700ms  # dice roll animation
      - assert: "HUD updates to 'Player 2 Turn'"
  graders:
    - type: dom_check  # nếu HUD là DOM elements
      selector: "#hud-turn-indicator"
      expected_text: "Player 2 Turn"
      weight: 0.6
    - type: screenshot_verify  # alternative: LLM check canvas rendering
      description: "HUD canvas correctly renders 'Player 2 Turn' in top-right corner"
      weight: 0.4
```

### Task 4: Performance — Frame Rate

```yaml
task:
  id: "performance-fps-001"
  type: performance
  description: "Game maintains ≥55 FPS during normal gameplay (2 players, 20 turns)"
  scenario:
    players: 2
    max_turns: 20
    record_fps: true
  thresholds:
    min_avg_fps: 55
    max_fps_drop: 10  # temporary dips allowed
    target_frame_time_ms: 16.67  # 60 FPS target
  graders:
    - type: state_check
      check: "metrics.avg_fps >= 55"
      weight: 0.5
    - type: state_check
      check: "metrics.max_fps_drop <= 10"
      weight: 0.3
    - type: state_check
      check: "metrics.95th_percentile_frame_time <= 20"
      weight: 0.2
```

---

## 13. Checklist Implementation

### Before Starting

- [ ] Review eval-harness skill docs và references
- [ ] Decide: Approach A (custom) vs Approach B (adapt)
- [ ] Choose testing framework (Jest/Mocha/Puppeteer)
- [ ] Setup `evals/` directory structure
- [ ] Create `config.yaml`

### Building Test Harness

- [ ] Implement game state isolation (clean slate mỗi trial)
- [ ] Implement action simulators (click, roll, choose)
- [ ] Implement outcome capture (board state, scores)
- [ ] Implement transcript generation (JSON format)
- [ ] Implement metrics collection (turns, FPS, errors)

### Creating Tasks

- [ ] Start với 10-20 tasks (Step 0: Start early)
- [ ] Cover: unit, integration, UI, performance
- [ ] Ensure tasks unambiguous (two humans agree on pass/fail)
- [ ] Create reference solutions (known good outcomes)
- [ ] Balance: normal gameplay + edge cases

### Implementing Graders

- [ ] Code-based graders first (unit tests, state checks)
- [ ] Test graders với sample transcripts
- [ ] Verify grader weights sum to 1.0
- [ ] Optional: Add LLM rubrics cho UX quality
- [ ] Optional: Setup human review queue

### CI/CD Integration

- [ ] Generate GitHub Actions workflow
- [ ] Set ANTHROPIC_API_KEY secret (nếu dùng LLM graders)
- [ ] Run evals on PRs, fail nếu regression >5%
- [ ] Upload reports as artifacts

### Long-term Maintenance

- [ ] Assign eval ownership (team member)
- [ ] Schedule regular human review (weekly transcript sampling)
- [ ] Monitor saturation (tasks >80% → add harder ones)
- [ ] Document eval-driven development process
- [ ] Let non-engineers contribute tasks via PR

---

## 14. Comparison: eval-harness vs Custom For CCN2

| Feature | eval-harness (Adapted) | Custom Harness (Recommended) |
|---------|------------------------|-----------------------------|
| **Setup complexity** | High (need to modify runner) | Low (build exactly what needed) |
| **Flexibility** | Medium (constrained by agent model) | High (tailored for game) |
| **CI integration** | Plug-and-play (templates provided) | Need to write custom (but simple) |
| **DB & reporting** | Built-in (SQLite) | Build or use JSON files |
| **LLM grading** | Native support (Claude API) | Optional, need custom integration |
| **Learning curve** | Steep (many concepts) | Shallow (just testing basics) |
| **Maintenance** | Follow upstream updates | Self-maintained |
| **Fit for CCN2** | Poor (agent-centric) | Excellent (game-specific) |

**Recommendation:** Use Approach A (custom lightweight). CCN2 Demo là game client, không phải AI agent. eval-harness là overkill và cần significant adaptation. Build simple system với:
- Jest cho unit tests
- Custom playthrough runner cho integration
- Simple JS/JSON cho storage
- GitHub Actions cho CI
- Swiss Cheese principles for monitoring

---

## 15. Quick Start Guide (If Using Approach A)

### Step 1: Initialize

```bash
cd D:/PROJECT/CCN2/DEMO
mkdir -p evals/{tasks/{unit,integration,ui,performance},reports,human-review/pending,test-harness}
```

Create `evals/config.yaml`:
```yaml
suite_name: "CCN2 Demo Evals"
default_k: 3
default_metric: pass-at-k
regression_threshold: 0.05
saturation_threshold: 0.80
ci:
  fail_threshold: 80
```

### Step 2: Write First Task

`evals/tasks/unit/board-generation-001.yaml`:
```yaml
task:
  id: "board-generation-001"
  type: unit
  description: "Board generates 40 tiles equally spaced on circle"
  module: "src/board.js"
  function: "buildPath"
  input:
    params: {}
  expected:
    tiles_count: 40
    radius: 245
  graders:
    - type: state_check
      check: "tiles.length === 40"
      weight: 1.0
```

### Step 3: Build Minimal Test Harness

`evals/test-harness/runner.js`:
```javascript
const { loadGameModule } = require('./loader');
const { evaluateGrader } = require('./graders');

async function runTask(task, k = 3) {
  const results = [];
  for (let i = 0; i < k; i++) {
    const game = await loadGameModule(task.module);
    const outcome = await game[task.function](task.input.params);
    const score = await evaluateGraders(outcome, task.graders);
    results.push({ passed: score >= 1.0, score, outcome });
  }
  return results;
}
```

### Step 4: Run & Validate

```bash
node evals/run.js task validate --all
node evals/run.js run --k 3
node evals/run.js report --format html
```

### Step 5: CI/CD

Add `.github/workflows/evals.yml` từ template, adjust commands.

---

## 16. Conclusion

**eval-harness skill** là một comprehensive framework cho AI agent evaluation, với many best practices từ Anthropic. Tuy nhiên, nó không directly applicable cho CCN2 Demo vì:

1. Designed cho AI agents (LLM + tools), không cho traditional game testing
2. Có nhiều complexity không cần thiết (agent harness, transcript format, model-based graders)
3. Thiếu templates và runner implementation (chỉ có spec)

**Recommended path:** Xây dựng custom lightweight eval system cho CCN2 Demo, dùng các nguyên tắc từ eval-harness:
- ✅ Đa layer (Swiss Cheese)
- ✅ Code-based graders (unit tests, state checks)
- ✅ Metrics: pass@k, regression, saturation
- ✅ CI/CD integration
- ✅ Human review queue
- ❌ Bỏ qua agent-specific features
- ❌ Bỏ qua hoặc tùy chọn LLM graders

**Effort estimate:**
- Phase 1 (infrastructure): 1 day
- Phase 2 (test harness): 2-3 days
- Phase 3 (graders): 1-2 days
- Phase 4 (runner/CLI): 2 days
- Phase 5 (CI/CD): 1 day
- Phase 6 (monitoring): 1-2 days

**Total:** ~2 tuần cho MVP eval system.

**Next steps:**
1. Discuss với anh: Approach A vs B
2. Nếu A: bắt đầu build custom harness ngay
3. Nếu B: investigate runner code, plan modifications

---

## Appendix: eval-harness YAML Schema

### Task Schema

```yaml
task:
  id: "unique-id"
  type: coding|conv|research|cu|sub-agent|unit|integration|ui
  description: "One sentence"
  input:
    prompt: "..."         # for AI agents
    module: "..."         # for code-based
    function: "..."
    params: {...}
    scenario: "...        # for integration tests
    actions: [...]
  expected:
    outcome: {...}
    output: "..."         # expected response
  graders:
    - type: unit_tests|state_check|dom_check|llm_rubric|human|...
      weight: 0.0-1.0
      # type-specific fields
```

### Config Schema

```yaml
suite_name: "Project Evals"
db_path: "evals/runs/eval.db"
default_model: "claude-sonnet-4-6"
grader_model: "claude-sonnet-4-6"
default_k: 3
default_metric: "pass-at-k"|"pass-pow-k"
default_timeout_seconds: 300
human_review_notify: true
ci:
  fail_threshold: 80
```

---

**End of Analysis**  
*Prepared by Kẹo Đào 🪄 on 2025-06-20*
