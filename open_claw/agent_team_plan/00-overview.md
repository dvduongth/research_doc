# CCN2 Agent Team — Executive Overview & Progress Tracker

> **Methodology**: Superpowers (brainstorming → writing-plans → executing-plans) × Speckit (constitution → specify → plan → tasks)
>
> **Output directory**: `D:\workspace\CCN2\research_doc\open_claw\agent_team_plan\`
>
> **Created**: 2026-03-17
> **Last updated**: 2026-03-18 (verified actual state — 1.1 ✅, 1.3 ✅, 1.2 ⚠️ generic, 1.4 ⬜)

---

## Vision

Xây dựng một **agent team tự động hóa** cho dự án CCN2 — một nhóm AI agent chuyên biệt chạy trên OpenClaw, cùng chia sẻ workspace `ccn2_workspace`, **tự động phát hiện thay đổi** và phối hợp theo pipeline: Concept → GDD → Code → Test → Quality Report.

```
┌─────────────────────────────────────────────────────────┐
│                    ccn2_workspace/                       │
│                                                         │
│  concepts/          design/           src/              │
│  ├─ gameplay.md     ├─ GDD.md         ├─ game.js        │
│  └─ feature.md      └─ rules.md       └─ tests/         │
└──────────────┬───────────┬────────────────┬─────────────┘
               │           │                │
          agent_gd    agent_dev         agent_qc
          (GD Design) (Developer)       (QA Tester)
