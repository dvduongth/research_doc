# Round 2 Checklist: Tier 1 AI Layer (`pi-ai`)
**Đánh dấu [x] khi đã hiểu.**

---

## ✅ Model System

- [ ] **Model Interface**: Các trường `id`, `name`, `api`, `provider`, `baseUrl`, `reasoning`, `input`, `contextWindow`, `maxTokens`, `cost`, `compat`.
- [ ] **`getModel(provider, id)`**: Lấy model cụ thể, IDE autocomplete.
- [ ] **`getModels(provider)`**: Liệt kê tất cả models của provider.
- [ ] **`getProviders()`**: Liệt kê tất cả providers.
- [ ] **ModelRegistry**: Cache và discovery, có thể load custom models từ `models.json`.
- [ ] **CLI model selection**: `--model`, `/model`, `--scoped-models`.

---

## ✅ Streaming API

- [ ] **`stream(model, context, options)`**: Signature và options.
- [ ] **Event types đầy đủ**:
  - `start`
  - `text_start` / `text_delta` / `text_end`
  - `thinking_start` / `thinking_delta` / `thinking_end`
  - `toolcall_start` / `toolcall_delta` / `toolcall_end`
  - `done`
  - `error`
- [ ] **`streamSimple(model, context, { reasoning })`**: Simplified reasoning interface.
- [ ] **AbortController**: `signal` option, `stopReason === 'aborted'`.
- [ ] **Usage streaming**: Có event `done` chứa `usage`.
- [ ] **`onPayload` callback**: Debug provider request.

---

## ✅ Complete API

- [ ] **`complete(model, context, options)`**: Non-streaming.
- [ ] Return shape: `AssistantMessage` với `content`, `usage`, `stopReason`.
- [ ] **`completeSimple(model, context, { reasoning })`**: Simplified.

---

## ✅ Tool Calling

- [ ] **Tool definition**: `name`, `description`, `parameters` (TypeBox schema).
- [ ] **StringEnum**: Dùng cho Google compatibility.
- [ ] **Tool validation**: `validateToolCall(tools, toolCall)`.
- [ ] **Partial arguments** trong `toolcall_delta`: có thể thiếu fields.
- [ ] **Tool result message**: `role: 'toolResult'`, `toolCallId`, `toolName`, `content`, `isError`.
- [ ] **Automatic retry**: Tool validation error được trả về cho LLM để tự retry.

---

## ✅ Thinking/Reasoning

- [ ] **`model.reasoning`**: Boolean flag.
- [ ] **Thinking content block**: `{ type: 'thinking', thinking: string }`.
- [ ] **Provider options**:
  - OpenAI: `reasoningEffort`, `reasoningSummary`.
  - Anthropic: `thinkingEnabled`, `thinkingBudgetTokens`.
  - Google: `thinking: { enabled, budgetTokens }`.
- [ ] **Streaming**: events `thinking_start/delta/end`.
- [ ] **Cross-provider**: thinking chuyển thành `<thinking>...</thinking>` text.

---

## ✅ Providers

- [ ] **Provider interface**: `baseUrl`, `apiKey`, `api`, `headers`, `models`.
- [ ] **Built-in providers list** (README có liệt kê).
- [ ] **Auth resolution order**: CLI flag → auth.json → env var → custom.
- [ ] **Environment variables**: Bảng các vars (OPENAI_API_KEY, ANTHROPIC_API_KEY, ...).
- [ ] **Custom provider qua `models.json`**: Thêm `providers` với `baseUrl`, `api`, `models`.
- [ ] **Provider override**: Chỉ `baseUrl` để giữ models built-in.

---

## ✅ Error Handling

- [ ] **Abort**: `signal` + `stopReason === 'aborted'`.
- [ ] **Partial content** khi abort vẫn được giữ.
- [ ] **Continue after abort**: Có thể push partial message vào context và gọi tiếp.
- [ ] **Error event**: `event.reason === 'error'`, `event.error.errorMessage`.
- [ ] **Stop reasons**: `'stop'`, `'length'`, `'toolUse'`, `'error'`, `'aborted'`.

---

## ✅ Cost Tracking

- [ ] **Usage object**: `input`, `output`, `cacheRead`, `cacheWrite`, `totalTokens`.
- [ ] **Cost object**: `input`, `output`, `cacheRead?`, `cacheWrite?`, `total`.
- [ ] Cost được tính tự động dựa trên model.cost.

---

## ✅ Context Serialization & Cross-Provider Handoff

- [ ] **Context JSON serializable**: `JSON.stringify(context)`.
- [ ] **Cross-provider transformation**:
  - User/toolResult giữ nguyên.
  - Assistant từ provider khác: thinking → `<thinking>` text.
  - Tool calls và text giữ nguyên.
- [ ] **Example multi-provider**: Bắt đầu với Claude, switch sang GPT, rồi Gemini.

---

## ✅ Compatibility

- [ ] **OpenAI compatibility** (`openai-completions`): Nhiều provider dùng API này.
- [ ] **`compat` field options**:
  - `supportsStore`
  - `supportsDeveloperRole`
  - `supportsReasoningEffort`
  - `supportsUsageInStreaming`
  - `supportsStrictMode`
  - `maxTokensField`: `'max_tokens'` vs `'max_completion_tokens'`
  - `requiresToolResultName?`
  - `requiresAssistantAfterToolResult?`
  - `requiresThinkingAsText?`
  - `thinkingFormat`: `'openai'` | `'zai'` | `'qwen'`
  - `openRouterRouting`
  - `vercelGatewayRouting`
- [ ] **Auto-detection**: Dựa vào `baseUrl` cho một số provider known.
- [ ] **Partial override**: Chỉ set một số trường, các trường khác dùng auto-detected.

---

## ✅ Development Checklist (nếu cần thêm provider)

- [ ] Thêm `Api` type vào `KnownApi`.
- [ ] Tạo `src/providers/<provider>.ts` với `stream<Provider>()`, `streamSimple<Provider>()`.
- [ ] Register API trong `src/providers/register-builtins.ts`.
- [ ] Thêm env var vào `src/env-api-keys.ts`.
- [ ] Cập nhật `scripts/generate-models.ts` để fetch models.
- [ ] Viết tests: `stream.test.ts`, `tool-call.test.ts`, `cross-provider-handoff.test.ts`, etc.
- [ ] Cập nhật `coding-agent/src/core/model-resolver.ts` default model.
- [ ] Cập nhật `coding-agent/README.md`.
- [ ] Cập nhật `packages/ai/README.md`.

---

**Ghi chú**:
- Đọc file: `packages/ai/README.md` (full), `src/types.ts`, `src/modelRegistry.ts` (hoặc tương tự), `src/stream.ts`, `src/complete.ts`, `src/tools.ts`, `providers/*`.
- Ghi notes vào `notes/` với số thứ tự.
- Sau khi đọc xong, cập nhật checklist trên với [x].
