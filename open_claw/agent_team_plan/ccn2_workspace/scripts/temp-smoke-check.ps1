$base = "D:/PROJECT/CCN2/research_doc/open_claw/agent_team_plan/ccn2_workspace"

# C1: concepts/*.md count (excluding README.md)
$C1_files = Get-ChildItem "$base/concepts" -Filter *.md -File | Where-Object { $_.Name -ne "README.md" }
$C1 = $C1_files.Count

# C2: design/GDD-FEATURE-*.md count
$C2 = (Get-ChildItem "$base/design" -Filter "GDD-FEATURE-*.md" -File).Count

# C3: Check **Trạng thái** header in each GDD-FEATURE-*.md
$C3_pass = $true
$C3_details = @()
$gdd_files = Get-ChildItem "$base/design" -Filter "GDD-FEATURE-*.md" -File
foreach($f in $gdd_files) {
    $content = Get-Content $f.FullName -Raw
    if($content -notmatch '\*\*Trạng thái\*\*') {
        $C3_pass = $false
        $C3_details += $f.Name
    }
}

# C4: src/ subfolders (excluding tests) with at least 1 .js file
$C4_dirs = Get-ChildItem "$base/src" -Directory | Where-Object { $_.Name -ne "tests" }
$C4_nonempty = 0
foreach($dir in $C4_dirs) {
    $js_files = Get-ChildItem $dir.FullName -Filter *.js -File
    if($js_files.Count -gt 0) {
        $C4_nonempty++
    }
}

# C5: quality-*.md within last 24h UTC
$C5 = (Get-ChildItem "$base/reports" -Filter "quality-*.md" -File | Where-Object { $_.LastWriteTimeUtc -gt (Get-Date).AddDays(-1).ToUniversalTime() }).Count

# C6: State JSONs validity
$jsonFiles = @('agent_gd_processed.json','agent_dev_processed.json','agent_dev_dispatched.json','agent_qc_processed.json')
$C6_valid = 0
foreach($jf in $jsonFiles) {
    $path = Join-Path $base ".state/$jf"
    if(Test-Path $path) {
        try {
            $content = Get-Content $path -Raw
            if($content -and $content.Trim()) {
                $null = $content | ConvertFrom-Json
                $C6_valid++
            }
        } catch { }
    }
}

Write-Output "C1_concepts=$C1"
Write-Output "C2_design=$C2"
Write-Output "C3_gdd_header=$(if($C3_pass){'PASS'}else{'FAIL'})"
Write-Output "C4_src=$C4_nonempty"
Write-Output "C5_quality_report=$C5"
Write-Output "C6_state_json=$C6_valid/4"
