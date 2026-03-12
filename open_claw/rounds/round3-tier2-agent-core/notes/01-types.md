# Agent Core Types

## 📦 Core Interfaces

### `AgentTool<TParameters, TDetails>`

Mở rộng `Tool` từ pi-ai bằng `label` và `execute`:

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

`AgentToolResult<TDetails>`:
```typescript
{
  content: (TextContent | ImageContent)[];  // Text or images
  details: TDetails;  // UI/log metadata (tuỳ chọn)
}
```

---

### `AgentMessage`

Union của:
- `Message` từ pi-ai (UserMessage, AssistantMessage, ToolResultMessage)
- Custom messages qua declaration merging (`CustomAgentMessages`)

```typescript
export interface CustomAgentMessages {
  // Empty - apps merge here
}
export type AgentMessage = Message | CustomAgentMessages[keyof CustomAgentMessages];
```

---

### `AgentState`

```typescript
interface AgentState {
  systemPrompt: string;
  model: Model<any>;
  thinkingLevel: ThinkingLevel;
  tools: AgentTool<any>[];
  messages: AgentMessage[];
  isStreaming: boolean;
  streamMessage: AgentMessage | null;
  pendingToolCalls: Set<string>;
  error?: string;
}
```

---

### `AgentLoopConfig`

Config cho low-level `agentLoop()`:

```typescript
interface AgentLoopConfig extends SimpleStreamOptions {
  model: Model<any>;

  // Convert AgentMessage[] → LLM Message[]
  convertToLlm: (messages: AgentMessage[]) => Message[] | Promise<Message[]>;

  // Optional: prune/inject before convert
  transformContext?: (messages: AgentMessage[], signal?) => Promise<AgentMessage[]>;

  // Dynamic API key resolution
  getApiKey?: (provider: string) => string | undefined | Promise<string | undefined>;

  // Steering & follow-up
  getSteeringMessages?: () => Promise<AgentMessage[]>;
  getFollowUpMessages?: () => Promise<AgentMessage[]>;
}
```

---

## 🎯 AgentEvent Types

Event stream cho UI updates:

- Agent lifecycle:
  - `{ type: "agent_start" }`
  - `{ type: "agent_end"; messages: AgentMessage[] }`
- Turn lifecycle:
  - `{ type: "turn_start" }`
  - `{ type: "turn_end"; message: AgentMessage; toolResults: ToolResultMessage[] }`
- Message lifecycle:
  - `{ type: "message_start"; message: AgentMessage }`
  - `{ type: "message_update"; message: AgentMessage; assistantMessageEvent: AssistantMessageEvent }` (assistant only)
  - `{ type: "message_end"; message: AgentMessage }`
- Tool execution:
  - `{ type: "tool_execution_start"; toolCallId, toolName, args }`
  - `{ type: "tool_execution_update"; toolCallId, toolName, args, partialResult }`
  - `{ type: "tool_execution_end"; toolCallId, toolName, result, isError }`

---

**Lưu ý**: Các type này là foundation cho Agent class và agentLoop. Làm quen chúng là bước quan trọng để hiểu cách agent quản lý state và emit events.
