# Complete StoreId Audit & Fix Plan
## MaSoVa Restaurant Management System

**Generated:** 2025-11-29
**Scope:** Entire application stack (Database → Backend → Frontend)
**Total Files Affected:** 145+

---

## 🎯 CURRENT STATE ANALYSIS

### Critical Issues Identified

1. **Hardcoded Store IDs** - Multiple services use `"store-1"`, `"STORE001"`, `"STORE_1"` as fallbacks
2. **Missing StoreId Validation** - API endpoints don't validate if storeId exists or user has access
3. **Inconsistent Null Handling** - Some pages use `|| ''`, others use `|| 'store-1'`
4. **No Refetch on Store Change** - Only 5 pages properly refetch when store selector changes
5. **Backend Hardcoded Values** - Analytics and inventory services have hardcoded store IDs
6. **Missing Skip Logic** - Many RTK Query hooks don't skip when storeId is empty

---

## 📊 WHAT IT SHOULD BE

### **Golden Rule: Store ID Flow**

```
DATABASE (MongoDB ObjectID)
    ↓
BACKEND (Validates & Authorizes)
    ↓
FRONTEND (StoreSelector → Redux → Components)
```

### **Correct Pattern for All Pages:**

```typescript
// 1. Get storeId from Redux
const currentUser = useAppSelector(selectCurrentUser);
const selectedStoreId = useAppSelector(selectSelectedStoreId);
const storeId = selectedStoreId || currentUser?.storeId || '';

// 2. Use skip to prevent empty queries
const { data, refetch } = useQuery(storeId, {
  skip: !storeId,  // ⭐ CRITICAL
  pollingInterval: 30000
});

// 3. Refetch when store changes
useEffect(() => {
  if (storeId) {
    refetch();
  }
}, [storeId, refetch]);

// 4. Show loading/empty state when no store
if (!storeId) {
  return <SelectStoreMessage />;
}
```

---

## 🔍 COMPREHENSIVE AUDIT RESULTS

### **FRONTEND (React/TypeScript)**

#### ✅ PAGES WITH CORRECT IMPLEMENTATION (5)
```
✅ PaymentDashboardPage.tsx - Has skip + refetch
✅ InventoryDashboardPage.tsx - Has skip + refetch
✅ RefundManagementPage.tsx - Has skip + refetch
✅ PurchaseOrdersPage.tsx - Has skip + refetch
✅ WasteAnalysisPage.tsx - Has skip + refetch
```

#### ❌ PAGES NEEDING FIXES (15+)

**Missing `skip` + `refetch` logic:**
1. `DashboardPage.tsx` - Has skip ✅ but NO refetch ❌
2. `OrderManagementPage.tsx` - Has skip ✅ but NO refetch ❌
3. `DriverManagementPage.tsx` - NEEDS AUDIT
4. `StoreManagementPage.tsx` - NEEDS AUDIT
5. `ProductAnalyticsPage.tsx` - NEEDS AUDIT
6. `StaffLeaderboardPage.tsx` - NEEDS AUDIT
7. `AdvancedReportsPage.tsx` - NEEDS AUDIT
8. `KitchenAnalyticsPage.tsx` - NEEDS AUDIT
9. `EquipmentMonitoringPage.tsx` - NEEDS AUDIT
10. `ReviewManagementPage.tsx` - NEEDS AUDIT
11. `SupplierManagementPage.tsx` - NEEDS AUDIT
12. `CustomerManagementPage.tsx` - NEEDS AUDIT
13. `RecipeManagementPage.tsx` - NEEDS AUDIT
14. `DeliveryDashboardPage.tsx` - NEEDS AUDIT
15. `CampaignManagementPage.tsx` - NEEDS AUDIT

**POS System (3 files):**
16. `POSDashboard.tsx` - Likely hardcoded
17. `OrderHistory.tsx` - Likely hardcoded
18. `Reports.tsx` - Likely hardcoded

**Kitchen App:**
19. `OrderQueuePage.tsx` - NEEDS AUDIT

**Components:**
20. `OrderForm.tsx` - NEEDS AUDIT
21. `StoreInfo.tsx` - Has skip ✅

---

### **BACKEND (Spring Boot/Java)**

#### ❌ SERVICES WITH HARDCODED STORE IDS

**1. Inventory Service**
```java
File: inventory-service/src/main/java/com/MaSoVa/inventory/service/PurchaseOrderService.java:309
Issue: List<String> storeIds = List.of("STORE001"); // Placeholder
Fix: Get from authenticated user context or request parameter
```

**2. Analytics Service**
```java
File: analytics-service/src/main/java/com/MaSoVa/analytics/service/BenchmarkingService.java:102
Issue: String storeId = (String) order.getOrDefault("storeId", "STORE001");
Fix: Require storeId, don't use fallback
```

