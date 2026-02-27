# End-to-End Scenario Tests

**Document:** 05-e2e-scenarios.md
**Purpose:** Complete workflow testing across all services and user roles
**Test Priority:** CRITICAL (Validates entire system integration)

---

## 📋 Table of Contents

1. [Scenario Testing Overview](#scenario-testing-overview)
2. [Scenario 1: Complete Customer Order Journey](#scenario-1-complete-customer-order-journey)
3. [Scenario 2: Manager Store Operations](#scenario-2-manager-store-operations)
4. [Scenario 3: Kitchen Workflow](#scenario-3-kitchen-workflow)
5. [Scenario 4: Delivery Workflow](#scenario-4-delivery-workflow)
6. [Scenario 5: Payment & Refund Flow](#scenario-5-payment--refund-flow)
7. [Scenario 6: Inventory Management Cycle](#scenario-6-inventory-management-cycle)
8. [Scenario 7: Customer Loyalty Journey](#scenario-7-customer-loyalty-journey)
9. [Scenario 8: POS Analytics & Advanced Reporting](#scenario-8-pos-analytics--advanced-reporting)

---

## Scenario Testing Overview

### Purpose
End-to-end (E2E) scenarios validate that the entire system works cohesively across all microservices, databases, and user interfaces. Each scenario represents a real-world user journey.

### Test Environment Requirements
- ✅ All 9 microservices running (User, Menu, Order, Payment, Delivery, Customer, Inventory, Kitchen, Analytics)
- ✅ MongoDB and Redis operational
- ✅ Frontend application running
- ✅ WebSocket connections active
- ✅ Test data seeded
- ✅ Razorpay test mode configured

### Success Criteria
- ✅ All steps complete without errors
- ✅ Data consistency across services
- ✅ Real-time updates working
- ✅ UI responsive and error-free
- ✅ Performance acceptable (< 3s for page loads)

---

## Scenario 1: Complete Customer Order Journey

**User Persona:** New Customer
**Goal:** Browse menu, register, order food, pay online, track delivery
**Duration:** ~15 minutes
**Services Involved:** User, Menu, Order, Payment, Delivery, Customer

### Pre-Conditions
- [x] Frontend running on localhost:5173
- [x] All backend services operational
- [x] Menu items seeded (150+ items)
- [x] At least 1 driver available
- [x] Razorpay test mode configured

### Test Steps

| # | Action | Expected Result | Verification | Status |
|---|--------|-----------------|--------------|--------|
| **1. DISCOVERY** |
| 1.1 | Open `http://localhost:5173` | Homepage loads with hero section | Visual check | ☐ |
| 1.2 | Click "View Menu" | Redirects to `/menu` | URL changed | ☐ |
| 1.3 | Browse menu items | 150+ items displayed, categories working | Count items | ☐ |
| 1.4 | Click "View Recipe" on a pizza | Recipe modal opens with ingredients | Recipe visible | ☐ |
| 1.5 | Click "Order Now" | Redirects to login page | Auth required | ☐ |
| **2. REGISTRATION** |
| 2.1 | Click "Register" | Registration form shown | Form appears | ☐ |
| 2.2 | Fill valid details, submit | Account created, redirects to home | User created | ☐ |
| 2.3 | Verify email in DB | User exists in `masova_users` | MongoDB check | ☐ |
| 2.4 | Verify customer profile created | Customer in `masova_customers` | MongoDB check | ☐ |
| 2.5 | Check signup bonus | 100 loyalty points credited | Customer record | ☐ |
| **3. MENU & CART** |
| 3.1 | Navigate to `/customer/menu` | Menu loads | Page shown | ☐ |
| 3.2 | Add "Margherita Pizza" x2 | Cart icon shows (2) | Cart count | ☐ |
| 3.3 | Add "Chicken Biryani" x1 | Cart icon shows (3) | Cart count | ☐ |
| 3.4 | Click cart icon | Cart page loads with 2 items | Items shown | ☐ |
| 3.5 | Update pizza quantity to 3 | Quantity updated, total recalculated | Total changes | ☐ |
| 3.6 | Add special instructions | "Extra spicy" text saved | Instructions field | ☐ |
| **4. CHECKOUT** |
| 4.1 | Click "Proceed to Checkout" | Checkout page loads | Page shown | ☐ |
| 4.2 | Add delivery address | Address form displayed | Form appears | ☐ |
| 4.3 | Fill address, save | Address saved and selected | Address in list | ☐ |
| 4.4 | Review order summary | Items, prices, totals shown | Calculations correct | ☐ |
| 4.5 | Verify calculations | Subtotal + Tax (5%) + Delivery (₹50) = Total | Math check | ☐ |
| 4.6 | Click "Place Order" | Order created, redirects to payment | Order ID shown | ☐ |
| **5. PAYMENT** |
| 5.1 | Verify order in DB | Order status: RECEIVED, payment: PENDING | MongoDB check | ☐ |
| 5.2 | Check predictive notification | Kitchen receives PREDICTIVE_START | WebSocket log | ☐ |
| 5.3 | Razorpay modal opens | Payment UI displayed | Modal visible | ☐ |
| 5.4 | Enter test card (4111 1111 1111 1111) | Card accepted | No errors | ☐ |
| 5.5 | Complete payment | Payment successful callback | Success shown | ☐ |
| 5.6 | Verify payment in DB | Transaction status: COMPLETED | MongoDB check | ☐ |
| 5.7 | Check order updated | Order payment status: COMPLETED | MongoDB check | ☐ |
| 5.8 | Verify predictive confirmation | Kitchen receives PREDICTIVE_CONFIRM | WebSocket log | ☐ |
| 5.9 | Redirect to success page | Order details and tracking shown | Success page | ☐ |
| **6. ORDER TRACKING** |
| 6.1 | Navigate to "My Orders" | Order list displayed | Orders shown | ☐ |
| 6.2 | Click on new order | Order details page | Details visible | ☐ |
| 6.3 | Check status | RECEIVED or PREPARING | Status shown | ☐ |
| 6.4 | Wait 30 seconds | WebSocket updates status automatically | Status changes | ☐ |
| **7. KITCHEN PROCESSING** |
| 7.1 | Open kitchen display (new tab) | Kitchen queue shows new order | Order visible | ☐ |
| 7.2 | Kitchen moves order to PREPARING | Status updated | Status changes | ☐ |
| 7.3 | Check customer tracking updates | Real-time status change | WebSocket working | ☐ |
| 7.4 | Quality checkpoints completed | All marked PASSED | Checkpoints done | ☐ |
| 7.5 | Order moved through OVEN → BAKED | Status progression | All stages | ☐ |
| 7.6 | Prep time calculated | actualPreparationTime set | MongoDB check | ☐ |
| **8. DELIVERY DISPATCH** |
| 8.1 | Order status: BAKED | Ready for dispatch | Status check | ☐ |
| 8.2 | Auto-dispatch called | Driver assigned automatically | Driver assigned | ☐ |
| 8.3 | Verify driver selected | Closest available driver chosen | Driver check | ☐ |
| 8.4 | Order status: DISPATCHED | Status updated | Status changes | ☐ |
| 8.5 | Driver app shows delivery | Driver receives notification | Driver app check | ☐ |
| **9. LIVE TRACKING** |
| 9.1 | Customer clicks "Track Delivery" | Live tracking page opens | Map shown | ☐ |
| 9.2 | Driver location displayed | GPS coordinates shown on map | Location visible | ☐ |
| 9.3 | ETA displayed | Estimated arrival time shown | ETA shown | ☐ |
| 9.4 | Driver contact available | Phone number visible, callable | Contact shown | ☐ |
| 9.5 | Location updates every 10s | Real-time movement via WebSocket | Auto-refresh | ☐ |
| **10. DELIVERY COMPLETION** |
| 10.1 | Driver marks "Delivered" | Order status: DELIVERED | Status changes | ☐ |
| 10.2 | Customer tracking updated | Delivery confirmation shown | Confirmation page | ☐ |
| 10.3 | Loyalty points credited | Points = ₹1 per rupee spent | Points added | ☐ |
| 10.4 | Customer stats updated | totalOrders++, totalSpent increased | Stats check | ☐ |
| 10.5 | Driver earnings calculated | 20% commission added | Driver stats | ☐ |
| **11. POST-DELIVERY** |
| 11.1 | Customer views order history | Completed order shown | Order list | ☐ |
| 11.2 | Order details accessible | Full order information available | Details shown | ☐ |
| 11.3 | Rate driver (optional) | Rating submitted, driver stats updated | Rating saved | ☐ |

### Success Criteria
- ✅ All 60+ steps completed without errors
- ✅ Order created, paid, and delivered successfully
- ✅ Real-time updates working throughout
- ✅ Data consistent across all services
- ✅ Customer loyalty points credited
- ✅ Driver earnings calculated
- ✅ Total time < 15 minutes

### Data Verification Checklist
- [ ] Order in `masova_orders` collection (status: DELIVERED)
- [ ] Transaction in `masova_payments` (status: COMPLETED)
- [ ] Customer in `masova_customers` (points increased)
- [ ] Driver in `masova_users` (delivery count increased)
- [ ] DeliveryTracking in `masova_delivery` (status: COMPLETED)
- [ ] All timestamps recorded correctly

---

## Scenario 2: Manager Store Operations

**User Persona:** Store Manager
**Goal:** Manage daily store operations
**Duration:** ~20 minutes
**Services Involved:** User, Order, Inventory, Payment, Customer

### Test Steps

| # | Action | Expected Result | Status |
|---|--------|-----------------|--------|
| **1. LOGIN & SESSION** |
| 1.1 | Login as manager | Login successful, dashboard shown | ☐ |
| 1.2 | Verify working session started | Session in DB with GPS | ☐ |
| 1.3 | Check manager dashboard | Stats displayed (orders, revenue) | ☐ |
| **2. SESSION MANAGEMENT** |
| 2.1 | Navigate to "Staff Sessions" | Active sessions listed | ☐ |
| 2.2 | View pending approvals | Unapproved sessions shown | ☐ |
| 2.3 | Approve a session | Status: APPROVED, approved by manager | ☐ |
| 2.4 | Reject a session with reason | Status: REJECTED, reason saved | ☐ |
| **3. INVENTORY CHECKS** |
| 3.1 | Navigate to "Inventory" | Inventory dashboard loads | ☐ |
| 3.2 | Check low stock alerts | Items below reorder point highlighted | ☐ |
| 3.3 | View out of stock items | Zero stock items listed | ☐ |
| 3.4 | Adjust stock for an item | Stock updated, history logged | ☐ |
| **4. PURCHASE ORDERS** |
| 4.1 | View auto-generated POs | POs for low stock items listed | ☐ |
| 4.2 | Approve a purchase order | Status: APPROVED, ready to send | ☐ |
| 4.3 | Mark PO as sent to supplier | Status: SENT, sent date recorded | ☐ |
| **5. PAYMENT RECONCILIATION** |
| 5.1 | Navigate to "Payments" | Payment dashboard loads | ☐ |
| 5.2 | View today's transactions | All transactions listed | ☐ |
| 5.3 | Generate daily report | Report shows totals by method | ☐ |
| 5.4 | Mark transactions as reconciled | Reconciliation status updated | ☐ |
| **6. CUSTOMER MANAGEMENT** |
| 6.1 | Navigate to "Customers" | Customer list displayed | ☐ |
| 6.2 | Search for a customer | Search working | ☐ |
| 6.3 | View customer details | Profile, orders, loyalty shown | ☐ |
| 6.4 | Add manager note | Note saved with category | ☐ |
| **7. ANALYTICS REVIEW** |
| 7.1 | View kitchen analytics | Prep time stats shown | ☐ |
| 7.2 | Check staff performance | Performance metrics displayed | ☐ |
| 7.3 | Review delivery analytics | Driver performance shown | ☐ |
| 7.4 | View Advanced Reports page | Sales trends charts displayed | ☐ |
| 7.5 | Check Staff Leaderboard | Rankings with performance levels shown | ☐ |
| 7.6 | Review Product Analytics | Top 20 products with trends displayed | ☐ |
| 7.7 | View Peak Hours Heatmap | 24-hour breakdown visible | ☐ |
| 7.8 | Check Revenue Breakdown | Pie chart by order type shown | ☐ |
| **8. END SHIFT** |
| 8.1 | Clock out | Working session ended | ☐ |
| 8.2 | Verify session duration | Duration calculated correctly | ☐ |

### Success Criteria
- ✅ All manager functions accessible
- ✅ Session management working
- ✅ Inventory operations successful
- ✅ Payment reconciliation complete
- ✅ Analytics accurate

---

## Scenario 3: Kitchen Workflow

**User Persona:** Kitchen Staff
**Goal:** Process orders efficiently through kitchen stages
**Duration:** ~10 minutes
**Services Involved:** Order, Menu

### Test Steps

| # | Action | Expected Result | Status |
|---|--------|-----------------|--------|
| **1. KITCHEN LOGIN** |
| 1.1 | Login as kitchen staff | Kitchen display accessible | ☐ |
| 1.2 | Navigate to kitchen queue | Active orders displayed | ☐ |
| 1.3 | Verify priority sorting | URGENT orders at top | ☐ |
| **2. ORDER PREPARATION** |
| 2.1 | Select first order | Order details shown | ☐ |
| 2.2 | View recipe for items | Recipes accessible | ☐ |
| 2.3 | Start preparation | Status: PREPARING, timestamp set | ☐ |
| 2.4 | Complete prep, move to oven | Status: OVEN, timestamp set | ☐ |
| **3. QUALITY CHECKS** |
| 3.1 | View quality checkpoints | All 4 checkpoints listed | ☐ |
| 3.2 | Pass "Ingredient Quality" | Status: PASSED, notes added | ☐ |
| 3.3 | Pass "Portion Size" | Status: PASSED | ☐ |
| 3.4 | Fail "Temperature" (test) | Status: FAILED, manager alerted | ☐ |
| 3.5 | Re-check and pass | Status updated to PASSED | ☐ |
| 3.6 | Complete final inspection | All checkpoints PASSED | ☐ |
| **4. ORDER COMPLETION** |
| 4.1 | Mark order as BAKED | Status updated, prep time calculated | ☐ |
| 4.2 | Verify actual prep time | Time from RECEIVED to BAKED recorded | ☐ |
| 4.3 | Move to DISPATCHED | Ready for driver pickup | ☐ |
| **5. EQUIPMENT CHECK** |
| 5.1 | View equipment status | All equipment listed | ☐ |
| 5.2 | Check oven temperature | Within target range | ☐ |
| 5.3 | Report broken equipment (test) | Status: BROKEN, manager notified | ☐ |

### Success Criteria
- ✅ Order processed through all kitchen stages
- ✅ Quality checkpoints functional
- ✅ Timestamps accurate
- ✅ Equipment monitoring working

---

## Scenario 4: Delivery Workflow

**User Persona:** Delivery Driver
**Goal:** Complete delivery efficiently
**Duration:** ~8 minutes
**Services Involved:** User, Delivery, Order

### Test Steps

| # | Action | Expected Result | Status |
|---|--------|-----------------|--------|
| **1. DRIVER START** |
| 1.1 | Login to driver app | Driver dashboard shown | ☐ |
| 1.2 | Clock in (GPS required) | Session started, status: ONLINE | ☐ |
| 1.3 | View available for dispatch | Status: AVAILABLE | ☐ |
| **2. DELIVERY ASSIGNMENT** |
| 2.1 | Order auto-dispatched | Driver receives notification | ☐ |
| 2.2 | View delivery details | Customer info, address, order details shown | ☐ |
| 2.3 | Accept delivery | Status: BUSY | ☐ |
| **3. NAVIGATION** |
| 3.1 | Click "Navigate" | Google Maps opens with destination | ☐ |
| 3.2 | View optimized route | Route details shown | ☐ |
| 3.3 | Start journey | Location updates begin | ☐ |
| **4. CUSTOMER CONTACT** |
| 4.1 | Click "Call Customer" | Phone call initiated | ☐ |
| 4.2 | Click "SMS Customer" | SMS app opens with template | ☐ |
| **5. LIVE TRACKING** |
| 5.1 | Location updates sent | Every 10 seconds | ☐ |
| 5.2 | Customer sees live location | Real-time tracking working | ☐ |
| 5.3 | ETA updated dynamically | ETA recalculated based on traffic | ☐ |
| **6. DELIVERY COMPLETION** |
| 6.1 | Arrive at destination | GPS confirms location | ☐ |
| 6.2 | Mark as "Delivered" | Order status: DELIVERED | ☐ |
| 6.3 | Verify earnings updated | 20% commission added | ☐ |
| 6.4 | Performance stats updated | Delivery count++, on-time rate calculated | ☐ |
| **7. DRIVER END SHIFT** |
| 7.1 | Return to dashboard | Today's summary shown | ☐ |
| 7.2 | Clock out | Session ended, status: OFFLINE | ☐ |
| 7.3 | View day's earnings | Total commission displayed | ☐ |

### Success Criteria
- ✅ Auto-dispatch working
- ✅ Live tracking functional
- ✅ Navigation seamless
- ✅ Earnings calculated correctly
- ✅ Performance metrics updated

---

## Scenario 5: Payment & Refund Flow

**User Persona:** Customer & Manager
**Goal:** Complete payment and process refund
**Duration:** ~12 minutes
**Services Involved:** Payment, Order

### Test Steps

| # | Action | Expected Result | Status |
|---|--------|-----------------|--------|
| **PART A: SUCCESSFUL PAYMENT** |
| A.1 | Customer places order | Order created, payment initiated | ☐ |
| A.2 | Razorpay order created | razorpayOrderId generated | ☐ |
| A.3 | Customer completes payment | Payment captured | ☐ |
| A.4 | Signature verified | Verification successful | ☐ |
| A.5 | Order updated | Payment status: COMPLETED | ☐ |
| A.6 | Transaction record created | In `masova_payments` | ☐ |
| **PART B: FAILED PAYMENT** |
| B.1 | Customer uses failed test card | Payment fails | ☐ |
| B.2 | Failure callback received | Transaction status: FAILED | ☐ |
| B.3 | Customer redirected | Failure page shown | ☐ |
| B.4 | Retry option available | Can retry payment | ☐ |
| **PART C: REFUND PROCESSING** |
| C.1 | Manager initiates refund | Refund request created | ☐ |
| C.2 | Razorpay refund API called | Refund initiated | ☐ |
| C.3 | Refund record created | In `masova_payments` | ☐ |
| C.4 | Webhook received | Refund status: PROCESSED | ☐ |
| C.5 | Customer notified | Refund confirmation sent | ☐ |
| C.6 | Transaction reconciliation | Refund deducted from daily total | ☐ |

### Success Criteria
- ✅ Payment flow complete
- ✅ Failed payments handled
- ✅ Refunds processed correctly
- ✅ All statuses tracked
- ✅ Reconciliation accurate

---

## Scenario 6: Inventory Management Cycle

**User Persona:** Store Manager
**Goal:** Complete inventory replenishment cycle
**Duration:** ~15 minutes
**Services Involved:** Inventory

### Test Steps

| # | Action | Expected Result | Status |
|---|--------|-----------------|--------|
| **1. LOW STOCK DETECTION** |
| 1.1 | Stock falls below reorder point | Alert triggered | ☐ |
| 1.2 | Manager views low stock alerts | Items listed | ☐ |
| **2. AUTO-GENERATE PO** |
| 2.1 | Click "Auto-Generate POs" | POs created for all low stock items | ☐ |
| 2.2 | Verify quantities | reorderQuantity used | ☐ |
| 2.3 | Check supplier selection | Preferred suppliers chosen | ☐ |
| 2.4 | Review PO details | Items, quantities, costs shown | ☐ |
| **3. PO APPROVAL** |
| 3.1 | Approve purchase order | Status: APPROVED | ☐ |
| 3.2 | Send to supplier | Status: SENT, email sent (if configured) | ☐ |
| **4. RECEIVE SHIPMENT** |
| 4.1 | Supplier delivers goods | Manager receives shipment | ☐ |
| 4.2 | Mark PO as received | Status: RECEIVED | ☐ |
| 4.3 | Update inventory quantities | Stock increased automatically | ☐ |
| 4.4 | Verify available stock | availableQuantity updated | ☐ |
| 4.5 | Supplier performance updated | On-time delivery tracked | ☐ |
| **5. WASTE TRACKING** |
| 5.1 | Record spoiled items | Waste record created | ☐ |
| 5.2 | Specify reason | SPOILAGE selected | ☐ |
| 5.3 | Inventory reduced | Stock adjusted | ☐ |
| 5.4 | Waste cost calculated | Cost tracked | ☐ |
| **6. ANALYTICS** |
| 6.1 | View waste report | Total waste cost shown | ☐ |
| 6.2 | Identify top wasted items | Items sorted by waste amount | ☐ |
| 6.3 | Check preventable waste | Recommendations provided | ☐ |

### Success Criteria
- ✅ Low stock detected
- ✅ PO auto-generated
- ✅ Approval workflow functional
- ✅ Receiving process smooth
- ✅ Inventory auto-updated
- ✅ Waste tracking accurate

---

## Scenario 7: Customer Loyalty Journey

**User Persona:** Returning Customer
**Goal:** Earn and redeem loyalty points
**Duration:** ~10 minutes
**Services Involved:** Customer, Order

### Test Steps

| # | Action | Expected Result | Status |
|---|--------|-----------------|--------|
| **1. INITIAL STATE** |
| 1.1 | Customer views profile | Loyalty tier: BRONZE (startup) | ☐ |
| 1.2 | Check points balance | 100 points (signup bonus) | ☐ |
| **2. EARN POINTS - ORDER 1** |
| 2.1 | Place order worth ₹500 | Order completed | ☐ |
| 2.2 | Points credited | 500 points (1 per rupee) | ☐ |
| 2.3 | Check balance | 600 points total | ☐ |
| 2.4 | Verify tier | Still BRONZE (need 500+ for SILVER) | ☐ |
| **3. TIER PROGRESSION** |
| 3.1 | Place order worth ₹1000 | Order completed | ☐ |
| 3.2 | Points credited | 1000 points | ☐ |
| 3.3 | Check balance | 1600 points total | ☐ |
| 3.4 | Verify tier upgraded | GOLD (1500-4999 points) | ☐ |
| 3.5 | Check benefits | 10% bonus points on future orders | ☐ |
| **4. REDEEM POINTS** |
| 4.1 | Place new order worth ₹800 | Order in cart | ☐ |
| 4.2 | Apply 500 loyalty points | ₹500 discount applied | ☐ |
| 4.3 | Complete order | Order placed with discount | ☐ |
| 4.4 | Verify points deducted | 500 points redeemed | ☐ |
| 4.5 | Verify new points earned | 800 points + 10% bonus = 880 points | ☐ |
| 4.6 | Check new balance | 1600 - 500 + 880 = 1980 points | ☐ |
| **5. BIRTHDAY BONUS** |
| 5.1 | Update birthday to today | Birthday saved | ☐ |
| 5.2 | System detects birthday | Birthday bonus triggered | ☐ |
| 5.3 | Points credited | 200 bonus points | ☐ |
| 5.4 | Check new balance | 2180 points | ☐ |
| **6. CUSTOMER ANALYTICS** |
| 6.1 | View order history | All orders listed | ☐ |
| 6.2 | Check total spending | ₹2300 lifetime value | ☐ |
| 6.3 | View favorite items | Most ordered items shown | ☐ |

### Success Criteria
- ✅ Points earned correctly (1 per rupee)
- ✅ Tier calculation automatic
- ✅ Redemption working
- ✅ Bonus points applied (tier benefits)
- ✅ Birthday bonus credited
- ✅ History and stats accurate

---

## Scenario 8: POS Analytics & Advanced Reporting

**User Persona:** Store Manager / POS Staff
**Goal:** Access comprehensive analytics and generate reports
**Duration:** ~15 minutes
**Services Involved:** Analytics, Payment, Order

### Pre-Conditions
- [x] Analytics Service running on port 8085
- [x] Payment Service running with Razorpay configured
- [x] Order history with sample data available
- [x] Frontend analytics pages built

### Test Steps

| # | Action | Expected Result | Status |
|---|--------|-----------------|--------|
| **1. POS DASHBOARD METRICS** |
| 1.1 | Login to POS system | POS dashboard loads | ☐ |
| 1.2 | View Today's Sales tile | Shows total with % vs yesterday | ☐ |
| 1.3 | Check Average Order Value | Displays AOV with trend indicator | ☐ |
| 1.4 | View Last Year Comparison | Shows same day last year comparison | ☐ |
| 1.5 | Check Active Deliveries | Count of in-progress deliveries | ☐ |
| 1.6 | Verify auto-refresh | Metrics update every 60 seconds | ☐ |
| **2. ADVANCED REPORTS PAGE** |
| 2.1 | Navigate to Advanced Reports | Page loads with charts | ☐ |
| 2.2 | View Weekly Sales Trend | Line chart with 7 days data | ☐ |
| 2.3 | Switch to Monthly view | Chart updates to 30 days | ☐ |
| 2.4 | Check percentage changes | Up/down indicators displayed | ☐ |
| 2.5 | View Revenue Breakdown | Pie chart by order type | ☐ |
| 2.6 | Verify dine-in/pickup/delivery | All three segments shown | ☐ |
| 2.7 | View Peak Hours Heatmap | 24-hour bar chart displayed | ☐ |
| 2.8 | Identify busiest hour | Highest bar highlighted | ☐ |
| **3. STAFF LEADERBOARD** |
| 3.1 | Navigate to Staff Leaderboard | Rankings displayed | ☐ |
| 3.2 | View Today's leaderboard | Staff sorted by sales | ☐ |
| 3.3 | Check performance levels | Badges (Gold/Silver/Bronze) shown | ☐ |
| 3.4 | View sales generated | Total sales per staff member | ☐ |
| 3.5 | Check average order value | AOV per staff displayed | ☐ |
| 3.6 | View % contribution | Percentage of total sales | ☐ |
| 3.7 | Switch to Weekly view | Data updates for past week | ☐ |
| 3.8 | Switch to Monthly view | Data updates for past month | ☐ |
| **4. PRODUCT ANALYTICS** |
| 4.1 | Navigate to Product Analytics | Top products page loads | ☐ |
| 4.2 | View Top 20 products | List with rankings | ☐ |
| 4.3 | Sort by Quantity | Products sorted by units sold | ☐ |
| 4.4 | Sort by Revenue | Products sorted by revenue | ☐ |
| 4.5 | Check trend indicators | UP/DOWN/STABLE/NEW badges | ☐ |
| 4.6 | View revenue percentages | % contribution to total | ☐ |
| 4.7 | Toggle period filters | Today/Week/Month options | ☐ |
| **5. PAYMENT INTEGRATION** |
| 5.1 | Create new order in POS | Order panel populated | ☐ |
| 5.2 | Add customer and items | Cart total calculated | ☐ |
| 5.3 | Select CASH payment | Immediate processing | ☐ |
| 5.4 | Complete CASH order | Order status: COMPLETED | ☐ |
| 5.5 | Create another order | New order in system | ☐ |
| 5.6 | Select CARD payment | Razorpay modal opens | ☐ |
| 5.7 | Enter test card details | Card: 4111 1111 1111 1111 | ☐ |
| 5.8 | Complete payment | Payment verified successfully | ☐ |
| 5.9 | Verify signature validation | Backend signature check passed | ☐ |
| 5.10 | Check UPI option | UPI payment method available | ☐ |
| 5.11 | Check WALLET option | Wallet payment method available | ☐ |
| **6. RECEIPT GENERATION** |
| 6.1 | After order completion | Receipt generator displayed | ☐ |
| 6.2 | View receipt layout | Store info, items, payment details | ☐ |
| 6.3 | Click "Print Receipt" | Print dialog opens | ☐ |
| 6.4 | Click "Download HTML" | Receipt downloads as HTML file | ☐ |
| 6.5 | Verify neumorphic design | Receipt uses design tokens | ☐ |
| **7. ANALYTICS API VERIFICATION** |
| 7.1 | Check browser console | No API errors | ☐ |
| 7.2 | Verify RTK Query caching | API calls cached properly | ☐ |
| 7.3 | Test data refresh | Manual refresh updates data | ☐ |
| 7.4 | Check Redis caching | Backend uses cached data | ☐ |
| 7.5 | Verify response times | All API calls < 1 second | ☐ |

### API Endpoints Tested
- ✅ `GET /api/analytics/store/{storeId}/sales/today`
- ✅ `GET /api/analytics/store/{storeId}/avgOrderValue/today`
- ✅ `GET /api/analytics/sales/trends/{period}`
- ✅ `GET /api/analytics/sales/breakdown/order-type`
- ✅ `GET /api/analytics/sales/peak-hours`
- ✅ `GET /api/analytics/staff/leaderboard`
- ✅ `GET /api/analytics/products/top-selling`
- ✅ `POST /api/payments/initiate`
- ✅ `POST /api/payments/verify`

### Success Criteria
- ✅ All analytics charts rendering correctly
- ✅ Real-time data updates working
- ✅ Staff leaderboard calculations accurate
- ✅ Product analytics with correct trends
- ✅ Payment integration with all methods (CASH, CARD, UPI, WALLET)
- ✅ Receipt generation and download functional
- ✅ Neumorphic design consistent across all components
- ✅ API response times < 1 second
- ✅ Redis caching reducing database load

### Data Verification Checklist
- [ ] Analytics data matches order records in MongoDB
- [ ] Staff performance calculations correct
- [ ] Product rankings accurate
- [ ] Payment transactions recorded properly
- [ ] Razorpay orders created with correct amounts
- [ ] Receipt data matches order details
- [ ] Cache invalidation working (Redis TTL)

---

## 📊 E2E Testing Summary

### Scenario Completion Tracking

| Scenario | Duration | Steps | Status | Pass/Fail | Notes |
|----------|----------|-------|--------|-----------|-------|
| 1. Customer Order Journey | 15 min | 60+ | ☐ | - | Full lifecycle |
| 2. Manager Operations | 20 min | 45+ | ☐ | - | Daily ops |
| 3. Kitchen Workflow | 10 min | 25+ | ☐ | - | Order processing |
| 4. Delivery Workflow | 8 min | 30+ | ☐ | - | Driver journey |
| 5. Payment & Refund | 12 min | 20+ | ☐ | - | Payment flows |
| 6. Inventory Cycle | 15 min | 35+ | ☐ | - | Replenishment |
| 7. Loyalty Journey | 10 min | 25+ | ☐ | - | Points & tiers |
| 8. POS Analytics & Reporting | 15 min | 55+ | ☐ | - | Analytics & payments |

**Total Test Time:** ~105 minutes
**Total Steps:** 295+

---

## ✅ E2E Testing Sign-Off Criteria

### Critical Requirements
- [ ] All 8 scenarios pass without errors
- [ ] Data consistency verified across all services
- [ ] Real-time updates working in all scenarios
- [ ] No data loss or corruption
- [ ] Performance acceptable (page loads < 3s)
- [ ] WebSocket connections stable
- [ ] All user roles functional

### Integration Points Verified
- [ ] User Service ↔ Order Service
- [ ] Order Service ↔ Payment Service
- [ ] Order Service ↔ Inventory Service
- [ ] Order Service ↔ Delivery Service
- [ ] Customer Service ↔ Order Service
- [ ] Analytics Service ↔ Order Service
- [ ] Analytics Service ↔ User Service
- [ ] Payment Service ↔ Razorpay Gateway
- [ ] All services ↔ API Gateway
- [ ] All services ↔ MongoDB
- [ ] Caching services ↔ Redis

### UX/UI Validation
- [ ] Responsive design on all screen sizes
- [ ] Neumorphic design consistent
- [ ] Loading states and feedback clear
- [ ] Error handling graceful
- [ ] Navigation intuitive

---

**Next Steps:** Proceed to `06-performance-testing.md` for performance validation and automation setup.

---

*E2E scenarios validate the complete system. All must pass before production deployment.*
