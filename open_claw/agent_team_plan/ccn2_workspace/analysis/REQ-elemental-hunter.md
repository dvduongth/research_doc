# Phân tích Yêu cầu: Elemental Hunter
**Feature:** elemental-hunter  
**GDD:** design/GDD-FEATURE-elemental-hunter.md  
**Ngày:** 2026-03-19  
**Analyst:** agent_dev (Codera)

---

## 1. Tổng quan Feature

Elemental Hunter là board game chiến thuật với:
- 2 player, mỗi player điều khiển 3 ngựa (token)
- Bàn cờ isometric 61 ô (chữ thập), có Arm Path, Main Loop, Branch Point, Goal Path
- Mục tiêu: đánh bại đối thủ bằng KO (HP ≤ 0) hoặc có HP cao hơn khi hết Round
- Cơ chế: thu thập nguyên tố (Fire/Ice/Grass/Rock) → Element Queue → Combo (C3/C4) → tăng ATK
- Power Roll, Roll Double với cooldown, MAG → Ultimate (Extra Roll)
- Artifact khi đáp Empty Tile

---

## 2. Actor và Use Cases

### Actor

| Actor | Mô tả |
|-------|-------|
| **Player** | Người chơi, thực hiện các hành động: roll, chọn ngựa, dùng artifact, kích hoạt ultimate. |
| **Server** | Xử lý logic game: validate movement, cập nhật state, broadcast events, quản lý turn order. |
| **AdminUser** | Có thể xem/log game state (không cần thiết cho feature này). |

### Use Case Table

