# Spec 005 — Round 3 Cross-agent Coordination

> **Feature**: `round3-cross-agent-coordination`
> **Status**: APPROVED — Clarifications resolved (C1=A, C2=A)
> **Created**: 2026-03-19
> **Author**: William Đào 👌
> **Depends on**: Spec 3.1 (SCHEMA.md, HEARTBEAT.md) — ✅ DONE

---

## 1. Overview

### Problem Statement
6 agents hiện chỉ phối hợp theo **staggered timing** (GD :00 → Dev :07 → QC :12). Không có explicit signal nào trong GDD file để agent biết file đó đang ở phase nào của pipeline. Kết quả: agent_dev có thể implement GDD chưa approved, agent_qc có thể review code chưa implement xong.

### Goal
Thêm **status field** vào GDD-FEATURE-*.md header làm coordination signal. Mỗi agent chỉ xử lý GDD khi status đúng với phase của mình. Agents sau không bao giờ chạy trước agents trước, dù timing có lệch.

### Out of Scope
- Thay đổi business logic của từng agent (chỉ thêm gate check)
- Real-time event/push notification
- Locking mechanism (đã quyết định dùng status field thay vì lock file)
- Smoke test (→ Spec 3.3)

---

## 2. Users / Agents

| Agent | Đọc status | Ghi status | Gate condition |
|-------|-----------|-----------|---------------|
| agent_gd | — | `Draft` → `Approved` | Ghi Approved sau khi self-eval ≥ threshold |
| agent_dev | `Approved` | `Approved` → `InDev` | CHỈ process GDD có status = `Approved` |
| agent_dev_client | — | `client_done` trong dispatched.json | Xử lý khi `client_status = dispatched` |
| agent_dev_server | — | `server_done` trong dispatched.json | Xử lý khi `server_status = dispatched` |
| agent_dev_admin | — | `admin_done` trong dispatched.json | Xử lý khi `admin_status = dispatched` |
| agent_qc | `InDev` | `InDev` → `InQC` → `Done`/`Flagged` | CHỈ review GDD có status = `InDev` VÀ tất cả layers done |

---

## 3. Functional Requirements

### FR1 — Extended Status Enum trong GDD Header
GDD-FEATURE-*.md header phải có field status với các giá trị mở rộng. Status được ghi **trực tiếp vào GDD file** (C1=A) — chỉ update đúng dòng `**Trạng thái**:`.

```markdown
**Trạng thái**: Draft | Review | InDev | InQC | Done | Flagged
**Pipeline agent**: agent_gd | agent_dev | agent_qc | COMPLETE
**Cập nhật lần cuối bởi**: <agent_id>
**Cập nhật lần cuối lúc**: YYYY-MM-DDTHH:MM:SS+07:00
```

**Status flow (C2=A — dùng `Review` làm trigger, không thêm `Approved`):**
```
[agent_gd tạo GDD]
    ↓
  Draft  (score 50–69)
    ↓
  Review  (score ≥ 70 — agent_gd self-eval pass, sẵn sàng implement)
    ↓ (agent_dev nhận và dispatch)
  InDev
    ↓ (tất cả layers client+server+admin đều done)
  InQC
    ↓           ↓
  Done       Flagged
(qc pass)  (diff ≥ 20pt hoặc score < 80)
```

**Status ý nghĩa:**
| Status | Ý nghĩa | Agent set | Rubric threshold |
|--------|---------|-----------|-----------------|
| `Draft` | GDD vừa tạo hoặc score 50–69 | agent_gd | score 50–69 |
| `Review` | Self-eval ≥ 70, sẵn sàng implement | agent_gd | score ≥ 70 |
| `InDev` | agent_dev đã dispatch cho impl agents | agent_dev | — |
| `InQC` | Tất cả layers đã implement xong | agent_dev | — |
| `Done` | QC pass (score ≥ 80 all layers) | agent_qc | — |
| `Flagged` | QC fail hoặc diff ≥ 20pt — cần human review | agent_qc | — |

