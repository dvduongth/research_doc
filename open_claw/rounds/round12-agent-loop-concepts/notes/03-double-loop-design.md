# Double Loop Design: Outer & Inner
**Round 12: Agent Loop - Core Concepts**

---

## Recap: Loop Structure

From `agent-loop.ts` (Round 9):

```typescript
// _runLoop calls agentLoop or agentLoopContinue
async function runLoop(...) {
  while (true) {
    let hasMoreToolCalls = true;
    let steeringAfterTools: AgentMessage[] | null = null;

    // INNER LOOP
    while (hasMoreToolCalls || pendingMessages.length > 0) {
      // inject pendingMessages (steering)
      // streamAssistantResponse -> message with possible tool calls
      // executeToolCalls (sequential)
      // after each tool, check steering -> break if found
      // after turn_end, set pendingMessages = steeringAfterTools or getSteeringMessages()
    }

    // OUTER LOOP CHECK
    const followUpMessages = await config.getFollowUpMessages() || [];
    if (followUpMessages.length > 0) {
      pendingMessages = followUpMessages;
      continue; // outer loop repeats -> inner loop runs again
    }

    break; // no follow-up, exit
  }
}
```

---

## Why Two Loops?

### Problem 1: Steering Interrupts During Tools

When executing a series of tool calls (e.g., tool1, tool2, tool3), we want to allow the user to send a message that **immediately cancels the remaining tools** and redirects the agent. This is **steering**.

If we had a single loop, we would need to check for steering after each tool. That can be done with a single loop as well:

```typescript
while (hasMoreToolCalls || pendingMessages.length > 0) {
  // ... same
}
```

Actually, a single loop suffices for steering: after tool execution, set `pendingMessages` if steering exists, and loop continues. The inner loop condition already includes `pendingMessages.length > 0`. So why outer?

### Problem 2: Follow-up After Idle

Consider the agent just finished a turn (no more tools, no steering). The user might have sent additional messages while the agent was busy. The agent should **automatically** process those without requiring the client to wait for `agent_end` and then send a new `prompt()`.

If we used a single loop that exits after turn end, we would need the outer caller to check for follow-up and decide to call `agentLoopContinue()` again. That would mean the `_runLoop` is not fully encapsulating the multi-turn behavior; the client would have to loop around `agentLoopContinue` calls.

By having an **outer loop** inside `_runLoop`, the agent itself handles follow-up transparently. The client only sees a single `agent.prompt()` call that may run multiple turns (inner + outer iterations). The client doesn't need to know about follow-up.

---

## Separation of Concerns

- **Inner loop**: Handles everything that belongs to the **current logical turn**: assistant response, tool calls, and any immediate steering that interrupts that turn. Steering is considered part of the same conversational "exchange" because it arrives while the agent is still working on the user's original request.
- **Outer loop**: Handles **post-idle follow-up**, which are messages that arrive after the agent has completed its work (or while it's working, but they are not urgent interrupts). The outer loop basically says: "After we finish this work, check if there's more work queued; if yes, start a fresh turn."

This separation makes the flow easier to reason about:

- Steering is **co-temporal** with the current turn (happens during the same "session").
- Follow-up is **sequent** (happens after the current session ends).

---

## Alternative Designs Considered

### Single Loop with Unified Queue

Could we have a single queue that holds both steering and follow-up, with a priority flag? Then the loop would always check the queue after each tool and at the end. The difference: steering would cut short remaining tools; follow-up would wait until end. That is essentially what the double loop does, but with two separate queues (`steeringQueue` and `followUpQueue`). The separation clarifies intent and prevents follow-up from accidentally interrupting a turn.

### Outer Loop Only with Implicit Inner

Another design: the outer loop is the main turn loop; tool execution is just a synchronous subroutine within the turn. That's basically what we have: the inner loop is the tool execution loop. They could be merged: instead of a while loop inside, we could have:

```typescript
while (true) {
  // assistant response
  // if tool calls, execute sequentially, after each check steering -> if steering, break inner and go to outer follow-up check? Actually need to break tool loop and also inject steering before next assistant.
  // after tools, check steering -> if yes, inject and continue (new turn within same outer iteration)
  // else break to outer follow-up check
}
```

But that would be a single loop with a nested tool loop. The current design is: outer loop (follow-up) → inner loop (assistant + tools + steering). Equivalent but structured for clarity.

---

## State Sharing Between Loops

They share:
- `currentContext.messages` (cumulative).
- `newMessages` (messages generated in this run).
- `pendingMessages` (used to pass steering from inner to next inner iteration, and follow-up from outer to inner).

The `steeringAfterTools` variable lets `executeToolCalls` communicate to the outer inner-loop that a steering interruption occurred, so remaining tools are skipped.

---

## Flow Example with Steering and Follow-up

Scenario:
- User msg1 → agent starts turn 1.
- Assistant emits tool calls [A, B, C].
- Execute tool A: no steering.
- Execute tool B: after completion, check steering → user sent msg2 (steering) → set `steeringAfterTools = [msg2]`, skip C.
- Turn end. Inner loop sees `steeringAfterTools` → `pendingMessages = [msg2]` → inner loop continues (new iteration, turn 2) with msg2 injected.
- Turn 2: assistant responds (no tools). Inner loop ends (no tools, no steering after).
- Outer loop checks follow-up: there is msg3 (queued while busy). Set `pendingMessages = [msg3]`, continue outer.
- Inner loop again (turn 3) with msg3 injected, etc.

Thus, both loops enable continuous processing without client re-invocation.

---

## Benefits

- **Single entry point**: Client calls `prompt()` once; agent handles all subsequent turns until fully idle and no follow-up.
- **Responsive**: Steering can interrupt long tool chains.
- **Automatic catch-up**: Follow-up ensures queued messages are not lost.
- **Extensible**: Extensions can hook into both steering and follow-up checks.

---

## Potential Pitfalls

- **Infinite loops**: If an extension keeps queuing steering or follow-up messages, the agent could never exit. The agent should have a max turn limit or timeout (configurable).
- **Starving follow-up**: If steering keeps arriving, follow-up may be delayed indefinitely. That's acceptable because steering is urgent.
- **Memory growth**: If many follow-up messages accumulate while agent is busy, the context grows. The agent may need to throttle or reject new messages if context exceeds limit.

---

## Comparison with Other Frameworks

- **LangChain's AgentExecutor**: Uses a while loop that continues until a `should_continue` condition. It handles tools and can break. But it doesn't distinguish steering vs follow-up; all new user messages are new runs.
- **OpenAI Realtime API**: Has `input_audio_buffer` and `response.create` with interrupts; similar to steering but at audio level.
- **AutoGPT**: Runs in a loop until a stop condition; but user input is separate.

pi-agent's double loop with two queues is a distinctive design for **chat-based** agents where user can send messages at any time.

---

**End of double loop design**.
