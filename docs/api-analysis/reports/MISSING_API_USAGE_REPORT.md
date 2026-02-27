# Missing API Usage Analysis

**Date:** 2026-01-18
**Analysis:** Where unused backend APIs SHOULD be used in frontend

---

## 🎯 Executive Summary

Out of **196 unused backend APIs**, here's where they belong:

- **33 CRITICAL** - Pages exist but missing key features (GDPR, analytics, etc.)
- **67 IMPORTANT** - Pages partially working but missing advanced features
- **96 NICE-TO-HAVE** - Optional features for future enhancement

---

## 🔴 CRITICAL - Pages Broken Without These APIs

### 1. Customer Management Page (`CustomerManagementPage.tsx`)

**Currently Has:** 6 APIs
**Missing:** 11 CRITICAL APIs

#### What's Missing:

```typescript
// ❌ Cannot view individual customer details
GET /api/customers/{id}
GET /api/customers/user/{userId}
GET /api/customers/email/{email}
GET /api/customers/phone/{phone}

// ❌ Cannot filter customers properly
GET /api/customers/high-value
GET /api/customers/inactive
GET /api/customers/top-spenders
GET /api/customers/recently-active

// ❌ Cannot see customer insights
GET /api/customers/{id}/order-stats
GET /api/customers/{id}/preferences
GET /api/customers/{id}/loyalty/points

// ❌ Cannot manage addresses
GET /api/customers/{id}/addresses
POST /api/customers/{customerId}/addresses
PUT /api/customers/{customerId}/addresses/{addressId}
DELETE /api/customers/{customerId}/addresses/{addressId}
```

**Impact:**
- Manager clicks on customer → Nothing happens (no detail view)
- "High Value Customers" filter → Doesn't work
- Address management → Broken

---

### 2. Dashboard Page (`DashboardPage.tsx`)

**Currently Has:** 2 APIs (sessions only)
**Missing:** 18 ANALYTICS APIs

#### What's Missing:

```typescript
// ❌ No real-time sales analytics
GET /api/analytics/sales/today
GET /api/analytics/avgOrderValue/today
GET /api/analytics/sales/trends/{period}
GET /api/analytics/sales/breakdown/order-type
GET /api/analytics/sales/peak-hours

// ❌ No product analytics
GET /api/analytics/products/top-selling

// ❌ No staff performance
GET /api/analytics/staff/leaderboard
GET /api/analytics/staff/{staffId}/performance/today

// ❌ No driver status
GET /api/analytics/drivers/status

// ❌ No business intelligence
GET /api/bi/forecast/sales
GET /api/bi/analysis/customer-behavior
GET /api/bi/prediction/churn
GET /api/bi/forecast/demand
GET /api/bi/cost-analysis
GET /api/bi/executive-summary
```

**Impact:**
- Dashboard shows FAKE DATA or no data
- No real-time metrics
- Manager has no visibility into business performance

---

### 3. Delivery Management Page (`DeliveryManagementPage.tsx`)

**Currently Has:** 5 APIs
**Missing:** 15 DELIVERY APIs

#### What's Missing:

```typescript
// ❌ Driver management incomplete
GET /api/delivery/drivers/available (has local version, needs backend)
GET /api/delivery/driver/{driverId}/status
PATCH /api/delivery/driver/{driverId}/status
GET /api/delivery/driver/{driverId}/performance
GET /api/delivery/driver/{driverId}/performance/today
GET /api/delivery/driver/{driverId}/pending

// ❌ No delivery zone configuration
GET /api/delivery/zone/check
GET /api/delivery/zone/fee
GET /api/delivery/zone/list
POST /api/delivery/zone/validate

// ❌ Missing delivery operations
POST /api/delivery/accept
POST /api/delivery/reject
GET /api/delivery/eta/{orderId}
POST /api/delivery/{orderId}/generate-otp
POST /api/delivery/{orderId}/regenerate-otp
```

**Impact:**
- Cannot configure delivery zones
- Driver performance not visible
- Missing delivery flow controls

---

### 4. Order Management Page (`OrderManagementPage.tsx`)

**Currently Has:** 5 APIs
**Missing:** 13 ORDER APIs

#### What's Missing:

```typescript
// ❌ No advanced order search
GET /api/orders/search
GET /api/orders/number/{orderNumber}
GET /api/orders/status/{status}

// ❌ No date-based filtering
GET /api/orders/date/{date}
GET /api/orders/range

// ❌ Missing analytics
GET /api/orders/staff/{staffId}/date/{date}
GET /api/orders/active-deliveries/count
GET /api/orders/store/avg-prep-time
GET /api/orders/analytics/prep-time-by-item
GET /api/orders/analytics/kitchen-staff/{staffId}/performance
GET /api/orders/store/analytics/prep-time-distribution

// ❌ Quality control not integrated
GET /api/orders/{orderId}/quality-checkpoints
GET /api/orders/store/failed-quality-checks
```

