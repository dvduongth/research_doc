# Agent Class

## 🏗️ Khởi tạo

```typescript
import { Agent } from '@mariozechner/pi-agent-core';

const agent = new Agent({
  initialState: {
    systemPrompt: 'You are helpful.',
    model: getModel('openai', 'gpt-4o-mini'),
    thinkingLevel: 'off',
    tools: [],           // AgentTool[]
    messages: []         // AgentMessage[]
  },
  convertToLlm?,         // (msgs) => Message[]
  transformContext?,     // (msgs, signal) => Promise<AgentMessage[]>
  steeringMode?: 'all' | 'one-at-a-time',
  followUpMode?: 'all' | 'one-at-a-time',
  streamFn?,             // custom stream function
  sessionId?,            // for provider caching
  getApiKey?,            // dynamic API key resolution
  onPayload?,            // debug/inspect payload
  thinkingBudgets?,      // custom token budgets
  transport?,            // 'sse' | 'websocket' | 'auto'
  maxRetryDelayMs?       // default 60000
});
```

---

## 🧠 State & Accessors

`agent.state` (read-only reference) là `AgentState`:

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

Các setter methods:

- `setSystemPrompt(v)`
- `setModel(m)`
- `setThinkingLevel(l)`
- `setTools(tools)`
- `setSteeringMode(mode)`, `getSteeringMode()`
- `setFollowUpMode(mode)`, `getFollowUpMode()`
- `sessionId` (getter/setter)
- `thinkingBudgets` (getter/setter)
- `transport` (getter/setter)
- `maxRetryDelayMs` (getter/setter)

---

## 📨 Messaging

### `agent.prompt(message)`

Gửi prompt và chờ hoàn thành.

```typescript
// Text
await agent.prompt('Hello!');

// With images
await agent.prompt('What is this?', [
  { type: 'image', data: base64, mimeType: 'image/jpeg' }
]);

// AgentMessage directly
await agent.prompt({ role: 'user', content: 'Explain quantum physics' });
```

`prompt()` sẽ:
1. Thêm user message vào `state.messages`.
2. Chạy agent loop (streaming internally).
3. Thêm assistant message (và toolResult messages) vào `state.messages`.
4. Emit events qua subscribers.

### `agent.continue()`

Tiếp tục từ context hiện tại. Lời nhắn cuối trong context phải là `user` hoặc `toolResult` (không được `assistant`).

```typescript
// Sau một lỗi, có thể retry:
await agent.continue();
```

---

## 🔄 Steering & Follow-up

### Steering

Steering messages interrupt agent while it's running tools.

```typescript
agent.steer({ role: 'user', content: 'Stop! Do this instead.' });
```

Khi steering messages có mặt:
- Sau tool hiện tại, các tools còn lại bị skip.
- Steering message được inject vào context.
- LLM phản hồi lại.

### Follow-up

Follow-up messages được xử lý sau khi agent idle (không còn tool calls, không steering).

```typescript
agent.followUp({ role: 'user', content: 'Also summarize the result.' });
```

### Modes

- `"one-at-a-time"` (default): Mỗi turn chỉ xử lý 1 steering/follow-up message.
- `"all"`: Gửi tất cả queued messages cùng lúc.

Methods:
- `clearSteeringQueue()`, `clearFollowUpQueue()`, `clearAllQueues()`
- `hasQueuedMessages()`

---

## 🎧 Events

`agent.subscribe(fn)` đăng ký listener nhận `AgentEvent`.

Unsubscribe bằng返回值:

```typescript
const unsub = agent.subscribe((e) => console.log(e.type));
// later
unsub();
```

---

## 🛠️ State Mutators

- `replaceMessages(ms)`: thay thế toàn bộ messages.
- `appendMessage(m)`: thêm message vào cuối.
- `clearMessages()`: xóa hết messages.
- `reset()`: clear tất cả state (systemPrompt, model, messages, ... về default).

---

## ⏹️ Control

- `abort()`: hủy request đang chạy (tương tự AbortController).
- `waitForIdle()`: await cho đến khi agent không còn streaming/tools.

---

## 🔐 Custom Tools

`AgentTool` extends `Tool` từ pi-ai:

```typescript
const myTool: AgentTool = {
  name: 'my_tool',
  label: 'My Tool',
  description: 'Does something useful',
  parameters: Type.Object({ input: Type.String() }),
  async execute(toolCallId, params, signal, onUpdate) {
    // onUpdate để stream progress tùy chọn
    onUpdate?.({ content: [{ type: 'text', text: 'Working...' }], details: {} });
    // ... work
    return {
      content: [{ type: 'text', text: 'Result' }],
      details: { foo: 'bar' }  // UI có thể dùng
    };
  }
};

agent.setTools([myTool, ...]);
```

---

**Lưu ý**: Agent class là wrapper convenient xung quanh `agentLoop` từ `./agent-loop.js`. Nó quản lý state, queues, và emit events.
