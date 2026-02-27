# MaSoVa Restaurant Management System - Multi-Issue Fix Plan

## Executive Summary

This plan addresses four interconnected issues in the MaSoVa system:
1. **FilterBar Overflow** - UI layout issue on Order Management page
2. **Staff Sessions Not Displaying** - Clock-in sessions invisible after creation
3. **Metrics Not Updating (ROOT CAUSE)** - Pickup/POS orders bypass proper staging
4. **KDS Design Documentation** - Clarify staging for different order types

**Critical Finding**: The user identified that pickup (TAKEAWAY) and POS (DINE_IN) orders are not flowing through proper status stages, causing analytics metrics to fail to update.

---

## Issue 1: FilterBar Overflow Fix

### Problem
The FilterBar component stretches to full viewport width while other sections (stats-grid, controls-section, orders-section) are constrained to 1400px, causing overflow on wide screens.

### Root Cause
- FilterBar missing `max-width: 1400px` and `margin: 0 auto` constraints
- Located at `/frontend/src/components/common/FilterBar.tsx` line 374

### Solution
Add width constraints to match other page sections.

### Implementation Steps

**File**: `/frontend/src/components/common/FilterBar.tsx`

**Change at line 373-379** (the container div):
```tsx
// CURRENT:
<div style={{
  ...surface,
  padding: '1.5rem',
  marginBottom: '1.5rem',
}}>

// CHANGE TO:
<div style={{
  ...surface,
  padding: '1.5rem',
  marginBottom: '1.5rem',
  maxWidth: '1400px',        // ADD THIS
  margin: '0 auto 1.5rem auto', // CHANGE THIS
}}>
```

**Add responsive breakpoint** (after line 517, in the same file if using styled components, or in neumorphic-globals.css):
```css
@media (max-width: 768px) {
  .filter-bar-container {
    padding: 1rem;
    max-width: 100%;
  }
}
```

### Testing
1. Open `/manager/orders` page
2. Verify FilterBar is centered and doesn't exceed 1400px on wide screens
3. Verify responsive behavior on mobile (below 768px width)
4. Confirm filters stack properly on smaller screens

---

## Issue 2: Staff Sessions Not Displaying After Clock-In

### Problem
When managers clock in staff members via ClockInModal, the active/previous sessions don't appear immediately on the Staff Management page.

### Root Causes
1. **Backend**: `employeeName` not populated during session creation (WorkingSessionService.java line 82)
2. **Backend**: Double save inefficiency - session saved twice (lines 97 and 145)
3. **Frontend**: 30-second polling interval delays visibility
4. **Frontend**: No manual refetch after successful clock-in

### Solution
Fix backend session creation + trigger immediate refetch on frontend.

### Implementation Steps

#### Backend Fix 1: Populate employeeName During Session Creation

**File**: `/user-service/src/main/java/com/MaSoVa/user/service/WorkingSessionService.java`

**Modify `startSession()` method at line 50-97**:

```java
public WorkingSession startSession(String employeeId, String storeId) {
    return startSessionWithLocation(employeeId, storeId, null);
}

public WorkingSession startSessionWithLocation(String employeeId, String storeId, Location clockInLocation) {
    LocalDateTime startTime = LocalDateTime.now();

    // Step 1: Handle any existing active sessions
    handleExistingActiveSessions(employeeId, startTime);

    // **NEW: Get employee details FIRST to populate employeeName**
    User employee = userRepository.findById(employeeId)
        .orElseThrow(() -> new IllegalArgumentException("Employee not found: " + employeeId));

    String employeeName = (employee.getPersonalInfo() != null)
        ? employee.getPersonalInfo().getName()
        : employee.getEmail(); // Fallback to email if name not set

    // Step 2: Validate shift and business rules
    ShiftValidationResult validation = shiftValidationService
        .validateSessionStart(employeeId, storeId, startTime);

    // Step 3: Validate store operational status (only if store exists)
    if (storeId != null && !storeId.trim().isEmpty()) {
        try {
            if (!storeService.validateStoreOperational(storeId)) {
                throw new RuntimeException("Store is not operational");
            }
        } catch (RuntimeException e) {
            if (e.getMessage().contains("Store not found")) {
                // Allow login to proceed without store validation
            } else {
                throw e;
            }
        }
    }

    // Step 4: Create new session WITH employeeName
    WorkingSession session = new WorkingSession(employeeId, storeId, startTime);
    session.setEmployeeName(employeeName);  // **ADD THIS LINE**

    if (validation.getShift() != null) {
        session.setShiftId(validation.getShift().getId());
    }

    if (clockInLocation != null) {
        session.setClockInLocation(clockInLocation);
        validateClockInLocation(session, storeId, clockInLocation);
    }

    if ("WARNING".equals(validation.getSeverity())) {
        session.addViolation(new SessionViolation("UNSCHEDULED_SHIFT", validation.getMessage()));
    }

    return sessionRepository.save(session); // Single save, not double
}
```

