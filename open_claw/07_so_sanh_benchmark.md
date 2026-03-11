# 07. So sánh Benchmark — Pi vs Claude Code vs Cursor vs Aider

## Giải thích cho người mới

### 4 công cụ AI coding phổ biến nhất 2026

| Công cụ | Loại | Một câu mô tả |
|---------|------|---------------|
| **Pi** | CLI + SDK | Bộ công cụ mã nguồn mở, tối giản, tùy biến cao |
| **Claude Code** | CLI + IDE | Agent CLI của Anthropic, tích hợp sâu với Claude |
| **Cursor** | IDE | VS Code fork có AI tích hợp, giao diện đồ họa |
| **Aider** | CLI | CLI mã nguồn mở, tích hợp Git, đa model |

---

## Bảng so sánh tổng quan (15 tiêu chí)

| Tiêu chí | Pi | Claude Code | Cursor | Aider |
|----------|-----|------------|--------|-------|
| **Loại** | CLI + SDK | CLI | IDE (VS Code fork) | CLI |
| **Giấy phép** | MIT (mã nguồn mở) | Proprietary | Proprietary | Apache 2.0 (mã nguồn mở) |
| **Giá** | Miễn phí (trả API) | Miễn phí (trả API) | $20-40/tháng | Miễn phí (trả API) |
| **LLM Providers** | 20+ (tự host được) | Chỉ Claude | Nhiều (qua Cursor) | Nhiều (OpenAI, Claude, v.v.) |
| **Giao diện** | Terminal + Web + Slack | Terminal | IDE đồ họa | Terminal |
| **Extension system** | 5 tầng (TS native) | MCP + Skills | VS Code extensions | Config-based |
| **Sub-agents** | Không (by design) | Có | Không | Không |
| **Plan mode** | Không (by design) | Có | Không | Không |
| **Permission gates** | Không (by design) | Có (an toàn) | Editor-level | Không |
| **Git integration** | Qua bash tool | Qua Bash tool | Tích hợp sâu | Native (auto-commit) |
| **Multi-file edit** | Có (edit tool) | Có (Edit tool) | Có (Composer) | Có (repo map) |
| **Browser automation** | Qua extension | Có (MCP) | Không | Không |
| **Team collaboration** | Có (Slack bot Mom) | Không | Không (cá nhân) | Không |
| **GPU deployment** | Có (Pods) | Không | Không | Không |
| **Nhúng (embedding)** | SDK/RPC/JSON modes | MCP SDK | Không | Library mode |

---

## So sánh chi tiết từng khía cạnh

### 1. Triết lý thiết kế

```
Pi:          "Tối giản + Mở rộng"
             Ít tính năng core, user tự xây dựng

Claude Code: "Đầy đủ + An toàn"
             Nhiều tính năng built-in, có rào bảo vệ

Cursor:      "IDE + AI = Tất cả trong một"
             VS Code + AI tích hợp sâu

Aider:       "Git-first + Đa model"
             Terminal + tự động commit, hỗ trợ nhiều model
```

### 2. Hỗ trợ LLM

| Provider | Pi | Claude Code | Cursor | Aider |
|----------|-----|------------|--------|-------|
| OpenAI | ✅ | ❌ | ✅ | ✅ |
| Anthropic | ✅ | ✅ (chính) | ✅ | ✅ |
| Google Gemini | ✅ | ❌ | ✅ | ✅ |
| AWS Bedrock | ✅ | ❌ | ❌ | ✅ |
| Local (Ollama) | ✅ | ❌ | ❌ | ✅ |
| vLLM (self-host) | ✅ + deploy tool | ❌ | ❌ | ✅ |
| **Tổng providers** | **20+** | **1** | **5-10** | **10+** |

### 3. Tools / Capabilities

| Tool | Pi | Claude Code | Cursor | Aider |
|------|-----|------------|--------|-------|
| Đọc file | ✅ read | ✅ Read | ✅ | ✅ |
| Ghi file | ✅ write | ✅ Write | ✅ | ✅ |
| Sửa file | ✅ edit, edit-diff | ✅ Edit | ✅ Composer | ✅ |
| Terminal | ✅ bash | ✅ Bash | ✅ Terminal | ✅ |
| Tìm file | ✅ find | ✅ Glob | ✅ | ✅ repo map |
| Tìm nội dung | ✅ grep | ✅ Grep | ✅ | ✅ |
| Web browsing | Qua ext | ✅ MCP | ❌ | ❌ |
| Screenshot | Qua ext | ✅ | ❌ | ❌ |
| Todo tracking | Qua ext | ✅ TodoWrite | ❌ | ❌ |
| Agent con | ❌ | ✅ Agent | ❌ | ❌ |

### 4. Mô hình an toàn

