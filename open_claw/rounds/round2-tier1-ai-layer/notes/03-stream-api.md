# Streaming API (stream, streamSimple, complete, completeSimple)

## 📚 Core Functions

### `stream(model, context, options?)`

Streaming mode: trả về `AssistantMessageEventStream` (async iterator).

**Parameters**:
- `model`: `Model<TApi>`
- `context`: `Context` (systemPrompt, messages, tools)
- `options`: `StreamOptions` (hoặc provider-specific `ProviderStreamOptions`)

**Returns**: `AssistantMessageEventStream` (có method `.result()` để lấy final message).

**Events** (xem types):
- `start`: stream bắt đầu, `partial` là AssistantMessage rỗng.
- `text_start`, `text_delta`, `text_end`: cho text block.
- `thinking_start`, `thinking_delta`, `thinking_end`: cho thinking block (nếu model reasoning).
- `toolcall_start`, `toolcall_delta`, `toolcall_end`: cho tool calls.
- `done`: stream kết thúc, `reason` là `'stop'|'length'|'toolUse'`, `message` là AssistantMessage hoàn chỉnh.
- `error`: `reason` là `'error'|'aborted'`, `error` là AssistantMessagepartial với lỗi.

**Ví dụ**:
```typescript
const s = stream(model, context);
for await (const event of s) {
  if (event.type === 'text_delta') process.stdout.write(event.delta);
  if (event.type === 'toolcall_delta') console.log('Partial args:', event.partial.content[event.contentIndex].arguments);
}
const final = await s.result(); // AssistantMessage
```

### `complete(model, context, options?)`

Non-streaming: đợi LLM trả về đầy đủ rồi trả về `Promise<AssistantMessage>`.

```typescript
const response = await complete(model, context);
console.log(response.content); // array of blocks
```

### `streamSimple(model, context, { reasoning? })`

Simplified interface cho reasoning: dùng `reasoning: 'minimal'|'low'|'medium'|'high'|'xhigh'`. Tự động map sang options phù hợp provider.

### `completeSimple(model, context, { reasoning? })`

Tương tự `complete` nhưng với simplified reasoning option.

---

## 🔧 StreamOptions

Chung cho tất cả providers:

```typescript
interface StreamOptions {
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
  apiKey?: string;              // override env var
  transport?: 'sse' | 'websocket' | 'auto'; // Codex, OpenAI
  cacheRetention?: 'none' | 'short' | 'long'; // Anthropic, OpenAI
  sessionId?: string;           // For session-based caching (Codex)
  onPayload?: (payload, model) => unknown | undefined; // Debug/inspect
  headers?: Record<string, string>; // Custom headers
  maxRetryDelayMs?: number;     // Cap on retry delay (default 60s)
  metadata?: Record<string, unknown>; // Provider-specific metadata
}
```

---

## 🎯 Provider-Specific Options

Mỗi provider có options riêng, ví dụ:

- **Anthropic** (`anthropic-messages`):
  - `thinkingEnabled?: boolean`
  - `thinkingBudgetTokens?: number`

- **OpenAI** (`openai-responses`):
  - `reasoningEffort?: 'low'|'medium'|'high'`
  - `reasoningSummary?: 'auto'|'text'|'detailed'`

- **Google** (`google-generative-ai`):
  - `thinking?: { enabled: boolean; budgetTokens?: number }`

Khi dùng `stream(model, context, options)`, TypeScript sẽ kiểm tra options khớp với `model.api`.

---

## 🛑 Abort & Error Handling

```typescript
const controller = new AbortController();
setTimeout(() => controller.abort(), 2000);

const s = stream(model, context, { signal: controller.signal });
for await (const event of s) {
  if (event.type === 'error') {
    console.log(event.reason); // 'aborted' or 'error'
    console.log(event.error.errorMessage);
  }
}
const result = await s.result();
if (result.stopReason === 'aborted') {
  // Partial content in result.content, usage in result.usage
}
```

---

## 💡 Tips

- Dùng `streamSimple` nếu bạn chỉ cần reasoning option đơn giản.
- Dùng `onPayload` để debug request gửi đến provider.
- Kiểm tra `model.reasoning` trước khi dùng reasoning options.
- Trong `toolcall_delta`, `event.partial.content[contentIndex].arguments` là partial JSON, có thể thiếu fields → always check existence.
