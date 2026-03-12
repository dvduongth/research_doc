# Checklist phối hợp — Người A & Người B

> **Mục đích**: Đảm bảo 2 phần trình bày nhất quán, không mâu thuẫn, không thiếu sót
> **Dùng khi**: Sync Call (21:00 ngày 12/03) và Review chéo (sáng 13/03)

---

## 1. Thuật ngữ thống nhất

Thống nhất cách dịch/dùng các thuật ngữ sau (đánh `[x]` khi đã đồng ý):

| Thuật ngữ gốc | Cách dùng thống nhất | Đồng ý? |
|----------------|----------------------|---------|
| Agent Loop | [ ] "Vòng lặp Agent" hay giữ nguyên "Agent Loop"? |
| Turn | [ ] "Lượt" hay giữ nguyên "Turn"? |
| Steering | [ ] "Điều hướng" hay giữ nguyên "Steering"? |
| Follow-up | [ ] "Theo dõi" hay giữ nguyên "Follow-up"? |
| Compaction | [ ] "Nén context" hay giữ nguyên "Compaction"? |
| Branching | [ ] "Phân nhánh" hay giữ nguyên "Branching"? |
| Provider | [ ] "Nhà cung cấp" hay giữ nguyên "Provider"? |
| Extension | [ ] "Tiện ích mở rộng" hay giữ nguyên "Extension"? |
| Tool Calling | [ ] "Gọi công cụ" hay giữ nguyên "Tool Calling"? |
| Context Window | [ ] "Cửa sổ ngữ cảnh" hay giữ nguyên "Context Window"? |
| State Management | [ ] "Quản lý trạng thái" hay giữ nguyên? |
| Event Streaming | [ ] "Truyền sự kiện" hay giữ nguyên? |

---

## 2. Điểm giao nhau — Đồng bộ nội dung

### `convertToLlm()` & `transformContext()`
- [ ] **Người A** giải thích ở mức: tổng quan vai trò trong Tier 2
- [ ] **Người B** giải thích ở mức: chi tiết flow trong agent loop
- [ ] Kiểm tra: 2 phần giải thích có mâu thuẫn không?
- [ ] Thống nhất: Người A giới thiệu khái niệm → Người B đi sâu

### Extension System & Events
- [ ] **Người A** giải thích: ExtensionAPI, cách đăng ký, discovery
- [ ] **Người B** giải thích: Events mà extension nhận được, interception
- [ ] Kiểm tra: Phần extension events của B có tham chiếu đúng API mà A đã giới thiệu?

### Session
- [ ] **Người A** giải thích: JSONL format, persistence, tree structure
- [ ] **Người B** giải thích: Branching runtime, compaction
- [ ] Kiểm tra: Cả 2 dùng cùng 1 mô tả cho session tree format?

---

## 3. Kiểm tra chuyển tiếp (Transition)

- [ ] Câu kết của Người A có dẫn dắt vào phần Người B không?
  - Gợi ý: A kết bằng "Vừa rồi là kiến trúc tĩnh — giờ B sẽ cho thấy hệ thống **vận hành** như thế nào"
- [ ] Câu mở đầu của Người B có reference phần A không?
  - Gợi ý: B mở bằng "Như A vừa trình bày, hệ thống có 3 tiers. Giờ ta sẽ xem khi user gõ 1 prompt, dữ liệu đi qua 3 tiers này như thế nào"
- [ ] Demo walkthrough (phút 30-40): cả 2 có cùng trace 1 prompt example không?

---

## 4. Kiểm tra sơ đồ / hình ảnh

- [ ] Sơ đồ dependency (Người A) và sequence diagram (Người B) dùng cùng tên package?
- [ ] Màu sắc / ký hiệu có nhất quán không?
- [ ] Font size đủ lớn để attendees đọc trên màn chiếu?

---

## 5. Q&A — Phân vùng trả lời

| Chủ đề câu hỏi | Người trả lời chính | Người hỗ trợ |
|-----------------|---------------------|--------------|
| Kiến trúc tổng quan, tại sao 3 tiers | A | B |
| Provider, Model, pi-ai | A | — |
| Dependency, Extension API | A | B (events) |
| Agent loop, event flow | B | A |
| Turn, Steering, Compaction | B | — |
| Source code chi tiết | B | — |
| So sánh với Claude Code/Cursor | A (kiến trúc) | B (runtime) |
| Session, Branching | A (format) | B (runtime) |

---

## 6. Checklist trước khi lên trình bày

### Nội dung
- [ ] Mỗi người đã chạy thử 1 lần (15 phút mỗi người)?
- [ ] Tổng thời gian 2 người ≤ 35 phút (để dư Q&A)?
- [ ] Không có phần nào giải thích quá 5 phút liên tục mà không có hình/sơ đồ?
- [ ] Đã chuẩn bị ít nhất 1 ví dụ cụ thể cho mỗi concept?

### Kỹ thuật
- [ ] Slides/Notes mở sẵn trên máy?
- [ ] Sơ đồ hiển thị đúng trên máy chiếu?
- [ ] Backup plan nếu demo fail?

### Phong cách
- [ ] Cả 2 người đã đọc qua phần của nhau?
- [ ] Không có slide/note nào contradicts nhau?
- [ ] Thuật ngữ nhất quán 100%?

---

## 7. Ghi chú từ Sync Call

> Ghi lại những gì đã thống nhất trong buổi sync:

**Ngày**: ___
**Thời gian**: ___

### Đã đồng ý:
1.
2.
3.

### Cần điều chỉnh:
1.
2.

### Câu hỏi chưa giải quyết:
1.
2.
