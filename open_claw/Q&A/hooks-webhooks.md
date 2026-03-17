# Q: Cơ chế Hooks và Webhook Handlers trong OpenClaw

**Date**: 2026-03-17
**Depth**: file analysis
**Sources**: `src/plugins/hooks.ts`, `src/gateway/hooks.ts`, `src/gateway/server/hooks.ts`, `src/gateway/hooks-mapping.ts`, `src/config/types.hooks.ts`, `src/hooks/internal-hooks.ts`

---

## Tổng quan: 3 tầng Hook trong OpenClaw

OpenClaw có **3 hệ thống hook hoàn toàn độc lập**, phục vụ các mục đích khác nhau:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Plugin Hooks       │ 2. External Webhooks │ 3. Internal  │
│ (LLM pipeline)        │ (HTTP endpoint)      │ Hooks        │
│ src/plugins/hooks.ts  │ src/gateway/hooks.ts │ src/hooks/   │
│ 24 hooks, 3 modes     │ POST /hooks          │ event-driven │
└─────────────────────────────────────────────────────────────┘
```

---

## PHẦN 1 — PLUGIN HOOKS (LLM Pipeline Hooks)

### 1.1 Khái niệm

Plugin Hooks cho phép **plugins can thiệp vào vòng đời của agent** — từ trước khi chọn model đến sau khi agent chạy xong. Đây là extension point chính cho plugins.

**Source**: `src/plugins/hooks.ts:126`

```typescript
export function createHookRunner(registry: PluginRegistry, options: HookRunnerOptions = {}) {
  // ...
  return {
    runBeforeModelResolve,    // Trước khi chọn model
    runBeforePromptBuild,     // Trước khi build prompt
    runBeforeAgentStart,      // Legacy: model + prompt combined
    runLlmInput,              // Observe LLM input payload
    runLlmOutput,             // Observe LLM output payload
    runAgentEnd,              // Sau khi agent kết thúc
    runBeforeCompaction,      // Trước khi compact session
    runAfterCompaction,       // Sau khi compact session
    runBeforeReset,           // Khi /new hoặc /reset
    runMessageReceived,       // Tin nhắn đến
    runMessageSending,        // Trước khi gửi tin nhắn
    runMessageSent,           // Sau khi gửi tin nhắn
    runBeforeToolCall,        // Trước khi gọi tool
    runAfterToolCall,         // Sau khi tool kết thúc
    runToolResultPersist,     // SYNC: Trước khi lưu tool result
    runBeforeMessageWrite,    // SYNC: Trước khi ghi message vào session
    runSessionStart,          // Session mới tạo
    runSessionEnd,            // Session kết thúc
    runSubagentSpawning,      // Trước khi spawn subagent
    runSubagentDeliveryTarget,// Resolve delivery route cho subagent
    runSubagentSpawned,       // Sau khi subagent được tạo
    runSubagentEnded,         // Subagent kết thúc
    runGatewayStart,          // Gateway khởi động
    runGatewayStop,           // Gateway dừng
  };
}
```

### 1.2 Ba chế độ thực thi

#### Chế độ 1: Fire-and-forget (Parallel)

```typescript
// src/plugins/hooks.ts:203
async function runVoidHook<K extends PluginHookName>(hookName, event, ctx) {
  const hooks = getHooksForName(registry, hookName);
  const promises = hooks.map(async (hook) => {
    try {
      await hook.handler(event, ctx);
    } catch (err) {
      handleHookError({ hookName, pluginId: hook.pluginId, error: err });
    }
  });
  await Promise.all(promises);  // TẤT CẢ chạy song song
}
```

**Dùng cho**: `message_received`, `message_sent`, `llm_input`, `llm_output`, `agent_end`, `session_start`, `session_end`, `subagent_spawned`, `subagent_ended`, `gateway_start`, `gateway_stop`, `after_tool_call`, `before_compaction`, `after_compaction`, `before_reset`

#### Chế độ 2: Sequential-Modifying (Priority order)

```typescript
// src/plugins/hooks.ts:230
async function runModifyingHook<K extends PluginHookName, TResult>(
  hookName, event, ctx, mergeResults?,
): Promise<TResult | undefined> {
  const hooks = getHooksForName(registry, hookName);
  // Sort by priority (higher = runs first)
  let result: TResult | undefined;
  for (const hook of hooks) {           // TUẦN TỰ, theo priority
    const handlerResult = await hook.handler(event, ctx);
    if (handlerResult !== undefined) {
      result = mergeResults ? mergeResults(result, handlerResult) : handlerResult;
    }
  }
  return result;
}
```

**Dùng cho**: `before_model_resolve`, `before_prompt_build`, `before_agent_start`, `message_sending`, `before_tool_call`, `subagent_spawning`, `subagent_delivery_target`

#### Chế độ 3: Synchronous (Hot path — BLOCKING)

```typescript
// Chỉ 2 hooks này là synchronous:
runToolResultPersist(event, ctx): PluginHookToolResultPersistResult | undefined
runBeforeMessageWrite(event, ctx): PluginHookBeforeMessageWriteResult | undefined
```

Dùng trên hot path (ghi JSONL) nên phải sync để tránh race conditions.

### 1.3 Danh sách 24 Plugin Hooks

| Hook | Chế độ | Mô tả | Có thể cancel/modify? |
|------|--------|-------|----------------------|
| `before_model_resolve` | Sequential | Override model/provider | ✅ `modelOverride`, `providerOverride` |
| `before_prompt_build` | Sequential | Inject vào system prompt | ✅ `systemPrompt`, `prependContext`, `appendSystemContext` |
| `before_agent_start` | Sequential | Legacy: model + prompt combined | ✅ |
| `llm_input` | Fire-forget | Observe exact LLM input | ❌ (observability only) |
| `llm_output` | Fire-forget | Observe exact LLM output | ❌ |
| `agent_end` | Fire-forget | Analyze completed conversation | ❌ |
| `before_compaction` | Fire-forget | Session sắp compact | ❌ |
| `after_compaction` | Fire-forget | Session đã compact | ❌ |
| `before_reset` | Fire-forget | Session sắp reset | ❌ |
| `message_received` | Fire-forget | Tin nhắn đến | ❌ |
| `message_sending` | Sequential | Trước khi gửi | ✅ `cancel: true`, modify content |
| `message_sent` | Fire-forget | Sau khi gửi | ❌ |
| `before_tool_call` | Sequential | Trước khi gọi tool | ✅ `cancel: true`, modify params |
| `after_tool_call` | Fire-forget | Sau khi tool kết thúc | ❌ |
| `tool_result_persist` | **SYNC** | Trước khi lưu tool result vào JSONL | ✅ modify result |
| `before_message_write` | **SYNC** | Trước khi ghi message vào JSONL | ✅ `skip: true` |
| `session_start` | Fire-forget | Session mới tạo | ❌ |
| `session_end` | Fire-forget | Session kết thúc | ❌ |
| `subagent_spawning` | Sequential | Trước khi spawn subagent | ✅ `status: "error"` để block |
| `subagent_delivery_target` | Sequential | Resolve delivery route | ✅ override target |
| `subagent_spawned` | Fire-forget | Subagent đã tạo | ❌ |
| `subagent_ended` | Fire-forget | Subagent kết thúc | ❌ |
| `gateway_start` | Fire-forget | Gateway khởi động | ❌ |
| `gateway_stop` | Fire-forget | Gateway dừng | ❌ |

### 1.4 Priority và Merge Logic

```typescript
// src/plugins/hooks.ts:114
function getHooksForName(registry, hookName) {
  return registry.typedHooks
    .filter(h => h.hookName === hookName)
    .toSorted((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
    //         ↑ Cao hơn chạy TRƯỚC (descending)
}
```

**Merge `before_prompt_build`** — nối context từ nhiều plugins:

```typescript
// src/plugins/hooks.ts:139
const mergeBeforePromptBuild = (acc, next) => ({
  systemPrompt: next.systemPrompt ?? acc?.systemPrompt,  // Next wins
  prependContext: concatOptionalTextSegments({
    left: acc?.prependContext,   // Plugin thứ nhất
    right: next.prependContext,  // Plugin thứ hai — nối THÊM
  }),
  appendSystemContext: concatOptionalTextSegments({ ... }),
});
```

**Merge `before_model_resolve`** — plugin cao nhất thắng:

```typescript
// src/plugins/hooks.ts:131
const mergeBeforeModelResolve = (acc, next) => ({
  modelOverride: acc?.modelOverride ?? next.modelOverride,    // First defined wins
  providerOverride: acc?.providerOverride ?? next.providerOverride,
});
```

### 1.5 Ví dụ: Plugin đăng ký hook

```typescript
// my-plugin/index.ts
export function activate(api: OpenClawPluginApi) {
  // Hook 1: Override model cho user VIP
  api.on("before_model_resolve", async (event, ctx) => {
    if (ctx.sessionKey?.includes("vip")) {
      return {
        modelOverride: "claude-opus-4-6",
        providerOverride: "anthropic",
      };
    }
    return undefined;  // Không thay đổi
  }, { priority: 100 });

  // Hook 2: Inject thêm context vào system prompt
  api.on("before_prompt_build", async (event, ctx) => {
    const now = new Date().toISOString();
    return {
      appendSystemContext: `\n\nCurrent time: ${now}\nServer: production`,
    };
  }, { priority: 50 });

  // Hook 3: Block message chứa từ cấm
  api.on("message_sending", async (event, ctx) => {
    const blocked = ["forbidden-word", "another-word"];
    if (blocked.some(w => event.content.includes(w))) {
      return { cancel: true };
    }
    return { content: event.content + " ✓" };  // Modify content
  }, { priority: 10 });

  // Hook 4: Log mọi tool call
  api.on("before_tool_call", async (event, ctx) => {
    console.log(`[plugin] tool: ${event.toolName}, params: ${JSON.stringify(event.params)}`);
    return undefined;  // Không cancel, không modify
  });
}
```

### 1.6 Plugin Hook Flow Diagram

```mermaid
sequenceDiagram
    participant MSG as User Message
    participant GW as Gateway
    participant HOOKS as HookRunner
    participant LLM as Claude API
    participant TOOLS as Tool Executor
    participant SESSION as Session JSONL

    MSG->>GW: "Thời tiết Hà Nội hôm nay?"
    GW->>HOOKS: runMessageReceived(event, ctx) [fire-forget]
    Note over HOOKS: Plugin A logs message

    GW->>HOOKS: runBeforeModelResolve(event, ctx) [sequential]
    Note over HOOKS: Plugin B: return { modelOverride: "claude-opus" }
    HOOKS-->>GW: { modelOverride: "claude-opus-4-6" }

    GW->>HOOKS: runBeforePromptBuild(event, ctx) [sequential]
    Note over HOOKS: Plugin C: return { appendSystemContext: "timezone: Asia/HCM" }
    HOOKS-->>GW: { appendSystemContext: "timezone: Asia/HCM" }

    GW->>LLM: POST /messages (model=claude-opus, system+context injected)
    HOOKS->>HOOKS: runLlmInput(inputPayload) [fire-forget — observability]
    LLM-->>GW: <use_tool>web_search("thời tiết Hà Nội")</use_tool>
    HOOKS->>HOOKS: runLlmOutput(outputPayload) [fire-forget]

    GW->>HOOKS: runBeforeToolCall(event, ctx) [sequential]
    Note over HOOKS: Plugin D: cho phép chạy
    HOOKS-->>GW: undefined (không cancel)

    GW->>TOOLS: Execute web_search
    TOOLS-->>GW: { result: "28°C, mưa nhẹ" }

    GW->>HOOKS: runToolResultPersist(event, ctx) [SYNC]
    Note over HOOKS: Plugin E: modify tool result
    HOOKS-->>GW: { result: "[SAFE] 28°C, mưa nhẹ" }

    GW->>SESSION: Ghi tool_result vào JSONL

    GW->>HOOKS: runAfterToolCall(event, ctx) [fire-forget]

    LLM-->>GW: "Hôm nay Hà Nội 28°C, dự báo mưa nhẹ..."

    GW->>HOOKS: runMessageSending(event, ctx) [sequential]
    Note over HOOKS: Plugin F: có thể cancel hoặc modify text
    HOOKS-->>GW: { content: "Hôm nay Hà Nội 28°C... ✓" }

    GW->>HOOKS: runBeforeMessageWrite(event, ctx) [SYNC]
    HOOKS-->>GW: undefined (cho phép ghi)
    GW->>SESSION: Ghi assistant message vào JSONL

    GW-->>MSG: "Hôm nay Hà Nội 28°C, dự báo mưa nhẹ... ✓"
    GW->>HOOKS: runMessageSent(event, ctx) [fire-forget]
    GW->>HOOKS: runAgentEnd(event, ctx) [fire-forget]
```

---

## PHẦN 2 — EXTERNAL WEBHOOKS (HTTP `/hooks` Endpoint)

### 2.1 Khái niệm

External Webhooks là **HTTP endpoint** để external systems (GitHub, Gmail, monitoring tools...) trigger OpenClaw agent. Không liên quan đến Plugin Hooks.

```
POST /hooks         → Wake action (inject system event)
POST /hooks/agent   → Agent action (chạy AI agent)
POST /hooks/gmail   → Gmail preset
POST /hooks/<path>  → Custom path mapping
```

### 2.2 Cấu hình

```json
// openclaw.json
{
  "hooks": {
    "enabled": true,
    "token": "my-secret-token",
    "path": "/hooks",
    "maxBodyBytes": 262144,
    "defaultSessionKey": "hook:main",
    "allowRequestSessionKey": false,
    "allowedAgentIds": ["main", "coder"],
    "mappings": [
      {
        "id": "github-pr",
        "match": { "path": "github" },
        "action": "agent",
        "name": "GitHub PR",
        "sessionKey": "hook:github:{{payload.pull_request.number}}",
        "messageTemplate": "New PR #{{payload.number}}: {{payload.pull_request.title}}\n{{payload.pull_request.html_url}}"
      }
    ],
    "presets": ["gmail"],
    "gmail": {
      "account": "myaccount@gmail.com",
      "allowUnsafeExternalContent": false
    }
  }
}
```

**Source** (`src/config/types.hooks.ts:110`):

```typescript
export type HooksConfig = {
  enabled?: boolean;
  path?: string;                          // Default: "/hooks"
  token?: string;                         // Bearer token — BẮT BUỘC khi enabled
  defaultSessionKey?: string;             // Session cho agent hook
  allowRequestSessionKey?: boolean;       // Cho phép caller tự chọn session
  allowedSessionKeyPrefixes?: string[];   // Whitelist session key prefix
  allowedAgentIds?: string[];             // Whitelist agent IDs
  maxBodyBytes?: number;                  // Default: 256 KB
  presets?: string[];                     // "gmail"
  transformsDir?: string;                 // Custom transforms dir
  mappings?: HookMappingConfig[];
  gmail?: HooksGmailConfig;
  internal?: InternalHooksConfig;         // Internal hooks config
};
```

### 2.3 Authentication

```
Authorization: Bearer my-secret-token
# hoặc
X-OpenClaw-Token: my-secret-token
```

Thiếu/sai token → `401 Unauthorized`.

### 2.4 Hai loại action

#### Action 1: Wake Hook — Inject system event

```bash
# Trigger heartbeat với system event text
curl -X POST https://myserver/hooks \
  -H "Authorization: Bearer my-token" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "[ALERT] Server memory > 90%",
    "mode": "now"
  }'
```

**Xử lý source** (`src/gateway/server/hooks.ts:28`):

```typescript
const dispatchWakeHook = (value: { text: string; mode: "now" | "next-heartbeat" }) => {
  const sessionKey = resolveMainSessionKeyFromConfig();
  enqueueSystemEvent(value.text, { sessionKey });   // Inject vào session queue
  if (value.mode === "now") {
    requestHeartbeatNow({ reason: "hook:wake" });   // Kích heartbeat ngay
  }
};
```

#### Action 2: Agent Hook — Chạy AI agent đầy đủ

```bash
# Chạy AI agent với message cụ thể
curl -X POST https://myserver/hooks/agent \
  -H "Authorization: Bearer my-token" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Phân tích PR này và cho biết có cần review không: https://github.com/...",
    "name": "GitHub PR Review",
    "agentId": "coder",
    "deliver": true,
    "channel": "telegram",
    "to": "+84901234567",
    "wakeMode": "now",
    "model": "claude-sonnet-4-6",
    "timeoutSeconds": 120
  }'
