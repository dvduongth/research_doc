# GDD: gdd-overview-v2-elemental-hunter
**Source**: concepts/GDD_Overview_v2_ElementalHunter.md
**Created**: 2026-03-18
**Updated**:
**Status**: Draft

## 1. Overview
Elemental Hunter là một board game 2 người chơi, mỗi người chơi điều khiển 3 token (ngựa) trên bàn cờ 61 ô hình chữ thập. Mục tiêu: sử dụng hệ thống thu thập nguyên tố (Element) để xây dựng combo, gia tăng ATK, và tấn công đối thủ thông qua việc đưa token về Final Goal. Game có cơ chế Combat (Kick), MAG và Ultimate (Extra Roll), Artifact (Swap/Change/Charge), Character system với Affinity, và Level difficulty. Player thắng bằng KO (HP ≤ 0) hoặc hết maxRounds (so sánh HP, Player2 thắng nếu hòa).

## 2. Core Mechanics
Chi tiết implementation:

- **Board & Token Setup**:
  - Board: 61 ô (ID 0-60), chia thành 4 cánh (Arm Path). Mỗi Arm Path có 10 ô (bao gồm Start). Main Loop vòng quanh. Branch Point trước Start của mỗi cánh: token của player đó vào Goal Path (4 ô) nếu đến đây; token khác tiếp tục Main Loop. Final Goal là ô cuối Goal Path.
  - Token: Mỗi player 3 token. Mỗi token có `atk` (ban đầu 0) và `frozenRounds`. Khởi đầu: 3 token rải đều trên 3 ô đầu tiên của Arm Path của player (không chồng).
  - Start tiles: P1 tile 51, P2 tile 0 (có thể khác tùy config). Final Goal: P1 tile 31, P2 tile 25.

- **Turn Structure**:
  1. Player roll 2 dice (d6). Có thể dùng Power Roll (chọn target range, 20% rơi vào range, 80% ngẫu nhiên).
  2. Chọn 1 token hợp lệ (không frozen, ô đích không bị chặn bởi token cùng team).
  3. Token di chuyển số bước = tổng dice, theo path (Arm → Main Loop/Branch → Goal nếu đúng player).
  4. Xử lý ô đáp:
     - Elemental Tile (có currentElement): Nếu element = player's Affinity → token ATK += character.atk (×2 nếu tileGainMultiplier=2). Nếu element ≠ Affinity → player.mag += character.mag (×2 nếu multiplier). Phần thưởng được ghi nhận là lượng thực tế sau cap (nếu có). Element được thêm vào cuối Element Queue (max size). Tile trở thành null; tái sinh khi token rời.
     - Empty Tile: Mở artifact selection UI từ pool đã unlock. Player chọn 1 artifact (Swap, Change, Charge) nếu có. `emptyTileVisits` tăng.
     - Safe Zone: không có effect.
     - Final Goal: xử lý riêng (xem dưới).
  5. Kiểm tra combo: sau mỗi lần thêm element vào queue, quét toàn bộ queue. Ưu tiên C3 (3 cùng loại liên tiếp) trước C4 (4 khác nhau). Xóa các element tạo combo, áp dụng reward theo character tier (Tier1 mỗi combo, Tier2 milestone lần 2, Tier3 milestone lần 3). Reset combo count mỗi ván. Sau khi xóa, quét lại queue để cascading combo.
  6. Kiểm tra Kick: Nếu ô đích có token đối thử và không phải Safe Zone:
     - `HP[opponent] -= ATK[attacker]` (nếu ATK=0, không sát thương).
     - Token bị kick đẩy về Safe Zone gần nhất phía sau (theo hướng di chuyển của token bị kick).
     - `kickCount[attacker]++`.
  7. Nếu token về Final Goal (ô đích):
     - Player chọn 1 element (Fire/Ice/Grass/Rock) để thêm vào **cuối** Element Queue.
     - Kiểm tra combo lại.
     - Token tấn công đối thủ: `HP[opponent] -= ATK[token]` (ATK hiện tại sau combo).
     - Token trả về Safe Zone của player (thường là Start tile).
     - `finishedHorseCount[player]++`.
  8. Kết thúc lượt. Chuyển sang player tiếp.

