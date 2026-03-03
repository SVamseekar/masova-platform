# Phase 3 — Order Flow + Feature Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix 10 broken order flow behaviors that cause incorrect data, wrong terminal states, and missing features.

**Architecture:** Backend fixes in Spring Boot (commerce-service, logistics-service). Frontend fixes in React 19 TypeScript. Mobile fixes in React Native 0.81. Changes are surgical — do not refactor surrounding code.

**Tech Stack:** Spring Boot 3, MongoDB, React 19, TypeScript, RTK Query, React Native 0.81, Redis (OTP storage)

---

## Tools for This Phase

Read this section before starting ANY task. These are the exact tools to use and when.

### `jdtls-lsp` — Java Language Server (MCP tool)
**Use it:** Continuously while editing `OrderService.java`, `KitchenService.java`, and any Feign client files. This phase modifies the core order state machine — the LSP will catch missing method signatures, wrong enum values, and broken imports immediately.
**Specifically:** When adding OTP generation in Task 3.7, the LSP will confirm that the Redis `StringRedisTemplate` injection is correct and the method signatures match what Spring expects.
**How to invoke:** Runs automatically. Use `mcp__ide__getDiagnostics` on any file for explicit diagnostics.

### `serena` — Semantic Code Navigation (MCP tool)
**Use it:** Before modifying the order state machine — use Serena to trace the FULL order lifecycle first.
**Specifically:** Before Task 3.1, ask Serena to "show all callers of updateOrderStatus in commerce-service" and "show all places OrderStatus is referenced". This gives you the complete picture before you touch anything.
**How to invoke:** Use the `serena` MCP tools in your session.

### `greptile` — Semantic Codebase Search (MCP tool)
**Use it:** To find all RabbitMQ publishers and consumers across all services in one search.
**Specifically:** Before Task 3.1, search "RabbitTemplate.convertAndSend" across the codebase to see every place events are published. Before Task 3.7 (OTP), search "delivery_otp" or "DELIVERY_OTP" to see if any existing OTP handling exists.
**How to invoke:** Use the `mcp__plugin_greptile_greptile__*` tools.

### `context7` — Library Docs (MCP tool)
**Use it:** Before Task 3.7 (OTP + Redis TTL). Redis `StringRedisTemplate.opsForValue().set(key, value, duration)` has specific Spring Boot 3 syntax.
**Specifically:** `resolve-library-id` for `spring-data-redis` → `query-docs` for "StringRedisTemplate TTL" to confirm the exact method signature with `Duration` parameter.
**How to invoke:** `mcp__plugin_context7_context7__resolve-library-id` → `mcp__plugin_context7_context7__query-docs`.

### `systematic-debugging` (Skill)
**Use it:** If any order status transition test fails at runtime — BEFORE changing code. The order state machine has many interdependencies. Diagnose first.
**Specifically:** If OTP verification fails in Task 3.7, use this skill to trace: Was the OTP stored in Redis? Is the TTL set correctly? Is the key format matching between store and retrieve?
**How to invoke:** Type `/systematic-debugging`.

### `test-driven-development` (Skill)
**Use it:** For every order state transition fix in this phase. Write a failing test that demonstrates the bug, then fix the code.
**Specifically:** For Task 3.7, write a test that calls the OTP generation endpoint, stores the OTP, calls the verify endpoint with wrong OTP (expect 400), then with correct OTP (expect 200).
**How to invoke:** Type `/test-driven-development` before starting each task.

### `silent-failure-hunter` (Agent — pr-review-toolkit)
**Use it:** After Task 3.7 (OTP generation). OTP storage failures (Redis unavailable, key collision) must surface as errors — not silent skips. This agent hunts for exactly that.
**How to invoke:** Use the Agent tool with `subagent_type: "pr-review-toolkit:silent-failure-hunter"` on the OTP service code.

### `pr-review-toolkit:code-reviewer` (Agent)
**Use it:** After completing Task 3.7 (OTP flow complete) and after Task 3.4 (KDS revamp). These are the two highest-complexity tasks in this phase.
**How to invoke:** Use the Agent tool with `subagent_type: "pr-review-toolkit:code-reviewer"`.

