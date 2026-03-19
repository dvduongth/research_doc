# Phân Tích Kiến Trúc: Cron Jobs vs Heartbeat trong CCN2 Agent Team

**Tác giả**: William Đào 👌
**Ngày**: 2026-03-19
**Loại tài liệu**: Phân tích kiến trúc — giải thích thiết kế hệ thống

---

## Tóm tắt

Cron jobs và heartbeat **không phải** hai phương án thay thế nhau — chúng là **hai tầng khác nhau** trong cùng một kiến trúc. Cron jobs là cơ chế **khi nào** agent thức dậy; heartbeat là **làm gì** khi agent thức dậy. Sự kết hợp của hai thứ này tạo nên một hệ thống agent team vừa hiệu quả tài nguyên, vừa chịu lỗi tốt, vừa quan sát được.

---

## 1. Định nghĩa rõ hai khái niệm

### 1.1 Cron Jobs — "Đồng hồ báo thức"

Cron job là lịch chạy **cấp hệ thống** được quản lý bởi OpenClaw scheduler. Nó:

- Hoàn toàn độc lập với agent — chạy dù agent session trước có crash hay không
- Fire một **event** vào đúng thời điểm được cấu hình
- Tạo ra một **isolated session mới** cho agent mỗi lần trigger
- Không quan tâm đến nội dung — chỉ gửi payload `WORKSPACE_SCAN` vào session

```json
// Cron job chỉ biết: KÍCH HOẠT AGENT GD LÚC :00 MỖI 15 PHÚT
{
  "schedule": { "kind": "cron", "expr": "*/15 8-22 * * 1-5" },
  "payload": { "text": "WORKSPACE_SCAN: Follow HEARTBEAT.md instructions exactly..." }
}
```

**Cron job không chứa logic nghiệp vụ.** Nó chỉ là trigger.

---

### 1.2 Heartbeat / AGENTS.md — "Bản hướng dẫn khi thức dậy"

HEARTBEAT.md (hoặc phần workflow trong AGENTS.md) là **bộ hướng dẫn** mà agent đọc và thực thi mỗi lần được cron trigger. Nó:

- Chứa toàn bộ logic nghiệp vụ của agent
- Định nghĩa **thứ tự các bước** phải thực hiện
- Xác định **điều kiện thoát sớm** (HEARTBEAT_OK khi không có gì để làm)
- Không tự chạy — cần cron trigger mới kích hoạt

```
// HEARTBEAT.md chứa logic: ĐỌC state, SO SÁNH hash, NẾU có thay đổi thì IMPLEMENT
1. Read dispatched.json
2. Compute hash → compare với hash cũ
3. If hash không đổi → reply HEARTBEAT_OK (không làm gì)
4. If hash đổi → detect features/bugs → process...
```

**HEARTBEAT.md không tự chạy.** Nó cần được cron trigger mới có hiệu lực.

---

## 2. Tại sao dùng Cron Jobs thay vì vòng lặp liên tục?

### Vấn đề của "persistent loop" (agent chạy 24/7)

Nếu agent chạy liên tục trong một session duy nhất:

| Vấn đề | Hậu quả |
|--------|---------|
| Session timeout/crash | Toàn bộ trạng thái trong bộ nhớ mất — không recovery được |
| RAM/CPU tốn liên tục | Chi phí cao dù 99% thời gian không có việc gì để làm |
| Không quan sát được | Khó biết lần cuối agent chạy là khi nào, có thành công không |
| Race condition | Hai trigger đồng thời vào cùng session có thể xung đột state |
| Không thể restart đơn lẻ | Phải kill toàn bộ session để restart một agent |

### Ưu điểm của Cron + Isolated Session

```
[Cron fires :00]
     │
     ▼
[Spawn fresh session] ── đọc state từ .json files ──→ [Thực hiện AGENTS.md]
     │                                                          │
     │                                                          │ ghi kết quả ra .json
     │                                                          ▼
     │                                              [Session kết thúc] ── giải phóng tài nguyên
     │
[Cron fires :15]
     │
     ▼
[Spawn fresh session] ── đọc state mới nhất từ .json ──→ ...
```

**Lợi ích cụ thể:**

1. **Stateless giữa các run** — State sống trong `.json` files, không trong bộ nhớ. Session crash không mất dữ liệu.

2. **Tài nguyên theo nhu cầu** — Agent chỉ chiếm tài nguyên khi thực sự đang làm việc (~2-5 phút mỗi 15 phút). Tương đương 13-33% utilization.

3. **Thoát sớm an toàn** — Khi không có việc, agent chỉ cần reply `HEARTBEAT_OK` và session đóng. Không lãng phí compute.

4. **Chịu lỗi** — `failureAlert.after: 3` nghĩa là cron sẽ alert sau 3 lần liên tiếp thất bại, nhưng vẫn **tiếp tục fire** mỗi 15 phút. Không có điểm single-failure nào chặn toàn bộ hệ thống.

