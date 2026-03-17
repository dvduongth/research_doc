# CCN2 Agent Team — Progress Tracker

> File này được cập nhật sau mỗi task hoàn thành.
> Last updated: 2026-03-17 22:xx (Round 1 Phase 1.1–1.3 complete)

---

## Round 1 — Foundation (Tuần 1-2)

### Phase 1.1: Workspace Structure
| Task | Status | Date | Notes |
|------|--------|------|-------|
| Tạo folder structure (concepts, design, src, reports, .state) | ✅ DONE | 2026-03-17 | Đã tồn tại từ trước |
| Tạo src/tests/ subfolder | ✅ DONE | 2026-03-17 | |
| Tạo WORKSPACE.md | ✅ DONE | 2026-03-17 | Có cron schedule, file ownership |
| Tạo concepts/README.md | ✅ DONE | 2026-03-17 | Template concept file |
| Tạo design/README.md | ✅ DONE | 2026-03-17 | GDD format rules |
| Tạo design/GDD-TEMPLATE.md | ✅ DONE | 2026-03-17 | 8-section template |
| Tạo src/README.md | ✅ DONE | 2026-03-17 | CCN2 architecture rules |
| Tạo reports/README.md | ✅ DONE | 2026-03-17 | Quality thresholds |
| Tạo .state/README.md | ✅ DONE | 2026-03-17 | State file format |
| Khởi tạo .state/*.json | ✅ DONE | 2026-03-17 | 3 files = `{}` |
| Tạo sample concept: ladder-mechanic.md | ✅ DONE | 2026-03-17 | Sẵn sàng cho smoke test |

### Phase 1.2: Agent Workspace Files
| Task | Status | Date | Notes |
|------|--------|------|-------|
| Tạo agents/agent_gd/SOUL.md | ✅ DONE | 2026-03-17 | Persona: Designia |
| Tạo agents/agent_gd/AGENTS.md | ✅ DONE | 2026-03-17 | Full workflow + constraints |
| Tạo agents/agent_gd/HEARTBEAT.md | ✅ DONE | 2026-03-17 | Heartbeat instructions |
| Tạo agents/agent_dev/SOUL.md | ✅ DONE | 2026-03-17 | Persona: Codera |
| Tạo agents/agent_dev/AGENTS.md | ✅ DONE | 2026-03-17 | Full workflow + code template |
| Tạo agents/agent_dev/HEARTBEAT.md | ✅ DONE | 2026-03-17 | Heartbeat instructions |
| Tạo agents/agent_qc/SOUL.md | ✅ DONE | 2026-03-17 | Persona: Verita |
| Tạo agents/agent_qc/AGENTS.md | ✅ DONE | 2026-03-17 | Full workflow + report template |
| Tạo agents/agent_qc/HEARTBEAT.md | ✅ DONE | 2026-03-17 | Heartbeat instructions |

### Phase 1.3: OpenClaw Config
| Task | Status | Date | Notes |
|------|--------|------|-------|
| Tạo config snippet JSON | ✅ DONE | 2026-03-17 | `agents/OPENCLAW_CONFIG_SNIPPET.json` |
| Thêm agents vào openclaw.json | ⬜ TODO | — | **Manual step** — xem instructions bên dưới |
| Verify: `openclaw agents list` thấy 3 agents | ⬜ TODO | — | Sau khi add config |

### Phase 1.4: Smoke Test
| Task | Status | Date | Notes |
|------|--------|------|-------|
| Test agent_gd responds to message | ⬜ TODO | — | Phải add config trước |
| Test agent_dev responds to message | ⬜ TODO | — | |
| Test agent_qc responds to message | ⬜ TODO | — | |
| Verify heartbeat log sau 30 phút | ⬜ TODO | — | |

---

## Round 2 — Specialization (Tuần 3-4)
| Phase | Status |
|-------|--------|
| agent_gd GDD Workflow | ⬜ TODO |
| agent_dev Code Workflow | ⬜ TODO |
| agent_qc Test Workflow | ⬜ TODO |

## Round 3 — Automation (Tuần 5-6)
| Phase | Status |
|-------|--------|
| Cron Jobs & State Tracking | ⬜ TODO |
| File Change Detection | ⬜ TODO |
| Cross-agent Coordination | ⬜ TODO |
| E2E Integration Test | ⬜ TODO |

## Round 4 — Production (Tuần 7-8)
| Phase | Status |
|-------|--------|
| Error Handling | ⬜ TODO |
| Monitoring | ⬜ TODO |
| Documentation & Runbooks | ⬜ TODO |

---

## ⚠️ Manual Steps Required (Phase 1.3)

Để thêm 3 agents vào OpenClaw, anh cần thực hiện **một trong hai cách** sau:

### Cách 1: Dùng CLI (recommended)
```bash
openclaw agents add agent_gd
# Wizard sẽ hỏi workspace path → nhập: D:/workspace/CCN2/ccn2_workspace
# Agent dir → nhập: D:/workspace/CCN2/openclaw/agents/agent_gd

openclaw agents add agent_dev
openclaw agents add agent_qc

openclaw gateway restart
openclaw agents list
```

### Cách 2: Edit openclaw.json trực tiếp
1. Backup: `cp C:/Users/admin/.openclaw/openclaw.json C:/Users/admin/.openclaw/openclaw.json.bak`
2. Mở `C:/Users/admin/.openclaw/openclaw.json`
3. Thêm 3 entries từ `D:/workspace/CCN2/openclaw/agents/OPENCLAW_CONFIG_SNIPPET.json` vào `agents.list`
4. Restart: `openclaw gateway restart`

---

## Quick Status Legend
| Symbol | Ý nghĩa |
|--------|---------|
| ✅ DONE | Hoàn thành |
| 🔄 IN PROGRESS | Đang làm |
| ⬜ TODO | Chưa bắt đầu |
| ❌ BLOCKED | Bị block |
| ⏭️ SKIP | Bỏ qua |
