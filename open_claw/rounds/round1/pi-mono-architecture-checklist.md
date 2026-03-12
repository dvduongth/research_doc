# Pi-Mono Architecture Study - Round 1
**Mục tiêu**: Hiểu kiến trúc 3 tiers, Dependency Graph, Agent Loop của Pi-Mono
**Nguồn**: D:\PROJECT\CCN2\pi-mono
**Thời gian bắt đầu**: 2026-03-12 12:33 GMT+7

---

## 📌 Checklist Kiến trúc 3 Tiers

### [ ] **Tier 1: AI Layer (pi-ai)**
- [ ] Hiểu `@mariozechner/pi-ai` cung cấp unified multi-provider API
- [ ] Các provider: Anthropic, OpenAI, Google, Azure, Mistral, Groq, etc.
- [ ] Model abstraction và model discovery (`getModel`, `ModelRegistry`)
- [ ] Cách model được truyền vào agent

### [ ] **Tier 2: Agent Core (pi-agent-core)**
- [ ] Agent class với state management
- [ ] AgentMessage vs LLM Message
- [ ] `convertToLlm()` và `transformContext()`
- [ ] Tool execution và event streaming
- [ ] Session management (cơ bản)

### [ ] **Tier 3: CLI/Application Layer (pi-coding-agent)**
- [ ] Interactive TUI mode
- [ ] ResourceLoader: skills, extensions, prompts, themes, context files
- [ ] Commands (/) system
- [ ] Session persistence (JSONL tree)
- [ ] Compaction, branching, forking

---

## 📌 Checklist Dependency Graph

### [ ] **Core Dependencies**
- [ ] `pi-coding-agent` phụ thuộc `pi-agent-core`
- [ ] `pi-agent-core` phụ thuộc `pi-ai`
- [ ] Các package khác: `pi-tui`, `pi-mom`, `pi-web-ui`, `pi-pods`

### [ ] **Extension System**
- [ ] Extensions discover từ `~/.pi/agent/extensions/` và `.pi/extensions/`
- [ ] Extension API (`ExtensionAPI`) cung cấp:
  - `pi.on(event)` - subscribe events
  - `pi.registerTool()` - custom tools
  - `pi.registerCommand()` - custom commands
  - `pi.registerProvider()` - custom providers
- [ ] Extension có thể override built-in tools

### [ ] **Resource Loading**
- [ ] `DefaultResourceLoader` load theo thứ tự:
  1. Skills (từ cwd/.pi/skills, ~/.pi/agent/skills)
  2. Extensions (từ paths)
  3. Prompt templates
  4. Context files (AGENTS.md)
  5. System prompt
- [ ] Có thể override từng phần qua `skillsOverride`, `extensionsOverride`, etc.

---

## 📌 Checklist Agent Loop

### [ ] **Event Flow từ AgentREADME**
- [ ] `prompt()` gọi:
  1. `agent_start`
  2. `turn_start`
  3. `message_start` (user)
  4. `message_end` (user)
  5. `message_start` (assistant)
  6. `message_update` (streaming)
  7. `message_end` (assistant)
  8. Nếu có tool calls:
     - `tool_execution_start`
     - `tool_execution_update` (nếu stream)
     - `tool_execution_end`
     - `message_start/end` (toolResult)
  9. `turn_end`
  10. Nếu cần tiếp tục (tool calls) → quay lại bước 5
  11. `agent_end`

### [ ] **Event Flow từ Extensions.md (Chi tiết hơn)**
- [ ] Pre-agent events:
  - `before_agent_start` - có thể inject message, modify system prompt
  - `context` - modify messages trước LLM call
  - `before_provider_request` - inspect/replace payload
- [ ] Agent events: `agent_start`, `turn_start`, `message_*`, `tool_*`, `turn_end`, `agent_end`
- [ ] Session events: `session_start`, `session_before_*`, `session_*`, `session_shutdown`
- [ ] Model events: `model_select`
- [ ] Input event: `input` (trước khi expand skill/template)

### [ ] **Concepts**
- [ ] **Turn**: Một LLM response + các tool calls đi kèm
- [ ] **Steering vs Follow-up**:
  - Steering: interrupt trong khi tools đang chạy
  - Follow-up: chờ agent idle rồi mới chạy
- [ ] `transformContext()`: prune, inject external context
- [ ] `convertToLlm()`: filter custom types, convert AgentMessage → LLM Message
- [ ] Compaction: summarize old messages để tiết kiệm context
- [ ] Branching: session tree với `parentId`, không cần file mới

---

## 📌 Câu hỏi Cần Làm Rõ

1. **3 Tiers cụ thể là những package nào?**  
   → Dựa trên README: 
   - Tier 1: `@mariozechner/pi-ai` (LLM abstraction)
   - Tier 2: `@mariozechner/pi-agent-core` (agent runtime)
   - Tier 3: `@mariozechner/pi-coding-agent` (CLI/TUI)
   - Các tier khác: `pi-tui`, `pi-web-ui`, `pi-mom`

2. **Dependency Graph giữa các package và extensions như thế nào?**  
   → Xem phần "Extension System" ở trên

3. **Agent Loop chi tiết (low-level)**: Có `agentLoop()` và `agentLoopContinue()` trong packages/agent/README.md. Cần đọc kỹ hơn.

---

**Tiến độ hiện tại**: Đã đọc 8 file examples (01-08), README chính, packages/agent/README.md, packages/coding-agent/docs/extensions.md. Cần đọc tiếp session.md, models.md, providers.md để hoàn thiện.

---

*File này sẽ được update khi tiến độ thay đổi.*