```

---

## 3 Agents trong Team

| Agent | Vai trò | Trigger chính | Output |
|-------|---------|--------------|--------|
| **agent_gd** | Game Designer — viết GDD | File mới trong `concepts/` | `design/GDD-*.md` |
| **agent_dev** | Developer — triển khai code | File mới trong `design/` | Code trong `src/` |
| **agent_qc** | QA Engineer — test & báo cáo | File mới `design/` hoặc code change | Testcases + Quality report |

---

## Tài liệu trong Plan

| File | Nội dung |
|------|---------|
| `00-overview.md` | Tổng quan + progress tracker (file này) |
| `01-constitution.md` | Principles, governance, design decisions |
| `02-spec.md` | Feature specification (Speckit style) |
| `03-roadmap.md` | Roadmap: 4 Rounds × Phases × Tasks |
| `04-openclaw-config.md` | Config YAML, AGENTS.md, cron templates |
| `05-agent-profiles.md` | Profile chi tiết từng agent |

---

## Progress Tracker

### Round 1 — Foundation (Tuần 1–2)
**Goal**: Tạo workspace, cấu hình 3 agents, heartbeat cơ bản chạy được

| Phase | Task | Status |
|-------|------|--------|
| 1.1 Workspace Setup | Tạo cấu trúc `ccn2_workspace/` | ✅ DONE |
| 1.1 Workspace Setup | Tạo file `WORKSPACE.md` index | ✅ DONE |
| 1.1 Workspace Setup | Tạo `concepts/`, `design/`, `src/`, `reports/`, `.state/` | ✅ DONE |
| 1.1 Workspace Setup | Tạo README.md cho từng folder + GDD-TEMPLATE.md | ✅ DONE |
| 1.1 Workspace Setup | Khởi tạo `.state/*.json` = `{}` | ✅ DONE |
| 1.1 Workspace Setup | Tạo `concepts/ladder-mechanic.md` (sample) | ✅ DONE |
| 1.2 Agent Config | Ghi đè AGENTS.md CCN2-specific cho agent_gd | ⚠️ GENERIC (cần ghi đè) |
| 1.2 Agent Config | Ghi đè AGENTS.md CCN2-specific cho agent_dev | ⚠️ GENERIC (cần ghi đè) |
| 1.2 Agent Config | Ghi đè AGENTS.md CCN2-specific cho agent_qc | ⚠️ GENERIC (cần ghi đè) |
| 1.2 Agent Config | Ghi đè HEARTBEAT.md workspace scan cho 3 agents | ❌ EMPTY (cần điền) |
| 1.2 Agent Config | Tạo `OPENCLAW_CONFIG_SNIPPET.json` | ✅ DONE |
| 1.3 OpenClaw Config | Thêm agent_gd vào openclaw.json | ✅ DONE (manual step by anh) |
| 1.3 OpenClaw Config | Thêm agent_dev vào openclaw.json | ✅ DONE (manual step by anh) |
| 1.3 OpenClaw Config | Thêm agent_qc vào openclaw.json | ✅ DONE (manual step by anh) |
| 1.3 OpenClaw Config | Fix workspace path → trỏ đúng vào ccn2_workspace | ⬜ TODO (path hiện sai) |
| 1.3 OpenClaw Config | Setup 3 cron jobs workspace scan | ⬜ TODO |
| 1.4 Heartbeat Test | Test agent_gd responds to message | ⬜ TODO |
| 1.4 Heartbeat Test | Test agent_dev responds to message | ⬜ TODO |
| 1.4 Heartbeat Test | Test agent_qc responds to message | ⬜ TODO |
| 1.4 Heartbeat Test | Verify heartbeat log sau 30 phút | ⬜ TODO |

### Round 2 — Agent Specialization (Tuần 3–4)
**Goal**: Mỗi agent có skill và workflow riêng, xử lý được use case cơ bản

| Phase | Task | Status |
|-------|------|--------|
| 2.1 agent_gd | Skill: đọc gameplay concept → tạo GDD template | ⬜ TODO |
| 2.1 agent_gd | Skill: expand GDD từ rules brief | ⬜ TODO |
| 2.1 agent_gd | Viết HEARTBEAT.md cho agent_gd | ⬜ TODO |
| 2.2 agent_dev | Skill: đọc GDD → generate code skeleton | ⬜ TODO |
| 2.2 agent_dev | Skill: implement feature từ spec | ⬜ TODO |
| 2.2 agent_dev | Viết HEARTBEAT.md cho agent_dev | ⬜ TODO |
| 2.3 agent_qc | Skill: đọc GDD → viết unit test cases | ⬜ TODO |
| 2.3 agent_qc | Skill: chạy tests → generate quality report | ⬜ TODO |
| 2.3 agent_qc | Viết HEARTBEAT.md cho agent_qc | ⬜ TODO |

### Round 3 — Automation & Integration (Tuần 5–6)
**Goal**: File change detection tự động, agents phối hợp không cần trigger thủ công

| Phase | Task | Status |
|-------|------|--------|
| 3.1 Cron Jobs | agent_gd: cron mỗi 30m check `concepts/` mới | ⬜ TODO |
| 3.1 Cron Jobs | agent_dev: cron mỗi 30m check `design/` mới | ⬜ TODO |
| 3.1 Cron Jobs | agent_qc: cron mỗi 30m check changes (design + src) | ⬜ TODO |
| 3.2 State Tracking | Tạo `WORKSPACE_STATE.json` lưu file hashes | ⬜ TODO |
| 3.2 State Tracking | Mỗi agent đọc state để detect changes | ⬜ TODO |
| 3.3 Cross-agent Comm | agent_gd announce khi GDD done → trigger dev+qc | ⬜ TODO |
| 3.3 Cross-agent Comm | agent_qc post quality report → Telegram channel | ⬜ TODO |
| 3.4 Integration Test | Test end-to-end: concept → GDD → code → test | ⬜ TODO |

### Round 4 — Polish & Production (Tuần 7–8)
**Goal**: Error handling, monitoring, documentation đầy đủ

| Phase | Task | Status |
|-------|------|--------|
| 4.1 Error Handling | Failure alert khi agent crash | ⬜ TODO |
| 4.1 Error Handling | Retry policy cho cron jobs | ⬜ TODO |
| 4.2 Monitoring | Dashboard summary daily | ⬜ TODO |
| 4.2 Monitoring | Weekly digest report | ⬜ TODO |
| 4.3 Docs | README.md cho ccn2_workspace | ⬜ TODO |
| 4.3 Docs | Runbook: add new agent vào team | ⬜ TODO |

---

## Quick Status Legend

| Symbol | Ý nghĩa |
|--------|---------|
| ⬜ TODO | Chưa bắt đầu |
| 🔄 IN PROGRESS | Đang làm |
| ✅ DONE | Hoàn thành |
| ❌ BLOCKED | Bị block, cần giải quyết |
| ⏭️ SKIP | Bỏ qua (lý do ghi rõ) |

---

*Last updated: 2026-03-17*
