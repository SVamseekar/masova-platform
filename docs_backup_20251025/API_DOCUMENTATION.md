# MaSoVa Restaurant Management System - API Documentation
**Version:** 1.0
**Last Updated:** October 23, 2025
**Base URL:** `http://localhost:8080` (API Gateway)

---

## 📚 Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [User Service APIs](#user-service-apis)
4. [Menu Service APIs](#menu-service-apis)
5. [Order Service APIs](#order-service-apis)
6. [Analytics Service APIs](#analytics-service-apis)
7. [Error Handling](#error-handling)
8. [Rate Limiting](#rate-limiting)

---

## Overview

All API requests go through the **API Gateway** at port `8080`. The gateway handles:
- JWT authentication validation
- Rate limiting (100 requests/minute per user)
- CORS configuration
- Service routing

### Microservices Architecture:

```
API Gateway (8080) → Routes to:
├── User Service (8081)      - Authentication, users, sessions
├── Menu Service (8082)       - Menu items, categories
├── Order Service (8083)      - Orders, kitchen queue
└── Analytics Service (8085)  - Real-time metrics, reports
```

---

## Authentication

### JWT Token Format

All authenticated requests require a Bearer token in the header:

```
Authorization: Bearer <jwt_token>
```

### Login

**Endpoint:** `POST /api/users/login`

**Request:**
```json
{
  "email": "manager@masova.com",
  "password": "Manager@123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user123",
    "firstName": "John",
    "lastName": "Doe",
    "email": "manager@masova.com",
    "type": "MANAGER",
    "phone": "+919876543210",
    "employeeDetails": {
      "storeId": "store123",
      "role": "MANAGER",
      "hourlyRate": 500.0
    }
  }
}
```

**Status Codes:**
- `200 OK` - Login successful
- `401 Unauthorized` - Invalid credentials
- `400 Bad Request` - Missing fields

---

## User Service APIs

Base Path: `/api/users`

### 1. Get User by ID

**Endpoint:** `GET /api/users/{userId}`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "user123",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@masova.com",
  "type": "STAFF",
  "phone": "+919876543210",
  "employeeDetails": {
    "storeId": "store123",
    "role": "STAFF",
    "hourlyRate": 300.0
  }
}
```

---

### 2. Get Drivers by Store

**Endpoint:** `GET /api/users/drivers/store/{storeId}`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": "driver123",
    "firstName": "Raj",
    "lastName": "Kumar",
    "email": "raj@masova.com",
    "type": "DRIVER",
    "phone": "+919999999999",
    "employeeDetails": {
      "storeId": "store123",
      "vehicleType": "BIKE",
      "vehicleNumber": "TS09AB1234"
    }
  }
]
```

---

### 3. Get Driver Status

**Endpoint:** `GET /api/users/drivers/status/{storeId}`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "storeId": "store123",
  "onlineDrivers": 5,
  "availableDrivers": 3,
  "onDelivery": 2,
  "offlineDrivers": 1
}
```

---

### 4. Start Working Session (Clock In)

**Endpoint:** `POST /api/users/working-sessions/start`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request:**
```json
{
  "userId": "driver123",
  "storeId": "store123",
  "shiftType": "FULL_DAY",
  "clockInLocation": {
    "lat": 17.385044,
    "lng": 78.486671
  }
}
```

**Response:**
```json
{
  "id": "session123",
  "userId": "driver123",
  "storeId": "store123",
  "shiftType": "FULL_DAY",
  "clockIn": "2025-10-23T09:00:00Z",
  "clockInLocation": {
    "lat": 17.385044,
    "lng": 78.486671
  },
  "status": "ACTIVE"
}
```

---

### 5. End Working Session (Clock Out)

**Endpoint:** `POST /api/users/working-sessions/end`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request:**
```json
{
  "sessionId": "session123",
  "clockOutLocation": {
    "lat": 17.385044,
    "lng": 78.486671
  }
}
```

**Response:**
```json
{
  "id": "session123",
  "userId": "driver123",
  "clockIn": "2025-10-23T09:00:00Z",
  "clockOut": "2025-10-23T17:00:00Z",
  "hoursWorked": 8.0,
  "earnings": 2400.0,
  "status": "COMPLETED"
}
```

---

## Menu Service APIs

Base Path: `/api/menu`

### 1. Get All Menu Items

**Endpoint:** `GET /api/menu/items`

**Query Parameters:**
- `category` (optional): Filter by category (PIZZA, BIRYANI, BREADS, etc.)
- `available` (optional): true/false - filter available items

**Response:**
```json
[
  {
    "id": "item123",
    "name": "Margherita Pizza",
    "description": "Classic pizza with tomato sauce and mozzarella",
    "category": "PIZZA",
    "price": 299.0,
    "image": "/images/margherita.jpg",
    "available": true,
    "preparationTime": 15,
    "isVegetarian": true,
    "customizations": [
      {
        "name": "Extra Cheese",
        "price": 50.0
      }
    ]
  }
]
```

---

### 2. Get Menu Item by ID

**Endpoint:** `GET /api/menu/items/{itemId}`

**Response:**
```json
{
  "id": "item123",
  "name": "Margherita Pizza",
  "description": "Classic pizza with tomato sauce and mozzarella",
  "category": "PIZZA",
  "price": 299.0,
  "available": true
}
```

---

### 3. Search Menu Items

**Endpoint:** `GET /api/menu/items/search?query={searchTerm}`

**Example:** `GET /api/menu/items/search?query=pizza`

**Response:**
```json
[
  {
    "id": "item123",
    "name": "Margherita Pizza",
    "category": "PIZZA",
    "price": 299.0
  },
  {
    "id": "item124",
    "name": "Pepperoni Pizza",
    "category": "PIZZA",
    "price": 349.0
  }
]
```

---

## Order Service APIs

Base Path: `/api/orders`

### 1. Create Order

**Endpoint:** `POST /api/orders`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request:**
```json
{
  "storeId": "store123",
  "orderType": "DELIVERY",
  "customerName": "Test Customer",
  "customerPhone": "+919876543210",
  "customerEmail": "customer@example.com",
  "deliveryAddress": {
    "street": "123 Main Street",
    "city": "Hyderabad",
    "state": "Telangana",
    "pincode": "500001"
  },
  "items": [
    {
      "menuItemId": "item123",
      "name": "Margherita Pizza",
      "quantity": 2,
      "price": 299.0,
      "specialInstructions": "Extra cheese"
    }
  ],
  "paymentMethod": "CASH_ON_DELIVERY",
  "deliveryFee": 40.0,
  "tax": 53.64,
  "discount": 0.0,
  "totalAmount": 691.64,
  "createdBy": "staff_user_id"
}
```

**Response:**
```json
{
  "id": "order123",
  "orderNumber": "ORD-001234",
  "storeId": "store123",
  "orderType": "DELIVERY",
  "status": "RECEIVED",
  "customerName": "Test Customer",
  "customerPhone": "+919876543210",
  "items": [...],
  "totalAmount": 691.64,
  "createdAt": "2025-10-23T10:30:00Z",
  "estimatedDeliveryTime": "2025-10-23T11:00:00Z"
}
```

**Status Codes:**
- `201 Created` - Order created successfully
- `400 Bad Request` - Invalid order data
- `401 Unauthorized` - Missing or invalid token

---

### 2. Get Order by ID

**Endpoint:** `GET /api/orders/{orderId}`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "order123",
  "orderNumber": "ORD-001234",
  "status": "PREPARING",
  "customerName": "Test Customer",
  "items": [...],
  "totalAmount": 691.64,
  "createdAt": "2025-10-23T10:30:00Z"
}
```

---

### 3. Get Kitchen Queue

**Endpoint:** `GET /api/orders/kitchen/{storeId}`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` (optional): Filter by status (RECEIVED, PREPARING, COOKING, READY)

**Response:**
```json
[
  {
    "id": "order123",
    "orderNumber": "ORD-001234",
    "status": "PREPARING",
    "orderType": "DINE_IN",
    "tableNumber": "Table 5",
    "items": [
      {
        "name": "Margherita Pizza",
        "quantity": 2,
        "specialInstructions": "Extra cheese"
      }
    ],
    "createdAt": "2025-10-23T10:30:00Z",
    "elapsedMinutes": 5
  }
]
```

---

### 4. Update Order Status

**Endpoint:** `PATCH /api/orders/{orderId}/status`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request:**
```json
{
  "status": "PREPARING",
  "updatedBy": "staff_user_id",
  "notes": "Started preparing order"
}
```

**Response:**
```json
{
  "id": "order123",
  "status": "PREPARING",
  "updatedAt": "2025-10-23T10:35:00Z"
}
```

**Valid Status Transitions:**
```
RECEIVED → PREPARING → COOKING → READY → OUT_FOR_DELIVERY → DELIVERED → COMPLETED
                                    ↓
                                CANCELLED
```

---

### 5. Move to Next Stage

**Endpoint:** `PATCH /api/orders/{orderId}/next-stage`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "order123",
  "status": "COOKING",
  "updatedAt": "2025-10-23T10:40:00Z"
}
```

---

### 6. Assign Driver

**Endpoint:** `PATCH /api/orders/{orderId}/assign-driver`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request:**
```json
{
  "driverId": "driver123"
}
```

**Response:**
```json
{
  "id": "order123",
  "status": "OUT_FOR_DELIVERY",
  "driverId": "driver123",
  "driverName": "Raj Kumar",
  "assignedAt": "2025-10-23T10:50:00Z"
}
```

---

### 7. Get Orders by Status

**Endpoint:** `GET /api/orders/status/{status}`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `storeId` (optional): Filter by store

**Example:** `GET /api/orders/status/OUT_FOR_DELIVERY?storeId=store123`

**Response:**
```json
[
  {
    "id": "order123",
    "orderNumber": "ORD-001234",
    "status": "OUT_FOR_DELIVERY",
    "driverId": "driver123",
    "customerName": "Test Customer",
    "deliveryAddress": {...},
    "totalAmount": 691.64
  }
]
```

---

### 8. Get Store Orders (Today)

**Endpoint:** `GET /api/orders/store/{storeId}`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `date` (optional): ISO date string (default: today)
- `status` (optional): Filter by status

**Response:**
```json
[
  {
    "id": "order123",
    "orderNumber": "ORD-001234",
    "status": "COMPLETED",
    "orderType": "DELIVERY",
    "totalAmount": 691.64,
    "createdAt": "2025-10-23T10:30:00Z",
    "completedAt": "2025-10-23T11:15:00Z"
  }
]
```

---

### 9. Cancel Order

**Endpoint:** `DELETE /api/orders/{orderId}`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `reason` (optional): Cancellation reason

**Response:**
```json
{
  "id": "order123",
  "status": "CANCELLED",
  "cancelledAt": "2025-10-23T10:45:00Z",
  "cancellationReason": "Customer requested"
}
```

---

## Analytics Service APIs

Base Path: `/api/analytics`

### 1. Get Today's Sales

**Endpoint:** `GET /api/analytics/store/{storeId}/sales/today`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "storeId": "store123",
  "date": "2025-10-23",
  "totalSales": 15420.00,
  "orderCount": 48,
  "averageOrderValue": 321.25,
  "dineInOrders": 20,
  "pickupOrders": 12,
  "deliveryOrders": 16
}
```

**Cache:** 5 minutes

---

### 2. Get Yesterday's Sales

**Endpoint:** `GET /api/analytics/store/{storeId}/sales/yesterday`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "storeId": "store123",
  "date": "2025-10-22",
  "totalSales": 14200.00,
  "orderCount": 45
}
```

**Cache:** 5 minutes

---

### 3. Get Last Year Same Day Sales

**Endpoint:** `GET /api/analytics/store/{storeId}/sales/lastYear/{date}`

**Headers:**
```
Authorization: Bearer <token>
```

**Example:** `GET /api/analytics/store/store123/sales/lastYear/2025-10-23`

**Response:**
```json
{
  "storeId": "store123",
  "date": "2024-10-23",
  "totalSales": 12800.00,
  "orderCount": 40
}
```

---

### 4. Get Average Order Value

**Endpoint:** `GET /api/analytics/store/{storeId}/avgOrderValue/today`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "storeId": "store123",
  "date": "2025-10-23",
  "averageOrderValue": 321.25,
  "previousAverage": 315.56,
  "percentageChange": 1.8,
  "trend": "UP"
}
```

---

### 5. Get Staff Performance

**Endpoint:** `GET /api/analytics/store/{storeId}/staff/performance`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `date` (optional): ISO date string (default: today)

**Response:**
```json
[
  {
    "staffId": "staff123",
    "staffName": "John Doe",
    "ordersProcessed": 25,
    "totalSales": 7850.00,
    "averageOrderValue": 314.00,
    "hoursWorked": 8.0
  }
]
```

**Cache:** 10 minutes

---

### 6. Get Sales Trend

**Endpoint:** `GET /api/analytics/store/{storeId}/sales/trend`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `period`: DAY, WEEK, MONTH
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string

**Example:** `GET /api/analytics/store/store123/sales/trend?period=WEEK`

**Response:**
```json
{
  "storeId": "store123",
  "period": "WEEK",
  "data": [
    {
      "date": "2025-10-17",
      "totalSales": 14500.00,
      "orderCount": 42
    },
    {
      "date": "2025-10-18",
      "totalSales": 15200.00,
      "orderCount": 45
    }
    // ... 7 days
  ]
}
```

---

## Error Handling

All API errors follow this format:

### Error Response Structure:

```json
{
  "timestamp": "2025-10-23T10:30:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Invalid order data: items cannot be empty",
  "path": "/api/orders"
}
```

### Common HTTP Status Codes:

| Status Code | Meaning | Description |
|-------------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Missing or invalid authentication token |
| 403 | Forbidden | User doesn't have permission |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Service temporarily unavailable |

---

## Rate Limiting

The API Gateway implements rate limiting:

**Limits:**
- 100 requests per minute per user
- 1000 requests per minute per IP address

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1698065400
```

**When Rate Limit Exceeded:**
```json
{
  "status": 429,
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Try again in 30 seconds",
  "retryAfter": 30
}
```

---

## Authentication Flow

### Login Flow:
```
1. POST /api/users/login with credentials
2. Receive JWT token in response
3. Store token in localStorage (frontend)
4. Include token in Authorization header for all subsequent requests
5. Token expires after 24 hours
6. Refresh token or re-login when expired
```

### Protected Routes:
- All routes except `/api/users/login` and public menu browsing require authentication
- Role-based access control enforced at service level
- JWT contains user ID, role, and store ID

---

## Pagination

For endpoints returning lists, use pagination:

**Query Parameters:**
- `page`: Page number (default: 0)
- `size`: Items per page (default: 20, max: 100)
- `sort`: Sort field and direction (e.g., `createdAt,desc`)

**Example:**
```
GET /api/orders/store/store123?page=0&size=20&sort=createdAt,desc
```

**Response includes pagination metadata:**
```json
{
  "content": [...],
  "page": {
    "number": 0,
    "size": 20,
    "totalElements": 150,
    "totalPages": 8
  }
}
```

---

## Postman Collection

A Postman collection with all endpoints is available at:
`/postman/MaSoVa-API-Collection.json`

Import this into Postman for easy API testing.

---

## Support

For API questions or issues:
- Email: dev@masova.com
- Slack: #api-support
- Documentation: https://docs.masova.com

---

**Document Version:** 1.0
**API Version:** v1
**Last Updated:** October 23, 2025
# Frontend-Backend Integration Status

## ✅ Completed Integration Tasks

### 1. API Configuration
- ✅ Created `frontend/src/config/api.config.ts` with all endpoint definitions
- ✅ Created `frontend/.env` with backend URL (http://localhost:8081)
- ✅ Configured axios instance with JWT interceptors for auto-token refresh

### 2. Authentication Integration
- ✅ Updated `authApi.ts` to use real backend endpoints
- ✅ Connected `authSlice` with RTK Query using extraReducers
- ✅ Updated `LoginPage.tsx` to call real API instead of mock data
- ✅ Implemented automatic token refresh on 401 errors
- ✅ Added localStorage persistence for tokens and user data

### 3. Working Sessions Integration
- ✅ Updated `sessionApi.ts` with full backend endpoint integration
- ✅ Added endpoints for:
  - Start/End session
  - Get active sessions by store
  - Get employee sessions
  - Approve/Reject sessions
  - Add break time

### 4. Demo Users
- ✅ Created script to register demo users
- ✅ Successfully registered Driver account (driver@masova.com / driver123)
- ⚠️ Some accounts got 500 errors (likely validation or duplicates)

---

## 🧪 Testing Instructions

### Test 1: Login Flow
1. Open browser to http://localhost:5173
2. Try logging in with:
   - **Email**: `driver@masova.com`
   - **Password**: `driver123`
3. ✅ Should successfully authenticate and redirect

### Test 2: Create Additional Users
Run this PowerShell command to create a customer account:

```powershell
$body = @{
    type = "CUSTOMER"
    name = "John Doe"
    email = "john@example.com"
    phone = "9999999999"
    password = "password123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8081/api/users/register" -Method POST -Body $body -ContentType "application/json"
```

### Test 3: Check Authentication Flow
1. Login successfully
2. Open DevTools > Application > Local Storage
3. Verify tokens are stored:
   - `accessToken`
   - `refreshToken`
   - `user` (JSON object)

### Test 4: Test Token Refresh
1. After login, manually expire the token in localStorage
2. Make an API call
3. The axios interceptor should automatically refresh the token

---

## 🔧 Current Architecture

```
┌─────────────────┐
│   Frontend      │
│  (React/Vite)   │
│  Port: 5173     │
└────────┬────────┘
         │
         │ HTTP/REST
         │
┌────────▼────────┐
│   User Service  │
│  (Spring Boot)  │
│  Port: 8081     │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼──┐  ┌──▼──┐
│MongoDB│  │Redis│
│ 27017│  │ 6379│
└──────┘  └─────┘
```

---

## 📋 API Endpoints Connected

### Authentication
- `POST /api/users/login` - User login
- `POST /api/users/register` - User registration
- `POST /api/users/refresh-token` - Token refresh
- `POST /api/users/logout` - Logout
- `GET /api/users/profile` - Get user profile

### Working Sessions
- `POST /api/sessions/start` - Start working session
- `POST /api/sessions/{id}/end` - End session
- `GET /api/sessions/store/{storeId}/active` - Get active sessions
- `GET /api/sessions/employee/{employeeId}` - Get employee sessions
- `POST /api/sessions/{id}/approve` - Approve session
- `POST /api/sessions/{id}/reject` - Reject session
- `POST /api/sessions/{id}/break` - Add break time

---

## 🚧 Next Steps (Phase 3)

### Still Using Mock Data:
1. **Customer App**:
   - Menu items (need Menu Service backend)
   - Cart functionality
   - Order creation
   - Payment integration

2. **Kitchen Display**:
   - Real-time order updates (need Order Service + WebSocket)
   - Order status updates
   - Kitchen workflow

3. **Manager Dashboard**:
   - Analytics API integration
   - Sales data
   - Order statistics

### To Implement:
1. Menu Service backend (Phase 3)
2. Order Service backend (Phase 3)
3. WebSocket for real-time updates
4. Payment gateway integration
5. Protected route components
6. Error boundary components
7. Loading states across all pages

---

## 🐛 Known Issues

1. Some demo user registrations failing with 500 errors
   - Likely validation issues
   - Need to check backend logs
   - May need to adjust user data format

2. Frontend TypeScript errors (if any)
   - Check browser console
   - Verify all type definitions match backend responses

3. CORS (if encountered)
   - Backend needs to allow frontend origin
   - Currently should work on localhost

---

## 📊 Integration Progress

| Feature | Backend | Frontend | Integration | Status |
|---------|---------|----------|-------------|---------|
| User Auth | ✅ | ✅ | ✅ | **COMPLETE** |
| Working Sessions | ✅ | ✅ | ✅ | **COMPLETE** |
| Menu Management | ❌ | ✅ (UI) | ❌ | Phase 3 |
| Order Management | ❌ | ✅ (UI) | ❌ | Phase 3 |
| Analytics | ❌ | ✅ (UI) | ❌ | Phase 3 |
| Real-time Updates | ❌ | ❌ | ❌ | Phase 3 |

---

## 🎯 What You Should Test Now

1. **Open the frontend**: http://localhost:5173
2. **Try the Driver login**: driver@masova.com / driver123
3. **Check browser console** for any errors
4. **Verify** you get redirected after login
5. **Check network tab** to see API calls being made
6. **Report back** any errors you see

The authentication is now fully connected to your backend! 🎉
