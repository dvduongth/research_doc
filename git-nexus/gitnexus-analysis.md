# GitNexus — Code Intelligence Engine

*Ngày phân tích: 2026-03-19*  
*Người phân tích: Cốm Đào (OpenClaw Agent)*

---

## 1. Tổng quan

**GitNexus** là *"The Zero-Server Code Intelligence Engine"* — công cụ **indexing codebase thành knowledge graph** và **expose thông qua MCP (Model Context Protocol)** để AI agents (Claude Code, Cursor, Windsurf, OpenCode, Codex) có thể hiểu sâu kiến trúc codebase, tránh các lỗi do thiếu context.

Khác với DeepWiki (chỉ mô tả), GitNexus **phân tích mối quan hệ thực tế**: dependencies, call chains, clusters, execution flows.

**Ý tưởng cốt lõi:** *Precomputed Relational Intelligence* — thay vì để LLM tự explore raw graph, GitNexus precompute clustering, process tracing, confidence scoring; các smart tools trả về context đã được cấu trúc sẵn.

---

## 2. Kiến trúc & Modes

### 2.1 Modes

| Mode | Mục đích | Storage | Parsing |
|------|----------|---------|---------|
| **CLI + MCP** | Development hàng ngày với editor (Claude Code, Cursor…) | LadybugDB native (`.gitnexus/` trong repo) | Tree-sitter native bindings |
| **Web UI** | Quick exploration, demo, one-off analysis | LadybugDB WASM (in-memory, session) | Tree-sitter WASM |
| **Bridge** | `gitnexus serve` — local HTTP server để Web UI connect vào CLI index (auto-detected, không re-upload) | Kết nối cả 2 | — |

### 2.2 Indexing Pipeline (7 phases)

1. **Structure** — Duyệt file tree, map folder/file relationships
2. **Parsing** — Tree-sitter AST: functions, classes, methods, interfaces
3. **Resolution** — Resolve imports, named bindings, heritage (inheritance/interfaces/mixins), type annotations, constructor inference, self/this receiver types
4. **Clustering** — Group related symbols thành functional communities (Leiden algorithm)
5. **Processes** — Trace execution flows từ entry points qua call chains
6. **Search** — Hybrid search index: BM25 + semantic + RRF (Reciprocal Rank Fusion)
7. **Embeddings** — (Optional) Tạo vector embeddings với HuggingFace transformers.js

---

## 3. Tech Stack

### 3.1 CLI (Node.js)

- **Database:** LadybugDB (embedded graph DB với vector support, formerly KuzuDB)
- **Parsing:** Tree-sitter native bindings
- **Graph ops:** Graphology
- **Concurrency:** Worker threads + async
- **Agent interface:** MCP (stdio)
- **Hooks:** Claude Code PreToolUse/PostToolUse (auto-reindex sau commits)

### 3.2 Web (Browser)

- **Database:** LadybugDB WASM
- **Parsing:** Tree-sitter WASM
- **Embeddings:** transformers.js (WebGPU/WASM)
- **Graph:** Graphology (Web Workers)
- **Viz:** Sigma.js + WebGL
- **UI:** React 18, TypeScript, Vite, Tailwind v4
- **Agent interface:** LangChain ReAct agent

---

## 4. MCP Tools & Resources

### 4.1 7 MCP Tools

| Tool | Mô tả | repo param |
|------|-------|------------|
| `list_repos` | Liệt kê tất cả indexed repositories | — |
| `query` | Process-grouped hybrid search (BM25 + semantic + RRF) | Optional |
| `context` | 360-degree symbol view — categorized refs, process participation | Optional |
| `impact` | Blast radius analysis với depth grouping và confidence scores | Optional |
| `detect_changes` | Git-diff impact — map changed lines → affected processes | Optional |
| `rename` | Multi-file coordinated rename dùng graph + text search | Optional |
| `cypher` | Raw Cypher graph queries | Optional |

### 4.2 Resources (instant context)

- `gitnexus://repos` — list all indexed repos
- `gitnexus://repo/{name}/context` — codebase stats, staleness, available tools
- `gitnexus://repo/{name}/clusters` — all functional clusters with cohesion scores
- `gitnexus://repo/{name}/cluster/{name}` — cluster members + details
- `gitnexus://repo/{name}/processes` — all execution flows
- `gitnexus://repo/{name}/process/{name}` — full process trace with steps
- `gitnexus://repo/{name}/schema` — graph schema for Cypher queries

