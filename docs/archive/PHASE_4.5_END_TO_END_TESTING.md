# Phase 4.5: End-to-End Testing Guide
**Date:** October 23, 2025
**Purpose:** Comprehensive testing of all Phase 4.5 features
**Status:** Complete Testing Checklist

---

## 🎯 Testing Overview

This document provides step-by-step instructions to test all features implemented in Phase 4.5, ensuring the complete order flow works from POS → Kitchen → Driver → Delivery.

---

## 📋 Pre-Testing Checklist

### Backend Services Running (Ports):
- [ ] MongoDB (27017) - Database
- [ ] Redis (6379) - Cache
- [ ] API Gateway (8080) - Main entry point
- [ ] User Service (8081) - Authentication & users
- [ ] Menu Service (8082) - Menu items
- [ ] Order Service (8083) - Order management
- [ ] Analytics Service (8085) - Real-time metrics

### Frontend:
- [ ] React Development Server (3000)

### Test Data Required:
- [ ] Test users with different roles (MANAGER, STAFF, DRIVER, CUSTOMER)
- [ ] Menu items in database
- [ ] At least one store configured

---

## 🧪 Test Suite 1: Public Website

### Test 1.1: HomePage
**URL:** `http://localhost:3000/`

**Test Steps:**
1. Open browser and navigate to homepage
2. Verify hero section loads with restaurant branding
3. Check "Order Now" button redirects to `/customer/menu`
4. Check "Browse Menu" button redirects to `/menu`
5. Verify 3 featured promotions display correctly
6. Verify "Why Choose MaSoVa?" section shows 4 features
7. Check footer has "Staff Login" link

**Expected Results:**
- ✅ Hero section with gradient background visible
- ✅ All buttons functional
- ✅ Promotions display with images and discount tags
- ✅ Footer navigation works
- ✅ Responsive on mobile devices

**Status:** [ ] Pass [ ] Fail

---

### Test 1.2: Promotions Page
**URL:** `http://localhost:3000/promotions`

**Test Steps:**
1. Navigate to promotions page
2. Verify 8 total promotions display
3. Test category filtering (Pizza, Biryani, Combos, Desserts, Delivery)
4. Click "Order Now" on any promotion
5. Verify "Back" button returns to previous page

**Expected Results:**
- ✅ All 8 promotions visible
- ✅ Category tabs filter correctly
- ✅ "Order Now" redirects to `/customer/menu`
- ✅ Navigation works smoothly

**Status:** [ ] Pass [ ] Fail

---

### Test 1.3: Public Menu Page
**URL:** `http://localhost:3000/menu`

**Test Steps:**
1. Navigate to public menu
2. Verify menu items load without requiring login
3. Check category filtering works
4. Test search functionality
5. Verify "Order Now" prompts login/registration

**Expected Results:**
- ✅ Menu browsing works without authentication
- ✅ Categories filter items correctly
- ✅ Search finds items by name
- ✅ Clear customer journey flow

**Status:** [ ] Pass [ ] Fail

---

## 🧪 Test Suite 2: Authentication Flow

### Test 2.1: Staff Login
**URL:** `http://localhost:3000/login`

**Test Users:**
```
Manager:
  Email: manager@masova.com
  Password: Manager@123

Staff:
  Email: staff@masova.com
  Password: Staff@123

Driver:
  Email: driver@masova.com
  Password: Driver@123
```

**Test Steps:**
1. Click "Staff Login" from homepage
2. Enter manager credentials
3. Verify JWT token stored in localStorage
4. Check redirect to appropriate dashboard
5. Test "Remember Me" functionality
6. Test incorrect password handling
7. Logout and verify token cleared

**Expected Results:**
- ✅ Successful login redirects to `/manager` for MANAGER
- ✅ Successful login redirects to `/pos` for STAFF
- ✅ Successful login redirects to `/driver` for DRIVER
- ✅ JWT token persists across page refreshes
- ✅ Invalid credentials show error message
- ✅ Logout clears authentication

**Status:** [ ] Pass [ ] Fail

---

## 🧪 Test Suite 3: POS System (Complete Flow)

