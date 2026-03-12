> **Đã sửa**: Loại bỏ `ExtensionContext` instance model, class instance `this`, `init()/enable()/disable()` lifecycle, `provide/consume` pattern. Thay bằng factory function với closure scope và `pi` (ExtensionAPI).

# Context & Isolation
**Round 10: Extensions System**

---

## ExtensionAPI (`pi`) Object

Mỗi extension factory function nhận một đối tượng `pi` (ExtensionAPI). Đối tượng này cung cấp:

- `pi.on(event, handler)` — đăng ký event handler.
- `pi.registerTool(tool)` — đăng ký tool cho agent.

Không có `pi.agent`, `pi.config`, `pi.provide`, `pi.consume` như mô tả cũ.

---

## Isolation qua Closure Scope

Vì extension là factory function (không phải class), **private state** được lưu trong closure scope:

```typescript
export default function myExtension(pi: ExtensionAPI) {
  // Private state — chỉ extension này truy cập được
  let messageCount = 0;
  const cache = new Map<string, any>();

  pi.on('message_end', (event) => {
    messageCount++;
    console.log(`Total messages: ${messageCount}`);
  });

  pi.on('turn_start', () => {
    cache.clear();
  });
}
```

Variables trong closure (`messageCount`, `cache`) hoàn toàn isolated — không extension nào khác truy cập được.

---

## Shared Resources

- **Agent**: Extensions không có reference trực tiếp đến agent object. Tương tác qua `pi.on()` (events) và `pi.registerTool()` (tools).
- **Tools**: Khi extension đăng ký tool qua `pi.registerTool()`, tool đó available cho agent sử dụng. Các extensions khác không trực tiếp gọi tools của nhau.
- **Events**: Tất cả extensions lắng nghe cùng event stream từ agent.

---

## Không có Provide/Consume Pattern

Pi-mono **không có** cơ chế provide/consume giữa extensions:

- Không có `context.provide.tool(...)` hay `context.consume('tool:foo')`.
- Extensions không chia sẻ resources trực tiếp với nhau.
- Mỗi extension đăng ký tools và handlers độc lập.

---

## Runtime Binding: ExtensionRunner.bindCore()

Cơ chế isolation quan trọng: khi extension được load, API methods ban đầu là **throwing stubs**. Khi core agent sẵn sàng, `ExtensionRunner.bindCore()` thay thế stubs bằng real implementations.

Điều này nghĩa là:
- Extension code có thể được load trước khi core agent khởi tạo xong.
- Nếu extension vô tình gọi API quá sớm, sẽ nhận lỗi rõ ràng thay vì hành vi undefined.

---

## Security Considerations

Extensions chạy trong cùng process với agent — có full access đến host environment (filesystem, network). Trust model: chỉ cài extension từ nguồn tin cậy.

Pi-mono hiện tại không sandbox extensions (không dùng worker threads hay VM contexts).

---

## Debugging Isolation Issues

- Sử dụng `console.log` trong factory function để trace quá trình đăng ký.
- Kiểm tra tool names để phát hiện xung đột giữa extensions.
- Nếu handler không được gọi, verify rằng event name đúng (phải là một trong 27+ event types).
- Kiểm tra thứ tự discovery nếu extension không được load.

---

## Example: Isolated Extension State

```typescript
export default function analyticsExtension(pi: ExtensionAPI) {
  // Isolated state trong closure
  const stats = {
    turnsProcessed: 0,
    toolsExecuted: 0,
    errors: 0,
  };

  pi.on('turn_end', () => {
    stats.turnsProcessed++;
  });

  pi.on('tool_execution_end', () => {
    stats.toolsExecuted++;
  });

  // Tool để query stats — chỉ extension này có access đến stats object
  pi.registerTool({
    name: 'get_analytics',
    description: 'Get session analytics',
    parameters: { type: 'object', properties: {} },
    async execute() {
      return { content: [{ text: JSON.stringify(stats) }] };
    },
  });
}
```

---

**End of context & isolation notes**.
