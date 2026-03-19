# Runbook — Playtest Server (Elemental Hunter)

**Maintained by**: agent_dev_server (Forge), agent_qc (Verita)
**Last updated**: 2026-03-19

---

## Overview

Playtest server là standalone Ktor server tại `playtest/server/` cho phép test game flow Elemental Hunter qua browser mà không cần integrate vào demo-main.

| Item | Value |
|------|-------|
| Port | 8181 |
| Server path | `playtest/server/` |
| Client path | `playtest/client/index.html` |
| Smoke script | `playtest/scripts/smoke-test.ps1` |
| Build script | `playtest/scripts/build.bat` |
| Smoke reports | `ccn2_workspace/reports/playtest-smoke-*.md` |
| Pipeline check | `C7_playtest` trong `pipeline-health.json` |

---

## Quy trình cho Agents

### agent_dev_server (Forge) — Sau mỗi feature implementation

Sau khi `feature.server_status = "done"`, chạy:

```powershell
powershell -ExecutionPolicy Bypass -File "D:\PROJECT\CCN2\research_doc\open_claw\agent_team_plan\playtest\scripts\smoke-test.ps1" -Mode full
```

**Mode `full`**: rebuild từ đầu + test endpoints. Cần thiết vì source code vừa thay đổi.

**Khi smoke FAIL**:
1. Đọc `reports/playtest-smoke-<latest>.md` để tìm endpoint nào fail
2. Ghi error.log: `agent_dev_server | action=playtest_rebuild | error=smoke FAIL`
3. Telegram: `⚠️ [Forge] Playtest smoke FAIL sau khi implement <feature>`
4. KHÔNG block `feature.server_status = "done"` — code đã ghi xong

---

### agent_qc (Verita) — Part I, mỗi WORKSPACE_SCAN

Chạy **sau Part H** (Dashboard):

```powershell
powershell -ExecutionPolicy Bypass -File "D:\PROJECT\CCN2\research_doc\open_claw\agent_team_plan\playtest\scripts\smoke-test.ps1" -Mode quick
```

**Mode `quick`**: dùng distribution đã build, không rebuild. Nhanh hơn (~30s vs 3 phút).

**Kết quả có thể**:
- `PASS` → silent (không Telegram)
- `FAIL` → Telegram: `⚠️ [Verita] Playtest smoke FAIL — check reports/playtest-smoke-<datetime>.md`
- `SKIP` → distribution chưa build (silent, không tính vào pass/fail)

---

## Chạy thủ công (Human)

### Build server
```bat
D:\PROJECT\CCN2\research_doc\open_claw\agent_team_plan\playtest\scripts\build.bat
```

### Chạy smoke test nhanh
```bat
D:\PROJECT\CCN2\research_doc\open_claw\agent_team_plan\playtest\scripts\run-smoke.bat
```

### Chạy smoke test + rebuild
```bat
D:\PROJECT\CCN2\research_doc\open_claw\agent_team_plan\playtest\scripts\run-smoke.bat full
```

### Chạy server thủ công để playtest với browser
```bat
cd D:\PROJECT\CCN2\research_doc\open_claw\agent_team_plan\playtest\server
gradlew.bat run
```
Rồi mở `playtest\client\index.html` trong browser.

---

## Smoke Test — 4 Checks (C7_playtest)

| Check | Endpoint | Expected |
|-------|----------|----------|
| C7a | GET /health | 200, body = "OK" |
| C7b | GET /game/rooms | 200, JSON array |
| C7c | POST /game/rooms/smoke-room | 201 |
| C7d | GET /game/rooms | 200, contains smoke-room |

**PASS**: 4/4 checks pass, server starts OK
**FAIL**: ≥1 check fail HOẶC server không start trong 30s
**SKIP**: distribution (`build/install/`) chưa tồn tại

---

## Troubleshooting

### Server không start (FAIL ở Step 2)
1. Check port 8181 có bị occupied không:
   ```powershell
   netstat -ano | Select-String ":8181"
   ```
2. Nếu có process → taskkill PID đó rồi retry
3. Check `%TEMP%\playtest-stdout.txt` / `playtest-stderr.txt` cho startup error

### Build fail (Mode=full)
1. Check Java 17 installed: `java -version`
2. Check Gradle wrapper: `playtest/server/gradle/wrapper/gradle-wrapper.properties`
3. Check compile errors: chạy `gradlew.bat compileKotlin` thủ công
4. Common: BalanceConfig field mismatch → xem `src/server/elemental-hunter/` source

### Distribution không tồn tại sau build
- Gradle build thành công nhưng `installDist` chưa chạy
- Thêm `installDist` vào build: `gradlew.bat assemble installDist`
- Hoặc dùng: `gradlew.bat run` thay vì dist bat

### C7_playtest = SKIP mãi không đổi
- Distribution `build/install/elemental-hunter-playtest/` chưa tồn tại
- Chạy: `run-smoke.bat full` để rebuild và tạo distribution

---

## Pipeline Health Impact

`C7_playtest` được thêm vào `pipeline-health.json` cùng với C1-C6:

```json
{
  "checks": {
    "C1_concepts": "PASS",
    "C2_design": "PASS",
    ...
    "C6_state_json": "PASS",
    "C7_playtest": "PASS"
  }
}
```

**Verdict rules** (mở rộng từ 6 → 7 checks):
- C7 FAIL → contributes to DEGRADED (không phải BROKEN)
- C7 SKIP → exempt (không tính pass/fail, không ảnh hưởng verdict)

---

## File Map — Playtest Project

```
playtest/
├── scripts/
│   ├── smoke-test.ps1     ← agent automation script
│   ├── build.bat          ← build shortcut
│   └── run-smoke.bat      ← manual smoke test wrapper
├── server/
│   ├── build.gradle.kts
│   ├── settings.gradle.kts
│   ├── gradlew.bat
│   ├── src/main/kotlin/playtest/
│   │   ├── Main.kt              ← Ktor app, port 8181
│   │   ├── GameRoomManager.kt   ← room + session registry
│   │   ├── GameRoom.kt          ← actor (Channel + coroutines)
│   │   ├── WsMessage.kt         ← protocol DTOs
│   │   ├── Types.kt             ← shared enums + data classes
│   │   ├── BoardBuilder.kt      ← 61-tile board (repackaged)
│   │   └── ... (10 repackaged game logic files)
│   └── src/main/resources/config/
│       ├── balance.json
│       ├── character.json
│       └── level.json
└── client/
    └── index.html         ← web client (open in browser)
```
