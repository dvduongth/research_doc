# Spec 004 — Round 3 Schema + HEARTBEAT Logic

> **Feature**: `round3-schema-heartbeat`
> **Status**: APPROVED — Clarifications resolved (C1=A, C2=B)
> **Created**: 2026-03-19
> **Author**: William Đào 👌

---

## 1. Overview

### Problem Statement
6 agents hiện tại dùng 3 schema khác nhau cho state files, không có tài liệu chính thức về hash computation, và HEARTBEAT.md thiếu logic xử lý edge cases. Kết quả: agents không nhất quán, khó debug, dễ xảy ra race condition khi đọc/ghi state.

### Goal
Standardize toàn bộ state schema + HEARTBEAT logic cho 6 agents. Sau Spec này, tất cả agents đọc/ghi state theo cùng 1 format, dùng cùng 1 hash fallback chain, và nhận biết cùng 1 bộ status values.

### Out of Scope
- Cross-agent coordination protocol (→ Spec 3.2)
- Smoke test (→ Spec 3.3)
- Thay đổi logic business của từng agent (chỉ thay đổi state I/O layer)

---

## 2. Users / Agents

| Actor | Role |
|-------|------|
| agent_gd (Designia) | Đọc/ghi `agent_gd_processed.json` |
| agent_dev (Codera) | Đọc/ghi `agent_dev_processed.json` |
| agent_qc (Verita) | Đọc/ghi `agent_qc_processed.json` — cần migrate sang schema mới |
| agent_dev_client (Pixel) | Đọc `agent_dev_dispatched.json` — cần HEARTBEAT.md mới |
| agent_dev_server (Forge) | Đọc `agent_dev_dispatched.json` — cần HEARTBEAT.md mới |
| agent_dev_admin (Panel) | Đọc `agent_dev_dispatched.json` — cần HEARTBEAT.md mới |

---

## 3. Functional Requirements

### FR1 — Standard State Schema
Tất cả 6 agents phải dùng schema sau cho state files:

```json
{
  "filename.ext": {
    "hash": "MD5_HEX_32CHARS_UPPERCASE",
    "processedAt": "2026-03-19T10:00:00+07:00",
    "status": "pending|processing|done|skipped|error",
    "notes": "optional — ghi lý do skip hoặc mô tả error"
  }
}
```

**Quy tắc schema:**
- Key = filename (không có path prefix)
- `hash`: MD5 uppercase 32 ký tự — REQUIRED
- `processedAt`: ISO 8601 với timezone +07:00 — REQUIRED
- `status`: 1 trong 5 giá trị định nghĩa — REQUIRED
- `notes`: optional, bỏ qua nếu không có gì để ghi

**Status enum và ý nghĩa:**
| Status | Ý nghĩa | Ai set |
|--------|---------|--------|
| `pending` | File mới phát hiện, chưa process | Agent khi scan thấy file mới |
| `processing` | Đang xử lý trong session hiện tại | Agent ngay trước khi bắt đầu process |
| `done` | Đã process xong thành công | Agent sau khi hoàn tất |
| `skipped` | Bỏ qua có chủ đích (ghi rõ lý do vào `notes`) | Agent khi phát hiện không cần process |
| `error` | Lỗi khi process (ghi error vào `notes`) | Agent khi gặp exception |

### FR2 — Hash Computation Fallback Chain
Mỗi HEARTBEAT.md phải document và agents phải thực hiện theo chain sau:

```
Bước 1 (Windows/PowerShell):
  (Get-FileHash '<full_path>' -Algorithm MD5).Hash

Bước 2 (Linux/Bash — fallback):
  md5sum '<full_path>' | cut -d' ' -f1 | tr a-z A-Z

Bước 3 (Last resort — nếu không có shell):
  Dùng file size (bytes) + first 200 chars của content làm pseudo-identifier
  Format: "SIZE<bytes>-HEAD<first_200_chars_base64>"
  Ghi chú trong notes: "pseudo-hash, not MD5"
```

Agent phải thử Bước 1 trước. Nếu fail → thử Bước 2. Nếu fail → Bước 3.

### FR3 — Change Detection Logic
Mỗi agent khi scan phải:

```
FOR EACH file trong thư mục scan:
  1. Tính hash của file (dùng FR2 chain)
  2. Đọc state file → tìm entry với key = filename
  3. IF entry không tồn tại → status = "pending" (file mới)
     ELIF stored hash != computed hash → status = "pending" (file thay đổi)
     ELIF stored status IN ["done", "skipped"] → BỎ QUA (không process lại)
     ELIF stored status = "error" → log warning, xử lý lại
     ELIF stored status = "processing" → STALE, xử lý lại (agent crash trước đó)
  4. Chỉ process files có status "pending" hoặc "error" (stale processing)
```

### FR4 — SCHEMA.md Contract
Tạo file `ccn2_workspace/.state/SCHEMA.md` làm tài liệu chính thức cho tất cả agents đọc. File này là nguồn sự thật duy nhất về schema.

### FR5 — State Migration: agent_qc
`agent_qc_processed.json` hiện tại dùng flat format khác chuẩn. Phải migrate sang standard schema.

**Before (flat):**
```json
{
  "gdd:GDD-TEMPLATE.md": "HASH_VALUE",
  "code_review": {},
  "test_gen": {}
}
```

