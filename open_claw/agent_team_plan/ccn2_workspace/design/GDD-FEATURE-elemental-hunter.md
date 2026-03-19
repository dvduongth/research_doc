# GDD-FEATURE: elemental-hunter
**Source**: concepts/GDD_Overview_v2_ElementalHunter.md
**Version**: v1
**Ngày tạo**: 2026-03-19
**Cập nhật**: 2026-03-19
**Trạng thái**: InQC
**Pipeline agent**: agent_qc
**Cập nhật lần cuối bởi**: agent_dev
**Cập nhật lần cuối lúc**: 2026-03-19T05:37:00Z
**Tác giả**: agent_gd (Designia)

## Nhật ký thay đổi
| Phiên bản | Ngày | Người thay đổi | Tóm tắt |
|-----------|------|----------------|---------|
| v1 | 2026-03-19 | agent_gd | Bản nháp đầu tiên |

---

## 1. Tổng quan

Elemental Hunter là một game board chiến thuật mới trong đó mỗi player điều khiển 3 ngựa (token) trên bàn cờ 61 ô hình chữ thập. Player thu thập nguyên tố (Fire, Ice, Grass, Rock) để xây dựng Element Queue và kích hoạt combo (C3 và C4) nhằm tăng ATK của ngựa, đồng thời sử dụng MAG để kích hoạt Ultimate (Extra Roll). Mục tiêu là đánh bại đối thủ bằng cách giảm HP của họ về 0 (KO) hoặc có HP cao hơn khi hết số Round tối đa.

---

## 2. Cơ chế cốt lõi

### 2.1 Bàn cờ và cấu trúc đường đi

Bàn cờ isometric hình chữ thập với 61 ô (ID 0–60), chia thành:
- **4 Arm Path** (mỗi cánh 10 ô, bao gồm Start tile).
- **Main Loop** vòng chính kết nối 4 cänh, ngựa di chuyển theo chiều kim đồng hồ.
- **Branch Point** ngay trước Start tile của mỗi cánh: ngựa của đúng player → vào Goal Path; ngựa player khác → tiếp tục Main Loop.
- **Goal Path** dài 4 ô dẫn từ Branch Point đến Final Goal; chỉ ngựa của chủ cánh được vào.
- **Final Goal**: ô kích hoạt Về Đích.

**Loại ô:**
- Elemental Tile (Fire/Ice/Grass/Rock) — có `currentElement`.
- Empty Tile — kích hoạt Artifact.
- Safe Zone (bao gồm Start tile).
- Start tile (cũng là Safe Zone).

**Tái sinh nguyên tố:** Khi ngựa rời Elemental Tile đã rỗng (`currentElement = null`), ô tái sinh nguyên tố theo loại gốc.

Player1 Start tile: 51, Final Goal: 31.
Player2 Start tile: 0, Final Goal: 25.

### 2.2 Token

Mỗi player có 3 ngựa, mỗi ngựa có:
- `atk` (bắt đầu từ 0)
- `frozenRounds` (số lượt bị đóng băng)

Vị trí khởi đầu: rải đều trên 3 ô đầu tiên của Arm Path, không xếp chồng.

### 2.3 Lượt chơi

1. Player đổ 2 xúc xắc (có thể dùng Power Roll — xem 2.5).
   - Nếu đổ đôi (Roll Double) → nhận extra turn ngay sau lượt này.
2. Chọn 1 ngựa hợp lệ (không bị Frozen, ô đích không bị chặn bởi ngựa cùng đội).
3. Ngựa di chuyển số bước = tổng xúc xắc, theo đường định nghĩa (qua Branch Point xử lý rẽ).
4. Xử lý ô đáp: nhận nguyên tố (nếu có), tương tác Empty Tile (Artifact), Kick (nếu có ngựa đối thủ và không phải Safe Zone), hoặc Về Đích (nếu là Final Goal).
5. Kết thúc lượt → chuyển player.

Thứ tự: P1 → P2 → P1 → P2... Mỗi lần cả 2 đều đi xong tính là 1 Round.

