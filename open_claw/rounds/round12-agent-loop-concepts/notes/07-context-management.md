# Context Management
**Round 12: Agent Loop - Core Concepts**

---

## The Context Problem

LLMs have context windows (token limits). As conversation progresses, the `messages` array grows. Without management, the agent will eventually exceed the model's capacity, causing errors or truncated context.

---

## Compaction

Compaction is the process of **summarizing** old parts of the conversation and replacing them with a concise summary, thereby freeing tokens while preserving essential information.

- **Where implemented**: Application layer (SessionManager), not in pi-agent core.
- **Trigger**: Automatic when token count exceeds threshold, or manual (`/compact`).
- **Mechanism**:
  - Generate a summary of messages up to a certain point (e.g., first N turns).
  - Create a new `AssistantMessage` (or perhaps `UserMessage`) containing the summary.
  - Mark older messages as pruned; they are excluded from future context builds.
  - Store a `CompactionEntry` in the session file (JSONL) referencing the summary and the first kept message.
- **Effect on agent**: When the session manager builds the context for a new run, it includes the summary message instead of all the old messages. The agent sees the summary as just another message; it is unaware that compaction occurred.

---

## Branching

Branching allows the conversation to have a **tree structure**: you can go back to a previous point and continue, creating a new branch (alternate timeline).

- **Implementation**: Session file uses `parentId` to link entries. The "leaf" is the current point.
- **Navigation**: User can pick an entry (e.g., via `/tree` command), and the session manager sets that entry as the new leaf. New messages will have that entry as parent, creating a branch.
- **Fork**: Create an entirely new session file starting from a chosen entry.
- **Agent impact**: The agent always sees a linear sequence from the session manager, which can reconstruct any branch by walking parent links. The agent's `messages` array in a run corresponds to one branch path.

---

## Retrieval-Augmented Generation (RAG)

Skills or extensions can provide **contexts** that allow the agent to retrieve external documents on-demand. For example, a `context` could be a vector store collection.

- During a turn, before calling the LLM, the agent might:
  - Detect need for retrieval (via tool call or hook).
  - Call a retrieval tool (e.g., `search_docs`) which returns relevant passages.
  - Those passages become `ToolResultMessage` or are injected directly into the message array (via `transformContext`).
- The `transformContext` hook can be used to automatically perform retrieval based on recent queries (query expansion, embedding similarity) and inject results.
- The `context` event allows modifying LLM messages to include retrieved snippets.

---

## Context Window Management Strategies

1. **Compaction**: Summarize old messages.
2. **Pruning**: Drop old messages without summarization (lossy).
3. **Windowing**: Keep only last N messages.
4. **Relevance-based**: Keep messages that are semantically relevant to current query; drop others. Requires vector search.
5. **Manual**: User explicitly clears or edits history.

The pi-agent core does not implement these; the application (SessionManager) does. Extensions can also implement custom logic via `transformContext`.

---

## Message Types and Context

The `messages` array contains:
- User messages (user input).
- Assistant messages (model responses, may include tool calls).
- Tool result messages (results of tool execution).
- Summary messages (from compaction).
- Possibly custom messages.

All are included in the context sent to the LLM (unless `transformContext`/`convertToLlm` filters them). The order is chronological (plus any reorganizations from branching).

---

## Context Building Process (Application Layer)

When starting a new agent run (via `prompt()` or `continue()`), the application:

1. Determines the current leaf of the session tree.
2. Walks backwards from leaf to root (or to the most recent summary) gathering entries.
3. Orders them chronologically (oldest to newest).
4. Converts each entry to an `AgentMessage` (some entries are system, label, etc.).
5. Optionally includes a summary message if compaction exists.
6. Builds `AgentContext` with this `messages` array and passes to `agent._runLoop`.

---

## Context Size and Token Limits

The agent does not count tokens itself. The application may need to ensure the built context fits within the model's limit. If not, it can:
- Trigger compaction before starting.
- Prune more aggressively.
- Switch to a model with larger context.

pi-agent will still accept a large `messages` array; the provider API may reject if it exceeds limit. So it's the application's responsibility to respect limits (or rely on provider's truncation, which is undesirable).

---

## Context Modifications During Run

During a run, new messages (assistant, tool results, and any injected via steering/follow-up) are appended to `context.messages`. This array grows throughout the run. At the end, `newMessages` (those generated during the run) are appended to persistent session.

---

## Context and Tool Calls

Tool calls appear in assistant messages. Their results (toolResult messages) are added to context immediately after execution. Thus, the context seen by the assistant in subsequent turns will include all prior tool results. That's how the assistant can refer back to previous tool outputs.

---

## Context and Steering

Steering messages (user) are injected into context before the next assistant generation. They appear like normal user messages. This allows the user to change direction based on what has happened so far (including tool results just added).

---

## Context and MCP (Model Context Protocol)

pi-agent supports MCP? Not directly, but the idea of external context injection via `transformContext` is similar to MCP's `sampling` and `resources`. An extension could implement an MCP client and inject retrieved resources via `transformContext`.

---

## Debugging Context Issues

If the agent "forgets" something, check:
- Is the relevant message in `context.messages`? Use `agent.state.messages` to inspect.
- Did a compaction remove it? Check session history for summaries.
- Is the message filtered out by `convertToLlm`? That could drop custom types.
- Is the token count too high causing truncation by provider? Inspect provider request payload (via `before_provider_request` hook or logging).

---

## Best Practices

- Keep context lean: use compaction to summarize old turns.
- Use `transformContext` to inject retrieved docs just-in-time.
- Avoid storing large blobs in messages (e.g., base64 images); compress or reference by URL.
- Monitor `messages.length` and token usage (estimate).

---

## Summary

Context management is a cross-cutting concern: the agent provides hooks and events, but the heavy lifting (compaction, branching) is done by the application. This separation keeps the agent core simple and reusable.

---

**End of context management**.
