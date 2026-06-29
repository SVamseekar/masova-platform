# sync-dell-dev.ps1 — Bring Dell dev machine to current origin/main
# Run on Dell (PowerShell) from repo root after PR merges or when Mac/Dell diverge.
#
# Dell repo path: D:\projects\masova-platform
#
# Usage:
#   cd D:\projects\masova-platform
#   .\scripts\sync-dell-dev.ps1
#   .\scripts\sync-dell-dev.ps1 -Branch feature/global-2-eu-vat-engine

param(
    [string]$Branch = "main"
)

$ErrorActionPreference = "Stop"

Write-Host "==> MaSoVa Dell dev sync (target: $Branch)" -ForegroundColor Cyan

if (-not (Test-Path ".git")) {
    throw "Run from repository root (missing .git)"
}

Write-Host "==> git fetch --prune"
git fetch origin --prune

Write-Host "==> git checkout $Branch"
git checkout $Branch

if ($Branch -eq "main") {
    Write-Host "==> git pull origin main"
    git pull origin main
} else {
    Write-Host "==> git pull --rebase origin $Branch"
    git pull --rebase origin $Branch
}

Write-Host "==> Docker infra (mongodb, redis, rabbitmq, postgres)"
docker compose up -d mongodb redis rabbitmq postgres
docker compose ps

if (Test-Path "frontend/package-lock.json") {
    Write-Host "==> frontend npm ci"
    Push-Location frontend
    npm ci
    Pop-Location
}

Write-Host ""
Write-Host "Sync complete. Next steps:" -ForegroundColor Green
Write-Host "  Backend:  cd <service> && mvn spring-boot:run `"-Dmaven.test.skip=true`""
Write-Host "  Frontend: cd frontend && npm run dev   # http://localhost:3000"
Write-Host "  Env:      copy frontend/.env.example frontend/.env.local if missing"
Write-Host "  Gateway:  VITE_API_GATEWAY_URL=http://localhost:8080/api (or Dell LAN IP if testing from phone)"