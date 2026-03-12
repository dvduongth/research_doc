# Round 9: Agent Loop - Event Flow
**Mục tiêu**: Hiểu chi tiết event flow trong agent loop: cách agent xử lý messages, streaming, tool calls, steering, follow-up, compaction, branching, và tất cả events được phát ra.

---

## 🎯 Mục tiêu chi tiết

- [ ] Agent.prompt() vs Agent.continue() khác nhau thế nào?
- [ ] agentLoop() vs agentLoopContinue() - khi nào dùng cái nào?
- [ ] Outer loop vs Inner loop: mục đích, điều kiện lặp.
- [ ] Event stream types: agent_start, turn_start, message_start/update/end, tool_execution_start/update/end, turn_end, agent_end.
- [ ] Tool execution flow: sequential execution, steering after tools, skip logic.
- [ ] Steering vs Follow-up: delivery mechanism, when they are processed.
- [ ] State: AgentState (isStreaming, streamMessage, pendingToolCalls, error, messages).
- [ ] Queues: steeringQueue, followUpQueue, modes (all vs one-at-a-time).
- [ ] transformContext() và convertToLlm() - khi nào gọi, mục đích.
- [ ] Abort handling, error handling.
- [ ] Compaction & branching (nằm ở application layer, nhưng agent loop handle messages).
- [ ] Vẽ sơ đồ luồng chi tiết (sequence diagrams).

---

## 📂 Files

```
round9-agent-loop-event-flow/
├── README.md
├── checklist.md
├── quiz.md
├── PROGRESS.md
├── diagrams/
│   ├── agent-prompt-seq.mmd          (sequence: agent.prompt() flow)
│   ├── agent-continue-seq.mmd        (sequence: agent.continue() flow)
│   ├── inner-loop-detailed.mmd       (message → tools → steering)
│   ├── tool-executionSeq.mmd        (tool call to result)
│   └── state-transitions.mmd         (AgentState changes)
└── notes/
    ├── 01-prompt-vs-continue.md
    ├── 02-outer-inner-loops.md
    ├── 03-event-types-detailed.md
    ├── 04-tool-execution-flow.md
    ├── 05-steering-followup.md
    ├── 06-state-management.md
    ├── 07-transform-convert.md
    ├── 08-error-abort-handling.md
    └── 09-compaction-branching.md
```

---

## 📚 Sources

- `packages/agent/src/agent.ts`
- `packages/agent/src/agent-loop.ts`
- `packages/agent/src/types.ts` (AgentEvent, AgentMessage, etc.)
- `packages/coding-agent/docs/extensions.md` (events reference)
- `packages/agent/README.md`

---

## 📋 Checklist

- [ ] Phase 1: Đọc kỹ agent-loop.ts và agent.ts.
- [ ] Phase 2: Viết notes từng chủ đề (9 topics).
- [ ] Phase 3: Vẽ diagrams (5 sơ đồ).
- [ ] Phase 4: Tạo quiz (15-20 câu).
- [ ] Phase 5: Cập nhật PROGRESS, checklist.

---

**Tiến độ**: 0%
