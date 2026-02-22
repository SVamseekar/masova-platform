
# MaSoVa Order Flow — Gap & Issue Register
**Date**: 2026-02-22
**Author**: Claude Code (architectural analysis)
**Scope**: Takeaway, Dine-in, Delivery flows across Customer Web, Customer Mobile, Driver App, POS, KDS, Manager Stack, and all Backend Services

---

## How to Use This Document

Each issue has:
- **Severity** — Critical / High / Medium / Low
- **Surface** — which layer is affected
- **Root Cause** — exactly what in the code is wrong
- **Impact** — what breaks or misbehaves as a result
- **Fix** — what needs to change

Status column: `OPEN` | `IN PROGRESS` | `DONE`

---

## Issue Index

| #   | Title                                                          | Severity   | Surface            | Status |
| --- | -------------------------------------------------------------- | ---------- | ------------------ | ------ |
| 1   | RabbitMQ order events never published                          | 🔴 Critical | Backend            | DONE   |
| 2   | Shared OrderStatus enum missing 4 statuses                     | 🔴 Critical | Backend            | DONE   |
| 3   | DINE_IN removed from all frontends                             | 🔴 Critical | Frontend           | DONE   |
| 4   | DeliveryManagementPage and DriverManagementPage are .bak files | 🔴 Critical | Frontend           | DONE   |
| 5   | KDS skips READY status — orders get stuck                      | 🟠 High     | Frontend           | DONE   |
| 6   | Manager "Mark as Completed" always sets DELIVERED              | 🟠 High     | Frontend           | DONE   |
| 7   | Delivery fee shows 3 different values                          | 🟠 High     | Frontend + Backend | DONE   |
| 8   | Tax hardcoded 5% on frontend vs dynamic backend                | 🟠 High     | Frontend           | PARTIAL (estimate label added; full dynamic requires API call) |
| 9   | No inventory decrement on order creation or completion         | 🟡 Medium   | Backend            | OPEN (requires logistics-service integration) |
| 10  | Driver not notified via WebSocket on order assignment          | 🟡 Medium   | Backend + Mobile   | DONE   |
| 11  | Driver/delivery rating submission is console.log()             | 🟡 Medium   | Frontend           | DONE   |
| 12  | OTP delivery proof fields exist but never used                 | 🟡 Medium   | Mobile + Backend   | DONE (auto-generated on DISPATCHED, email sent via Brevo) |
| 13  | Walk-in customer email fabricated as walkin@cash.local         | 🔵 Low      | Frontend + Backend | DONE   |
| 14  | Driver assigned field checked 4 different ways in Driver App   | 🔵 Low      | Mobile             | DONE   |

---

## Detailed Issues

---

### Issue 1 — RabbitMQ Order Events Never Published

**Severity**: 🔴 Critical
**Surface**: Backend — `commerce-service`
**Status**: OPEN

#### Root Cause
`OrderEventPublisher.java` exists in `commerce-service` with two methods:
- `publishOrderCreated(OrderCreatedEvent event)`
- `publishOrderStatusChanged(OrderStatusChangedEvent event)`

It targets the `masova.orders.events` exchange with routing keys `order.created` and `order.status.changed`.

However, `OrderEventPublisher` is **never `@Autowired` into `OrderService`**. It is defined but completely disconnected from the order lifecycle. Every order creation and every status change silently skips event publishing.

`PaymentEventPublisher` IS correctly wired into `PaymentService` — payment events work. Only order events are broken.

The delivery events exchange (`masova.delivery.events`) with routing keys `delivery.assigned` and `delivery.completed` is also defined in `MaSoVaRabbitMQConfig.java` but never published to from `AutoDispatchService` or `OrderService`.

#### Impact
- `masova.notification.order-events` queue: permanently empty → customers receive no order status notifications via the event pipeline
- `masova.analytics.order-events` queue: permanently empty → any analytics pipeline consuming this queue has no data
- `masova.delivery.events` exchange: never receives messages → delivery assignment and completion events are lost

#### Fix
In `OrderService.java`:
1. `@Autowired OrderEventPublisher orderEventPublisher`
2. In `createOrder()`: call `orderEventPublisher.publishOrderCreated(event)` after saving to MongoDB
3. In `updateOrderStatus()` and `moveToNextStage()`: call `orderEventPublisher.publishOrderStatusChanged(event)` after each status update
4. In `AutoDispatchService.autoDispatch()`: publish `delivery.assigned` event after driver assignment
5. In `OrderService.updateOrderStatus()` when status=DELIVERED: publish `delivery.completed` event

