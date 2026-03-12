# Extension Architecture & Implications
**Round 7: Dependency Graph - Extension System**

---

## Kiến trúc tổng thể

```
┌─────────────────────────────────────────────────────────────┐
│                    Extension Host (pi-coding-agent)         │
├─────────────────────────────────────────────────────────────┤
│  ResourceLoader discovers extensions from paths           │
│  └─ jiti loads TypeScript modules                         │
│      └─ Calls default function with ExtensionAPI         │
│          └─ Registers tools, commands, event handlers    │
│              └─ Uses APIs from pi-coding-agent,           │
│                 pi-agent-core, pi-ai, pi-tui              │
├─────────────────────────────────────────────────────────────┤
│  EventBus dispatches events to all registered handlers   │
│  SessionManager persists entries (including custom)      │
│  Agent (pi-agent-core) runs the loop, emits events       │
│  LLM (pi-ai) streams responses, tool calls               │
└─────────────────────────────────────────────────────────────┘
```

Extensions là plug-ins, không phải separate processes. Chúng chạy trong cùng event loop với agent.

---

## Dependencies của Extensions

Extensions import trực tiếp từ các pi packages:

```typescript
import { ExtensionAPI, isToolCallEventType } from "@mariozechner/pi-coding-agent";
import { StringEnum } from "@mariozechner/pi-ai";
import { Text, Component } from "@mariozechner/pi-tui";
```

Typical dependencies:
- **pi-coding-agent**: types, some utils (truncate, highlightCode).
- **pi-ai**: StringEnum, model types.
- **pi-tui**: UI components (Text, Box, SelectList, etc.).
- **pi-agent-core**: ít hơn, nhưng có thể dùng `AgentTool` type.

**Implications**:
- Extensions phụ thuộc vào các pi packages. Khi publish extension như package, cần `peerDependencies` hoặc `dependencies` trên các pi packages.
- Khi chạy, jiti resolve imports từ node_modules của extension (nếu có) hoặc từ host app's node_modules (nếu extension nằm trong host's project).
- Nếu extension có npm dependencies, phải `npm install` trong thư mục extension.

---

## Security Considerations

- **Arbitrary code execution**: Extensions chạy với đặc quyền của user. Chỉ install từ sources đáng tin.
- **No sandbox**: Extensions có thể đọc/write files, gọi network, spawn processes.
- **Event hijacking**: Extension có thể block tool calls, modify system prompt, intercept messages.
- **Recommendations**:
  - Review extension code trước khi install.
  - Use trusted registry (clawhub.com) với review.
  - Cân nhắc implement signing/verification trong tương lai.

---

## Performance

- Extensions loaded tại startup (hoặc `/reload`), ảnh hưởng đến thời gian khởi động.
- Số lượng extensions lớn có thể làm chậm event handling (tất cả handlers chạy mỗi event).
- Tools registered bởi extensions vào system prompt – nhiều tools làm prompt dài, tốn tokens.
- UI customizations (widgets, status) render mỗi frame – heavy components có thể giảm FPS.

---

## State Management & Branching

Extensions với state nên:
- Lưu state trong tool result `details` hoặc `pi.appendEntry()`.
- Reconstruct từ session entries khi `session_start`.
- Không dùng global variables vì reload sẽ mất; session entries persist.

Example pattern:

```typescript
let state = { count: 0 };

pi.on("session_start", async (_, ctx) => {
  state = { count: 0 };
  for (const entry of ctx.sessionManager.getBranch()) {
    if (entry.type === "message" && entry.message.role === "toolResult" && entry.message.toolName === "my_tool") {
      state = entry.message.details?.state ?? state;
    }
  }
});

pi.registerTool({
  name: "my_tool",
  execute(...) {
    state.count++;
    return { content: [...], details: { state } };
  },
});
```

---

## Testing Extensions

- Extensions có thể test bằng cách import trực tiếp, mock `ExtensionAPI`.
- Ví dụ: tạo object mock với `registerTool`, `on`, etc., rồi invoke extension function.
- Test event handlers bằng cách gọi trực tiếp với mock event và ctx.
- Để test trong pi thực tế, dùng `pi -e ./path.ts` để load extension single.

---

## Common Patterns

### Permission Gate

```typescript
pi.on("tool_call", async (event, ctx) => {
  if (event.toolName === "bash" && event.input.command.includes("rm -rf")) {
    const ok = await ctx.ui.confirm("Danger", "Allow rm -rf?");
    if (!ok) return { block: true, reason: "Denied by user" };
  }
});
```

### Logging

```typescript
pi.on("tool_execution_end", (event) => {
  console.log(`Tool ${event.toolName} completed in ${event.duration}ms`);
});
```

### Model-specific Setup

```typescript
pi.on("model_select", (event, ctx) => {
  if (event.model.provider === "anthropic") {
    pi.setThinkingLevel("high");
  }
});
```

### Auto-commit on exit

```typescript
pi.on("session_shutdown", async (_, ctx) => {
  await pi.exec("git", ["commit", "-am", "Auto-commit from pi"]);
});
```

---

## Limitations

- Extensions cannot spawn sub-agents directly? Actually they can use `pi.exec` to run another pi process, or use `pi-coding-agent` APIs to create agent? Not directly exposed. Could be added via `pi.registerProvider` for external agent service.
- No built-in extension marketplace (yet). Users manually install.
- No versioning of extensions (unless as package). `/reload` always loads latest.

---

## Future Directions

- Sandboxing (worker threads, vm contexts) for security.
- Extension signing and verification.
- Extension dependencies resolution (like plugins).
- Extension UI components library.
- Extension debugging tools (logs, breakpoints).

---

**Conclusion**: Extension system is powerful,灵活, và deeply integrated. Hiểu rõ lifecycle, events, và dependencies là chìa khóa để build robust extensions.