### 2.4 Di chuyển

Ngựa di chuyển tuần tự từng ô. Nếu số bước vượt qua Final Goal, ngựa dừng tại Final Goal.

### 2.5 Power Roll

Player chọn target range trước khi bấm dừng xúc xắc.
- Xác suất 20% kết quả rơi vào target range.
- 80% còn lại: ngẫu nhiên hoàn toàn.

### 2.6 Roll Double và Consecutive Roll Cap

Nếu 2 xúc xắc ra cùng số → Roll Double → cấp thêm 1 lượt đổ xúc xắc (extra turn) ngay sau lượt hiện tại.

**Double Roll Cooldown:** Sau khi đổ đôi thành công, player không thể đổ đôi trong 2 round tiếp theo (`doubleRollCooldown`). Áp dụng per-player.

**Consecutive Roll Cap:** Trong 1 turn sequence, player được roll tối đa `MAX_CONSECUTIVE_ROLLS` (mặc định 3) lần liên tiếp (1 normal + 2 extra). Cap áp dụng cho cả Roll Double và Ultimate Extra Roll. Khi đạt cap, Roll Double không cấp extra turn. Biến `consecutiveRollsThisTurn` theo dõi, reset khi sang player khác.

### 2.7 Element Collection và Affinity

Mỗi player có `elementAffinity` (Fire/Ice/Grass/Rock) xác định bởi Character.

Khi ngựa đáp Elemental Tile:
- Nếu nguyên tố == Affinity → ngựa đó nhận +ATK bằng `character.atk` (×2 nếu `tileGainMultiplier = ×2`).
- Ngược lại → player tích +MAG bằng `character.mag` (×2 nếu `tileGainMultiplier = ×2`).

Nguyên tố mới được thêm vào **cuối** Element Queue (max size `maxElementQueue`). Nếu queue đầy, nguyên tố cũ nhất (đầu) bị loại.

**Game Start:** 1 nguyên tố cùng Affinity được thêm vào **đầu** Element Queue.

### 2.8 Combo (C3 và C4)

Sau mỗi lần thêm nguyên tố, quét toàn bộ queue:
- **C3 — Triple Threat:** 3 nguyên tố giống nhau liên tiếp → combo.
- **C4 — Elemental Master:** 4 nguyên tố khác nhau hoàn toàn liên tiếp → combo.

Ưu tiên C3 trước. Khi combo xảy ra:
1. Nguyên tố tạo combo bị xóa khỏi queue.
2. Áp dụng phần thưởng combo theo Character (Tier 1 mỗi combo, Tier 2 ở milestone 2, Tier 3 ở milestone 3).
3. Quét lại queue → Cascading Combo nếu còn.
4. Lặp đến khi hết combo.

### 2.9 Combo Rewards (theo Character Pillow)

- **Tier 1 (Power Surge):** +150 ATK cho tất cả ngựa.
- **Tier 2 (Double Harvest):** `tileGainMultiplier` tăng lên ×2 (nhận ATK/MAG từ ô gấp đôi). Áp dụng từ milestone combo thứ 2 (Lv2 trở lên).
- **Tier 3 (Absolute Might):** ATK hiện tại của tất cả ngựa ×1.5 (làm tròn lên). Áp dụng từ milestone combo thứ 3 (Lv3).

`comboCount` reset về 0 đầu ván.

### 2.10 Kick

Khi ngựa A của Player X đáp ô có ngựa B của Player Y (và ô không phải Safe Zone):
1. `HP[Y] -= ATK[A]`.
2. Ngựa B bị đẩy lùi về Safe Zone gần nhất phía sau (theo hướng di chuyển của ngựa B).
3. `kickCount[X]` tăng 1.

Nếu `ATK[A] = 0` → không gây sát thương nhưng vẫn đẩy lùi.

### 2.11 HP và KO

Mỗi player có HP theo Character (Pillow: 1000). HP chỉ giảm khi bị Kick hoặc bị tấn công từ ngựa về đích.

Nếu `HP ≤ 0` → player KO, đối thủ thắng ngay.

