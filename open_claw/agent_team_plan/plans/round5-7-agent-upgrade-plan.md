# Kế Hoạch Nâng Cấp Agent Team — Round 5, 6, 7

**Phiên bản**: v1.0
**Ngày lập**: 2026-03-20
**Tác giả**: William Đào 👌
**Trạng thái**: DRAFT → cần review trước khi implement

---

## Tóm Tắt Executive

Hệ thống agent team hiện tại (sau Round 4) hoạt động tốt theo mô hình **polling + cron + file-based state**. Ba round tiếp theo sẽ nâng cấp lên mô hình **event-driven với 3 trụ cột mới**:

| Round | Trụ cột | Mục tiêu |
|-------|---------|----------|
| Round 5 | CLI Agent Communication | Agent gọi agent trực tiếp qua `openclaw agent --agent <id> -m "..."` |
| Round 6 | Action Logging & Monitoring | Mọi action của agent được log → human debug được |
| Round 7 | Human Ticket System | Human gửi ticket trực tiếp vào pipeline, tracking end-to-end |

---

## Bối Cảnh — Trạng Thái Sau Round 4

### Kiến trúc hiện tại

```
Human → concept file → (cron 15') → agent_gd → design/ → (cron 15') → agent_dev
      → analysis/ → dispatched.json → (cron 15') → agent_dev_server/client/admin
      → src/code → (cron 15') → agent_qc → reports/
```

**Điểm mạnh đã có:**
- 6 agents với AGENTS.md, SOUL.md, HEARTBEAT.md, IDENTITY.md đầy đủ
- `.state/` JSON tracking rõ ràng (processed, dispatched, bug-tracker, pipeline-health)
- Bug flow hoàn chỉnh (BUG-TEMPLATE → triage → domain routing → verify)
- Playtest pipeline (smoke-test.ps1 + C7_playtest)
- Single Source of Truth: agents ghi thẳng vào `playtest/`

**Điểm yếu cần giải quyết:**
1. **Độ trễ 15 phút** giữa các agent do cron polling
2. **Không có tracing** — không biết agent nghĩ gì, dùng tool gì, tại sao ra kết quả đó
3. **Input từ human** phải tạo file thủ công trong `concepts/` — không có channel trực tiếp
4. **Pipeline blocking** — agent downstream không biết khi upstream xong (phải chờ cron)

---

## Round 5 — CLI Agent Communication Protocol

### Mục tiêu

Thay thế giao tiếp agent-to-agent từ **file polling** sang **CLI direct call** sau khi hoàn thành task. Không bỏ cron (giữ làm fallback), nhưng event-driven là primary.

### Spec 5.1 — Định Nghĩa CLI Command

**Format chuẩn:**
```bash
openclaw agent --agent <agent_id> -m "<prompt_message>"
```

**Ví dụ thực tế:**
```bash
# agent_gd sau khi tạo GDD xong → gọi agent_dev
openclaw agent --agent agent_dev -m "Follow HEARTBEAT.md instructions exactly. New GDD ready: design/GDD-FEATURE-main-gameplay.md (hash: A3F2B1). Process immediately — do not wait for cron cycle."

# agent_dev sau khi dispatch xong → gọi agent_dev_server + agent_dev_client song song
openclaw agent --agent agent_dev_server -m "Follow HEARTBEAT.md instructions exactly. Dispatch received for feature: main-gameplay. GDD: design/GDD-FEATURE-main-gameplay.md, Design: analysis/DESIGN-main-gameplay.md, Output: playtest/server/src/main/kotlin/playtest/. Priority: HIGH."
openclaw agent --agent agent_dev_client -m "Follow HEARTBEAT.md instructions exactly. Dispatch received for feature: main-gameplay. GDD: design/GDD-FEATURE-main-gameplay.md, Design: analysis/DESIGN-main-gameplay.md, Output: playtest/client/src/. Format: Vanilla JS. Priority: HIGH."

# agent_dev_server sau khi xong → gọi agent_dev update status
openclaw agent --agent agent_dev -m "agent_dev_server reporting: feature=main-gameplay, status=done, score=88, output_file=playtest/server/src/main/kotlin/playtest/MainGameplay.kt"
```

**Agent IDs:**
| Agent | ID |
|-------|----|
| Designia | `agent_gd` |
| Codera | `agent_dev` |
| Forge | `agent_dev_server` |
| Pixel | `agent_dev_client` |
| Panel | `agent_dev_admin` |
| Verita | `agent_qc` |

