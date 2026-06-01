# MaSoVa Demo — Step 8: Seed Inventory Items
# Creates 20 inventory items for DOM001.
# Some are intentionally near/below reorder threshold so the
# Inventory Reorder AI agent has something to flag during the demo.

$ErrorActionPreference = "Stop"
$BASE = "http://localhost:8080"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  MaSoVa Demo — Step 8: Seed Inventory" -ForegroundColor Cyan
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

# currentStock deliberately set low on items marked ⚠ — these trigger the AI Inventory agent
$inventoryItems = @(

    # ⚠ LOW STOCK — will trigger Inventory Reorder agent
    @{
        storeId          = "DOM001"
        itemName         = "Mozzarella (fresh)"
        itemCode         = "ING-MOZ-001"
        category         = "INGREDIENT"
        unit             = "kg"
        currentStock     = 1.2     # ⚠ below minimum
        minimumStock     = 3.0
        maximumStock     = 20.0
        reorderQuantity  = 10.0
        isPerishable     = $true
        shelfLifeDays    = 5
        autoReorder      = $true
        storageLocation  = "Fridge-A"
        description      = "Fresh mozzarella for pizza and pasta"
    },
    @{
        storeId          = "DOM001"
        itemName         = "00 Flour (pizza)"
        itemCode         = "ING-FLR-001"
        category         = "DRY_GOODS"
        unit             = "kg"
        currentStock     = 4.0     # ⚠ below minimum
        minimumStock     = 8.0
        maximumStock     = 50.0
        reorderQuantity  = 25.0
        isPerishable     = $false
        autoReorder      = $true
        storageLocation  = "Dry-Store-B"
        description      = "Caputo Tipo 00 flour for pizza dough"
    },
    @{
        storeId          = "DOM001"
        itemName         = "Salmon fillet"
        itemCode         = "ING-SAL-001"
        category         = "INGREDIENT"
        unit             = "kg"
        currentStock     = 0.8     # ⚠ critically low
        minimumStock     = 2.0
        maximumStock     = 10.0
        reorderQuantity  = 5.0
        isPerishable     = $true
        shelfLifeDays    = 2
        autoReorder      = $true
        storageLocation  = "Fridge-B"
        description      = "Atlantic salmon fillet, skin-on"
    },

    # HEALTHY STOCK
    @{
        storeId          = "DOM001"
        itemName         = "San Marzano tomato (tinned)"
        itemCode         = "ING-TOM-001"
        category         = "INGREDIENT"
        unit             = "kg"
        currentStock     = 18.0
        minimumStock     = 5.0
        maximumStock     = 40.0
        reorderQuantity  = 20.0
        isPerishable     = $false
        autoReorder      = $true
        storageLocation  = "Dry-Store-A"
    },
    @{
        storeId          = "DOM001"
        itemName         = "Pepperoni"
        itemCode         = "ING-PEP-001"
        category         = "INGREDIENT"
        unit             = "kg"
        currentStock     = 5.5
        minimumStock     = 2.0
        maximumStock     = 15.0
        reorderQuantity  = 8.0
        isPerishable     = $true
        shelfLifeDays    = 14
        autoReorder      = $true
        storageLocation  = "Fridge-A"
    },
    @{
        storeId          = "DOM001"
        itemName         = "Ground beef (180g portions)"
        itemCode         = "ING-BEF-001"
        category         = "INGREDIENT"
        unit             = "kg"
        currentStock     = 8.0
        minimumStock     = 3.0
        maximumStock     = 20.0
        reorderQuantity  = 10.0
        isPerishable     = $true
        shelfLifeDays    = 3
        autoReorder      = $true
        storageLocation  = "Fridge-B"
    },
    @{
        storeId          = "DOM001"
        itemName         = "Chicken breast"
        itemCode         = "ING-CHK-001"
        category         = "INGREDIENT"
        unit             = "kg"
        currentStock     = 6.0
        minimumStock     = 2.0
        maximumStock     = 15.0
        reorderQuantity  = 8.0
        isPerishable     = $true
        shelfLifeDays    = 3
        autoReorder      = $true
        storageLocation  = "Fridge-B"
    },
    @{
        storeId          = "DOM001"
        itemName         = "Brioche burger buns"
        itemCode         = "ING-BUN-001"
        category         = "DRY_GOODS"
        unit             = "pieces"
        currentStock     = 80.0
        minimumStock     = 20.0
        maximumStock     = 200.0
        reorderQuantity  = 100.0
        isPerishable     = $true
        shelfLifeDays    = 4
        autoReorder      = $true
        storageLocation  = "Dry-Store-A"
    },
    @{
        storeId          = "DOM001"
        itemName         = "Parmigiano Reggiano"
        itemCode         = "ING-PAR-001"
        category         = "INGREDIENT"
        unit             = "kg"
        currentStock     = 3.5
        minimumStock     = 1.0
        maximumStock     = 10.0
        reorderQuantity  = 5.0
        isPerishable     = $true
        shelfLifeDays    = 30
        autoReorder      = $false
        storageLocation  = "Fridge-A"
    },
    @{
        storeId          = "DOM001"
        itemName         = "Olive oil (extra-virgin)"
        itemCode         = "ING-OIL-001"
        category         = "OILS_GHEE"
        unit             = "liters"
        currentStock     = 12.0
        minimumStock     = 3.0
        maximumStock     = 30.0
        reorderQuantity  = 10.0
        isPerishable     = $false
        autoReorder      = $true
        storageLocation  = "Dry-Store-B"
    },
    @{
        storeId          = "DOM001"
        itemName         = "Potatoes (Agria)"
        itemCode         = "ING-POT-001"
        category         = "INGREDIENT"
        unit             = "kg"
        currentStock     = 22.0
        minimumStock     = 8.0
        maximumStock     = 50.0
        reorderQuantity  = 25.0
        isPerishable     = $true
        shelfLifeDays    = 14
        autoReorder      = $true
        storageLocation  = "Dry-Store-A"
    },
    @{
        storeId          = "DOM001"
        itemName         = "Mixed wild mushrooms"
        itemCode         = "ING-MSH-001"
        category         = "INGREDIENT"
        unit             = "kg"
        currentStock     = 3.0
        minimumStock     = 1.0
        maximumStock     = 8.0
        reorderQuantity  = 4.0
        isPerishable     = $true
        shelfLifeDays    = 5
        autoReorder      = $false
        storageLocation  = "Fridge-A"
    },
    @{
        storeId          = "DOM001"
        itemName         = "Espresso beans (Brazilian blend)"
        itemCode         = "BEV-ESP-001"
        category         = "BEVERAGES"
        unit             = "kg"
        currentStock     = 8.0
        minimumStock     = 2.0
        maximumStock     = 20.0
        reorderQuantity  = 10.0
        isPerishable     = $false
        autoReorder      = $true
        storageLocation  = "Dry-Store-B"
    },
    @{
        storeId          = "DOM001"
        itemName         = "Whole milk"
        itemCode         = "BEV-MLK-001"
        category         = "BEVERAGES"
        unit             = "liters"
        currentStock     = 20.0
        minimumStock     = 5.0
        maximumStock     = 40.0
        reorderQuantity  = 20.0
        isPerishable     = $true
        shelfLifeDays    = 7
        autoReorder      = $true
        storageLocation  = "Fridge-C"
    },
    @{
        storeId          = "DOM001"
        itemName         = "Pizza boxes (32cm)"
        itemCode         = "PKG-BOX-001"
        category         = "PACKAGING"
        unit             = "pieces"
        currentStock     = 150.0
        minimumStock     = 50.0
        maximumStock     = 500.0
        reorderQuantity  = 200.0
        isPerishable     = $false
        autoReorder      = $true
        storageLocation  = "Storage-Room"
    },
    @{
        storeId          = "DOM001"
        itemName         = "Takeaway bags (large)"
        itemCode         = "PKG-BAG-001"
        category         = "PACKAGING"
        unit             = "pieces"
        currentStock     = 200.0
        minimumStock     = 50.0
        maximumStock     = 600.0
        reorderQuantity  = 300.0
        isPerishable     = $false
        autoReorder      = $true
        storageLocation  = "Storage-Room"
    },

    # ⚠ LOW STOCK
    @{
        storeId          = "DOM001"
        itemName         = "Mascarpone"
        itemCode         = "ING-MAS-001"
        category         = "INGREDIENT"
        unit             = "kg"
        currentStock     = 0.5     # ⚠ below minimum — tiramisu at risk
        minimumStock     = 1.5
        maximumStock     = 8.0
        reorderQuantity  = 4.0
        isPerishable     = $true
        shelfLifeDays    = 7
        autoReorder      = $true
        storageLocation  = "Fridge-A"
        description      = "For tiramisu and pasta sauces"
    },
    @{
        storeId          = "DOM001"
        itemName         = "Valrhona dark chocolate"
        itemCode         = "ING-CHC-001"
        category         = "INGREDIENT"
        unit             = "kg"
        currentStock     = 1.8
        minimumStock     = 1.0
        maximumStock     = 6.0
        reorderQuantity  = 3.0
        isPerishable     = $false
        autoReorder      = $false
        storageLocation  = "Dry-Store-B"
        description      = "70% dark chocolate for lava cake and brownie"
    },
    @{
        storeId          = "DOM001"
        itemName         = "Vanilla gelato (tubs)"
        itemCode         = "ING-GEL-001"
        category         = "FROZEN"
        unit             = "liters"
        currentStock     = 8.0
        minimumStock     = 3.0
        maximumStock     = 20.0
        reorderQuantity  = 10.0
        isPerishable     = $true
        shelfLifeDays    = 60
        autoReorder      = $true
        storageLocation  = "Freezer-A"
    },
    @{
        storeId          = "DOM001"
        itemName         = "Pasta (dried, mixed)"
        itemCode         = "ING-PST-001"
        category         = "DRY_GOODS"
        unit             = "kg"
        currentStock     = 14.0
        minimumStock     = 4.0
        maximumStock     = 30.0
        reorderQuantity  = 15.0
        isPerishable     = $false
        autoReorder      = $true
        storageLocation  = "Dry-Store-A"
    }
)

