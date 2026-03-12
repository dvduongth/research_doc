# Hook System
**Round 12: Agent Loop - Core Concepts**

---

## What Are Hooks?

Hooks are **configurable callback functions** that the agent calls at specific points in its lifecycle. They allow extensions and applications to modify the agent's behavior without forking core.

From `AgentOptions` (pi-agent):

```typescript
interface AgentOptions<ToolOptions = any> {
  // ...
  transformContext?: (messages: AgentMessage[], signal?: AbortSignal) => Promise<AgentMessage[]> | AgentMessage[];
  convertToLlm?: (messages: AgentMessage[]) => Promise<Message[]> | Message[];
  getSteeringMessages?: () => AgentMessage[] | Promise<AgentMessage[]>;
  getFollowUpMessages?: () => AgentMessage[] | Promise<AgentMessage[]>;
  beforeProviderRequest?: (payload: any, model: Model) => any;
  // event handlers via .on() also considered hooks
}
```

---

## Hook Invocation Points

### `transformContext`

- **When**: In `streamAssistantResponse()`, after obtaining the current `messages` (copy of context) and before `convertToLlm`.
- **Purpose**: Modify the `AgentMessage[]` that will be sent to the LLM. Use cases: prune old messages, inject retrieved context, summarize, filter custom types.
- **Parameters**: `(messages, signal)`. The `messages` array can be mutated or replaced.
- **Return**: New or modified `AgentMessage[]`.
- **Chain**: If multiple extensions provide, they are composed (order by dependency/priority). Each receives output of previous.

### `convertToLlm`

- **When**: After `transformContext` (or directly if none), before calling `streamFn`.
- **Purpose**: Convert internal `AgentMessage[]` to provider's `Message[]` (type from pi-ai). Default filters roles and handles attachments.
- **Parameters**: `(messages)`.
- **Return**: `Message[]`.
- **Chain**: Composable.

### `getSteeringMessages` / `getFollowUpMessages`

- **When**:
  - `getSteeringMessages`: Called inside `executeToolCalls` after each tool, and after `turn_end` (inner loop) to populate `pendingMessages`.
  - `getFollowUpMessages`: Called in outer loop after inner loop completes, to populate `pendingMessages`.
- **Purpose**: Provide a mechanism to inject messages without calling `agent.steer()` directly. Extensions may override these to implement custom queues.
- **Parameters**: none.
- **Return**: array of `AgentMessage`.
- **Modes**: The agent's `steerMode`/`followUpMode` control whether these return one or all queued messages (the underlying `dequeueSteeringMessages`/`dequeueFollowUpMessages` respect these modes).

### `before_provider_request`

- **When**: After `convertToLlm`, right before calling the provider's `streamFn` (i.e., before HTTP request).
- **Purpose**: Inspect or modify the provider payload (the `llmContext` or the raw request body). Useful for logging, adding custom headers, or adjusting parameters.
- **Parameters**: `(payload, model)`.
- **Return**: If return value is not `undefined`, it replaces the payload. Otherwise original used.
- **Example**: Add `"X-Custom": "value"` to headers.

### `context` Event