- **Extra Turn & Cooldown**:
  - Roll Double (2 dice cùng số): player nhận extra turn ngay sau lượt này. Tuy nhiên, nếu `consecutiveRollsThisTurn >= MAX_CONSECUTIVE_ROLLS` thì không được cấp.
  - Sau khi đổ đôi, `doubleRollCooldown[player] = DOUBLE_ROLL_COOLDOWN_ROUNDS` (2). Trong các round tiếp theo, player không thể roll đôi (nếu doubleRollCooldown > 0, roll double không được tính là đôi).
  - Ultimate Extra Roll: chi 50 MAG, `ultimateExtraRolls++`. Sau lượt hiện tại, nếu `ultimateExtraRolls > 0` thì tiêu hao 1 và thêm lượt roll mới. Cũng bị giới hạn bởi `consecutiveRollsThisTurn`.
  - `consecutiveRollsThisTurn` tăng mỗi lần roll (bao gồm roll ban đầu và extra). Reset về 0 khi lượt chuyển sang player khác.

- **MAG & Ultimate**:
  - MAG tích khi token đáp ô khác Affinity: `player.mag += character.mag` (×2 nếu multiplier). Giới hạn: `magCap` (cấu hình). Khi cộng, nếu vượt cap, chỉ lưu đến cap và thông báo lượng thực tế.
  - Ultimate hiện tại: Extra Roll (cost 50). Kích hoạt khi player có đủ MAG, `player.mag -= 50`, `ultimateExtraRolls++`.

- **Artifact**:
  - Unlock conditions:
    - `emptyTileVisits ≥ 1`: Swap
    - `emptyTileVisits ≥ 2`: Change
    - `emptyTileVisits ≥ 3`: Charge
  - Level còn định nghĩa số artifact slots: Lv1=1, Lv2=2, Lv3=3. Khi landing on Empty Tile, hiển thị tất cả artifact đã unlock, nhưng chỉ cho chọn tối đa số slots (ngẫu nhiên? thường là chọn 1 trong pool). Pool gồm tất cả artifact đã unlock; player chọn 1 để sử dụng.
  - Effects:
    - Swap: đổi chỗ 2 element liền kề trong queue (chỉ số player chọn).
    - Change: đổi 1 element bất kỳ thành 1 trong 3 loại còn lại (player chọn).
    - Charge: thêm 1 element cùng Affinity vào cuối queue.
  - Sau khi dùng artifact, kiểm tra combo lại.

- **Character** (ví dụ Pillow):
  - Affinity: TBD (phải được set).
  - ATK: 30, MAG: 10, HP: 1000.
  - Combo Rewards:
    - Tier1 (mỗi combo): Power Surge → ATK +150 cho tất cả token.
    - Tier2 (combo thứ 2, Lv2+): Double Harvest → tileGainMultiplier ×2.
    - Tier3 (combo thứ 3, Lv3): Absolute Might → ATK hiện tại của tất cả token ×1.5 (làm tròn lên).
  - Ultimate: Extra Roll.

- **Level**:
  - Lv1: maxRounds=12, maxComboTier=1, artifactSlots=1.
  - Lv2: maxRounds=15, maxComboTier=2, artifactSlots=2.
  - Lv3: maxRounds=15, maxComboTier=3, artifactSlots=3.
  - Level ảnh hưởng đến max combo tier unlock; nếu player đạt combo tier vượt max, tier đó không active.

- **Win Conditions**:
  - KO: player.HP ≤ 0 → đối thủ thắng ngay.
  - Round limit: sau maxRounds, so sánh HP. Nếu hơn → thắng. Nếu bằng nhau → Player2 thắng (Last Mover Advantage).

- **State Variables** (for server):
  - player: { hp, mag, magCap, elementQueue (array), comboCount, doubleRollCooldown (rounds left), consecutiveRollsThisTurn, finishedHorseCount, emptyTileVisits, level, character }
  - token: { id, owner, atk, frozenRounds, position (tileId) }
  - board: tiles: { id, type (Elemental/Empty/Safe/Start/...), element (Fire/Ice/Grass/Rock), currentElement (null or element) }
  - game: currentRound, currentPlayer, phase, maxRounds, etc.
  - ultimateExtraRolls (counter for current turn).

## 3. Win/Lose Conditions
N/A — feature này bao gồm toàn bộ gameplay và đã định nghĩa điều kiện thắng trong Core Mechanics (KO và Round limit). Không có điều kiện thua riêng ngoài KO.

