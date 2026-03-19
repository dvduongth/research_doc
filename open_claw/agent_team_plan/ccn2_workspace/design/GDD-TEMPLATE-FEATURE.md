# GDD-FEATURE: <Tên Tính Năng>
**Source**: concepts/<filename.md>
**Version**: v1
**Ngày tạo**: YYYY-MM-DD
**Cập nhật**: YYYY-MM-DD
**Trạng thái**: Draft | Review | InDev | InQC | Done | Flagged
**Pipeline agent**: agent_gd | agent_dev | agent_qc | COMPLETE
**Cập nhật lần cuối bởi**: agent_gd
**Cập nhật lần cuối lúc**: YYYY-MM-DDTHH:MM:SS+07:00
**Tác giả**: agent_gd (Designia)

## Nhật ký thay đổi
| Phiên bản | Ngày | Người thay đổi | Tóm tắt |
|-----------|------|----------------|---------|
| v1 | YYYY-MM-DD | agent_gd | Bản nháp đầu tiên |

---

## 1. Tổng quan
<!-- 2–3 câu. Tính năng là gì, vai trò trong CCN2. -->

## 2. Cơ chế cốt lõi
<!-- Step-by-step. Dev đọc xong không cần hỏi thêm. -->
<!-- Bao gồm: biến trạng thái, trigger, điều kiện, kết quả. -->
<!-- Dùng sub-sections 2.1, 2.2... nếu cơ chế phức tạp. -->
<!-- QUY TẮC TIỀN TỆ: Luôn dùng DIAMOND (không dùng KC, không dùng Ladder Points). -->

## 3. Điều kiện Thắng/Thua
<!-- Ảnh hưởng đến trạng thái thắng. Nếu không liên quan → ghi: "Không liên quan — không ảnh hưởng đến điều kiện thắng." -->

## 4. Trường hợp ngoại lệ
<!-- Tối thiểu 3. Định dạng: "Nếu X thì Y." Cover ít nhất 1 trạng thái đồng thời (2 player cùng lúc). -->
- Nếu X thì Y.
- Nếu X thì Y.
- Nếu X thì Y.

## 5. Ghi chú UI/UX
- Hình ảnh: ...
- Âm thanh: ...
- Hoạt ảnh: ...

## 6. Cân bằng & Cấu hình
<!-- Dùng số cụ thể. Không để "TBD" trong cột Giá trị — nếu chưa biết → ghi "pending playtesting" trong cột Ghi chú. -->
| Tham số | Giá trị | Ghi chú |
|---------|---------|---------|
| tham_so_vi_du | 0 | Mô tả |

## 7. Chỉ số đánh giá
<!-- Tối thiểu 1 chỉ số hành vi người dùng + 1 chỉ số cân bằng. Cột "Cách đo" là bắt buộc. -->
| Chỉ số | Mô tả | Mục tiêu | Cách đo |
|--------|-------|----------|---------|
| chi_so_hanh_vi | Mô tả | giá trị mục tiêu | phương pháp đo |
| chi_so_can_bang | Mô tả | giá trị mục tiêu | phương pháp đo |

## 8. Phụ thuộc
- Phụ thuộc vào GDD: (liệt kê theo tên file, hoặc "Không có")
- Thay đổi server cần thiết: có / không
- Thay đổi client cần thiết: có / không
- Config keys cần thiết: (liệt kê hoặc "Không có")

## 9. Kịch bản kiểm thử
<!-- Tối thiểu 5. Given/When/Then. Ít nhất 1 failure path (Given trạng thái không hợp lệ). -->
1. Given <trạng thái>, When <hành động>, Then <kết quả mong đợi>.
2. Given <trạng thái>, When <hành động>, Then <kết quả mong đợi>.
3. Given <trạng thái>, When <hành động>, Then <kết quả mong đợi>.
4. Given <trạng thái>, When <hành động>, Then <kết quả mong đợi>.
5. Given <trạng thái>, When <hành động>, Then <kết quả mong đợi>.

## 10. Câu hỏi mở / TBD
<!-- Tùy chọn. Xóa section này nếu không có câu hỏi nào. -->
| # | Câu hỏi | Chủ sở hữu | Trạng thái |
|---|---------|------------|------------|