### `commit-commands:commit` (Skill)
**Use it:** After every task. Each fix is independent — commit them separately so rollback is easy if one breaks something.
**How to invoke:** Type `/commit`.

---

## Task 3.1: Inventory Auto-Decrement on Order Status Change

**Files:**
- Modify: `commerce-service/src/main/java/com/MaSoVa/commerce/order/service/OrderService.java`
- Read: `logistics-service/src/main/java/com/MaSoVa/logistics/inventory/service/InventoryService.java`
- Read: `commerce-service/src/main/java/com/MaSoVa/commerce/order/client/` (check for InventoryServiceClient)

**Step 1: Check if InventoryServiceClient exists in commerce-service**

```bash
find commerce-service/src/main/java -name "InventoryServiceClient.java"
```

If it exists → read it and note the method signatures.
If not → create `commerce-service/src/main/java/com/MaSoVa/commerce/order/client/InventoryServiceClient.java`:

```java
package com.MaSoVa.commerce.order.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import java.util.Map;

@FeignClient(name = "logistics-service", url = "${logistics.service.url}")
public interface InventoryServiceClient {

    @PatchMapping("/api/inventory/{menuItemId}")
    void adjustStock(@PathVariable String menuItemId, @RequestBody Map<String, Object> body);
}
```

**Step 2: Find where inventory item IDs are stored on OrderItem**

Read `commerce-service/src/main/java/com/MaSoVa/commerce/order/entity/OrderItem.java`. Check if `menuItemId` is present on each order item. It is — order items already store `menuItemId`.

**Step 3: Find updateOrderStatus method in OrderService.java**

Read `OrderService.java` around line 280+. Find `updateOrderStatus()`. Note the method signature and where status is saved.

**Step 4: Add inventory decrement logic**

In `OrderService.updateOrderStatus()`, after the status is saved and BEFORE the WebSocket broadcast, add:

```java
// Inventory management on status transition
if (OrderStatus.PREPARING.equals(request.getStatus())) {
    // Decrement inventory for each item in this order
    order.getItems().forEach(item -> {
        try {
            inventoryServiceClient.adjustStock(item.getMenuItemId(), Map.of(
                "operation", "CONSUME",
                "quantity", item.getQuantity()
            ));
            log.info("Decremented inventory for item {} qty={}", item.getMenuItemId(), item.getQuantity());
        } catch (Exception e) {
            log.warn("Failed to decrement inventory for item {}: {}", item.getMenuItemId(), e.getMessage());
            // Non-blocking — order flow continues even if inventory update fails
        }
    });
}

if (OrderStatus.CANCELLED.equals(request.getStatus())) {
    // Restore inventory only if order was past RECEIVED (i.e., was being prepared)
    if (order.getStatus() != null && !OrderStatus.RECEIVED.equals(order.getStatus())) {
        order.getItems().forEach(item -> {
            try {
                inventoryServiceClient.adjustStock(item.getMenuItemId(), Map.of(
                    "operation", "ADJUST",
                    "quantity", item.getQuantity() // positive = restore
                ));
                log.info("Restored inventory for cancelled order item {} qty={}", item.getMenuItemId(), item.getQuantity());
            } catch (Exception e) {
                log.warn("Failed to restore inventory for cancelled order item {}: {}", item.getMenuItemId(), e.getMessage());
            }
        });
    }
}
```

Also wire `InventoryServiceClient` into `OrderService` constructor (add to constructor params and field).

**Step 5: Add Resilience4j circuit breaker on InventoryServiceClient**

In the method above, wrap in try/catch as shown. The circuit breaker is already configured in application.yml (from Phase 1.9). Add `logistics-service` instance to the config if not already there.

**Step 6: Build commerce-service**

```powershell
mvn compile "-Dmaven.test.skip=true"
```

**Step 7: Commit**

