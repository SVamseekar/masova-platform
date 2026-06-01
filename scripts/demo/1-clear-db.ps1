# MaSoVa Demo — Step 1: Clear Database
# Wipes all collections from MongoDB directly (no API needed).
# Run this FIRST before any other demo script.

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Red
Write-Host "  MaSoVa Demo — Clear Database" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Red
Write-Host ""
Write-Host "WARNING: This will delete ALL data in MongoDB." -ForegroundColor Yellow
$confirm = Read-Host "Type 'yes' to continue"
if ($confirm -ne "yes") {
    Write-Host "Aborted." -ForegroundColor Gray
    exit 0
}

$mongoCmd = "mongosh"

$script = @"
use masova_core;
db.users.deleteMany({});
db.customers.deleteMany({});
db.stores.deleteMany({});
db.sessions.deleteMany({});
db.workingsessions.deleteMany({});
db.shifts.deleteMany({});
db.notifications.deleteMany({});
db.campaigns.deleteMany({});
db.reviews.deleteMany({});
db.earnings.deleteMany({});

use masova_commerce;
db.menu_items.deleteMany({});
db.orders.deleteMany({});
db.carts.deleteMany({});
db.kitchen_equipment.deleteMany({});
db.rating_tokens.deleteMany({});

use masova_payment;
db.transactions.deleteMany({});
db.refunds.deleteMany({});
db.fiscal_signatures.deleteMany({});

use masova_logistics;
db.delivery_tracking.deleteMany({});
db.driver_locations.deleteMany({});
db.inventory_items.deleteMany({});
db.purchase_orders.deleteMany({});
db.suppliers.deleteMany({});
db.waste_records.deleteMany({});

use masova_analytics;
db.getCollectionNames().forEach(function(c) { db[c].deleteMany({}); });

print("All collections cleared.");
"@

Write-Host ""
Write-Host "Connecting to MongoDB at localhost:27017..." -ForegroundColor Cyan
try {
    $script | & $mongoCmd --quiet
    Write-Host ""
    Write-Host "Database cleared successfully." -ForegroundColor Green
} catch {
    Write-Host "mongosh failed. Trying mongo..." -ForegroundColor Yellow
    try {
        $script | & mongo --quiet
        Write-Host "Database cleared successfully." -ForegroundColor Green
    } catch {
        Write-Host "ERROR: Could not connect to MongoDB. Is it running?" -ForegroundColor Red
        Write-Host $_.Exception.Message
        exit 1
    }
}

Write-Host ""
Write-Host "Ready. Run 2-create-store.ps1 next." -ForegroundColor Cyan
