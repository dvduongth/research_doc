# Tool Calling

## 🔧 Defining Tools

```typescript
import { Type, Tool, StringEnum } from '@mariozechner/pi-ai';

const tool: Tool = {
  name: 'get_weather',
  description: 'Get current weather for a location',
  parameters: Type.Object({
    location: Type.String({ description: 'City name or coordinates' }),
    units: StringEnum(['celsius', 'fahrenheit'], { default: 'celsius' })
  })
};
```

**Lưu ý**:
- Dùng `StringEnum` từ `@mariozechner/pi-ai` thay vì `Type.Union`/`Type.Literal` để tương thích Google.
- `parameters` là TypeBox schema, tự động validation.

---

## 🔄 Tool Call Flow

1. LLM trả về `ToolCall` block trong `AssistantMessage.content`.
2. Trong streaming, bạn nhận events:
   - `toolcall_start`: bắt đầu tool, `contentIndex`.
   - `toolcall_delta`: `delta` là JSON chunk, `partial.content[contentIndex].arguments` đang build (có thể thiếu fields).
   - `toolcall_end`: `toolCall` hoàn chỉnh với `id`, `name`, `arguments`.
3. Validate arguments: `validateToolCall(tools, toolCall)` (throw nếu invalid).
4. Thực thi tool, trả về result.
5. Push `ToolResultMessage` vào `context.messages`.
6. Nếu tool calls tồn tại, LLM sẽ tiếp tục (turn mới) để trả lời dựa trên tool results.

---

## ✅ Validation

```typescript
import { validateToolCall } from '@mariozechner/pi-ai';

try {
  const validatedArgs = validateToolCall(tools, toolCall);
  // validatedArgs có类型 chính xác theo schema
  const result = await execute(toolCall.name, validatedArgs);
} catch (error) {
  // Nếu invalid, push error as tool result để LLM tự retry
  context.messages.push({
    role: 'toolResult',
    toolCallId: toolCall.id,
    toolName: toolCall.name,
    content: [{ type: 'text', text: error.message }],
    isError: true,
    timestamp: Date.now()
  });
}
```

Khi dùng `agentLoop` (từ `pi-agent-core`), validation tự động xảy ra trước khi execute tool. Nếu bạn tự viết loop với `stream()`/`complete()`, bạn cần gọi `validateToolCall()`.

---

## 🖼️ Tool Result với Images

Tool result có thể chứa images:

```typescript
context.messages.push({
  role: 'toolResult',
  toolCallId: call.id,
  toolName: call.name,
  content: [
    { type: 'text', text: 'Generated chart' },
    { type: 'image', data: base64Data, mimeType: 'image/png' }
  ],
  isError: false,
  timestamp: Date.now()
});
```

---

## ⚠️ Partial Arguments trong Streaming

Trong `toolcall_delta` event:

```typescript
if (event.type === 'toolcall_delta') {
  const toolCall = event.partial.content[event.contentIndex];
  // toolCall.arguments có thể là:
  // - {} (empty)
  // - { path: "/tmp/file.txt" } (partial)
  // - { path: "...", content: "partial..."} (strings bị truncate)
  // Luôn kiểm tra từng field trước khi dùng.
}
```

---

## 🎯 Best Practices

1. **Always validate** với `validateToolCall()` nếu tự quản lý tool execution.
2. **Tool errors**: throw error từ `execute()`, không return error message (nếu throw, `isError` sẽ tự động set).
3. **Truncate output** nếu tool trả về large data (xem hướng dẫn truncation trong docs).
4. **Streaming progress**: dùng `onUpdate` trong tool execute để cập nhật UI.

---

**Lưu ý**: Pi-agent-core sẽ tự động xử lý tool calls khi dùng `Agent` class. Bạn chỉ cần định nghĩa tools và đưa vào `initialState.tools`.
