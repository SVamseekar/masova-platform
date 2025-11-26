# MaSoVa Restaurant Management System - Comprehensive E2E Testing Scenarios

**Document Version:** 2.0
**Last Updated:** November 25, 2025
**System Status:** Phases 1-14 Complete (78% Backend, 65% Frontend)
**Total API Endpoints:** 200+
**Total Frontend Pages:** 50+

---

## Table of Contents

1. [System Architecture Overview](#1-system-architecture-overview)
2. [Backend Microservices](#2-backend-microservices)
3. [Frontend Applications](#3-frontend-applications)
4. [Technology Stack](#4-technology-stack)
5. [Comprehensive E2E Test Scenarios](#5-comprehensive-e2e-test-scenarios)
6. [Integration Testing](#6-integration-testing)
7. [Performance Benchmarks](#7-performance-benchmarks)
8. [Security Testing](#8-security-testing)
9. [Testing Checklist](#9-testing-checklist)

---

## 1. System Architecture Overview

MaSoVa is a **production-ready microservices-based restaurant management platform** built with:
- **Backend:** Java 21 + Spring Boot 3.x + MongoDB + Redis
- **Frontend:** React 18 + TypeScript + Redux Toolkit + Material-UI
- **Real-time:** WebSocket (STOMP + SockJS) + Polling
- **Payments:** Razorpay (Indian market)
- **Deployment:** Docker + Docker Compose

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                     API Gateway (Port 8080)                      │
│              JWT Auth • Rate Limiting • CORS • Routing          │
└─────────────────────────────────────────────────────────────────┘
                              ↓ Routes to ↓
┌──────────────┬──────────────┬──────────────┬──────────────┐
│ User Service │ Menu Service │Order Service │Payment Service│
│   (8081)     │   (8082)     │   (8083)     │   (8086)     │
├──────────────┼──────────────┼──────────────┼──────────────┤
│Analytics Svc │Inventory Svc │Delivery Svc  │Customer Svc  │
│   (8085)     │   (8088)     │   (8087)     │   (8091)     │
├──────────────┼──────────────┼──────────────┼──────────────┤
│ Review Svc   │Notification  │   GDPR       │              │
│   (8092)     │    (8093)    │(in User Svc) │              │
└──────────────┴──────────────┴──────────────┴──────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    MongoDB (9 Databases)                         │
│  masova • masova_menu • masova_orders • masova_payments         │
│  masova_inventory • masova_customers • masova_reviews           │
│  masova_notifications • masova_deliveries                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Backend Microservices

### 2.1 User Service (Port 8081)

**Purpose:** Authentication, user management, sessions, GDPR compliance

**Databases:**
- `masova` database
  - `users` - User accounts (5 roles)
  - `working_sessions` - Employee clock in/out
  - `stores` - Store locations
  - `shifts` - Shift schedules
  - `gdpr_consents` - GDPR consent records
  - `gdpr_data_requests` - Data subject requests
  - `gdpr_audit_logs` - Complete audit trail
  - `gdpr_data_retention` - Retention policies
  - `gdpr_data_breaches` - Breach tracking
  - `gdpr_dpa` - Data Processing Agreements

**User Roles:**
1. **CUSTOMER** - Online ordering, profile management
2. **STAFF** - POS operations, order taking
3. **DRIVER** - Delivery management
4. **MANAGER** - Full system access
5. **ASSISTANT_MANAGER** - Limited management

**API Endpoints (48 total):**

*Authentication (4 endpoints):*
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - Login with credentials
- `POST /api/users/logout` - Logout user
- `POST /api/users/refresh` - Refresh JWT token

*User Management (18 endpoints):*
- `GET /api/users/{userId}` - Get user by ID
- `GET /api/users/type/{type}` - Get users by type
- `GET /api/users/store/{storeId}` - Get store employees
- `GET /api/users/{userId}/can-take-orders` - Check order permissions
- `POST /api/users/change-password` - Change password
- `GET /api/users/search` - Search users
- `GET /api/users/drivers/store/{storeId}` - Get drivers
- Additional CRUD operations

*Working Sessions (12 endpoints):*
- `POST /api/users/sessions/start` - Clock in
- `POST /api/users/sessions/end` - Clock out
- `POST /api/users/sessions/start-with-location` - Clock in with GPS
- `POST /api/users/sessions/end-with-location` - Clock out with GPS
- `POST /api/users/sessions/{employeeId}/break` - Add break time
- `POST /api/users/sessions/{sessionId}/approve` - Approve session
- `POST /api/users/sessions/{sessionId}/reject` - Reject session
- `GET /api/users/sessions/current` - Get current session
- `GET /api/users/sessions/{employeeId}` - Get employee sessions
- `GET /api/users/sessions/store/{storeId}` - Get store sessions
- `GET /api/users/sessions/store/{storeId}/active` - Active sessions
- `GET /api/users/sessions/{employeeId}/report` - Working hours report

*GDPR Compliance (14 endpoints):*
- `POST /api/gdpr/consent/grant` - Grant consent
- `POST /api/gdpr/consent/revoke` - Revoke consent
- `GET /api/gdpr/consent/user/{userId}` - Get user consents
- `GET /api/gdpr/consent/check` - Check consent status
- `POST /api/gdpr/request` - Create data request
- `POST /api/gdpr/request/{requestId}/verify` - Verify request
- `POST /api/gdpr/request/{requestId}/access` - Data access (GDPR Art. 15)
- `POST /api/gdpr/request/{requestId}/erasure` - Right to be forgotten (GDPR Art. 17)
- `POST /api/gdpr/request/{requestId}/portability` - Data portability (GDPR Art. 20)
- `POST /api/gdpr/request/{requestId}/rectification` - Data rectification (GDPR Art. 16)
- `GET /api/gdpr/request/user/{userId}` - User requests
- `GET /api/gdpr/audit/{userId}` - Audit logs
- `GET /api/gdpr/privacy-policy` - Privacy policy
- `POST /api/gdpr/breach` - Report data breach

**GDPR Features:**
- 11 consent types (Terms, Privacy, Cookies, Marketing, Analytics, etc.)
- 4 data subject rights (Access, Rectification, Erasure, Portability)
- Automated data retention (configurable per data type)
- 72-hour breach notification compliance
- Complete audit logging with IP and user agent tracking
- Cookie consent management
- DPA (Data Processing Agreement) management
- Data anonymization (not hard deletion for legal compliance)

---

### 2.2 Menu Service (Port 8082)

**Purpose:** Menu catalog, multi-cuisine support, availability tracking

**Database:**
- `masova_menu` database
  - `menu_items` - 150+ menu items

**Menu Data:**
- **8 Cuisines:** SOUTH_INDIAN, NORTH_INDIAN, INDO_CHINESE, ITALIAN, AMERICAN, MEXICAN, CONTINENTAL, FUSION
- **24 Categories:** PIZZA, BURGER, PASTA, BIRYANI, DOSA, IDLI, RICE, CURRIES, BREADS, STARTERS, DESSERTS, BEVERAGES, SALADS, SOUPS, SANDWICHES, WRAPS, and more
- **5 Dietary Types:** VEGETARIAN, NON_VEGETARIAN, VEGAN, GLUTEN_FREE, JAIN
- **Pricing:** INR (₹99 - ₹599)
- **Caching:** Redis (10-minute TTL)

**API Endpoints (21 total):**

*Public Endpoints (No auth):*
- `GET /api/menu/public` - Get available menu
- `GET /api/menu/public/{id}` - Get menu item
- `GET /api/menu/public/cuisine/{cuisine}` - Filter by cuisine
- `GET /api/menu/public/category/{category}` - Filter by category
- `GET /api/menu/public/dietary/{dietaryType}` - Filter by dietary type
- `GET /api/menu/public/recommended` - Get recommended items
- `GET /api/menu/public/search?q={query}` - Search menu
- `GET /api/menu/public/tag/{tag}` - Filter by tag

*Manager Endpoints (Auth required):*
- `GET /api/menu/items` - Get all items
- `POST /api/menu/items` - Create item
- `POST /api/menu/items/bulk` - Create multiple items
- `PUT /api/menu/items/{id}` - Update item
- `PATCH /api/menu/items/{id}/availability` - Toggle availability
- `PATCH /api/menu/items/{id}/availability/{status}` - Set availability
- `DELETE /api/menu/items/{id}` - Delete item
- `DELETE /api/menu/items` - Delete all items
- `GET /api/menu/stats` - Menu statistics

**Recipe Management:**
- Ingredients list with quantities
- Step-by-step preparation instructions
- Portion control tracking
- Allergen information
- Nutritional data

---

### 2.3 Order Service (Port 8083)

**Purpose:** Complete order lifecycle, kitchen workflow, real-time updates

**Database:**
- `masova_orders` database
  - `orders` - Order records
  - `quality_checkpoints` - Quality control
  - `kitchen_equipment` - Equipment monitoring

**Order Lifecycle (6 stages):**
1. **RECEIVED** - Order placed
2. **PREPARING** - Make-table preparation
3. **COOKING** - In oven/grill
4. **READY** - Ready for pickup/delivery
5. **OUT_FOR_DELIVERY** - Driver assigned
6. **DELIVERED** - Completed

**Order Types:**
- DINE_IN - Table service
- PICKUP - Customer pickup
- DELIVERY - Home delivery

**Payment Methods:**
- CASH
- CARD
- UPI
- WALLET
- CASH_ON_DELIVERY

**Priority Levels:**
- NORMAL
- HIGH
- URGENT

**API Endpoints (36 total):**

*Core Order Management:*
- `POST /api/orders` - Create order
- `GET /api/orders/{orderId}` - Get order by ID
- `GET /api/orders/number/{orderNumber}` - Get by order number
- `GET /api/orders/kitchen/{storeId}` - Kitchen queue (priority sorted)
- `GET /api/orders/store/{storeId}` - Store orders
- `GET /api/orders/customer/{customerId}` - Customer orders
- `PATCH /api/orders/{orderId}/status` - Update status
- `PATCH /api/orders/{orderId}/next-stage` - Move to next stage
- `DELETE /api/orders/{orderId}` - Cancel order
- `PATCH /api/orders/{orderId}/assign-driver` - Assign driver
- `PATCH /api/orders/{orderId}/payment` - Update payment status
- `GET /api/orders/search` - Search orders
- `PATCH /api/orders/{orderId}/items` - Modify items
- `PATCH /api/orders/{orderId}/priority` - Change priority

*Analytics:*
- `GET /api/orders/date/{date}` - Orders by date
- `GET /api/orders/range` - Orders by date range
- `GET /api/orders/staff/{staffId}/date/{date}` - Staff orders
- `GET /api/orders/active-deliveries/count` - Active delivery count

*Quality Checkpoints (5 endpoints):*
- `POST /api/orders/{orderId}/quality-checkpoint` - Add checkpoint
- `PATCH /api/orders/{orderId}/quality-checkpoint/{name}` - Update checkpoint
- `GET /api/orders/{orderId}/quality-checkpoints` - Get checkpoints
- `GET /api/orders/store/{storeId}/failed-quality-checks` - Failed checks
- `GET /api/orders/store/{storeId}/avg-prep-time` - Average prep time

*Make-Table Workflow (2 endpoints):*
- `PATCH /api/orders/{orderId}/assign-make-table` - Assign to station
- `GET /api/orders/store/{storeId}/make-table/{station}` - Station orders

**Make-Table Stations:**
- PIZZA_STATION
- SANDWICH_STATION
- GRILL_STATION
- FRY_STATION
- DESSERT_STATION

*Kitchen Analytics (3 endpoints):*
- `GET /api/orders/store/{storeId}/analytics/prep-time-by-item` - Prep time by item
- `GET /api/orders/analytics/kitchen-staff/{staffId}/performance` - Staff performance
- `GET /api/orders/store/{storeId}/analytics/prep-time-distribution` - Distribution stats

**Quality Checkpoints (7 types):**
- INGREDIENT_QUALITY - Raw material check
- PORTION_SIZE - Portion accuracy
- TEMPERATURE - Food temperature
- PRESENTATION - Visual appeal
- TASTE_TEST - Taste quality
- PACKAGING - Packaging integrity
- FINAL_INSPECTION - Final check

**Kitchen Equipment (9 types):**
- OVEN, STOVE, GRILL, FRYER, REFRIGERATOR, FREEZER, MIXER, DISHWASHER, OTHER

**Real-time Features:**
- WebSocket updates (3 channels)
- Predictive make-table notifications
- Oven timer (7 minutes)
- Automatic calculations (subtotal, tax 5%, delivery ₹50)

---

### 2.4 Payment Service (Port 8086)

**Purpose:** Razorpay integration, transaction management, refunds

**Database:**
- `masova_payments` database
  - `transactions` - Payment records
  - `refunds` - Refund records

**Payment Methods:**
- CASH
- CARD (Razorpay)
- UPI (Razorpay)
- NETBANKING (Razorpay)
- WALLET (Razorpay)
- OTHER

**Payment Statuses (8):**
- PENDING
- AUTHORIZED
- CAPTURED
- FAILED
- REFUNDED
- PARTIALLY_REFUNDED
- CANCELLED
- EXPIRED

**API Endpoints (18 total):**

*Payment Processing:*
- `POST /api/payments/initiate` - Create Razorpay order
- `POST /api/payments/verify` - Verify payment signature
- `POST /api/payments/webhook` - Razorpay callback
- `GET /api/payments/{transactionId}` - Get transaction
- `GET /api/payments/order/{orderId}` - Get by order
- `GET /api/payments/customer/{customerId}` - Customer transactions
- `GET /api/payments/store/{storeId}` - Store transactions
- `GET /api/payments/reconciliation` - Daily reconciliation
- `POST /api/payments/{transactionId}/reconcile` - Mark reconciled

*Refund Management:*
- `POST /api/payments/refund` - Initiate refund
- `GET /api/payments/refund/{refundId}` - Get refund
- `GET /api/payments/refund/transaction/{transactionId}` - Refunds by transaction
- `GET /api/payments/refund/order/{orderId}` - Refunds by order
- `GET /api/payments/refund/customer/{customerId}` - Refunds by customer

**Razorpay Integration:**
- Test mode ready
- Production keys configurable
- Webhook signature verification
- Automatic order updates
- INR to paisa conversion
- Refund speed control (normal/optimum)

---

### 2.5 Analytics Service (Port 8085)

**Purpose:** Business intelligence, performance metrics, reporting

**Database:** Queries from other services (no dedicated database)

**API Endpoints (9 total):**
- `GET /api/analytics/store/{storeId}/sales/today` - Today's sales metrics
- `GET /api/analytics/store/{storeId}/avgOrderValue/today` - Average order value
- `GET /api/analytics/drivers/status/{storeId}` - Driver status
- `GET /api/analytics/staff/{staffId}/performance/today` - Staff performance
- `GET /api/analytics/sales/trends/{period}` - Sales trends (WEEKLY/MONTHLY)
- `GET /api/analytics/sales/breakdown/order-type` - Order type breakdown
- `GET /api/analytics/sales/peak-hours` - Peak hours analysis
- `GET /api/analytics/staff/leaderboard` - Staff leaderboard
- `GET /api/analytics/products/top-selling` - Top products

**Metrics Provided:**
- Today vs Yesterday vs Last Year comparisons
- Average Order Value (AOV)
- Sales trends (weekly/monthly)
- Peak hours identification
- Staff rankings
- Product performance
- Order type breakdown
- Redis caching for performance

---

### 2.6 Inventory Service (Port 8088)

**Purpose:** Stock management, suppliers, waste tracking

**Database:**
- `masova_inventory` database
  - `inventory_items` - Stock items
  - `suppliers` - Supplier database
  - `purchase_orders` - PO tracking
  - `waste_records` - Waste logs

**API Endpoints (61 total):**

*Inventory Items (18 endpoints):*
- `POST /api/inventory/items` - Create item
- `GET /api/inventory/items` - Get all items
- `GET /api/inventory/items/{id}` - Get by ID
- `GET /api/inventory/items/category/{category}` - Filter by category
- `GET /api/inventory/items/search` - Search items
- `PUT /api/inventory/items/{id}` - Update item
- `PATCH /api/inventory/items/{id}/adjust` - Adjust stock
- `PATCH /api/inventory/items/{id}/reserve` - Reserve stock
- `PATCH /api/inventory/items/{id}/release` - Release reserved
- `PATCH /api/inventory/items/{id}/consume` - Consume reserved
- `GET /api/inventory/low-stock` - Low stock alerts
- `GET /api/inventory/out-of-stock` - Out of stock
- `GET /api/inventory/expiring-soon` - Expiring items
- `GET /api/inventory/value` - Total value
- `GET /api/inventory/value/by-category` - Value by category
- `DELETE /api/inventory/items/{id}` - Delete item

*Suppliers (15 endpoints):*
- Full CRUD operations
- Supplier performance tracking
- Price comparison
- Contact management
- Preferred supplier marking

*Purchase Orders (17 endpoints):*
- PO creation and management
- Approval workflow
- Receipt tracking
- Auto-generation for low stock
- Date range queries

*Waste Analysis (11 endpoints):*
- Waste recording
- Cost tracking
- Category analysis
- Preventable analysis
- Trend reporting

---

### 2.7 Delivery Service (Port 8087)

**Purpose:** Live tracking, route optimization, driver dispatch

**Database:**
- `masova_deliveries` database
  - `deliveries` - Delivery records
  - `driver_locations` - GPS tracking
  - `routes` - Route history

**API Endpoints (6 total):**

*Live Tracking (TrackingController):*
- `POST /api/delivery/location-update` - Update driver location
- `GET /api/delivery/track/{orderId}` - Track order
- `GET /api/delivery/eta/{orderId}` - Get ETA

*Dispatch Management (DispatchController):*
- Auto-dispatch algorithms
- Zone-based routing
- Driver assignment

*Performance (PerformanceController):*
- Driver metrics
- Delivery time analysis

---

### 2.8 Customer Service (Port 8091)

**Purpose:** Customer profiles, loyalty, preferences

**Database:**
- `masova_customers` database
  - `customers` - Customer records

**Loyalty Tiers:**
- **BRONZE** - 0-999 points (Signup bonus)
- **SILVER** - 1000-4999 points (Free delivery)
- **GOLD** - 5000-9999 points (Priority support)
- **PLATINUM** - 10000+ points (Exclusive offers)

**API Endpoints (41 total):**

*Customer CRUD (12 endpoints):*
- Full CRUD operations
- Search and filtering
- Activation/deactivation

*Address Management (3 endpoints):*
- Multiple address support
- Default address selection
- Address CRUD

*Loyalty Management (2 endpoints):*
- Points add/redeem
- Tier queries

*Preferences (1 endpoint):*
- Dietary preferences
- Favorite items
- Communication preferences

*Verification (2 endpoints):*
- Email verification
- Phone verification

*Tags (3 endpoints):*
- Customer segmentation
- Tag management

*Query Endpoints (8 endpoints):*
- High-value customers
- Top spenders
- Inactive customers
- Birthday customers
- Marketing opt-in

*Statistics (1 endpoint):*
- Customer statistics dashboard

---

### 2.9 Review Service (Port 8092)

**Purpose:** Reviews, ratings, moderation

**Database:**
- `masova_reviews` database
  - `reviews` - Review records
  - `responses` - Manager responses

**Review Types:**
- ORDER - Overall order experience
- ITEM - Specific menu item
- DRIVER - Delivery experience

**API Endpoints (26 total):**

*Review Management:*
- Create, read, update, delete
- Filter by rating
- Recent reviews
- Flagging system

*Analytics:*
- Overall statistics
- Driver ratings
- Item ratings
- Public rating APIs

*Moderation:*
- Approval workflow
- Status management
- Flagged reviews

*Response Management:*
- Manager responses
- Customer notifications

---

### 2.10 Notification Service (Port 8093)

**Purpose:** Multi-channel notifications, campaigns

**Database:**
- `masova_notifications` database
  - `notifications` - Notification records
  - `campaigns` - Campaign management
  - `user_preferences` - User preferences

**Notification Channels:**
- EMAIL
- SMS
- PUSH
- IN_APP

**Notification Types:**
- ORDER - Order updates
- PROMOTION - Marketing
- SYSTEM - System alerts
- ALERT - Important alerts

**Priority Levels:**
- LOW
- MEDIUM
- HIGH
- URGENT

**API Endpoints (14 total):**

*Notification Management:*
- Send notification
- User notifications (paginated)
- Unread count
- Mark as read
- Delete notification

*Campaign Management:*
- Create campaigns
- Target segmentation
- Campaign analytics

*User Preferences:*
- Channel preferences
- Frequency settings
- Opt-in/opt-out

---

## 3. Frontend Applications

### 3.1 Public Website (/)

**Purpose:** Marketing, public menu, promotions

**Pages:**
- Landing page with hero section
- Promotions page
- Public menu browsing (no auth)
- About us
- Contact

**Features:**
- Neumorphic design system
- Mobile-responsive
- SEO optimized

---

### 3.2 Customer App (/customer/*)

**Purpose:** Online ordering, tracking, profile

**Pages (14):**
1. `MenuPage.tsx` - Browse menu with filters
2. `CartPage.tsx` - Shopping cart
3. `CheckoutPage.tsx` - Order checkout
4. `PaymentPage.tsx` - Razorpay integration
5. `PaymentSuccessPage.tsx` - Confirmation
6. `PaymentFailedPage.tsx` - Error handling
7. `OrderTrackingPage.tsx` - Track orders
8. `LiveTrackingPage.tsx` - GPS tracking
9. `ProfilePage.tsx` - Profile management
10. `CustomerDashboard.tsx` - Order history
11. `ReviewOrderPage.tsx` - Submit reviews
12. `NotificationSettingsPage.tsx` - Preferences
13. `TrackingPage.tsx` - Order status
14. `CustomerApp.tsx` - Main app wrapper

**Features:**
- Real-time menu updates
- Cart persistence (localStorage)
- Multiple payment methods
- Live GPS tracking
- Loyalty points display
- Review submission
- Notification preferences

---

### 3.3 POS System (/pos/*)

**Purpose:** In-store order management

**Layout:** 3-column design
- **Left:** Menu catalog
- **Center:** Current order
- **Right:** Customer info

**Keyboard Shortcuts:**
- `F1` - New Order
- `F2` - Order History
- `F3` - Reports
- `ESC` - Clear
- `Ctrl+Enter` - Submit Order

**Features:**
- Real-time metrics (60s refresh)
- Order type selection (Dine-In, Pickup, Delivery)
- Payment method selection
- Customer lookup
- Daily reports
- Staff performance

---

### 3.4 Kitchen Display (/kitchen/*)

**Purpose:** Kitchen workflow management

**Pages:**
1. `KitchenDisplayPage.tsx` - Main kanban board
2. `OrderQueuePage.tsx` - Queue management

**Kanban Columns (5):**
1. RECEIVED - New orders
2. PREPARING - Make-table
3. COOKING - In oven (7-min timer)
4. READY - Ready for pickup/delivery
5. DISPATCHED - Out for delivery

**Features:**
- Real-time polling (5 seconds)
- Oven timer with alerts
- Urgent order indicators (>15 min)
- Drag-and-drop progression
- Order details modal
- Special instructions display
- Quality checkpoints
- Recipe viewer (👨‍🍳 icon)
- Make-table assignment
- Kitchen analytics

---

### 3.5 Driver App (/driver/*)

**Purpose:** Delivery management

**Pages:**
- `DriverDashboard.tsx` - Main dashboard
- Mobile-optimized bottom navigation
- Active deliveries
- Delivery history
- Earnings tracker

**Features:**
- GPS clock in/out
- Real-time location tracking
- Active delivery list
- Navigate (Google Maps)
- Call/SMS customer
- Mark as delivered
- Earnings summary
- Performance metrics

---

### 3.6 Manager Dashboard (/manager/*)

**Purpose:** Business intelligence, system control

**Pages (22):**

*Overview & Analytics:*
1. `DashboardPage.tsx` - Main overview
2. `AnalyticsPage.tsx` - Advanced analytics
3. `AdvancedReportsPage.tsx` - BI reports
4. `ProductAnalyticsPage.tsx` - Product performance

*Operations:*
5. `OrderManagementPage.tsx` - Order oversight
6. `StaffManagementPage.tsx` - Employee management
7. `CustomerManagementPage.tsx` - Customer database
8. `DriverManagementPage.tsx` - Driver management
9. `DeliveryManagementPage.tsx` - Delivery operations
10. `StaffLeaderboardPage.tsx` - Staff rankings

*Inventory:*
11. `InventoryDashboardPage.tsx` - Inventory overview
12. `PurchaseOrdersPage.tsx` - PO management
13. `SupplierManagementPage.tsx` - Supplier database
14. `WasteAnalysisPage.tsx` - Waste tracking

*Kitchen:*
15. `RecipeManagementPage.tsx` - Recipe management
16. `EquipmentMonitoringPage.tsx` - Equipment status
17. `KitchenAnalyticsPage.tsx` - Kitchen performance

*Financials:*
18. `PaymentDashboardPage.tsx` - Payment overview
19. `RefundManagementPage.tsx` - Refund processing

*Customer Engagement:*
20. `ReviewManagementPage.tsx` - Review moderation
21. `CampaignManagementPage.tsx` - Marketing campaigns

*Menu Management:*
22. Menu editing (integrated)

**Key Features:**
- Today vs Yesterday vs Last Year
- Real-time dashboards
- Staff performance tracking
- Customer insights
- Payment reconciliation
- Review moderation
- Campaign management
- Advanced BI

---

## 4. Technology Stack

### Backend
- **Language:** Java 21 (LTS)
- **Framework:** Spring Boot 3.x
- **Security:** Spring Security + JWT
- **Database:** MongoDB 6.x
- **Caching:** Redis 7.x
- **Real-time:** WebSocket (STOMP + SockJS)
- **Build:** Maven
- **Logging:** SLF4J + Logback
- **Password:** BCrypt
- **Validation:** Jakarta Validation

### Frontend
- **Framework:** React 18
- **Language:** TypeScript (strict mode)
- **State:** Redux Toolkit + RTK Query
- **UI:** Material-UI (MUI) v5
- **Charts:** Recharts
- **Forms:** React Hook Form + Yup
- **Routing:** React Router v7
- **Build:** Vite
- **HTTP:** Axios
- **WebSocket:** @stomp/stompjs + sockjs-client
- **Security:** DOMPurify (XSS protection)

### Infrastructure
- **Containerization:** Docker
- **Orchestration:** Docker Compose
- **Database:** MongoDB (9 databases)
- **Cache:** Redis
- **Payment:** Razorpay
- **Maps:** Google Maps API

---

## 5. Comprehensive E2E Test Scenarios

### 5.1 User Management & Authentication

#### **Scenario 1: Staff Registration & Login**
**Objective:** Verify complete user registration and authentication flow

**Preconditions:** None

**Test Steps:**
1. Navigate to registration page
2. Fill registration form:
   - Name: "John Doe"
   - Email: "john.doe@masova.com"
   - Phone: "9876543210"
   - Password: "SecurePass123!"
   - Role: STAFF
   - Store: Store ID
3. Submit registration form
4. **Verify:** User created in `masova.users` collection
5. **Verify:** Password hashed with BCrypt
6. Navigate to login page
7. Enter credentials
8. **Verify:** JWT token received with 24-hour expiry
9. **Verify:** Token payload contains userId, role, email
10. **Verify:** Token stored in localStorage
11. Make authenticated API call
12. **Verify:** Request successful with valid token
13. Logout
14. **Verify:** Token removed from localStorage
15. **Verify:** Next API call returns 401 Unauthorized

**Expected Results:**
- User registered successfully
- Login successful
- JWT authentication working
- Logout clears session

**API Endpoints:**
- `POST /api/users/register`
- `POST /api/users/login`
- `POST /api/users/logout`

---

#### **Scenario 2: GPS-based Clock In/Out**
**Objective:** Verify employee working session tracking with GPS

**Preconditions:** Staff user logged in

**Test Steps:**
1. Staff opens mobile app
2. Click "Clock In"
3. App requests GPS permission
4. Grant location access
5. Submit clock-in with coordinates:
   - Latitude: 12.9716
   - Longitude: 77.5946
6. **Verify:** Working session created in `masova.working_sessions`
7. **Verify:** Session has startTime, startLocation
8. Work for 4 hours
9. Click "Take Break"
10. Enter break duration: 30 minutes
11. **Verify:** Break added to session
12. Continue working for 4 more hours
13. Click "Clock Out"
14. Submit clock-out with GPS coordinates
15. **Verify:** Session has endTime, endLocation
16. **Verify:** Total working hours calculated: 8 hours
17. **Verify:** Break time deducted: 30 minutes
18. **Verify:** Net working hours: 7.5 hours
19. Manager opens session approval page
20. Review session details
21. Approve session
22. **Verify:** Session marked as APPROVED
23. **Verify:** Earnings calculated based on hourly rate

**Expected Results:**
- Clock in successful with GPS
- Break time tracked
- Clock out successful
- Session approval working
- Earnings calculated correctly

**API Endpoints:**
- `POST /api/users/sessions/start-with-location`
- `POST /api/users/sessions/{employeeId}/break`
- `POST /api/users/sessions/end-with-location`
- `POST /api/users/sessions/{sessionId}/approve`
- `GET /api/users/sessions/{employeeId}/report`

---

#### **Scenario 3: GDPR Data Access Request**
**Objective:** Verify GDPR Article 15 (Right of Access) compliance

**Preconditions:** Customer account exists

**Test Steps:**
1. Customer logs into app
2. Navigate to Privacy Settings
3. Click "Request My Data"
4. Select request type: "ACCESS"
5. Provide verification email
6. Submit request
7. **Verify:** Request created in `masova.gdpr_data_requests`
8. **Verify:** Verification email sent
9. Open email, click verification link
10. **Verify:** Request verified
11. **Verify:** Status changed to VERIFIED
12. Wait for processing (max 30 days)
13. **Verify:** Request status: IN_PROGRESS
14. System collects data:
    - User profile
    - Order history
    - Payment transactions
    - Addresses
    - Preferences
    - Loyalty points
    - Reviews
    - Consents
15. **Verify:** Data export generated (JSON format)
16. **Verify:** Request status: COMPLETED
17. **Verify:** Notification sent to customer
18. Customer downloads data export
19. **Verify:** Export contains all personal data
20. **Verify:** Audit log created with:
    - Action: DATA_ACCESS
    - User ID
    - Timestamp
    - IP address
    - User agent

**Expected Results:**
- Data access request processed within 30 days
- Complete data export provided
- Audit trail maintained
- GDPR Article 15 compliant

**API Endpoints:**
- `POST /api/gdpr/request`
- `POST /api/gdpr/request/{requestId}/verify`
- `POST /api/gdpr/request/{requestId}/access`
- `GET /api/gdpr/request/user/{userId}`
- `GET /api/gdpr/audit/{userId}`

---

#### **Scenario 4: GDPR Right to be Forgotten**
**Objective:** Verify GDPR Article 17 (Right to Erasure) compliance

**Preconditions:** Customer account exists with order history

**Test Steps:**
1. Customer creates erasure request
2. Customer verifies via email
3. Manager reviews request
4. Manager approves erasure
5. System processes erasure:
   - **Name:** "John Doe" → "DELETED_USER_abc123"
   - **Email:** "john@example.com" → "deleted_uuid@deleted.local"
   - **Phone:** "9876543210" → "0000000000"
   - **Password:** Hashed → NULL
   - **Addresses:** All removed
   - **Preferences:** All cleared
6. **Verify:** Order history retained (legal requirement: 7 years)
7. **Verify:** Orders show "DELETED_USER" as customer
8. **Verify:** Payment records retained (financial audit)
9. **Verify:** Personal data anonymized, not deleted
10. **Verify:** Audit log shows ERASURE action
11. Customer attempts login
12. **Verify:** Login fails (password NULL)
13. **Verify:** Account effectively deleted

**Expected Results:**
- Personal data anonymized
- Order history retained for legal compliance
- Login no longer possible
- GDPR Article 17 compliant

**API Endpoints:**
- `POST /api/gdpr/request`
- `POST /api/gdpr/request/{requestId}/verify`
- `POST /api/gdpr/request/{requestId}/erasure`

---

### 5.2 Menu Management

#### **Scenario 5: Menu Item Lifecycle**
**Objective:** Test complete menu item management

**Preconditions:** Manager logged in

**Test Steps:**
1. Navigate to Menu Management
2. Click "Add Item"
3. Fill form:
   - Name: "Paneer Tikka Pizza"
   - Category: PIZZA
   - Cuisine: FUSION
   - Dietary Type: VEGETARIAN
   - Price: ₹399
   - Description: "Indian fusion pizza"
   - Spice Level: MEDIUM
   - Tags: ["popular", "fusion"]
4. Add customizations:
   - Extra Cheese (+₹50)
   - Extra Paneer (+₹70)
5. Upload image
6. Mark as "Recommended"
7. Set availability: TRUE
8. Submit
9. **Verify:** Item created in `masova_menu.menu_items`
10. **Verify:** Redis cache updated
11. Open public menu (no auth)
12. **Verify:** Item visible
13. Filter by VEGETARIAN
14. **Verify:** Item appears
15. Manager updates price to ₹349
16. **Verify:** Price updated
17. **Verify:** Redis cache invalidated
18. Manager toggles availability (sold out)
19. **Verify:** Availability = FALSE
20. Refresh public menu
21. **Verify:** Item hidden from public view
22. Manager deletes item
23. **Verify:** Item removed from database
24. **Verify:** Cache cleared

**Expected Results:**
- Item creation successful
- Public menu displays correctly
- Filtering works
- Updates reflected immediately
- Cache invalidation working

**API Endpoints:**
- `POST /api/menu/items`
- `PUT /api/menu/items/{id}`
- `PATCH /api/menu/items/{id}/availability`
- `DELETE /api/menu/items/{id}`
- `GET /api/menu/public`

---

#### **Scenario 6: Menu Search & Filtering**
**Objective:** Test menu search and filtering capabilities

**Preconditions:** 150+ menu items in database

**Test Steps:**
1. Open public menu
2. Search "pizza"
3. **Verify:** Only pizza items returned
4. **Verify:** Redis cache key: `menu:search:pizza`
5. Filter by dietary type: VEGETARIAN
6. **Verify:** Only veg items shown
7. Filter by cuisine: ITALIAN
8. **Verify:** Only Italian items shown
9. Filter by category: PIZZA
10. **Verify:** Pizza category items shown
11. Filter by price range: ₹200-₹400
12. **Verify:** Items within range shown
13. Apply multiple filters:
    - Cuisine: ITALIAN
    - Dietary: VEGETARIAN
    - Category: PIZZA
14. **Verify:** Results match all filters
15. Repeat search "pizza"
16. **Verify:** Cache hit (response <50ms)
17. Clear all filters
18. **Verify:** Full menu displayed

**Expected Results:**
- Search working correctly
- Filtering accurate
- Multiple filters work together
- Redis caching improves performance

**API Endpoints:**
- `GET /api/menu/public/search?q=pizza`
- `GET /api/menu/public/cuisine/{cuisine}`
- `GET /api/menu/public/category/{category}`
- `GET /api/menu/public/dietary/{dietaryType}`

---

### 5.3 Complete Order Workflow

#### **Scenario 7: Dine-In Order (POS)**
**Objective:** Test complete dine-in order flow through POS

**Preconditions:** Staff logged into POS

**Test Steps:**
1. Staff opens POS system
2. **Verify:** 3-column layout displayed
3. Select order type: "DINE_IN"
4. Enter table number: "Table 5"
5. Browse menu in left panel
6. Add items to cart:
   - 2x Margherita Pizza (₹299 each)
   - 1x Garlic Bread (₹149)
   - 2x Coke (₹50 each)
7. **Verify:** Cart shows:
   - Subtotal: ₹847
   - Tax (5%): ₹42.35
   - Total: ₹889.35
8. Add special instructions: "Extra cheese on pizza"
9. Select payment method: "CASH"
10. Press `Ctrl+Enter` to submit
11. **Verify:** Order created in `masova_orders.orders`
12. **Verify:** Order status: RECEIVED
13. **Verify:** Order number generated (e.g., ORD-20251125-001)
14. **Verify:** Payment status: PENDING
15. Open Kitchen Display
16. **Verify:** Order appears in RECEIVED column
17. **Verify:** Order shows:
    - Order number
    - Table 5
    - Items list
    - Special instructions highlighted
    - Timer showing "0 min"
18. Print receipt
19. **Verify:** Receipt shows:
    - Order number
    - Table number
    - Items with quantities
    - Total amount
    - Payment method

**Expected Results:**
- Order creation successful
- Order appears in Kitchen Display
- Calculations accurate
- Special instructions preserved
- Receipt generation working

**API Endpoints:**
- `POST /api/orders`
- `GET /api/orders/kitchen/{storeId}`

---

#### **Scenario 8: Delivery Order (Customer App)**
**Objective:** Test complete online delivery order with payment

**Preconditions:** Customer logged in, menu loaded

**Test Steps:**
1. Customer opens app
2. Navigate to Menu
3. Browse items
4. Add to cart:
   - 1x Chicken Biryani (₹299)
   - 1x Raita (₹79)
5. Click cart icon
6. **Verify:** Cart shows:
   - Subtotal: ₹378
   - Tax (5%): ₹18.90
   - Delivery: ₹50
   - Total: ₹446.90
7. Click "Proceed to Checkout"
8. Select delivery address:
   - Use saved address OR
   - Add new address
9. Review order summary
10. Select payment: "Pay Online"
11. Click "Place Order"
12. **Verify:** Order created with status RECEIVED
13. **Verify:** Payment status: PENDING
14. Razorpay modal opens
15. Enter test card:
    - Number: 4111 1111 1111 1111
    - Expiry: 12/25
    - CVV: 123
16. Click "Pay"
17. **Verify:** Payment successful
18. Razorpay webhook fires
19. **Verify:** Payment verified
20. **Verify:** Transaction saved in `masova_payments.transactions`
21. **Verify:** Order payment status: PAID
22. **Verify:** Order processing begins
23. Customer receives notifications:
    - IN_APP: "Order placed successfully"
    - EMAIL: Order receipt
    - SMS: Tracking link
24. Open Kitchen Display
25. **Verify:** Order appears in RECEIVED column
26. **Verify:** Order type: DELIVERY
27. **Verify:** WebSocket update received by customer app

**Expected Results:**
- Order placement successful
- Payment integration working
- Order appears in Kitchen Display
- Notifications sent
- Real-time updates working

**API Endpoints:**
- `POST /api/orders`
- `POST /api/payments/initiate`
- `POST /api/payments/verify`
- `GET /api/orders/customer/{customerId}`

---

### 5.4 Kitchen Workflow

#### **Scenario 9: Order Progression Through Kitchen**
**Objective:** Test complete kitchen workflow from receipt to completion

**Preconditions:** Order exists with status RECEIVED

**Test Steps:**
1. Chef opens Kitchen Display
2. **Verify:** Kanban board with 5 columns
3. **Verify:** Order in RECEIVED column
4. Click order card
5. **Verify:** Order details modal opens:
   - Order number
   - Order type
   - Items with quantities
   - Special instructions
   - Customer details
   - Prep time: 0 min
6. Click "Start Preparing"
7. **Verify:** Order moves to PREPARING column
8. **Verify:** WebSocket update sent
9. **Verify:** Customer app updates (1 second delay)
10. Add quality checkpoint:
    - Type: INGREDIENT_QUALITY
    - Status: PASSED
    - Notes: "Fresh ingredients verified"
11. **Verify:** Checkpoint saved
12. Assign to make-table: PIZZA_STATION
13. Assign to staff: Chef John
14. Click "Move to Oven"
15. **Verify:** Order moves to COOKING column
16. **Verify:** 7-minute oven timer starts
17. **Verify:** Timer displays: 7:00
18. Wait for timer (or simulate)
19. **Verify:** Timer reaches 0:00
20. **Verify:** Audio alert plays
21. **Verify:** Order card highlighted (urgent)
22. Add quality checkpoint:
    - Type: TEMPERATURE
    - Status: PASSED
    - Notes: "Internal temp 165°F"
23. Click "Ready for Pickup/Delivery"
24. **Verify:** Order moves to READY column
25. **Verify:** Prep time calculated (e.g., 12 minutes)
26. **Verify:** Notification sent to driver (for delivery)
27. **Verify:** Customer notification sent
28. Driver assigned (for delivery orders)
29. **Verify:** Order moves to OUT_FOR_DELIVERY
30. Driver delivers order
31. **Verify:** Order status: DELIVERED

**Expected Results:**
- Kanban workflow smooth
- Timers working correctly
- Quality checkpoints tracked
- Real-time updates functioning
- Notifications sent

**API Endpoints:**
- `GET /api/orders/kitchen/{storeId}`
- `PATCH /api/orders/{orderId}/next-stage`
- `POST /api/orders/{orderId}/quality-checkpoint`
- `PATCH /api/orders/{orderId}/assign-make-table`
- `PATCH /api/orders/{orderId}/assign-driver`

---

#### **Scenario 10: Make-Table Workflow**
**Objective:** Test station-based workflow management

**Preconditions:** Multiple orders in kitchen

**Test Steps:**
1. Kitchen manager views active orders
2. Order 1: 2x Margherita Pizza
3. Assign to PIZZA_STATION
4. Assign to Chef: John
5. **Verify:** Order assigned
6. Order 2: 1x Chicken Sandwich
7. Assign to SANDWICH_STATION
8. Assign to Chef: Mary
9. **Verify:** Order assigned
10. Filter orders by PIZZA_STATION
11. **Verify:** Only pizza orders shown
12. Chef John views his station
13. **Verify:** Sees assigned orders only
14. Chef completes pizza preparation
15. Mark station task complete
16. Order moves to OVEN stage
17. Track prep time by station
18. Generate station performance report
19. **Verify:** Report shows:
    - PIZZA_STATION: Avg 8 min
    - SANDWICH_STATION: Avg 6 min
20. Identify bottlenecks
21. Optimize workflow

**Expected Results:**
- Station assignment working
- Staff sees their orders
- Performance tracking accurate
- Bottleneck identification working

**API Endpoints:**
- `PATCH /api/orders/{orderId}/assign-make-table`
- `GET /api/orders/store/{storeId}/make-table/{station}`
- `GET /api/orders/store/{storeId}/analytics/prep-time-by-item`

---

#### **Scenario 11: Quality Checkpoint Failure**
**Objective:** Test quality control failure workflow

**Preconditions:** Order in COOKING stage

**Test Steps:**
1. Chef performs visual inspection
2. Add quality checkpoint:
   - Type: PRESENTATION
   - Status: FAILED
   - Notes: "Pizza undercooked, crust not golden"
3. Submit checkpoint
4. **Verify:** Checkpoint saved with FAILED status
5. **Verify:** Order flagged for manager review
6. Manager receives notification
7. Manager views failed quality checks
8. **Verify:** Order appears in failed list
9. Manager reviews order
10. Manager decides action: "REFIRE"
11. Order sent back to PREPARING stage
12. Chef prepares order again
13. Add checkpoint:
    - Type: PRESENTATION
    - Status: PASSED
    - Notes: "Perfect golden crust"
14. Order continues through workflow
15. Generate quality report
16. **Verify:** Report shows:
    - Total checkpoints: 500
    - Passed: 485
    - Failed: 15
    - Success rate: 97%
17. Track quality by staff member
18. Identify training needs

**Expected Results:**
- Quality failures tracked
- Manager notified
- Refire workflow working
- Quality metrics accurate

**API Endpoints:**
- `POST /api/orders/{orderId}/quality-checkpoint`
- `PATCH /api/orders/{orderId}/quality-checkpoint/{name}`
- `GET /api/orders/store/{storeId}/failed-quality-checks`

---

### 5.5 Delivery Management

#### **Scenario 12: Driver Assignment & Delivery**
**Objective:** Test complete delivery workflow

**Preconditions:** Order ready for delivery

**Test Steps:**
1. Order marked READY in kitchen
2. Manager views available drivers
3. **Verify:** Driver list shows:
   - Driver name
   - Current status (AVAILABLE/BUSY)
   - Current location
   - Active deliveries count
4. Manager selects driver: "Raj Kumar"
5. Assign driver to order
6. **Verify:** Order status: OUT_FOR_DELIVERY
7. **Verify:** Driver assigned to order
8. Driver receives push notification
9. Driver opens app
10. **Verify:** Order in "Active Deliveries"
11. Driver views order details:
    - Order number
    - Customer name
    - Customer phone
    - Delivery address
    - Items
    - Payment method
    - Amount to collect (if COD)
12. Driver clicks "Navigate"
13. **Verify:** Google Maps opens
14. **Verify:** Route to customer displayed
15. Driver en route
16. Driver location updates every 30 seconds
17. Customer views live tracking
18. **Verify:** Driver location on map
19. **Verify:** ETA displayed
20. Driver arrives
21. Driver clicks "Call Customer"
22. **Verify:** Phone call initiated
23. Driver hands over order
24. Driver clicks "Mark as Delivered"
25. **Verify:** Order status: DELIVERED
26. **Verify:** Delivery time recorded
27. **Verify:** Driver earnings updated
28. **Verify:** Customer notification sent
29. Customer receives order
30. Customer prompted to review

**Expected Results:**
- Driver assignment successful
- Navigation working
- Live tracking functional
- Delivery completion successful
- Earnings calculated

**API Endpoints:**
- `PATCH /api/orders/{orderId}/assign-driver`
- `GET /api/users/drivers/store/{storeId}`
- `POST /api/delivery/location-update`
- `GET /api/delivery/track/{orderId}`

---

#### **Scenario 13: Live Tracking**
**Objective:** Test real-time delivery tracking

**Preconditions:** Order out for delivery

**Test Steps:**
1. Customer opens tracking page
2. Enter order number OR auto-load from account
3. **Verify:** Map displayed
4. **Verify:** Order status timeline:
   - ✓ Order Placed
   - ✓ Preparing
   - ✓ Cooking
   - ✓ Ready
   - → Out for Delivery (current)
   - Delivered
5. **Verify:** Driver details:
   - Name
   - Photo
   - Phone number
   - Vehicle number
6. **Verify:** Driver location marker on map
7. **Verify:** Customer location marker
8. **Verify:** Route drawn between driver and customer
9. **Verify:** ETA displayed: "15 minutes"
10. Wait 30 seconds
11. **Verify:** Driver location updates
12. **Verify:** ETA updates: "13 minutes"
13. Driver approaches (within 1 km)
14. **Verify:** SMS sent: "Driver nearby"
15. Driver arrives
16. **Verify:** Status updates: DELIVERED
17. **Verify:** Delivery confirmation shown
18. **Verify:** Review prompt appears

**Expected Results:**
- Map displays correctly
- Real-time location updates working
- ETA calculation accurate
- Notifications timely

**API Endpoints:**
- `GET /api/delivery/track/{orderId}`
- `GET /api/delivery/eta/{orderId}`
- `POST /api/delivery/location-update`

---

#### **Scenario 14: Driver Performance**
**Objective:** Test driver performance tracking and leaderboard

**Preconditions:** Driver completed multiple deliveries

**Test Steps:**
1. Driver completes 10 deliveries in shift
2. System tracks metrics:
   - Total deliveries: 10
   - On-time: 9 (90%)
   - Late: 1 (10%)
   - Average delivery time: 22 minutes
   - Total distance: 45 km
   - Total earnings: ₹450
3. Customer rates deliveries:
   - 9x 5-star
   - 1x 4-star
   - Average: 4.9 stars
4. Manager opens driver dashboard
5. View driver performance:
   - Deliveries completed: 10
   - Success rate: 100%
   - On-time rate: 90%
   - Average rating: 4.9
   - Total earnings: ₹450
6. Generate driver leaderboard
7. **Verify:** Top drivers:
   - Rank 1: Raj (4.9 stars, 10 deliveries)
   - Rank 2: Amit (4.8 stars, 12 deliveries)
8. **Verify:** Performance indicators:
   - Fast delivery badge
   - Top rated badge
9. Export performance report
10. **Verify:** Report includes:
    - Daily stats
    - Weekly trends
    - Customer ratings
    - Earnings breakdown

**Expected Results:**
- Performance metrics accurate
- Leaderboard working
- Reports comprehensive

**API Endpoints:**
- `GET /api/analytics/drivers/status/{storeId}`
- `GET /api/analytics/staff/leaderboard`
- Performance tracking endpoints

---

### 5.6 Payment Processing

#### **Scenario 15: Online Payment (Razorpay)**
**Objective:** Test complete online payment flow

**Preconditions:** Customer has order in cart

**Test Steps:**
1. Customer proceeds to checkout
2. Review order:
   - Subtotal: ₹500
   - Tax (5%): ₹25
   - Delivery: ₹50
   - Total: ₹575
3. Select payment: "Pay Online"
4. Click "Place Order"
5. Frontend calls `/api/payments/initiate`
6. **Verify:** Razorpay order created
7. **Verify:** Response contains:
   - razorpay_order_id
   - amount (in paisa): 57500
   - currency: "INR"
8. Razorpay checkout modal opens
9. **Verify:** Modal shows:
   - MaSoVa branding
   - Amount: ₹575
   - Payment methods (Card, UPI, Net Banking, Wallet)
10. Select "Card"
11. Enter test card:
    - Number: 4111 1111 1111 1111
    - Name: "Test User"
    - Expiry: 12/25
    - CVV: 123
12. Click "Pay"
13. **Verify:** Payment processing
14. **Verify:** Payment successful
15. Razorpay callback triggered
16. Frontend receives:
    - razorpay_payment_id
    - razorpay_order_id
    - razorpay_signature
17. Frontend calls `/api/payments/verify`
18. **Verify:** Signature verified
19. **Verify:** Transaction saved:
    - razorpay_payment_id
    - razorpay_order_id
    - amount: 575.00
    - status: CAPTURED
    - payment_method: CARD
20. **Verify:** Order payment status: PAID
21. **Verify:** Order processing begins
22. Customer redirected to success page
23. **Verify:** Success message displayed
24. **Verify:** Order number shown
25. Razorpay webhook fires (async)
26. **Verify:** Webhook signature verified
27. **Verify:** Payment status confirmed

**Expected Results:**
- Payment initiation successful
- Razorpay modal working
- Payment verification successful
- Order updated correctly
- Webhook handling working

**API Endpoints:**
- `POST /api/payments/initiate`
- `POST /api/payments/verify`
- `POST /api/payments/webhook`
- `GET /api/payments/order/{orderId}`

---

#### **Scenario 16: Cash on Delivery**
**Objective:** Test COD payment workflow

**Preconditions:** Customer placing delivery order

**Test Steps:**
1. Customer proceeds to checkout
2. Select payment: "Cash on Delivery"
3. Click "Place Order"
4. **Verify:** Order created
5. **Verify:** Payment status: PENDING
6. **Verify:** Payment method: CASH_ON_DELIVERY
7. Order prepared and dispatched
8. Driver delivers order
9. Driver collects cash: ₹575
10. Driver clicks "Confirm Payment Received"
11. Enter amount collected: ₹575
12. **Verify:** Payment status: PAID
13. **Verify:** Transaction created:
    - payment_method: CASH
    - amount: 575.00
    - status: CAPTURED
14. **Verify:** Cash added to driver collection
15. Driver end-of-shift report
16. **Verify:** Cash collection summary:
    - Total cash collected: ₹575
    - Orders: 1
17. Manager reconciles cash
18. Mark as reconciled

**Expected Results:**
- COD order creation successful
- Driver cash collection tracked
- Payment confirmation working
- Reconciliation accurate

**API Endpoints:**
- `POST /api/orders`
- `PATCH /api/orders/{orderId}/payment`
- `POST /api/payments/reconciliation`

---

#### **Scenario 17: Payment Reconciliation**
**Objective:** Test daily payment reconciliation

**Preconditions:** Multiple payments processed

**Test Steps:**
1. Manager opens Payment Dashboard
2. Select date: Today
3. View payment summary:
   - Total sales: ₹15,420
   - Order count: 48
   - Average order value: ₹321
4. Payment method breakdown:
   - Card: ₹8,500 (22 orders)
   - UPI: ₹4,200 (15 orders)
   - Cash: ₹2,720 (11 orders)
5. Click "Reconciliation Report"
6. **Verify:** Report shows:
   - Total transactions: 48
   - Reconciled: 40
   - Pending: 8
7. View pending transactions
8. Compare with Razorpay dashboard
9. **Verify:** Amounts match
10. Mark transactions as reconciled
11. **Verify:** Status updated
12. Download reconciliation report (CSV)
13. **Verify:** Report contains:
    - Transaction ID
    - Order number
    - Amount
    - Payment method
    - Status
    - Reconciliation date
14. Upload to accounting system

**Expected Results:**
- Reconciliation report accurate
- Status tracking working
- Export functional

**API Endpoints:**
- `GET /api/payments/reconciliation`
- `POST /api/payments/{transactionId}/reconcile`
- `GET /api/payments/store/{storeId}`

---

#### **Scenario 18: Refund Processing**
**Objective:** Test refund workflow

**Preconditions:** Completed order with payment

**Test Steps:**
1. Customer requests refund
2. Reason: "Order cancelled"
3. Manager reviews refund request
4. Verify order details:
   - Order ID
   - Amount: ₹575
   - Payment method: CARD
5. Manager approves refund
6. Select refund type: FULL
7. Click "Process Refund"
8. System calls Razorpay refund API
9. **Verify:** Refund initiated
10. **Verify:** Refund record created:
    - refund_id
    - transaction_id
    - amount: 575.00
    - status: PROCESSING
11. Razorpay processes refund (3-5 days)
12. **Verify:** Refund status: PROCESSED
13. **Verify:** Transaction status: REFUNDED
14. **Verify:** Order status: REFUNDED
15. Customer receives refund notification
16. Customer receives money (original method)
17. Generate refund report
18. **Verify:** Report shows:
    - Total refunds: 1
    - Total amount: ₹575
    - Refund rate: 2%

**Expected Results:**
- Refund approval workflow working
- Razorpay integration functional
- Status tracking accurate
- Notifications sent

**API Endpoints:**
- `POST /api/payments/refund`
- `GET /api/payments/refund/{refundId}`
- `GET /api/payments/refund/order/{orderId}`

---

### 5.7 Analytics & Reporting

#### **Scenario 19: Manager Daily Dashboard**
**Objective:** Test real-time analytics dashboard

**Preconditions:** Manager logged in

**Test Steps:**
1. Manager opens Dashboard
2. **Verify:** Today's metrics displayed:
   - Total sales: ₹15,420
   - Order count: 48
   - Average order value: ₹321
   - Active drivers: 5
   - Kitchen orders: 12
3. View comparison cards:
   - **vs Yesterday:**
     - Sales: +12% (₹1,650 increase)
     - Orders: +8% (4 more orders)
     - AOV: +4% (₹12 increase)
   - **vs Last Year:**
     - Sales: +45% (₹4,800 increase)
     - Orders: +30% (11 more orders)
     - New customers: +25%
4. View order type breakdown (pie chart):
   - Dine-In: 20 orders (42%)
   - Pickup: 12 orders (25%)
   - Delivery: 16 orders (33%)
5. View peak hours chart:
   - 12 PM - 2 PM: 15 orders
   - 7 PM - 9 PM: 20 orders
6. View staff leaderboard:
   - Rank 1: John (12 orders, ₹3,840)
   - Rank 2: Mary (10 orders, ₹3,210)
   - Rank 3: Raj (8 orders, ₹2,560)
7. View top-selling items:
   - Chicken Biryani: 15 orders, ₹4,485
   - Margherita Pizza: 12 orders, ₹3,588
8. Auto-refresh (every 60 seconds)
9. **Verify:** Metrics update automatically
10. Export daily report (PDF)

**Expected Results:**
- Real-time metrics accurate
- Comparisons working
- Charts displaying correctly
- Auto-refresh functional
- Export working

**API Endpoints:**
- `GET /api/analytics/store/{storeId}/sales/today`
- `GET /api/analytics/store/{storeId}/avgOrderValue/today`
- `GET /api/analytics/sales/breakdown/order-type`
- `GET /api/analytics/sales/peak-hours`
- `GET /api/analytics/staff/leaderboard`
- `GET /api/analytics/products/top-selling`

---

#### **Scenario 20: Staff Performance Report**
**Objective:** Test staff performance analytics

**Preconditions:** Staff member with order history

**Test Steps:**
1. Manager opens Staff Management
2. Select staff: John Doe
3. Select period: Last 30 days
4. View performance metrics:
   - Orders processed: 245
   - Total sales: ₹78,500
   - Average order value: ₹320
   - Working hours: 168 hours
   - Sales per hour: ₹467
5. View performance trends (line chart)
6. Compare with team average:
   - John's AOV: ₹320
   - Team average: ₹310
   - Performance: +3.2%
7. View order distribution:
   - Dine-In: 100 orders
   - Pickup: 80 orders
   - Delivery: 65 orders
8. View customer ratings:
   - Average: 4.7 stars
   - Total reviews: 50
9. Identify top performer
10. Generate performance report (PDF)
11. **Verify:** Report includes:
    - Summary metrics
    - Trend charts
    - Comparison with peers
    - Recommendations

**Expected Results:**
- Performance metrics accurate
- Comparisons working
- Trends displayed correctly
- Report generation functional

**API Endpoints:**
- `GET /api/analytics/staff/{staffId}/performance/today`
- `GET /api/analytics/staff/leaderboard`

---

#### **Scenario 21: Product Analytics**
**Objective:** Test product performance tracking

**Preconditions:** Multiple orders with various items

**Test Steps:**
1. Manager opens Product Analytics
2. Select period: This Month
3. Sort by: Revenue
4. View top-selling items:
   - Chicken Biryani: ₹45,000 (150 orders)
   - Margherita Pizza: ₹35,000 (120 orders)
   - Garlic Bread: ₹18,000 (140 orders)
5. Sort by: Quantity
6. View most popular items:
   - Coke: 200 orders
   - Garlic Bread: 140 orders
   - Chicken Biryani: 150 orders
7. View least-selling items:
   - Pasta Alfredo: ₹2,000 (8 orders)
   - Mexican Tacos: ₹1,500 (6 orders)
8. Identify items to promote or remove
9. View profitability by item:
   - Chicken Biryani: 60% margin
   - Pizza: 70% margin
10. View category performance:
    - PIZZA: ₹50,000 (30% of sales)
    - BIRYANI: ₹45,000 (27% of sales)
11. Generate product report
12. **Verify:** Recommendations:
    - Promote low-selling items
    - Increase stock for top sellers
    - Consider menu optimization

**Expected Results:**
- Product analytics accurate
- Sorting working
- Profitability calculations correct
- Recommendations helpful

**API Endpoints:**
- `GET /api/analytics/products/top-selling`
- `GET /api/orders/range`

---

#### **Scenario 22: Kitchen Analytics**
**Objective:** Test kitchen performance metrics

**Preconditions:** Orders with prep time data

**Test Steps:**
1. Manager opens Kitchen Analytics
2. Select period: Today
3. View prep time distribution:
   - Average: 15 minutes
   - Median: 14 minutes
   - 90th percentile: 20 minutes
   - 95th percentile: 25 minutes
   - Min: 8 minutes
   - Max: 35 minutes
4. View prep time by item:
   - Pizza: Avg 12 min
   - Biryani: Avg 18 min
   - Dosa: Avg 8 min
   - Pasta: Avg 15 min
5. Identify bottlenecks:
   - Biryani taking 18+ min (target: 15 min)
   - Inconsistent pasta prep (8-22 min range)
6. View quality checkpoint success rate:
   - Total: 500 checkpoints
   - Passed: 485 (97%)
   - Failed: 15 (3%)
7. View failed checks by type:
   - Presentation: 8
   - Temperature: 4
   - Portion size: 3
8. View staff performance:
   - John: 45 orders, Avg 14 min, 98% quality
   - Mary: 38 orders, Avg 16 min, 95% quality
9. View equipment status:
   - Oven 1: AVAILABLE
   - Oven 2: IN_USE (12 min remaining)
   - Grill: MAINTENANCE (scheduled)
10. Generate kitchen report
11. **Verify:** Recommendations:
    - Train on biryani efficiency
    - Address quality issues
    - Schedule equipment maintenance

**Expected Results:**
- Kitchen metrics accurate
- Bottleneck identification working
- Quality tracking functional
- Equipment monitoring working

**API Endpoints:**
- `GET /api/orders/store/{storeId}/analytics/prep-time-by-item`
- `GET /api/orders/analytics/kitchen-staff/{staffId}/performance`
- `GET /api/orders/store/{storeId}/analytics/prep-time-distribution`
- `GET /api/orders/store/{storeId}/failed-quality-checks`

---

### 5.8 Inventory Management

#### **Scenario 23: Stock Management**
**Objective:** Test complete inventory lifecycle

**Preconditions:** Manager logged in

**Test Steps:**
1. Manager opens Inventory Dashboard
2. Click "Add Item"
3. Fill form:
   - Name: "Mozzarella Cheese"
   - Category: DAIRY
   - Quantity: 50 kg
   - Unit: KG
   - Reorder point: 10 kg
   - Unit cost: ₹500/kg
   - Supplier: Fresh Foods Ltd
4. Submit
5. **Verify:** Item created in `masova_inventory.inventory_items`
6. **Verify:** Inventory value updated: +₹25,000
7. Customer places order with pizza (uses 2 kg cheese)
8. System reserves 2 kg
9. **Verify:** Available stock: 48 kg
10. **Verify:** Reserved stock: 2 kg
11. Order prepared, cheese consumed
12. **Verify:** Available stock: 48 kg
13. **Verify:** Reserved stock: 0 kg
14. Multiple orders consume 40 kg total
15. **Verify:** Available stock: 8 kg
16. **Verify:** Low stock alert triggered (< 10 kg)
17. Manager receives notification
18. Manager creates purchase order:
    - Supplier: Fresh Foods Ltd
    - Item: Mozzarella Cheese
    - Quantity: 50 kg
    - Unit price: ₹500/kg
    - Total: ₹25,000
19. **Verify:** PO created with status PENDING
20. Manager approves PO
21. **Verify:** PO status: APPROVED
22. Manager sends PO to supplier (email)
23. Supplier delivers goods
24. Staff receives shipment
25. Verify quantity and quality
26. Click "Receive Stock"
27. **Verify:** Available stock: 58 kg
28. **Verify:** PO status: COMPLETED
29. **Verify:** Low stock alert cleared

**Expected Results:**
- Stock tracking accurate
- Reservation system working
- Alerts triggering correctly
- PO workflow functional

**API Endpoints:**
- `POST /api/inventory/items`
- `PATCH /api/inventory/items/{id}/reserve`
- `PATCH /api/inventory/items/{id}/consume`
- `GET /api/inventory/low-stock`
- `POST /api/inventory/purchase-orders`

---

#### **Scenario 24: Waste Tracking**
**Objective:** Test waste management and analysis

**Preconditions:** Inventory items exist

**Test Steps:**
1. Kitchen staff identifies spoiled vegetables
2. Opens waste reporting form
3. Fill details:
   - Item: Tomatoes
   - Quantity: 2 kg
   - Category: VEGETABLES
   - Reason: EXPIRED
   - Notes: "Past expiry date"
4. Submit
5. **Verify:** Waste record created
6. **Verify:** Inventory adjusted: -2 kg
7. **Verify:** Cost calculated: 2 kg × ₹50 = ₹100
8. Manager views waste analysis
9. View waste summary:
   - Total waste cost: ₹100
   - Total waste quantity: 2 kg
10. View waste by category:
    - VEGETABLES: ₹100 (100%)
11. View waste by reason:
    - EXPIRED: ₹100 (100%)
12. View preventable waste analysis:
    - Preventable: ₹100 (expired items)
    - Non-preventable: ₹0
13. View top wasted items:
    - Tomatoes: ₹100
14. View waste trend (monthly):
    - January: ₹500
    - February: ₹450
    - March: ₹380
    - Trend: Decreasing ✓
15. Generate waste report
16. **Verify:** Recommendations:
    - Improve storage for vegetables
    - Adjust ordering quantities
    - Train staff on FIFO (First In First Out)

**Expected Results:**
- Waste recording working
- Cost tracking accurate
- Analysis comprehensive
- Recommendations actionable

**API Endpoints:**
- `POST /api/inventory/waste`
- `GET /api/inventory/waste/total-cost`
- `GET /api/inventory/waste/cost-by-category`
- `GET /api/inventory/waste/top-items`
- `GET /api/inventory/waste/preventable-analysis`
- `GET /api/inventory/waste/trend`

---

#### **Scenario 25: Purchase Order Workflow**
**Objective:** Test complete PO lifecycle

**Preconditions:** Low stock items identified

**Test Steps:**
1. System detects low stock items
2. Manager reviews alerts:
   - Mozzarella Cheese: 8 kg (reorder: 10 kg)
   - Flour: 15 kg (reorder: 20 kg)
   - Tomatoes: 5 kg (reorder: 10 kg)
3. Click "Create Purchase Order"
4. Select supplier: Fresh Foods Ltd
5. Add items:
   - Mozzarella Cheese: 50 kg × ₹500 = ₹25,000
   - Flour: 100 kg × ₹40 = ₹4,000
   - Tomatoes: 30 kg × ₹50 = ₹1,500
6. Review totals:
   - Subtotal: ₹30,500
   - Tax (if applicable): ₹0
   - Total: ₹30,500
7. Add notes: "Urgent delivery required"
8. Submit PO
9. **Verify:** PO created with status DRAFT
10. Manager reviews PO
11. Manager approves PO
12. **Verify:** PO status: APPROVED
13. System sends email to supplier
14. **Verify:** Email contains:
    - PO number
    - Items list
    - Delivery address
    - Expected date
15. Supplier confirms (manually)
16. Manager marks PO as SENT
17. Expected delivery: 2 days
18. Supplier delivers on Day 2
19. Staff receives shipment
20. Verify quantities:
    - Cheese: 50 kg ✓
    - Flour: 100 kg ✓
    - Tomatoes: 30 kg ✓
21. Quality check passed
22. Click "Receive Stock"
23. **Verify:** Inventory updated:
    - Cheese: 58 kg
    - Flour: 115 kg
    - Tomatoes: 35 kg
24. **Verify:** PO status: COMPLETED
25. Generate purchase report
26. **Verify:** Report shows:
    - PO number
    - Supplier
    - Items
    - Total cost
    - Delivery date

**Expected Results:**
- PO creation successful
- Approval workflow functional
- Email notifications working
- Stock receipt accurate
- Report generation working

**API Endpoints:**
- `POST /api/inventory/purchase-orders`
- `PATCH /api/inventory/purchase-orders/{id}/approve`
- `PATCH /api/inventory/purchase-orders/{id}/send`
- `PATCH /api/inventory/purchase-orders/{id}/receive`

---

### 5.9 Customer Management & Loyalty

#### **Scenario 26: Customer Profile Management**
**Objective:** Test customer profile and preferences

**Preconditions:** Customer registered

**Test Steps:**
1. Customer logs into app
2. Navigate to Profile
3. View profile details:
   - Name: John Doe
   - Email: john@example.com (✓ verified)
   - Phone: 9876543210 (✓ verified)
   - Birthday: 15-Jan-1990
   - Member since: 01-Jan-2025
4. Click "Edit Profile"
5. Update name: "John K. Doe"
6. Update birthday: "15-Jan-1990"
7. Save
8. **Verify:** Profile updated
9. Navigate to "My Addresses"
10. View saved addresses:
    - Home (default)
    - Office
11. Click "Add Address"
12. Fill form:
    - Label: "Gym"
    - Street: "123 Fitness St"
    - City: "Bangalore"
    - State: "Karnataka"
    - Pincode: "560001"
13. Save
14. **Verify:** Address added
15. Set "Gym" as default
16. **Verify:** Default changed
17. Navigate to "Preferences"
18. Add favorite items:
    - Chicken Biryani
    - Margherita Pizza
19. Set cuisine preferences:
    - SOUTH_INDIAN
    - ITALIAN
20. Set spice level: MEDIUM
21. Add dietary restrictions:
    - No peanuts (allergy)
22. **Verify:** Preferences saved
23. Navigate to "Communication Preferences"
24. Enable marketing emails
25. Disable SMS notifications
26. **Verify:** Preferences saved

**Expected Results:**
- Profile updates working
- Multiple addresses supported
- Preferences saved correctly
- Communication preferences working

**API Endpoints:**
- `PUT /api/customers/{id}`
- `POST /api/customers/{id}/addresses`
- `PATCH /api/customers/{customerId}/addresses/{addressId}/set-default`
- `PUT /api/customers/{id}/preferences`

---

#### **Scenario 27: Loyalty Points Lifecycle**
**Objective:** Test complete loyalty program

**Preconditions:** Customer account created

**Test Steps:**
1. Customer registers account
2. **Verify:** Signup bonus: 100 points
3. **Verify:** Loyalty tier: BRONZE (0-999 points)
4. Customer places order worth ₹1,000
5. Order delivered successfully
6. **Verify:** Points earned: 100 (10% of order value)
7. **Verify:** Total points: 200
8. View loyalty card in profile:
   - Current points: 200
   - Tier: BRONZE
   - Progress to SILVER: 20%
9. Customer places 10 more orders (₹10,000 total)
10. **Verify:** Points earned: 1,000
11. **Verify:** Total points: 1,200
12. **Verify:** Tier upgraded to SILVER (1000-4999 points)
13. **Verify:** Notification sent: "Tier upgrade!"
14. View SILVER benefits:
    - Free delivery on all orders
    - Priority support
15. Customer places order worth ₹500
16. **Verify:** Delivery charges: ₹0 (SILVER benefit)
17. Customer redeems 500 points
18. **Verify:** Discount applied: ₹50 (10% value)
19. **Verify:** Remaining points: 700
20. Customer's birthday
21. **Verify:** Birthday bonus: 200 points
22. **Verify:** Total points: 900
23. **Verify:** Birthday email sent with offer
24. Generate loyalty report
25. **Verify:** Report shows:
    - Points earned: 1,300
    - Points redeemed: 500
    - Current balance: 900
    - Tier: SILVER

**Expected Results:**
- Points calculation accurate
- Tier upgrades working
- Benefits applied correctly
- Birthday bonus triggered
- Reports comprehensive

**API Endpoints:**
- `POST /api/customers`
- `POST /api/customers/{id}/loyalty/points`
- `GET /api/customers/loyalty/tier/{tier}`
- `GET /api/customers/birthdays/today`

---

#### **Scenario 28: Customer Segmentation**
**Objective:** Test customer segmentation and targeting

**Preconditions:** Multiple customers in database

**Test Steps:**
1. Manager opens Customer Management
2. View customer statistics:
   - Total customers: 500
   - Active customers: 450
   - High-value customers: 50
   - Average lifetime value: ₹5,000
3. Filter high-value customers:
   - Total spending > ₹10,000
4. **Verify:** 50 customers shown
5. View customer details:
   - John Doe: ₹25,000 (50 orders)
   - Jane Smith: ₹18,000 (40 orders)
6. Select customers
7. Add tags: "high_value", "frequent"
8. **Verify:** Tags added
9. Create segment: "VIP Customers"
10. Add criteria:
    - Total spending > ₹10,000
    - Orders > 20
    - Loyalty tier: GOLD or PLATINUM
11. **Verify:** 45 customers match
12. Create targeted campaign:
    - Name: "VIP Exclusive Offer"
    - Target: VIP segment
    - Offer: 20% off
    - Valid: Weekend only
13. Schedule campaign: Friday 6 PM
14. **Verify:** Campaign scheduled
15. Campaign sent
16. Track performance:
    - Delivered: 45
    - Opened: 30 (67%)
    - Clicked: 15 (33%)
    - Orders: 8 (18%)
17. Calculate ROI:
    - Campaign cost: ₹500
    - Revenue: ₹6,400
    - ROI: 1180%

**Expected Results:**
- Segmentation working
- Tagging functional
- Campaign targeting accurate
- Performance tracking working

**API Endpoints:**
- `GET /api/customers/high-value`
- `GET /api/customers/top-spenders`
- `POST /api/customers/{id}/tags`
- `GET /api/customers/tags`
- `GET /api/customers/stats`

---

### 5.10 Review & Rating System

#### **Scenario 29: Order Review Submission**
**Objective:** Test complete review workflow

**Preconditions:** Customer received delivered order

**Test Steps:**
1. Customer opens app
2. Navigate to Order History
3. View delivered order
4. Click "Write Review"
5. Rate overall experience: 5 stars
6. Rate specific aspects:
   - Food quality: 5 stars
   - Delivery time: 4 stars
   - Packaging: 5 stars
7. Rate driver: 5 stars
8. Rate individual items:
   - Chicken Biryani: 5 stars (review: "Perfectly spiced!")
   - Raita: 4 stars (review: "A bit too watery")
9. Add photos (optional)
10. Submit review
11. **Verify:** Review created with status PENDING
12. **Verify:** Moderation queue entry created
13. Manager receives notification
14. Manager opens Review Management
15. View pending reviews
16. Review content appropriate
17. Manager approves review
18. **Verify:** Review status: APPROVED
19. **Verify:** Review visible on menu items
20. **Verify:** Driver rating updated: 4.8 → 4.85
21. **Verify:** Item ratings updated:
    - Chicken Biryani: 4.7 → 4.75
    - Raita: 4.2 → 4.15
22. Review appears on public menu
23. Other customers see review
24. Customer receives notification: "Thanks for your review!"

**Expected Results:**
- Review submission working
- Moderation queue functional
- Ratings updated correctly
- Public display working

**API Endpoints:**
- `POST /api/reviews`
- `GET /api/reviews/pending`
- `POST /api/reviews/{reviewId}/approve`
- `GET /api/reviews/item/{menuItemId}`
- `GET /api/reviews/stats/driver/{driverId}`

---

#### **Scenario 30: Review Moderation**
**Objective:** Test review moderation workflow

**Preconditions:** Reviews in moderation queue

**Test Steps:**
1. Manager opens Review Management
2. View pending reviews: 15
3. Sort by date (newest first)
4. Review 1: 5 stars, positive feedback
5. Approve review
6. **Verify:** Status: APPROVED
7. Review 2: 1 star, contains profanity
8. Flag review
9. Add note: "Inappropriate language"
10. Reject review
11. **Verify:** Status: REJECTED
12. **Verify:** Customer notified with reason
13. Review 3: 2 stars, legitimate complaint
14. Approve review
15. Manager writes response:
    - "We apologize for the inconvenience..."
    - "We've addressed the issue with our team..."
    - "Please give us another chance..."
16. Submit response
17. **Verify:** Response published
18. **Verify:** Customer notified of response
19. View flagged reviews
20. **Verify:** Flagged review in list
21. Generate moderation report:
    - Total reviews: 100
    - Approved: 90 (90%)
    - Rejected: 8 (8%)
    - Pending: 2 (2%)

**Expected Results:**
- Moderation workflow smooth
- Flagging system working
- Manager responses functional
- Reports accurate

**API Endpoints:**
- `GET /api/reviews/pending`
- `POST /api/reviews/{reviewId}/approve`
- `POST /api/reviews/{reviewId}/reject`
- `PATCH /api/reviews/{reviewId}/flag`
- `GET /api/reviews/flagged`

---

#### **Scenario 31: Manager Response to Review**
**Objective:** Test manager response feature

**Preconditions:** Customer review published

**Test Steps:**
1. Customer leaves 3-star review:
   - "Food was good but delivery took 45 minutes"
2. **Verify:** Review status: APPROVED
3. Manager receives notification:
   - "New 3-star review needs response"
4. Manager opens review
5. View review details:
   - Rating: 3 stars
   - Comment: Delivery delay complaint
   - Order number: ORD-20251125-042
6. Manager investigates order
7. **Verify:** Delivery time: 45 minutes (target: 30)
8. Manager writes response:
   - "Dear John, thank you for your feedback."
   - "We apologize for the delay in delivery."
   - "We've addressed this with our team."
   - "As a token of apology, we've added 100 loyalty points."
   - "Hope to serve you better next time!"
9. Submit response
10. **Verify:** Response published under review
11. **Verify:** Customer notified via email
12. **Verify:** 100 loyalty points added
13. Customer views response
14. Customer appreciates response
15. Customer places another order
16. Review marked as "Responded"
17. Generate response report:
    - Reviews needing response: 5
    - Responded: 20
    - Response rate: 80%
    - Response time: Avg 2 hours

**Expected Results:**
- Manager response workflow working
- Notifications sent
- Loyalty compensation tracked
- Customer satisfaction improved

**API Endpoints:**
- `GET /api/reviews/needs-response`
- Response endpoints (ResponseController)
- `POST /api/customers/{id}/loyalty/points`

---

### 5.11 Notification System

#### **Scenario 32: Multi-channel Notifications**
**Objective:** Test notification delivery across channels

**Preconditions:** Customer with notification preferences set

**Test Steps:**
1. Customer places order
2. System triggers notifications:
   - **IN_APP:** "Order placed successfully"
   - **EMAIL:** Order receipt with details
   - **SMS:** "Order #ORD-123 confirmed. Track: [link]"
   - **PUSH:** "Your order is being prepared"
3. **Verify:** Notifications created in database
4. **Verify:** Email sent (check email logs)
5. **Verify:** SMS sent (check SMS gateway)
6. **Verify:** Push notification queued
7. Customer opens app
8. **Verify:** Notification badge: 1
9. **Verify:** Notification list shows:
   - "Order placed" (unread)
10. Order moved to PREPARING
11. **Verify:** IN_APP notification: "Order is being prepared"
12. **Verify:** Push: "Your pizza is in the oven!"
13. Order ready
14. **Verify:** SMS: "Order ready for pickup"
15. Customer views notifications
16. **Verify:** Unread count: 3
17. Customer clicks notification
18. **Verify:** Redirected to order tracking
19. **Verify:** Notification marked as read
20. **Verify:** Unread count: 2
21. Customer clicks "Mark all as read"
22. **Verify:** Unread count: 0
23. Customer updates preferences:
    - Disable SMS
    - Keep Email and Push
24. **Verify:** Preferences saved
25. Next order placed
26. **Verify:** No SMS sent
27. **Verify:** Email and Push still sent

**Expected Results:**
- Multi-channel delivery working
- Notifications triggered correctly
- Read/unread tracking functional
- Preferences respected

**API Endpoints:**
- `POST /api/notifications/send`
- `GET /api/notifications/user/{userId}`
- `GET /api/notifications/user/{userId}/unread`
- `PATCH /api/notifications/{id}/read`
- `PATCH /api/notifications/user/{userId}/read-all`

---

#### **Scenario 33: Marketing Campaign**
**Objective:** Test campaign creation and delivery

**Preconditions:** Manager with customer segments

**Test Steps:**
1. Manager opens Campaign Management
2. Click "Create Campaign"
3. Fill campaign details:
   - Name: "Weekend Special"
   - Description: "20% off on all pizzas"
   - Target: Active customers (last 30 days)
   - Channels: EMAIL, PUSH
   - Schedule: Friday 6:00 PM
4. Design campaign content:
   - Subject: "Weekend Special: 20% Off Pizzas!"
   - Body: HTML email template
   - Push message: "🍕 20% off all pizzas this weekend!"
   - Call-to-action: "Order Now"
5. Preview campaign
6. **Verify:** Preview renders correctly
7. Select target segment:
   - Active customers: 450
   - Marketing opt-in: 400
8. **Verify:** Final target: 400 customers
9. Schedule campaign
10. **Verify:** Campaign status: SCHEDULED
11. Friday 6:00 PM arrives
12. **Verify:** Campaign status: SENDING
13. System sends notifications:
    - Email: 400
    - Push: 400
14. **Verify:** Campaign status: SENT
15. Track campaign metrics (real-time):
    - Delivered: 395 (98.75%)
    - Bounced: 5 (1.25%)
    - Opened: 180 (45%)
    - Clicked: 48 (12%)
    - Orders: 32 (8%)
16. Calculate campaign ROI:
    - Cost: ₹1,000
    - Revenue: ₹12,800
    - Discount given: ₹2,560
    - Net revenue: ₹10,240
    - ROI: 924%
17. Generate campaign report
18. **Verify:** Report includes:
    - Delivery metrics
    - Engagement metrics
    - Revenue generated
    - ROI calculation
19. Export report (PDF)

**Expected Results:**
- Campaign creation successful
- Scheduling working
- Delivery accurate
- Metrics tracking functional
- ROI calculation correct

**API Endpoints:**
- Campaign endpoints (CampaignController)
- `POST /api/notifications/send` (bulk)

---

## 6. Integration Testing

### 6.1 WebSocket Real-time Updates

#### **Scenario 34: Real-time Order Updates**
**Objective:** Test WebSocket communication

**Test Steps:**
1. Customer opens tracking page
2. WebSocket connection established
3. Subscribe to: `/queue/customer/{customerId}/orders`
4. Kitchen moves order to PREPARING
5. **Verify:** WebSocket message received (< 1 second)
6. **Verify:** Customer app updates status
7. Kitchen moves order to COOKING
8. **Verify:** WebSocket update received
9. **Verify:** UI updates without refresh
10. Order completed
11. **Verify:** Final update received
12. Close app
13. **Verify:** WebSocket disconnected

**Expected Results:**
- WebSocket connection stable
- Updates received instantly
- UI reflects changes
- Connection management working

---

### 6.2 Redis Caching

#### **Scenario 35: Cache Performance**
**Objective:** Test Redis caching effectiveness

**Test Steps:**
1. Clear Redis cache
2. Request menu items
3. **Verify:** Database query executed
4. **Verify:** Response time: ~200ms
5. **Verify:** Data cached in Redis (TTL: 10 min)
6. Request menu items again
7. **Verify:** Cache hit
8. **Verify:** Response time: <50ms
9. **Verify:** No database query
10. Manager updates menu item
11. **Verify:** Cache invalidated
12. Next request hits database
13. **Verify:** Fresh data returned

**Expected Results:**
- Caching working
- Performance improved
- Cache invalidation working

---

### 6.3 Razorpay Integration

#### **Scenario 36: Webhook Handling**
**Objective:** Test Razorpay webhook processing

**Test Steps:**
1. Customer completes payment
2. Razorpay sends webhook (async)
3. **Verify:** Webhook received
4. **Verify:** Signature verified
5. **Verify:** Payment status updated
6. **Verify:** Order updated
7. **Verify:** Event logged
8. Duplicate webhook sent (retry)
9. **Verify:** Idempotency check passes
10. **Verify:** No duplicate processing

**Expected Results:**
- Webhook processing working
- Signature verification functional
- Idempotency handled

---

## 7. Performance Benchmarks

### Performance Targets

| Metric | Target | Actual |
|--------|--------|--------|
| API response time (95th percentile) | <200ms | TBD |
| WebSocket latency | <1 second | TBD |
| Redis cache hit rate | >80% | TBD |
| Database query time | <100ms | TBD |
| Page load time | <2 seconds | TBD |
| Concurrent users | 500+ | TBD |
| Orders per hour | 200+ | TBD |

### Load Testing Scenarios

1. **Peak Hour Simulation:**
   - 50 concurrent orders in 5 minutes
   - Verify system stability
   - Monitor response times

2. **Kitchen Display Load:**
   - 30 active orders in queue
   - 5-second polling
   - Verify no lag

3. **Payment Gateway:**
   - 100 concurrent payments
   - Verify all processed
   - No transaction failures

---

## 8. Security Testing

### 8.1 Authentication & Authorization

#### **Scenario 37: JWT Token Security**
**Test Steps:**
1. User logs in
2. Verify JWT token received
3. Token expires after 24 hours
4. API call with expired token
5. **Verify:** 401 Unauthorized
6. Refresh token called
7. New access token issued
8. Original API call succeeds

**Expected Results:**
- Token expiry working
- Refresh mechanism functional

---

#### **Scenario 38: Role-based Access**
**Test Steps:**
1. Customer attempts manager endpoint
2. **Verify:** 403 Forbidden
3. Manager accesses manager endpoint
4. **Verify:** Success

**Expected Results:**
- RBAC working correctly

---

### 8.2 Input Validation

#### **Scenario 39: SQL Injection Prevention**
**Test Steps:**
1. Input: `'; DROP TABLE orders; --`
2. Submit to search
3. **Verify:** Input sanitized
4. **Verify:** No SQL executed
5. **Verify:** Safe error returned

**Expected Results:**
- SQL injection prevented

---

#### **Scenario 40: XSS Prevention**
**Test Steps:**
1. Input: `<script>alert('XSS')</script>`
2. Submit as review comment
3. **Verify:** Input sanitized (DOMPurify)
4. Display review
5. **Verify:** Script not executed
6. **Verify:** Text displayed as plain text

**Expected Results:**
- XSS prevented

---

### 8.3 Rate Limiting

#### **Scenario 41: API Rate Limiting**
**Test Steps:**
1. Make 100 API calls in 1 minute
2. **Verify:** All succeed
3. Make 101st call
4. **Verify:** 429 Too Many Requests
5. **Verify:** Headers:
   - X-RateLimit-Limit: 100
   - X-RateLimit-Remaining: 0
   - X-RateLimit-Reset: [timestamp]
6. Wait for reset
7. **Verify:** Can make requests again

**Expected Results:**
- Rate limiting working
- Headers correct

---

## 9. Testing Checklist

For each scenario, verify:

### Functional Testing
- [ ] API endpoint responds correctly
- [ ] Response status code correct
- [ ] Response data matches schema
- [ ] Database updated correctly
- [ ] Business logic executed properly

### Integration Testing
- [ ] WebSocket updates sent
- [ ] Cache updated/invalidated
- [ ] External APIs called (Razorpay, Maps)
- [ ] Email/SMS sent
- [ ] Notifications triggered

### UI Testing
- [ ] Frontend displays correctly
- [ ] Real-time updates working
- [ ] Forms validate properly
- [ ] Error messages shown
- [ ] Navigation working

### Security Testing
- [ ] Authentication enforced
- [ ] Authorization checked
- [ ] Input sanitized
- [ ] SQL injection prevented
- [ ] XSS prevented
- [ ] CSRF protection enabled

### Performance Testing
- [ ] Response time acceptable
- [ ] Cache hit rate good
- [ ] Database queries optimized
- [ ] No memory leaks
- [ ] Concurrent users handled

### GDPR Compliance
- [ ] Audit log created
- [ ] Consent recorded
- [ ] Data subject rights respected
- [ ] Privacy by design
- [ ] Data minimization

---

## Summary

This comprehensive E2E testing document covers:

- **11 Backend Microservices** with 200+ API endpoints
- **6 Frontend Applications** with 50+ pages
- **41 Complete E2E Scenarios** covering all major workflows
- **Real-world Testing** with actual data flows
- **Security Testing** including GDPR compliance
- **Performance Benchmarks** with clear targets
- **Integration Testing** for third-party services

**System Status:**
- Phases 1-14 Complete (78% Backend, 65% Frontend)
- Production-ready core features
- Comprehensive testing coverage

**Next Steps:**
1. Execute all E2E scenarios
2. Document test results
3. Fix identified issues
4. Perform load testing
5. Security audit
6. Production deployment

---

**Document Prepared By:** MaSoVa Development Team
**Review Status:** Ready for Testing
**Last Updated:** November 25, 2025