---

### Issue 2 — Shared OrderStatus Enum Missing 4 Statuses

**Severity**: 🔴 Critical
**Surface**: Backend — `shared-models`
**Status**: OPEN

#### Root Cause
Two separate `OrderStatus` definitions exist and are out of sync:

**`shared-models/src/main/java/com/MaSoVa/shared/entity/OrderStatus.java`**:
```
RECEIVED, PREPARING, OVEN, BAKED, DISPATCHED, OUT_FOR_DELIVERY, DELIVERED
```

**`Order.java` inner enum** (commerce-service):
```
RECEIVED, PREPARING, OVEN, BAKED, READY, DISPATCHED, DELIVERED, SERVED, COMPLETED, CANCELLED
```

Missing from shared enum: `READY`, `SERVED`, `COMPLETED`, `CANCELLED`
Present in shared but not in Order inner enum: `OUT_FOR_DELIVERY`

#### Impact
Any inter-service DTO that uses the shared `OrderStatus` and receives `READY`, `SERVED`, `COMPLETED`, or `CANCELLED` will throw a deserialization exception or silently map to null. This affects:
- `logistics-service` consuming order events
- `payment-service` consuming order status updates
- Any future service that imports `shared-models`

`OUT_FOR_DELIVERY` in the shared enum has no corresponding status in `Order.java` — if ever set, it would be unrecognised by commerce-service.

#### Fix
Reconcile both enums into one canonical definition in `shared-models`:
```java
public enum OrderStatus {
    RECEIVED,
    PREPARING,
    OVEN,
    BAKED,
    READY,
    DISPATCHED,
    OUT_FOR_DELIVERY,
    DELIVERED,
    SERVED,
    COMPLETED,
    CANCELLED
}
```
Remove the inner enum from `Order.java` and import from `shared-models`. Update all services that use either enum.

---

### Issue 3 — DINE_IN Removed from All Frontends

**Severity**: 🔴 Critical
**Surface**: Frontend — Customer Web, POS
**Status**: OPEN

#### Root Cause
**`OrderPanel.tsx` (POS)**:
```typescript
// orderType typed as 'PICKUP' | 'DELIVERY'
// Comment in code: "Removed DINE_IN"
```

**`PaymentPage.tsx` (Customer Web)**:
Only renders DELIVERY and TAKEAWAY options. No DINE_IN radio/button exists.

**`CustomerApp.tsx` / Mobile**:
No dine-in order flow on any mobile screen.

#### Impact
The backend (`OrderService.java`) fully supports `OrderType.DINE_IN`:
- `getNextStatus()` returns `SERVED` as terminal status for DINE_IN
- `tableNumber` and `guestCount` fields exist on `Order.java`
- KDS handles DINE_IN orders correctly

But since no frontend can place a DINE_IN order, this entire backend capability is unreachable. Restaurants using MaSoVa cannot process table orders through the system at all — every POS order is forced to TAKEAWAY/PICKUP type.

#### Fix
**POS (`OrderPanel.tsx`)**:
- Restore `DINE_IN` as an order type option
- Show table number input when DINE_IN is selected
- Pass `tableNumber` and `guestCount` in order payload

**Customer Web (`PaymentPage.tsx`)**:
- Decide whether web customers can place dine-in orders (likely no — this is staff-facing)
- Document this as intentional if DINE_IN is POS-only

**KDS (`KitchenDisplayPage.tsx`)**:
- Ensure SERVED status column or button is visible for DINE_IN orders

---

### Issue 4 — DeliveryManagementPage and DriverManagementPage Are .bak Files

**Severity**: 🔴 Critical
**Surface**: Frontend — Manager Stack
**Status**: OPEN

#### Root Cause
During the manager dashboard consolidation, the following pages were backed up and removed from active routing:
- `src/pages/manager/DeliveryManagementPage.tsx.bak`
- `src/pages/manager/DriverManagementPage.tsx.bak`

`ManagerShell.tsx` and the manager router do not include routes for either page. They are unreachable from the UI.

