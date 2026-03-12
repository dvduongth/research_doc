# Thinking/Reasoning Support

## 🧠 Tổng quan

Một số models hỗ trợ **extended thinking** (Claude Sonnet 4, GPT-5.x, Gemini 2.5, ...). Kiểm tra bằng `model.reasoning === true`.

---

## 🔍 Unified Interface (`streamSimple`/`completeSimple`)

```typescript
import { streamSimple, completeSimple } from '@mariozechner/pi-ai';

const response = await completeSimple(model, context, {
  reasoning: 'minimal' | 'low' | 'medium' | 'high' | 'xhigh'
});
```

- `reasoning`: mức độ thinking.
- `xhigh` chỉ hỗ trợ bởi GPT-5.2+ và Claude Opus 4.6. Nếu model không hỗ trợ, nó sẽ silent ignore hoặc map về `high`.

Có thể set custom token budgets:

```typescript
{
  reasoning: 'high',
  thinkingBudgets: { high: 8192, medium: 4096 }
}
```

---

## 🔧 Provider-Specific Options

Khi dùng `stream`/`complete` trực tiếp, bạn có thể dùng options chi tiết:

### OpenAI (`openai-responses`)

```typescript
await complete(model, context, {
  reasoningEffort: 'low' | 'medium' | 'high',
  reasoningSummary?: 'auto' | 'text' | 'detailed'  // Only for Responses API
});
```

### Anthropic (`anthropic-messages`)

```typescript
await complete(model, context, {
  thinkingEnabled: true,
  thinkingBudgetTokens: 8192  // Optional limit
});
```

### Google (`google-generative-ai`)

```typescript
await complete(model, context, {
  thinking: {
    enabled: true,
    budgetTokens: 8192  // -1 for dynamic, 0 to disable
  }
});
```

---

## 📺 Streaming Thinking

Khi streaming, thinking đến qua events riêng:

```
thinking_start → thinking_delta (many) → thinking_end
```

Ví dụ:

```typescript
const s = streamSimple(model, context, { reasoning: 'high' });
for await (const event of s) {
  if (event.type === 'thinking_start') console.log('[Thinking]');
  if (event.type === 'thinking_delta') process.stdout.write(event.delta);
  if (event.type === 'thinking_end') console.log('\n[Done thinking]');
  if (event.type === 'text_delta') process.stdout.write(event.delta); // Final answer
}
```

---

## 🔄 Cross-Provider Thinking

Khi assistant message từ provider A được dùng làm context cho provider B:

- Thinking block của provider A sẽ được chuyển thành text block với `<thinking>...</thinking>` tags.
- Điều này đảm bảo provider B hiểu được nội dung thinking mà không cần hỗ trợ native thinking.

Ví dụ: Claude sinh thinking, sau đó bạn switch sang GPT, GPT sẽ thấy thinking dưới dạng text có tags.

---

## 💡 Checking Support

```typescript
if (model.reasoning) {
  console.log('Model supports reasoning');
}
```

Hoặc dùng `supportsXhigh(model)` để biết model có hỗ trợ `xhigh` level không.

---

**Lưu ý**: Reasoning tokens count vào `usage.input` và `usage.cost`.
