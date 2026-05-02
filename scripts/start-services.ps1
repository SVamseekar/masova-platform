#!/usr/bin/env pwsh
# MaSoVa — Start All Backend Services on Dell
# Each service opens in its own terminal window AND logs to:
#   C:\masova-logs\<service>.log  (individual)
#   C:\masova-logs\combined.log   (all services merged, with service prefix)
#
# Usage: Right-click → "Run with PowerShell"  OR  pwsh -File start-services.ps1

$BASE_DIR  = "C:\Users\$env:USERNAME\Projects\MaSoVa-restaurant-management-system"
$LOG_DIR   = "C:\masova-logs"
$COMBINED  = "$LOG_DIR\combined.log"

# ── Detect repo root from script location ──────────────────────────────────
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BASE_DIR  = Split-Path -Parent $scriptDir   # scripts/ is one level inside repo

# ── Create log directory ───────────────────────────────────────────────────
if (-not (Test-Path $LOG_DIR)) { New-Item -ItemType Directory -Path $LOG_DIR | Out-Null }

# Clear combined log from previous run
"" | Out-File -FilePath $COMBINED -Encoding utf8

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  MaSoVa — Starting All Backend Services"   -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Repo:     $BASE_DIR"
Write-Host "  Logs:     $LOG_DIR"
Write-Host "  Combined: $COMBINED"
Write-Host ""

# ── Service definitions: name → port ──────────────────────────────────────
$SERVICES = [ordered]@{
    "api-gateway"          = 8080
    "core-service"         = 8085
    "commerce-service"     = 8084
    "payment-service"      = 8089
    "logistics-service"    = 8086
    "intelligence-service" = 8087
}

# ── Launch each service ────────────────────────────────────────────────────
foreach ($entry in $SERVICES.GetEnumerator()) {
    $name = $entry.Key
    $port = $entry.Value
    $dir  = "$BASE_DIR\$name"
    $log  = "$LOG_DIR\$name.log"

    if (-not (Test-Path $dir)) {
        Write-Host "  [SKIP] $name — directory not found" -ForegroundColor Yellow
        continue
    }

    Write-Host "  Starting $name (port $port)..." -ForegroundColor Green
    Write-Host "    Log: $log"

    # The script that runs inside the new window:
    #   1. cd into the service directory
    #   2. run mvn, pipe output through Tee-Object so it goes to:
    #        - the individual log file
    #        - a background job that prefixes each line and appends to combined.log
    $inner = @"
`$svc = '$name'
`$log = '$log'
`$combined = '$COMBINED'
Set-Location '$dir'
Write-Host "Starting `$svc..." -ForegroundColor Cyan

# Tee mvn output: individual log + prefixed combined log
mvn spring-boot:run "-Dmaven.test.skip=true" 2>&1 | ForEach-Object {
    `$line = "[`$(Get-Date -Format 'HH:mm:ss')] [`$svc] `$_"
    `$_                          # print to this terminal window
    `$_ | Out-File -FilePath `$log -Append -Encoding utf8
    `$line | Out-File -FilePath `$combined -Append -Encoding utf8
}
Write-Host "`$svc exited." -ForegroundColor Red
Read-Host "Press Enter to close"
"@

    # Write the inner script to a temp file so the new window can run it
    $tmpScript = "$LOG_DIR\start-$name.ps1"
    $inner | Out-File -FilePath $tmpScript -Encoding utf8

    # Open a new PowerShell window for this service
    Start-Process pwsh -ArgumentList "-NoExit", "-File", "`"$tmpScript`"" `
        -WindowStyle Normal
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  All service windows launched!"            -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Individual logs:"
foreach ($name in $SERVICES.Keys) {
    Write-Host "    $LOG_DIR\$name.log"
}
Write-Host ""
Write-Host "  Combined (all services):"
Write-Host "    $COMBINED" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Tail combined log:"
Write-Host "    Get-Content -Wait '$COMBINED'" -ForegroundColor Green
Write-Host ""
Write-Host "  Wait ~30-60s for all services to be healthy."
Write-Host ""