$ok = 0; $failed = 0
foreach ($item in $inventoryItems) {
    Write-Host "  $($item.itemName)..." -NoNewline
    try {
        Invoke-Api -Method POST -Path "/api/inventory" -Body $item -Token $token | Out-Null
        $stockIndicator = if ($item.currentStock -le $item.minimumStock) { " ⚠ LOW" } else { "" }
        Write-Host " OK$stockIndicator" -ForegroundColor $(if ($item.currentStock -le $item.minimumStock) { "Yellow" } else { "Green" })
        $ok++
    } catch {
        Write-Host " FAILED" -ForegroundColor Red
        $failed++
    }
}

Write-Host ""
Write-Host "Inventory seeded: $ok items created, $failed failed." -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Yellow" })
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Demo seeding COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "What was created:"
Write-Host "  Store  : DOM001 — MaSoVa Berlin Mitte (DE/EUR/de-DE)"
Write-Host "  Staff  : 5 accounts (manager, kitchen, cashier, driver, kiosk)"
Write-Host "  Customers: 5 accounts with saved addresses"
Write-Host "  Menu   : 40 items, allergens declared on all"
Write-Host "  Orders : 140 historical orders (120 direct + 20 aggregator)"
Write-Host "  Inventory: 20 items (3 below reorder threshold)"
Write-Host ""
Write-Host "Manager login: manager.berlin@gmail.com / Demo@1234"
Write-Host "Frontend: http://localhost:3000"
