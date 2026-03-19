# GitNexus Automation Skill — Implementation Plan

*Ngày: 2026-03-19*  
*Tác giả: Cốm Đào (OpenClaw Agent)*

---

## 1. Mục tiêu & Phạm vi

**Mục tiêu**: Tạo OpenClaw skill `gitnexus-integration` để tự động hóa GitNexus workflow cho CCN2 development.

**Phạm vi**:
- Tích hợp GitNexus CLI (npx gitnexus) vào OpenClaw agents
- Cung cấp tools để analyze, generate skills, check status, clean index
- Hỗ trợ manual trigger và scheduled runs (via cron)
- Tạo repo-specific skills tự động sau analyze

**Ngoài phạm vi**:
- Cài đặt GitNexus itself (giả sử đã có npx)
- Web UI, браузер integration
- Multi-repo management (focus on CCN2 repo, nhưng có thể parameterize)

---

## 2. User Stories

1. **Là developer**, tôi muốn chạy `gitnexus_analyze()` để index CCN2 codebase, nhận summary và biết khi nào hoàn thành.
2. **Là developer**, tôi muốn chạy `gitnexus_generate_skills()` để tạo/update `.claude/skills/generated/` từ knowledge graph.
3. **Là developer**, tôi muốn xem `gitnexus_status()` để kiểm tra index đã stale chưa, kích thước index.
4. **Là developer**, tôi muốn `gitnexus_clean()` để xóa index khi cần (ví dụ: trước khi chuyển branch).
5. **Là AI agent**, tôi muốn có tool `detect_changes` (đã có trong MCP) nhưng muốn nó chạy tự động sau mỗi commit.

---

## 3. Yêu cầu chức năng

### 3.1 Tools cần implement

| Tool | Params | Mô tả | Output |
|------|--------|-------|--------|
| `gitnexus_analyze` | `repo_path?: string`, `force?: boolean`, `skip_embeddings?: boolean`, `embeddings?: boolean`, `verbose?: boolean`, `skills?: boolean` | Chạy `npx gitnexus analyze` với options. Nếu `skills=true`, cũng generate skills. | `{ success: boolean, stdout: string, stderr: string, index_path?: string, duration_ms?: number }` |
| `gitnexus_generate_skills` | `repo_path?: string` | Chạy `npx gitnexus analyze --skills` để tạo/update repo-specific skills. | `{ success: boolean, skills_created: string[], output: string }` |
| `gitnexus_status` | `repo_path?: string` | Chạy `npx gitnexus status` để lấy thông tin index. | `{ indexed: boolean, last_indexed?: string, file_count?: number, cluster_count?: number, process_count?: number, stale?: boolean }` |
| `gitnexus_clean` | `repo_path?: string`, `all?: boolean`, `force?: boolean` | Xóa index: nếu `all=true` thì xóa tất cả, nếu không thì xóa của repo hiện tại. | `{ success: boolean, message: string }` |
| `gitnexus_serve` | `background?: boolean`, `port?: number` | Start `gitnexus serve` (background nếu requested). Dùng để connect Web UI. | `{ success: boolean, pid?: number, url?: string }` |
| `gitnexus_wiki` | `repo_path?: string`, `model?: string`, `base_url?: string`, `force?: boolean` | Generate wiki từ knowledge graph. | `{ success: boolean, pages_created: number, output: string }` |

**Notes**:
- `repo_path`: default là current workspace nếu không truyền.
- Các tool sẽ dùng `exec` để chạy `npx gitnexus ...` trong thư mục repo.
- Nếu GitNexus chưa installed, trả về error với hướng dẫn cài đặt.

### 3.2 Auto-trigger workflows

- **On-demand**: Agent gọi tools trực tiếp.
- **Cron**: Có thể schedule `gitnexus_analyze` hàng ngày hoặc sau mỗi commit (nếu có git hook).
- **Git hook**: Tích hợp `post-commit` để chạy incremental analyze. (Có thể cần config)

---

## 4. Kiến trúc skill

```
gitnexus-integration/
├── SKILL.md          # Skill specification (tools, usage)
├── skill.ts          # Implementation
├── utils/
│   ├── runner.ts    # Helper để chạy npx gitnexus và capture output
│   └── parser.ts    # Parse output thành structured data
└── tests/
    └── skill.test.ts # Unit tests (mocking exec)
```

**Dependencies**:
- Không import external npm packages (trừ dev).
- Dùng global OpenClaw tools: `exec`, `read`, `write`, `log`.
- Dùng Node.js `child_process` implicitly qua `exec`.

**State management**:
- Lưu index trong `.gitnexus/` của repo (do GitNexus tự quản lý).
- Skill không lưu state riêng, chỉ là wrapper.

---

## 5. Implementation steps