> ℹ️ `Approved` (trong template cũ) được **thay thế bởi `Review`** trong coordination protocol. Rubric GDD-EVAL-RUBRIC.md không cần sửa — `≥ 70 → Review` đã có sẵn.

### FR2 — Gate Rules cho từng agent

**agent_gd gate (C2=A — dùng Review):**
```
Rubric threshold không thay đổi:
  score < 50  → KHÔNG lưu file
  50–69       → lưu với Trạng thái: Draft
  ≥ 70        → lưu với Trạng thái: Review  ← đây là trigger cho agent_dev
Ghi trực tiếp vào dòng **Trạng thái**: trong GDD file (C1=A)
```

**agent_dev gate (C2=A — đọc Review):**
```
TRƯỚC khi process GDD:
  IF GDD status ≠ "Review" → SKIP, output HEARTBEAT_OK cho GDD đó
  IF GDD status = "Review":
    → UPDATE dòng **Trạng thái**: InDev trong GDD file (C1=A)
    → UPDATE dòng **Pipeline agent**: agent_dev
    → UPDATE dòng **Cập nhật lần cuối bởi**: agent_dev
    → UPDATE dòng **Cập nhật lần cuối lúc**: <now>
    → Dispatch tới impl agents (update agent_dev_dispatched.json)
```

**agent_dev_client / agent_dev_server / agent_dev_admin gate:**
```
Không đọc GDD status trực tiếp.
Chỉ đọc agent_dev_dispatched.json → <layer>_status = "dispatched"
Sau khi implement xong → SET <layer>_status = "done" trong dispatched.json
```

**agent_dev — InDev → InQC transition:**
```
Mỗi lần scan, sau khi dispatch:
  FOR EACH feature trong dispatched.json WHERE GDD status = "InDev":
    IF client_status = "done" AND server_status = "done" AND admin_status = "done":
      → SET GDD status = "InQC"
      → SET pipeline_agent = "agent_qc"
      → Telegram: [Codera] Feature ready for QC: <feature>
```

**agent_qc gate:**
```
TRƯỚC khi review GDD:
  IF GDD status ≠ "InQC" → SKIP
  IF GDD status = "InQC":
    → Chạy Parts C + D + E (code review, test gen)
    → IF all_layer_scores ≥ 80 AND max_diff < 20pt:
        SET status = "Done"
      ELSE:
        SET status = "Flagged"
        Telegram: [Verita] 🚨 FLAG: <feature> — <reason>
```

### FR3 — Update GDD-TEMPLATE-FEATURE.md
Template phải reflect status enum đầy đủ (C2=A — `Review` thay `Approved`) và thêm 3 fields mới:

```markdown
**Trạng thái**: Draft | Review | InDev | InQC | Done | Flagged
**Pipeline agent**: agent_gd | agent_dev | agent_qc | COMPLETE
**Cập nhật lần cuối bởi**: agent_gd
**Cập nhật lần cuối lúc**: YYYY-MM-DDTHH:MM:SS+07:00
```

### FR4 — Update GDD-FEATURE-elemental-hunter.md (existing file)
File GDD hiện tại trong `design/` phải được cập nhật header sang format mới (giữ nguyên nội dung, chỉ update header fields).

### FR5 — AGENTS.md patches (gate logic)
Thêm gate check vào AGENTS.md của 4 agents có gate:
- `agent_gd/AGENTS.md` — thêm gate FR2 (self-eval threshold → set Approved)
- `agent_dev/AGENTS.md` — thêm gate FR2 (chỉ process Approved) + InDev→InQC transition
- `agent_qc/AGENTS.md` — thêm gate FR2 (chỉ review InQC)

---

## 4. Non-Functional Requirements

