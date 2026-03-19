# ============================================================
# Elemental Hunter Playtest — Smoke Test Script
# ============================================================
# Run by:  agent_qc (Part I) after every WORKSPACE_SCAN
#          agent_dev_server (Forge) after each feature done
# Output:  ccn2_workspace/reports/playtest-smoke-<timestamp>.md
#          ccn2_workspace/.state/pipeline-health.json (C7_playtest)
# ============================================================

param(
    [string]$Mode = "quick"  # "quick" = use existing dist | "full" = rebuild first
)

$ErrorActionPreference = "SilentlyContinue"

$base      = "D:\PROJECT\CCN2\research_doc\open_claw\agent_team_plan"
$serverDir = "$base\playtest\server"
$distBat   = "$serverDir\build\install\elemental-hunter-playtest\bin\elemental-hunter-playtest.bat"
$reportDir = "$base\ccn2_workspace\reports"
$stateFile = "$base\ccn2_workspace\.state\pipeline-health.json"
$timestamp = Get-Date -Format "yyyy-MM-dd-HH-mm"
$reportFile = "$reportDir\playtest-smoke-$timestamp.md"
$port      = 8181

Write-Host "[Playtest Smoke] Mode=$Mode  Timestamp=$timestamp"

# ---- Helpers ------------------------------------------------

function Write-Report {
    param($Results, $BuildOk, $ServerStarted, $Passed, $Total)
    $status = if ($Passed -eq $Total -and $BuildOk -and $ServerStarted) { "PASS" } else { "FAIL" }
    $rows = ($Results.Keys | ForEach-Object {
        $icon = if ($Results[$_]) { "PASS" } else { "FAIL" }
        "| $_ | $icon |"
    }) -join "`n"
    $content = @"
# Playtest Smoke Test — $timestamp

**Status**: $status
**Build**: $(if ($BuildOk) { "OK" } else { "FAIL" })
**Server start**: $(if ($ServerStarted) { "OK" } else { "FAIL" })
**Endpoints**: $Passed/$Total passed

## Endpoint Results

| Check | Result |
|-------|--------|
$rows

## Notes

- Script: smoke-test.ps1 (Mode=$Mode)
- Port: $port
- Generated: $(Get-Date -Format "yyyy-MM-ddTHH:mm:ss+07:00")
- Distribution: $distBat
"@
    Set-Content $reportFile $content -Encoding UTF8
    Write-Host "[Playtest Smoke] Report written: reports\playtest-smoke-$timestamp.md"
}

function Update-PipelineHealth {
    param([string]$C7Result)
    try {
        $raw    = Get-Content $stateFile -Raw -ErrorAction Stop
        $health = $raw | ConvertFrom-Json

        # Add/update C7_playtest
        if ($health.checks.PSObject.Properties["C7_playtest"]) {
            $health.checks.C7_playtest = $C7Result
        } else {
            $health.checks | Add-Member -NotePropertyName "C7_playtest" -NotePropertyValue $C7Result -Force
        }

        # Recount passed/failed (exclude SKIP from count)
        $allChecks = $health.checks.PSObject.Properties.Value
        $health.passed = ($allChecks | Where-Object { $_ -eq "PASS" }).Count
        $health.failed = ($allChecks | Where-Object { $_ -eq "FAIL" }).Count

        # Update overall if currently HEALTHY but playtest FAIL
        if ($C7Result -eq "FAIL" -and $health.overall -eq "HEALTHY") {
            $health.overall = "DEGRADED"
        }

        $health | ConvertTo-Json -Depth 5 | Set-Content $stateFile -Encoding UTF8
        Write-Host "[Playtest Smoke] pipeline-health.json updated: C7_playtest=$C7Result"
    } catch {
        Write-Host "[Playtest Smoke] WARNING: Could not update pipeline-health.json — $_"
    }
}

function Cleanup-OldReports {
    $reports = Get-ChildItem "$reportDir\playtest-smoke-*.md" -ErrorAction SilentlyContinue |
               Sort-Object LastWriteTime -Ascending
    if ($reports.Count -gt 20) {
        $toDelete = $reports | Select-Object -First ($reports.Count - 20)
        $toDelete | Remove-Item -Force
        Write-Host "[Playtest Smoke] Cleaned up $($toDelete.Count) old report(s)"
    }
}

# ============================================================
# Step 1: Build (if full mode OR dist doesn't exist)
# ============================================================

$buildOk = $true

