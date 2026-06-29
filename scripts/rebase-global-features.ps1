# rebase-global-features.ps1 — Rebase Global-2/3/4 onto origin/main (run AFTER PR #17 merge)
# Usage:
#   .\scripts\rebase-global-features.ps1
#   .\scripts\rebase-global-features.ps1 -Branch global-2

param(
    [ValidateSet("all", "global-2", "global-3", "global-4")]
    [string]$Branch = "all"
)

$ErrorActionPreference = "Stop"

$map = @{
    "global-2" = "feature/global-2-eu-vat-engine"
    "global-3" = "feature/global-3-currency-locale-i18n"
    "global-4" = "feature/global-4-stripe-payments"
}

function Rebase-One([string]$FeatureBranch) {
    Write-Host "==> Rebase $FeatureBranch onto origin/main" -ForegroundColor Cyan
    git fetch origin --prune
    git checkout $FeatureBranch 2>$null
    if ($LASTEXITCODE -ne 0) {
        git checkout -b $FeatureBranch "origin/$FeatureBranch"
    }
    git rebase origin/main
    if ($LASTEXITCODE -ne 0) {
        Write-Host "CONFLICT on $FeatureBranch — resolve, then: git rebase --continue; git push --force-with-lease origin $FeatureBranch" -ForegroundColor Red
        exit 1
    }
    git push --force-with-lease origin $FeatureBranch
    Write-Host "==> Done: $FeatureBranch" -ForegroundColor Green
}

if ($Branch -eq "all") {
    foreach ($key in @("global-2", "global-3", "global-4")) {
        Rebase-One $map[$key]
    }
} else {
    Rebase-One $map[$Branch]
}

Write-Host "Rebase complete." -ForegroundColor Green