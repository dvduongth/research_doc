# Báo Cáo Hệ Thống Multi-Agent CCN2

> **Ngày báo cáo**: 2026-03-19
> **Tác giả**: William Đào 👌
> **Phạm vi**: `D:\PROJECT\CCN2\research_doc\open_claw\agent_team_plan`

---

## 1. Tổng Quan Dự Án

Hệ thống **CCN2 Multi-Agent** là một pipeline tự động hoá phát triển game dựa trên OpenClaw — một nền tảng AI agent chạy định kỳ theo lịch. Mục tiêu: từ một file concept game (Markdown), hệ thống tự động tạo GDD, phân tích kỹ thuật, viết code (Client/Server/Admin), và kiểm thử — **không cần sự can thiệp thủ công** của developer trong từng bước.

### Kiến Trúc Tổng Quan

```
[Daniel tạo concept] → concepts/*.md
        ↓
[agent_gd] → design/GDD-FEATURE-*.md   (mỗi 15 phút)
        ↓
[agent_dev] → analysis/REQ-*.md         (mỗi 15 phút)
           → analysis/DESIGN-*.md
           → agent_dev_dispatched.json
        ↓                ↓                ↓
[agent_dev_client]  [agent_dev_server]  [agent_dev_admin]
  TypeScript/Cocos    Kotlin/Ktor/Actor   Java+React/REST
  src/client/         src/server/         src/admin/
  (mỗi 30 phút)       (mỗi 30 phút)       (mỗi 30 phút)
        ↓
[agent_qc] → reports/quality-*.md       (mỗi 15 phút)
           → src/tests/**
           → reports/smoke-test-*.md
```

### Số Liệu Nhanh

| Chỉ số | Giá trị |
|--------|--------|
| Tổng agents | **6** |
| Cron jobs đang chạy | **7/7** |
| Rounds hoàn thành | **3/4** |
| Specs đã design & implement | **6 specs** |
| AGENTS.md tổng dòng | **1,220 dòng** |
| GDD feature hiện tại | **1** (elemental-hunter, InDev) |
| Tests pass gần nhất | **175/175** (100%) |
| Eval score GDD | **93/100** |

---

## 2. Hệ Thống 6 Agents

### 2.1 agent_gd — Designia (Game Designer)

| Thuộc tính | Giá trị |
|-----------|--------|
| Nickname | Designia |
| Role | Game Designer |
| Cron | `:00, :15, :30, :45` (15 phút) |
| Input | `concepts/*.md` |
| Output | `design/GDD-FEATURE-*.md` + `eval/GDD-EVAL-*.md` |
| AGENTS.md | 187 dòng |

**Workflow:**
1. Tính MD5 hash từng file trong `concepts/`
2. So sánh với `agent_gd_processed.json` (change detection)
3. Nếu thay đổi → Generate GDD 10 sections bằng Tiếng Việt
4. Tự đánh giá theo GDD-EVAL-RUBRIC: `< 50` = không lưu | `50–69` = Draft | `≥ 70` = Review
5. Ghi header 4 fields: Trạng thái, Pipeline agent, Cập nhật bởi, Cập nhật lúc
6. Telegram notification

**Gate**: Chỉ lưu GDD khi score ≥ 50. `Review` (≥ 70) là trigger để agent_dev xử lý tiếp.

---

### 2.2 agent_dev — Codera (Tech Lead & Architect)

| Thuộc tính | Giá trị |
|-----------|--------|
| Nickname | Codera |
| Role | Tech Lead & Software Architect |
| Cron | `:07, :22, :37, :52` (15 phút) |
| Input | `design/GDD-FEATURE-*.md` (status = Review) |
| Output | `analysis/REQ-*.md` + `analysis/DESIGN-*.md` + dispatch |
| AGENTS.md | 314 dòng |

**Workflow (4 phases):**
1. **Phase 1** — Requirements Analysis: trích xuất Actors, Use Cases, Business Rules, Edge Cases
2. **Phase 2** — Self-eval REQ (CODE-EVAL-RUBRIC) → nếu score ≥ 70 tiếp tục
3. **Phase 3** — System Design: thiết kế kiến trúc 3 layers (Client/Server/Admin)
4. **Phase 4** — Dispatch: ghi `agent_dev_dispatched.json`, update GDD status → `InDev`

