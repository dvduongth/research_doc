# Architecture Overview - Pi-AI Layer

## 🎯 Mục tiêu của `pi-ai`

`@mariozechner/pi-ai` là **unified LLM API** - tầng trừu tượng giao tiếp với nhiều LLM provider khác nhau (Anthropic, OpenAI, Google, Mistral, Groq, Hugging Face, Amazon Bedrock, Google Gemini CLI, ...). Mục tiêu:

- Một interface chung cho tất cả providers
- Tự động discover models
- Hỗ trợ streaming, complete, tool calling, thinking
- Token và cost tracking
- Cross-provider handoff (chuyển đổi context giữa providers)
- Dễ mở rộng thêm provider mới

---

## 📦 Core Concepts

### 1. Model

Mỗi model được định nghĩa bởi interface `Model<Api>`:

```typescript
interface Model<Api extends ApiType> {
  id: string;                 // VD: "claude-sonnet-4-20250514"
  name: string;               // VD: "Claude Sonnet 4"
  api: Api;                   // API type: "anthropic-messages", "openai-completions", "bedrock-converse-stream", ...
  provider: string;           // VD: "anthropic"
  baseUrl: string;            // Endpoint URL (required — mặc định là official URL của provider)
  reasoning: boolean;         // Có hỗ trợ extended thinking?
  input: ('text' | 'image')[]; // Input types supported
  contextWindow: number;      // Max tokens context
  maxTokens: number;          // Max output tokens
  cost: {                     // Cost per million tokens
    input: number;
    output: number;
    cacheRead?: number;
    cacheWrite?: number;
  };
  compat?: OpenAICompletionsCompat; // Compatibility overrides
}
```

Lưu ý: `Api` type xác định provider-specific options sẽ được dùng.

### 2. Context

Context là conversation state được gửi đến LLM:

```typescript
interface Context {
  systemPrompt: string;
  messages: Message[];  // User, Assistant, ToolResult messages
  tools?: Tool[];       // Optional tools
}
```

### 3. Tool

Tool định nghĩa function LLM có thể gọi:

```typescript
interface Tool {
  name: string;
  description: string;
  parameters: TSchema;  // TypeBox schema for validation
}
```

Khi LLM gọi tool, arguments sẽ được validate tự động dựa trên schema.

### 4. Message Types

Có 3 loại message cơ bản:

- `UserMessage`: `{ role: 'user', content: string | ContentBlock[] }`
- `AssistantMessage`: `{ role: 'assistant', content: ContentBlock[], api, provider, model, usage, stopReason, errorMessage? }`
- `ToolResultMessage`: `{ role: 'toolResult', toolCallId, toolName, content: ContentBlock[], isError, timestamp }`

ContentBlock có thể là:
- `{ type: 'text', text: string }`
- `{ type: 'image', data: base64, mimeType }`
- `{ type: 'thinking', thinking: string }` (chỉ với reasoning models)
- `{ type: 'toolCall', id, name, arguments }` (chỉ trong AssistantMessage streaming)

---

## 🔄 Streaming vs Complete

### Streaming (`stream`)

```typescript
import { stream } from '@mariozechner/pi-ai';

const s = stream(model, context, options?); // options: { signal?, apiKey?, ...provider options }

for await (const event of s) {
  switch (event.type) {
    case 'start':
      // Partial AssistantMessage with metadata
      break;
    case 'text_start':
      // Start of a text block
      break;
    case 'text_delta':
      // New text chunk
      process.stdout.write(event.delta);
      break;
    case 'text_end':
      // Text block complete
      break;
    case 'thinking_start':
      // Thinking block start (nếu reasoning)
      break;
    case 'thinking_delta':
      // Thinking chunk
      break;
    case 'thinking_end':
      // Thinking block complete
      break;
    case 'toolcall_start':
      // Tool call beginning
      break;
    case 'toolcall_delta':
      // Partial arguments (JSON streaming)
      const partialArgs = event.partial.content[event.contentIndex].arguments;
      break;
    case 'toolcall_end':
      // Tool call complete với validated arguments
      const toolCall = event.toolCall;
      break;
    case 'done':
      // Stream finished, reason: 'stop' | 'length' | 'toolUse'
      const finalMessage = await s.result();
      break;
    case 'error':
      // error or aborted
      break;
  }
}
```

### Complete (`complete`)

Non-streaming, trả về AssistantMessage hoàn chỉnh:

```typescript
import { complete } from '@mariozechner/pi-ai';

const response = await complete(model, context, options?);
// response là AssistantMessage với:
// - content: đầy đủ
// - usage: token counts, cost
// - stopReason

for (const block of response.content) {
  if (block.type === 'text') console.log(block.text);
  if (block.type === 'thinking') console.log('Thinking:', block.thinking);
  if (block.type === 'toolCall') console.log('Tool:', block.name, block.arguments);
}
```

---

## 🧠 Thinking/Reasoning

