# Complete End-to-End Testing Flows for MaSoVa Restaurant Management System
## (Excluding Inventory)

This document provides comprehensive end-to-end testing flows with example requests and expected responses for the complete MaSoVa restaurant management system.

---

## 1. AUTHENTICATION & USER MANAGEMENT FLOW

### Flow 1A: Customer Registration & Login

**Step 1: Customer Registration**
```http
POST /api/users/register
Content-Type: application/json

{
  "type": "CUSTOMER",
  "name": "John Smith",
  "email": "john.smith@example.com",
  "phone": "9876543210",
  "password": "SecurePass123"
}

EXPECTED RESPONSE (200 OK):
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "cust-123",
    "name": "John Smith",
    "email": "john.smith@example.com",
    "type": "CUSTOMER",
    "phone": "9876543210",
    "createdAt": "2025-12-17T10:00:00Z"
  }
}
```

**Step 2: Customer Login**
```http
POST /api/users/login
Content-Type: application/json

{
  "email": "john.smith@example.com",
  "password": "SecurePass123"
}

EXPECTED RESPONSE (200 OK):
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "cust-123",
    "name": "John Smith",
    "email": "john.smith@example.com",
    "type": "CUSTOMER",
    "phone": "9876543210",
    "lastLogin": "2025-12-17T10:05:00Z"
  }
}
```

**Step 3: Token Refresh (When Access Token Expires)**
```http
POST /api/users/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}

EXPECTED RESPONSE (200 OK):
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

### Flow 1B: Manager Creates Employee & Employee Logs In

**Step 1: Manager Login**
```http
POST /api/users/login
Content-Type: application/json

{
  "email": "manager@masova.com",
  "password": "ManagerPass123"
}

EXPECTED RESPONSE:
{
  "accessToken": "mgr-token...",
  "user": {
    "id": "mgr-001",
    "type": "MANAGER",
    "storeId": "store-001"
  }
}
```

**Step 2: Manager Creates Staff Employee**
```http
POST /api/users/create
Authorization: Bearer mgr-token...
Content-Type: application/json

{
  "type": "STAFF",
  "name": "Sarah Kitchen",
  "email": "sarah.kitchen@masova.com",
  "phone": "9123456789",
  "password": "StaffPass123",
  "storeId": "store-001",
  "role": "KITCHEN_STAFF",
  "permissions": ["VIEW_ORDERS", "UPDATE_ORDER_STATUS"]
}

EXPECTED RESPONSE (201 Created):
{
  "id": "staff-001",
  "name": "Sarah Kitchen",
  "type": "STAFF",
  "storeId": "store-001",
  "role": "KITCHEN_STAFF",
  "employeeDetails": {
    "employeePIN": "1234"  // Only shown once
  }
}
```

**Step 3: Staff Employee Login**
```http
POST /api/users/login
Content-Type: application/json

{
  "email": "sarah.kitchen@masova.com",
  "password": "StaffPass123"
}

EXPECTED RESPONSE:
{
  "accessToken": "staff-token...",
  "user": {
    "id": "staff-001",
    "type": "STAFF",
    "storeId": "store-001"
  }
}
```

**Step 4: Staff Clocks In (Start Working Session)**
```http
POST /api/users/sessions/start
Authorization: Bearer staff-token...
X-User-Store-Id: store-001
Content-Type: application/json

{
  "employeeId": "staff-001",
  "storeId": "store-001"
}

EXPECTED RESPONSE:
{
  "sessionId": "session-001",
  "employeeId": "staff-001",
  "storeId": "store-001",
  "loginTime": "2025-12-17T09:00:00Z",
  "isActive": true,
  "status": "ACTIVE"
}
```

**Step 5: Manager Clock In Employee via PIN (Alternative)**
```http
POST /api/users/sessions/clock-in-with-pin
Authorization: Bearer mgr-token...
Content-Type: application/json

{
  "employeeId": "staff-001",
  "pin": "1234",
  "storeId": "store-001"
}

EXPECTED RESPONSE:
{
  "sessionId": "session-002",
  "notes": "Clocked in by manager: mgr-001"
}
```

---

### Flow 1C: Store Selection & Context

**Step 1: Browse Available Stores (Public)**
```http
GET /api/stores/public
No Authentication Required

EXPECTED RESPONSE:
[
  {
    "id": "store-001",
    "name": "MaSoVa Downtown",
    "storeCode": "MSD001",
    "address": "123 Main St, City",
    "phone": "9999999999",
    "isActive": true,
    "deliveryRadius": 10.0
  },
  {
    "id": "store-002",
    "name": "MaSoVa Suburb",
    "storeCode": "MSS002",
    "address": "456 Oak Ave, City",
    "phone": "8888888888",
    "isActive": true,
    "deliveryRadius": 8.0
  }
]
```

**Step 2: Customer Selects Store**
```
Frontend stores selected store ID in Redux state
All subsequent API calls include header:
X-Selected-Store-Id: store-001
```

---

## 2. COMPLETE CUSTOMER ORDER FLOW (DELIVERY)

### Flow 2A: Browse Menu & Add to Cart

**Step 1: Get Store's Menu**
```http
GET /api/menu/public?storeId=store-001
No Authentication Required

EXPECTED RESPONSE:
[
  {
    "id": "menu-001",
    "name": "Margherita Pizza",
    "description": "Classic tomato and mozzarella",
    "price": 299.00,
    "category": "PIZZA",
    "cuisine": "ITALIAN",
    "dietaryType": "VEGETARIAN",
    "available": true,
    "image": "https://...",
    "preparationTime": 20,
    "storeId": "store-001"
  },
  {
    "id": "menu-002",
    "name": "Chicken Tikka Pizza",
    "description": "Spicy chicken tikka topping",
    "price": 399.00,
    "category": "PIZZA",
    "cuisine": "FUSION",
    "available": true,
    "preparationTime": 25,
    "storeId": "store-001"
  }
]
```

**Step 2: Add Items to Cart (Frontend)**
```javascript
// Redux cart state
cart = {
  items: [
    {
      menuItemId: "menu-001",
      name: "Margherita Pizza",
      quantity: 2,
      price: 299.00
    },
    {
      menuItemId: "menu-002",
      name: "Chicken Tikka Pizza",
      quantity: 1,
      price: 399.00
    }
  ],
  subtotal: 997.00
}
```

---

### Flow 2B: Checkout & Address Selection

**Step 1: Create/Get Customer Profile**
```http
POST /api/customers
Authorization: Bearer cust-token...
Content-Type: application/json

{
  "name": "John Smith",
  "email": "john.smith@example.com",
  "phone": "9876543210"
}

EXPECTED RESPONSE:
{
  "id": "cust-123",
  "name": "John Smith",
  "email": "john.smith@example.com",
  "phone": "9876543210",
  "addresses": [],
  "loyaltyInfo": {
    "loyaltyTier": "BRONZE",
    "totalPoints": 0,
    "availablePoints": 0
  }
}
```

**Step 2: Add Delivery Address**
```http
POST /api/customers/cust-123/addresses
Authorization: Bearer cust-token...
Content-Type: application/json

{
  "type": "HOME",
  "street": "789 Elm Street, Apartment 4B",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001",
  "latitude": 19.0760,
  "longitude": 72.8777,
  "isDefault": true
}

EXPECTED RESPONSE:
{
  "id": "addr-001",
  "type": "HOME",
  "street": "789 Elm Street, Apartment 4B",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001",
  "latitude": 19.0760,
  "longitude": 72.8777,
  "isDefault": true
}
```

**Step 3: Check Delivery Zone Coverage**
```http
GET /api/delivery/zone/check?storeId=store-001&lat=19.0760&lng=72.8777
Authorization: Bearer cust-token...

EXPECTED RESPONSE:
{
  "isWithinDeliveryZone": true,
  "zone": "ZONE_A",
  "distanceKm": 2.5
}
```

**Step 4: Calculate Delivery Fee**
```http
GET /api/delivery/zone/fee?storeId=store-001&lat=19.0760&lng=72.8777
Authorization: Bearer cust-token...