**InDev → InQC Transition**: Sau mỗi scan, nếu tất cả layers (client + server + admin) đều `done` → set GDD status → `InQC`, Telegram notify agent_qc.

**Gate**: Chỉ process GDD có `**Trạng thái**: Review`. Bỏ qua Draft/InDev/InQC/Done/Flagged.

---

### 2.3 agent_qc — Verita (QA Engineer)

| Thuộc tính | Giá trị |
|-----------|--------|
| Nickname | Verita |
| Role | QA Engineer |
| Cron | `:12, :27, :42, :57` (15 phút) + Mon 9am weekly digest |
| Input | `design/*.md` + `src/**/*.js` |
| Output | `reports/quality-*.md` + `src/tests/` + `reports/smoke-test-*.md` |
| AGENTS.md | **411 dòng** (lớn nhất) |

**Workflow (6 parts):**
- **Part A** — GDD → Testcases: Sections 4+8 của GDD → `reports/testcases-*.md` + test skeleton
- **Part B** — Code → Run Tests: `npm test` → parse output → `reports/quality-YYYY-MM-DD-HH-mm.md`
- **Part C** — GDD Evaluation: Đánh giá độc lập (authoritative) với GDD-EVAL-RUBRIC
- **Part D** — Code Review: Chỉ process GDD `status = InQC`; CODE-EVAL-RUBRIC (100pt, pass ≥ 80); FLAG nếu diff ≥ 20pt so với self-eval; set status → Done/Flagged
- **Part E** — Test Generation: Generate `.test.ts` (TypeScript) + `.test.kt` (Kotlin) + `Test.java` (Java)
- **Part F** — Smoke Test: 6 health checks → `pipeline-health.json` → alert DEGRADED/BROKEN

**Gate Part D**: Chỉ review GDD có `**Trạng thái**: InQC`. Bỏ qua tất cả status khác.

---

### 2.4 agent_dev_client — Pixel (Frontend Dev)

| Thuộc tính | Giá trị |
|-----------|--------|
| Nickname | Pixel |
| Role | Frontend Code Generator |
| Cron | `:17, :47` (30 phút) |
| Stack | TypeScript, Vite, Cocos2d-x, EventEmitter3 |
| Input | `analysis/REQ-*.md` + `analysis/DESIGN-*.md` (client layer) |
| Output | `src/client/<feature>/` + `eval/CODE-EVAL-client-*.md` |
| AGENTS.md | 104 dòng |

**Trigger**: Poll `agent_dev_dispatched.json` → xử lý TẤT CẢ features có `client_status = "dispatched"` tuần tự (cũ nhất trước).

---

### 2.5 agent_dev_server — Forge (Backend Dev)

| Thuộc tính | Giá trị |
|-----------|--------|
| Nickname | Forge |
| Role | Backend Code Generator |
| Cron | `:19, :49` (30 phút) |
| Stack | Kotlin, Ktor 3.4.0, Actor model, Exposed ORM, KSP |
| Input | `analysis/DESIGN-*.md` (server layer) |
| Output | `src/server/<feature>/` + `eval/CODE-EVAL-server-*.md` |
| AGENTS.md | 101 dòng |

**Core rules**: Output vào staging `src/server/`, sealed classes cho state machine, không blocking calls, KSP annotations cho serialization.

---

### 2.6 agent_dev_admin — Panel (Admin Dev)

| Thuộc tính | Giá trị |
|-----------|--------|
| Nickname | Panel |
| Role | Admin Tool Code Generator |
| Cron | `:21, :51` (30 phút) |
| Stack | Java, React, REST API, Token auth |
| Input | `analysis/DESIGN-*.md` (admin layer) |
| Output | `src/admin/<feature>/` + `eval/CODE-EVAL-admin-*.md` |
| AGENTS.md | 103 dòng |

**Core rules**: Endpoints phải match DESIGN file chính xác, không tự invent API, Token auth bắt buộc.