if ($Mode -eq "full" -or -not (Test-Path $distBat)) {
    Write-Host "[Playtest Smoke] Building server (Mode=$Mode)..."
    Push-Location $serverDir
    try {
        $buildOutput = & cmd /c "gradlew.bat assemble 2>&1"
        $buildOk = ($LASTEXITCODE -eq 0)
        if (-not $buildOk) {
            Write-Host "[Playtest Smoke] BUILD FAILED (exit=$LASTEXITCODE)"
            Write-Host $buildOutput
        }
    } catch {
        $buildOk = $false
        Write-Host "[Playtest Smoke] BUILD EXCEPTION: $_"
    } finally {
        Pop-Location
    }

    if (-not $buildOk) {
        Write-Report @{} $false $false 0 0
        Update-PipelineHealth "FAIL"
        Cleanup-OldReports
        exit 0
    }
}

# Check dist exists (build may have succeeded but path unexpected)
if (-not (Test-Path $distBat)) {
    Write-Host "[Playtest Smoke] SKIP: distribution not found at $distBat"
    Write-Host "[Playtest Smoke] Run with -Mode full to build first."
    Update-PipelineHealth "SKIP"
    exit 0
}

# ============================================================
# Step 2: Start server
# ============================================================

Write-Host "[Playtest Smoke] Starting server on port $port..."

# Kill any stale process on port 8181 first
$stale = netstat -ano 2>$null | Select-String ":$port\s" | ForEach-Object {
    ($_ -split '\s+')[-1]
} | Select-Object -Unique
foreach ($pid in $stale) {
    if ($pid -match '^\d+$' -and $pid -ne "0") {
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    }
}
Start-Sleep -Seconds 1

$proc = Start-Process `
    -FilePath "cmd.exe" `
    -ArgumentList "/c `"$distBat`"" `
    -PassThru `
    -WindowStyle Hidden `
    -RedirectStandardOutput "$env:TEMP\playtest-stdout.txt" `
    -RedirectStandardError  "$env:TEMP\playtest-stderr.txt"

# Poll /health for up to 30 seconds
$serverStarted = $false
for ($i = 0; $i -lt 15; $i++) {
    Start-Sleep -Seconds 2
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:$port/health" `
             -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
        if ($r.StatusCode -eq 200) { $serverStarted = $true; break }
    } catch { }
}

if (-not $serverStarted) {
    Write-Host "[Playtest Smoke] FAIL: server did not respond within 30s"
    if ($proc -and -not $proc.HasExited) { Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue }
    Write-Report @{} $buildOk $false 0 0
    Update-PipelineHealth "FAIL"
    Cleanup-OldReports
    exit 0
}

Write-Host "[Playtest Smoke] Server ready. Testing endpoints..."

# ============================================================
# Step 3: Test HTTP endpoints
# ============================================================

$results = [ordered]@{}

# Check 1: GET /health → body = "OK"
try {
    $r = Invoke-WebRequest "http://localhost:$port/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    $results["GET /health → 200 OK"] = ($r.StatusCode -eq 200 -and $r.Content.Trim() -eq "OK")
} catch { $results["GET /health → 200 OK"] = $false }

# Check 2: GET /game/rooms → 200 JSON array
try {
    $r = Invoke-WebRequest "http://localhost:$port/game/rooms" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    $results["GET /game/rooms → 200"] = $r.StatusCode -eq 200
} catch { $results["GET /game/rooms → 200"] = $false }

# Check 3: POST /game/rooms/smoke-room → 201
try {
    $r = Invoke-WebRequest "http://localhost:$port/game/rooms/smoke-room" `
         -Method POST -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    $results["POST /game/rooms/smoke-room → 201"] = $r.StatusCode -eq 201
} catch { $results["POST /game/rooms/smoke-room → 201"] = $false }

# Check 4: GET /game/rooms → contains smoke-room
try {
    $r = Invoke-WebRequest "http://localhost:$port/game/rooms" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    $json = $r.Content | ConvertFrom-Json
    $found = ($json | Where-Object { $_.roomId -eq "smoke-room" }) -ne $null
    $results["GET /game/rooms → smoke-room visible"] = $found
} catch { $results["GET /game/rooms → smoke-room visible"] = $false }

# ============================================================
# Step 4: Stop server
# ============================================================

Write-Host "[Playtest Smoke] Stopping server..."
if ($proc -and -not $proc.HasExited) {
    Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
}
# Also kill child java process on port
Start-Sleep -Seconds 1
netstat -ano 2>$null | Select-String ":$port\s" | ForEach-Object {
    $pid = ($_ -split '\s+')[-1]
    if ($pid -match '^\d+$' -and $pid -ne "0") {
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    }
}

# ============================================================
# Step 5: Report + pipeline-health update
# ============================================================

$passed = ($results.Values | Where-Object { $_ -eq $true }).Count
$total  = $results.Count
$allOk  = ($passed -eq $total)
$c7     = if ($allOk) { "PASS" } else { "FAIL" }

Write-Report $results $buildOk $serverStarted $passed $total
Update-PipelineHealth $c7
Cleanup-OldReports

Write-Host "[Playtest Smoke] COMPLETE — $passed/$total checks passed | C7_playtest=$c7"
exit 0
