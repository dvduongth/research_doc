> **Đã sửa**: Thay `this.context.on/off/once` bằng `pi.on()` (ExtensionAPI). Loại bỏ tham chiếu đến `disable()`, `ExtensionContext`, `context.event.emit()`. Cập nhật danh sách 27+ event types. Loại bỏ namespace prefix sai.

# Event System
**Round 10: Extensions System**

---

## Agent Event System

Pi-mono sử dụng hệ thống event nội bộ. Extensions đăng ký handler cho các event thông qua `pi.on()` trong factory function.

---

## Subscription API

Trong factory function, extension sử dụng đối tượng `pi` (ExtensionAPI):

```typescript
// Đăng ký handler cho event
pi.on(eventType: string, handler: (event: AgentEvent) => void): void;
```

Không có `pi.off()` hoặc `pi.once()` — extension đăng ký handlers khi factory chạy, và chúng tồn tại suốt vòng đời extension.

---

## Event Types (27+ loại)

Danh sách các event types chính từ `AgentEvent` union:

**Agent lifecycle:**
- `agent_start`, `agent_end`

**Turn lifecycle:**
- `turn_start`, `turn_end`

**Message lifecycle:**
- `message_start`, `message_update`, `message_end`

**Tool execution:**
- `tool_execution_start`, `tool_execution_update`, `tool_execution_end`

**Context & Provider:**
- `context`, `before_provider_request`

**Và nhiều event types khác** (tổng cộng 27+), bao gồm các event cho streaming, error handling, v.v.

---

## Cách đăng ký Event Handler

Extensions đăng ký handlers trong factory function:

```typescript
export default function myExtension(pi: ExtensionAPI) {
  pi.on('turn_end', (event) => {
    console.log('Turn ended');
  });

  pi.on('tool_execution_start', (event) => {
    console.log(`Tool: ${event.tool}`);
  });

  pi.on('message_start', (event) => {
    // Xử lý khi message bắt đầu
  });
}
```

**Lưu ý**: Không có cơ chế namespace prefix (`extension:`) — handlers được đăng ký trực tiếp cho event name tiêu chuẩn.

---

## Event Propagation

- Events được phát bởi agent core đến **tất cả** handlers đã đăng ký, bao gồm handlers từ extensions.
- Extensions chủ yếu **lắng nghe** events từ agent, không phát events riêng cho extensions khác.
- Không có cơ chế `context.event.emit()` hay `agent.emit()` cho extension-to-extension communication.

---

## Example: Logging Tool Execution

```typescript
export default function loggingExtension(pi: ExtensionAPI) {
  pi.on('tool_execution_start', (event) => {
    console.log(`[LOG] Tool started: ${event.tool}`);
  });

  pi.on('tool_execution_end', (event) => {
    console.log(`[LOG] Tool ended: ${event.tool}`);
  });

  pi.on('turn_end', (event) => {
    console.log('[LOG] Turn completed');
  });
}
```

---

## Cleanup

Vì extension sử dụng factory function pattern (không có `disable()` method), handlers được quản lý bởi hệ thống extension runner. Khi extension bị unload/reload, hệ thống tự xử lý việc gỡ bỏ handlers.

---

## Edge Cases

- **During streaming**: Events có thể đến nhanh liên tục; handlers nên xử lý nhanh và non-blocking.
- **Error in handler**: Nếu event handler throw, nên bắt lỗi bên trong handler (try/catch) để tránh ảnh hưởng agent.
- **Order of listeners**: Thứ tự gọi handlers không được đảm bảo giữa các extensions.

---

**End of event system notes**.
