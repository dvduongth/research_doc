# Ghi Chú Kiến Trúc Pi-Mono (Tiếng Việt)
**Round 1 - Tập trung: 3 Tiers, Dependency Graph, Agent Loop**

---

## 📦 Tổng Quan

Pi-Mono là một **monorepo** chứa nhiều package xây dựng hệ sinh thái AI coding agent. Kiến trúc được thiết kế theo **3 tầng (tiers)** rõ ràng, giúp tách biệt mối quan tâm (separation of concerns) và dễ mở rộng.

### Các Package Chính

| Package | Mô tả | Vị trí trong kiến trúc |
|---------|-------|------------------------|
| `@mariozechner/pi-ai` | Unified API đa provider (OpenAI, Anthropic, Google, ...) | **Tier 1: AI Layer** |
| `@mariozechner/pi-agent-core` | Agent runtime với tool calling, state management, event loop | **Tier 2: Agent Core** |
| `@mariozechner/pi-coding-agent` | CLI + TUI interactive coding agent | **Tier 3: Application Layer** |
| `@mariozechner/pi-tui` | Terminal UI components (cho Tiers 3) | Hỗ trợ UI |
| `@mariozechner/pi-web-ui` | Web components cho giao diện chat | Hỗ trợ UI |
| `@mariozechner/pi-mom` | Slack bot delegate messages đến coding agent | Ứng dụng riêng |

---

## 🏗️ Kiến Trúc 3 Tiers (Lớp)

```
┌─────────────────────────────────────────────────────────────┐
│                    Tier 3: Application Layer                │
│   CLI/TUI (pi-coding-agent) + UI Components (pi-tui/web-ui)│
│   • Interactive mode                                      │
│   • Commands (/)                                          │
│   • Resource loading (skills, extensions, prompts)       │
│   • Session persistence (JSONL)                           │
└─────────────────────────────┬───────────────────────────────┘
                              │ depends on
┌─────────────────────────────▼───────────────────────────────┐
│                  Tier 2: Agent Core                        │
│            (pi-agent-core)                                 │
│   • Agent class                                           │
│   • State management (messages, tools, model)             │
│   • Event loop (agentLoop, agentLoopContinue)            │
│   • Tool execution                                        │
│   • Context building (transformContext, convertToLlm)    │
└─────────────────────────────┬───────────────────────────────┘
                              │ depends on
┌─────────────────────────────▼───────────────────────────────┐
│                    Tier 1: AI Layer                        │
│                (pi-ai)                                     │
│   • Unified LLM API                                       │
│   • Multi-provider support (Anthropic, OpenAI, Google)   │
│   • Model discovery (getModel, ModelRegistry)            │
│   • Tool calling protocol                                │
│   • Token/cost tracking                                   │
│   • Streaming events (text, thinking, tool calls)        │
└─────────────────────────────────────────────────────────────┘
```

### Giải Thích Từng Tier

**Tier 1 - AI Layer (`pi-ai`)**:
- Là tầng trừu tượng giao tiếp với các LLM providers.
- Cung cấp interface chung: `stream()` và `complete()`.
- Mỗi provider có driver riêng (Anthropic Messages, OpenAI Chat Completions, etc.).
- Quản lý models, credentials, và API compatibility.
- Hỗ trợ **tool calling** (function calling) là bắt buộc cho agentic workflow.

**Tier 2 - Agent Core (`pi-agent-core`)**:
- Nắm giữ logic agent: quản lý conversation history, quyết định gọi tool, xử lý kết quả tool, tiếp tục đến khi hoàn thành.
- Có event loop:

```
agentLoop(userMessage, context, config) → emits events:
  agent_start → turn_start → message_start → message_update → message_end
    → (tool calls) → tool_execution_start/update/end → tool_result
    → turn_end (nếu cần tiếp tục: quay lại message_start của assistant)
  → agent_end
```

- Cung cấp `Agent` class đóng gói sẵn state và event subscription.
- Hỗ trợ steering (ngắt trong khi chạy) và follow-up (hàng đợi sau khi xong).
- Có thể transform context trước khi gửi đến LLM (ví dụ: pruning, compaction).

**Tier 3 - Application Layer (`pi-coding-agent`)**:
- Là ứng dụng terminal (TUI) mà người dùng trực tiếp tương tác.
- Quản lý session (lưu JSONL, branching, compaction, fork).
- Load các resource tùy chỉnh: Skills, Extensions, Prompt Templates, Themes, AGENTS.md.
- Cung cấp hệ thống commands (`/`) và keybindings.
- Hiển thị message, tool calls, streaming, và rendering.

