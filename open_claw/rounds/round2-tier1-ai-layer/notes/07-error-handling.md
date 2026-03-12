# Error Handling & Abortion

## 🚨 Error Types

Các lỗi có thể xảy ra:

1. **Network/Server errors**: timeouts, connection failures.
2. **Auth errors**: invalid/expired API key.
3. **Rate limit**: quá nhiều request.
4. **Validation errors**: tool args invalid, request malformed.
5. **Aborted**: user gọi `controller.abort()`.

---

## 🛑 Aborting Requests

```typescript
const controller = new AbortController();
setTimeout(() => controller.abort(), 2000);

const s = stream(model, context, { signal: controller.signal });

for await (const event of s) {
  if (event.type === 'error' && event.reason === 'aborted') {
    console.log('Đã hủy:', event.error.errorMessage);
  }
}

const result = await s.result();
if (result.stopReason === 'aborted') {
  // Partial content vẫn có trong result.content
  console.log('Partial:', result.content);
  console.log('Tokens used:', result.usage);
}
```

---

## 🔁 Continue After Abort

Bạn có thể thêm partial message vào context và tiếp tục:

```typescript
const partial = await complete(model, context, { signal: controller1.signal });
context.messages.push(partial);  // Partial assistant message
context.messages.push({ role: 'user', content: 'Tiếp tục' });
const continuation = await complete(model, context);
```

---

## 🧪 Tool Validation Errors

Khi tự quản lý tool execution, nếu `validateToolCall()` throw, bạn nên push tool result với `isError: true` để LLM biết và tự retry.

```typescript
try {
  const args = validateToolCall(tools, toolCall);
  const result = await execute(args);
  context.messages.push({ role: 'toolResult', ..., isError: false, ...result });
} catch (err) {
  context.messages.push({
    role: 'toolResult',
    toolCallId: toolCall.id,
    toolName: toolCall.name,
    content: [{ type: 'text', text: err.message }],
    isError: true,
    timestamp: Date.now()
  });
}
```

Khi dùng `Agent` từ `pi-agent-core`, phần này tự động xử lý.

---

## 🐛 Debugging với `onPayload`

Để xem payload gửi đến provider:

```typescript
await complete(model, context, {
  onPayload: (payload) => {
    console.log('Payload:', JSON.stringify(payload, null, 2));
  }
});
```

Hữu ích khi gặp validation errors từ provider.

---

**Kết luận**: Error handling trong pi-ai rõ ràng: abort via `AbortSignal`, tool errors qua `isError`, và `onPayload` để debug.
