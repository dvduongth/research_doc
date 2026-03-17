# CCN2 Agent Team — Skill Mapping

> **Version**: 2.0 (updated 2026-03-17)
> **Changes from v1**: Removed non-existent skills, added 9 missing skills
> **Based on**: System skills inventory cross-checked against roadmap phases

---

## Tổng Quan

Bảng này map từng Phase trong Roadmap với Skills cụ thể cần dùng.
Mục tiêu: giảm ma sát khi implement, đảm bảo đúng tool cho đúng việc.

---

## Round 1 — Foundation (Tuần 1-2)

| Phase | Task | Skills |
|-------|------|--------|
| **Kickoff** | Thiết lập phương pháp làm việc | `using-superpowers`, `executing-plans` |
| **1.1 Workspace Setup** | Tạo folder structure, WORKSPACE.md | `writing-plans`, `speckit`, `doc-coauthoring` |
| **1.2 Config Setup** | Thêm 3 agents vào openclaw.config.yaml | `openclaw-deep-understanding`, `systematic-debugging` |
| **1.3 AGENTS.md** | Viết AGENTS.md + HEARTBEAT.md cho 3 agents | `writing-skills` |
| **1.4 Smoke Test** | Verify agents respond + heartbeat log | `verification-before-completion` |

**⚠️ Lưu ý Round 1:**
- `using-superpowers` PHẢI chạy đầu tiên để establish workflow framework
- `openclaw-deep-understanding` thay cho `update-config` (skill đó không tồn tại)
- `writing-skills` đảm bảo AGENTS.md đúng format trước khi deploy

---

## Round 2 — Specialization (Tuần 3-4)

| Phase | Task | Skills |
|-------|------|--------|
| **Pre-design** | Brainstorm workflow cho từng agent | `brainstorming` |
| **2.1 agent_gd** | GDD Workflow: concept → GDD-*.md | `doc-wave-analysis`, `speckit` |
| **2.2 agent_dev** | Code Workflow: GDD → code skeleton | `clientccn2-project-editor`, `test-driven-development` |
| **2.3 agent_qc** | Test Workflow: GDD → testcases → run | `test-driven-development`, `systematic-debugging` |
| **Model Selection** | Assign LLM model cho từng agent | `model-strategy` |

**⚠️ Lưu ý Round 2:**
- `brainstorming` là BẮT BUỘC trước bất kỳ creative work nào (per skill trigger)
- `webapp-testing` KHÔNG dùng — skill đó dành cho Playwright web UI, không phải Jest
- `model-strategy` gợi ý: Haiku cho heartbeat (cheap), Sonnet cho GDD/code, Opus cho complex tasks
- `test-driven-development` dùng cho cả agent_dev (viết code + test skeleton) và agent_qc

---

## Round 3 — Automation & Integration (Tuần 5-6)

| Phase | Task | Skills |
|-------|------|--------|
| **3.1 Cron Jobs** | Setup cron cho 3 agents (mỗi 15 phút) | `loop`, `tmux` |
| **3.2 Parallel Scan** | Agents scan workspace song song | `dispatching-parallel-agents` |
| **3.3 Cross-agent** | Coordination qua filesystem + notifications | `subagent-driven-development` |
| **3.4 E2E Test** | Integration test: concept → report pipeline | `verification-before-completion`, `eval-harness` |

**⚠️ Lưu ý Round 3:**
- `tmux` cần thiết để manage background processes khi agents chạy liên tục
- Pair `loop` + `tmux` + `subagent-driven-development` cho pipeline hoàn chỉnh
- `eval-harness` đánh giá chất lượng output của agent team (GDD quality, code quality, report accuracy)
- `dispatching-parallel-agents` khi agent_dev và agent_qc cùng xử lý GDD mới song song

---

## Round 4 — Polish & Production (Tuần 7-8)

| Phase | Task | Skills |
|-------|------|--------|
| **4.1 Error Handling** | Failure alerts, retry policy | `systematic-debugging`, `healthcheck` |
| **4.2 Monitoring** | Daily dashboard, weekly digest | `session-logs`, `web-data-analysis`, `model-usage` |
| **4.3 Docs & Skills** | Runbooks, README, reusable skills | `doc-coauthoring`, `theme-factory`, `skill-creator` |

**⚠️ Lưu ý Round 4:**
- `model-usage` track chi phí LLM per agent — critical để optimize cost khi chạy 3 agents liên tục
- `skill-creator` đóng gói các workflow đã validated thành OpenClaw skills tái sử dụng
- `theme-factory` đảm bảo runbooks + reports có consistent branding

---

## Quick Reference: Corrections từ v1

| v1 (Sai) | v2 (Đúng) | Lý Do |
|----------|----------|-------|
| `update-config` | `openclaw-deep-understanding` | Skill `update-config` không tồn tại trong hệ thống |
| `webapp-testing` | `test-driven-development` | `webapp-testing` dùng Playwright, không phải Jest |

## Skills Mới Thêm vào v2

| Skill | Round | Lý Do |
|-------|-------|-------|
| `using-superpowers` | R1 Kickoff | Methodology framework — bắt buộc per project constitution |
| `executing-plans` | R1 Kickoff | Cần khi bắt đầu thực thi từng phase có plan |
| `writing-skills` | R1.3 | Authoring AGENTS.md + HEARTBEAT.md chuẩn format |
| `brainstorming` | R2 Pre-design | Bắt buộc trước creative work (per skill trigger) |
| `model-strategy` | R2 | Chọn đúng LLM model cho từng agent role |
| `tmux` | R3.1 | Quản lý background processes cho agents chạy song song |
| `eval-harness` | R3.4, R4.2 | Đánh giá chất lượng output agent team |
| `model-usage` | R4.2 | Track LLM cost per agent |
| `skill-creator` | R4.3 | Package validated workflows thành reusable skills |

---

## Full Skills List by Role

### Agent_gd (Game Designer)
Primary: `doc-wave-analysis`, `speckit`
Support: `brainstorming`, `model-strategy`

### Agent_dev (Developer)
Primary: `clientccn2-project-editor`, `test-driven-development`
Support: `systematic-debugging`, `using-git-worktrees`

### Agent_qc (QA Engineer)
Primary: `test-driven-development`, `eval-harness`
Support: `systematic-debugging`, `session-logs`, `web-data-analysis`

### Human (Orchestrator)
Round setup: `using-superpowers`, `writing-plans`, `executing-plans`, `speckit`
Monitoring: `model-usage`, `session-logs`, `healthcheck`
Docs: `doc-coauthoring`, `theme-factory`, `skill-creator`

---

*Skill Mapping v2.0 — 2026-03-17*
*Next review: Sau Round 2 DoD (tuần 4)*