### 4.3 MCP Prompts

- `detect_impact` — Pre-commit change analysis: scope, affected processes, risk level
- `generate_map` — Architecture documentation từ knowledge graph (với mermaid diagrams)

---

## 5. Agent Skills

### 5.1 Built-in Skills (4)

Tự động cài đặt vào `.claude/skills/`:

1. **Exploring** — Navigate unfamiliar codebase dùng knowledge graph
2. **Debugging** — Trace bugs qua call chains
3. **Impact Analysis** — Analyze blast radius trước khi thay đổi
4. **Refactoring** — Plan safe refactors với dependency mapping

### 5.2 Repo-specific Skills

Chạy `gitnexus analyze --skills` để:
- Detect functional areas via Leiden community detection
- Tạo `SKILL.md` cho mỗi module dưới `.claude/skills/generated/`
- Mỗi skill mô tả: key files, entry points, execution flows, cross-area connections
- Regenerate mỗi lần `analyze --skills` để giữ同步 với codebase

---

## 6. Supported Languages

| Language | Imports | Named Bindings | Exports | Heritage | Type Annotations | Constructor Inference | Config | Frameworks | Entry Points |
|----------|---------|----------------|---------|----------|------------------|----------------------|--------|------------|--------------|
| TypeScript | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| JavaScript | ✅ | ✅ | ✅ | ✅ | — | ✅ | ✅ | ✅ | ✅ |
| Python | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Java | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | ✅ | ✅ |
| Kotlin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | ✅ | ✅ |
| C# | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Go | ✅ | — | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Rust | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | ✅ | ✅ |
| PHP | ✅ | ✅ | ✅ | — | ✅ | ✅ | ✅ | ✅ | ✅ |
| Ruby | ✅ | — | ✅ | ✅ | — | ✅ | — | ✅ | ✅ |
| Swift | — | — | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| C | — | — | ✅ | — | ✅ | ✅ | — | ✅ | ✅ |
| C++ | — | — | ✅ | ✅ | ✅ | ✅ | — | ✅ | ✅ |

---

## 7. Usage Guide

### 7.1 CLI Commands

```bash
# Index current repository
npx gitnexus analyze

# Options
npx gitnexus analyze --force           # Full re-index
npx gitnexus analyze --skills          # Generate repo-specific skills
npx gitnexus analyze --skip-embeddings # Faster, no embeddings
npx gitnexus analyze --embeddings      # Enable embeddings (slower, better search)
npx gitnexus analyze --verbose         # Log skipped files

# One-time MCP setup for editors
npx gitnexus setup

# Other utilities
gitnexus list                         # List all indexed repositories
gitnexus status                       # Show index status for current repo
gitnexus clean                        # Delete index for current repo
gitnexus clean --all --force          # Delete all indexes
gitnexus wiki                         # Generate repository wiki from knowledge graph
gitnexus serve                        # Start local HTTP server (for Web UI)
```

### 7.2 MCP Configuration (Manual)

**Claude Code (full support — MCP + skills + hooks):**
```bash
claude mcp add gitnexus -- npx -y gitnexus@latest mcp
```

**Cursor** (`~/.cursor/mcp.json`):
```json
{
  "mcpServers": {
    "gitnexus": {
      "command": "npx",
      "args": ["-y", "gitnexus@latest", "mcp"]
    }
  }
}
```

**OpenCode** (`~/.config/opencode/config.json`):
```json
{
  "mcp": {
    "gitnexus": {
      "command": "npx",
      "args": ["-y", "gitnexus@latest", "mcp"]
    }
  }
}
```

**Codex** (`.codex/config.toml`):
```toml
[mcp_servers.gitnexus]
command = "npx"
args = ["-y", "gitnexus@latest", "mcp"]
```

### 7.3 Web UI

