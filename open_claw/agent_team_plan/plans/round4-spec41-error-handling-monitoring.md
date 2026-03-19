# Round 4 Spec 4.1 — Error Handling + Monitoring Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm error handling (Log & Skip) cho 6 agents + pipeline timeout detection (48h) + HTML dashboard auto-generated bởi agent_qc.

**Architecture:** Agent-level: mỗi HEARTBEAT.md wrap logic trong try/catch, ghi error.log khi fail. Pipeline-level: agent_qc Part G quét GDD stuck > 48h. Dashboard: agent_qc cuối Part F overwrite dashboard.html dùng data từ state files.

**Tech Stack:** Markdown (HEARTBEAT/AGENTS updates), JSON (state files), HTML/CSS/JS inline (dashboard), Windows paths

**Spec:** `specs/2026-03-19-round4-error-handling-monitoring.md`

---

## Chunk A: Error Log Infrastructure

### Task 1: Tạo error.log + update SCHEMA.md

**Files:**
- Create: `ccn2_workspace/.state/error.log`
- Modify: `ccn2_workspace/.state/SCHEMA.md`

- [ ] **Step 1: Tạo error.log rỗng**

Tạo file `ccn2_workspace/.state/error.log` với nội dung rỗng (blank file).

- [ ] **Step 2: Verify file tồn tại**

Kiểm tra `ccn2_workspace/.state/error.log` tồn tại và size = 0.

- [ ] **Step 3: Update SCHEMA.md — thêm Error Log section**

Mở `ccn2_workspace/.state/SCHEMA.md`, append nội dung sau vào cuối file:

```
---

## 9. Error Log

**Path**: `ccn2_workspace/.state/error.log`
**Owner**: All agents append; agent_qc sole rotator
**Format** (1 line per error, append):

    [ISO8601+07:00] <agent_id> | file=<filename> | error=<ErrorType>: <message>

**Example**:

    [2026-03-19T14:30:00+07:00] agent_dev | file=elemental-hunter.md | error=JSONParseError: Unexpected token

**Rotation policy**:
- Max 500 lines
- agent_qc keeps 400 newest lines when exceeded (sole rotator — avoids race condition)
- Multi-agent concurrent append is safe (single-line OS atomicity)

**State entry on error** (in *_processed.json):

    {
      "filename": {
        "hash": "last_known_or_empty",
        "processedAt": "ISO8601+07:00",
        "status": "error",
        "notes": "ErrorType: message"
      }
    }
```

Note: Dùng 4-space indented code blocks (không dùng triple-backtick) để tránh lồng fence trong file SCHEMA.md.

- [ ] **Step 4: Verify SCHEMA.md có section 9**

Đọc lại `ccn2_workspace/.state/SCHEMA.md` — confirm section 9 đã có.

### Task 2: Update pipeline-health.json — thêm stuck_gdds field

**Files:**
- Modify: `ccn2_workspace/.state/pipeline-health.json`

- [ ] **Step 1: Đọc pipeline-health.json hiện tại**

Mở `ccn2_workspace/.state/pipeline-health.json` để xem cấu trúc hiện tại.

- [ ] **Step 2: Thêm stuck_gdds field vào cấu trúc hiện tại**

⚠️ KHÔNG overwrite toàn bộ file. Chỉ thêm field `"stuck_gdds": []` vào JSON object hiện tại.

Đọc file hiện tại → thêm `"stuck_gdds": []` vào cuối object (trước closing `}`). Ví dụ nếu file hiện có:
```json
{
  "passed": 6,
  "last_run": "2026-03-19T11:59:39+07:00",
  "overall": "HEALTHY",
  "checks": { ... }
}
```
Kết quả sau khi thêm:
```json
{
  "passed": 6,
  "last_run": "2026-03-19T11:59:39+07:00",
  "overall": "HEALTHY",
  "checks": { ... },
  "stuck_gdds": []
}
```

- [ ] **Step 3: Verify JSON valid**

Đọc lại file — confirm `"stuck_gdds"` field tồn tại, JSON valid (không bị broken braces/quotes).

---

## Chunk B: HEARTBEAT.md Error Handling Section (6 agents)

> Pattern chung: Mỗi HEARTBEAT.md thêm section "## Error Handling" sau phần cuối hiện tại.

### Task 3: agent_gd/HEARTBEAT.md

**Files:**
- Modify: `openclaw/agents/agent_gd/HEARTBEAT.md`

- [ ] **Step 1: Đọc agent_gd/HEARTBEAT.md**