#### Impact
**No UI exists for:**
- Auto-dispatch (`POST /api/delivery/auto-dispatch`) — the most important delivery management action
- Delivery zone management
- Driver profiles, availability toggle, clock-in/out management
- Driver performance overview
- Active delivery monitoring across all orders

**Current workaround**: Manual driver assignment in `OrderManagementPage.tsx` uses `window.prompt("Enter Driver ID:")` — a raw browser dialog with no driver search, availability check, or name display. Operators must know the driver's UUID by memory.

#### Fix
Restore both pages into `ManagerShell.tsx` routing:
1. Rename `.bak` → `.tsx` for both files
2. Add routes in `ManagerShell.tsx`:
   - `/manager/delivery` → `DeliveryManagementPage`
   - `/manager/drivers` → `DriverManagementPage`
3. Add navigation links in the manager sidebar
4. Replace `window.prompt` in `OrderManagementPage.tsx` with a proper driver selector modal that calls `GET /api/users/drivers?storeId={id}` and shows name + availability

---

### Issue 5 — KDS Skips READY Status, Orders Get Stuck

**Severity**: 🟠 High
**Surface**: Frontend — KDS (`KitchenDisplayPage.tsx`)
**Status**: OPEN

#### Root Cause
`KitchenDisplayPage.tsx` renders a 5-column Kanban board:
```
RECEIVED | PREPARING | OVEN | BAKED | DISPATCHED
```

`OrderService.getNextStatus()` (backend) defines:
```
RECEIVED → PREPARING → OVEN → BAKED → READY → DISPATCHED/SERVED/COMPLETED
```

The KDS has no `READY` column and no button to advance an order from `READY` to the next status. After a kitchen staff member clicks "next" on a BAKED order, the backend sets the status to `READY`. The order then disappears from the BAKED column but has no column to appear in on the KDS.

#### Impact
- TAKEAWAY orders: sit at `READY` indefinitely — staff have no way to mark them `COMPLETED` via KDS
- DELIVERY orders: sit at `READY` indefinitely — never reach `DISPATCHED`, driver is never assigned
- DINE_IN orders (when fixed): sit at `READY` indefinitely — never reach `SERVED`
- Only workaround: manager manually advances status from `OrderManagementPage.tsx`

#### Fix
**Option A** (recommended): Add `READY` column to KDS between BAKED and DISPATCHED. Show a "Ready for Pickup / Dispatch" button.

**Option B**: Modify `OrderService.getNextStatus()` to skip `READY` and go directly `BAKED → DISPATCHED/SERVED/COMPLETED`. Simpler but loses the `READY` state granularity.

**For Option A**, also add a `readyAt` timestamp display so staff can see how long an order has been waiting at the counter.

---

### Issue 6 — Manager "Mark as Completed" Always Sets DELIVERED

**Severity**: 🟠 High
**Surface**: Frontend — `OrderManagementPage.tsx`
**Status**: OPEN

#### Root Cause
```typescript
// OrderManagementPage.tsx — handleMarkAsCompleted()
useUpdateOrderStatusMutation({ orderId, status: 'DELIVERED' })
// Always DELIVERED regardless of order type
```

Correct terminal statuses by order type:
- `DELIVERY` → `DELIVERED` ✅
- `TAKEAWAY` → `COMPLETED` ❌ (currently set to DELIVERED)
- `DINE_IN` → `SERVED` ❌ (currently set to DELIVERED)

#### Impact
- TAKEAWAY orders are recorded as DELIVERED in the database — misleading data
- Analytics queries that filter by terminal status (`COMPLETED` for takeaway) will undercount
- Revenue reports segmented by order type will be inaccurate
- Customer notification on completion may send wrong message ("Your order has been delivered" for a pickup)

#### Fix
```typescript
const getTerminalStatus = (orderType: string) => {
  if (orderType === 'DELIVERY') return 'DELIVERED';
  if (orderType === 'DINE_IN') return 'SERVED';
  return 'COMPLETED'; // TAKEAWAY, PICKUP
};

handleMarkAsCompleted(orderId, order.orderType) {
  updateOrderStatus({ orderId, status: getTerminalStatus(order.orderType) });
}
```

---

### Issue 7 — Delivery Fee Shows 3 Different Values

**Severity**: 🟠 High
**Surface**: Frontend + Backend
**Status**: OPEN