```bash
git add commerce-service/src/main/java/com/MaSoVa/commerce/order/client/InventoryServiceClient.java
git add commerce-service/src/main/java/com/MaSoVa/commerce/order/service/OrderService.java
git commit -m "feat(commerce): auto-decrement inventory on PREPARING, restore on CANCEL"
```

---

## Task 3.2: Restore DINE_IN Order Type

**Files:**
- Modify: `frontend/src/components/pos/OrderPanel.tsx` (or wherever POS order type is selected)
- Modify: `frontend/src/pages/kitchen/KitchenDisplayPage.tsx`
- Modify: `frontend/src/pages/manager/OrderManagementPage.tsx`

**Step 1: Read OrderPanel.tsx**

Find where order type (TAKEAWAY/DELIVERY) is selected. Add DINE_IN option with table number + guest count:

```tsx
// In the order type selector section
<FormControl fullWidth sx={{ mb: 2 }}>
  <InputLabel>Order Type</InputLabel>
  <Select
    value={orderType}
    onChange={(e) => setOrderType(e.target.value as 'TAKEAWAY' | 'DELIVERY' | 'DINE_IN')}
  >
    <MenuItem value="TAKEAWAY">Takeaway</MenuItem>
    <MenuItem value="DELIVERY">Delivery</MenuItem>
    <MenuItem value="DINE_IN">Dine In</MenuItem>
  </Select>
</FormControl>

{/* Show table number + guest count only for DINE_IN */}
{orderType === 'DINE_IN' && (
  <>
    <TextField
      fullWidth
      label="Table Number"
      type="number"
      value={tableNumber}
      onChange={(e) => setTableNumber(e.target.value)}
      sx={{ mb: 2 }}
      required
    />
    <TextField
      fullWidth
      label="Number of Guests"
      type="number"
      value={guestCount}
      onChange={(e) => setGuestCount(e.target.value)}
      sx={{ mb: 2 }}
    />
  </>
)}
```

Add `tableNumber` and `guestCount` to state and include in order creation request.

**Step 2: Read KitchenDisplayPage.tsx**

Find the column definitions / status groupings. Add SERVED column:

```tsx
// In the columns definition (look for BAKED column, add after it)
const KITCHEN_COLUMNS = [
  { id: 'RECEIVED', label: 'New Orders', color: '#2196F3' },
  { id: 'PREPARING', label: 'Preparing', color: '#FF9800' },
  { id: 'OVEN', label: 'In Oven', color: '#F44336' },
  { id: 'BAKED', label: 'Baked', color: '#9C27B0' },
  { id: 'READY', label: 'Ready', color: '#4CAF50' },     // ← ADD THIS
  { id: 'SERVED', label: 'Served', color: '#607D8B' },   // ← ADD THIS (DINE_IN terminal)
];
```

Show DINE_IN orders in SERVED column. Show their table number on the card.

**Step 3: Fix terminal status in OrderManagementPage.tsx**

Find "Mark as Completed" button or the status progression logic. Fix to:

```tsx
const getTerminalStatus = (orderType: string) => {
  switch (orderType) {
    case 'DELIVERY': return 'DELIVERED';
    case 'TAKEAWAY': return 'COMPLETED';
    case 'DINE_IN': return 'SERVED';
    default: return 'COMPLETED';
  }
};

// Use this when manager clicks "Complete Order"
const handleCompleteOrder = async (orderId: string, orderType: string) => {
  await updateOrderStatus({
    orderId,
    status: getTerminalStatus(orderType),
    reason: 'Manager marked as complete'
  });
};
```

**Step 4: Build frontend**

```bash
cd frontend
npm run build
```
Expected: no TypeScript errors.

**Step 5: Commit**

```bash
git add frontend/src/components/pos/
git add frontend/src/pages/kitchen/KitchenDisplayPage.tsx
git add frontend/src/pages/manager/OrderManagementPage.tsx
git commit -m "feat(frontend): restore DINE_IN order type in POS, add READY+SERVED columns to KDS, fix terminal status per order type"
```

---

## Task 3.3: Checkout Price Accuracy — Real Delivery Fee + Tax

