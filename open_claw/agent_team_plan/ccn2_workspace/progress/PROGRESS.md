# CCN2 Agent Team — Progress Tracker

> File này được cập nhật sau mỗi task hoàn thành.
> Last updated: 2026-03-18 (Phase 1.1 ✅, 1.2 ✅, 1.3 partial, 1.4 ⬜ smoke test pending)

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
| Test agent_gd responds to message | ⬜ TODO | — | Gửi Telegram message bất kỳ → verify response + IDENTITY.md setup |
| Test agent_dev responds to message | ⬜ TODO | — | Tương tự |
| Test agent_qc responds to message | ⬜ TODO | — | Tương tự |
| Verify heartbeat + cron chạy | ⬜ TODO | — | Sau khi add cron jobs, chờ 15 phút đầu tiên |

---

## Round 2 — Specialization
| Phase | Status |
|-------|--------|
| agent_gd GDD Workflow | ⬜ TODO |
| agent_dev Code Workflow | ⬜ TODO |
| agent_qc Test Workflow | ⬜ TODO |

## Round 3 — Automation
| Phase | Status |
|-------|--------|
| Cron Jobs & State Tracking | ⬜ TODO |
| File Change Detection | ⬜ TODO |
| Cross-agent Coordination | ⬜ TODO |
| E2E Integration Test | ⬜ TODO |

## Round 4 — Production
| Phase | Status |
|-------|--------|
| Error Handling | ⬜ TODO |
| Monitoring | ⬜ TODO |
| Documentation & Runbooks | ⬜ TODO |

---

## ✅ Đã Hoàn Thành Round 1 (trừ manual steps)

Phase 1.1 ✅ — Workspace structure
Phase 1.2 ✅ — Agent files: SOUL, AGENTS, HEARTBEAT, USER — CCN2-specific, correct paths
Phase 1.3 ✅ — 3 agents added to OpenClaw; CRON_SETUP.md ready

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