5. **Quan sát được** — OpenClaw ghi lại mỗi lần cron fire: thời điểm, kết quả, output. Dễ debug hơn một loop chạy mãi.

---

## 3. Sự kết hợp trong dự án CCN2

### 3.1 Kiến trúc tổng thể

```
┌─────────────────────────────────────────────────────────────────┐
│                    TẦNG 1: CRON SCHEDULER                       │
│                    (OpenClaw — external)                        │
│                                                                 │
│  agent_gd    :00  ─────────────────────────────────────────┐    │
│  agent_dev   :07  ───────────────────────────────────────┐ │    │
│  agent_qc    :12  ─────────────────────────────────────┐ │ │    │
│  agent_dev_client :17  ───────────────────────────────┐ │ │ │   │
│  agent_dev_server :19  ─────────────────────────────┐ │ │ │ │   │
│  agent_dev_admin  :21  ───────────────────────────┐ │ │ │ │ │   │
└───────────────────────────────────────────────────┼─┼─┼─┼─┼─┼───┘
                                                    │ │ │ │ │ │
                                                    ▼ ▼ ▼ ▼ ▼ ▼
┌─────────────────────────────────────────────────────────────────┐
│                    TẦNG 2: AGENT LOGIC                          │
│                    (AGENTS.md / HEARTBEAT.md)                   │
│                                                                 │
│  agent_gd      AGENTS.md    → scan concepts/ → tạo GDD         │
│  agent_dev     AGENTS.md    → scan design/ → dispatch          │
│  agent_qc      AGENTS.md    → test code → verify bugs          │
│  agent_dev_client AGENTS.md → implement client layer          │
│  agent_dev_server HEARTBEAT.md → implement server layer       │
│  agent_dev_admin  AGENTS.md → implement admin layer           │
└───────────────────────────┬─────────────────────────────────────┘
                            │ đọc/ghi
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    TẦNG 3: SHARED STATE                         │
│                    (.state/*.json files)                        │
│                                                                 │
│  agent_gd_processed.json   — hash của concepts/ đã xử lý      │
│  agent_dev_processed.json  — hash của GDDs đã phân tích        │
│  agent_dev_dispatched.json — dispatch queue cho 3 impl agents  │
│  agent_qc_processed.json   — hash của src/ đã test             │
│  bug-tracker.json          — trạng thái tất cả bugs            │
│  pipeline-health.json      — C1-C7 health checks               │
│  agent_dev_server_state.json — hash của dispatched.json cũ     │
└─────────────────────────────────────────────────────────────────┘
```

**Tầng 3 (state files) là cầu nối** giữa các session độc lập. Không có nó, cron + heartbeat không thể tạo ra continuity.

---

### 3.2 Timing Design — Pipeline trong 1 chu kỳ 15 phút

```
:00 ── agent_gd ─────────────────────────────────────────────────►
         Đọc concepts/*.md
         Hash mới → tạo GDD mới → ghi agent_gd_processed.json
         Telegram batch notify
         Session đóng (~2 phút)

:07 ── agent_dev ────────────────────────────────────────────────►
         Đọc design/GDD-*.md (vừa được gd tạo lúc :00)
         Hash mới → REQ + DESIGN + eval
         Dispatch vào agent_dev_dispatched.json
         Bug triage: tạo dispatch entries cho bugs
         Session đóng (~3 phút)

:12 ── agent_qc ─────────────────────────────────────────────────►
         Test npm → quality report
         Dashboard update
         Playtest smoke (Part I)
         Bug detection + verify (Part J)
         Session đóng (~3 phút)

:17 ── agent_dev_client ─────────────────────────────────────────►
         Đọc dispatched.json (vừa được dev tạo lúc :07)
         Fix bugs (priority) → implement features
         Update dispatched.json client_status

:19 ── agent_dev_server ─────────────────────────────────────────►
         (cùng lúc với client, offset 2 phút tránh race)
         Đọc dispatched.json → fix bugs → implement features
         Update dispatched.json server_status

:21 ── agent_dev_admin ──────────────────────────────────────────►
         (offset +2 tiếp theo)
         Đọc dispatched.json → fix bugs → implement features
         Update dispatched.json admin_status

:32 ── agent_gd ── (chu kỳ tiếp theo) ──────────────────────────►
```

**Thiết kế offset có chủ ý:**
- GD → Dev → QC: mỗi agent có 5-7 phút "đầu ra" trước khi agent tiếp theo cần "đầu vào"
- 3 impl agents cách nhau 2 phút: tránh đọc/ghi đồng thời vào `dispatched.json`
- QC chạy sau Dev: đảm bảo có code mới để test trước khi verify

---

### 3.3 Naming Convention — Tại sao HEARTBEAT.md và AGENTS.md đồng tồn tại?

Dự án CCN2 có sự không nhất quán có lý do:

| File | Agent dùng | Lý do |
|------|-----------|-------|
| `AGENTS.md` | agent_gd, agent_dev, agent_dev_client, agent_dev_admin, agent_qc | Format tổng hợp: identity + workspace + workflow |
| `HEARTBEAT.md` | agent_dev_server | Tách riêng workflow ra file độc lập — dễ cập nhật khi Forge phức tạp hơn |