### Spec 5.2 — Message Protocol (Chuẩn hóa)

Mỗi message từ agent đến agent phải follow format:

```
Follow HEARTBEAT.md instructions exactly. <TRIGGER_TYPE>: <CONTEXT_BLOCK>
```

**Trigger types chuẩn:**
| Type | Ý nghĩa |
|------|---------|
| `TASK_READY` | Upstream xong, downstream cần process |
| `STATUS_UPDATE` | Agent báo cáo kết quả lên upstream |
| `BUG_ASSIGNED` | Bug đã route, agent cần fix |
| `REVIEW_REQUESTED` | Yêu cầu Verita review ngay |
| `PIPELINE_ALERT` | Cảnh báo blocking/failure |

**Context block structure:**
```
feature=<name>, gdd_path=<path>, design_path=<path>, output_path=<path>,
priority=<HIGH|NORMAL|LOW>, ticket_id=<TICKET-xxx|null>
```

### Spec 5.3 — Cập Nhật Chain Call Cho 6 Agents

#### agent_gd (Designia) — Sau khi tạo GDD
```
AFTER GDD saved to design/:
  1. openclaw agent --agent agent_dev -m "TASK_READY: feature=<name>, gdd_path=<path>, trigger=gdd_created"
  2. Ghi action log: action_type=gd_chain_call, target=agent_dev
```

#### agent_dev (Codera) — Sau Phase 4 Dispatch
```
AFTER dispatch analysis complete:
  FOR EACH layer (server/client/admin) IF needed:
    openclaw agent --agent agent_dev_<layer> -m "TASK_READY: feature=<name>, gdd_path=<path>, design_path=<path>, output_path=<path>, priority=<P>"
  Ghi action log: action_type=dev_dispatch_chain, targets=[agent_dev_server, agent_dev_client, agent_dev_admin]
```

#### agent_dev_server/client/admin — Sau khi implement xong
```
AFTER implementation complete:
  openclaw agent --agent agent_dev -m "STATUS_UPDATE: feature=<name>, layer=<server|client|admin>, status=done, score=<N>, output=<file>"
```

#### agent_dev (Codera) — Khi tất cả layers done
```
IF all required layers status=done:
  UPDATE GDD header: Trạng thái=InQC, Pipeline agent=agent_qc
  openclaw agent --agent agent_qc -m "REVIEW_REQUESTED: feature=<name>, gdd_path=<path>, code_paths=[<list>]"
```

#### agent_qc (Verita) — Sau review
```
AFTER QC complete:
  openclaw agent --agent agent_dev -m "STATUS_UPDATE: feature=<name>, qc_status=<passed|failed>, score=<N>, report=<path>"
```

### Spec 5.4 — Cron Strategy (Hybrid)

**Giữ nguyên cron** nhưng thay đổi vai trò:

| Cron job | Interval | Vai trò mới |
|----------|----------|-------------|
| agent_gd | 30 phút | Fallback — catch file changes mà CLI miss |
| agent_dev | 30 phút | Fallback — poll dispatched.json cho stuck features |
| agent_dev_* | 30 phút | Fallback — retry nếu direct call fail |
| agent_qc | 15 phút | Smoke test vẫn cần cron (C1-C7 checks) |

**Rule**: Khi agent nhận direct CLI call → xử lý ngay, **không chờ cron**. Nếu 60 phút không có CLI call → cron chạy như cũ.

---

## Round 6 — Action Logging & Monitoring

### Mục tiêu

Mỗi agent log lại **toàn bộ quá trình xử lý** một task: từ input nhận được → suy nghĩ → công cụ dùng → output tạo ra. Human có thể xem lại để debug tại sao agent làm sai.

### Spec 6.1 — Action Log Schema

**Vị trí**: `.state/action-logs/<agent-id>/<YYYY-MM-DD>/`

**File naming**: `<ISO8601>-<task-slug>.jsonl` (JSON Lines — mỗi dòng 1 action)