EXPECTED RESPONSE:
{
  "baseFee": 20.00,
  "distanceFee": 10.00,
  "totalFee": 30.00,
  "validAddress": true,
  "distanceKm": 2.5,
  "zone": "ZONE_A"
}
```

---

### Flow 2C: Payment Processing

**Step 1: Initiate Payment (Create Razorpay Order)**
```http
POST /api/v1/payments/initiate
Authorization: Bearer cust-token...
X-Selected-Store-Id: store-001
Content-Type: application/json

{
  "orderId": "temp-order-id",
  "amount": 1076.85,
  "currency": "INR",
  "customerId": "cust-123",
  "customerEmail": "john.smith@example.com",
  "customerPhone": "9876543210",
  "paymentMethod": "CARD",
  "storeId": "store-001"
}

EXPECTED RESPONSE:
{
  "transactionId": "txn-001",
  "razorpayOrderId": "order_MBkTxyz123",
  "razorpayKeyId": "rzp_test_...",
  "amount": 1076.85,
  "currency": "INR",
  "status": "INITIATED"
}
```

**Step 2: Customer Completes Payment (Frontend Razorpay Checkout)**
```javascript
// Frontend loads Razorpay checkout modal
const options = {
  key: "rzp_test_...",
  amount: 107685, // paise
  currency: "INR",
  name: "MaSoVa Restaurant",
  order_id: "order_MBkTxyz123",
  handler: function(response) {
    // Response from Razorpay after successful payment
    verifyPayment({
      razorpayOrderId: response.razorpay_order_id,
      razorpayPaymentId: response.razorpay_payment_id,
      razorpaySignature: response.razorpay_signature
    });
  }
}
const rzp = new Razorpay(options);
rzp.open();
```

**Step 3: Verify Payment Signature**
```http
POST /api/v1/payments/verify
Authorization: Bearer cust-token...
Content-Type: application/json

{
  "razorpayOrderId": "order_MBkTxyz123",
  "razorpayPaymentId": "pay_MBkUabc456",
  "razorpaySignature": "abc123def456...",
  "transactionId": "txn-001"
}

EXPECTED RESPONSE:
{
  "verified": true,
  "transactionId": "txn-001",
  "status": "SUCCESS",
  "paidAt": "2025-12-17T10:15:00Z"
}
```

---

### Flow 2D: Create Order

**Step 1: Create Delivery Order**
```http
POST /api/v1/orders
Authorization: Bearer cust-token...
X-Selected-Store-Id: store-001
X-User-Id: cust-123
Content-Type: application/json

{
  "customerId": "cust-123",
  "customerName": "John Smith",
  "customerPhone": "9876543210",
  "storeId": "store-001",
  "items": [
    {
      "menuItemId": "menu-001",
      "name": "Margherita Pizza",
      "quantity": 2,
      "price": 299.00
    },
    {
      "menuItemId": "menu-002",
      "name": "Chicken Tikka Pizza",
      "quantity": 1,
      "price": 399.00
    }
  ],
  "orderType": "DELIVERY",
  "paymentMethod": "CARD",
  "deliveryAddress": {
    "street": "789 Elm Street, Apartment 4B",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001",
    "latitude": 19.0760,
    "longitude": 72.8777
  },
  "specialInstructions": "Extra cheese on Margherita"
}

EXPECTED RESPONSE:
{
  "id": "order-001",
  "orderNumber": "ORD-20251217-001",
  "customerId": "cust-123",
  "storeId": "store-001",
  "items": [
    {
      "menuItemId": "menu-001",
      "name": "Margherita Pizza",
      "quantity": 2,
      "price": 299.00
    },
    {
      "menuItemId": "menu-002",
      "name": "Chicken Tikka Pizza",
      "quantity": 1,
      "price": 399.00
    }
  ],
  "subtotal": 997.00,
  "deliveryFee": 30.00,
  "tax": 49.85,  // 5% of subtotal
  "total": 1076.85,
  "status": "RECEIVED",
  "paymentStatus": "PENDING",
  "orderType": "DELIVERY",
  "deliveryAddress": {
    "street": "789 Elm Street, Apartment 4B",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001"
  },
  "estimatedDeliveryTime": "2025-12-17T11:00:00Z",
  "createdAt": "2025-12-17T10:20:00Z"
}
```

**Step 2: Update Order Payment Status**
```http
PATCH /api/v1/orders/order-001/payment
Authorization: Bearer payment-service-token
Content-Type: application/json

{
  "paymentStatus": "PAID",
  "transactionId": "txn-001"
}

EXPECTED RESPONSE:
{
  "id": "order-001",
  "paymentStatus": "PAID",
  "transactionId": "txn-001"
}
```

---

### Flow 2E: Kitchen Workflow

**Step 1: Kitchen Staff Views Order Queue**
```http
GET /api/v1/orders/kitchen
Authorization: Bearer staff-token...
X-User-Store-Id: store-001

EXPECTED RESPONSE:
[
  {
    "id": "order-001",
    "orderNumber": "ORD-20251217-001",
    "status": "RECEIVED",
    "items": [
      {
        "name": "Margherita Pizza",
        "quantity": 2
      },
      {
        "name": "Chicken Tikka Pizza",
        "quantity": 1
      }
    ],
    "specialInstructions": "Extra cheese on Margherita",
    "receivedAt": "2025-12-17T10:20:00Z",
    "estimatedPreparationTime": 25,
    "priority": "NORMAL"
  }
]
```

**Step 2: Kitchen Starts Preparation**
```http
PATCH /api/v1/orders/order-001/next-stage
Authorization: Bearer staff-token...
X-User-Store-Id: store-001

EXPECTED RESPONSE:
{
  "id": "order-001",
  "status": "PREPARING",
  "preparingStartedAt": "2025-12-17T10:25:00Z"
}

WebSocket Notification Sent:
- Topic: /topic/store/store-001/kitchen
- Topic: /queue/customer/cust-123/orders
```

**Step 3: Quality Checkpoint**
```http
POST /api/v1/orders/order-001/quality-checkpoint
Authorization: Bearer staff-token...
Content-Type: application/json

{
  "checkpointName": "dough_quality",
  "type": "INGREDIENT_CHECK",
  "status": "PASSED",
  "checkedByStaffId": "staff-001",
  "notes": "Fresh dough, perfect consistency"
}

EXPECTED RESPONSE:
{
  "checkpointName": "dough_quality",
  "status": "PASSED"
}
```

**Step 4: Move to Oven**
```http
PATCH /api/v1/orders/order-001/next-stage
Authorization: Bearer staff-token...

EXPECTED RESPONSE:
{
  "id": "order-001",
  "status": "OVEN",
  "ovenStartedAt": "2025-12-17T10:35:00Z"
}
```

**Step 5: Move to Baked**
```http
PATCH /api/v1/orders/order-001/next-stage
Authorization: Bearer staff-token...

EXPECTED RESPONSE:
{
  "id": "order-001",
  "status": "BAKED",
  "bakedAt": "2025-12-17T10:50:00Z",
  "actualPreparationTime": 30,
  "actualOvenTime": 15
}
```

**Step 6: Ready for Dispatch**
```http
PATCH /api/v1/orders/order-001/next-stage
Authorization: Bearer staff-token...

EXPECTED RESPONSE:
{
  "id": "order-001",
  "status": "DISPATCHED",
  "dispatchedAt": "2025-12-17T10:55:00Z"
}
```

---

### Flow 2F: Delivery & Driver Assignment

**Step 1: Auto-Dispatch (Assign Driver)**
```http
POST /api/delivery/auto-dispatch
Authorization: Bearer mgr-token...
X-User-Store-Id: store-001
Content-Type: application/json

{
  "orderId": "order-001",
  "storeId": "store-001",
  "deliveryAddress": {
    "latitude": 19.0760,
    "longitude": 72.8777
  }
}

