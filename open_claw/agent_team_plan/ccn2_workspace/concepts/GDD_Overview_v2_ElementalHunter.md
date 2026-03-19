# Elemental Hunter — Game Design Document

## Overview

| Field         | Value              |
|---------------|--------------------|
| Game Name     | Elemental Hunter   |
| Author        | tramdm             |
| Date          | 09-03-2026         |
| Last Modified | 10-03-2026         |
| Version       | v2                 |
| Status        | Drafted            |

## Change Log

| Version | Date       | Changed By | Summary of Changes |
|---------|------------|------------|--------------------|
| v2.3    | 16-03-2026 | tramdm     | Thêm giới hạn Consecutive Roll: tối đa 3 lần roll liên tiếp / turn sequence (1 normal + 2 extra); áp dụng cho cả Roll Double và Ultimate Extra Roll |
| v2.2    | 16-03-2026 | tramdm     | Thêm cơ chế Roll Double (đổ đôi → extra turn) + Double Roll Cooldown (2 round per player); đổi Mana → MAG; tile reward phụ thuộc character stats (ATK/MAG); HP theo character |
| v2.1    | 11-03-2026 | tramdm     | Bổ sung cơ chế Game Start của Element Affinity: đầu ván thêm 1 nguyên tố cùng Affinity vào đầu Element Queue |
| v2      | 10-03-2026 | tramdm     | Cập nhật format theo template mới; đổi tên char1 → Pillow; cập nhật mô tả và target metrics Power Roll / Artifact / Ultimate |
| v1      | 09-03-2026 | tramdm     | Initial draft |

## Related Documents

- [INDEX_ElementalHunter_v1.md](./INDEX_ElementalHunter_v1.md)

---

## Mechanics

### 1. Board & Turn Structure

#### 1.1 Bàn cờ

Elemental Hunter sử dụng bàn cờ hình Chữ thập(+) isomatic gồm 61 ô (ID 0–60), chia làm 4 cánh. Mỗi cánh được gắn với 1 Player (Player1, Player2, Player3, Player4) nhưng game thực chất là **2 người chơi** — chỉ Player1 và Player2 tham gia. 4 cánh vẫn tồn tại trên bàn cờ và tất cả đường đi vẫn hoạt động; 2 cánh còn lại là địa hình của bàn cờ nhưng không có người chơi.

**Cấu trúc bàn cờ:**

- **Arm Path (đường cánh):** Mỗi cánh có 10 ô (gồm cả Start tile). Đây là đường đi từ khu vực riêng của player ra ngoài để hòa vào Main Loop.
- **Main Loop (vòng chính):** Vòng nối 4 cánh với nhau. Ngựa di chuyển theo chiều kim đồng hồ trên vòng này.
- **Branch Point (điểm rẽ nhánh):** Mỗi cánh có 1 Branch Point nằm ngay trước Start tile của cánh đó trên Main Loop. Khi ngựa đến Branch Point:
  - Nếu là ngựa của chính player sở hữu cánh đó → rẽ vào Goal Path.
  - Ngựa của player khác → tiếp tục Main Loop, đi qua Start tile của cánh đó.
- **Goal Path (đường về đích):** 4 ô nằm phía trong, dẫn từ Branch Point đến Final Goal. Chỉ ngựa của chủ cánh mới có thể vào.
- **Final Goal (ô đích):** Ô cuối cùng của Goal Path. Ngựa đến đây kích hoạt chuỗi sự kiện Về Đích.

**Loại ô theo nguyên tố:**

Mỗi ô trên bàn cờ thuộc 1 trong các loại sau:
- **Elemental Tile (Fire / Ice / Grass / Rock):** Ô có nguyên tố. Khi ngựa đáp xuống, nguyên tố được thu thập.
- **Empty Tile:** Ô không có nguyên tố. Khi ngựa đáp xuống, kích hoạt tương tác Artifact (xem phần 5).
- **Safe Zone:** Ô an toàn. Ngựa đứng trên Safe Zone không thể bị Kick.
- **Start Tile:** Ô xuất phát của mỗi cánh. Đồng thời là một Safe Zone.

**Tái sinh nguyên tố:**

Khi ngựa rời khỏi một Elemental Tile đã bị thu thập nguyên tố (`currentElement = null`), ô đó tái sinh lại nguyên tố theo loại gốc của mình.

---

#### 1.2 Token (Ngựa)

Mỗi player có **3 ngựa**. Mỗi ngựa là thực thể độc lập với chỉ số riêng:

| Chỉ số | Giá trị ban đầu | Ghi chú |
|---|---|---|
| ATK | 0 | Tăng dần qua gameplay |
| Frozen Rounds | 0 | Số lượt bị đóng băng, không di chuyển được |

