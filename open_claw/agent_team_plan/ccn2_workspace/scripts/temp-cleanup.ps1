$reports = Get-ChildItem "D:/PROJECT/CCN2/research_doc/open_claw/agent_team_plan/ccn2_workspace/reports" -Filter 'smoke-test-*.md' | Sort-Object LastWriteTime -Descending
if($reports.Count -gt 30) {
    $toDelete = $reports | Select-Object -Skip 30
    foreach($f in $toDelete) {
        Remove-Item $f.FullName -Force
    }
}