### 2.12 MAG và Ultimate

**MAG** tích lũy khi ngựa đáp ô khác Affinity: `player.mag += character.mag` (có nhân `tileGainMultiplier`). Giới hạn bởi `magCap`.

**Ultimate — Extra Roll:** Cost 50 MAG. Kích hoạt: `ultimateExtraRolls++`. Sau khi kết thúc di chuyển lượt hiện tại, nếu `ultimateExtraRolls > 0` → tiêu hao 1 và bắt đầu lượt đổ xúc xắc mới cho player.

### 2.13 Artifact (Empty Tile)

Khi ngựa đáp Empty Tile, player chọn 1 Artifact từ pool đã mở khóa:

| Artifact | Hiệu ứng |
|----------|----------|
| Swap | Đổi chỗ 2 nguyên tố liền kề trong Element Queue |
| Change | Đổi 1 nguyên tố bất kỳ trong Queue thành 1 trong 3 loại còn lại |
| Charge | Thêm 1 nguyên tố cùng Affinity vào cuối Queue |

**Mở khóa Artifact:**
- Swap: `emptyTileVisits ≥ 1`.
- Change: `emptyTileVisits ≥ 2`.
- Charge: `emptyTileVisits ≥ 3`.

**Artifact Slots (Level):**
- Lv1: 1 slot.
- Lv2: 2 slots.
- Lv3: 3 slots.

### 2.14 Character (Pillow)

- Affinity: TBD.
- ATK: 30.
- MAG: 10.
- HP: 1000.
- Combo Rewards: Power Surge (T1), Double Harvest (T2), Absolute Might (T3).
- Ultimate: Extra Roll.

### 2.15 Level Difficulty

Player chọn Level trước ván:

| Level | Max Rounds | Combo Tier tối đa | Artifact Slots | HP (theo Character) |
|-------|------------|-------------------|----------------|---------------------|
| Lv1 | 12 | 1 | 1 | Theo Character |
| Lv2 | 15 | 2 | 2 | Theo Character |
| Lv3 | 15 | 3 | 3 | Theo Character |

Default: Lv3.

---

## 3. Điều kiện Thắng/Thua

- **KO:** Nếu `HP[player] ≤ 0` → đối thủ thắng ngay.
- **Hết Round:** Khi `currentRound = maxRounds`, player có `HP` cao hơn thắng.
- **Tie-break:** Nếu `HP` bằng nhau, Player2 thắng (Last Mover Advantage).

---

## 4. Trường hợp ngoại lệ

- Nếu `elementQueue` đầy khi thêm nguyên tố mới, nguyên tố cũ nhất (đầu queue) bị loại để nhường chỗ.
- Nếu `token.frozenRounds > 0`, ngựa không thể được chọn di chuyển trong lượt đó.
- Nếu `consecutiveRollsThisTurn >= MAX_CONSECUTIVE_ROLLS`, Roll Double (dù 2 xúc xắc ra cùng số) không cấp thêm lượt, và Ultimate Extra Roll cũng không thể kích hoạt.
- Nếu player dùng Artifact Swap khi queue có < 2 nguyên tố, Swap không có hiệu lực (artifact được bỏ qua, không tiêu hao).
- Nếu ngựa đáp ô có ngựa đối thủ và ô là Safe Zone, Kick không xảy ra.
- Nếu 2 ngựa cùng player cùng lúc về đích (ví dụ trong cùng turn sequence), mỗi ngựa xử lý Về Đích riêng: thêm nguyên tố, tấn công đối thủ, trả về Safe Zone.
- Nếu Roll Double xảy ra khi player đang trong `doubleRollCooldown`, đổ đôi không cấp extra turn (vẫn tính là Roll Double nhưng không được thưởng).
- Nếu Power Roll được kích hoạt nhưng player không chọn target range trước khi bấm dừng, hành động đổ xúc xắc bị bỏ qua (cần chọn target range để kích hoạt Power Roll).

---

## 5. Ghi chú UI/UX

