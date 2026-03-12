# Round 2: Pi-Mono Tier 1 - AI Layer (`pi-ai`)
**Mục tiêu**: Hiểu sâu về `@mariozechner/pi-ai` - unified LLM API layer.

---

## 🎯 Mục tiêu chi tiết

1. **Model System**: Cách model được định nghĩa, discovery, registry.
2. **Streaming API**: Event types, streaming text/thinking/tool calls, cancellation.
3. **Complete API**: Non-streaming usage.
4. **Tool Calling**: Tool definition, validation, streaming arguments, result handling.
5. **Thinking/Reasoning**: Extended thinking support, provider differences.
6. **Providers**: Built-in providers, auth resolution, custom providers via `models.json`.
7. **Error Handling**: Abort, retry, error types.
8. **Cost Tracking**: Usage và cost calculation.
9. **Context Serialization**: Context structure, cross-provider handoff.
10. **Compatibility**: OpenAI compatibility mode, provider-specific tweaks.

---

## 📂 Nguồn dữ liệu

- `D:\PROJECT\CCN2\pi-mono\packages\ai\`
- Focus: `src/` directory files.

---

## 📝 Files cần đọc (thứ tự)

| # | File | Mục tiêu |
|---|------|----------|
| 1 | `README.md` (full) | Overview, Quick Start, Supported Providers |
| 2 | `src/types.ts` | Core types: `Model`, `Context`, `Tool`, `Message`, `Event`, `Usage` |
| 3 | `src/modelRegistry.ts` (or equivalent) | `ModelRegistry`, `getModel()`, caching |
| 4 | `src/stream.ts` | `stream()` implementation |
| 5 | `src/complete.ts` | `complete()` implementation |
| 6 | `src/tools.ts` | Tool validation, execution interface |
| 7 | `src/thinking.ts` (if exists) | Thinking support |
| 8 | `src/cost.ts` (if exists) | Cost calculation |
| 9 | `src/context.ts` | Context serialization, cross-provider conversion |
| 10 | `src/providers/` | Provider implementations (anthropic, openai, google, etc.) |
| 11 | `src/custom-provider.ts` (if exists) | Custom provider guide |

---

## 📋 Checklist đầu vào (sẽ điền [x] sau khi đọc)

- [ ] **Model System**:
  - [ ] Model interface (id, provider, capabilities)
  - [ ] `getModel(provider, id)` hoạt động thế nào
  - [ ] `ModelRegistry` caching và discovery
  - [ ] Model selection qua CLI (`--model`, `/model`)

- [ ] **Streaming API**:
  - [ ] `stream(model, context)` signature
  - [ ] Event types: start, text_start/delta/end, thinking_start/delta/end, toolcall_start/delta/end, done, error
  - [ ] AbortController support
  - [ ] Usage streaming (khi nào có)

- [ ] **Complete API**:
  - [ ] `complete(model, context)` signature
  - [ ] Return shape (messages, usage, stop reason)

- [ ] **Tool Calling**:
  - [ ] Tool definition (name, description, parameters TypeBox schema)
  - [ ] Parameter validation automagic
  - [ ] Streaming tool arguments (partial JSON)
  - [ ] Tool result handling (isError flag)
  - [ ] Tool retry logic?

- [ ] **Thinking/Reasoning**:
  - [ ] `reasoning` flag trong Model
  - [ ] Thinking content block trong AssistantMessage
  - [ ] Thinking streaming events
  - [ ] Provider-specific: Claude extended thinking vs OpenAI reasoning_effort

- [ ] **Providers**:
  - [ ] Provider interface (baseUrl, apiKey, api type, headers)
  - [ ] Danh sách built-in providers
  - [ ] Auth resolution order (CLI flag, auth.json, env var, custom)
  - [ ] Custom provider config qua `models.json`

- [ ] **Error Handling**:
  - [ ] AbortController cancellation
  - [ ] Retry logic (có hay không?)
  - [ ] Error types (network, auth, rate limit, invalid request, etc.)

- [ ] **Cost Tracking**:
  - [ ] Usage object (input, output, cacheRead, cacheWrite, totalTokens)
  - [ ] Cost object (per million tokens)
  - [ ] Automatic cost calculation per provider

- [ ] **Context Serialization**:
  - [ ] `Context` structure (systemPrompt, messages, tools)
  - [ ] Serializable format (JSON)
  - [ ] Cross-provider handoff (convert messages giữa các provider)

- [ ] **Compatibility**:
  - [ ] OpenAI compatibility mode cho non-OpenAI providers
  - [ ] Anthropic vs OpenAI differences (roles, fields)
  - [ ] Max tokens field differences (`max_tokens` vs `max_completion_tokens`)

---

**Tiến độ hiện tại**: Chưa bắt đầu.

**Kế hoạch**: Bắt đầu đọc `packages/ai/README.md` từ dòng 151 đến hết, sau đó đọc `src/types.ts`.

---

*File này sẽ được update khi tiến độ thay đổi.*
