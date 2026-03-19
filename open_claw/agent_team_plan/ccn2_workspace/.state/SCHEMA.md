# State Schema Contract — CCN2 Agent Team

> **Version**: 1.0
> **Created**: 2026-03-19
> **Authority**: Tất cả 6 agents phải tuân thủ schema này khi đọc/ghi state files.
> **Location**: `ccn2_workspace/.state/`

---

## 1. Standard Entry Format

Mỗi file được tracked có 1 entry trong state JSON theo format:

```json
{
  "filename.ext": {
    "hash": "MD5_HEX_32CHARS_UPPERCASE",
    "processedAt": "2026-03-19T10:00:00+07:00",
    "status": "pending|processing|done|skipped|error",
    "notes": "optional — lý do skip hoặc mô tả error"
  }
}
```

**Rules:**
- **Key**: filename KHÔNG có path prefix (chỉ tên file)
- **`hash`**: MD5 uppercase 32 ký tự — REQUIRED
- **`processedAt`**: ISO 8601 với timezone `+07:00` — REQUIRED
- **`status`**: 1 trong 5 giá trị định nghĩa ở Section 2 — REQUIRED
- **`notes`**: optional — chỉ ghi khi status là `skipped` hoặc `error`

---

## 2. Status Enum

| Status | Ý nghĩa | Agent set khi nào |
|--------|---------|-------------------|
| `pending` | File mới hoặc đã thay đổi, chưa process | Khi phát hiện file mới hoặc hash thay đổi |
| `processing` | Đang xử lý trong session hiện tại | Ngay trước khi bắt đầu process file |
| `done` | Đã process xong thành công | Sau khi hoàn tất xử lý |
| `skipped` | Bỏ qua có chủ đích | Khi file không phù hợp để process (ghi lý do vào `notes`) |
| `error` | Lỗi trong quá trình process | Khi gặp exception hoặc output không hợp lệ (ghi error vào `notes`) |

**Transition rules:**
```
[file mới]  →  pending
pending     →  processing  →  done
                            →  skipped
                            →  error
error       →  processing  (retry cho phép)
processing  >30 phút       →  pending  (stale — agent crash)
```

---

## 3. Hash Computation — Fallback Chain

Agent phải thử theo thứ tự, dừng khi 1 bước thành công:

### Bước 1 — Windows PowerShell (ưu tiên)
```powershell
(Get-FileHash '<full_absolute_path>' -Algorithm MD5).Hash
```
Kết quả: chuỗi MD5 uppercase 32 ký tự.

### Bước 2 — Linux/Bash (fallback)
```bash
md5sum '<full_absolute_path>' | cut -d' ' -f1 | tr a-z A-Z
```
Kết quả: chuỗi MD5 uppercase 32 ký tự.

### Bước 3 — Pseudo-hash (last resort, không có shell)
```
FORMAT: "SIZE<bytes>-HEAD<first_200_chars_encoded>"
Ví dụ:  "SIZE4821-HEADIyMgR0REIFRpdGxl..."
```
Ghi vào `notes`: `"pseudo-hash: no shell access, not MD5"`

> ⚠️ Bước 3 có thể gây false positive (re-process file không thay đổi) — chấp nhận được.

---

## 4. Change Detection Logic

```
FOR EACH file trong thư mục scan:

  computed_hash = hash(file)  # dùng fallback chain ở Section 3
  entry = state[filename]

  IF entry không tồn tại:
    → SET status = "pending"  # file mới

  ELIF entry.hash != computed_hash:
    → SET status = "pending"  # file đã thay đổi

  ELIF entry.status IN ["done", "skipped"]:
    → BỎ QUA  # không cần process lại

  ELIF entry.status = "error":
    → SET status = "pending"  # retry

  ELIF entry.status = "processing":
    age = now - entry.processedAt
    IF age > 30 phút:
      → SET status = "pending"  # stale processing — agent crash trước đó
    ELSE:
      → BỎ QUA  # agent khác đang xử lý (không thường xảy ra)

  CHỈ process files có status = "pending"
```

