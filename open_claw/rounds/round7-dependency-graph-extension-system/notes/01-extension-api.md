# Extension API & ExtensionContext
**Round 7: Dependency Graph - Extension System**

---

## ExtensionAPI (provided to extensions)

Extension exports default function: `export default function (pi: ExtensionAPI) { ... }`

### Event Subscription

```typescript
pi.on(event: string, handler: (event: any, ctx: ExtensionContext) => Promise<void> | void)
```

Chỉ định handler cho event. Handlers chạy theo thứ tự load. Một số handler có thể return giá trị để modify flow (xem events).

### Tools

- `pi.registerTool(toolDef: AgentTool<any>)`: Đăng ký custom tool.
  - Tool definition: name, label, description, promptSnippet?, promptGuidelines?, parameters (Type.Object), execute, renderCall?, renderResult?
  - `execute(toolCallId, params, signal, onUpdate, ctx)`: trả về `{ content, details }`. Throw error để isError.
- `pi.getActiveTools(): string[]` – tên active tools.
- `pi.getAllTools(): AgentTool[]` – tất cả tools (built-in + custom).
- `pi.setActiveTools(names: string[])`: enable/disable tools.

### Commands

- `pi.registerCommand(name: string, options: { description?, handler, getArgumentCompletions? })`
- `pi.getCommands(): CommandInfo[]` – all slash commands (extension, template, skill).

### Shortcuts & Flags

- `pi.registerShortcut(shortcut: string, options: { description, handler })`
- `pi.registerFlag(name: string, options: { description, type, default })`
- `pi.getFlag(name: string): any`

### Providers

- `pi.registerProvider(name: string, config: ProviderConfig)`: thêm hoặc override provider.
- `pi.unregisterProvider(name: string)`: xóa provider.

### Messages & Session

- `pi.sendMessage(message: CustomMessage, options?: { triggerTurn?, deliverAs? })`
  - `deliverAs`: "steer", "followUp", "nextTurn"
- `pi.sendUserMessage(content: string | ContentArray, options?: { deliverAs? })`
- `pi.appendEntry(customType: string, data?: any)`: persist state.
- `pi.setSessionName(name: string)`
- `pi.getSessionName(): string | undefined`
- `pi.setLabel(entryId: string, label: string | undefined)`

### Model & Thinking

- `pi.setModel(model: Model): Promise<boolean>` (false nếu no API key)
- `pi.getThinkingLevel(): ThinkingLevel`
- `pi.setThinkingLevel(level: ThinkingLevel)`

### Actions

- `pi.compact(options?: { customInstructions?, onComplete?, onError? })`
- `pi.reload()`: reload extensions, skills, prompts, themes.
- `pi.shutdown()`: request graceful shutdown.
- `pi.exec(command: string, args: string[], options?: { signal, timeout }): Promise<{ stdout, stderr, code, killed }>`

### Events Bus

- `pi.events.on(event: string, listener: (data:any) => void)`
- `pi.events.emit(event: string, data?: any)`

### Utilities

- `pi.getSystemPrompt(): string`
- `pi.setActiveTools(names)`, `pi.getActiveTools()`, `pi.getAllTools()`

---

## ExtensionContext

Provided to event handlers, tool execute, command handlers.

### UI (`ctx.ui`)

**Dialogs** (async, return value):
- `select(title, options): Promise<string | undefined>`
- `confirm(title, message, options?): Promise<boolean>`
- `input(title, placeholder?): Promise<string | undefined>`
- `editor(title, initial?): Promise<string>`

**Notifications** (fire-and-forget):
- `notify(message, type?)` – type: "info"|"warning"|"error"

**Status & Widgets**:
- `setStatus(id: string, text: string | undefined)` – footer status
- `setWidget(id, content, options?)` – widget above/below editor
- `setFooter(component | undefined)`
- `setTitle(title: string)`

**Editor**:
- `setEditorText(text: string)`
- `getEditorText(): string`
- `pasteToEditor(text: string)`
- `setEditorComponent(componentFactory | undefined)` – custom editor
- `getToolsExpanded(): boolean`
- `setToolsExpanded(expanded: boolean)`

**Theme**:
- `getAllThemes(): ThemeInfo[]`
- `getTheme(name: string): Theme | undefined`
- `setTheme(name | theme): Promise<{ success: boolean; error?: string }>`
- `theme` property: current Theme object with `fg`, `bg`, bold, italic, etc.

**Custom**:
- `custom<T>(componentFactory, options?): Promise<T>` – modal component
- `registerMessageRenderer(customType, renderer)`

**Checks**:
- `hasUI: boolean` – false in print/json mode.

### Session & Model

- `ctx.sessionManager`: read-only SessionManager (entries, branch, leafId, getLabel, etc.)
- `ctx.modelRegistry`: access to all models
- `ctx.model`: current model
- `ctx.getContextUsage(): { tokens, details } | undefined`

### Flow Control

- `ctx.isIdle(): boolean`
- `ctx.abort(): void`
- `ctx.hasPendingMessages(): boolean`
- `ctx.waitForIdle(): Promise<void>` (only in command context)

### Session Commands (ExtensionCommandContext)

- `ctx.newSession(options?): Promise<{ cancelled: boolean }>`
- `ctx.fork(entryId): Promise<{ cancelled: boolean }>`
- `ctx.navigateTree(targetId, options?): Promise<{ cancelled: boolean }>`
- `ctx.reload(): Promise<void>` (emits session_shutdown, reloads resources)
- `ctx.compact(options)` (same as pi.compact)

### Misc

- `ctx.cwd: string`
- `ctx.shutdown()` – request shutdown

---

## Notes

- Extensions can import from `@mariozechner/pi-coding-agent`, `@mariozechner/pi-agent-core`, `@mariozechner/pi-ai`, `@mariozechner/pi-tui`.
- Node built-ins available.
- NPM dependencies supported via `package.json` in extension directory.
- Extensions run in same process; no sandbox. Trust extensions.

---

**End of API reference**. For detailed event list, see `02-extension-events.md`.
