# MaSoVa Demo Seed Scripts — Germany

Run these **on Dell** (PowerShell) against `http://localhost:8080`.

## Order of execution

```
1-clear-db.ps1          — wipe all collections (MongoDB direct)
2-create-store.ps1      — create DOM001 Berlin store with DE/EUR config
3-create-staff.ps1      — manager, kitchen, cashier, driver, kiosk accounts
4-create-customers.ps1  — 5 customer accounts with addresses
5-seed-menu.ps1         — 40 menu items (Italian + Continental + Burgers + Drinks + Desserts)
6-declare-allergens.ps1 — PATCH allergens on every menu item (EU 1169/2011 gate)
7-seed-orders.ps1       — ~120 historical orders spread over 90 days for AI agents
8-seed-inventory.ps1    — 20 inventory items, some near reorder threshold
```

## Credentials after seeding

| Role             | Email                          | Password     |
|------------------|--------------------------------|--------------|
| Manager          | manager.berlin@gmail.com       | Demo@1234    |
| Kitchen Staff    | kitchen.berlin@gmail.com       | Demo@1234    |
| Cashier          | cashier.berlin@gmail.com       | Demo@1234    |
| Driver           | driver.berlin@gmail.com        | Demo@1234    |
| Customer 1       | anna.mueller@gmail.com         | Demo@1234    |
| Customer 2       | felix.schmidt@gmail.com        | Demo@1234    |
| Customer 3       | lena.wagner@gmail.com          | Demo@1234    |

## Store
- Code: `DOM001`
- Name: MaSoVa Berlin Mitte
- Country: DE / EUR / de-DE
- VAT: DE123456789 (test)

## Notes
- Prices are in EUR cents (€12.50 = 1250)
- Phone numbers are in international format without `+` (e.g., `4930123456`)
- Postal codes are 5-digit German format (e.g., `10115`)
- Run `1-clear-db.ps1` first to ensure a clean state
- Scripts stop and show error if any step fails (set $ErrorActionPreference = "Stop")