#### Root Cause
Three hardcoded values exist across the stack:

| Location                             | Value                    | File                                               |
| ------------------------------------ | ------------------------ | -------------------------------------------------- |
| `cartSlice.ts` initial state         | `deliveryFee: 29`        | Frontend — shown in cart                           |
| `OrderPanel.tsx` (POS)               | `deliveryFee: 40`        | Frontend — shown at POS                            |
| Backend `OrderService.createOrder()` | Dynamic (distance-based) | Via `deliveryServiceClient.calculateDeliveryFee()` |

The customer sees ₹29 in the cart and ₹29 at checkout. The actual order is created with a different fee calculated dynamically by the backend. The order confirmation and receipt will show the real fee, which is different from what the customer saw during the entire checkout journey.

#### Impact
- Customer trust: price shown at checkout ≠ price charged
- Could be a legal/compliance issue depending on jurisdiction (showing one price, charging another)
- POS staff see ₹40 for all delivery orders regardless of actual distance

#### Fix
1. After `POST /api/orders` succeeds, update the cart/display with the fee returned in the order response
2. Better: add a `GET /api/delivery/fee/estimate?storeId=&lat=&lng=` call on `PaymentPage.tsx` when DELIVERY is selected and address is entered — show the real estimated fee before order creation
3. Remove hardcoded `29` from `cartSlice.ts` initial state — use `0` as default until fetched
4. `OrderPanel.tsx`: call the same fee estimation endpoint when DELIVERY is selected

---

### Issue 8 — Tax Hardcoded at 5% on Frontend vs Dynamic Backend

**Severity**: 🟠 High
**Surface**: Frontend
**Status**: OPEN

#### Root Cause
```typescript
// PaymentPage.tsx, OrderPanel.tsx, cartSlice.ts
tax = subtotal * 0.05  // Always 5%
```

Backend `OrderService.createOrder()`:
```java
taxConfiguration.calculateTax(subtotal)
// Reads from TaxConfiguration — configurable per store/region
```

#### Impact
- Displayed tax at checkout may not match actual tax charged
- If `TaxConfiguration` is set to a different rate (e.g. 12% for some categories, 18% GST for others), the customer is shown 5% but charged a different amount
- Same discrepancy as delivery fee — checkout total shown ≠ order total created

#### Fix
1. Expose a `GET /api/tax/rate?storeId=` endpoint from commerce-service
2. `PaymentPage.tsx`: fetch tax rate on load, use it for the displayed total calculation
3. Or: show tax as "calculated at checkout" and only display the final total returned from `POST /api/orders`

---

### Issue 9 — No Inventory Decrement on Order Creation or Completion

**Severity**: 🟡 Medium
**Surface**: Backend — `commerce-service`
**Status**: OPEN

#### Root Cause
`InventoryService.java` exists in `commerce-service` with full CRUD for inventory items, stock levels, and low-stock alerts. However, `OrderService.createOrder()` does not call `InventoryService` at any point. No order status change triggers inventory decrement either.

The inventory system is a standalone feature — stock is managed manually by the manager, not automatically by orders.

#### Impact
- Stock levels never reflect actual consumption
- Low-stock alerts never trigger from real orders
- Inventory reports are disconnected from order volumes
- A restaurant could sell 100 plates of a dish that ran out after 10

#### Fix
In `OrderService.createOrder()` (or on status change to `PREPARING`):
```java
for (OrderItem item : order.getItems()) {
    inventoryService.decrementStock(item.getMenuItemId(), item.getQuantity(), order.getStoreId());
}
```
On order `CANCELLED`:
```java
inventoryService.restoreStock(item.getMenuItemId(), item.getQuantity(), order.getStoreId());
```
Decision needed: decrement on **order creation** (reserved) or on **PREPARING** (actual consumption)? Recommend PREPARING to avoid decrementing for immediately-cancelled orders.

---

### Issue 10 — Driver Not Notified via WebSocket on Order Assignment

**Severity**: 🟡 Medium
**Surface**: Backend + Driver Mobile App
**Status**: OPEN

#### Root Cause
`ActiveDeliveryScreen.tsx` (Driver App) polls `GET /api/orders?status=DISPATCHED` every **30 seconds**. There is no WebSocket subscription in the Driver App for new order assignments.

