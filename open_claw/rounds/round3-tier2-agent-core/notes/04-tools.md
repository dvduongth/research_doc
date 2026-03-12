# Tools System

## 🔧 AgentTool

`AgentTool` extends `Tool` từ pi-ai:

```typescript
interface AgentTool<TParameters extends TSchema = TSchema, TDetails = any> extends Tool<TParameters> {
  label: string;  // Hiển thị trong UI
  execute: (
    toolCallId: string,
    params: Static<TParameters>,  // Đã validated
    signal?: AbortSignal,
    onUpdate?: AgentToolUpdateCallback<TDetails>
  ) => Promise<AgentToolResult<TDetails>>;
}
```

**`AgentToolResult<TDetails>`**:
```typescript
{
  content: (TextContent | ImageContent)[];  // Text and/or images
  details: TDetails;  // UI/log metadata (tuỳ chọn)
}
```

**Callback**:
```typescript
type AgentToolUpdateCallback<T = any> = (partialResult: AgentToolResult<T>) => void;
```

Dùng `onUpdate` để stream progress (ví dụ: đang đọc file, tiến độ %).

---

## 🛠️ Built-in Tools

Một số tools built-in được định nghĩa trong `pi-coding-agent` (không phải `pi-agent-core`), bao gồm:

- `read`: Đọc file.
- `bash`: Chạy shell command.
- `edit`: Chỉnh sửa file (thay thế, insert, delete).
- `write`: Ghi file (tạo mới hoặc overwrite).
- `grep`: Tìm kiếm text trong files.
- `find`: Tìm files theo pattern.
- `ls`: Liệt kê thư mục.

Các tools này có thể được override bởi extensions.

---

## 🧑‍🔧 Tool Execution Flow

1. Assistant message chứa `toolCall` blocks.
2. Agent lọc tool calls, tìm `AgentTool` tương ứng trong `state.tools`.
3. Với mỗi tool call:
   - Emit `tool_execution_start`.
   - Validate arguments với `validateToolArguments(tool, toolCall)` (dùng TypeBox schema). Nếu fail → throw error.
   - Gọi `tool.execute(toolCallId, validatedArgs, signal, onUpdate)`.
   - `onUpdate` gọi emit `tool_execution_update`.
   - Khi `execute` resolve:
     - Nếu throw → tạo `AgentToolResult` với `details={}` và `content` là error message, `isError: true`.
     - Nếu resolve → `isError: false`.
   - Emit `tool_execution_end`.
   - Tạo `ToolResultMessage`:
     ```typescript
     {
       role: 'toolResult',
       toolCallId,
       toolName,
       content: result.content,
       details: result.details,
       isError,
       timestamp: Date.now()
     }
     ```
   - Push vào `context.messages` và emit `message_start`/`message_end`.
4. Sau mỗi tool, check steering messages. Nếu có steering, skip các tools còn lại.
5. Sau tất cả tools, agent sẽ tiếp tục với một turn mới để LLM phản hồi dựa trên tool results.

---

## 🎯 Tool Validation

`validateToolArguments(tool, toolCall)`:

- Dùng TypeBox để validate `toolCall.arguments` against `tool.parameters`.
- Nếu invalid, throw `Error` với message chi tiết.
- Khi throw, `execute` không được gọi; agent sẽ bắt error và tạo `toolResult` với `isError: true` để LLM biết và tự retry.

Ở dạng low-level, bạn tự gọi `validateToolArguments` trước khi execute. Ở `Agent` class, nó được gọi tự động trong `executeToolCalls`.

---

## 🏃 Streaming Tool Execution

Tool có thể stream progress qua `onUpdate`:

```typescript
execute(toolCallId, params, signal, onUpdate) {
  onUpdate?.({ content: [{ type: 'text', text: 'Starting...' }], details: { progress: 0 } });
  // ... work
  onUpdate?.({ content: [], details: { progress: 50 } });
  // ... more work
  return { content: [{ type: 'text', text: 'Done' }], details: { files: [...] } };
}
```

Events `tool_execution_update` sẽ carry `partialResult` này.

---

## 📦 Built-in Tools Implementation

Built-in tools nằm trong `packages/coding-agent/src/core/tools/`. Mỗi tool có:

- `create<X>Tool(cwd?, options?)` factory functions.
- Detailed `Tool` object với `name`, `description`, `parameters` schema, `execute`.
- Optional `renderCall` và `renderResult` cho custom TUI rendering.

Khi override built-in tools trong extensions, bạn phải giữ nguyên `result` shape (bao gồm `details` type) để UI hoạt động đúng.

---

**Lưu ý**: `pi-agent-core` chỉ định nghĩa `AgentTool` interface và execution logic. Các tools cụ thể được implement ở `pi-coding-agent`. Tuy nhiên, bạn có tự define tools riêng và truyền vào `Agent` qua `setTools()`.
