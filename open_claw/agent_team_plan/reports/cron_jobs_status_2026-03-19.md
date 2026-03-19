# CCN2 Cron Jobs Status Report

*Ngày: 2026-03-19*  
*Thời gian: 11:16 Asia/Bangkok*  
*Người báo cáo: Cốm Đào (OpenClaw Agent)*

---

## Tổng quan

Tổng số cron jobs: **7**  
- ✅ **Đang chạy bình thường**: 2
- ❌ **Đang lỗi**: 3
- ⏳ **Chưa chạy lần nào**: 2 (1 đã chạy nhưng lỗi ngay, 1 chưa đến lịch)

---

## Chi tiết từng job

### 1. agent_gd (CCN2 GD — Scan concepts/)

- **Lịch**: Mỗi 15 phút (8:00-22:00, Thứ 2-6)
- **Trạng thái**: ✅ **OK**
- **Lần chạy cuối**: 10:30, kéo dài 104s
- **Next run**: 11:45
- **Ghi chú**: Đang hoạt động tốt, phát hiện concepts và tạo GDD (lưu ý: `GDD_Overview_v2_ElementalHunter.md` bị skip do incompatible với CCN2 ruleset).

---

### 2. agent_dev_client (CCN2 Dev Client — Implement TypeScript/Cocos2d)

- **Lịch**: 8:17, 8:47, 9:17, ... mỗi 30 phút
- **Trạng thái**: ✅ **OK**
- **Lần chạy cuối**: 10:33, 32s
- **Next run**: 11:47
- **Ghi chú**: Scan `dispatched.json` để implement client layer.

---

### 3. agent_dev_server (CCN2 Dev Server — Implement Kotlin/Ktor)

- **Lịch**: 8:19, 8:49, 9:19, ... mỗi 30 phút
- **Trạng thái**: ✅ **OK**
- **Lần chạy cuối**: 10:29, 88s
- **Next run**: 11:49
- **Ghi chú**: Scan `dispatched.json` để implement server layer.

---

### 4. Weekly Quality Digest

- **Lịch**: Thứ 2, 9:00 sáng
- **Trạng thái**: ⏳ **Chưa chạy** (next: 2026-03-23 9:00)
- **Ghi chú**: Job tổng hợp quality reports từ tuần trước.

---

### 5. agent_qc (CCN2 QC — Test automation)

- **Lịch**: 8:12, 8:27, 8:42, ... mỗi 15 phút
- **Trạng thái**: ❌ **LỖI**
- **Lần lỗi gần nhất**: 10:20
- **Consecutive errors**: **5**
- **Lỗi**: `404 Healer Alpha was a stealth model revealed on March 18th as an early testing version of MiMo-V2-Omni. Find it here: https://openrouter.ai/xiaomi/mimo-v2-omni`
- **Nguyên nhân**: Agent đang cố gắng dùng model `healer-alpha` (OpenRouter) đã bị deprecated/unpublished.
- **Khuyến nghị**: 
  - Update agent config để dùng model mới (ví dụ: `openrouter/stepfun/step-3.5-flash:free`, `anthropic/haiku`).
  - Hoặc để hệ thống tự fallback (nếu config không锁 model).

---

### 6. agent_dev (CCN2 Dev — Implement from GDDs)

- **Lịch**: 8:07, 8:22, 8:37, ... mỗi 15 phút
- **Trạng thái**: ❌ **LỖI**
- **Lần lỗi gần nhất**: 10:21
- **Consecutive errors**: **6**
- **Lỗi**: `⚠️ 📝 Edit: \`in D:/PROJECT/CCN2/research_doc/open_claw/agent_team_plan/ccn2_workspace/.state/agent_dev_processed.json (725 chars)\` failed`
- **Nguyên nhân**: Agent thất bại khi edit state file `.state/agent_dev_processed.json` (có thể do permission, file lock, hoặc nội dung không hợp lệ).
- **Khuyến nghị**:
  - Kiểm tra file state có tồn tại và quyền ghi.
  - Nếu file bị corrupt, backup và xóa để agent tạo mới.
  - Restart agent để release lock nếu có.
  - Nếu lỗi tiếp tục, cần debug agent code xử lý edit.

---

### 7. agent_dev_admin (CCN2 Dev Admin — Implement Java+React/REST)

- **Lịch**: 8:21, 8:51, 9:21, ... mỗi 30 phút
- **Trạng thái**: ❌ **LỖI**
- **Lần lỗi gần nhất**: 10:21
- **Consecutive errors**: **5**
- **Lỗi**: `Delivering to Telegram requires target <chatId>`
- **Nguyên nhân**: Job config `delivery` chỉ có `channel: "telegram"` nhưng thiếu `to: "526521221"`.
- **Khuyến nghị**: **Cập nhật delivery config** thêm `"to": "526521221"`. Có thể fix qua `cron update` command.

---

## Tóm tắt lỗi cần fix

| Job | Lỗi chính | Hành động |
|-----|-----------|-----------|
| agent_qc | Model deprecated (healer-alpha) | Đổi model trong agent config |
| agent_dev | Edit state file failed | Kiểm tra permission, file lock, corrupt |
| agent_dev_admin | Thiếu delivery.to | Thêm `delivery.to: "526521221"` |

---

## Đề xuất ưu tiên

1. **Fix agent_dev_admin** (dễ nhất — config change)
2. **Fix agent_qc** (thay model)
3. **Debug agent_dev** (có thể phải inspect state file)

---

*Báo cáo tự động tạo lúc 11:16 Asia/Bangkok.*
