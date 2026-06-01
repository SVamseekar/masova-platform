# MaSoVa Demo — Step 2: Create Germany Store
# Creates DOM001 — MaSoVa Berlin Mitte with DE/EUR/de-DE config.
# Requires: no auth (MANAGER role needed, but store creation via test bootstrap).
#
# NOTE: Store creation needs a MANAGER JWT. Since we have no users yet, we use
# the TestDataController (dev profile) to bootstrap DOM001 and then PATCH it
# to set DE/EUR fields. If TestDataController is not available, we register a
# bootstrap manager first, then create the store.

$ErrorActionPreference = "Stop"
$BASE = "http://localhost:8080"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  MaSoVa Demo — Step 2: Create Store" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

function Invoke-Api {
    param(
        [string]$Method,
        [string]$Path,
        [hashtable]$Body = $null,
        [string]$Token = $null
    )
    $headers = @{ "Content-Type" = "application/json" }
    if ($Token) { $headers["Authorization"] = "Bearer $Token" }

    $params = @{
        Uri     = "$BASE$Path"
        Method  = $Method
        Headers = $headers
    }
    if ($Body) { $params["Body"] = ($Body | ConvertTo-Json -Depth 10) }

    try {
        return Invoke-RestMethod @params
    } catch {
        $status = $_.Exception.Response.StatusCode.value__
        $msg = $_.ErrorDetails.Message
        Write-Host "  ERROR $status on $Method $Path" -ForegroundColor Red
        Write-Host "  $msg" -ForegroundColor Red
        throw
    }
}

# --- Step 2a: Bootstrap manager (no store yet — storeId left empty for now) ---
Write-Host "2a. Registering bootstrap manager..." -NoNewline

$bootstrapManager = @{
    type     = "MANAGER"
    name     = "Bootstrap Admin"
    email    = "bootstrap.admin@gmail.com"
    phone    = "4930000000001"
    password = "Bootstrap@9999"
    storeId  = "DOM001"
}

try {
    $reg = Invoke-Api -Method POST -Path "/api/auth/register" -Body $bootstrapManager
    Write-Host " OK" -ForegroundColor Green
} catch {
    Write-Host " (might already exist, continuing)" -ForegroundColor Yellow
}

# --- Step 2b: Login as bootstrap manager ---
Write-Host "2b. Logging in as bootstrap manager..." -NoNewline

$login = Invoke-Api -Method POST -Path "/api/auth/login" -Body @{
    email    = "bootstrap.admin@gmail.com"
    password = "Bootstrap@9999"
}
$token = $login.accessToken
Write-Host " OK (token obtained)" -ForegroundColor Green

# --- Step 2c: Create the store ---
Write-Host "2c. Creating DOM001 — MaSoVa Berlin Mitte..." -NoNewline

$store = @{
    name        = "MaSoVa Berlin Mitte"
    storeCode   = "DOM001"
    phoneNumber = "4930123456789"
    countryCode = "DE"
    currency    = "EUR"
    locale      = "de-DE"
    vatNumber   = "DE123456789"
    regionId    = "BERLIN"
    address = @{
        street  = "Unter den Linden 21"
        city    = "Berlin"
        state   = "Berlin"
        pincode = "10117"
        latitude  = 52.5166
        longitude = 13.3889
    }
    configuration = @{
        deliveryRadiusKm         = 6.0
        maxConcurrentOrders      = 50
        estimatedPrepTimeMinutes = 20
        acceptsOnlineOrders      = $true
        acceptsCashPayments      = $true
        maxDeliveryTimeMinutes   = 45
        minimumOrderValueINR     = 15.0
        serviceArea = @{
            centerLatitude  = 52.5166
            centerLongitude = 13.3889
            acceptsDelivery = $true
            zones = @(
                @{
                    zoneName                = "A"
                    minDistanceKm           = 0.0
                    maxDistanceKm           = 3.0
                    deliveryFeeINR          = 2.50
                    estimatedDeliveryMinutes = 20
                    minimumOrderValueINR    = 15.0
                    active                  = $true
                },
                @{
                    zoneName                = "B"
                    minDistanceKm           = 3.0
                    maxDistanceKm           = 6.0
                    deliveryFeeINR          = 4.90
                    estimatedDeliveryMinutes = 35
                    minimumOrderValueINR    = 20.0
                    active                  = $true
                }
            )
        }
    }
}

try {
    $created = Invoke-Api -Method POST -Path "/api/stores" -Body $store -Token $token
    $storeId = $created.id
    Write-Host " OK (id: $storeId)" -ForegroundColor Green
} catch {
    Write-Host " Store might already exist. Fetching..." -ForegroundColor Yellow
    $existing = Invoke-Api -Method GET -Path "/api/stores?code=DOM001" -Token $token
    $storeId = $existing[0].id
    Write-Host "  Existing store id: $storeId" -ForegroundColor Yellow
}

# --- Save state for next scripts ---
$state = @{
    storeId         = $storeId
    storeCode       = "DOM001"
    bootstrapToken  = $token
}
$state | ConvertTo-Json | Set-Content ".\demo-state.json"

Write-Host ""
Write-Host "Store DOM001 ready. State saved to demo-state.json." -ForegroundColor Green
Write-Host "Run 3-create-staff.ps1 next." -ForegroundColor Cyan