**Files:**
- Modify: `frontend/src/pages/customer/CheckoutPage.tsx` or `PaymentPage.tsx`
- Modify: `frontend/src/store/slices/cartSlice.ts`

**Step 1: Read cartSlice.ts**

Find `deliveryFee` in the slice. It's likely hardcoded to `29`. Change the initial value to `0`:

```typescript
deliveryFee: 0,  // Set dynamically when address is entered
```

**Step 2: Read CheckoutPage.tsx (or PaymentPage.tsx)**

Find where delivery fee is displayed. It likely shows a hardcoded value. Replace with a dynamic fetch:

```tsx
// Add this hook call at the top of the component
const [feeLoading, setFeeLoading] = useState(false);

const fetchDeliveryFee = async (lat: number, lng: number) => {
  if (!selectedStore?.id) return;
  setFeeLoading(true);
  try {
    const res = await fetch(
      `/api/delivery/zones?storeId=${selectedStore.id}&lat=${lat}&lng=${lng}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await res.json();
    dispatch(setDeliveryFee(data.feeINR ?? 0));
  } catch (e) {
    console.error('Could not fetch delivery fee:', e);
  } finally {
    setFeeLoading(false);
  }
};

// Call fetchDeliveryFee when delivery address lat/lng are set
useEffect(() => {
  if (orderType === 'DELIVERY' && address?.latitude && address?.longitude) {
    fetchDeliveryFee(address.latitude, address.longitude);
  }
}, [address?.latitude, address?.longitude, orderType]);
```

**Step 3: Fix tax display**

Find where tax % is displayed. Change from hardcoded `5%` to use the value from the order response:

```tsx
// After POST /api/orders returns, update displayed totals
const handlePlaceOrder = async () => {
  const order = await createOrder(orderPayload).unwrap();
  // Update totals from actual order response
  setDisplayedTax(order.tax);
  setDisplayedDeliveryFee(order.deliveryFee);
  setDisplayedTotal(order.total);
};
```

**Step 4: Add out-of-area guard**

If delivery fee fetch returns `outOfArea: true`, disable the Place Order button and show a message:

```tsx
{isOutOfArea && (
  <Alert severity="error" sx={{ mb: 2 }}>
    This address is outside our delivery area. Please select a different address or choose Takeaway.
  </Alert>
)}
<Button
  variant="contained"
  disabled={isOutOfArea || feeLoading}
  onClick={handlePlaceOrder}
>
  {feeLoading ? 'Calculating fee...' : 'Place Order'}
</Button>
```

**Step 5: Build and commit**

```bash
cd frontend && npm run build
git add frontend/src/store/slices/cartSlice.ts
git add frontend/src/pages/customer/
git commit -m "fix(frontend): fetch real delivery fee from API, use actual tax from order response, guard out-of-area"
```

---

## Task 3.4: KDS Full Revamp

**Files:**
- Modify: `frontend/src/pages/kitchen/KitchenDisplayPage.tsx`
- Modify: `frontend/src/styles/` (add KDS-specific styles or in-file styled-components)

**Step 1: Add summary bar (fixed top)**

```tsx
// Fixed summary bar component
const KDSSummaryBar = ({ orders }: { orders: Order[] }) => {
  const activeCount = orders.filter(o => !['SERVED','DELIVERED','COMPLETED','CANCELLED'].includes(o.status)).length;
  const waitTimes = orders.map(o => (Date.now() - new Date(o.receivedAt).getTime()) / 60000);
  const avgWait = waitTimes.length ? (waitTimes.reduce((a,b) => a+b, 0) / waitTimes.length).toFixed(0) : 0;
  const longestWait = waitTimes.length ? Math.max(...waitTimes).toFixed(0) : 0;

  return (
    <Box sx={{ position: 'fixed', top: 64, left: 0, right: 0, zIndex: 100,
               bgcolor: '#1a1a2e', color: '#fff', p: 1, display: 'flex', gap: 4, px: 3 }}>
      <Typography>Active: <strong>{activeCount}</strong></Typography>
      <Typography>Avg Wait: <strong>{avgWait}m</strong></Typography>
      <Typography>Longest: <strong style={{ color: Number(longestWait) > 10 ? '#f44336' : '#fff' }}>{longestWait}m</strong></Typography>
    </Box>
  );
};
```

**Step 2: Add urgency color border on order card**

```tsx
const getUrgencyColor = (receivedAt: string) => {
  const minutesWaiting = (Date.now() - new Date(receivedAt).getTime()) / 60000;
  if (minutesWaiting > 10) return '#f44336'; // red — URGENT
  if (minutesWaiting > 5)  return '#FF9800'; // amber — WARNING
  return '#4CAF50';                            // green — OK
};