## 4. Edge Cases
1. **Token bị đóng băng**: Nếu token.frozenRounds > 0, không thể chọn di chuyển. frozenRounds giảm 1 mỗi cuối round. Cần đảm bảo UI disable token.
2. **Element queue đầy**: Khi thêm element mới vào queue đạt maxElementQueue, element cũ nhất (đầu) bị loại trước khi thêm mới. Điều này có thể phá vỡ combo đang hình thành; cần xử lý theo đúng thứ tự: thêm → nếu đầy thì pop đầu → rồi kiểm tra combo? Thực tế logic: thêm vào cuối, nếu size > max, remove first (cũ). Sau đó quét combo. Cần xác định rõ order để đảm bảo predictable.
3. **Roll Double bị cooldown**: Khi player đang trong cooldown (doubleRollCooldown > 0), dù dice ra cùng số cũng không được coi là Roll Double (không cấp extra turn). Cần thông báo UI "Double Roll Cooldown" và không hiển thị effect.
4. **Consecutive Roll Cap**: Nếu `consecutiveRollsThisTurn >= MAX_CONSECUTIVE_ROLLS`, bất kỳ nguồn extra turn nào (Roll Double hay Ultimate Extra Roll) đều không cấp thêm lượt. Cần kiểm tra trước khi cấp.
5. **Artifact Swap với queue ít element**: Swap yêu cầu 2 element liền kề. Nếu queue có ít hơn 2 element, Swap không nên hiển thị hoặc disabled. Tương tự, Change yêu cầu ít nhất 1 element, Charge có thể dùng bất kỳ lúc (thêm element). Cần validate trước khi cho phép chọn.
6. **Token về đích nhiều lần**: Một token có thể về đích nhiều lần trong một ván? Có thể, vì sau khi về đích nó trả về Safe Zone và có thể di chuyển lại. `finishedHorseCount` chỉ đếm số lần token về đích, không quan trọng token nào. Cần xác định nếu token về đích nhiều lần thì có được thưởng mỗi lần? Có: mỗi lần về đích player được chọn element và tấn công. Cân nhắc balance.
7. **Kick trong Goal Path**: Token có thể bị kick khi đang ở Goal Path nếu có token đối thử (của player khác) di chuyển vào? Nhưng只有 owner token mới vào được Goal Path (Branch rule). Vậy token của player1 chỉ có thể bị kick bởi token của player2 nếu chúng cùng trên Main Loop (và không phải safe zone). Trên Goal Path, chỉ có token của owner, nên không thể có token đối thử ở đó để kick. Tuy nhiên, token của player1 có thể bị kick bởi token của player2 trên Main Loop, và ngược lại. Edge case này có thể không xảy ra. Tuy nhiên, nếu token bị kick trong khi đang trên Goal Path (nếu có?), nó sẽ bị đẩy về Safe Zone nào? Cần quy định: nếu token bị kick, nó di chuyển lùi về phía Branch Point? Có thể đến Safe Zone của player (Start tile) trên Arm Path? Cần xác định rõ.
8. **Power Roll**: Player chọn target range trước khi dice停止? Cần mô tả UI: player kéo thanh trượt chọn khoảng (ví dụ 5-9), sau đó nhấn nút Stop. Khi stop, hệ thống roll với 20% rơi vào range, 80% random. Nếu player không chọn range, thì normal roll. Cần xử lý khi player không đặt target (ban đầu none) — thì roll hoàn toàn ngẫu nhiên.
9. **MAG Cap**: Khi player tích MAG, nếu player.mag + gain > magCap, chỉ thêm số lượng đến đủ cap. Cần thông báo "MAG Full" hoặc hiển thị actual gain.
10. **Combo reward tier unlock**: Nếu player ở Level 1, maxComboTier=1, chỉ nhận Tier1. Tier2 và Tier3 không áp dụng ngay cả nếu combo count đạt 2,3. Cần check level.
11. **Token bị frozen khi đang di chuyển?** Frozen chỉ ảnh hưởng ở đầu turn: token với frozenRounds>0 không được chọn. Nếu token đang di chuyển thì không bị frozen giữa chừng. Frozen được giảm ở cuối mỗi round (sau khi cả 2 player đi xong).
12. **Token cùng player trên cùng ô**: Không được phép di chuyển token đến ô có token cùng owner (để tránh chồng). Cần checkMove: nếu ô đích có token cùng owner → invalid move.
13. **Token rời Elemental Tile causing respawn**: Khi token rời khỏi ô có currentElement null (đã thu hồi), ô tái sinh nguyên tố theo native element của tile. Nguyên tố mới được set là tile.element (static). Cần đảm bảo không spawn nếu có token khác đang đứng? Thường là khi token rời, ngay lập tức respawn.
14. **Double Roll Cooldown tracking**: Cooldown áp dụng per-player, theo round. Giảm 1 mỗi khi round kết thúc (sau lượt của player đó?). Có thể giảm ở cuối mỗi round (sau cả 2 player đi). Cần rõ.
15. **Consecutive Rolls counting**: Reset `consecutiveRollsThisTurn` về 0 khi turn chuyển sang player khác. Count bao gồm roll ban đầu và mỗi extra turn (roll double hoặc ultimate). Nếu player có ultimateExtraRolls>0, sau lượt hiện tại, thêm 1 roll, count tăng. Nếu reach cap, extra turn không được cấp thêm.
16. **Final Goal attack with ATK 0**: Nếu token về đích với ATK=0, tấn công không gây sát thương. Vẫn tính là về đích, token trả về safe zone.
17. **Empty Tile artifact selection when no artifacts unlocked**: Nếu emptyTileVisits <1, chưa unlock artifact nào, khi landing on Empty Tile có thể không có effect hoặc thông báo "No artifacts available". Cần xác định.
18. **Artifact usage order**: Pool có nhiều artifact unlock, nhưng artifact slots giới hạn số lượng hiển thị? Thường là hiển thị tất cả đã unlock, nhưng player chọn 1. Slots chỉ là số lượng artifact player có thể chọn? Không, "Artifact Slots" là số lượng artifact mà player có thể lựa chọn khi tương tác Empty Tile — tức là số lượng artifact có sẵn trong pool? Thực ra Level tăng artifact slots, có nghĩa là số lượng artifact có thể chọn (số lượng artifact trong pool) tăng? Từ doc: "Level còn định nghĩa số artifact slots: Lv1=1, Lv2=2, Lv3=3. Khi landing on Empty Tile, hiển thị tất cả artifact đã unlock, nhưng chỉ cho chọn tối đa số slots (ngẫu nhiên? thường là chọn 1 trong pool)." Có vẻ như Level quyết định số lượng artifact có sẵn để chọn (pool size) hoặc số lần player có thể dùng artifact? Tóm lại, cần làm rõ. Tạm thời: artifactSlots là số lượng artifact trong pool tại một thời điểm; player chọn 1 artifact mỗi lần ghé Empty Tile.
19. **Token movement path**: Khi token di chuyển, nó đi tuần tự từng ô theo path. Cần xác định path order: Arm Path từ start (index 0) đến Branch (index 9), sau đó nếu owner thì vào Goal Path (4 ô) đến Final Goal, nếu không thì vào Main Loop (theo map). Token có thể đi ngược chiều? Document nói "ngựa di chuyển theo chiều kim đồng hồ trên vòng này." Vậy Main Loop là chiều kim đồng hồ. Goal Path từ Branch đến Final Goal là chiều vào trong. Cần map IDs cụ thể để implement.
20. **Queue size limit**: Khi thêm element và queue đạt max, pop trước khi thêm? Hoặc thêm rồi nếu vượt thì pop. Cần xác định chính xác để đảm bảo predictable. Từ doc: "Kích thước tối đa: maxElementQueue. Nguyên tố mới được thêm vào cuối queue. Khi queue đầy, nguyên tố cũ nhất (đầu queue) bị đẩy ra để nhường chỗ." Vậy thứ tự: thêm vào cuối, nếu size > max thì remove head. Tức là sau khi thêm, nếu size > max, lấy đầu ra. Cần triển khai đúng.

