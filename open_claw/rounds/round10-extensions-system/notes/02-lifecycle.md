> **Đã sửa**: Loại bỏ hoàn toàn mô hình class Extension với init()/enable()/disable(). Thay bằng factory function pattern đúng với mã nguồn thực tế. Loại bỏ ExtensionManifest, constructor. Thêm mô tả ExtensionRunner.bindCore().

# Extension Lifecycle
**Round 10: Extensions System**

---

## Extension Factory Function

Extension trong pi-mono **không phải là class**. Mỗi extension là một TypeScript module export default một **factory function** (kiểu `ExtensionFactory`):

```typescript
// Kiểu thực tế từ mã nguồn
type ExtensionFactory = (pi: ExtensionAPI) => void | Promise<void>;
```

Khi được load, hệ thống gọi factory function này với một đối tượng `ExtensionAPI` (thường gọi là `pi`). Extension đăng ký event handlers và tools thông qua `pi`.

---

## ExtensionAPI

Đối tượng `pi` (ExtensionAPI) được truyền vào factory function. Các method chính:

- `pi.on(event, handler)` — đăng ký handler cho một trong 27+ event types.
- `pi.registerTool(tool)` — đăng ký tool cho agent sử dụng.
- Các method khác tùy phiên bản.

Extension **không** có `context.agent`, `context.provide`, `context.consume` như mô tả cũ.

---

## Lifecycle Phases

1. **Discovery**: Hệ thống quét các đường dẫn tìm extension:
   - `.pi/extensions/` (project-level)
   - `~/.pi/agent/extensions/` (user-level)
   - Đường dẫn từ settings
   - `package.json` với field `"pi"` (không phải `extension.json`)
2. **Loading**: Extension file được load bằng **jiti** (TypeScript loader — cho phép load trực tiếp `.ts` files không cần biên dịch trước).
3. **Factory Execution**: Hệ thống gọi `extensionModule.default(pi)` — factory function nhận `ExtensionAPI`.
   - Trong factory, extension gọi `pi.on(...)` để đăng ký event handlers.
   - Extension gọi `pi.registerTool(...)` để đăng ký tools.
   - Có thể thực hiện setup bất đồng bộ (factory có thể async).
4. **Runtime Binding**: `ExtensionRunner.bindCore()` thay thế các stub (throwing stubs) bằng implementation thực từ core agent. Đây là cơ chế cho phép extension code được load trước khi core agent sẵn sàng.
5. **Running**: Agent hoạt động; extension handlers được gọi khi events phát sinh, tools sẵn sàng cho agent sử dụng.
6. **Unload**: Khi reload hoặc shutdown, extension bị loại bỏ. Không có method `disable()` riêng biệt.

---

## Error Handling

- Nếu factory function throw, extension bị đánh dấu lỗi và handlers/tools của nó không được đăng ký.
- Trong runtime, nếu event handler throw, nên bắt lỗi bên trong handler để tránh crash agent.
- `ExtensionRunner.bindCore()` đảm bảo rằng nếu extension gọi API trước khi core sẵn sàng, stub sẽ throw lỗi rõ ràng thay vì hành vi không xác định.

---

## Example Extension

```typescript
import type { ExtensionAPI } from 'pi-agent';

// Factory function — KHÔNG phải class
export default function myExtension(pi: ExtensionAPI) {
  // Đăng ký event handler
  pi.on('agent_start', (event) => {
    console.log('Agent started!');
  });

  pi.on('tool_execution_start', (event) => {
    console.log(`Tool executing: ${event.tool}`);
  });

  // Đăng ký tool
  pi.registerTool({
    name: 'my_tool',
    description: 'Does something useful',
    parameters: {
      type: 'object',
      properties: {
        input: { type: 'string' }
      },
      required: ['input']
    },
    async execute(args, signal) {
      return { content: [{ text: `Hello from my_tool: ${args.input}` }] };
    }
  });
}
```

---

## So sánh mô hình cũ vs thực tế

| Khía cạnh | Mô tả sai (cũ) | Thực tế |
|-----------|----------------|---------|
| Cấu trúc | `class Extension` với `extends` | Factory function (hàm export default) |
| Khởi tạo | `new Extension(context, manifest)` | `extensionDefault(pi: ExtensionAPI)` |
| Lifecycle | `init()` → `enable()` → `disable()` | Factory function chạy một lần, đăng ký handlers |
| Manifest | `extension.json` | `package.json` với field `"pi"`, hoặc không cần manifest riêng |
| Loader | Không rõ | jiti (TypeScript loader) |
| Late binding | Không có | `ExtensionRunner.bindCore()` thay stub bằng real impl |

---

**End of lifecycle notes**.
