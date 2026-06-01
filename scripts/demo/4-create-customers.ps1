# MaSoVa Demo — Step 4: Create Customer Accounts
# Creates 5 German customers with saved addresses.
# Customer registration is public (no token needed for POST /api/auth/register).
# Customer profile (POST /api/customers) is called after registration to add addresses.

$ErrorActionPreference = "Stop"
$BASE = "http://localhost:8080"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  MaSoVa Demo — Step 4: Create Customers" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path ".\demo-state.json")) {
    Write-Host "ERROR: demo-state.json not found. Run prior steps first." -ForegroundColor Red
    exit 1
}
$state = Get-Content ".\demo-state.json" | ConvertFrom-Json
$managerToken = $state.managerToken

function Invoke-Api {
    param([string]$Method, [string]$Path, [hashtable]$Body = $null, [string]$Token = $null)
    $headers = @{ "Content-Type" = "application/json" }
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

$customers = @(
    @{
        name     = "Anna Müller"
        email    = "anna.mueller@gmail.com"
        phone    = "4917612345601"
        password = "Demo@1234"
        dob      = "1990-03-14"
        gender   = "FEMALE"
        homeAddress = @{
            street   = "Alexanderplatz 5"
            city     = "Berlin"
            state    = "Berlin"
            pincode  = "10178"
            latitude  = 52.5219
            longitude = 13.4132
            landmark = "Near TV Tower"
        }
        workAddress = @{
            street   = "Potsdamer Platz 1"
            city     = "Berlin"
            state    = "Berlin"
            pincode  = "10785"
            latitude  = 52.5096
            longitude = 13.3761
            landmark = "Sony Center"
        }
    },
    @{
        name     = "Felix Schmidt"
        email    = "felix.schmidt@gmail.com"
        phone    = "4917612345602"
        password = "Demo@1234"
        dob      = "1988-07-22"
        gender   = "MALE"
        homeAddress = @{
            street   = "Prenzlauer Allee 44"
            city     = "Berlin"
            state    = "Berlin"
            pincode  = "10405"
            latitude  = 52.5340
            longitude = 13.4224
            landmark = "Prenzlauer Berg"
        }
        workAddress = $null
    },
    @{
        name     = "Lena Wagner"
        email    = "lena.wagner@gmail.com"
        phone    = "4917612345603"
        password = "Demo@1234"
        dob      = "1995-11-05"
        gender   = "FEMALE"
        homeAddress = @{
            street   = "Friedrichstrasse 100"
            city     = "Berlin"
            state    = "Berlin"
            pincode  = "10117"
            latitude  = 52.5170
            longitude = 13.3886
            landmark = "Near Checkpoint Charlie"
        }
        workAddress = $null
    },
    @{
        name     = "Thomas Braun"
        email    = "thomas.braun@gmail.com"
        phone    = "4917612345604"
        password = "Demo@1234"
        dob      = "1982-02-28"
        gender   = "MALE"
        homeAddress = @{
            street   = "Kurfürstendamm 55"
            city     = "Berlin"
            state    = "Berlin"
            pincode  = "10707"
            latitude  = 52.5027
            longitude = 13.3290
            landmark = "Kudamm Shopping Mile"
        }
        workAddress = $null
    },
    @{
        name     = "Sophie Richter"
        email    = "sophie.richter@gmail.com"
        phone    = "4917612345605"
        password = "Demo@1234"
        dob      = "1998-09-17"
        gender   = "FEMALE"
        homeAddress = @{
            street   = "Bergmannstrasse 12"
            city     = "Berlin"
            state    = "Berlin"
            pincode  = "10961"
            latitude  = 52.4894
            longitude = 13.3889
            landmark = "Kreuzberg"
        }
        workAddress = $null
    }
)

$customerIds = @{}
$isFirst = $true

foreach ($c in $customers) {
    # Wait between customers to avoid gateway rate limit (5 req/min per IP)
    if (-not $isFirst) {
        Write-Host "  Waiting 65s for rate limit reset..." -ForegroundColor Gray
        Start-Sleep -Seconds 65
    }
    $isFirst = $false

    Write-Host "  Registering $($c.name)..." -NoNewline

    # Register user account
    try {
        $reg = Invoke-Api -Method POST -Path "/api/auth/register" -Body @{
            type     = "CUSTOMER"
            name     = $c.name
            email    = $c.email
            phone    = $c.phone
            password = $c.password
        }
        $userId = $reg.user.id ?? $reg.id
        Write-Host " registered (userId: $userId)" -ForegroundColor Green
    } catch {
        Write-Host " already exists, looking up via manager..." -ForegroundColor Yellow
        try {
            $found = Invoke-Api -Method GET -Path "/api/customers?email=$([Uri]::EscapeDataString($c.email))" -Token $managerToken
            $userId = $found[0].userId ?? $found.userId
            Write-Host "  userId: $userId" -ForegroundColor Yellow
        } catch {
            Write-Host "  could not look up userId" -ForegroundColor Red
            $userId = $null
        }
    }

    # Create customer profile using manager token (POST /api/customers requires MANAGER role)
    Write-Host "    Creating customer profile..." -NoNewline
    try {
        $profile = Invoke-Api -Method POST -Path "/api/customers" -Body @{
            userId        = $userId
            name          = $c.name
            email         = $c.email
            phone         = $c.phone
            storeId       = "DOM001"
            dateOfBirth   = $c.dob
            gender        = $c.gender
            marketingOptIn = $true
        } -Token $managerToken
        $customerId = $profile.id
        Write-Host " OK (customerId: $customerId)" -ForegroundColor Green
    } catch {
        Write-Host " profile might exist, fetching..." -ForegroundColor Yellow
        try {
            $profile = Invoke-Api -Method GET -Path "/api/customers?userId=$userId" -Token $managerToken
            $customerId = $profile[0].id ?? $profile.id
            Write-Host "  customerId: $customerId" -ForegroundColor Yellow
        } catch {
            $customerId = $null
            Write-Host "  could not get customerId" -ForegroundColor Red
        }
    }

    $customerIds[$c.email] = $customerId

    # Add home address (manager token — address endpoint requires auth)
    if ($customerId -and $c.homeAddress) {
        Write-Host "    Adding HOME address..." -NoNewline
        try {
            Invoke-Api -Method POST -Path "/api/customers/$customerId/addresses" -Body @{
                label        = "HOME"
                addressLine1 = $c.homeAddress.street
                city         = $c.homeAddress.city
                state        = $c.homeAddress.state
                postalCode   = $c.homeAddress.pincode
                country      = "Germany"
                latitude     = $c.homeAddress.latitude
                longitude    = $c.homeAddress.longitude
                landmark     = $c.homeAddress.landmark
                default      = $true
            } -Token $managerToken | Out-Null
            Write-Host " OK" -ForegroundColor Green
        } catch { Write-Host " skipped (may exist)" -ForegroundColor Yellow }
    }

    # Add work address if present
    if ($customerId -and $c.workAddress) {
        Write-Host "    Adding WORK address..." -NoNewline
        try {
            Invoke-Api -Method POST -Path "/api/customers/$customerId/addresses" -Body @{
                label        = "WORK"
                addressLine1 = $c.workAddress.street
                city         = $c.workAddress.city
                state        = $c.workAddress.state
                postalCode   = $c.workAddress.pincode
                country      = "Germany"
                latitude     = $c.workAddress.latitude
                longitude    = $c.workAddress.longitude
                landmark     = $c.workAddress.landmark
                default      = $false
            } -Token $managerToken | Out-Null
            Write-Host " OK" -ForegroundColor Green
        } catch { Write-Host " skipped (may exist)" -ForegroundColor Yellow }
    }

    Write-Host ""
}

# Save customer IDs to state
$state | Add-Member -NotePropertyName "customerIds" -NotePropertyValue $customerIds -Force
$state | ConvertTo-Json -Depth 5 | Set-Content ".\demo-state.json"

Write-Host "All customers created." -ForegroundColor Green
Write-Host ""
Write-Host "Demo customer credentials:" -ForegroundColor Cyan
Write-Host "  anna.mueller@gmail.com   / Demo@1234"
Write-Host "  felix.schmidt@gmail.com  / Demo@1234"
Write-Host "  lena.wagner@gmail.com    / Demo@1234"
Write-Host "  thomas.braun@gmail.com   / Demo@1234"
Write-Host "  sophie.richter@gmail.com / Demo@1234"
Write-Host ""
Write-Host "Run 5-seed-menu.ps1 next." -ForegroundColor Cyan