**Action entry format:**
```json
{
  "action_id": "act-001",
  "session_id": "sess-2026-03-20T10:00:00",
  "agent": "agent_gd",
  "ticket_id": "TICKET-001",
  "feature": "main-gameplay",
  "timestamp": "2026-03-20T10:01:23+07:00",
  "action_type": "read_file | write_file | hash_check | api_call | chain_call | eval | telegram",
  "input": {
    "description": "Đọc concept file để lấy mô tả feature",
    "data": "concepts/main-gameplay.md"
  },
  "thinking": {
    "summary": "File có priority High và 3 mechanics chính: A, B, C. Cần tạo GDD với 10 sections.",
    "key_decisions": ["Dùng DIAMOND currency (không dùng KC)", "Section 4 cần ≥3 edge cases"]
  },
  "tool_used": "Read",
  "output": {
    "description": "Đọc thành công, 450 bytes",
    "result": "success"
  },
  "duration_ms": 234,
  "status": "success | error | skipped"
}
```

**Session summary** (cuối mỗi session):
```json
{
  "action_id": "SUMMARY",
  "session_id": "sess-2026-03-20T10:00:00",
  "agent": "agent_gd",
  "ticket_id": "TICKET-001",
  "total_actions": 12,
  "total_duration_ms": 45000,
  "outcome": "success",
  "output_files": ["design/GDD-FEATURE-main-gameplay.md"],
  "chain_calls": ["agent_dev"],
  "errors": []
}
```

### Spec 6.2 — Cập Nhật HEARTBEAT.md Cho 6 Agents

Mỗi agent phải **bắt đầu session** bằng cách tạo session ID:
```
session_id = "sess-<ISO8601>"
action_counter = 0
```

**Sau mỗi action đáng kể**, agent ghi 1 entry vào log:
```
log_action(session_id, agent_id, action_type, input, thinking, tool, output)
```

**Actions đáng kể cần log:**
- Đọc file quan trọng (GDD, concept, design)
- Hash check (result + decision)
- Viết file output
- Self-eval (score + decision)
- Chain call (CLI gọi agent khác)
- Telegram notify
- Error/skip

**Actions không cần log:**
- Đọc metadata, config nhỏ
- Internal variable assignment

### Spec 6.3 — Action Log Viewer (Dashboard)

Cập nhật `reports/dashboard.html` thêm tab **"Action Logs"**:

**Features:**
- Dropdown chọn agent + ngày
- Timeline view: mỗi action là 1 card có màu theo type
- Click action → expand chi tiết (thinking, input, output)
- Filter theo: feature, ticket_id, status=error
- "Replay mode" — bấm play để xem lại từng bước theo thứ tự

**Màu sắc action type:**
| Type | Màu |
|------|-----|
| read_file | 🔵 Xanh dương |
| write_file | 🟢 Xanh lá |
| hash_check | ⚪ Xám |
| eval | 🟡 Vàng |
| chain_call | 🟣 Tím |
| error | 🔴 Đỏ |
| telegram | 🟠 Cam |

### Spec 6.4 — State Schema Bổ Sung

**`.state/SCHEMA.md`** thêm Section 12 — action-logs:
```
.state/action-logs/
  agent_gd/
    2026-03-20/
      10-00-00-main-gameplay.jsonl     ← session log
  agent_dev/
    2026-03-20/
      11-00-00-main-gameplay.jsonl
  ...
```

**Retention policy**: Giữ 7 ngày gần nhất, agent_qc auto-cleanup cũ hơn.

---

## Round 7 — Human Ticket System

### Mục tiêu

Thay vì human phải tạo file trong `concepts/` và chờ cron, human có thể **gửi ticket trực tiếp** vào hệ thống. Agent nhận ticket, xử lý theo workflow, chain-call các agent tiếp theo, và cuối cùng notify human khi hoàn thành.

### Spec 7.1 — Ticket Schema

**Vị trí**: `tickets/TICKET-<YYYY-MM-DD>-<slug>.md`

**Template:**
```markdown
# TICKET-2026-03-20-main-gameplay

**Ticket ID**: TICKET-2026-03-20-main-gameplay
**Ngày tạo**: 2026-03-20T10:00:00+07:00
**Requester**: Daniel (human)
**Target Agent**: agent_gd
**Priority**: High | Medium | Low
**Trạng thái**: open | in_progress | done | failed

## Mô tả yêu cầu
Xây dựng feature main gameplay cho Elemental Hunter.
Tham khảo file đặc tả: GDD_Overview_v2_ElementalHunter.md

## Attachments
- File: research_doc/open_claw/GDD_Overview_v2_ElementalHunter.md
- File: (optional thêm file khác)

## Kết quả mong đợi
- GDD hoàn chỉnh tại design/GDD-FEATURE-main-gameplay.md
- Code server tại playtest/server/src/main/kotlin/playtest/MainGameplay.kt
- Code client tại playtest/client/src/mainGameplay.js
- Test cases tại reports/testcases-main-gameplay.md

## Lịch sử xử lý
| Agent | Thời gian | Action | Kết quả |
|-------|-----------|--------|---------|
| (auto-filled by agents) | | | |
```

