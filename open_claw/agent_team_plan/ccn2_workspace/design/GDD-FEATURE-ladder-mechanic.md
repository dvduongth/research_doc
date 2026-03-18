# GDD-FEATURE: ladder-mechanic
**Source**: concepts/ladder-mechanic.md
**Version**: v1
**Ngày tạo**: 2026-03-18
**Cập nhật**: 2026-03-18
**Trạng thái**: Review
**Tác giả**: agent_gd (Designia)

## Nhật ký thay đổi
| Phiên bản | Ngày | Người thay đổi | Tóm tắt |
|-----------|------|----------------|---------|
| v1 | 2026-03-18 | agent_gd | Bản nháp đầu tiên từ concepts/ladder-mechanic.md |

---

## 1. Tổng quan
Cơ chế Ladder là con đường thắng cuối cùng trong CCN2. Người chơi tích lũy đủ 600 DIAMOND, mở cổng khi đến ô Safe Zone, sau đó đi qua Ladder Lane để đến ô Ladder màu của mình và kích hoạt thắng cuộc. Đây là điều kiện thắng duy nhất trong game.

## 2. Cơ chế cốt lõi
Game lưu trạng thái cho mỗi người chơi:
- `player.diamond`: số DIAMOND tích lũy hiện tại
- `player.gateOpen`: boolean, cổng có mở hay không (mặc định false)
- `token.onLadderLane`: boolean, token đang ở Ladder Lane hay không

Quy trình:
1. Người chơi kiếm DIAMOND bằng cách đáp xuống các ô Ladder (IDs: 5, 10, 15, 20, 25, 30, 35, 40) → `player.diamond += X` (giá trị X tùy theo cấu hình bài toán)
2. Khi `player.diamond >= 600` và token đáp xuống ô Safe Zone (IDs: 1=Xanh lá, 11=Đỏ, 21=Xanh dương, 31=Vàng) → `player.gateOpen = true`
3. Với `gateOpen = true`, token được phép chuyển hướng vào Ladder Lane (các ô 41–44) thay vì tiếp tục vòng ngoài
4. Khi token đến ô Ladder Code (41=Xanh lá, 42=Đỏ, 43=Xanh dương, 44=Vàng) phù hợp với màu của người chơi → `triggerWin(playerId)`
5. Game kết thúc, người chơi thắng

Lưu ý: Chỉ 1 người thắng mỗi ván (first to reach Final Ladder Tile wins).

## 3. Điều kiện Thắng/Thua
- Thắng: Token của người chởi đứng trên ô Ladder màu của chính mình (41–44) và `gateOpen = true`
- Thua: Một người chơi khác thắng trước; hoặc token bị đẩy lui không thể đến ô Ladder kịp

## 4. Trường hợp ngoại lệ
- Nếu người chơi có `player.diamond >= 600` nhưng đáp xuống ô không phải Safe Zone → cổng KHÔNG mở (`gateOpen` vẫn false).
- Nếu người chơi có `player.diamond = 599` và đáp xuống Safe Zone → chưa đủ điều kiện mở cổng.
- Nếu hai người chơi cùng lúc đạt `player.diamond >= 600` và cùng đáp xuống Safe Zone trong cùng round → cả hai cổng mở, cả hai cùng đi vào Ladder Lane và tranh nhau đến ô Ladder cuối cùng.
- Nếu người chơi có cổng mở (`gateOpen = true`) bị một người chơi khác đẩy token lui ra khỏi Safe Zone/Ladder Lane → cổng vẫn giữ trạng thái mở.
- Nếu token trên Ladder Lane tung xúc xác và giá trị quá xa vượt ô Ladder cuối cùng (overshoot) → token nảy lui về vị trí trước đó (bounce back) và cần đúng số chênh lệch trong lượt tiếp theo.

