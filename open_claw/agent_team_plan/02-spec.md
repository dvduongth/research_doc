# CCN2 Agent Team — Feature Specification

> **Speckit Phase**: Specify (user stories + acceptance criteria)
>
> **Superpowers applied**: brainstorming → evidence-based acceptance criteria

---

## Epic 1: Shared Workspace

### US-001: Workspace Structure
**As a** developer on the CCN2 team
**I want** a shared workspace directory `ccn2_workspace/` with clear folder conventions
**So that** all 3 agents can collaborate without ambiguity about where to read/write

**Acceptance Criteria:**
- [ ] Directory `ccn2_workspace/` tồn tại với 5 sub-dirs: `concepts/`, `design/`, `src/`, `reports/`, `.state/`
- [ ] Mỗi folder có `README.md` mô tả purpose và naming conventions
- [ ] `WORKSPACE.md` ở root mô tả team contract và file ownership

**Out of scope**: Git setup cho workspace (Round 4+)

---

### US-002: State Tracking Files
**As an** agent
**I want** a state file tracking which files I've already processed (with hashes)
**So that** I don't re-process unchanged files on every heartbeat cycle

**Acceptance Criteria:**
- [ ] `ccn2_workspace/.state/agent_gd_processed.json` tồn tại sau lần chạy đầu
- [ ] Format: `{ "concepts/ladder-mechanic.md": { "hash": "abc123", "processedAt": "2026-03-17T..." } }`
- [ ] Khi file không thay đổi (same hash) → agent skip, không tạo GDD mới
- [ ] Khi file thay đổi (diff hash) → agent re-process, ghi đè GDD cũ

---

## Epic 2: agent_gd — Game Design

### US-101: Concept to GDD
**As a** game designer / project lead
**I want** to drop a `concepts/feature.md` file and get a full GDD automatically
**So that** I don't have to manually expand every feature concept into a spec

**Trigger**: File mới xuất hiện trong `concepts/` hoặc file đã có thay đổi nội dung
**Trigger mechanism**: Heartbeat mỗi 30 phút (HEARTBEAT.md instructs agent to check)

**Acceptance Criteria:**
- [ ] Khi có `concepts/ladder-mechanic.md` mới → agent_gd tạo `design/GDD-ladder-mechanic.md` trong vòng 30 phút (1 heartbeat cycle)
- [ ] GDD output có đủ 8 sections: Overview, Core Mechanics, Win/Lose Conditions, Edge Cases, UI/UX Notes, Balance Notes, Dependencies, Test Scenarios
- [ ] GDD không duplicate nếu concept không thay đổi
- [ ] agent_gd gửi Telegram notification: "GDD ready: design/GDD-ladder-mechanic.md"

**GDD Template (8 sections):**
```
# GDD: <Feature Name>
**Source**: concepts/<file.md>
**Created**: YYYY-MM-DD
**Status**: Draft | Reviewed | Final

## 1. Overview
## 2. Core Mechanics
## 3. Win/Lose Conditions (if applicable)
## 4. Edge Cases
## 5. UI/UX Notes
## 6. Balance Notes
## 7. Dependencies (other features/files)
## 8. Test Scenarios (used by agent_qc)
```

---

### US-102: GDD Update on Concept Change
**As a** designer
**I want** the GDD to automatically update when I revise the concept file
**So that** GDD always stays in sync with the latest thinking

**Acceptance Criteria:**
- [ ] Khi `concepts/ladder-mechanic.md` thay đổi nội dung → agent_gd ghi đè `design/GDD-ladder-mechanic.md` (không tạo file mới)
- [ ] GDD mới có `**Updated**: <date>` trong header
- [ ] agent_gd Telegram: "GDD updated: design/GDD-ladder-mechanic.md (concept revised)"

---

## Epic 3: agent_dev — Development

### US-201: GDD to Code Skeleton
**As a** developer
**I want** agent_dev to read a new GDD and generate a code skeleton
**So that** I have a starting point that already maps to the game's architecture

**Trigger**: File mới trong `design/GDD-*.md`

**Acceptance Criteria:**
- [ ] Khi `design/GDD-ladder-mechanic.md` xuất hiện → agent_dev tạo code skeleton trong `src/`
- [ ] Code skeleton follows CCN2 architecture: `CONFIG`, action types, phù hợp với `clientccn2/` patterns
- [ ] agent_dev tạo test file skeleton tại `src/tests/<feature>.test.js`
- [ ] agent_dev Telegram: "Code skeleton created: src/ladder-mechanic.js"