### Spec 7.2 — Ticket State Tracker

**`.state/ticket-tracker.json`**:
```json
{
  "TICKET-2026-03-20-main-gameplay": {
    "ticket_file": "tickets/TICKET-2026-03-20-main-gameplay.md",
    "target_agent": "agent_gd",
    "priority": "High",
    "status": "in_progress",
    "created_at": "2026-03-20T10:00:00+07:00",
    "started_at": "2026-03-20T10:01:00+07:00",
    "completed_at": null,
    "pipeline_steps": [
      { "agent": "agent_gd", "status": "done", "output": "design/GDD-FEATURE-main-gameplay.md" },
      { "agent": "agent_dev", "status": "done", "output": "analysis/DESIGN-main-gameplay.md" },
      { "agent": "agent_dev_server", "status": "in_progress", "output": null },
      { "agent": "agent_dev_client", "status": "pending", "output": null },
      { "agent": "agent_qc", "status": "pending", "output": null }
    ],
    "action_log_sessions": [
      "agent_gd/2026-03-20/10-01-00-main-gameplay",
      "agent_dev/2026-03-20/11-00-00-main-gameplay"
    ]
  }
}
```

### Spec 7.3 — Human → Agent Flow

#### Cách 1: CLI trực tiếp (ưu tiên)
```bash
openclaw agent --agent agent_gd -m "TICKET: ticket_id=TICKET-2026-03-20-main-gameplay, ticket_file=tickets/TICKET-2026-03-20-main-gameplay.md, priority=High"
```

#### Cách 2: Tạo file ticket + cron pick up
Human tạo `tickets/TICKET-<date>-<slug>.md` → cron agent_gd scan `tickets/` → xử lý ticket `open`

**agent_gd scan tickets/ logic** (thêm vào HEARTBEAT.md):
```
BEFORE concept scan:
  LIST tickets/TICKET-*.md
  FOR EACH ticket WHERE status=open AND target_agent=agent_gd:
    → Process ticket như process concept
    → UPDATE ticket status=in_progress
    → APPEND lịch sử xử lý vào ticket file
    → Sau khi GDD xong → chain call agent_dev kèm ticket_id
```

### Spec 7.4 — Ticket Tracking Theo Pipeline

Khi agent nhận CLI call kèm `ticket_id`, agent:
1. Cập nhật `ticket-tracker.json`: pipeline step của mình → `in_progress`
2. Thực hiện task bình thường
3. Sau xong: cập nhật pipeline step → `done`, ghi output file
4. Thêm row vào bảng "Lịch sử xử lý" trong ticket file
5. Chain call agent tiếp theo **kèm ticket_id**

**Kết thúc pipeline** (agent_qc xong):
```
IF tất cả pipeline steps = done:
  UPDATE ticket status = done
  UPDATE ticket completed_at = <now>
  Telegram: "✅ TICKET <id> HOÀN THÀNH — toàn bộ pipeline done.
            Summary: GDD✅ Analysis✅ Server✅ Client✅ QC✅"
```

### Spec 7.5 — Dashboard Bổ Sung Tab "Tickets"

`reports/dashboard.html` thêm tab **"Tickets"**:
- Bảng tickets: ID | Priority | Status | Target Agent | Started | Done | Duration
- Click ticket → xem chi tiết pipeline steps + link đến action logs
- Filter: open / in_progress / done / failed
- Sort: theo priority, theo thời gian

---

## Phân Tích Rủi Ro

| Rủi ro | Xác suất | Impact | Mitigation |
|--------|----------|--------|------------|
| openclaw CLI chưa có `--agent` flag | Cao | Blocking R5 | Verify CLI capabilities trước Round 5; fallback = direct bash prompt |
| Action logs quá lớn (disk space) | Trung bình | Moderate | 7-day retention, agent_qc auto-cleanup |
| Agents không follow chain call protocol | Trung bình | High | Cập nhật SOUL.md + test với 1 agent trước |
| Ticket tracker conflict (2 agents ghi cùng lúc) | Thấp | Low | JSON merge strategy, last-write-wins |
| Breaking change làm hỏng cron cũ | Thấp | High | Giữ cron intact, thêm event-driven trên top |

