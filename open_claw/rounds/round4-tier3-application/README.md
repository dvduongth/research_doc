# Round 4: Tier 3 - Application Layer (`pi-coding-agent`)
**Mục tiêu**: Hiểu sâu `@mariozechner/pi-coding-agent` - CLI + TUI interactive coding agent.

---

## 🎯 Mục tiêu chi tiết

1. **CLI Entry Point**: `pi` command, args parsing, modes (interactive, print, json, rpc).
2. **TUI Architecture**: Interactive mode UI components (header, messages, editor, footer).
3. **Resource Loading**: Skills, Extensions, Prompt Templates, Themes, Context Files (AGENTS.md, SYSTEM.md) - load order, override.
4. **Commands System**: Built-in commands (`/login`, `/model`, `/settings`, `/new`, `/resume`, `/tree`, `/fork`, `/compact`, ...), extension commands, skill commands, prompt templates.
5. **Session Management**: Session file storage, branching, compaction, forking, tree navigation (`/tree`).
6. **Settings**: Global (`.pi/agent/settings.json`) vs project (`.pi/settings.json`), key options.
7. **Extensions Discovery & Lifecycle**: How extensions are loaded, hot-reload (`/reload`), event registration.
8. **Customization**: Themes, prompt templates, skills, extensions - where to place, how they're discovered.
9. **Modes**: Interactive vs Print (`-p`) vs JSON (`--mode json`) vs RPC (`--mode rpc`).
10. **Package System**: `pi install`, `pi remove`, `pi update`, `pi config`.

---

## 📂 Nguồn dữ liệu

- `D:\PROJECT\CCN2\pi-mono\packages\coding-agent\`
- Files chính:
  - `README.md` (đã đọc)
  - `src/cli.ts` (entry point)
  - `src/core/` (resource-loader, session-manager, agent-runner, ...)
  - `src/modes/interactive/` (TUI components)
  - `src/commands/` (command implementations)
  - `docs/` (sessions.md, compaction.md, tree.md, settings.md, extensions.md, skills.md, prompt-templates.md, themes.md, packages.md, rpc.md, json.md, ...)

---

## 📋 Checklist

- [ ] **CLI & Modes**:
  - [ ] `pi` command entry (src/cli.ts)
  - [ ] Args: `-p`, `--mode`, `--session`, `-c`, `-r`, `--tools`, `--extension`, `--skill`, `--prompt-template`, `--theme`, `--no-*`
  - [ ] Modes: interactive (default), print, json, rpc.
  - [ ] Environment variables: `PI_CODING_AGENT_DIR`, `PI_PACKAGE_DIR`, `PI_SKIP_VERSION_CHECK`, `PI_CACHE_RETENTION`.

- [ ] **TUI Structure**:
  - [ ] Layout: header, messages, editor, footer.
  - [ ] Keybindings (Ctrl+C, Ctrl+L, Ctrl+P, etc.)
  - [ ] Message display (user, assistant, tool calls, errors)
  - [ ] Tool output expansion (Ctrl+O)
  - [ ] Thinking blocks collapse (Ctrl+T)

- [ ] **Resource Loading**:
  - [ ] `DefaultResourceLoader` load order:
    - Skills (`.pi/skills/`, `~/.pi/agent/skills/`, parent dirs)
    - Extensions (`.pi/extensions/`, `~/.pi/agent/extensions/`)
    - Prompt templates (`.pi/prompts/`, `~/.pi/agent/prompts/`)
    - Context files: `AGENTS.md` (or `CLAUDE.md`) from cwd up to root
    - System prompt: `.pi/SYSTEM.md` (project), `~/.pi/agent/SYSTEM.md` (global), `APPEND_SYSTEM.md`
  - [ ] Override options: `skillsOverride`, `extensionsOverride`, `agentsFilesOverride`, `promptsOverride`.
  - [ ] Discovery vs explicit load (`--extension`, `-e`).

- [ ] **Commands**:
  - [ ] Built-in commands list (from README: `/login`, `/logout`, `/model`, `/scoped-models`, `/settings`, `/resume`, `/new`, `/name`, `/session`, `/tree`, `/fork`, `/compact`, `/copy`, `/export`, `/share`, `/reload`, `/hotkeys`, `/changelog`, `/quit`).
  - [ ] Extension commands: `registerCommand(name, {description, handler, getArgumentCompletions?})`.
  - [ ] Skill commands: `/skill:name`
  - [ ] Prompt template commands: `/templatename`
  - [ ] Command resolution order (extensions first, then templates, then skills).

- [ ] **Session Management** (coding-agent's SessionManager):
  - [ ] Already covered in Round 3? But need to see how CLI uses it.
  - [ ] Session file format (JSONL) - đã học.
  - [ ] Commands affecting sessions: `/new`, `/resume`, `/fork`, `/tree`, `/compact`.
  - [ ] Auto-save to `~/.pi/agent/sessions/--<path>--/`.

- [ ] **Settings**:
  - [ ] Global: `~/.pi/agent/settings.json`
  - [ ] Project: `.pi/settings.json`
  - [ ] Important options: `thinkingLevel`, `theme`, `transport`, `toolConcurrency`, `compaction`, `models` (scoped), `extensions` (enable/disable), `skills`, `prompts`, `themes`.
  - [ ] `/settings` command opens editor.

- [ ] **Extensions Lifecycle**:
  - [ ] Discovery paths.
  - [ ] Loading via `jiti` (TypeScript direct).
  - [ ] Hot-reload `/reload` - how it works (unload old, load new, session_shutdown / session_start events).
  - [ ] Extension API (`ExtensionAPI`) methods.
  - [ ] Extension commands vs built-in commands.

- [ ] **Themes & Styling**:
  - [ ] Built-in: `dark`, `light`.
  - [ ] Theme structure (colors, styles).
  - [ ] Hot-reload themes.

- [ ] **Package Management**:
  - `pi install <source>` (npm, git, URL, SSH)
  - `pi remove`, `pi list`, `pi update`
  - `pi config` enable/disable package resources
  - Install locations: global vs project-local (`-l`)

- [ ] **Modes Details**:
  - Print mode (`-p`): non-interactive, output to stdout.
  - JSON mode (`--mode json`): event stream as JSON lines.
  - RPC mode (`--mode rpc`): stdin/stdout protocol for external integration.

- [ ] **RPC Protocol** (if time): `docs/rpc.md`.

---

## 📍 Files cần đọc (priority)

| # | File | Mục tiêu |
|---|------|----------|
| 1 | `src/cli.ts` | Entry point, args parsing, mode selection |
| 2 | `src/core/resource-loader.ts` | Resource loading logic |
| 3 | `src/core/agent-runner.ts` | Kết nối Agent với TUI, session management |
| 4 | `src/modes/interactive/interactive-mode.ts` | TUI setup, event handling |
| 5 | `src/modes/interactive/components/` | TUI components: messages, tool execution, editor, footer |
| 6 | `src/commands/` | Command implementations |
| 7 | `docs/settings.md` | Settings schema |
| 8 | `docs/packages.md` | Package management |
| 9 | `docs/rpc.md` | RPC protocol (optional) |
| 10 | `docs/json.md` | JSON mode |

---

**Tiến độ**: Chưa bắt đầu.

---

*File này sẽ update khi tiến độ thay đổi.*