## 5. UI/UX Notes
- **Board Rendering**: Hiển thị 61 ô theo shape thập phân. Màu sắc: Fire (đỏ), Ice (xanh lam), Grass (xanh lá), Rock (xám), Empty (xám nhạt), Safe Zone (vàng), Start (xanh lánh), Branch Point (điểm vàng), Goal Path (có viền đặc biệt), Final Goal (lấp lánh). Sử dụng icons cho elements.
- **Token**: Hình ngựa (hoặc token hình con vật). Mỗi player một màu (ví dụ P1: xanh, P2: đỏ). Hiển thị ATK value trên token (hoặc khi hover). Khi token bị frozen, hiển thị icon băng.
- **Dice Roll**: Hiển thị 2 dice xúc xắc với animation. Nếu Power Roll mode, hiển thị target range (thanh trượt) và nút Stop. Khi roll, hiển thị kết quả. Nếu roll double, hiển thị thông báo "Double Roll! Extra Turn!".
- **Element Collection**: Khi token đáp ô element, hiển thị floating text: "+30 ATK" (cùng affinity) hoặc "+10 MAG" (khác affinity) với màu phù hợp. Thêm icon element vào HUD queue.
- **Element Queue (HUD)**: Hiển thị hàng queue dạng icons element đang lưu. Khi combo xảy ra, highlight các icon bị xóa với animation. Queue có giới hạn size, hiển thị fullness.
- **Combo Notification**: Khi combo C3/C4 xảy ra, hiển thị banner "C3! Triple Threat" hoặc "C4! Elemental Master", cùng animation trên toàn màn hình (ví dụ ánh sáng). Tăng ATK: hiển thị buff icons trên token.
- **Kick**: Khi kick xảy ra, hiển thị damage number (ví dụ "-50") ở vị trí defender, animation đẩy token lùi (slide back) đến safe zone.
- **Final Goal**: Khi token đến Final Goal, zoom vào ô, hiển thị UI chọn element (4 nút). Sau khi chọn, thêm element vào queue (hiển thị), tức thời kiểm tra combo. Sau đó, animation token tấn công ( nhảy lên, bắn laser...), hiển thị damage number lên opponent HP bar.
- **Artifact Selection**: Khi landing on Empty Tile, mở modal với danh sách artifact có thể dùng (ví dụ 3 thẻ: Swap, Change, Charge). Mỗi artifact có icon, tên, mô tả ngắn, và disabled nếu không thể dùng (ví dụ Swap với queue <2). Player chọn 1artifact để kích hoạt.
- **HUD**: 
   - HP bar cho mỗi player (có label).
   - MAG bar (có thể hiển thị số).
   - Element Queue row.
   - Artifact slots (hiển thị đã unlock).
   - Round counter.
   - Cooldown indicators: Double Roll cooldown icon với số round còn lại.
   - Extra turn status (nếu có ultimateExtraRolls).
   - Token status: hiển thị ATK trên token, frozen icon.
