# Plan: Phân tích sâu Pi-Mono — Architecture + Agent Patterns + Benchmark

## Bối cảnh

**Pi-Mono** (https://github.com/badlogic/pi-mono) là một AI agent toolkit open-source (22.1k stars, MIT) của Mario Zechner. Anh Daniel muốn tìm hiểu sâu để:
- Học **kiến trúc monorepo** và design patterns
- Học **AI agent patterns** (tool calling, event streaming, LLM abstraction)
- **So sánh** với Claude Code, Cursor, Aider

## Quy tắc

- **Research-only**: Chỉ đọc code (Read, Glob, Grep), WebSearch, WebFetch — KHÔNG viết code
- **Ngôn ngữ output**: 100% tiếng Việt, giải thích rõ cho người chưa quen AI
- **Nguồn dữ liệu chính**: Local clone tại `D:\PROJECT\CCN2\pi-mono`
- **Thư mục output**: `D:\PROJECT\CCN2\research_doc\open_claw\`
- **Tracking**: `D:\PROJECT\CCN2\research_doc\open_claw\PROGRESS.md`

## Danh sách Output Files

| # | File | Nội dung |
|---|------|---------|
| 1 | `PROGRESS.md` | Tiến độ thực hiện từng bước |
| 2 | `01_tong_quan_du_an.md` | Tổng quan Pi-Mono: repo stats, tech stack, mục đích |
| 3 | `02_kien_truc_monorepo.md` | Cách tổ chức monorepo, build system, dependency graph |
| 4 | `03_he_thong_llm_pi_ai.md` | Core LLM abstraction: provider registry, message protocol, streaming |
| 5 | `04_agent_runtime.md` | Agent runtime: dual-loop, tool system, state, events |
| 6 | `05_coding_agent.md` | Coding agent: design philosophy, tools, extension system |
| 7 | `06_cac_package_ho_tro.md` | tui, web-ui, mom, pods — vai trò và kiến trúc |
| 8 | `07_so_sanh_benchmark.md` | Bảng so sánh Pi vs Claude Code vs Cursor vs Aider |
| 9 | `08_bai_hoc_patterns.md` | Key patterns, bài học rút ra, ứng dụng cho dự án khác |
| 10 | `pi_mono_deep_dive_full.md` | Báo cáo tổng hợp (gộp 01–08 thành 1 file hoàn chỉnh) |

---

## Chi tiết 10 bước thực hiện

### Bước 1: Khởi tạo PROGRESS.md
- Tạo file `PROGRESS.md` trong `research_doc/open_claw/`
- Liệt kê tất cả 10 bước với trạng thái (⬜ Chưa làm / 🔄 Đang làm / ✅ Xong)
- Cập nhật sau mỗi bước hoàn thành

### Bước 2: Tổng quan dự án (`01_tong_quan_du_an.md`)
- **Đọc**: `pi-mono/README.md`, `pi-mono/package.json`, `pi-mono/LICENSE`
- **Nội dung**:
  - Pi-Mono là gì? (giải thích đơn giản)
  - Ai tạo ra? Tại sao?
  - 7 packages làm gì? (mô tả 1-2 câu mỗi package)
  - Tech stack: TypeScript, Node.js 20+, NPM Workspaces
  - Stats: 22.1k stars, 169 releases, v0.57.1

### Bước 3: Kiến trúc Monorepo (`02_kien_truc_monorepo.md`)
- **Đọc**: `pi-mono/package.json` (scripts, workspaces), `pi-mono/AGENTS.md` (dev rules), `pi-mono/tsconfig.*.json`
- **Nội dung**:
  - Monorepo là gì? NPM Workspaces hoạt động thế nào?
  - Sơ đồ build: tui → ai → agent → coding-agent → mom → web-ui → pods
  - Lockstep versioning (tất cả packages cùng version number)
  - Dev tooling: Biome, Husky, Vitest, tsx
  - AGENTS.md rules: quy tắc code quality, git workflow, release process

### Bước 4: Hệ thống LLM — pi-ai (`03_he_thong_llm_pi_ai.md`)
- **Đọc**: `pi-mono/packages/ai/src/types.ts`, `api-registry.ts`, `stream.ts`, `index.ts`, `README.md`
- **Đọc thêm**: `packages/ai/src/providers/` — xem cách implement provider
- **Nội dung**:
  - LLM là gì? Provider là gì? (giải thích cho người mới)
  - Provider Registry Pattern: đăng ký/hủy đăng ký dynamic
  - 10+ providers được hỗ trợ: OpenAI, Anthropic, Google, Mistral, Bedrock, vLLM, Qwen, Ollama...
  - Message Protocol: UserMessage, AssistantMessage, ToolResultMessage
  - Streaming: text_delta, thinking_delta, tool_call_delta
  - Token & cost tracking

### Bước 5: Agent Runtime — pi-agent-core (`04_agent_runtime.md`)
- **Đọc**: `pi-mono/packages/agent/src/agent.ts`, `agent-loop.ts`, `types.ts`
- **Nội dung**:
  - Agent là gì? Tool calling là gì? (giải thích đơn giản)
  - Dual-Loop: vòng ngoài (follow-up) + vòng trong (tool execution)
  - Tool System: định nghĩa tool, validation, error recovery
  - State Management: AgentState, controlled mutations
  - Event Streaming: agent_start → turn_start → message_update → tool_execution → turn_end → agent_end
  - Steering & Interruption: can thiệp giữa chừng

### Bước 6: Coding Agent (`05_coding_agent.md`)
- **Đọc**: `pi-mono/packages/coding-agent/README.md`, `package.json`, scan `src/` directory
- **Nội dung**:
  - Coding agent là gì? So sánh với IDE truyền thống
  - Design philosophy: "minimal harness" — cố ý KHÔNG có MCP, sub-agents, plan mode, permissions
  - 4 chế độ: Interactive CLI, Print/JSON, RPC, SDK
  - 4 tools mặc định: read, write, edit, bash
  - Extension system 5 tầng: Extensions → Skills → Prompt Templates → Themes → Pi Packages

### Bước 7: Các package hỗ trợ (`06_cac_package_ho_tro.md`)
- **Đọc**: README.md + package.json của tui, web-ui, mom, pods
- **Nội dung**:
  - **tui**: Terminal UI framework — differential rendering, CJK support
  - **web-ui**: Web components — Lit + Tailwind, chat interface, document preview
  - **mom**: Slack bot — per-channel context, Docker sandbox, delegated OAuth
  - **pods**: GPU CLI — vLLM deployment trên DataCrunch/RunPod/Vast.ai

### Bước 8: So sánh Benchmark (`07_so_sanh_benchmark.md`)
- **Nguồn**: WebSearch cho thông tin mới nhất về Cursor, Aider
- **Nội dung**:
  - Bảng so sánh chi tiết 15+ tiêu chí
  - Ưu điểm/nhược điểm từng tool
  - Ai nên dùng tool nào?
  - Kết luận: Pi tối ưu cho extensibility, Claude Code cho security/UX

### Bước 9: Bài học & Patterns (`08_bai_hoc_patterns.md`)
- **Nội dung**:
  - 5 design patterns chính: Provider Registry, Message Polymorphism, Dual-Loop, First-Class Tools, Event-Driven
  - Giải thích từng pattern bằng ví dụ đời thực (ví dụ: Provider Registry giống ổ cắm điện đa năng)
  - Trade-offs: Extensibility vs Security, Simplicity vs Features
  - Ứng dụng cho dự án khác (CCN2, side projects)

### Bước 10: Báo cáo tổng hợp + Cập nhật PROGRESS
- Gộp 01–08 thành `pi_mono_deep_dive_full.md` (1 file hoàn chỉnh)
- Thêm mục lục, executive summary
- Cập nhật `PROGRESS.md` → tất cả ✅
- Cập nhật `MEMORY.md` với kết quả research

---

## Phương pháp thực hiện

- **Đọc code local**: Dùng Read, Glob, Grep trên `D:\PROJECT\CCN2\pi-mono`
- **Web search**: Cho benchmark data (Cursor, Aider stats mới nhất)
- **Không viết code**: Chỉ xuất `.md` files
- **Cập nhật PROGRESS.md**: Sau mỗi bước hoàn thành
- **Giải thích rõ**: Mỗi khái niệm kỹ thuật đều có giải thích bằng tiếng Việt đơn giản

## Verification

- Kiểm tra tất cả 10 files đã tạo trong `research_doc/open_claw/`
- PROGRESS.md hiển thị 10/10 ✅
- Báo cáo tổng hợp đọc được mà không cần kiến thức AI trước đó
- Tất cả links và tên package chính xác