---

### US-202: Full Feature Implementation
**As a** developer
**I want** agent_dev to implement the full feature from the GDD
**So that** basic functionality works before QC runs tests

**Acceptance Criteria:**
- [ ] Code implements tất cả "Core Mechanics" từ GDD
- [ ] Code handles tất cả "Edge Cases" từ GDD
- [ ] Code follows existing patterns từ `clientccn2/CLAUDE.md` (no ES6 modules, globals via CONFIG)
- [ ] Không break existing tests

**Non-functional:**
- Code phải lint-clean (no obvious syntax errors)
- Không import external packages không có trong dự án

---

### US-203: Code Update on GDD Revision
**As a** developer
**I want** agent_dev to update the code when a GDD changes
**So that** implementation stays aligned with design

**Acceptance Criteria:**
- [ ] Khi GDD thay đổi → agent_dev nhận biết change, update code tương ứng
- [ ] agent_dev ghi vào `.state/agent_dev_processed.json` với hash mới của GDD
- [ ] Telegram: "Code updated for GDD revision: src/ladder-mechanic.js"

---

## Epic 4: agent_qc — Quality Assurance

### US-301: GDD to Test Cases
**As a** QA engineer
**I want** agent_qc to read a GDD and write unit test cases
**So that** we have coverage before or during development

**Trigger**: File mới trong `design/GDD-*.md`

**Acceptance Criteria:**
- [ ] Khi `design/GDD-ladder-mechanic.md` mới → agent_qc tạo `reports/testcases-ladder-mechanic.md`
- [ ] Test cases cover tất cả "Test Scenarios" trong GDD section 8
- [ ] Test cases cover tất cả "Edge Cases" trong GDD section 4
- [ ] agent_qc cũng tạo `src/tests/ladder-mechanic.test.js` (Jest format)

---

### US-302: Automated Test Run on Code Change
**As a** QA engineer / team lead
**I want** tests to run automatically when source code changes
**So that** I know immediately if a change broke something

**Trigger**: File thay đổi trong `src/` (excluding `src/tests/`)

**Acceptance Criteria:**
- [ ] Khi `src/ladder-mechanic.js` thay đổi → agent_qc chạy `npm test` (hoặc `node --test`)
- [ ] agent_qc parse test output: pass count, fail count, error messages
- [ ] agent_qc tạo `reports/quality-<YYYY-MM-DD-HH>.md` với kết quả
- [ ] Nếu có test failures → Telegram notification ngay lập tức: "⚠️ Tests failed: 3/47"
- [ ] Nếu tất cả pass → Telegram: "✅ Tests passed: 47/47 (ladder-mechanic changes)"

---

### US-303: Quality Report Format
**As a** project lead
**I want** a structured quality report after each test run
**So that** I can track quality trends over time

**Quality Report Template:**
```markdown
# Quality Report — YYYY-MM-DD HH:mm

## Summary
- **Trigger**: src/ladder-mechanic.js changed
- **Total tests**: 47
- **Passed**: 44
- **Failed**: 3
- **Status**: ⚠️ NEEDS ATTENTION

## Failed Tests
| Test | Error |
|------|-------|
| tile 5 should grant 50 KC | Expected 50, got 0 |

## Coverage
- ladder-mechanic.js: 82%

## Recommendations
- Fix tile KC calculation in `awardLadderPoints()`
```

---

## Epic 5: Notifications

### US-401: Telegram Channel Integration
**As a** developer
**I want** all agent actions to post updates to a Telegram channel
**So that** the team has visibility without checking files manually

**Acceptance Criteria:**
- [ ] agent_gd posts khi tạo/update GDD
- [ ] agent_dev posts khi tạo/update code
- [ ] agent_qc posts test results (pass = silent ✅, fail = loud ⚠️)
- [ ] Format: `[agent_id] action: artifact_path`

---

## Out of Scope (v1.0)

- Git commit/push automation
- PR review automation
- Jira/Linear ticket creation
- Multi-branch support
- Real-time file watching (inotify) — dùng heartbeat polling thay thế
- Agent-to-agent direct RPC

---

*Spec version 1.0 — 2026-03-17*