---

## 5. Edge Cases

| Case | Xử lý |
|------|-------|
| State file missing | Tạo mới `{}`, treat TẤT CẢ files như `pending` |
| State file invalid JSON | Backup thành `<name>_backup_<datetime>.json`, tạo state mới `{}` |
| File bị xóa khỏi disk nhưng còn trong state | Set `status = "skipped"`, `notes = "file deleted from disk"` |
| Hash computation fail (cả 3 bước) | Set `status = "error"`, `notes = "hash computation failed"`, skip |
| `processing` tồn tại > 30 phút | Treat as stale → reset `status = "pending"` |
| Pseudo-hash collision (Bước 3) | False positive — re-process file. Acceptable trade-off. |

---

## 6. Per-agent State Files

| Agent | State File | Ghi chú |
|-------|-----------|---------|
| agent_gd | `agent_gd_processed.json` | Tracks: concepts/*.md |
| agent_dev | `agent_dev_processed.json` | Tracks: design/GDD-FEATURE-*.md |
| agent_dev (dispatch) | `agent_dev_dispatched.json` | Schema khác — xem Section 7 |
| agent_qc | `agent_qc_processed.json` | Tracks: design/*.md + src/**/*.js |
| agent_qc (meta) | `agent_qc_meta.json` | Tracks: code_review{}, test_gen{} — KHÔNG phải file-tracking |

---

## 7. Dispatched Schema (agent_dev_client/server/admin)

`agent_dev_dispatched.json` dùng schema riêng cho dispatch tracking:

```json
{
  "feature-name": {
    "dispatched_at": "ISO8601",
    "gdd_file": "GDD-FEATURE-feature-name.md",
    "client_status": "dispatched|in_progress|done|skipped|error",
    "server_status": "dispatched|in_progress|done|skipped|error",
    "admin_status":  "dispatched|in_progress|done|skipped|error"
  }
}
```

**Implementation agents** (Pixel/Forge/Panel) xử lý **TẤT CẢ** features có `<layer>_status = "dispatched"` trong 1 session, theo thứ tự `dispatched_at` tăng dần (cũ nhất trước).

---

## 8. Pipeline Health — C7_playtest

`pipeline-health.json` có thêm field `C7_playtest` được cập nhật bởi `playtest/scripts/smoke-test.ps1`:

```json
{
  "checks": {
    "C1_concepts":       "PASS",
    "C2_design":         "PASS",
    "C3_gdd_header":     "PASS",
    "C4_src":            "PASS",
    "C5_quality_report": "PASS",
    "C6_state_json":     "PASS",
    "C7_playtest":       "PASS|FAIL|SKIP"
  }
}
```

**C7_playtest values:**

| Value | Ý nghĩa | Verdict impact |
|-------|---------|----------------|
| `PASS` | 4/4 HTTP checks pass, server start OK | Counts toward HEALTHY |
| `FAIL` | ≥1 check fail HOẶC server không start trong 30s | DEGRADED (không phải BROKEN) |
| `SKIP` | Distribution chưa build (`build/install/` chưa tồn tại) | Exempt — không ảnh hưởng verdict |

**Owner**: `playtest/scripts/smoke-test.ps1` — ghi trực tiếp vào `pipeline-health.json`.
**Triggered by**:
- `agent_qc` (Verita): Mode=quick, sau Part H mỗi WORKSPACE_SCAN
- `agent_dev_server` (Forge): Mode=full, sau mỗi `feature.server_status = "done"`

**Default khi chưa build**: `"SKIP"` — safe default, không làm degraded pipeline.

---

## 10. Bug Tracker — `bug-tracker.json`

**Path**: `ccn2_workspace/.state/bug-tracker.json`
**Owner**: All agents read; agent_dev (triage) + dev agents (fix) + agent_qc (verify) ghi.

### Entry format