### Test 3.1: POS Dashboard Access
**Login:** Staff or Manager
**URL:** `http://localhost:3000/pos`

**Test Steps:**
1. Login as STAFF user
2. Verify POS Dashboard loads
3. Check 3-column layout (Menu | Order | Customer)
4. Verify metrics tiles display at top
5. Check keyboard shortcuts help bar at bottom

**Expected Results:**
- ✅ Dashboard loads with user name and store ID
- ✅ 3 panels visible and responsive
- ✅ Metrics show: Today's Sales, Avg Order Value, Active Deliveries
- ✅ Shortcuts: F1, F2, F3, ESC, Ctrl+Enter displayed

**Status:** [ ] Pass [ ] Fail

---

### Test 3.2: Create Walk-In Order (POS → Kitchen)
**URL:** `http://localhost:3000/pos`

**Test Steps:**
1. **Select Menu Items:**
   - Browse menu categories (Pizza, Biryani, Breads, etc.)
   - Search for specific item (e.g., "Margherita")
   - Click "Add to Order" on 2-3 items
   - Verify items appear in center panel

2. **Build Order:**
   - Adjust quantities using +/- buttons
   - Add special instructions ("Extra cheese")
   - Select order type: **DINE_IN**
   - Select table number (e.g., Table 5)

3. **Customer Information:**
   - Enter customer name: "Test Customer"
   - Enter phone: "+91 9876543210"

4. **Payment:**
   - Select payment method: CASH
   - Verify total calculated correctly
   - Click "Place Order" (or press Ctrl+Enter)

5. **Verify Order Created:**
   - Check success notification appears
   - Note the order number (e.g., "ORD-123456")
   - Verify order panel clears automatically

6. **Verify in Kitchen Display:**
   - Navigate to `/kitchen`
   - Verify new order appears in "RECEIVED" column
   - Check order shows: items, table number, timestamp

**Expected Results:**
- ✅ Menu search works instantly
- ✅ Items add to order with correct price
- ✅ Quantity changes update total
- ✅ Order type selection works (DINE_IN shows table selector)
- ✅ Payment total includes tax calculation
- ✅ Order submits successfully via button OR Ctrl+Enter
- ✅ Order appears in Kitchen Display within 5 seconds
- ✅ Kitchen shows order number, items, and countdown timer

**API Calls:**
```
POST http://localhost:8080/api/orders
{
  "storeId": "store123",
  "orderType": "DINE_IN",
  "tableNumber": "Table 5",
  "items": [...],
  "customerName": "Test Customer",
  "customerPhone": "+919876543210",
  "paymentMethod": "CASH",
  "createdBy": "staff_user_id"
}
```

**Status:** [ ] Pass [ ] Fail

---

### Test 3.3: Create Delivery Order (POS → Kitchen → Driver)
**URL:** `http://localhost:3000/pos`

**Test Steps:**
1. Click "New Order" (F1) to start fresh
2. Add 2-3 menu items
3. Select order type: **DELIVERY**
4. Enter delivery address:
   ```
   Street: 123 Main Street
   City: Hyderabad
   Pincode: 500001
   ```
5. Enter customer details:
   - Name: "Delivery Test Customer"
   - Phone: "+91 9999999999"
6. Verify delivery fee (₹40) added to total
7. Select payment method: ONLINE/CASH_ON_DELIVERY
8. Place order
9. Navigate to Kitchen Display (`/kitchen`)
10. Move order through stages:
    - RECEIVED → PREPARING → COOKING → READY
11. When status = READY, assign driver
12. Navigate to Driver App (`/driver`)
13. Login as DRIVER
14. Verify order appears in "Active Deliveries"

**Expected Results:**
- ✅ Delivery order type shows address fields
- ✅ Delivery fee (₹40) automatically added
- ✅ Order appears in Kitchen Display
- ✅ Order moves through kitchen stages
- ✅ Driver assignment updates order status
- ✅ Driver sees order in their active list

**Status:** [ ] Pass [ ] Fail

---

### Test 3.4: POS Keyboard Shortcuts
**URL:** `http://localhost:3000/pos`