#### Backend Fix 2: Remove Duplicate Save in clockInWithPin

**File**: `/user-service/src/main/java/com/MaSoVa/user/service/WorkingSessionService.java`

**Modify `clockInWithPin()` method at line 103-146**:

```java
public WorkingSession clockInWithPin(String employeeId, String pin, String storeId, String managerId) {
    // Validate employee exists and has PIN set
    User employee = userRepository.findById(employeeId)
        .orElseThrow(() -> new IllegalArgumentException("Employee not found"));

    // Validate employee is actually an employee type
    if (!employee.isEmployee()) {
        throw new IllegalArgumentException("User is not an employee");
    }

    // Validate employee has PIN set
    if (employee.getEmployeeDetails() == null ||
        employee.getEmployeeDetails().getEmployeePINHash() == null) {
        throw new IllegalArgumentException("Employee PIN not set. Please contact administrator.");
    }

    // Verify PIN
    if (!passwordEncoder.matches(pin, employee.getEmployeeDetails().getEmployeePINHash())) {
        throw new IllegalArgumentException("Invalid PIN");
    }

    // Check if employee already has active session
    Optional<WorkingSession> existingSession = getSafeActiveSession(employeeId);
    if (existingSession.isPresent()) {
        throw new IllegalArgumentException("Employee already has an active session");
    }

    // CRITICAL FIX: Use employee's storeId from their profile, not from request header
    String employeeStoreId = employee.getEmployeeDetails().getStoreId();
    if (employeeStoreId == null || employeeStoreId.isEmpty()) {
        employeeStoreId = storeId; // Fallback to header storeId if employee has no store
    }

    // Start session with employee's actual storeId
    // employeeName is now set inside startSession, so no need to set it again
    WorkingSession session = startSession(employeeId, employeeStoreId);

    // Add note that manager initiated clock-in
    session.setNotes("Clocked in by manager: " + managerId);

    // REMOVE THIS LINE (already saved in startSession):
    // return sessionRepository.save(session);

    // UPDATE: Save only once with notes
    return sessionRepository.save(session);
}
```

#### Frontend Fix 1: Add Manual Refetch After Clock-In

**File**: `/frontend/src/apps/POSSystem/components/ClockInModal.tsx`

**Locate the `handleClockIn` function** (likely around line 100-150):

```tsx
// FIND THIS SECTION:
const handleClockIn = async () => {
  // ... validation code ...

  try {
    await clockInWithPin({
      employeeId: validatedEmployee.id,
      pin: employeePin,
      authorizedBy: validatedManager?.id,
    }).unwrap();

    toast.success(`✅ ${validatedEmployee.name} clocked in successfully`);

    // **ADD THIS LINE - Force refetch sessions immediately**
    if (refetchSessions) {
      refetchSessions();
    }

    handleClose();
  } catch (error) {
    // error handling...
  }
};
```

**Add refetchSessions prop to ClockInModal component**:

```tsx
// At component definition:
interface ClockInModalProps {
  open: boolean;
  onClose: () => void;
  refetchSessions?: () => void; // ADD THIS
}

export const ClockInModal: React.FC<ClockInModalProps> = ({
  open,
  onClose,
  refetchSessions, // ADD THIS
}) => {
  // ... component code ...
}
```

**File**: `/frontend/src/pages/manager/StaffManagementPage.tsx`

**Pass refetch function to ClockInModal** (around line 250-300 where modal is rendered):

```tsx
// FIND WHERE ClockInModal IS USED:
<ClockInModal
  open={clockInModalOpen}
  onClose={() => setClockInModalOpen(false)}
  refetchSessions={() => {
    // Refetch both active and all sessions
    refetch(); // This refetches useGetStoreSessionsQuery
  }}
/>
```

