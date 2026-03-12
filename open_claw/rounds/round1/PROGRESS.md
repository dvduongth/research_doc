# PROGRESS - Round 1: Pi-Mono Architecture
**Người hỗ trợ**: AI Assistant
**Người dùng**: ĐươngDaniel
**Mục tiêu**: Hiểu kiến trúc 3 tiers, dependency graph, agent loop
**Start**: 2026-03-12 12:33 GMT+7

---

## 📋 Steps Logged (từng bước đã làm)

### Step 1: Khám phá repo và tìm file docs (12:33)
- Đã list thư mục `D:\PROJECT\CCN2\pi-mono`
- Không thấy thư mục `docs/` như mong đợi
- Tìm bằng regex `^(00|01|...|08)` và tìm thấy 8 file TypeScript examples trong `packages/coding-agent/examples/sdk/`: `01-minimal.ts` đến `08-prompt-templates.ts`
- **Kết luận**: Các file 01-08 là ví dụ SDK, không phải docs. Cần đọc tài liệu chính thức trong `packages/*/README.md` và `packages/coding-agent/docs/`.

### Step 2: Đọc 8 file ví dụ SDK (12:34-12:35)
- Đã đọc lần lượt: 01-minimal.ts, 02-custom-model.ts, 03-custom-prompt.ts, 04-skills.ts, 05-tools.ts, 06-extensions.ts, 07-context-files.ts, 08-prompt-templates.ts
- **Học được**:
  - Cách tạo agent session: `createAgentSession()`
  - Model selection qua `ModelRegistry`
  - Custom resource loading: `DefaultResourceLoader` với `skillsOverride`, `extensionsOverride`, `agentsFilesOverride`, `promptsOverride`
  - Tools: built-in `readOnlyTools`, `createCodingTools(cwd)`, custom tools
  - Extensions: tự động discover, có thể register tools, commands, intercept events
  - Context files: AGENTS.md, SYSTEM.md