- **Token display:** Mỗi ngựa hiển thị `atk` hiện tại bên cạnh sprite.
- **HUD player:** Hiển thị HP, MAG, Element Affinity icon, `emptyTileVisits` count, `comboCount`, `consecutiveRollsThisTurn`.
- **Element Queue:** Hiển thị hàng đợi nguyên tố của player (các icon nguyên tố).
- **Power Roll UI:** Khi bật mode, hiển thị target range slider + nút Confirm.
- **Artifact selection popup:** Khi đáp Empty Tile, hiển thị danh sách artifact khả dụng (đã mở khóa) để chọn.
- **Feedback:**
  - Khi nhận nguyên tố: hiển thị "+ATK" hoặc "+MAG" float text.
  - Khi combo xảy ra: hiển thị combo type (C3/C4) và effect icon.
  - Kick: hiển thị sát thương số và animation đẩy lùi.
  - Ultimate: khi MAG ≥ 50, nút Ultimate sáng lên; khi kích hoạt, hiển thị cost và effect.
  - Cooldown indicator: Roll Double cooldown hiển thị số round còn lại.
  - Consecutive Roll Cap: hiển thị số lần đã roll trong turn hiện tại.

---

## 6. Cân bằng & Cấu hình

| Tham số | Giá trị | Ghi chú |
|---------|---------|---------|
| Số ngựa mỗi player | 3 | |
| Số ô mỗi Arm Path (kể cả Start) | 10 | |
| Số ô Goal Path | 4 | |
| Số ô bàn cờ | 61 (ID 0–60) | |
| Start tile P1 | 51 | |
| Start tile P2 | 0 | |
| Final Goal P1 | 31 | |
| Final Goal P2 | 25 | |
| ATK khởi đầu mỗi ngựa | 0 | |
| TILE_REWARD_ATK | = character.atk (Pillow: 30) | Khi đáp ô cùng Affinity; nhân ×2 nếu `tileGainMultiplier = ×2` |
| TILE_REWARD_MAG | = character.mag (Pillow: 10) | Khi đáp ô khác Affinity; nhân ×2 nếu `tileGainMultiplier = ×2` |
| DOUBLE_ROLL_COOLDOWN_ROUNDS | 2 | Per-player |
| MAX_CONSECUTIVE_ROLLS | 3 | Tối đa 3 lần roll liên tiếp (1 normal + 2 extra) |
| COMBO_T1_ATK_BONUS | +150 ATK | Tất cả ngựa mỗi combo |
| COMBO_T2_MULTIPLIER | ×2 | `tileGainMultiplier` từ milestone 2 (Lv2+) |
| COMBO_T3_ATK_MULTIPLIER | ×1.5 (làm tròn lên) | Tất cả ngựa từ milestone 3 (Lv3) |
| ULTIMATE_COST_EXTRA_ROLL | 50 MAG | |
| Power Roll accuracy | 20% | Xác suất target range |
| magCap | — | Xem Balance file riêng |
| maxElementQueue | — | Xem Balance file riêng |
| Default Level | Lv3 | |

---

## 7. Chỉ số đánh giá

| Chỉ số | Mô tả | Mục tiêu | Cách đo |
|--------|-------|----------|---------|
| Thời lượng ván đấu | Thời gian từ bắt đầu đến kết thúc. | ≤ 10 phút | `matchEndTime - matchStartTime` |
| Tỷ lệ KO vs Round Limit | % ván kết thúc bằng KO so với hết Round. | TBD — xác định sau playtesting | (vàn KO) / (tổng ván) vs (vàn hết Round) / (tổng ván) |
| Số combo trung bình / ván / player | Mức độ khai thác cơ chế combo. | ≥ 2 combo / ván / player | Tổng `comboCount` sau ván chia 2 |
| Thời gian action trung bình / lượt | Thời gian ra quyết định mỗi turn. | ≤ 20 giây | `totalActionTime[player] / totalTurns` |
| Tỷ lệ kích hoạt Extra Roll | % lượt `mag ≥ 50` mà player dùng Ultimate Extra Roll. | 40–70% | Số lần kích hoạt / số lượt `mag ≥ 50` |