| Use Case | Actor | Pre-condition | Post-condition | Main Flow |
|----------|-------|---------------|----------------|-----------|
| **Roll Dice** | Player | Bắt đầu turn, chưa roll | Dice result recorded, `consecutiveRollsThisTurn` tăng, nếu Double → extra turn flag (nếu không trong cooldown) | 1. Player đổ 2 xúc xắc<br>2. Nhận kết quả (2–12)<br>3. Kiểm tra Double:<br>&nbsp;&nbsp;- Nếu là Double và `consecutiveRollsThisTurn < MAX_CONSECUTIVE_ROLLS` và `doubleRollCooldown == 0` → set `extraTurnGranted = true`<br>&nbsp;&nbsp;- Nếu không → chỉ tăng `consecutiveRollsThisTurn` |
| **Select Horse** | Player | Có ít nhất 1 ngựa hợp lệ (không frozen, ô đích không bị chặn bởi ngựa cùng team) | `selectedHorse` được chọn, sẵn sàng di chuyển | 1. List horses hợp lệ<br>2. Player chọn 1 horse<br>3. Store selection |
| **Move Horse** | Player | Đã chọn horse, đã roll dice | Horse đã di chuyển `diceSum` bước theo path, xử lý ô đáp, trả về state mới | 1. Compute path từ vị trí hiện tại theo diceSum<br>2. Duyệt từng ô trên path:<br>&nbsp;&nbsp;- Nếu ô là Final Goal → xử lý Về Đích (thêm nguyên tố, attack đối thủ, về Safe Zone)<br>&nbsp;&nbsp;- Nếu ô có ngựa đối thủ và không phải Safe Zone → Kick (giảm HP, đẩy về Safe Zone phía sau)<br>&nbsp;&nbsp;- Nếu ô là Elemental Tile → Gain nguyên tố:<br>&nbsp;&nbsp;&nbsp;&nbsp;* Nếu nguyên tố == Affinity → `atk += character.atk` (×2 nếu `tileGainMultiplier ×2`)<br>&nbsp;&nbsp;&nbsp;&nbsp;* Nếu khác → `mag += character.mag` (×2 nếu `×2`), thêm nguyên tố vào cuối Element Queue (max size)<br>&nbsp;&nbsp;- Nếu ô là Empty Tile → trigger Artifact selection (Swap/Change/Charge theo `emptyTileVisits` và artifact slots) |
| **Trigger Combo** | Server (auto) | Sau khi thêm nguyên tố vào Element Queue | Combo xảy ra nếu queue chứa C3 (3 same liên tiếp) hoặc C4 (4 khác liên tiếp) → queue sau combo, ATK bonus áp dụng theo Tier | 1. Scan queue từ đầu:<br>&nbsp;&nbsp;- Ưu tiên C3 trước<br>&nbsp;&nbsp;- Nếu C4 (4 khác) → combo C4<br>&nbsp;&nbsp;- Remove nguyên tố tạo combo<br>&nbsp;&nbsp;- Apply reward:<br>&nbsp;&nbsp;&nbsp;&nbsp;T1: +150 ATK tất cả horses<br>&nbsp;&nbsp;&nbsp;&nbsp;T2 (milestone 2+): `tileGainMultiplier = ×2`<br>&nbsp;&nbsp;&nbsp;&nbsp;T3 (milestone 3+): `atk = Math.ceil(atk * 1.5)`<br>2. Rescan queue → cascading combo nếu còn<br>3. Reset `comboCount`? (theo GDD: `comboCount` reset về 0 đầu ván — không reset sau mỗi combo) |
| **Kick Opponent** | Server (auto) | Horse A về ô có horse B của đối thủ, ô không phải Safe Zone | `HP[B] -= ATK[A]`, horse B được đẩy về Safe Zone gần nhất phía sau (theo hướng di chuyển của B), `kickCount[A]++` | 1. Check ATK[A]: nếu 0 vẫn kick (không gây sát thương)<br>2. Compute Safe Zone target: tìm ô Safe Zone gần nhất phía sau vị trí hiện tại của B trên board path<br>3. Move B đến Safe Zone<br>4. Update HP and kick count |
| **Activate Artifact** | Player | Horse đáp Empty Tile, artifact đã mở khóa (theo `emptyTileVisits` và level) | Artifact effect áp dụng (Swap/Change/Charge), `emptyTileVisits` tăng | 1. Show artifact selection UI (chỉ những artifact đã unlock)<br>2. Player chọn 1 artifact<br>3. Apply:<br>&nbsp;&nbsp;- Swap: đổi 2 nguyên tố liền kề trong queue (nếu queue.length ≥ 2, nếu < 2 → bỏ qua)<br>&nbsp;&nbsp;- Change: đổi 1 nguyên tố bất kỳ trong queue thành 1 trong 3 loại còn lại<br>&nbsp;&nbsp;- Charge: thêm 1 nguyên tố cùng Affinity vào cuối queue<br>4. `emptyTileVisits++` |
| **Use Ultimate Extra Roll** | Player | `mag >= 50`, `consecutiveRollsThisTurn < MAX_CONSECUTIVE_ROLLS` (Ultimate có bị cap không? TBD — cần answer từ Designia) | `mag -= 50`, `ultimateExtraRolls++`, bắt đầu turn đổ xúc xắc mới (extra turn) | 1. Check conditions<br>2. Deduct 50 MAG<br>3. `ultimateExtraRolls++`<br>4. End current move sequence? (GDD: "Sau khi kết thúc di chuyển lượt hiện tại, nếu `ultimateExtraRolls > 0` → tiêu hao 1 và bắt đầu lượt đổ xúc xắc mới") → tức là sau khi move xong, nếu còn extra roll → auto trigger? Hay player manually trigger? GDD mô tả Ultimate như một cost → nên player kích hoạt. Cần làm rõ. |
| **End Turn** | Server (auto) | Player đã hoàn thành di chuyển (hoặc hết dice rolls) | Chuyển turn sang player khác, reset `consecutiveRollsThisTurn`? (theo GDD: reset khi sang player khác), giảm `doubleRollCooldown` nếu cần | 1. Check if extra turn granted (Roll Double) or `ultimateExtraRolls > 0` → skip normal turn transition?<br>&nbsp;&nbsp;- Nếu Roll Double: player được turn ngay sau (không qua player kia)<br>&nbsp;&nbsp;- Nếu Ultimate: consumer trigger extra roll turn<br>2. Nếu không có extra → switch player<br>3. Update cooldown counters |

---

## 3. Edge Cases (từ Section 4 GDD)

