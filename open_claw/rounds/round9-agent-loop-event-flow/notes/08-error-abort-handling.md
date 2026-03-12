# Error & Abort Handling
**Round 9: Agent Loop Event Flow**

---

## Abort

User or extension can call `agent.abort()`. This triggers the `AbortController`'s signal.

**Signal propagation**:
- Passed to `streamFn` (LLM call) via `signal` option.
- Passed to `tool.execute()` as `signal` argument.

**LLM side**: Providers that support abort will stop streaming and likely return an error or truncated response.

**Tool side**: Tools should check `signal.aborted` periodically and stop early; they can also throw `AbortError` or similar.

---

## Inside streamAssistantResponse

The `streamFn` returns an `EventStream`. The loop:

```typescript
for await (const event of response) {
  switch (event.type) {
    case "start":
      partialMessage = event.partial;
      context.messages.push(partialMessage);
      addedPartial = true;
      stream.push({ type: "message_start", message: { ...partialMessage } });
      break;
    // handle text_start, text_delta, text_end, thinking_*, toolcall_*, etc.
    case "done":
    case "error": {
      const finalMessage = await response.result();
      if (addedPartial) {
        context.messages[context.messages.length - 1] = finalMessage;
      } else {
        context.messages.push(finalMessage);
      }
      if (!addedPartial) {
        stream.push({ type: "message_start", message: { ...finalMessage } });
      }
      stream.push({ type: "message_end", message: finalMessage });
      return finalMessage;
    }
  }
}
```

**If the stream throws** (e.g., network error, abort), the exception bubbles up to `_runLoop` catch block.

---

## Inside `_runLoop` (Agent._runLoop)

Wrapped in try/catch:

```typescript
try {
  const stream = messages ? agentLoop(...) : agentLoopContinue(...);
  for await (const event of stream) {
    // update state, emit events
  }
  // handle partial after loop
} catch (err: any) {
  // Create error assistant message
  const errorMsg: AgentMessage = {
    role: "assistant",
    content: [{ type: "text", text: "" }],
    api: model.api,
    provider: model.provider,
    model: model.id,
    usage: { ... zeros ... },
    stopReason: this.abortController?.signal.aborted ? "aborted" : "error",
    errorMessage: err?.message || String(err),
    timestamp: Date.now(),
  };
  this.appendMessage(errorMsg);
  this._state.error = err?.message || String(err);
  this.emit({ type: "agent_end", messages: [errorMsg] });
} finally {
  // cleanup
}
```

So any unhandled error (including abort-induced errors) results in an assistant message with:
- `stopReason = "aborted"` if `signal.aborted`
- `stopReason = "error"` otherwise
- `errorMessage` containing the error text.
- Empty content (could also be non-empty if the error came from LLM with a message? But here it's empty).

---

## Tool Execution Errors

In `executeToolCalls`, errors during tool execution are caught per-tool:

```typescript
try {
  result = await tool.execute(...);
} catch (e) {
  result = { content: [{ type: "text", text: e instanceof Error ? e.message : String(e) }], details: {} };
  isError = true;
}
```

- The error does **not** abort the entire agent run.
- The tool result will have `isError: true` and error text in content.
- The agent continues to next tool (unless steering occurs).

---

## Partial Handling After Stream

After the `for await` loop, there might be a `partial` that was never finalized if the stream ended without a `done`/`error` event (unlikely). Code checks:

```typescript
if (partial && partial.role === "assistant" && partial.content.length > 0) {
  const onlyEmpty = !partial.content.some(c => (c.type === "thinking" && c.thinking.trim().length > 0) || (c.type === "text" && c.text.trim().length > 0) || (c.type === "toolCall" && c.name.trim().length > 0));
  if (!onlyEmpty) {
    this.appendMessage(partial);
  } else {
    if (this.abortController?.signal.aborted) {
      throw new Error("Request was aborted");
    }
  }
}
```

If partial is non-empty (has some meaningful content), append it. If it's only empty and aborted, throw to trigger error path.

---

## Error vs Aborted Distinction

- **aborted**: The request was intentionally cancelled via `agent.abort()`. This sets `signal.aborted`. The `stopReason` will be "aborted".
- **error**: Any other failure (network, provider error, tool error not caught by tool try/catch, etc.). The `stopReason` will be "error".

Extensions can check `event.message.stopReason` in `agent_end` or `turn_end` to react.

---

## User-visible Errors

The assistant message with empty content and `errorMessage` will be shown in the UI (typically with a red color and the error text). The `isError` flag on tool results also displays errors in the UI.

---

## Retry Logic

The agent does **not** automatically retry on errors. The error is propagated to the user. However, one could implement retry logic in an extension by listening to `agent_end` with error and then calling `agent.prompt()` again with the same input or a modified one.

---

## Best Practices for Tools

- Tools should be resilient: validate inputs, catch exceptions, return `isError: true` with helpful messages.
- Tools should respect `signal` for cancellation.
- Tools should truncate large output to avoid context overflow.

---

**End of error/abort notes**.
