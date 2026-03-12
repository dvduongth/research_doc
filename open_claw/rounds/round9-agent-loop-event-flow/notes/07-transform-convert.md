# transformContext vs convertToLlm
**Round 9: Agent Loop Event Flow**

---

## transformContext

**Type**: `(messages: AgentMessage[], signal?: AbortSignal) => Promise<AgentMessage[]> | AgentMessage[]`

**When called**: In `streamAssistantResponse()`, before converting to LLM messages.

```typescript
if (config.transformContext) {
  messages = await config.transformContext(messages, signal);
}
```

**Purpose**: Allow extensions or application to modify the **AgentMessage[]** context before it is sent to the LLM. This happens on every turn.

**Common use cases**:
- **Pruning**: Remove old or redundant messages to reduce token usage.
- **Injecting external context**: Add retrieval results, documentation snippets.
- **Filtering**: Remove certain custom message types.
- **Summarization**: Already done at application layer via compaction; but could also do custom summarization here.
- **Annotating**: Add metadata or system instructions per-turn.

**Important**: The `messages` passed in are a copy of the current context (from `context.messages`). Modifying them does not affect the stored `AgentState.messages` unless you also modify that separately (but typically you don't). So `transformContext` is purely for shaping the LLM input.

---

## convertToLlm

**Type**: `(messages: AgentMessage[]) => Message[] | Promise<Message[]>`

**When called**: After `transformContext` (if any), just before calling `streamFn(model, llmContext, ...)`.

```typescript
const llmMessages = await config.convertToLlm(messages);
```

**Default implementation** (`defaultConvertToLlm`):
- Filters messages to only those with `role` in `["user", "assistant", "toolResult"]`.
- Converts attachments (images) to provider-specific format (e.g., base64 with media type).
- Drops custom message types (those with `customType`).

**Purpose**: Adapt the agent's internal message representation to the LLM provider's expected format (the `Message` type from pi-ai). Each provider may have slightly different requirements for image encoding, tool result format, etc.

**Override scenarios**:
- If you want to preserve custom message types (e.g., an extension's custom message) and your provider can handle them (maybe via text rendering), you can override to keep them.
- If you need to inject provider-specific fields (like `cache_control` for OpenAI), you can do so here.

---

## Sequence in streamAssistantResponse()

1. Get current `messages` from `context.messages` (copy array).
2. If `config.transformContext` set, call it → possibly new array.
3. Call `config.convertToLlm(messages)` → `Message[]` (LLM format).
4. Build `llmContext = { systemPrompt, messages: llmMessages, tools }`.
5. Call `streamFn(model, llmContext, options)`.

---

## Example: Custom transformContext to inject a system note

```typescript
const agent = new Agent({
  transformContext: async (messages, signal) => {
    const note = { role: "user" as const, content: [{ type: "text", text: "Note: be concise." }] };
    return [note, ...messages];
  },
});
```

---

## Example: Override convertToLlm to keep custom messages

```typescript
const agent = new Agent({
  convertToLlm: (messages) => {
    // Include customType messages as plain text
    return messages.map(msg => {
      if (msg.customType) {
        return {
          role: msg.role === "toolResult" ? "tool" : msg.role,
          content: [{ type: "text", text: msg.content as string }],
        };
      }
      // default conversion for standard types
      return defaultConvertToLlm([msg])[0];
    });
  },
});
```

---

## Key Differences

| Aspect | transformContext | convertToLlm |
|--------|------------------|--------------|
| Operates on | `AgentMessage[]` (internal) | `AgentMessage[]` → `Message[]` (LLM type) |
| Purpose | High-level context shaping | Low-level format adaptation |
| Timing | Before convert | After transform |
| Can change message roles? | Yes (but careful) | Yes, but must produce valid LLM roles |
| Filters out custom types? | Not by default | Yes by default (unless overridden) |
| Attachments handling? | No | Yes (images) |

---

**End of transform vs convert notes**.