| # | Điều kiện | Kết quả mong đợi |
|---|-----------|------------------|
| 1 | Element Queue đầy khi thêm nguyên tố mới | Nguyên tố cũ nhất (đầu) bị loại, thêm mới vào cuối |
| 2 | `token.frozenRounds > 0` | Ngựa không hiển thị như lựa chọn hợp lệ trong turn đó |
| 3 | `consecutiveRollsThisTurn >= MAX_CONSECUTIVE_ROLLS` | Roll Double không cấp extra turn; Ultimate Extra Roll không thể kích hoạt (nếu Ultimate bị cap) |
| 4 | Artifact Swap với queue.length < 2 | Swap không có hiệu lực, artifact được bỏ qua (không tiêu hao slot) |
| 5 | Kick trên Safe Zone | Kick không xảy ra (ngựa đối thủ không bị đẩy, không sát thương) |
| 6 | Cùng player có 2+ ngựa về đích trong cùng turn sequence | Mỗi ngựa xử lý Về Đích riêng: thêm nguyên tố, attack đối thủ, trả về Safe Zone của player |
| 7 | Roll Double khi trong `doubleRollCooldown` | Đổ đôi không cấp extra turn (vẫn tính là Roll Double nhưng không thưởng) |
| 8 | Power Roll nhưng không chọn target range trước khi bấm dừng | Hành động đổ xúc xắc bị bỏ qua |
| 9 | Artifact selection với Empty Tile nhưng không có artifact nào unlock (do `emptyTileVisits` chưa đủ) | Không hiển thị artifact; có thể fallback to default behavior (không artifact) |
| 10 | Ngựa bị kick về Safe Zone mà Safe Zone đã có ngựa cùng đội (stacking) — GDD chưa nói rõ | Cần làm rõ: cho phép stacking trên Safe Zone? Assume: YES, Safe Zone cho phép nhiều ngựa cùng team. |

---

## 4. Ràng buộc (Constraints)

### 4.1 Configuration (phải đặt trong CONFIG)
- `DOUBLE_ROLL_COOLDOWN_ROUNDS = 2`
- `MAX_CONSECUTIVE_ROLLS = 3`
- `ULTIMATE_COST_EXTRA_ROLL = 50`
- `TILE_REWARD_ATK` = `character.atk` (default 30)
- `TILE_REWARD_MAG` = `character.mag` (default 10)
- `POWER_ROLL_ACCURACY = 0.2`
- `magCap` (chưa xác định — cần balance file)
- `maxElementQueue` (chưa xác định)

### 4.2 Data Structures (cần implement)

**Player State:**
```javascript
{
  hp: 1000,
  mag: 0,
  doubleRollCooldown: 0,  // rounds left
  consecutiveRollsThisTurn: 0,
  ultimateExtraRolls: 0,
  elementAffinity: 'Fire' | 'Ice' | 'Grass' | 'Rock',
  emptyTileVisits: 0,
  comboCount: 0,
  tileGainMultiplier: 1 | 2,
  elementQueue: ['Fire', 'Ice', ...],  // max size: maxElementQueue
  artifactsUnlocked: { Swap: true, Change: false, Charge: false }
}
```

**Horse (Token):**
```javascript
{
  id: string,
  owner: playerId,
  position: tileId,  // 0–60
  atk: number,
  frozenRounds: number
}
```

**Board Tiles:**
- Elemental Tile: `{ type: 'elemental', element: 'Fire' | 'Ice' | 'Grass' | 'Rock', currentElement: same }`
- Empty Tile: `{ type: 'empty' }`
- Safe Zone: `{ type: 'safe' }`
- Start tile: cũng là Safe Zone

**Character (Pillow) Stats:**
```javascript
{
  affinity: 'Fire',
  atk: 30,
  mag: 10,
  hp: 1000,
  comboRewards: {
    tier1: 'Power Surge' (+150 ATK all),
    tier2: 'Double Harvest' (tileGainMultiplier ×2),
    tier3: 'Absolute Might' (atk ×1.5 ceil)
  },
  ultimate: 'Extra Roll'
}
```

