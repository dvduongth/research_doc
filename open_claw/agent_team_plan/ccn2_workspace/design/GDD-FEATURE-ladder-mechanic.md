# GDD-FEATURE: Cơ chế Thang (Ladder Mechanic)
**Source**: concepts/ladder-mechanic.md
**Version**: v1
**Ngày tạo**: 2026-03-18
**Trạng thái**: Review
**Tác giả**: agent_gd (Designia)

## Nhật ký thay đổi
| Phiên bản | Ngày | Người thay đổi | Tóm tắt |
|-----------|------|----------------|---------|
| v1 | 2026-03-18 | agent_gd | Bản nháp đầu tiên từ concept |

---

## 1. Tổng quan
Cơ chế Thang là con đường thắng chính trong CCN2. Người chơi tích lũy DIAMOND bằng cách đáp xuống các ô REWARD; khi đạt 600 DIAMOND và đáp xuống ô Safe Zone, cổng của họ mở ra, cho phép token đi vào Thang và đến ô LADDER màu của người chơi để kích hoạt thắng.

## 2. Cơ chế cốt lõi

### 2.1 Tích lũy DIAMOND
- Biến trạng thái: `player.diamond` (số nguyên, bắt đầu từ 0)
- Ô REWARD: ID 5, 10, 15, 20, 25, 30, 35, 40
- Khi token đáp xuống ô REWARD: `player.diamond += CONFIG.REWARD_TILE_GRANT`
- `player.diamond` không giảm trong quá trình chơi bình thường

### 2.2 Điều kiện mở cổng
- Kiểm tra sau mỗi lần token đáp xuống ô
- Điều kiện: `player.diamond >= 600` VÀ ô đáp là Safe Zone (ID: 1, 11, 21, 31)
- Nếu đủ điều kiện: `player.gateOpen = true`
- Cổng mở là vĩnh viễn sau khi kích hoạt — không thể đảo ngược

### 2.3 Định tuyến vào Thang
- Khi `player.gateOpen = true`, người chơi có thể chọn định tuyến token về phía Thang thay vì tiếp tục vòng chính
- Lối vào Thang chỉ khả dụng khi cổng đã mở
- Chỉ ô LADDER màu của chính người chơi đó mới là đích đến hợp lệ cuối cùng

### 2.4 Kích hoạt thắng
- ID ô LADDER: 41 (Xanh lá), 42 (Đỏ), 43 (Xanh dương), 44 (Vàng)
- Khi token đến ô LADDER của người chơi: `triggerWin(playerId)`
- Chỉ 1 người thắng mỗi ván — người đầu tiên kích hoạt `triggerWin()` thắng ngay lập tức

## 3. Điều kiện Thắng/Thua
- **Thắng:** Token đến ô LADDER màu của người chơi (ID 41–44 tương ứng).
- **First-wins:** Chỉ 1 người thắng mỗi ván. Người đầu tiên kích hoạt `triggerWin()` thắng; ván đấu kết thúc ngay lập tức.

## 4. Trường hợp ngoại lệ
- Nếu `player.diamond >= 600` nhưng token đáp xuống ô không phải Safe Zone thì cổng KHÔNG mở. Người chơi phải đáp xuống ô Safe Zone để kích hoạt mở cổng.
- Nếu `player.diamond = 599` và token đáp xuống Safe Zone thì cổng KHÔNG mở (ngưỡng là ≥ 600 nghiêm ngặt).
- Nếu hai người chơi đều đạt 600 DIAMOND trong cùng một round thì cả hai cổng đều mở đồng thời; ván đấu trở thành cuộc đua đến ô LADDER tương ứng của mỗi người.
- Nếu người chơi có `gateOpen = true` bị đá trở lại Safe Zone bởi đối thủ thì cổng vẫn còn mở (`gateOpen` không bị reset khi bị đá).
- Nếu token đi quá ô LADDER cuối (số bước vượt quá số bước còn lại) thì token bật ngược lại số bước thừa (không quay về vòng chính).

## 5. Ghi chú UI/UX
- Hình ảnh: Mở cổng → rào cản có hoạt ảnh biến mất tại lối vào Thang; đường dẫn Thang sáng lên màu của người chơi.
- Âm thanh: Hiệu ứng âm thanh "mở cổng" đặc biệt kích hoạt một lần khi `gateOpen` chuyển sang true.
- Hoạt ảnh: Token đi vào Thang phát hoạt ảnh di chuyển khác với vòng chính thông thường (ví dụ: chuyển động đi lên).

