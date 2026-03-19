# Round 3 — Automation Design

> **Status**: ✅ COMPLETED — 2026-03-19
> **Created**: 2026-03-19
> **Approach**: B — 3 specs tuần tự (Cron Jobs manual, không cần spec)

---

## Quyết định Brainstorming

| # | Câu hỏi | Lựa chọn | Ghi chú |
|---|---------|----------|---------|
| Q1 | Scope approach | **B) 4 specs nhỏ tuần tự** | Cron Jobs là manual step → không cần spec riêng |
| Q2 | File Change Detection | **B) Schema + HEARTBEAT logic đầy đủ** | Standardize schema 3 agents + HEARTBEAT.md với hash fallback + status enum |
| Q3 | Cross-agent Coordination | **B) Status field trong GDD/state** | Extend pattern có sẵn, GDD header status: Draft→Approved→InDev→InQC→Done |
| Q4 | E2E Integration Test | **B) Smoke test script** | agent_qc chạy định kỳ, verify sự tồn tại + hợp lệ của output |

---

## Subsystem 1 — Cron Jobs (KHÔNG cần spec — manual action)

- Jobs 1-3 ✅ đã active (agent_gd, agent_dev, agent_qc)
- Jobs 5-7 ⬜ anh cần add thủ công vào OpenClaw UI (JSON đã có trong CRON_SETUP.md)
- Jobs 5-7: agent_dev_client (:17,:47), agent_dev_server (:19,:49), agent_dev_admin (:21,:51)

---

## Spec 3.1 — Schema + HEARTBEAT Logic (File Change Detection)

### Vấn đề cần giải quyết
1. **Schema không nhất quán**: agent_qc dùng flat `{"gdd:file": "HASH"}`, agent_gd/dev dùng nested object
2. **HEARTBEAT.md thiếu hash logic**: Chưa document cách tính hash, fallback nếu không có shell
3. **Status enum chưa định nghĩa**: agent_gd dùng "Review"/"SKIPPED"/"APPROVED" không nhất quán

### Thiết kế
**Standard State Schema** (áp dụng cho cả 6 agents):
```json
{
  "filename.md": {
    "hash": "MD5_HEX_32CHARS",
    "processedAt": "ISO8601",
    "status": "pending|processing|done|skipped|error",
    "notes": "optional string"
  }
}
```

**Hash Computation Fallback Chain**:
1. PowerShell: `(Get-FileHash '<path>' -Algorithm MD5).Hash`
2. Bash: `md5sum '<path>' | cut -d' ' -f1 | tr a-z A-Z`
3. Last resort: `<filesize_bytes>-<first_100_chars_base64>` (pseudo-hash)

**Valid Status Enum**:
- `pending` — file mới, chưa process
- `processing` — đang xử lý trong session hiện tại
- `done` — đã process xong, hash match với lần cuối
- `skipped` — bỏ qua có lý do (ghi vào `notes`)
- `error` — lỗi khi process (ghi error vào `notes`)

### Deliverables
- [ ] `ccn2_workspace/.state/SCHEMA.md` — schema contract cho tất cả agents
- [ ] `openclaw/agents/agent_gd/HEARTBEAT.md` — cập nhật với hash logic đầy đủ
- [ ] `openclaw/agents/agent_dev/HEARTBEAT.md` — cập nhật
- [ ] `openclaw/agents/agent_qc/HEARTBEAT.md` — cập nhật
- [ ] `openclaw/agents/agent_dev_client/HEARTBEAT.md` — tạo mới
- [ ] `openclaw/agents/agent_dev_server/HEARTBEAT.md` — tạo mới
- [ ] `openclaw/agents/agent_dev_admin/HEARTBEAT.md` — tạo mới
- [ ] `.state/*.json` — migrate agent_qc sang standard schema

---

## Spec 3.2 — Status Field Coordination (Cross-agent)

### Vấn đề cần giải quyết
- Agents phối hợp chỉ dựa vào staggered timing, nếu 1 agent chạy lâu → race condition
- GDD-FEATURE-*.md không có explicit status → agent sau không biết file đã "ready" chưa

