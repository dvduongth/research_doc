# CCN2 Agent Team Workspace

> **Status**: Round 1 Phase 1.1–1.3 complete — awaiting `openclaw agents add` to activate agents
> **Last updated**: 2026-03-17

---

## Mục đích

Workspace chia sẻ cho 3 AI agents tự động hóa vòng lặp phát triển game CCN2:

```
Human writes concept → agent_gd designs GDD → agent_dev implements code → agent_qc tests & reports
```

## Cấu trúc thư mục

```
ccn2_workspace/
├── concepts/          ← Human writes feature ideas here
├── design/            ← agent_gd outputs GDD-*.md files here
├── src/               ← agent_dev outputs code here
│   └── tests/         ← agent_qc writes Jest tests here
├── reports/           ← agent_qc outputs quality reports here
├── .state/            ← Agent state tracking (hash maps, do not edit)
└── progress/          ← Human-readable progress logs
```

## 3 Agents

| Agent | Persona | Role | Model |
|-------|---------|------|-------|
| **agent_gd** | Designia | Game Designer: concept → GDD | hunter-alpha |
| **agent_dev** | Codera | Developer: GDD → code | hunter-alpha |
| **agent_qc** | Verita | QA: GDD+code → tests+reports | hunter-alpha |

Agent workspaces: `D:/workspace/CCN2/openclaw/agents/<agent_id>/`

## Cách dùng

### Thêm feature mới
1. Tạo `concepts/<feature>.md` theo template trong `concepts/README.md`
2. Chờ 15–30 phút → `design/GDD-<feature>.md` được tạo tự động
3. Review GDD — sửa concept nếu cần (trigger re-generate)
4. Chờ thêm 15–30 phút → `src/<feature>.js` + test skeleton
5. Xem kết quả tại `reports/quality-*.md`

### Check trạng thái
- Quality mới nhất: xem file mới nhất trong `reports/quality-*.md`
- Test coverage: xem `reports/testcases-<feature>.md`
- Agent failures: agent_qc gửi Telegram alert tự động

## Cron Schedule (weekdays 8h–22h, Asia/Ho_Chi_Minh)

| Agent | Runs at (mỗi 15 phút) | Offset |
|-------|----------------------|--------|
| agent_gd | :00, :15, :30, :45 | Đầu tiên |
| agent_dev | :07, :22, :37, :52 | +7 phút |
| agent_qc | :12, :27, :42, :57 | +12 phút |

## Setup (một lần)

Để kích hoạt 3 agents trong OpenClaw:

```bash
openclaw agents add agent_gd
# workspace → D:/workspace/CCN2/ccn2_workspace
# agentDir  → D:/workspace/CCN2/openclaw/agents/agent_gd

openclaw agents add agent_dev
openclaw agents add agent_qc

openclaw gateway restart
openclaw agents list
```

Config snippet đầy đủ: `D:/workspace/CCN2/openclaw/agents/OPENCLAW_CONFIG_SNIPPET.json`

## Tài liệu

| File | Nội dung |
|------|---------|
| `WORKSPACE.md` | File ownership, chi tiết cron schedule |
| `design/GDD-TEMPLATE.md` | 8-section GDD template |
| `progress/PROGRESS.md` | Live progress tracker Round 1–4 |
| `progress/session-*.md` | Session logs |
| `agent_team_plan/` | Toàn bộ plan documents (constitution, roadmap, profiles) |
