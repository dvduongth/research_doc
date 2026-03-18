# CCN2 Agent Team — Progress Tracker

> File này được cập nhật sau mỗi task hoàn thành.
> Last updated: 2026-03-18 (verified actual state — Round 1 Phase 1.1 + 1.3 done, 1.2 partial, 1.4 pending)

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
| Tạo agents/agent_gd/SOUL.md | ⚠️ GENERIC | 2026-03-18 | File tồn tại nhưng là OpenClaw default, chưa có CCN2 persona "Designia" |
| Tạo agents/agent_gd/AGENTS.md | ⚠️ GENERIC | 2026-03-18 | Generic AGENTS.md — CHƯA có CCN2 workflow, hash detection, GDD template |
| Tạo agents/agent_gd/HEARTBEAT.md | ❌ EMPTY | 2026-03-18 | File trống — agents sẽ không scan workspace |
| Tạo agents/agent_gd/IDENTITY.md | ❌ BLANK | 2026-03-18 | Template chưa điền — first conversation chưa xảy ra |
| Tạo agents/agent_dev/SOUL.md | ⚠️ GENERIC | 2026-03-18 | Generic, chưa có CCN2 developer persona |
| Tạo agents/agent_dev/AGENTS.md | ⚠️ GENERIC | 2026-03-18 | Generic — CHƯA có CCN2 code workflow, architecture rules |
| Tạo agents/agent_dev/HEARTBEAT.md | ❌ EMPTY | 2026-03-18 | File trống |
| Tạo agents/agent_qc/SOUL.md | ⚠️ GENERIC | 2026-03-18 | Generic, chưa có "Verita" persona |
| Tạo agents/agent_qc/AGENTS.md | ⚠️ GENERIC | 2026-03-18 | Generic — CHƯA có Part A/B QC workflow |
| Tạo agents/agent_qc/HEARTBEAT.md | ❌ EMPTY | 2026-03-18 | File trống |

**⚠️ TODO còn lại cho Phase 1.2:**
- [ ] Ghi đè `agent_gd/AGENTS.md` với CCN2-specific workflow (từ `04-openclaw-config.md` section 4.1)
- [ ] Ghi đè `agent_dev/AGENTS.md` với CCN2 workflow (section 4.2)
- [ ] Ghi đè `agent_qc/AGENTS.md` với CCN2 workflow (section 4.3)
- [ ] Ghi đè 3 `HEARTBEAT.md` với CCN2 workspace scan instructions (section 5)
- [ ] Điền IDENTITY.md cho từng agent (thông qua first conversation)

### Phase 1.3: OpenClaw Config
| Task | Status | Date | Notes |
|------|--------|------|-------|
| Tạo config snippet JSON | ✅ DONE | 2026-03-17 | `agents/OPENCLAW_CONFIG_SNIPPET.json` |
| Thêm 3 agents vào openclaw.json | ✅ DONE | 2026-03-18 | Manual step hoàn thành — verified trong `~/.openclaw/openclaw.json` |
| Verify: `openclaw agents list` thấy 3 agents | ✅ DONE | 2026-03-18 | agent_gd, agent_dev, agent_qc hiện diện |

**⚠️ Config issues cần fix:**

| Issue | Severity | Chi tiết |
|-------|---------|---------|
| **Workspace path sai** | 🔴 HIGH | `workspace` của từng agent trỏ tới `openclaw/agents/<id>` — CẦN trỏ tới `ccn2_workspace` |
| **Models không đúng** | 🟡 MEDIUM | Đang dùng free OpenRouter models (trinity-mini, step-3.5-flash, nemotron) — plan dùng claude-opus-4-6 / claude-sonnet-4-6 |
| **Cron jobs chưa setup** | 🔴 HIGH | Không có cron job nào cho workspace scan |
| **Telegram channel ID** | ✅ OK | Bot token configured, allowFrom: [526521221] |

**Workspace path thực tế trong openclaw.json:**
```
agent_gd  workspace: D:\PROJECT\CCN2\research_doc\open_claw\agent_team_plan\openclaw\agents\agent_gd  ← SAI
agent_dev workspace: D:\PROJECT\CCN2\research_doc\open_claw\agent_team_plan\openclaw\agents\agent_dev ← SAI
agent_qc  workspace: D:\PROJECT\CCN2\research_doc\open_claw\agent_team_plan\openclaw\agents\agent_qc  ← SAI
```
**Đúng phải là:** `D:\PROJECT\CCN2\research_doc\open_claw\agent_team_plan\ccn2_workspace`

### Phase 1.4: Smoke Test
| Task | Status | Date | Notes |
|------|--------|------|-------|
| Test agent_gd responds to message | ⬜ TODO | — | BOOTSTRAP.md còn tồn tại → first conversation chưa xảy ra |
| Test agent_dev responds to message | ⬜ TODO | — | Tương tự |
| Test agent_qc responds to message | ⬜ TODO | — | Tương tự |
| Verify heartbeat log sau 30 phút | ⬜ TODO | — | Phải fix HEARTBEAT.md trước |

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

## 🔧 Việc Cần Làm Ngay (để hoàn thành Round 1)

### Bước 1 — Fix workspace path (openclaw.json)
Sửa `workspace` của 3 agents từ agent config dir → ccn2_workspace:
```json
{
  "id": "agent_gd",
  "workspace": "D:\\PROJECT\\CCN2\\research_doc\\open_claw\\agent_team_plan\\ccn2_workspace",
  "agentDir": "D:\\PROJECT\\CCN2\\research_doc\\open_claw\\agent_team_plan\\openclaw\\agents\\agent_gd"
}
```

### Bước 2 — Ghi đè AGENTS.md và HEARTBEAT.md
Copy CCN2-specific content từ `04-openclaw-config.md` vào từng agent workspace:
- `openclaw/agents/agent_gd/AGENTS.md` ← section 4.1
- `openclaw/agents/agent_dev/AGENTS.md` ← section 4.2
- `openclaw/agents/agent_qc/AGENTS.md` ← section 4.3
- `openclaw/agents/agent_gd/HEARTBEAT.md` ← section 5.1
- `openclaw/agents/agent_dev/HEARTBEAT.md` ← section 5.2
- `openclaw/agents/agent_qc/HEARTBEAT.md` ← section 5.3

### Bước 3 — Setup Cron Jobs
Tạo 3 cron jobs qua OpenClaw UI/API (JSON templates trong `04-openclaw-config.md` section 2).

### Bước 4 — Smoke Test
Gửi message đến từng agent qua Telegram → verify response.

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