**Also extract the refetch function from the query** (around line 97-103):

```tsx
// CHANGE:
const { data: allSessions = [], isLoading: sessionsLoading } = useGetStoreSessionsQuery(
  { date: today },
  {
    skip: !storeId,
    pollingInterval: 30000,
  }
);

// TO:
const {
  data: allSessions = [],
  isLoading: sessionsLoading,
  refetch  // ADD THIS
} = useGetStoreSessionsQuery(
  { date: today },
  {
    skip: !storeId,
    pollingInterval: 30000,
  }
);
```

#### Frontend Fix 2: Add Manual Refresh Button

**File**: `/frontend/src/pages/manager/StaffManagementPage.tsx`

**Add a refresh button in the header section** (around line 400-450 where session stats are displayed):

```tsx
// ADD THIS AFTER THE SESSION COUNT DISPLAY:
<div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
  <div>Active Sessions: {activeSessionCount}</div>
  <div>Completed Today: {completedSessionCount}</div>

  {/* NEW: Manual Refresh Button */}
  <Button
    onClick={() => refetch()}
    disabled={sessionsLoading}
    style={{ minWidth: '100px' }}
  >
    {sessionsLoading ? 'Refreshing...' : '🔄 Refresh'}
  </Button>
</div>
```

### Testing
1. Clock in a staff member via POS ClockInModal
2. Verify session appears immediately in Staff Management page (no 30s wait)
3. Test manual refresh button functionality
4. Verify employeeName is populated correctly
5. Check that sessions show in correct store (no store ID mismatch)

---

## Issue 3: Metrics Not Updating - CRITICAL ROOT CAUSE

### Problem
**User Insight**: "Pickup orders and POS-related orders are not going through proper staging, which is why metric cards are not getting updated in /manager/orders page and POS analytics metrics."

### Root Cause Analysis

**Current Status Flow**:
- All orders created with status `RECEIVED` (line 146 in OrderService.java)
- Kitchen Display System (KDS) expects 5-stage flow: RECEIVED → PREPARING → OVEN → BAKED → DISPATCHED
- **BUT**: TAKEAWAY (pickup) and DINE_IN (POS) orders may be:
  - Marked as COMPLETED immediately without going through stages
  - Or skipping intermediate stages (no oven for drinks, no dispatch for dine-in)
- Analytics Service calculates metrics based on status transitions
- **If orders skip stages or complete immediately, analytics queries fail**

**Order Types**:
1. `DELIVERY` - Full 5-stage flow through KDS → DISPATCHED → DELIVERED
2. `TAKEAWAY` - Should go: RECEIVED → PREPARING → READY (skip OVEN/BAKED?) → COMPLETED (customer picks up)
3. `DINE_IN` - Should go: RECEIVED → PREPARING → READY → SERVED (skip delivery entirely)

### Solution Strategy

**Option A: Unified Staging** (Recommended)
All order types flow through KDS with same stages, but:
- DELIVERY: Full flow ending in DISPATCHED → DELIVERED
- TAKEAWAY: Full flow ending in READY → COMPLETED (customer pickup)
- DINE_IN: Full flow ending in READY → SERVED

**Option B: Separate Flows**
Different staging per order type (complex, analytics needs to handle multiple flows)

**We'll implement Option A** for simplicity and consistent analytics.

### Implementation Steps

#### Step 1: Verify Current Status Enum

**File**: `/order-service/src/main/java/com/MaSoVa/order/entity/Order.java`

**Verify OrderStatus enum includes all needed statuses** (around line 290-303):

```java
public enum OrderStatus {
    RECEIVED,      // Initial state for all orders
    PREPARING,     // Kitchen started work
    OVEN,          // In oven (for items that need baking)
    BAKED,         // Finished baking
    READY,         // **ADD THIS IF MISSING** - Ready for pickup/serving
    DISPATCHED,    // Out for delivery (DELIVERY only)
    DELIVERED,     // Delivered to customer (DELIVERY only)
    SERVED,        // **ADD THIS IF MISSING** - Served to table (DINE_IN only)
    COMPLETED,     // Picked up by customer (TAKEAWAY only)
    CANCELLED      // Cancelled order
}
```

**If READY or SERVED are missing**, add them to the enum.

#### Step 2: Update OrderService Status Transitions

**File**: `/order-service/src/main/java/com/MaSoVa/order/service/OrderService.java`

