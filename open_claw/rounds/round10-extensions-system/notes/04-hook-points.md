> **Đã sửa**: Loại bỏ tham chiếu đến `enable()`, `this.context.agent`, dependency order cho hooks, `provide.hook()`, `manifest priority`. Thay bằng `pi.on()` pattern. Sửa mô tả hook composition.

# Hook Points
**Round 10: Extensions System**

---

## Agent Config Hooks

Agent có một số hook trong cấu hình (`AgentOptions`) cho phép mở rộng hành vi:

- `transformContext?: (messages: AgentMessage[], signal?: AbortSignal) => Promise<AgentMessage[]> | AgentMessage[]`
- `convertToLlm?: (messages: AgentMessage[]) => Promise<Message[]> | Message[]`
- `getSteeringMessages?: () => Promise<AgentMessage[]>` (hoặc sync)
- `getFollowUpMessages?: () => Promise<AgentMessage[]>`
- `beforeProviderRequest?: (payload: any, model: Model) => any`

Agent cũng phát event `context` (xem bên dưới) cho phép sửa đổi messages sau `transformContext` nhưng trước `convertToLlm`.

---

## How Extensions Hook In

Extensions hook vào agent thông qua `pi.on()` trong factory function:

```typescript
export default function myExtension(pi: ExtensionAPI) {
  // Hook vào event context để sửa đổi messages trước khi gửi LLM
  pi.on('context', (event) => {
    // Có thể sửa đổi messages
  });

  // Hook vào trước provider request
  pi.on('before_provider_request', (event) => {
    // Sửa đổi payload, logging, v.v.
  });

  // Hook vào turn lifecycle
  pi.on('turn_start', (event) => {
    // Logic trước mỗi turn
  });
}
```

Extensions **không** trực tiếp gán vào `agent.config.transformContext`. Thay vào đó, chúng sử dụng event system thông qua `pi.on()`.

---

## The `context` Event

Agent phát event `context` ngay trước khi gọi provider. Event này cho phép listeners (bao gồm extensions) sửa đổi messages cuối cùng.

```typescript
pi.on('context', (event) => {
  const { messages } = event;
  // Sửa đổi messages trước khi gửi đến LLM
  // Ví dụ: thêm context, lọc messages, v.v.
});
```

---

## Hook Points Details

### `transformContext`

- Hoạt động trên `AgentMessage[]`.
- Được gọi **trước** `convertToLlm`.
- Dùng cho: pruning, summarization, inject retrieved docs, custom message manipulation.

### `convertToLlm`

- Chuyển đổi internal messages sang provider's `Message[]`.
- Default xử lý filter roles và attachments.

### `getSteeringMessages` / `getFollowUpMessages`

- Được gọi trong inner/outer loop của agent để kiểm tra queued messages.
- Extensions có thể thêm steering messages thông qua event handlers.

### `before_provider_request`

- Được gọi sau khi LLM payload đã build, ngay trước HTTP request.
- Extensions hook vào qua `pi.on('before_provider_request', handler)`.
- Dùng cho: logging, payload manipulation, thêm headers.

---

## Order of Execution

Khi nhiều extensions đăng ký handler cho cùng một event, thứ tự thực thi phụ thuộc vào thứ tự load extension. Pi-mono **không có dependency graph hay topological sort** giữa extensions — thứ tự là thứ tự discovery và load.

Nếu cần thứ tự cụ thể, cần sắp xếp thứ tự file/path trong cấu hình discovery.

---

## Example: Extension Hooking vào Events

```typescript
export default function contextEnhancer(pi: ExtensionAPI) {
  // Hook: log trước mỗi provider request
  pi.on('before_provider_request', (event) => {
    console.log('Sending request to LLM...');
  });

  // Hook: theo dõi turn
  pi.on('turn_start', (event) => {
    console.log('New turn starting');
  });

  pi.on('turn_end', (event) => {
    console.log('Turn completed');
  });
}
```

---

## Debugging Hooks

Extensions nên log khi handlers được gọi (debug level) để trace thứ tự thực thi giữa các extensions.

---

**End of hook points notes**.