- No install: [gitnexus.vercel.app](https://gitnexus.vercel.app) — drag & drop a ZIP
- Local dev:
  ```bash
  git clone https://github.com/abhigyanpatwari/gitnexus.git
  cd gitnexus/gitnexus-web
  npm install
  npm run dev
  ```
- Bridge mode: Run `gitnexus serve` — Web UI auto-detects local server and shows all indexed repos.

---

## 8. Tool Examples

### 8.1 Impact Analysis

```javascript
impact({target: "UserService", direction: "upstream", minConfidence: 0.8})
```

**Response (pre-structured):**
```
TARGET: Class UserService (src/services/user.ts)

UPSTREAM (what depends on this):
 Depth 1 (WILL BREAK):
   handleLogin [CALLS 90%] -> src/api/auth.ts:45
   handleRegister [CALLS 90%] -> src/api/auth.ts:78
   UserController [CALLS 85%] -> src/controllers/user.ts:12
 Depth 2 (LIKELY AFFECTED):
   authRouter [IMPORTS] -> src/routes/auth.ts

Options: maxDepth, minConfidence, relationTypes (CALLS, IMPORTS, EXTENDS, IMPLEMENTS), includeTests
```

### 8.2 Context

```javascript
context({name: "validateUser"})
```

**Response:**
```json
{
  "symbol": {
    "uid": "Function:validateUser",
    "kind": "Function",
    "filePath": "src/auth/validate.ts",
    "startLine": 15
  },
  "incoming": {
    "calls": ["handleLogin", "handleRegister", "UserController"],
    "imports": ["authRouter"]
  },
  "outgoing": {
    "calls": ["checkPassword", "createSession"]
  },
  "processes": [
    {"name": "LoginFlow", "step_index": 2},
    {"name": "RegistrationFlow", "step_index": 3}
  ]
}
```

### 8.3 Detect Changes

```javascript
detect_changes({scope: "all"})
```

**Response:**
```json
{
  "summary": {
    "changed_count": 12,
    "affected_count": 3,
    "changed_files": 4,
    "risk_level": "medium"
  },
  "changed_symbols": ["validateUser", "AuthService", ...],
  "affected_processes": ["LoginFlow", "RegistrationFlow", ...]
}
```

### 8.4 Rename (Multi-file Coordinated)

```javascript
rename({symbol_name: "validateUser", new_name: "verifyUser", dry_run: true})
```

**Response:**
```
status: success
files_affected: 5
total_edits: 8
graph_edits: 6 (high confidence)
text_search_edits: 2 (review carefully)
changes: [...]
```

### 8.5 Cypher Query

```cypher
MATCH (c:Community {heuristicLabel: 'Authentication'})<-[:CodeRelation {type: 'MEMBER_OF'}]-(fn)
MATCH (caller)-[r:CodeRelation {type: 'CALLS'}]->(fn)
WHERE r.confidence > 0.8
RETURN caller.name, fn.name, r.confidence
ORDER BY r.confidence DESC
```

---

## 9. Key Innovations (So sánh Traditional Graph RAG)

| Traditional Graph RAG | GitNexus Smart Tools |
|----------------------|----------------------|
| LLM nhận raw graph edges | LLM nhận pre-structured response |
| Cần 4+ queries để trả lời “What depends on UserService?” | 1 query là đủ |
| Dễ bỏ sót relationship do query chain | Đầy đủ, có confidence scores, depth grouping |
| Token-heavy (graph + multiple tool calls) | Token-efficient (only needed context) |
| Large models cần để explore | Small models vẫn làm việc tốt |

**Ví dụ:**

```
User: What depends on UserService?

Traditional:
 LLM → Q1: Find callers
      → Q2: What files?
      → Q3: Filter tests?
      → Q4: High-risk?
 → Answer sau 4+ queries

GitNexus:
 User → impact({target:"UserService", upstream:true, minConfidence:0.8})
 → Pre-structured: 8 callers, 3 clusters, all >90% confidence
 → Answer sau 1 query
```

---

## 10. Editor Integration Matrix

| Editor | MCP | Skills | Hooks | Support |
|--------|-----|--------|-------|--------|
| Claude Code | ✅ | ✅ | ✅ (PreToolUse + PostToolUse) | Full |
| Cursor | ✅ | ✅ | — | MCP + Skills |
| Windsurf | ✅ | — | — | MCP |
| OpenCode | ✅ | ✅ | — | MCP + Skills |
| Codex | ✅ | — | — | MCP |

---

## 11. Highlighted Features

- **Incremental Indexing** — Only re-index changed files (fast updates)
- **LLM Cluster Enrichment** — Semantic cluster names via LLM API
- **AST Decorator Detection** — Parse `@Controller`, `@Get`, etc.
- **Constructor-Inferred Type Resolution** — Self/this receiver mapping across files
- **Wiki Generation** — LLM-powered docs từ knowledge graph (với mermaid diagrams)
- **Multi-File Rename** — Coordinated rename với graph + text search
- **Git-Diff Impact Analysis** — Map changed lines → affected processes
- **Process-Grouped Search** — Search theo process group (e.g., “LoginFlow”)
- **360-Degree Context** — Full symbol view: incoming/outgoing, processes
- **Claude Code Hooks** — Auto-reindex sau commits
- **Multi-Repo MCP** — One MCP server, multiple indexed repos
- **Zero-Config Setup** — `gitnexus setup` auto-detects editors

---

## 12. Limitations & Considerations

⚠️ **Web UI memory bound** — ~5k files limit in browser; use `gitnexus serve` for large repos  
⚠️ **Embeddings generation** — Slower; can skip with `--skip-embeddings`  
⚠️ **Tree-sitter dependency** — New languages require parser support  
⚠️ **Initial indexing** — Có thể chậm với large codebases (AST parsing)  
⚠️ **No security scanning** — Chỉ focus architecture, không phát hiện vulnerabilities  
⚠️ **Local-first** — Không có cloud sync; mỗi máy cần index riêng

---

## 13. Comparison with Other Tools

| Feature | GitNexus | Sourcegraph | OpenGrok | Understand (SciTools) |
|---------|----------|-------------|----------|----------------------|
| Knowledge graph | ✅ (custom, clustering) | ✅ (basic) | ❌ | ✅ (commercial) |
| Precomputed processes | ✅ | ❌ | ❌ | ❌ |
| MCP support | ✅ | ❌ | ❌ | ❌ |
| Agent skills | ✅ | ❌ | ❌ | ❌ |
| Local-first | ✅ | ❌ (self-hosted server) | ❌ (server) | ✅ (desktop) |
| Web UI | ✅ (WASM) | ✅ | ✅ | ❌ |
| Multi-language | 13+ | 30+ | 20+ | 10+ |
| Free / Open Source | ✅ (Polyform Noncommercial 1.0) | ❌ | ✅ (Apache) | ❌ |

---

## 14. Conclusion

GitNexus là **công cụ code intelligence mới** tập trung vào **AI agent context** thay vì chỉ tìm kiếm. Bằng cách **precompute** clustering, processes, và confidence, nó biến knowledge graph thành **smart tools** mà LLM có thể dùng ngay lập tức, với:

- **Reliability** — LLM không thể bỏ context vì tools đã trả về sẵn complete answer.
- **Token efficiency** — Không cần chuỗi nhiều queries.
- **Model democratization** — Small models vẫn cạnh tranh với goliath nhờ tools làm công việc nặng.

**Phù hợp cho:**
- Teams dùng AI coding agents (Claude Code, Cursor, OpenCode) muốn agents hiểu sâu codebase.
- Large monorepos cần impact analysis, safe refactoring.
- Onboarding nhanh chóng qua processes & clusters.
- Multi-language projects cần unified view.

**Không phù hợp nếu:**
- Chỉ cần text search (md/ripgrep đủ).
- Không dùng AI agents.
- Codebase rất nhỏ (<100 files).

**Đánh giá:** **8.5/10** — Đổi mới, thiết thực, architecture tốt, nhưng cần thời gian indexing và learning curve cho new users.

---

## 15. Next Steps (Suggested)

1. **Install & try** on CCN2 codebase: `npx gitnexus analyze` (CLI) + `npx gitnexus setup` (MCP)
2. **Generate skills**: `npx gitnexus analyze --skills` để có repo-specific skills
3. **Use in Claude Code** — thử `impact`, `context`, `detect_changes` với một thay đổi nhỏ
4. **Generate wiki**: `gitnexus wiki` để có tài liệu architecture tự động
5. **Compare** với cách hiện tại (manual search) — đo token savings, accuracy

---

*Báo cáo tự động hóa bởi OpenClaw Agent — 2026-03-19 09:45 Asia/Bangkok*
