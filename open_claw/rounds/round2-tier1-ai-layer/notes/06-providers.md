# Providers & Authentication

## 📦 Built-in Providers

Danh sách (từ README):

- **Anthropic** (`anthropic`) → `anthropic-messages`
- **OpenAI** (`openai`) → `openai-completions` và `openai-responses`
- **Azure OpenAI Responses** (`azure-openai-responses`)
- **OpenAI Codex** (`openai-codex`) → Responses API, cần OAuth (ChatGPT Plus)
- **Google** (`google`) → `google-generative-ai`
- **Google Vertex AI** (`google-vertex`)
- **Google Gemini CLI** (`google-gemini-cli`) – OAuth
- **Google Antigravity** (`google-antigravity`) – OAuth
- **Mistral** (`mistral`) → `mistral-conversations`
- **Groq** (`groq`) → `openai-completions`
- **Cerebras** (`cerebras`) → `openai-completions`
- **xAI** (`xai`) → `openai-completions`
- **OpenRouter** (`openrouter`) → `openai-completions`
- **Vercel AI Gateway** (`vercel-ai-gateway`) → `openai-completions`
- **Amazon Bedrock** (`amazon-bedrock`) → `bedrock-converse-stream`
- **MiniMax** (`minimax`)
- **MiniMax (China)** (`minimax-cn`)
- **Hugging Face** (`huggingface`)
- **OpenCode Zen** (`opencode`)
- **OpenCode Go** (`opencode-go`)
- **Kimi For Coding** (`kimi-coding`) (Moonshot, Anthropic-compatible)
- **zAI** (`zai`)

---

## 🔐 Authentication Resolution Order

Khi gọi API, library tìm API key theo thứ tự:

1. `options.apiKey` (truyền trực tiếp vào `stream/complete`)
2. `auth.json` (file `~/.pi/agent/auth.json` hoặc current dir)
3. Environment variable (ví dụ `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, ...)
4. Custom provider keys từ `models.json` (nếu provider defined locally)

Nếu không tìm thấy, sẽ throw lỗi.

---

## 📝 Environment Variables

| Provider | Env Var |
|----------|---------|
| OpenAI | `OPENAI_API_KEY` |
| Anthropic | `ANTHROPIC_API_KEY` |
| Google | `GEMINI_API_KEY` |
| Azure OpenAI | `AZURE_OPENAI_API_KEY` (+ `AZURE_OPENAI_BASE_URL` or `AZURE_OPENAI_RESOURCE_NAME`) |
| Mistral | `MISTRAL_API_KEY` |
| Groq | `GROQ_API_KEY` |
| Cerebras | `CEREBRAS_API_KEY` |
| xAI | `XAI_API_KEY` |
| OpenRouter | `OPENROUTER_API_KEY` |
| Vercel AI Gateway | `AI_GATEWAY_API_KEY` |
| MiniMax | `MINIMAX_API_KEY` |
| OpenCode Zen/Go | `OPENCODE_API_KEY` |
| Kimi | `KIMI_API_KEY` |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN` or `GH_TOKEN` |
| Amazon Bedrock | Dùng AWS SDK chain: env `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` hoặc IAM roles |

Đầy đủ xem `packages/ai/src/env-api-keys.ts`.

---

## ⚙️ Custom Providers via `models.json`

Thêm providers tùy chỉnh (Ollama, vLLM, LM Studio, proxies):

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
          "name": "Llama 3.1 8B",
          "reasoning": false,
          "input": ["text"],
          "contextWindow": 128000,
          "maxTokens": 32000,
          "cost": { "input": 0, "output": 0, "cacheRead": 0, "cacheWrite": 0 }
        }
      ]
    }
  }
}
```

**Override built-in provider** (giữ models built-in, chỉ đổi endpoint):

```json
{
  "providers": {
    "anthropic": {
      "baseUrl": "https://my-proxy.example.com/v1"
    }
  }
}
```

Nếu bạn cũng cung cấp `models`, built-in models vẫn giữ lại, custom models được merge/upsert theo `id`.

---

## 🔄 Provider Override với `compat`

Provider cũng có thể được override qua `Model.compat` (ví dụ set `supportsStore: false` cho LiteLLM).

---

**Lưu ý**: Custom providers defined trong `models.json` tự động được đăng ký khi `ModelRegistry` load.
