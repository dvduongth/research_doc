# Steering vs Follow-up
**Round 9: Agent Loop Event Flow**

---

## Steering

**Definition**: Messages (usually user) that interrupt the agent while it is actively streaming or executing tools. Steering allows the user to change direction immediately.

**Queue**: `steeringQueue` (array of `AgentMessage`).

**Enqueue**: `agent.steer(message)` or `pi.sendUserMessage(content, { deliverAs: "steer" })`.

**Dequeue**: `dequeueSteeringMessages()`:
- If `steeringMode === "one-at-a-time"`: returns first message and removes it from queue.
- If `steeringMode === "all"`: returns all messages and clears queue.

**When checked**:
1. Inside `executeToolCalls()`, **after each tool execution**:
   ```typescript
   if (getSteeringMessages) {
     const steering = await getSteeringMessages();
     if (steering.length > 0) {
       steeringMessages = steering;
       // skip remaining tools
       break;
     }
   }
   ```
2. At the **end of an inner loop iteration** (after `turn_end`), before deciding to continue inner loop:
   ```typescript
   if (steeringAfterTools && steeringAfterTools.length > 0) {
     pendingMessages = steeringAfterTools;
   } else {
     pendingMessages = (await config.getSteeringMessages?.()) || [];
   }
   ```
   If `pendingMessages` non-empty, inner loop continues immediately (next turn).

**Effect**: Steering messages are injected as user messages before the next assistant response in the **same outer loop iteration** (i.e., without checking follow-up). Any remaining tools in the current turn are skipped.

**Delivery**: Interrupts after current tool finishes; remaining tools in the same turn are skipped with `skipToolCall`.

---

## Follow-up

**Definition**: Messages queued to be processed **after the agent becomes idle** (no more tool calls, no pending steering). Used for continuing conversation after agent has finished a turn.

**Queue**: `followUpQueue` (array of `AgentMessage`).

**Enqueue**: `agent.followUp(message)` or `pi.sendUserMessage(content, { deliverAs: "followUp" })`.

**Dequeue**: `dequeueFollowUpMessages()` (similar mode logic: one-at-a-time vs all).

**When checked**:
- Only **once per outer loop iteration**, after the inner loop has completed (i.e., no more tool calls and no pending steering messages). In `runLoop`:
  ```typescript
  // After inner loop finishes:
  const followUpMessages = (await config.getFollowUpMessages?.()) || [];
  if (followUpMessages.length > 0) {
    pendingMessages = followUpMessages;
    continue; // outer loop repeats
  }
  ```

**Effect**: Follow-up messages cause the outer loop to iterate again. They become `pendingMessages`, which the inner loop will inject at its start, creating a new turn.

**Delivery**: Waits for agent to be idle (no streaming, no pending tool calls). Then starts a new turn.

---

## Delivery Modes (for `pi.sendUserMessage`)

- `"steer"`: Queues into steering queue. Immediate effect (after current tool).
- `"followUp"`: Queues into follow-up queue. Deferred until agent idle.
- `"nextTurn"`: Queued for next user prompt, does not trigger turn automatically.

---

## Modes: one-at-a-time vs all

Both steering and follow-up have modes:
- `"one-at-a-time"`: Only one message is dequeued per check. The rest wait for subsequent checks.
- `"all"`: All queued messages are dequeued at once.

Default is `"one-at-a-time"` (safer to avoid flooding).

---

## Example Scenarios

### Scenario 1: User steers during tool execution

1. Agent is executing tool 1 of 3.
2. User types a message → goes to steeringQueue.
3. After tool 1 completes, `executeToolCalls` checks steering → finds message.
4. Sets `steeringAfterTools = [msg]`, skips tools 2 & 3 (skipToolCall for each).
5. `turn_end` emitted.
6. Inner loop sees `pendingMessages = steeringAfterTools` → continues (next turn) with that user message.
7. Assistant responds to steering message.

### Scenario 2: User sends follow-up after agent finishes

1. Agent completes turn (no tools), `agent_end` would be next.
2. But before that, outer loop checks follow-up: there is a follow-up message (queued via `followUp` after previous turn).
3. Sets `pendingMessages = followUp`, `continue` outer.
4. Inner loop starts again, injects follow-up message as user, assistant responds, etc.
5. After that turn, if no more follow-up, `agent_end`.

### Scenario 3: Multiple steering messages, mode=all

- Several steering messages queued while agent busy.
- After a tool, `getSteeringMessages` returns all (mode all).
- All become pending, inner loop will inject them all in one iteration (multiple user messages in same turn? Actually pendingMessages are injected sequentially before next assistant response. That means they'll all be added as user messages before the assistant responds. That's like user sending a burst of messages; agent will see them all in context. That is valid.

---

## Key Differences

| Aspect | Steering | Follow-up |
|--------|----------|-----------|
| Timing | During active agent run (streaming or tools) | After agent idle |
| Queue | `steeringQueue` | `followUpQueue` |
| Check location | Inside tool execution loop & after turn | Outer loop after inner loop finishes |
| Effect on current turn | May skip remaining tools | Starts a brand new turn after current run completes |
| Use case | Interrupt, correct, redirect | Continue conversation naturally |

---

## Implementation Notes

- The `Agent` class maintains two separate queues.
- `config.getSteeringMessages` and `config.getFollowUpMessages` are provided by the agent's `AgentOptions` and typically call `dequeueSteeringMessages` and `dequeueFollowUpMessages` respectively.
- The agent's `steer()` and `followUp()` methods simply push to the respective queues.
- The mode (`steeringMode`, `followUpMode`) set at agent construction controls how many messages are dequeued per call.

---

**End of steering vs follow-up explanation**.