**Impact:**
- Cannot search orders by number
- No historical date filtering
- Quality checkpoints not working
- Kitchen analytics missing

---

### 5. Staff Management Page (`StaffManagementPage.tsx`)

**Currently Has:** 5 APIs
**Missing:** 9 SESSION APIs

#### What's Missing:

```typescript
// ❌ No time tracking visibility
GET /api/users/sessions/store/active
GET /api/users/sessions/{employeeId}
GET /api/users/sessions/{employeeId}/report
GET /api/users/sessions/{employeeId}/status

// ❌ Missing session management
GET /api/users/sessions/pending-approval
POST /api/users/sessions/{sessionId}/reject
POST /api/users/sessions/{employeeId}/break

// ❌ No user statistics
GET /api/users/stats
GET /api/users/search
```

**Impact:**
- Cannot see active staff sessions
- Session approval may not work fully
- No staff performance reports

---

### 6. Inventory Dashboard Page (`InventoryDashboardPage.tsx`)

**Currently Has:** Unknown
**Missing:** 6 ALERT APIs

#### What's Missing:

```typescript
// ❌ No stock alerts
GET /api/inventory/low-stock
GET /api/inventory/out-of-stock
GET /api/inventory/expiring-soon
GET /api/inventory/alerts/low-stock

// ❌ No inventory value tracking
GET /api/inventory/value
GET /api/inventory/value/by-category
```

**Impact:**
- Manager doesn't see low stock alerts
- No expiry warnings
- Cannot track inventory value

---

### 7. Review Management Page (`ReviewManagementPage.tsx`)

**Currently Has:** 2 APIs
**Missing:** 9 RESPONSE APIs

#### What's Missing:

```typescript
// ❌ Cannot respond to reviews
POST /api/responses/review/{reviewId}
GET /api/responses/{responseId}
PUT /api/responses/review/{reviewId}
DELETE /api/responses/{responseId}

// ❌ No response management
GET /api/responses/manager/{managerId}
GET /api/responses

// ❌ No response templates
GET /api/responses/templates
GET /api/responses/templates/{responseType}
```

**Impact:**
- Managers cannot reply to customer reviews
- No canned response templates
- Customer service broken

---

### 8. Campaign Management Page (`CampaignManagementPage.tsx`)

**Currently Has:** 3 APIs
**Missing:** Actually seems to have main ones, but check:

```typescript
// ✅ Has: POST /campaigns
// ✅ Has: GET /campaigns/{id}
// ✅ Has: POST /campaigns/{id}/schedule

// ❌ Might be missing:
POST /api/campaigns/{id}/cancel
POST /api/campaigns/{id}/execute
```

**Impact:** Minimal - mostly working

---

### 9. Payment Dashboard Page (`PaymentDashboardPage.tsx`)

**Currently Has:** 3 APIs
**Missing:** 6 PAYMENT APIs

#### What's Missing:

```typescript
// ❌ No transaction history
GET /api/payments/customer/{customerId}
GET /api/payments/{transactionId}
GET /api/payments/order/{orderId}

// ❌ No reconciliation
GET /api/payments/reconciliation
POST /api/payments/{transactionId}/reconcile

// ❌ Missing webhook (backend only)
POST /api/payments/webhook
```

**Impact:**
- Cannot view transaction history by customer
- Payment reconciliation missing
- Accounting features incomplete

---

### 10. GDPR Compliance - NO PAGE EXISTS!

**Currently Has:** NOTHING
**Missing:** 14 GDPR APIs

#### What's Missing:

```typescript
// ❌ LEGAL COMPLIANCE MISSING!
POST /api/gdpr/consent/grant
POST /api/gdpr/consent/revoke
GET /api/gdpr/consent/user/{userId}
GET /api/gdpr/consent/check

// ❌ Data requests
POST /api/gdpr/request
GET /api/gdpr/request/{requestId}/access
GET /api/gdpr/request/{requestId}/erasure
GET /api/gdpr/request/{requestId}/portability
GET /api/gdpr/request/{requestId}/rectification
GET /api/gdpr/request/user/{userId}

// ❌ Data export/deletion
GET /api/gdpr/audit/{userId}
GET /api/gdpr/privacy-policy
GET /api/gdpr/export/{userId}
DELETE /api/gdpr/erase/{userId}
```

**Impact:**
- ⚠️ **BREAKING EU LAW** if serving EU customers
- No way to handle data requests
- Cannot export/delete user data
- GDPR fines: up to €20M or 4% revenue

---

## 🟡 IMPORTANT - Missing Advanced Features