Trên giao diện, mỗi ngựa hiển thị chỉ số ATK hiện tại của nó.

**Vị trí khởi đầu:** 3 ngựa của mỗi player được rải đều trên 3 ô đầu tiên của Arm Path, không xếp chồng tại Start.

---

#### 1.3 Lượt chơi (Turn)

Một lượt chơi gồm các bước tuần tự:

1. Player đổ 2 xúc xắc (có thể dùng Power Roll — xem 1.5).
   - Nếu 2 xúc xắc ra **cùng số** (**Roll Double / Đổ Đôi**) → player nhận thêm 1 lượt đổ xúc xắc ngay sau lượt này (xem 1.6).
2. Player chọn 1 ngựa hợp lệ để di chuyển.
3. Ngựa di chuyển số bước = tổng 2 xúc xắc.
4. Xử lý ô đáp: nhận nguyên tố / tương tác Empty Tile / Kick / Về đích.
5. Kết thúc lượt → chuyển sang player tiếp theo.

**Thứ tự lượt:** P1 → P2 → P1 → P2 … Mỗi lần cả 2 player đều đi xong tính là 1 **Round**.

**Ngựa bị đóng băng (Frozen):** Ngựa có `frozenRounds > 0` không thể được chọn để di chuyển trong lượt đó. Sau mỗi lượt kết thúc, `frozenRounds` giảm 1.

---

#### 1.4 Di chuyển Ngựa

- Player chọn 1 ngựa hợp lệ (không bị Frozen; ô đích không bị chặn bởi ngựa cùng đội).
- Ngựa di chuyển tuần tự từng ô theo đúng thứ tự đường đi đã định nghĩa.
- Khi qua Branch Point:
  - Ngựa của đúng player sở hữu → vào Goal Path.
  - Ngựa player khác → đi tiếp trên Main Loop, qua Start tile của cánh đó.
- **Nếu số bước đủ hoặc vượt qua Final Goal:** ngựa dừng tại Final Goal (không bị đi quá đích).

---

#### 1.5 Power Roll (Đổ Xúc Xắc Có Chủ Đích)

Power Roll là chế độ đổ xúc xắc thay thế cho đổ hoàn toàn ngẫu nhiên:

- Player chọn một **khoảng giá trị mục tiêu** (target range) mà họ muốn xúc xắc ra.
- Khi bấm dừng: **20% xác suất** kết quả rơi vào khoảng mục tiêu đã chọn.
- **80% xác suất** còn lại: kết quả hoàn toàn ngẫu nhiên.

Power Roll không thay đổi phân phối xác suất cơ bản — nó chỉ tạo thêm cơ hội nhỏ để người chơi có tác động đến kết quả.

---

#### 1.6 Roll Double (Đổ Đôi)

**Roll Double** xảy ra khi 2 xúc xắc ra **cùng số** (ví dụ: 3-3, 6-6).

**Phần thưởng:**
- Player nhận thêm **1 lượt đổ xúc xắc** (extra turn) ngay sau khi kết thúc di chuyển của lượt hiện tại. Lượt bổ sung này không chuyển sang player đối thủ.

**Double Roll Cooldown:**
- Sau khi đổ đôi thành công, player đó sẽ **không thể đổ đôi trong 2 round kế tiếp** (tính từ round có lần đổ đôi đó).
- Cooldown **áp dụng riêng cho từng player**: nếu Player1 đang trong cooldown thì Player2 vẫn có thể đổ đôi bình thường.
- Số round cooldown còn lại: `doubleRollCooldown` (xem Balance & Config).

**Consecutive Roll Cap:**
- Trong một turn sequence, player **chỉ được roll xúc xắc tối đa `MAX_CONSECUTIVE_ROLLS` lần** (mặc định: 3).
- Tức là: 1 lần roll bình thường + tối đa 2 extra turn liên tiếp.
- Giới hạn này áp dụng cho **tất cả nguồn extra turn**: Roll Double và Ultimate Extra Roll.
- Khi cap đã đạt:
  - **Roll Double** không còn cấp extra turn dù 2 xúc xắc ra cùng số.
  - **Ultimate Extra Roll** không thể kích hoạt.
- Biến theo dõi: `consecutiveRollsThisTurn` (reset về 0 khi turn chuyển sang player khác).

> **Lý do thiết kế:** Ngăn chặn kịch bản cực đoan — player tích MAG, dùng Ultimate liên tục kết hợp Roll Double, chiếm quá nhiều lượt trong cùng 1 round. Cap 3 lần đảm bảo không có player nào roll xúc xắc quá 3 lần liên tiếp.