**Find `updateOrderStatus` method** (likely around line 250-350):

**Add logic to validate status transitions based on order type**:

```java
@Transactional
@CacheEvict(value = "salesMetrics", allEntries = true)
public Order updateOrderStatus(String orderId, OrderStatus newStatus) {
    Order order = getOrderById(orderId);
    OrderStatus currentStatus = order.getStatus();

    // Validate status transition based on order type
    validateStatusTransition(order.getOrderType(), currentStatus, newStatus);

    order.setStatus(newStatus);

    // Update timestamps based on status
    updateStatusTimestamps(order, newStatus);

    Order updatedOrder = orderRepository.save(order);

    // Broadcast update
    webSocketController.sendKitchenQueueUpdate(updatedOrder.getStoreId(), updatedOrder);
    if (updatedOrder.getCustomerId() != null) {
        webSocketController.sendOrderUpdateToCustomer(updatedOrder.getCustomerId(), updatedOrder);
    }

    return updatedOrder;
}

private void validateStatusTransition(OrderType orderType, OrderStatus current, OrderStatus next) {
    // Define valid transitions per order type
    switch (orderType) {
        case DELIVERY:
            // RECEIVED → PREPARING → OVEN → BAKED → DISPATCHED → DELIVERED
            if (!isValidDeliveryTransition(current, next)) {
                throw new IllegalStateException("Invalid status transition for DELIVERY order: " + current + " → " + next);
            }
            break;
        case TAKEAWAY:
            // RECEIVED → PREPARING → OVEN → BAKED → READY → COMPLETED
            if (!isValidTakeawayTransition(current, next)) {
                throw new IllegalStateException("Invalid status transition for TAKEAWAY order: " + current + " → " + next);
            }
            break;
        case DINE_IN:
            // RECEIVED → PREPARING → OVEN → BAKED → READY → SERVED
            if (!isValidDineInTransition(current, next)) {
                throw new IllegalStateException("Invalid status transition for DINE_IN order: " + current + " → " + next);
            }
            break;
    }
}

private boolean isValidDeliveryTransition(OrderStatus current, OrderStatus next) {
    // DELIVERY: RECEIVED → PREPARING → OVEN → BAKED → DISPATCHED → DELIVERED
    Map<OrderStatus, List<OrderStatus>> validTransitions = Map.of(
        OrderStatus.RECEIVED, List.of(OrderStatus.PREPARING, OrderStatus.CANCELLED),
        OrderStatus.PREPARING, List.of(OrderStatus.OVEN, OrderStatus.READY, OrderStatus.CANCELLED),
        OrderStatus.OVEN, List.of(OrderStatus.BAKED, OrderStatus.CANCELLED),
        OrderStatus.BAKED, List.of(OrderStatus.DISPATCHED, OrderStatus.CANCELLED),
        OrderStatus.DISPATCHED, List.of(OrderStatus.DELIVERED, OrderStatus.CANCELLED),
        OrderStatus.DELIVERED, List.of() // Terminal state
    );
    return validTransitions.getOrDefault(current, List.of()).contains(next);
}

private boolean isValidTakeawayTransition(OrderStatus current, OrderStatus next) {
    // TAKEAWAY: RECEIVED → PREPARING → OVEN → BAKED → READY → COMPLETED
    Map<OrderStatus, List<OrderStatus>> validTransitions = Map.of(
        OrderStatus.RECEIVED, List.of(OrderStatus.PREPARING, OrderStatus.CANCELLED),
        OrderStatus.PREPARING, List.of(OrderStatus.OVEN, OrderStatus.READY, OrderStatus.CANCELLED),
        OrderStatus.OVEN, List.of(OrderStatus.BAKED, OrderStatus.CANCELLED),
        OrderStatus.BAKED, List.of(OrderStatus.READY, OrderStatus.CANCELLED),
        OrderStatus.READY, List.of(OrderStatus.COMPLETED, OrderStatus.CANCELLED),
        OrderStatus.COMPLETED, List.of() // Terminal state
    );
    return validTransitions.getOrDefault(current, List.of()).contains(next);
}

private boolean isValidDineInTransition(OrderStatus current, OrderStatus next) {
    // DINE_IN: RECEIVED → PREPARING → OVEN → BAKED → READY → SERVED
    Map<OrderStatus, List<OrderStatus>> validTransitions = Map.of(
        OrderStatus.RECEIVED, List.of(OrderStatus.PREPARING, OrderStatus.CANCELLED),
        OrderStatus.PREPARING, List.of(OrderStatus.OVEN, OrderStatus.READY, OrderStatus.CANCELLED),
        OrderStatus.OVEN, List.of(OrderStatus.BAKED, OrderStatus.CANCELLED),
        OrderStatus.BAKED, List.of(OrderStatus.READY, OrderStatus.CANCELLED),
        OrderStatus.READY, List.of(OrderStatus.SERVED, OrderStatus.CANCELLED),
        OrderStatus.SERVED, List.of() // Terminal state
    );
    return validTransitions.getOrDefault(current, List.of()).contains(next);
}

private void updateStatusTimestamps(Order order, OrderStatus newStatus) {
    LocalDateTime now = LocalDateTime.now();

    switch (newStatus) {
        case PREPARING:
            order.setPreparingStartedAt(now);
            break;
        case OVEN:
            order.setOvenStartedAt(now);
            break;
        case BAKED:
            order.setBakedAt(now);
            break;
        case READY:
            order.setReadyAt(now); // ADD THIS FIELD TO Order.java if missing
            break;
        case DISPATCHED:
            order.setDispatchedAt(now);
            break;
        case DELIVERED:
            order.setDeliveredAt(now);
            break;
        case SERVED:
            order.setServedAt(now); // ADD THIS FIELD TO Order.java if missing
            break;
        case COMPLETED:
            order.setCompletedAt(now); // ADD THIS FIELD TO Order.java if missing
            break;
    }
}
```

