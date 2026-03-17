# CCN2 Agent Team — Constitution

> **Speckit Phase**: Constitution (governance & principles)
>
> **Superpowers applied**: brainstorming → design trước khi code
>
> *"A constitution is the supreme law that governs all other decisions"*

---

## 1. Purpose Statement

CCN2 Agent Team tồn tại để **tự động hóa vòng lặp phát triển game** của dự án CCN2:
từ ý tưởng gameplay → thiết kế → code → kiểm thử → báo cáo chất lượng.

Team không thay thế con người — team **khuếch đại** tốc độ và nhất quán của quá trình phát triển.

---

## 2. Core Principles

### P1 — Workspace is the Source of Truth
Tất cả communication giữa agents **đi qua filesystem** (`ccn2_workspace/`), không phải qua chat trực tiếp. Mọi artifact phải được lưu thành file trước khi agent khác consume.

```
✅ agent_gd đọc concepts/gameplay.md → viết design/GDD.md → agent_dev đọc GDD.md
❌ agent_gd gửi GDD trực tiếp qua message cho agent_dev
```

### P2 — Push-Based, Not Poll-Based
Agents **không busy-poll** trạng thái nhau. Mỗi agent dùng heartbeat/cron để định kỳ kiểm tra workspace. Khi phát hiện thay đổi, tự hành động.

```
✅ agent_dev: mỗi 30 phút, kiểm tra design/*.md mới → nếu có → implement
❌ agent_dev: vòng lặp "còn GDD chưa?" → "còn GDD chưa?" liên tục
```

### P3 — Idempotent Actions
Mỗi action của agent phải **idempotent** — chạy lại cùng input thì ra cùng output, không tạo duplicate artifacts.

```
✅ agent_gd: kiểm tra design/GDD-gameplay.md đã tồn tại chưa → nếu có thì skip
❌ agent_gd: tạo GDD-gameplay-v2.md, GDD-gameplay-v3.md mỗi lần chạy
```

### P4 — Single Responsibility per Agent
Mỗi agent chỉ làm **1 loại việc** trong vòng đời của mình. Không agent nào "kiêm" nhiều vai trò.

```
agent_gd   → chỉ design (GDD, rules, mechanics)
agent_dev  → chỉ code (implement, refactor)
agent_qc   → chỉ quality (testcases, test runs, reports)
```

### P5 — State Tracking is Mandatory
Mỗi agent phải duy trì **state file** để biết đã xử lý file nào rồi. Không xử lý file đã done trừ khi file đó thay đổi (hash khác).

```
ccn2_workspace/.state/agent_gd_processed.json   ← hash của từng concept file
ccn2_workspace/.state/agent_dev_processed.json  ← hash của từng GDD file
ccn2_workspace/.state/agent_qc_processed.json   ← hash của từng code + design file
```

### P6 — Quality Gate Before Delivery
**agent_qc** có quyền block delivery nếu quality score < threshold. agent_dev phải fix trước khi team report "done".

### P7 — Evidence Before Completion
Theo nguyên tắc Superpowers **verification-before-completion**: không agent nào được báo "done" mà không có artifact evidence.

```
✅ agent_qc: "Tests passed: 47/47. Coverage: 82%. Report: reports/qc-2026-03-17.md"
❌ agent_qc: "Tôi đã test xong"
```

---

## 3. Workspace Contract

### 3.1 Cấu trúc thư mục

```
ccn2_workspace/
├── WORKSPACE.md              ← Index + team instructions (đọc đầu tiên)
├── .state/                   ← State tracking (hidden)
│   ├── agent_gd_processed.json
│   ├── agent_dev_processed.json
│   └── agent_qc_processed.json
│
├── concepts/                 ← INPUT: Gameplay ideas, feature briefs
│   ├── README.md             ← Hướng dẫn viết concept file
│   └── *.md                  ← Concept files (human writes here)
│
├── design/                   ← agent_gd OUTPUT / agent_dev INPUT
│   ├── README.md
│   ├── GDD-*.md              ← Game Design Documents
│   └── rules/                ← Sub-specs (tile rules, abilities, etc.)
│
├── src/                      ← agent_dev OUTPUT / agent_qc INPUT
│   ├── (mirrors clientccn2/src structure)
│   └── tests/
│       └── *.test.js         ← agent_qc writes test files here
│
└── reports/                  ← agent_qc OUTPUT
    ├── quality-*.md          ← Quality reports
    └── testcases-*.md        ← Test case documentation
```

### 3.2 File Naming Convention

| Loại file | Pattern | Ví dụ |
|-----------|---------|-------|
| Concept | `concepts/<feature-name>.md` | `concepts/ladder-mechanic.md` |
| GDD | `design/GDD-<feature-name>.md` | `design/GDD-ladder-mechanic.md` |
| Test cases | `reports/testcases-<feature-name>.md` | `reports/testcases-ladder-mechanic.md` |
| Quality report | `reports/quality-<YYYY-MM-DD>.md` | `reports/quality-2026-03-17.md` |

### 3.3 Concept File Format (Human writes)

```markdown
# Feature: <Tên feature>
**Priority**: High / Medium / Low
**Requester**: <name>
**Date**: YYYY-MM-DD

## Description
<Mô tả ngắn gameplay mechanic / feature>

## Core Mechanics
- Mechanic 1: ...
- Mechanic 2: ...

## Edge Cases
- Case 1: ...

## References
- GDD section: ...
- Similar game: ...
```

---

## 4. Agent Interaction Protocol

### 4.1 Communication Flow

```
Human
  ↓ (writes concept file)
concepts/feature.md
  ↓ (agent_gd heartbeat detects)
agent_gd
  ↓ (writes GDD + notifies via Telegram)
design/GDD-feature.md
  ↓ (agent_dev + agent_qc heartbeat detect independently)
  ├── agent_dev → src/feature.js + src/tests/feature.test.js (skeleton)
  └── agent_qc → reports/testcases-feature.md
        ↓ (agent_qc detects code change)
  agent_qc runs tests → reports/quality-<date>.md → Telegram notification
```

### 4.2 No Direct Cross-Agent Tool Calls
Agents không gọi `sessions_spawn` để tạo sub-agent của agent khác. Communication là async qua files + heartbeat cycle.

> **Lý do**: Tránh tight coupling. Nếu agent_gd down, agent_dev vẫn hoạt động được.

### 4.3 Conflict Resolution
Nếu 2 agents cùng ghi cùng 1 file → agent với role phù hợp được ưu tiên:
- `design/` → chỉ agent_gd được ghi
- `src/` → chỉ agent_dev được ghi
- `reports/` → chỉ agent_qc được ghi

---

## 5. Quality Gate Thresholds

| Metric | Minimum | Target |
|--------|---------|--------|
| Test pass rate | ≥ 80% | ≥ 95% |
| Test coverage (khi đo được) | ≥ 60% | ≥ 80% |
| GDD completeness | Có đủ 5 sections | Có ví dụ + edge cases |
| Code review | Không có lỗi syntax | Lint pass |

---

## 6. Governance

### 6.1 Ai có thể sửa Constitution này?
Human + thảo luận với team. Không agent nào tự sửa.

### 6.2 Khi nào thêm agent mới?
Khi xuất hiện use case mà 3 agents hiện tại không cover được sau 2 sprints cố gắng.

### 6.3 Deprecation
Nếu 1 agent không hoạt động sau 2 tuần debug → xem xét disable heartbeat, giữ config cho tham khảo.

---

*Constitution version 1.0 — 2026-03-17*