---

#### 1.7 Điều kiện Thắng / Thua

**KO (Knockout):** HP của một player về ≤ 0 → player còn lại thắng ngay lập tức.

**Hết Round:** Sau khi hoàn thành số Round tối đa (`maxRounds`) → player có HP cao hơn thắng.

**Tie-break:** Nếu 2 player có HP bằng nhau khi hết Round → **Player2 thắng** (ưu thế người đi sau — Last Mover Advantage).

---

### 2. Element Collection & Combo System

#### 2.1 Elemental Tile

Các ô Elemental được gán 1 trong 4 loại nguyên tố cố định: **Fire, Ice, Grass, Rock**.

Mỗi ô có trạng thái `currentElement`:
- **Có nguyên tố:** Khi ngựa đáp xuống → nguyên tố được thu thập vào Element Queue; `currentElement` về `null`.
- **Không có nguyên tố (`null`):** Ngựa đáp xuống không nhận nguyên tố từ ô; khi ngựa khác rời khỏi ô này → ô tái sinh nguyên tố theo loại gốc.

---

#### 2.2 Element Affinity

Mỗi player có 1 **Element Affinity** (nguyên tố chủ đạo), là 1 trong 4 loại. **Affinity được quyết định bởi Character mà player sử dụng** (xem phần 6).

**Khi bắt đầu ván (Game Start):**
- **1 nguyên tố cùng loại với Affinity** được thêm vào **đầu Element Queue** của player.

Khi ngựa đáp xuống Elemental Tile (có `currentElement`):
- **Nguyên tố = Affinity của player:** Ngựa đó nhận +ATK bằng với chỉ số **ATK của nhân vật** mà player sử dụng (xem phần 6 & Balance).
- **Nguyên tố ≠ Affinity:** Player tích được +MAG bằng với chỉ số **MAG của nhân vật** (không gắn với ngựa cụ thể).

---

#### 2.3 Element Queue

Element Queue là hàng đợi lưu các nguyên tố đã thu thập, dùng để kích hoạt Combo:

- Kích thước tối đa: `maxElementQueue` (xem Balance file riêng).
- Nguyên tố mới được **thêm vào cuối** queue.
- Khi queue đầy, nguyên tố **cũ nhất (đầu queue) bị đẩy ra** để nhường chỗ.

---

#### 2.4 Combo (C3 & C4)

Sau mỗi lần thêm nguyên tố vào queue, hệ thống quét **toàn bộ queue** để tìm combo:

**C3 — Triple Threat:** 3 nguyên tố **giống nhau** xuất hiện liên tiếp ở bất kỳ vị trí nào trong queue.
> Ví dụ: `[Ice, **Fire, Fire, Fire**, Grass]` → C3 tại vị trí 1–3.

**C4 — Elemental Master:** 4 nguyên tố **khác nhau hoàn toàn** xuất hiện liên tiếp ở bất kỳ vị trí nào.
> Ví dụ: `[**Fire, Ice, Grass, Rock**]` → C4 tại vị trí 0–3.

**Ưu tiên:** C3 được kiểm tra và xử lý trước C4.

**Quy trình xử lý combo:**
1. Các nguyên tố tạo nên combo bị **xóa khỏi queue**.
2. Phần thưởng combo được áp dụng ngay lập tức (xem 2.5).
3. Queue được **quét lại từ đầu** — nếu còn combo tiếp theo → **Cascading Combo** (dây chuyền).
4. Lặp cho đến khi queue không còn combo nào.

---

#### 2.5 Combo Rewards (theo Character)

Phần thưởng combo phụ thuộc vào Character của player (xem phần 6). Với Character hiện tại (Pillow):

**Tier 1 — áp dụng mỗi lần có combo (bất kỳ combo nào):**
- **Power Surge:** +150 ATK cho **toàn bộ ngựa** của player.

**Tier 2 — Milestone: Combo thứ 2** *(chỉ áp dụng ở Lv2 trở lên)*:
- **Double Harvest:** Tile Gain Multiplier tăng lên ×2 (nhận ATK/MAG từ ô gấp đôi).

**Tier 3 — Milestone: Combo thứ 3** *(chỉ áp dụng ở Lv3)*:
- **Absolute Might:** ATK hiện tại của **toàn bộ ngựa** nhân ×1.5 (làm tròn lên).

Combo count (`comboCount`) được **reset về 0** khi bắt đầu ván mới.

---

### 3. Combat

#### 3.1 ATK — Chỉ Số Tấn Công của Ngựa

Mỗi ngựa có chỉ số **ATK** riêng, bắt đầu từ **0** và tăng dần qua gameplay:

