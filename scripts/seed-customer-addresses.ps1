# MaSoVa - Seed Customer Addresses Script
# Adds saved addresses to demo customer profiles
# Run this after creating demo users

$customerServiceUrl = "http://localhost:8085/api/customers"
$userServiceUrl = "http://localhost:8081/api/users"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  MaSoVa Customer Address Seeding" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Get Priya's user ID from user-service
Write-Host "Finding Priya's user account..." -NoNewline
try {
    $priyaUser = Invoke-RestMethod -Uri "$userServiceUrl/email/priya.customer@masova.com" -Method GET
    $priyaUserId = $priyaUser.id
    Write-Host " Found! ID: $priyaUserId" -ForegroundColor Green
}
catch {
    Write-Host " NOT FOUND" -ForegroundColor Red
    Write-Host "Please run create-demo-users.ps1 first!" -ForegroundColor Yellow
    exit 1
}

# Step 2: Check if customer profile exists, if not create it
Write-Host "Checking customer profile..." -NoNewline
try {
    $customer = Invoke-RestMethod -Uri "$customerServiceUrl/user/$priyaUserId" -Method GET
    $customerId = $customer.id
    Write-Host " Found! Customer ID: $customerId" -ForegroundColor Green
}
catch {
    Write-Host " Not found, creating..." -ForegroundColor Yellow

    # Create customer profile
    $customerData = @{
        userId = $priyaUserId
        name = "Priya Sharma"
        email = "priya.customer@masova.com"
        phone = "9876543220"
    } | ConvertTo-Json

    try {
        $customer = Invoke-RestMethod -Uri "$customerServiceUrl" -Method POST -Body $customerData -ContentType "application/json"
        $customerId = $customer.id
        Write-Host "  Created! Customer ID: $customerId" -ForegroundColor Green
    }
    catch {
        Write-Host "  Failed to create customer profile!" -ForegroundColor Red
        Write-Host $_.Exception.Message
        exit 1
    }
}

# Step 3: Add addresses
Write-Host ""
Write-Host "Adding saved addresses..." -ForegroundColor Cyan

# Address 1: HOME
$homeAddress = @{
    label = "HOME"
    addressLine1 = "Flat 302, Sunshine Apartments"
    addressLine2 = "Madhapur"
    city = "Hyderabad"
    state = "Telangana"
    postalCode = "500081"
    country = "India"
    landmark = "Near Inorbit Mall"
    isDefault = $true
} | ConvertTo-Json

Write-Host "  Adding HOME address..." -NoNewline
try {
    $response = Invoke-RestMethod -Uri "$customerServiceUrl/$customerId/addresses" -Method POST -Body $homeAddress -ContentType "application/json"
    Write-Host " SUCCESS" -ForegroundColor Green
}
catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 400) {
        Write-Host " ALREADY EXISTS" -ForegroundColor Yellow
    } else {
        Write-Host " FAILED - $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Address 2: WORK
$workAddress = @{
    label = "WORK"
    addressLine1 = "Tech Park, Building B"
    addressLine2 = "HITEC City"
    city = "Hyderabad"
    state = "Telangana"
    postalCode = "500032"
    country = "India"
    landmark = "Opposite Cyber Towers"
    isDefault = $false
} | ConvertTo-Json

Write-Host "  Adding WORK address..." -NoNewline
try {
    $response = Invoke-RestMethod -Uri "$customerServiceUrl/$customerId/addresses" -Method POST -Body $workAddress -ContentType "application/json"
    Write-Host " SUCCESS" -ForegroundColor Green
}
catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 400) {
        Write-Host " ALREADY EXISTS" -ForegroundColor Yellow
    } else {
        Write-Host " FAILED - $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Step 4: Verify
Write-Host ""
Write-Host "Verifying addresses..." -NoNewline
try {
    $updatedCustomer = Invoke-RestMethod -Uri "$customerServiceUrl/user/$priyaUserId" -Method GET
    $addressCount = $updatedCustomer.addresses.Count
    Write-Host " $addressCount addresses found!" -ForegroundColor Green

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  Priya's Saved Addresses:" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan

    foreach ($addr in $updatedCustomer.addresses) {
        $defaultLabel = if ($addr.isDefault) { " (DEFAULT)" } else { "" }
        Write-Host ""
        Write-Host "  $($addr.label)$defaultLabel" -ForegroundColor Yellow
        Write-Host "  $($addr.addressLine1)"
        if ($addr.addressLine2) {
            Write-Host "  $($addr.addressLine2)"
        }
        Write-Host "  $($addr.city), $($addr.state) - $($addr.postalCode)"
        if ($addr.landmark) {
            Write-Host "  Landmark: $($addr.landmark)" -ForegroundColor Gray
        }
    }
}
catch {
    Write-Host " FAILED" -ForegroundColor Red
}

Write-Host ""
Write-Host "Done! Priya can now use saved addresses during checkout." -ForegroundColor Green