EXPECTED RESPONSE:
{
  "trackingId": "tracking-001",
  "orderId": "order-001",
  "driverId": "driver-001",
  "driverName": "Mike Delivery",
  "driverPhone": "9111111111",
  "status": "ASSIGNED",
  "estimatedPickupTime": "2025-12-17T11:00:00Z",
  "estimatedDeliveryTime": "2025-12-17T11:15:00Z"
}

WebSocket Notification Sent:
- Topic: /topic/driver/driver-001/assignments
```

**Step 2: Driver Accepts Delivery**
```http
POST /api/delivery/accept
Authorization: Bearer driver-token...
Content-Type: application/json

{
  "trackingId": "tracking-001",
  "driverId": "driver-001",
  "estimatedPickupMinutes": 5
}

EXPECTED RESPONSE:
{
  "status": "ACCEPTED",
  "acceptedAt": "2025-12-17T10:56:00Z",
  "estimatedDeliveryMinutes": 20
}

WebSocket Notifications Sent:
- Topic: /topic/order/order-001/tracking (Customer)
- Topic: /topic/store/store-001/deliveries (Manager)
```

**Step 3: Driver Marks Pickup**
```http
POST /api/delivery/tracking-001/pickup
Authorization: Bearer driver-token...

EXPECTED RESPONSE:
{
  "trackingId": "tracking-001",
  "status": "PICKED_UP",
  "pickedUpAt": "2025-12-17T11:00:00Z"
}
```

**Step 4: Driver Marks In Transit**
```http
POST /api/delivery/tracking-001/in-transit
Authorization: Bearer driver-token...

EXPECTED RESPONSE:
{
  "trackingId": "tracking-001",
  "status": "IN_TRANSIT",
  "inTransitAt": "2025-12-17T11:02:00Z"
}
```

**Step 5: Driver Updates Location (Real-Time)**
```http
POST /api/delivery/location-update
Authorization: Bearer driver-token...
Content-Type: application/json

{
  "driverId": "driver-001",
  "latitude": 19.0750,
  "longitude": 72.8770,
  "accuracy": 10.0,
  "speed": 15.5,
  "heading": 45.0,
  "timestamp": "2025-12-17T11:05:00Z"
}

EXPECTED RESPONSE:
{
  "success": true
}

WebSocket Notification Sent:
- Topic: /topic/order/order-001/tracking
- Updates: driver location, distance remaining, ETA
```

**Step 6: Customer Tracks Order**
```http
GET /api/delivery/track/order-001
Authorization: Bearer cust-token...

EXPECTED RESPONSE:
{
  "orderId": "order-001",
  "orderNumber": "ORD-20251217-001",
  "status": "IN_TRANSIT",
  "driverName": "Mike Delivery",
  "driverPhone": "9111111111",
  "currentLocation": {
    "latitude": 19.0750,
    "longitude": 72.8770
  },
  "deliveryAddress": {
    "latitude": 19.0760,
    "longitude": 72.8777
  },
  "estimatedArrival": "2025-12-17T11:15:00Z",
  "distanceRemainingKm": 0.8,
  "timeRemainingMinutes": 10
}
```

**Step 7: Driver Arrives at Location**
```http
POST /api/delivery/tracking-001/arrived
Authorization: Bearer driver-token...

EXPECTED RESPONSE:
{
  "trackingId": "tracking-001",
  "status": "ARRIVED",
  "arrivedAt": "2025-12-17T11:14:00Z"
}
```

---

### Flow 2G: Proof of Delivery

**Step 1: Generate Delivery OTP**
```http
POST /api/delivery/order-001/generate-otp
Authorization: Bearer driver-token...

EXPECTED RESPONSE:
{
  "orderId": "order-001",
  "otp": "5847",
  "expiresAt": "2025-12-17T11:29:00Z"
}

Note: OTP sent to customer via SMS
```

**Step 2: Driver Enters OTP (Customer Verification)**
```http
POST /api/delivery/verify-otp
Authorization: Bearer driver-token...
Content-Type: application/json

{
  "orderId": "order-001",
  "otp": "5847"
}

EXPECTED RESPONSE:
{
  "verified": true,
  "verifiedAt": "2025-12-17T11:15:00Z",
  "proofType": "OTP"
}
```

**Step 3: Mark Order as Delivered**
```http
PUT /api/v1/orders/order-001/mark-delivered
Authorization: Bearer driver-token...
Content-Type: application/json

{
  "proofType": "OTP"
}

EXPECTED RESPONSE:
{
  "id": "order-001",
  "status": "DELIVERED",
  "deliveredAt": "2025-12-17T11:15:00Z",
  "deliveryProofType": "OTP"
}

WebSocket Notifications Sent:
- Topic: /queue/customer/cust-123/orders
- Topic: /topic/store/store-001/deliveries
```

**Alternative: Photo Proof**
```http
POST /api/delivery/verify-photo
Authorization: Bearer driver-token...
Content-Type: application/json

{
  "orderId": "order-001",
  "photoUrl": "https://storage.masova.com/delivery/order-001-proof.jpg"
}

EXPECTED RESPONSE:
{
  "verified": true,
  "proofType": "PHOTO",
  "photoUrl": "https://storage.masova.com/delivery/order-001-proof.jpg"
}
```

---

### Flow 2H: Customer Reviews & Rating

**Step 1: Rating Request Notification**
```
After delivery completion, system automatically sends:
- SMS to: 9876543210
- Email to: john.smith@example.com

Content:
"Thank you for your order! Please rate your experience:
https://masova.com/rate?token=abc123xyz"
```

**Step 2: Customer Opens Rating Page (No Login Required)**
```http
GET /api/reviews/public/token/abc123xyz

EXPECTED RESPONSE:
{
  "token": "abc123xyz",
  "orderId": "order-001",
  "orderNumber": "ORD-20251217-001",
  "customerName": "John Smith",
  "items": [
    {"name": "Margherita Pizza", "quantity": 2},
    {"name": "Chicken Tikka Pizza", "quantity": 1}
  ],
  "driverName": "Mike Delivery",
  "totalAmount": 1076.85,
  "deliveredAt": "2025-12-17T11:15:00Z"
}
```

**Step 3: Customer Submits Rating (Public Endpoint)**
```http
POST /api/reviews/public/submit?token=abc123xyz
Content-Type: application/json

{
  "orderId": "order-001",
  "overallRating": 5,
  "foodQualityRating": 5,
  "serviceRating": 5,
  "deliveryRating": 4,
  "driverRating": 4,
  "comment": "Great food! Delivery was slightly delayed but driver was friendly.",
  "photoUrls": []
}

EXPECTED RESPONSE:
{
  "id": "review-001",
  "orderId": "order-001",
  "overallRating": 5,
  "foodQualityRating": 5,
  "serviceRating": 5,
  "deliveryRating": 4,
  "driverRating": 4,
  "comment": "Great food! Delivery was slightly delayed but driver was friendly.",
  "sentiment": "POSITIVE",
  "sentimentScore": 0.92,
  "status": "APPROVED",
  "createdAt": "2025-12-17T11:30:00Z"
}
```

**Step 4: Manager Views Review**
```http
GET /api/reviews/order/order-001
Authorization: Bearer mgr-token...

EXPECTED RESPONSE:
[
  {
    "id": "review-001",
    "orderId": "order-001",
    "overallRating": 5,
    "comment": "Great food! Delivery was slightly delayed but driver was friendly.",
    "sentiment": "POSITIVE",
    "status": "APPROVED"
  }
]
```

**Step 5: Manager Responds to Review**
```http
POST /api/responses/review/review-001
Authorization: Bearer mgr-token...
Content-Type: application/json

{
  "responseText": "Thank you for your feedback, John! We're delighted you enjoyed the food. We'll work on improving our delivery times.",
  "responseType": "THANK_YOU"
}

