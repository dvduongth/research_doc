# <Tên Game> — Tài liệu Thiết kế Game
<!-- HƯỚNG DẪN AGENT_GD: File này được TỔNG HỢP từ GDD-FEATURE-*.md. KHÔNG viết tay. -->
<!-- Chạy synthesis flow trong AGENTS.md khi đủ điều kiện trigger. -->

## Tổng quan
| Trường | Giá trị |
|--------|---------|
| Tên game | CCN2 |
| Tác giả | agent_gd (Designia) |
| Ngày tạo | YYYY-MM-DD |
| Cập nhật lần cuối | YYYY-MM-DD |
| Phiên bản | v1 |
| Trạng thái | Draft |

## Nhật ký thay đổi
| Phiên bản | Ngày | Người thay đổi | Tóm tắt |
|-----------|------|----------------|---------|
| v1 | YYYY-MM-DD | agent_gd | Tổng hợp lần đầu |

## Tài liệu liên quan
<!-- Tự động điền bởi synthesis. KHÔNG chỉnh sửa thủ công. -->
<!-- ĐỊNH DẠNG: - [GDD-FEATURE-<tên>.md](./GDD-FEATURE-<tên>.md) -->

---

## Cơ chế Game

### 1. Bàn cờ & Cấu trúc lượt chơi
<!-- Source: GDD-FEATURE-board.md (hoặc tương đương) -->
#### 1.1 Bàn cờ
#### 1.2 Token (Quân cờ)
#### 1.3 Lượt chơi
#### 1.4 Di chuyển token
#### 1.5 Điều kiện thắng/thua

### 2. <Tên hệ thống>
<!-- Source: GDD-FEATURE-<x>.md -->
<!-- Paste hoặc tóm tắt nội dung Section 2 (Cơ chế cốt lõi) của Feature GDD tương ứng -->

### N. <Tên hệ thống>
<!-- Thêm section cho mỗi hệ thống chính -->

---

## Cân bằng & Cấu hình
<!-- Tổng hợp từ tất cả Feature GDDs. Dedup theo tên tham số. -->
<!-- Nếu mâu thuẫn: ⚠️ CONFLICT: GDD-FEATURE-X ghi Y, GDD-FEATURE-Z ghi W -->
| Tham số | Giá trị | Ghi chú | GDD nguồn |
|---------|---------|---------|-----------|

---

## Chỉ số đánh giá

### Hành vi người chơi
<!-- Tối thiểu 3 chỉ số. Tổng hợp từ Section 7 của Feature GDDs. -->
| Chỉ số | Mô tả | Mục tiêu | Cách đo |
|--------|-------|----------|---------|

### Cân bằng
<!-- Tối thiểu 3 chỉ số. Tổng hợp từ Section 7 của Feature GDDs. -->
| Chỉ số | Mô tả | Mục tiêu | Cách đo |
|--------|-------|----------|---------|

---

## Câu hỏi mở / TBD
<!-- Gộp từ Section 10 của Feature GDDs. Thêm cột GDD nguồn. -->
| # | Câu hỏi | Chủ sở hữu | Trạng thái | GDD nguồn |
|---|---------|------------|------------|-----------|

---

## Bảng thuật ngữ
<!-- Sắp xếp theo alphabet. Mọi thuật ngữ viết hoa lần đầu PHẢI có entry ở đây. -->
<!-- Bao gồm Code Reference nếu có (ví dụ: `player.diamond`, `TileType.LADDER`) -->
| Thuật ngữ | Định nghĩa | Code Reference |
|-----------|------------|----------------|
| DIAMOND | Tiền tệ dùng để mở cổng thắng. Tích lũy khi đáp REWARD tiles. | `player.diamond` |
| LADDER tile | Ô đích để thắng (4 ô, mỗi màu 1). ID: 41=Xanh lá, 42=Đỏ, 43=Xanh dương, 44=Vàng. | `TileType.LADDER` |
| Safe Zone | Ô an toàn — token không bị đá ra khi đứng đây. ID: 1, 11, 21, 31. | `TileType.SAFE_ZONE` |
| REWARD tile | Ô phần thưởng — cấp DIAMOND khi token đáp xuống. ID: 5,10,15,20,25,30,35,40. | `TileType.REWARD` |
