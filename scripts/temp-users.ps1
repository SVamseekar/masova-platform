# MaSoVa Demo Users Creation Script
# Creates 2 users for each role: DRIVER, CUSTOMER, MANAGER, STAFF
# These users will be permanently stored in MongoDB database
# Run this after starting the backend services

$baseUrl = "http://localhost:8081/api/users"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  MaSoVa Demo Users Registration" -ForegroundColor Cyan
Write-Host "  (Permanent MongoDB Storage)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Demo Users - 2 of each type
$users = @(
    # DRIVERS
    @{
        type = "DRIVER"
        name = "Rajesh Kumar"
        email = "rajesh.driver@masova.com"
        phone = "9876543210"
        password = "driver123"
        storeId = "store001"
    },
    @{
        type = "DRIVER"
        name = "Amit Singh"
        email = "amit.driver@masova.com"
        phone = "9876543211"
        password = "driver123"
        storeId = "store001"
    },
    # CUSTOMERS
    @{
        type = "CUSTOMER"
        name = "Priya Sharma"
        email = "priya.customer@masova.com"
        phone = "9876543220"
        password = "customer123"
    },
    @{
        type = "CUSTOMER"
        name = "Vikram Patel"
        email = "vikram.customer@masova.com"
        phone = "9876543221"
        password = "customer123"
    },
    # MANAGERS
    @{
        type = "MANAGER"
        name = "Suresh Reddy"
        email = "suresh.manager@masova.com"
        phone = "9876543230"
        password = "manager123"
        storeId = "store001"
    },
    @{
        type = "MANAGER"
        name = "Anjali Desai"
        email = "anjali.manager@masova.com"
        phone = "9876543231"
        password = "manager123"
        storeId = "store001"
    },
    # STAFF
    @{
        type = "STAFF"
        name = "Rahul Verma"
        email = "rahul.staff@masova.com"
        phone = "9876543240"
        password = "staff123"
        storeId = "store001"
    },
    @{
        type = "STAFF"
        name = "Neha Gupta"
        email = "neha.staff@masova.com"
        phone = "9876543241"
        password = "staff123"
        storeId = "store001"
    }
)

foreach ($user in $users) {
    Write-Host "Creating $($user.type): $($user.name) ($($user.email))..." -NoNewline

    try {
        $body = $user | ConvertTo-Json
        $response = Invoke-RestMethod -Uri "$baseUrl/register" -Method POST -Body $body -ContentType "application/json"

        Write-Host " âœ“ SUCCESS" -ForegroundColor Green
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__

        if ($statusCode -eq 400) {
            Write-Host " âœ— ALREADY EXISTS" -ForegroundColor Yellow
        }
        else {
            Write-Host " âœ— FAILED" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  User Creation Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "ðŸ“Œ PERMANENT DEMO USER CREDENTIALS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "DRIVERS:" -ForegroundColor Cyan
Write-Host "  1. Email: rajesh.driver@masova.com   | Password: driver123"
Write-Host "  2. Email: amit.driver@masova.com     | Password: driver123"
Write-Host ""
Write-Host "CUSTOMERS:" -ForegroundColor Cyan
Write-Host "  1. Email: priya.customer@masova.com  | Password: customer123"
Write-Host "  2. Email: vikram.customer@masova.com | Password: customer123"
Write-Host ""
Write-Host "MANAGERS:" -ForegroundColor Cyan
Write-Host "  1. Email: suresh.manager@masova.com  | Password: manager123"
Write-Host "  2. Email: anjali.manager@masova.com  | Password: manager123"
Write-Host ""
Write-Host "STAFF:" -ForegroundColor Cyan
Write-Host "  1. Email: rahul.staff@masova.com     | Password: staff123"
Write-Host "  2. Email: neha.staff@masova.com      | Password: staff123"
Write-Host ""
Write-Host "âœ… These users are now permanently stored in MongoDB!" -ForegroundColor Green
Write-Host "You can login with these accounts anytime." -ForegroundColor Green