## 6. Cân bằng & Cấu hình
| Tham số | Giá trị | Ghi chú |
|---------|---------|---------|
| Ngưỡng DIAMOND để mở cổng | 600 | `CONFIG.WIN_DIAMOND_THRESHOLD` |
| REWARD_TILE_GRANT | TBD | pending playtesting — xem GameDesignDocument.md để biết giá trị hiện tại |
| ID ô REWARD | 5, 10, 15, 20, 25, 30, 35, 40 | 8 ô cách đều trên bàn cờ 44 ô |
| ID ô Safe Zone | 1, 11, 21, 31 | Mỗi màu người chơi 1 ô |
| ID ô LADDER | 41 (Xanh lá), 42 (Đỏ), 43 (Xanh dương), 44 (Vàng) | Ô thắng |
| Cổng mở: có thể đảo ngược? | Không | Một khi `gateOpen = true`, giữ nguyên suốt ván |

## 7. Chỉ số đánh giá
| Chỉ số | Mô tả | Mục tiêu | Cách đo |
|--------|-------|----------|---------|
| Số round đến khi mở cổng (trung bình) | Số round trung bình trước khi người chơi đầu tiên mở cổng | 8–12 round | Theo dõi `currentRound` khi sự kiện `gateOpen = true` đầu tiên kích hoạt |
| Tỷ lệ chuyển đổi cổng-sang-thắng | % người chơi mở cổng và thành công đến ô LADDER trước đối thủ | ≥ 60% | `(số lần thắng có cổng mở) / (tổng số sự kiện gateOpen)` |
| DIAMOND khi kết thúc ván (người thua) | DIAMOND trung bình của người thua khi ván kết thúc | < 600 (KO trước cổng) hoặc ≥ 600 (thua cuộc đua) | `player.diamond` tại `triggerWin()` của người không thắng |

## 8. Phụ thuộc
- Phụ thuộc vào GDD: GDD-FEATURE-board-movement.md (quy tắc di chuyển token), GDD-FEATURE-reward-tiles.md (logic cấp DIAMOND)
- Thay đổi server cần thiết: có — flag `gateOpen` trong trạng thái người chơi, logic định tuyến Thang
- Thay đổi client cần thiết: có — hoạt ảnh mở cổng, đường dẫn Thang hiển thị, render trạng thái `gateOpen`
- Config keys cần thiết: `CONFIG.WIN_DIAMOND_THRESHOLD` (600), `CONFIG.REWARD_TILE_IDS`, `CONFIG.SAFE_ZONE_IDS`, `CONFIG.LADDER_TILE_IDS`

## 9. Kịch bản kiểm thử
1. Given `player.diamond = 599` và token đáp xuống Safe Zone ô 1, When lượt kết thúc, Then `player.gateOpen` vẫn là false.
2. Given `player.diamond = 600` và token đáp xuống Safe Zone ô 11, When lượt kết thúc, Then `player.gateOpen` trở thành true.
3. Given `player.diamond = 700` và token đáp xuống ô không phải Safe Zone (ô 7), When lượt kết thúc, Then `player.gateOpen` vẫn là false (không phải Safe Zone, cổng không mở).
4. Given `player.gateOpen = true` và đối thủ đá token người chơi trở lại Safe Zone 1, When xử lý đá xong, Then `player.gateOpen` vẫn là true (đá không reset cổng).
5. Given `player.gateOpen = true` và token còn 2 bước đến ô LADDER nhưng tung được 5, When xử lý di chuyển xong, Then token dừng tại ô LADDER (bật ngược 3 bước, không đi quá).
6. Given Player1 và Player2 đều đạt `player.diamond = 600` trong cùng một round, When cả hai đáp xuống Safe Zone, Then cả hai flag `gateOpen` đều trở thành true — ván đấu bước vào chế độ đua.
7. Given `player.gateOpen = true` và token đến ô LADDER 41 (Xanh lá), When xử lý đáp xuống xong, Then `triggerWin(playerId)` được gọi và ván đấu kết thúc ngay lập tức.

## 10. Câu hỏi mở / TBD
| # | Câu hỏi | Chủ sở hữu | Trạng thái |
|---|---------|------------|------------|
| 1 | Giá trị cụ thể của REWARD_TILE_GRANT — cấp bao nhiêu DIAMOND khi đáp ô REWARD? | Designer | Mở |
| 2 | Người chơi có thể chọn KHÔNG vào Thang khi cổng đã mở không (trì hoãn chiến thuật)? | Designer | Mở |