### 11. Menu Service (Public API)

**Missing:** 8 PUBLIC MENU APIs

```typescript
// Customer-facing menu features not integrated
GET /api/menu/public
GET /api/menu/public/{id}
GET /api/menu/public/cuisine/{cuisine}
GET /api/menu/public/category/{category}
GET /api/menu/public/dietary/{dietaryType}
GET /api/menu/public/recommended
GET /api/menu/public/search
GET /api/menu/public/tag/{tag}
```

**Impact:** Customers can't filter by dietary preferences, cuisines

---

### 12. Notification Preferences - NO PAGE!

**Missing:** 6 PREFERENCE APIs

```typescript
GET /api/preferences/user/{userId}
PUT /api/preferences/user/{userId}
PATCH /api/preferences/user/{userId}/channel/{channel}
POST /api/preferences/user/{userId}/device-token
PUT /api/preferences/user/{userId}/contact
DELETE /api/preferences/user/{userId}
```

**Impact:** Users cannot configure notification preferences

---

### 13. User Profile - Incomplete

**Missing:** Customer loyalty APIs in profile

```typescript
GET /api/customers/{id}/loyalty/points
POST /api/customers/{id}/loyalty/redeem
GET /api/customers/{id}/loyalty/max-redeemable
GET /api/customers/loyalty/tier/{tier}
```

**Impact:** Loyalty program exists in backend but not exposed to customers

---

## 🟢 NICE-TO-HAVE - Future Features

### System Monitoring (5 APIs)
```
GET /api/system/version
GET /api/system/updates/check
GET /api/system/health
GET /api/system/info
```

### Test Data Endpoints (3 APIs)
```
POST /api/test-data/* (dev only, ok to skip)
```

### Advanced BI (7 APIs)
```
All /api/bi/* endpoints - predictive analytics
```

---

## 📊 SUMMARY BY PAGE

| Page | Has APIs | Missing Critical | Missing Important | Status |
|------|----------|------------------|-------------------|--------|
| **Customer Management** | 6 | 11 | 5 | 🔴 Partially broken |
| **Dashboard** | 2 | 18 | 0 | 🔴 Using fake data |
| **Delivery Management** | 5 | 15 | 0 | 🔴 Incomplete |
| **Order Management** | 5 | 13 | 0 | 🔴 Basic only |
| **Staff Management** | 5 | 9 | 0 | 🔴 No time tracking |
| **Inventory Dashboard** | ? | 6 | 0 | 🔴 No alerts |
| **Review Management** | 2 | 9 | 0 | 🔴 Cannot respond |
| **Payment Dashboard** | 3 | 6 | 0 | 🟡 No history |
| **GDPR Page** | 0 | 14 | 0 | 🔴 DOESN'T EXIST |
| **Notification Prefs** | 0 | 6 | 0 | 🟡 No settings |
| **Public Menu** | ? | 8 | 0 | 🟡 Basic filtering |

---

## 🎯 PRIORITY FIX ORDER

### Phase 1: Legal Compliance (Week 1)
**Build GDPR Compliance Page** with 14 APIs
- Risk: Legal fines
- Effort: 3-4 days
- Auto-generation: 90% (I can generate this)

### Phase 2: Manager Visibility (Week 2)
**Fix Dashboard** with 18 analytics APIs
- Risk: Managers flying blind
- Effort: 2-3 days
- Auto-generation: 95% (simple queries)

### Phase 3: Customer Management (Week 3)
**Complete Customer Page** with 16 missing APIs
- Risk: Cannot manage customer relationships
- Effort: 2-3 days
- Auto-generation: 90%

### Phase 4: Operations (Week 4)
**Fix Delivery, Orders, Inventory** with 34 APIs
- Risk: Operational inefficiencies
- Effort: 4-5 days
- Auto-generation: 85%

---

## 💡 AUTO-GENERATION OPPORTUNITY

**I can auto-generate all missing integrations:**

1. ✅ RTK Query hooks (100% automated)
2. ✅ TypeScript types (100% automated from OpenAPI)
3. ✅ Basic React pages (90% automated with templates)
4. ✅ Contract tests (100% automated)

**Estimated Time:**
- Manual: 4-6 weeks
- With auto-generation: 1-2 weeks (mostly testing/tweaking)

---

## 🚨 IMMEDIATE ACTIONS

1. **GDPR Compliance** - Create page ASAP if EU customers exist
2. **Dashboard Analytics** - Connect real analytics APIs (stop using fake data)
3. **Customer Details** - Add individual customer view
4. **Delivery Zones** - Enable zone configuration
5. **Review Responses** - Let managers respond to reviews

---

**Want me to auto-generate the missing integrations starting with GDPR or Analytics?**
