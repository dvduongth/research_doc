# Checklist cá nhân — Người A: Nền tảng & Kết nối

> **Phạm vi**: Kiến trúc 3 Tiers + Dependency Graph + Extension System
> **Deadline**: 12/03 tối — hoàn thành nghiên cứu; 13/03 sáng — sẵn sàng trình bày

---

## Phase 1: Đọc hiểu (14:00 – 17:30)

### Tier 1: AI Layer (`pi-ai`) — ~45 phút
- [ ] Đọc `packages/ai/README.md`
- [ ] Hiểu unified multi-provider API — tại sao cần lớp trừu tượng này
- [ ] Liệt kê được ít nhất 5 providers (Anthropic, OpenAI, Google, Azure, Mistral, Groq…)
- [ ] Hiểu model abstraction: `getModel()`, `ModelRegistry`
- [ ] Hiểu cách model được truyền vào agent (từ Tier 1 → Tier 2)
- [ ] Đọc `packages/coding-agent/docs/models.md` — model selection, per-session override
- [ ] Đọc `packages/coding-agent/docs/providers.md` — provider setup, API keys

### Tier 2: Agent Core (`pi-agent-core`) — ~40 phút
- [ ] Hiểu Agent class — vai trò state manager
- [ ] Phân biệt AgentMessage vs LLM Message — tại sao cần 2 loại
- [ ] Hiểu `convertToLlm()` ở mức tổng quan (chuyển đổi internal → LLM format)
- [ ] Hiểu `transformContext()` ở mức tổng quan (prune, inject external context)
- [ ] Tool execution: agent gọi tool → nhận kết quả → gửi lại LLM
- [ ] Event streaming — cách UI nhận updates

### Tier 3: CLI/Application Layer (`pi-coding-agent`) — ~40 phút
- [ ] Đọc `packages/coding-agent/docs/session.md`
- [ ] Hiểu Interactive TUI mode — cách user tương tác
- [ ] ResourceLoader: skills, extensions, prompts, themes, context files
- [ ] Commands (/) system — slash commands
- [ ] Session persistence: JSONL tree format (`id`, `parentId`)
- [ ] Biết về Compaction & Branching (chi tiết để Người B)

### Checkpoint 1 (17:00)
- [ ] Hoàn thành self-quiz (file riêng)
- [ ] Ghi lại ít nhất 3 câu hỏi chưa rõ để hỏi Người B

---

## Phase 2: Dependency Graph & Extension System (19:00 – 21:00)

### Core Dependencies — ~20 phút
- [ ] Xác nhận dependency chain: `pi-coding-agent` → `pi-agent-core` → `pi-ai`
- [ ] Liệt kê các package phụ: `pi-tui`, `pi-mom`, `pi-web-ui`, `pi-pods`
- [ ] Đọc `package.json` của ít nhất 3 package để verify dependencies

### Extension System — ~20 phút
- [ ] Hiểu extension discovery: `~/.pi/agent/extensions/` và `.pi/extensions/`
- [ ] ExtensionAPI cung cấp:
  - [ ] `pi.on(event)` — subscribe events
  - [ ] `pi.registerTool()` — custom tools
  - [ ] `pi.registerCommand()` — custom commands
  - [ ] `pi.registerProvider()` — custom providers
- [ ] Extension có thể override built-in tools — ý nghĩa kiến trúc

### Resource Loading — ~20 phút
- [ ] `DefaultResourceLoader` load theo thứ tự:
  - [ ] 1. Skills → 2. Extensions → 3. Prompts → 4. Context files → 5. System prompt
- [ ] Override mechanism: `skillsOverride`, `extensionsOverride`, etc.
- [ ] Mối liên hệ giữa Resource Loading và Extension System

### Vẽ sơ đồ — ~30 phút
- [ ] Vẽ dependency graph (3 tiers + packages phụ)
- [ ] Vẽ extension integration points
- [ ] Vẽ resource loading flow

### Checkpoint 2 (21:00)
- [ ] Có bản nháp phần trình bày
- [ ] Sơ đồ dependency đã hoàn chỉnh

---

## Phase 3: Chuẩn bị trình bày (21:00 – 22:30)

- [ ] Tham gia Sync Call 15 phút với Người B
- [ ] Thống nhất thuật ngữ tiếng Việt
- [ ] Chuẩn bị slides/notes cho:
  - [ ] Mở đầu: Pi-mono là gì, tại sao quan trọng
  - [ ] Kiến trúc 3 Tiers — giải thích từ dưới lên
  - [ ] Dependency Graph — show sơ đồ
  - [ ] Extension System — demo khái niệm
- [ ] Review lại câu hỏi attendees có thể hỏi (file riêng)

---

## Phase 4: Review & Rehearsal (13/03 sáng)

- [ ] Đọc nhanh phần trình bày của Người B
- [ ] Phát hiện mâu thuẫn / lỗ hổng
- [ ] Chạy thử trình bày 15 phút
- [ ] Sẵn sàng trả lời Q&A phần mình

---

## Tài liệu cần đọc (tổng hợp)

| Ưu tiên | File | Mục đích |
|---------|------|----------|
| 1 | `packages/ai/README.md` | Tier 1 |
| 2 | `packages/agent/README.md` | Tier 2 (tổng quan) |
| 3 | `packages/coding-agent/docs/extensions.md` | Extension System |
| 4 | `packages/coding-agent/docs/session.md` | Session persistence |
| 5 | `packages/coding-agent/docs/models.md` | Model selection |
| 6 | `packages/coding-agent/docs/providers.md` | Provider setup |
| 7 | Các `package.json` | Verify dependencies |