```json
{
  "BUG-<domain>-<slug>-<YYYY-MM-DD>": {
    "domain": "gd | client | server | admin | playtest-client | playtest-server",
    "severity": "critical | high | medium | low",
    "status": "open | assigned | in_progress | fixed | verified | closed | reopen",
    "bug_file": "bugs/BUG-<domain>-<slug>-<YYYY-MM-DD>.md",
    "reported_by": "human | agent_qc | agent_dev_server | ...",
    "reported_at": "ISO8601+07:00",
    "assigned_to": "agent_dev_client | agent_dev_server | agent_dev_admin | agent_gd | null",
    "assigned_at": "ISO8601+07:00 | null",
    "fixed_at": "ISO8601+07:00 | null",
    "verified_at": "ISO8601+07:00 | null",
    "closed_at": "ISO8601+07:00 | null"
  }
}
```

### Status transitions

```
open        → assigned   (agent_dev triages, routes to dev agent)
assigned    → in_progress (dev agent picks up)
in_progress → fixed      (dev agent completes fix)
fixed       → verified   (agent_qc confirms fix works)
fixed       → reopen     (agent_qc verify fails — bug still present)
verified    → closed     (agent_qc auto-closes after verified)
reopen      → in_progress (dev agent re-picks up)
```

### Domain → Agent mapping

| Domain | Assigned to |
|--------|-------------|
| `gd` | agent_gd (Designia) — self-scans bugs/, NOT via dispatched.json |
| `client` | agent_dev_client (Pixel) — via dispatched.json |
| `server` | agent_dev_server (Forge) — via dispatched.json |
| `admin` | agent_dev_admin (Panel) — via dispatched.json |
| `playtest-client` | agent_dev_client (Pixel) — via dispatched.json |
| `playtest-server` | agent_dev_server (Forge) — via dispatched.json |

### Dispatched.json entry for bugfix (non-gd domains)

```json
{
  "bugfix-<slug>-<YYYY-MM-DD>": {
    "type": "bugfix",
    "dispatched_at": "ISO8601+07:00",
    "bug_id": "BUG-<domain>-<slug>-<YYYY-MM-DD>",
    "bug_file": "bugs/BUG-<domain>-<slug>-<YYYY-MM-DD>.md",
    "domain": "<domain>",
    "client_status": "dispatched | skipped",
    "server_status": "dispatched | skipped",
    "admin_status":  "dispatched | skipped"
  }
}
```

**Rules:**
- Đúng 1 layer `dispatched`, các layer còn lại `skipped`
- `playtest-client` → `client_status=dispatched`
- `playtest-server` → `server_status=dispatched`
- Dev agent đọc `bug_file` thay vì `req_path`/`design_path`

---

## 11. Validation Checklist (tự check trước khi ghi state)

- [ ] Tất cả entries có đủ 3 required fields: `hash`, `processedAt`, `status`
- [ ] `hash` là string 32 ký tự hex uppercase HOẶC bắt đầu bằng `SIZE` (pseudo)
- [ ] `status` là 1 trong: `pending`, `processing`, `done`, `skipped`, `error`
- [ ] `processedAt` có timezone (+07:00)
- [ ] Không có flat entries (`"key": "HASH_STRING"`)

---

## 9. Error Log

**Path**: `ccn2_workspace/.state/error.log`
**Owner**: All agents append; agent_qc sole rotator
**Format** (1 line per error, append):

    [ISO8601+07:00] <agent_id> | file=<filename> | error=<ErrorType>: <message>

**Example**:

    [2026-03-19T14:30:00+07:00] agent_dev | file=elemental-hunter.md | error=JSONParseError: Unexpected token

**Rotation policy**:
- Max 500 lines
- agent_qc keeps 400 newest lines when exceeded (sole rotator — avoids race condition)
- Multi-agent concurrent append is safe (single-line OS atomicity)

**State entry on error** (in *_processed.json):

    {
      "filename": {
        "hash": "last_known_or_empty",
        "processedAt": "ISO8601+07:00",
        "status": "error",
        "notes": "ErrorType: message"
      }
    }
