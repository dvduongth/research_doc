# OpenAI Compatibility

Nhiều provider dùng API kiểu OpenAI (`openai-completions` hoặc `openai-responses`) nhưng có khác biệt nhỏ. Pi-AI dùng `compat` field trong `Model` để override hành vi mặc định.

---

## 🔧 Compatibility Flags (`OpenAICompletionsCompat`)

```typescript
interface OpenAICompletionsCompat {
  supportsStore?: boolean;            // Hỗ trợ trường `store`?
  supportsDeveloperRole?: boolean;    // Dùng role `developer` thay `system`?
  supportsReasoningEffort?: boolean;  // Hỗ trợ `reasoning_effort`?
  reasoningEffortMap?: Partial<Record<ThinkingLevel, string>>; // Map reasoning level → value cụ thể
  supportsUsageInStreaming?: boolean; // Có `stream_options: { include_usage: true }`?
  maxTokensField?: 'max_completion_tokens' | 'max_tokens'; // Tên field max tokens
  requiresToolResultName?: boolean;   // Tool results cần field `name`?
  requiresAssistantAfterToolResult?: boolean; // Phải có assistant message sau tool result?
  requiresThinkingAsText?: boolean;   // Thinking phải chuyển thành text block?
  thinkingFormat?: 'openai' | 'zai' | 'qwen'; // Format thinking param
  openRouterRouting?: OpenRouterRouting;
  vercelGatewayRouting?: VercelGatewayRouting;
  supportsStrictMode?: boolean;      // Provider hỗ trợ `strict` trong tool schema?
}
```

---

## 🌐 Auto-Detection

Nếu `compat` không set, library tự động detect dựa trên `baseUrl` cho một số provider known:

- **Cerebras, xAI, Chutes, DeepSeek, zAi, OpenCode, Groq**: flags được set tương ứng.
- **LiteLLM**: tự động set `supportsStore: false`.

Bạn có thể override từng trường bằng cách set `compat` trong model definition (qua `models.json` hoặc code).

---

## 🎯 Ví dụ: LiteLLM Proxy

```json
{
  "providers": {
    "litellm": {
      "baseUrl": "http://localhost:4000/v1",
      "api": "openai-completions",
      "compat": {
        "supportsStore": false
      },
      "models": [
        { "id": "gpt-4o", "name": "GPT-4o via LiteLLM", "reasoning": true, "input": ["text","image"], ... }
      ]
    }
  }
}
```

---

## 🔄 OpenAI vs Anthropic Roles

OpenAI dùng `system` role cho system prompt. Một số provider (như LiteLLM với certain models) dùng `developer` role. Dùng `supportsDeveloperRole` để chuyển.

Pi-AI tự động map:
- Nếu `supportsDeveloperRole=true`: systemPrompt được đặt vào `developer` role.
- Nếu `false`: dùng `system` role.

---

**Lưu ý**: Khi dùng `stream`/`complete` trực tiếp với provider-specific options (Anthropic, Google), bạn không cần quan tâm `compat` — nó chỉ áp dụng khi dùng `openai-completions` API.