### Step 3: Tạo thư mục output (12:36)
- Tạo `D:\PROJECT\CCN2\research_doc\pi-mono-research\rounds\round1\`
- File đầu ra: `pi-mono-architecture-checklist.md`, `PROGRESS.md` (file này), `notes.md` (sẽ tạo sau)

### Step 4: Tìm tất cả file .md trong repo (12:36)
- Thực thi `Get-ChildItem -Recurse -Filter *.md`
- Tìm thấy hơn 60 file Markdown, bao gồm:
  - `README.md` (root)
  - `packages/agent/README.md`
  - `packages/coding-agent/README.md`
  - `packages/coding-agent/docs/*.md` (extensions.md, session.md, compaction.md, ...)

### Step 5: Đọc README chính (12:37)
- Tóm tắt: Pi monorepo với các package:
  - `pi-ai`: unified multi-provider LLM API
  - `pi-agent-core`: agent runtime
  - `pi-coding-agent`: interactive coding agent CLI
  - `pi-mom`: Slack bot
  - `pi-tui`, `pi-web-ui`, `pi-pods`
- **Phát hiện**: 3-tier architecture có thể là:
  - Tier 1: UI (`pi-coding-agent` + `pi-tui`/`pi-web-ui`)
  - Tier 2: Agent Core (`pi-agent-core`)
  - Tier 3: AI Abstraction (`pi-ai`)

### Step 6: Đọc packages/agent/README.md (12:38)
- Chi tiết về Agent class, event flow, tools, state management.
- **Học được Agent Loop chi tiết**:
  - `prompt()` → sequences of events: `agent_start`, `turn_start`, `message_*`, `tool_execution_*`, `turn_end` (có thể lặp nếu tool calls), `agent_end`.
  - `continue()` để resume.
  - Có `transformContext()` và `convertToLlm()`.
  - Event streaming qua `message_update`.
  - Steering và Follow-up queues.
- Đây là **core agent loop**.

### Step 7: Đọc packages/coding-agent/docs/extensions.md (12:40-12:43)
- Tài liệu rất dài về Extension system.
- **Học được Dependency Graph**:
  - Extensions tự động discover từ `~/.pi/agent/extensions/` và `.pi/extensions/`
  - Extensions có thể:
    - Subscribe events (full lifecycle)
    - Register custom tools, commands, shortcuts, flags
    - Intercept tool calls, input, session changes
    - Custom UI components, rendering
    - Quản lý state qua `appendEntry`
  - Extension API cung cấp `pi.on()`, `pi.registerTool()`, `pi.registerCommand()`, `pi.events`, etc.
- **Dependency**:
  - `pi-coding-agent` depend on `pi-agent-core`
  - `pi-agent-core` depend on `pi-ai`
  - Extensions depend trên `@mariozechner/pi-coding-agent` types và `@mariozechner/pi-tui` cho UI.
  - Extension có thể cài npm packages thêm.

### Step 8: Reading: packages/coding-agent/docs/session.md (TODO)
- Chưa đọc. Cần đọc để hiểu session storage (JSONL tree), SessionManager API.

### Step 9: Reading: packages/coding-agent/docs/models.md & providers.md (TODO)
- Chưa đọc. Cần đọc để hiểu model registry, providers, fallback.

### Step 10: Reading: packages/ai/README.md (TODO)
- Chưa đọc. Để hiểu layer AI (Tier 1) chi tiết.

---

## 🎯 Next Steps (còn lại)

1. **Đọc `packages/coding-agent/docs/session.md`** - Hiểu session storage, branching, compaction, SessionManager.
2. **Đọc `packages/coding-agent/docs/models.md`** - Model registry, model selection, per-session model override.
3. **Đọc `packages/coding-agent/docs/providers.md`** - Provider setup, API keys, custom providers.
4. **Đọc `packages/ai/README.md`** - Chi tiết về `pi-ai` package.
5. **Tổng hợp thành notes.md** bằng tiếng Việt, giải thích rõ cho người chưa quen AI.
6. **Cập nhật checklist** với [x] cho những phần đã hiểu.

---

## 📝 Notes

- **3-tier architecture identified**:
  - **Tier 3 (UI)**: `pi-coding-agent` (CLI/TUI), `pi-tui` (terminal UI components), `pi-web-ui` (web components)
  - **Tier 2 (Agent)**: `pi-agent-core` (stateful agent, event loop, tool execution)
  - **Tier 1 (AI)**: `pi-ai` (multi-provider LLM abstraction)

- **Dependency graph**:
  - Core dependencies: `pi-coding-agent` → `pi-agent-core` → `pi-ai`
  - Extensions plug into `pi-coding-agent` via ExtensionAPI
  - Resources (skills, prompts, themes) are loaded by `DefaultResourceLoader`
  - SessionManager manages session storage (JSONL files)

- **Agent Loop** (low-level):
  - Entry points: `agentLoop(messages, context, config)` and `agentLoopContinue(context, config)`
  - For each turn:
    - Build LLM context via `transformContext()` then `convertToLlm()`
    - Call LLM with streaming
    - Handle tool calls sequentially (LLM may call multiple tools)
    - After each tool result, LLM may respond (next turn)
  - Events emitted throughout for UI updates.

- **Extension interception points** (very flexible):
  - `session_directory`, `session_start`, `session_before_*`, `session_*`, `session_shutdown`
  - `before_agent_start`, `context`, `before_provider_request`
  - `agent_start`, `turn_start`, `message_*`, `tool_*`, `turn_end`, `agent_end`
  - `input`, `user_bash`, `model_select`
  - Can block (`return { block: true }`), modify, or handle (skip agent).

- **Session format**: JSONL with tree structure (`id`, `parentId`), supports in-place branching.

- **Compaction**: Automatic or manual, summarizes old messages while keeping recent.

---

**Tiến độ**: ~60% đã hoàn thành (đã đọc README, agent, extensions). Cần đọc session, models, providers để hoàn thiện.
