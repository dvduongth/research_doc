# Cross-Provider Handoffs

## 🔄 Tại sao cần?

Bạn có thể bắt đầu cuộc trò chuyện với Claude (Anthropic), sau đó switch sang GPT (OpenAI), rồi lại sang Gemini (Google) mà vẫn giữ context. Điều này hữu ích khi:

- Dùng model nhanh cho initial response, rồi model mạnh cho phần phức tạp.
- Provider outage: chuyển sang provider khác.
- Tối ưu cost: dùng model rẻ cho một số tasks.

---

## 🔄 How It Works

Khi messages từ provider A được gửi tới provider B:

- **UserMessage**, **ToolResultMessage** → giữ nguyên.
- **AssistantMessage** từ provider khác:
  - Text blocks → giữ nguyên.
  - Tool calls → giữ nguyên.
  - **Thinking blocks** → chuyển thành `TextContent` với `<thinking>...</thinking>` tags.

Ví dụ: AssistantMessage Claude có thinking:

```json
{
  "role": "assistant",
  "content": [
    { "type": "thinking", "thinking": "Tôi cần tính toán 2+2" },
    { "type": "text", "text": "Kết quả là 4." }
  ]
}
```

Khi gửi tới OpenAI, sẽ thành:

```json
{
  "role": "assistant",
  "content": [
    { "type": "text", "text": "<thinking>Tôi cần tính toán 2+2</thinking>" },
    { "type": "text", "text": "Kết quả là 4." }
  ]
}
```

---

## 💻 Code Example

```typescript
import { getModel, complete, Context } from '@mariozechner/pi-ai';

const context: Context = { messages: [], tools: [] };

// 1. Claude
const claude = getModel('anthropic', 'claude-sonnet-4-20250514');
context.messages.push({ role: 'user', content: 'Tính 2+2?' });
const claudeResp = await complete(claude, context, { thinkingEnabled: true });
context.messages.push(claudeResp);

// 2. GPT (tiếp tục)
const gpt = getModel('openai', 'gpt-4o-mini');
context.messages.push({ role: 'user', content: 'Kết quả đúng không?' });
const gptResp = await complete(gpt, context);
context.messages.push(gptResp);

// GPT thấy câu hỏi ban đầu, kết quả của Claude (có thinking trong text), và câu hỏi mới.
```

---

## ⚠️ Limitations

- Chỉ **AssistantMessage** từ provider khác mới được transform. Nếu bạn muốn điều chỉnh thêm (ví dụ bỏ thinking), phải tự xử lý trước.
- Tool calls và tool results luôn giữ nguyên format, tất cả providers hỗ trợ.
- Images trong messages được giữ nguyên.

---

**Kết luận**: Cross-provider handoff là tự động, không cần config. Chỉ cần đảm bảo `AssistantMessage` từ trước đã được push vào context.
