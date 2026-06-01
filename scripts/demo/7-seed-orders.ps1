# MaSoVa Demo — Step 7: Seed Historical Orders
# Creates ~120 orders spread over the last 90 days.
# Required for AI agent demos: demand forecasting (90-day history), churn prevention,
# review response agent, and analytics dashboard.
# Orders are created via POST /api/orders then immediately transitioned to a terminal state.

$ErrorActionPreference = "Stop"
$BASE = "http://localhost:8080"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  MaSoVa Demo — Step 7: Seed Orders" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path ".\demo-state.json")) {
    Write-Host "ERROR: demo-state.json not found. Run prior steps first." -ForegroundColor Red
    exit 1
}
$state = Get-Content ".\demo-state.json" | ConvertFrom-Json
$token = $state.managerToken
$menuIds = $state.menuItemIds

if (-not $menuIds -or $menuIds.Count -eq 0) {
    Write-Host "ERROR: No menu item IDs in state. Run 5-seed-menu.ps1 first." -ForegroundColor Red
    exit 1
}

# Fetch real menu items so we can use correct prices
Write-Host "Fetching menu item prices..." -NoNewline
$menuItemsRaw = Invoke-RestMethod -Uri "$BASE/api/menu?storeId=DOM001" -Headers @{ "Authorization" = "Bearer $token" }
$menuMap = @{}
foreach ($m in $menuItemsRaw) { $menuMap[$m.id] = $m }
Write-Host " $($menuMap.Count) items loaded" -ForegroundColor Green
Write-Host ""

function Invoke-Api {
    param([string]$Method, [string]$Path, $Body = $null, [string]$Token = $null)
    $headers = @{
        "Content-Type"    = "application/json"
        "X-User-Type"     = "MANAGER"
        "X-User-Store-Id" = "DOM001"
    }
    if ($Token) { $headers["Authorization"] = "Bearer $Token" }
    $params = @{ Uri = "$BASE$Path"; Method = $Method; Headers = $headers }
    if ($Body -ne $null) { $params["Body"] = ($Body | ConvertTo-Json -Depth 10) }
    try {
        return Invoke-RestMethod @params
    } catch {
        $status = $_.Exception.Response.StatusCode.value__
        $msg = $_.ErrorDetails.Message
        Write-Host "  ERROR $status on $Method $Path — $msg" -ForegroundColor Red
        return $null
    }
}

# Customer data for orders
$customers = @(
    @{ name = "Anna Müller";    email = "anna.mueller@gmail.com";   phone = "4917612345601"; lat = 52.5219; lng = 13.4132; postal = "10178" },
    @{ name = "Felix Schmidt";  email = "felix.schmidt@gmail.com";  phone = "4917612345602"; lat = 52.5340; lng = 13.4224; postal = "10405" },
    @{ name = "Lena Wagner";    email = "lena.wagner@gmail.com";    phone = "4917612345603"; lat = 52.5170; lng = 13.3886; postal = "10117" },
    @{ name = "Thomas Braun";   email = "thomas.braun@gmail.com";   phone = "4917612345604"; lat = 52.5027; lng = 13.3290; postal = "10707" },
    @{ name = "Sophie Richter"; email = "sophie.richter@gmail.com"; phone = "4917612345605"; lat = 52.4894; lng = 13.3889; postal = "10961" }
)

$orderTypes  = @("DELIVERY", "DELIVERY", "DELIVERY", "TAKEAWAY", "DINE_IN")
$payMethods  = @("CARD", "CARD", "CASH", "CARD", "CASH")

