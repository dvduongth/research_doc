# 03. Hệ Thống LLM — Package pi-ai

## Giải thích cho người mới

### LLM là gì?
**LLM** (Large Language Model — Mô hình ngôn ngữ lớn) là loại AI có khả năng hiểu và tạo văn bản. ChatGPT, Claude, Gemini đều là LLM. Chúng hoạt động bằng cách nhận **đầu vào** (câu hỏi) và trả về **đầu ra** (câu trả lời).

### Provider là gì?
**Provider** (nhà cung cấp) là công ty vận hành LLM. Mỗi provider có cách giao tiếp (API) riêng:
- **OpenAI** → ChatGPT, GPT-4
- **Anthropic** → Claude
- **Google** → Gemini
- **Mistral** → Mistral AI
- **AWS Bedrock** → Nhiều model khác nhau

### Vấn đề: Mỗi provider "nói" khác nhau
Giống như mỗi hãng điện thoại dùng sạc khác nhau (Lightning, USB-C, Micro-USB). Nếu muốn hỗ trợ nhiều hãng, bạn cần **bộ chuyển đổi đa năng**.

### Pi-ai chính là bộ chuyển đổi đó
Package `pi-ai` tạo ra **một giao diện thống nhất** để nói chuyện với bất kỳ LLM nào. Bạn viết code một lần, chạy được với tất cả providers.

---

## Tổng quan Package

| Thông tin | Chi tiết |
|-----------|---------|
| **Tên NPM** | @mariozechner/pi-ai |
| **Đường dẫn** | `packages/ai/` |
| **Vai trò** | Lớp giao tiếp LLM thống nhất |
| **File chính** | `src/types.ts`, `src/api-registry.ts`, `src/stream.ts` |
| **Providers** | 16 file implementation trong `src/providers/` |

---

## Cấu trúc thư mục

```
packages/ai/src/
├── types.ts              # Định nghĩa kiểu dữ liệu chính
├── api-registry.ts       # Hệ thống đăng ký provider
├── stream.ts             # Xử lý dữ liệu streaming
├── index.ts              # Xuất API công khai
├── models.ts             # Thông tin model (giá, context window)
├── models.generated.ts   # Danh sách model tự động sinh
├── env-api-keys.ts       # Quản lý API key từ biến môi trường
├── oauth.ts              # Xác thực OAuth
├── cli.ts                # Giao diện dòng lệnh
├── providers/            # Các provider cụ thể
│   ├── anthropic.ts      # Anthropic (Claude)
│   ├── openai-completions.ts     # OpenAI Chat Completions API
│   ├── openai-responses.ts       # OpenAI Responses API
│   ├── openai-codex-responses.ts # OpenAI Codex
│   ├── azure-openai-responses.ts # Azure OpenAI
│   ├── google.ts          # Google Gemini
│   ├── google-vertex.ts   # Google Vertex AI
│   ├── google-gemini-cli.ts      # Google Gemini CLI
│   ├── amazon-bedrock.ts  # AWS Bedrock
│   ├── mistral.ts         # Mistral AI
│   ├── register-builtins.ts      # Đăng ký tất cả providers
│   ├── transform-messages.ts     # Chuyển đổi message giữa providers
│   ├── simple-options.ts  # Options đơn giản
│   └── github-copilot-headers.ts # GitHub Copilot
└── utils/                 # Tiện ích
    └── event-stream.ts    # Stream sự kiện
```

---

## 20+ Provider/Platform được hỗ trợ

| Provider | Platform | Ghi chú |
|----------|----------|---------|
| **OpenAI** | openai.com | GPT-4, GPT-4o, o1, o3 |
| **Anthropic** | anthropic.com | Claude 3.5, Claude 4 |
| **Google** | ai.google.dev | Gemini 1.5, 2.0, 2.5 |
| **Google Vertex** | cloud.google.com | Gemini qua Google Cloud |
| **AWS Bedrock** | aws.amazon.com | Claude, Llama qua AWS |
| **Azure OpenAI** | azure.microsoft.com | GPT-4 qua Microsoft Azure |
| **Mistral** | mistral.ai | Mistral Large, Codestral |
| **xAI** | x.ai | Grok |
| **Groq** | groq.com | Inference nhanh |
| **Cerebras** | cerebras.ai | Inference nhanh |
| **OpenRouter** | openrouter.ai | Gateway đa provider |
| **Vercel AI Gateway** | vercel.com | Gateway cho Next.js apps |
| **GitHub Copilot** | github.com | Copilot models |
| **OpenAI Codex** | openai.com | Agent API mới |
| **HuggingFace** | huggingface.co | Models cộng đồng |
| **MiniMax** | minimax.chat | AI Trung Quốc |
| **Kimi Coding** | kimi.ai | AI coding Trung Quốc |
| **vLLM (custom)** | Tự host | Qua OpenAI-compatible API |
| **Ollama (custom)** | Localhost | Chạy model local |
| **LM Studio (custom)** | Localhost | Chạy model local |