#### Step 3: Add Missing Timestamp Fields to Order Entity

**File**: `/order-service/src/main/java/com/MaSoVa/order/entity/Order.java`

**Add these fields** (around line 50-100 where other timestamps are):

```java
@Field("readyAt")
private LocalDateTime readyAt;  // When order is ready for pickup/serving

@Field("servedAt")
private LocalDateTime servedAt;  // When DINE_IN order is served to table

@Field("completedAt")
private LocalDateTime completedAt;  // When TAKEAWAY order is picked up

// Add getters and setters for these fields
```

#### Step 4: Update Analytics Service to Handle All Order Types

**File**: `/analytics-service/src/main/java/com/MaSoVa/analytics/service/AnalyticsService.java`

**Find the `getTodaySalesMetrics` method** (around line 50-150):

**Ensure it counts ALL order types properly**:

```java
public SalesMetricsResponse getTodaySalesMetrics(String storeId) {
    LocalDate today = LocalDate.now();
    LocalDateTime startOfDay = today.atStartOfDay();
    LocalDateTime endOfDay = today.atTime(23, 59, 59);

    // Fetch all orders for today
    List<Order> todayOrders = orderServiceClient.getStoreOrdersByDateRange(
        storeId, startOfDay, endOfDay
    );

    // Calculate metrics for ALL order types
    double totalSales = todayOrders.stream()
        .filter(order -> isCompletedOrder(order)) // **ADD THIS HELPER**
        .mapToDouble(order -> order.getTotal().doubleValue())
        .sum();

    long orderCount = todayOrders.stream()
        .filter(this::isCompletedOrder)
        .count();

    // Rest of the method...
}

/**
 * Check if order is completed based on its type
 */
private boolean isCompletedOrder(Order order) {
    switch (order.getOrderType()) {
        case DELIVERY:
            return order.getStatus() == OrderStatus.DELIVERED;
        case TAKEAWAY:
            return order.getStatus() == OrderStatus.COMPLETED;
        case DINE_IN:
            return order.getStatus() == OrderStatus.SERVED;
        default:
            return false;
    }
}
```

#### Step 5: Update Frontend Order Type Config

**File**: `/frontend/src/types/order.ts`

**Verify ORDER_TYPE_CONFIG includes all types**:

```typescript
export const ORDER_TYPE_CONFIG = {
  DELIVERY: {
    label: 'Delivery',
    icon: '🚗',
    color: '#3b82f6',
    finalStatus: 'DELIVERED',
  },
  TAKEAWAY: {
    label: 'Takeaway',
    icon: '🛍️',
    color: '#f59e0b',
    finalStatus: 'COMPLETED',
  },
  DINE_IN: {
    label: 'Dine In',
    icon: '🍽️',
    color: '#10b981',
    finalStatus: 'SERVED',
  },
};
```

