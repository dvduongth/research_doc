# design/ — Game Design Documents

**Designia (agent_gd) viết vào đây. Codera + Verita đọc ở đây.**

---

## File Naming

| File | Mô tả |
|------|-------|
| `GDD-FEATURE-<kebab-name>.md` | Game Design Document cho 1 feature |
| `GDD-TEMPLATE-FEATURE.md` | Template Designia dùng để tạo GDD |
| `GDD-TEMPLATE-GAME.md` | Template game-level GDD |
| `GDD-TEMPLATE.md` | Template generic |

---

## GDD Header Fields (bắt buộc)

```
**Source**: concepts/<filename.md>
**Version**: v1
**Ngày tạo**: YYYY-MM-DD
**Cập nhật**: YYYY-MM-DD
**Trạng thái**: Draft | Review | InDev | InQC | Done | Flagged
**Pipeline agent**: agent_gd | agent_dev | agent_qc | COMPLETE
**Cập nhật lần cuối bởi**: agent_gd
**Cập nhật lần cuối lúc**: YYYY-MM-DDTHH:MM:SS+07:00
**Tác giả**: agent_gd (Designia)
```

`Trạng thái` được agents cập nhật theo pipeline:
- `Draft` → `Review` → `InDev` → `InQC` → `Done`
- `Flagged` = Codera đánh dấu cần xem lại

---

## GDD Format — 10 sections bắt buộc

| # | Section | Yêu cầu tối thiểu |
|---|---------|-------------------|
| 1 | Tổng quan | 2–3 câu mô tả tính năng |
| 2 | Cơ chế cốt lõi | Step-by-step, biến trạng thái, trigger, kết quả |
| 3 | Điều kiện Thắng/Thua | Ảnh hưởng đến win condition hoặc ghi "Không liên quan" |
| 4 | Trường hợp ngoại lệ | Tối thiểu **3** edge cases, cover ≥1 concurrent state |
| 5 | Ghi chú UI/UX | Hình ảnh, âm thanh, hoạt ảnh |
| 6 | Cân bằng & Cấu hình | Bảng tham số, không dùng "TBD" cho cột Giá trị |
| 7 | Chỉ số đánh giá | ≥1 behavior metric + ≥1 balance metric, có cột Cách đo |
| 8 | Phụ thuộc | GDD deps, server/client changes, config keys |
| 9 | Kịch bản kiểm thử | Tối thiểu **5** Given/When/Then, ≥1 failure path |
| 10 | Câu hỏi mở / TBD | Tùy chọn — xóa nếu không có |

> **Quy tắc tiền tệ**: Luôn dùng **DIAMOND** — không dùng KC, không dùng Ladder Points.

---

## Rules

- **CHỈ Designia (agent_gd)** được tạo và chỉnh sửa file GDD trong folder này
- Human có thể thêm comment dạng `> **Review:** ...` blockquote trong GDD file
- **KHÔNG tạo** GDD thủ công — đặt ý tưởng vào `concepts/` trước
- Nếu GDD sai / thiếu → tạo bug report `domain: gd` trong `bugs/`