// In order card render:
<Card sx={{
  borderLeft: `4px solid ${getUrgencyColor(order.receivedAt)}`,
  mb: 1,
  // Pulsing animation for red orders:
  ...(getUrgencyColor(order.receivedAt) === '#f44336' && {
    animation: 'pulse 2s infinite',
    '@keyframes pulse': {
      '0%': { borderLeftColor: '#f44336' },
      '50%': { borderLeftColor: '#ff7961' },
      '100%': { borderLeftColor: '#f44336' },
    }
  })
}}>
```

**Step 3: Add sound alert for new orders**

```tsx
// Base64 WAV chime — short 200ms beep
const CHIME_B64 = 'UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';

const playChime = () => {
  const audio = new Audio(`data:audio/wav;base64,${CHIME_B64}`);
  audio.play().catch(() => {}); // ignore autoplay policy errors
};

// Track order count to detect new orders
const prevCountRef = useRef(0);
useEffect(() => {
  if (!isMuted && orders.length > prevCountRef.current) {
    playChime();
  }
  prevCountRef.current = orders.length;
}, [orders.length, isMuted]);

// Mute toggle button
const [isMuted, setIsMuted] = useState(false);
// Add button in top-right corner of KDS:
<IconButton onClick={() => setIsMuted(m => !m)} size="small">
  {isMuted ? <VolumeOff /> : <VolumeUp />}
</IconButton>
```

**Step 4: Add fullscreen support**

```tsx
const handleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
};

// F key shortcut
useEffect(() => {
  const onKey = (e: KeyboardEvent) => { if (e.key === 'F') handleFullscreen(); };
  window.addEventListener('keydown', onKey);
  return () => window.removeEventListener('keydown', onKey);
}, []);

// Fullscreen button in top bar:
<IconButton onClick={handleFullscreen}><Fullscreen /></IconButton>
```

**Step 5: Make bump button large (48×48px)**

```tsx
<Button
  variant="contained"
  color="success"
  onClick={() => handleBump(order.id)}
  sx={{ minWidth: 48, minHeight: 48, p: 0, fontSize: '1.5rem' }}
>
  ▶
</Button>
```

**Step 6: Typography increase**

In KDS component, increase base font size:
```tsx
<Box sx={{ fontSize: '1rem' }}>  {/* base 16px instead of 14px */}
  <Typography variant="h6" sx={{ fontSize: '1.5rem', fontWeight: 700 }}>
    #{order.orderNumber}
  </Typography>
  {order.items.map(item => (
    <Typography key={item.id} sx={{ fontSize: '1rem' }}>
      {item.quantity}× {item.name}
    </Typography>
  ))}
</Box>
```

**Step 7: Build and commit**

```bash
cd frontend && npm run build
git add frontend/src/pages/kitchen/KitchenDisplayPage.tsx
git commit -m "feat(kitchen): full KDS revamp — summary bar, urgency colors, sound alerts, fullscreen, larger bump button"
```

---

## Task 3.5: Driver Assignment Modal

**Files:**
- Modify: `frontend/src/pages/manager/OrderManagementPage.tsx`
- Create: `frontend/src/components/manager/AssignDriverModal.tsx`

**Step 1: Create AssignDriverModal component**

```tsx
// frontend/src/components/manager/AssignDriverModal.tsx
import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button,
         TextField, List, ListItem, ListItemText, ListItemButton, Chip, CircularProgress } from '@mui/material';

