# MaSoVa Demo — Step 6: Declare Allergens
# PATCHes every menu item with its allergen declaration.
# EU Regulation 1169/2011 gate: items cannot be set isAvailable=true until allergensDeclared=true.
# This script maps each item by name to its correct allergen set and declares them all.

$ErrorActionPreference = "Stop"
$BASE = "http://localhost:8080"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  MaSoVa Demo — Step 6: Declare Allergens" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path ".\demo-state.json")) {
    Write-Host "ERROR: demo-state.json not found. Run prior steps first." -ForegroundColor Red
    exit 1
}
$state = Get-Content ".\demo-state.json" | ConvertFrom-Json
$token = $state.managerToken

function Invoke-Api {
    param([string]$Method, [string]$Path, [hashtable]$Body = $null, [string]$Token = $null)
    $headers = @{
        "Content-Type"    = "application/json"
        "X-User-Type"     = "MANAGER"
        "X-User-Store-Id" = "DOM001"
    }
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

# Allergen map: item name → allergen list + whether item is allergen-free
# AllergenType enum values: CELERY, CEREALS_GLUTEN, CRUSTACEANS, EGGS, FISH, LUPIN,
#                           MILK, MOLLUSCS, MUSTARD, NUTS, PEANUTS, SESAME, SOYA, SULPHUR_DIOXIDE
$allergenMap = @{
    "Margherita"            = @{ allergens = @("CEREALS_GLUTEN", "MILK"); free = $false }
    "Pepperoni"             = @{ allergens = @("CEREALS_GLUTEN", "MILK", "SOYA"); free = $false }
    "Quattro Stagioni"      = @{ allergens = @("CEREALS_GLUTEN", "MILK", "SULPHUR_DIOXIDE"); free = $false }
    "Diavola"               = @{ allergens = @("CEREALS_GLUTEN", "MILK", "SOYA"); free = $false }
    "Veggie Garden"         = @{ allergens = @("CEREALS_GLUTEN", "MILK"); free = $false }
    "Spaghetti Bolognese"   = @{ allergens = @("CEREALS_GLUTEN", "EGGS", "MILK"); free = $false }
    "Penne Arrabbiata"      = @{ allergens = @("CEREALS_GLUTEN"); free = $false }
    "Tagliatelle al Salmone" = @{ allergens = @("CEREALS_GLUTEN", "EGGS", "FISH", "MILK"); free = $false }
    "Gnocchi Gorgonzola"    = @{ allergens = @("CEREALS_GLUTEN", "EGGS", "MILK", "NUTS"); free = $false }
    "Classic Cheeseburger"  = @{ allergens = @("CEREALS_GLUTEN", "EGGS", "MILK", "MUSTARD", "SOYA"); free = $false }
    "Crispy Chicken Burger" = @{ allergens = @("CEREALS_GLUTEN", "EGGS", "MILK", "MUSTARD", "SOYA"); free = $false }
    "Mushroom Swiss Burger"  = @{ allergens = @("CEREALS_GLUTEN", "EGGS", "MILK", "MUSTARD"); free = $false }
    "Black Bean Burger"     = @{ allergens = @("CEREALS_GLUTEN", "SOYA", "MUSTARD"); free = $false }
    "Pommes Frites"         = @{ allergens = @(); free = $true }
    "Onion Rings"           = @{ allergens = @("CEREALS_GLUTEN", "MILK"); free = $false }
    "Caesar Salad"          = @{ allergens = @("CEREALS_GLUTEN", "EGGS", "FISH", "MILK", "MUSTARD"); free = $false }
    "Bread & Olives"        = @{ allergens = @("CEREALS_GLUTEN"); free = $false }
    "Coleslaw"              = @{ allergens = @("EGGS", "MUSTARD"); free = $false }
    "Espresso"              = @{ allergens = @(); free = $true }
    "Cappuccino"            = @{ allergens = @("MILK"); free = $false }
    "Flat White"            = @{ allergens = @("MILK"); free = $false }
    "Herbal Tea"            = @{ allergens = @(); free = $true }
    "Sparkling Water"       = @{ allergens = @(); free = $true }
    "Still Water"           = @{ allergens = @(); free = $true }
    "Fresh Lemonade"        = @{ allergens = @(); free = $true }
    "Mango Lassi"           = @{ allergens = @("MILK"); free = $false }
    "Craft Cola"            = @{ allergens = @(); free = $true }
    "Fresh Orange Juice"    = @{ allergens = @(); free = $true }
    "Tiramisu"              = @{ allergens = @("CEREALS_GLUTEN", "EGGS", "MILK"); free = $false }
    "New York Cheesecake"   = @{ allergens = @("CEREALS_GLUTEN", "EGGS", "MILK"); free = $false }
    "Chocolate Lava Cake"   = @{ allergens = @("CEREALS_GLUTEN", "EGGS", "MILK", "SOYA"); free = $false }
    "Panna Cotta"           = @{ allergens = @("MILK"); free = $false }
    "Affogato"              = @{ allergens = @("MILK"); free = $false }
    "Vanilla Gelato"        = @{ allergens = @("EGGS", "MILK"); free = $false }
    "Brownie & Ice Cream"   = @{ allergens = @("CEREALS_GLUTEN", "EGGS", "MILK", "SOYA"); free = $false }
    "Grilled Salmon"        = @{ allergens = @("FISH", "MILK", "CELERY"); free = $false }
    "Chicken Schnitzel"     = @{ allergens = @("CEREALS_GLUTEN", "EGGS", "MILK", "MUSTARD"); free = $false }
    "Mushroom Risotto"      = @{ allergens = @("MILK", "CELERY", "SULPHUR_DIOXIDE"); free = $false }
    "Beef Goulash"          = @{ allergens = @("CEREALS_GLUTEN", "EGGS", "MILK", "CELERY"); free = $false }
}

# Fetch all items for this store
Write-Host "Fetching menu items for DOM001..." -NoNewline
$allItems = Invoke-Api -Method GET -Path "/api/menu?storeId=DOM001" -Token $token
Write-Host " $($allItems.Count) items" -ForegroundColor Green
Write-Host ""

$ok = 0; $skipped = 0; $failed = 0

foreach ($item in $allItems) {
    $name = $item.name
    $id   = $item.id

    if (-not $allergenMap.ContainsKey($name)) {
        Write-Host "  [$name] — no allergen mapping, skipping" -ForegroundColor Yellow
        $skipped++
        continue
    }

    $allergenData = $allergenMap[$name]
    Write-Host "  [$name]..." -NoNewline

    try {
        Invoke-Api -Method PATCH -Path "/api/menu/items/$id/allergens" -Body @{
            allergens    = $allergenData.allergens
            allergenFree = $allergenData.free
        } -Token $token | Out-Null
        Write-Host " declared ($($allergenData.allergens.Count) allergens)" -ForegroundColor Green
        $ok++
    } catch {
        Write-Host " FAILED" -ForegroundColor Red
        $failed++
    }
}

Write-Host ""
Write-Host "Allergen declaration complete: $ok declared, $skipped skipped, $failed failed." -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Yellow" })
Write-Host "Run 7-seed-orders.ps1 next." -ForegroundColor Cyan