EXPECTED RESPONSE:
{
  "id": "response-001",
  "reviewId": "review-001",
  "responseText": "Thank you for your feedback, John! We're delighted you enjoyed the food. We'll work on improving our delivery times.",
  "responseType": "THANK_YOU",
  "respondedBy": "mgr-001",
  "respondedAt": "2025-12-17T12:00:00Z"
}
```

---

### Flow 2I: Loyalty Points & Rewards

**Step 1: Update Customer Order Stats (After Delivery)**
```http
POST /api/customers/cust-123/order-stats
Authorization: Bearer order-service-token
Content-Type: application/json

{
  "orderId": "order-001",
  "orderTotal": 1076.85,
  "orderDate": "2025-12-17T11:15:00Z"
}

EXPECTED RESPONSE:
{
  "totalOrders": 1,
  "totalSpent": 1076.85,
  "averageOrderValue": 1076.85,
  "lastOrderDate": "2025-12-17T11:15:00Z"
}
```

**Step 2: Award Loyalty Points**
```http
POST /api/customers/cust-123/loyalty/points
Authorization: Bearer order-service-token
Content-Type: application/json

{
  "points": 107,  // 10% of order total (₹10 = 1 point)
  "type": "EARN",
  "orderId": "order-001",
  "description": "Points earned from order ORD-20251217-001"
}

EXPECTED RESPONSE:
{
  "customerId": "cust-123",
  "loyaltyInfo": {
    "loyaltyTier": "BRONZE",
    "totalPoints": 107,
    "availablePoints": 107,
    "redeemedPoints": 0,
    "lastPointsEarned": "2025-12-17T11:15:00Z"
  }
}
```

**Step 3: Customer Redeems Points on Next Order**
```http
POST /api/customers/cust-123/loyalty/redeem
Authorization: Bearer cust-token...
Content-Type: application/json

{
  "points": 100,
  "orderId": "order-002"
}

EXPECTED RESPONSE:
{
  "discountAmount": 50.00,  // 100 points = ₹50
  "pointsRedeemed": 100,
  "availablePoints": 7
}
```

---

## 3. POS SYSTEM WORKFLOW (WALK-IN/PICKUP)

### Flow 3A: POS Staff Creates Pickup Order

**Step 1: Staff Clocks In**
```http
POST /api/users/sessions/start
Authorization: Bearer staff-token...
X-User-Store-Id: store-001

{
  "employeeId": "staff-002",
  "storeId": "store-001"
}

EXPECTED RESPONSE:
{
  "sessionId": "session-003",
  "isActive": true
}
```

**Step 2: Browse Menu**
```http
GET /api/menu/public?storeId=store-001

EXPECTED RESPONSE:
[
  {
    "id": "menu-003",
    "name": "Pepperoni Pizza",
    "price": 349.00,
    "category": "PIZZA",
    "available": true
  }
]
```

**Step 3: Create Walk-In Customer Profile**
```http
POST /api/customers
Authorization: Bearer staff-token...
Content-Type: application/json

{
  "name": "Sarah Walk-In",
  "phone": "9222222222"
}

EXPECTED RESPONSE:
{
  "id": "cust-124",
  "name": "Sarah Walk-In",
  "phone": "9222222222"
}
```

**Step 4: Create Pickup Order with Cash Payment**
```http
POST /api/v1/orders
Authorization: Bearer staff-token...
X-User-Store-Id: store-001
Content-Type: application/json

{
  "customerId": "cust-124",
  "customerName": "Sarah Walk-In",
  "customerPhone": "9222222222",
  "storeId": "store-001",
  "items": [
    {
      "menuItemId": "menu-003",
      "name": "Pepperoni Pizza",
      "quantity": 1,
      "price": 349.00
    }
  ],
  "orderType": "PICKUP",
  "paymentMethod": "CASH",
  "specialInstructions": "Extra napkins please"
}

EXPECTED RESPONSE:
{
  "id": "order-002",
  "orderNumber": "ORD-20251217-002",
  "subtotal": 349.00,
  "deliveryFee": 0.00,
  "tax": 17.45,
  "total": 366.45,
  "status": "RECEIVED",
  "orderType": "PICKUP",
  "paymentMethod": "CASH"
}
```

**Step 5: Process Cash Payment**
```http
POST /api/v1/payments/cash
Authorization: Bearer staff-token...
Content-Type: application/json

{
  "orderId": "order-002",
  "amount": 366.45,
  "customerId": "cust-124",
  "storeId": "store-001"
}

EXPECTED RESPONSE:
{
  "transactionId": "txn-002",
  "orderId": "order-002",
  "amount": 366.45,
  "status": "SUCCESS",
  "paymentMethod": "CASH",
  "paidAt": "2025-12-17T12:00:00Z"
}
```

**Step 6: Kitchen Prepares Order (Same as Flow 2E)**
```
Kitchen workflow identical to delivery orders:
RECEIVED → PREPARING → OVEN → BAKED → DISPATCHED
```

**Step 7: Customer Picks Up Order**
```http
PATCH /api/v1/orders/order-002/status
Authorization: Bearer staff-token...
Content-Type: application/json

{
  "status": "DELIVERED"
}

EXPECTED RESPONSE:
{
  "id": "order-002",
  "status": "DELIVERED",
  "completedAt": "2025-12-17T12:30:00Z"
}
```

**Step 8: Staff Clocks Out**
```http
POST /api/users/sessions/end
Authorization: Bearer staff-token...
Content-Type: application/json

{
  "sessionId": "session-003"
}

EXPECTED RESPONSE:
{
  "sessionId": "session-003",
  "employeeId": "staff-002",
  "loginTime": "2025-12-17T09:00:00Z",
  "logoutTime": "2025-12-17T17:00:00Z",
  "totalHours": 8.0,
  "isActive": false,
  "status": "COMPLETED"
}
```

---

## 4. DRIVER WORKFLOW (COMPLETE CYCLE)

### Flow 4A: Driver Goes Online

**Step 1: Driver Logs In**
```http
POST /api/users/login
Content-Type: application/json

{
  "email": "driver@masova.com",
  "password": "DriverPass123"
}

EXPECTED RESPONSE:
{
  "accessToken": "driver-token...",
  "user": {
    "id": "driver-001",
    "type": "DRIVER",
    "storeId": "store-001"
  }
}
```

**Step 2: Driver Clocks In**
```http
POST /api/users/sessions/start
Authorization: Bearer driver-token...
X-User-Store-Id: store-001

{
  "employeeId": "driver-001",
  "storeId": "store-001"
}

EXPECTED RESPONSE:
{
  "sessionId": "session-004",
  "isActive": true
}
```

**Step 3: Driver Sets Status to Available**
```http
PUT /api/delivery/driver/status
Authorization: Bearer driver-token...
Content-Type: application/json

{
  "driverId": "driver-001",
  "status": "AVAILABLE"
}

EXPECTED RESPONSE:
{
  "driverId": "driver-001",
  "status": "AVAILABLE",
  "updatedAt": "2025-12-17T10:00:00Z"
}
```

---

### Flow 4B: Driver Receives & Accepts Delivery

**Step 1: Driver Receives Assignment (WebSocket)**
```
WebSocket Connection: /ws/delivery
Subscribe to: /topic/driver/driver-001/assignments

Message Received:
{
  "trackingId": "tracking-002",
  "orderId": "order-003",
  "orderNumber": "ORD-20251217-003",
  "customerName": "Jane Customer",
  "customerPhone": "9333333333",
  "pickupAddress": "MaSoVa Downtown, 123 Main St",
  "deliveryAddress": "456 Park Ave",
  "estimatedDistance": 3.2,
  "assignedAt": "2025-12-17T11:00:00Z",
  "acceptTimeout": "2025-12-17T11:05:00Z"
}
```

**Step 2: Get Pending Deliveries**
```http
GET /api/delivery/driver/driver-001/pending
Authorization: Bearer driver-token...

EXPECTED RESPONSE:
[
  {
    "trackingId": "tracking-002",
    "orderId": "order-003",
    "status": "ASSIGNED",
    "customerName": "Jane Customer",
    "deliveryAddress": {
      "street": "456 Park Ave",
      "latitude": 19.0800,
      "longitude": 72.8800
    }
  }
]
```

**Step 3: Driver Accepts Delivery**
```http
POST /api/delivery/accept
Authorization: Bearer driver-token...
Content-Type: application/json