---

## Kiến trúc cốt lõi

### 1. Provider Registry Pattern — Hệ thống "ổ cắm đa năng"

**Ý tưởng**: Thay vì code cứng cho từng provider, pi-ai dùng **sổ đăng ký** (registry). Mỗi provider "đăng ký" vào sổ, và hệ thống tự tìm provider phù hợp khi cần.

**Code thực tế** (từ `api-registry.ts`):

```
Đăng ký (register):
  registerApiProvider(provider, sourceId)
  → Lưu provider vào Map<string, RegisteredApiProvider>

Tìm kiếm (lookup):
  getApiProvider(api)
  → Trả về provider tương ứng với API identifier

Hủy đăng ký (unregister):
  unregisterApiProviders(sourceId)
  → Xóa tất cả providers có cùng sourceId

Xóa tất cả:
  clearApiProviders()
```

**Tại sao pattern này hay?**
- **Mở rộng dễ**: Thêm provider mới = viết 1 file + đăng ký. Không cần sửa code cũ.
- **Plugin-friendly**: Bên thứ ba có thể viết provider riêng và đăng ký vào hệ thống.
- **An toàn kiểu**: Hàm `wrapStream()` kiểm tra `model.api` khớp với provider trước khi gọi.

---

### 2. Message Protocol — Giao thức tin nhắn thống nhất

Pi-ai định nghĩa **3 loại tin nhắn** dùng chung cho tất cả providers:

```
┌──────────────────┐
│   UserMessage    │  ← Tin nhắn từ người dùng
│  role: "user"    │     Nội dung: text hoặc text + hình ảnh
│  content: string │
│  timestamp: ...  │
└──────────────────┘

┌──────────────────┐
│ AssistantMessage │  ← Phản hồi từ AI
│ role: "assistant"│     Nội dung: text + suy nghĩ + gọi tool
│ content: [...]   │     Kèm: usage (token), stopReason, model info
│ usage: {...}     │
└──────────────────┘

┌──────────────────┐
│ ToolResultMessage│  ← Kết quả thực hiện tool
│ role: "toolResult│     Nội dung: text + hình ảnh
│ toolCallId: ...  │     Có cờ isError nếu tool thất bại
│ isError: boolean │
└──────────────────┘
```

### Nội dung tin nhắn (Content Types)

Mỗi tin nhắn chứa **mảng nội dung** đa dạng:

| Loại | Giải thích | Ví dụ |
|------|-----------|-------|
| **TextContent** | Văn bản thông thường | "Xin chào!" |
| **ThinkingContent** | Suy nghĩ nội tại của AI (extended thinking) | AI phân tích bước trước khi trả lời |
| **ImageContent** | Hình ảnh (base64) | Ảnh chụp màn hình |
| **ToolCall** | Yêu cầu gọi tool | "Hãy đọc file config.json" |

---

### 3. Streaming Events — Sự kiện thời gian thực

Khi AI trả lời, dữ liệu được gửi **từng mảnh** (streaming) thay vì đợi toàn bộ. Pi-ai định nghĩa 13 loại sự kiện:

```
Dòng sự kiện khi AI trả lời:

  start                    ← AI bắt đầu phản hồi
    │
    ├→ thinking_start      ← Bắt đầu suy nghĩ (nếu có)
    ├→ thinking_delta      ← Từng mảnh suy nghĩ
    ├→ thinking_end        ← Kết thúc suy nghĩ
    │
    ├→ text_start          ← Bắt đầu viết text
    ├→ text_delta          ← Từng từ/câu được gửi
    ├→ text_end            ← Kết thúc text
    │
    ├→ toolcall_start      ← Bắt đầu gọi tool
    ├→ toolcall_delta      ← Từng phần arguments
    ├→ toolcall_end        ← Kết thúc tool call
    │
    └→ done / error        ← Hoàn thành hoặc lỗi
```

**Lợi ích streaming**:
- Người dùng thấy phản hồi ngay, không phải chờ
- Giao diện phản ứng mượt mà (từng từ xuất hiện)
- Có thể hủy giữa chừng (AbortSignal)

---