---

## 🔗 Dependency Graph (Đồ Thị Phụ Thuộc)

### Core Dependencies (thư viện cốt lõi)

```
pi-coding-agent
    └── pi-agent-core
          └── pi-ai
```

- `pi-coding-agent` import các class/function từ `pi-agent-core`.
- `pi-agent-core` import từ `pi-ai` để gọi LLM.

### Các package hỗ trợ

- `pi-tui`: dùng bởi `pi-coding-agent` để vẽ giao diện terminal.
- `pi-web-ui`: dùng cho integrations web (không phải CLI chính).
- `pi-mom`: là một ứng dụng riêng (Slack bot) dùng `pi-agent-core`.

### Extension System (hệ thống mở rộng)

Extensions là TypeScript modules tự động discover từ:
- Global: `~/.pi/agent/extensions/`
- Project local: `.pi/extensions/`

Extensions có thể:
- **Subscribe events** từ agent lifecycle (session_start, agent_start, turn_*, tool_*, ...)
- **Register custom tools** → tool đó sẽ có trong system prompt và LLM có thể gọi.
- **Register commands** (`/mycommand`) và shortcuts.
- **Register providers** (custom LLM endpoints).
- **Intercept** tool calls, input, session changes.
- **Custom UI**: widgets, status line, footer, custom editor, overlays.

**Dependency của extensions**:
- Import types từ `@mariozechner/pi-coding-agent` (ExtensionAPI).
- Có thể dùng `@mariozechner/pi-tui` để build custom components.
- Có thể có `package.json` và cài npm dependencies riêng.

### Resource Loading Order

`DefaultResourceLoader` (dùng bởi `pi-coding-agent`) load theo thứ tự:

1. **Skills**: từ `cwd/.pi/skills/`, `~/.pi/agent/skills/`, lên parent directories.
2. **Extensions**: từ paths trong settings.json hoặc discover mặc định.
3. **Prompt Templates**: từ `.pi/prompts/`, `~/.pi/agent/prompts/`.
4. **Context Files**: `AGENTS.md` (hoặc `CLAUDE.md`) lên parents.
5. **System Prompt**: mặc định, có thể override bằng `.pi/SYSTEM.md`.

Mỗi loại resource có thể override được qua constructor options của `DefaultResourceLoader` (skillsOverride, extensionsOverride, ...).

---

## 🔄 Agent Loop (Vòng Lặp Agent)

Agent loop là trái tim của system: nó xử lý mỗi lần user gửi prompt và cho đến khi hoàn thành.

### Entry Points

- `agentLoop(messages, context, config)` - khởi động mới với messages ban đầu.
- `agentLoopContinue(context, config)` - tiếp tục từ context hiện tại (last message phải là `user` hoặc `toolResult`).

Cả hai yield event stream.

### Event Flow Chi Tiết

Khi gọi `agent.prompt("Hello")`:

1. **Pre-loop**:
   - `session_start` (CLI only)
   - `before_agent_start`: extensions có thể inject message, sửa system prompt.

2. **Agent start**:
   - `agent_start`

3. **Turn begin**:
   - `turn_start`

4. **User message**:
   - `message_start` (role: user)
   - `message_end` (role: user)

5. **Assistant response (streaming)**:
   - `message_start` (role: assistant)
   - `message_update` (nhiều delta, có thể chứa `text_delta`, `thinking_delta`)
   - `message_end` (role: assistant)

6. **Tool calls?** Nếu assistant gọi tools:
   - `tool_execution_start` cho mỗi tool
   - `tool_execution_update` nếu tool stream
   - `tool_execution_end` với result
   - Sau mỗi tool, assistant sẽ phản hồi lại (next turn):
     - Quay lại bước 5 (message_start assistant, ...) → `turn_end`
     - LLM có thể gọi thêm tool, lặp lại từ bước 6.
   - Nếu không còn tool call → `turn_end`

7. **Agent end**:
   - `agent_end`

**Lưu ý**: Một "turn" là một LLM response + các tool calls đi kèm. Nếu có nhiều tool calls, sẽ có nhiều turn cho đến khi LLM trả lời cuối cùng.

### Context Building

Trước mỗi LLM call:

1. `transformContext(messages, signal)`: extension có thể prune, inject messages.
2. `convertToLlm(messages)`: filter chỉ giữ `user`, `assistant`, `toolResult`, chuyển `AgentMessage` sang `LLM Message` format.

Nếu context quá dài, sẽ tự động compact (tóm tắt) hoặc thủ công (`/compact`).

### Steering và Follow-up

- **Steering**: gửi message khi agent đang chạy tools. Sau tool hiện tại, remaining tools bị skip, steering message được inject, LLM phản hồi lại.
- **Follow-up**: gửi message sau khi agent idle (không còn tool calls). Chỉ chạy khi không còn steering nào chờ.

### Session Persistence

Mỗi session lưu thành file JSONL (mỗi dòng một entry JSON). Các entry tạo thành **tree** với `id`/`parentId`, cho phép branching mà không cần file mới.

Các loại entry quan trọng:
- `SessionHeader`: metadata (version, cwd, parentSession).
- `SessionMessageEntry`: message (user, assistant, toolResult, bashExecution, ...).
- `CompactionEntry`: tóm tắt các message cũ.
- `BranchSummaryEntry`: tóm tắt nhánh bị abandon khi `/tree`.
- `CustomEntry`: state của extension (không vào context).
- `CustomMessageEntry`: message từ extension (có vào context).
- `LabelEntry`: bookmark cho `/tree`.
- `ModelChangeEntry`, `ThinkingLevelChangeEntry`: thay đổi cài đặt.

SessionManager API cung cấp methods để đọc, ghi, điều hướng tree.

---

## 📝 Câu Hỏi Đã Làm Rõ

1. **3 tiers là gì?**
   - Tier 3: `pi-coding-agent` (CLI/TUI) + `pi-tui`/`pi-web-ui`
   - Tier 2: `pi-agent-core` (Agent runtime, event loop)
   - Tier 1: `pi-ai` (LLM abstraction layer)

2. **Dependency graph?**
   - Core: `pi-coding-agent` → `pi-agent-core` → `pi-ai`
   - Extensions plug vào qua `ExtensionAPI`, có thể override tools, commands, providers.
   - Resources (skills, prompts, extensions, themes) được load theo thứ tự xác định.

3. **Agent loop?**
   - `agentLoop()` yield events: `agent_start` → `turn_start` → `message_*` → (nếu tool calls) `tool_*` → `turn_end` (có thể lặp) → `agent_end`.
   - Cung cấp streaming events, steering, follow-up, context transformation.
   - Session lưu dạng JSONL tree.

---

## 📚 Tài Liệu Đã Đọc (References)

- `D:\PROJECT\CCN2\pi-mono\README.md`
- `D:\PROJECT\CCN2\pi-mono\packages\agent\README.md`
- `D:\PROJECT\CCN2\pi-mono\packages\coding-agent\docs\extensions.md`
- `D:\PROJECT\CCN2\pi-mono\packages\coding-agent\docs\session.md`
- `D:\PROJECT\CCN2\pi-mono\packages\coding-agent\docs\models.md`
- `D:\PROJECT\CCN2\pi-mono\packages\coding-agent\docs\providers.md`
- `D:\PROJECT\CCN2\pi-mono\packages\ai\README.md` (phần đầu)
- 8 ví dụ SDK (`01-minimal.ts` → `08-prompt-templates.ts`)

---

## ✅ Checklist Status (cập nhật)

### 3 Tiers
- [x] Hiểu Tier 1: pi-ai (unified LLM API, providers)
- [x] Hiểu Tier 2: pi-agent-core (Agent class, event loop)
- [x] Hiểu Tier 3: pi-coding-agent (CLI/TUI, resource loading)

### Dependency Graph
- [x] Core dependencies giữa 3 package chính
- [x] Extension system và cách extensions plug in
- [x] Resource loading order (skills, extensions, prompts, context)
- [x] Custom providers registration

### Agent Loop
- [x] Event flow từ `agentLoop()`
- [x] Pre-loop events (`before_agent_start`)
- [x] Turn structure (message + tool calls)
- [x] Steering vs Follow-up
- [x] Context transformation (`transformContext`, `convertToLlm`)
- [x] Session persistence (JSONL tree, SessionManager)

---

**Kết luận**: Round 1 đã hoàn thành ~90%. Còn lại các chi tiết nhỏ có thể đọc thêm khi cần.

*Lưu ý: Khi bị interrupt, tôi sẽ tiếp tục từ bước đã ghi trong PROGRESS.md.*