{
  "trackingId": "tracking-002",
  "driverId": "driver-001",
  "estimatedPickupMinutes": 10
}

EXPECTED RESPONSE:
{
  "status": "ACCEPTED",
  "acceptedAt": "2025-12-17T11:01:00Z",
  "estimatedDeliveryMinutes": 25
}
```

---

### Flow 4C: Driver Rejection & Reassignment

**Alternative: Driver Rejects Delivery**
```http
POST /api/delivery/reject
Authorization: Bearer driver-token...
Content-Type: application/json

{
  "trackingId": "tracking-002",
  "driverId": "driver-001",
  "reason": "VEHICLE_ISSUE",
  "additionalNotes": "Bike has flat tire"
}

EXPECTED RESPONSE:
{
  "status": "REJECTED",
  "rejectedAt": "2025-12-17T11:01:00Z",
  "reassignmentTriggered": true,
  "newDriverId": "driver-002",
  "reassignmentCount": 1
}

Note: System auto-assigns to next available driver
Max 3 reassignments before manager escalation
```

---

### Flow 4D: Driver Pickup & Delivery

**Step 1: Navigate to Restaurant**
```http
POST /api/delivery/route-optimize
Authorization: Bearer driver-token...
Content-Type: application/json

{
  "origin": {
    "latitude": 19.0700,
    "longitude": 72.8700
  },
  "destination": {
    "latitude": 19.0760,
    "longitude": 72.8777
  },
  "travelMode": "DRIVING"
}

EXPECTED RESPONSE:
{
  "distanceKm": 2.1,
  "durationMinutes": 8,
  "polyline": "encoded_polyline_string...",
  "steps": [
    {
      "instruction": "Head north on Main St",
      "distanceMeters": 500,
      "durationSeconds": 60
    }
  ]
}
```

**Step 2: Driver Marks Pickup**
```http
POST /api/delivery/tracking-002/pickup
Authorization: Bearer driver-token...

EXPECTED RESPONSE:
{
  "trackingId": "tracking-002",
  "status": "PICKED_UP",
  "pickedUpAt": "2025-12-17T11:10:00Z"
}
```

**Step 3: Driver Updates Location (Every 30 seconds)**
```http
POST /api/delivery/location-update
Authorization: Bearer driver-token...
Content-Type: application/json

{
  "driverId": "driver-001",
  "latitude": 19.0750,
  "longitude": 72.8750,
  "accuracy": 5.0,
  "speed": 20.5,
  "heading": 90.0,
  "timestamp": "2025-12-17T11:15:00Z"
}

EXPECTED RESPONSE:
{
  "success": true
}
```

**Step 4: Driver Marks In Transit**
```http
POST /api/delivery/tracking-002/in-transit
Authorization: Bearer driver-token...

EXPECTED RESPONSE:
{
  "trackingId": "tracking-002",
  "status": "IN_TRANSIT",
  "inTransitAt": "2025-12-17T11:12:00Z"
}
```

**Step 5: Driver Marks Arrival**
```http
POST /api/delivery/tracking-002/arrived
Authorization: Bearer driver-token...

EXPECTED RESPONSE:
{
  "trackingId": "tracking-002",
  "status": "ARRIVED",
  "arrivedAt": "2025-12-17T11:25:00Z"
}
```

**Step 6: Generate & Verify OTP**
```http
POST /api/delivery/order-003/generate-otp
Authorization: Bearer driver-token...

EXPECTED RESPONSE:
{
  "orderId": "order-003",
  "otp": "7392"
}
```

```http
POST /api/delivery/verify-otp
Authorization: Bearer driver-token...
Content-Type: application/json

{
  "orderId": "order-003",
  "otp": "7392"
}

EXPECTED RESPONSE:
{
  "verified": true,
  "verifiedAt": "2025-12-17T11:27:00Z",
  "proofType": "OTP"
}
```

**Step 7: Mark Order Delivered**
```http
PUT /api/v1/orders/order-003/mark-delivered
Authorization: Bearer driver-token...
Content-Type: application/json

{
  "proofType": "OTP"
}

EXPECTED RESPONSE:
{
  "id": "order-003",
  "status": "DELIVERED",
  "deliveredAt": "2025-12-17T11:27:00Z"
}
```

**Step 8: Driver Views Performance**
```http
GET /api/delivery/driver/driver-001/performance/today
Authorization: Bearer driver-token...

EXPECTED RESPONSE:
{
  "driverId": "driver-001",
  "date": "2025-12-17",
  "deliveriesCompleted": 5,
  "onTimeDeliveries": 4,
  "onTimeRate": 80.0,
  "averageDeliveryTime": 22.5,
  "totalEarnings": 450.00,
  "averageRating": 4.6
}
```

---

### Flow 4E: Driver Goes Offline

**Step 1: Driver Sets Status to Off Duty**
```http
PUT /api/delivery/driver/status
Authorization: Bearer driver-token...
Content-Type: application/json

{
  "driverId": "driver-001",
  "status": "OFF_DUTY"
}

EXPECTED RESPONSE:
{
  "driverId": "driver-001",
  "status": "OFF_DUTY",
  "updatedAt": "2025-12-17T18:00:00Z"
}
```

**Step 2: Driver Clocks Out**
```http
POST /api/users/sessions/end
Authorization: Bearer driver-token...
Content-Type: application/json

{
  "sessionId": "session-004"
}

EXPECTED RESPONSE:
{
  "sessionId": "session-004",
  "totalHours": 8.0,
  "status": "COMPLETED"
}
```

---

## 5. MANAGER WORKFLOWS

### Flow 5A: Store Management

**Step 1: Manager Views Store Details**
```http
GET /api/stores/store-001
Authorization: Bearer mgr-token...

EXPECTED RESPONSE:
{
  "id": "store-001",
  "name": "MaSoVa Downtown",
  "storeCode": "MSD001",
  "address": "123 Main St, City",
  "phone": "9999999999",
  "email": "downtown@masova.com",
  "isActive": true,
  "deliveryRadius": 10.0,
  "operatingHours": {
    "monday": {"open": "09:00", "close": "22:00"},
    "tuesday": {"open": "09:00", "close": "22:00"}
  }
}
```

**Step 2: Update Store Hours**
```http
PUT /api/stores/store-001
Authorization: Bearer mgr-token...
Content-Type: application/json

{
  "operatingHours": {
    "monday": {"open": "08:00", "close": "23:00"}
  }
}

EXPECTED RESPONSE:
{
  "id": "store-001",
  "operatingHours": {
    "monday": {"open": "08:00", "close": "23:00"}
  }
}
```

---

### Flow 5B: Employee Management

**Step 1: View Store Employees**
```http
GET /api/users/store
Authorization: Bearer mgr-token...
X-User-Store-Id: store-001

EXPECTED RESPONSE:
[
  {
    "id": "staff-001",
    "name": "Sarah Kitchen",
    "type": "STAFF",
    "role": "KITCHEN_STAFF",
    "email": "sarah.kitchen@masova.com",
    "phone": "9123456789",
    "status": "ACTIVE"
  },
  {
    "id": "driver-001",
    "name": "Mike Delivery",
    "type": "DRIVER",
    "phone": "9111111111",
    "status": "ACTIVE"
  }
]
```

**Step 2: View Active Working Sessions**
```http
GET /api/users/sessions/store/active
Authorization: Bearer mgr-token...
X-User-Store-Id: store-001

EXPECTED RESPONSE:
[
  {
    "sessionId": "session-001",
    "employeeId": "staff-001",
    "employeeName": "Sarah Kitchen",
    "loginTime": "2025-12-17T09:00:00Z",
    "hoursWorked": 4.5,
    "isActive": true
  }
]
```

**Step 3: Create Shift Schedule**
```http
POST /api/shifts
Authorization: Bearer mgr-token...
Content-Type: application/json

