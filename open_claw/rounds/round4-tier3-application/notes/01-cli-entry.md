# CLI Entry & Modes

## 📦 Entry Point

`pi` command là wrapper quanh `main()` trong `src/main.ts`.

- `src/cli.ts`: chỉ gọi `main(process.argv.slice(2))`.
- `src/main.ts`: xử lý args, session resolution, package commands, và tạo agent session.

---

## 🛠️ Arguments (từ `src/cli/args.ts`)

**Main args**:
- `-p, --print`: Print mode (non-interactive, output to stdout)
- `--mode <mode>`: interactive (default), json, rpc
- `--session <file>`: Load specific session file
- `-c, --continue`: Continue most recent session automatically
- `-r, --resume`: Show session picker on startup
- `--tools, --no-tools`: Enable/disable built-in tools
- `--extension, --no-extensions`: Enable/disable extensions
- `--skill, --no-skills`: Enable/disable skills
- `--prompt-template, --no-prompt-templates`: Enable/disable prompt templates
- `--theme, --no-themes`: Enable/disable themes
- `--provider <provider>`: Shortcut to set provider
- `--model <model>`: Shortcut to set model
- `--api-key <key>`: Provide API key directly
- `--thinking <level>`: Set thinking level (off, minimal, low, medium, high, xhigh)
- `--models`: List available models and exit
- `--list-models`: Alias for `--models`
- `--system-prompt <text>`: Override system prompt
- `--append-system-prompt <text>`: Append to system prompt
- `--verbose`: Enable verbose logging
- `-h, --help`: Show help
- `-v, --version`: Show version

**Package commands**:
- `pi install <source> [-l]`
- `pi remove <source> [-l]`
- `pi update [source]`
- `pi list`

---

## 🌍 Environment Variables

- `PI_CODING_AGENT_DIR`: Override global agent dir (default `~/.pi/agent`).
- `PI_PACKAGE_DIR`: Override global package storage dir.
- `PI_SKIP_VERSION_CHECK`: Skip git dirty check.
- `PI_CACHE_RETENTION`: `short` (default) or `long` – affects Anthropic/OpenAI cache TTL.

---

## 🎮 Modes

### Interactive (default)

- Full TUI (terminal UI) với `@mariozechner/pi-tui`.
- Có editor, messages display, footer status.
- Commands, keybindings, auto-completion.

### Print (`-p`)

- Non-interactive.
- Đọc input từ stdin hoặc args.
- Gọi agent, print response, exit.
- Dùng cho scripts, pipelines.

### JSON (`--mode json`)

- Event stream dưới dạng JSON lines on stdout.
- Dùng để debug, hoặc external integration.

### RPC (`--mode rpc`)

-stdin/stdout protocol với JSON-RPC-like message.
- Dùng cho external integration (như OpenClaw).
- Extension UI hoạt động qua sub-protocol.

---

## 🔄 Startup Flow (main.ts)

1. Parse args.
2. Show help/version nếu cần.
3. Handle package commands (install, remove, update, list).
4. Determine mode (interactive/print/json/rpc).
5. Load settings (global + project).
6. Run migrations.
7. Show deprecation warnings.
8. Setup theme watcher.
9. Load resources:
   - Extensions
   - Skills
   - Prompt templates
   - Context files (AGENTS.md)
   - System prompt ( SYSTEM.md, APPEND_SYSTEM.md )
10. Create AgentSession via `createAgentSession()` (from `core/sdk.ts`).
11. Determine initial message (from stdin, file args, or interactive).
12. Resolve session (continue, resume, new, or specific file).
13. Run selected mode:
    - `runPrintMode()`
    - `runRpcMode()`
    - `new InteractiveMode().run()`
14. Shutdown: stop theme watcher, print timings.

---

**Lưu ý**: `main.ts` là trung tâm điều phối. Nó kết nối tất cả: args, settings, resource loading, extensions, SDK, và modes.