Xem nội dung hiện tại để biết cấu trúc và tìm vị trí thêm.

- [ ] **Step 2: Append Error Handling section**

Thêm vào cuối file:

```markdown
---

## Error Handling

**Approach**: Log & Skip — wrap toàn bộ processing logic trong try/catch.

**Khi catch error**:
1. Ghi vào state file entry: `status: "error"`, `notes: "<ErrorType>: <message>"`
2. Append vào `ccn2_workspace/.state/error.log`:
   `[ISO8601+07:00] agent_gd | file=<filename> | error=<ErrorType>: <message>`
3. Continue (không throw, không exit non-zero)

**Cron exit**: Luôn exit 0 — tránh OpenClaw retry storm.
Failure tracking qua: state file status="error" + error.log.
```

- [ ] **Step 3: Verify section đã thêm**

Đọc lại file — confirm "## Error Handling" xuất hiện.

### Task 4: agent_dev/HEARTBEAT.md

**Files:**
- Modify: `openclaw/agents/agent_dev/HEARTBEAT.md`

- [ ] **Step 1: Đọc agent_dev/HEARTBEAT.md**

- [ ] **Step 2: Append Error Handling section** (nội dung giống Task 3 nhưng `agent_gd` → `agent_dev`)

```markdown
---

## Error Handling

**Approach**: Log & Skip — wrap toàn bộ processing logic trong try/catch.

**Khi catch error**:
1. Ghi vào state file entry: `status: "error"`, `notes: "<ErrorType>: <message>"`
2. Append vào `ccn2_workspace/.state/error.log`:
   `[ISO8601+07:00] agent_dev | file=<filename> | error=<ErrorType>: <message>`
3. Continue (không throw, không exit non-zero)

**Cron exit**: Luôn exit 0 — tránh OpenClaw retry storm.
Failure tracking qua: state file status="error" + error.log.
```

- [ ] **Step 3: Verify section đã thêm**

### Task 5: agent_qc/HEARTBEAT.md

**Files:**
- Modify: `openclaw/agents/agent_qc/HEARTBEAT.md`

- [ ] **Step 1: Đọc agent_qc/HEARTBEAT.md**

- [ ] **Step 2: Append Error Handling section** (`agent_qc` + note về rotation responsibility)

```markdown
---

## Error Handling

**Approach**: Log & Skip — wrap toàn bộ processing logic trong try/catch.

**Khi catch error**:
1. Ghi vào state file entry: `status: "error"`, `notes: "<ErrorType>: <message>"`
2. Append vào `ccn2_workspace/.state/error.log`:
   `[ISO8601+07:00] agent_qc | file=<filename> | error=<ErrorType>: <message>`
3. Continue (không throw, không exit non-zero)

**Cron exit**: Luôn exit 0 — tránh OpenClaw retry storm.

**Rotation responsibility** (agent_qc là sole rotator):
- Mỗi lần chạy Part F: kiểm tra line count của error.log
- Nếu > 500 lines: giữ 400 dòng cuối (xóa 100 dòng đầu)
- Đồng thời: xóa pipeline-watch reports cũ nếu > 14 files
```

- [ ] **Step 3: Verify section đã thêm**

### Task 6: agent_dev_client/HEARTBEAT.md

**Files:**
- Modify: `openclaw/agents/agent_dev_client/HEARTBEAT.md`

- [ ] **Step 1: Đọc agent_dev_client/HEARTBEAT.md**

- [ ] **Step 2: Append Error Handling section** (`agent_dev_client`)

```markdown
---

## Error Handling

**Approach**: Log & Skip — wrap toàn bộ processing logic trong try/catch.

**Khi catch error**:
1. Ghi vào state file entry: `status: "error"`, `notes: "<ErrorType>: <message>"`
2. Append vào `ccn2_workspace/.state/error.log`:
   `[ISO8601+07:00] agent_dev_client | file=<filename> | error=<ErrorType>: <message>`
3. Continue (không throw, không exit non-zero)

**Cron exit**: Luôn exit 0 — tránh OpenClaw retry storm.
Failure tracking qua: state file status="error" + error.log.
```

- [ ] **Step 3: Verify section đã thêm**

### Task 7: agent_dev_server/HEARTBEAT.md

**Files:**
- Modify: `openclaw/agents/agent_dev_server/HEARTBEAT.md`

- [ ] **Step 1: Đọc agent_dev_server/HEARTBEAT.md**