### Thiết kế
**GDD File Header** — thêm status line:
```markdown
---
status: Draft | Approved | InDev | InQC | Done
last_updated_by: agent_gd | agent_dev | agent_qc
last_updated_at: ISO8601
---
```

**Status Flow**:
```
agent_gd  writes: Draft → Approved
agent_dev reads: Approved only → implements → sets InDev
agent_dev_client/server/admin: reads InDev → implements layer → sets partial done
agent_qc  reads: InDev (khi tất cả layers done) → sets InQC → sets Done/Flagged
```

**Gate Rules** (mỗi agent check trước khi process):
- agent_dev: skip GDD nếu status ≠ `Approved`
- agent_qc: skip GDD nếu status ≠ `InDev` hoặc không phải tất cả layers done

### Deliverables
- [ ] `ccn2_workspace/design/GDD-TEMPLATE-FEATURE.md` — thêm YAML header block
- [ ] `openclaw/agents/agent_gd/AGENTS.md` — thêm rule: set status Approved sau khi tạo GDD
- [ ] `openclaw/agents/agent_dev/AGENTS.md` — thêm gate: chỉ process Approved GDDs
- [ ] `openclaw/agents/agent_qc/AGENTS.md` — thêm gate: chỉ review InDev GDDs
- [ ] `openclaw/agents/agent_dev_client/AGENTS.md` — thêm gate logic
- [ ] `openclaw/agents/agent_dev_server/AGENTS.md` — thêm gate logic
- [ ] `openclaw/agents/agent_dev_admin/AGENTS.md` — thêm gate logic

---

## Spec 3.3 — Smoke Test Script (E2E Integration Test)

### Vấn đề cần giải quyết
- Không có cách biết pipeline có broken không (ngoại trừ khi anh check thủ công)
- Cần automated health check chạy định kỳ

### Thiết kế
**`ccn2_workspace/reports/smoke-test-<datetime>.md`** — agent_qc tạo mỗi lần chạy:

```markdown
# Smoke Test — YYYY-MM-DD HH:mm

## Pipeline Health Checks
| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| concepts/ có ≥1 .md (non-README) | ≥1 | N | ✅/❌ |
| design/ có ≥1 GDD-FEATURE-*.md | ≥1 | N | ✅/❌ |
| design/ GDDs đều có status header | all | N/total | ✅/❌ |
| src/ có ≥1 implementation folder | ≥1 | N | ✅/❌ |
| reports/ có quality report trong 24h | ≥1 | N | ✅/❌ |
| .state/ files tồn tại và valid JSON | 4 files | N | ✅/❌ |

## Overall: HEALTHY / DEGRADED / BROKEN
```

**Trigger**: Agent_qc chạy smoke test ở cuối mỗi WORKSPACE_SCAN (sau Parts A-E).
**Alert**: Nếu ≥2 checks fail → gửi Telegram alert `[Verita] PIPELINE DEGRADED`

### Deliverables
- [ ] `ccn2_workspace/reports/smoke-test-TEMPLATE.md` — template
- [ ] `openclaw/agents/agent_qc/AGENTS.md` — thêm Part F: Smoke Test
- [ ] `ccn2_workspace/.state/pipeline-health.json` — persist last smoke test result

---

## Thứ tự thực hiện

```
Spec 3.1 (HEARTBEAT + Schema) → Spec 3.2 (Status field) → Spec 3.3 (Smoke test)
```

Spec 3.2 phụ thuộc vào Spec 3.1 (cần schema chuẩn trước khi thêm status coordination).
Spec 3.3 phụ thuộc vào Spec 3.2 (smoke test check status header).

---

## Thời gian ước tính

| Spec | Deliverables | Ước tính |
|------|-------------|---------|
| 3.1 | 7 HEARTBEAT.md + 1 SCHEMA.md + 1 state migration | ~45 phút |
| 3.2 | GDD template + 7 AGENTS.md patches | ~30 phút |
| 3.3 | Smoke test template + agent_qc Part F | ~20 phút |
