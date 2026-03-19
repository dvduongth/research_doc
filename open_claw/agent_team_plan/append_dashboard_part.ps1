# Part H — Generate Dashboard

**Trigger**: Sau khi hoàn thành Parts A-G, mỗi WORKSPACE_SCAN.

**Purpose**: Tạo/cập nhật `reports/dashboard.html` với dữ liệu pipeline từ `.state/`.

**Input files** (BASE = `D:/PROJECT/CCN2/research_doc/open_claw/agent_team_plan/ccn2_workspace/`):
- `.state/pipeline-health.json`
- `.state/agent_gd_processed.json`
- `.state/agent_dev_processed.json`
- `.state/agent_dev_dispatched.json` (nếu có)
- `.state/agent_qc_processed.json`
- `.state/error.log` (lấy 10 dòng cuối)
- `design/GDD-FEATURE-*.md`, `design/GDD-GAME-CCN2.md`
- `reports/dashboard.html` (template có placeholder `DASHBOARD_DATA`)

**Output**: overwrite `reports/dashboard.html` với `DASHBOARD_DATA` đã được populate.

### Step-by-step (PowerShell)

```powershell
$base = "D:/PROJECT/CCN2/research_doc/open_claw/agent_team_plan/ccn2_workspace"
$stateDir = Join-Path $base ".state"
$reportsDir = Join-Path $base "reports"
$designDir = Join-Path $base "design"

# 1. Read JSON state files (with defaults)
$health = Get-Content (Join-Path $stateDir "pipeline-health.json") -Raw | ConvertFrom-Json -ErrorAction SilentlyContinue
$gdState = Get-Content (Join-Path $stateDir "agent_gd_processed.json") -Raw | ConvertFrom-Json -ErrorAction SilentlyContinue
$devState = Get-Content (Join-Path $stateDir "agent_dev_processed.json") -Raw | ConvertFrom-Json -ErrorAction SilentlyContinue
$dispatched = Get-Content (Join-Path $stateDir "agent_dev_dispatched.json") -Raw | ConvertFrom-Json -ErrorAction SilentlyContinue
$qcState = Get-Content (Join-Path $stateDir "agent_qc_processed.json") -Raw | ConvertFrom-Json -ErrorAction SilentlyContinue
$errorLog = Get-Content (Join-Path $stateDir "error.log") -ErrorAction SilentlyContinue | Select-Object -Last 10

function Get-AgentStatus($agentId, $state, $health) {
  # Determine status from state timestamps and health
  if (-not $state) { return @{ status="unknown"; lastRun=""; processed=0; skipped=0; errors=0 } }
  $now = Get-Date
  $processedCount = ($state.PSObject.Properties | Measure-Object).Count
  $skipped = 0
  $errors = 0
  $lastRun = $null
  foreach ($entry in $state.PSObject.Properties) {
    $val = $entry.Value
    if ($val.status -eq "skipped") { $skipped++ }
    if ($val.status -eq "error") { $errors++ }
    if ($val.processedAt) {
      $pt = Get-Date $val.processedAt
      if (-not $lastRun -or $pt -gt $lastRun) { $lastRun = $pt }
    }
  }
  if ($lastRun) {
    $diffMins = ($now - $lastRun).TotalMinutes
    if ($diffMins -lt 15) { $status = "online" }
    elseif ($diffMins -lt 60) { $status = "idle" }
    else { $status = "idle" } # still idle, but could be "offline" if needed
    if ($errors -gt 0) { $status = "error" }
  } else {
    $status = "unknown"
  }
  return @{
    status = $status
    lastRun = if ($lastRun) { $lastRun.ToString("yyyy-MM-ddTHH:mm:sszzz") } else { "" }
    processed = $processedCount
    skipped = $skipped
    errors = $errors
  }
}

# Build agents object
$agents = @{
  agent_gd = Get-AgentStatus "agent_gd" $gdState $health
  agent_dev = Get-AgentStatus "agent_dev" $devState $health
}

# For sub-agents from dispatched
$agents | Add-Member -NotePropertyName "agent_dev_client" -NotePropertyValue (
  if ($dispatched) {
    $any = $dispatched.PSObject.Properties | Where-Object { $_.Value.client_status -ne $null }
    if ($any) { @{ status="online"; lastRun=""; processed=($any | Measure-Object).Count; skipped=0; errors=0 } }
    else { @{ status="unknown"; lastRun=""; processed=0; skipped=0; errors=0 } }
  } else { @{ status="unknown"; lastRun=""; processed=0; skipped=0; errors=0 } }
)
$agents | Add-Member -NotePropertyName "agent_dev_server" -NotePropertyValue (
  if ($dispatched) {
    $any = $dispatched.PSObject.Properties | Where-Object { $_.Value.server_status -ne $null }
    if ($any) { @{ status="online"; lastRun=""; processed=($any | Measure-Object).Count; skipped=0; errors=0 } }
    else { @{ status="unknown"; lastRun=""; processed=0; skipped=0; errors=0 } }
  } else { @{ status="unknown"; lastRun=""; processed=0; skipped=0; errors=0 } }
)
$agents | Add-Member -NotePropertyName "agent_dev_admin" -NotePropertyValue (
  if ($dispatched) {
    $any = $dispatched.PSObject.Properties | Where-Object { $_.Value.admin_status -ne $null }
    if ($any) { @{ status="online"; lastRun=""; processed=($any | Measure-Object).Count; skipped=0; errors=0 } }
    else { @{ status="unknown"; lastRun=""; processed=0; skipped=0; errors=0 } }
  } else { @{ status="unknown"; lastRun=""; processed=0; skipped=0; errors=0 } }
)
$agents | Add-Member -NotePropertyName "agent_qc" -NotePropertyValue (Get-AgentStatus "agent_qc" $qcState $health)

# 2. Build GDD flow from design files and state
$flowStages = @{ Draft=0; Review=0; InDev=0; InQC=0; Done=0; Flagged=0 }
$flowItems = @{ Draft=@(); Review=@(); InDev=@(); InQC=@(); Done=@(); Flagged=@() }

$gddFiles = Get-ChildItem $designDir -Filter "GDD-*.md" | Where-Object { $_.Name -notmatch 'TEMPLATE' }
foreach ($file in $gddFiles) {
  $content = Get-Content $file.FullName -Raw
  if ($content -match '\*\*Trạng thái\*\*:\s*(\w+)') {
    $status = $matches[1]
    if ($flowStages.ContainsKey($status)) {
      $flowStages[$status]++
      if ($flowItems[$status].Count -lt 3) {
        $flowItems[$status] += ,($file.Name -replace '\.md$','' -replace '^GDD-FEATURE-','')
      }
    }
  }
}

$gddFlow = @{}
foreach ($stage in $flowStages.Keys) {
  $gddFlow[$stage] = @{
    count = $flowStages[$stage]
    items = $flowItems[$stage]
  }
}

# 3. Smoke from pipeline-health.json
$smoke = @{
  overall = if ($health.overall) { $health.overall.ToLower() } else { "unknown" }
  last_run = if ($health.last_run) { $health.last_run } else { "" }
  checks = if ($health.checks) { $health.checks } else { @{} }
}

# 4. Stuck GDDs from health
$stuck_gdds = if ($health.stuck_gdds) { $health.stuck_gdds } else { @() }

# 5. Recent errors
$recent_errors = @($errorLog) | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' }

# 6. Build DASHBOARD_DATA with Asia/Ho_Chi_Minh timezone offset (+07:00)
$nowAsia = (Get-Date).ToUniversalTime().AddHours(7)
$generated_at = $nowAsia.ToString("yyyy-MM-ddTHH:mm:ss") + "+07:00"

$DASHBOARD_DATA = @{
  generated_at = $generated_at
  agents = $agents
  gdd_flow = $gddFlow
  smoke = $smoke
  stuck_gdds = $stuck_gdds
  recent_errors = $recent_errors
}

# 7. Inject into dashboard.html
$dashboardPath = Join-Path $reportsDir "dashboard.html"
if (Test-Path $dashboardPath) {
  $html = Get-Content $dashboardPath -Raw
  # Replace the DASHBOARD_DATA object (inline assignment)
  $pattern = '(?s)(const\s+DASHBOARD_DATA\s*=\s*)(\{.*?\});'
  $replacement = '${1}' + ($DASHBOARD_DATA | ConvertTo-Json -Depth 10) + ';'
  $newHtml = [regex]::Replace($html, $pattern, $replacement)
  Set-Content -Path $dashboardPath -Value $newHtml -Encoding UTF8
  # Log
  Add-Content (Join-Path $base "memory/$(Get-Date -Format 'yyyy-MM-dd').md") "[$($nowAsia.ToString('yyyy-MM-dd HH:mm:ss'))] Dashboard generated with $($agents.Count) agents, GDD flow stages: $($flowStages.Keys -join ', ').`n"
} else {
  Write-Warning "dashboard.html not found at $dashboardPath"
}
```

### Notes
- `ConvertTo-Json` in PowerShell serializes object to JSON without pretty‑format; you may format manually or use `ConvertTo-Json -Depth 10` and then replace indentation with 2 spaces if needed.
- The regex pattern matches the existing placeholder object and replaces it while preserving the `const DASHBOARD_DATA = ` prefix and trailing semicolon.
- Timezone: we emit ISO8601 with `+07:00` offset.

### Constraints
- READ-ONLY all input files except `reports/dashboard.html`.
- If any JSON file is missing or malformed, treat as empty `@{}` and continue.
- Do NOT send Telegram notifications; dashboard is passive.
- If injection fails, log to `error.log` and continue (do not crash the scan).
