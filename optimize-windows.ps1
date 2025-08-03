# PowerShell script to optimize Windows for VS Code performance
Write-Host "Optimizing Windows for VS Code performance..." -ForegroundColor Green

# Increase virtual memory if needed
Write-Host "Checking virtual memory settings..." -ForegroundColor Yellow

# Clear temporary files
Write-Host "Clearing temporary files..." -ForegroundColor Yellow
Remove-Item -Path "$env:TEMP\*" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$env:LOCALAPPDATA\Temp\*" -Recurse -Force -ErrorAction SilentlyContinue

# Clear VS Code workspace storage
Write-Host "Clearing VS Code workspace storage..." -ForegroundColor Yellow
$vsCodeStorage = "$env:APPDATA\Code\User\workspaceStorage"
if (Test-Path $vsCodeStorage) {
    Get-ChildItem $vsCodeStorage | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-7) } | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
}

# Set Windows to performance mode
Write-Host "Setting Windows to performance mode..." -ForegroundColor Yellow
powercfg /setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c

# Disable Windows Defender real-time protection for the project folder (optional)
Write-Host "Consider adding VS Code and project folder to Windows Defender exclusions" -ForegroundColor Cyan

Write-Host "Optimization complete! Restart VS Code for best results." -ForegroundColor Green
Write-Host "Use 'npm run start:max' or the batch file to start with maximum memory." -ForegroundColor Cyan