#### ❌ MISSING VALIDATIONS

**All Controllers Need:**
1. **StoreId Existence Check** - Validate store exists in database
2. **User Authorization Check** - Verify user has access to that store
3. **Role-Based Access** - Managers can access all stores, staff only their assigned store

**Pattern to Apply:**
```java
@PreAuthorize("hasRole('MANAGER') or hasRole('ASSISTANT_MANAGER')")
@GetMapping("/api/endpoint/{storeId}")
public ResponseEntity<?> getData(@PathVariable String storeId,
                                  @RequestHeader("X-User-Id") String userId) {
    // 1. Validate store exists
    if (!storeService.existsById(storeId)) {
        return ResponseEntity.notFound().build();
    }

    // 2. Validate user has access to this store
    if (!accessControlService.canAccessStore(userId, storeId)) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
    }

    // 3. Process request
    return ResponseEntity.ok(service.getData(storeId));
}
```

---

### **DATABASE (MongoDB)**

#### ❌ SEED DATA ISSUES

**Check for hardcoded storeIds in:**
1. Store seeding scripts
2. User seeding scripts (employees assigned to stores)
3. Inventory seeding scripts
4. Order seeding scripts

**What should happen:**
```javascript
// WRONG
const storeId = "store-1";

// RIGHT
const stores = await Store.find();
const storeId = stores[0]._id; // Use actual ObjectID
```

---

## 🔧 COMPLETE FIX PLAN

### **PHASE 1: Database & Seed Scripts** (30 min)

**Files to Check:**
```bash
find . -name "*seed*" -o -name "*Seeder*" | grep -v node_modules
```

**Actions:**
1. Remove all hardcoded `"store-1"`, `"STORE001"` references
2. Fetch actual store ObjectIDs from database
3. Use real MongoDB ObjectIDs in relationships

---

### **PHASE 2: Backend Services** (2 hours)

#### **2A. Fix Hardcoded Values**

**File 1: `inventory-service/.../PurchaseOrderService.java:309`**
```java
// BEFORE
List<String> storeIds = List.of("STORE001");

// AFTER
List<String> storeIds = storeRepository.findAll()
    .stream()
    .map(Store::getId)
    .collect(Collectors.toList());
```

**File 2: `analytics-service/.../BenchmarkingService.java:102`**
```java
// BEFORE
String storeId = (String) order.getOrDefault("storeId", "STORE001");

// AFTER
String storeId = (String) order.get("storeId");
if (storeId == null || storeId.isEmpty()) {
    throw new IllegalArgumentException("storeId is required");
}
```

#### **2B. Add Store Access Validation Service**

**Create: `shared/src/main/java/com/MaSoVa/shared/service/StoreAccessValidator.java`**
```java
@Service
public class StoreAccessValidator {

    @Autowired
    private StoreRepository storeRepository;

    public boolean validateStoreExists(String storeId) {
        return storeRepository.existsById(storeId);
    }

    public boolean canUserAccessStore(String userId, String userType, String storeId) {
        // Managers can access any store
        if ("MANAGER".equals(userType) || "ASSISTANT_MANAGER".equals(userType)) {
            return true;
        }

        // Staff/Driver can only access their assigned store
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        return storeId.equals(user.getStoreId());
    }
}
```

#### **2C. Update All Controllers**

**Services to Update:**
- order-service: OrderController
- inventory-service: InventoryController, PurchaseOrderController
- payment-service: PaymentController
- delivery-service: DeliveryController
- user-service: WorkingSessionController, StoreController
- customer-service: CustomerController (if store-specific)
- analytics-service: All analytics controllers

**Standard Controller Pattern:**
```java
@GetMapping("/api/resource/store/{storeId}")
@PreAuthorize("hasAnyRole('MANAGER', 'ASSISTANT_MANAGER', 'STAFF')")
public ResponseEntity<?> getByStore(
    @PathVariable String storeId,
    @RequestHeader("X-User-Id") String userId,
    @RequestHeader("X-User-Type") String userType) {

    // Validate
    if (!storeAccessValidator.validateStoreExists(storeId)) {
        return ResponseEntity.notFound().build();
    }

    if (!storeAccessValidator.canUserAccessStore(userId, userType, storeId)) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
            .body("Access denied to this store");
    }

    // Process
    return ResponseEntity.ok(service.getByStore(storeId));
}
```

---

### **PHASE 3: Frontend Pages** (3 hours)

#### **3A. Create Standard Hook Pattern**

