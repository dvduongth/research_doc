# Plan: Deep Dive Pi-Mono — Architecture + Agent Patterns + Benchmark

## Context

Anh muốn tìm hiểu sâu về [pi-mono](https://github.com/badlogic/pi-mono) — một AI agent toolkit open-source (22.1k stars, MIT license) của Mario Zechner (badlogic). Mục đích:
- Học **monorepo architecture** và design patterns
- Học **AI agent patterns** (tool calling, event streaming, LLM abstraction)
- **Benchmark** so sánh với Claude Code, Cursor, Aider

**Output**: 1 file MD report chi tiết tại `D:\PROJECT\CCN2\pi-mono-deep-dive-report.md`

---

## Dữ liệu đã thu thập (Phase 1)

Đã quét thành công:
- Root config: package.json, AGENTS.md, README.md
- Core packages: ai (types, registry, providers, stream), agent (agent-loop, state, events)
- App packages: coding-agent, mom, pods, tui, web-ui (README + package.json)
- CSV + MD summary report đã xuất ở bước trước

---

## Plan: 8 Tasks để xuất báo cáo Deep Dive

### Task 1: Monorepo Architecture Analysis
**Nội dung phân tích**:
- NPM Workspaces setup (không dùng pnpm/turborepo)
- Build dependency graph: `tui → ai → agent → coding-agent → mom → web-ui → pods`
- Lockstep versioning (tất cả packages cùng version)
- Dev tooling: Biome (lint/format), Husky (git hooks), Vitest (test), tsx (runtime)
- Scripts: `build` (sequential), `dev` (concurrent), `check` (mandatory after changes)

**Source**: Root package.json, AGENTS.md

### Task 2: Core LLM Abstraction (`packages/ai`)
**Nội dung phân tích**:
- **Provider Registry Pattern**: Dynamic registration/unregistration, type-safe wrappers
- **Supported Providers**: OpenAI, Anthropic, Google Gemini, Mistral, AWS Bedrock, Groq, vLLM, Qwen, Ollama, GitLab Duo
- **Message Protocol**: Polymorphic discriminated unions (UserMessage | AssistantMessage | ToolResultMessage)
- **Streaming Events**: text_start/delta/end, thinking_start/delta/end, tool_call_start/delta/end
- **Token/Cost Tracking**: Automatic aggregation per conversation
- **Schema Validation**: TypeBox + Ajv + zod-to-json-schema

**Source**: packages/ai/src/ (types.ts, api-registry.ts, stream.ts, index.ts)

### Task 3: Agent Runtime (`packages/agent`)
**Nội dung phân tích**:
- **Dual-Loop Execution**: Outer loop (follow-ups) + Inner loop (tool calls)
- **State Management**: AgentState with controlled mutations via setters
- **Tool System**: AgentTool with TypeBox schemas, error recovery (tool errors → retry loop)
- **Steering & Interruption**: `steer()` injects messages between tool executions
- **Message Transformation**: AgentMessage → Message conversion at LLM boundary
- **Event Emission**: Granular events (agent_start/end, turn_start/end, message_update, tool_execution_*)

**Source**: packages/agent/src/ (agent.ts, agent-loop.ts, types.ts)

### Task 4: Coding Agent Analysis (`packages/coding-agent`)
**Nội dung phân tích**:
- **Design Philosophy**: Minimal core, explicitly rejects MCP/sub-agents/plan-mode/permissions
- **4 Modes**: Interactive CLI, Print/JSON output, RPC, SDK embedding
- **Default Tools**: read, write, edit, bash
- **Extension System** (5 levels): Extensions (TS modules), Skills, Prompt Templates, Themes, Pi Packages (npm)
- **So sánh Claude Code**: Feature table comparison

**Source**: packages/coding-agent/README.md, package.json

### Task 5: Supporting Packages (tui, web-ui, mom, pods)
**Nội dung phân tích**:
- **tui**: Differential rendering, CJK support, component-based (text input, editor, selection, markdown)
- **web-ui**: Lit + Tailwind, chat components, document processing (PDF/DOCX/XLSX), IndexedDB persistence
- **mom**: Slack bot with per-channel contexts, delegated OAuth, Docker sandbox
- **pods**: vLLM CLI for DataCrunch/RunPod/Vast.ai/AWS EC2, multi-model GPU allocation

**Source**: Các README.md và package.json tương ứng

### Task 6: Benchmark — Pi vs Claude Code vs Cursor vs Aider
**Nội dung phân tích**:

| Dimension | Pi | Claude Code | Cursor | Aider |
|-----------|-----|------------|--------|-------|
| Philosophy | Minimal + extensible | Feature-rich + secure | IDE-integrated | CLI-focused |
| Architecture | Modular monorepo | Monolithic | VS Code extension | Python CLI |
| Safety Model | No permissions (by design) | Permission gates | Editor-level | Git-based |
| Extensibility | TS extensions + npm pkgs | MCP connectors | Extensions | Config-based |
| Sub-agents | No | Yes | No | No |
| Team collab | Slack bot (mom) | No | No | No |
| GPU deploy | Yes (pods) | No | No | No |
| Embedding | SDK/RPC modes | MCP SDK | No | Library |

**Source**: Web research + existing knowledge

### Task 7: Key Design Patterns & Lessons Learned
**Nội dung phân tích**:
- **5 Core Patterns**: Provider Registry, Message Polymorphism, Dual-Loop Execution, First-Class Tools, Event-Driven Updates
- **Trade-offs**: Extensibility vs Security, Simplicity vs Features
- **Applicable cho CCN2/projects khác**: Những patterns nào có thể áp dụng

### Task 8: Compile Final Report
**Output file**: `D:\PROJECT\CCN2\pi-mono-deep-dive-report.md`

**Cấu trúc report**:
```
1. Executive Summary
2. Repository Overview (stats, tech stack)
3. Monorepo Architecture (Task 1)
4. Core LLM Abstraction — pi-ai (Task 2)
5. Agent Runtime — pi-agent-core (Task 3)
6. Coding Agent — pi-coding-agent (Task 4)
7. Supporting Packages (Task 5)
8. Benchmark Comparison Table (Task 6)
9. Key Design Patterns & Takeaways (Task 7)
10. Appendix: File Structure, Dependencies, Links
```

---

## Execution Strategy

- Tasks 1–5: Compile từ dữ liệu đã thu thập (không cần fetch thêm)
- Task 6: Cần WebSearch cho thông tin mới nhất về Cursor/Aider để benchmark chính xác
- Task 7: Synthesis từ tất cả tasks trước
- Task 8: Compile thành 1 file MD report hoàn chỉnh

**Estimated sections**: ~10 sections, ~500-800 dòng MD

---

## Verification

- Kiểm tra tất cả links repo hoạt động
- Cross-check package names với npm registry
- Đảm bảo benchmark table chính xác và fair
- Review report cho completeness và readability