**After (standard state file):**
```json
{
  "GDD-TEMPLATE.md": {
    "hash": "HASH_VALUE",
    "processedAt": "2026-03-19T09:00:00+07:00",
    "status": "done",
    "notes": "Template file, processed for reference"
  }
}
```

**Tách metadata ra file riêng (C2 = B)**: `code_review` và `test_gen` KHÔNG nằm trong state file.
→ Tạo mới `ccn2_workspace/.state/agent_qc_meta.json`:
```json
{
  "code_review": {},
  "test_gen": {}
}
```

Separation of concerns: state file chỉ chứa file-tracking entries, meta file chứa runtime metadata.

### FR6 — HEARTBEAT.md cho 6 agents
Mỗi agent có HEARTBEAT.md riêng tại `openclaw/agents/<agent_id>/HEARTBEAT.md`.

**3 main agents** (agent_gd, agent_dev, agent_qc): UPDATE HEARTBEAT.md hiện có — thêm hash computation section + status enum reference + FR3 logic.

**3 implementation agents** (agent_dev_client, agent_dev_server, agent_dev_admin): TẠO MỚI HEARTBEAT.md — template giống nhau nhưng khác ở:
- Input source: `.state/agent_dev_dispatched.json` (thay vì folder scan)
- Trigger condition: entry với `<layer>_status = "dispatched"`
- **Xử lý tuần tự (C1 = A)**: Trong 1 session, agent xử lý **TẤT CẢ** features có `<layer>_status = "dispatched"` theo thứ tự `dispatched_at` tăng dần (cũ nhất trước). Không dừng sau feature đầu tiên.
- Hash vẫn dùng để track dispatched.json version (phát hiện khi dispatched.json thay đổi)

---

## 4. Non-Functional Requirements

| NFR | Mô tả |
|-----|-------|
| NFR1 — Backward compatible | Migrate agent_qc state không được mất dữ liệu cũ |
| NFR2 — Idempotent | Chạy lại HEARTBEAT logic nhiều lần cho cùng file → cùng kết quả |
| NFR3 — Fail-safe | Nếu state file bị corrupt/missing → treat tất cả files như `pending`, tạo lại state file |
| NFR4 — No blocking | Agent không được block vô thời hạn khi tính hash |

---

## 5. Edge Cases

| Case | Xử lý |
|------|-------|
| State file missing | Tạo mới `{}`, treat tất cả files như pending |
| State file invalid JSON | Log error, tạo backup `state_backup_<datetime>.json`, tạo state mới |
| File bị xóa nhưng còn trong state | Set status = `skipped`, notes = "file deleted" |
| Hash computation fail (cả 3 bước) | Set status = `error`, notes = "hash computation failed", skip processing |
| `processing` status tồn tại > 30 phút | Treat as stale → reset sang `pending` |
| Pseudo-hash (Bước 3) gặp collision | Chấp nhận false positive (re-process file giống nhau) — acceptable trade-off |

---

## 6. Dependencies

| Dependency | Loại | Ghi chú |
|-----------|------|---------|
| Round 2 Phase 2.2 AGENTS.md (agent_dev) | ✅ Đã có | Không thay đổi business logic, chỉ thêm HEARTBEAT section |
| Round 2 Phase 2.3 AGENTS.md (agent_qc) | ✅ Đã có | Không thay đổi Parts A-E, chỉ thêm HEARTBEAT section |
| Round 2 agent_dev_client/server/admin AGENTS.md | ✅ Đã có | HEARTBEAT.md sẽ reference các AGENTS.md này |

---

## 7. Acceptance Criteria

- [ ] AC1: `ccn2_workspace/.state/SCHEMA.md` tồn tại với đầy đủ 5 status values, schema example, và hash fallback chain
- [ ] AC2: 6 HEARTBEAT.md files tồn tại (3 updated, 3 created mới)
- [ ] AC3: Mỗi HEARTBEAT.md có section: "Hash Computation", "Status Enum", "Change Detection Logic"
- [ ] AC4: `agent_qc_processed.json` (cả 2 copies) đã migrate sang standard schema
- [ ] AC5: `agent_gd_processed.json` dùng đúng status enum (không có "Review"/"APPROVED" lạ)
- [ ] AC6: Không có entry nào trong state files dùng flat format `"key": "HASH_STRING"` (phải là nested object)

---

## 8. CLARIFICATION RESOLVED

| ID | Câu hỏi | Quyết định |
|----|---------|-----------|
| C1 | Implementation agents xử lý nhiều features dispatch cùng lúc? | **A) Tuần tự** — xử lý TẤT CẢ features trong 1 session theo thứ tự `dispatched_at` tăng dần |
| C2 | `code_review`/`test_gen` metadata: giữ trong state hay tách file riêng? | **B) Tách ra** — tạo `agent_qc_meta.json` riêng, state file chỉ chứa file-tracking |

---

## 9. Quality Checklist

- [x] Spec có Problem Statement rõ ràng
- [x] Out of Scope được liệt kê
- [x] Tất cả actors/agents được liệt kê
- [x] Mọi FR có acceptance criteria tương ứng
- [x] Edge cases được liệt kê
- [x] Dependencies được liệt kê
- [x] NEEDS CLARIFICATION markers đã resolve (C1=A tuần tự, C2=B tách file)