**Test Steps:**
1. Press **F1** → Verify new order started (order panel clears)
2. Add some items to order
3. Press **ESC** → Verify order clears
4. Add items again
5. Press **Ctrl+Enter** → Verify order submits (if form valid)
6. Press **F2** → Navigate to Order History
7. Press **F3** (Manager only) → Navigate to Reports

**Expected Results:**
- ✅ F1 clears current order
- ✅ ESC clears current order
- ✅ Ctrl+Enter submits order (keyboard-only workflow)
- ✅ F2 opens Order History page
- ✅ F3 opens Reports (Manager role only)

**Status:** [ ] Pass [ ] Fail

---

### Test 3.5: Real-Time Metrics (POS Dashboard)
**URL:** `http://localhost:3000/pos`

**Test Steps:**
1. Open POS Dashboard
2. Observe metrics tiles at top:
   - **Today's Sales** (vs Yesterday)
   - **Avg Order Value**
   - **Last Year Comparison**
   - **Active Deliveries**
3. Create 1-2 new orders via POS
4. Wait 30-60 seconds for metrics refresh
5. Verify metrics update automatically

**Expected Results:**
- ✅ Metrics display real data from Analytics Service
- ✅ "Today's Sales" shows current day total
- ✅ Percentage change indicators (↑/↓) work
- ✅ "Active Deliveries" count updates
- ✅ Auto-refresh every 30-60 seconds
- ✅ Error handling if Analytics Service unavailable

**API Calls:**
```
GET http://localhost:8080/api/analytics/store/{storeId}/sales/today
GET http://localhost:8080/api/analytics/store/{storeId}/sales/yesterday
GET http://localhost:8080/api/analytics/store/{storeId}/avgOrderValue/today
GET http://localhost:8080/api/users/drivers/status/{storeId}
```

**Status:** [ ] Pass [ ] Fail

---

### Test 3.6: Order History Page
**URL:** `http://localhost:3000/pos/history`

**Test Steps:**
1. Navigate to Order History (F2 from POS)
2. Verify today's orders display
3. Test search by order number
4. Test filter by order type (DINE_IN, PICKUP, DELIVERY)
5. Test filter by status
6. Click on an order to view details
7. Verify pagination if > 20 orders

**Expected Results:**
- ✅ All today's orders listed with order number, time, total
- ✅ Search finds orders instantly
- ✅ Filters work correctly
- ✅ Order details show complete information
- ✅ Status badges color-coded

**Status:** [ ] Pass [ ] Fail

---

### Test 3.7: Reports Page (Manager Only)
**URL:** `http://localhost:3000/pos/reports`

**Test Steps:**
1. Login as MANAGER
2. Navigate to Reports (F3)
3. Verify sales summary charts
4. Check date range selector
5. Test export functionality (if implemented)
6. Verify staff performance metrics

**Expected Results:**
- ✅ Reports page only accessible to MANAGER role
- ✅ Charts display correctly
- ✅ Date filtering works
- ✅ Data matches actual orders

**Status:** [ ] Pass [ ] Fail

---

## 🧪 Test Suite 4: Kitchen Display System

### Test 4.1: Kitchen Queue Display
**URL:** `http://localhost:3000/kitchen`

**Test Steps:**
1. Login as STAFF or MANAGER
2. Navigate to Kitchen Display
3. Verify 5-column Kanban board:
   - RECEIVED
   - PREPARING
   - COOKING (with oven timer)
   - READY
   - COMPLETED
4. Check real-time polling (new orders appear within 5 seconds)
5. Verify order cards show:
   - Order number
   - Items with quantities
   - Timestamp
   - Timer (minutes since order placed)

**Expected Results:**
- ✅ All columns visible with drag-and-drop zones
- ✅ Orders sorted by time (oldest first)
- ✅ Real-time updates without manual refresh
- ✅ Urgent orders highlighted (>15 minutes)

**Status:** [ ] Pass [ ] Fail

---

### Test 4.2: Move Orders Through Stages
**URL:** `http://localhost:3000/kitchen`