- [ ] **Step 2: Append Error Handling section** (`agent_dev_server`)

```markdown
---

## Error Handling

**Approach**: Log & Skip — wrap toàn bộ processing logic trong try/catch.

**Khi catch error**:
1. Ghi vào state file entry: `status: "error"`, `notes: "<ErrorType>: <message>"`
2. Append vào `ccn2_workspace/.state/error.log`:
   `[ISO8601+07:00] agent_dev_server | file=<filename> | error=<ErrorType>: <message>`
3. Continue (không throw, không exit non-zero)

**Cron exit**: Luôn exit 0 — tránh OpenClaw retry storm.
Failure tracking qua: state file status="error" + error.log.
```

- [ ] **Step 3: Verify section đã thêm**

### Task 8: agent_dev_admin/HEARTBEAT.md

**Files:**
- Modify: `openclaw/agents/agent_dev_admin/HEARTBEAT.md`

- [ ] **Step 1: Đọc agent_dev_admin/HEARTBEAT.md**

- [ ] **Step 2: Append Error Handling section** (`agent_dev_admin`)

```markdown
---

## Error Handling

**Approach**: Log & Skip — wrap toàn bộ processing logic trong try/catch.

**Khi catch error**:
1. Ghi vào state file entry: `status: "error"`, `notes: "<ErrorType>: <message>"`
2. Append vào `ccn2_workspace/.state/error.log`:
   `[ISO8601+07:00] agent_dev_admin | file=<filename> | error=<ErrorType>: <message>`
3. Continue (không throw, không exit non-zero)

**Cron exit**: Luôn exit 0 — tránh OpenClaw retry storm.
Failure tracking qua: state file status="error" + error.log.
```

- [ ] **Step 3: Verify section đã thêm**

---

## Chunk C: Pipeline Watch (agent_qc Part G)

### Task 9: agent_qc/AGENTS.md — thêm Part G

**Files:**
- Modify: `openclaw/agents/agent_qc/AGENTS.md`

- [ ] **Step 1: Đọc agent_qc/AGENTS.md**

Tìm phần cuối của file để biết vị trí append.

- [ ] **Step 2: Append Part G sau Part F**

Append nội dung sau vào cuối `openclaw/agents/agent_qc/AGENTS.md`
(Dùng 4-space indentation cho code blocks bên trong — không dùng triple-backtick để tránh fence conflict):

    ---

    ## Part G — Pipeline Watch

    **Trigger**: Mỗi lần cron chạy, sau Part F (Smoke Test).

    **Logic**:

        For each file matching ccn2_workspace/design/GDD-FEATURE-*.md:
          1. Đọc header field "Trạng thái"
          2. Nếu Trạng thái ∉ {InDev, InQC} → skip
          3. Đọc header field "Cập nhật lần cuối lúc" (ISO8601+07:00)
             → Nếu field rỗng/missing → log warning vào error.log, skip file
          4. Tính delta = now - "Cập nhật lần cuối lúc"
          5. Nếu delta > 48h → thêm vào stuck_list: {file, status, hours_stuck}

    **Nếu stuck_list non-empty**:
    - Tạo `ccn2_workspace/reports/pipeline-watch-YYYY-MM-DD-HH-mm.md`
    - Report format:

          # Pipeline Watch — YYYY-MM-DD HH:mm
          ## Stuck GDDs (>48h)
          | GDD | Status | Hours Stuck | Last Updated By |
          |-----|--------|-------------|-----------------|
          | <file> | <status> | <N>h | <agent> |
          ## Action Required
          - [ ] Manual check required — xem RUNBOOK-stuck-pipeline.md

    - Update `.state/pipeline-health.json`: set `stuck_gdds` = stuck_list
    - Alert Telegram: `⏰ [Pipeline Watch] GDD <name> stuck in <status> for <N>h`

    **Nếu stuck_list empty**: Không tạo report, không alert. Set `stuck_gdds = []`.

    **Cleanup (same pass)**:
    - Nếu pipeline-watch reports > 14: xóa file timestamp cũ nhất
    - Nếu error.log > 500 lines: giữ 400 dòng cuối

    **Constraints**:
    - KHÔNG tự change GDD status
    - KHÔNG tạo report nếu không có GDD stuck
    - Silent khi healthy

- [ ] **Step 3: Verify Part G đã thêm**

Đọc lại AGENTS.md — confirm "## Part G" xuất hiện.

---

## Chunk D: HTML Dashboard

### Task 10: Tạo dashboard.html template

