# Outer Loop vs Inner Loop
**Round 9: Agent Loop Event Flow**

---

## Outer Loop

```typescript
while (true) {
  let hasMoreToolCalls = true;
  let steeringAfterTools: AgentMessage[] | null = null;

  // Inner loop
  while (hasMoreToolCalls || pendingMessages.length > 0) {
    // ...
  }

  // Check follow-up
  const followUpMessages = await config.getFollowUpMessages() || [];
  if (followUpMessages.length > 0) {
    pendingMessages = followUpMessages;
    continue; // outer loop repeats
  }

  break; // no follow-up, exit
}
```

**Mục đích**: Xử lý follow-up messages. Sau khi một turn kết thúc (không còn tool calls, không có pending messages), agent có thể có follow-up messages (user messages được queue sau khi agent idle). Outer loop cho phép chạy thêm turns cho đến khi không còn follow-up.

**Điều kiện lặp**: Chạy ít nhất một lần. Thoát khi sau inner loop không có follow-up.

**Biến kiểm soát**: `pendingMessages` được đặt từ follow-up, sau đó inner loop sẽ xử lý chúng.

---

## Inner Loop

```typescript
while (hasMoreToolCalls || pendingMessages.length > 0) {
  if (!firstTurn) stream.push({ type: "turn_start" });
  else firstTurn = false;

  // Inject pending messages (steering from previous or follow-up now)
  if (pendingMessages.length > 0) {
    for (const message of pendingMessages) {
      stream.push({ type: "message_start", message });
      stream.push({ type: "message_end", message });
      currentContext.messages.push(message);
      newMessages.push(message);
    }
    pendingMessages = [];
  }

  // Stream assistant response
  const message = await streamAssistantResponse(...);
  newMessages.push(message);

  if (message.stopReason === "error" || message.stopReason === "aborted") {
    stream.push({ type: "turn_end", ... });
    stream.push({ type: "agent_end", ... });
    stream.end(newMessages);
    return;
  }

  // Check for tool calls
  const toolCalls = message.content.filter(c => c.type === "toolCall");
  hasMoreToolCalls = toolCalls.length > 0;

  const toolResults: ToolResultMessage[] = [];
  if (hasMoreToolCalls) {
    const toolExecution = await executeToolCalls(...);
    toolResults.push(...toolExecution.toolResults);
    steeringAfterTools = toolExecution.steeringMessages ?? null;
    for (const result of toolResults) {
      currentContext.messages.push(result);
      newMessages.push(result);
    }
  }

  stream.push({ type: "turn_end", message, toolResults });

  // Check for steering after turn completes
  if (steeringAfterTools && steeringAfterTools.length > 0) {
    pendingMessages = steeringAfterTools;
    steeringAfterTools = null;
  } else {
    pendingMessages = (await config.getSteeringMessages?.()) || [];
  }
}
```

**Mục đích**: Xử lý một turn: assistant response, followed by any tool calls. Tool calls are executed sequentially. Steering messages may interrupt after any tool, causing remaining tools to be skipped and a new turn to start immediately.

**Điều kiện lặp**: `hasMoreToolCalls` (assistant có tool calls) OR `pendingMessages.length > 0` (có messages waiting to be injected, e.g., steering or follow-up).

**Lưu ý**:
- `firstTurn` để chỉ phát `turn_start` cho lần đầu trong `agentLoop`.
- `pendingMessages` được inject ngay đầu mỗi inner iteration trước khi stream assistant.
- Sau assistant message, nếu có tool calls thì execute.
- Sau `turn_end`, check `steeringAfterTools` (từ executeToolCalls) trước, nếu không có thì lấy steering messages mới từ `getSteeringMessages()`.
- Nếu sau tất cả mà vẫn có `pendingMessages` (steering), inner loop tiếp tục (vòng lặp mới, turn mới ngay).
- Nếu không có pending messages và không có tool calls, inner loop kết thúc.

---

## Tương tác giữa hai loops

1. Outer loop bắt đầu, vào inner loop.
2. Inner loop xử lý hết tất cả tool calls và steering.
3. Nếu steering có trong bất kỳ tool nào, sau turn `pendingMessages` được set, inner loop tiếp tục ngay (cùng outer iteration).
4. Khi inner loop kết thúc (không còn tools, không có pending steering), outer loop check follow-up.
5. Nếu follow-up có, set `pendingMessages` và `continue` outer → inner loop chạy lại với pending messages (follow-up).
6. Nếu không có follow-up, outer loop break → `agent_end`.

---

**Ví dụ**:
- Turn 1: assistant có 2 tool calls. Sau tool 1, không steering; sau tool 2, steering có → skip remaining (không có tools nữa) → set pendingMessages = steering → inner loop tiếp tục (turn 2 với steering message).
- Turn 2: assistant không có tools → inner loop kết thúc.
- Check follow-up: nếu có, pendingMessages = follow-up, outer loop tiếp tục → inner loop chạy turn 3.
- Nếu không, agent_end.

---

**Kết luận**: Outer loop xử lý follow-up (post-idle messages), inner loop xử lý steering và tools trong cùng một logical turn series. Sự kết hợp cho phép steering interrupt ngay và follow-up chạy sau khi agent tưởng đã xong.