**Test Steps:**
1. Create new order via POS
2. In Kitchen Display, verify order in RECEIVED
3. Click "Start Preparing" → Move to PREPARING
4. Click "Start Cooking" → Move to COOKING
5. Verify 7-minute oven timer starts
6. Wait or click "Mark Ready" → Move to READY
7. Assign driver (if delivery order)
8. Move to COMPLETED

**Expected Results:**
- ✅ Orders move between columns smoothly
- ✅ Oven timer counts down in COOKING stage
- ✅ Status updates persist on refresh
- ✅ API calls successful for each stage change

**API Calls:**
```
PATCH http://localhost:8080/api/orders/{orderId}/status
{
  "status": "PREPARING",
  "updatedBy": "staff_user_id"
}
```

**Status:** [ ] Pass [ ] Fail

---

### Test 4.3: Oven Timer Feature
**URL:** `http://localhost:3000/kitchen`

**Test Steps:**
1. Move order to COOKING stage
2. Verify 7-minute countdown timer appears on order card
3. Let timer run for 1-2 minutes
4. Refresh page → Verify timer continues correctly
5. When timer reaches 0 → Verify visual/audio alert (if implemented)

**Expected Results:**
- ✅ Timer displays as "7:00" initially
- ✅ Counts down every second
- ✅ Timer persists across page refreshes
- ✅ Alert when cooking complete

**Status:** [ ] Pass [ ] Fail

---

## 🧪 Test Suite 5: Driver Application

### Test 5.1: Driver Clock In/Out (GPS)
**URL:** `http://localhost:3000/driver`

**Test Steps:**
1. Login as DRIVER user
2. Driver Dashboard loads
3. Request location permission when prompted
4. Click "Clock In" button
5. Verify GPS coordinates captured
6. Check session timer starts
7. Toggle status: Available → On Break → Available
8. After some time, click "Clock Out"
9. Verify session ends and stats saved

**Expected Results:**
- ✅ Location permission requested properly
- ✅ Clock In captures lat/lng coordinates
- ✅ Session timer displays (e.g., "2h 15m")
- ✅ Online/Offline status toggle works
- ✅ Clock Out ends session with GPS coordinates

**API Calls:**
```
POST http://localhost:8080/api/users/working-sessions/start
{
  "userId": "driver_user_id",
  "storeId": "store123",
  "shiftType": "FULL_DAY",
  "clockInLocation": {
    "lat": 17.385,
    "lng": 78.486
  }
}

POST http://localhost:8080/api/users/working-sessions/end
{
  "sessionId": "session123",
  "clockOutLocation": {
    "lat": 17.385,
    "lng": 78.486
  }
}
```

**Status:** [ ] Pass [ ] Fail

---

### Test 5.2: Active Deliveries
**URL:** `http://localhost:3000/driver/active`

**Test Steps:**
1. Ensure driver is clocked in and online
2. From Kitchen Display, assign delivery order to this driver
3. Navigate to Driver App → Active Deliveries tab
4. Verify assigned order appears
5. Click on order to view details:
   - Customer name, phone, address
   - Order items
   - Delivery instructions
6. Click "Navigate" → Verify Google Maps link opens
7. Click "Call Customer" → Verify phone dialer opens
8. Click "Mark as Delivered"
9. Verify order moves to History

**Expected Results:**
- ✅ Assigned orders appear immediately
- ✅ Order cards show essential delivery info
- ✅ "Navigate" opens Google Maps with destination
- ✅ "Call" button initiates phone call
- ✅ "Mark Delivered" updates order status to DELIVERED
- ✅ Order removed from active list after delivery

**API Calls:**
```
GET http://localhost:8080/api/orders/driver/{driverId}/assigned

PATCH http://localhost:8080/api/orders/{orderId}/status
{
  "status": "DELIVERED",
  "updatedBy": "driver_user_id"
}
```

**Status:** [ ] Pass [ ] Fail

---

### Test 5.3: Delivery History
**URL:** `http://localhost:3000/driver/history`

**Test Steps:**
1. Navigate to History tab
2. Verify past deliveries display
3. Test date filter (Today, This Week, This Month)
4. Test search by order number or customer name
5. Click on completed order to view details
6. Verify earnings and distance calculated

