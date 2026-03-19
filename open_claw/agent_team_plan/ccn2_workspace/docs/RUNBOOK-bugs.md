# Runbook — Bug Reporting & Tracking

**Maintained by**: agent_dev (Codera), agent_qc (Verita)
**Last updated**: 2026-03-19

---

## Overview

Hệ thống bug tracking nhẹ cho CCN2 agent team. Human phát hiện bug → tạo file → agents tự động pick up, fix, verify, và close trong các WORKSPACE_SCAN tiếp theo.

| Item | Value |
|------|-------|
| Bug reports | `ccn2_workspace/bugs/BUG-*.md` |
| Bug tracker state | `ccn2_workspace/.state/bug-tracker.json` |
| Template | `ccn2_workspace/bugs/BUG-TEMPLATE.md` |
| Triage by | agent_dev (Codera) |
| Verify by | agent_qc (Verita) |

---

## Domain → Agent Mapping

| Domain | Mô tả | Agent fix |
|--------|--------|-----------|
| `gd` | GDD sai logic, thiếu rule, conflict balance | agent_gd (Designia) |
| `client` | Client Cocos2d-x JS (`clientccn2/`, `ccn2_workspace/src/client/`) | agent_dev_client (Pixel) |
| `server` | Server Kotlin/Ktor (`serverccn2/`, `ccn2_workspace/src/server/`) | agent_dev_server (Forge) |
| `admin` | Admin tool Java+React (`admintool/`, `ccn2_workspace/src/admin/`) | agent_dev_admin (Panel) |
| `playtest-client` | Playtest web client (`playtest/client/index.html`) | agent_dev_client (Pixel) |
| `playtest-server` | Playtest Ktor server (`playtest/server/`) | agent_dev_server (Forge) |

---

## Cách tạo Bug Report (Human)

### Bước 1 — Tạo file

Copy `bugs/BUG-TEMPLATE.md`, đặt tên theo format:

```
bugs/BUG-<domain>-<slug>-<YYYY-MM-DD>.md
```

Ví dụ:
```
bugs/BUG-playtest-client-token-not-moving-2026-03-19.md
bugs/BUG-server-room-not-created-2026-03-20.md
bugs/BUG-gd-diamond-reward-wrong-value-2026-03-19.md
```

### Bước 2 — Điền thông tin

Điền **tối thiểu** các fields bắt buộc:
- `**Domain**` — chọn đúng domain từ bảng trên
- `**Severity**` — critical/high/medium/low
- `## Steps to Reproduce` — càng cụ thể càng tốt
- `## Expected Behavior` — behavior đúng là gì
- `## Actual Behavior` — behavior sai như thế nào

### Bước 3 — Lưu file và đợi

Agents sẽ tự detect trong lần WORKSPACE_SCAN tiếp theo (~15 phút).

---

## Bug Lifecycle

```
Human tạo file
      │
      ▼
[open] ──────────────────────────────────────────────────────────────────────
      │                                                                      │
      │ agent_dev (Codera) triage                                           │ gd domain
      ▼                                                                      ▼
[assigned] ←── dispatched.json entry created               agent_gd self-detect
      │
      │ dev agent (Forge/Pixel/Panel) picks up
      ▼
[in_progress]
      │
      │ Fix completed
      ▼
[fixed] ──── Telegram: ✅ [Agent] Bugfix done: <ID>
      │
      │ agent_qc (Verita) verify (Part J)
      ├──── verified → [closed] — Telegram: ✅ [Verita] Bug closed: <ID>
      │
      └──── fail verify → [reopen] — Telegram: ⚠️ [Verita] Bug reopen: <ID>
                  │
                  └── dev agent re-fix → [fixed] → ...
```

### Status enum

| Status | Set by | Ý nghĩa |
|--------|--------|---------|
| `open` | Human / agent_qc | Bug mới, chưa có ai xử lý |
| `assigned` | agent_dev (Codera) | Đã route đến đúng agent |
| `in_progress` | Dev agent | Đang fix trong session này |
| `fixed` | Dev agent | Fix xong, cần verify |
| `verified` | agent_qc | Verify pass |
| `closed` | agent_qc | Done — không cần action thêm |
| `reopen` | agent_qc | Verify fail — cần fix lại |

---

## Auto-detection bởi agent_qc

agent_qc tự động tạo bug report khi:

| Tình huống | Bug được tạo |
|-----------|-------------|
| C7_playtest = FAIL (smoke test) | `BUG-playtest-server-smoke-<datetime>.md` |
| npm test FAIL (Part B) | `BUG-client-tests-<datetime>.md` |

---

## Severity Guide

| Severity | Định nghĩa | Ví dụ |
|----------|-----------|-------|
| `critical` | Game không chạy được | Server crash, client không load |
| `high` | Gameplay bị block | Token không move, room không tạo được |
| `medium` | UX xấu, logic sai nhưng workaround có | Animation giật, score sai |
| `low` | Cosmetic, không ảnh hưởng gameplay | Text sai màu, spacing lệch |

---

## Troubleshooting

### Bug không được pick up sau 30 phút
1. Check `**Domain**` đúng format (lowercase, hyphen-separated)
2. Check `**Status**` = `open` (không phải chữ khác)
3. Check file đúng folder `bugs/` (không phải `reports/`)
4. Check `bug-tracker.json` — nếu ID đã có với status khác → đã được xử lý

### Bug bị reopen nhiều lần
1. Check Fix Notes trong bug file — agent có ghi đúng files changed không
2. Có thể root cause chưa đúng → comment thêm vào bug file, đợi Codera retriage

### agent_qc verify nhưng không biết cách verify domain đó
→ Verita log warning vào error.log, set `verified` (trust fixing agent), close bug