- **Notifications**: Các thông báo popup: "Power Roll mode", "MAG Full", "Consecutive Roll Cap reached", etc.
- **Sound**: Dice roll, element collected, combo, kick, goal, ultimate, artifact use.
- **Responsive**: Board scale để vừa màn hình, khả năng zoom/pinch.

## 6. Balance Notes
- **ATK scaling**: Base tile reward: 30 ATK (cùng affinity). Combo Tier1: +150 ATK toàn bộ. Tier3: ×1.5 ATK. Có thể đạt ATK rất cao, đảm bảo KO khả thi sau vài combo.
- **MAG**: Base 10, cap cần tuning (dự kiến 100-200). Ultimate cost 50→ player cần tích khoảng 5-10 lần đáp ô khác affinity để dùng.
- **Round limit**: 12-15 rounds, target game duration ≤10 phút. Với 2 player, mỗi round ~30 giây → 6-7.5 phút, hợp lý.
- **Double Roll cooldown 2 rounds** ngăn việc abuse double để chain nhiều extra turn.
- **Consecutive Roll cap 3** giới hạn số lần roll liên tiếp (1 normal + 2 extra), đảm bảo khôngsingle player chiếm quá nhiều turn trong cùng round.
- **Power Roll 20%** accuracy cung cấp cơ hội kiểm soát nhỏ mà không đảm bảo.
- **Artifact**: Unlock theo emptyTileVisits (1,2,3) và Level (slots). Cân bằng giữa việc có nhiều artifact và số lần ghé Empty Tile. Cần playtesting để điều chỉnh tần suất Empty Tile.
- **Metrics cần đo**: (xem phần Metrics trong file) — combo count, kick count, artifact usage, power roll usage, KO vs round ratio, HP remaining, etc.
- **Potential imbalances**: 
   - Token ATK quá cao → KO sớm, round limit không áp dụng.
   - MAG quá dễ tích → ultimate spam.
   - Artifact Charge có thể mạnh nếu thêm element cùng affinity → dễ tạo combo.
   - Có thể player đi token vào Empty Tile nhiều để unlock artifact nhanh, bỏ qua element? Cần cân nhắc.