| Sự kiện | Thay đổi ATK |
|---|---|
| Đáp ô cùng Affinity | Ngựa đó +ATK (= chỉ số ATK của nhân vật; ×2 nếu Tile Gain Multiplier = ×2) |
| Combo Tier 1 (Power Surge) | Tất cả ngựa +150 ATK |
| Combo Tier 3 (Absolute Might) | Tất cả ngựa × 1.5 ATK (làm tròn lên) |

ATK của ngựa **không giảm** trong suốt ván (trừ khi bị Kick — xem 3.2).

---

#### 3.2 Kick (Bắt Ngựa Đối Thủ)

Khi ngựa A của Player X đáp xuống ô đang có ngựa B của Player Y, **và ô đó không phải Safe Zone**:

1. **Gây sát thương lên Player Y:** `HP[Y] -= ATK[A]`.
   - Nếu ATK[A] = 0 → không gây sát thương nhưng ngựa B vẫn bị đẩy lùi.
2. **Ngựa B bị đẩy lùi** đến Safe Zone gần nhất phía sau vị trí hiện tại của nó (tính theo chiều ngựa B đang đi).
3. ATK của ngựa B **không bị reset** (giữ nguyên chỉ số).

`kickCount` của Player X tăng 1 (dùng cho metrics).

---

#### 3.3 HP — Máu Người Chơi

Mỗi player có 1 thanh HP, giá trị khởi đầu được quyết định bởi **Character mà player sử dụng** (xem phần 6), không cố định theo Level.

| Character | HP mặc định |
|---|---|
| Pillow | 1000 |

> **Ghi chú:** HP gắn với Character, không phải Level. Level vẫn ảnh hưởng Max Rounds, Artifact Slots, Combo Tier tối đa — nhưng không điều chỉnh HP.

HP chỉ giảm khi:
- Bị Kick (ngựa đối thủ đáp cùng ô — xem 3.2).
- Ngựa đối thủ về đích và tấn công (xem 3.4).

HP **không hồi phục một cách tự nhiên** trong suốt ván đấu, trừ khi có ultimate, kỹ năng hoặc vật phẩm hỗ trợ hồi máu.

---

#### 3.4 Về Đích (Final Goal)

Khi ngựa của một player đặt chân vào **Final Goal** (ô đích cuối Goal Path):

1. **Goal Reward:** Player chọn 1 trong 4 loại nguyên tố để thêm vào **cuối Element Queue**.
2. **Kiểm tra Combo:** Nếu nguyên tố vừa thêm kích hoạt C3 hoặc C4 → Combo được xử lý ngay (ATK của ngựa có thể tăng qua Tier 1/3).
3. **Tấn công trực tiếp:** Ngựa vừa về đích tấn công HP đối thủ bằng **ATK hiện tại** (sau khi đã được cộng từ combo nếu có): `HP[đối thủ] -= ATK[ngựa]`.
4. **Ngựa trả về Safe Zone:** Sau khi tấn công, ngựa trở về Safe Zone của player để tiếp tục ván. ATK của ngựa **được giữ nguyên**.
5. `finishedHorseCount` của player tăng 1.

---

### 4. MAG & Ultimate

#### 4.1 MAG (Magic)

MAG là tài nguyên dùng để kích hoạt Ultimate:

- **Nguồn thu:** Ngựa đáp xuống ô **khác Affinity** → player tích được +MAG bằng với chỉ số MAG của nhân vật (hoặc ×2 nếu Tile Gain Multiplier = ×2).
- **Giới hạn:** MAG không vượt quá `magCap` (xem Balance file riêng). Khi cộng MAG, hệ thống ghi nhận lượng MAG thực tế nhận được (sau khi đã bị cap) để hiển thị feedback.
- MAG **không hao hụt** theo thời gian.

---

#### 4.2 Ultimate: Extra Roll

| Thông số | Giá trị |
|---|---|
| Tên | Extra Roll |
| Mô tả | Nhận thêm 1 lượt đổ xúc xắc ngay trong turn hiện tại |
| Chi phí | 50 MAG |

**Cơ chế:** Khi kích hoạt, `ultimateExtraRolls` tăng 1. Sau khi kết thúc di chuyển của lượt hiện tại, hệ thống kiểm tra nếu còn `ultimateExtraRolls > 0` → tiêu hao 1 count, bắt đầu thêm 1 lượt đổ xúc xắc mới cho player (không chuyển sang player đối thủ).

---

### 5. Artifact (Item / Đạo Cụ)

#### 5.1 Empty Tile

