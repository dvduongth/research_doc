# Compaction & Branching
**Round 9: Agent Loop Event Flow**

---

## Location: Application Layer

Compaction and branching are **not** part of `pi-agent-core`. They are implemented in the application layer (`pi-coding-agent`) by the `SessionManager`. The agent loop is unaware of these mechanisms; it simply receives a context (`AgentContext`) containing a sequence of messages.

---

## SessionManager Responsibilities

- **Session file**: JSONL file where each line is an entry (header, message, compaction, branch summary, label, custom).
- **Branching**: The file represents a tree via `parentId` references. The current "leaf" is the latest entry.
- **Compaction**: When context grows too large (token count exceeds threshold), the session can create a summary of old messages and prune them.
- **Context building**: When starting a new agent run (via `prompt()` or `continue()`), the application builds the `AgentContext.messages` by walking from the current leaf back to the root (or a summary point), applying any compaction summaries.

---

## Branching

**How**:
- User uses `/tree` to navigate to a previous entry.
- The session manager creates a new "leaf" by branching from that entry: it adds a `BranchSummaryEntry` (or directly switches context). Actually, `/tree` allows picking an entry; the app then sets the current leaf to that entry's ID. New messages after that will have `parentId` pointing to the chosen entry, effectively creating a new branch.
- `/fork` creates a new session file with the selected entry as the root.

**Agent impact**: The agent doesn't know about branches; it just sees a linear sequence of messages from the session manager. However, the `AgentMessage` objects may come from different branches, and the `SessionManager` ensures context is built correctly (including branch summaries if needed).

---

## Compaction

**When**: Automatic or manual (via `/compact`). The session manager decides when to compact based on token usage.

**What**:
- The session manager generates a summary of the conversation up to a certain point.
- It creates a `CompactionEntry` in the session file containing the summary and the ID of the first kept entry.
- Old entries (before `firstKeptEntryId`) are considered pruned; they are not included in future context builds unless the user navigates to that branch.

**Agent impact**: When the session manager builds context for an agent run, it will include the summary message (if compaction exists) instead of all the old messages. The agent sees the summary as just another assistant message (or user? Actually compaction summary is usually an assistant-like message). The agent loop does not need to know it's a summary.

---

## Interaction with Agent Loop

- The agent loop processes messages exactly the same, regardless of whether they are original or summarized.
- Tool calls in summarized messages? Those would have been executed before compaction; their results are part of the old messages that got summarized, so the LLM won't see individual tool results, only the summary. That's fine because after compaction, those tools are in the past.
- Branching: if the user navigates to a past point, the session manager will rebuild context from that point onward along that branch. The agent loop then runs with that context. Any new messages will be appended to that branch.

---

## Events Related to Compaction & Branching

Extensions can hook into compaction and branching via events:

- `session_before_compact` / `session_compact`
- `session_before_tree` / `session_tree`
- `session_before_fork` / `session_fork`

These allow extensions to provide custom summaries, cancel operations, or augment behavior.

---

## Summary

- **Agent Loop**: Pure agent runtime; no knowledge of sessions, branches, compaction.
- **Session Manager**: Handles persistence, branching, compaction, and provides a linear message list to the agent loop.
- When you call `agent.prompt()` or `agent.continue()`, the application (CLI) has already built the `AgentContext.messages` from the session. The agent then runs its loop on that context.
- After the agent finishes, the application appends the new messages (and possibly other entries) to the session file.

Thus, the agent loop's view of the world is a simple linear conversation, possibly with tool calls and results. All tree complexity is abstracted away by the session manager.

---

**End of compaction & branching notes**.