- **Tuning needed**: 
   - maxElementQueue size (dự kiến 5-7).
   - magCap (dự kiến 100).
   - Tile gain multiplier ×2 từ combo tier2 — có thể mạnh.
   - Character ATK/MAG values: 30/10 là baseline; có thể dùng các character khác với stats khác nhau.
   - Final Goal attack dùng ATK hiện tại (có thể rất cao sau combo) → cần test.

## 7. Dependencies
- **Server changes needed**: Yes. Cần implement toàn bộ logic game: board representation, token movement theo path, element queue management, combo detection, combat (kick), final goal processing, ultimate activation, artifact effects, state synchronization.
- **Client changes needed**: Yes. Render board (tiles, tokens), animations (move, dice, combo, kick, attack, artifact), UI (HUD, element queue, artifact selection, notifications), sound.
- **Config keys needed**:
  - `DOUBLE_ROLL_COOLDOWN_ROUNDS = 2`
  - `MAX_CONSECUTIVE_ROLLS = 3`
  - `magCap` (int, e.g., 100)
  - `maxElementQueue` (int, e.g., 5)
  - `PowerRoll.accuracyRate = 0.2`
  - `Tile.reward.atkMultiplier = 1` (or 2 if bonus)
  - `Tile.reward.magMultiplier = 1` (or 2)
  - `Combo.tier1.atkBonus = 150`
  - `Combo.tier3.atkMultiplier = 1.5`
  - `Ultimate.cost.extraRoll = 50`
  - `Character` definitions: 
    - Pillow: { affinity: "TBD", atk: 30, mag: 10, hp: 1000, comboRewards: { tier1: "PowerSurge", tier2: "DoubleHarvest", tier3: "AbsoluteMight" }, ultimate: "ExtraRoll" }
  - `Level` configs: 
    - { level: 1, maxRounds: 12, maxComboTier: 1, artifactSlots: 1 }
    - { level: 2, maxRounds: 15, maxComboTier: 2, artifactSlots: 2 }
    - { level: 3, maxRounds: 15, maxComboTier: 3, artifactSlots: 3 }
  - `Board` layout: tile IDs, element types per tile, empty tile IDs, safe zone IDs, start tiles per player, branch point IDs, goal path IDs, final goal IDs. (Cần tài liệu riêng).
  - `Token` initial positions.
- **Other dependencies**: Asset files for board graphics, token sprites, dice, icons, sounds.

## 8. Test Scenarios
1. Given board initialized with tokens at start positions, and player1's token at start, when player1 rolls 4 and 3 (total 7) and selects that token to move, then token moves exactly 7 steps along the designated path and lands on tile ID corresponding to the path, and tile effect (element collection or empty) is triggered.
2. Given player's element queue currently [Fire, Ice, Fire] and token lands on Fire tile (same Affinity), when element is added, queue becomes [Fire, Ice, Fire, Fire], combo check detects C3 (three consecutive Fires at indices 2-4), removes those three elements, applies +150 ATK to all tokens, increments comboCount to 1, and queue becomes [Fire, Ice].
3. Given attacker token has ATK 75, defender token is on a non-safe tile, when attacker token lands on defender's tile, then defender's HP decreases by 75, defender token is moved back along the path to the nearest safe zone behind its current position, and attacker's kickCount increments.
4. Given token reaches its Final Goal tile (correct branch), when goal processing occurs, then player selects an element (e.g., Fire) to add to end of element queue, combo check runs, token attacks opponent by its current ATK (after any combo), opponent HP decreases accordingly, token returns to its safe zone (Start tile), and finishedHorseCount increments.
5. Given player has `mag >= 50` and uses "Extra Roll" ultimate, when activation occurs, then player's MAG decreases by 50, `ultimateExtraRolls` increments to 1, and after current movement completes, an extra dice roll is granted (consecutiveRolls count increases, and if below cap, extra turn proceeds).
