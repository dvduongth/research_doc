> **Đã sửa**: Loại bỏ `init()/enable()/disable()`, `this.context.log`, `new MyExtension(mockContext)`, manifest `main` path, dependency references, `engines.pi`. Thay bằng factory function pattern, jiti loader, `pi.on()`/`pi.registerTool()`.

# Debugging & Dev Workflow
**Round 10: Extensions System**

---

## Logging

Extensions sử dụng `console.log` (hoặc custom logger) cho output. Không có `this.context.log` với extension prefix — extension tự thêm prefix nếu cần:

```typescript
export default function myExtension(pi: ExtensionAPI) {
  const log = (msg: string) => console.log(`[my-ext] ${msg}`);

  pi.on('turn_start', () => {
    log('Turn started');
  });
}
```

---

## Common Errors

| Error | Likely Cause | Fix |
|-------|--------------|-----|
| `Extension failed to load: Cannot find module` | File path sai hoặc thiếu dependencies | Kiểm tra đường dẫn extension file. Chạy `npm install` nếu cần. |
| `Factory function threw` | Bug trong factory code | Check stack trace; thêm try/catch; enable debug logs. |
| `Tool not found` | Tool name sai hoặc extension chưa load | Đảm bảo tool name unique; kiểm tra extension đã được discover. |
| `Stub called before bindCore` | Extension gọi API trước khi core sẵn sàng | Đăng ký handlers/tools trong factory, không gọi chúng ngay. `ExtensionRunner.bindCore()` sẽ wire lại sau. |

---

## Inspecting Agent State

Để debug tools và handlers đã đăng ký:

```typescript
// Trong extension, log khi đăng ký
export default function debugExtension(pi: ExtensionAPI) {
  console.log('[debug] Extension loading...');

  pi.registerTool({
    name: 'debug_tool',
    description: 'Debug tool',
    parameters: { type: 'object', properties: {} },
    async execute() {
      return { content: [{ text: 'debug' }] };
    }
  });

  console.log('[debug] Tool registered');

  pi.on('agent_start', () => {
    console.log('[debug] Agent started - extension active');
  });
}
```

---

## Extension Discovery Locations

Khi debug loading issues, kiểm tra các discovery paths:

```
.pi/extensions/              ← project-level
~/.pi/agent/extensions/      ← user-level
settings-configured paths    ← từ cấu hình
package.json "pi" field      ← npm packages
```

---

## Hot-Reload

Khi reload extensions:

1. Extensions hiện tại bị unload.
2. Re-scan tất cả discovery locations.
3. Load lại extension files bằng jiti.
4. Gọi factory functions với fresh `ExtensionAPI`.
5. `bindCore()` wire lại handlers và tools.

Tất cả state trong closures bị mất; extensions phải reinitialize.

---

## Testing Extensions

Test extension bằng cách mock `ExtensionAPI`:

```typescript
// Mock pi object
const registeredTools: any[] = [];
const registeredHandlers: Record<string, Function[]> = {};

const mockPi = {
  on: (event: string, handler: Function) => {
    if (!registeredHandlers[event]) registeredHandlers[event] = [];
    registeredHandlers[event].push(handler);
  },
  registerTool: (tool: any) => {
    registeredTools.push(tool);
  },
};

// Test extension
import myExtension from './my-extension';
myExtension(mockPi as any);

// Verify
expect(registeredTools).toHaveLength(1);
expect(registeredTools[0].name).toBe('my_tool');
expect(registeredHandlers['turn_end']).toHaveLength(1);
```

Integration tests có thể spawn agent với extension enabled.

---

## Debugging Load Order

Vì không có dependency graph, thứ tự load phụ thuộc vào discovery order. Để debug:

- Thêm `console.log` ở đầu mỗi factory function.
- Kiểm tra thứ tự output để xác nhận load order.
- Nếu cần thay đổi thứ tự, sắp xếp lại files trong discovery paths.

---

## Development Tips

- Bắt đầu với extension minimal chỉ log trong factory function để verify loading.
- Sử dụng closure variables cho state (không cần class).
- Đặt tên tool mô tả để tránh xung đột: `myext_toolname`.
- Factory function có thể async nếu cần setup bất đồng bộ.
- Sử dụng `signal.aborted` trong tool execute để hỗ trợ cancellation.

---

## Profiling

Nếu extension làm chậm agent:

- Time các event handlers (`console.time`).
- Tránh synchronous heavy loops trong handlers.
- Tránh large data copies; mutate in-place nếu safe.
- Sử dụng `signal.aborted` để cancel long-running tool operations.

---

**End of debugging & dev workflow**.
