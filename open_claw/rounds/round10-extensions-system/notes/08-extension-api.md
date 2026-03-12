> **Đã sửa**: Loại bỏ hoàn toàn ExtensionProvide API (tool/tools/prompt/theme/context/hook), ExtensionConsume API, Config API từ manifest JSON, `enable()` examples. Thay bằng ExtensionAPI thực tế với `pi.on()` và `pi.registerTool()`.

# Extension API Deep Dive
**Round 10: Extensions System**

---

## ExtensionAPI Overview

Extension nhận đối tượng `pi` (kiểu `ExtensionAPI`) khi factory function được gọi. Đây là interface chính để extension tương tác với agent.

---

## `pi.on(event, handler)`

Đăng ký handler cho agent events.

- `event`: string — một trong 27+ event types.
- `handler`: function nhận event object.

```typescript
pi.on('turn_start', (event) => {
  // Xử lý khi turn bắt đầu
});

pi.on('tool_execution_end', (event) => {
  // Xử lý khi tool execution hoàn tất
});
```

**Event types chính:**
- `agent_start`, `agent_end`
- `turn_start`, `turn_end`
- `message_start`, `message_update`, `message_end`
- `tool_execution_start`, `tool_execution_update`, `tool_execution_end`
- `context`, `before_provider_request`
- Và nhiều event types khác (tổng 27+)

---

## `pi.registerTool(tool)`

Đăng ký tool cho agent sử dụng.

- `tool`: object với shape:

```typescript
{
  name: string;              // Tên unique
  description: string;       // Mô tả cho LLM
  parameters: JSONSchema;    // JSON Schema cho args
  execute: (args: any, signal: AbortSignal) => Promise<ToolResult>;
}
```

**ToolResult shape**: `{ content: Array<{ type: 'text'|'image'|..., text?: string, data?: string, ... }> }`

```typescript
pi.registerTool({
  name: 'search_docs',
  description: 'Search project documentation',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search query' }
    },
    required: ['query']
  },
  async execute(args, signal) {
    const results = await searchDocs(args.query);
    return {
      content: [{ type: 'text', text: JSON.stringify(results) }]
    };
  }
});
```

---

## Không có Provide/Consume API

Mô tả cũ liệt kê các API sau — **tất cả đều KHÔNG tồn tại**:

- ❌ `provide.tool(name, fn, options)` — dùng `pi.registerTool()` thay thế
- ❌ `provide.tools(array)` — không có batch register
- ❌ `provide.prompt(id, definition)` — không có prompt registration
- ❌ `provide.theme(id, definition)` — không có theme system
- ❌ `provide.context(id, definition)` — không có context registration
- ❌ `provide.hook(event, handler)` — dùng `pi.on()` thay thế
- ❌ `consume(id)` — không có resource consumption API
- ❌ `context.config` từ manifest JSON — không có extension.json config

---

## Extension Loading

Extensions được load bằng **jiti** (TypeScript loader), cho phép:
- Load trực tiếp `.ts` files không cần biên dịch.
- Sử dụng TypeScript types và import syntax.

---

## Runtime Binding

`ExtensionRunner.bindCore()` là cơ chế quan trọng:

1. Khi extension được load, `pi.on()` và `pi.registerTool()` ban đầu có thể là **throwing stubs**.
2. Khi core agent sẵn sàng, `bindCore()` thay thế stubs bằng real implementations.
3. Sau `bindCore()`, handlers và tools đăng ký trước đó được wire vào agent thực.

Điều này cho phép load extension code trước khi core agent hoàn tất khởi tạo.

---

## Example: Full Extension

```typescript
import type { ExtensionAPI } from 'pi-agent';

export default function weatherExtension(pi: ExtensionAPI) {
  // Private state trong closure
  let lastQuery = '';

  // Đăng ký tool
  pi.registerTool({
    name: 'get_weather',
    description: 'Get current weather for a city',
    parameters: {
      type: 'object',
      properties: {
        city: { type: 'string', description: 'City name' }
      },
      required: ['city']
    },
    async execute(args, signal) {
      lastQuery = args.city;
      const weather = await fetchWeather(args.city, signal);
      return {
        content: [{ text: JSON.stringify(weather) }],
        details: { city: args.city }
      };
    }
  });

  // Đăng ký event handlers
  pi.on('agent_start', () => {
    console.log('[weather-ext] Agent started');
  });

  pi.on('turn_end', () => {
    if (lastQuery) {
      console.log(`[weather-ext] Last weather query: ${lastQuery}`);
    }
  });
}
```

---

## So sánh API cũ vs thực tế

| API sai (cũ) | API thực tế |
|-------------|-------------|
| `this.context.provide.tool(name, fn, opts)` | `pi.registerTool({ name, execute, ... })` |
| `this.context.provide.hook(event, handler)` | `pi.on(event, handler)` |
| `this.context.consume('tool:foo')` | Không có — extensions không consume lẫn nhau |
| `this.context.agent.setModel(...)` | Không có direct agent access |
| `this.context.config.apiKey` | Không có extension config từ manifest |
| `this.context.log.info(...)` | `console.log(...)` hoặc custom logger |

---

**End of API deep dive**.
