# MaSoVa Menu Seeding Script
# Seeds 150+ menu items including all cuisines and Ben & Jerry's UK flavors

$baseUrl = "http://localhost:8081/api/menu/items"

# Get manager token (replace with actual token after login)
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  MaSoVa Menu Seeding Script" -ForegroundColor Cyan
Write-Host "  150+ Items Loading..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Please login as Manager first to get token" -ForegroundColor Yellow
Write-Host "Manager: suresh.manager@masova.com / manager123" -ForegroundColor Yellow
Write-Host ""
$token = Read-Host "Enter JWT Access Token"

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# Function to create menu item
function Create-MenuItem {
    param($item)
    try {
        $json = $item | ConvertTo-Json -Depth 10
        Invoke-RestMethod -Uri $baseUrl -Method POST -Body $json -Headers $headers | Out-Null
        Write-Host "✓ $($item.name)" -ForegroundColor Green
    }
    catch {
        Write-Host "✗ $($item.name) - Failed" -ForegroundColor Red
    }
}

Write-Host "Loading menu items..." -ForegroundColor Cyan
Write-Host ""

# Continue in next message due to length...