### 4. Token & Cost Tracking — Theo dõi chi phí

Mỗi phản hồi AI kèm theo thông tin **sử dụng token** và **chi phí**:

```
Usage {
  input: 1500         ← Token đầu vào (câu hỏi + context)
  output: 300          ← Token đầu ra (câu trả lời)
  cacheRead: 200       ← Token đọc từ cache (rẻ hơn)
  cacheWrite: 100      ← Token ghi vào cache
  totalTokens: 2100    ← Tổng cộng
  cost: {
    input: 0.0045      ← Chi phí đầu vào ($)
    output: 0.0045     ← Chi phí đầu ra ($)
    cacheRead: 0.0003  ← Chi phí cache read ($)
    cacheWrite: 0.0004 ← Chi phí cache write ($)
    total: 0.0097      ← Tổng chi phí ($)
  }
}
```

**Ứng dụng**: Giúp developer biết mỗi cuộc hội thoại tốn bao nhiêu tiền, từ đó tối ưu prompt và chọn model phù hợp.

---

### 5. Model Definition — Định nghĩa model

Mỗi model AI được mô tả bởi:

```
Model {
  id: "claude-sonnet-4-20250514"   ← ID chính xác
  name: "Claude Sonnet 4"          ← Tên hiển thị
  api: "anthropic-messages"        ← Loại API sử dụng
  provider: "anthropic"            ← Nhà cung cấp
  baseUrl: "https://api.anthropic.com"
  reasoning: true                  ← Hỗ trợ extended thinking?
  input: ["text", "image"]         ← Loại đầu vào
  cost: {
    input: 3.0,                    ← $3/triệu token đầu vào
    output: 15.0,                  ← $15/triệu token đầu ra
    cacheRead: 0.3,
    cacheWrite: 3.75
  }
  contextWindow: 200000            ← Tối đa 200k token context
  maxTokens: 16384                 ← Tối đa 16k token output
}
```

---

### 6. Stream Options — Tùy chọn khi gọi AI

```
StreamOptions {
  temperature: 0.7       ← Độ sáng tạo (0 = chính xác, 1 = sáng tạo)
  maxTokens: 4096        ← Giới hạn độ dài phản hồi
  signal: AbortSignal    ← Cho phép hủy giữa chừng
  apiKey: "sk-..."       ← API key (cho browser)
  transport: "sse"       ← Cách truyền dữ liệu (SSE hoặc WebSocket)
  cacheRetention: "short"← Giữ cache bao lâu
  sessionId: "abc123"    ← ID phiên (cho cache)
  headers: {...}         ← HTTP headers tùy chỉnh
  onPayload: (p) => ...  ← Hook kiểm tra payload trước khi gửi
}
```

---

## Cách thêm Provider mới (quy trình 7 bước)

Nếu muốn thêm một LLM provider mới vào pi-ai:

1. **Định nghĩa types** → `src/types.ts`: thêm vào KnownApi và KnownProvider
2. **Viết implementation** → `src/providers/<tên-provider>.ts`: hàm stream + chuyển đổi message
3. **Đăng ký** → `src/providers/register-builtins.ts`: gọi registerApiProvider()
4. **Cập nhật stream** → `src/stream.ts`: import và kết nối
5. **Sinh models** → `scripts/generate-models.ts`: thêm model metadata
6. **Viết test** → `test/`: thêm vào 11 file test
7. **Cập nhật docs** → README.md, CHANGELOG.md

---

## Tóm tắt

Pi-ai là **lớp trừu tượng LLM** (LLM abstraction layer) với 5 thành phần chính:

| Thành phần | Vai trò | Ví dụ đời thực |
|------------|---------|----------------|
| **Provider Registry** | Đăng ký/tìm provider | Ổ cắm điện đa năng |
| **Message Protocol** | Giao thức tin nhắn thống nhất | Chuẩn USB-C cho mọi thiết bị |
| **Streaming Events** | Phản hồi thời gian thực | Xem video streaming (không tải hết mới xem) |
| **Token/Cost Tracking** | Theo dõi chi phí | Đồng hồ đo điện |
| **Model Definition** | Mô tả khả năng model | Thông số kỹ thuật xe hơi |

Điểm mạnh nhất: **mở rộng dễ dàng** (thêm provider = thêm 1 file), **type-safe** (kiểm tra kiểu nghiêm ngặt), và **streaming-first** (phản hồi thời gian thực).

---

*Nguồn: `pi-mono/packages/ai/src/` — types.ts, api-registry.ts, providers/*
*Ngày thu thập: 2026-03-11*