---

## 3. Cron Jobs — Timing Map

```
Weekdays 8h–22h:

:00 ─── agent_gd        scan concepts/        → tạo GDD
:07 ─── agent_dev       scan design/          → dispatch
:12 ─── agent_qc        scan design/ + src/   → test + review + smoke
:17 ─── agent_dev_client  scan dispatched.json → implement TypeScript
:19 ─── agent_dev_server  scan dispatched.json → implement Kotlin
:21 ─── agent_dev_admin   scan dispatched.json → implement Java+React
:32 ─── (next cycle) ...

Monday 9am:
        agent_qc        WEEKLY_DIGEST         → tổng kết tuần
```

**Thiết kế offset**: Main agents cách nhau 5-7 phút (đảm bảo GDD xong trước khi Dev chạy). Implementation agents cách nhau 2 phút (tránh race condition trên `dispatched.json`).

---

## 4. GDD Pipeline — Status Flow

```
[agent_gd tạo GDD]
      ↓
    Draft           (score 50–69)
      ↓
    Review          (score ≥ 70) ← agent_dev gate
      ↓
    InDev           (agent_dev dispatch xong)
      ↓
    InQC            (tất cả layers client+server+admin done) ← agent_qc gate
      ↓         ↓
   Done        Flagged
 (pass ≥ 80)  (diff ≥ 20pt hoặc score < 80 → human review)
```

**Ghi trực tiếp vào GDD header** — 4 fields:
```markdown
**Trạng thái**: Review | InDev | InQC | Done | Flagged
**Pipeline agent**: agent_gd | agent_dev | agent_qc | COMPLETE | HUMAN_REVIEW
**Cập nhật lần cuối bởi**: <agent_id>
**Cập nhật lần cuối lúc**: YYYY-MM-DDTHH:MM:SS+07:00
```

---

## 5. State Management

### Schema Chuẩn (SCHEMA.md)

Tất cả 6 agents dùng chung schema:

```json
{
  "filename.ext": {
    "hash": "MD5_HEX_32CHARS_UPPERCASE",
    "processedAt": "2026-03-19T10:00:00+07:00",
    "status": "pending|processing|done|skipped|error",
    "notes": "optional"
  }
}
```

**Hash Fallback Chain**: PowerShell `Get-FileHash` → Bash `md5sum` → Pseudo-hash `SIZE<N>-HEAD<...>`

### State Files Hiện Tại

| File | Trạng thái |
|------|-----------|
| `agent_gd_processed.json` | 1 concept processed (score 93, Review) |
| `agent_dev_processed.json` | 1 GDD đang pending (scores null) |
| `agent_dev_dispatched.json` | `{}` — chưa dispatch |
| `agent_qc_processed.json` | 3 templates done |
| `agent_qc_meta.json` | Rỗng (chưa có code review/test gen) |
| `pipeline-health.json` | UNKNOWN (smoke test chưa chạy) |

---

## 6. Smoke Test — Pipeline Health

agent_qc chạy **6 health checks** cuối mỗi WORKSPACE_SCAN:

| Check | Mô tả | Exempt khỏi BROKEN? |
|-------|-------|-------------------|
| C1 | `concepts/` có ≥ 1 .md (non-README) | Không |
| C2 | `design/` có ≥ 1 `GDD-FEATURE-*.md` | Không |
| C3 | GDDs có `**Trạng thái**:` header | Không |
| C4 | `src/` có ≥ 1 subfolder non-empty | Không |
| C5 | `reports/quality-*.md` trong 24h | **Có** ← startup exempt |
| C6 | 4 state JSONs valid | Không |

**Verdict**: HEALTHY (0 fail) → DEGRADED (≥ 1 fail) → BROKEN (≥ 4 core fail hoặc C6 fail)
**Alert**: BROKEN = `🔴`, DEGRADED = `⚠️`, HEALTHY = silent

---

## 7. Timeline Hoàn Thành

### Round 1 — Foundation ✅
*2026-03-17 → 2026-03-18*
- Workspace structure (11 folders)
- 3 agents cơ bản (agent_gd, agent_dev, agent_qc) + SOUL/AGENTS/HEARTBEAT
- OpenClaw config + CRON_SETUP.md
- Smoke test Telegram ✅

