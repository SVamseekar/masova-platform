# MaSoVa Demo — Step 5: Seed Menu Items
# 40 items across EU-compatible enum values: ITALIAN, CONTINENTAL, AMERICAN, BEVERAGES, DESSERTS.
# Prices in EUR cents (e.g. €12.50 = 1250).
# allergensDeclared = false by default — Step 6 PATCHes them all.

$ErrorActionPreference = "Stop"
$BASE = "http://localhost:8080"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  MaSoVa Demo — Step 5: Seed Menu" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path ".\demo-state.json")) {
    Write-Host "ERROR: demo-state.json not found. Run prior steps first." -ForegroundColor Red
    exit 1
}
$state = Get-Content ".\demo-state.json" | ConvertFrom-Json
$token = $state.managerToken

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
        Write-Host "  ERROR $status — $msg" -ForegroundColor Red
        throw
    }
}

$menuItems = @(

    # ── PIZZA (ITALIAN) ─────────────────────────────────────────────────────────
    @{
        name = "Margherita"
        description = "San Marzano tomato, fresh mozzarella, basil, extra-virgin olive oil"
        cuisine = "ITALIAN"; category = "PIZZA"
        basePrice = 1290; preparationTime = 18; spiceLevel = "NONE"
        dietaryInfo = @("VEGETARIAN"); isAvailable = $true; isRecommended = $true
        storeId = "DOM001"; displayOrder = 1
        tags = @("popular", "vegetarian", "classic")
        variants = @(
            @{ name = "25 cm"; priceModifier = 0; isAvailable = $true },
            @{ name = "32 cm"; priceModifier = 350; isAvailable = $true }
        )
    },
    @{
        name = "Pepperoni"
        description = "Tomato sauce, mozzarella, generous pepperoni slices"
        cuisine = "ITALIAN"; category = "PIZZA"
        basePrice = 1490; preparationTime = 18; spiceLevel = "MILD"
        dietaryInfo = @("NON_VEGETARIAN"); isAvailable = $true; isRecommended = $true
        storeId = "DOM001"; displayOrder = 2
        tags = @("popular", "bestseller")
        variants = @(
            @{ name = "25 cm"; priceModifier = 0; isAvailable = $true },
            @{ name = "32 cm"; priceModifier = 350; isAvailable = $true }
        )
    },
    @{
        name = "Quattro Stagioni"
        description = "Ham, artichokes, mushrooms, olives — four seasons on one pizza"
        cuisine = "ITALIAN"; category = "PIZZA"
        basePrice = 1590; preparationTime = 20; spiceLevel = "NONE"
        dietaryInfo = @("NON_VEGETARIAN"); isAvailable = $true
        storeId = "DOM001"; displayOrder = 3
        tags = @("chef-special")
        variants = @(
            @{ name = "25 cm"; priceModifier = 0; isAvailable = $true },
            @{ name = "32 cm"; priceModifier = 350; isAvailable = $true }
        )
    },
    @{
        name = "Diavola"
        description = "Spicy salami, chilli, tomato, mozzarella"
        cuisine = "ITALIAN"; category = "PIZZA"
        basePrice = 1490; preparationTime = 18; spiceLevel = "HOT"
        dietaryInfo = @("NON_VEGETARIAN"); isAvailable = $true
        storeId = "DOM001"; displayOrder = 4
        tags = @("spicy")
    },
    @{
        name = "Veggie Garden"
        description = "Roasted peppers, courgette, red onion, cherry tomatoes, rocket"
        cuisine = "ITALIAN"; category = "PIZZA"
        basePrice = 1390; preparationTime = 18; spiceLevel = "NONE"
        dietaryInfo = @("VEGETARIAN", "VEGAN"); isAvailable = $true
        storeId = "DOM001"; displayOrder = 5
        tags = @("vegan", "vegetarian")
        variants = @(
            @{ name = "25 cm"; priceModifier = 0; isAvailable = $true },
            @{ name = "32 cm"; priceModifier = 350; isAvailable = $true }
        )
    },

    # ── PASTA (ITALIAN → CONTINENTAL) ───────────────────────────────────────────
    @{
        name = "Spaghetti Bolognese"
        description = "Slow-cooked beef ragù, Parmigiano Reggiano, fresh pasta"
        cuisine = "CONTINENTAL"; category = "CURRY_GRAVY"
        basePrice = 1390; preparationTime = 15; spiceLevel = "NONE"
        dietaryInfo = @("NON_VEGETARIAN"); isAvailable = $true; isRecommended = $true
        storeId = "DOM001"; displayOrder = 10
        tags = @("popular", "pasta", "classic")
    },
    @{
        name = "Penne Arrabbiata"
        description = "Penne with spicy tomato and garlic sauce, parsley"
        cuisine = "CONTINENTAL"; category = "CURRY_GRAVY"
        basePrice = 1190; preparationTime = 12; spiceLevel = "MEDIUM"
        dietaryInfo = @("VEGETARIAN", "VEGAN"); isAvailable = $true
        storeId = "DOM001"; displayOrder = 11
        tags = @("pasta", "spicy", "vegan")
    },
    @{
        name = "Tagliatelle al Salmone"
        description = "Fresh tagliatelle with smoked salmon, cream, capers, dill"
        cuisine = "CONTINENTAL"; category = "CURRY_GRAVY"
        basePrice = 1590; preparationTime = 15; spiceLevel = "NONE"
        dietaryInfo = @("NON_VEGETARIAN"); isAvailable = $true
        storeId = "DOM001"; displayOrder = 12
        tags = @("pasta", "fish", "premium")
    },
    @{
        name = "Gnocchi Gorgonzola"
        description = "Homemade potato gnocchi with gorgonzola cream sauce, walnuts"
        cuisine = "CONTINENTAL"; category = "CURRY_GRAVY"
        basePrice = 1350; preparationTime = 15; spiceLevel = "NONE"
        dietaryInfo = @("VEGETARIAN"); isAvailable = $true
        storeId = "DOM001"; displayOrder = 13
        tags = @("pasta", "vegetarian", "chef-special")
    },

    # ── BURGERS (AMERICAN) ───────────────────────────────────────────────────────
    @{
        name = "Classic Cheeseburger"
        description = "180g beef patty, cheddar, lettuce, tomato, pickle, special sauce, brioche bun"
        cuisine = "AMERICAN"; category = "BURGER"
        basePrice = 1290; preparationTime = 12; spiceLevel = "NONE"
        dietaryInfo = @("NON_VEGETARIAN"); isAvailable = $true; isRecommended = $true
        storeId = "DOM001"; displayOrder = 20
        tags = @("popular", "bestseller")
        variants = @(
            @{ name = "Single"; priceModifier = 0; isAvailable = $true },
            @{ name = "Double"; priceModifier = 350; isAvailable = $true }
        )
    },
    @{
        name = "Crispy Chicken Burger"
        description = "Buttermilk-marinated fried chicken thigh, coleslaw, pickled jalapeños, sriracha mayo"
        cuisine = "AMERICAN"; category = "BURGER"
        basePrice = 1350; preparationTime = 14; spiceLevel = "MEDIUM"
        dietaryInfo = @("NON_VEGETARIAN"); isAvailable = $true; isRecommended = $true
        storeId = "DOM001"; displayOrder = 21
        tags = @("popular", "chicken", "spicy")
    },
    @{
        name = "Mushroom Swiss Burger"
        description = "Beef patty, sautéed mushrooms, Swiss cheese, caramelised onions, thyme aioli"
        cuisine = "AMERICAN"; category = "BURGER"
        basePrice = 1390; preparationTime = 14; spiceLevel = "NONE"
        dietaryInfo = @("NON_VEGETARIAN"); isAvailable = $true
        storeId = "DOM001"; displayOrder = 22
        tags = @("premium")
    },
    @{
        name = "Black Bean Burger"
        description = "Spiced black bean and quinoa patty, avocado, red cabbage slaw, chipotle mayo"
        cuisine = "AMERICAN"; category = "BURGER"
        basePrice = 1190; preparationTime = 12; spiceLevel = "MILD"
        dietaryInfo = @("VEGETARIAN", "VEGAN"); isAvailable = $true
        storeId = "DOM001"; displayOrder = 23
        tags = @("vegan", "vegetarian")
    },

    # ── SIDES (AMERICAN) ────────────────────────────────────────────────────────
    @{
        name = "Pommes Frites"
        description = "Double-fried Belgian-style fries, fleur de sel"
        cuisine = "AMERICAN"; category = "SIDES"
        basePrice = 490; preparationTime = 8; spiceLevel = "NONE"
        dietaryInfo = @("VEGETARIAN", "VEGAN"); isAvailable = $true; isRecommended = $true
        storeId = "DOM001"; displayOrder = 30
        tags = @("popular", "side")
        variants = @(
            @{ name = "Regular"; priceModifier = 0; isAvailable = $true },
            @{ name = "Large"; priceModifier = 150; isAvailable = $true }
        )
    },
    @{
        name = "Onion Rings"
        description = "Beer-battered onion rings, chipotle dip"
        cuisine = "AMERICAN"; category = "SIDES"
        basePrice = 590; preparationTime = 8; spiceLevel = "NONE"
        dietaryInfo = @("VEGETARIAN"); isAvailable = $true
        storeId = "DOM001"; displayOrder = 31
        tags = @("side", "popular")
    },
    @{
        name = "Caesar Salad"
        description = "Romaine, anchovy dressing, Parmigiano, croutons, soft-boiled egg"
        cuisine = "CONTINENTAL"; category = "SIDES"
        basePrice = 890; preparationTime = 8; spiceLevel = "NONE"
        dietaryInfo = @("NON_VEGETARIAN"); isAvailable = $true
        storeId = "DOM001"; displayOrder = 32
        tags = @("salad", "healthy")
        variants = @(
            @{ name = "Starter"; priceModifier = 0; isAvailable = $true },
            @{ name = "Main"; priceModifier = 300; isAvailable = $true }
        )
    },
    @{
        name = "Bread & Olives"
        description = "Sourdough focaccia, herb oil, marinated Kalamata olives"
        cuisine = "CONTINENTAL"; category = "SIDES"
        basePrice = 590; preparationTime = 5; spiceLevel = "NONE"
        dietaryInfo = @("VEGETARIAN", "VEGAN"); isAvailable = $true
        storeId = "DOM001"; displayOrder = 33
        tags = @("starter", "vegan", "sharing")
    },
    @{
        name = "Coleslaw"
        description = "White cabbage, carrot, apple, creamy mustard dressing"
        cuisine = "AMERICAN"; category = "SIDES"
        basePrice = 390; preparationTime = 2; spiceLevel = "NONE"
        dietaryInfo = @("VEGETARIAN"); isAvailable = $true
        storeId = "DOM001"; displayOrder = 34
        tags = @("side")
    },

    # ── HOT DRINKS (BEVERAGES) ───────────────────────────────────────────────────
    @{
        name = "Espresso"
        description = "Single origin Brazilian espresso, double shot"
        cuisine = "BEVERAGES"; category = "HOT_DRINKS"
        basePrice = 290; preparationTime = 3; spiceLevel = "NONE"
        dietaryInfo = @("VEGAN"); isAvailable = $true
        storeId = "DOM001"; displayOrder = 40
        tags = @("coffee", "hot")
        variants = @(
            @{ name = "Single"; priceModifier = 0; isAvailable = $true },
            @{ name = "Double"; priceModifier = 100; isAvailable = $true }
        )
    },
    @{
        name = "Cappuccino"
        description = "Double espresso, steamed milk, thick foam"
        cuisine = "BEVERAGES"; category = "HOT_DRINKS"
        basePrice = 390; preparationTime = 4; spiceLevel = "NONE"
        dietaryInfo = @("VEGETARIAN"); isAvailable = $true; isRecommended = $true
        storeId = "DOM001"; displayOrder = 41
        tags = @("coffee", "popular", "hot")
        variants = @(
            @{ name = "Regular 250ml"; priceModifier = 0; isAvailable = $true },
            @{ name = "Large 350ml"; priceModifier = 100; isAvailable = $true }
        )
    },
    @{
        name = "Flat White"
        description = "Ristretto shots, velvety microfoam milk"
        cuisine = "BEVERAGES"; category = "HOT_DRINKS"
        basePrice = 420; preparationTime = 4; spiceLevel = "NONE"
        dietaryInfo = @("VEGETARIAN"); isAvailable = $true
        storeId = "DOM001"; displayOrder = 42
        tags = @("coffee", "hot")
    },
    @{
        name = "Herbal Tea"
        description = "Choice of chamomile, peppermint, or ginger"
        cuisine = "BEVERAGES"; category = "HOT_DRINKS"
        basePrice = 320; preparationTime = 3; spiceLevel = "NONE"
        dietaryInfo = @("VEGAN"); isAvailable = $true
        storeId = "DOM001"; displayOrder = 43
        tags = @("tea", "hot", "healthy")
    },

    # ── COLD DRINKS (BEVERAGES) ──────────────────────────────────────────────────
    @{
        name = "Sparkling Water"
        description = "Gerolsteiner mineral water 330ml"
        cuisine = "BEVERAGES"; category = "COLD_DRINKS"
        basePrice = 250; preparationTime = 1; spiceLevel = "NONE"
        dietaryInfo = @("VEGAN"); isAvailable = $true
        storeId = "DOM001"; displayOrder = 50
        tags = @("water", "cold")
    },
    @{
        name = "Still Water"
        description = "Still mineral water 330ml"
        cuisine = "BEVERAGES"; category = "COLD_DRINKS"
        basePrice = 220; preparationTime = 1; spiceLevel = "NONE"
        dietaryInfo = @("VEGAN"); isAvailable = $true
        storeId = "DOM001"; displayOrder = 51
        tags = @("water", "cold")
    },
    @{
        name = "Fresh Lemonade"
        description = "Squeezed lemons, sparkling water, mint, cane sugar"
        cuisine = "BEVERAGES"; category = "COLD_DRINKS"
        basePrice = 450; preparationTime = 4; spiceLevel = "NONE"
        dietaryInfo = @("VEGAN"); isAvailable = $true; isRecommended = $true
        storeId = "DOM001"; displayOrder = 52
        tags = @("cold", "refreshing", "popular")
        variants = @(
            @{ name = "Regular 400ml"; priceModifier = 0; isAvailable = $true },
            @{ name = "Large 600ml"; priceModifier = 200; isAvailable = $true }
        )
    },
    @{
        name = "Mango Lassi"
        description = "Alphonso mango, yoghurt, cardamom"
        cuisine = "BEVERAGES"; category = "COLD_DRINKS"
        basePrice = 490; preparationTime = 4; spiceLevel = "NONE"
        dietaryInfo = @("VEGETARIAN"); isAvailable = $true
        storeId = "DOM001"; displayOrder = 53
        tags = @("cold", "yoghurt")
    },
    @{
        name = "Craft Cola"
        description = "Fentimans botanically brewed cola 275ml"
        cuisine = "BEVERAGES"; category = "COLD_DRINKS"
        basePrice = 350; preparationTime = 1; spiceLevel = "NONE"
        dietaryInfo = @("VEGAN"); isAvailable = $true
        storeId = "DOM001"; displayOrder = 54
        tags = @("cold", "soft-drink")
    },
    @{
        name = "Fresh Orange Juice"
        description = "Freshly squeezed Valencia oranges 300ml"
        cuisine = "BEVERAGES"; category = "COLD_DRINKS"
        basePrice = 490; preparationTime = 3; spiceLevel = "NONE"
        dietaryInfo = @("VEGAN"); isAvailable = $true
        storeId = "DOM001"; displayOrder = 55
        tags = @("cold", "juice", "healthy")
    },

    # ── DESSERTS ─────────────────────────────────────────────────────────────────
    @{
        name = "Tiramisu"
        description = "Mascarpone cream, espresso-soaked savoiardi, cocoa dusting — classic Italian"
        cuisine = "DESSERTS"; category = "DESSERT_SPECIALS"
        basePrice = 790; preparationTime = 3; spiceLevel = "NONE"
        dietaryInfo = @("VEGETARIAN"); isAvailable = $true; isRecommended = $true
        storeId = "DOM001"; displayOrder = 60
        tags = @("popular", "italian", "classic")
    },
    @{
        name = "New York Cheesecake"
        description = "Baked vanilla cheesecake, graham cracker base, berry compote"
        cuisine = "DESSERTS"; category = "DESSERT_SPECIALS"
        basePrice = 690; preparationTime = 3; spiceLevel = "NONE"
        dietaryInfo = @("VEGETARIAN"); isAvailable = $true; isRecommended = $true
        storeId = "DOM001"; displayOrder = 61
        tags = @("popular", "cheesecake")
    },
    @{
        name = "Chocolate Lava Cake"
        description = "Warm Valrhona dark chocolate cake, molten centre, vanilla ice cream"
        cuisine = "DESSERTS"; category = "DESSERT_SPECIALS"
        basePrice = 890; preparationTime = 12; spiceLevel = "NONE"
        dietaryInfo = @("VEGETARIAN"); isAvailable = $true
        storeId = "DOM001"; displayOrder = 62
        tags = @("chocolate", "warm", "premium")
    },
    @{
        name = "Panna Cotta"
        description = "Vanilla panna cotta, raspberry coulis, fresh berries"
        cuisine = "DESSERTS"; category = "DESSERT_SPECIALS"
        basePrice = 650; preparationTime = 3; spiceLevel = "NONE"
        dietaryInfo = @("VEGETARIAN"); isAvailable = $true
        storeId = "DOM001"; displayOrder = 63
        tags = @("italian", "light")
    },
    @{
        name = "Affogato"
        description = "Double espresso poured over vanilla gelato"
        cuisine = "DESSERTS"; category = "DESSERT_SPECIALS"
        basePrice = 590; preparationTime = 3; spiceLevel = "NONE"
        dietaryInfo = @("VEGETARIAN"); isAvailable = $true
        storeId = "DOM001"; displayOrder = 64
        tags = @("italian", "coffee", "ice-cream")
    },
    @{
        name = "Vanilla Gelato"
        description = "Two scoops Madagascan vanilla gelato"
        cuisine = "DESSERTS"; category = "ICE_CREAM"
        basePrice = 490; preparationTime = 2; spiceLevel = "NONE"
        dietaryInfo = @("VEGETARIAN"); isAvailable = $true
        storeId = "DOM001"; displayOrder = 65
        tags = @("ice-cream")
        variants = @(
            @{ name = "2 scoops"; priceModifier = 0; isAvailable = $true },
            @{ name = "3 scoops"; priceModifier = 150; isAvailable = $true }
        )
    },
    @{
        name = "Brownie & Ice Cream"
        description = "Warm dark chocolate brownie, sea salt, two scoops vanilla gelato"
        cuisine = "DESSERTS"; category = "COOKIES_BROWNIES"
        basePrice = 790; preparationTime = 8; spiceLevel = "NONE"
        dietaryInfo = @("VEGETARIAN"); isAvailable = $true
        storeId = "DOM001"; displayOrder = 66
        tags = @("chocolate", "popular", "sharing")
    },

    # ── CONTINENTAL MAINS ────────────────────────────────────────────────────────
    @{
        name = "Grilled Salmon"
        description = "Atlantic salmon fillet, lemon beurre blanc, seasonal vegetables, baby potatoes"
        cuisine = "CONTINENTAL"; category = "NORTH_INDIAN_MEALS"
        basePrice = 2190; preparationTime = 20; spiceLevel = "NONE"
        dietaryInfo = @("NON_VEGETARIAN"); isAvailable = $true; isRecommended = $true
        storeId = "DOM001"; displayOrder = 70
        tags = @("fish", "premium", "chef-special")
    },
    @{
        name = "Chicken Schnitzel"
        description = "Breaded chicken breast, potato salad, cucumber relish, lemon"
        cuisine = "CONTINENTAL"; category = "NORTH_INDIAN_MEALS"
        basePrice = 1690; preparationTime = 18; spiceLevel = "NONE"
        dietaryInfo = @("NON_VEGETARIAN"); isAvailable = $true; isRecommended = $true
        storeId = "DOM001"; displayOrder = 71
        tags = @("german", "popular", "classic")
    },
    @{
        name = "Mushroom Risotto"
        description = "Carnaroli rice, mixed wild mushrooms, white wine, Parmigiano, truffle oil"
        cuisine = "CONTINENTAL"; category = "NORTH_INDIAN_MEALS"
        basePrice = 1490; preparationTime = 22; spiceLevel = "NONE"
        dietaryInfo = @("VEGETARIAN"); isAvailable = $true
        storeId = "DOM001"; displayOrder = 72
        tags = @("vegetarian", "risotto", "premium")
    },
    @{
        name = "Beef Goulash"
        description = "Slow-braised Hungarian beef, paprika gravy, Spätzle egg noodles, sour cream"
        cuisine = "CONTINENTAL"; category = "NORTH_INDIAN_MEALS"
        basePrice = 1890; preparationTime = 15; spiceLevel = "MILD"
        dietaryInfo = @("NON_VEGETARIAN"); isAvailable = $true
        storeId = "DOM001"; displayOrder = 73
        tags = @("german", "hearty", "traditional")
    }
)

