# MaSoVa Restaurant Management System - User Manuals
**Version:** 1.0
**Last Updated:** October 23, 2025

---

## 📚 Table of Contents

1. [POS System Manual](#pos-system-manual)
2. [Kitchen Display Manual](#kitchen-display-manual)
3. [Driver Application Manual](#driver-application-manual)
4. [Manager Dashboard Manual](#manager-dashboard-manual)
5. [Customer App Manual](#customer-app-manual)
6. [Troubleshooting](#troubleshooting)

---

# POS System Manual

**Target Users:** Staff, Cashiers, Managers
**Access URL:** `http://yourdomain.com/pos`

## Overview

The POS (Point of Sale) System is the primary interface for taking customer orders in-store. It features a 3-column layout optimized for fast order entry and checkout.

---

## Getting Started

### Login
1. Navigate to `/login`
2. Enter your staff email and password
3. Click "Sign In"
4. You'll be redirected to POS Dashboard

**First Time Login:**
- Email: Provided by your manager
- Default Password: Change immediately after first login

---

## Dashboard Layout

The POS Dashboard has 4 main sections:

### 1. **Top Bar (Header)**
- **User Info:** Shows your name and store ID
- **Order Count Badge:** Shows number of items in current order
- **Navigation Buttons:**
  - History (F2): View past orders
  - Reports (F3): Manager only - view sales reports
  - Manager Dashboard: Manager only - access full dashboard
  - Logout: End your session

### 2. **Metrics Tiles**
Located below the header, showing real-time data:
- **Today's Sales:** Total sales vs yesterday (with percentage change)
- **Average Order Value:** Current avg order value with trend
- **Last Year:** Sales comparison with same day last year
- **Active Deliveries:** Number of orders out for delivery

*Metrics auto-refresh every 30-60 seconds*

### 3. **Three-Column Work Area**

**LEFT Column - Menu Panel:**
- Search bar for quick item lookup
- Category filters (Pizza, Biryani, Breads, Beverages, etc.)
- Menu items with images, prices, and "Add to Order" buttons
- Scrollable list of all available items

**CENTER Column - Order Panel:**
- Current order items list
- Quantity adjustment (+/- buttons)
- Special instructions field for each item
- Order type selector (Dine-In, Pickup, Delivery)
- Table selector (for Dine-In orders)
- Subtotal, tax, and total display
- Clear Order button
- Payment method selector at bottom

**RIGHT Column - Customer Panel:**
- Customer information form
- Delivery address (for delivery orders)
- Payment details
- Order summary
- **Place Order** button (or Ctrl+Enter)

### 4. **Keyboard Shortcuts Bar**
Located at bottom, shows available shortcuts

---

## Creating Orders

### Walk-In / Dine-In Order

**Step 1: Select Menu Items**
1. Browse categories or use search bar
2. Click "Add to Order" on desired items
3. Items appear in center Order Panel
4. Adjust quantities using +/- buttons
5. Add special instructions if needed (e.g., "Extra cheese", "No onions")

**Step 2: Set Order Type**
1. In Order Panel, select "Dine-In"
2. Table selector appears
3. Choose table number (e.g., "Table 5")

**Step 3: Customer Information**
1. In Customer Panel (right), enter:
   - Customer Name: "John Doe"
   - Phone Number: "+91 9876543210" (optional)

**Step 4: Payment**
1. Scroll down in Customer Panel
2. Select payment method:
   - CASH
   - CARD
   - UPI
   - WALLET
3. Review order summary:
   - Subtotal: Sum of all items
   - Tax (9%): Automatically calculated
   - **Total Amount:** Final amount

**Step 5: Submit Order**
1. Click "Place Order" button (or press **Ctrl+Enter**)
2. Success notification appears
3. Order number displayed (e.g., "ORD-001234")
4. Order panel automatically clears for next order

**Result:**
- Order sent to Kitchen Display
- Receipt can be printed
- Order appears in Order History

---

### Pickup Order

Same as Dine-In, but:
1. Select "Pickup" as order type
2. No table selection needed
3. Enter customer phone number (important for pickup notification)
4. Estimated pickup time displayed

---

### Delivery Order

**Step 1-3:** Same as above (add items, select "Delivery")

**Step 4: Delivery Address**
1. In Customer Panel, delivery address fields appear
2. Enter complete address:
   - Street Address: "123 Main Street, Apartment 4B"
   - City: "Hyderabad"
   - State: "Telangana"
   - Pincode: "500001"
3. Verify customer phone number (required for driver contact)

**Step 5: Payment & Delivery Fee**
1. **Delivery Fee:** ₹40 automatically added
2. Select payment method:
   - ONLINE (prepaid)
   - CASH_ON_DELIVERY
3. Review total including delivery fee

**Step 6: Submit**
1. Place order
2. Order goes to kitchen
3. When ready, manager/staff assigns driver
4. Driver receives delivery notification

---

## Keyboard Shortcuts

Boost your efficiency with these shortcuts:

| Shortcut | Action |
|----------|--------|
| **F1** | New Order (clears current order) |
| **F2** | View Order History |
| **F3** | View Reports (Manager only) |
| **ESC** | Clear current order |
| **Ctrl+Enter** | Submit order (if valid) |

**Pro Tip:** Use keyboard shortcuts for hands-free workflow!

---

## Order History

**Access:** Click History button or press **F2**

### Features:
- **Search:** Find orders by order number, customer name, or phone
- **Filters:**
  - Order Type: All, Dine-In, Pickup, Delivery
  - Status: All, Received, Preparing, Completed, Cancelled
  - Date Range: Today, This Week, This Month, Custom
- **Order Details:** Click any order to view full details
- **Reorder:** Duplicate past orders for repeat customers
- **Print Receipt:** Reprint receipts for any order

### Understanding Order Status:
- **RECEIVED:** Order just placed, sent to kitchen
- **PREPARING:** Kitchen started preparing
- **COOKING:** Food is cooking
- **READY:** Order ready (for pickup) or ready for delivery
- **OUT_FOR_DELIVERY:** Driver has order
- **DELIVERED:** Successfully delivered
- **COMPLETED:** Order finished
- **CANCELLED:** Order cancelled

---

## Reports (Manager Only)

**Access:** Click Reports button or press **F3**

### Available Reports:
1. **Daily Sales Summary:**
   - Total sales, order count, average order value
   - Breakdown by order type
   - Hourly sales chart

2. **Staff Performance:**
   - Orders processed per staff member
   - Sales generated
   - Average order value
   - Hours worked

3. **Payment Methods:**
   - Cash vs Card vs Online breakdown
   - Payment trends

4. **Product Performance:**
   - Best-selling items
   - Category-wise sales
   - Low-performing items

**Date Range Selector:** Choose period (Today, Week, Month, Custom)

---

## Tips & Best Practices

### Speed Tips:
1. **Learn keyboard shortcuts** - Saves clicks!
2. **Use search** instead of browsing categories
3. **Memorize popular items** for quick add
4. **Ctrl+Enter** to submit orders without mouse

### Accuracy Tips:
1. **Always verify** customer phone number for pickup/delivery
2. **Double-check** delivery addresses (complete street, pincode)
3. **Confirm payment method** with customer before submitting
4. **Read back** order to customer before placing

### Common Mistakes to Avoid:
- ❌ Forgetting to select table number for dine-in orders
- ❌ Entering incomplete delivery addresses
- ❌ Not adding special instructions from customers
- ❌ Selecting wrong payment method

---

## Troubleshooting

**Problem:** Menu items not loading
- **Solution:** Check internet connection. Refresh page (F5). Contact manager if issue persists.

**Problem:** "Place Order" button disabled
- **Solution:** Ensure all required fields filled:
  - At least one item in order
  - Customer name entered
  - Table selected (dine-in) or address entered (delivery)
  - Payment method selected

**Problem:** Metrics not updating
- **Solution:** Metrics auto-refresh every minute. If stuck, refresh page.

**Problem:** Order didn't submit
- **Solution:** Check for error message. Verify all fields. Try again. If fails, note order details and contact IT support.

---

# Kitchen Display Manual

**Target Users:** Kitchen Staff, Cooks, Kitchen Managers
**Access URL:** `http://yourdomain.com/kitchen`

## Overview

The Kitchen Display System (KDS) is a real-time order management board that shows all active orders and their preparation stages. It uses a Kanban-style 5-column layout.

---

## Dashboard Layout

### The 5 Stages:

1. **RECEIVED** (New Orders)
   - Orders just placed from POS or customer app
   - Action: Review order and click "Start Preparing"

2. **PREPARING** (Prep Stage)
   - Orders being prepared (washing, cutting, assembling)
   - Action: Complete prep and click "Start Cooking"

3. **COOKING** (Cooking Stage)
   - Orders in oven/on stove
   - **7-minute oven timer** automatically starts
   - Timer counts down on order card
   - Action: When cooked, click "Mark Ready"

4. **READY** (Ready for Pickup/Delivery)
   - Orders fully prepared
   - For dine-in: Server delivers to table
   - For delivery: Waiting for driver assignment
   - Action: Move to Completed or assign driver

5. **COMPLETED** (Archived)
   - Orders delivered, served, or picked up
   - Kept for reference

---

## Understanding Order Cards

Each order card displays:

**Header:**
- Order Number: ORD-001234
- Order Type Icon:
  - 🍽️ Dine-In (table number shown)
  - 📦 Pickup
  - 🚗 Delivery
- Timer: Minutes since order placed

**Body:**
- **Items List:** Item names, quantities
  - Example: "2x Margherita Pizza"
  - Special instructions in red/bold
- **Customer Name**
- **Timestamp:** Time order placed

**Footer:**
- Status action buttons
- Urgent indicator (if order > 15 minutes old)

---

## Moving Orders Through Stages

### Method 1: Button Click
1. Find order card in current stage
2. Click action button:
   - "Start Preparing"
   - "Start Cooking"
   - "Mark Ready"
   - "Complete"
3. Order automatically moves to next column

### Method 2: Drag and Drop
1. Click and hold order card
2. Drag to desired column
3. Release to drop
4. Order status updates automatically

---

## The Oven Timer Feature

**Purpose:** Ensure pizzas/baked items don't overcook

**How It Works:**
1. When order moved to **COOKING** stage, 7-minute timer starts
2. Timer displays on order card: `7:00` → `6:59` → ... → `0:00`
3. Counts down every second
4. When timer reaches **0:00**:
   - Visual alert (card changes color)
   - Audio alert (if enabled)
   - Indicates item ready to remove from oven

**Note:** Timer is a guideline. Experienced cooks can adjust based on actual cooking progress.

---

## Real-Time Updates

The Kitchen Display automatically refreshes every **5 seconds** to show:
- New orders from POS/customer app
- Status changes made by other staff
- Driver assignments
- Order cancellations

**You don't need to manually refresh the page!**

---

## Priority Handling

### Urgent Orders (Red Highlight)
Orders older than **15 minutes** show:
- Red border
- Urgent badge
- Move to top of column

**Action:** Prioritize these orders to avoid customer complaints.

### Multiple Orders
When screen is full:
- **Oldest orders** appear at top
- Scroll within each column to see all orders
- Focus on top orders first

---

## Driver Assignment (Delivery Orders)

When delivery order reaches **READY** stage:

1. Click "Assign Driver" button on order card
2. Dropdown shows available drivers:
   - Online drivers only
   - Shows current status (Available, On Delivery)
3. Select driver
4. Order status changes to **OUT_FOR_DELIVERY**
5. Order moves to driver's active deliveries
6. Driver receives notification

---

## Common Workflows

### Workflow 1: Dine-In Order
```
RECEIVED → Start Preparing
  ↓
PREPARING → (prep ingredients) → Start Cooking
  ↓
COOKING → (7min oven timer) → Mark Ready
  ↓
READY → Server delivers to table → Move to Completed
```

### Workflow 2: Delivery Order
```
RECEIVED → Start Preparing
  ↓
PREPARING → Start Cooking
  ↓
COOKING → Mark Ready
  ↓
READY → Assign Driver → Status: OUT_FOR_DELIVERY
  ↓
Driver marks delivered → Completed
```

---

## Tips & Best Practices

### Efficiency Tips:
1. **Keep RECEIVED column empty** - Start orders immediately
2. **Don't let orders sit in READY** - Assign drivers quickly
3. **Use timer wisely** - Don't rely solely on it; check food visually
4. **Read special instructions carefully** - Highlighted in red

### Quality Tips:
1. **Verify items** before moving to next stage
2. **Double-check special requests** (no onions, extra cheese, etc.)
3. **Ensure presentation** before marking ready
4. **Communicate with team** for large orders

### Common Mistakes to Avoid:
- ❌ Missing special instructions
- ❌ Moving orders too quickly without proper prep
- ❌ Forgetting to assign driver for delivery orders
- ❌ Letting urgent orders (>15 min) pile up

---

## Troubleshooting

**Problem:** New orders not appearing
- **Solution:** Check internet connection. Wait 5 seconds (auto-refresh). If issue persists, manually refresh page (F5).

**Problem:** Can't move order to next stage
- **Solution:** Click directly on the button. If button disabled, order may be locked by another user. Try again in a few seconds.

**Problem:** Oven timer not starting
- **Solution:** Ensure order fully moved to COOKING column. If timer still stuck, note time manually and continue.

**Problem:** Can't assign driver
- **Solution:** Ensure drivers are clocked in and online. Check with manager if no drivers available.

---

# Driver Application Manual

**Target Users:** Delivery Drivers
**Access URL:** `http://yourdomain.com/driver`

## Overview

The Driver App is a mobile-first application for managing deliveries. It includes GPS tracking, real-time order updates, and earnings tracking.

---

## Getting Started

### First Time Setup

1. **Login:**
   - Navigate to `/login`
   - Enter driver email and password
   - Click "Sign In"

2. **Allow Location Access:**
   - App will request location permission
   - **Important:** Click "Allow" for GPS features to work
   - Location used for clock in/out and delivery tracking

3. **Dashboard Loads:**
   - Home screen appears
   - Bottom navigation with 4 tabs visible

---

## Bottom Navigation

The app has 4 main tabs:

| Tab | Icon | Purpose |
|-----|------|---------|
| **Home** | 🏠 | Clock in/out, today's stats, session info |
| **Active** | 🚗 | Current deliveries assigned to you |
| **History** | 📜 | Past deliveries, earnings summary |
| **Profile** | 👤 | Your info, performance stats, settings |

---

## Home Tab (Clock In/Out)

### Clocking In

1. Tap **"Clock In"** button
2. App captures your GPS location
3. Session timer starts
4. Status changes to **"Online"**
5. You can now receive delivery assignments

**Session Info Displayed:**
- Session duration (live timer)
- Today's deliveries count
- Today's earnings
- Distance covered

### Changing Status

**Status Toggle:**
- **Available:** Ready for deliveries (green)
- **On Break:** Temporarily unavailable (yellow)
- **Offline:** Not receiving orders (gray)

**How to Change:**
1. Tap status chip at top right
2. Select new status
3. Confirmation message appears

**Note:** Set "On Break" during lunch/rest. Set "Offline" before clocking out.

### Clocking Out

1. Ensure all active deliveries completed
2. Tap **"Clock Out"** button
3. App captures GPS location
4. Session ends
5. Summary displayed:
   - Total deliveries
   - Total earnings
   - Total distance
   - Total time

---

## Active Tab (Current Deliveries)

### Viewing Assigned Orders

When kitchen assigns delivery to you:
- Order automatically appears in Active tab
- Badge on Active icon shows count
- Push notification sent (if enabled)

### Order Card Information:

**Header:**
- Order Number: ORD-001234
- Estimated delivery time
- Order value

**Customer Info:**
- Name
- Phone number
- Full delivery address
- Special delivery instructions (if any)

**Order Items:**
- List of items in order
- Quantities
- Special instructions

**Action Buttons:**
- 📍 **Navigate:** Opens Google Maps with customer address
- 📞 **Call Customer:** Opens phone dialer
- ✅ **Mark as Delivered:** Completes delivery

---

### Delivery Process

**Step 1: Review Order**
1. Read customer address carefully
2. Note any special instructions
3. Verify items in order

**Step 2: Navigate to Customer**
1. Tap **"Navigate"** button
2. Google Maps opens with destination
3. Follow directions to customer location

**Alternative:** If you know the area, you can navigate manually

**Step 3: Contact Customer (If Needed)**
1. Tap **"Call Customer"** button
2. Phone dialer opens with number
3. Call if:
   - Can't find address
   - Running late
   - Need gate code/apartment number
   - Customer requested call on arrival

**Step 4: Deliver Order**
1. Arrive at customer location
2. Confirm customer identity
3. Hand over order
4. Collect payment (if Cash on Delivery)

**Step 5: Mark as Delivered**
1. Tap **"Mark as Delivered"** button
2. Confirmation dialog appears
3. Confirm delivery
4. Order moves to History tab
5. Earnings updated
6. Ready for next delivery

---

## History Tab (Past Deliveries)

### View Past Deliveries

**Filters:**
- **Today:** Deliveries completed today
- **This Week:** Last 7 days
- **This Month:** Current month
- **Custom:** Select date range

**Search:**
- Search by order number
- Search by customer name

### Order Details

Tap any completed order to view:
- Full order information
- Customer details
- Delivery timestamp
- Earnings for that delivery
- Distance traveled
- Time taken

### Earnings Summary

At top of History tab:
- **Today:** Total earnings today
- **This Week:** Earnings this week
- **This Month:** Total monthly earnings

---

## Profile Tab

### Your Information:
- Driver name
- Employee ID
- Phone number
- Store assigned
- Vehicle type
- Vehicle number

### Performance Stats:
- **Total Deliveries:** All-time count
- **Success Rate:** Percentage of successful deliveries
- **Average Rating:** Customer ratings (if enabled)
- **Total Distance:** Kilometers driven

### Session History:
- List of past work sessions
- Clock in/out times
- Hours worked per session
- Earnings per session

---

## Tips & Best Practices

### Efficiency Tips:
1. **Keep status updated** - Set "On Break" when unavailable
2. **Plan routes** - If multiple deliveries, optimize route
3. **Call ahead** if address unclear
4. **Use navigation** - Google Maps provides traffic updates
5. **Check order before leaving** - Verify all items present

### Safety Tips:
1. **Drive safely** - No rushing, speed limits matter
2. **Use phone mount** - Hands-free navigation
3. **Park legally** - Avoid fines
4. **Be aware at night** - Stay visible, use flashlight if needed
5. **Emergency contacts** - Save manager's number

### Customer Service:
1. **Be polite** - Greet customers warmly
2. **Professional appearance** - Wear clean uniform
3. **Handle food carefully** - Keep orders upright, avoid spills
4. **Communication** - Call if running late or lost
5. **Collect feedback** - Note any customer complaints for manager

### Earnings Tips:
1. **Peak hours** - More orders during lunch (12-2) and dinner (7-10)
2. **Minimize downtime** - Return to hotspot areas between deliveries
3. **Maintain vehicle** - Avoid breakdowns
4. **Track expenses** - Log fuel costs for tax purposes

---

## Troubleshooting

**Problem:** GPS not working
- **Solution:** Check location permissions in phone settings. Enable for browser/app. Restart app.

**Problem:** No orders appearing
- **Solution:** Ensure you're clocked in and status is "Available". Check with manager if issue persists.

**Problem:** Can't call customer
- **Solution:** Verify phone dialer works. If customer number incorrect, contact store.

**Problem:** "Mark as Delivered" not working
- **Solution:** Check internet connection. Try again. If fails, complete delivery and update status later or call manager.

**Problem:** Earnings not updating
- **Solution:** Earnings calculate when order marked delivered. Wait a few seconds. If still wrong, contact manager for correction.

---

# Manager Dashboard Manual

**Target Users:** Store Managers, Assistant Managers
**Access URL:** `http://yourdomain.com/manager`

## Overview

The Manager Dashboard provides comprehensive oversight of store operations, including sales analytics, staff management, and performance metrics.

---

## Dashboard Sections

### 1. Sales Overview
- **Today's Sales:** Real-time sales total
- **Orders Count:** Total orders today
- **Average Order Value:** Current AOV
- **Comparison Metrics:** vs Yesterday, vs Last Week, vs Last Year

**Charts:**
- Hourly sales trend (line chart)
- Order type distribution (pie chart)
- Payment method breakdown

### 2. Order Statistics
- **Active Orders:** Currently being prepared/delivered
- **Completed Orders:** Finished orders today
- **Cancelled Orders:** Cancelled count and reasons
- **Average Preparation Time:** Kitchen efficiency metric

### 3. Staff Performance
**Table View:**
- Staff Name
- Orders Processed
- Sales Generated
- Average Order Value
- Hours Worked
- Performance Rating

**Sort by:** Any column
**Filter by:** Role, Status

### 4. Driver Management
- **Online Drivers:** Count of clocked-in drivers
- **Available Drivers:** Ready for assignment
- **On Delivery:** Currently delivering
- **Offline Drivers:** Not working

**Driver List:**
- Name, status, current delivery, earnings today

### 5. Inventory Alerts (If Enabled)
- Low stock items
- Out of stock items
- Reorder suggestions

---

## Common Tasks

### Assign Driver to Order
1. Navigate to Active Orders section
2. Find delivery order marked "READY"
3. Click "Assign Driver" button
4. Select available driver from dropdown
5. Confirm assignment
6. Driver receives notification

### View Sales Reports
1. Click "Reports" tab
2. Select report type:
   - Daily Summary
   - Weekly Analysis
   - Monthly Report
   - Custom Date Range
3. Apply filters (order type, payment method, etc.)
4. View charts and data tables
5. Export as PDF or Excel (if enabled)

### Manage Staff
1. Navigate to "Staff" section
2. View all employees
3. Actions available:
   - View performance details
   - Check attendance/sessions
   - Approve time-off requests (if enabled)

### Handle Cancellations
1. Find order to cancel
2. Click "Cancel Order" button
3. Enter cancellation reason
4. Confirm cancellation
5. If payment taken, process refund

---

## Access POS Features

As a manager, you can:
1. Click "POS System" from Manager Dashboard
2. Access full POS functionality
3. Take orders like regular staff
4. Press **F3** in POS to return to Reports

---

## Tips for Managers

### Daily Routine:
1. **Morning:** Review yesterday's performance, check inventory
2. **Lunch Rush:** Monitor kitchen display, ensure enough staff
3. **Afternoon:** Review staff performance, handle issues
4. **Dinner Rush:** All hands on deck, assist where needed
5. **End of Day:** Review sales, reconcile cash, schedule next day

### Key Metrics to Watch:
- **Average Preparation Time:** Should be < 20 minutes
- **Order Accuracy:** Cancellations should be < 5%
- **Driver Utilization:** All drivers should have balanced load
- **Staff Performance:** Identify top performers and those needing help

---

# Customer App Manual

**Target Users:** Customers (Online Ordering)
**Access URL:** `http://yourdomain.com/customer`

## Overview

The Customer App allows customers to browse menu, customize orders, and place online orders for delivery or pickup.

*Full customer manual available separately as customers don't need POS/kitchen training.*

### Key Features:
- Browse menu without login
- Create account for faster checkout
- Customize menu items
- Save favorite items
- Track order status in real-time
- View order history
- Apply promo codes
- Rate and review orders

---

# Troubleshooting

## General Issues

### **Can't Login**
**Solutions:**
1. Verify email and password (case-sensitive)
2. Click "Forgot Password" to reset
3. Check with manager if account exists
4. Clear browser cache and try again
5. Try different browser

### **Page Not Loading**
**Solutions:**
1. Check internet connection
2. Try refreshing page (F5 or Ctrl+R)
3. Clear browser cache (Ctrl+Shift+Delete)
4. Check if services are running (contact IT)
5. Try accessing from different device

### **Features Not Working**
**Solutions:**
1. Refresh the page
2. Logout and login again
3. Check browser console for errors (F12)
4. Contact IT support with error details
5. Take screenshot of error if available

### **Data Not Updating**
**Solutions:**
1. Wait for auto-refresh (varies by feature)
2. Manually refresh page
3. Check internet connection
4. Verify backend services running

---

## Getting Help

### For Technical Issues:
- **IT Support:** support@masova.com
- **Phone:** +91 9876543210
- **Slack:** #tech-support (staff channel)

### For Operational Issues:
- **Manager:** Contact your store manager
- **HR:** For account/login issues

### For Training:
- **Training Videos:** Available at training.masova.com
- **Ask Colleagues:** Experienced staff can help
- **Manager:** Can provide one-on-one training

---

## Keyboard Shortcuts Reference

### POS System:
| Shortcut | Action |
|----------|--------|
| F1 | New Order |
| F2 | Order History |
| F3 | Reports (Manager) |
| ESC | Clear Order |
| Ctrl+Enter | Submit Order |

### Kitchen Display:
| Shortcut | Action |
|----------|--------|
| F5 | Manual Refresh |

### Manager Dashboard:
| Shortcut | Action |
|----------|--------|
| Ctrl+P | Print Report |
| Ctrl+E | Export Data |

---

## Glossary

**AOV (Average Order Value):** Average amount per order
**KDS (Kitchen Display System):** Screen showing active orders in kitchen
**POS (Point of Sale):** System for taking orders and payments
**Order Type:**
- **Dine-In:** Customer eats at restaurant
- **Pickup:** Customer collects order
- **Delivery:** Order delivered to customer

**Order Status:**
- **RECEIVED:** Just placed
- **PREPARING:** Kitchen prep stage
- **COOKING:** In oven/on stove
- **READY:** Prepared, waiting pickup/delivery
- **OUT_FOR_DELIVERY:** Driver has order
- **DELIVERED:** Successfully delivered
- **COMPLETED:** Finished
- **CANCELLED:** Cancelled order

---

**Manual Version:** 1.0
**Last Updated:** October 23, 2025
**For Updates:** Check documentation portal or contact IT