### Round 2 — Specialization ✅
*2026-03-18*
- **Phase 2.1**: agent_gd nâng cấp — GDD templates, rubric, 10-section workflow
- **Phase 2.2**: agent_dev nâng cấp — Tech Lead role, 4-phase pipeline, CODE-EVAL-RUBRIC, 3 implementation agents mới
- **Phase 2.3**: agent_qc nâng cấp — Part D (Code Review) + Part E (Test Generation)

### Round 3 — Automation ✅
*2026-03-19*
- **Spec 3.1**: Schema chuẩn + 6 HEARTBEAT.md đầy đủ
- **Spec 3.2**: GDD status coordination (Draft→Review→InDev→InQC→Done/Flagged)
- **Spec 3.3**: Smoke test Part F + pipeline-health.json
- **Cron Jobs**: 7/7 jobs active (thêm 3 implementation agents)

### Round 4 — Production ⬜ TODO
- Error Handling & Retry Policy
- Monitoring Dashboard
- Documentation & Runbooks

---

## 8. Artifacts Đã Tạo Thực Tế Bởi Agents

| Loại | File | Agent tạo | Ghi chú |
|------|------|-----------|--------|
| GDD Feature | `design/GDD-FEATURE-elemental-hunter.md` | agent_gd | Score 93/100, status InDev |
| GDD Eval | `eval/GDD-EVAL-elemental-hunter-2026-03-19.md` | agent_gd | ĐẠT |
| Quality Reports | `reports/quality-2026-03-18-*.md` (9 files) | agent_qc | Cuối cùng: 175/175 PASS |
| Testcases | `reports/testcases-gdd-overview-v2-elemental-hunter.md` | agent_qc | CM, Combo, Edge Case |
| Source Code | `src/elemental-hunter.js` + test files | agent_dev/qc | Skeleton |

---

## 9. Gaps & Điểm Cần Chú Ý

| # | Gap | Mức độ | Ghi chú |
|---|-----|--------|--------|
| G1 | `analysis/` rỗng — agent_dev chưa dispatch | 🔴 Critical | Pipeline bị block ở agent_dev → elemental-hunter chưa có REQ/DESIGN docs |
| G2 | `pipeline-health.json` = UNKNOWN | 🟡 Medium | Smoke test chưa chạy lần nào — chưa có baseline |
| G3 | IDENTITY.md rỗng cho tất cả 6 agents | 🟢 Low | Điền sau first conversation — bình thường |
| G4 | GDD status `InDev` nhưng dispatch rỗng | 🔴 Critical | Inconsistency: header set InDev nhưng không có actual dispatch |
| G5 | Round 4 chưa bắt đầu | 🟡 Medium | Error handling & monitoring chưa implement |

**Giải thích G4**: GDD elemental-hunter hiện có `status: InDev` (do agent_dev đã update header), nhưng `agent_dev_dispatched.json = {}`. Điều này xảy ra vì agent_dev update header trước khi hoàn thành Phase 1+2+3. Cần agent_dev chạy lại để produce `analysis/REQ-*.md` + `analysis/DESIGN-*.md` và thực sự dispatch.

---

## 10. Constitution — 7 Nguyên Tắc Cốt Lõi

| # | Nguyên tắc | Ý nghĩa |
|---|-----------|--------|
| 1 | **Workspace as Truth** | `ccn2_workspace/` là nguồn sự thật duy nhất |
| 2 | **Push-based** | Agents chủ động push output, không poll nhau |
| 3 | **Idempotent** | Chạy lại cùng input → cùng output |
| 4 | **Single Responsibility** | Mỗi agent chỉ làm 1 việc |
| 5 | **State Tracking** | Mọi output đều được track trong state JSON |
| 6 | **Quality Gate** | Không pass gate = không tiến sang phase tiếp theo |
| 7 | **Evidence Before Completion** | Không claim done nếu không có artifact |

---

*Report generated: 2026-03-19 | William Đào 👌*