Về chức năng, **cả hai đều là cùng loại tài liệu**: "bộ hướng dẫn agent đọc khi bị cron trigger". Tên khác nhau không ảnh hưởng cơ chế hoạt động.

---

## 4. Flow hoàn chỉnh: Bug từ manual playtest đến close

Để minh họa cơ chế kết hợp cron + heartbeat, đây là flow end-to-end khi anh phát hiện bug:

```
T+0:00  Anh tạo bugs/BUG-playtest-client-token-not-moving-2026-03-19.md
        Status: open

T+~7ph  Cron fires agent_dev (:07 hoặc :22 tùy lúc)
        AGENTS.md → Bug Triage section
        Đọc bugs/ → thấy bug mới → domain="playtest-client"
        Tạo dispatched.json entry (client_status="dispatched")
        Update bug-tracker.json (status="assigned")
        Telegram: "📋 [Codera] Bug dispatched to Pixel"

T+~17ph Cron fires agent_dev_client (:17 hoặc :47)
        AGENTS.md → Bug Fix Workflow
        Đọc dispatched.json → thấy bugfix entry client_status="dispatched"
        Đọc bug file → fix playtest/client/index.html
        Ghi Fix Notes vào bug file
        Update dispatched.json (client_status="done")
        Update bug-tracker.json (status="fixed")
        Telegram: "✅ [Pixel] Bugfix done: BUG-playtest-client-..."

T+~30ph Cron fires agent_qc (:12 hoặc :27 tùy lúc)
        AGENTS.md → Part J.2 Verify fixed bugs
        Thấy bug status="fixed"
        Verify: check BUGFIX comment trong index.html → tìm thấy
        Update bug-tracker.json (status="closed")
        Telegram: "✅ [Verita] Bug closed: BUG-playtest-client-..."

TỔNG: ~30 phút từ khi anh tạo file đến khi bug được close tự động.
Anh không cần làm gì thêm sau bước tạo file.
```

---

## 5. Các trường hợp đặc biệt và cách hệ thống xử lý

### 5.1 Agent crash giữa chừng

```
agent_dev_server đang implement feature X
Session crash ở giữa task

→ dispatched.json: server_status = "in_progress" (bị treo)
→ Lần cron tiếp theo: agent_dev_server đọc dispatched.json
  → thấy server_status = "in_progress" (từ session cũ)
  → Hash của dispatched.json KHÁC với hash cũ (có "in_progress")
  → Detect → re-process feature X từ đầu
  → Ghi đè output cũ (idempotent)
```

### 5.2 Không có việc gì để làm

```
Cron fires agent_gd lúc :00
→ Đọc agent_gd_processed.json → hash tất cả concepts/ giống nhau
→ HEARTBEAT_OK
→ Session đóng trong ~10 giây
→ Không gửi Telegram, không tốn tài nguyên
```

### 5.3 failureAlert — Khi agent thất bại liên tiếp

```
Job cấu hình failureAlert.after: 3
→ Nếu 3 lần cron liên tiếp mà session throw exception
→ OpenClaw gửi alert (Telegram/email)
→ Cron VẪN TIẾP TỤC fire mỗi 15 phút
→ Không có "circuit breaker" cứng — hệ thống self-healing
```

---

## 6. Tóm tắt vai trò từng thành phần

| Thành phần | Tầng | Trả lời câu hỏi | Ai quản lý |
|-----------|------|----------------|-----------|
| Cron job | 1 — Scheduler | **Khi nào** agent chạy | OpenClaw (cấu hình trong CRON_SETUP.md) |
| AGENTS.md / HEARTBEAT.md | 2 — Logic | **Làm gì** khi chạy | Agent tự đọc |
| `.state/*.json` | 3 — State | **Nhớ gì** giữa các lần chạy | Agent đọc+ghi; persists trên disk |
| Telegram | 4 — Notification | **Thông báo gì** ra ngoài | Agent gửi khi có sự kiện |
| `bugs/`, `reports/`, `eval/` | 5 — Artifacts | **Kết quả** của mỗi run | Agent ghi; human đọc |

---

## 7. Kết luận

Cron jobs và heartbeat là **hai nửa của một hệ thống hoàn chỉnh**. Thiếu một trong hai:

- **Chỉ có cron, không có AGENTS.md**: Agent được trigger nhưng không biết làm gì — payload `WORKSPACE_SCAN` không có instructions rõ ràng để follow.
- **Chỉ có AGENTS.md, không có cron**: Agent có instructions nhưng không bao giờ được gọi — logic nằm im trong file, không có ai trigger.

Sự kết hợp `Cron (khi nào) + AGENTS.md (làm gì) + .json State (nhớ gì)` tạo ra một **pipeline AI agent autonomous** có thể chạy suốt ngày làm việc (8h–22h weekdays) mà không cần human can thiệp — chỉ trừ khi Telegram alert được bắn ra.
