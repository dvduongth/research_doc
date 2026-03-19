# Generate Dashboard — CCN2 Agent Team
# Called by agent_qc at end of WORKSPACE_SCAN to populate reports/dashboard.html

$base = "D:/PROJECT/CCN2/research_doc/open_claw/agent_team_plan/ccn2_workspace"
$stateDir = Join-Path $base ".state"
$reportsDir = Join-Path $base "reports"
$designDir = Join-Path $base "design"
$memoryDir = Join-Path $base "memory"

function Read-JsonSafe($path) {
  if (Test-Path $path) {
    try {
      $raw = Get-Content $path -Raw
      return $raw | ConvertFrom-Json
    } catch {
      return $null
    }
  }
  return $null
}

$health = Read-JsonSafe (Join-Path $stateDir "pipeline-health.json")
$gdState = Read-JsonSafe (Join-Path $stateDir "agent_gd_processed.json")
$devState = Read-JsonSafe (Join-Path $stateDir "agent_dev_processed.json")
$dispatched = Read-JsonSafe (Join-Path $stateDir "agent_dev_dispatched.json")
$qcState = Read-JsonSafe (Join-Path $stateDir "agent_qc_processed.json")
$errorLogLines = if (Test-Path (Join-Path $stateDir "error.log")) { Get-Content (Join-Path $stateDir "error.log") } else { @() }
$recent_errors = $errorLogLines | Select-Object -Last 10 | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' }

function Get-AgentStatus($state) {
  if (-not $state) { return @{ status="unknown"; lastRun=""; processed=0; skipped=0; errors=0 } }
  $now = Get-Date
  $processedCount = ($state.PSObject.Properties | Measure-Object).Count
  $skipped = 0; $errors = 0; $lastRun = $null
  foreach ($entry in $state.PSObject.Properties) {
    $val = $entry.Value
    if ($val.status -eq "skipped") { $skipped++ }
    if ($val.status -eq "error") { $errors++ }
    if ($val.processedAt) {
      $pt = Get-Date $val.processedAt
      if (-not $lastRun -or $pt -gt $lastRun) { $lastRun = $pt }
    }
  }
  $status = "unknown"
  if ($lastRun) {
    $diffMins = ($now - $lastRun).TotalMinutes
    if ($diffMins -lt 15) { $status = "online" }
    elseif ($diffMins -lt 60) { $status = "idle" }
    else { $status = "idle" }
    if ($errors -gt 0) { $status = "error" }
  }
  return @{
    status = $status
    lastRun = if ($lastRun) { $lastRun.ToString("yyyy-MM-ddTHH:mm:sszzz") } else { "" }
    processed = $processedCount
    skipped = $skipped
    errors = $errors
  }
}

$agents = @{
  agent_gd = Get-AgentStatus $gdState
  agent_dev = Get-AgentStatus $devState
  agent_qc = Get-AgentStatus $qcState
}

$agents | Add-Member -NotePropertyName "agent_dev_client" -NotePropertyValue (
  if ($dispatched) {
    $any = $dispatched.PSObject.Properties | Where-Object { $_.Value.client_status -ne $null }
    if ($any) { @{ status="online"; lastRun=""; processed=($any | Measure-Object).Count; skipped=0; errors=0 } } else { @{ status="unknown"; lastRun=""; processed=0; skipped=0; errors=0 } }
  } else { @{ status="unknown"; lastRun=""; processed=0; skipped=0; errors=0 } }
)

$agents | Add-Member -NotePropertyName "agent_dev_server" -NotePropertyValue (
  if ($dispatched) {
    $any = $dispatched.PSObject.Properties | Where-Object { $_.Value.server_status -ne $null }
    if ($any) { @{ status="online"; lastRun=""; processed=($any | Measure-Object).Count; skipped=0; errors=0 } } else { @{ status="unknown"; lastRun=""; processed=0; skipped=0; errors=0 } }
  } else { @{ status="unknown"; lastRun=""; processed=0; skipped=0; errors=0 } }
)

$agents | Add-Member -NotePropertyName "agent_dev_admin" -NotePropertyValue (
  if ($dispatched) {
    $any = $dispatched.PSObject.Properties | Where-Object { $_.Value.admin_status -ne $null }
    if ($any) { @{ status="online"; lastRun=""; processed=($any | Measure-Object).Count; skipped=0; errors=0 } } else { @{ status="unknown"; lastRun=""; processed=0; skipped=0; errors=0 } }
  } else { @{ status="unknown"; lastRun=""; processed=0; skipped=0; errors=0 } }
)

# GDD Flow
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
  $gddFlow[$stage] = @{ count = $flowStages[$stage]; items = $flowItems[$stage] }
}

# Smoke
$smoke = @{
  overall = if ($health.overall) { $health.overall.ToLower() } else { "unknown" }
  last_run = if ($health.last_run) { $health.last_run } else { "" }
  checks = if ($health.checks) { $health.checks } else { @{} }
}
$stuck_gdds = if ($health.stuck_gdds) { $health.stuck_gdds } else { @() }

# Timestamp Asia/Ho_Chi_Minh (+07:00)
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

# Inject
$dashboardPath = Join-Path $reportsDir "dashboard.html"
if (Test-Path $dashboardPath) {
  $html = Get-Content $dashboardPath -Raw
  $pattern = '(?s)(const\s+DASHBOARD_DATA\s*=\s*)(\{.*?\});'
  $json = $DASHBOARD_DATA | ConvertTo-Json -Depth 10
  $replacement = '${1}' + $json + ';'
  $newHtml = [regex]::Replace($html, $pattern, $replacement)
  Set-Content -Path $dashboardPath -Value $newHtml -Encoding UTF8
  # Log to memory
  $memoryFile = Join-Path $memoryDir ($nowAsia.ToString("yyyy-MM-dd") + ".md")
  $logLine = "[$($nowAsia.ToString('yyyy-MM-dd HH:mm:ss'))] Dashboard generated: agents=$($agents.Count); GDD stages=$($flowStages.Keys -join ', '); smoke=$($smoke.overall)`n"
  Add-Content -Path $memoryFile -Value $logLine -ErrorAction SilentlyContinue
} else {
  Write-Warning "dashboard.html not found at $dashboardPath"
}
