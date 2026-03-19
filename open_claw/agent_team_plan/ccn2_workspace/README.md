# CCN2 Agent Team Workspace

> **Status**: Active — 6 agents running, pipeline HEALTHY
> **Last updated**: 2026-03-19

---

## Đây là gì?

Workspace cho đội AI agent tự động hóa vòng lặp phát triển game **Elemental Hunter** (sub-game trong CCN2 board game). 6 agents chạy theo cron job, phối hợp nhau từ khâu thiết kế game đến viết code đến test.

```
Human viết ý tưởng
        ↓
[Designia] Thiết kế GDD
        ↓
[Codera]   Phân tích + phân công
        ↓
[Pixel] [Forge] [Panel]   Implement code
        ↓
[Verita]   Review + test + bug detect
        ↓
Dashboard + Telegram alert
```

---

## 6 Agents

| Agent | Persona | Vai trò | Cron |
|-------|---------|---------|------|
| `agent_gd` | **Designia** | Game Designer: concept → GDD | 15 phút |
| `agent_dev` | **Codera** | Tech Lead: GDD → phân tích + dispatch + bug triage | 15 phút |
| `agent_qc` | **Verita** | QA: review + smoke test + bug verify | 15 phút |
| `agent_dev_client` | **Pixel** | Frontend: viết Vanilla JS → `playtest/client/src/` | 30 phút |
| `agent_dev_server` | **Forge** | Backend: viết Kotlin → `playtest/server/` | 30 phút |
| `agent_dev_admin` | **Panel** | Admin tool: viết Java+React → `src/admin/` | 30 phút |

Agent configs: `openclaw/agents/<agent_id>/` (SOUL.md, AGENTS.md, HEARTBEAT.md, USER.md)

---

## Cấu trúc thư mục

```
ccn2_workspace/
├── concepts/          ← [Anh viết vào đây] Feature ideas (*.md)
├── design/            ← [Designia output] GDD-FEATURE-*.md
├── analysis/          ← [Codera output] REQ-*.md, DESIGN-*.md
├── eval/              ← [Designia + Codera] Eval scores
├── bugs/              ← [Anh / Verita tạo] Bug reports BUG-*.md
├── src/
│   ├── admin/         ← [Panel output] Java + React staging
│   ├── tests/         ← [Verita output] Test files
│   ├── rules.js       ← CCN2 board game rules (Codera)
│   └── elemental-hunter.js ← CCN2 board game logic (Codera)
├── reports/           ← [Verita output] dashboard.html, quality reports
├── docs/              ← [Anh đọc] Hướng dẫn vận hành (RUNBOOK, HOWTO)
└── .state/            ← Agent state (JSON files, error.log — không edit thủ công)

playtest/              ← SINGLE SOURCE OF TRUTH (nằm ngoài ccn2_workspace)
├── server/            ← [Forge output] Kotlin/Ktor server, port 8181
│   └── src/main/kotlin/playtest/
├── client/            ← [Pixel output] Web client
│   ├── core/          ← Protected infrastructure (ws-client, board-renderer, game-ui)
│   └── src/           ← Feature modules do Pixel viết
└── scripts/           ← smoke-test.ps1, build.bat

openclaw/agents/       ← Agent identity + workflow files
```

---

## Nếu anh mới vào — đọc theo thứ tự này

### 1. Hiểu hệ thống (5 phút)
→ `docs/ARCHITECTURE.md`

### 2. Muốn thêm feature mới
→ `docs/HOWTO-create-concept.md`

### 3. Thấy giao diện/server bị lỗi khi chơi thử
→ `docs/RUNBOOK-bugs.md` — cách tạo bug report để agents tự fix

### 4. Dashboard + trạng thái pipeline
→ Mở `reports/dashboard.html` trong browser (tự refresh mỗi 15 phút)

### 5. Agent bị lỗi / pipeline stuck
→ `docs/RUNBOOK-agent-errors.md`
→ `docs/RUNBOOK-stuck-pipeline.md`
→ `docs/RUNBOOK-restart-agent.md`

### 6. Muốn thêm agent mới
→ `docs/HOWTO-add-agent.md`

---

## Quy trình thêm feature mới (tổng quan)

```
1. Tạo file:  concepts/<feature-name>.md
              (xem template: concepts/README.md)

2. Chờ ~15 phút → Designia tạo design/GDD-FEATURE-<name>.md
   Chờ ~30 phút → Codera phân tích + dispatch
   Chờ ~60 phút → Pixel + Forge + Panel implement

3. Kết quả:
   Client: playtest/client/src/<feature>.js
   Server: playtest/server/src/main/kotlin/playtest/<Feature>.kt
   Admin:  src/admin/<feature>/

4. Chờ thêm ~15 phút → Verita review → reports/code-review-<name>-*.md
```

---

## Quy trình report bug (tổng quan)

```
1. Anh thấy bug khi chơi thử playtest (localhost:8181)

2. Copy bugs/BUG-TEMPLATE.md → đặt tên:
   bugs/BUG-<domain>-<mô-tả>-<YYYY-MM-DD>.md

   domain: gd | client | server | admin | playtest-client | playtest-server

3. Điền: Domain, Severity, Steps to Reproduce, Expected, Actual

4. Chờ ~15 phút → Codera triage → agents tự fix → Verita verify → closed
```

Chi tiết: `docs/RUNBOOK-bugs.md`

---

## Playtest — Chạy thủ công

```powershell
# Build + run server
cd D:/PROJECT/CCN2/research_doc/open_claw/agent_team_plan/playtest/server
gradlew.bat run
# Server chạy tại http://localhost:8181
# (83% là bình thường — Gradle đang chờ server, nhấn Ctrl+C để stop)

# Mở client
# Trỏ browser tới: playtest/client/index.html
# (cần server đang chạy)

# Smoke test thủ công
powershell -ExecutionPolicy Bypass -File playtest/scripts/smoke-test.ps1 -Mode quick
```

---

## Pipeline Health

```
.state/pipeline-health.json — 7 checks:
  C1 concepts    C2 design     C3 gdd_header
  C4 src         C5 quality*   C6 state_json
  C7 playtest**

* C5 exempt (không BROKEN nếu fail)
** C7 SKIP nếu distribution chưa build (không ảnh hưởng verdict)

Verdicts: HEALTHY | DEGRADED | BROKEN
```

Xem dashboard: `reports/dashboard.html`

---

## Tài liệu đầy đủ

| File | Đọc khi nào |
|------|------------|
| `docs/ARCHITECTURE.md` | Muốn hiểu toàn bộ hệ thống |
| `docs/HOWTO-create-concept.md` | Thêm feature mới |
| `docs/HOWTO-add-agent.md` | Thêm agent mới |
| `docs/RUNBOOK-bugs.md` | Report + track bugs |
| `docs/RUNBOOK-playtest.md` | Vận hành playtest server |
| `docs/RUNBOOK-agent-errors.md` | Debug lỗi agent |
| `docs/RUNBOOK-restart-agent.md` | Reset / force reprocess |
| `docs/RUNBOOK-stuck-pipeline.md` | GDD stuck / bug stuck |
| `.state/SCHEMA.md` | Schema đầy đủ của state files |
