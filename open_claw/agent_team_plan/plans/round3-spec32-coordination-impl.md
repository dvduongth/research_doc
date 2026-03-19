# Implementation Plan — Spec 3.2: Cross-agent Coordination

> **Spec**: `specs/2026-03-19-round3-cross-agent-coordination.md` (APPROVED)
> **Created**: 2026-03-19
> **Decisions**: C1=A (ghi trực tiếp vào GDD), C2=A (Review làm trigger)

---

## Chunk A — GDD Template + Existing GDD migration
*Parallel — 2 files độc lập*

### A1: UPDATE `GDD-TEMPLATE-FEATURE.md`
- Đổi `**Trạng thái**: Draft | Review | Approved` → `Draft | Review | InDev | InQC | Done | Flagged`
- Thêm 3 fields mới: `**Pipeline agent**`, `**Cập nhật lần cuối bởi**`, `**Cập nhật lần cuối lúc**`

### A2: UPDATE `GDD-FEATURE-elemental-hunter.md`
- Giữ nguyên `**Trạng thái**: Review` (đã đúng)
- Thêm 3 fields mới với giá trị mặc định

---

## Chunk B — AGENTS.md patches (3 agents, song song)

### B1: PATCH `agent_gd/AGENTS.md`
- Confirm gate đã có (rubric ≥70 → Review) — chỉ thêm note ghi 3 fields mới vào header

### B2: PATCH `agent_dev/AGENTS.md`
- Thêm gate: "chỉ process GDD status = Review"
- Thêm InDev→InQC transition logic
- Thêm rule: ghi 4 header fields khi update status

### B3: PATCH `agent_qc/AGENTS.md`
- Thêm gate: "chỉ review GDD status = InQC"
- Thêm rule: SET Done/Flagged + update 4 header fields

---

## Thứ tự: Chunk A song song → Chunk B song song

## Acceptance Criteria
- [ ] AC1: GDD-TEMPLATE có 4 header fields + `Draft|Review|InDev|InQC|Done|Flagged`
- [ ] AC2: GDD-FEATURE-elemental-hunter.md có 3 fields mới
- [ ] AC3: agent_gd/AGENTS.md có gate note về 3 fields mới
- [ ] AC4: agent_dev/AGENTS.md có gate Review + InDev→InQC
- [ ] AC5: agent_qc/AGENTS.md có gate InQC
- [ ] AC6: Status flow document tồn tại (trong ít nhất 1 AGENTS.md)