Empty Tile là ô đặc biệt không có nguyên tố. Khi ngựa đáp xuống Empty Tile:
- Hệ thống hiển thị danh sách Artifact **có sẵn trong pool** của player.
- Player chọn và sử dụng **1 Artifact** từ pool đó.
- `emptyTileVisits` của player tăng 1.

---

#### 5.2 Các Loại Artifact

| Artifact | Công dụng |
|---|---|
| **Swap** | Đổi chỗ 2 nguyên tố liền kề nhau trong Element Queue |
| **Change** | Đổi 1 nguyên tố bất kỳ trong Queue thành 1 trong 3 loại nguyên tố còn lại (player tự chọn) |
| **Charge** | Thêm 1 nguyên tố cùng **Affinity** của player vào **cuối** Element Queue |

---

#### 5.3 Mở Khóa Artifact Pool

Pool artifact khả dụng mở rộng dựa trên 2 yếu tố: **Level** và **tổng số lần ngựa của player ghé Empty Tile** (`emptyTileVisits`):

**Theo emptyTileVisits:**

| emptyTileVisits | Artifact được mở khóa thêm |
|---|---|
| ≥ 1 | Swap |
| ≥ 2 | Change |
| ≥ 3 | Charge |

**Theo Level (số Artifact Slot):**

Artifact Slot là số lượng artifact mà player có thể lựa chọn khi tương tác với Empty Tile.

| Level | Artifact Slots |
|---|---|
| Lv1 | 1 |
| Lv2 | 2 |
| Lv3 | 3 |

---

### 6. Character System

#### 6.1 Character Hiện Tại (Pillow)

Hiện tại game có **1 Character** (Pillow), cả 2 player đều sử dụng.

Character định nghĩa:
- **Element Affinity** — nguyên tố chủ đạo của player sử dụng character đó.
- **ATK** — chỉ số tấn công của nhân vật; dùng làm lượng ATK ngựa nhận được khi đáp ô cùng Affinity.
- **MAG** — chỉ số phép thuật của nhân vật; dùng làm lượng MAG player nhận được khi đáp ô khác Affinity.
- **HP** — máu khởi đầu của player sử dụng nhân vật này.
- **Combo Rewards** (Tier 1, 2, 3) — xem phần 2.5.
- **Default Ultimate** — Extra Roll.

**Stats của Pillow:**

| Stat | Giá trị |
|---|---|
| Affinity | TBD |
| ATK | 30 |
| MAG | 10 |
| HP | 1000 |

Các character khác sẽ được bổ sung trong tương lai với Affinity, Combo Rewards và Ultimate khác nhau.

---

### 7. Level Difficulty

#### 7.1 Các Mức Level

Trước khi bắt đầu ván, player chọn 1 trong 3 Level. Level quy định:

| Thông số | Lv1 (Beginner) | Lv2 (Intermediate) | Lv3 (Master) |
|---|---|---|---|
| HP mỗi player | theo Character | theo Character | theo Character |
| Max Rounds | 12 | 15 | 15 |
| Combo Tier tối đa | 1 | 2 | 3 |
| Artifact Slots | 1 | 2 | 3 |
| Tile Gain Multiplier mặc định | ×1 | ×1 | ×1 |

**Default Level (nếu không chọn):** Lv3.

---

## Balance & Config

| Tham số | Giá trị | Ghi chú |
|---|---|---|
| Số ngựa mỗi player | 3 | |
| Vị trí khởi đầu ngựa | 3 ô đầu tiên của Arm Path mỗi player | 3 ngựa rải đều, không xếp chồng |
| Start tile P1 | Tile 51 | |
| Start tile P2 | Tile 0 | |
| Final Goal P1 | Tile 31 | |
| Final Goal P2 | Tile 25 | |
| ATK ban đầu mỗi ngựa | 0 | |
| TILE_REWARD_ATK | = ATK của nhân vật (Pillow: 30) | Nhận khi đáp ô cùng Affinity; giá trị thực lấy từ `character.atk` |
| TILE_REWARD_MAG | = MAG của nhân vật (Pillow: 10) | Nhận khi đáp ô khác Affinity; giá trị thực lấy từ `character.mag` |
| DOUBLE_ROLL_COOLDOWN_ROUNDS | 2 | Số round không thể đổ đôi sau khi đổ đôi thành công; áp dụng per-player |
| MAX_CONSECUTIVE_ROLLS | 3 | Số lần roll xúc xắc tối đa liên tiếp trong 1 turn sequence (1 normal + 2 extra). Giới hạn cả Roll Double và Ultimate Extra Roll. Code: `consecutiveRollsThisTurn` |
| COMBO_T1_ATK_BONUS | +150 ATK | Tất cả ngựa, mỗi lần có combo |
| COMBO_T3_ATK_MULTIPLIER | ×1.5 (làm tròn lên) | Tất cả ngựa, áp dụng ở milestone combo thứ 3 |
| ULTIMATE_COST_EXTRA_ROLL | 50 MAG | |
| Power Roll accuracy | 20% | Xác suất rơi vào khoảng target |
| Artifact unlock — Swap | ≥ 1 empty tile visit | |
| Artifact unlock — Change | ≥ 2 empty tile visits | |
| Artifact unlock — Charge | ≥ 3 empty tile visits | |
| Số ô bàn cờ | 61 ô (ID 0–60) | |
| Số ô mỗi Arm Path (kể cả Start) | 10 | |
| Số ô Goal Path | 4 | |
| Default Level | Lv3 | |
| manaCap | — | Xem Balance file riêng |
| maxElementQueue | — | Xem Balance file riêng |

