# MaSoVa Demo — Step 3: Create Staff Accounts
# Creates: manager, kitchen staff, cashier, driver, kiosk account for DOM001.
# Reads demo-state.json written by step 2.

$ErrorActionPreference = "Stop"
$BASE = "http://localhost:8080"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  MaSoVa Demo — Step 3: Create Staff" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Load state
if (-not (Test-Path ".\demo-state.json")) {
    Write-Host "ERROR: demo-state.json not found. Run 2-create-store.ps1 first." -ForegroundColor Red
    exit 1
}
$state = Get-Content ".\demo-state.json" | ConvertFrom-Json
$token = $state.bootstrapToken

function Invoke-Api {
    param([string]$Method, [string]$Path, [hashtable]$Body = $null, [string]$Token = $null)
    $headers = @{ "Content-Type" = "application/json" }
    if ($Token) { $headers["Authorization"] = "Bearer $Token" }
    $params = @{ Uri = "$BASE$Path"; Method = $Method; Headers = $headers }
    if ($Body) { $params["Body"] = ($Body | ConvertTo-Json -Depth 10) }
    try {
        return Invoke-RestMethod @params
    } catch {
        $status = $_.Exception.Response.StatusCode.value__
        $msg = $_.ErrorDetails.Message
        Write-Host "  ERROR $status — $msg" -ForegroundColor Red
        throw
    }
}

function Create-User {
    param([string]$Label, [hashtable]$User)
    Write-Host "  Creating $Label ($($User.email))..." -NoNewline
    try {
        $r = Invoke-Api -Method POST -Path "/api/auth/register" -Body $User
        Write-Host " OK (id: $($r.user.id ?? $r.id))" -ForegroundColor Green
        return $r
    } catch {
        Write-Host " SKIPPED (already exists)" -ForegroundColor Yellow
        return $null
    }
}

$staff = @(
    @{
        label = "Manager"
        user  = @{
            type        = "MANAGER"
            name        = "Klaus Weber"
            email       = "manager.berlin@gmail.com"
            phone       = "4930111222333"
            password    = "Demo@1234"
            storeId     = "DOM001"
            role        = "Store Manager"
            permissions = @("MANAGE_MENU", "MANAGE_STAFF", "VIEW_REPORTS", "MANAGE_ORDERS", "MANAGE_INVENTORY")
        }
    },
    @{
        label = "Kitchen Staff"
        user  = @{
            type    = "STAFF"
            name    = "Maria Bauer"
            email   = "kitchen.berlin@gmail.com"
            phone   = "4930111222334"
            password = "Demo@1234"
            storeId = "DOM001"
            role    = "KITCHEN_STAFF"
        }
    },
    @{
        label = "Cashier"
        user  = @{
            type    = "STAFF"
            name    = "Jonas Fischer"
            email   = "cashier.berlin@gmail.com"
            phone   = "4930111222335"
            password = "Demo@1234"
            storeId = "DOM001"
            role    = "CASHIER"
        }
    },
    @{
        label = "Driver"
        user  = @{
            type          = "DRIVER"
            name          = "Lukas Hoffmann"
            email         = "driver.berlin@gmail.com"
            phone         = "4930111222336"
            password      = "Demo@1234"
            storeId       = "DOM001"
            vehicleType   = "Bike"
            licenseNumber = "DE-B-123456"
        }
    },
    @{
        label = "Kiosk (POS)"
        user  = @{
            type    = "KIOSK"
            name    = "POS Terminal 1"
            email   = "kiosk.berlin@gmail.com"
            phone   = "4930111222337"
            password = "Demo@1234"
            storeId = "DOM001"
            role    = "KIOSK"
        }
    }
)

foreach ($entry in $staff) {
    Create-User -Label $entry.label -User $entry.user
}

# Login as the actual manager and save that token (used by subsequent scripts)
Write-Host ""
Write-Host "Logging in as Klaus Weber (manager)..." -NoNewline
$managerLogin = Invoke-Api -Method POST -Path "/api/auth/login" -Body @{
    email    = "manager.berlin@gmail.com"
    password = "Demo@1234"
}
$managerToken = $managerLogin.accessToken
Write-Host " OK" -ForegroundColor Green

# Update state
$state | Add-Member -NotePropertyName "managerToken" -NotePropertyValue $managerToken -Force
$state | ConvertTo-Json | Set-Content ".\demo-state.json"

Write-Host ""
Write-Host "All staff accounts created." -ForegroundColor Green
Write-Host ""
Write-Host "Demo staff credentials:" -ForegroundColor Cyan
Write-Host "  Manager  — manager.berlin@gmail.com / Demo@1234"
Write-Host "  Kitchen  — kitchen.berlin@gmail.com / Demo@1234"
Write-Host "  Cashier  — cashier.berlin@gmail.com / Demo@1234"
Write-Host "  Driver   — driver.berlin@gmail.com  / Demo@1234"
Write-Host ""
Write-Host "Run 4-create-customers.ps1 next." -ForegroundColor Cyan