When a manager assigns a driver (manually or via auto-dispatch), `OrderService.assignDriver()` updates the `assignedDriverId` field and broadcasts to `/topic/store/{storeId}/orders` — but the Driver App does not subscribe to this topic.

#### Impact
- Driver sees a new delivery assignment up to 30 seconds after it happens
- In a busy restaurant, 30 seconds of delay on driver notification is significant
- No sound/push alert when a new order is assigned — driver must check the app manually

#### Fix
**Option A** (WebSocket): In `OrderService.assignDriver()`, additionally broadcast to `/topic/driver/{driverId}/orders` with the assigned order. Driver App subscribes to this topic on `DeliveryHomeScreen` mount.

**Option B** (Push notification): Send Firebase/FCM push notification to the driver's device token on assignment. Requires storing device tokens per driver.

**Option A** is faster to implement. Option B works when app is backgrounded.

Recommendation: implement both — WebSocket for foreground, FCM push for background.

---

### Issue 11 — Driver/Delivery Rating Submission Is console.log()

**Severity**: 🟡 Medium
**Surface**: Frontend — Customer Web (`LiveTrackingPage.tsx`)
**Status**: OPEN

#### Root Cause
```typescript
// LiveTrackingPage.tsx
const handleSubmitRating = (rating: number, feedback: string) => {
  console.log('Rating submitted:', { orderId, rating, feedback });
  // No API call
};
```

The `RatingDialog` component renders correctly after delivery, collects a star rating and text feedback, then calls `handleSubmitRating()` which only logs to console.

#### Impact
- All customer delivery ratings are silently discarded
- Driver performance scores have no customer input
- `DriverManagementPage` (when restored) will show zero ratings for all drivers
- No feedback loop from customers to operations

#### Fix
1. Create backend endpoint: `POST /api/delivery/rating` with body `{ orderId, driverId, rating, feedback, customerId }`
2. Store ratings in logistics-service `DriverRating` collection
3. `handleSubmitRating()`: call the endpoint, show success toast, close dialog
4. Wire into `GET /api/driver/{id}/performance` response

---

### Issue 12 — OTP Delivery Proof Fields Exist But Are Never Used

**Severity**: 🟡 Medium
**Surface**: Driver Mobile App + Backend
**Status**: OPEN

#### Root Cause
`Order.java` has a complete OTP proof-of-delivery schema:
```java
private String deliveryOtp;
private LocalDateTime deliveryOtpExpiresAt;
private String deliveryProofType;  // OTP | PHOTO | SIGNATURE | CONTACTLESS
private String deliveryPhotoUrl;
private String deliverySignatureUrl;
private Boolean contactlessDelivery;
```

Backend endpoints exist:
- `PUT /api/v1/orders/{orderId}/delivery-otp` — generate/send OTP
- `PUT /api/v1/orders/{orderId}/delivery-proof` — submit proof

`ActiveDeliveryScreen.tsx` (Driver App) does not call either endpoint. Delivery is completed by:
1. Optional photo upload
2. `updateOrderStatus({ orderId, status: 'DELIVERED' })` — no OTP verification

A driver can mark any order as delivered without any customer confirmation.

#### Impact
- Fraudulent delivery claims possible — driver marks delivered without customer receiving the order
- Photo proof is optional and can be skipped
- No customer-side OTP confirmation flow exists in the Customer App either

#### Fix
1. On order `DISPATCHED`: backend generates OTP, sends to customer via SMS/notification
2. Driver App: before marking DELIVERED, show OTP input screen: `PUT /api/v1/orders/{orderId}/delivery-proof` with `{ otp, deliveryProofType: "OTP" }`
3. Backend validates OTP before allowing status change to DELIVERED
4. Customer App: show OTP on `LiveTrackingPage.tsx` when order is DISPATCHED
5. Alternative for contactless: photo proof becomes mandatory (not optional)

---

### Issue 13 — Walk-in Customer Email Fabricated as walkin@cash.local

**Severity**: 🔵 Low
**Surface**: Frontend — `POSDashboard.tsx` + Backend
**Status**: OPEN

#### Root Cause
```typescript
// POSDashboard.tsx — handleMarkAsPaid()
customerEmail: `${order.customerId || 'walkin'}@cash.local`
```

When a walk-in customer pays cash at the POS, a fabricated email is sent to `PaymentService.recordCashPayment()`. This fake email is stored in the `Transaction` document after being encrypted by `PiiEncryptionService` (AES-256-GCM).