{
  "employeeId": "staff-001",
  "storeId": "store-001",
  "startTime": "2025-12-18T09:00:00Z",
  "endTime": "2025-12-18T17:00:00Z",
  "shiftType": "MORNING",
  "notes": "Kitchen prep shift"
}

EXPECTED RESPONSE:
{
  "shiftId": "shift-001",
  "employeeId": "staff-001",
  "startTime": "2025-12-18T09:00:00Z",
  "endTime": "2025-12-18T17:00:00Z",
  "status": "SCHEDULED"
}
```

---

### Flow 5C: Order Management & Analytics

**Step 1: View Store Orders by Date**
```http
GET /api/v1/orders/date/2025-12-17
Authorization: Bearer mgr-token...
X-User-Store-Id: store-001

EXPECTED RESPONSE:
[
  {
    "id": "order-001",
    "orderNumber": "ORD-20251217-001",
    "customerName": "John Smith",
    "total": 1076.85,
    "status": "DELIVERED",
    "orderType": "DELIVERY"
  },
  {
    "id": "order-002",
    "orderNumber": "ORD-20251217-002",
    "customerName": "Sarah Walk-In",
    "total": 366.45,
    "status": "DELIVERED",
    "orderType": "PICKUP"
  }
]
```

**Step 2: Get Kitchen Analytics**
```http
GET /api/v1/orders/store/avg-prep-time
Authorization: Bearer mgr-token...
X-User-Store-Id: store-001

EXPECTED RESPONSE:
{
  "storeId": "store-001",
  "averagePreparationTimeMinutes": 27.5,
  "sampleSize": 45,
  "date": "2025-12-17"
}
```

**Step 3: Get Staff Performance**
```http
GET /api/v1/orders/analytics/pos-staff/staff-002/performance?startDate=2025-12-01&endDate=2025-12-17
Authorization: Bearer mgr-token...

EXPECTED RESPONSE:
{
  "staffId": "staff-002",
  "staffName": "Jane POS",
  "ordersProcessed": 125,
  "totalRevenue": 45678.90,
  "averageOrderValue": 365.43,
  "period": {
    "start": "2025-12-01",
    "end": "2025-12-17"
  }
}
```

---

### Flow 5D: Payment Reconciliation

**Step 1: Get Daily Reconciliation Report**
```http
GET /api/v1/payments/reconciliation?date=2025-12-17
Authorization: Bearer mgr-token...
X-User-Store-Id: store-001

EXPECTED RESPONSE:
{
  "date": "2025-12-17",
  "storeId": "store-001",
  "totalTransactions": 50,
  "successfulTransactions": 48,
  "failedTransactions": 2,
  "totalAmount": 25678.90,
  "cashPayments": {
    "count": 15,
    "amount": 5678.90
  },
  "onlinePayments": {
    "count": 33,
    "amount": 20000.00
  },
  "reconciledCount": 45,
  "pendingReconciliation": 3
}
```

**Step 2: Mark Transaction as Reconciled**
```http
POST /api/v1/payments/txn-001/reconcile
Authorization: Bearer mgr-token...

EXPECTED RESPONSE:
{
  "transactionId": "txn-001",
  "reconciled": true,
  "reconciledAt": "2025-12-17T20:00:00Z",
  "reconciledBy": "mgr-001"
}
```

---

### Flow 5E: Customer Management & Loyalty

**Step 1: View High-Value Customers**
```http
GET /api/customers/high-value?minSpending=10000
Authorization: Bearer mgr-token...
X-User-Store-Id: store-001

EXPECTED RESPONSE:
[
  {
    "id": "cust-125",
    "name": "Premium Customer",
    "email": "premium@example.com",
    "phone": "9444444444",
    "totalSpent": 25678.90,
    "totalOrders": 45,
    "loyaltyTier": "GOLD",
    "availablePoints": 2567
  }
]
```

**Step 2: View Inactive Customers**
```http
GET /api/customers/inactive?days=90
Authorization: Bearer mgr-token...

EXPECTED RESPONSE:
[
  {
    "id": "cust-126",
    "name": "Inactive Customer",
    "email": "inactive@example.com",
    "lastOrderDate": "2025-09-01",
    "daysSinceLastOrder": 107
  }
]
```

---

### Flow 5F: Campaign Management

**Step 1: Create Marketing Campaign**
```http
POST /api/campaigns
Authorization: Bearer mgr-token...
Content-Type: application/json

{
  "name": "Winter Special Offer",
  "description": "20% off on all pizzas",
  "channel": "SMS",
  "subject": "Winter Special 🍕",
  "message": "Get 20% off on all pizzas this winter! Use code WINTER20 at checkout. Valid until Dec 31.",
  "segment": "FREQUENT_CUSTOMERS",
  "storeId": "store-001"
}

EXPECTED RESPONSE:
{
  "campaignId": "campaign-001",
  "name": "Winter Special Offer",
  "status": "DRAFT",
  "createdAt": "2025-12-17T14:00:00Z"
}
```

**Step 2: Schedule Campaign**
```http
POST /api/campaigns/campaign-001/schedule
Authorization: Bearer mgr-token...
Content-Type: application/json

{
  "scheduledFor": "2025-12-18T10:00:00Z"
}

EXPECTED RESPONSE:
{
  "campaignId": "campaign-001",
  "status": "SCHEDULED",
  "scheduledFor": "2025-12-18T10:00:00Z"
}
```

**Step 3: Execute Campaign Immediately**
```http
POST /api/campaigns/campaign-001/execute
Authorization: Bearer mgr-token...

EXPECTED RESPONSE:
{
  "campaignId": "campaign-001",
  "status": "SENDING",
  "targetRecipients": 250,
  "executionStarted": "2025-12-17T14:05:00Z"
}

Note: Campaign executes asynchronously
```

**Step 4: View Campaign Statistics**
```http
GET /api/campaigns/campaign-001
Authorization: Bearer mgr-token...

EXPECTED RESPONSE:
{
  "campaignId": "campaign-001",
  "name": "Winter Special Offer",
  "status": "COMPLETED",
  "statistics": {
    "totalRecipients": 250,
    "sent": 248,
    "delivered": 245,
    "failed": 3,
    "opened": 180,
    "clicked": 45
  },
  "completedAt": "2025-12-17T14:15:00Z"
}
```

---

### Flow 5G: Review Management

**Step 1: View Reviews Needing Response**
```http
GET /api/reviews/needs-response?page=0&size=10
Authorization: Bearer mgr-token...

EXPECTED RESPONSE:
{
  "content": [
    {
      "id": "review-002",
      "orderId": "order-004",
      "overallRating": 3,
      "comment": "Food was cold when it arrived",
      "sentiment": "NEGATIVE",
      "createdAt": "2025-12-17T13:00:00Z",
      "hasResponse": false
    }
  ],
  "totalElements": 5,
  "totalPages": 1
}
```

**Step 2: Respond to Negative Review**
```http
POST /api/responses/review/review-002
Authorization: Bearer mgr-token...
Content-Type: application/json

{
  "responseText": "We sincerely apologize for your experience. We'd like to make this right. Please contact us at downtown@masova.com for a full refund.",
  "responseType": "APOLOGY"
}

EXPECTED RESPONSE:
{
  "id": "response-002",
  "reviewId": "review-002",
  "responseText": "We sincerely apologize...",
  "responseType": "APOLOGY",
  "respondedBy": "mgr-001"
}
```

**Step 3: View Flagged Reviews**
```http
GET /api/reviews/flagged
Authorization: Bearer mgr-token...

EXPECTED RESPONSE:
[
  {
    "id": "review-003",
    "comment": "Inappropriate content",
    "status": "FLAGGED",
    "flaggedAt": "2025-12-17T12:00:00Z"
  }
]
```

**Step 4: Reject Inappropriate Review**
```http
POST /api/reviews/review-003/reject?reason=Inappropriate language
Authorization: Bearer mgr-token...