| Cơ chế | Pi | Claude Code | Cursor | Aider |
|--------|-----|------------|--------|-------|
| Permission popups | ❌ | ✅ | ❌ | ❌ |
| File write confirm | ❌ | Tùy cấu hình | ✅ (diff review) | Git revert |
| Bash sandboxing | ❌ | Tùy cấu hình | Terminal | ❌ |
| Security rules | ❌ | Rất nghiêm ngặt | Editor-level | Git-based |

### 5. Khả năng mở rộng

```
Pi:          TypeScript extensions (full language power)
             → Thêm tool, command, UI, event handler
             → 5 tầng: Extension > Skill > Command > Template > Theme
             → Chia sẻ qua npm packages

Claude Code: MCP connectors (external services)
             → Kết nối Slack, GitHub, DB, browser
             → Skills (.md files)
             → Hooks (shell commands)

Cursor:      VS Code extensions (existing ecosystem)
             → Hàng nghìn extensions có sẵn
             → Rules files (.cursorrules)

Aider:       Config files + Convention files
             → .aider.conf.yml
             → CONVENTIONS.md
             → Hạn chế hơn 3 tool trên
```

---

## Bảng điểm mạnh/yếu

### Pi (pi-coding-agent)
| Điểm mạnh | Điểm yếu |
|-----------|----------|
| ✅ 20+ LLM providers | ❌ Không có permission gates |
| ✅ Extension system mạnh mẽ | ❌ Ít tính năng out-of-the-box |
| ✅ SDK/RPC embedding | ❌ Đòi hỏi kiến thức TypeScript |
| ✅ Team collab (Mom) | ❌ Cộng đồng nhỏ hơn Claude Code |
| ✅ GPU deployment (Pods) | ❌ Không có plan mode built-in |
| ✅ Mã nguồn mở (MIT) | |

### Claude Code
| Điểm mạnh | Điểm yếu |
|-----------|----------|
| ✅ Nhiều tính năng built-in | ❌ Chỉ hỗ trợ Claude models |
| ✅ An toàn (permission gates) | ❌ Proprietary (không mã nguồn mở) |
| ✅ Sub-agents, Plan mode | ❌ Không nhúng vào ứng dụng khác |
| ✅ Browser automation | ❌ Không hỗ trợ team collaboration |
| ✅ Cộng đồng lớn | ❌ Phụ thuộc Anthropic API |

### Cursor
| Điểm mạnh | Điểm yếu |
|-----------|----------|
| ✅ Giao diện đồ họa (dễ dùng) | ❌ Proprietary |
| ✅ Tốc độ autocomplete nhanh | ❌ Phải trả phí ($20-40/tháng) |
| ✅ Composer (multi-file edit) | ❌ Không có CLI mode |
| ✅ VS Code extensions ecosystem | ❌ Không embedding/SDK |
| ✅ Tiết kiệm ~10 giờ/tuần | ❌ Không hỗ trợ self-hosted LLM |

### Aider
| Điểm mạnh | Điểm yếu |
|-----------|----------|
| ✅ Git-native (auto-commit) | ❌ Ít extension/plugin |
| ✅ Repo map (context thông minh) | ❌ Chỉ CLI, không có GUI |
| ✅ Mã nguồn mở (Apache 2.0) | ❌ Không có team collaboration |
| ✅ Đa model (10+) | ❌ Không có browser automation |
| ✅ Miễn phí | ❌ Không có SDK/embedding mode |

---

## Ai nên dùng tool nào?

| Bạn là... | Nên dùng | Lý do |
|-----------|---------|-------|
| **Developer muốn tùy biến** | Pi | Extension system mạnh, multi-provider |
| **Developer cần an toàn** | Claude Code | Permission gates, security rules |
| **Developer thích GUI** | Cursor | Giao diện VS Code quen thuộc |
| **Developer Git-first** | Aider | Auto-commit, repo map, miễn phí |
| **Team nhỏ** | Pi + Mom | Slack bot cho collaboration |
| **DevOps/MLOps** | Pi + Pods | Deploy model lên GPU cloud |
| **Startup (ngân sách thấp)** | Pi hoặc Aider | Miễn phí, mã nguồn mở |
| **Enterprise** | Claude Code hoặc Cursor | Security, support, compliance |

---

## Tóm tắt một câu

| Tool | Tóm tắt |
|------|---------|
| **Pi** | Bộ lego AI: tùy biến vô hạn, nhưng bạn phải tự lắp ráp |
| **Claude Code** | Xe hơi hoàn chỉnh: lên xe là chạy, nhưng khó độ |
| **Cursor** | IDE thông minh: dễ dùng nhất, nhưng trả phí |
| **Aider** | Git buddy: miễn phí, Git-native, nhưng ít tính năng |

---

*Nguồn: GitHub repos, documentation chính thức, web search 2026-03-11*
*Lưu ý: Benchmark data có thể thay đổi theo phiên bản mới*