#### Impact
- `Transaction` records for walk-in orders contain a fake email domain
- If `CustomerNotificationService` attempts to send a receipt email to `walkin@cash.local`, it will fail/bounce
- Analytics or CRM exports that use the transaction email field will contain junk data
- Low severity because walk-in cash transactions typically don't need email

#### Fix
1. Make `customerEmail` optional in `RecordCashPaymentRequest`
2. Backend: if `customerEmail` is null/empty, skip email notification — don't store fabricated value
3. POS: pass `customerEmail: null` for walk-in customers, pass real email if customer account is attached

---

### Issue 14 — Driver Assigned Field Checked 4 Different Ways in Driver App

**Severity**: 🔵 Low
**Surface**: Driver Mobile App
**Status**: OPEN

#### Root Cause
```typescript
// ActiveDeliveryScreen.tsx — filtering orders for current driver
order.assignedDriverId === driverId ||
order.driverId === driverId ||
order.assignedDriver?.id === driverId ||
order.assignedDriver === driverId
```

`Order.java` uses `assignedDriverId` (a plain string UUID). The other three checks (`driverId`, `assignedDriver.id`, `assignedDriver`) are defensive fallbacks that suggest the field name was changed at some point and the Driver App was updated without full certainty about the backend field name.

#### Impact
- Low risk currently since `assignedDriverId` is the correct field and is checked first
- If backend field is ever renamed, the primary check breaks silently and a fallback may or may not catch it
- Code smell that indicates the Driver App and backend were developed without tight contract

#### Fix
1. Confirm canonical field name is `assignedDriverId` in `Order.java`
2. Simplify Driver App filter to single check: `order.assignedDriverId === driverId`
3. Consider implementing a Pact contract test between Driver App and commerce-service to enforce this field name going forward

---

## Appendix: Flow Coverage Matrix

| Feature                | Customer Web        | Customer Mobile | POS          | KDS                  | Manager               | Driver App             |
| ---------------------- | ------------------- | --------------- | ------------ | -------------------- | --------------------- | ---------------------- |
| Browse menu            | ✅ MenuPage          | ✅ MenuScreen    | ✅ MenuPanel  | —                    | —                     | —                      |
| Place TAKEAWAY         | ✅ PaymentPage       | ✅               | ✅ OrderPanel | —                    | —                     | —                      |
| Place DELIVERY         | ✅ PaymentPage       | ✅               | ✅ OrderPanel | —                    | —                     | —                      |
| Place DINE_IN          | ❌ Removed           | ❌ Removed       | ❌ Removed    | —                    | —                     | —                      |
| Pay via Razorpay       | ✅                   | ✅               | —            | —                    | —                     | —                      |
| Pay via Cash           | ❌ Not supported     | ❌               | ✅ POS only   | —                    | —                     | —                      |
| Track order status     | ✅ OrderTrackingPage | ✅               | —            | —                    | ✅                     | —                      |
| Live delivery map      | ✅ LiveTrackingPage  | ✅               | —            | —                    | —                     | —                      |
| Rate delivery          | ✅ (broken — no API) | —               | —            | —                    | —                     | —                      |
| Advance kitchen stages | —                   | —               | —            | ✅ KitchenDisplayPage | —                     | —                      |
| View all orders        | —                   | —               | —            | —                    | ✅ OrderManagementPage | —                      |
| Assign driver          | —                   | —               | —            | —                    | ✅ (window.prompt)     | —                      |
| Mark delivered         | —                   | —               | —            | —                    | ✅ (wrong status bug)  | ✅ ActiveDeliveryScreen |
| GPS location stream    | —                   | —               | —            | —                    | —                     | ✅ DeliveryHomeScreen   |
| View performance       | —                   | —               | —            | —                    | —                     | ✅ DeliveryHomeScreen   |
| Manage drivers         | —                   | —               | —            | —                    | ❌ Page is .bak        | —                      |
| Manage delivery zones  | —                   | —               | —            | —                    | ❌ Page is .bak        | —                      |
| Inventory management   | —                   | —               | —            | —                    | ❌ Page is .bak        | —                      |
| Auto-dispatch          | —                   | —               | —            | —                    | ❌ No UI entry point   | —                      |