EXPECTED RESPONSE:
{
  "id": "review-003",
  "status": "REJECTED",
  "rejectedAt": "2025-12-17T14:30:00Z",
  "rejectedBy": "mgr-001"
}
```

---

### Flow 5H: Driver Performance Monitoring

**Step 1: View Driver Performance**
```http
GET /api/delivery/driver/driver-001/performance?startDate=2025-12-01&endDate=2025-12-17
Authorization: Bearer mgr-token...

EXPECTED RESPONSE:
{
  "driverId": "driver-001",
  "driverName": "Mike Delivery",
  "period": {
    "start": "2025-12-01",
    "end": "2025-12-17"
  },
  "totalDeliveries": 125,
  "onTimeDeliveries": 110,
  "onTimeRate": 88.0,
  "averageDeliveryTime": 23.5,
  "averageRating": 4.5,
  "totalEarnings": 3750.00,
  "rejectionCount": 2,
  "customerComplaints": 1
}
```

**Step 2: View Driver Rating Statistics**
```http
GET /api/reviews/stats/driver/driver-001
Authorization: Bearer mgr-token...

EXPECTED RESPONSE:
{
  "driverId": "driver-001",
  "averageRating": 4.5,
  "totalRatings": 98,
  "ratingDistribution": {
    "5": 65,
    "4": 25,
    "3": 5,
    "2": 2,
    "1": 1
  },
  "last30DaysTrend": "+0.2",
  "performanceStatus": "EXCELLENT"
}
```

---

### Flow 5I: Menu Management

**Step 1: View All Menu Items**
```http
GET /api/menu/items
Authorization: Bearer mgr-token...
X-User-Store-Id: store-001

EXPECTED RESPONSE:
[
  {
    "id": "menu-001",
    "name": "Margherita Pizza",
    "price": 299.00,
    "category": "PIZZA",
    "available": true
  }
]
```

**Step 2: Create New Menu Item**
```http
POST /api/menu/items
Authorization: Bearer mgr-token...
Content-Type: application/json

{
  "name": "BBQ Chicken Pizza",
  "description": "Smoky BBQ sauce with chicken",
  "price": 399.00,
  "category": "PIZZA",
  "cuisine": "AMERICAN",
  "dietaryType": "NON_VEGETARIAN",
  "preparationTime": 25,
  "storeId": "store-001",
  "available": true,
  "image": "https://...",
  "tags": ["new", "popular"]
}

EXPECTED RESPONSE:
{
  "id": "menu-004",
  "name": "BBQ Chicken Pizza",
  "price": 399.00,
  "available": true,
  "createdAt": "2025-12-17T15:00:00Z"
}
```

**Step 3: Toggle Item Availability**
```http
PATCH /api/menu/items/menu-001/availability
Authorization: Bearer mgr-token...

EXPECTED RESPONSE:
{
  "id": "menu-001",
  "available": false,
  "updatedAt": "2025-12-17T15:05:00Z"
}
```

**Step 4: Copy Menu to Another Store**
```http
POST /api/menu/copy-menu?sourceStoreId=store-001&targetStoreId=store-002
Authorization: Bearer mgr-token...

EXPECTED RESPONSE:
{
  "sourceStoreId": "store-001",
  "targetStoreId": "store-002",
  "itemsCopied": 25,
  "copiedAt": "2025-12-17T15:10:00Z"
}
```

---

## 6. WEBSOCKET REAL-TIME UPDATES

### Flow 6A: Customer Order Tracking WebSocket

**Step 1: Establish WebSocket Connection**
```javascript
// Frontend establishes connection
const socket = new SockJS('http://localhost:8080/ws/delivery');
const stompClient = Stomp.over(socket);

stompClient.connect({}, function(frame) {
  // Subscribe to customer's order updates
  stompClient.subscribe(
    '/queue/customer/cust-123/orders',
    function(message) {
      const update = JSON.parse(message.body);
      console.log('Order update:', update);
    }
  );
});
```

**Step 2: Receive Order Status Update**
```javascript
// Message received when order status changes
{
  "orderId": "order-001",
  "orderNumber": "ORD-20251217-001",
  "status": "PREPARING",
  "timestamp": "2025-12-17T10:25:00Z",
  "estimatedDeliveryTime": "2025-12-17T11:00:00Z"
}
```

**Step 3: Receive Driver Location Update**
```javascript
// Message received when driver updates location
{
  "orderId": "order-001",
  "driverLocation": {
    "latitude": 19.0750,
    "longitude": 72.8770
  },
  "distanceRemainingKm": 1.2,
  "timeRemainingMinutes": 8,
  "estimatedArrival": "2025-12-17T11:13:00Z"
}
```

---

### Flow 6B: Kitchen Display WebSocket

**Step 1: Subscribe to Kitchen Queue**
```javascript
stompClient.subscribe(
  '/topic/store/store-001/kitchen',
  function(message) {
    const orderUpdate = JSON.parse(message.body);
    // Update kitchen display
  }
);
```

**Step 2: Receive New Order**
```javascript
{
  "type": "NEW_ORDER",
  "order": {
    "id": "order-005",
    "orderNumber": "ORD-20251217-005",
    "items": [...],
    "status": "RECEIVED",
    "priority": "NORMAL"
  }
}
```

**Step 3: Receive Status Update**
```javascript
{
  "type": "STATUS_UPDATE",
  "orderId": "order-005",
  "oldStatus": "RECEIVED",
  "newStatus": "PREPARING",
  "updatedBy": "staff-001"
}
```

---

### Flow 6C: Driver Assignment WebSocket

**Step 1: Driver Subscribes to Assignments**
```javascript
stompClient.subscribe(
  '/topic/driver/driver-001/assignments',
  function(message) {
    const assignment = JSON.parse(message.body);
    // Show notification to driver
  }
);
```

**Step 2: Receive New Assignment**
```javascript
{
  "type": "NEW_ASSIGNMENT",
  "trackingId": "tracking-003",
  "orderId": "order-006",
  "customerName": "Alice Customer",
  "pickupAddress": "MaSoVa Downtown",
  "deliveryAddress": "789 Maple St",
  "estimatedDistance": 4.5,
  "acceptTimeout": "2025-12-17T12:05:00Z"
}
```

---

## 7. ERROR HANDLING SCENARIOS

### Flow 7A: Payment Failure & Retry

**Step 1: Payment Verification Fails**
```http
POST /api/v1/payments/verify
Content-Type: application/json

{
  "razorpayOrderId": "order_MBkTxyz123",
  "razorpayPaymentId": "pay_invalid",
  "razorpaySignature": "invalid_signature"
}

EXPECTED RESPONSE (400 Bad Request):
{
  "error": "PAYMENT_VERIFICATION_FAILED",
  "message": "Invalid payment signature",
  "transactionId": "txn-001",
  "status": "FAILED"
}
```

**Step 2: Customer Retries Payment**
```http
POST /api/v1/payments/initiate
Authorization: Bearer cust-token...
Content-Type: application/json

{
  "orderId": "order-001",
  "amount": 1076.85,
  "customerId": "cust-123"
}

EXPECTED RESPONSE:
{
  "transactionId": "txn-003",
  "razorpayOrderId": "order_new123",
  "status": "INITIATED"
}
```

---

### Flow 7B: Driver Rejection Escalation

**Step 1: First Driver Rejects**
```http
POST /api/delivery/reject
Content-Type: application/json

{
  "trackingId": "tracking-004",
  "driverId": "driver-001",
  "reason": "TOO_FAR"
}

EXPECTED RESPONSE:
{
  "status": "REJECTED",
  "reassignmentCount": 1,
  "newDriverId": "driver-002"
}
```

**Step 2: Second Driver Rejects**
```http
POST /api/delivery/reject
Content-Type: application/json

{
  "trackingId": "tracking-004",
  "driverId": "driver-002",
  "reason": "BUSY"
}

EXPECTED RESPONSE:
{
  "status": "REJECTED",
  "reassignmentCount": 2,
  "newDriverId": "driver-003"
}
```

**Step 3: Third Driver Rejects (Escalation)**
```http
POST /api/delivery/reject
Content-Type: application/json