---

## Metrics

*Dựa trên mục tiêu: phát hành cho casual player, ván đấu mục tiêu ≤ 10 phút.*

### Hành vi người chơi (User Behavior)

*Mục đích: hiểu cách người chơi tương tác với game, phân tệp người chơi theo phong cách.*

| Metric | Mô tả | Mục tiêu | Cách đo |
|---|---|---|---|
| Thời lượng ván đấu | Thời gian từ lúc bắt đầu đến kết thúc. Phân loại player theo thói quen session ngắn/dài. | ≤ 10 phút | `matchEndTime - matchStartTime` |
| Thời gian action trung bình / lượt | Thời gian ra quyết định mỗi turn. Phân biệt player nhanh (casual) vs player chậm (strategic). | ≤ 20 giây trung bình | `totalActionTime[playerId] / totalTurns` |
| Số combo trung bình / ván / player | Mức độ khai thác cơ chế combo. Player nào không dùng combo → có thể cần hướng dẫn hoặc cơ chế đơn giản hơn. | ≥ 2 combo / ván / player | Tổng `comboCount` sau ván |
| Số kick trung bình / ván | Mức độ tương tác đối kháng. Player ít kick → có thể đang chơi "tránh né" hoặc không hiểu cơ chế. | ≥ 3 kick / ván | `kickCount[P1] + kickCount[P2]` |
| Tỷ lệ sử dụng Power Roll | % lượt mà player chủ động bật chế độ Power Roll (chọn target range trước khi bấm dừng xúc xắc). Phân biệt với đổ ngẫu nhiên: chỉ tính khi player đã chọn target range. Tỷ lệ thấp → player bỏ qua mechanic; tỷ lệ quá cao → dùng như phản xạ, không phải quyết định. | 30–60% | Số lần player kích hoạt Power Roll mode / tổng số lần đổ xúc xắc |
| Tỷ lệ sử dụng Artifact | % lần ghé Empty Tile mà player dùng Artifact. **Chỉ tính các lần có ≥ 1 artifact khả dụng** (đã mở khóa theo emptyTileVisits & Level; loại trừ trường hợp tất cả artifact không thể dùng — ví dụ Swap khi queue chỉ có 1 nguyên tố). | ≥ 80% | Số lần dùng Artifact / số lần ghé Empty Tile có ≥ 1 artifact khả dụng |
| Tỷ lệ dùng từng loại Artifact theo giai đoạn ván | Phân bố tỷ lệ Swap / Change / Charge theo giai đoạn (early / mid / late round). Giúp xác định item nào được ưa dùng ở giai đoạn nào. **Lọc theo Level** để loại sai số từ artifact chưa mở khóa. | TBD — xác định sau playtesting | Đếm số lần dùng mỗi loại artifact trong từng round segment. Chỉ tính các lần artifact đã được mở khóa tại Level đang chơi. |
| Tỷ lệ kích hoạt Extra Roll | % lượt MAG ≥ 50 mà player kích hoạt Extra Roll. Đo riêng theo từng loại Ultimate vì mỗi loại có pattern tối ưu khác nhau (Extra Roll kỳ vọng dùng nhiều lần; các Ultimate loại "kết liễu" trong tương lai có thể giữ để dùng 1 lần quyết định). | 40–70% | Số lần kích hoạt Extra Roll / số lượt `player.mag ≥ 50` |

### Cân bằng (Balance)

*Mục đích: phát hiện sự mất cân bằng trong các cơ chế, điều chỉnh tham số.*

