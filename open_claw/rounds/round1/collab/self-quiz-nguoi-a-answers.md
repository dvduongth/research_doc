# Self Quiz + Đáp án gợi ý — Người A: Nền tảng & Kết nối

> Câu hỏi không có đáp án: [self-quiz-nguoi-a.md](self-quiz-nguoi-a.md)

---

## Tier 1: AI Layer (`pi-ai`)

### Câu hỏi nhận biết (nhớ)

**[Q1](#): Package `pi-ai` giải quyết vấn đề gì? Tại sao không gọi thẳng API của từng provider?**

> - Giải quyết **fragmentation**: mỗi provider (OpenAI, Anthropic, Google…) có SDK riêng, format riêng
> - `pi-ai` cung cấp **1 API duy nhất** (`stream()`) để gọi tất cả providers
> - Lợi ích: switch provider chỉ cần đổi model name, không đổi code
> - Ví dụ: Giống ổ cắm đa năng — cắm phích EU hay US đều dùng được

**[Q2](#): Kể tên ít nhất 5 LLM providers mà `pi-ai` hỗ trợ.**

> Anthropic, OpenAI, Google (Gemini), Azure, Mistral, Groq, Amazon Bedrock, Ollama, OpenRouter, Together AI, Fireworks, DeepSeek, xAI, Cerebras, …(22+ providers tổng cộng)

**[Q3](#): `ModelRegistry` dùng để làm gì? Khác gì Provider Registry?**

> - **ModelRegistry**: Quản lý danh sách models khả dụng, map model name → provider + config. Dùng `getModel("claude-3.5-sonnet")` để lấy model object.
> - **Provider Registry**: Quản lý các provider implementations (Anthropic provider, OpenAI provider…). Mỗi provider biết cách gọi API riêng.
> - Quan hệ: 1 provider có nhiều models. ModelRegistry tra cứu model → tìm provider tương ứng.

**[Q4](#): Hàm `getModel()` nhận tham số gì và trả về gì?**

> - Nhận: model identifier string (ví dụ: `"claude-3.5-sonnet"`, `"openai:gpt-4o"`)
> - Trả về: Model object chứa provider reference, model config, capabilities
> - Model object này được truyền vào Agent ở Tier 2

### Câu hỏi hiểu (giải thích)

**[Q5](#): Giải thích bằng ví dụ đời thường tại sao cần "unified API".**

> Như **app gọi xe**: Grab, Be, Xanh SM đều có app riêng. Nhưng nếu có 1 app gộp — bạn chỉ cần bấm "đặt xe", app tự chọn hãng rẻ nhất/gần nhất. `pi-ai` là app gộp đó cho LLM providers.

**[Q6](#): Thêm provider mới (DeepSeek) cần làm gì?**

> 2 cách:
> 1. **Fork + code**: Implement interface `Provider` (chủ yếu method `stream()`), đăng ký vào Provider Registry
> 2. **Extension** (không cần fork): Dùng `pi.registerProvider()` trong extension — đơn giản hơn, user tự maintain

### Câu hỏi vận dụng

**[Q7](#): Trong `02-custom-model.ts`, model được chọn thế nào?**

> - Dùng `ModelRegistry.getModel()` hoặc truyền model config trực tiếp
> - Có thể override per-session qua `createAgentSession({ model: ... })`
> - Cũng có thể override runtime qua `model_select` event (extension)

---

## Tier 2: Agent Core (`pi-agent-core`)

### Câu hỏi nhận biết

**[Q8](#): `AgentMessage` vs `LLM Message` khác nhau thế nào?**

> - **AgentMessage**: Format nội bộ của pi-mono, chứa thêm metadata (id, parentId, extension data, steering flags, timestamps)
> - **LLM Message**: Format chuẩn OpenAI-compatible (role, content, tool_calls, tool_results) — chỉ chứa thông tin LLM hiểu
> - Ví dụ: AgentMessage có `parentId` để build session tree — LLM không cần biết field này

**[Q9](#): `convertToLlm()` được gọi ở đâu, làm gì?**

> - Gọi **sau `transformContext()`**, ngay trước khi gửi cho LLM
> - Làm: Lọc bỏ metadata nội bộ, chuyển AgentMessage[] → LLM Message[]
> - Giữ lại: role, content, tool_calls, tool_results
> - Bỏ: internal IDs, parentId, extension metadata, steering flags

**[Q10](#): `transformContext()` được gọi ở đâu, mục đích?**

> - Gọi **trước `convertToLlm()`**, mỗi turn trước khi gửi LLM
> - Mục đích: Prune messages cũ (giữ context window), inject external context (AGENTS.md, skills)
> - Flow: Messages gốc → `transformContext()` prune/inject → `convertToLlm()` format → gửi LLM

### Câu hỏi hiểu

**[Q11](#): Tại sao cần state management?**

> - Agent cần nhớ: conversation history, current tools, active session, pending tool calls
> - Không có state → mỗi turn agent "mất trí nhớ", không biết mình đang làm gì
> - State management cũng cho phép: resume session, branching, undo

**[Q12](#): Event streaming phục vụ ai?**

> - **UI layer** (TUI/Web): Hiện text realtime (streaming effect giống ChatGPT)
> - **Extensions**: Hook vào từng bước để modify/log/block
> - **Nếu đợi hết**: User chờ 10-30s không thấy gì → trải nghiệm kém, tưởng bị treo

### Câu hỏi vận dụng

**[Q13](#): Tool mới nhận input/output format nào?**

> - Input: JSON object theo schema do tool khai báo (ví dụ: `{ path: string, content: string }`)
> - Output: String hoặc structured result (string phổ biến nhất)
> - Đăng ký: `pi.registerTool({ name, description, inputSchema, execute: async (input) => result })`

---

## Tier 3: CLI/Application Layer (`pi-coding-agent`)

### Câu hỏi nhận biết

**[Q14](#): ResourceLoader load theo thứ tự nào?**

> 1. **Skills** (từ `cwd/.pi/skills`, `~/.pi/agent/skills`)
> 2. **Extensions** (từ `~/.pi/agent/extensions/`, `.pi/extensions/`)
> 3. **Prompt templates**
> 4. **Context files** (AGENTS.md, SYSTEM.md)
> 5. **System prompt** (tổng hợp từ trên)

**[Q15](#): Session format?**

> - **JSONL** (JSON Lines) — mỗi dòng 1 message
> - Cấu trúc tree: mỗi message có `id` (unique) và `parentId` (trỏ về message trước)
> - Branching: Tạo message mới với `parentId` trỏ về điểm rẽ → không cần file mới

**[Q16](#): Commands (/) system?**

> - User gõ `/command` trong CLI (ví dụ: `/compact`, `/help`, `/model`)
> - Được đăng ký qua `registerCommand()` — built-in hoặc extension
> - Xử lý bởi CLI layer, không gửi cho LLM

### Câu hỏi hiểu

**[Q17](#): Tại sao tree structure thay vì flat list?**

> - **Branching**: Thử nhiều hướng từ cùng 1 điểm mà không mất history
> - **Memory efficient**: Branch chỉ tạo nodes mới, không copy toàn bộ
> - **Undo tự nhiên**: Quay về node trước = switch branch
> - Flat list không hỗ trợ branching — phải duplicate toàn bộ history

**[Q18](#): Override mechanism hữu ích khi nào?**

> - **SDK usage**: Khi build custom agent, chỉ muốn load skills cụ thể (không phải tất cả)
> - **Testing**: Override extensions bằng mock extensions
> - **Security**: Override để disable dangerous tools trong môi trường production

---

## Dependency Graph & Extension System

### Câu hỏi nhận biết

**[Q19](#): Dependency chain chính?**

> ```
> pi-coding-agent → pi-agent-core → pi-ai
> ```
> (Application → Core → Foundation)

**[Q20](#): Extension discover từ đâu?**

> 1. `~/.pi/agent/extensions/` (global, user-level)
> 2. `.pi/extensions/` (local, project-level)

**[Q21](#): ExtensionAPI phương thức đăng ký?**

> 4 phương thức chính:
> 1. `pi.on(event)` — subscribe events
> 2. `pi.registerTool()` — custom tools
> 3. `pi.registerCommand()` — custom commands
> 4. `pi.registerProvider()` — custom LLM providers

### Câu hỏi hiểu

**[Q22](#): Override built-in tools — ý nghĩa kiến trúc?**

> - **Lợi**: Customize sâu mà không fork repo (ví dụ: thay đổi cách ReadFile hoạt động)
> - **Hại**: Rủi ro bảo mật — extension malicious có thể override tool để đánh cắp data
> - **Ý nghĩa**: Pi-mono chọn **flexibility over security**, trust user (developer)

**[Q23](#): Tại sao thứ tự load cố định?**

> - Skills load trước → Extensions có thể reference skills đã load
> - Context files load sau extensions → extensions có thể modify context loading
> - System prompt cuối cùng → tổng hợp từ tất cả trên
> - Đảo thứ tự → extensions không tìm thấy skills → crash hoặc behavior sai

### Câu hỏi tổng hợp

**[Q24](#): Pi-mono vs Claude Code — 3 điểm khác biệt kiến trúc?**

> 1. **Multi-provider**: Pi-mono hỗ trợ 15+ providers vs Claude Code chỉ Claude
> 2. **Open source MIT**: Pi-mono mở hoàn toàn vs Claude Code closed source
> 3. **Extension model**: Pi-mono có ExtensionAPI mở rộng (tools, commands, providers, events) vs Claude Code có MCP nhưng hạn chế hơn

**[Q25](#): Sơ đồ tổng quan?**

> ```
> User gõ command
>     ↓
> [Tier 3: pi-coding-agent]
>   CLI/TUI → ResourceLoader → Commands
>     ↓
> [Tier 2: pi-agent-core]
>   Agent class → agentLoop() → transformContext() → convertToLlm()
>     ↓
> [Tier 1: pi-ai]
>   ModelRegistry → Provider → stream() → LLM API
>     ↓
> LLM Response (streaming) → ngược lại qua 3 tiers → User thấy output
> ```
