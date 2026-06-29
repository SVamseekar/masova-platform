# Install tracked git hooks on Dell (PowerShell + Git for Windows).
# Usage: .\scripts\install-git-hooks.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

git config core.hooksPath scripts/git-hooks
Write-Host "Installed pre-commit hook (core.hooksPath=scripts/git-hooks)" -ForegroundColor Green
Write-Host "Git for Windows runs bash hooks from scripts/git-hooks/pre-commit"