**Expected Results:**
- ✅ All completed deliveries listed
- ✅ Filters work correctly
- ✅ Search finds orders
- ✅ Order details accurate
- ✅ Earnings displayed per order

**Status:** [ ] Pass [ ] Fail

---

### Test 5.4: Driver Profile & Stats
**URL:** `http://localhost:3000/driver/profile`

**Test Steps:**
1. Navigate to Profile tab
2. Verify driver information displays
3. Check today's stats:
   - Deliveries completed
   - Total earnings
   - Distance covered
   - Hours worked
4. Check weekly/monthly summaries
5. Verify performance rating (if implemented)

**Expected Results:**
- ✅ Profile shows driver name, ID, store
- ✅ Today's stats accurate
- ✅ Weekly earnings calculated correctly
- ✅ Distance in kilometers
- ✅ Session hours tracked

**Status:** [ ] Pass [ ] Fail

---

### Test 5.5: Bottom Navigation (Mobile)
**URL:** `http://localhost:3000/driver`

**Test Steps:**
1. Open Driver App in mobile view (DevTools → Mobile emulator)
2. Verify bottom navigation bar displays:
   - Home
   - Active (with badge count)
   - History
   - Profile
3. Tap each tab and verify navigation
4. Check active deliveries badge updates

**Expected Results:**
- ✅ Bottom nav fixed at bottom on mobile
- ✅ Icons and labels visible
- ✅ Badge shows active delivery count
- ✅ Navigation smooth
- ✅ Touch-friendly targets

**Status:** [ ] Pass [ ] Fail

---

## 🧪 Test Suite 6: Manager Dashboard

### Test 6.1: Manager Overview
**URL:** `http://localhost:3000/manager`

**Test Steps:**
1. Login as MANAGER
2. Verify dashboard loads with multiple sections:
   - Sales overview
   - Order statistics
   - Staff performance
   - Real-time metrics
3. Check date range selector
4. Verify charts render correctly

**Expected Results:**
- ✅ Dashboard accessible only to MANAGER role
- ✅ All metrics display real data
- ✅ Charts interactive
- ✅ Date filtering works

**Status:** [ ] Pass [ ] Fail

---

### Test 6.2: Staff Management
**URL:** `http://localhost:3000/manager/staff`

**Test Steps:**
1. Navigate to Staff section
2. View list of employees
3. Check staff status (Active, On Break, Offline)
4. View staff performance metrics
5. Test filtering by role

**Expected Results:**
- ✅ All staff listed with current status
- ✅ Performance metrics accurate
- ✅ Filters work
- ✅ Real-time status updates

**Status:** [ ] Pass [ ] Fail

---

## 🧪 Test Suite 7: Analytics Service Integration

### Test 7.1: Sales Metrics API
**Endpoint:** `GET /api/analytics/store/{storeId}/sales/today`

**Test Steps:**
1. Use Postman or curl to call endpoint
2. Verify response includes:
   - Total sales for today
   - Number of orders
   - Timestamp
3. Create new order via POS
4. Call API again
5. Verify sales total increased

**Expected Response:**
```json
{
  "storeId": "store123",
  "date": "2025-10-23",
  "totalSales": 2450.00,
  "orderCount": 12,
  "averageOrderValue": 204.17
}
```

**Status:** [ ] Pass [ ] Fail

---

### Test 7.2: Driver Status API
**Endpoint:** `GET /api/analytics/store/{storeId}/drivers/status`

**Test Steps:**
1. Login 2-3 drivers and clock them in
2. Call driver status endpoint
3. Verify response shows:
   - Online drivers count
   - Available drivers count
   - Drivers on delivery
4. Clock out one driver
5. Call API again, verify counts updated

**Expected Response:**
```json
{
  "storeId": "store123",
  "onlineDrivers": 3,
  "availableDrivers": 2,
  "onDelivery": 1,
  "offlineDrivers": 0
}
```

**Status:** [ ] Pass [ ] Fail

---

### Test 7.3: Redis Caching
**Test Steps:**
1. Call sales API endpoint → Note response time
2. Call same endpoint again within 5 minutes
3. Verify response time faster (served from cache)
4. Check Redis CLI:
   ```bash
   redis-cli
   KEYS analytics:*
   GET analytics:store:store123:sales:today
   ```