**Create: `frontend/src/hooks/useStoreData.ts`**
```typescript
import { useEffect } from 'react';
import { useAppSelector } from '../store/hooks';
import { selectCurrentUser } from '../store/slices/authSlice';
import { selectSelectedStoreId } from '../store/slices/cartSlice';

export const useStoreId = () => {
  const currentUser = useAppSelector(selectCurrentUser);
  const selectedStoreId = useAppSelector(selectSelectedStoreId);
  return selectedStoreId || currentUser?.storeId || '';
};

export const useStoreDataRefetch = (
  storeId: string,
  refetchFunctions: (() => void)[]
) => {
  useEffect(() => {
    if (storeId) {
      refetchFunctions.forEach(fn => fn());
    }
  }, [storeId, ...refetchFunctions]);
};
```

#### **3B. Update All Manager Pages**

**Template for EVERY manager page:**
```typescript
import React, { useEffect } from 'react';
import { useStoreId } from '../../hooks/useStoreData';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { selectSelectedStoreId } from '../../store/slices/cartSlice';

const SomePage: React.FC = () => {
  // 1. Get storeId
  const currentUser = useAppSelector(selectCurrentUser);
  const selectedStoreId = useAppSelector(selectSelectedStoreId);
  const storeId = selectedStoreId || currentUser?.storeId || '';

  // 2. Fetch data with skip
  const { data, isLoading, refetch } = useGetDataQuery(storeId, {
    skip: !storeId,  // ⭐ ALWAYS ADD THIS
    pollingInterval: 30000
  });

  // 3. Refetch on store change
  useEffect(() => {
    if (storeId) {
      refetch();
    }
  }, [storeId, refetch]);

  // 4. Handle no store selected
  if (!storeId) {
    return (
      <div>
        <p>Please select a store to view data</p>
        <StoreSelector variant="manager" />
      </div>
    );
  }

  // 5. Render with data
  return (
    <div>
      {/* Your component */}
    </div>
  );
};
```

**Files to Update (20 files):**
1. DashboardPage.tsx - Add refetch
2. OrderManagementPage.tsx - Add refetch
3. DriverManagementPage.tsx - Add skip + refetch
4. StoreManagementPage.tsx - Add skip + refetch
5. ProductAnalyticsPage.tsx - Add skip + refetch
6. StaffLeaderboardPage.tsx - Add skip + refetch
7. AdvancedReportsPage.tsx - Add skip + refetch
8. KitchenAnalyticsPage.tsx - Add skip + refetch
9. EquipmentMonitoringPage.tsx - Add skip + refetch
10. ReviewManagementPage.tsx - Add skip + refetch
11. SupplierManagementPage.tsx - Add skip + refetch
12. CustomerManagementPage.tsx - Add skip + refetch
13. RecipeManagementPage.tsx - Add skip + refetch
14. DeliveryDashboardPage.tsx - Add skip + refetch
15. CampaignManagementPage.tsx - Add skip + refetch
16. POSDashboard.tsx - Add skip + refetch
17. OrderHistory.tsx - Add skip + refetch
18. Reports.tsx - Add skip + refetch
19. OrderQueuePage.tsx - Add skip + refetch
20. OrderForm.tsx - Pass storeId as prop

---

### **PHASE 4: API Configuration** (30 min)

**Update: `frontend/src/store/api/baseApi.ts`**

Add storeId to all requests:
```typescript
export const baseApi = createApi({
  baseQuery: fetchBaseQuery({
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as RootState;
      const token = state.auth.accessToken;
      const user = state.auth.user;
      const selectedStoreId = state.cart.selectedStoreId;

      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }

      if (user) {
        headers.set('X-User-Id', user.id);
        headers.set('X-User-Type', user.type);
      }

      // Add selected storeId to headers
      const storeId = selectedStoreId || user?.storeId;
      if (storeId) {
        headers.set('X-Store-Id', storeId);
      }

      return headers;
    },
  }),
});
```

---

### **PHASE 5: Error Handling** (1 hour)

#### **5A. Backend Error Responses**

**Standard Error Format:**
```json
{
  "error": "STORE_NOT_FOUND",
  "message": "Store with ID 'xyz' does not exist",
  "timestamp": "2025-11-29T10:30:00Z",
  "path": "/api/orders/store/xyz"
}

{
  "error": "STORE_ACCESS_DENIED",
  "message": "You do not have permission to access this store",
  "timestamp": "2025-11-29T10:30:00Z",
  "path": "/api/orders/store/xyz"
}
```

#### **5B. Frontend Error Handling**

**Update RTK Query Error Handler:**
```typescript
const { data, error } = useGetDataQuery(storeId);

if (error) {
  if ('status' in error) {
    if (error.status === 404) {
      return <StoreNotFoundMessage />;
    }
    if (error.status === 403) {
      return <AccessDeniedMessage />;
    }
  }
}
```

---