- **When**: Emitted by the agent just before calling the provider (after `convertToLlm`). Not a config hook; it's an event.
- **Purpose**: Allow any listener (extensions, UI) to modify the final LLM messages **in-place** (since it's synchronous). Could also be used to abort? Typically not; just mutate.
- **Payload**: `{ messages: Message[] }`. Listeners can modify the array or its elements.
- **Return**: none (event).
- **Note**: Because it's an event, multiple listeners run in order of registration; they all get a chance to modify.

---

## How Extensions Install Hooks

An extension can set these by directly assigning to `agent.config` in its `enable()`:

```typescript
this.context.agent.config.transformContext = async (msgs, signal) => {
  // do something
  return msgs;
};
```

But this overwrites previous hook unless the extension chains to the old one:

```typescript
const prev = this.context.agent.config.transformContext;
this.context.agent.config.transformContext = async (msgs, signal) => {
  const out = await myHook(msgs, signal);
  return prev ? await prev(out, signal) : out;
};
```

Better: The extension manager could manage hook registration and automatically compose them. However, in pi-agent, extensions typically set these directly, and the order of loading determines chain order (dependencies first). Extensions should be aware of existing hooks and compose.

---

## Hook Disposal

When an extension disables, it should restore the previous hook (if it overwrote) to avoid leaving dangling references that could cause errors (calling a disabled extension's hook). A clean approach: store the previous value and restore on disable.

```typescript
const originalTransform = agent.config.transformContext;
agent.config.transformContext = myTransform;
// on disable:
agent.config.transformContext = originalTransform;
```

If multiple extensions chain, restoring one may break the chain. So ideally, the extension manager tracks all hooks and manages a pipeline, allowing safe removal. Pi-agent may not have that; extensions must coordinate.

---

## Order of Execution

For a given hook type, if multiple extensions provide:

- They are called in **load order** (dependencies first). The first loaded extension's hook is the outermost; it receives original messages and returns to next, etc.
- If extension A loads first and sets `agent.config.transformContext = fnA`, then extension B loads and sets `agent.config.transformContext = fnB`, and B does not chain to A, then A's hook is lost. So B must chain to existing to preserve.
- Best practice: each new hook wraps the previous:

```typescript
const previous = agent.config.transformContext;
agent.config.transformContext = async (...args) => {
  const result = await previous?.(...args);
  return await myHook(result, ...args? Actually careful: previous expects same args; but we want to modify messages after previous? Usually: output = myHook(await previous(input), args)? Let's design:
  const afterPrev = await previous(...args);
  return await myHook(afterPrev, ...args);
};
```

But note that `previous` may be `undefined` (first hook). So handle that.

---

## Hook vs Event

- **Hook** (config callback): can modify data, may be async, return value influences next hook or core. Used for essential modifications.
- **Event** (`on`): observer pattern; listeners cannot directly modify the stream (except `context` event maybe). Used for side effects (logging, UI).

---

## Debugging Hooks

If hooks are mis-ordered or one throws, the agent may break. To debug:

- Add logging in each hook entry/exit.
- Use `console.trace()` to see load order.
- Wrap hooks in try/catch and forward errors.

---

## Hooks Provided by Core

The core agent itself may use these hooks internally? No, they are for extensions. The core does not set them.

---

## Example: Combining Two Transform Hooks

We want:
- ExtA: add a system note at the beginning.
- ExtB: log message count.

Assume load order: A then B.

Desired chain: messages → A → B → convertToLlm.

Implementation:

**ExtA enable:**
```typescript
const orig = agent.config.transformContext;
agent.config.transformContext = async (msgs, signal) => {
  const withNote = [{ role: 'user', content: [{ text: 'Note: be concise.' }] }, ...msgs];
  return orig ? await orig(withNote, signal) : withNote;
};
```

**ExtB enable:**
```typescript
const orig = agent.config.transformContext;
agent.config.transformContext = async (msgs, signal) => {
  console.log(`[ExtB] message count: ${msgs.length}`);
  return orig ? await orig(msgs, signal) : msgs;
};
```

Now chain: B wraps A. When agent calls transformContext:
- B runs first, logs, then calls A with original msgs.
- A adds note, then calls previous (which was undefined before A? Actually ExtA set orig = whatever existed before it, which was maybe undefined. Then ExtB sets orig = the current config (which is A's hook). So chain: B -> A -> (previous nil). That yields: A adds note, B logs after A's transformation? Wait order: B's hook runs first; it logs and then calls `orig` (which is A's hook) with the original msgs. A's hook adds note and then calls its `orig` (maybe nil). So final: note added, then log shows count including note. That's fine.

To have A run first then B, load A before B, but B should wrap A as shown, so B is outermost. Actually the order of execution is reverse of loading: last loaded runs first because it becomes the outermost. If we want A then B (A processes first, then B), we need B to be loaded first and wrap A. Or we maintain a pipeline array and call in order. The typical pattern is to compose such that the newest extension wraps previous, resulting in last loaded executing first. That's acceptable; order can be controlled via dependencies and load order. Document this.

---

## End of hook system.
