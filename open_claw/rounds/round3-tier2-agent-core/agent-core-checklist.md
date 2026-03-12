# Round 3 Checklist: Tier 2 Agent Core (`pi-agent-core`)
**Đánh dấu [x] khi đã hiểu.**

---

## ✅ Agent Class & State

- [ ] **Initial State**: `{ systemPrompt, model, thinkingLevel, tools, messages }`
- [ ] **Options**: `convertToLlm`, `transformContext`, `steeringMode`, `followUpMode`, `streamFn`, `sessionId`, `getApiKey`, `thinkingBudgets`.
- [ ] **State properties**: `state.systemPrompt`, `state.model`, `state.thinkingLevel`, `state.tools`, `state.messages`, `state.isStreaming`, `state.streamMessage`, `state.pendingToolCalls`, `state.error`.
- [ ] **Methods**:
  - `prompt(message)` / `prompt({role, content})` / `promet(image, text)`
  - `continue()`
  - `setSystemPrompt()`, `setModel()`, `setThinkingLevel()`, `setTools()`, `replaceMessages()`, `appendMessage()`, `clearMessages()`, `reset()`.
  - `abort()`, `waitForIdle()`.
  - `setSteeringMode()`, `setFollowUpMode()`, `steer()`, `followUp()`, `clearSteeringQueue()`, `clearFollowUpQueue()`, `clearAllQueues()`.
  - `sessionId`, `thinkingBudgets` setters.
- [ ] **Subscription**: `agent.subscribe(event => ...)` và `unsubscribe`.

---

## ✅ Agent Loop & Events

- [ ] **Low-level API**: `agentLoop(messages, context, config)` và `agentLoopContinue(context, config)`.
- [ ] **Event Sequence** (từ README):
  1. `agent_start`
  2. `turn_start`
  3. `message_start` (user)
  4. `message_end` (user)
  5. `message_start` (assistant)
  6. `message_update` (streaming)
  7. `message_end` (assistant)
  8. Nếu có tool calls:
     - `tool_execution_start`
     - `tool_execution_update`
     - `tool_execution_end`
     - `message_start/end` (toolResult)
     - `turn_end`
     - → quay lại bước 5 nếu cần tiếp tục (assistant respond to tool result)
  9. Nếu không còn tool → `turn_end` → `agent_end`.
- [ ] **Tool call handling**: Agent chạy tools tuần tự (có thể song song nếu LLM gọi nhiều).
- [ ] **Stop reasons**: `stop`, `length`, `toolUse`, `error`, `aborted`.
- [ ] **Context building**: `transformContext(messages, signal)` → prune/inject; `convertToLlm(messages)` → filter `user`, `assistant`, `toolResult`.

---

## ✅ Message Types (AgentMessage union)

- [ ] `UserMessage`: `{ role: 'user', content: string | ContentBlock[], timestamp }`
- [ ] `AssistantMessage` (from pi-ai): `{ role: 'assistant', content: (Text|Thinking|ToolCall)[], api, provider, model, usage, stopReason, errorMessage?, timestamp }`
- [ ] `ToolResultMessage`: `{ role: 'toolResult', toolCallId, toolName, content: (Text|Image)[], details?, isError, timestamp }`
- [ ] `BashExecutionMessage`: `{ role: 'bashExecution', command, output, exitCode, cancelled, truncated, fullOutputPath?, excludeFromContext?, timestamp }`
- [ ] `CustomMessage`: `{ role: 'custom', customType, content, display, details?, timestamp }`
- [ ] `BranchSummaryMessage`: `{ role: 'branchSummary', summary, fromId, timestamp }`
- [ ] `CompactionSummaryMessage`: `{ role: 'compactionSummary', summary, tokensBefore, timestamp }`
- [ ] Declaration merging cho custom types.

---

## ✅ Tool System

- [ ] **`AgentTool` interface**:
  ```typescript
  interface AgentTool<TParameters = any> {
    name: string;
    label?: string;
    description: string;
    parameters: TSchema;  // TypeBox schema
    execute: (toolCallId, params, signal, onUpdate?, ctx?) => Promise<{ content: ContentBlock[], details?: any }>;
    renderCall?(args, theme)?;
    renderResult?(result, options, theme)?;
  }
  ```
- [ ] **Built-in tools**: `read`, `bash`, `edit`, `write`, `grep`, `find`, `ls`.
- [ ] Tool execution: agent gọi `execute()`, `signal` để hủy, `onUpdate` để stream progress.
- [ ] **Error handling**: throw error để set `isError: true`; return value for success.
- [ ] Tool result shape: `{ content: (Text|Image)[], details? }`.

---

## ✅ Steering & Follow-up

- [ ] Steering mode: `"one-at-a-time"` (default) mỗi lần chỉ một steering message được xử lý; `"all"` gửi tất cả together.
- [ ] Follow-up mode: tương tự.
- [ ] Steering được inject sau tool hiện tại, skip các tools còn lại.
- [ ] Follow-up chỉ chạy khi agent idle (không còn tool calls, không steering).
- [ ] Methods: `steer(message)`, `followUp(message)`, `getSteeringMode()`, `getFollowUpMode()`, `clear queues`.

---

## ✅ SessionManager ( từ coding-agent )

- [ ] Session file: JSONL với `type` entries (session header, message, compaction, branch_summary, custom, label, model_change, thinking_level_change, session_info).
- [ ] Tree structure: `id`, `parentId`.
- [ ] SessionManager API:
  - Static: `create()`, `open(path)`, `continueRecent()`, `inMemory()`, `forkFrom()`.
  - List: `list()`, `listAll()`.
  - Instance: `newSession()`, `setSessionFile()`, `createBranchedSession()`.
  - Append: `appendMessage()`, `appendCompaction()`, `appendCustomEntry()`, `appendCustomMessageEntry()`, `appendLabelChange()`, `appendSessionInfo()`, `appendModelChange()`, `appendThinkingLevelChange()`.
  - Navigation: `getLeafId()`, `getLeafEntry()`, `getEntry(id)`, `getBranch()`, `getTree()`, `getChildren()`, `getLabel()`, `branch(entryId)`, `resetLeaf()`, `branchWithSummary()`.
  - Context: `buildSessionContext()`.
  - Info: `getEntries()`, `getHeader()`, `getSessionName()`, `getCwd()`, `getSessionDir()`, `getSessionId()`, `getSessionFile()`, `isPersisted()`.

---

## ✅ Compaction & Branching

- [ ] Compaction: summarize old messages khi context gần đầy.
- [ ] Branching: `/tree` điều hướng, tạo nhánh mới mà không tạo file mới.
- [ ] `BranchSummaryEntry`: tóm tắt nhánh bị abandon.

---

**Lưu ý**: Nhiều phần SessionManager nằm trong `packages/coding-agent`, nhưng `pi-agent-core` cung cấp core agent loop và message types. Cần đọc cả hai.