**Files:**
- Create: `ccn2_workspace/reports/dashboard.html`

- [ ] **Step 1: Tạo dashboard.html với structure đầy đủ**

Tạo file `ccn2_workspace/reports/dashboard.html`:

```html
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="refresh" content="900">
  <title>CCN2 Pipeline Dashboard</title>
  <style>
    :root {
      --bg: #0f172a;
      --surface: #1e293b;
      --surface2: #334155;
      --primary: #6366f1;
      --primary-light: #818cf8;
      --success: #22c55e;
      --warning: #f59e0b;
      --danger: #ef4444;
      --text: #f1f5f9;
      --text-muted: #94a3b8;
      --border: #334155;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: var(--bg); color: var(--text); font-family: 'Segoe UI', system-ui, sans-serif; padding: 24px; }
    h1 { font-size: 1.5rem; color: var(--primary-light); margin-bottom: 4px; }
    .subtitle { color: var(--text-muted); font-size: 0.875rem; margin-bottom: 24px; }
    .stale { color: var(--warning); font-size: 0.8rem; }

    /* Stats Bar */
    .stats-bar { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
    .stat-card { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 16px; }
    .stat-label { font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
    .stat-value { font-size: 1.5rem; font-weight: 700; margin-top: 4px; }
    .stat-value.ok { color: var(--success); }
    .stat-value.warn { color: var(--warning); }
    .stat-value.err { color: var(--danger); }

    /* Section */
    .section { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 16px; margin-bottom: 16px; }
    .section h2 { font-size: 1rem; color: var(--primary-light); margin-bottom: 12px; border-bottom: 1px solid var(--border); padding-bottom: 8px; }

    /* GDD Flow */
    .gdd-row { display: flex; align-items: center; gap: 12px; padding: 8px 0; border-bottom: 1px solid var(--border); }
    .gdd-row:last-child { border-bottom: none; }
    .gdd-name { flex: 1; font-size: 0.875rem; }
    .badge { padding: 2px 10px; border-radius: 999px; font-size: 0.75rem; font-weight: 600; }
    .badge.Draft { background: #334155; color: #94a3b8; }
    .badge.Review { background: #1e3a5f; color: #60a5fa; }
    .badge.InDev { background: #1e3a2f; color: #4ade80; }
    .badge.InQC { background: #3b1e5f; color: #c084fc; }
    .badge.Done { background: #14532d; color: #86efac; }
    .badge.Flagged { background: #7f1d1d; color: #fca5a5; }
    .badge.UNKNOWN { background: #334155; color: #94a3b8; }
    .gdd-time { font-size: 0.75rem; color: var(--text-muted); }

    /* Agent Cards */
    .agents-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .agent-card { background: var(--surface2); border-radius: 6px; padding: 12px; }
    .agent-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .agent-avatar { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.875rem; }
    .agent-name { font-size: 0.875rem; font-weight: 600; }
    .agent-meta { font-size: 0.75rem; color: var(--text-muted); }
    .agent-status { font-size: 0.75rem; margin-top: 4px; }

    /* Smoke Checks */
    .checks-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; }
    .check-item { background: var(--surface2); border-radius: 6px; padding: 10px; text-align: center; }
    .check-id { font-size: 0.75rem; color: var(--text-muted); }
    .check-icon { font-size: 1.25rem; margin: 4px 0; }
    .check-label { font-size: 0.7rem; color: var(--text-muted); }

    /* Errors */
    .error-list { font-family: 'Consolas', monospace; font-size: 0.75rem; color: var(--text-muted); }
    .error-item { padding: 4px 0; border-bottom: 1px solid var(--border); }
    .error-item:last-child { border-bottom: none; }
    .error-agent { color: var(--warning); }
    .no-data { color: var(--text-muted); font-style: italic; font-size: 0.875rem; }
  </style>
</head>
<body>
  <h1>CCN2 Pipeline Dashboard</h1>
  <div class="subtitle">
    Last updated: <span id="lastUpdated">—</span>
    <span class="stale" id="staleWarning" style="display:none"> ⚠️ Data may be stale</span>
  </div>

  <!-- Stats Bar -->
  <div class="stats-bar">
    <div class="stat-card">
      <div class="stat-label">Agents</div>
      <div class="stat-value ok" id="agentCount">—</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Cron Jobs</div>
      <div class="stat-value ok" id="cronCount">—</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Smoke Test</div>
      <div class="stat-value" id="smokeVerdict">—</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Stuck GDDs</div>
      <div class="stat-value" id="stuckCount">—</div>
    </div>
  </div>

  <!-- GDD Status Flow -->
  <div class="section">
    <h2>GDD Status Flow</h2>
    <div id="gddList"><div class="no-data">No GDD data</div></div>
  </div>

  <!-- Agent Cards -->
  <div class="section">
    <h2>Agents</h2>
    <div class="agents-grid" id="agentCards"></div>
  </div>

  <!-- Smoke Test Checks -->
  <div class="section">
    <h2>Smoke Test Checks</h2>
    <div class="checks-grid" id="smokeChecks"></div>
  </div>

  <!-- Recent Errors -->
  <div class="section">
    <h2>Recent Errors (last 10)</h2>
    <div class="error-list" id="errorList"><div class="no-data">No errors</div></div>
  </div>

  <script>
// ============================================================
// DASHBOARD DATA — injected by agent_qc each run
// ============================================================
const DASHBOARD_DATA = {
  generated_at: "",
  agents: [
    // { id: "agent_gd", name: "Designia", last_run: "", files_processed: 0, status: "ok|warn|error" }
  ],
  cron_jobs: 7,
  smoke: {
    verdict: "UNKNOWN",
    checks: { C1: "pending", C2: "pending", C3: "pending", C4: "pending", C5: "pending", C6: "pending" }
  },
  gdds: [
    // { name: "elemental-hunter.md", status: "InDev", last_updated: "", last_updated_by: "" }
  ],
  stuck_gdds: [],
  recent_errors: [
    // "[2026-03-19T14:30:00+07:00] agent_dev | file=x.md | error=JSONParseError: ..."
  ]
};
// ============================================================

const CHECK_LABELS = { C1_concepts: "Concepts", C2_design: "Design/GDD", C3_gdd_header: "GDD Headers", C4_src: "src/ dirs", C5_quality_report: "Quality rpt", C6_state_json: "State JSON" };
const CHECK_ICONS = { pass: "✅", fail: "❌", pending: "⬜", exempt: "➖" };
const AGENT_COLORS = {
  agent_gd: "#6366f1", agent_dev: "#22c55e", agent_qc: "#f59e0b",
  agent_dev_client: "#06b6d4", agent_dev_server: "#ec4899", agent_dev_admin: "#84cc16"
};

function render() {
  const d = DASHBOARD_DATA;

  // Header
  document.getElementById("lastUpdated").textContent = d.generated_at || "Never";
  if (d.generated_at) {
    const age = (Date.now() - new Date(d.generated_at)) / 60000;
    if (age > 30) document.getElementById("staleWarning").style.display = "inline";
  }

  // Stats
  document.getElementById("agentCount").textContent = d.agents.length || "0";
  document.getElementById("cronCount").textContent = d.cron_jobs || "7";
  const sv = document.getElementById("smokeVerdict");
  sv.textContent = d.smoke.verdict;
  sv.className = "stat-value " + (d.smoke.verdict === "HEALTHY" ? "ok" : d.smoke.verdict === "BROKEN" ? "err" : "warn");
  const sc = document.getElementById("stuckCount");
  sc.textContent = d.stuck_gdds.length;
  sc.className = "stat-value " + (d.stuck_gdds.length === 0 ? "ok" : "warn");

  // GDD List
  const gddEl = document.getElementById("gddList");
  if (d.gdds.length === 0) { gddEl.innerHTML = '<div class="no-data">No GDD files found</div>'; }
  else {
    gddEl.innerHTML = d.gdds.map(g => `
      <div class="gdd-row">
        <div class="gdd-name">${g.name}</div>
        <span class="badge ${g.status}">${g.status}</span>
        <div class="gdd-time">${g.last_updated ? "← " + g.last_updated : ""}</div>
      </div>`).join("");
  }

  // Agent Cards
  document.getElementById("agentCards").innerHTML = d.agents.map(a => `
    <div class="agent-card">
      <div class="agent-header">
        <div class="agent-avatar" style="background:${AGENT_COLORS[a.id] || '#6366f1'}22;color:${AGENT_COLORS[a.id] || '#6366f1'}">
          ${a.name ? a.name[0] : "?"}
        </div>
        <div>
          <div class="agent-name">${a.name || a.id}</div>
          <div class="agent-meta">${a.id}</div>
        </div>
      </div>
      <div class="agent-meta">Last run: ${a.last_run || "Never"}</div>
      <div class="agent-meta">Files: ${a.files_processed || 0}</div>
      <div class="agent-status">${a.status === "ok" ? "✅" : a.status === "error" ? "❌" : "⚠️"} ${a.status}</div>
    </div>`).join("") || '<div class="no-data">No agent data</div>';

  // Smoke Checks
  document.getElementById("smokeChecks").innerHTML = Object.entries(d.smoke.checks).map(([id, val]) => `
    <div class="check-item">
      <div class="check-id">${id}</div>
      <div class="check-icon">${CHECK_ICONS[val] || "⬜"}</div>
      <div class="check-label">${CHECK_LABELS[id] || id}</div>
    </div>`).join("");

  // Errors
  const errEl = document.getElementById("errorList");
  if (d.recent_errors.length === 0) { errEl.innerHTML = '<div class="no-data">No recent errors ✅</div>'; }
  else {
    errEl.innerHTML = d.recent_errors.map(e => {
      const parts = e.match(/\[(.+?)\] (\w+) \| (.+)/);
      if (!parts) return `<div class="error-item">${e}</div>`;
      return `<div class="error-item"><span style="color:#94a3b8">[${parts[1]}]</span> <span class="error-agent">${parts[2]}</span> | ${parts[3]}</div>`;
    }).join("");
  }
}

render();
  </script>
</body>
</html>
```