interface Driver {
  id: string;
  name: string;
  available: boolean;
  currentOrders: number;
}

interface AssignDriverModalProps {
  open: boolean;
  orderId: string;
  onClose: () => void;
  onAssigned: (driverId: string, driverName: string) => void;
}

export const AssignDriverModal = ({ open, orderId, onClose, onAssigned }: AssignDriverModalProps) => {
  const [search, setSearch] = useState('');
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch(`/api/users?type=DRIVER&available=true&search=${search}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
    })
      .then(r => r.json())
      .then(data => setDrivers(data.content ?? data))
      .finally(() => setLoading(false));
  }, [open, search]);

  const handleAssign = async (driver: Driver) => {
    setAssigning(driver.id);
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ assignedDriverId: driver.id })
      });
      onAssigned(driver.id, driver.name);
      onClose();
    } finally {
      setAssigning(null);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Assign Driver</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          placeholder="Search drivers..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{ mb: 2, mt: 1 }}
        />
        {loading ? <CircularProgress /> : (
          <List>
            {drivers.map(driver => (
              <ListItem key={driver.id} disablePadding>
                <ListItemButton onClick={() => handleAssign(driver)} disabled={!driver.available || !!assigning}>
                  <ListItemText
                    primary={driver.name}
                    secondary={`${driver.currentOrders} active orders`}
                  />
                  <Chip
                    label={driver.available ? 'Available' : 'Busy'}
                    color={driver.available ? 'success' : 'default'}
                    size="small"
                  />
                  {assigning === driver.id && <CircularProgress size={20} sx={{ ml: 1 }} />}
                </ListItemButton>
              </ListItem>
            ))}
            {drivers.length === 0 && !loading && (
              <ListItem><ListItemText primary="No available drivers found" /></ListItem>
            )}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
};
```

**Step 2: Replace window.prompt in OrderManagementPage.tsx**

Find `window.prompt` in `OrderManagementPage.tsx`. Replace with:

```tsx
// State for modal
const [assignDriverModal, setAssignDriverModal] = useState<{ open: boolean; orderId: string }>({
  open: false,
  orderId: ''
});

// Replace window.prompt call with:
const handleAssignDriver = (orderId: string) => {
  setAssignDriverModal({ open: true, orderId });
};

// In JSX, add modal:
<AssignDriverModal
  open={assignDriverModal.open}
  orderId={assignDriverModal.orderId}
  onClose={() => setAssignDriverModal({ open: false, orderId: '' })}
  onAssigned={(driverId, driverName) => {
    // Refresh order list
    refetch();
    console.log(`Driver ${driverName} assigned to order ${assignDriverModal.orderId}`);
  }}
/>
```

**Step 3: Build and commit**

```bash
cd frontend && npm run build
git add frontend/src/components/manager/AssignDriverModal.tsx
git add frontend/src/pages/manager/OrderManagementPage.tsx
git commit -m "feat(manager): replace window.prompt driver assignment with proper modal"
```

---

## Task 3.6: Real Driver Rating Submission

**Files:**
- Modify: `frontend/src/pages/customer/LiveTrackingPage.tsx`

**Step 1: Read LiveTrackingPage.tsx**

Find the driver rating submit handler. It currently calls `console.log(rating)`.

**Step 2: Replace console.log with real API call**

```tsx
const handleSubmitDriverRating = async (rating: number, comment: string) => {
  if (!order?.assignedDriverId || !order?.id) return;

  try {
    await fetch('/api/reviews', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify({
        orderId: order.id,
        entityType: 'DRIVER',
        entityId: order.assignedDriverId,
        rating,
        comment,
        customerId: currentCustomer?.id
      })
    });
    setRatingSubmitted(true);
  } catch (e) {
    console.error('Failed to submit driver rating:', e);
    // Show error toast
    setRatingError('Could not submit rating. Please try again.');
  }
};
```

**Step 3: Build and commit**

```bash
cd frontend && npm run build
git add frontend/src/pages/customer/LiveTrackingPage.tsx
git commit -m "fix(customer): replace console.log driver rating with real POST /api/reviews call"
```

---

## Task 3.7: OTP Proof-of-Delivery (Backend + Frontend)

**Files:**
- Modify: `commerce-service/src/main/java/com/MaSoVa/commerce/order/service/OrderService.java`
- Modify: `logistics-service/src/main/java/com/MaSoVa/logistics/delivery/service/TrackingService.java`
- Modify: `frontend/src/pages/customer/LiveTrackingPage.tsx`
- Modify: `masova-mobile/src/screens/driver/DeliveryScreen.tsx` (or whatever the driver delivery screen is called)

**Step 1: Generate OTP on DISPATCHED transition (backend)**

In `OrderService.updateOrderStatus()`, when status transitions to DISPATCHED:

```java
if (OrderStatus.DISPATCHED.equals(request.getStatus())) {
    // Generate 4-digit OTP
    String otp = String.format("%04d", new Random().nextInt(10000));

    // Store in Redis with 30min TTL
    redisTemplate.opsForValue().set(
        "otp:" + savedOrder.getId(),
        otp,
        30,
        java.util.concurrent.TimeUnit.MINUTES
    );

    log.info("OTP generated for order {}: {}", savedOrder.getOrderNumber(), otp);

    // Send OTP to customer via notification
    try {
        customerNotificationService.sendOtpNotification(
            savedOrder.getCustomerId(),
            savedOrder.getOrderNumber(),
            otp
        );
    } catch (Exception e) {
        log.warn("Failed to send OTP notification for order {}: {}", savedOrder.getOrderNumber(), e.getMessage());
    }
}
```

Wire `RedisTemplate<String, String>` into `OrderService` constructor.

**Step 2: Verify delivery OTP endpoint in logistics-service**

`POST /api/delivery/verify-otp` should:
1. Get `orderId` and `otp` from request body
2. Fetch `otp:{orderId}` from Redis
3. Compare — if match, return success; if not, return 400 error
4. On success: delete the Redis key (OTP consumed)

Read the existing `verify-otp` endpoint implementation. If it's a stub, implement it:

```java
@PostMapping("/verify-otp")
public ResponseEntity<?> verifyOtp(@RequestBody VerifyOtpRequest request) {
    String storedOtp = redisTemplate.opsForValue().get("otp:" + request.getOrderId());
    if (storedOtp == null) {
        return ResponseEntity.badRequest().body(Map.of("error", "OTP expired or not found"));
    }
    if (!storedOtp.equals(request.getOtp())) {
        return ResponseEntity.badRequest().body(Map.of("error", "Invalid OTP"));
    }
    // Consume the OTP
    redisTemplate.delete("otp:" + request.getOrderId());
    return ResponseEntity.ok(Map.of("verified", true));
}
```

**Step 3: Show OTP on customer LiveTrackingPage**

When order status is `DISPATCHED`, show OTP in a prominent box:

```tsx
{order?.status === 'DISPATCHED' && order?.deliveryOtp && (
  <Box sx={{ border: '2px solid #4CAF50', borderRadius: 2, p: 2, mt: 2, textAlign: 'center' }}>
    <Typography variant="caption" color="text.secondary">Delivery OTP — share with driver</Typography>
    <Typography variant="h3" fontWeight={700} letterSpacing={8} color="success.main">
      {order.deliveryOtp}
    </Typography>
    <Typography variant="caption" color="text.secondary">Valid for 30 minutes</Typography>
  </Box>
)}
```

Note: `deliveryOtp` must be included in the order response from the backend when status is DISPATCHED. Add it to the Order entity if not present — it should only be set/sent when status is DISPATCHED.

**Step 4: Add OTP input screen to Driver App (React Native)**

In `masova-mobile` (or `MaSoVaDriverApp`), find the delivery completion flow. Before calling `POST /api/delivery/advance` with status DELIVERED, show OTP input:

```tsx
// OtpVerificationScreen.tsx
const OtpVerificationScreen = ({ orderId, onVerified }: { orderId: string; onVerified: () => void }) => {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/delivery/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderId, otp })
      });
      if (res.ok) {
        onVerified();
      } else {
        setError('Invalid OTP. Please ask the customer for the correct code.');
      }
    } catch (e) {
      setError('Connection error. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter Delivery OTP</Text>
      <Text style={styles.subtitle}>Ask the customer for their 4-digit OTP</Text>
      <TextInput
        style={styles.otpInput}
        value={otp}
        onChangeText={setOtp}
        keyboardType="numeric"
        maxLength={4}
        placeholder="0000"
        textAlign="center"
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity
        style={[styles.verifyButton, loading && styles.disabled]}
        onPress={handleVerify}
        disabled={otp.length !== 4 || loading}
      >
        <Text style={styles.verifyText}>{loading ? 'Verifying...' : 'Verify & Complete Delivery'}</Text>
      </TouchableOpacity>
    </View>
  );
};
```

**Step 5: Build backend services**

```powershell
cd commerce-service && mvn compile "-Dmaven.test.skip=true"
cd logistics-service && mvn compile "-Dmaven.test.skip=true"
```

**Step 6: Build frontend**

```bash
cd frontend && npm run build
```

**Step 7: Commit**

```bash
git add commerce-service/src/main/java/com/MaSoVa/commerce/order/service/OrderService.java
git add logistics-service/src/main/java/com/MaSoVa/logistics/delivery/
git add frontend/src/pages/customer/LiveTrackingPage.tsx
git add masova-mobile/src/screens/  # or MaSoVaDriverApp path
git commit -m "feat: OTP proof-of-delivery — generate on DISPATCHED, show on customer page, verify before DELIVERED"
```

---

## Task 3.8: Verify DeliveryManagementPage + DriverManagementPage Routing

**Files:**
- Read: `frontend/src/shell/ManagerShell.tsx`
- Read: `frontend/src/pages/manager/DeliveryManagementPage.tsx`
- Read: `frontend/src/pages/manager/DriverManagementPage.tsx`

**Step 1: Check routing in ManagerShell.tsx**

Look for routes to DeliveryManagementPage and DriverManagementPage. Verify they exist:
```tsx
<Route path="/manager/delivery" element={<DeliveryManagementPage />} />
<Route path="/manager/drivers" element={<DriverManagementPage />} />
```

**Step 2: Check navigation links in sidebar**

Verify the manager sidebar has links to both pages. If not, add them.

**Step 3: Remove .bak files**

```bash
find frontend/src -name "*.bak" -type f
```

If `.bak` versions of these files exist, delete them (they're stale copies):
```bash
rm frontend/src/pages/manager/DeliveryManagementPage.tsx.bak
rm frontend/src/pages/manager/DriverManagementPage.tsx.bak
```

**Step 4: Build and commit**

```bash
cd frontend && npm run build
git add frontend/src/shell/ManagerShell.tsx
git rm frontend/src/pages/manager/*.bak 2>/dev/null || true
git commit -m "fix(manager): verify delivery/driver management page routing, remove .bak files"
```

---

## Execution Notes

### Order of Tasks (must respect dependencies)
1. Task 3.1 — Backend (compile on Dell, no frontend dependency)
2. Task 3.2 — Frontend DINE_IN (no backend change needed, uses existing status values)
3. Task 3.3 — Frontend checkout prices (independent)
4. Task 3.4 — KDS revamp (independent, frontend only)
5. Task 3.5 — Driver modal (independent, frontend only)
6. Task 3.6 — Driver rating (independent, uses existing API)
7. Task 3.7 — OTP flow (backend + frontend + mobile, most complex — do last)
8. Task 3.8 — Routing cleanup (fast, do anytime)

### Backend Tasks (Dell)
Tasks 3.1 and 3.7 (backend parts) must be done on Dell. Frontend tasks (3.2–3.6, 3.8) on Mac.

### Testing Each Fix
Each task should be manually tested in the browser after build. Use the seeded test data (5 stores, 3 managers, 15 users).