```

**Xử lý source** (`src/gateway/server/hooks.ts:36`):

```typescript
const dispatchAgentHook = (value: HookAgentDispatchPayload) => {
  const sessionKey = normalizeHookDispatchSessionKey({ ... });
  const jobId = randomUUID();

  // Tạo CronJob one-shot để chạy agent
  const job: CronJob = {
    id: jobId,
    agentId: value.agentId,
    name: value.name,
    enabled: true,
    schedule: { kind: "at", at: new Date(now).toISOString() }, // One-shot: ngay bây giờ
    sessionTarget: "isolated",   // Session riêng biệt
    wakeMode: value.wakeMode,
    payload: {
      kind: "agentTurn",
      message: value.message,
      model: value.model,
      deliver: value.deliver,
      channel: value.channel,
      to: value.to,
      // ...
    },
    state: { nextRunAtMs: now },
  };

  // Chạy async (không block HTTP response)
  void (async () => {
    const result = await runCronIsolatedAgentTurn({ cfg, deps, job, message, sessionKey });
    if (!result.delivered) {
      // Fallback: inject summary vào main session + wake
      enqueueSystemEvent(`${prefix}: ${summary}`, { sessionKey: mainSessionKey });
      if (value.wakeMode === "now") {
        requestHeartbeatNow({ reason: `hook:${jobId}` });
      }
    }
  })();

  return runId;  // HTTP response trả về ngay (async execution)
};
```

### 2.5 Hook Mappings — Template Engine

Mappings cho phép **transform** và **route** webhook payload từ external systems sang OpenClaw actions.

**Config** (`src/config/types.hooks.ts:11`):

```typescript
export type HookMappingConfig = {
  id?: string;
  match?: {
    path?: string;    // Match theo URL path suffix
    source?: string;  // Match theo source field trong payload
  };
  action?: "wake" | "agent";
  sessionKey?: string;         // Hỗ trợ template: "hook:{{payload.id}}"
  messageTemplate?: string;    // Template: "{{payload.title}}\n{{payload.body}}"
  textTemplate?: string;       // Template cho wake action
  transform?: {                // Custom transform function
    module: string;
    export?: string;
  };
  agentId?: string;
  model?: string;
  thinking?: string;
  deliver?: boolean;
  channel?: "telegram" | "discord" | "slack" | ...;
  to?: string;
  timeoutSeconds?: number;
};
```

**Template syntax**: `{{headers.X-Header}}`, `{{payload.field.nested}}`, `{{query.param}}`

**Source** (`src/gateway/hooks-mapping.ts:147`):

```typescript
export async function applyHookMappings(
  mappings: HookMappingResolved[],
  ctx: HookMappingContext,
): Promise<HookMappingResult | null> {
  for (const mapping of mappings) {
    if (!mappingMatches(mapping, ctx)) continue;  // Check path/source match

    const base = buildActionFromMapping(mapping, ctx);  // Apply template

    // Nếu có custom transform function
    if (mapping.transform) {
      const transform = await loadTransform(mapping.transform);
      const override = await transform(ctx);
      if (override === null) return { ok: true, action: null, skipped: true };
    }

    return mergedAction;  // Trả về action đã merge
  }
  return null;  // Không có mapping nào match
}
```

### 2.6 Gmail Preset

Built-in preset cho Gmail Pub/Sub notifications:

```typescript
// src/gateway/hooks-mapping.ts:67
const hookPresetMappings: Record<string, HookMappingConfig[]> = {
  gmail: [
    {
      id: "gmail",
      match: { path: "gmail" },
      action: "agent",
      wakeMode: "now",
      name: "Gmail",
      sessionKey: "hook:gmail:{{messages[0].id}}",
      messageTemplate:
        "New email from {{messages[0].from}}\n" +
        "Subject: {{messages[0].subject}}\n" +
        "{{messages[0].snippet}}\n{{messages[0].body}}",
    },
  ],
};
```

### 2.7 External Webhook Flow — GitHub PR trigger

```mermaid
sequenceDiagram
    participant GH as GitHub (Webhook)
    participant HTTP as POST /hooks/github
    participant AUTH as Token Auth
    participant MAPPING as applyHookMappings()
    participant DISPATCH as dispatchAgentHook()
    participant RUNNER as runCronIsolatedAgentTurn()
    participant CLAUDE as Claude API
    participant TG as Telegram

    GH->>HTTP: POST /hooks/github<br/>{ action: "opened", pull_request: {...} }<br/>Authorization: Bearer my-token

    HTTP->>AUTH: Validate Bearer token
    AUTH-->>HTTP: ✅ Valid

    HTTP->>MAPPING: applyHookMappings(mappings, ctx)
    Note over MAPPING: match: { path: "github" } → match!<br/>sessionKey = "hook:github:42"<br/>message = "New PR #42: Fix bug..."

    MAPPING-->>HTTP: { ok: true, action: { kind: "agent", message: "..." } }

    HTTP-->>GH: 202 Accepted { runId: "uuid" }
    Note over HTTP: Trả về NGAY — async execution

    HTTP->>DISPATCH: dispatchAgentHook(payload)
    DISPATCH->>DISPATCH: Tạo CronJob one-shot<br/>sessionTarget: "isolated"<br/>sessionKey: "hook:github:42"

    DISPATCH->>RUNNER: runCronIsolatedAgentTurn(job)
    RUNNER->>CLAUDE: "New PR #42: Fix bug...\nReview this PR and..."
    CLAUDE-->>RUNNER: "PR looks good, minor suggestions: ..."

    alt deliver: true (khi config deliver + channel)
        RUNNER->>TG: Send to +84901234567
        TG-->>RUNNER: Delivered ✅
    else deliver: false (default)
        RUNNER->>RUNNER: enqueueSystemEvent("GitHub PR: PR looks good...")
        RUNNER->>RUNNER: requestHeartbeatNow()
        Note over RUNNER: Agent sẽ thấy event này ở heartbeat tiếp theo
    end
