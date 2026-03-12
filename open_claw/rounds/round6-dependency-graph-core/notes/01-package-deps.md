# Round 6: Package Dependencies - Core Packages
**Ngày**: 2026-03-12
**Sources**: `packages/*/package.json`

---

## 📦 @mariozechner/pi-coding-agent (Tier 3)

**Path**: `packages/coding-agent/package.json`

### Dependencies (pi packages)

| Package | Version | Mục đích |
|---------|---------|----------|
| `@mariozechner/pi-agent-core` | ^0.57.1 | Agent runtime (state, event loop, tools) |
| `@mariozechner/pi-ai` | ^0.57.1 | LLM abstraction (streaming, models) |
| `@mariozechner/pi-tui` | ^0.57.1 | Terminal UI components |

### Dependencies (external)

| Package | Version | Mục đích |
|---------|---------|----------|
| `@mariozechner/jiti` | ^2.6.2 | Runtime TypeScript loader (extensions) |
| `@silvia-odwyer/photon-node` | ^0.3.4 | WASM for RGB↔terminal color conversion |
| `chalk` | ^5.5.0 | Terminal string styling |
| `cli-highlight` | ^2.1.11 | Syntax highlighting in terminal |
| `diff` | ^8.0.2 | Diff computation (editor) |
| `extract-zip` | ^2.0.1 | Extract zip packages |
| `file-type` | ^21.1.1 | Detect file types |
| `glob` | ^13.0.1 | File pattern matching |
| `hosted-git-info` | ^9.0.2 | Git repo info parsing |
| `ignore` | ^7.0.5 | .gitignore style pattern matching |
| `marked` | ^15.0.12 | Markdown parsing |
| `minimatch` | ^10.2.3 | Glob pattern matching |
| `proper-lockfile` | ^4.1.2 | Lockfile management (packages) |
| `strip-ansi` | ^7.1.0 | Remove ANSI codes |
| `undici` | ^7.19.1 | Fetch polyfill (HTTP requests) |
| `yaml` | ^2.8.2 | YAML parsing |

### Optional dependencies

- `@mariozechner/clipboard` (^0.3.2) – Clipboard access (paste images).

---

## 📦 @mariozechner/pi-agent-core (Tier 2)

**Path**: `packages/agent/package.json`

### Dependencies

| Package | Version | Mục đích |
|---------|---------|----------|
| `@mariozechner/pi-ai` | ^0.57.1 | LLM streaming, model abstraction |

### Dev dependencies

- `typescript`, `vitest`, `@types/node`.

**Chỉ phụ thuộc duy nhất vào pi-ai. Không có external runtime dependencies.**

---

## 📦 @mariozechner/pi-ai (Tier 1)

**Path**: `packages/ai/package.json`

### Dependencies (provider SDKs)

| Package | Version | Mục đích |
|---------|---------|----------|
| `@anthropic-ai/sdk` | ^0.73.0 | Anthropic Claude API |
| `openai` | 6.26.0 | OpenAI GPT, o-series, etc. |
| `@google/genai` | ^1.40.0 | Google Gemini API |
| `@mistralai/mistralai` | 1.14.1 | Mistral AI API |
| `@aws-sdk/client-bedrock-runtime` | ^3.983.0 | AWS Bedrock API |

### Dependencies (utilities)

| Package | Version | Mục đích |
|---------|---------|----------|
| `ajv` | ^8.17.1 | JSON Schema validation (another-json-validator) |
| `ajv-formats` | ^3.0.1 | Additional formats for AJV |
| `chalk` | ^5.6.2 | Logging |
| `@sinclair/typebox` | ^0.34.41 | JSON Schema generation from TypeScript types |
| `partial-json` | ^0.1.7 | Streaming partial JSON parsing |
| `proxy-agent` | ^6.5.0 | Proxy support for HTTP requests |
| `undici` | ^7.19.1 | Fetch polyfill (some providers use fetch) |
| `zod-to-json-schema` | ^3.24.6 | Convert Zod schemas to JSON Schema |

### Binaries

- `pi-ai` CLI: `./dist/cli.js`.

### Exports

- `.` – main API
- `./oauth` – OAuth utilities
- `./bedrock-provider` – AWS Bedrock provider (standalone)

---

## 📦 @mariozechner/pi-tui (Supporting)

**Path**: `packages/tui/package.json`

### Dependencies

| Package | Version | Mục đích |
|---------|---------|----------|
| `chalk` | ^5.5.0 | Colors |
| `marked` | ^15.0.12 | Markdown rendering |
| `get-east-asian-width` | ^1.3.0 | East Asian width calculation (CJK) |
| `mime-types` | ^3.0.1 | MIME type detection |

### Optional dependencies

- `koffi` (^2.9.0) – C FFI for performance (optional).

### Dev dependencies

- `@xterm/xterm`, `@xterm/headless` – Terminal emulation for tests.

**Không phụ thuộc vào bất kỳ package pi nào. Pure UI library.**

---

## 🔍 Cyclic Check

- **pi-coding-agent** → pi-agent-core → pi-ai → (external SDKs only). ✅
- **pi-agent-core** chỉ import pi-ai. ✅
- **pi-ai** không import bất kỳ package pi nào ngoài itself. ✅
- **pi-tui** không import package pi nào. ✅

**Không có cyclic dependencies.**

---

## 📊 Summary Table

| Package | Tier | Dependencies (pi) | External count | Responsibility |
|---------|------|-------------------|----------------|----------------|
| pi-coding-agent | 3 | agent-core, ai, tui | ~15 | CLI/TUI, session, tools |
| pi-agent-core | 2 | ai | 0 | Agent runtime |
| pi-ai | 1 | (none) | ~10 | LLM abstraction |
| pi-tui | support | (none) | ~5 | Terminal UI |

---

**Kết luận**: Dependency chain rõ ràng, phân tầng tốt, không cyclic. External dependencies nằm ở tier 1 (provider SDKs) và tier 3 (app utilities). Tier 2 minimal.