- [ ] **Step 2: Verify file structure bằng grep/read**

Đọc `ccn2_workspace/reports/dashboard.html`, confirm các điểm sau:
- Dòng `<meta http-equiv="refresh" content="900">` tồn tại
- Dòng `const DASHBOARD_DATA = {` tồn tại (injection point cho agent_qc)
- Dòng `const CHECK_LABELS = {` tồn tại
- Các section IDs tồn tại: `id="lastUpdated"`, `id="agentCards"`, `id="smokeChecks"`, `id="errorList"`
- Không có syntax lỗi obvious (unclosed tags, missing closing braces)

Note cho human: Mở file trong browser để visual verify dark theme + layout. Đây là bước tùy chọn, không blocking.

- [ ] **Step 3: Verify DASHBOARD_DATA injection point**

Tìm `const DASHBOARD_DATA = {` trong file — confirm nó nằm trong `<script>` tag và là object rỗng với placeholder comments.

---

## Chunk E: Tracking & Verification

### Task 11: Tạo plan progress tracking

**Files:**
- Create: `plans/round4-spec41-progress.md`

- [ ] **Step 1: Tạo progress file**

```markdown
# Round 4 Spec 4.1 — Progress

## Status: IN PROGRESS
Date started: 2026-03-19

## Deliverables (per spec `2026-03-19-round4-error-handling-monitoring.md`)
- [ ] D1: `ccn2_workspace/.state/error.log` (created empty)
- [ ] D2: 6 HEARTBEAT.md files — Error Handling section added
  - [ ] agent_gd/HEARTBEAT.md
  - [ ] agent_dev/HEARTBEAT.md
  - [ ] agent_qc/HEARTBEAT.md
  - [ ] agent_dev_client/HEARTBEAT.md
  - [ ] agent_dev_server/HEARTBEAT.md
  - [ ] agent_dev_admin/HEARTBEAT.md
- [ ] D3: `openclaw/agents/agent_qc/AGENTS.md` — Part G Pipeline Watch
- [ ] D4: `ccn2_workspace/.state/SCHEMA.md` — section 9 error.log spec
- [ ] D5: `ccn2_workspace/reports/dashboard.html` (template)
- [ ] D6: `ccn2_workspace/.state/pipeline-health.json` — stuck_gdds field added

## Verification Checklist
- [ ] error.log exists at .state/error.log
- [ ] SCHEMA.md has section 9
- [ ] pipeline-health.json has stuck_gdds field
- [ ] All 6 HEARTBEAT.md have "## Error Handling" section
- [ ] agent_qc/AGENTS.md has "## Part G"
- [ ] dashboard.html opens in browser without JS errors
- [ ] dashboard.html has auto-refresh meta tag
```

- [ ] **Step 2: Update PROGRESS.md**

Mở `ccn2_workspace/progress/PROGRESS.md`, thêm Round 4 section:

```markdown
## Round 4 — Production
| Phase | Status | Date |
|-------|--------|------|
| Spec 4.1: Error Handling + Monitoring | 🔄 IN PROGRESS | 2026-03-19 |
| Spec 4.2: Documentation & Runbooks | ⬜ TODO | - |
```
