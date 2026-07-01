# Test Cases: Phases 1-3

**Document:** 02-phases-1-3-tests.md
**Covers:** Foundation, User Management & Authentication, Menu & Catalog Management
**Test Priority:** CRITICAL (Foundation for all other features)

---

## 📋 Table of Contents

1. [Phase 1: Foundation & Core Infrastructure](#phase-1-foundation--core-infrastructure)
2. [Phase 2: User Management & Authentication](#phase-2-user-management--authentication)
3. [Phase 3: Menu & Catalog Management](#phase-3-menu--catalog-management)

---

## Phase 1: Foundation & Core Infrastructure

### 🎯 Test Scope
- API Gateway routing
- JWT authentication & authorization
- Rate limiting
- CORS configuration
- Logging framework
- Database connectivity

### 1.1 API Gateway Tests

#### TC-1.1.1: Gateway Health Check
**Priority:** CRITICAL
**Preconditions:** API Gateway running on port 8080

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | GET `http://localhost:8080/actuator/health` | 200 OK, `{"status":"UP"}` | ☐ |
| 2 | Verify response time | < 50ms | ☐ |
| 3 | Check response headers | Content-Type: application/json | ☐ |

**Acceptance Criteria:**
- ✅ Gateway responds within 50ms
- ✅ Returns proper health status
- ✅ No errors in gateway logs

---

#### TC-1.1.2: Service Routing - User Service
**Priority:** CRITICAL
**Preconditions:** User Service running, API Gateway configured

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | POST `/api/users/login` via Gateway (8080) | Request routed to User Service (8081) | ☐ |
| 2 | Check gateway logs | Shows routing to user-service | ☐ |
| 3 | Verify response received | Login response from User Service | ☐ |
| 4 | Test invalid route `/api/invalid` | 404 Not Found | ☐ |

**Acceptance Criteria:**
- ✅ Gateway correctly routes to User Service
- ✅ Invalid routes return 404
- ✅ No routing delays (< 10ms overhead)

---

#### TC-1.1.3: Service Routing - All Services
**Priority:** HIGH
**Preconditions:** All 8 services running

**Test all service routes:**

| Service | Route | Port | Expected | Status |
|---------|-------|------|----------|--------|
| User | `/api/users/*` | 8081 | Routes correctly | ☐ |
| Menu | `/api/menu/*` | 8082 | Routes correctly | ☐ |
| Order | `/api/orders/*` | 8083 | Routes correctly | ☐ |
| Payment | `/api/payments/*` | 8086 | Routes correctly | ☐ |
| Inventory | `/api/inventory/*` | 8088 | Routes correctly | ☐ |
| Delivery | `/api/delivery/*` | 8090 | Routes correctly | ☐ |
| Customer | `/api/customers/*` | 8091 | Routes correctly | ☐ |

**Test Method:**
```bash
# User Service
curl http://localhost:8080/api/users/profile -H "Authorization: Bearer <token>"

# Menu Service
curl http://localhost:8080/api/menu/items

# Order Service
curl http://localhost:8080/api/orders -H "Authorization: Bearer <token>"

# Repeat for all services...
```

**Acceptance Criteria:**
- ✅ All services accessible via Gateway
- ✅ No routing errors
- ✅ Consistent response times

---

### 1.2 JWT Authentication Tests

#### TC-1.2.1: JWT Token Generation
**Priority:** CRITICAL
**Preconditions:** User Service running, test user exists

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | POST login with valid credentials | 200 OK with accessToken & refreshToken | ☐ |
| 2 | Decode accessToken (jwt.io) | Contains userId, userType, storeId | ☐ |
| 3 | Check token expiration | Access: 1 hour, Refresh: 7 days | ☐ |
| 4 | Verify token signature | Valid RS256 signature | ☐ |

**Test Data:**
```json
{
  "email": "manager@test.com",
  "password": "Test@123"
}
```

**Acceptance Criteria:**
- ✅ Token generated successfully
- ✅ Token contains correct claims
- ✅ Token properly signed
- ✅ Expiration times correct

---

#### TC-1.2.2: JWT Token Validation
**Priority:** CRITICAL
**Preconditions:** Valid JWT token obtained

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Call protected endpoint with valid token | 200 OK | ☐ |
| 2 | Call protected endpoint without token | 401 Unauthorized | ☐ |
| 3 | Call protected endpoint with expired token | 401 Unauthorized | ☐ |
| 4 | Call protected endpoint with invalid signature | 401 Unauthorized | ☐ |
| 5 | Call protected endpoint with malformed token | 401 Unauthorized | ☐ |

**Test Endpoint:**
```bash
# Valid token
curl http://localhost:8080/api/users/profile \
  -H "Authorization: Bearer <valid-token>"

# No token
curl http://localhost:8080/api/users/profile

# Expired token
curl http://localhost:8080/api/users/profile \
  -H "Authorization: Bearer <expired-token>"
```

**Acceptance Criteria:**
- ✅ Valid tokens accepted
- ✅ Invalid tokens rejected with 401
- ✅ Proper error messages returned

---

#### TC-1.2.3: Token Refresh Flow
**Priority:** HIGH
**Preconditions:** Refresh token obtained from login

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | POST `/api/users/refresh` with refreshToken | 200 OK with new accessToken | ☐ |
| 2 | Use new accessToken | Works correctly | ☐ |
| 3 | Try to refresh with expired refreshToken | 401 Unauthorized | ☐ |
| 4 | Try to refresh with invalid token | 401 Unauthorized | ☐ |

**Acceptance Criteria:**
- ✅ Refresh generates new access token
- ✅ Old access token can be used until expiry
- ✅ Expired refresh tokens rejected

---

### 1.3 Rate Limiting Tests

#### TC-1.3.1: Rate Limit Enforcement
**Priority:** HIGH
**Preconditions:** API Gateway configured with 100 req/min limit

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Send 50 requests in 30 seconds | All succeed (200 OK) | ☐ |
| 2 | Send 100 requests in 30 seconds | All succeed (200 OK) | ☐ |
| 3 | Send 150 requests in 30 seconds | First 100 succeed, rest get 429 | ☐ |
| 4 | Wait 1 minute, send request | Succeeds (200 OK) | ☐ |

**Test Script:**
```bash
# Send 150 requests rapidly
for i in {1..150}; do
  status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/menu/items)
  echo "Request $i: $status"
done
```

**Acceptance Criteria:**
- ✅ Rate limit enforced at 100 req/min
- ✅ 429 Too Many Requests returned when exceeded
- ✅ Rate limit resets after 1 minute

---

### 1.4 CORS Configuration Tests

#### TC-1.4.1: CORS for Frontend
**Priority:** HIGH
**Preconditions:** Frontend running on localhost:5173

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Make API call from frontend | Request succeeds | ☐ |
| 2 | Check response headers | Contains CORS headers | ☐ |
| 3 | Verify Access-Control-Allow-Origin | Contains frontend URL | ☐ |
| 4 | Test preflight OPTIONS request | Returns 200 OK with CORS headers | ☐ |

**Browser Console Test:**
```javascript
fetch('http://localhost:8080/api/menu/items')
  .then(res => res.json())
  .then(data => console.log('CORS Success:', data))
  .catch(err => console.error('CORS Failed:', err));
```

**Acceptance Criteria:**
- ✅ Frontend can make API calls
- ✅ CORS headers present
- ✅ Preflight requests handled

---

### 1.5 Database Connectivity Tests

#### TC-1.5.1: MongoDB Connection
**Priority:** CRITICAL
**Preconditions:** MongoDB running on port 27017

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Start service with MongoDB connection | Service starts successfully | ☐ |
| 2 | Check service logs | "Connected to MongoDB" message | ☐ |
| 3 | Perform database operation (create user) | Operation succeeds | ☐ |
| 4 | Verify data in MongoDB | Data persisted correctly | ☐ |
| 5 | Stop MongoDB, restart service | Service fails to start with error | ☐ |

**MongoDB Verification:**
```bash
mongosh mongodb://localhost:27017
use masova_users
db.users.find().limit(5)
```

**Acceptance Criteria:**
- ✅ All services connect to MongoDB
- ✅ CRUD operations work
- ✅ Proper error handling when MongoDB unavailable

---

#### TC-1.5.2: Redis Connection & Caching
**Priority:** HIGH
**Preconditions:** Redis running on port 6379

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Start Menu Service (uses Redis caching) | Service starts successfully | ☐ |
| 2 | Fetch menu items first time | Data fetched from MongoDB | ☐ |
| 3 | Fetch same menu items again | Data served from Redis cache | ☐ |
| 4 | Check Redis for cached data | Cache key exists | ☐ |
| 5 | Wait 10 minutes (TTL), fetch again | Cache expired, fetched from DB | ☐ |

**Redis Verification:**
```bash
redis-cli
keys *menu*
ttl menu:items:all
get menu:items:all
```

**Acceptance Criteria:**
- ✅ Services connect to Redis
- ✅ Caching works correctly
- ✅ TTL respected (10 minutes)
- ✅ Cache invalidation works

---

### 1.6 Logging Framework Tests

#### TC-1.6.1: Log Levels
**Priority:** MEDIUM
**Preconditions:** Service running with configured logging

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Trigger INFO level log | Log appears in console/file | ☐ |
| 2 | Trigger WARN level log | Warning logged | ☐ |
| 3 | Trigger ERROR level log | Error logged with stack trace | ☐ |
| 4 | Verify no System.out.println | All logging uses SLF4J | ☐ |

**Check Logs:**
- INFO: Normal operations
- WARN: Validation failures, retries
- ERROR: Exceptions, critical failures

**Acceptance Criteria:**
- ✅ All log levels working
- ✅ Proper log format
- ✅ No System.out.println in code

---

## Phase 2: User Management & Authentication

### 🎯 Test Scope
- User registration & login
- Multi-role system (5 roles)
- Working session management
- Store & shift management
- JWT authentication flow

### 2.1 User Registration Tests

#### TC-2.1.1: Register New User - Customer
**Priority:** CRITICAL
**Preconditions:** User Service running

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | POST `/api/users/register` with valid customer data | 201 Created, user object returned | ☐ |
| 2 | Check password is hashed | Password not stored in plain text | ☐ |
| 3 | Verify user in database | User exists with correct data | ☐ |
| 4 | Try to register with same email | 400 Bad Request, "Email already exists" | ☐ |
| 5 | Try to register with same phone | 400 Bad Request, "Phone already exists" | ☐ |

**Test Data:**
```json
{
  "name": "John Doe",
  "email": "john.doe@test.com",
  "password": "Test@123",
  "phone": "+919876543210",
  "type": "CUSTOMER"
}
```

**Acceptance Criteria:**
- ✅ Customer registered successfully
- ✅ Password hashed (BCrypt)
- ✅ Duplicate email/phone prevented
- ✅ Validation errors clear

---

#### TC-2.1.2: Register Employee (Manager)
**Priority:** CRITICAL
**Preconditions:** User Service running, test store exists

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | POST `/api/users/register` with MANAGER type | 201 Created | ☐ |
| 2 | Include storeId in request | Employee details created | ☐ |
| 3 | Verify employeeDetails in response | Contains storeId, role, permissions | ☐ |
| 4 | Try to create employee without storeId | 400 Bad Request | ☐ |

**Test Data:**
```json
{
  "name": "Manager Mike",
  "email": "manager@test.com",
  "password": "Test@123",
  "phone": "+919876543211",
  "type": "MANAGER",
  "storeId": "store-001",
  "role": "Store Manager"
}
```

**Acceptance Criteria:**
- ✅ Manager registered successfully
- ✅ Employee details populated
- ✅ Store assignment working

---

#### TC-2.1.3: Input Validation
**Priority:** HIGH
**Preconditions:** User Service running

**Test invalid inputs:**

| Invalid Input | Expected Error | Status |
|---------------|----------------|--------|
| Invalid email format | "Invalid email format" | ☐ |
| Weak password (< 8 chars) | "Password must be at least 8 characters" | ☐ |
| Invalid phone format | "Invalid phone number" | ☐ |
| Missing required field (name) | "Name is required" | ☐ |
| Invalid user type | "Invalid user type" | ☐ |

**Acceptance Criteria:**
- ✅ All validations working
- ✅ Clear error messages
- ✅ 400 Bad Request returned

---

### 2.2 User Login Tests

#### TC-2.2.1: Login with Valid Credentials
**Priority:** CRITICAL
**Preconditions:** User registered

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | POST `/api/users/login` with correct email/password | 200 OK | ☐ |
| 2 | Verify accessToken in response | Valid JWT token | ☐ |
| 3 | Verify refreshToken in response | Valid refresh token | ☐ |
| 4 | Verify user object returned | Contains user details (no password) | ☐ |
| 5 | Check lastLogin updated | Timestamp updated in database | ☐ |

**Test Data:**
```json
{
  "email": "manager@test.com",
  "password": "Test@123"
}
```

**Response Structure:**
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": "user-123",
    "name": "Manager Mike",
    "email": "manager@test.com",
    "type": "MANAGER",
    "storeId": "store-001"
  }
}
```

**Acceptance Criteria:**
- ✅ Login successful with valid credentials
- ✅ Tokens generated
- ✅ User data returned (without password)
- ✅ lastLogin timestamp updated

---

#### TC-2.2.2: Login with Invalid Credentials
**Priority:** HIGH
**Preconditions:** User exists

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Login with wrong password | 401 Unauthorized, "Invalid credentials" | ☐ |
| 2 | Login with non-existent email | 401 Unauthorized, "Invalid credentials" | ☐ |
| 3 | Login with empty password | 400 Bad Request | ☐ |
| 4 | Login with deactivated user | 401 Unauthorized, "Account deactivated" | ☐ |

**Acceptance Criteria:**
- ✅ Invalid credentials rejected
- ✅ Appropriate error messages
- ✅ Deactivated users cannot login

---

#### TC-2.2.3: Working Session Start on Login
**Priority:** HIGH
**Preconditions:** Employee user (MANAGER/STAFF/DRIVER)

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Employee logs in | Working session automatically started | ☐ |
| 2 | Check sessions collection | New session with status STARTED | ☐ |
| 3 | Verify session includes GPS coordinates | Location data present | ☐ |
| 4 | Customer logs in | No session created | ☐ |

**Acceptance Criteria:**
- ✅ Session started for employees on login
- ✅ No session for customers
- ✅ GPS coordinates captured

---

### 2.3 Working Session Management Tests

#### TC-2.3.1: Session Start
**Priority:** HIGH
**Preconditions:** Employee logged in

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | POST `/api/users/sessions/start` with GPS | 201 Created, session object | ☐ |
| 2 | Verify session status | STARTED | ☐ |
| 3 | Check startTime | Current timestamp | ☐ |
| 4 | Try to start session again (already active) | 400 Bad Request, "Session already active" | ☐ |

**Test Data:**
```json
{
  "userId": "user-123",
  "storeId": "store-001",
  "startLocation": {
    "latitude": 12.9716,
    "longitude": 77.5946
  }
}
```

**Acceptance Criteria:**
- ✅ Session started successfully
- ✅ GPS coordinates saved
- ✅ Cannot start duplicate session

---

#### TC-2.3.2: Session End
**Priority:** HIGH
**Preconditions:** Active session exists

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | POST `/api/users/sessions/end` with GPS | 200 OK, session updated | ☐ |
| 2 | Verify session status | ENDED | ☐ |
| 3 | Check endTime | Current timestamp | ☐ |
| 4 | Verify totalDuration calculated | Duration in minutes | ☐ |
| 5 | Try to end session again | 400 Bad Request, "No active session" | ☐ |

**Acceptance Criteria:**
- ✅ Session ended successfully
- ✅ End location saved
- ✅ Duration calculated correctly
- ✅ Cannot end non-active session

---

#### TC-2.3.3: Session Approval Workflow
**Priority:** MEDIUM
**Preconditions:** Session ended, manager logged in

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | GET `/api/users/sessions/store/{storeId}/active` | Returns list of pending sessions | ☐ |
| 2 | Manager approves session | Session status: APPROVED | ☐ |
| 3 | Check approvedBy field | Manager's userId | ☐ |
| 4 | Try to approve already approved session | 400 Bad Request | ☐ |
| 5 | Manager rejects session with reason | Session status: REJECTED, reason saved | ☐ |

**Acceptance Criteria:**
- ✅ Manager can view pending sessions
- ✅ Approval/rejection works
- ✅ Approver tracked
- ✅ Rejection reason required

---

### 2.4 Store Management Tests

#### TC-2.4.1: Create Store
**Priority:** HIGH
**Preconditions:** Manager logged in

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | POST `/api/users/stores` with store data | 201 Created, store object | ☐ |
| 2 | Verify store in database | Store exists | ☐ |
| 3 | Check store status | ACTIVE by default | ☐ |
| 4 | Try to create store with duplicate name | 400 Bad Request | ☐ |

**Test Data:**
```json
{
  "name": "MaSoVa Bangalore Central",
  "address": "123 MG Road, Bangalore",
  "phone": "+918012345678",
  "email": "bangalore@masova.com"
}
```

**Acceptance Criteria:**
- ✅ Store created successfully
- ✅ Duplicate names prevented
- ✅ All fields validated

---

#### TC-2.4.2: Update Store
**Priority:** MEDIUM
**Preconditions:** Store exists

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | PUT `/api/users/stores/{id}` with updated data | 200 OK, updated store | ☐ |
| 2 | Verify changes in database | Store updated | ☐ |
| 3 | Try to update non-existent store | 404 Not Found | ☐ |

**Acceptance Criteria:**
- ✅ Store updated successfully
- ✅ Validation maintained
- ✅ Non-existent stores handled

---

### 2.5 Role-Based Access Control Tests

#### TC-2.5.1: Manager Access
**Priority:** CRITICAL
**Preconditions:** Manager logged in

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Access manager dashboard | 200 OK, dashboard loads | ☐ |
| 2 | View staff sessions | Can view all sessions | ☐ |
| 3 | Approve/reject sessions | Operations succeed | ☐ |
| 4 | View store analytics | Data displayed | ☐ |
| 5 | Try to access admin-only endpoint | 403 Forbidden (if exists) | ☐ |

**Acceptance Criteria:**
- ✅ Manager has full store access
- ✅ Can manage employees
- ✅ Can view analytics
- ✅ Proper authorization enforced

---

#### TC-2.5.2: Customer Access Restrictions
**Priority:** HIGH
**Preconditions:** Customer logged in

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Try to access manager dashboard | 403 Forbidden | ☐ |
| 2 | Try to view staff sessions | 403 Forbidden | ☐ |
| 3 | Access customer profile | 200 OK | ☐ |
| 4 | Place order | 200 OK | ☐ |
| 5 | View own orders | 200 OK | ☐ |

**Acceptance Criteria:**
- ✅ Customer cannot access manager features
- ✅ Can access own profile/orders
- ✅ Proper 403 responses

---

## Phase 3: Menu & Catalog Management

### 🎯 Test Scope
- Menu CRUD operations
- Category/cuisine filtering
- Pricing system
- Redis caching
- Public vs protected endpoints

### 3.1 Menu Item CRUD Tests

#### TC-3.1.1: Create Menu Item
**Priority:** HIGH
**Preconditions:** Manager logged in, Menu Service running

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | POST `/api/menu/items` with valid item data | 201 Created, item object | ☐ |
| 2 | Verify item in database | Item exists | ☐ |
| 3 | Check cache invalidation | Cache cleared for menu items | ☐ |
| 4 | Try to create without authentication | 401 Unauthorized | ☐ |
| 5 | Try to create with invalid data | 400 Bad Request | ☐ |

**Test Data:**
```json
{
  "name": "Margherita Pizza",
  "description": "Classic cheese pizza with tomato sauce",
  "category": "PIZZA",
  "cuisine": "ITALIAN",
  "price": 299.00,
  "isVegetarian": true,
  "isAvailable": true,
  "preparationTime": 20,
  "spiceLevel": "MILD",
  "imageUrl": "https://example.com/margherita.jpg"
}
```

**Acceptance Criteria:**
- ✅ Menu item created successfully
- ✅ Price in INR format
- ✅ Cache invalidated
- ✅ Validation working

---

#### TC-3.1.2: Get All Menu Items (Public)
**Priority:** CRITICAL
**Preconditions:** Menu items exist

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | GET `/api/menu/items` without auth | 200 OK, array of items | ☐ |
| 2 | Verify response time first call | < 300ms (from DB) | ☐ |
| 3 | Call again immediately | < 50ms (from Redis cache) | ☐ |
| 4 | Check cache TTL | 10 minutes | ☐ |
| 5 | Verify all items returned | Count matches database | ☐ |

**Expected Response:**
```json
[
  {
    "id": "item-001",
    "name": "Margherita Pizza",
    "price": 299.00,
    "category": "PIZZA",
    "isAvailable": true
    // ... other fields
  }
  // ... more items
]
```

**Acceptance Criteria:**
- ✅ Public access (no auth required)
- ✅ All menu items returned
- ✅ Redis caching working
- ✅ Performance acceptable

---

#### TC-3.1.3: Update Menu Item
**Priority:** HIGH
**Preconditions:** Manager logged in, menu item exists

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | PUT `/api/menu/items/{id}` with updated data | 200 OK, updated item | ☐ |
| 2 | Verify changes in database | Item updated | ☐ |
| 3 | Check cache invalidation | Old cache cleared | ☐ |
| 4 | Try to update non-existent item | 404 Not Found | ☐ |
| 5 | Try to update without auth | 401 Unauthorized | ☐ |

**Acceptance Criteria:**
- ✅ Item updated successfully
- ✅ Cache refreshed
- ✅ Authorization enforced

---

#### TC-3.1.4: Delete Menu Item
**Priority:** MEDIUM
**Preconditions:** Manager logged in, menu item exists

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | DELETE `/api/menu/items/{id}` | 204 No Content | ☐ |
| 2 | Verify item removed from database | Item not found | ☐ |
| 3 | Try to get deleted item | 404 Not Found | ☐ |
| 4 | Check cache invalidation | Cache cleared | ☐ |

**Acceptance Criteria:**
- ✅ Item deleted successfully
- ✅ Soft delete (if implemented)
- ✅ Cache updated

---

### 3.2 Menu Filtering & Search Tests

#### TC-3.2.1: Filter by Category
**Priority:** HIGH
**Preconditions:** Menu items with various categories exist

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | GET `/api/menu/items/category/PIZZA` | Returns only pizza items | ☐ |
| 2 | GET `/api/menu/items/category/DESSERTS` | Returns only dessert items | ☐ |
| 3 | Try invalid category | 400 Bad Request | ☐ |
| 4 | Check response time | < 100ms (cached) | ☐ |

**Test Categories:**
- PIZZA, BIRYANI, DESSERTS, BEVERAGES, STARTERS, MAIN_COURSE, BREADS

**Acceptance Criteria:**
- ✅ Filtering works correctly
- ✅ Only matching items returned
- ✅ Invalid categories handled

---

#### TC-3.2.2: Search Menu Items
**Priority:** HIGH
**Preconditions:** Menu items exist

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | GET `/api/menu/items?search=pizza` | Returns items with "pizza" in name/description | ☐ |
| 2 | Search with partial match | Partial matches returned | ☐ |
| 3 | Case-insensitive search | Case doesn't matter | ☐ |
| 4 | Search with no results | Empty array returned | ☐ |

**Acceptance Criteria:**
- ✅ Search working correctly
- ✅ Case-insensitive
- ✅ Partial matches supported

---

### 3.3 Availability Management Tests

#### TC-3.3.1: Toggle Item Availability
**Priority:** HIGH
**Preconditions:** Manager logged in, menu item exists

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | PATCH `/api/menu/items/{id}/availability` | Availability toggled | ☐ |
| 2 | Verify item marked unavailable | isAvailable: false | ☐ |
| 3 | Try to order unavailable item | Should be prevented in Order Service | ☐ |
| 4 | Toggle back to available | isAvailable: true | ☐ |

**Acceptance Criteria:**
- ✅ Availability toggle works
- ✅ Cache updated
- ✅ Order validation respects availability

---

### 3.4 Redis Caching Tests

#### TC-3.4.1: Cache Population
**Priority:** MEDIUM
**Preconditions:** Redis running, Menu Service started

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | First request for menu items | Data fetched from MongoDB | ☐ |
| 2 | Check Redis for cached data | Cache key exists | ☐ |
| 3 | Second request | Data served from Redis | ☐ |
| 4 | Compare response times | Redis << MongoDB | ☐ |

**Redis Commands:**
```bash
redis-cli
keys *menu*
get menu:items:all
ttl menu:items:all
```

**Acceptance Criteria:**
- ✅ First request caches data
- ✅ Subsequent requests use cache
- ✅ Significant performance improvement

---

#### TC-3.4.2: Cache Expiration
**Priority:** MEDIUM
**Preconditions:** Data cached in Redis

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Wait for 10 minutes (TTL) | Cache expires | ☐ |
| 2 | Make request after expiration | Data re-fetched from MongoDB | ☐ |
| 3 | Check cache repopulated | New cache entry created | ☐ |

**Acceptance Criteria:**
- ✅ Cache expires after TTL
- ✅ Data re-cached automatically
- ✅ No stale data served

---

#### TC-3.4.3: Cache Invalidation
**Priority:** HIGH
**Preconditions:** Data cached, manager logged in

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Update menu item | Cache invalidated immediately | ☐ |
| 2 | Check Redis | Old cache key removed | ☐ |
| 3 | Make GET request | Fresh data from MongoDB | ☐ |
| 4 | Delete menu item | Cache invalidated | ☐ |

**Acceptance Criteria:**
- ✅ Cache invalidated on updates
- ✅ Fresh data served after invalidation
- ✅ No stale data issues

---

### 3.5 Frontend Menu Integration Tests

#### TC-3.5.1: Public Menu Page (No Auth)
**Priority:** HIGH
**Preconditions:** Frontend running, menu items exist

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Navigate to `/menu` as guest | Menu page loads | ☐ |
| 2 | Verify menu items displayed | All items visible | ☐ |
| 3 | Test category filters | Filtering works | ☐ |
| 4 | Click "Order Now" | Redirects to login | ☐ |
| 5 | Check page responsiveness | Works on mobile (360px) | ☐ |

**Acceptance Criteria:**
- ✅ Public menu accessible
- ✅ No auth required
- ✅ Filters working
- ✅ Responsive design
- ✅ Neumorphic design applied

---

#### TC-3.5.2: Customer Menu Page (Authenticated)
**Priority:** HIGH
**Preconditions:** Customer logged in

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Navigate to `/customer/menu` | Menu page loads | ☐ |
| 2 | Click "Add to Cart" | Item added to cart | ☐ |
| 3 | Check cart icon | Shows item count | ☐ |
| 4 | Add multiple items | All items in cart | ☐ |
| 5 | View cart | All items displayed correctly | ☐ |

**Acceptance Criteria:**
- ✅ Add to cart working
- ✅ Cart state persists
- ✅ Quantities editable
- ✅ Prices calculated correctly

---

## 📊 Test Summary Template

Use this template to track testing progress:

| Phase | Total Tests | Passed | Failed | Blocked | Pass Rate |
|-------|-------------|--------|--------|---------|-----------|
| Phase 1 | 15 | 0 | 0 | 0 | 0% |
| Phase 2 | 20 | 0 | 0 | 0 | 0% |
| Phase 3 | 18 | 0 | 0 | 0 | 0% |
| **Total** | **53** | **0** | **0** | **0** | **0%** |

---

## 🐛 Bug Report Template

**Bug ID:** BUG-XXX
**Phase:** 1/2/3
**Test Case:** TC-X.X.X
**Severity:** CRITICAL / HIGH / MEDIUM / LOW
**Environment:** Dev / Test / Staging

**Description:**
[Clear description of the issue]

**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Step 3

**Expected Result:**
[What should happen]

**Actual Result:**
[What actually happened]

**Screenshots/Logs:**
[Attach evidence]

**Assigned To:**
[Developer name]

---

## ✅ Phase 1-3 Completion Criteria

### Phase 1 Sign-Off
- [ ] All 15 tests passed
- [ ] No CRITICAL/HIGH bugs
- [ ] API Gateway routing verified
- [ ] JWT authentication working
- [ ] Rate limiting enforced
- [ ] Database connectivity confirmed

### Phase 2 Sign-Off
- [ ] All 20 tests passed
- [ ] User registration/login working
- [ ] All 5 roles functional
- [ ] Working sessions operational
- [ ] Store management complete
- [ ] RBAC enforced

### Phase 3 Sign-Off
- [ ] All 18 tests passed
- [ ] Menu CRUD operational
- [ ] 150+ items seeded
- [ ] Redis caching working
- [ ] Public menu accessible
- [ ] Customer cart functional

---

**Next Steps:** Proceed to `03-phases-4-5-tests.md` for Order & Payment testing.

---

*Phases 1-3 are the foundation. Ensure 100% pass rate before proceeding.*