```

---

## PHẦN 3 — INTERNAL HOOKS (Event-Driven)

### 3.1 Khái niệm

Internal Hooks là hệ thống **event-driven dành cho workspace-level handlers** — các module TypeScript/JavaScript trong workspace directory lắng nghe các events của agent.

**Source** (`src/config/types.hooks.ts:75`):

```typescript
export type InternalHookHandlerConfig = {
  event: string;   // "command:new", "message:received", "session:start", ...
  module: string;  // Đường dẫn tới handler module (workspace-relative)
  export?: string; // Export name (default: "default")
};

export type InternalHooksConfig = {
  enabled?: boolean;
  handlers?: InternalHookHandlerConfig[];   // Legacy: explicit handlers
  entries?: Record<string, HookConfig>;     // Per-hook config overrides
  load?: {
    extraDirs?: string[];                   // Thêm dirs để scan hooks
  };
  installs?: Record<string, HookInstallRecord>;  // Installed hook packs
};
```

### 3.2 Cấu hình Internal Hooks

```json
// openclaw.json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "handlers": [
        {
          "event": "message:received",
          "module": "hooks/log-messages.js",
          "export": "handleMessage"
        },
        {
          "event": "session:start",
          "module": "hooks/on-session-start.js"
        }
      ],
      "load": {
        "extraDirs": ["~/.openclaw/workspace/hooks/"]
      }
    }
  }
}
```

### 3.3 Internal Hook Events

| Event | Khi nào | Payload |
|-------|---------|---------|
| `command:new` | `/new` hoặc `/reset` | `{ sessionKey, agentId }` |
| `message:received` | Tin nhắn đến | `{ message, sessionKey, channel }` |
| `message:transcribed` | Audio transcription xong | `{ transcript, sessionKey }` |
| `message:preprocessed` | Message đã được enrich | `{ message, sessionKey }` |
| `message:sent` | Tin nhắn đã gửi | `{ message, channel, to }` |
| `agent:bootstrap` | Agent đang khởi tạo | `{ agentId, sessionKey }` |
| `gateway:startup` | Gateway starting | `{ version, config }` |

---

## So sánh 3 hệ thống Hook

```mermaid
graph TB
    subgraph "Plugin Hooks (src/plugins/)"
        P1["before_model_resolve<br/>before_prompt_build"]
        P2["message_sending<br/>before_tool_call"]
        P3["llm_input/output<br/>agent_end"]
        P1 --> PD1["Sequential — có priority"]
        P2 --> PD2["Sequential — có thể cancel"]
        P3 --> PD3["Fire-forget — song song"]
    end

    subgraph "External Webhooks (src/gateway/)"
        W1["POST /hooks → Wake"]
        W2["POST /hooks/agent → Agent"]
        W3["POST /hooks/gmail → Gmail preset"]
        W1 --> WD1["enqueueSystemEvent + heartbeat"]
        W2 --> WD2["CronJob one-shot<br/>isolated session"]
        W3 --> WD3["Gmail Pub/Sub mapping"]
    end

    subgraph "Internal Hooks (src/hooks/)"
        I1["message:received"]
        I2["session:start"]
        I3["command:new"]
        I1 --> ID1["workspace JS/TS module handlers"]
        I2 --> ID1
        I3 --> ID1
    end

    style P1 fill:#3b82f6,color:#fff
    style P2 fill:#3b82f6,color:#fff
    style P3 fill:#3b82f6,color:#fff
    style W1 fill:#22c55e,color:#fff
    style W2 fill:#22c55e,color:#fff
    style W3 fill:#22c55e,color:#fff
    style I1 fill:#f59e0b,color:#fff
    style I2 fill:#f59e0b,color:#fff
    style I3 fill:#f59e0b,color:#fff
