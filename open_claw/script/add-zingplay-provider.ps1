# Add ZingPlay Provider to OpenClaw configuration
# Run this script to add ZingPlay provider configuration

$ConfigPath = "C:\Users\admin\.openclaw\openclaw.json"

# Read current configuration
$Config = Get-Content $ConfigPath -Raw -Force | ConvertFrom-Json

# Check if ZingPlay provider already exists
$Profiles = $Config.psobject.Properties.name | Where-Object { $_ -eq "auth" }
if ($Profiles) {
    $ExistingProfiles = $Config.auth.psobject.Properties.name | Where-Object { $_ -eq "profiles" }
    if ($ExistingProfiles) {
        $HasZingPlay = $Config.auth.profiles.PSObject.Properties.Name | Where-Object { $_ -like "*zingplay*" }
        if ($HasZingPlay) {
            Write-Host "ZingPlay provider already exists in configuration." -ForegroundColor Yellow
            Exit 0
        }
    }
}

# Create new ZingPlay profile
$NewProfile = [PSCustomObject]@{
    provider = "zingplay"
    mode = "api_key"
    baseUrl = "https://chat.zingplay.com/api"
    model = "local-model"
    authToken = "YOUR_AUTH_TOKEN_HERE"  # Thay thế bằng token thật của bạn
}

# Add to auth.profiles
if (-not $Config.auth.profiles) {
    $Config.auth | Add-Member -NotePropertyName "profiles" -NotePropertyValue @{ }
}

$Config.auth.profiles | Add-Member -NotePropertyName "zingplay:default" -NotePropertyValue $NewProfile

# Write back to file
$UpdatedJson = $Config | ConvertTo-Json -Depth 50
Set-Content $ConfigPath -Value $UpdatedJson -Force

Write-Host "Successfully added ZingPlay provider to OpenClaw configuration!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Edit the file and replace 'YOUR_AUTH_TOKEN_HERE' with your actual auth token"
Write-Host "2. Restart OpenClaw gateway to load the new provider"
Write-Host ""
Write-Host "Config file: $ConfigPath" -ForegroundColor Gray