| Metric | Mô tả | Mục tiêu | Cách đo |
|---|---|---|---|
| Tỷ lệ KO vs Round Limit | % ván kết thúc bằng KO so với hết Round. KO quá cao → game quá sát thương; KO quá thấp → round system không có ý nghĩa. | TBD — xác định sau playtesting | Theo dõi điều kiện thắng |
| HP còn lại khi kết thúc (Round Limit) | Tỷ lệ HP còn lại của người thắng khi hết Round. Quá cao → Round không tạo áp lực; quá thấp → KO nên xảy ra sớm hơn. | TBD | `winner.hp / maxHP` |
| Tỷ lệ comeback | % ván mà player đang thua thế ở giữa game nhưng vẫn thắng. Quá thấp → game thiếu tính cân bằng. | ≥ 20% | Đo HP chênh lệch tại giữa Round so với kết quả cuối |
| ATK trung bình của ngựa khi kết thúc | ATK trung bình của tất cả ngựa còn sống trên bàn khi ván kết thúc. Quá thấp → combo/affinity không đủ hiệu quả; quá cao → ATK scale vượt tầm HP. | TBD | Tổng ATK tất cả ngựa / tổng số ngựa khi `phase = END` |
| Số Round trung bình / ván | Số Round thực tế khi ván kết thúc. Nếu hầu hết ván kết thúc quá sớm → `maxRounds` quá cao hoặc KO xảy ra quá sớm. | TBD | `currentRound` khi kết thúc |
| Số lần về đích / ván / player | Số ngựa trung bình về đích thành công mỗi ván. Quá ít → Goal Path quá xa hoặc ít tác động chiến thuật. | ≥ 1 / player / ván | Tổng `finishedHorseCount` sau ván |

---

## Open Questions / TBD

| # | Question | Owner | Status |
|---|---|---|---|
| 1 | Target cho các Balance metrics (Tỷ lệ KO vs Round Limit, HP còn lại %, ATK trung bình, Số Round trung bình) — xác định sau giai đoạn playtesting | Designer | Open |
| 2 | Target cho Tỷ lệ dùng từng loại Artifact theo giai đoạn ván — xác định sau playtesting | Designer | Open |

---

## Glossary