Một số model hỗ trợ **extended thinking** (Claude Sonnet 4, GPT-5, Gemini 2.5, ...). Kiểm tra bằng `model.reasoning`.

### Options theo provider

- **General (simple)**: `streamSimple(model, context, { reasoning: 'minimal'|'low'|'medium'|'high'|'xhigh' })`
  - Tự động map sang các provider phù hợp.

- **OpenAI** (`openai-completions` or `openai-responses`):
  ```typescript
  { reasoningEffort: 'medium'|'high', reasoningSummary?: 'auto'|'text'|'detailed' }
  ```

- **Anthropic** (`anthropic-messages`):
  ```typescript
  { thinkingEnabled: true, thinkingBudgetTokens?: number }
  ```

- **Google** (`google-generative-ai`):
  ```typescript
  { thinking: { enabled: true, budgetTokens?: number } }
  ```

Khi streaming, thinking đến qua các event `thinking_start`/`thinking_delta`/`thinking_end`. Khi complete, thinking xuất hiện dưới dạng content block `{ type: 'thinking', thinking: string }`.

---

## 🔧 Tool Calling

Tool calls được stream ra dưới dạng:

1. `toolcall_start`: bắt đầu tool call (chỉ index)
2. `toolcall_delta`: arguments đang stream dưới dạng JSON partial. `event.partial.content[contentIndex].arguments` chứa object đang được build (có thể thiếu fields).
3. `toolcall_end`: tool call hoàn chỉnh với `event.toolCall` đã được validate.

**Validation**: Dùng `validateToolCall(tools, toolCall)` để kiểm tra arguments theo schema. Nếu fail, throw error → sẽ được báo back cho LLM để retry.

**Tool result**: Sau khi thực thi, push `ToolResultMessage` vào context. Có thể chứa text và images.

---

## 🌐 Providers

Built-in APIs (xem danh sách trong README). Mỗi provider có:
- `stream<Provider>()` implementation
- `streamSimple<Provider>()` wrapper
- Provider-specific options interface

**Auth resolution order**:
1. CLI `--api-key` flag
2. `auth.json` entry
3. Environment variable (ví dụ `OPENAI_API_KEY`)
4. Custom provider keys từ `models.json`

---

## 🔀 Cross-Provider Handoffs

Khi chuyển đổi giữa providers (ví dụ từ Claude sang GPT), library tự động:
- Giữ nguyên user, toolResult messages.
- Chuyển `AssistantMessage` từ provider khác: thinking blocks được thành text có `<thinking>` tags.
- Tool calls và text bình thường được giữ nguyên.

Điều này cho phép bạn bắt đầu với model A, sau đó switch sang model B mà không mất context.

---

## 💰 Cost Tracking

Mỗi `AssistantMessage` có `usage`:

```typescript
interface Usage {
  input: number;
  output: number;
  cacheRead?: number;
  cacheWrite?: number;
  totalTokens: number;
  cost: {
    input: number;
    output: number;
    cacheRead?: number;
    cacheWrite?: number;
    total: number;
  };
}
```

Cost được tính tự động dựa trên model.cost rates.

---

## 🛠️ Custom Models & Providers

Bạn có thể define custom models trong `~/.pi/agent/models.json`:

```json
{
  "providers": {
    "ollama": {
      "baseUrl": "http://localhost:11434/v1",
      "api": "openai-completions",
      "apiKey": "dummy",
      "models": [
        { "id": "llama3.1:8b", "name": "Llama 3.1 8B", ... }
      ]
    }
  }
}
```

Hoặc override built-in providers bằng cách chỉ định `baseUrl` lại.

---

## 📝 Notes on Compatibility

Một số provider có khác biệt nhỏ:
- **Google**: không stream tool calls (chỉ nhận full arguments sau khi LLM finish).
- **maxTokens field**: OpenAI dùng `max_tokens` (legacy) hoặc `max_completion_tokens` (mới). Mặc định dùng `max_completion_tokens`. Có thể override bằng `compat.maxTokensField`.
- **system prompt**: Một số provider dùng `developer` role thay vì `system`. Có thể điều chỉnh qua `compat.supportsDeveloperRole`.
- **strict mode**: Một số provider không hỗ trợ `strict` trong tool schema. Tắt bằng `compat.supportsStrictMode: false`.

---

**Lưu ý**: Pi-AI chỉ bao gồm models hỗ trợ tool calling. Đó là lý do tại sao tất cả model đều có `input` và `tools` là bắt buộc.

---

*Đây là overview. Các notes chi tiết về từng phần sẽ được tạo khi đọc source code.*

---

> **Errata (2026-03-12):**
> - `baseUrl` trong Model interface là **required** (`baseUrl: string`), không phải optional. Mỗi provider built-in đều có default URL; custom provider phải cung cấp.
> - Danh sách providers ban đầu thiếu Hugging Face, Amazon Bedrock, Google Gemini CLI — đã bổ sung.
> - API type `bedrock-converse-stream` (dùng cho Amazon Bedrock) đã được thêm vào ví dụ của field `api`.
