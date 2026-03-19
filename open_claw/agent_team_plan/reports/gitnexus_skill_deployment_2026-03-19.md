# GitNexus Integration Skill — Deployment Report

*Ngày: 2026-03-19*  
*Người triển khai: Cốm Đào (OpenClaw Agent)*

---

## Mục tiêu

Tự động hóa GitNexus code intelligence pipeline trong CCN2 development workflow:
- Index codebase
- Generate repo-specific Claude skills
- Provide MCP tools for agents
- Schedule incremental updates

---

## Các tệp đã tạo

| Tệp | Mục đích |
|-----|----------|
| `~/.openclaw/workspace/skills/gitnexus-integration/SKILL.md` | Skill specification (tools, usage, setup) |
| `~/.openclaw/workspace/skills/gitnexus-integration/skill.ts` | Implementation (TypeScript) |
| `D:/PROJECT/CCN2/research_doc/gitnexus-analysis.md` | Báo cáo phân tích chi tiết GitNexus |
| `D:/PROJECT/CCN2/research_doc/gitnexus-automation-plan.md` | Kế hoạch triển khai chi tiết |
| `MEMORY.md` (updated) | Thêm entry về skill mới |

---

## Tools cung cấp (6)

| Tool | Mô tả | Input params |
|------|-------|--------------|
| `gitnexus_analyze` | Index repository, optional generate skills | `repo_path`, `force`, `skip_embeddings`, `embeddings`, `verbose`, `skills` |
| `gitnexus_generate_skills` | Generate/update repo-specific skills | `repo_path` |
| `gitnexus_status` | Lấy trạng thái index từ registry | `repo_path` |
| `gitnexus_clean` | Xóa index (repo cụ thể hoặc tất cả) | `repo_path`, `all`, `force` |
| `gitnexus_serve` | Start local HTTP server (bridge mode) | `background`, `port`, `host` |
| `gitnexus_wiki` | Generate wiki từ knowledge graph | `repo_path`, `model`, `base_url`, `force` |

---

## Kiến trúc & Dependencies

- **Runtime**: Node.js với access to `exec` tool.
- **External dependency**: GitNexus CLI (`npx gitnexus` — không cần install global, dùng npx là đủ).
- **Storage**: Index được lưu trong `.gitnexus/` (gitignored) của repo; registry toàn cục ở `~/.gitnexus/registry.json`.
- **MCP Integration**: Sau khi index, các tools `impact`, `context`, `detect_changes`, `rename`, `cypher` tự động khả dụng cho bất kỳ agent nào connect MCP (Claude Code, Cursor, OpenCode, Codex).
- **Privacy**: Hoàn toàn local; không upload code nào lên cloud.

---

## Cách sử dụng

### 1. Manual Trigger (từ chat)

```
Analyze CCN2 repo with GitNexus and generate skills.
```

Agent sẽ gọi:
```json
{
  "tool": "gitnexus_analyze",
  "params": {
    "repo_path": "D:/PROJECT/CCN2",
    "skills": true,
    "skip_embeddings": true
  }
}
```

### 2. Cron Job (tự động hàng đêm)

Thêm cron job:

```json
{
  "schedule": { "kind": "cron", "expr": "0 2 * * *", "tz": "Asia/Bangkok" },
  "payload": {
    "kind": "agentTurn",
    "message": "RUN gitnexus_analyze({repo_path: 'D:/PROJECT/CCN2', skills: true, skip_embeddings: true})"
  },
  "sessionTarget": "isolated",
  "delivery": { "mode": "announce", "channel": "telegram", "to": "526521221" }
}
```

### 3. MCP Setup (cho editors)

Chạy một lần:
```bash
npx gitnexus setup
```
Tự động viết global MCP config cho các editors hỗ trợ.

---

## Testing & Validation

### Test analyze
```bash
# Trong chat, yêu cầu agent:
Run gitnexus_analyze({repo_path: 'D:/PROJECT/CCN2', skills: true})
```

Kỳ vọng:
- Index được tạo tại `D:/PROJECT/CCN2/.gitnexus/`
- Repo-specific skills được tạo trong `D:/PROJECT/CCN2/.claude/skills/generated/`
- Output trả về summary: số files, clusters, processes.

### Test status
```json
{
  "tool": "gitnexus_status",
  "params": { "repo_path": "D:/PROJECT/CCN2" }
}
```
Kỳ vọng: Trả về `indexed: true`, cùng các số liệu.

### Test generate skills riêng
```json
{
  "tool": "gitnexus_generate_skills",
  "params": { "repo_path": "D:/PROJECT/CCN2" }
}
```

---

## Known Issues & Mitigations

| Issue | Impact | Mitigation |
|-------|--------|------------|
| GitNexus not installed on host | Tools fail with "command not found" | Use `npx` (no install) or guide user to `npm install -g gitnexus` |
| Large repo indexing slow (>10min) | Agent timeout (default 10min) | Use `skip_embeddings`; increase timeout if needed; run off-peak |
| Permission denied writing `.gitnexus/` | Index fails | Ensure agent has write permission to repo root |
| Memory exhausted on huge codebase | Process crash | Use `--skip-embeddings`; consider splitting repo |
| MCP tools not appearing after index | No connection to MCP server | Ensure `gitnexus analyze` completed; check `~/.gitnexus/registry.json` exists |
| Web UI cannot connect | `gitnexus serve` not running | Start with `gitnexus_serve` tool (background) |

---

## Next Steps

1. **Restart Gateway** để load skill mới:
   ```bash
   openclaw gateway restart
   ```
2. **Test skill** trên CCN2 repo.
3. **Schedule nightly analyze** via cron (optional).
4. **Generate wiki** (nếu cần) với `gitnexus_wiki` (cần API key).
5. **Integrate into development workflow**: chạy analyze sau mỗi major feature branch merge.

---

## Success Criteria

- ✅ Skill loaded without errors.
- ✅ `gitnexus_analyze` hoàn thành trong vòng 10 phút cho CCN2 repo medium size.
- ✅ Repo-specific skills xuất hiện trong `.claude/skills/generated/`.
- ✅ MCP tools (`impact`, `context`, `detect_changes`) có thể được gọi từ Claude Code/Cursor.
- ✅ Không có memory leaks sau nhiều lần chạy.

---

## Appendices

### A. Sample tool output (expected)

```json
{
  "success": true,
  "stdout": "Indexed 1234 files, 567 clusters, 890 processes.",
  "index_path": "D:/PROJECT/CCN2/.gitnexus/",
  "duration_ms": 45231
}
```

### B. Generated skills structure

```
.claude/skills/generated/
├── authentication.md
├── game-mechanics.md
├── network-server.md
└── ...
```

Mỗi file mô tả module: key files, entry points, execution flows, cross-connections.

### C. MCP resources sau khi index

- `gitnexus://repos` — list all indexed
- `gitnexus://repo/ccn2_workspace/context` — stats
- `gitnexus://repo/ccn2_workspace/clusters` — functional clusters
- `gitnexus://repo/ccn2_workspace/processes` — execution flows

---

*Báo cáo tự động tạo lúc 11:16 Asia/Bangkok.*