| Thuật ngữ | Định nghĩa |
|---|---|
| **Token / Ngựa** | Quân cờ của người chơi. Mỗi player có 3 ngựa. Code: `token`, `TokenState` |
| **Arm Path** | Đường cánh — 10 ô từ Start đến Main Loop của mỗi player. Code: `ARM_PATHS` |
| **Main Loop** | Vòng chính nối 4 cánh, ngựa đi theo chiều kim đồng hồ |
| **Branch Point** | Điểm rẽ nhánh — ngựa của đúng player → vào Goal Path; player khác → tiếp tục Main Loop. Code: `BRANCH_RULES` |
| **Goal Path** | Đường về đích — 4 ô dẫn vào Final Goal, chỉ ngựa của chủ cánh vào được. Code: `GOAL_PATHS` |
| **Final Goal** | Ô đích cuối Goal Path. Ngựa đến đây kích hoạt chuỗi Về Đích. Code: `FINAL_GOALS` |
| **Safe Zone** | Ô an toàn — ngựa không bị Kick khi đứng đây. Code: `TileType.SafeZone` |
| **Empty Tile** | Ô không có nguyên tố, kích hoạt tương tác Artifact khi ngựa đáp xuống. Code: `EMPTY_TILE_IDS` |
| **Element / Nguyên tố** | 4 loại: Fire, Ice, Grass, Rock. Thu thập khi ngựa đáp Elemental Tile. Code: `TileType` (Fire, Ice, Grass, Rock) |
| **Element Queue** | Hàng đợi nguyên tố của mỗi player, dùng để kiểm tra và kích hoạt Combo. Code: `elementQueue` |
| **Element Affinity** | Nguyên tố chủ đạo của player, được quyết định bởi Character. Đầu ván: 1 nguyên tố cùng Affinity được thêm vào đầu Element Queue. Đáp ô cùng Affinity → +ATK (= `character.atk`); khác Affinity → +MAG (= `character.mag`). Code: `elementAffinity` |
| **Combo C3 — Triple Threat** | 3 nguyên tố giống nhau liên tiếp trong queue. Code: xử lý trong `processCombos` |
| **Combo C4 — Elemental Master** | 4 nguyên tố khác nhau hoàn toàn liên tiếp trong queue. Code: xử lý trong `processCombos` |
| **Cascading Combo** | Combo dây chuyền — sau khi 1 combo được xóa, phần còn lại của queue tạo ra combo mới tiếp theo. |
| **Combo Tier** | Cấp phần thưởng combo. Tier 1 áp dụng mỗi combo; Tier 2 (milestone 2) và Tier 3 (milestone 3) mở khóa 1 lần duy nhất. Code: `comboTier`, `comboCount` |
| **Combo Count** | Tổng số lần combo đã được kích hoạt trong ván. Reset về 0 đầu ván. Code: `comboCount` |
| **ATK** | Chỉ số tấn công của từng ngựa. Dùng khi Kick và Về Đích. Code: `token.atk` |
| **Kick / Bắt ngựa** | Ngựa đáp xuống ô có ngựa đối thủ → gây sát thương HP, đẩy ngựa đối thủ lùi về Safe Zone gần nhất. Code: `kickOccurred` |
| **HP** | Máu của player. Về 0 → thua. Giá trị khởi đầu theo Character. Code: `player.hp` |
| **MAG (Magic)** | Tài nguyên dùng Ultimate, tích lũy khi đáp ô khác Affinity. Lượng nhận = `character.mag`. Code: `player.mag` |
| **magCap** | Giới hạn MAG tối đa. Xem Balance file riêng. Code: `player.magCap` |
| **Ultimate** | Kỹ năng đặc biệt kích hoạt bằng MAG. Hiện tại: Extra Roll. Code: `UltimateType` |
| **Extra Roll** | Ultimate — nhận thêm 1 lượt đổ xúc xắc trong turn hiện tại. Cost: 50 MAG. Code: `ultimateExtraRolls` |
| **Roll Double / Đổ Đôi** | 2 xúc xắc ra cùng số → nhận extra turn ngay sau lượt hiện tại. Code: `hasRolledDoubles`, `extraTurnActive` |
| **Double Roll Cooldown** | Sau khi đổ đôi, player không thể đổ đôi trong `DOUBLE_ROLL_COOLDOWN_ROUNDS` round tiếp theo. Áp dụng per-player. Code: `doubleRollCooldown` |
| **Consecutive Roll Cap** | Giới hạn tối đa số lần roll xúc xắc liên tiếp trong 1 turn sequence. Mặc định 3 lần (1 + 2 extra). Áp dụng cho cả Roll Double và Ultimate Extra Roll. Code: `consecutiveRollsThisTurn`, `MAX_CONSECUTIVE_ROLLS` |
| **Power Roll** | Chế độ đổ xúc xắc có chủ đích. 20% xác suất rơi vào khoảng giá trị mong muốn. Code: `accuracyRate` |
| **Round** | 1 vòng = cả 2 player đều đi xong 1 lượt. Code: `currentRound` |
| **Turn / Lượt** | Lượt đi của 1 player. Code: `phase` |
| **maxRounds** | Số Round tối đa của ván. Khi đạt → kết thúc bằng so sánh HP. Code: `maxRounds` |
| **Last Mover Advantage** | Quy tắc tie-break: khi hết Round, nếu HP bằng nhau → Player2 thắng. |
| **Artifact / Item / Đạo cụ** | Vật phẩm cho phép tương tác với Element Queue. 3 loại: Swap, Change, Charge. |
| **Swap** | Artifact — đổi chỗ 2 nguyên tố liền kề trong Queue. |
| **Change** | Artifact — đổi 1 nguyên tố trong Queue thành 1 trong 3 loại còn lại. |
| **Charge** | Artifact — thêm 1 nguyên tố cùng Affinity vào cuối Queue. |
| **emptyTileVisits** | Số lần ngựa của player ghé Empty Tile. Dùng để mở khóa Artifact. Code: `emptyTileVisits` |
| **Artifact Slot** | Số lượng artifact khả dụng để chọn khi ghé Empty Tile (tăng theo Level). |
| **Tile Gain Multiplier** | Hệ số nhân phần thưởng nhận từ ô (ATK/MAG). Mặc định ×1, tăng lên ×2 qua Combo Tier 2. Code: `tileGainMultiplier` |
| **finishedHorseCount** | Số ngựa đã về đích trong ván. Code: `finishedHorseCount` |
| **Frozen / Đóng băng** | Trạng thái ngựa không thể di chuyển trong N lượt. Code: `token.frozenRounds` |
| **Character** | Nhân vật do player chọn, quyết định Element Affinity, Combo Rewards và Default Ultimate. Code: `CharacterDefinition` |
| **Pillow** | Character hiện tại (tên tạm thời). Affinity: TBD. ATK: 30. MAG: 10. HP: 1000. Combo Rewards: Power Surge / Double Harvest / Absolute Might. Ultimate: Extra Roll. |
| **Goal Reward** | Phần thưởng khi ngựa về đích — player chọn 1 nguyên tố thêm vào cuối Queue. |
| **maxElementQueue** | Kích thước tối đa của Element Queue. Xem Balance file riêng. |
<!-- Updated: 2026-03-18 21:49:07 -->