# Bulk create all items
Write-Host "Sending $($menuItems.Count) menu items via bulk endpoint..." -ForegroundColor Cyan
Write-Host ""

$result = Invoke-Api -Method POST -Path "/api/menu/bulk" -Body $menuItems -Token $token

$createdIds = @()
if ($result -is [System.Collections.IEnumerable] -and -not ($result -is [string])) {
    $createdIds = @($result | ForEach-Object { $_.id } | Where-Object { $_ })
    Write-Host "Created $($createdIds.Count) items via bulk." -ForegroundColor Green
} elseif ($result.id) {
    $createdIds = @($result.id)
    Write-Host "Created 1 item (bulk returned single)." -ForegroundColor Yellow
} else {
    # Bulk might not exist — fall back to individual POSTs
    Write-Host "Bulk endpoint did not return items. Falling back to individual POSTs..." -ForegroundColor Yellow
    foreach ($item in $menuItems) {
        Write-Host "  $($item.name)..." -NoNewline
        try {
            $r = Invoke-Api -Method POST -Path "/api/menu" -Body $item -Token $token
            $createdIds += $r.id
            Write-Host " OK ($($r.id))" -ForegroundColor Green
        } catch {
            Write-Host " FAILED" -ForegroundColor Red
        }
    }
}

# Fetch all menu item IDs from DB (more reliable than trusting bulk response)
Write-Host ""
Write-Host "Fetching all menu item IDs for DOM001..." -NoNewline
$allItems = Invoke-Api -Method GET -Path "/api/menu?storeId=DOM001" -Token $token
if ($allItems -is [System.Collections.IEnumerable]) {
    $allItemIds = $allItems | ForEach-Object { $_.id } | Where-Object { $_ }
} else {
    $allItemIds = $createdIds
}
Write-Host " $($allItemIds.Count) items found" -ForegroundColor Green

# Save to state
$state | Add-Member -NotePropertyName "menuItemIds" -NotePropertyValue $allItemIds -Force
$state | ConvertTo-Json -Depth 5 | Set-Content ".\demo-state.json"

Write-Host ""
Write-Host "Menu seeded: $($allItemIds.Count) items." -ForegroundColor Green
Write-Host "Run 6-declare-allergens.ps1 next." -ForegroundColor Cyan
