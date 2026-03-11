# Tổng hợp Cross-Cutting — Phân tích toàn cục pi-mono

> **Thời gian tìm hiểu ước lượng**: ~30–45 phút
>
> **Yêu cầu trước**: Đã đọc ít nhất [01-ai-package.md](./01-ai-package.md), [03-agent-package.md](./03-agent-package.md), và [05-coding-agent-package.md](./05-coding-agent-package.md)

---

## 1. Tổng quan dự án

**pi-mono** là AI agent toolkit của Mario Zechner (tác giả libGDX), ra đời từ sự thất vọng với độ phức tạp của Claude Code. Triết lý cốt lõi: **what you leave out matters more than what you put in** — system prompt dưới 1.000 tokens, 4 tools cơ bản (read, write, edit, bash), phần còn lại đến từ files trên disk.

Pi là engine đằng sau **OpenClaw** — dự án đạt 145.000+ GitHub stars trong 1 tuần đầu.

| Thông tin | Giá trị |
|-----------|---------|
| **Repository** | [github.com/badlogic/pi-mono](https://github.com/badlogic/pi-mono) |
| **Stars** | 22.1K+ |
| **Version** | 0.57.1 (lockstep) |
| **Ngôn ngữ** | TypeScript 96.6% |
| **License** | MIT |
| **Tác giả** | Mario Zechner |
| **Packages** | 7 |
| **Total TS files** | ~506 |
| **Total test files** | ~111 |

---

## 2. Dependency Graph — Đồ thị phụ thuộc

    ┌─────────────────────────────────────────────────────────────┐
    │                      Tier 3: ỨNG DỤNG                       │
    │                                                             │
    │  coding-agent ◄──── mom (Slack)    pods (GPU)               │
    │  (CLI pi)           │              │                        │
    │  263 files           │ 17 files     │ 9 files               │
    │  58 tests            │ 0 tests      │ 0 tests               │
    │  6.51M dl/m          │ 5.1K dl/m    │ N/A                   │
    └───────┬──────────────┼──────────────┼───────────────────────┘
            │              │              │
    ┌───────▼──────────────▼──────────────▼───────────────────────┐
    │                      Tier 2: LÕI                            │
    │                                                             │
    │  agent ◄──────────────────────── web-ui                     │
    │  (agent loop)                    (Web Components)           │
    │  13 files                        75 files                   │
    │  4 tests                         0 tests                    │
    │  6.57M dl/m                      7.5K dl/m                  │
    └───────┬──────────────────────────┬──────────────────────────┘
            │                          │
    ┌───────▼──────────────────────────▼──────────────────────────┐
    │                      Tier 1: NỀN TẢNG                       │
    │                                                             │
    │  ai ◄──────────────────────────── tui                       │
    │  (LLM API)                       (Terminal UI)              │
    │  79 files                        50 files                   │
    │  31 tests                        18 tests                   │
    │  6.7M dl/m                       6.6M dl/m                  │
    └─────────────────────────────────────────────────────────────┘

**Hướng phụ thuộc** (mũi tên = "phụ thuộc vào"):
- `coding-agent` → `agent` → `ai`
- `coding-agent` → `tui`
- `mom` → `coding-agent` → `agent` → `ai`
- `web-ui` → `ai` + `agent` (types) + `tui` (utils)
- `pods` → `agent` (types only)

**Quan sát**: Download count gần bằng nhau giữa ai/tui/agent/coding-agent (~6.5M) → cho thấy chúng được cài đặt cùng nhau (lockstep). web-ui (7.5K) và mom (5.1K) có adoption riêng biệt, thấp hơn nhiều.

---

## 3. Build System

### Compiler: tsgo

Pi-mono sử dụng **tsgo** — một TypeScript compiler thay thế (không phải `tsc` tiêu chuẩn). Đi kèm `@typescript/native-preview` v7.0.0 trong devDependencies.

    Build command: tsgo -p tsconfig.build.json
    Type check:    tsgo --noEmit
    Watch mode:    tsgo --watch --preserveWatchOutput

### TypeScript Config

| Setting | Giá trị |
|---------|---------|
| Target | ES2022 |
| Module | Node16 |
| Strict | true |
| Declaration | true (+ declarationMap + sourceMap) |
| Decorators | experimentalDecorators: true |

### Build Order (tuần tự, theo dependency)

    1. tui → 2. ai → 3. agent → 4. coding-agent → 5. mom → 6. web-ui → 7. pods

### Dev Mode (song song)

    concurrently: ai + agent + coding-agent + mom + web-ui + tui (6 processes)

---

## 4. Linting & Formatting: Biome

Pi-mono dùng **Biome v2.3.5** thay thế cả ESLint + Prettier. Không có ESLint, Prettier, hay linter khác.

| Setting | Giá trị | Ghi chú |
|---------|---------|---------|
| Indent style | Tab | |
| Indent width | 3 | Không phổ biến (thường 2 hoặc 4) |
| Line width | 120 | |
| noNonNullAssertion | off | Cho phép `!` operator |
| noExplicitAny | off | Cho phép `any` type |
| useConst | error | Bắt buộc dùng `const` |

**Chạy**: `npm run check` = `biome check --write --error-on-warnings . && tsgo --noEmit`

---

## 5. Testing: Vitest

| Package | Test files | Framework |
|---------|-----------|-----------|
| ai | 31 | vitest (testTimeout: 30s cho API calls) |
| tui | 18 | vitest |
| agent | 4 | vitest |
| coding-agent | 58 | vitest |
| web-ui | 0 | — |
| mom | 0 | — |
| pods | 0 | — |
| **Tổng** | **111** | |

**Chạy test** (từ thư mục package, KHÔNG từ root):

    cd packages/ai
    npx tsx ../../node_modules/vitest/dist/cli.js --run test/specific.test.ts

**Lưu ý từ AGENTS.md**: KHÔNG chạy `npm test` từ root — chạy test cụ thể từ package root.

---

## 6. CI/CD: GitHub Actions

### Pipeline chính (`.github/workflows/ci.yml`)

    Trigger: push/PR to main → cancel in-progress runs
    ─────────────────────────────────────────────────
    1. Checkout code
    2. Setup Node.js v22 + npm cache
    3. Install system deps (cairo, pango, fd-find, ripgrep)
    4. npm ci
    5. npm run build
    6. npm run check (tsgo + biome + browser smoke)
    7. npm test

### Workflows khác

| Workflow | Mục đích |
|----------|---------|
| `ci.yml` | Build + check + test |
| `build-binaries.yml` | Build pi CLI binary |
| `pr-gate.yml` | PR validation |
| `approve-contributor.yml` | Auto-approval logic |

---

## 7. Monorepo & Version Management

### Công cụ monorepo: npm workspaces

Không dùng Turborepo, Nx, hay Lerna. Chỉ npm workspaces + scripts thủ công.

### Lockstep Versioning

Tất cả 7 packages **luôn cùng version** (hiện tại: 0.57.1).

**Quy trình release**:

    1. npm run version:patch     ← bump version + sync-versions.js
    2. Cập nhật CHANGELOG.md     ← [Unreleased] → [0.57.1] - 2026-03-10
    3. git commit + git tag v0.57.1
    4. npm publish -ws --access public
    5. Thêm [Unreleased] mới vào CHANGELOG
    6. git commit + git push + git push --tags

**sync-versions.js**: Đọc tất cả package.json, verify cùng version, cập nhật internal dependencies thành `^X.Y.Z`.

### Changelog Format

    ## [Unreleased]
    ### Breaking Changes
    ### Added
    ### Changed
    ### Fixed
    ### Removed

---

## 8. Code Quality Rules (AGENTS.md)

AGENTS.md (~225 dòng) định nghĩa quy tắc cho AI agents khi làm việc với codebase:

### Quy tắc quan trọng nhất

| Quy tắc | Chi tiết |
|---------|---------|
| **KHÔNG inline imports** | Luôn dùng top-level imports, không `await import()` |
| **KHÔNG `any`** | Check node_modules trước khi dùng any |
| **KHÔNG hardcode keybindings** | Dùng configurable defaults |
| **Upgrade, không downgrade** | Fix type errors bằng upgrade dependency |
| **`npm run check` sau mỗi thay đổi** | Bắt buộc, fix TẤT CẢ errors/warnings |
| **KHÔNG `git add -A`** | Luôn add specific files |
| **KHÔNG `git reset --hard`** | Tránh mất code |

### Quy tắc Git (quan trọng cho parallel agents)

    ❌ git add -A / git add .
    ❌ git reset --hard
    ❌ git checkout .
    ❌ git stash / git clean -fd
    ✅ git add <specific-files>
    ✅ git status trước khi commit

---

## 9. So sánh tổng thể với ecosystem

### pi-mono vs Claude Code vs Aider vs Cursor

| Tiêu chí | pi-mono | Claude Code | Aider | Cursor |
|----------|---------|-------------|-------|--------|
| **Kiến trúc** | 7 packages, 3 tiers | Monolith | Single package | IDE plugin |
| **Open source** | MIT, 100% open | Partially closed | MIT, 100% open | Closed source |
| **LLM providers** | 22+ (mọi provider) | Anthropic only | 100+ | OpenAI, Anthropic |
| **System prompt** | <1.000 tokens | Multi-thousand tokens | Minimal | Framework-managed |
| **Extension system** | TypeScript extensions | Shell hooks | Không | Không |
| **UI options** | Terminal + Web + Slack | Terminal + IDE | Terminal | IDE |
| **Session branching** | Có | Không | Không | Không |
| **Web Components** | 32 components | Không | Không | Không |
| **Self-hosted LLM** | Có (pods package) | Không | Qua config | Không |
| **GitHub stars** | 22K | 47K+ | 39K | Closed |
| **Downloads** | 6.5M/month | N/A | 4.1M | N/A |
| **Triết lý** | Minimal, extensible | Feature-rich, integrated | Flexible, any model | Full IDE experience |

### Điểm khác biệt độc nhất của pi-mono

1. **Full-stack toolkit**: Từ LLM API → Agent framework → CLI → Web UI → Slack bot → GPU deployment — tất cả trong 1 repo
2. **Web Components**: Library UI chat AI framework-agnostic (32 components)
3. **Self-hosted LLM**: Package `pods` cho phép deploy vLLM trên GPU cloud
4. **Minimal system prompt**: <1.000 tokens, phần còn lại từ files trên disk
5. **Session branching**: Fork + tree navigation — tính năng hiếm

### Hạn chế so với ecosystem

1. **Cộng đồng nhỏ hơn**: 22K stars vs Claude Code 47K+, Aider 39K+
2. **Thiếu tests ở Tier 3**: web-ui (0), mom (0), pods (0)
3. **Documentation phân tán**: 23 doc files trong coding-agent, ít guides tổng hợp
4. **mini-lit dependency**: Framework Web Components riêng, cộng đồng nhỏ

---

## 10. Patterns kiến trúc xuyên suốt

### 10.1. Event-Driven Architecture

Mọi package sử dụng event-driven pattern:

| Package | Event System | Events |
|---------|-------------|--------|
| ai | EventStream (async iterable) | start, text_delta, toolcall_delta, done, error |
| agent | AgentEvent (14 types) | agent_start/end, turn_start/end, message_*, tool_* |
| coding-agent | EventBus | agent lifecycle + tool + session + input events |
| tui | Component callbacks | keypress, resize, focus |
| web-ui | Lit events | Agent events → UI updates |
| mom | Slack Socket Mode | app_mention, message events |

### 10.2. Registry Pattern

Đăng ký tính năng mới mà không sửa source code:

| Package | Registry | Mục đích |
|---------|----------|---------|
| ai | Provider registry | Thêm LLM providers |
| agent | CustomAgentMessages | Thêm message types (declaration merging) |
| web-ui | MessageRenderer registry | Render custom messages |
| web-ui | ToolRenderer registry | Render tool results |
| coding-agent | Extension runner | Tools, hooks, UI components |

### 10.3. Stream-First Design

Mọi LLM interaction đều streaming-first:

    ai:            streamSimple() → EventStream<AssistantMessageEvent>
    agent:         agentLoop() → EventStream<AgentEvent>
    coding-agent:  Agent.subscribe() → (event) => updateUI()
    web-ui:        StreamingMessageContainer → batched DOM updates
    mom:           Agent events → Slack chat.update() real-time

### 10.4. Pluggable Operations

Tools có thể chạy ở bất kỳ đâu qua Operations interface:

    interface ReadOperations {
      readFile: (path) => Promise<Buffer>
      access: (path) => Promise<void>
    }

    // Host machine → readFile = fs.readFile
    // Docker       → readFile = docker exec cat
    // SSH          → readFile = ssh cat
    // Browser      → readFile = fetch

### 10.5. Context at LLM Boundary

AgentMessage (phong phú, tùy chỉnh) → Message (chuẩn LLM) chỉ tại ranh giới gọi LLM:

    App layer:     AgentMessage[] (custom types, attachments, notifications)
                        │
                        ▼ convertToLlm()
    LLM boundary:  Message[] (user, assistant, toolResult — chỉ 3 roles)
                        │
                        ▼ streamSimple()
    LLM provider:  HTTP API call

---

## 11. Thống kê tổng hợp

| Package | TS Files | Tests | npm Downloads/month | Dependencies (internal) | Dependencies (external) |
|---------|----------|-------|--------------------|-----------------------|-----------------------|
| ai | 79 | 31 | ~6.7M | 0 | ~12 |
| tui | 50 | 18 | ~6.6M | 0 | 4 |
| agent | 13 | 4 | ~6.57M | 1 (ai) | 0 |
| web-ui | ~75 | 0 | ~7.5K | 3 (ai, agent, tui) | ~8 |
| coding-agent | ~263 | 58 | ~6.51M | 4 (ai, agent, tui, jiti) | ~15 |
| mom | 17 | 0 | ~5.1K | 3 (ai, agent, coding-agent) | ~6 |
| pods | 9 | 0 | N/A | 1 (agent types) | 1 (chalk) |
| **Tổng** | **~506** | **111** | | | |

---

## 12. Kết luận

Pi-mono là một **full-stack AI agent toolkit** hiếm có — bao phủ từ LLM abstraction (Tier 1) → agent framework (Tier 2) → ứng dụng hoàn chỉnh (Tier 3). Điểm mạnh nằm ở:

1. **Kiến trúc phân tầng rõ ràng**: 3 tiers, dependency flow một chiều (trên xuống dưới)
2. **Triết lý minimal**: System prompt <1.000 tokens, agent loop ~1.150 dòng, mọi thứ composable
3. **Extensibility**: Registry patterns + TypeScript extensions + pluggable operations
4. **Full-stack coverage**: Từ GPU deployment → LLM API → Agent → CLI + Web + Slack

Điểm yếu cần cải thiện:
1. **Testing gaps**: 3/7 packages không có tests (web-ui, mom, pods)
2. **Documentation**: Nhiều doc files nhưng phân tán, thiếu unified guide
3. **Community**: Nhỏ hơn Claude Code và Aider
4. **mini-lit dependency**: Framework riêng cho web-ui, ít được áp dụng ngoài ecosystem