| NFR | Mô tả |
|-----|-------|
| NFR1 — Non-destructive | Thêm fields vào GDD header KHÔNG xóa nội dung sections 1-10 |
| NFR2 — Idempotent | Agent set status "InDev" nhiều lần cho cùng GDD → vẫn "InDev" (không downgrade) |
| NFR3 — No blocking | Agent không đợi agent khác — nếu GDD sai status thì skip, không retry vô hạn |
| NFR4 — Backward compatible | GDD không có status field mới → treat như "Draft" (không crash) |

---

## 5. Edge Cases

| Case | Xử lý |
|------|-------|
| GDD ở `Approved` nhưng hash thay đổi (agent_gd edit lại) | agent_dev detect hash change → re-dispatch, SET status = "InDev" lại |
| GDD ở `InDev` nhưng hash thay đổi | agent_dev giữ nguyên `InDev`, update dispatch với hash mới |
| `InQC` nhưng 1 layer bị xóa | agent_qc set `Flagged`, notes = "missing layer: <layer>" |
| `Done` nhưng GDD thay đổi | agent_gd detect → reset về `Draft`, pipeline restart |
| `Flagged` — ai reset? | Chỉ human (anh Daniel) reset Flagged → Approved để retry |
| agent_dev crash giữa chừng khi đang set `InDev` | GDD còn `Approved` (chưa ghi xong) → agent_dev retry ở scan tiếp theo |
| 2 agents cùng ghi vào GDD header cùng lúc | Không xảy ra — timing stagger đảm bảo. Nếu xảy ra: last-write-wins, agent tiếp theo detect hash change và re-process |

---

## 6. Dependencies

| Dependency | Loại | Ghi chú |
|-----------|------|---------|
| Spec 3.1 HEARTBEAT.md (6 files) | ✅ DONE | Gate logic extend từ Change Detection Logic |
| GDD-TEMPLATE-FEATURE.md | ✅ Đã có | Cần update FR3 |
| agent_dev/AGENTS.md (Round 2) | ✅ Đã có | Cần patch FR5 |
| agent_qc/AGENTS.md (Round 2) | ✅ Đã có | Cần patch FR5 |
| agent_gd/AGENTS.md (Round 1) | ✅ Đã có | Cần patch FR5 |

---

## 7. Acceptance Criteria

- [ ] AC1: `GDD-TEMPLATE-FEATURE.md` có 4 header fields đầy đủ (Trạng thái, Pipeline agent, Cập nhật bởi, Cập nhật lúc)
- [ ] AC2: `GDD-FEATURE-elemental-hunter.md` (nếu tồn tại) đã migrate sang header mới
- [ ] AC3: `agent_gd/AGENTS.md` có gate: "ghi Review CHỈ khi self-eval ≥ 70, Draft nếu 50–69" (không thay đổi rubric)
- [ ] AC4: `agent_dev/AGENTS.md` có gate: "chỉ process GDD status = Review" + InDev→InQC transition logic
- [ ] AC5: `agent_qc/AGENTS.md` có gate: "chỉ review GDD status = InQC"
- [ ] AC6: Status flow `Draft→Approved→InDev→InQC→Done/Flagged` được document trong ít nhất 1 file agents có thể đọc

---

## 8. CLARIFICATION RESOLVED

| ID | Câu hỏi | Quyết định |
|----|---------|-----------|
| C1 | Ghi status vào GDD file hay file trung gian? | **A) Ghi trực tiếp** vào dòng `**Trạng thái**:` trong GDD file. Chỉ update đúng 1 dòng đó. |
| C2 | Threshold để trigger agent_dev? | **A) Dùng `Review`** — giữ nguyên rubric (≥70 → Review). agent_dev lắng nghe `Review`. Không thêm `Approved`. |

---

## 9. Quality Checklist

- [x] Problem Statement rõ ràng
- [x] Out of Scope được liệt kê
- [x] Tất cả 6 actors được liệt kê với gate conditions
- [x] Status flow diagram rõ ràng
- [x] Edge cases bao gồm conflict + reset scenarios
- [x] Dependencies liệt kê đủ
- [x] NEEDS CLARIFICATION markers đã resolve (C1=A ghi trực tiếp, C2=A dùng Review)