```

| Tiêu chí | Plugin Hooks | External Webhooks | Internal Hooks |
|----------|-------------|-------------------|----------------|
| **Ai dùng** | Plugin developers | External systems | Workspace admins |
| **Trigger** | Lifecycle events | HTTP POST | Agent events |
| **Auth** | N/A (local plugin) | Bearer token | N/A (local module) |
| **Modify agent** | ✅ (prompt, model, tools) | ❌ (trigger only) | ❌ |
| **Async** | Có hỗ trợ | ✅ (non-blocking) | ✅ |
| **Cancel action** | ✅ (message, tool) | ❌ | ❌ |
| **Config** | Plugin manifest | `hooks.enabled/token/mappings` | `hooks.internal.handlers` |
| **Source** | `src/plugins/hooks.ts` | `src/gateway/hooks.ts` | `src/hooks/` |

---

## Ví dụ end-to-end: GitHub Alert → Telegram

**Scenario**: GitHub Action gửi webhook khi deployment fail → OpenClaw agent phân tích logs → báo cáo qua Telegram.

**Config**:
```json
{
  "hooks": {
    "enabled": true,
    "token": "gh-webhook-secret-123",
    "mappings": [
      {
        "id": "github-deploy-fail",
        "match": { "path": "github" },
        "action": "agent",
        "name": "GitHub Deploy",
        "sessionKey": "hook:github:deploy:{{payload.repository.name}}",
        "messageTemplate": "Deployment FAILED for {{payload.repository.name}}\nBranch: {{payload.ref}}\nCommit: {{payload.head_commit.message}}\nError: {{payload.conclusion}}",
        "deliver": true,
        "channel": "telegram",
        "to": "+84901234567",
        "model": "claude-haiku-4-5",
        "timeoutSeconds": 60,
        "wakeMode": "now"
      }
    ]
  }
}
```

**GitHub Action**:
```yaml
- name: Notify OpenClaw on failure
  if: failure()
  run: |
    curl -X POST https://myserver.com/hooks/github \
      -H "Authorization: Bearer gh-webhook-secret-123" \
      -H "Content-Type: application/json" \
      -d "${{ toJSON(github) }}"
```

**Flow**:
```mermaid
flowchart LR
    GH["GitHub<br/>POST /hooks/github"] --> AUTH["Token: ✅"]
    AUTH --> MAP["Mapping match:<br/>path='github'"]
    MAP --> TMPL["Template render:<br/>message = 'Deployment FAILED...'"]
    TMPL --> JOB["CronJob one-shot<br/>session: hook:github:deploy:myapp"]
    JOB --> CLAUDE["Claude Haiku<br/>(60s timeout)"]
    CLAUDE --> RESP["'Deploy fail do missing env var DB_URL. Fix: ...'"]
    RESP --> TG["Telegram → +84901234567"]
```

---

*Generated: 2026-03-17 | Source: OpenClaw codebase analysis*
*Key files: `src/plugins/hooks.ts` (763 lines), `src/gateway/hooks.ts` (410 lines), `src/gateway/server/hooks.ts` (114 lines), `src/gateway/hooks-mapping.ts` (527 lines), `src/config/types.hooks.ts` (143 lines)*
