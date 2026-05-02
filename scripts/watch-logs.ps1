#!/usr/bin/env pwsh
# MaSoVa — Watch combined service logs with optional filtering
#
# Usage:
#   pwsh -File watch-logs.ps1               # all output
#   pwsh -File watch-logs.ps1 -Level ERROR  # errors only
#   pwsh -File watch-logs.ps1 -Level WARN   # warnings + errors
#   pwsh -File watch-logs.ps1 -Svc commerce # one service only
#   pwsh -File watch-logs.ps1 -Level ERROR -Svc commerce

param(
    [string] $Level = "",     # ERROR | WARN | INFO | DEBUG — empty = all
    [string] $Svc   = ""      # service name substring filter — empty = all
)

$COMBINED = "C:\masova-logs\combined.log"

if (-not (Test-Path $COMBINED)) {
    Write-Host "Combined log not found: $COMBINED" -ForegroundColor Red
    Write-Host "Start services first with: pwsh -File scripts\start-services.ps1"
    exit 1
}

Write-Host ""
Write-Host "Watching: $COMBINED" -ForegroundColor Cyan
if ($Level) { Write-Host "  Filter level : $Level" -ForegroundColor Yellow }
if ($Svc)   { Write-Host "  Filter service: $Svc"  -ForegroundColor Yellow }
Write-Host "  Ctrl+C to stop"
Write-Host ""

Get-Content -Wait -Path $COMBINED | ForEach-Object {
    $line = $_

    # Service filter
    if ($Svc -and $line -notmatch "\[$Svc") { return }

    # Level filter
    if ($Level -and $line -notmatch "\s$Level\s") { return }

    # Colour by level
    if      ($line -match '\sERROR\s') { Write-Host $line -ForegroundColor Red     }
    elseif  ($line -match '\sWARN\s')  { Write-Host $line -ForegroundColor Yellow  }
    elseif  ($line -match '\sINFO\s')  { Write-Host $line -ForegroundColor White   }
    else                               { Write-Host $line -ForegroundColor DarkGray }
}
