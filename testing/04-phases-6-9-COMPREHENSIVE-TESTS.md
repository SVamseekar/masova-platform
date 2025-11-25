# Test Cases: Phases 6-9 (Comprehensive)

**Document:** 04-phases-6-9-COMPREHENSIVE-TESTS.md
**Covers:** Kitchen Operations, Inventory, Customer Management, Delivery Management, POS Analytics
**Test Priority:** HIGH (Advanced features & operations)

---

## 📋 Table of Contents

1. [Phase 6: Kitchen Operations Management](#phase-6-kitchen-operations-management)
2. [Phase 7: Inventory Management](#phase-7-inventory-management)
3. [Phase 8: Customer Management & Loyalty](#phase-8-customer-management--loyalty)
4. [Phase 9: Driver & Delivery Management](#phase-9-driver--delivery-management)
5. [Phase 9: POS Analytics & Advanced Reporting](#phase-9-pos-analytics--advanced-reporting)

---

## Phase 6: Kitchen Operations Management

### 🎯 Test Scope
- Quality checkpoint system (7 checkpoint types)
- Equipment monitoring (9 equipment types)
- Recipe management
- Make-table workflow
- Kitchen analytics

### 6.1 Quality Checkpoint Tests

#### TC-6.1.1: Initialize Quality Checkpoints
**Priority:** HIGH
**Preconditions:** New order created

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Create new order | 4 default checkpoints created | ☐ |
| 2 | Verify checkpoint types | INGREDIENT_QUALITY, PORTION_SIZE, TEMPERATURE, FINAL_INSPECTION | ☐ |
| 3 | Check initial status | All PENDING | ☐ |

**Checkpoint Types (7 total):**
- INGREDIENT_QUALITY
- PORTION_SIZE
- TEMPERATURE
- PRESENTATION
- TASTE_TEST
- PACKAGING
- FINAL_INSPECTION

**Acceptance Criteria:**
- ✅ Auto-initialization on order creation
- ✅ All 4 default checkpoints present
- ✅ Status = PENDING

---

#### TC-6.1.2: Update Quality Checkpoint - Pass
**Priority:** HIGH
**Preconditions:** Order with pending checkpoints, kitchen staff logged in

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | PATCH `/api/orders/{orderId}/quality-checkpoint/Ingredient Quality Check` | Checkpoint updated | ☐ |
| 2 | Set status to PASSED | Status updated | ☐ |
| 3 | Add notes (optional) | Notes saved | ☐ |
| 4 | Check checkedAt timestamp | Timestamp set | ☐ |
| 5 | Verify checkedBy | Staff userId saved | ☐ |

**Test Data:**
```json
{
  "status": "PASSED",
  "notes": "All ingredients fresh and properly stored"
}
```

**Acceptance Criteria:**
- ✅ Checkpoint marked as PASSED
- ✅ Staff tracked
- ✅ Notes saved
- ✅ Timestamp recorded

---

#### TC-6.1.3: Update Quality Checkpoint - Failed
**Priority:** HIGH
**Preconditions:** Order with pending checkpoints

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | PATCH checkpoint with status FAILED | Checkpoint updated | ☐ |
| 2 | Add failure notes (required) | Notes saved | ☐ |
| 3 | Check order appears in failed quality checks list | Order flagged | ☐ |
| 4 | Manager notified | Alert sent | ☐ |

**Test Data:**
```json
{
  "status": "FAILED",
  "notes": "Temperature below required 165°F"
}
```

**Acceptance Criteria:**
- ✅ Failed status recorded
- ✅ Notes required for failures
- ✅ Manager alert triggered
- ✅ Order tracking updated

---

#### TC-6.1.4: Get Orders with Failed Quality Checks
**Priority:** MEDIUM
**Preconditions:** Some orders have failed checkpoints

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | GET `/api/orders/store/{storeId}/failed-quality-checks` | Returns orders with failures | ☐ |
| 2 | Verify only failed orders returned | Filtering correct | ☐ |
| 3 | Check failure details included | Checkpoint details shown | ☐ |

**Acceptance Criteria:**
- ✅ Failed orders identified
- ✅ Details accessible
- ✅ Manager can take action

---

### 6.2 Equipment Monitoring Tests

#### TC-6.2.1: Create Kitchen Equipment
**Priority:** HIGH
**Preconditions:** Manager logged in

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | POST `/api/kitchen-equipment` with equipment data | 201 Created | ☐ |
| 2 | Verify equipment in database | Equipment exists | ☐ |
| 3 | Check default status | AVAILABLE | ☐ |

**Test Data:**
```json
{
  "storeId": "store-001",
  "name": "Pizza Oven #1",
  "type": "OVEN",
  "location": "Main Kitchen - Left",
  "targetTemperature": 450.0
}
```

**Equipment Types (9 total):**
- OVEN
- STOVE
- GRILL
- FRYER
- REFRIGERATOR
- FREEZER
- MIXER
- DISHWASHER
- OTHER

**Acceptance Criteria:**
- ✅ Equipment created successfully
- ✅ All fields validated
- ✅ Type validation working

---

#### TC-6.2.2: Update Equipment Status
**Priority:** HIGH
**Preconditions:** Equipment exists

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | PATCH `/api/kitchen-equipment/{id}/status` to IN_USE | Status updated | ☐ |
| 2 | Change to MAINTENANCE | Status updated, available count decreases | ☐ |
| 3 | Mark as BROKEN | Status updated, alert triggered | ☐ |
| 4 | Return to AVAILABLE | Status updated, available count increases | ☐ |

**Equipment Statuses (5 total):**
- AVAILABLE
- IN_USE
- MAINTENANCE
- BROKEN
- CLEANING

**Acceptance Criteria:**
- ✅ All status transitions working
- ✅ Availability tracking accurate
- ✅ Broken equipment alerts sent

---

#### TC-6.2.3: Temperature Monitoring
**Priority:** HIGH
**Preconditions:** Heating equipment exists (OVEN/GRILL/FRYER)

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | PATCH `/api/kitchen-equipment/{id}/temperature` | Temperature updated | ☐ |
| 2 | Set temperature to target | currentTemperature = targetTemperature | ☐ |
| 3 | Monitor temperature history | History tracked | ☐ |
| 4 | Alert if temperature off by > 10% | Alert triggered | ☐ |

**Acceptance Criteria:**
- ✅ Temperature tracking functional
- ✅ Alerts for deviations
- ✅ History maintained

---

#### TC-6.2.4: Equipment Maintenance Scheduling
**Priority:** MEDIUM
**Preconditions:** Equipment exists

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | POST `/api/kitchen-equipment/{id}/maintenance` | Maintenance record created | ☐ |
| 2 | Set nextMaintenanceDate | Date saved | ☐ |
| 3 | GET equipment needing maintenance | Overdue equipment listed | ☐ |
| 4 | Check maintenance alerts | Alerts sent for overdue | ☐ |

**Acceptance Criteria:**
- ✅ Maintenance scheduling working
- ✅ Alerts for overdue maintenance
- ✅ Maintenance history tracked

---

### 6.3 Recipe Management Tests

#### TC-6.3.1: View Recipe (Customer)
**Priority:** MEDIUM
**Preconditions:** Menu item has recipe

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Navigate to menu page | Menu items displayed | ☐ |
| 2 | Click "View Recipe" | Recipe dialog opens | ☐ |
| 3 | Check ingredients list | All ingredients displayed | ☐ |
| 4 | View preparation steps | Step-by-step instructions shown | ☐ |
| 5 | Check nutritional info | Nutritional data displayed | ☐ |

**Acceptance Criteria:**
- ✅ Recipe viewer functional
- ✅ Ingredients listed
- ✅ Steps clear and numbered
- ✅ Neumorphic design

---

#### TC-6.3.2: Recipe Management (Manager)
**Priority:** MEDIUM
**Preconditions:** Manager logged in

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Navigate to `/manager/recipes` | Recipe management page loads | ☐ |
| 2 | Select menu item | Recipe editor opens | ☐ |
| 3 | Add/edit ingredients | Ingredients updated | ☐ |
| 4 | Add/edit preparation steps | Steps updated | ☐ |
| 5 | Save changes | Recipe saved | ☐ |

**Acceptance Criteria:**
- ✅ Recipe editor functional
- ✅ CRUD operations working
- ✅ Changes reflected immediately

---

### 6.4 Make-Table Workflow Tests

#### TC-6.4.1: Assign Order to Make-Table Station
**Priority:** MEDIUM
**Preconditions:** Order in kitchen queue

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | PATCH `/api/orders/{orderId}/assign-make-table` | Order assigned | ☐ |
| 2 | Specify station (PIZZA/SANDWICH/GRILL) | Station saved | ☐ |
| 3 | Assign kitchen staff | Staff assigned | ☐ |
| 4 | Check assignment timestamp | Timestamp recorded | ☐ |

**Make-Table Stations:**
- PIZZA
- SANDWICH
- GRILL
- FRY
- DESSERT

**Acceptance Criteria:**
- ✅ Station assignment working
- ✅ Staff tracking functional
- ✅ Timestamps recorded

---

#### TC-6.4.2: Filter Orders by Station
**Priority:** MEDIUM
**Preconditions:** Orders assigned to various stations

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | GET `/api/orders/store/{storeId}/make-table/PIZZA` | Returns only pizza station orders | ☐ |
| 2 | Check other stations | Filtering works for all stations | ☐ |
| 3 | Verify unassigned orders excluded | Only assigned orders shown | ☐ |

**Acceptance Criteria:**
- ✅ Station filtering functional
- ✅ Helps organize kitchen workflow
- ✅ Real-time updates via WebSocket

---

### 6.5 Kitchen Analytics Tests

#### TC-6.5.1: Average Prep Time by Menu Item
**Priority:** MEDIUM
**Preconditions:** Completed orders with prep times

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | GET `/api/orders/store/{storeId}/analytics/prep-time-by-item` | Returns prep time breakdown | ☐ |
| 2 | Verify calculations | Average correct for each item | ☐ |
| 3 | Identify bottlenecks | Items with > 20min highlighted | ☐ |

**Acceptance Criteria:**
- ✅ Analytics calculated correctly
- ✅ Bottlenecks identified
- ✅ Data actionable

---

#### TC-6.5.2: Kitchen Staff Performance
**Priority:** MEDIUM
**Preconditions:** Orders assigned to staff

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | GET `/api/orders/analytics/kitchen-staff/{staffId}/performance` | Staff metrics returned | ☐ |
| 2 | Verify total orders | Count correct | ☐ |
| 3 | Check completion rate | Percentage correct | ☐ |
| 4 | View failed quality checks | Failures tracked | ☐ |

**Performance Metrics:**
- Total orders assigned
- Completed orders
- Completion rate %
- Average prep time
- Failed quality checks

**Acceptance Criteria:**
- ✅ Staff performance tracked
- ✅ Metrics accurate
- ✅ Performance levels calculated

---

## Phase 7: Inventory Management

### 🎯 Test Scope
- Stock tracking (current, reserved, available)
- Supplier management
- Purchase orders (automated & manual)
- Waste tracking & analysis
- Low stock alerts

### 7.1 Inventory CRUD Tests

#### TC-7.1.1: Add Inventory Item
**Priority:** HIGH
**Preconditions:** Manager logged in

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | POST `/api/inventory/items` with item data | 201 Created | ☐ |
| 2 | Verify item in database | Item exists | ☐ |
| 3 | Check calculations | availableQuantity = currentStock - reservedStock | ☐ |

**Test Data:**
```json
{
  "name": "Mozzarella Cheese",
  "category": "DAIRY",
  "unit": "KG",
  "currentStock": 100,
  "reorderPoint": 20,
  "reorderQuantity": 50,
  "unitCost": 450.00,
  "supplierId": "supplier-001",
  "expiryDate": "2025-12-31"
}
```

**Acceptance Criteria:**
- ✅ Item created successfully
- ✅ All fields validated
- ✅ Calculations correct

---

#### TC-7.1.2: Stock Adjustment
**Priority:** HIGH
**Preconditions:** Inventory item exists

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | PATCH `/api/inventory/items/{id}/adjust` | Stock adjusted | ☐ |
| 2 | Increase stock (+50 KG) | Current stock increased | ☐ |
| 3 | Decrease stock (-20 KG) | Current stock decreased | ☐ |
| 4 | Add adjustment reason | Reason saved | ☐ |
| 5 | Check adjustment history | History tracked | ☐ |

**Adjustment Types:**
- RECEIVED (from supplier)
- CONSUMED (used in orders)
- DAMAGED
- EXPIRED
- RETURNED
- CORRECTION

**Acceptance Criteria:**
- ✅ Adjustments working
- ✅ Reason tracking
- ✅ History maintained

---

### 7.2 Stock Reservation Tests

#### TC-7.2.1: Reserve Stock for Order
**Priority:** HIGH
**Preconditions:** Order created, inventory items available

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | PATCH `/api/inventory/items/{id}/reserve` | Stock reserved | ☐ |
| 2 | Check reservedStock increased | Reserved quantity updated | ☐ |
| 3 | Verify availableQuantity decreased | Available = current - reserved | ☐ |
| 4 | Try to reserve more than available | 400 Bad Request | ☐ |

**Acceptance Criteria:**
- ✅ Reservation working
- ✅ Availability calculated correctly
- ✅ Prevents over-reservation

---

#### TC-7.2.2: Release Reserved Stock
**Priority:** HIGH
**Preconditions:** Stock reserved for cancelled order

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | PATCH `/api/inventory/items/{id}/release` | Reservation released | ☐ |
| 2 | Check reservedStock decreased | Reserved quantity reduced | ☐ |
| 3 | Verify availableQuantity increased | Available stock restored | ☐ |

**Acceptance Criteria:**
- ✅ Release working
- ✅ Stock availability restored
- ✅ Audit trail maintained

---

#### TC-7.2.3: Consume Reserved Stock
**Priority:** HIGH
**Preconditions:** Stock reserved, order completed

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | PATCH `/api/inventory/items/{id}/consume` | Stock consumed | ☐ |
| 2 | Check currentStock decreased | Current reduced | ☐ |
| 3 | Check reservedStock decreased | Reserved reduced | ☐ |
| 4 | Verify total calculation | Total consumed tracked | ☐ |

**Acceptance Criteria:**
- ✅ Consumption working
- ✅ Both current and reserved updated
- ✅ Usage tracking accurate

---

### 7.3 Low Stock Alert Tests

#### TC-7.3.1: Low Stock Detection
**Priority:** HIGH
**Preconditions:** Items with stock below reorder point

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | GET `/api/inventory/low-stock` | Returns items below reorder point | ☐ |
| 2 | Verify calculation | current < reorderPoint | ☐ |
| 3 | Check alert details | Item name, current stock, reorder point shown | ☐ |

**Acceptance Criteria:**
- ✅ Low stock detection working
- ✅ Alerts timely
- ✅ Manager notified

---

#### TC-7.3.2: Out of Stock Detection
**Priority:** CRITICAL
**Preconditions:** Items with zero stock

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | GET `/api/inventory/out-of-stock` | Returns items with zero stock | ☐ |
| 2 | Verify urgent alert sent | Manager alerted immediately | ☐ |
| 3 | Check menu items marked unavailable | Items auto-disabled | ☐ |

**Acceptance Criteria:**
- ✅ Out of stock tracked
- ✅ Urgent alerts sent
- ✅ Menu availability updated

---

### 7.4 Supplier Management Tests

#### TC-7.4.1: Create Supplier
**Priority:** HIGH
**Preconditions:** Manager logged in

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | POST `/api/inventory/suppliers` | 201 Created | ☐ |
| 2 | Verify supplier code unique | Uniqueness enforced | ☐ |
| 3 | Check contact details saved | All fields present | ☐ |

**Test Data:**
```json
{
  "name": "Fresh Dairy Co.",
  "code": "DAIRY-001",
  "contactPerson": "John Smith",
  "email": "john@freshdairy.com",
  "phone": "+919876543210",
  "category": "DAIRY",
  "city": "Bangalore",
  "isPreferred": true
}
```

**Acceptance Criteria:**
- ✅ Supplier created
- ✅ Code validation
- ✅ Contact info complete

---

#### TC-7.4.2: Supplier Performance Tracking
**Priority:** MEDIUM
**Preconditions:** Supplier exists, orders delivered

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | PATCH `/api/inventory/suppliers/{id}/performance` | Metrics updated | ☐ |
| 2 | Update onTimeDeliveryRate | Rate saved | ☐ |
| 3 | Update qualityScore | Score saved | ☐ |
| 4 | Check preferred status calculation | Auto-promoted if performance high | ☐ |

**Performance Metrics:**
- On-time delivery rate %
- Quality score (1-5)
- Order fulfillment rate %
- Average lead time (days)

**Acceptance Criteria:**
- ✅ Performance tracked
- ✅ Metrics accurate
- ✅ Preferred status automated

---

### 7.5 Purchase Order Tests

#### TC-7.5.1: Create Purchase Order (Manual)
**Priority:** HIGH
**Preconditions:** Manager logged in, supplier exists

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | POST `/api/inventory/purchase-orders` | 201 Created | ☐ |
| 2 | Verify order number generated | Unique PO number | ☐ |
| 3 | Check status | DRAFT | ☐ |
| 4 | Verify total calculated | Sum of (quantity × unitPrice) | ☐ |

**Test Data:**
```json
{
  "supplierId": "supplier-001",
  "storeId": "store-001",
  "items": [
    {
      "inventoryItemId": "item-001",
      "quantity": 100,
      "unitPrice": 450.00
    }
  ],
  "notes": "Urgent order",
  "expectedDeliveryDate": "2025-11-01"
}
```

**Acceptance Criteria:**
- ✅ PO created successfully
- ✅ Calculations correct
- ✅ Status workflow initiated

---

#### TC-7.5.2: Auto-Generate Purchase Orders
**Priority:** HIGH
**Preconditions:** Items below reorder point

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | POST `/api/inventory/purchase-orders/auto-generate` | POs created for low stock items | ☐ |
| 2 | Verify quantity | reorderQuantity used | ☐ |
| 3 | Check supplier selection | Preferred supplier chosen | ☐ |
| 4 | Verify status | PENDING_APPROVAL | ☐ |

**Acceptance Criteria:**
- ✅ Auto-generation working
- ✅ Intelligent supplier selection
- ✅ Manager approval required

---

#### TC-7.5.3: Purchase Order Approval Workflow
**Priority:** HIGH
**Preconditions:** PO in PENDING_APPROVAL status

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | PATCH `/api/inventory/purchase-orders/{id}/approve` | Status: APPROVED | ☐ |
| 2 | Check approvedBy | Manager userId saved | ☐ |
| 3 | Verify approval timestamp | Timestamp set | ☐ |
| 4 | Alternative: Reject PO | Status: REJECTED, reason required | ☐ |

**PO Statuses:**
- DRAFT
- PENDING_APPROVAL
- APPROVED
- SENT
- RECEIVED
- CANCELLED

**Acceptance Criteria:**
- ✅ Approval workflow functional
- ✅ Rejection with reason
- ✅ Audit trail maintained

---

#### TC-7.5.4: Receive Purchase Order
**Priority:** HIGH
**Preconditions:** PO in SENT status, items delivered

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | PATCH `/api/inventory/purchase-orders/{id}/receive` | Status: RECEIVED | ☐ |
| 2 | Update inventory quantities | Stock increased | ☐ |
| 3 | Record actual quantities received | May differ from ordered | ☐ |
| 4 | Check supplier performance updated | On-time delivery tracked | ☐ |

**Acceptance Criteria:**
- ✅ Receiving process working
- ✅ Inventory auto-updated
- ✅ Discrepancies tracked
- ✅ Supplier metrics updated

---

### 7.6 Waste Management Tests

#### TC-7.6.1: Record Waste
**Priority:** HIGH
**Preconditions:** Manager logged in

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | POST `/api/inventory/waste` | Waste record created | ☐ |
| 2 | Specify reason | Reason saved (SPOILAGE/DAMAGED/OVERPRODUCTION) | ☐ |
| 3 | Check inventory reduced | Stock decreased | ☐ |
| 4 | Verify cost tracked | Waste cost calculated | ☐ |

**Waste Reasons:**
- SPOILAGE
- DAMAGED
- OVERPRODUCTION
- PREPARATION_ERROR
- EXPIRED
- OTHER

**Acceptance Criteria:**
- ✅ Waste recording functional
- ✅ Reasons categorized
- ✅ Cost impact tracked

---

#### TC-7.6.2: Waste Analysis
**Priority:** MEDIUM
**Preconditions:** Waste records exist

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | GET `/api/inventory/waste/total-cost` | Total waste cost returned | ☐ |
| 2 | GET waste by category | Breakdown by waste type | ☐ |
| 3 | GET top wasted items | Items with highest waste | ☐ |
| 4 | Analyze preventable waste | Recommendations provided | ☐ |

**Analysis Metrics:**
- Total waste cost
- Waste by category
- Top 10 wasted items
- Preventable waste %
- Trend analysis (monthly)

**Acceptance Criteria:**
- ✅ Analysis accurate
- ✅ Insights actionable
- ✅ Trends identified

---

## Phase 8: Customer Management & Loyalty

### 🎯 Test Scope
- Customer profiles
- Loyalty program (4 tiers)
- Points system
- Address management
- Customer analytics

### 8.1 Customer Profile Tests

#### TC-8.1.1: Create Customer Profile
**Priority:** HIGH
**Preconditions:** User registered, Customer Service running

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | POST `/api/customers` | 201 Created | ☐ |
| 2 | Verify default loyalty tier | BRONZE | ☐ |
| 3 | Check signup bonus | 100 points added | ☐ |
| 4 | Verify email/phone uniqueness | Duplicates prevented | ☐ |

**Test Data:**
```json
{
  "userId": "user-123",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+919876543210"
}
```

**Acceptance Criteria:**
- ✅ Profile created
- ✅ Loyalty initialized
- ✅ Signup bonus credited

---

#### TC-8.1.2: Update Customer Profile
**Priority:** MEDIUM
**Preconditions:** Customer exists

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | PUT `/api/customers/{id}` | Profile updated | ☐ |
| 2 | Update preferences | Preferences saved | ☐ |
| 3 | Add dietary restrictions | Restrictions saved | ☐ |

**Acceptance Criteria:**
- ✅ Updates successful
- ✅ Preferences tracked
- ✅ Data validated

---

### 8.2 Loyalty Program Tests

#### TC-8.2.1: Earn Loyalty Points
**Priority:** HIGH
**Preconditions:** Customer completes order

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | POST `/api/customers/{id}/loyalty/points` | Points added | ☐ |
| 2 | Verify calculation | 1 point per rupee spent | ☐ |
| 3 | Check transaction history | Transaction recorded | ☐ |
| 4 | Verify tier progress | Progress toward next tier updated | ☐ |

**Points Earning:**
- Order: 1 point per ₹1
- Signup: 100 points
- Birthday: 200 points

**Acceptance Criteria:**
- ✅ Points credited correctly
- ✅ History tracked
- ✅ Tier progress updated

---

#### TC-8.2.2: Redeem Loyalty Points
**Priority:** HIGH
**Preconditions:** Customer has points, placing order

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | POST `/api/customers/{id}/loyalty/points` with negative amount | Points deducted | ☐ |
| 2 | Verify sufficient balance | Redeemption only if balance available | ☐ |
| 3 | Check order discount applied | Discount = points × redemption rate | ☐ |
| 4 | Try to redeem more than available | 400 Bad Request | ☐ |

**Redemption Rate:** 1 point = ₹1 discount

**Acceptance Criteria:**
- ✅ Redemption working
- ✅ Balance validation
- ✅ Discount applied correctly

---

#### TC-8.2.3: Loyalty Tier Calculation
**Priority:** HIGH
**Preconditions:** Customer has various point levels

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Customer reaches 500 points | Tier: SILVER | ☐ |
| 2 | Customer reaches 1500 points | Tier: GOLD | ☐ |
| 3 | Customer reaches 5000 points | Tier: PLATINUM | ☐ |
| 4 | Verify tier benefits applied | Benefits active | ☐ |

**Loyalty Tiers:**
- BRONZE: 0-499 points
- SILVER: 500-1499 points (5% bonus points)
- GOLD: 1500-4999 points (10% bonus points)
- PLATINUM: 5000+ points (15% bonus points, priority support)

**Acceptance Criteria:**
- ✅ Tier calculation automatic
- ✅ Benefits applied correctly
- ✅ Tier expiry tracked (yearly)

---

### 8.3 Address Management Tests

#### TC-8.3.1: Add Customer Address
**Priority:** MEDIUM
**Preconditions:** Customer exists

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | POST `/api/customers/{id}/addresses` | Address added | ☐ |
| 2 | Verify address type | HOME/WORK/OTHER | ☐ |
| 3 | Check if first address | Set as default automatically | ☐ |

**Acceptance Criteria:**
- ✅ Multiple addresses supported
- ✅ Types categorized
- ✅ Default management working

---

#### TC-8.3.2: Set Default Address
**Priority:** MEDIUM
**Preconditions:** Customer has multiple addresses

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | PATCH `/api/customers/{customerId}/addresses/{addressId}/set-default` | Default changed | ☐ |
| 2 | Verify previous default unset | Only one default | ☐ |
| 3 | Check used in new orders | Default pre-selected | ☐ |

**Acceptance Criteria:**
- ✅ Default switching working
- ✅ Only one default allowed
- ✅ Order flow uses default

---

### 8.4 Customer Analytics Tests

#### TC-8.4.1: Customer Statistics
**Priority:** MEDIUM
**Preconditions:** Customer has order history

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | GET `/api/customers/stats` | Global stats returned | ☐ |
| 2 | Verify total customers | Count correct | ☐ |
| 3 | Check high-value customers | Spending > threshold identified | ☐ |
| 4 | View tier distribution | Customers by tier shown | ☐ |

**Acceptance Criteria:**
- ✅ Stats accurate
- ✅ Segmentation working
- ✅ Insights actionable

---

#### TC-8.4.2: Top Spenders Identification
**Priority:** MEDIUM
**Preconditions:** Multiple customers with orders

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | GET `/api/customers/top-spenders?limit=10` | Top 10 spenders returned | ☐ |
| 2 | Verify sorting | By totalSpent descending | ☐ |
| 3 | Check lifetime value | LTV calculated | ☐ |

**Acceptance Criteria:**
- ✅ Top spenders identified
- ✅ Sorting correct
- ✅ LTV tracked

---

## Phase 9: Driver & Delivery Management

### 🎯 Test Scope
- Driver management
- Auto-dispatch algorithm
- Live tracking
- Route optimization
- Driver performance analytics

### 9.1 Driver Management Tests

#### TC-9.1.1: Driver Registration
**Priority:** HIGH
**Preconditions:** User Service running

**Note:** Drivers are users with type=DRIVER. Use User Service for registration.

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Register user with type DRIVER | Driver account created | ☐ |
| 2 | Add vehicle information | Vehicle details saved | ☐ |
| 3 | Add license number | License validated and saved | ☐ |
| 4 | Check default status | OFFLINE | ☐ |

**Acceptance Criteria:**
- ✅ Driver registration working
- ✅ Vehicle info tracked
- ✅ License validation

---

#### TC-9.1.2: Driver Status Management
**Priority:** HIGH
**Preconditions:** Driver registered

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Driver logs in (GPS required) | Status: ONLINE | ☐ |
| 2 | Driver accepts delivery | Status: BUSY | ☐ |
| 3 | Driver completes delivery | Status: AVAILABLE | ☐ |
| 4 | Driver logs out | Status: OFFLINE | ☐ |

**Driver Statuses:**
- OFFLINE
- ONLINE (available for dispatch)
- BUSY (on delivery)
- BREAK

**Acceptance Criteria:**
- ✅ Status tracking working
- ✅ Automatic status changes
- ✅ GPS coordinates tracked

---

### 9.2 Auto-Dispatch Tests

#### TC-9.2.1: Auto-Dispatch Algorithm
**Priority:** CRITICAL
**Preconditions:** Order ready, drivers available

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | POST `/api/delivery/auto-dispatch` | Driver assigned | ☐ |
| 2 | Verify distance calculation | Closest driver selected | ☐ |
| 3 | Check workload consideration | Driver with fewer active deliveries preferred | ☐ |
| 4 | Verify driver notified | Driver receives notification | ☐ |
| 5 | Check order updated | assignedDriverId set | ☐ |

**Dispatch Algorithm Factors:**
- Driver proximity (Google Maps API)
- Current workload (active deliveries)
- Driver rating
- Vehicle type match

**Acceptance Criteria:**
- ✅ Intelligent assignment
- ✅ Distance calculated accurately
- ✅ Workload balanced
- ✅ Notifications sent

---

#### TC-9.2.2: Auto-Dispatch - No Drivers Available
**Priority:** HIGH
**Preconditions:** All drivers busy or offline

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Try auto-dispatch | 404 Not Found or queue for next available | ☐ |
| 2 | Check manager notified | Alert sent | ☐ |
| 3 | Verify order queued | Order in dispatch queue | ☐ |

**Acceptance Criteria:**
- ✅ Graceful handling of no drivers
- ✅ Manager alerts
- ✅ Queue management

---

### 9.3 Live Tracking Tests

#### TC-9.3.1: Driver Location Updates
**Priority:** CRITICAL
**Preconditions:** Driver on delivery, WebSocket connected

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Driver sends location update | Location saved | ☐ |
| 2 | Check location stored | DriverLocation entity updated | ☐ |
| 3 | Verify WebSocket broadcast | Customer tracking updated | ☐ |
| 4 | Check update frequency | Every 10 seconds | ☐ |

**Location Update:**
```json
{
  "driverId": "driver-001",
  "orderId": "order-123",
  "latitude": 12.9716,
  "longitude": 77.5946,
  "timestamp": "2025-10-26T10:30:00Z"
}
```

**Acceptance Criteria:**
- ✅ Location tracking real-time
- ✅ WebSocket working
- ✅ Low latency (< 1s)

---

#### TC-9.3.2: Customer Live Tracking
**Priority:** HIGH
**Preconditions:** Delivery in progress

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | GET `/api/delivery/track/{orderId}` | Tracking info returned | ☐ |
| 2 | Check driver location | Current GPS coordinates | ☐ |
| 3 | Verify ETA | Estimated time remaining | ☐ |
| 4 | Check driver contact info | Phone number available | ☐ |

**Tracking Response:**
```json
{
  "orderId": "order-123",
  "driverName": "John Driver",
  "driverPhone": "+919876543210",
  "currentLocation": {
    "latitude": 12.9716,
    "longitude": 77.5946
  },
  "estimatedArrival": "2025-10-26T11:00:00Z",
  "distanceRemaining": 2.5
}
```

**Acceptance Criteria:**
- ✅ Tracking accessible
- ✅ Real-time updates
- ✅ ETA accurate

---

### 9.4 Route Optimization Tests

#### TC-9.4.1: Get Optimized Route
**Priority:** HIGH
**Preconditions:** Google Maps API key configured

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | POST `/api/delivery/route-optimize` | Route returned | ☐ |
| 2 | Verify Google Maps API called | API integration working | ☐ |
| 3 | Check route details | Distance, duration, steps included | ☐ |
| 4 | Test fallback (if Maps fails) | Straight-line calculation used | ☐ |

**Route Request:**
```json
{
  "origin": {
    "latitude": 12.9716,
    "longitude": 77.5946
  },
  "destination": {
    "latitude": 12.9352,
    "longitude": 77.6245
  }
}
```

**Acceptance Criteria:**
- ✅ Route optimization working
- ✅ Google Maps integration
- ✅ Fallback mechanism
- ✅ Turn-by-turn directions

---

### 9.5 Driver Performance Tests

#### TC-9.5.1: Driver Performance Metrics
**Priority:** MEDIUM
**Preconditions:** Driver has completed deliveries

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | GET `/api/delivery/driver/{driverId}/performance` | Metrics returned | ☐ |
| 2 | Verify deliveries count | Total deliveries correct | ☐ |
| 3 | Check on-time rate | Percentage calculated | ☐ |
| 4 | View average delivery time | Average correct | ☐ |
| 5 | Check customer ratings | Average rating shown | ☐ |

**Performance Metrics:**
- Total deliveries
- On-time delivery rate %
- Average delivery time (minutes)
- Total distance covered (km)
- Customer rating (1-5)
- Earnings (₹)

**Performance Levels:**
- EXCELLENT: > 95% on-time, rating > 4.5
- GOOD: > 85% on-time, rating > 4.0
- AVERAGE: > 75% on-time, rating > 3.5
- NEEDS_IMPROVEMENT: < 75% on-time or rating < 3.5

**Acceptance Criteria:**
- ✅ All metrics calculated
- ✅ Performance level determined
- ✅ Earnings tracked (20% commission)

---

#### TC-9.5.2: Today's Performance
**Priority:** MEDIUM
**Preconditions:** Driver active today

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | GET `/api/delivery/driver/{driverId}/performance/today` | Today's metrics returned | ☐ |
| 2 | Verify delivery count | Today only | ☐ |
| 3 | Check earnings | Commission for today | ☐ |

**Acceptance Criteria:**
- ✅ Daily metrics accurate
- ✅ Real-time updates
- ✅ Earnings calculation correct

---

### 9.6 Driver App Tests (Frontend)

#### TC-9.6.1: Driver Dashboard
**Priority:** HIGH
**Preconditions:** Driver logged in

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Navigate to `/driver/home` | Dashboard loads | ☐ |
| 2 | Click "Clock In" (GPS required) | Working session started, status ONLINE | ☐ |
| 3 | View active deliveries | Assigned orders shown | ☐ |
| 4 | Check today's stats | Deliveries, earnings displayed | ☐ |
| 5 | Click "Clock Out" | Session ended, status OFFLINE | ☐ |

**Acceptance Criteria:**
- ✅ GPS clock in/out working
- ✅ Active deliveries visible
- ✅ Stats accurate
- ✅ Mobile-optimized

---

#### TC-9.6.2: Active Delivery Workflow
**Priority:** CRITICAL
**Preconditions:** Driver has assigned delivery

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | View delivery details | Customer info, address, order details shown | ☐ |
| 2 | Click "Navigate" | Opens Google Maps with destination | ☐ |
| 3 | Click "Call Customer" | Initiates phone call (tel: link) | ☐ |
| 4 | Click "SMS Customer" | Opens SMS with template | ☐ |
| 5 | Location updates sent | Auto-update every 10s | ☐ |
| 6 | Click "Mark as Delivered" | Order status updated, session completed | ☐ |

**Acceptance Criteria:**
- ✅ All actions functional
- ✅ Navigation working
- ✅ Contact methods available
- ✅ Location tracking automatic
- ✅ Delivery completion smooth

---

## Phase 9: POS Analytics & Advanced Reporting

### 🎯 Test Scope
- Advanced analytics APIs (5 endpoints)
- Sales trend charts
- Staff leaderboard
- Product analytics
- Payment integration (Razorpay)
- Receipt generation
- Neumorphic design compliance

### 9A.1 Sales Trends API Tests

#### TC-9A.1.1: Get Weekly Sales Trends
**Priority:** HIGH
**Preconditions:** Orders exist for the past 7 days

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | GET `/api/analytics/sales/trends/WEEKLY?storeId=store-001` | 200 OK | ☐ |
| 2 | Verify 7 data points returned | One per day | ☐ |
| 3 | Check totalSales calculation | Sum of all days | ☐ |
| 4 | Verify percentChangeFromPreviousPeriod | Comparison with previous week | ☐ |
| 5 | Check trend value | "UP", "DOWN", or "STABLE" | ☐ |

**Acceptance Criteria:**
- ✅ Returns 7 daily data points
- ✅ Accurate sales calculations
- ✅ Correct trend comparison
- ✅ Labels formatted correctly (e.g., "Mon", "Tue")

---

#### TC-9A.1.2: Get Monthly Sales Trends
**Priority:** HIGH
**Preconditions:** Orders exist for the past 30 days

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | GET `/api/analytics/sales/trends/MONTHLY?storeId=store-001` | 200 OK | ☐ |
| 2 | Verify 30 data points returned | One per day | ☐ |
| 3 | Check data format | Date labels like "Nov 12" | ☐ |
| 4 | Verify average order value | totalSales / totalOrders | ☐ |

**Acceptance Criteria:**
- ✅ Returns 30 daily data points
- ✅ Accurate monthly aggregations
- ✅ Correct AOV calculations

---

### 9A.2 Revenue Breakdown Tests

#### TC-9A.2.1: Order Type Breakdown
**Priority:** HIGH
**Preconditions:** Orders with different types exist (DINE_IN, PICKUP, DELIVERY)

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | GET `/api/analytics/sales/breakdown/order-type?storeId=store-001` | 200 OK | ☐ |
| 2 | Verify breakdown by type | 3 categories returned | ☐ |
| 3 | Check percentage calculations | Sum equals 100% | ☐ |
| 4 | Verify average order values | Calculated per type | ☐ |

**Acceptance Criteria:**
- ✅ All order types represented
- ✅ Accurate percentage calculations
- ✅ Correct revenue totals

---

### 9A.3 Peak Hours Analysis Tests

#### TC-9A.3.1: Get Peak Hours Data
**Priority:** HIGH
**Preconditions:** Orders exist throughout the day

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | GET `/api/analytics/sales/peak-hours?storeId=store-001` | 200 OK | ☐ |
| 2 | Verify 24-hour data returned | Hours 0-23 covered | ☐ |
| 3 | Check peakHour identification | Highest order count hour | ☐ |
| 4 | Check slowestHour identification | Lowest order count hour (>0) | ☐ |
| 5 | Verify hour labels formatted | "12 AM", "1 PM", etc. | ☐ |

**Acceptance Criteria:**
- ✅ All 24 hours represented
- ✅ Correct peak/slow hour identification
- ✅ Accurate hourly aggregations

---

### 9A.4 Staff Leaderboard Tests

#### TC-9A.4.1: Daily Staff Leaderboard
**Priority:** HIGH
**Preconditions:** Multiple staff members processed orders today

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | GET `/api/analytics/staff/leaderboard?storeId=store-001&period=TODAY` | 200 OK | ☐ |
| 2 | Verify staff rankings | Sorted by sales descending | ☐ |
| 3 | Check performance levels | EXCELLENT/GOOD/AVERAGE/NEEDS_IMPROVEMENT | ☐ |
| 4 | Verify percentage of total sales | Sum equals 100% | ☐ |
| 5 | Check average order values | Calculated per staff | ☐ |

**Acceptance Criteria:**
- ✅ Staff ranked correctly
- ✅ Performance levels assigned
- ✅ Accurate sales attribution

---

#### TC-9A.4.2: Weekly Staff Leaderboard
**Priority:** MEDIUM
**Preconditions:** Staff processed orders this week

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | GET `/api/analytics/staff/leaderboard?storeId=store-001&period=WEEK` | 200 OK | ☐ |
| 2 | Verify 7-day aggregation | Correct date range | ☐ |
| 3 | Check rankings updated | Based on week's performance | ☐ |

---

### 9A.5 Product Analytics Tests

#### TC-9A.5.1: Top Products by Quantity
**Priority:** HIGH
**Preconditions:** Multiple products sold

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | GET `/api/analytics/products/top-selling?sortBy=QUANTITY&period=TODAY` | 200 OK | ☐ |
| 2 | Verify top 20 products returned | Ranked by quantity | ☐ |
| 3 | Check quantity calculations | Accurate item counts | ☐ |
| 4 | Verify revenue percentages | Calculated correctly | ☐ |

**Acceptance Criteria:**
- ✅ Products ranked by quantity
- ✅ Accurate aggregations
- ✅ Top 20 limit enforced

---

#### TC-9A.5.2: Top Products by Revenue
**Priority:** HIGH
**Preconditions:** Multiple products sold

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | GET `/api/analytics/products/top-selling?sortBy=REVENUE&period=TODAY` | 200 OK | ☐ |
| 2 | Verify ranking by revenue | Highest revenue first | ☐ |
| 3 | Check revenue calculations | price × quantity | ☐ |

---

### 9A.6 Payment Integration Tests

#### TC-9A.6.1: Initiate Razorpay Payment
**Priority:** HIGH
**Preconditions:** Order created, total calculated

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | POST `/api/payment/initiate` with order details | 200 OK | ☐ |
| 2 | Verify Razorpay order created | Order ID returned | ☐ |
| 3 | Check amount in paise | Converted correctly (×100) | ☐ |
| 4 | Verify currency INR | Correct currency code | ☐ |

**Test Data:**
```json
{
  "amount": 850.00,
  "currency": "INR",
  "orderId": "ORD-12345",
  "customerId": "customer-001"
}
```

**Acceptance Criteria:**
- ✅ Razorpay order created successfully
- ✅ Amount converted to paise
- ✅ Order ID tracked

---

#### TC-9A.6.2: Verify Payment Signature
**Priority:** HIGH
**Preconditions:** Payment completed via Razorpay

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | POST `/api/payment/verify` with signature data | 200 OK | ☐ |
| 2 | Verify signature validation | HMAC SHA256 check passes | ☐ |
| 3 | Check payment status updated | Order marked as PAID | ☐ |
| 4 | Verify transaction ID saved | Razorpay payment ID stored | ☐ |

**Acceptance Criteria:**
- ✅ Signature validation secure
- ✅ Payment status updated
- ✅ Transaction tracked

---

#### TC-9A.6.3: Handle Payment Failure
**Priority:** MEDIUM
**Preconditions:** Payment initiation attempted

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Simulate Razorpay failure | Error returned | ☐ |
| 2 | Verify order status unchanged | Still PENDING | ☐ |
| 3 | Check error message displayed | User-friendly message | ☐ |

---

### 9A.7 Frontend Chart Tests

#### TC-9A.7.1: Sales Trend Chart Rendering
**Priority:** HIGH
**Preconditions:** AdvancedReportsPage loaded

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Navigate to `/manager/reports/advanced` | Page loads | ☐ |
| 2 | Verify SalesTrendChart visible | Chart renders | ☐ |
| 3 | Check data points displayed | 7 or 30 points visible | ☐ |
| 4 | Toggle between 7/30 days | Chart updates | ☐ |
| 5 | Verify trend indicator | UP/DOWN/FLAT icon shown | ☐ |

**Acceptance Criteria:**
- ✅ Chart renders with Recharts
- ✅ Data toggle works
- ✅ Neumorphic design applied

---

#### TC-9A.7.2: Revenue Breakdown Pie Chart
**Priority:** HIGH
**Preconditions:** Advanced Reports page loaded

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Verify pie chart visible | RevenueBreakdownChart shown | ☐ |
| 2 | Check 3 segments | DINE_IN, PICKUP, DELIVERY | ☐ |
| 3 | Hover over segment | Tooltip shows details | ☐ |
| 4 | Verify percentages labeled | Labels show X.X% | ☐ |

---

#### TC-9A.7.3: Peak Hours Heatmap
**Priority:** HIGH
**Preconditions:** Advanced Reports page loaded

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Verify bar chart visible | PeakHoursHeatmap shown | ☐ |
| 2 | Check color coding | Peak hour green, slow hour red | ☐ |
| 3 | Verify hour labels | "12 AM" to "11 PM" format | ☐ |

---

### 9A.8 Receipt Generator Tests

#### TC-9A.8.1: Generate and Display Receipt
**Priority:** HIGH
**Preconditions:** Order completed and paid

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Click "View Receipt" button | ReceiptGenerator dialog opens | ☐ |
| 2 | Verify order details shown | Number, date, items, totals | ☐ |
| 3 | Check payment info displayed | Method and status | ☐ |
| 4 | Verify store information | Name, address, phone | ☐ |

**Acceptance Criteria:**
- ✅ Receipt dialog opens
- ✅ All details accurate
- ✅ Neumorphic styling applied

---

#### TC-9A.8.2: Print Receipt
**Priority:** MEDIUM
**Preconditions:** Receipt dialog open

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Click "Print Receipt" button | window.print() called | ☐ |
| 2 | Verify print preview | Receipt formatted for print | ☐ |
| 3 | Check print-specific styles | Borders/shadows removed | ☐ |

---

#### TC-9A.8.3: Download Receipt as HTML
**Priority:** MEDIUM
**Preconditions:** Receipt dialog open

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Click "Download" button | HTML file downloads | ☐ |
| 2 | Check filename format | Receipt_ORD-XXX_YYYYMMDD_HHMMSS.html | ☐ |
| 3 | Open downloaded file | Receipt displays correctly | ☐ |

---

### 9A.9 Neumorphic Design Compliance Tests

#### TC-9A.9.1: Chart Components Use Design Tokens
**Priority:** MEDIUM
**Preconditions:** Charts rendered

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Inspect SalesTrendChart | Uses createCard() styling | ☐ |
| 2 | Check line colors | Uses colors.brand.primary | ☐ |
| 3 | Verify RevenueBreakdownChart | Design tokens for colors | ☐ |
| 4 | Check PeakHoursHeatmap | Semantic colors applied | ☐ |

**Acceptance Criteria:**
- ✅ All charts use createCard()
- ✅ No hardcoded color values
- ✅ Proper neumorphic shadows

---

#### TC-9A.9.2: Button Variants Consistent
**Priority:** LOW
**Preconditions:** Receipt and payment UI visible

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Check payment buttons | Use createButtonVariant() | ☐ |
| 2 | Verify receipt buttons | Primary/ghost variants | ☐ |
| 3 | Test hover states | Proper neumorphic animations | ☐ |

---

## 📊 Test Summary Template

| Phase | Total Tests | Passed | Failed | Blocked | Pass Rate |
|-------|-------------|--------|--------|---------|-----------|
| Phase 6 (Kitchen) | 18 | 0 | 0 | 0 | 0% |
| Phase 7 (Inventory) | 22 | 0 | 0 | 0 | 0% |
| Phase 8 (Customer) | 15 | 0 | 0 | 0 | 0% |
| Phase 9 (Delivery) | 20 | 0 | 0 | 0 | 0% |
| Phase 9 (Analytics) | 18 | 0 | 0 | 0 | 0% |
| **Total** | **93** | **0** | **0** | **0** | **0%** |

---

## ✅ Phases 6-9 Completion Criteria

### Phase 6 Sign-Off
- [ ] All 18 tests passed
- [ ] Quality checkpoints functional
- [ ] Equipment monitoring operational
- [ ] Recipe management working
- [ ] Make-table workflow functional
- [ ] Kitchen analytics accurate

### Phase 7 Sign-Off
- [ ] All 22 tests passed
- [ ] Stock tracking accurate
- [ ] Reservation system working
- [ ] Supplier management functional
- [ ] Purchase orders automated
- [ ] Waste tracking complete
- [ ] Low stock alerts working

### Phase 8 Sign-Off
- [ ] All 15 tests passed
- [ ] Customer profiles functional
- [ ] Loyalty program working (4 tiers)
- [ ] Points earning/redemption operational
- [ ] Address management complete
- [ ] Customer analytics accurate

### Phase 9 (Delivery) Sign-Off
- [ ] All 20 tests passed
- [ ] Driver management functional
- [ ] Auto-dispatch intelligent
- [ ] Live tracking real-time
- [ ] Route optimization working
- [ ] Performance tracking accurate
- [ ] Driver app fully functional

### Phase 9 (Analytics) Sign-Off
- [ ] All 18 tests passed
- [ ] Sales trends API working (weekly/monthly)
- [ ] Revenue breakdown accurate
- [ ] Peak hours analysis functional
- [ ] Staff leaderboard ranking correct
- [ ] Product analytics top 20 accurate
- [ ] Razorpay payment integration working
- [ ] Receipt generation functional (print/download)
- [ ] All charts use neumorphic design system
- [ ] Design tokens applied consistently

---

**Next Steps:** Proceed to `05-e2e-scenarios.md` for end-to-end workflow testing.

---

*Phases 6-9 represent advanced operations. Thorough testing ensures production readiness.*