5. Verify cached data exists

**Expected Results:**
- ✅ First call queries MongoDB (~50-100ms)
- ✅ Cached calls faster (~5-10ms)
- ✅ Cache expires after TTL (5min for sales, 2min for drivers)
- ✅ Fresh data after cache expiry

**Status:** [ ] Pass [ ] Fail

---

## 🧪 Test Suite 8: Real-Time Updates

### Test 8.1: Kitchen Display Polling
**Test Steps:**
1. Open Kitchen Display in Browser 1
2. Open POS System in Browser 2
3. Create new order in POS
4. Monitor Kitchen Display
5. Verify new order appears within 5 seconds

**Expected Results:**
- ✅ Kitchen Display polls every 5 seconds
- ✅ New orders appear automatically
- ✅ No manual refresh needed
- ✅ Network errors handled gracefully

**Status:** [ ] Pass [ ] Fail

---

### Test 8.2: Driver App Polling
**Test Steps:**
1. Open Driver App
2. Clock in and go online
3. In Kitchen Display, assign order to driver
4. Monitor Driver App Active Deliveries
5. Verify order appears within 30 seconds

**Expected Results:**
- ✅ Driver app polls every 30 seconds
- ✅ New assignments appear automatically
- ✅ Badge count updates

**Status:** [ ] Pass [ ] Fail

---

## 🧪 Test Suite 9: Complete Order Flow (E2E)

### Test 9.1: Full Journey - Dine-In Order
**Duration:** ~5 minutes

**Steps:**
1. **POS:** Create dine-in order for Table 3
2. **Kitchen:** Verify order in RECEIVED column
3. **Kitchen:** Move through PREPARING → COOKING → READY
4. **Kitchen:** Move to COMPLETED
5. **POS:** Verify in Order History as COMPLETED

**Expected Results:**
- ✅ Order flows through all stages
- ✅ Status updates persist
- ✅ Timers work correctly
- ✅ No errors in console

**Status:** [ ] Pass [ ] Fail

---

### Test 9.2: Full Journey - Delivery Order
**Duration:** ~10 minutes

**Steps:**
1. **POS:** Create delivery order with customer address
2. **Kitchen:** Verify order appears
3. **Kitchen:** Move to PREPARING → COOKING → READY
4. **Kitchen:** Assign to Driver (select from dropdown)
5. **Driver App:** Clock in and go online
6. **Driver App:** Verify order in Active Deliveries
7. **Driver App:** Click "Navigate" (opens Google Maps)
8. **Driver App:** Click "Mark as Delivered"
9. **Driver App:** Verify order moves to History
10. **Manager Dashboard:** Check delivery stats updated

**Expected Results:**
- ✅ Complete flow works end-to-end
- ✅ Driver assignment successful
- ✅ Navigation and calling features work
- ✅ Delivery marked successfully
- ✅ Analytics reflect delivery completion
- ✅ Order history accurate across all apps

**Status:** [ ] Pass [ ] Fail

---

## 📊 Test Results Summary

### Overall Test Coverage:
- [ ] Public Website: __ / 3 tests passed
- [ ] Authentication: __ / 1 test passed
- [ ] POS System: __ / 7 tests passed
- [ ] Kitchen Display: __ / 3 tests passed
- [ ] Driver Application: __ / 5 tests passed
- [ ] Manager Dashboard: __ / 2 tests passed
- [ ] Analytics Service: __ / 3 tests passed
- [ ] Real-Time Updates: __ / 2 tests passed
- [ ] Complete E2E Flow: __ / 2 tests passed

**Total:** __ / 28 tests passed

---

## 🐛 Known Issues & Bugs

| Issue ID | Description | Severity | Status |
|----------|-------------|----------|--------|
| | | | |

---

## ✅ Sign-Off

- **Tester Name:** _______________________
- **Date:** _______________________
- **Environment:** Development / Staging / Production
- **Result:** PASS / FAIL / PARTIAL

---

## 📝 Notes

Add any additional observations, performance issues, or recommendations here.

---

**Document Version:** 1.0
**Last Updated:** October 23, 2025