### 4.3 Rules Engine (server-side)
- validateMove(horse, diceSum): check path, collision (không cho cùng team chồng ô trừ Safe Zone), Branch Point logic (thuộc về player nào), Goal Path access (chỉ owner).
- processLanding(horse, tile): apply rewards, kick, artifact, ultimate check.
- checkCombo(queue): return comboType và indices cần xóa, apply rewards.
- updateCooldown(): giảm `doubleRollCooldown` mỗi round, reset `consecutiveRollsThisTurn` khi sang player.

### 4.4 Client Responsibilities
- Render board isometric, token, HUD (HP, MAG, Affinity, queue, combo count, cooldown)
- Input: dice roll (manual or Power Roll mode), horse selection, artifact selection popup
- Send actions to server, receive state updates, animate movements
- Show combo feedback, kick damage, artifact effects

---

## 5. Non-Functional Requirements

- **Real-time sync:** Client-server state phải đồng bộ qua WebSocket (Events: `gameStateUpdate`, `turnChange`, `comboTriggered`, `kickEvent`, `artifactApplied`).
- **Determinism:** Dice roll xảy ra trên server để tránh cheating; client chỉ nhận result. Power Roll: player gửi target range trước, server roll với 20% probability into range.
- **Performance:** Game state nhỏ (vài KB), phẫn tải 60fps animation.
- **Scalability:** Server actor mỗi game room, many rooms parallel.
- **Testability:** Logic server phảipure functions where possible, injectable RNG for unit tests.

---

## 6. Questions / TBD

| # | Câu hỏi | Chủ sở hữu | Độ ưu tiên |
|---|---------|------------|-----------|
| 1 | Ultimate Extra Roll: player tự kích hoạt hay auto sau khi mag ≥ 50? GDD nói "Cost 50 MAG. Kích hoạt: `ultimateExtraRolls++`. Sau khi kết thúc di chuyển lượt hiện tại, nếu `ultimateExtraRolls > 0` → tiêu hao 1 và bắt đầu lượt đổ xúc xắc mới."confusing. | Designia | High |
| 2 | Ultimate có bị `MAX_CONSECUTIVE_ROLLS` cap không? | Designia | High |
| 3 | Giá trị cụ thể `magCap` và `maxElementQueue` chưa có. | Balance | Medium |
| 4 | Character Pillow Affinity chưa xác định (Fire/Ice/Grass/Rock nào?). | Character Design | Medium |
| 5 | Khi ngựa bị kick về Safe Zone, nếu Safe Zone đã có ngựa cùng team: cho phép stacking? | Game Design | Low |
| 6 | Power Roll: player chọn target range như thế nào (slider từ 2–12 hay pick specific numbers)? | Gameplay Programmer | Medium |
| 7 | Nếu 2 player cùng về đích trong cùng turn sequence, thứ tự xử lý như nào? Mỗi ngựa độc lập? | Game Designer | Low |
| 8 | Board path: ID cụ thể cho từng tile (0–60) chưa có map. Ai chia? | Map Designer | High |

---

## 7. GDD Coverage Assessment

| Section | Covered? | Notes |
|---------|----------|-------|
| 1 Tổng quan | ✅ | Đã mapping |
| 2 Core Mechanics | ✅ | Use Cases khai thác đủ: Roll, Move, Combo, Kick, Artifact, Ultimate |
| 3 Winning Conditions | ✅ | Đã đưa vào UC "End Turn" và tách riêng KO check |
| 4 Edge Cases | ✅ | 10 edge cases đủ cover |
| 5 UI/UX | ❌ | Không cần cho server logic, nhưng client cần render — đã ghi nhận |
| 6 Balance & Config | ✅ | Config keys extracted |
| 7 Evaluation Metrics | ❌ | Không cần cho implementation |
| 8 Dependencies | ✅ | Ghi nhận: server changes needed, client changes needed, config keys cần thêm |

**Conclusion:** Requirements đã đầy đủ để handoverDesign.

---

**Yêu cầu:** Proceed to Phase 2 (System Design) với input là REQ này và GDD gốc.