### Phase 1: Core wrapper
1. Tạo skeleton skill folder.
2. Implement `runGitNexusCommand(command: string, args: string[], options?: ExecOptions)` — dùng `exec` với `pty: false`, capture stdout/stderr.
3. Implement `gitnexus_analyze` tool theo spec.
4. Implement `gitnexus_status` parser (đọc output của `gitnexus status`).

### Phase 2: Generate skills & wiki
5. Implement `gitnexus_generate_skills` (alias analyze --skills).
6. Implement `gitnexus_wiki` (nếu có LLM API key, có thể skip).

### Phase 3: Clean & serve
7. Implement `gitnexus_clean`.
8. Implement `gitnexus_serve` (background mode với `bg: true` và `pty: false`).
9. Add tool descriptions, examples vào SKILL.md.

### Phase 4: Testing & polish
10. Test trên CCN2 repo: verify index tạo, skills generate.
11. Thêm error handling (GitNexus not found, permission denied, repo not git).
12. Add logging (console.info, error).
13. Write unit tests (mock exec để test parser và logic).

### Phase 5: Deployment
14. Copy skill folder vào `~/.openclaw/workspace/skills/gitnexus-integration/`.
15. Restart gateway (dùng `gateway restart`).
16. Verify skill loaded (xem trong `skills list`).
17. Test manual trigger từ agent chat.

---

## 6. Testing plan

- **Unit tests**:
  - Mock exec để test command builder và output parser.
  - Test `parseStatusOutput` với sample output.
  - Test error cases (command not found, non-zero exit).

- **Integration tests**:
  - Chạy thật trên CCN2 repo nhỏ (test repo).
  - Verify `.gitnexus/` được tạo.
  - Verify skills tạo trong `.claude/skills/generated/`.
  - Verify `gitnexus status` trả về đúng thông tin.

- **Agent test**:
  - Gọi tool `gitnexus_analyze` từ chat, xem kết quả.
  - Gọi `gitnexus_generate_skills` và kiểm tra skill files.
  - Dùng MCP query để xem knowledge graph hoạt động.

---

## 7. Deployment & Maintenance

**Deployment**:
- Place skill in `~/.openclaw/workspace/skills/gitnexus-integration/`
- Ensure Node.js và npx có sẵn trên host.
- Restart gateway: `openclaw gateway restart`

**Maintenance**:
- Khi GitNexus update, có thể cần update skill để hỗ trợ flags mới.
- Giám sát index size, có thể schedule `gitnexus clean` định kỳ.
- Nếu dùng Web UI, cần `gitnexus serve` chạy background (có thể dùng cron để start khi boot).

**Monitoring**:
- Log output của các tools lưu vào session history.
- Có thể tạo cron job để chạy `gitnexus analyze` tự động (ví dụ: mỗi ngày 2am).

---

## 8. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| GitNexus not installed | Tools fail | Clear error message hướng dẫn cài đặt (`npm install -g gitnexus` hoặc dùng npx) |
| Indexing large repo耗 resources | Slow, memory | Provide `--skip-embeddings`, incremental indexing, run during off-hours |
| Permission denied (exec) | Cannot run npx | Use `host: "gateway"` với proper exec config; hoặc yêu cầu user cấp quyền |
| .gitnexus/ bị xóa nhầm | Mất index | `gitnexus_clean` yêu cầu xác nhận (`force: true`) |
| MCP server not running | Agents không query | `gitnexus_serve` tool để start; có thể auto-start khi cần? |
| Output format thay đổi giữa GitNexus versions | Parser fail | Parse linh hoạt, fallback to raw output; version check |

---

## 9. Success Metrics

- ✅ Agent có thể gọi `gitnexus_analyze()` và nhận kết quả trong <30s (cho repo medium).
- ✅ Skills được generate tự động vào `.claude/skills/generated/`.
- ✅ `gitnexus_status()` trả về JSON chính xác.
- ✅ Không có memory leaks khi chạy nhiều lần.
- ✅ Tích hợp với cron jobs hiện tại (ví dụ: chạy hàng đêm).

---

## 10. Next Steps (Sau plan)

1. **Approve plan** — Anh đồng ý với scope và design?
2. **Implement** — Em sẽ bắt đầu tạo skill.
3. **Test** — Trên CCN2 repo.
4. **Deploy** — Copy vào workspace, restart gateway.
5. **Use** — Integrate vào agent workflows (cron, chat commands).

---

**Appendix: Sample tool call**

```typescript
// Trong agent chat hoặc cron job
{
  "tool": "gitnexus_analyze",
  "params": {
    "repo_path": "D:/PROJECT/CCN2",
    "skills": true,
    "skip_embeddings": true
  }
}
```

**Response**:
```json
{
  "success": true,
  "stdout": "Indexed 1234 files, 567 clusters, 890 processes.",
  "index_path": "D:/PROJECT/CCN2/.gitnexus/",
  "duration_ms": 45231
}
```

---

*Plan được brainstorm và lập bằng OpenClaw Agent sử dụng skill brainstorming và skill-creator guidelines.*
