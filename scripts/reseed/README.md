# Demo reseed / data repair (Dell)

**Date verified:** 2026-07-09  

## Important: two Mongos on Dell

| Instance | Port | Used by Spring? |
|---|---|---|
| **Windows `mongod` service** | `localhost:27017` | **Yes** — live demo data |
| Docker `masova-mongodb` | also maps 27017 when host mongo is stopped | Empty if host mongo owns the port |

Always run mongosh against the **host**:

```text
C:\Users\Vamsee\AppData\Local\Programs\mongosh\mongosh.exe
```

## Current demo dataset (DOM001 Berlin, EU)

After 2026-07-09 repair:

| Entity | Count | Notes |
|---|---|---|
| Stores | 3 | DOM001 Berlin DE/EUR, + DOM002/DOM003 |
| Menu | 39 | Italian pizzas etc., prices in cents/EUR minor units |
| Staff users | 6+ | `*.berlin@gmail.com` / `Demo@1234` |
| Customers | 5 | same password `Demo@1234` |
| Orders | 142 | `customerId` = **userId** (JWT `sub`); statuses diversified |
| Inventory | 20 | |
| Delivery trackings | 34 | |
| Suppliers | 5 in Mongo | API list may still return empty if field mapping drift — use Mongo until fixed |

## Scripts

| Script | Purpose |
|---|---|
| `mongo-fix-demo.js` | Diversify order statuses; ensure DOM001 EU fields |
| `mongo-link-orders-userid.js` | Set `orders.customerId` = `customers.userId` for gateway ownership |
| `seed-core.js` / `reseed-all.js` | Hit core `/api/test-data/*` (stores only) |
| `verify-phase-b-e2e.js` | **True E2E Phase B residual** — create → kitchen → dispatch → accept → OTP → DELIVERED + cancel path + SockJS check |

### Phase B residual verify (Mac → Dell gateway)

```bash
GW=http://192.168.50.88:8080 node scripts/reseed/verify-phase-b-e2e.js
# Exit 0 = all green. Requires commerce + logistics on latest main.
```

**KDS WebSocket:** set `VITE_WS_URL=http://192.168.50.88:8084/ws`  
Health: `curl http://192.168.50.88:8084/ws/orders/info` → `{"websocket":true}`  
**Driver auto-pool:** `PATCH /api/delivery/driver/{id}/status` body `{"status":"AVAILABLE"}` before auto-dispatch (manual preferredDriverId still works offline).

### Run repair on Dell

```powershell
cd D:\Projects\masova-platform
& "$env:LOCALAPPDATA\Programs\mongosh\mongosh.exe" --quiet .\scripts\mongo-fix-demo.js
& "$env:LOCALAPPDATA\Programs\mongosh\mongosh.exe" --quiet .\scripts\mongo-link-orders-userid.js
```

## Login smoke

```powershell
curl.exe -X POST http://127.0.0.1:8080/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"manager.berlin@gmail.com\",\"password\":\"Demo@1234\"}"
curl.exe -X POST http://127.0.0.1:8080/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"anna.mueller@gmail.com\",\"password\":\"Demo@1234\"}"
```

## Env must-haves

- `JWT_SECRET` = non-denylisted secret (≥64 chars), **same for all services**
- `RAZORPAY_ENABLED=false` (EU primary / Stripe)
- `SPRING_PROFILES_ACTIVE=dev`
- Rabbit: `masova` / `masova_secret`
