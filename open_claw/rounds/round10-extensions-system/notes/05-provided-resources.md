> **Đã sửa**: Loại bỏ `this.context.provide.tool/prompt/theme/context`, `this.context.consume()`, `enable()`. Thay bằng `pi.registerTool()` và `pi.on()` đúng với ExtensionAPI thực tế. Loại bỏ khái niệm Themes, Contexts, Prompts như resource types riêng biệt — extension chủ yếu đăng ký tools và event handlers.

# Provided Resources
**Round 10: Extensions System**

---

## Overview

Extensions trong pi-mono cung cấp tài nguyên cho agent thông qua hai cơ chế chính:

- **Tools**: Đăng ký qua `pi.registerTool()` — agent có thể gọi trong conversation.
- **Event Handlers**: Đăng ký qua `pi.on()` — phản ứng với 27+ event types.

Không có hệ thống provide/consume riêng biệt cho prompts, themes, hay contexts như mô tả cũ.

---

## Tools

### Registration

Extensions đăng ký tools thông qua `pi.registerTool()`:

```typescript
export default function myExtension(pi: ExtensionAPI) {
  pi.registerTool({
    name: 'my_tool',
    description: 'Does something useful',
    parameters: {
      type: 'object',
      properties: {
        input: { type: 'string' },
      },
      required: ['input'],
    },
    async execute(args, signal) {
      const result = await doSomething(args.input);
      return {
        content: [{ type: 'text', text: JSON.stringify(result) }],
      };
    },
  });
}
```

### Integration

Tools đăng ký bởi extensions được thêm vào danh sách tools của agent. Khi agent loop thực thi tool call, nó tìm tool theo tên.

Tool names phải unique. Nếu trùng tên giữa extensions, extension load sau sẽ ghi đè.

---

## Event Handlers

Ngoài tools, extensions chủ yếu tương tác với agent qua event handlers:

```typescript
export default function analyticsExtension(pi: ExtensionAPI) {
  pi.on('turn_start', (event) => {
    // Track turn bắt đầu
  });

  pi.on('tool_execution_end', (event) => {
    // Log tool execution results
  });

  pi.on('message_end', (event) => {
    // Xử lý khi message hoàn tất
  });
}
```

---

## Kết hợp Tools và Event Handlers

Extension có thể đăng ký cả tools và event handlers:

```typescript
export default function weatherExtension(pi: ExtensionAPI) {
  // Tool cho agent sử dụng
  pi.registerTool({
    name: 'get_weather',
    description: 'Get weather for a city',
    parameters: {
      type: 'object',
      properties: { city: { type: 'string' } },
      required: ['city'],
    },
    async execute(args, signal) {
      const data = await fetchWeather(args.city);
      return { content: [{ text: JSON.stringify(data) }] };
    },
  });

  // Event handler để log
  pi.on('tool_execution_start', (event) => {
    if (event.tool === 'get_weather') {
      console.log('Weather tool called');
    }
  });
}
```

---

## So sánh với mô tả cũ

| Mô tả sai (cũ) | Thực tế |
|----------------|---------|
| `this.context.provide.tool(name, fn, options)` | `pi.registerTool({ name, execute, ... })` |
| `this.context.provide.prompt(id, def)` | Không có — prompts không phải extension resource type |
| `this.context.provide.theme(id, def)` | Không có — themes không phải extension resource type |
| `this.context.provide.context(id, def)` | Không có — contexts không phải extension resource type |
| `this.context.consume('tool:foo')` | Không có consume API |
| Đăng ký trong `enable()` | Đăng ký trong factory function |

---

## Versioning & Compatibility

Extensions nên đặt tên tools có tính mô tả và tránh trùng với built-in tools. Nếu nhiều extensions cần dùng chung tên, nên thêm prefix: `myext_toolname`.

---

**End of provided resources notes**.
