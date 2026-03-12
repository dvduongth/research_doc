# Cost & Token Tracking

## 📊 Usage Object

Mỗi `AssistantMessage` chứa `usage`:

```typescript
interface Usage {
  input: number;      // Input tokens
  output: number;     // Output tokens
  cacheRead: number;  // Tokens read from cache (Anthropic, OpenAI)
  cacheWrite: number; // Tokens written to cache
  totalTokens: number; // input + output
  cost: {
    input: number;    // $ cho input
    output: number;   // $ cho output
    cacheRead?: number;
    cacheWrite?: number;
    total: number;    // Tổng cost
  };
}
```

---

## 💰 Cost Calculation

`calculateCost(model, usage)` được gọi tự động bởi providers sau khi có usage.

```typescript
// ví dụ: model.cost.input = 3 ($/1M tokens)
// usage.input = 1000
// cost.input = (3 / 1_000_000) * 1000 = 0.003
```

---

## 📈 Truy cập Usage

- Trong streaming: `event` không có usage trừ khi `done`.
- Sau `done`, `await s.result()` trả về `AssistantMessage` với `usage`.
- Với `complete()/completeSimple()`, response có usage ngay.

```typescript
const response = await complete(model, context);
console.log(`Input tokens: ${response.usage.input}`);
console.log(`Output tokens: ${response.usage.output}`);
console.log(`Total cost: $${response.usage.cost.total.toFixed(4)}`);
```

---

## 🎯 Cache Retention

`cacheRetention` option điều chỉnh thời gian cache:

| Value | Anthropic | OpenAI |
|-------|-----------|--------|
| `'short'` (default) | 5 phút | N/A (in-memory) |
| `'long'` | 1 giờ | 24 giờ |

Set env `PI_CACHE_RETENTION=long` để mặc định dùng `'long'`.

---

**Lưu ý**: Một số provider (Anthropic) tính phí cache write (thấp hơn input). OpenAI cache read không tốn phí.
