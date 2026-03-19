# CCN2 Agent Team — Progress Tracker

> File này được cập nhật sau mỗi task hoàn thành.
> Last updated: 2026-03-18 (Round 1 ✅; Round 2 ✅ HOÀN THÀNH — Phase 2.1 GDD ✅ + Phase 2.2 Code ✅ + Phase 2.3 Test ✅)

---

## Round 1 — Foundation

### Phase 1.1: Workspace Structure
| Task | Status | Date | Notes |
|------|--------|------|-------|
| Tạo folder structure (concepts, design, src, reports, .state) | ✅ DONE | 2026-03-17 | Verified: all dirs exist |
| Tạo src/tests/ subfolder | ✅ DONE | 2026-03-17 | Verified: exists |
| Tạo WORKSPACE.md | ✅ DONE | 2026-03-17 | Có cron schedule, file ownership |
| Tạo concepts/README.md | ✅ DONE | 2026-03-17 | Template hướng dẫn viết concept |
| Tạo design/README.md | ✅ DONE | 2026-03-17 | GDD format rules |
| Tạo design/GDD-TEMPLATE.md | ✅ DONE | 2026-03-17 | 8-section template |
| Tạo src/README.md | ✅ DONE | 2026-03-17 | CCN2 architecture rules |
| Tạo reports/README.md | ✅ DONE | 2026-03-17 | Quality thresholds |
| Tạo .state/README.md | ✅ DONE | 2026-03-17 | State file format |
| Khởi tạo .state/*.json | ✅ DONE | 2026-03-17 | 3 files = `{}` |
| Tạo sample concept: ladder-mechanic.md | ✅ DONE | 2026-03-17 | Sẵn sàng cho smoke test |

### Phase 1.2: Agent Workspace Files
> ⚠️ **Tình trạng thực tế**: Các file agent đã được tạo bởi `openclaw agents add` wizard nhưng là **generic OpenClaw templates**, KHÔNG phải CCN2-specific content từ `04-openclaw-config.md`. Cần ghi đè bằng nội dung CCN2 cụ thể.

| Task | Status | Date | Notes |
|------|--------|------|-------|
| Ghi đè agent_gd/SOUL.md (Designia persona) | ✅ DONE | 2026-03-18 | CCN2 game designer persona |
| Ghi đè agent_gd/AGENTS.md (CCN2 workflow) | ✅ DONE | 2026-03-18 | Full workflow, hash detection, GDD template, correct paths |
| Ghi đè agent_gd/HEARTBEAT.md (workspace scan) | ✅ DONE | 2026-03-18 | CCN2 scan instructions |
| Fill agent_gd/USER.md | ✅ DONE | 2026-03-18 | Daniel's info filled |
| agent_gd/IDENTITY.md | ❌ BLANK | — | Điền khi first conversation xảy ra |
| Ghi đè agent_dev/SOUL.md (Codera persona) | ✅ DONE | 2026-03-18 | CCN2 developer persona |
| Ghi đè agent_dev/AGENTS.md (CCN2 workflow) | ✅ DONE | 2026-03-18 | Full workflow, CCN2 arch rules, code template |
| Ghi đè agent_dev/HEARTBEAT.md (workspace scan) | ✅ DONE | 2026-03-18 | GDD scan instructions |
| Fill agent_dev/USER.md | ✅ DONE | 2026-03-18 | Daniel's info filled |
| agent_dev/IDENTITY.md | ❌ BLANK | — | Điền khi first conversation xảy ra |
| Ghi đè agent_qc/SOUL.md (Verita persona) | ✅ DONE | 2026-03-18 | CCN2 QA persona |
| Ghi đè agent_qc/AGENTS.md (CCN2 workflow) | ✅ DONE | 2026-03-18 | Part A + Part B workflow, test templates |
| Ghi đè agent_qc/HEARTBEAT.md (workspace scan) | ✅ DONE | 2026-03-18 | QC scan instructions |
| Fill agent_qc/USER.md | ✅ DONE | 2026-03-18 | Daniel's info filled |
| agent_qc/IDENTITY.md | ❌ BLANK | — | Điền khi first conversation xảy ra |

### Phase 1.3: OpenClaw Config
| Task | Status | Date | Notes |
|------|--------|------|-------|
| Tạo config snippet JSON | ✅ DONE | 2026-03-17 | `agents/OPENCLAW_CONFIG_SNIPPET.json` |
| Thêm 3 agents vào openclaw.json | ✅ DONE | 2026-03-18 | Manual step hoàn thành — verified trong `~/.openclaw/openclaw.json` |
| Verify: `openclaw agents list` thấy 3 agents | ✅ DONE | 2026-03-18 | agent_gd, agent_dev, agent_qc hiện diện |
| Tạo CRON_SETUP.md với 4 cron jobs | ✅ DONE | 2026-03-18 | JSON sẵn sàng, manual step còn lại |
| Add 4 cron jobs vào OpenClaw | ⬜ TODO | — | **Manual step** — xem `CRON_SETUP.md` |

**Config notes:**
- `workspace` path trong openclaw.json trỏ vào `openclaw/agents/<id>` — đây là nơi AGENTS.md/SOUL.md sống, đúng với thiết kế OpenClaw
- AGENTS.md đã có full paths đến `ccn2_workspace` cho tất cả read/write operations
- Models: đang dùng free OpenRouter — acceptable cho prototype, upgrade later nếu cần
- Telegram: bot token configured, allowFrom: [526521221]

### Phase 1.4: Smoke Test
| Task | Status | Date | Notes |
|------|--------|------|-------|
| Test agent_gd responds to message | ✅ DONE | 2026-03-18 | Manual — anh xác nhận hoàn thành |
| Test agent_dev responds to message | ✅ DONE | 2026-03-18 | Manual — anh xác nhận hoàn thành |
| Test agent_qc responds to message | ✅ DONE | 2026-03-18 | Manual — anh xác nhận hoàn thành |
| Verify heartbeat + cron chạy | ✅ DONE | 2026-03-18 | Manual — anh xác nhận hoàn thành |

---

## Round 2 — Specialization

| Phase | Status | Ngày | Ghi chú |
|-------|--------|------|---------|
| Phase 2.1 — agent_gd GDD Workflow | ✅ DONE | 2026-03-18 | Templates (10-section Feature + Game), GDD-EVAL-RUBRIC, AGENTS.md v2, sample GDD, agent_qc Part C |
| Phase 2.2 — agent_dev Code Workflow | ✅ DONE | 2026-03-18 | 4-phase pipeline, 3 sub-agents (Pixel/Forge/Panel), CODE-EVAL-RUBRIC, staging area, openclaw.json updated |
| Phase 2.3 — agent_qc Test Workflow | ✅ DONE | 2026-03-18 | Part D (Code Review) + Part E (Test Generation), 6 deliverables |

### Phase 2.2 — agent_dev Code Workflow: Deliverables

| # | File | Status | Ghi chú |
|---|------|--------|---------|
| 1 | `ccn2_workspace/analysis/` folder | ✅ DONE | Tạo với .gitkeep |
| 2 | `ccn2_workspace/eval/CODE-EVAL-RUBRIC.md` | ✅ DONE | 3 modes: Client/Server/Admin, pass ≥80 |
| 3 | `ccn2_workspace/.state/agent_dev_processed.json` | ✅ DONE | Schema: gdd_hash, req_score, design_score, combined_score |
| 4 | `ccn2_workspace/.state/agent_dev_dispatched.json` | ✅ DONE | Schema: per feature per agent status tracking |
| 5 | `openclaw/agents/agent_dev/AGENTS.md` upgraded | ✅ DONE | Full overwrite — Round 1 giữ nguyên + Round 2 Phase 1-4 |
| 6 | `openclaw/agents/agent_dev_client/AGENTS.md` + `SOUL.md` | ✅ DONE | agent Pixel — TypeScript/Vite/Cocos2d, 7-step workflow |
| 7 | `openclaw/agents/agent_dev_server/AGENTS.md` + `SOUL.md` | ✅ DONE | agent Forge — Kotlin/Ktor/Actor, 7-step workflow |
| 8 | `openclaw/agents/agent_dev_admin/AGENTS.md` + `SOUL.md` | ✅ DONE | agent Panel — Java+React/REST, 7-step workflow |
| 9 | `~/.openclaw/openclaw.json` — 6 agents tổng | ✅ DONE | agent_gd, agent_dev, agent_qc, agent_dev_client, agent_dev_server, agent_dev_admin |
| 10 | `ccn2_workspace/progress/PROGRESS.md` updated | ✅ DONE | File này |

## Round 3 — Automation
| Phase | Status | Ghi chú |
|-------|--------|---------|
| Cron Jobs (6 agents) | 🔄 IN PROGRESS | Jobs 1-3 ✅ active; Jobs 5-7 ⬜ cần add vào OpenClaw (CRON_SETUP.md Job 5,6,7) |
| File Change Detection (Spec 3.1) | ✅ DONE | SCHEMA.md + 6 HEARTBEAT.md + agent_qc_meta.json + migrate state ×2 |
| Cross-agent Coordination (Spec 3.2) | ⬜ TODO | |
| E2E Integration Test (Spec 3.3) | ⬜ TODO | |

## Round 4 — Production
| Phase | Status |
|-------|--------|
| Error Handling | ⬜ TODO |
| Monitoring | ⬜ TODO |
| Documentation & Runbooks | ⬜ TODO |

---

## ✅ Đã Hoàn Thành Round 1

Phase 1.1 ✅ — Workspace structure
Phase 1.2 ✅ — Agent files: SOUL, AGENTS, HEARTBEAT, USER — CCN2-specific, correct paths
Phase 1.3 ✅ — 3 agents added to OpenClaw; CRON_SETUP.md ready
Phase 1.4 ✅ — Smoke test hoàn thành (manual)

## 🔧 Còn Lại (Manual Steps)

### Bước 1 — Add Cron Jobs (OpenClaw UI)
Mở OpenClaw → Cron → Add Job, paste 4 JSON từ `agent_team_plan/CRON_SETUP.md`

### Bước 2 — Smoke Test (Telegram)
Gửi message đến @agent_gd, @agent_dev, @agent_qc:
```
"Hello! Xác nhận bạn đang active. Đọc SOUL.md và giới thiệu bản thân."
```
Verify:
- Agent reply (có persona Designia / Codera / Verita)
- BOOTSTRAP.md được delete sau first conversation
- IDENTITY.md được điền

---

## Quick Status Legend
| Symbol | Ý nghĩa |
|--------|---------|
| ✅ DONE | Hoàn thành, verified |
| ⚠️ GENERIC | Tồn tại nhưng nội dung chưa đúng |
| ❌ EMPTY/BLANK | Cần điền / ghi đè |
| 🔄 IN PROGRESS | Đang làm |
| ⬜ TODO | Chưa bắt đầu |
| ❌ BLOCKED | Bị block |
