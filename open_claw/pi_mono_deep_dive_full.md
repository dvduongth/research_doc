# Phân Tích Sâu Pi-Mono — Báo Cáo Tổng Hợp

**Dự án**: [Pi-Mono](https://github.com/badlogic/pi-mono) (badlogic/pi-mono)
**Ngày phân tích**: 2026-03-11
**Phân tích bởi**: William Dao (AI Research Assistant)
**Nguồn dữ liệu**: Local clone `D:\PROJECT\CCN2\pi-mono` + Web

---

## Mục lục

1. [Executive Summary](#executive-summary)
2. [Tổng quan dự án](#1-tổng-quan-dự-án)
3. [Kiến trúc Monorepo](#2-kiến-trúc-monorepo)
4. [Hệ thống LLM — pi-ai](#3-hệ-thống-llm--pi-ai)
5. [Agent Runtime — pi-agent-core](#4-agent-runtime--pi-agent-core)
6. [Coding Agent — pi-coding-agent](#5-coding-agent--pi-coding-agent)
7. [Các Package Hỗ Trợ](#6-các-package-hỗ-trợ)
8. [So sánh Benchmark](#7-so-sánh-benchmark)
9. [Bài học & Patterns](#8-bài-học--patterns)
10. [Phụ lục](#phụ-lục)

---

## Executive Summary

**Pi-Mono** là bộ công cụ AI agent mã nguồn mở (22.1k stars, MIT license) gồm 7 packages:

| Tầng | Packages | Vai trò |
|------|----------|---------|
| **Core** | ai, agent | LLM abstraction + Agent runtime |
| **UI** | tui, web-ui | Terminal + Web interfaces |
| **Apps** | coding-agent, mom, pods | Coding CLI + Slack bot + GPU deploy |

**5 Pattern chính**: Provider Registry, Message Polymorphism, Dual-Loop Execution, First-Class Tools, Event-Driven Updates

**So sánh nhanh với Claude Code**:
- Pi: Tối giản + mở rộng (8 core tools + 5 tầng extension)
- Claude Code: Đầy đủ + an toàn (15+ tools + permission gates)

---

## 1. Tổng quan dự án

### Pi-Mono là gì?
Bộ công cụ mã nguồn mở để xây dựng AI agent — từ coding assistant đến Slack bot đến web chat.

### Thông tin cơ bản
- **Tác giả**: Mario Zechner (@badlogic)
- **Giấy phép**: MIT | **Ngôn ngữ**: TypeScript | **Node.js**: >= 20
- **22.1k stars** | 169 releases | v0.57.1

### 7 Packages

```
┌─────────────────────────────────────────────────┐
│  coding-agent    mom (Slack)    pods (GPU)       │  Apps
├─────────────────────────────────────────────────┤
│     tui (Terminal UI)    web-ui (Web UI)         │  UI
├─────────────────────────────────────────────────┤
│  agent (Runtime)         ai (LLM API)           │  Core
└─────────────────────────────────────────────────┘
```

*(Chi tiet: xem `01_tong_quan_du_an.md`)*

---

## 2. Kiến trúc Monorepo

### Tooling
- **NPM Workspaces** (không dùng pnpm/turborepo)
- **Biome** (lint/format, Rust), **tsgo** (type check, Go), **Vitest** (test)
- **Husky** (git hooks), **esbuild** (browser smoke test)

### Build Order
```
tui → ai → agent → coding-agent → mom → web-ui → pods
```

### Lockstep Versioning
Tất cả 7 packages luôn cùng số phiên bản.

### AGENTS.md
Quy tắc phát triển cho cả người và AI agent:
- Không `any` types, không inline imports
- BẮT BUỘC `npm run check` sau mỗi thay đổi
- Git: chỉ commit file mình sửa, CẤM force push
- Style: ngắn gọn, không emoji, kỹ thuật only

*(Chi tiet: xem `02_kien_truc_monorepo.md`)*

---

## 3. Hệ thống LLM — pi-ai

### Provider Registry Pattern
- Đăng ký/hủy đăng ký provider động
- Type-safe wrappers kiểm tra API match
- **20+ providers**: OpenAI, Anthropic, Google, Mistral, Bedrock, xAI, Groq, Ollama, vLLM, ...

### Message Protocol
3 loại tin nhắn thống nhất: `UserMessage` | `AssistantMessage` | `ToolResultMessage`

4 loại nội dung: `TextContent` | `ThinkingContent` | `ImageContent` | `ToolCall`

### Streaming Events
13 loại sự kiện: start → text_delta → thinking_delta → toolcall_delta → done/error

### Token & Cost Tracking
Mỗi phản hồi kèm: input/output tokens, cache metrics, chi phí ($)

*(Chi tiet: xem `03_he_thong_llm_pi_ai.md`)*

---

## 4. Agent Runtime — pi-agent-core

### Dual-Loop Execution
```
Vòng ngoài: Xử lý follow-up messages
  └─ Vòng trong: AI trả lời → Tool execution → Steering check → Lặp lại
```

### AgentState
systemPrompt + model + thinkingLevel + tools + messages + streaming state

### AgentTool
name + label + description + TypeBox parameters + execute() + error recovery

### Steering & Follow-up
- **Steering**: Can thiệp giữa tool executions (kiểm tra sau mỗi tool)
- **Follow-up**: Xử lý tin nhắn chờ khi agent sắp dừng

### Self-Correcting
Tool error → gói thành ToolResultMessage{isError:true} → AI tự quyết retry/fallback

*(Chi tiet: xem `04_agent_runtime.md`)*

---

## 5. Coding Agent — pi-coding-agent

### Triết lý
**"Tối giản, tùy biến"** — Cố ý KHÔNG có: MCP, sub-agents, plan mode, permissions

### 4 Chế độ
Interactive CLI | Print/JSON | RPC | SDK

### 8 Tools mặc định
read, write, edit, edit-diff, bash, find, grep, ls

### Extension System 5 tầng
1. Extensions (TypeScript modules)
2. Skills (Markdown)
3. Slash Commands
4. Prompt Templates
5. Themes (JSON)

### Session Management
Lưu/tải sessions, context compaction (tự nén khi quá dài)

*(Chi tiet: xem `05_coding_agent.md`)*

---

## 6. Các Package Hỗ Trợ

### tui — Terminal UI
- Differential rendering (không nhấp nháy)
- CJK support, component-based (text input, editor, selection, markdown)

### web-ui — Web Components
- Lit + Tailwind CSS v4
- Chat interface + file attachment (PDF/DOCX/XLSX) + interactive artifacts
- IndexedDB persistence, CORS proxy

### mom — Slack Bot
- Per-channel context, Docker sandbox, delegated OAuth
- Self-managing: tự cài tools, lập trình skills

### pods — GPU CLI
- vLLM deployment trên DataCrunch/RunPod/Vast.ai/AWS EC2
- Multi-model GPU allocation, OpenAI-compatible API

*(Chi tiet: xem `06_cac_package_ho_tro.md`)*

---

## 7. So sánh Benchmark

### Bảng so sánh nhanh

| | Pi | Claude Code | Cursor | Aider |
|--|-----|------------|--------|-------|
| **Loại** | CLI+SDK | CLI | IDE | CLI |
| **License** | MIT | Proprietary | Proprietary | Apache 2.0 |
| **Giá** | Free+API | Free+API | $20-40/mo | Free+API |
| **Providers** | 20+ | 1 (Claude) | 5-10 | 10+ |
| **Extensions** | 5 tầng TS | MCP+Skills | VS Code | Config |
| **Sub-agents** | No | Yes | No | No |
| **Team** | Slack bot | No | No | No |
| **GPU deploy** | Yes | No | No | No |

### Ai dùng gì?
- **Pi**: Developer tùy biến, team nhỏ, DevOps
- **Claude Code**: Developer cần an toàn, enterprise
- **Cursor**: Developer thích GUI
- **Aider**: Developer Git-first, ngân sách thấp

*(Chi tiet: xem `07_so_sanh_benchmark.md`)*

---

## 8. Bài học & Patterns

### 5 Design Patterns

| # | Pattern | Ví dụ đời thực |
|---|---------|---------------|
| 1 | **Provider Registry** | Ổ cắm điện đa năng |
| 2 | **Message Polymorphism** | Chuẩn USB-C |
| 3 | **Dual-Loop Execution** | Đầu bếp thông minh |
| 4 | **First-Class Tools** | Workshop chuyên nghiệp |
| 5 | **Event-Driven Updates** | Bảng tin sân bay |

### Trade-offs
- Extensibility vs Security (Pi vs Claude Code)
- Simplicity vs Features (8 tools vs 15+ tools)
- Monorepo vs Multi-repo (1 repo vs 7 repos)

### 10 Bài học quan trọng
1. Tách interface khỏi implementation
2. Thiết kế cho mở rộng từ đầu
3. Lỗi là context, không phải crash
4. Push events, đừng poll
5. Validate ở mọi ranh giới
6. Tối giản core, mở rộng periphery
7. Lockstep versioning cho monorepo
8. AGENTS.md cho AI collaboration
9. Streaming-first, not batch
10. Chuyển đổi ở ranh giới rõ ràng

*(Chi tiet: xem `08_bai_hoc_patterns.md`)*

---

## Phụ lục

### A. Cấu trúc file report

```
research_doc/open_claw/
├── PROGRESS.md                    # Tiến độ thực hiện
├── 01_tong_quan_du_an.md          # Tổng quan Pi-Mono
├── 02_kien_truc_monorepo.md       # Kiến trúc monorepo
├── 03_he_thong_llm_pi_ai.md       # Hệ thống LLM
├── 04_agent_runtime.md            # Agent runtime
├── 05_coding_agent.md             # Coding agent
├── 06_cac_package_ho_tro.md       # Packages hỗ trợ
├── 07_so_sanh_benchmark.md        # So sánh benchmark
├── 08_bai_hoc_patterns.md         # Bài học & patterns
└── pi_mono_deep_dive_full.md      # Báo cáo tổng hợp (file này)
```

### B. Source files quan trọng (trong local clone)

| File | Vai trò |
|------|---------|
| `pi-mono/package.json` | Monorepo config, workspaces, scripts |
| `pi-mono/AGENTS.md` | Quy tắc phát triển |
| `pi-mono/packages/ai/src/types.ts` | Message protocol, Provider types |
| `pi-mono/packages/ai/src/api-registry.ts` | Provider Registry pattern |
| `pi-mono/packages/agent/src/agent-loop.ts` | Dual-loop execution |
| `pi-mono/packages/agent/src/types.ts` | AgentState, AgentTool, AgentEvent |
| `pi-mono/packages/coding-agent/src/core/` | 46 files core logic |

### C. Links tham khảo

| Resource | URL |
|----------|-----|
| GitHub Repo | https://github.com/badlogic/pi-mono |
| NPM (ai) | https://www.npmjs.com/package/@mariozechner/pi-ai |
| NPM (agent) | https://www.npmjs.com/package/@mariozechner/pi-agent-core |
| NPM (coding-agent) | https://www.npmjs.com/package/@mariozechner/pi-coding-agent |
| Discord | https://discord.com/invite/3cU7Bz4UPx |
| Website | https://shittycodingagent.ai |

### D. Benchmark sources
- [Aider vs Cursor 2026 - UI Bakery](https://uibakery.io/blog/aider-vs-cursor)
- [Best AI Coding Agents 2026 - Faros AI](https://www.faros.ai/blog/best-ai-coding-agents-2026)

---

*Phân tích hoàn thành: 2026-03-11*
*Tổng cộng: 10 files, ~2,500 dòng markdown*
