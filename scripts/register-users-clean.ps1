$baseUrl = "http://localhost:8081/api/users"

Write-Host "========================================"
Write-Host "  MaSoVa Demo Users Registration"
Write-Host "  (Permanent MongoDB Storage)"
Write-Host "========================================"
Write-Host ""

$users = @(
    @{type = "DRIVER"; name = "Rajesh Kumar"; email = "rajesh.driver@masova.com"; phone = "9876543210"; password = "driver123"; storeId = "store001"},
    @{type = "DRIVER"; name = "Amit Singh"; email = "amit.driver@masova.com"; phone = "9876543211"; password = "driver123"; storeId = "store001"},
    @{type = "CUSTOMER"; name = "Priya Sharma"; email = "priya.customer@masova.com"; phone = "9876543220"; password = "customer123"},
    @{type = "CUSTOMER"; name = "Vikram Patel"; email = "vikram.customer@masova.com"; phone = "9876543221"; password = "customer123"},
    @{type = "MANAGER"; name = "Suresh Reddy"; email = "suresh.manager@masova.com"; phone = "9876543230"; password = "manager123"; storeId = "store001"},
    @{type = "MANAGER"; name = "Anjali Desai"; email = "anjali.manager@masova.com"; phone = "9876543231"; password = "manager123"; storeId = "store001"},
    @{type = "STAFF"; name = "Rahul Verma"; email = "rahul.staff@masova.com"; phone = "9876543240"; password = "staff123"; storeId = "store001"},
    @{type = "STAFF"; name = "Neha Gupta"; email = "neha.staff@masova.com"; phone = "9876543241"; password = "staff123"; storeId = "store001"}
)

foreach ($user in $users) {
    Write-Host "Creating $($user.type): $($user.name) ..." -NoNewline
    try {
        $body = $user | ConvertTo-Json
        Invoke-RestMethod -Uri "$baseUrl/register" -Method POST -Body $body -ContentType "application/json" | Out-Null
        Write-Host " SUCCESS" -ForegroundColor Green
    }
    catch {
        if ($_.Exception.Response.StatusCode.value__ -eq 400) {
            Write-Host " ALREADY EXISTS" -ForegroundColor Yellow
        }
        else {
            Write-Host " FAILED" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "========================================"
Write-Host "DRIVERS:"
Write-Host "  rajesh.driver@masova.com / driver123"
Write-Host "  amit.driver@masova.com / driver123"
Write-Host "CUSTOMERS:"
Write-Host "  priya.customer@masova.com / customer123"
Write-Host "  vikram.customer@masova.com / customer123"
Write-Host "MANAGERS:"
Write-Host "  suresh.manager@masova.com / manager123"
Write-Host "  anjali.manager@masova.com / manager123"
Write-Host "STAFF:"
Write-Host "  rahul.staff@masova.com / staff123"
Write-Host "  neha.staff@masova.com / staff123"
Write-Host ""
Write-Host "Users stored permanently in MongoDB!" -ForegroundColor Green
