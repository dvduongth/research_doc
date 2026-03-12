# SessionManager (from pi-coding-agent)

SessionManager quản lý lưu trữ session dưới dạng JSONL với tree structure. `pi-agent-core` không implement SessionManager; nó nằm trong `pi-coding-agent`.

---

## 📂 Session File Format

### File location

```
~/.pi/agent/sessions/--<path>--/<timestamp>_<uuid>.jsonl
```

`<path>` là working directory với `/` thay bằng `-`.

### Version

- V1: linear (legacy, tự động migrate)
- V2: tree với `id`/`parentId`
- V3: rename `hookMessage` → `custom`

---

## 📝 Entry Types

Mỗi dòng là một JSON object với `type`.

### `SessionHeader`

```json
{
  "type": "session",
  "version": 3,
  "id": "uuid",
  "timestamp": "2024-12-03T14:00:00.000Z",
  "cwd": "/path/to/project"
}
```

Nếu session có parent (forked):

```json
{
  "type": "session",
  "version": 3,
  "id": "uuid",
  "timestamp": "...",
  "cwd": "...",
  "parentSession": "/path/to/original/session.jsonl"
}
```

---

### `SessionMessageEntry`

```json
{
  "type": "message",
  "id": "a1b2c3d4",
  "parentId": "prev1234",
  "timestamp": "2024-12-03T14:00:01.000Z",
  "message": {
    "role": "user" | "assistant" | "toolResult",
    "content": ...,
    // Các trường tương ứng với Message types
  }
}
```

---

### Các entry khác

- `model_change`: `{ type:"model_change", id, parentId, timestamp, provider, modelId }`
- `thinking_level_change`: `{ type:"thinking_level_change", id, parentId, timestamp, thinkingLevel }`
- `compaction`: `{ type:"compaction", id, parentId, timestamp, summary, firstKeptEntryId, tokensBefore, details?, fromHook? }`
- `branch_summary`: `{ type:"branch_summary", id, parentId, timestamp, fromId, summary, details?, fromHook? }`
- `custom`: Extension state (không vào LLM context): `{ type:"custom", id, parentId, timestamp, customType, data }`
- `custom_message`: Extension message (có vào context): `{ type:"custom_message", id, parentId, timestamp, customType, content, display, details? }`
- `label`: `{ type:"label", id, parentId, timestamp, targetId, label }`
- `session_info`: `{ type:"session_info", id, parentId, timestamp, name }`

---

## 🌲 Tree Structure

Entries tạo thành tree qua `id` và `parentId`.

```
[user msg] ─── [assistant] ─── [user msg] ─── [assistant] ─┬─ [user msg] ← current leaf
                                                            │
                                                            └─ [branch_summary] ─── [user msg] ← alternate branch
```

---

## 🔧 SessionManager API

### Static creation

- `SessionManager.create(cwd, sessionDir?)` → new session.
- `SessionManager.open(path, sessionDir?)` → open existing file.
- `SessionManager.continueRecent(cwd, sessionDir?)` → continue most recent or create new.
- `SessionManager.inMemory(cwd?)` → no file persistence.
- `SessionManager.forkFrom(sourcePath, targetCwd, sessionDir?)` → fork from another project.

### Listing

- `SessionManager.list(cwd, sessionDir?, onProgress?)`
- `SessionManager.listAll(onProgress?)`

### Instance methods

#### Session control

- `newSession(options?)` → `{ cancelled?, sessionFile?, ... }`
- `setSessionFile(path)` → switch to another file
- `createBranchedSession(leafId)` → extract branch to new file

#### Appending (trả về entry ID)

- `appendMessage(message)` → `id`
- `appendThinkingLevelChange(level)` → `id`
- `appendModelChange(provider, modelId)` → `id`
- `appendCompaction(summary, firstKeptEntryId, tokensBefore, details?, fromHook?)` → `id`
- `appendCustomEntry(customType, data?)` → `id`
- `appendSessionInfo(name)` → `id`
- `appendCustomMessageEntry(customType, content, display, details?)` → `id`
- `appendLabelChange(targetId, label)` → `id`

#### Tree navigation

- `getLeafId()` → current leaf entry ID (or null)
- `getLeafEntry()` → entry object
- `getEntry(id)` → entry by ID
- `getBranch(fromId?)` → walk from leaf (or fromId) to root, returns array of entries (nearest to furthest)
- `getTree()` → full tree structure
- `getChildren(parentId)` → direct children
- `getLabel(id)` → label string or undefined
- `branch(entryId)` → move leaf to earlier entry (rewind)
- `resetLeaf()` → set leaf to null
- `branchWithSummary(entryId, summary, details?, fromHook?)` → branch và attach summary vào abandoned branch

#### Context & info

- `buildSessionContext()` → `{ messages, thinkingLevel, model }` dùng cho LLM.
  - Handles compaction summaries và branch summaries.
- `getEntries()` → tất cả entries (không bao gồm header).
- `getHeader()` → session header.
- `getSessionName()` → lấy tên từ `session_info` entry gần nhất.
- `getCwd()`
- `getSessionDir()`
- `getSessionId()` → UUID.
- `getSessionFile()` → path string or undefined (in-memory).
- `isPersisted()` → boolean.

---

## 🎯 Compaction & Branching

### Compaction

Tóm tắt các message cũ khi context gần đầy để tiết kiệm tokens.

- Tự động (default) khi context overflow.
- Thủ công qua `/compact` command hoặc `ctx.compact()` trong extension.
- Tạo entry `compaction` với `summary`, `firstKeptEntryId`, `tokensBefore`.
- `buildSessionContext()` sẽ emit summary rồi messages from `firstKeptEntryId` trở đi.

### Branching

- `/tree`: điều hướng tree, chọn một entry làm leaf mới.
- Có thể tạo branch summary (LLM-generated) để ghi chú nhánh bị abandon.
- `/fork`: tạo session file mới từ current branch.

---

**Lưu ý**: SessionManager là read/write API cho sessions. Nó không nằm trong `pi-agent-core` nhưng là phần quan trọng của tier 3 (`pi-coding-agent`). Tuy nhiên, `pi-agent-core` cung cấp các `AgentMessage` types được dùng trong sessions.
