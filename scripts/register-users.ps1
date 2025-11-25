# Create demo users
$url = "http://localhost:8081/api/users/register"

# Manager
$manager = @{
    type = "MANAGER"
    name = "Store Manager"
    email = "manager@masova.com"
    phone = "9876543210"
    password = "manager123"
    storeId = "store-001"
} | ConvertTo-Json

Write-Host "Creating Manager..."
try {
    Invoke-RestMethod -Uri $url -Method POST -Body $manager -ContentType "application/json"
    Write-Host "Manager created successfully" -ForegroundColor Green
} catch {
    Write-Host "Manager: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Staff
$staff = @{
    type = "STAFF"
    name = "Kitchen Staff"
    email = "staff@masova.com"
    phone = "9876543211"
    password = "staff123"
    storeId = "store-001"
} | ConvertTo-Json

Write-Host "Creating Staff..."
try {
    Invoke-RestMethod -Uri $url -Method POST -Body $staff -ContentType "application/json"
    Write-Host "Staff created successfully" -ForegroundColor Green
} catch {
    Write-Host "Staff: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Customer
$customer = @{
    type = "CUSTOMER"
    name = "Test Customer"
    email = "test@example.com"
    phone = "9876543212"
    password = "password123"
} | ConvertTo-Json

Write-Host "Creating Customer..."
try {
    Invoke-RestMethod -Uri $url -Method POST -Body $customer -ContentType "application/json"
    Write-Host "Customer created successfully" -ForegroundColor Green
} catch {
    Write-Host "Customer: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Driver
$driver = @{
    type = "DRIVER"
    name = "Delivery Driver"
    email = "driver@masova.com"
    phone = "9876543213"
    password = "driver123"
    storeId = "store-001"
} | ConvertTo-Json

Write-Host "Creating Driver..."
try {
    Invoke-RestMethod -Uri $url -Method POST -Body $driver -ContentType "application/json"
    Write-Host "Driver created successfully" -ForegroundColor Green
} catch {
    Write-Host "Driver: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "`nDemo users setup complete!" -ForegroundColor Cyan
