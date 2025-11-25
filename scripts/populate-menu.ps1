# PowerShell script to populate menu with sample items
# Run this after starting menu-service

$baseUrl = "http://localhost:8082/api/menu/items"

# Sample menu items based on multi-cuisine restaurant
$menuItems = @(
    # South Indian - Dosas
    @{
        name = "Masala Dosa"
        description = "Crispy rice crepe filled with spiced potato masala"
        cuisine = "SOUTH_INDIAN"
        category = "DOSA"
        basePrice = 12000  # Rs 120 in paise
        preparationTime = 15
        spiceLevel = "MILD"
        dietaryInfo = @("VEGETARIAN")
        isAvailable = $true
        isRecommended = $true
        servingSize = "1 piece"
        ingredients = @("Rice", "Urad Dal", "Potato", "Onion", "Spices")
    },
    @{
        name = "Plain Dosa"
        description = "Classic crispy rice crepe"
        cuisine = "SOUTH_INDIAN"
        category = "DOSA"
        basePrice = 8000  # Rs 80
        preparationTime = 12
        spiceLevel = "NONE"
        dietaryInfo = @("VEGETARIAN", "VEGAN")
        isAvailable = $true
        servingSize = "1 piece"
    },
    @{
        name = "Mysore Masala Dosa"
        description = "Dosa with spicy red chutney and potato filling"
        cuisine = "SOUTH_INDIAN"
        category = "DOSA"
        basePrice = 14000  # Rs 140
        preparationTime = 15
        spiceLevel = "HOT"
        dietaryInfo = @("VEGETARIAN")
        isAvailable = $true
        servingSize = "1 piece"
    },
    @{
        name = "Cheese Dosa"
        description = "Crispy dosa loaded with melted cheese"
        cuisine = "SOUTH_INDIAN"
        category = "DOSA"
        basePrice = 15000  # Rs 150
        preparationTime = 15
        spiceLevel = "MILD"
        dietaryInfo = @("VEGETARIAN")
        isAvailable = $true
        servingSize = "1 piece"
    },

    # South Indian - Idly & Vada
    @{
        name = "Idly (3 pcs)"
        description = "Steamed rice cakes served with chutney and sambar"
        cuisine = "SOUTH_INDIAN"
        category = "IDLY_VADA"
        basePrice = 6000  # Rs 60
        preparationTime = 10
        spiceLevel = "NONE"
        dietaryInfo = @("VEGETARIAN", "VEGAN")
        isAvailable = $true
        isRecommended = $true
        servingSize = "3 pieces"
    },
    @{
        name = "Medu Vada (2 pcs)"
        description = "Crispy lentil donuts served with chutney and sambar"
        cuisine = "SOUTH_INDIAN"
        category = "IDLY_VADA"
        basePrice = 7000  # Rs 70
        preparationTime = 12
        spiceLevel = "MILD"
        dietaryInfo = @("VEGETARIAN", "VEGAN")
        isAvailable = $true
        servingSize = "2 pieces"
    },

    # North Indian - Curries
    @{
        name = "Paneer Butter Masala"
        description = "Cottage cheese cubes in rich tomato cream gravy"
        cuisine = "NORTH_INDIAN"
        category = "CURRY_GRAVY"
        basePrice = 22000  # Rs 220
        preparationTime = 20
        spiceLevel = "MEDIUM"
        dietaryInfo = @("VEGETARIAN")
        isAvailable = $true
        isRecommended = $true
        servingSize = "1 bowl"
    },
    @{
        name = "Chicken Tikka Masala"
        description = "Grilled chicken in spiced tomato cream sauce"
        cuisine = "NORTH_INDIAN"
        category = "CURRY_GRAVY"
        basePrice = 28000  # Rs 280
        preparationTime = 25
        spiceLevel = "MEDIUM"
        dietaryInfo = @("NON_VEGETARIAN", "HALAL")
        isAvailable = $true
        isRecommended = $true
        servingSize = "1 bowl"
    },
    @{
        name = "Dal Tadka"
        description = "Yellow lentils tempered with spices"
        cuisine = "NORTH_INDIAN"
        category = "DAL_DISHES"
        basePrice = 16000  # Rs 160
        preparationTime = 15
        spiceLevel = "MILD"
        dietaryInfo = @("VEGETARIAN", "VEGAN")
        isAvailable = $true
        servingSize = "1 bowl"
    },

    # Indo-Chinese
    @{
        name = "Veg Fried Rice"
        description = "Stir-fried rice with mixed vegetables"
        cuisine = "INDO_CHINESE"
        category = "FRIED_RICE"
        basePrice = 18000  # Rs 180
        preparationTime = 18
        spiceLevel = "MILD"
        dietaryInfo = @("VEGETARIAN")
        isAvailable = $true
        servingSize = "1 plate"
    },
    @{
        name = "Chicken Fried Rice"
        description = "Stir-fried rice with chicken and vegetables"
        cuisine = "INDO_CHINESE"
        category = "FRIED_RICE"
        basePrice = 22000  # Rs 220
        preparationTime = 20
        spiceLevel = "MILD"
        dietaryInfo = @("NON_VEGETARIAN")
        isAvailable = $true
        isRecommended = $true
        servingSize = "1 plate"
    },
    @{
        name = "Hakka Noodles"
        description = "Stir-fried noodles with vegetables"
        cuisine = "INDO_CHINESE"
        category = "NOODLES"
        basePrice = 18000  # Rs 180
        preparationTime = 18
        spiceLevel = "MEDIUM"
        dietaryInfo = @("VEGETARIAN")
        isAvailable = $true
        servingSize = "1 plate"
    },
    @{
        name = "Gobi Manchurian"
        description = "Crispy cauliflower in spicy Indo-Chinese sauce"
        cuisine = "INDO_CHINESE"
        category = "MANCHURIAN"
        basePrice = 20000  # Rs 200
        preparationTime = 20
        spiceLevel = "MEDIUM"
        dietaryInfo = @("VEGETARIAN")
        isAvailable = $true
        isRecommended = $true
        servingSize = "1 bowl"
    },

    # Pizzas
    @{
        name = "Margherita Pizza"
        description = "Classic pizza with tomato sauce, mozzarella, and basil"
        cuisine = "ITALIAN"
        category = "PIZZA"
        basePrice = 25000  # Rs 250
        preparationTime = 25
        spiceLevel = "NONE"
        dietaryInfo = @("VEGETARIAN")
        isAvailable = $true
        isRecommended = $true
        servingSize = "9 inch"
        variants = @(
            @{ name = "Regular (9 inch)"; priceModifier = 0 },
            @{ name = "Medium (11 inch)"; priceModifier = 10000 },
            @{ name = "Large (13 inch)"; priceModifier = 15000 }
        )
    },
    @{
        name = "Pepperoni Pizza"
        description = "Loaded with pepperoni slices and mozzarella"
        cuisine = "ITALIAN"
        category = "PIZZA"
        basePrice = 32000  # Rs 320
        preparationTime = 25
        spiceLevel = "MILD"
        dietaryInfo = @("NON_VEGETARIAN")
        isAvailable = $true
        isRecommended = $true
        servingSize = "9 inch"
        variants = @(
            @{ name = "Regular (9 inch)"; priceModifier = 0 },
            @{ name = "Medium (11 inch)"; priceModifier = 10000 },
            @{ name = "Large (13 inch)"; priceModifier = 15000 }
        )
    },
    @{
        name = "Veggie Supreme Pizza"
        description = "Loaded with bell peppers, onions, mushrooms, olives"
        cuisine = "ITALIAN"
        category = "PIZZA"
        basePrice = 28000  # Rs 280
        preparationTime = 25
        spiceLevel = "MILD"
        dietaryInfo = @("VEGETARIAN")
        isAvailable = $true
        servingSize = "9 inch"
        variants = @(
            @{ name = "Regular (9 inch)"; priceModifier = 0 },
            @{ name = "Medium (11 inch)"; priceModifier = 10000 },
            @{ name = "Large (13 inch)"; priceModifier = 15000 }
        )
    },

    # Burgers
    @{
        name = "Classic Veg Burger"
        description = "Crispy veggie patty with lettuce, tomato, and mayo"
        cuisine = "AMERICAN"
        category = "BURGER"
        basePrice = 15000  # Rs 150
        preparationTime = 15
        spiceLevel = "MILD"
        dietaryInfo = @("VEGETARIAN")
        isAvailable = $true
        servingSize = "1 burger"
    },
    @{
        name = "Chicken Burger"
        description = "Grilled chicken patty with cheese and special sauce"
        cuisine = "AMERICAN"
        category = "BURGER"
        basePrice = 18000  # Rs 180
        preparationTime = 18
        spiceLevel = "MILD"
        dietaryInfo = @("NON_VEGETARIAN")
        isAvailable = $true
        isRecommended = $true
        servingSize = "1 burger"
    },
    @{
        name = "Paneer Tikka Burger"
        description = "Spiced paneer patty with mint chutney"
        cuisine = "AMERICAN"
        category = "BURGER"
        basePrice = 17000  # Rs 170
        preparationTime = 18
        spiceLevel = "MEDIUM"
        dietaryInfo = @("VEGETARIAN")
        isAvailable = $true
        servingSize = "1 burger"
    },

    # Beverages
    @{
        name = "Masala Chai"
        description = "Traditional Indian spiced tea"
        cuisine = "BEVERAGES"
        category = "TEA_CHAI"
        basePrice = 3000  # Rs 30
        preparationTime = 5
        spiceLevel = "MILD"
        dietaryInfo = @("VEGETARIAN")
        isAvailable = $true
        servingSize = "1 cup"
    },
    @{
        name = "Filter Coffee"
        description = "South Indian style filter coffee"
        cuisine = "BEVERAGES"
        category = "HOT_DRINKS"
        basePrice = 4000  # Rs 40
        preparationTime = 5
        spiceLevel = "NONE"
        dietaryInfo = @("VEGETARIAN")
        isAvailable = $true
        isRecommended = $true
        servingSize = "1 cup"
    },
    @{
        name = "Mango Lassi"
        description = "Sweet mango yogurt drink"
        cuisine = "BEVERAGES"
        category = "COLD_DRINKS"
        basePrice = 8000  # Rs 80
        preparationTime = 5
        spiceLevel = "NONE"
        dietaryInfo = @("VEGETARIAN")
        isAvailable = $true
        isRecommended = $true
        servingSize = "1 glass"
    },
    @{
        name = "Fresh Lime Soda"
        description = "Refreshing lime and soda water"
        cuisine = "BEVERAGES"
        category = "COLD_DRINKS"
        basePrice = 5000  # Rs 50
        preparationTime = 5
        spiceLevel = "NONE"
        dietaryInfo = @("VEGETARIAN", "VEGAN")
        isAvailable = $true
        servingSize = "1 glass"
    },

    # Desserts - Ice Cream
    @{
        name = "Chocolate Fudge Brownie (Ben & Jerry's)"
        description = "Chocolate ice cream with fudge brownies"
        cuisine = "DESSERTS"
        category = "ICE_CREAM"
        basePrice = 35000  # Rs 350
        preparationTime = 2
        spiceLevel = "NONE"
        dietaryInfo = @("VEGETARIAN")
        isAvailable = $true
        isRecommended = $true
        servingSize = "1 scoop"
        tags = @("Ben & Jerry's", "Premium")
    },
    @{
        name = "Cookie Dough (Ben & Jerry's)"
        description = "Vanilla ice cream with chunks of chocolate chip cookie dough"
        cuisine = "DESSERTS"
        category = "ICE_CREAM"
        basePrice = 35000  # Rs 350
        preparationTime = 2
        spiceLevel = "NONE"
        dietaryInfo = @("VEGETARIAN", "CONTAINS_EGGS")
        isAvailable = $true
        isRecommended = $true
        servingSize = "1 scoop"
        tags = @("Ben & Jerry's", "Premium")
    },
    @{
        name = "Phish Food (Ben & Jerry's)"
        description = "Chocolate ice cream with marshmallow and caramel swirls"
        cuisine = "DESSERTS"
        category = "ICE_CREAM"
        basePrice = 35000  # Rs 350
        preparationTime = 2
        spiceLevel = "NONE"
        dietaryInfo = @("VEGETARIAN")
        isAvailable = $true
        servingSize = "1 scoop"
        tags = @("Ben & Jerry's", "Premium")
    },
    @{
        name = "Vanilla (Classic)"
        description = "Classic vanilla ice cream"
        cuisine = "DESSERTS"
        category = "ICE_CREAM"
        basePrice = 8000  # Rs 80
        preparationTime = 2
        spiceLevel = "NONE"
        dietaryInfo = @("VEGETARIAN")
        isAvailable = $true
        servingSize = "1 scoop"
    },

    # Cookies & Brownies
    @{
        name = "Chocolate Chip Cookies (3 pcs)"
        description = "Freshly baked chocolate chip cookies"
        cuisine = "DESSERTS"
        category = "COOKIES_BROWNIES"
        basePrice = 12000  # Rs 120
        preparationTime = 15
        spiceLevel = "NONE"
        dietaryInfo = @("VEGETARIAN", "CONTAINS_EGGS")
        isAvailable = $true
        servingSize = "3 pieces"
    },
    @{
        name = "Fudge Brownie"
        description = "Rich chocolate brownie with walnuts"
        cuisine = "DESSERTS"
        category = "COOKIES_BROWNIES"
        basePrice = 10000  # Rs 100
        preparationTime = 12
        spiceLevel = "NONE"
        dietaryInfo = @("VEGETARIAN", "CONTAINS_EGGS")
        isAvailable = $true
        isRecommended = $true
        servingSize = "1 piece"
    }
)

Write-Host "Starting menu population..." -ForegroundColor Cyan
Write-Host "Total items to create: $($menuItems.Count)" -ForegroundColor Yellow
Write-Host ""

$successCount = 0
$failCount = 0

foreach ($item in $menuItems) {
    try {
        $json = $item | ConvertTo-Json -Depth 10
        $response = Invoke-RestMethod -Uri $baseUrl -Method Post -Body $json -ContentType "application/json" -ErrorAction Stop

        Write-Host "[SUCCESS] Created: $($item.name)" -ForegroundColor Green
        $successCount++
    }
    catch {
        Write-Host "[FAILED] $($item.name) - Error: $($_.Exception.Message)" -ForegroundColor Red
        $failCount++
    }
}

Write-Host ""
Write-Host "=== Menu Population Complete ===" -ForegroundColor Cyan
Write-Host "Successfully created: $successCount items" -ForegroundColor Green
Write-Host "Failed: $failCount items" -ForegroundColor Red
Write-Host ""
Write-Host "You can now view the menu at: http://localhost:3000/menu" -ForegroundColor Yellow
