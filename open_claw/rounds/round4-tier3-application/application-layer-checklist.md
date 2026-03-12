# Round 4 Checklist: Tier 3 Application Layer (`pi-coding-agent`)
**Đánh dấu [x] khi đã hiểu.**

---

## ✅ CLI & Modes

- [ ] `src/cli.ts` entry point: parse args, select mode.
- [ ] Args: `-p` (print), `--mode` (interactive|json|rpc), `--session`, `-c` (continue), `-r` (resume), `--tools`, `--no-tools`, `--extension`, `--no-extensions`, `--skill`, `--no-skills`, `--prompt-template`, `--no-prompt-templates`, `--theme`, `--no-themes`, `--provider`, `--model`, `--api-key`, `--thinking`, `--models`, `--list-models`, `--system-prompt`, `--append-system-prompt`, `--verbose`, `-h`, `-v`.
- [ ] Environment variables: `PI_CODING_AGENT_DIR`, `PI_PACKAGE_DIR`, `PI_SKIP_VERSION_CHECK`, `PI_CACHE_RETENTION`.
- [ ] Modes:
  - Interactive (default): full TUI.
  - Print (`-p`): non-interactive, print response, exit.
  - JSON (`--mode json`): event stream as JSON lines.
  - RPC (`--mode rpc`): stdin/stdout protocol for integration.

---

## ✅ TUI Architecture

- [ ] Layout: header (shortcuts, loaded resources), messages (conversation), editor (input), footer (cwd, session, tokens, cost, model).
- [ ] Keybindings: Ctrl+C, Ctrl+L (model), Ctrl+P (cycle models), Shift+Tab (thinking level), Ctrl+O (expand tools), Ctrl+T (collapse thinking), etc.
- [ ] Message rendering: user, assistant, tool calls (expandable), errors.
- [ ] Editor features: `@` file reference, Tab completion, multi-line (Shift+Enter), image paste (`Ctrl+V`), `!`/`!!` bash commands.
- [ ] Colors/themes integration.

---

## ✅ Resource Loading

- [ ] `DefaultResourceLoader`:
  - Skills: `.pi/skills/`, `~/.pi/agent/skills/`, parent directories.
  - Extensions: `.pi/extensions/`, `~/.pi/agent/extensions/`.
  - Prompt templates: `.pi/prompts/`, `~/.pi/agent/prompts/`.
  - Context files: `AGENTS.md` (or `CLAUDE.md`) - concatenated from cwd up.
  - System prompt: `.pi/SYSTEM.md` (project), `~/.pi/agent/SYSTEM.md` (global), `APPEND_SYSTEM.md`.
- [ ] Override options: `skillsOverride`, `extensionsOverride`, `agentsFilesOverride`, `promptsOverride`.
- [ ] Discovery order: extensions first, then templates, then skills.
- [ ] Hot-reload (`/reload`) - what gets reloaded.

---

## ✅ Commands System

- [ ] Built-in commands (list from README).
- [ ] Extension commands: `pi.registerCommand(name, {description, handler, getArgumentCompletions?})`.
- [ ] Skill commands: `/skill:name` (auto-discovered).
- [ ] Prompt template commands: `/templatename`.
- [ ] Command resolution order: extensions → templates → skills → built-in (some built-in handled specially in interactive mode).
- [ ] RPC `get_commands` includes extensions, templates, skills (not built-in interactive).

---

## ✅ Session Management (Application Layer)

- [ ] Session file location: `~/.pi/agent/sessions/--<path>--/`.
- [ ] Auto-save after each turn.
- [ ] Commands:
  - `/new`: create new session (`session_before_switch` → `session_switch`).
  - `/resume`: list and select session.
  - `/fork`: create new session from current branch (`session_before_fork` → `session_fork`).
  - `/tree`: navigate tree (`session_before_tree` → `session_tree`).
  - `/compact`: manual compaction (`session_before_compact` → `session_compact`).
- [ ] SessionManager usage in CLI: `SessionManager.continueRecent()`, `newSession()`, etc.

---

## ✅ Settings

- [ ] Global: `~/.pi/agent/settings.json`
- [ ] Project: `.pi/settings.json` (overrides global)
- [ ] Common options:
  - `thinkingLevel` (default off)
  - `theme` (dark/light)
  - `transport` (sse/websocket/auto)
  - `toolConcurrency`
  - `compaction` settings
  - `models` (scoped for Ctrl+P)
  - Extensions/skills/prompts/themes enable/disable lists
- [ ] `/settings` command opens editor to edit JSON.

---

## ✅ Extensions Lifecycle (Application Perspective)

- [ ] Discovery paths (global & project).
- [ ] Loading: `jiti` compile on load.
- [ ] Hot-reload `/reload`: emits `session_shutdown` to old runtime, then loads fresh resources, emits `session_start` and `resources_discover`.
- [ ] Extension commands available immediately after load.
- [ ] Tools registered via `pi.registerTool()` become active instantly.
- [ ] `ctx.ui` methods work only in interactive/RPC modes; in print/JSON they are no-ops.

---

## ✅ Themes

- [ ] Built-in: `dark`, `light`.
- [ ] Theme file structure (colors, styles).
- [ ] Hot-reload: modify theme file → immediate apply.
- [ ] Custom themes placed in `.pi/themes/` or `~/.pi/agent/themes/`.

---

## ✅ Package Management

- [ ] `pi install <source>`: npm, git, URL, SSH.
- [ ] `pi remove <source>`.
- [ ] `pi update` (skips pinned).
- [ ] `pi list` (installed packages).
- [ ] `pi config`: enable/disable package resources (extensions, skills, prompts, themes).
- [ ] Install locations: global (`~/.pi/agent/git/`, global npm) vs project-local (`.pi/git/`, `.pi/npm/`) with `-l` flag.
- [ ] Package manifest: `package.json` with `pi` key.

---

## ✅ RPC & JSON Modes

- [ ] RPC: LF-delimited JSONL, protocol docs (`docs/rpc.md`).
- [ ] JSON mode: event stream to stdout, useful for debugging.
- [ ] `--mode rpc` for process integration (e.g., OpenClaw).
- [ ] Extension UI in RPC: works via sub-protocol.

---

## ✅ Special Features

- [ ] `!` and `!!` bash commands.
- [ ] File reference `@` in editor.
- [ ] Image paste.
- [ ] Message queue: Enter (steering), Alt+Enter (follow-up).
- [ ] Compaction automatic & manual.
- [ ] Branching with `/tree`.
- [ ] Label entries for bookmarks.
- [ ] Session naming (`/name`).
- [ ] Export to HTML (`/export`).
- [ ] Share as GitHub gist (`/share`).

---

**Lưu ý**: Round 4 là lớn nhất, bao gồm toàn bộ UI, commands, resource loading. Có thể cần nhiều thời gian đọc các file trong `src/` và `docs/`.