---

## Dependencies Giữa Các Round

```
Round 4 (DONE) ──┐
                  ↓
          Round 5 (CLI Protocol)   ← PHẢI làm trước
                  ↓
          Round 6 (Action Logging) ← Dùng CLI từ R5 để chain logs
                  ↓
          Round 7 (Ticket System)  ← Dùng cả CLI + logs từ R5+R6
```

Round 5 là foundation. Không nên bỏ qua R5 để làm R6 hoặc R7.

---

## Task Breakdown Chi Tiết

### Round 5 — 12 tasks

| Task | Mô tả | File cần sửa/tạo | Ước tính |
|------|-------|------------------|----------|
| T5.1 | Verify `openclaw agent --agent <id> -m "..."` hoạt động | N/A (test CLI) | 30' |
| T5.2 | Viết CLI Protocol Spec vào `.state/SCHEMA.md` (Section 12) | `.state/SCHEMA.md` | 1h |
| T5.3 | Cập nhật agent_gd HEARTBEAT: chain call agent_dev sau GDD | `agent_gd/HEARTBEAT.md` | 45' |
| T5.4 | Cập nhật agent_dev AGENTS.md: chain call sau Phase 4 dispatch | `agent_dev/AGENTS.md` | 1h |
| T5.5 | Cập nhật agent_dev_server HEARTBEAT: STATUS_UPDATE sau done | `agent_dev_server/HEARTBEAT.md` | 30' |
| T5.6 | Cập nhật agent_dev_client HEARTBEAT: STATUS_UPDATE sau done | `agent_dev_client/HEARTBEAT.md` | 30' |
| T5.7 | Cập nhật agent_dev_admin HEARTBEAT: STATUS_UPDATE sau done | `agent_dev_admin/HEARTBEAT.md` | 30' |
| T5.8 | Cập nhật agent_dev AGENTS.md: InDev→InQC chain call agent_qc | `agent_dev/AGENTS.md` | 30' |
| T5.9 | Cập nhật agent_qc HEARTBEAT: STATUS_UPDATE sau QC | `agent_qc/HEARTBEAT.md` | 30' |
| T5.10 | Đổi cron interval: 15'→30' cho agents (trừ agent_qc) | OpenClaw cron config | 15' |
| T5.11 | Test end-to-end: concept → agent_gd → CLI → agent_dev | Manual test | 2h |
| T5.12 | Cập nhật docs/ARCHITECTURE.md + docs/HOWTO-*.md | docs/*.md | 1h |

### Round 6 — 9 tasks

| Task | Mô tả | File cần sửa/tạo | Ước tính |
|------|-------|------------------|----------|
| T6.1 | Viết Action Log Schema vào `.state/SCHEMA.md` (Section 13) | `.state/SCHEMA.md` | 45' |
| T6.2 | Tạo `.state/action-logs/` directory structure | N/A (mkdir) | 5' |
| T6.3 | Cập nhật agent_gd HEARTBEAT: log actions | `agent_gd/HEARTBEAT.md` | 1h |
| T6.4 | Cập nhật agent_dev HEARTBEAT: log actions | `agent_dev/HEARTBEAT.md` | 1h |
| T6.5 | Cập nhật agent_dev_server/client/admin HEARTBEAT: log | 3 HEARTBEAT.md files | 1.5h |
| T6.6 | Cập nhật agent_qc HEARTBEAT: log + cleanup old logs | `agent_qc/HEARTBEAT.md` | 1h |
| T6.7 | Cập nhật dashboard.html: thêm tab Action Logs | `reports/dashboard.html` | 3h |
| T6.8 | Cập nhật `.state/README.md` với action-logs structure | `.state/README.md` | 30' |
| T6.9 | Test: chạy 1 feature end-to-end, kiểm tra log đủ thông tin | Manual test | 2h |

### Round 7 — 10 tasks

| Task | Mô tả | File cần sửa/tạo | Ước tính |
|------|-------|------------------|----------|
| T7.1 | Tạo `tickets/TICKET-TEMPLATE.md` | `tickets/TICKET-TEMPLATE.md` | 30' |
| T7.2 | Tạo `tickets/README.md` hướng dẫn human | `tickets/README.md` | 30' |
| T7.3 | Viết Ticket Schema vào `.state/SCHEMA.md` (Section 14) | `.state/SCHEMA.md` | 45' |
| T7.4 | Khởi tạo `ticket-tracker.json` | `.state/ticket-tracker.json` | 10' |
| T7.5 | Cập nhật agent_gd HEARTBEAT: scan tickets/ + process ticket | `agent_gd/HEARTBEAT.md` | 1.5h |
| T7.6 | Cập nhật tất cả agents: propagate ticket_id trong chain calls | 6 HEARTBEAT.md + AGENTS.md | 2h |
| T7.7 | Cập nhật agents: ghi lịch sử vào ticket file sau mỗi step | 6 HEARTBEAT.md | 1.5h |
| T7.8 | Cập nhật agent_qc: final notification khi ticket done | `agent_qc/HEARTBEAT.md` | 1h |
| T7.9 | Cập nhật dashboard.html: thêm tab Tickets | `reports/dashboard.html` | 3h |
| T7.10 | Test end-to-end: tạo ticket → toàn pipeline → done notify | Manual test | 3h |

---

## Định Nghĩa "Done" Cho Mỗi Round

### Round 5 Done Criteria
- [ ] `openclaw agent --agent agent_gd -m "..."` hoạt động
- [ ] agent_gd sau khi tạo GDD tự động gọi agent_dev ngay (không chờ cron)
- [ ] agent_dev sau Phase 4 gọi agent_dev_server/client/admin song song
- [ ] agent_dev_server/client/admin sau xong báo lại agent_dev
- [ ] agent_dev khi all layers done gọi agent_qc
- [ ] End-to-end test PASS dưới 30 phút (so với 60-75 phút cron cũ)

### Round 6 Done Criteria
- [ ] Mỗi agent tạo JSONL log file sau mỗi session
- [ ] Log đủ: action_type, input, thinking summary, tool_used, output, duration
- [ ] dashboard.html Tab "Action Logs" hiển thị được timeline
- [ ] Human có thể filter theo ticket_id/feature/error
- [ ] 7-day retention hoạt động (agent_qc cleanup cũ)

### Round 7 Done Criteria
- [ ] Human tạo `tickets/TICKET-xxx.md` → agent_gd tự nhận và xử lý
- [ ] Hoặc: Human chạy CLI → agent nhận ngay
- [ ] ticket-tracker.json cập nhật theo pipeline
- [ ] Bảng "Lịch sử xử lý" trong ticket file được điền đủ
- [ ] Khi xong: Telegram "TICKET done" với summary
- [ ] dashboard.html Tab "Tickets" hiển thị đúng

---

## Thứ Tự Ưu Tiên Recommend

```
Tuần 1: R5 (T5.1 → T5.9) — Verify CLI, update 6 agents
Tuần 1: R5 (T5.10-T5.12) — Test + docs
Tuần 2: R6 (T6.1 → T6.6) — Schema + agent updates
Tuần 2: R6 (T6.7-T6.9)  — Dashboard + test
Tuần 3: R7 (T7.1 → T7.8) — Ticket system
Tuần 3: R7 (T7.9-T7.10) — Dashboard + test
```

**Tổng ước tính**: ~25-30 giờ implement thuần (không tính test + debug)

---

## Câu Hỏi Cần Xác Nhận Trước Khi Implement

1. **CLI syntax**: `openclaw agent --agent <id> -m "..."` — đây có phải exact syntax hiện tại của openclaw không, hay cần điều chỉnh?
2. **Action log storage**: Lưu JSONL trong `.state/action-logs/` hay tạo folder riêng `action-logs/` ở root?
3. **Ticket target**: Agent nhận ticket trực tiếp qua CLI, hay tất cả phải qua agent_gd làm coordinator?
4. **Cron giữ hay bỏ hoàn toàn?** Hiện tại recommend hybrid (cron = fallback, CLI = primary)
5. **`thinking` field trong action log**: Agent tự điền summary suy nghĩ — có cần format cụ thể không?

---

*Kế hoạch này follow SDD pipeline từ speckit: specify → plan → tasks. Bước tiếp theo: review với human, clarify câu hỏi, rồi execute theo thứ tự T5.1 → T5.12 → T6.1...*