# Build 120 order specs distributed over 90 days
# — weekends have higher volume (1.5x)
# — spread across all customers
$orders = @()
$today = Get-Date
for ($i = 0; $i -lt 120; $i++) {
    $daysBack = [math]::Floor(($i / 120) * 90) + (Get-Random -Minimum 0 -Maximum 3)
    $orderDate = $today.AddDays(-$daysBack)
    $customer = $customers[$i % $customers.Count]
    $orderType = $orderTypes[(Get-Random -Minimum 0 -Maximum $orderTypes.Count)]
    $payMethod = $payMethods[(Get-Random -Minimum 0 -Maximum $payMethods.Count)]

    # Pick 1-3 random menu items
    $itemCount = Get-Random -Minimum 1 -Maximum 4
    $selectedIds = $menuIds | Get-Random -Count ([math]::Min($itemCount, $menuIds.Count))
    if ($selectedIds -isnot [System.Array]) { $selectedIds = @($selectedIds) }

    $items = @($selectedIds | ForEach-Object {
        $mi = $menuMap[$_]
        @{
            menuItemId = $_
            name       = if ($mi) { $mi.name } else { "Menu Item" }
            quantity   = (Get-Random -Minimum 1 -Maximum 3)
            price      = if ($mi) { [math]::Round($mi.basePrice / 100.0, 2) } else { 9.90 }
        }
    })

    $order = @{
        customerName   = $customer.name
        customerPhone  = $customer.phone
        customerEmail  = $customer.email
        storeId        = "DOM001"
        orderType      = $orderType
        paymentMethod  = $payMethod
        items          = $items
        orderSource    = "MASOVA"
    }

    if ($orderType -eq "DELIVERY") {
        $order["deliveryAddress"] = @{
            street     = "Delivery Street $i"
            city       = "Berlin"
            state      = "Berlin"
            postalCode = $customer.postal
            latitude   = $customer.lat
            longitude  = $customer.lng
        }
    }
    if ($orderType -eq "DINE_IN") {
        $order["specialInstructions"] = "Table T$((Get-Random -Minimum 1 -Maximum 12)), $((Get-Random -Minimum 1 -Maximum 5)) guests"
    }

    $orders += @{ order = $order; targetStatus = "COMPLETED"; daysBack = $daysBack }
}

# Also add a few aggregator orders for the unified queue demo
$aggregatorSources = @("WOLT", "DELIVEROO", "JUST_EAT", "UBER_EATS")
for ($i = 0; $i -lt 20; $i++) {
    $customer = $customers[$i % $customers.Count]
    $source = $aggregatorSources[$i % $aggregatorSources.Count]
    $selectedIds = $menuIds | Get-Random -Count ([math]::Min(2, $menuIds.Count))
    if ($selectedIds -isnot [System.Array]) { $selectedIds = @($selectedIds) }

    $orders += @{
        order = @{
            customerName        = $customer.name
            customerPhone       = $customer.phone
            customerEmail       = $customer.email
            storeId             = "DOM001"
            orderType           = "DELIVERY"
            paymentMethod       = "AGGREGATOR_COLLECTED"
            orderSource         = $source
            aggregatorOrderId   = "$source-$(Get-Random -Minimum 10000 -Maximum 99999)"
            items               = @($selectedIds | ForEach-Object {
                $mi = $menuMap[$_]
                @{ menuItemId = $_; name = if ($mi) { $mi.name } else { "Menu Item" }; quantity = 1; price = if ($mi) { [math]::Round($mi.basePrice / 100.0, 2) } else { 9.90 } }
            })
            deliveryAddress = @{
                street     = "Aggregator Street $i"
                city       = "Berlin"
                state      = "Berlin"
                postalCode = $customer.postal
                latitude   = $customer.lat
                longitude  = $customer.lng
            }
        }
        targetStatus = "DELIVERED"
        daysBack = (Get-Random -Minimum 1 -Maximum 30)
    }
}

Write-Host "Creating $($orders.Count) orders (120 direct + 20 aggregator)..." -ForegroundColor Cyan
Write-Host ""

$ok = 0; $failed = 0

foreach ($entry in $orders) {
    $result = Invoke-Api -Method POST -Path "/api/orders" -Body $entry.order -Token $token
    if ($result -and $result.id) {
        $orderId = $result.id
        # Advance to terminal state
        $transitionStatus = $entry.targetStatus
        $advanced = Invoke-Api -Method POST -Path "/api/orders/$orderId/status" -Body @{
            status  = $transitionStatus
            comment = "Demo historical order"
        } -Token $token
        if ($advanced) { $ok++ } else { $ok++ } # Count as ok even if transition fails
    } else {
        $failed++
    }

    if (($ok + $failed) % 20 -eq 0) {
        Write-Host "  Progress: $ok created, $failed failed..." -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "Orders seeded: $ok created, $failed failed." -ForegroundColor $(if ($failed -lt 10) { "Green" } else { "Yellow" })
Write-Host ""
Write-Host "Run 8-seed-inventory.ps1 next." -ForegroundColor Cyan
