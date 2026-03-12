# Model System - Deep Dive

## 📦 Model Interface

Mỗi model là một object typed theo API type (Anthropic, OpenAI, Google,...):

```typescript
interface Model<TApi extends Api> {
  id: string;                 // Model ID dùng trong API (ví dụ: "claude-sonnet-4-20250514")
  name: string;               // Tên hiển thị (ví dụ: "Claude Sonnet 4")
  api: TApi;                  // Loại API: "anthropic-messages", "openai-completions", ...
  provider: Provider;         // Tên provider: "anthropic", "openai", "google", ...
  baseUrl: string;            // URL endpoint (có thể override)
  reasoning: boolean;         // Model có hỗ trợ extended thinking không?
  input: ('text' | 'image')[]; // Input types model hỗ trợ
  cost: {                    // Giá mỗi triệu token
    input: number;
    output: number;
    cacheRead?: number;
    cacheWrite?: number;
  };
  contextWindow: number;     // Max context tokens
  maxTokens: number;         // Max output tokens
  headers?: Record<string, string>; // Custom headers (nếu cần)
  compat?: TApi extends "openai-completions"
    ? OpenAICompletionsCompat
    : TApi extends "openai-responses"
      ? OpenAIResponsesCompat
      : never;
}
```

**Ví dụ model cụ thể**:

```typescript
// Anthropic Claude Sonnet 4
{
  id: "claude-sonnet-4-20250514",
  name: "Claude Sonnet 4",
  api: "anthropic-messages",
  provider: "anthropic",
  baseUrl: "https://api.anthropic.com/v1",
  reasoning: true,
  input: ["text", "image"],
  cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
  contextWindow: 200000,
  maxTokens: 8192
}

// OpenAI GPT-4o-mini (openai-completions)
{
  id: "gpt-4o-mini",
  name: "GPT-4o Mini",
  api: "openai-completions",
  provider: "openai",
  baseUrl: "https://api.openai.com/v1",
  reasoning: false,
  input: ["text", "image"],
  cost: { input: 0.15, output: 0.60 },
  contextWindow: 128000,
  maxTokens: 16384
}
```

---

## 🔍 Getting Models

### `getProviders()`

Trả về mảng tất cả provider names:

```typescript
import { getProviders } from '@mariozechner/pi-ai';
const providers = getProviders(); // ['openai', 'anthropic', 'google', 'xai', 'groq', ...]
```

### `getModels(provider)`

Lấy tất cả models của một provider, với type-safe:

```typescript
import { getModels } from '@mariozechner/pi-ai';
const anthropicModels = getModels('anthropic');
// anthropicModels: Model<'anthropic-messages'>[]
for (const model of anthropicModels) {
  console.log(`${model.id}: ${model.name}`);
}
```

TypeScript sẽ biết `model.api` là `'anthropic-messages'` nên bạn có thể truyền options tương ứng vào `stream()`.

### `getModel(provider, id)`

Lấy một model cụ thể:

```typescript
import { getModel } from '@mariozechner/pi-ai';
const model = getModel('openai', 'gpt-4o-mini');
// Kiểu: Model<'openai-completions'>
```

**Lợi ích**: IDE autocomplete cho provider và model ID.

---

## 🗂️ ModelRegistry

`ModelRegistry` quản lý:

- Cache các models đã fetch.
- Hỗ trợ `models.json` để thêm custom models.
- Phương thức `find(provider, id)` để lookup.
- Phương thức `getAvailable()` để lấy models có valid API key.

Đọc file `src/modelRegistry.ts` để hiểm chi tiết implementation.

---

## ⚙️ Custom Models via `models.json`

File `~/.pi/agent/models.json` cho phép bạn thêm custom providers/models hoặc override built-in:

```json
{
  "providers": {
    "ollama": {
      "baseUrl": "http://localhost:11434/v1",
      "api": "openai-completions",
      "apiKey": "dummy",
      "models": [
        {
          "id": "llama3.1:8b",
          "name": "Llama 3.1 8B (Local)",
          "reasoning": false,
          "input": ["text"],
          "contextWindow": 128000,
          "maxTokens": 32000,
          "cost": { "input": 0, "output": 0, "cacheRead": 0, "cacheWrite": 0 }
        }
      ]
    },
    "anthropic": {
      "baseUrl": "https://my-proxy.example.com/v1"
      // Không có "models" → giữ lại tất cả built-in Anthropic models
      // Chỉ override baseUrl cho provider
    }
  }
}
```

**Override per-model**:

```json
{
  "providers": {
    "openrouter": {
      "modelOverrides": {
        "anthropic/claude-sonnet-4": {
          "name": "Claude Sonnet 4 (Bedrock Route)",
          "compat": {
            "openRouterRouting": { "only": ["amazon-bedrock"] }
          }
        }
      }
    }
  }
}
```

---

## 🔄 API Types (KnownApi)

Các API type định nghĩa protocol giao tiếp với provider:

| API | Description | Providers |
|-----|-------------|-----------|
| `anthropic-messages` | Anthropic Messages API | Anthropic |
| `openai-completions` | OpenAI Chat Completions (legacy) | OpenAI, xAI, Groq, Cerebras, OpenCode, Ollama, ... |
| `openai-responses` | OpenAI Responses API (newer) | OpenAI, Azure OpenAI, OpenRouter |
| `openai-codex-responses` | OpenAI Codex Responses | OpenAI Codex |
| `azure-openai-responses` | Azure OpenAI Responses | Azure OpenAI |
| `google-generative-ai` | Google Generative AI | Google |
| `google-vertex` | Google Vertex AI | Google (via Vertex) |
| `mistral-conversations` | Mistral Conversations | Mistral |
| `bedrock-converse-stream` | Amazon Bedrock Converse | Amazon Bedrock |
| ... | ... | ... |

Mỗi API có `stream<Api>()` và `complete<Api>()` riêng, với options interface phù hợp.

---

## 🔧 Provider-Specific Options

Mỗi API có options riêng ngoài `StreamOptions` chung.

**Ví dụ Anthropic** (xem `src/providers/anthropic.ts`):

```typescript
interface AnthropicOptions extends StreamOptions {
  thinkingEnabled?: boolean;
  thinkingBudgetTokens?: number;
}
```

**Ví dụ OpenAI (Responses)**:

```typescript
interface OpenAIResponsesOptions extends StreamOptions {
  reasoningEffort?: 'low' | 'medium' | 'high';
  reasoningSummary?: 'auto' | 'text' | 'detailed';
}
```

Khi gọi `stream(model, context, options)`, TypeScript sẽ kiểm tra `options` có khớp với `model.api` không.

---

## 🔍 Discovering Models at Runtime

Trong code, có thể lấy tất cả models đang available (có API key) qua:

```typescript
import { ModelRegistry } from '@mariozechner/pi-ai';
const registry = new ModelRegistry(authStorage);
const available = await registry.getAvailable(); // Models mà có API key hợp lệ
```

`authStorage` là abstraction để lưu API keys/OAuth tokens (xem `AuthStorage.create()`).

---

## 📝 Notes về `types.ts`

File này định nghĩa tất cả core types của layer AI. Đây là "contract" giữa tầng agent và providers.

Các type quan trọng:

- `Message`: union của `UserMessage`, `AssistantMessage`, `ToolResultMessage`.
- `Content Block`: `TextContent`, `ImageContent`, `ThinkingContent`, `ToolCall`.
- `Tool`: định nghĩa tool LLM có thể gọi.
- `Context`: systemPrompt, messages, tools.
- `AssistantMessageEvent`: tất cả events trong streaming.
- `Model`: metadata của model.
- `OpenAICompletionsCompat`: compatibility overrides.

---

**Kế hoạch tiếp theo**: Đọc `src/modelRegistry.ts` để hiểu cách models được load và cache.
