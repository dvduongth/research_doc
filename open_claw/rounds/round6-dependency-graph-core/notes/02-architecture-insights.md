# Round 6: Architecture Insights from Dependency Graph
**Ngày**: 2026-03-12

---

## 🏗️ Kiến trúc tổng thể

Pi-mono theo mô hình **3-tier layered architecture**:

```
┌──────────────────────────────────────────┐
│   Tier 3: CLI/Application (pi-coding-agent) │
│   - User interaction (TUI)                 │
│   - Session management (JSONL)             │
│   - Resource loading (skills, extensions) │
│   - Built-in tools (read, bash, write)    │
└──────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────┐
│   Tier 2: Agent Runtime (pi-agent-core)   │
│   - Agent state & event loop              │
│   - Tool execution & steering             │
│   - Message streaming                     │
│   - Transport abstraction                 │
└──────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────┐
│   Tier 1: LLM Abstraction (pi-ai)         │
│   - Unified multi-provider API            │
│   - Model registry & discovery           │
│   - Streaming across providers            │
│   - Tool call handling (protocol)         │
└──────────────────────────────────────────┘
```

---

## 🔑 Requirements & Dependency Rules

### 1. **Layered Dependency Rule**
- Higher tiers MAY depend on lower tiers.
- Lower tiers **MUST NOT** depend on higher tiers.
- This enforces separation of concerns and reuse.

**Enforcement**:
- `pi-coding-agent` → `pi-agent-core` → `pi-ai`.
- `pi-tui` is independent (no dependencies on other pi packages).
- No cyclic imports (verified by code import analysis).

### 2. **Why not all-in-one?**
- **Reusability**: `pi-agent-core` có thể dùng trong web UI (`pi-web-ui`) mà không cần TUI.
- **Testability**: Mỗi tier có thể test độc lập.
- **Replaceability**: Có thể thay đổi implementation của tier 1 (providers) mà không ảnh hưởng tier 2/3.
- **Complexity isolation**: LLM-specific complexities trong tier 1; agent logic trong tier 2; UI/UX trong tier 3.

### 3. **Where does tool execution belong?**
- Tool execution nằm ở **Tier 2 (agent-core)** vì:
  - Nó là agent runtime responsibility (quản lý tool calls, results, error handling, streaming).
  - Phải independent của LLM provider (tier 1) và UI (tier 3).
  - Nếu đặt ở tier 3: mỗi application phải tự implement (không reuse).
  - Nếu đặt ở tier 1: trộn provider logic với agent logic (vi phạm separation).

### 4. **Where does UI belong?**
- UI nằm ở **Tier 3** (pi-coding-agent và pi-tui):
  - `pi-tui` cung cấp generic TUI components (terminal rendering).
  - `pi-coding-agent` compose UI với agent interactions.
  - `pi-tui` độc lập (không phụ thuộc agent-core) → có thể dùng trong apps khác.

### 5. **External dependencies placement**
- **Provider SDKs** (Anthropic, OpenAI, Google, Mistral, AWS) ở **Tier 1** (pi-ai).
  - Rationale: Chỉ tier 1 interacts với providers. Các tier khác không cần biết.
  - Bundle size: Users chỉ cài provider SDKs they use (peer dependencies?).
- **Utility libs** (chalk, diff, yaml, glob, etc.) ở **Tier 3** (pi-coding-agent).
  - Rationale: Chỉ application cần (file ops, formatting, terminal colors).
  - Giả tải cho tier 1/2.

---

## 🔄 Data Flow Across Tiers

1. **User input** (Tier 3) → `Agent.prompt(message)` (Tier 2).
2. **Agent** (Tier 2) → `streamAssistantResponse()` → `convertToLlm(messages)` (customizable) → LLM messages.
3. **LLM messages** passed to **pi-ai** `streamSimple(model, context)` (Tier 1).
4. **Provider SDK** (external) called by pi-ai, returns stream events.
5. **pi-ai** transforms provider events → unified events (`start`, `text_delta`, `toolcall_start`, ...).
6. **Tier 2** consumes events, builds `AssistantMessage`, executes tools, emits agent events.
7. **Tier 3** listens to agent events and renders to TUI.

**Key abstraction points**:
- **Tier 1 → 2 boundary**: pi-ai's `stream()` returns `EventStream<ProviderEvent, AssistantMessage>`. Agent-core consumes this unified stream.
- **Tier 2 → 3 boundary**: `Agent` emits `AgentEvent` stream. Application subscribes and renders.

---

## 🧩 Extension System & Dependencies

- Extensions load runtime code via `@mariozechner/jiti` (Tier 3 dependency).
- Extensions có thể:
  - Register custom tools (sử dụng `AgentTool` interface từ tier 2).
  - Register custom commands (Tier 3).
  - Register custom providers (tier 1).
- **Important**: Extensions run in isolated context nhưng access các pi packages qua imports (hoặc qua `pi` object API).
- Kiến trúc cho phép extensions mở rộng mọi lớp từ tier 1 đến tier 3.

---

## 📦 Package Distribution

Tất cả packages được publish riêng lẻ:

- `@mariozechner/pi-ai`
- `@mariozechner/pi-agent-core`
- `@mariozechner/pi-coding-agent`
- `@mariozechner/pi-tui`

Mỗi package có `package.json` với `exports` để tránh barrel files, hỗ trợ tree-shaking.

**版本同步**: Các package share version number (ví dụ 0.57.1) → đảm bảo compatibility.

---

## 🎯 Design Principles Inferred

1. **Dependency Inversion**: Higher-level modules (application) depend on abstractions (agent-core), not concretions of lower-level? Actually here agent-core depends on pi-ai abstraction, which is okay.
2. **Single Responsibility**: Mỗi package có 1 responsibility rõ ràng.
3. **Reuse across contexts**: agent-core có thể dùng trong web UI, not just CLI.
4. **Optionality**: pi-tui là optional UI layer; có thể có pi-web-ui thay thế.
5. **Extensibility**: Extensions có thể override ở mọi level.

---

## 🐛 Potential Issues

- **Version coupling**: Tất cả packages phải cùng version. Nếu user cài riêng lẻ có thể gây lỗi. Giải pháp: monorepo hoặc strict version ranges.
- **Provider SDK bloat**: pi-ai dependencies với nhiều SDKs. Users chỉ cần dùng 1-2 có thể không muốn cài tất cả. Có thể làm optional dependencies? (đề xuất).
- **Circular risk**: Nếu extensions import coding-agent → gây cycle. Cần policy: extensions chỉ nên import từ agent-core/pi-ai, không import coding-agent.

---

## 📈 Scalability Considerations

- Thêm provider mới: chỉ sửa pi-ai (add provider implementation).
- Thêm UI mode mới (web): tạo `pi-web-ui` mới, dùng agent-core và pi-ai.
- Thêm tool type mới: có thể implement trong extension (không cần sửa core).

---

**Kết luận**: Dependency graph thể hiện thiết kế分层 rõ ràng, tách biệt concerns, dễ mở rộng và reuse. Đây là mẫu hình tốt cho agent frameworks.
