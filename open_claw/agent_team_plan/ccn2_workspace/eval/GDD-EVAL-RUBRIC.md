# Rubric Đánh giá GDD
**Phiên bản**: v1
**Ngày**: 2026-03-18
**Chuẩn chất lượng tham chiếu**: GDD_Overview_v2_ElementalHunter.md

---

## Rubric Feature (100 điểm — đạt ≥ 70)

| Chiều đánh giá | Trọng số | Tiêu chí đạt |
|----------------|----------|--------------|
| Đầy đủ | 25đ | Đủ 10 sections (1–10), không section nào bỏ trống không có lý do. Header có Version, Trạng thái, Tác giả. |
| Cụ thể | 25đ | Bảng Cân bằng & Cấu hình dùng số cụ thể (không "TBD" trong cột Giá trị). Cơ chế cốt lõi dùng tên biến trạng thái (ví dụ: `player.diamond`, `token.position`). |
| Khả năng triển khai | 20đ | Dev đọc xong không cần hỏi thêm câu nào. Không có: "v.v.", "xử lý phù hợp", "như mong đợi", "theo cách hợp lý". |
| Trường hợp ngoại lệ | 15đ | ≥ 3 trường hợp, định dạng "Nếu X thì Y.", cover ít nhất 1 trạng thái đồng thời (2 player cùng lúc / 2 sự kiện cùng lượt). |
| Kịch bản kiểm thử | 10đ | ≥ 5 kịch bản, đúng định dạng Given/When/Then. Ít nhất 1 failure path (Given trạng thái không hợp lệ). |
| Chỉ số đánh giá | 5đ | ≥ 1 chỉ số hành vi người dùng + ≥ 1 chỉ số cân bằng. Cột "Cách đo" được điền. |

### Ngưỡng điểm (Feature)

| Khoảng điểm | Hành động |
|-------------|-----------|
| < 50 | KHÔNG lưu file. Telegram: `[agent_gd] EVAL THẤT BẠI: <tên> điểm=XX/100 — không lưu` |
| 50–69 | Lưu với `Trạng thái: Draft` trong header. Telegram: `[agent_gd] GDD CẢNH BÁO: <tên> điểm=XX/100 — đã lưu là Draft` |
| ≥ 70 | Lưu với `Trạng thái: Review` trong header. Telegram: `[agent_gd] GDD sẵn sàng: <tên> điểm=XX/100` |

---

## Rubric Game (100 điểm — đạt ≥ 75)

| Chiều đánh giá | Trọng số | Tiêu chí đạt |
|----------------|----------|--------------|
| Độ bao phủ Feature | 30đ | ≥ 80% số GDD-FEATURE-*.md có Trạng thái: Review hoặc Approved được reference trong Tài liệu liên quan và các sections Cơ chế Game. |
| Tổng hợp cân bằng | 25đ | Bảng Cân bằng & Cấu hình tổng hợp đủ từ tất cả Feature GDDs. Không có mâu thuẫn im lặng — mâu thuẫn phải được đánh dấu ⚠️ CONFLICT. |
| Chất lượng chỉ số | 20đ | ≥ 3 chỉ số hành vi người dùng + ≥ 3 chỉ số cân bằng. Mục tiêu có số cụ thể hoặc "TBD — xác định sau playtesting" (không để trống). |
| Bảng thuật ngữ | 15đ | Mọi thuật ngữ viết hoa lần đầu xuất hiện trong tài liệu đều có entry trong Bảng thuật ngữ. Bảng thuật ngữ có cột Code Reference. |
| Tham chiếu chéo | 10đ | Danh sách Tài liệu liên quan được tự động điền. Câu hỏi mở được gộp từ Feature GDDs với cột GDD nguồn. |

---

## Định dạng kết quả Eval

Khi chạy eval, tạo file: `eval/GDD-EVAL-<tên>-YYYY-MM-DD.md`

```markdown
# Kết quả Eval GDD: <tên> — YYYY-MM-DD
**Chế độ**: Feature | Game
**Người đánh giá**: agent_gd (tự đánh giá) | agent_qc (authoritative)
**Điểm**: XX/100 — ĐẠT | THẤT BẠI | CẦN KIỂM TRA

## Điểm từng chiều
| Chiều đánh giá | Điểm | Tối đa | Ghi chú |
|----------------|------|--------|---------|
| Đầy đủ | X | 25 | ... |
| Cụ thể | X | 25 | ... |
| Khả năng triển khai | X | 20 | ... |
| Trường hợp ngoại lệ | X | 15 | ... |
| Kịch bản kiểm thử | X | 10 | ... |
| Chỉ số đánh giá | X | 5 | ... |
| **Tổng** | **XX** | **100** | |

## Vấn đề tìm thấy
- [NGHIÊM TRỌNG] ...
- [CẢNH BÁO] ...

## Khuyến nghị
<!-- ĐẠT → agent_qc có thể viết kịch bản kiểm thử từ GDD này -->
<!-- THẤT BẠI → agent_gd cần chỉnh sửa: [liệt kê vấn đề cụ thể] -->
<!-- CẦN KIỂM TRA → điểm agent_qc thấp hơn agent_gd ≥20đ → cần human review -->
```

---

## Quyền sở hữu Eval

| Vai trò | Hành động | Authoritative? |
|---------|-----------|----------------|
| agent_gd | Tự đánh giá trước khi lưu (Rubric Feature) | ❌ Không — chỉ là gate |
| agent_qc | Đánh giá độc lập sau khi GDD được lưu (Feature + Game) | ✅ Có |

**Điều kiện CẦN KIỂM TRA:** Nếu điểm agent_qc thấp hơn điểm tự đánh giá của agent_gd ≥ 20đ → ghi CẦN KIỂM TRA trong kết quả eval + thông báo Telegram: `⚠️ [CCN2 QC] Chênh lệch điểm trên <tên>: agent_gd=XX, agent_qc=YY — cần human review`
