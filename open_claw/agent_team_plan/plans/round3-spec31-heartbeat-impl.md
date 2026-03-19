# Implementation Plan — Spec 3.1: Schema + HEARTBEAT Logic

> **Spec**: `specs/2026-03-19-round3-schema-heartbeat.md` (APPROVED)
> **Created**: 2026-03-19
> **Estimated**: ~45 phút

---

## Chunk A — Foundation (SCHEMA.md + agent_qc_meta.json)
*Thực hiện trước — các chunk khác reference file này*

### A1: Tạo `ccn2_workspace/.state/SCHEMA.md`
```
Path: D:\PROJECT\CCN2\research_doc\open_claw\agent_team_plan\ccn2_workspace\.state\SCHEMA.md
Action: CREATE
Content: Schema contract — standard entry format, status enum, hash fallback chain, rules
```

### A2: Tạo `ccn2_workspace/.state/agent_qc_meta.json`
```
Path: D:\PROJECT\CCN2\research_doc\open_claw\agent_team_plan\ccn2_workspace\.state\agent_qc_meta.json
Action: CREATE
Content: { "code_review": {}, "test_gen": {} }
```

### A3: Migrate `agent_qc_processed.json` (×2)
```
Paths:
  - ccn2_workspace/.state/agent_qc_processed.json
  - openclaw/agents/agent_qc/.state/agent_qc_processed.json
Action: REWRITE — flat format → standard nested schema
```

---

## Chunk B — HEARTBEAT.md cho 3 main agents
*Parallel với Chunk A sau khi A1 xong*

### B1: UPDATE `agent_gd/HEARTBEAT.md`
```
Path: openclaw/agents/agent_gd/HEARTBEAT.md
Action: UPDATE — thêm 3 sections:
  - ## Hash Computation (FR2 fallback chain)
  - ## Status Enum (5 values)
  - ## Change Detection Logic (FR3 pseudocode)
Preserve: nội dung hiện tại (wakeup instructions, scan logic)
```

### B2: UPDATE `agent_dev/HEARTBEAT.md`
```
Path: openclaw/agents/agent_dev/HEARTBEAT.md
Action: UPDATE — thêm 3 sections như B1
Preserve: nội dung hiện tại
```

### B3: UPDATE `agent_qc/HEARTBEAT.md`
```
Path: openclaw/agents/agent_qc/HEARTBEAT.md
Action: UPDATE — thêm 3 sections như B1
  + Note: read agent_qc_meta.json riêng cho code_review/test_gen
Preserve: nội dung hiện tại (Parts A-F)
```

---

## Chunk C — HEARTBEAT.md cho 3 implementation agents
*Tạo mới — dùng dispatched.json trigger (không phải folder scan)*

### C1: CREATE `agent_dev_client/HEARTBEAT.md`
```
Path: openclaw/agents/agent_dev_client/HEARTBEAT.md
Action: CREATE
Trigger: agent_dev_dispatched.json → client_status = "dispatched"
Process: TẤT CẢ features theo dispatched_at tăng dần (C1=A tuần tự)
Hash: track dispatched.json version để detect thay đổi
```

### C2: CREATE `agent_dev_server/HEARTBEAT.md`
```
Path: openclaw/agents/agent_dev_server/HEARTBEAT.md
Action: CREATE
Trigger: agent_dev_dispatched.json → server_status = "dispatched"
Process: TẤT CẢ features tuần tự
```

### C3: CREATE `agent_dev_admin/HEARTBEAT.md`
```
Path: openclaw/agents/agent_dev_admin/HEARTBEAT.md
Action: CREATE
Trigger: agent_dev_dispatched.json → admin_status = "dispatched"
Process: TẤT CẢ features tuần tự
```

---

## Thứ tự thực hiện

```
Chunk A (A1 → A2 → A3) chạy trước
Sau đó Chunk B + Chunk C chạy song song
```

```
A1 ─┬─► B1
A2  │   B2
A3 ─┤   B3
    └─► C1
        C2
        C3
```

---

## Acceptance Criteria (từ spec)

- [ ] AC1: `SCHEMA.md` tồn tại — đầy đủ 5 status values, schema example, hash fallback
- [ ] AC2: 6 HEARTBEAT.md files tồn tại (3 updated, 3 created)
- [ ] AC3: Mỗi HEARTBEAT.md có section "Hash Computation", "Status Enum", "Change Detection Logic"
- [ ] AC4: `agent_qc_processed.json` (×2) đã migrate sang standard schema
- [ ] AC5: `agent_qc_meta.json` tồn tại với `code_review` + `test_gen` keys
- [ ] AC6: Không còn entry nào dùng flat format `"key": "HASH_STRING"`
