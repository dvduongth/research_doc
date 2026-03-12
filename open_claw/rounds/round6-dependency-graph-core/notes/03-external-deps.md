# Round 6: External Dependencies
**Ngày**: 2026-03-12

---

## 📚 Overview

External dependencies chia thành 2 categories:

1. **Provider SDKs** (tier 1 - pi-ai): giao tiếp với LLM APIs.
2. **Utility libraries** (tier 3 - pi-coding-agent & pi-tui): hỗ trợ chức năng ứng dụng.

---

## 🤖 Provider SDKs (pi-ai)

| SDK | Provider | Purpose | Size (approx) | Notes |
|-----|----------|---------|---------------|-------|
| `@anthropic-ai/sdk` | Anthropic Claude | REST + streaming | ~500KB | Official SDK |
| `openai` | OpenAI | REST + streaming | ~1MB | Official SDK |
| `@google/genai` | Google Gemini | REST + streaming | ~300KB | Official SDK |
| `@mistralai/mistralai` | Mistral AI | REST + streaming | ~200KB | Official SDK |
| `@aws-sdk/client-bedrock-runtime` | AWS Bedrock | REST + streaming | ~2MB | Part of AWS SDK v3 |

**Total potential install size** (pi-ai dependencies): ~4MB (unpacked). Có thể lớn nếu user chỉ cần 1 provider.

**Cân nhắc**: Có thể làm optional dependencies? Ví dụ: user install `pi-ai-anthropic` riêng? Hiện tại tất cả hard dependencies, nhưng có thể tránh load nếu không dùng provider đó.

---

## 🔧 Utility Libraries (Tier 3)

### pi-coding-agent

| Library | Purpose |
|---------|---------|
| `chalk` (^5.5.0) | Terminal colors (có thể thay bằng picocolors) |
| `cli-highlight` (^2.1.11) | Syntax highlight code blocks |
| `diff` (^8.0.2) | Compute diff, dùng trong editor |
| `extract-zip` (^2.0.1) | Giải nén packages (zip) |
| `file-type` (^21.1.1) | Detect file type từ buffer |
| `glob` (^13.0.1) | Match file patterns |
| `hosted-git-info` (^9.0.2) | Parse git repo URLs |
| `ignore` (^7.0.5) | .gitignore style pattern matching |
| `marked` (^15.0.12) | Markdown to HTML (render messages) |
| `minimatch` (^10.2.3) | Minimal glob matching |
| `proper-lockfile` (^4.1.2) | Lockfile for package installs |
| `strip-ansi` (^7.1.0) | Remove ANSI escape codes |
| `undici` (^7.19.1) | HTTP client (fetch polyfill) |
| `yaml` (^2.8.2) | YAML parser (settings) |

### pi-tui

| Library | Purpose |
|---------|---------|
| `chalk` | Colors |
| `marked` | Markdown rendering |
| `get-east-asian-width` | Độ rộng ký tự Đông Á (CJK) cho alignment |
| `mime-types` | Detect MIME types |
| `koffi` (optional) | C FFI để accelerate rendering (nếu cần) |

---

## 📦 pi-tui Optional Dependencies

- `koffi`: C library binding, optional. Nếu không có, pi-tui still works nhưng có thể chậm hơn.

---

## 🔍 Why These Utilities Belong in Tier 3

- **File operations** (glob, extract-zip, file-type): Chỉ application cần đọc/ghi file (tools: read, write, ls, find).
- **Formatting** (chalk, cli-highlight, marked, strip-ansi): Để hiển thị đẹp trong terminal.
- **Diff & editors** (diff): Chỉ coding-agent có editor.
- **Package management** (hosted-git-info, ignore, proper-lockfile, minimatch): Chỉ coding-agent cài đặt packages.
- **YAML**: settings file format.

Nếu đặt các libs này vào tier 2 (agent-core) sẽ:
- Làm agent-core cồng kềnh (không cần thiết).
- Extensions (dùng agent-core) cũng phải chịu burden này.
→ Không nên.

---

## 🧪 Testing Dependencies

- `vitest`: Test framework cho tất cả packages.
- `@types/node`: TypeScript types.

---

## 📦 Monorepo vs Standalone

Vì mỗi package publish riêng, dependencies được declare rõ trong từng `package.json`:

- **pi-ai**: Không depend vào agent-core hay coding-agent.
- **pi-agent-core**: Chỉ depend vào pi-ai.
- **pi-coding-agent**: Depend cả ba (ai, agent-core, tui) + utilities.

**Users**:
- Nếu chỉ muốn dùng LLM abstraction: install `pi-ai`.
- Nếu muốn agent runtime: install `pi-agent-core` (sẽ kéo `pi-ai`).
- Nếu muốn CLI coding agent: install `pi-coding-agent` (kéo tất cả).

---

## 📈 Dependency Size Impact

| Package | Approx. Installed Size (with deps) |
|---------|-----------------------------------|
| `pi-ai` | ~5-6 MB (với tất cả provider SDKs) |
| `pi-agent-core` | ~6-7 MB (kéo `pi-ai`) |
| `pi-coding-agent` | ~10-12 MB (tất cả) |
| `pi-tui` | ~1 MB |

*Con số rough, depend on npm package compression.*

---

## 🔄 Version Management

Tất cả packages share version (ví dụ 0.57.1). Điều này:

- Đảm bảo compatibility: `pi-coding-agent` expects `pi-agent-core@^0.57.1` và `pi-ai@^0.57.1`.
- Monorepo giúp dễ quản lý (single version bump).
- Nếu publish riêng lẻ, cần giữ version sync.

---

## 🎯 Takeaways

- **Provider SDKs** ở tier 1 là necessary bloat, nhưng không thể tránh vì cần gọi APIs.
- **Utilities** ở tier 3 là application-specific, không nên leak lên tier 1/2.
- **Zero external deps** ở tier 2 là achievement: agent-core chỉ quan tâm đến agent logic, không quan tâm đến LLM protocols (đó là tier 1) hay UI/fs (tier 3).
- **pi-tui** độc lập → có thể dùng cho apps khác, hoặc thay bằng web UI.

---

**End of external dependencies analysis.**
