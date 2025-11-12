# Test Cases: Phases 4-5

**Document:** 03-phases-4-5-tests.md
**Covers:** Order Management System & Payment Integration
**Test Priority:** CRITICAL (Core business functions)

---

## 📋 Table of Contents

1. [Phase 4: Order Management System](#phase-4-order-management-system)
2. [Phase 5: Payment Integration](#phase-5-payment-integration)

---

## Phase 4: Order Management System

### 🎯 Test Scope
- Order creation & lifecycle (6 stages)
- Kitchen queue management
- WebSocket real-time updates
- Order modification & cancellation
- Priority management
- Predictive notifications

### 4.1 Order Creation Tests

#### TC-4.1.1: Create Order - Successful Flow
**Priority:** CRITICAL
**Preconditions:** Customer logged in, menu items available, Order Service running

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | POST `/api/orders` with valid order data | 201 Created, order object returned | ☐ |
| 2 | Verify order number generated | Format: ORD + timestamp + random | ☐ |
| 3 | Check order status | RECEIVED | ☐ |
| 4 | Verify calculations (subtotal, tax, delivery, total) | Tax=5%, Delivery=₹50 (if delivery), Total correct | ☐ |
| 5 | Check order saved in database | Order exists with all details | ☐ |
| 6 | Verify WebSocket broadcast | Kitchen queue updated | ☐ |

**Test Data:**
```json
{
  "customerId": "cust-001",
  "customerName": "John Doe",
  "customerPhone": "+919876543210",
  "storeId": "store-001",
  "orderType": "DELIVERY",
  "paymentMethod": "ONLINE",
  "items": [
    {
      "menuItemId": "item-001",
      "name": "Margherita Pizza",
      "quantity": 2,
      "price": 299.00
    },
    {
      "menuItemId": "item-002",
      "name": "Chicken Biryani",
      "quantity": 1,
      "price": 349.00
    }
  ],
  "deliveryAddress": {
    "street": "123 Main St",
    "city": "Bangalore",
    "state": "Karnataka",
    "pincode": "560001"
  },
  "specialInstructions": "Extra spicy"
}
```

**Expected Calculations:**
- Subtotal: (299 × 2) + (349 × 1) = ₹947
- Delivery Fee: ₹50 (for DELIVERY type)
- Tax (5%): ₹47.35
- **Total: ₹1044.35**

**Acceptance Criteria:**
- ✅ Order created successfully
- ✅ All calculations correct
- ✅ Order number unique
- ✅ WebSocket notification sent
- ✅ Quality checkpoints initialized (4 default)
- ✅ Prep time estimated (15min + 5min/item)

---

#### TC-4.1.2: Order Validation - Stock Availability
**Priority:** CRITICAL
**Preconditions:** Menu Service running, stock tracking enabled

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Try to order unavailable menu item | 400 Bad Request, "Item not available" | ☐ |
| 2 | Try to order item with invalid ID | 400 Bad Request, "Invalid menu item" | ☐ |
| 3 | Check MenuServiceClient called | Availability verified before order creation | ☐ |

**Acceptance Criteria:**
- ✅ Stock validation working
- ✅ Unavailable items rejected
- ✅ Clear error messages

---

#### TC-4.1.3: Order Validation - Price Verification
**Priority:** HIGH
**Preconditions:** Menu Service running

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Try to order with incorrect price | 400 Bad Request, "Invalid price" | ☐ |
| 2 | Try to order with manipulated price (₹10 for ₹299 item) | Order rejected | ☐ |
| 3 | Order with correct price | Order accepted | ☐ |

**Acceptance Criteria:**
- ✅ Price validation against menu service
- ✅ Price manipulation prevented
- ✅ Order creation only with valid prices

---

#### TC-4.1.4: Order Validation - Input Validation
**Priority:** HIGH

**Test invalid inputs:**

| Invalid Input | Expected Error | Status |
|---------------|----------------|--------|
| Empty items array | "At least one item required" | ☐ |
| Missing customer name | "Customer name required" | ☐ |
| Invalid phone number | "Invalid phone format" | ☐ |
| Missing delivery address (for DELIVERY type) | "Delivery address required" | ☐ |
| Invalid order type | "Invalid order type" | ☐ |

**Acceptance Criteria:**
- ✅ All validations working
- ✅ Clear error messages
- ✅ 400 Bad Request returned

---

### 4.2 Order Lifecycle Tests

#### TC-4.2.1: Order Status Transitions - Happy Path
**Priority:** CRITICAL
**Preconditions:** Order created with status RECEIVED

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | PATCH status to PREPARING | Status updated, preparingStartedAt timestamp set | ☐ |
| 2 | PATCH status to OVEN | Status updated, ovenStartedAt timestamp set | ☐ |
| 3 | PATCH status to BAKED | Status updated, bakedAt timestamp, actual prep time calculated | ☐ |
| 4 | PATCH status to DISPATCHED | Status updated, dispatchedAt timestamp set | ☐ |
| 5 | PATCH status to DELIVERED | Status updated, deliveredAt timestamp, completedAt set | ☐ |
| 6 | Verify WebSocket sent for each transition | Kitchen/customer notified | ☐ |

**API Endpoint:**
```bash
PATCH /api/orders/{orderId}/status
{
  "status": "PREPARING"
}
```

**Acceptance Criteria:**
- ✅ All transitions successful
- ✅ Timestamps recorded correctly
- ✅ Actual prep time calculated (RECEIVED → BAKED)
- ✅ Actual oven time calculated (OVEN → BAKED)
- ✅ WebSocket broadcasts working

---

#### TC-4.2.2: Status Transition Validation
**Priority:** HIGH
**Preconditions:** Order exists

**Test invalid transitions:**

| Current Status | Invalid Next Status | Expected Error | Status |
|----------------|---------------------|----------------|--------|
| DELIVERED | Any status | "Cannot update completed order" | ☐ |
| CANCELLED | Any status | "Cannot update cancelled order" | ☐ |
| RECEIVED | DISPATCHED | "Invalid status transition" | ☐ |
| PREPARING | DELIVERED | "Invalid status transition" | ☐ |

**Valid backward transitions (corrections):**

| Current Status | Valid Backward Status | Status |
|----------------|----------------------|--------|
| PREPARING | RECEIVED | ☐ |
| OVEN | PREPARING | ☐ |
| BAKED | OVEN | ☐ |

**Acceptance Criteria:**
- ✅ Invalid transitions rejected
- ✅ Backward transitions allowed for corrections
- ✅ Completed orders immutable

---

#### TC-4.2.3: Next Stage Shortcut
**Priority:** MEDIUM
**Preconditions:** Order in PREPARING status

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | PATCH `/api/orders/{orderId}/next-stage` | Status moves to OVEN | ☐ |
| 2 | Call again | Status moves to BAKED | ☐ |
| 3 | Continue until DELIVERED | Each transition succeeds | ☐ |
| 4 | Try next-stage on DELIVERED order | 400 Bad Request, "Already in final stage" | ☐ |

**Acceptance Criteria:**
- ✅ Next-stage shortcut working
- ✅ All transitions valid
- ✅ Final stage handled correctly

---

### 4.3 Kitchen Queue Tests

#### TC-4.3.1: Kitchen Queue Display
**Priority:** CRITICAL
**Preconditions:** Multiple orders in various statuses

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | GET `/api/orders/kitchen/{storeId}` | Returns active orders only | ☐ |
| 2 | Verify statuses included | RECEIVED, PREPARING, OVEN, BAKED | ☐ |
| 3 | Check DISPATCHED/DELIVERED excluded | Not in kitchen queue | ☐ |
| 4 | Verify sorting | URGENT first, then by createdAt | ☐ |

**Active Kitchen Statuses:**
- RECEIVED
- PREPARING
- OVEN
- BAKED

**Excluded Statuses:**
- DISPATCHED
- DELIVERED
- CANCELLED

**Acceptance Criteria:**
- ✅ Only active orders shown
- ✅ Priority sorting working (URGENT first)
- ✅ Time-based sorting for same priority
- ✅ Real-time updates via WebSocket

---

#### TC-4.3.2: Priority Management
**Priority:** HIGH
**Preconditions:** Kitchen staff logged in, orders exist

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Create normal order | Priority: NORMAL | ☐ |
| 2 | PATCH priority to URGENT | Priority updated | ☐ |
| 3 | Check kitchen queue | URGENT order at top | ☐ |
| 4 | Create another URGENT order | Both URGENT orders at top, sorted by time | ☐ |
| 5 | Revert to NORMAL | Order moves down in queue | ☐ |

**API Endpoint:**
```bash
PATCH /api/orders/{orderId}/priority
{
  "priority": "URGENT"
}
```

**Acceptance Criteria:**
- ✅ Priority changes reflected immediately
- ✅ Queue re-sorted correctly
- ✅ WebSocket notification sent

---

### 4.4 Order Modification Tests

#### TC-4.4.1: Modify Order Items (Before Preparation)
**Priority:** HIGH
**Preconditions:** Order in RECEIVED status

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | PATCH `/api/orders/{orderId}/items` with new items | Items updated | ☐ |
| 2 | Verify new totals calculated | Subtotal, tax, total recalculated | ☐ |
| 3 | Check prep time updated | New prep time based on item count | ☐ |
| 4 | Try to modify order in PREPARING status | 400 Bad Request, "Cannot modify after preparation started" | ☐ |

**Acceptance Criteria:**
- ✅ Modification allowed only in RECEIVED status
- ✅ All calculations updated
- ✅ Preparation started orders immutable

---

#### TC-4.4.2: Cancel Order
**Priority:** HIGH
**Preconditions:** Order exists, not DELIVERED

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | DELETE `/api/orders/{orderId}?reason=Customer request` | Order cancelled | ☐ |
| 2 | Verify status changed to CANCELLED | Status updated | ☐ |
| 3 | Check cancelledAt timestamp | Timestamp set | ☐ |
| 4 | Verify cancellation reason saved | Reason stored | ☐ |
| 5 | Try to cancel DELIVERED order | 400 Bad Request, "Cannot cancel delivered order" | ☐ |
| 6 | Check WebSocket notification | Kitchen/customer notified | ☐ |

**Acceptance Criteria:**
- ✅ Cancellation working
- ✅ Reason required
- ✅ Delivered orders cannot be cancelled
- ✅ Notifications sent

---

### 4.5 WebSocket Real-Time Updates Tests

#### TC-4.5.1: WebSocket Connection
**Priority:** CRITICAL
**Preconditions:** Order Service running on port 8083

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Connect to `ws://localhost:8083/ws/orders` | Connection established | ☐ |
| 2 | Subscribe to `/topic/store/{storeId}/kitchen` | Subscription successful | ☐ |
| 3 | Subscribe to `/queue/customer/{customerId}/orders` | Subscription successful | ☐ |
| 4 | Check connection stays alive | No disconnections | ☐ |

**WebSocket Channels:**
- `/topic/store/{storeId}/orders` - All store orders
- `/topic/store/{storeId}/kitchen` - Kitchen queue
- `/queue/customer/{customerId}/orders` - Customer-specific

**Acceptance Criteria:**
- ✅ WebSocket connection stable
- ✅ All channels working
- ✅ STOMP protocol functional

---

#### TC-4.5.2: Real-Time Order Updates
**Priority:** CRITICAL
**Preconditions:** WebSocket connected, subscribed to channels

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Create new order | WebSocket message received on kitchen channel | ☐ |
| 2 | Update order status | Update received on all subscribed channels | ☐ |
| 3 | Change priority | Priority update received | ☐ |
| 4 | Cancel order | Cancellation update received | ☐ |
| 5 | Verify message latency | < 100ms from action to receipt | ☐ |

**Expected Message Format:**
```json
{
  "type": "ORDER_UPDATE",
  "orderId": "order-123",
  "orderNumber": "ORD123456",
  "status": "PREPARING",
  "timestamp": "2025-10-26T10:30:00Z"
}
```

**Acceptance Criteria:**
- ✅ All updates broadcast in real-time
- ✅ Low latency (< 100ms)
- ✅ Message format consistent
- ✅ No message loss

---

#### TC-4.5.3: Predictive Notifications (Make-Table)
**Priority:** MEDIUM
**Preconditions:** Order created, payment pending

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Create order (payment pending) | PREDICTIVE_START notification sent to kitchen | ☐ |
| 2 | Wait 2 minutes | Still in predictive state | ☐ |
| 3 | Complete payment | PREDICTIVE_CONFIRM sent, order moves to RECEIVED | ☐ |
| 4 | Cancel unpaid order | PREDICTIVE_CANCEL sent | ☐ |

**Predictive Notification Types:**
- `PREDICTIVE_START` - Kitchen alerted, can prep ingredients
- `PREDICTIVE_CONFIRM` - Payment successful, proceed
- `PREDICTIVE_CANCEL` - Payment failed/timeout, stop

**Acceptance Criteria:**
- ✅ 2-minute prediction window
- ✅ Kitchen notified early
- ✅ Confirmation/cancellation handled
- ✅ Reduces total order time

---

### 4.6 Order Analytics Tests

#### TC-4.6.1: Preparation Time Tracking
**Priority:** MEDIUM
**Preconditions:** Orders completed with all timestamps

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | GET `/api/orders/store/{storeId}/avg-prep-time?date=2025-10-26` | Returns average prep time | ☐ |
| 2 | Verify calculation | (sum of actualPreparationTime) / count | ☐ |
| 3 | Filter by date range | Only orders in range included | ☐ |

**Acceptance Criteria:**
- ✅ Average calculated correctly
- ✅ Only completed orders counted
- ✅ Date filtering working

---

#### TC-4.6.2: Staff Performance
**Priority:** MEDIUM
**Preconditions:** Orders assigned to kitchen staff

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | GET `/api/orders/analytics/kitchen-staff/{staffId}/performance` | Returns staff metrics | ☐ |
| 2 | Verify total orders count | Correct count | ☐ |
| 3 | Check completion rate | (completed / total) × 100 | ☐ |
| 4 | Verify avg prep time | Average of assigned orders | ☐ |

**Expected Metrics:**
- Total orders assigned
- Completed orders
- Completion rate %
- Average prep time
- Failed quality checks

**Acceptance Criteria:**
- ✅ All metrics calculated correctly
- ✅ Staff identification working
- ✅ Performance data accurate

---

### 4.7 Driver Assignment Tests

#### TC-4.7.1: Assign Driver to Delivery Order
**Priority:** HIGH
**Preconditions:** Delivery order in BAKED status, driver available

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | PATCH `/api/orders/{orderId}/assign-driver` | Driver assigned | ☐ |
| 2 | Verify assignedDriverId set | Driver ID saved | ☐ |
| 3 | Try to assign to non-delivery order | 400 Bad Request | ☐ |
| 4 | Check driver notified | Driver sees new delivery | ☐ |

**Acceptance Criteria:**
- ✅ Driver assignment working
- ✅ Only delivery orders assignable
- ✅ Driver notified

---

### 4.8 Frontend Order Flow Tests

#### TC-4.8.1: Customer Checkout Flow
**Priority:** CRITICAL
**Preconditions:** Customer logged in, items in cart

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Navigate to `/customer/checkout` | Checkout page loads | ☐ |
| 2 | Review order summary | Cart items, totals displayed | ☐ |
| 3 | Select delivery address | Address selection working | ☐ |
| 4 | Add special instructions | Instructions saved | ☐ |
| 5 | Click "Place Order" | Order created, redirects to payment | ☐ |

**Acceptance Criteria:**
- ✅ Checkout flow smooth
- ✅ All details editable
- ✅ Order creation successful
- ✅ Neumorphic design consistent

---

#### TC-4.8.2: Customer Order Tracking
**Priority:** HIGH
**Preconditions:** Customer has active order

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Navigate to `/customer/orders` | Order list displayed | ☐ |
| 2 | Click on order | Order details shown | ☐ |
| 3 | View status updates | Real-time status via WebSocket | ☐ |
| 4 | Check estimated delivery time | ETA displayed | ☐ |

**Acceptance Criteria:**
- ✅ Order tracking functional
- ✅ Real-time updates working
- ✅ Status progression clear
- ✅ Responsive design

---

#### TC-4.8.3: Kitchen Display System
**Priority:** CRITICAL
**Preconditions:** Kitchen staff logged in

| Step | Action | expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Navigate to `/kitchen/queue` | Kitchen queue displayed | ☐ |
| 2 | Verify orders sorted by priority | URGENT at top | ☐ |
| 3 | View order details | All items visible | ☐ |
| 4 | Click "Start Preparing" | Status updates to PREPARING | ☐ |
| 5 | Move through stages | Status updates in real-time | ☐ |
| 6 | Check WebSocket auto-refresh | New orders appear automatically | ☐ |

**Acceptance Criteria:**
- ✅ Kitchen display functional
- ✅ Real-time updates working
- ✅ Easy status transitions
- ✅ Large, readable text for kitchen

---

## Phase 5: Payment Integration

### 🎯 Test Scope
- Razorpay payment processing
- Payment verification
- Webhook handling
- Refund management
- Transaction reconciliation
- Payment dashboard

### 5.1 Payment Initiation Tests

#### TC-5.1.1: Initiate Payment - Razorpay Order Creation
**Priority:** CRITICAL
**Preconditions:** Order created, Payment Service running, Razorpay test keys configured

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | POST `/api/payments/initiate` with order details | 201 Created, payment response | ☐ |
| 2 | Verify Razorpay order created | razorpayOrderId returned | ☐ |
| 3 | Check amount conversion | INR → paisa (multiply by 100) | ☐ |
| 4 | Verify transaction record created | Transaction saved in DB | ☐ |
| 5 | Check transaction status | INITIATED | ☐ |

**Test Data:**
```json
{
  "orderId": "order-123",
  "customerId": "cust-001",
  "amount": 1044.35,
  "currency": "INR",
  "paymentMethod": "ONLINE"
}
```

**Expected Response:**
```json
{
  "transactionId": "txn-123",
  "razorpayOrderId": "order_L2sxxx...",
  "amount": 104435,  // in paisa
  "currency": "INR",
  "status": "INITIATED"
}
```

**Acceptance Criteria:**
- ✅ Razorpay order created successfully
- ✅ Amount conversion correct (INR to paisa)
- ✅ Transaction record in database
- ✅ Order service notified

---

#### TC-5.1.2: Payment Initiation Validation
**Priority:** HIGH

**Test invalid inputs:**

| Invalid Input | Expected Error | Status |
|---------------|----------------|--------|
| Invalid orderId | "Order not found" | ☐ |
| Amount = 0 | "Amount must be greater than 0" | ☐ |
| Negative amount | "Invalid amount" | ☐ |
| Missing required fields | 400 Bad Request | ☐ |

**Acceptance Criteria:**
- ✅ All validations working
- ✅ Clear error messages
- ✅ Invalid requests rejected

---

### 5.2 Payment Verification Tests

#### TC-5.2.1: Verify Payment Signature - Success
**Priority:** CRITICAL
**Preconditions:** Payment completed on Razorpay checkout

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | POST `/api/payments/verify` with payment details | 200 OK, verification success | ☐ |
| 2 | Verify signature validation | Utils.verifyPaymentSignature returns true | ☐ |
| 3 | Check transaction status updated | COMPLETED | ☐ |
| 4 | Verify order status updated | Payment status: COMPLETED | ☐ |
| 5 | Check timestamps | paidAt timestamp set | ☐ |

**Test Data (from Razorpay callback):**
```json
{
  "razorpayOrderId": "order_L2sxxx...",
  "razorpayPaymentId": "pay_L2syyy...",
  "razorpaySignature": "abc123def456..."
}
```

**Signature Verification:**
- Razorpay computes: HMAC_SHA256(orderId|paymentId, secret)
- We verify the signature matches

**Acceptance Criteria:**
- ✅ Signature verified correctly
- ✅ Transaction status updated
- ✅ Order service notified
- ✅ Payment confirmation sent to customer

---

#### TC-5.2.2: Verify Payment - Invalid Signature
**Priority:** CRITICAL
**Preconditions:** Payment attempt made

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | POST `/api/payments/verify` with invalid signature | 400 Bad Request | ☐ |
| 2 | Check transaction status | FAILED | ☐ |
| 3 | Verify order status | Payment status: FAILED | ☐ |
| 4 | Check error logged | "Payment signature verification failed" | ☐ |

**Acceptance Criteria:**
- ✅ Invalid signatures rejected
- ✅ Transaction marked as FAILED
- ✅ Security maintained

---

### 5.3 Webhook Handling Tests

#### TC-5.3.1: Webhook - Payment Success
**Priority:** CRITICAL
**Preconditions:** Razorpay webhook configured

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Razorpay sends `payment.captured` webhook | Webhook received | ☐ |
| 2 | Verify webhook signature | Signature validated | ☐ |
| 3 | Check transaction updated | Status: COMPLETED | ☐ |
| 4 | Verify order notified | Order service called | ☐ |
| 5 | Return 200 OK to Razorpay | Webhook acknowledged | ☐ |

**Webhook Event:**
```json
{
  "event": "payment.captured",
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_L2syyy...",
        "order_id": "order_L2sxxx...",
        "amount": 104435,
        "status": "captured"
      }
    }
  }
}
```

**Acceptance Criteria:**
- ✅ Webhook processed successfully
- ✅ Signature verified
- ✅ Transaction status updated
- ✅ Idempotency maintained (duplicate webhooks handled)

---

#### TC-5.3.2: Webhook - Payment Failed
**Priority:** HIGH
**Preconditions:** Payment attempt failed

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Razorpay sends `payment.failed` webhook | Webhook received | ☐ |
| 2 | Check transaction status updated | Status: FAILED | ☐ |
| 3 | Verify failure reason saved | Error message stored | ☐ |
| 4 | Check order notified | Order service updated | ☐ |

**Acceptance Criteria:**
- ✅ Failed payments handled
- ✅ Reason captured
- ✅ Customer notified

---

### 5.4 Refund Management Tests

#### TC-5.4.1: Initiate Full Refund
**Priority:** HIGH
**Preconditions:** Payment completed, transaction exists

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | POST `/api/payments/refund` with full amount | 201 Created, refund initiated | ☐ |
| 2 | Verify Razorpay refund API called | Refund created on Razorpay | ☐ |
| 3 | Check refund record created | Refund in database | ☐ |
| 4 | Verify refund status | INITIATED | ☐ |
| 5 | Wait for webhook | Refund status updated to PROCESSED | ☐ |

**Test Data:**
```json
{
  "transactionId": "txn-123",
  "amount": 1044.35,
  "reason": "Order cancelled by customer",
  "speed": "normal"
}
```

**Refund Speed Options:**
- `normal` - 5-7 business days
- `optimum` - Instant (if supported by bank)

**Acceptance Criteria:**
- ✅ Refund initiated successfully
- ✅ Razorpay refund created
- ✅ Refund record tracked
- ✅ Customer notified

---

#### TC-5.4.2: Initiate Partial Refund
**Priority:** HIGH
**Preconditions:** Payment completed

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | POST `/api/payments/refund` with partial amount | Refund created for partial amount | ☐ |
| 2 | Verify amount <= original payment | Validation passed | ☐ |
| 3 | Try to refund more than paid | 400 Bad Request, "Amount exceeds payment" | ☐ |
| 4 | Check refund type | PARTIAL | ☐ |

**Acceptance Criteria:**
- ✅ Partial refunds working
- ✅ Amount validation enforced
- ✅ Multiple partial refunds allowed (up to total)

---

#### TC-5.4.3: Refund Status Tracking
**Priority:** MEDIUM
**Preconditions:** Refund initiated

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | GET `/api/payments/refund/{refundId}` | Refund details returned | ☐ |
| 2 | Check refund status | INITIATED/PROCESSING/PROCESSED/FAILED | ☐ |
| 3 | Verify webhook updates status | Razorpay webhooks update status | ☐ |
| 4 | GET refunds by order | All refunds for order returned | ☐ |

**Acceptance Criteria:**
- ✅ Refund tracking functional
- ✅ Status updates via webhook
- ✅ History queryable

---

### 5.5 Transaction Reconciliation Tests

#### TC-5.5.1: Daily Reconciliation Report
**Priority:** HIGH
**Preconditions:** Transactions exist for the day

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | GET `/api/payments/reconciliation?date=2025-10-26` | Reconciliation report returned | ☐ |
| 2 | Verify total transactions count | Correct count | ☐ |
| 3 | Check breakdown by payment method | CASH, CARD, UPI, etc. separated | ☐ |
| 4 | Verify total amount | Sum matches individual transactions | ☐ |
| 5 | Check refund amount deducted | Net amount = payments - refunds | ☐ |

**Expected Report Structure:**
```json
{
  "date": "2025-10-26",
  "totalTransactions": 150,
  "totalAmount": 125000.00,
  "totalRefunds": 5000.00,
  "netAmount": 120000.00,
  "breakdownByMethod": {
    "CARD": {
      "count": 80,
      "amount": 85000.00
    },
    "UPI": {
      "count": 60,
      "amount": 35000.00
    },
    "CASH": {
      "count": 10,
      "amount": 5000.00
    }
  },
  "breakdownByStatus": {
    "COMPLETED": 140,
    "FAILED": 8,
    "PENDING": 2
  }
}
```

**Acceptance Criteria:**
- ✅ Report generated correctly
- ✅ All breakdowns accurate
- ✅ Net calculation correct
- ✅ Date filtering working

---

#### TC-5.5.2: Mark Transaction as Reconciled
**Priority:** MEDIUM
**Preconditions:** Manager logged in, transaction exists

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | POST `/api/payments/{transactionId}/reconcile` | Transaction marked reconciled | ☐ |
| 2 | Verify reconciledAt timestamp | Timestamp set | ☐ |
| 3 | Check reconciledBy | Manager's userId saved | ☐ |
| 4 | Try to reconcile again | 400 Bad Request, "Already reconciled" | ☐ |

**Acceptance Criteria:**
- ✅ Reconciliation marking working
- ✅ Audit trail maintained
- ✅ Double reconciliation prevented

---

### 5.6 Payment Dashboard Tests (Frontend)

#### TC-5.6.1: Payment Dashboard - Manager View
**Priority:** HIGH
**Preconditions:** Manager logged in, transactions exist

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Navigate to `/manager/payments` | Payment dashboard loads | ☐ |
| 2 | View today's summary | Stats displayed (total, completed, failed) | ☐ |
| 3 | Check payment method breakdown | Chart showing distribution | ☐ |
| 4 | View transaction history table | Recent 20 transactions displayed | ☐ |
| 5 | Filter by date range | Filtered transactions shown | ☐ |
| 6 | Search by order number | Search working | ☐ |

**Stats Cards:**
- Total Transactions Today
- Total Amount (₹)
- Successful Payments
- Failed Payments
- Pending Payments
- Refunds Issued

**Acceptance Criteria:**
- ✅ Dashboard loads quickly (< 2s)
- ✅ All stats accurate
- ✅ Real-time polling (30s)
- ✅ Neumorphic design consistent
- ✅ Responsive on mobile

---

#### TC-5.6.2: Refund Management Page
**Priority:** HIGH
**Preconditions:** Manager logged in

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Navigate to `/manager/refunds` | Refund management page loads | ☐ |
| 2 | View pending refunds | List of refunds needing approval | ☐ |
| 3 | Click "Initiate Refund" | Refund dialog opens | ☐ |
| 4 | Enter amount and reason | Validation working | ☐ |
| 5 | Submit refund | Refund initiated, confirmation shown | ☐ |
| 6 | View refund history | All refunds listed | ☐ |

**Acceptance Criteria:**
- ✅ Refund UI functional
- ✅ Validation enforced
- ✅ History tracking
- ✅ Status updates real-time

---

### 5.7 Payment Flow Integration Tests

#### TC-5.7.1: Complete Payment Flow - Razorpay Checkout
**Priority:** CRITICAL
**Preconditions:** Customer logged in, order created, Razorpay test mode

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Customer places order | Redirects to payment page | ☐ |
| 2 | Payment page loads | Razorpay checkout modal opens | ☐ |
| 3 | Enter test card details | Card accepted | ☐ |
| 4 | Complete payment on Razorpay | Payment successful callback | ☐ |
| 5 | Verify payment | Signature verified | ☐ |
| 6 | Check order updated | Payment status: COMPLETED | ☐ |
| 7 | Redirect to success page | Success page shown with order details | ☐ |

**Razorpay Test Cards:**
```
Success: 4111 1111 1111 1111
CVV: Any 3 digits
Expiry: Any future date
```

**Acceptance Criteria:**
- ✅ Complete flow working end-to-end
- ✅ Razorpay integration functional
- ✅ Payment verified correctly
- ✅ Order status updated
- ✅ Customer notified

---

#### TC-5.7.2: Payment Failure Handling
**Priority:** HIGH
**Preconditions:** Customer at payment page

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Use failed test card on Razorpay | Payment fails | ☐ |
| 2 | Failure callback received | Frontend handles error | ☐ |
| 3 | Redirect to failure page | Failure page shown | ☐ |
| 4 | Check "Retry Payment" button | Button available | ☐ |
| 5 | Click retry | Returns to payment page | ☐ |
| 6 | Verify transaction status | FAILED in database | ☐ |

**Razorpay Failed Test Card:**
```
Failed: 4000 0000 0000 0002
```

**Acceptance Criteria:**
- ✅ Failure handled gracefully
- ✅ Clear error message
- ✅ Retry option available
- ✅ Transaction status correct

---

## 📊 Test Summary Template

| Phase | Total Tests | Passed | Failed | Blocked | Pass Rate |
|-------|-------------|--------|--------|---------|-----------|
| Phase 4 (Order) | 32 | 0 | 0 | 0 | 0% |
| Phase 5 (Payment) | 25 | 0 | 0 | 0 | 0% |
| **Total** | **57** | **0** | **0** | **0** | **0%** |

---

## ✅ Phases 4-5 Completion Criteria

### Phase 4 Sign-Off
- [ ] All 32 tests passed
- [ ] Order creation & lifecycle working
- [ ] WebSocket real-time updates functional
- [ ] Kitchen queue operational
- [ ] Priority management working
- [ ] Driver assignment functional

### Phase 5 Sign-Off
- [ ] All 25 tests passed
- [ ] Razorpay integration working
- [ ] Payment verification functional
- [ ] Webhook handling operational
- [ ] Refunds working correctly
- [ ] Reconciliation reports accurate
- [ ] Payment dashboard functional

---

**Next Steps:** Proceed to `04-phases-6-7-tests.md` for Kitchen Operations & Inventory testing.

---

*Phases 4-5 are critical business functions. Thorough testing required before production.*