{
  "trackingId": "tracking-004",
  "driverId": "driver-003",
  "reason": "VEHICLE_ISSUE"
}

EXPECTED RESPONSE:
{
  "status": "ESCALATED",
  "reassignmentCount": 3,
  "escalatedToManager": true,
  "message": "Maximum reassignments reached. Manager intervention required."
}

WebSocket Notification to Manager:
Topic: /topic/store/store-001/escalations
{
  "type": "DELIVERY_ESCALATION",
  "orderId": "order-007",
  "reason": "Max driver rejections exceeded",
  "rejectionHistory": [...]
}
```

---

### Flow 7C: Order Outside Delivery Zone

**Step 1: Check Delivery Zone**
```http
GET /api/delivery/zone/check?storeId=store-001&lat=20.0000&lng=73.0000

EXPECTED RESPONSE:
{
  "isWithinDeliveryZone": false,
  "zone": null,
  "distanceKm": 35.2,
  "message": "Address is outside delivery radius (10km)"
}
```

**Step 2: Frontend Prevents Order Creation**
```
Frontend displays error:
"Sorry, we don't deliver to this location yet.
Please choose pickup or select a different store."
```

---

### Flow 7D: Menu Item Unavailable

**Step 1: Customer Adds Item to Cart**
```
Frontend fetches menu item:
{
  "id": "menu-005",
  "name": "Special Pizza",
  "available": false
}
```

**Step 2: Frontend Prevents Addition**
```
UI displays:
"This item is currently unavailable"
Add to Cart button disabled
```

---

## 8. REFUND WORKFLOW

### Flow 8A: Customer Requests Refund

**Step 1: Manager Initiates Refund**
```http
POST /api/v1/payments/refund
Authorization: Bearer mgr-token...
Content-Type: application/json

{
  "transactionId": "txn-001",
  "amount": 1076.85,
  "type": "FULL",
  "reason": "Customer complaint - cold food",
  "speed": "optimum"
}

EXPECTED RESPONSE:
{
  "refundId": "refund-001",
  "transactionId": "txn-001",
  "orderId": "order-001",
  "amount": 1076.85,
  "status": "INITIATED",
  "razorpayRefundId": "rfnd_xyz123",
  "createdAt": "2025-12-17T16:00:00Z"
}
```

**Step 2: Razorpay Webhook (Refund Processed)**
```http
POST /api/payments/webhook
X-Razorpay-Signature: signature...
Content-Type: application/json

{
  "event": "refund.processed",
  "payload": {
    "refund": {
      "entity": {
        "id": "rfnd_xyz123",
        "amount": 107685,
        "status": "processed"
      }
    }
  }
}

System updates refund status to SUCCESS
```

**Step 3: Get Refund Details**
```http
GET /api/v1/payments/refund/refund-001
Authorization: Bearer mgr-token...

EXPECTED RESPONSE:
{
  "refundId": "refund-001",
  "transactionId": "txn-001",
  "amount": 1076.85,
  "status": "SUCCESS",
  "processedAt": "2025-12-17T16:05:00Z",
  "customerNotified": true
}
```

---

## 9. GDPR & DATA MANAGEMENT

### Flow 9A: Customer Requests Data Deletion

**Step 1: Customer Requests Account Deletion**
```http
DELETE /api/customers/cust-123/gdpr
Authorization: Bearer cust-token...

EXPECTED RESPONSE:
{
  "customerId": "cust-123",
  "status": "ANONYMIZED",
  "message": "Your personal data has been anonymized in compliance with GDPR",
  "processedAt": "2025-12-17T17:00:00Z",
  "dataRetained": {
    "orders": "Order history anonymized",
    "reviews": "Reviews retained without personal info",
    "transactions": "Transaction records anonymized"
  }
}
```

---

## SUMMARY OF KEY ENDPOINTS

### Authentication (8 endpoints)
- POST /api/users/register
- POST /api/users/login
- POST /api/users/refresh
- POST /api/users/logout
- POST /api/users/create (Manager)
- POST /api/users/sessions/start
- POST /api/users/sessions/end
- POST /api/users/sessions/clock-in-with-pin

### Orders (25+ endpoints)
- POST /api/v1/orders
- GET /api/v1/orders/{orderId}
- PATCH /api/v1/orders/{orderId}/status
- PATCH /api/v1/orders/{orderId}/next-stage
- GET /api/v1/orders/kitchen
- POST /api/v1/orders/{orderId}/quality-checkpoint
- PUT /api/v1/orders/{orderId}/mark-delivered

### Payments (15+ endpoints)
- POST /api/v1/payments/initiate
- POST /api/v1/payments/verify
- POST /api/v1/payments/cash
- POST /api/v1/payments/refund
- GET /api/v1/payments/reconciliation

### Delivery (20+ endpoints)
- POST /api/delivery/auto-dispatch
- POST /api/delivery/accept
- POST /api/delivery/reject
- POST /api/delivery/location-update
- GET /api/delivery/track/{orderId}
- POST /api/delivery/verify-otp
- GET /api/delivery/zone/check
- GET /api/delivery/zone/fee

### Reviews (15+ endpoints)
- POST /api/reviews
- POST /api/reviews/public/submit
- GET /api/reviews/stats/overall
- POST /api/responses/review/{reviewId}
- GET /api/reviews/needs-response

### Customers (20+ endpoints)
- POST /api/customers
- POST /api/customers/{id}/loyalty/points
- POST /api/customers/{id}/loyalty/redeem
- GET /api/customers/high-value
- POST /api/customers/{id}/addresses

### Campaigns (8 endpoints)
- POST /api/campaigns
- POST /api/campaigns/{id}/execute
- POST /api/campaigns/{id}/schedule
- GET /api/campaigns/{id}

### Menu (15+ endpoints)
- GET /api/menu/public
- POST /api/menu/items
- PATCH /api/menu/items/{id}/availability
- POST /api/menu/copy-menu

---

## TESTING CHECKLIST

### Authentication Flow
- ✅ Customer registration
- ✅ Staff/Driver login
- ✅ Manager creates employee
- ✅ Token refresh
- ✅ Clock in/out with PIN

### Complete Order Lifecycle
- ✅ Browse menu
- ✅ Add to cart
- ✅ Check delivery zone
- ✅ Calculate delivery fee
- ✅ Initiate payment (Razorpay)
- ✅ Verify payment
- ✅ Create order
- ✅ Kitchen workflow (all stages)
- ✅ Auto-dispatch driver
- ✅ Driver accepts/rejects
- ✅ Real-time tracking
- ✅ Proof of delivery (OTP/Photo)
- ✅ Order completion
- ✅ Customer rating
- ✅ Manager response

### POS Workflow
- ✅ Staff clock in
- ✅ Create walk-in customer
- ✅ Create pickup order
- ✅ Process cash payment
- ✅ Kitchen prep
- ✅ Customer pickup

### Driver Workflow
- ✅ Go online
- ✅ Receive assignment
- ✅ Accept delivery
- ✅ Navigate & track location
- ✅ Pickup order
- ✅ In-transit updates
- ✅ Verify delivery
- ✅ Complete delivery
- ✅ View performance
- ✅ Go offline

### Manager Operations
- ✅ View store details
- ✅ Manage employees
- ✅ Create shifts
- ✅ View orders & analytics
- ✅ Payment reconciliation
- ✅ Customer management
- ✅ Create campaigns
- ✅ Review management
- ✅ Menu management
- ✅ Driver performance

### WebSocket Real-Time
- ✅ Customer order tracking
- ✅ Kitchen display updates
- ✅ Driver assignments
- ✅ Location updates

### Error Scenarios
- ✅ Payment failures
- ✅ Driver rejection escalation
- ✅ Outside delivery zone
- ✅ Unavailable items
- ✅ Refund processing

---

This comprehensive testing guide covers the complete end-to-end experience across all user roles (Customer, Staff, Driver, Manager) with realistic example requests and responses. Each flow demonstrates the full lifecycle from initiation to completion with proper authentication, authorization, and WebSocket real-time updates.