---

## 8. Phụ thuộc

- Phụ thuộc vào GDD: Không có (concept độc lập).
- Thay đổi server cần thiết: có — cần server mới xử lý logic Elemental Hunter.
- Thay đổi client cần thiết: có — client mới với board 61 ô, UI cho token, Element Queue, Artifact selection.
- Config keys cần thiết: `doubleRollCooldown`, `maxConsecutiveRolls`, `magCap`, `maxElementQueue`, `comboTiers`, `characterStats`, `artifactPool`.

---

## 9. Kịch bản kiểm thử

1. Given ngựa đáp ô Elemental có nguyên tố == Affinity, When xác nhận đáp, Then ngựa nhận +ATK bằng `character.atk`.
2. Given ngựa đáp ô Elemental có nguyên tố != Affinity, When xác nhận đáp, Then player nhận +MAG bằng `character.mag`.
3. Given Element Queue = [Fire, Fire, Fire], When thêm Fire, Then C3 được kích hoạt: 3 Fire bị xóa, tất cả ngựa nhận +150 ATK (Tier 1), queue quét lại.
4. Given ngựa A đáp ô có ngựa B của đối thủ và ô không phải Safe Zone, When đáp, Then `HP[owner(B)] -= ATK[A]` và ngựa B được đẩy về Safe Zone gần nhất phía sau.
5. Given ngựa đạt Final Goal, When xác nhận, Then player chọn 1 nguyên tố thêm vào cuối Element Queue, ngựa tấn công đối thủ bằng `ATK[ngựa]`, sau đó ngựa trở về Safe Zone của player.
6. Given player có `consecutiveRollsThisTurn = 3` (đã đạt MAX_CONSECUTIVE_ROLLS), When roll Double (2 xúc xắc giống nhau), Then không được cấp extra turn.
7. Given queue có 1 nguyên tố duy nhất, When player dùng Artifact Swap, Then Swap không có hiệu lực (artifact bỏ qua, không thay đổi queue).
8. Given ngựa có `frozenRounds > 0`, When lượt chọn ngựa, Then ngựa không hiển thị như một lựa chọn hợp lệ.

---

## 10. Câu hỏi mở / TBD

| # | Câu hỏi | Chủ sở hữu | Trạng thái |
|---|---------|------------|------------|
| 1 | Target cho Balance metrics (Tỷ lệ KO vs Round Limit, HP còn lại %, ATK trung bình, Số Round trung bình) — xác định sau playtesting | Designer | Open |
| 2 | Target cho Tỷ lệ dùng từng loại Artifact theo giai đoạn ván — xác định sau playtesting | Designer | Open |
| 3 | Giá trị cụ thể cho `magCap` và `maxElementQueue` chưa được định nghĩa trong concept — cần balance file riêng. | Balance Designer | Open |
| 4 | Affinity của Character Pillow chưa xác định (TBD). | Character Designer | Open |
| 5 | Các Character khác cần được thiết kế (Affinity, ATK, MAG, HP, Combo Rewards, Ultimate). | Character Designer | Open |
| 6 | UI/UX chi tiết cho Artifact selection popup và Element Queue visualization chưa được mô tả đầy đủ. | UI/UX Designer | Open |
| 7 | Cơ chế Power Roll: player chọn target range như thế nào (slider 2–12 hay specific numbers)? Cần prototype. | Gameplay Programmer | Open |
| 8 | Kịch bản khi cả 2 player cùng về đích trong cùng turn sequence — có xảy ra không? Cần xác định thứ tự xử lý. | Game Designer | Open |
| 9 | Khi ngựa bị kick và về Safe Zone, nếu Safe Zone đã có ngựa cùng đội? Quy tắc xếp chồng? | Game Designer | Open |
| 10 | Nếu player có `mag >= 50` nhưng đã ở Consecutive Roll Cap, Ultimate Extra Roll có được kích hoạt không? (Cap có áp dụng cho Ultimate?). | Game Designer | Open |