#### Step 6: Update Frontend Status Config

**File**: `/frontend/src/types/order.ts`

**Add new statuses to ORDER_STATUS_CONFIG** if missing:

```typescript
export const ORDER_STATUS_CONFIG = {
  RECEIVED: { label: 'Received', color: '#6366f1', icon: '📋' },
  PREPARING: { label: 'Preparing', color: '#f59e0b', icon: '👨‍🍳' },
  OVEN: { label: 'In Oven', color: '#ef4444', icon: '🔥' },
  BAKED: { label: 'Baked', color: '#8b5cf6', icon: '✅' },
  READY: { label: 'Ready', color: '#10b981', icon: '✅' },  // ADD IF MISSING
  DISPATCHED: { label: 'Dispatched', color: '#3b82f6', icon: '🚗' },
  DELIVERED: { label: 'Delivered', color: '#22c55e', icon: '✅' },
  SERVED: { label: 'Served', color: '#22c55e', icon: '🍽️' },  // ADD IF MISSING
  COMPLETED: { label: 'Completed', color: '#22c55e', icon: '✅' },  // ADD IF MISSING
  CANCELLED: { label: 'Cancelled', color: '#ef4444', icon: '❌' },
};
```

#### Step 7: Update KDS to Show All Order Types

**File**: `/frontend/src/pages/kitchen/KitchenDisplayPage.tsx`

**Verify the KDS displays all order types** (around line 40-50 where columns are defined):

```tsx
const statusColumns: StatusColumn[] = [
  { status: 'RECEIVED', title: 'New Orders', icon: '📋', color: '#3b82f6' },
  { status: 'PREPARING', title: 'Preparing', icon: '👨‍🍳', color: '#f59e0b' },
  { status: 'OVEN', title: 'In Oven', icon: '🔥', color: '#e53e3e' },
  { status: 'BAKED', title: 'Ready', icon: '✅', color: '#10b981' },
  {
    status: 'DISPATCHED',
    title: 'Completed',  // Show all final statuses here
    icon: '✅',
    color: '#8b5cf6',
    // Include READY, SERVED, COMPLETED statuses
  },
];
```

**Modify order filtering logic** to show orders in correct columns:

```tsx
// Around line 150-200 where orders are filtered by status
const getOrdersForColumn = (status: string) => {
  if (status === 'DISPATCHED') {
    // Final column shows READY, DISPATCHED, SERVED, COMPLETED
    return localOrders.filter(order =>
      ['READY', 'DISPATCHED', 'SERVED', 'COMPLETED'].includes(order.status)
    );
  }
  return localOrders.filter(order => order.status === status);
};
```

### Testing

1. **Create DELIVERY order** in POS:
   - Verify it appears in KDS with RECEIVED status
   - Progress through: PREPARING → OVEN → BAKED → DISPATCHED → DELIVERED
   - Check metrics update at each stage

2. **Create TAKEAWAY order** in POS:
   - Verify it appears in KDS with RECEIVED status
   - Progress through: PREPARING → OVEN → BAKED → READY → COMPLETED
   - Check metrics update at each stage
   - Verify "Completed Orders" count increases

3. **Create DINE_IN order** in POS:
   - Verify it appears in KDS with RECEIVED status
   - Progress through: PREPARING → OVEN → BAKED → READY → SERVED
   - Check metrics update at each stage
   - Verify "Completed Orders" count increases

4. **Check Analytics**:
   - Verify `/manager/orders` metrics cards show correct totals
   - Verify POS Analytics metrics cards update in real-time
   - Check that completed order count includes all types

---

## Issue 4: KDS Design Documentation

### Current State
The KDS is already implemented with a 5-stage visual kanban board at `/frontend/src/pages/kitchen/KitchenDisplayPage.tsx`:
- Polling-based updates (5-30 second intervals)
- WebSocket fallback available but not primary
- Visual oven timers (7-minute countdown)
- Priority indicators (⚡ for URGENT)

### Documentation Needed

Create documentation file: `/imp_docs/KDS_DESIGN_SPECIFICATION.md`