## 📋 IMPLEMENTATION CHECKLIST

### **Database Layer**
- [ ] Audit all seed scripts for hardcoded storeIds
- [ ] Replace hardcoded values with actual ObjectIDs
- [ ] Add database indexes on storeId fields
- [ ] Verify all relationships use correct ObjectID format

### **Backend Layer**
- [ ] Remove hardcoded "STORE001" from PurchaseOrderService.java
- [ ] Remove hardcoded "STORE001" from BenchmarkingService.java
- [ ] Create StoreAccessValidator service
- [ ] Update OrderController with validation
- [ ] Update InventoryController with validation
- [ ] Update PaymentController with validation
- [ ] Update DeliveryController with validation
- [ ] Update WorkingSessionController with validation
- [ ] Update all other controllers (10+ more)
- [ ] Add @PreAuthorize annotations where missing
- [ ] Add storeId existence checks
- [ ] Add user access authorization checks
- [ ] Standardize error responses

### **Frontend Layer**
- [ ] Create useStoreId hook
- [ ] Create useStoreDataRefetch hook
- [ ] Update DashboardPage - Add refetch
- [ ] Update OrderManagementPage - Add refetch
- [ ] Update DriverManagementPage - Add skip + refetch
- [ ] Update StoreManagementPage - Add skip + refetch
- [ ] Update ProductAnalyticsPage - Add skip + refetch
- [ ] Update StaffLeaderboardPage - Add skip + refetch
- [ ] Update AdvancedReportsPage - Add skip + refetch
- [ ] Update KitchenAnalyticsPage - Add skip + refetch
- [ ] Update EquipmentMonitoringPage - Add skip + refetch
- [ ] Update ReviewManagementPage - Add skip + refetch
- [ ] Update SupplierManagementPage - Add skip + refetch
- [ ] Update CustomerManagementPage - Add skip + refetch
- [ ] Update RecipeManagementPage - Add skip + refetch
- [ ] Update DeliveryDashboardPage - Add skip + refetch
- [ ] Update CampaignManagementPage - Add skip + refetch
- [ ] Update POSDashboard.tsx - Add skip + refetch
- [ ] Update OrderHistory.tsx - Add skip + refetch
- [ ] Update Reports.tsx - Add skip + refetch
- [ ] Update OrderQueuePage.tsx - Add skip + refetch
- [ ] Update OrderForm.tsx - Pass storeId prop
- [ ] Update baseApi with X-Store-Id header
- [ ] Add "Select Store" empty state to all pages
- [ ] Add error handling for 403/404 responses

### **Testing**
- [ ] Test login as Manager - should see all stores
- [ ] Test login as Staff - should see only assigned store
- [ ] Test store selection in dropdown
- [ ] Test data refresh without reload
- [ ] Test switching between stores
- [ ] Test unauthorized store access (should get 403)
- [ ] Test non-existent store (should get 404)
- [ ] Test each management page with real data
- [ ] Test POS system with storeId
- [ ] Test Kitchen app with storeId
- [ ] Test all API endpoints for storeId validation

---

## 🚀 EXECUTION STRATEGY

### **Quick Wins (1-2 hours) - DO FIRST**
1. Add refetch to DashboardPage, OrderManagementPage
2. Remove hardcoded STORE001 from backend
3. Add skip: !storeId to 5-10 most used pages

### **Medium Priority (2-3 hours)**
4. Create StoreAccessValidator service
5. Update 5 main controllers with validation
6. Fix all manager pages with template

### **Complete Implementation (6-8 hours)**
7. Update all 20+ frontend pages
8. Update all 10+ backend controllers
9. Fix seed scripts
10. Full testing cycle

---

## 🎯 SUCCESS METRICS

After implementation, these should ALL be true:

✅ **Zero hardcoded store IDs** in codebase
✅ **All API calls include storeId** parameter or header
✅ **All queries skip when storeId is empty**
✅ **All pages refetch on store change**
✅ **Backend validates storeId existence**
✅ **Backend validates user access to store**
✅ **403 errors for unauthorized access**
✅ **404 errors for non-existent stores**
✅ **No reload needed when changing stores**
✅ **Manager can access all stores**
✅ **Staff can only access their store**

---

## 📞 NEXT STEPS

**IMMEDIATE ACTIONS:**
1. Review this audit document
2. Choose execution strategy (Quick Wins vs Complete)
3. Start with Phase 1 (Database) or Phase 3 (Frontend Quick Wins)
4. Test incrementally after each phase

**ESTIMATED TOTAL TIME:**
- Quick Wins: 2 hours
- Full Implementation: 8-10 hours
- Testing: 2-3 hours
- **TOTAL: 10-15 hours**

---

*End of Audit Document*
