# Tool Execution Flow
**Round 9: Agent Loop Event Flow**

---

## Overview

When an assistant message contains tool calls (content type "toolCall"), the agent executes them sequentially via `executeToolCalls()`.

---

## Step-by-Step

1. **Extract tool calls** from assistant message:
   ```typescript
   const toolCalls = assistantMessage.content.filter(c => c.type === "toolCall");
   ```

2. **Initialize**:
   - `results: ToolResultMessage[] = []`
   - `steeringMessages: AgentMessage[] | undefined`

3. **Iterate over tool calls** (for loop with index):
   For each `toolCall`:
   - a. Push `tool_execution_start` event.
   - b. Find tool: `const tool = tools.find(t => t.name === toolCall.name)`. If not found, throw error (caught later).
   - c. Validate arguments: `validateToolArguments(tool, toolCall)`. Throws if invalid.
   - d. Execute:
     ```typescript
     result = await tool.execute(toolCall.id, validatedArgs, signal, (partial) => {
         stream.push({ type: "tool_execution_update", toolCallId, toolName, args, partialResult: partial });
     });
     ```
   - e. Catch errors: if exception, create `result = { content: [{ text: errorMsg }], details: {} }`, set `isError = true`.
   - f. Push `tool_execution_end` event with result and isError.
   - g. Create `ToolResultMessage`:
     ```typescript
     {
       role: "toolResult",
       toolCallId,
       toolName: toolCall.name,
       content: result.content,
       details: result.details,
       isError,
       timestamp: Date.now(),
     }
     ```
   - h. Add `toolResultMessage` to `results`, push to `currentContext.messages` and `newMessages`.
   - i. Push `message_start` and `message_end` events for the toolResult.
   - j. **Check steering**: after this tool, if `config.getSteeringMessages` is set:
     ```typescript
     const steering = await config.getSteeringMessages();
     if (steering.length > 0) {
       steeringMessages = steering;
       // Skip remaining tools
       const remainingCalls = toolCalls.slice(index + 1);
       for (const skipped of remainingCalls) {
         results.push(skipToolCall(skipped, stream));
       }
       break; // exit tool loop
     }
     ```

4. **Return**: `{ toolResults: results, steeringMessages }`.

---

## skipToolCall()

Creates a `ToolResultMessage` for a tool that was skipped due to steering.

- Result content: `[{ type: "text", text: "Skipped due to queued user message." }]`.
- `isError: true`.
- Emits `tool_execution_start` and `tool_execution_end` (with that result) so the UI can show it as skipped.
- Also emits `message_start`/`message_end` for the toolResult.
- Returns the `ToolResultMessage`.

---

## Sequential Execution

Tools run **sequentially** (not parallel). This ensures deterministic order and correct context for stateful tools.

---

## Error Handling

- If tool not found → error thrown, caught, becomes `isError` result.
- If `tool.execute()` throws → caught, becomes `isError`.
- If validation fails (`validateToolArguments`) → throws, caught in outer `executeToolCalls` try/catch.

---

## Integration with Agent Loop

After `executeToolCalls` returns:

- `toolResults` are already added to `currentContext.messages` and `newMessages`.
- `steeringAfterTools` (if any) is stored.
- `stream.push({ type: "turn_end", message, toolResults })`.
- Then, in the inner loop:
  ```typescript
  if (steeringAfterTools && steeringAfterTools.length > 0) {
    pendingMessages = steeringAfterTools;
  } else {
    pendingMessages = await config.getSteeringMessages() || [];
  }
  ```
- If `pendingMessages` non-empty, the inner loop continues (next iteration) with those messages injected before the next assistant response.

---

## Steering Interaction

- Steering messages obtained **after each tool** via `getSteeringMessages()`.
- If any steering queued, remaining tools skipped (`steeringAfterTools` set, break).
- The steering messages become `pendingMessages` for the next turn within the same outer loop iteration.
- Steering mode (`one-at-a-time` vs `all`) controls how many messages `dequeueSteeringMessages()` returns (called by `getSteeringMessages`). In `executeToolCalls`, `getSteeringMessages()` is a config callback that internally calls `dequeueSteeringMessages()`.

---

## Tool Result in Events

Each tool execution generates three events:
1. `tool_execution_start` (start)
2. Optionally `tool_execution_update` (progress)
3. `tool_execution_end` (end)
4. `message_start` (toolResult)
5. `message_end` (toolResult)

The tool result also becomes part of the `turn_end` payload (`toolResults` array).

---

**End of tool execution details**.