**Content**:
```markdown
# Kitchen Display System (KDS) Design Specification

## Overview
The KDS is a real-time visual dashboard for kitchen staff to manage order preparation across all order types.

## Status Flow by Order Type

### DELIVERY Orders
RECEIVED → PREPARING → OVEN → BAKED → DISPATCHED → DELIVERED

**Stages**:
1. **RECEIVED** - Order received from customer/POS
2. **PREPARING** - Kitchen started preparation
3. **OVEN** - Items in oven (7-minute timer)
4. **BAKED** - Finished baking
5. **DISPATCHED** - Out for delivery
6. **DELIVERED** - Delivered to customer (final)

### TAKEAWAY Orders
RECEIVED → PREPARING → OVEN → BAKED → READY → COMPLETED

**Stages**:
1-4. Same as DELIVERY
5. **READY** - Ready for customer pickup
6. **COMPLETED** - Customer picked up (final)

### DINE_IN Orders
RECEIVED → PREPARING → OVEN → BAKED → READY → SERVED

**Stages**:
1-4. Same as DELIVERY
5. **READY** - Ready to serve
6. **SERVED** - Served to table (final)

## Metrics Calculation
Analytics service counts completed orders based on final status:
- DELIVERY: status = DELIVERED
- TAKEAWAY: status = COMPLETED
- DINE_IN: status = SERVED

## Real-Time Updates
- Primary: Polling (10-30 second intervals)
- Secondary: WebSocket (fallback when connection stable)
- Manual refresh available on all dashboards
```

---

## Implementation Order

1. **FilterBar Fix** (15 minutes) - Quick win, improves UX immediately
2. **Staff Sessions Fix** (45 minutes) - Backend + Frontend changes
3. **Order Status Flow Fix** (2-3 hours) - Critical for metrics, requires careful testing
4. **KDS Documentation** (30 minutes) - Document the final design

## Critical Files to Modify

### Backend
1. `/order-service/src/main/java/com/MaSoVa/order/entity/Order.java` - Add READY, SERVED, COMPLETED statuses and timestamps
2. `/order-service/src/main/java/com/MaSoVa/order/service/OrderService.java` - Add status validation logic
3. `/analytics-service/src/main/java/com/MaSoVa/analytics/service/AnalyticsService.java` - Update isCompletedOrder logic
4. `/user-service/src/main/java/com/MaSoVa/user/service/WorkingSessionService.java` - Fix employeeName population

### Frontend
1. `/frontend/src/components/common/FilterBar.tsx` - Add max-width constraints
2. `/frontend/src/pages/manager/StaffManagementPage.tsx` - Add refetch on clock-in
3. `/frontend/src/apps/POSSystem/components/ClockInModal.tsx` - Pass refetch callback
4. `/frontend/src/types/order.ts` - Add new status configs
5. `/frontend/src/pages/kitchen/KitchenDisplayPage.tsx` - Update column filtering logic

---

## Post-Implementation Verification

### FilterBar
- [ ] FilterBar centered on wide screens
- [ ] Max width 1400px maintained
- [ ] Responsive on mobile

### Staff Sessions
- [ ] Sessions appear immediately after clock-in
- [ ] employeeName populated correctly
- [ ] Manual refresh button works
- [ ] No store ID mismatch

### Metrics & Staging
- [ ] DELIVERY orders flow through full staging
- [ ] TAKEAWAY orders reach COMPLETED status
- [ ] DINE_IN orders reach SERVED status
- [ ] Metrics update in real-time on /manager/orders
- [ ] POS analytics metrics update correctly
- [ ] All order types counted in analytics

### KDS
- [ ] All order types visible in KDS
- [ ] Status progression buttons work for all types
- [ ] Final column shows READY/DISPATCHED/SERVED/COMPLETED orders
- [ ] Documentation created and accurate

---

## Risk Mitigation

1. **Database Migration**: New status enum values (READY, SERVED, COMPLETED) are additive - no breaking changes
2. **Backward Compatibility**: Existing orders with old statuses will continue to work
3. **Analytics**: Old completed orders may show as DELIVERED only, but new orders will flow correctly
4. **Testing**: Test each order type individually before deploying

---

## Success Criteria

✅ FilterBar no longer overflows page width
✅ Staff sessions visible immediately after clock-in
✅ All order types (DELIVERY, TAKEAWAY, DINE_IN) flow through proper stages
✅ Metrics cards update in real-time for all order types
✅ KDS displays all order types correctly
✅ Analytics service calculates totals accurately
✅ Documentation exists for KDS design