## 5. Ghi chú UI/UX
- **Hình ảnh**: Khi cổng mở, hiển thị hiệu ứng "gate opening" trên ô Safe Zone. Khi token đi vào Ladder Lane, đổi màu đường đi thành màu của người chơi.
- **Âm thanh**: SFX "gate_open.wav" khi cổng mở; SFX "ladder_climb.wav" khi token di chuyển trong Ladder Lane.
- **Hoạt ảnh**: Token rung nhẹ khi vượt qua 각 Ladder tile; màn hình co phóng to khi token đến ô Ladder cuối cùng (win moment).

## 6. Cân bằng & Cấu hình
| Tham số | Giá trị | Ghi chú |
|---------|---------|---------|
| diamond_requirement | 600 | DIAMOND cần để mở cổng |
| safe_zone_tiles | [1, 11, 21, 31] | Mỗi màu có 1 ô Safe Zone riêng |
| ladder_final_tiles | {Green: 41, Red: 42, Blue: 43, Yellow: 44} | Mapping màu → ô Ladder |
| diamond_per_ladder_tile | 50 | DIAMOND kiếm được mỗi lần đáp Ladder tile (cần playtesting để điều chỉnh) |
| extra_turn_on_doubles | true | Cho phép thêm 1 lượt nếu tung double (theo `player.extraTurnUsed`) |

Ghi chú: Giá trị `diamond_per_ladder_tile` cần playtesting để xác định tốc độ tích lũy hợp lý (600 / 50 = 12 lần đáp Ladder tile).

## 7. Chỉ số đánh giá
| Chỉ số | Mô tả | Mục tiêu | Cách đo |
|--------|-------|----------|---------|
| ladder_win_rate_avg | Thời gian trung bình từ khi đạt 600 DIAMOND đến khi thắng (số lượt) | 3–5 lượt | Log: count turns between gateOpen=true và win |
| concurrent_gate_events | Tỷ lệ khi ≥2 người chơi mở cổng cùng round | ≤ 15% | Log: rounds với >1 gateOpen trong cùng round / tổng rounds |
| diamond_accumulation_variance | Độ lệch chuẩn của DIAMOND tích lũy giữa người chơi ở giữa ván | ≤ 100 | Log: stdev(player.diamond) mỗi 10 lượt |

## 8. Phụ thuộc
- Phụ thuộc vào GDD: GameDesignDocument.md (Win Condition section)
- Thay đổi server cần thiết: có (trạng thái player.diamond, player.gateOpen, token.onLadderLane; triggerWin logic; ladder tile effects)
- Thay đổi client cần thiết: có (hiển thị cổng mở, đường đi Ladder Lane, hiệu ứng thắng cuộc)
- Config keys cần thiết: `ladder.diamondPerTile`, `ladder.winCondition.diamondRequired`, `tiles.ladderFinal.*`

## 9. Kịch bản kiểm thử
1. Given `player.diamond = 600`, When token lands on Safe Zone tile, Then `player.gateOpen` becomes true, token enters Ladder Lane.
2. Given `player.diamond = 599`, When token lands on Safe Zone tile, Then `player.gateOpen` remains false.
3. Given `player.diamond = 620` but token on non-safe tile, When encountered any tile, Then `player.gateOpen` remains false until Safe Zone.
4. Given `player.gateOpen = true` and token on Ladder Lane, When another player's action pushes token back, Then `player.gateOpen` remains true.
5. Given `player.token` on tile 43 (Blue Ladder Final) but `player.color != Blue`, When token lands, Then no win triggered; must reach correct color's Ladder tile.

## 10. Câu hỏi mở / TBD
| # | Câu hỏi | Chủ sở hữu | Trạng thái |
|---|---------|------------|------------|
| 1 | Giá trị `diamond_per_ladder_tide` chính xác là bao nhiêu để game kéo dài ~30–40 phút? | balance_team | TBD — cần playtesting |
| 2 | Có cho phép nhiều người cùng mở cổng và cạnh tranh trên Ladder Lane không? | design | TBD — spec hiện tại cho phép (xem trường hợp đồng thời) |
