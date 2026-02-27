Testing


User approved Claude's plan
  ⎿  Plan saved to: ~/.claude/plans/cuddly-sniffing-lampson.md · /plan to edit
     MaSoVa End-to-End Testing Plan: Complete System Flow Verification

     ## Recent Fixes Applied (Latest Update)

     ✅ **POS Staff Attribution**: Fixed missing `createdByStaffId` and `createdByStaffName` fields
     - Orders created via POS now track which staff member created them
     - Staff performance metrics in Phase 7.3 will now work correctly

     ✅ **Payment Analytics**: Enhanced payment tracking with order context
     - Added `orderType` and `paymentMethod` to payment records
     - Payment dashboard will show better categorization

     ✅ **Payment Precision**: Fixed floating-point precision issues
     - Amount now sent as string with 2 decimal places for BigDecimal accuracy
     - Prevents rounding errors on large orders

     Overview

     Create comprehensive test orders (POS + Customer) for all 3 stores (DOM001, DOM002, DOM003) to verify the complete system flow:
     - Customer/POS order creation
     - Kitchen Display System (KDS)
     - Manager dashboard monitoring
     - Delivery driver assignment & tracking
     - Real-time notifications (WebSocket)
     - Review and rating submission

     Prerequisites Status

     - ✅ Manager exists for MaSoVa Main (Banjara Hills - DOM001)
     - ✅ At least one driver exists for DOM001
     - ⚠️ Need to create: Kitchen staff for DOM001, staff + drivers for DOM002 & DOM003
     - ⚠️ Need to delete: All existing customers and orders (clean slate)

     Test Scenario Design

     Orders to Create (6 Total)

     Store DOM001 (Banjara Hills):
     1. POS Pickup Order - Complex order with 3+ items, customizations, created by kitchen staff
     2. Customer Delivery Order - Complex order with 3+ items, special instructions, created by customer

     Store DOM002 (Jubilee Hills):
     3. POS Pickup Order - Complex order created by kitchen staff
     4. Customer Delivery Order - Complex order created by customer

     Store DOM003 (Gachibowli):
     5. POS Pickup Order - Complex order created by kitchen staff
     6. Customer Delivery Order - Complex order created by customer

     Step-by-Step UI Walkthrough Guide

     PHASE 1: Clean Up Existing Test Data (15 mins)

     Step 1.1: Delete All Existing Orders

     Using Database Script (Recommended - Fastest)
     cd /Users/souravamseekarmarti/Projects/MaSoVa-restaurant-management-system
     node scripts/check-and-delete-orders.js
     What it does: Permanently deletes all orders from MongoDB across all databases

     Alternative: Via Manager UI
     1. Login as manager at http://localhost:5173/login
       - Email: manager@masova.com (or check existing manager credentials)
       - Password: Manager@123
     2. Navigate to Manager Hub → Order Management
     3. For each order visible:
       - Click on order → "Cancel Order"
       - Provide reason: "Test cleanup"
       - Confirm cancellation
     4. Repeat for all orders across all 3 stores (switch stores via store selector)

     Step 1.2: Delete All Existing Customers

     Using GDPR Endpoint (Recommended - Compliant)

     1. First, get list of all customers:
       - Login as manager
       - Navigate to Manager Hub → Customer Management
       - Note down all customer IDs or emails
     2. For each customer, use API or UI:

     2. Option A: Via API (Postman/curl)
     # Get manager JWT token first
     curl -X POST http://localhost:8080/api/users/login \
       -H "Content-Type: application/json" \
       -d '{"email":"manager@masova.com","password":"Manager@123"}'

     # Copy accessToken from response, then delete each customer
     curl -X DELETE 'http://localhost:8080/api/customers/{customerId}/gdpr?reason=TEST_CLEANUP' \
       -H 'Authorization: Bearer YOUR_JWT_TOKEN'

     2. Option B: Via UI (if delete button exists)
       - Go to Customer Management page
       - Click "Delete" or "Remove" for each customer
       - Confirm deletion

     Alternative: Database Script (Nuclear Option)
     # This deletes EVERYTHING - use with caution!
     mongosh MaSoVa scripts/cleanup-database.js
     # Then recreate stores:
     curl -X POST http://localhost:8080/api/test-data/create-test-stores

     Step 1.3: Verify Menu Items Exist

     1. Navigate to http://localhost:5173/menu (customer view) or Manager Hub → Menu Management
     2. Check if menu items are visible
     3. If no menu items exist, seed the database:
     mongosh MaSoVa scripts/seed-menu-complete.js
     4. Verify items appear in both South Indian, North Indian, Indo-Chinese, Italian categories

     ---
     PHASE 2: Create Missing Staff & Drivers (20 mins)

     ## Staff Members Quick Reference

     | Store | Staff Name | Type | Email | Phone | Address (Pincode) |
     |-------|------------|------|-------|-------|-------------------|
     | DOM001 | Satish Reddy | Kitchen Staff | satish.kitchen@masova.com | 9876543220 | Banjara Hills (500034) |
     | DOM001 | Suresh Driver | Driver (Bike) | suresh.driver@masova.com | 9876543221 | Film Nagar (500033) |
     | DOM002 | Praveen Kumar | Kitchen Staff | praveen.kitchen@masova.com | 9876543222 | Jubilee Hills (500033) |
     | DOM002 | Ramesh Driver | Driver (Scooter) | ramesh.driver@masova.com | 9876543223 | Madhapur (500081) |
     | DOM003 | Kumar Kitchen | Kitchen Staff | kumar.kitchen@masova.com | 9876543224 | Gachibowli (500032) |
     | DOM003 | Vijay Driver | Driver (Bike) | vijay.driver@masova.com | 9876543225 | Nanakramguda (500008) |

     ## Manager Accounts Quick Reference

     | Store | Manager Name | Email | Phone | Password | PIN |
     |-------|--------------|-------|-------|----------|-----|
     | DOM001 | Suresh Kumar | suresh.manager@masova.com | 9876543210 | Manager@123 | (check database) |
     | DOM002 | Rajesh Manager | rajesh.manager@masova.com | 9876543211 | Manager@123 | **67865** |
     | DOM003 | Vijay Manager | vijay.manager@masova.com | 9876543212 | Manager@123 | **11236** |

     **Important Notes**:
     - All staff passwords: `Staff@123` or `Driver@123`
     - All manager passwords: `Manager@123`
     - Manager PINs are used to authorize staff clock-ins at POS terminals
     - **Security Rule**: Staff can only be clocked in by managers from the same store
     - Example: Praveen (DOM002 staff) must use Rajesh Manager's PIN (67865), not Suresh's PIN

     Step 2.1: Verify Existing Users

     1. Login as existing manager
     2. Navigate to Manager Hub → Staff Management
     3. Check which staff/drivers exist for each store
     4. Note gaps (need 1 kitchen staff + 1 driver per store)

     Step 2.2: Create Kitchen Staff for DOM001 (if missing)

     1. As manager, go to Staff Management → "Add New Staff"
     2. Fill in form:
       - Name: Satish Reddy (Kitchen Staff)
       - Email: satish.kitchen@masova.com
       - Phone: 9876543220
       - Password: Staff@123
       - Type: STAFF
       - Role: Kitchen Staff
       - Store: DOM001 - MaSoVa Banjara Hills (Explicit storeId: DOM001)
       - Permissions: ORDER_MANAGEMENT, MENU_VIEW
       - Address Details:
         - Street: Flat 201, Sri Residency, Road No. 12
         - City: Hyderabad
         - State: Telangana
         - Pincode: 500034
         - Landmark: Near Banjara Hills Police Station
     3. Click "Create Staff Member"
     4. Generate Employee PIN:
       - Click on newly created staff → "Generate PIN"
       - Note the 4-digit PIN (needed for POS clock-in)
       - **IMPORTANT**: This staff member must be logged in to POS for order attribution tracking

     Step 2.3: Create Driver for DOM001 (if missing)

     1. Go to Staff Management → "Add New Staff"
     2. Fill in form:
       - Name: Suresh Driver
       - Email: suresh.driver@masova.com
       - Phone: 9876543221
       - Password: Driver@123
       - Type: DRIVER
       - Role: Delivery Driver
       - Store: DOM001 - MaSoVa Banjara Hills (Explicit storeId: DOM001)
       - Vehicle Type: Bike
       - License Number: TS09UA1234
       - Address Details:
         - Street: House No. 45, Journalist Colony
         - City: Hyderabad
         - State: Telangana
         - Pincode: 500033
         - Landmark: Near Film Nagar Bus Stop
     3. Click "Create Driver"

     Step 2.4: Create Staff & Driver for DOM002

     Kitchen Staff:
     - Name: Praveen Kumar
     - Email: praveen.kitchen@masova.com
     - Phone: 9876543222
     - Password: Staff@123
     - Type: STAFF
     - Role: Kitchen Staff
     - Store: DOM002 - MaSoVa Jubilee Hills (Explicit storeId: DOM002)
     - Permissions: ORDER_MANAGEMENT, MENU_VIEW
     - Address Details:
       - Street: Flat 502, Hill View Apartments, Road No. 36
       - City: Hyderabad
       - State: Telangana
       - Pincode: 500033
       - Landmark: Opposite Jubilee Hills Club

     Driver:
     - Name: Ramesh Driver
     - Email: ramesh.driver@masova.com
     - Phone: 9876543223
     - Password: Driver@123
     - Type: DRIVER
     - Role: Delivery Driver
     - Store: DOM002 - MaSoVa Jubilee Hills (Explicit storeId: DOM002)
     - Vehicle Type: Scooter
     - License Number: TS09UA5678
     - Address Details:
       - Street: Plot No. 78, Madhapur Colony
       - City: Hyderabad
       - State: Telangana
       - Pincode: 500081
       - Landmark: Near HITEC City Metro Station

     Step 2.5: Create Staff & Driver for DOM003

     Kitchen Staff:
     - Name: Kumar Kitchen
     - Email: kumar.kitchen@masova.com
     - Phone: 9876543224
     - Password: Staff@123
     - Type: STAFF
     - Role: Kitchen Staff
     - Store: DOM003 - MaSoVa Gachibowli (Explicit storeId: DOM003)
     - Permissions: ORDER_MANAGEMENT, MENU_VIEW
     - Address Details:
       - Street: Flat 302, Tech Park Residency, Gachibowli
       - City: Hyderabad
       - State: Telangana
       - Pincode: 500032
       - Landmark: Near DLF Cyber City Gate 3

     Driver:
     - Name: Vijay Driver
     - Email: vijay.driver@masova.com
     - Phone: 9876543225
     - Password: Driver@123
     - Type: DRIVER
     - Role: Delivery Driver
     - Store: DOM003 - MaSoVa Gachibowli (Explicit storeId: DOM003)
     - Vehicle Type: Bike
     - License Number: TS09UA9012
     - Address Details:
       - Street: House No. 123, Nanakramguda Village
       - City: Hyderabad
       - State: Telangana
       - Pincode: 500008
       - Landmark: Near Financial District Metro

     Step 2.6: Generate PINs for All Staff

     1. For each kitchen staff member:
       - Go to Staff Management → Click on staff → "Generate PIN"
       - Note down the PIN (needed for POS login)

     Expected Result:
     - DOM001: 1 manager, 1 kitchen staff (Satish Reddy), 1 driver (Suresh) - All with complete addresses
     - DOM002: 1 kitchen staff (Praveen Kumar), 1 driver (Ramesh) - All with complete addresses
     - DOM003: 1 kitchen staff (Kumar Kitchen), 1 driver (Vijay) - All with complete addresses
     - All staff members have:
       ✓ Explicit storeId assignment
       ✓ Complete address (street, city, state, pincode, landmark)
       ✓ Appropriate permissions and roles
       ✓ Vehicle details for drivers (type and license number)

     ---
     PHASE 3: Create Test Customers (10 mins)

     Step 3.1: Create Customer for DOM001 Orders

     1. Logout from manager account (important!)
     2. Navigate to http://localhost:5173/customer-login
     3. Click "Sign Up" or "Register"
     4. Fill registration form:
       - Name: Aarav Sharma
       - Email: aarav.customer@gmail.com
       - Phone: 9123456780
       - Password: Customer@123
       - Confirm Password: Customer@123
     5. Click "Register"
     6. System should auto-create customer profile
     7. Logout after registration

     Step 3.2: Create Customer for DOM002 Orders

     - Name: Priya Reddy
     - Email: priya.customer@gmail.com
     - Phone: 9123456781
     - Password: Customer@123

     Step 3.3: Create Customer for DOM003 Orders

     - Name: Arjun Patel
     - Email: arjun.customer@gmail.com
     - Phone: 9123456782
     - Password: Customer@123

     Expected Result: 3 customer accounts created, ready to place orders

     ---
     PHASE 4: Create POS Pickup Orders (30 mins)

     ## POS Order Flow & Staff Attribution

     **HOW IT WORKS**:
     1. Staff member clocks in **ONCE per shift** using their 5-digit PIN
     2. Manager authorizes the clock-in **ONCE** with their PIN (same-store validation)
     3. Working session is created and tracks the staff member's entire shift
     4. Staff can now take **MULTIPLE orders** without entering PIN again
     5. Each order automatically includes:
        - `createdByStaffId`: The staff member's user ID
        - `createdByStaffName`: The staff member's full name
     6. This data is used for staff performance analytics and order history
     7. **IMPORTANT**: Manager PIN is ONLY needed for clock-in, NOT for each order

     **BACKEND CHANGES (Dec 2025)**:
     - ✅ Added `createdByStaffId` and `createdByStaffName` fields to Order entity
     - ✅ Frontend POS sends staff attribution in `CreateOrderRequest`
     - ✅ Staff performance queries now work correctly
     - ✅ Working sessions now store employee name for quick display
     - ✅ Sessions use employee's assigned storeId (not header storeId)

     Step 4.1: POS Order for DOM001 (Banjara Hills)

     **CRITICAL**: Staff must be logged in via PIN for order attribution to work!

     1. Navigate to http://localhost:5173/pos
     2. Select Store: DOM001 - MaSoVa Banjara Hills
     3. Click "Clock In" button in POS system
     4. **Two-Step PIN Authentication**:
        - **Step 1 - Employee PIN**:
          - Enter Satish's 5-digit PIN: [Generated PIN from Step 2.2]
          - Click "Continue"
        - **Step 2 - Manager Authorization**:
          - System shows: "Clocking in: Satish Reddy (Kitchen Staff)"
          - Manager enters their PIN: [Suresh Kumar's PIN for DOM001]
          - Click "Clock In"
     5. **Verify Success**:
        - "Satish Reddy" appears in POS header
        - Active session widget shows Satish is clocked in
        - Working session created in database
     6. Click "Start New Order"
     7. Add Complex Order Items:
       - Item 1: Margherita Pizza (Large) - Qty: 2
           - Customization: "Extra cheese, thin crust"
       - Item 2: Chicken Biryani - Qty: 1
           - Customization: "Extra spicy, add raita"
       - Item 3: Paneer Butter Masala - Qty: 1
       - Item 4: Garlic Naan - Qty: 3
       - Item 5: Mango Lassi - Qty: 2
     8. Enter Customer Details:
       - Name: Walk-in Customer 1
       - Phone: 9988776655
       - Order Type: PICKUP (or TAKEAWAY)
     9. Special Instructions: "Please pack naan separately. Customer will pick up in 30 minutes."
     10. Payment Method: CASH
     11. Click "Place Order"
     12. Note Order Number (e.g., #ORD-001): Order #ORD5281501312 

     What to Observe:
     - Order appears on KDS (Kitchen Display)
     - Manager dashboard shows new order
     - Order total calculated with taxes
     - Estimated preparation time displayed
     - **NEW**: Order includes createdByStaffId and createdByStaffName (viewable in backend/database)

     Step 4.2: POS Order for DOM002 (Jubilee Hills)

     1. Switch Store (select DOM002 in store selector or navigate to new POS tab)
     2. Click "Clock In" button
     3. **Two-Step PIN Authentication**:
        - **Step 1**: Enter Praveen Kumar's 5-digit PIN
        - **Step 2**: Enter Rajesh Manager's PIN: **67865** (DOM002 manager)
     4. Verify "Praveen Kumar" appears in POS header
     5. Create similar complex order:
       - Masala Dosa (3), Idly Sambar (2), Filter Coffee (2)
       - Special instructions: "Less oil in dosa, extra sambar"
       - Customer: Walk-in Customer 2 (Phone: 9988776656)
       - Type: PICKUP, Payment: UPI

     Step 4.3: POS Order for DOM003 (Gachibowli)

     1. Switch to DOM003 in store selector
     2. Click "Clock In" button
     3. **Two-Step PIN Authentication**:
        - **Step 1**: Enter Kumar Kitchen's 5-digit PIN
        - **Step 2**: Enter Vijay Manager's PIN: **11236** (DOM003 manager)
     4. Verify "Kumar Kitchen" appears in POS header
     5. Create complex order:
       - Hakka Noodles (Chicken) (2), Chilli Chicken (1), Fried Rice (Veg) (1), Spring Rolls (4)
       - Special instructions: "Make it extra spicy with schezwan sauce on side"
       - Customer: Walk-in Customer 3 (Phone: 9988776657)
       - Type: PICKUP, Payment: CARD

     Expected Result: 3 POS pickup orders created, visible in KDS and manager dashboard

     ---
     PHASE 5: Create Customer Delivery Orders (45 mins)

     Step 5.1: Customer Delivery Order for DOM001

     1. Login as Customer: aarav.customer@gmail.com / Customer@123
     2. Navigate to http://localhost:5173/menu
     3. Select Store: DOM001 - MaSoVa Banjara Hills
     4. Add Items to Cart:
       - Item 1: Butter Chicken - Qty: 2
           - Customization: "Medium spicy, extra gravy"
       - Item 2: Butter Naan - Qty: 4
       - Item 3: Veg Biryani - Qty: 1
           - Customization: "Add extra raita"
       - Item 4: Paneer Tikka (Appetizer) - Qty: 1
       - Item 5: Gulab Jamun (Dessert) - Qty: 2
     5. Click "Proceed to Checkout"
     6. Enter Delivery Address:
       - Street: 123 Film Nagar Main Road
       - City: Hyderabad
       - State: Telangana
       - Pincode: 500034
       - Landmark: Near GVK One Mall
       - Important: Address should be within 5km of store (17.4126, 78.4482)
       - Latitude: 17.4150 (auto-filled or manual)
       - Longitude: 78.4450
     7. Special Instructions: "Please ring doorbell twice. Leave at door if no answer. Call before arriving."
     8. Payment Method: CARD (or COD)
     9. Review order summary (items, delivery fee, taxes, total)
     10. Click "Place Order"
     11. Note Order Number and Tracking Link

     What to Observe:
     - Order appears on KDS for DOM001
     - Order status: RECEIVED
     - Delivery fee calculated based on distance
     - Customer can track order in real-time
     - WebSocket connection established for live updates

     Step 5.2: Customer Delivery Order for DOM002

     1. Login as: priya.customer@gmail.com / Customer@123
     2. Select Store: DOM002 - MaSoVa Jubilee Hills
     3. Add complex order:
       - Pepperoni Pizza (Large) (1), BBQ Chicken Pizza (Medium) (1)
       - Cheese Naan (4), Dal Makhani (1), Jeera Rice (1)
       - Brownie with Ice Cream (2)
     4. Delivery Address (within 5km of 17.4239, 78.4738):
       - Street: 456 Road No. 36, Jubilee Hills
       - City: Hyderabad
       - Landmark: Opposite Jubilee Hills Club
     5. Special Instructions: "Please call on reaching gate. Apartment 4B."
     6. Payment: UPI

     Step 5.3: Customer Delivery Order for DOM003

     1. Login as: arjun.customer@gmail.com / Customer@123
     2. Select Store: DOM003 - MaSoVa Gachibowli
     3. Add complex order:
       - Chicken Tikka Masala (2), Mutton Biryani (1)
       - Tandoori Roti (6), Palak Paneer (1)
       - Schezwan Fried Rice (1), Chilli Paneer (1)
     4. Delivery Address (within 5km of 17.4435, 78.3772):
       - Street: 789 Gachibowli Main Road
       - City: Hyderabad
       - Landmark: Near DLF Cyber City
     5. Special Instructions: "Office delivery. Ask for Arjun at reception."
     6. Payment: CASH

     Expected Result: 3 customer delivery orders created, ready for kitchen preparation

     ---
     PHASE 6: Monitor Kitchen Display System (15 mins)

     Step 6.1: Open KDS for Each Store

     1. DOM001 KDS:
       - Navigate to http://localhost:5173/kitchen?storeId=DOM001
       - Login as kitchen staff (if required)
       - Should see 2 orders: 1 pickup + 1 delivery
     2. DOM002 KDS:
       - Navigate to http://localhost:5173/kitchen?storeId=DOM002
       - Should see 2 orders
     3. DOM003 KDS:
       - Navigate to http://localhost:5173/kitchen?storeId=DOM003
       - Should see 2 orders

     Step 6.2: Update Order Statuses (DOM001 as example)

     1. Select first order (POS pickup order)
     2. Click "Start Preparing"
       - Status changes: RECEIVED → PREPARING
       - WebSocket notification sent to customer/manager
       - Timer starts for preparation time
     3. After 5 minutes, click "Move to Oven"
       - Status: PREPARING → OVEN
       - Estimated time updated
     4. After 10 minutes, click "Ready"
       - Status: OVEN → BAKED → READY
       - Notification: "Order ready for pickup"
     5. For delivery order, follow same flow:
       - PREPARING → OVEN → BAKED → DISPATCHED (when driver assigned)

     What to Observe:
     - Real-time status updates on customer tracking page
     - Manager dashboard reflects current order stages
     - Preparation timers display correctly
     - Orders move between stages smoothly
     - WebSocket updates trigger without page refresh

     Repeat for DOM002 and DOM003 orders

     ---
     PHASE 7: Manager Dashboard Monitoring (20 mins)

     Step 7.1: View All Orders Across Stores

     1. Login as manager at http://localhost:5173/login
     2. Navigate to Manager Hub → Order Management
     3. Switch between stores using store selector (top-right)
     4. For each store, verify:
       - Total orders: 2 (1 pickup + 1 delivery)
       - Order status distribution (PREPARING, READY, etc.)
       - Revenue metrics updated
       - Average order value calculated

     Step 7.2: Monitor Real-time Metrics

     1. Go to Manager Hub → Dashboard
     2. Observe metrics tiles:
       - Active Orders: Should show 6 total (across all stores)
       - Today's Revenue: Sum of all order totals
       - Avg Order Value: Total revenue / 6
       - Peak Hours: Chart should show activity spike
     3. Check Order Status Breakdown:
       - PREPARING: X orders
       - READY: Y orders
       - DISPATCHED: Z orders

     Step 7.3: View Staff Performance

     **NOTE**: This feature now works correctly with staff attribution fixes!

     1. Navigate to Staff Management or Analytics Dashboard
     2. Check POS Staff Performance (order attribution):
       - Satish Reddy (DOM001): Should show 1 order created
       - Praveen Kumar (DOM002): Should show 1 order created
       - Kumar Kitchen (DOM003): Should show 1 order created
     3. Verify order counts match the orders created in Phase 4
     4. **If counts are 0**: Staff attribution not working - verify staff was logged in during order creation
     5. Verify staff addresses are visible in their profiles

     Step 7.4: Check Customer Profiles

     1. Go to Customer Management
     2. Search for:
       - aarav.customer@gmail.com (DOM001 order)
       - priya.customer@gmail.com (DOM002 order)
       - arjun.customer@gmail.com (DOM003 order)
     3. For each customer, verify:
       - Profile created successfully
       - Order history shows their delivery order
       - Customer linked to correct store (should show store preference)
       - Total spent matches order value
       - Loyalty points calculated (if enabled)

     What to Observe:
     - Customer profiles are store-agnostic (can order from any store)
     - Order history shows all orders across stores
     - Each customer has 1 delivery order in their profile
     - Walk-in customers from POS orders do NOT have user accounts

     ---
     PHASE 8: Delivery Driver Assignment & Tracking (30 mins)

     Step 8.1: Driver Login (DOM001)

     1. Open new browser tab/window (or incognito)
     2. Navigate to http://localhost:5173/driver-login
     3. Login as: suresh.driver@masova.com / Driver@123
     4. Set Status to "AVAILABLE"
       - Toggle switch or button to mark available
     5. Enable Location Sharing:
       - Allow browser location permissions
       - Driver location sent via WebSocket every 5-10 seconds

     Step 8.2: Auto-Dispatch or Manual Assignment

     Option A: Auto-Dispatch (if enabled)
     - System automatically assigns nearest available driver to READY delivery orders
     - Driver receives notification: "New delivery assigned - Order #ORD-002"

     Option B: Manual Assignment (Manager)
     1. Login as manager
     2. Go to Delivery Management
     3. Find unassigned delivery order (DOM001 delivery)
     4. Click "Assign Driver" → Select "Suresh Driver"
     5. Confirm assignment

     Step 8.3: Driver Accepts Delivery

     1. On driver app, view assigned delivery
     2. See order details:
       - Items, customer name, delivery address
       - Restaurant pickup location (DOM001)
       - Customer delivery location (map view)
     3. Click "Accept Delivery"
       - Status: ASSIGNED → ACCEPTED
       - Customer receives notification: "Driver has accepted your order"

     Step 8.4: Driver Picks Up Order

     1. Driver navigates to restaurant (DOM001)
     2. In driver app, click "Mark as Picked Up"
       - Status: ACCEPTED → PICKED_UP
       - Customer notification: "Your order is on the way!"
     3. Navigation starts:
       - Route displayed on map (pickup → customer)
       - ETA calculated based on distance

     Step 8.5: Real-time Location Tracking

     1. Customer View:
       - Customer (aarav.customer@gmail.com) logs in
       - Goes to "Track Order" or order tracking page
       - Live map shows:
           - Driver's current location (marker moving in real-time)
         - Restaurant location
         - Customer delivery location
         - Route line connecting points
         - Estimated time remaining
     2. Manager View:
       - Manager opens Delivery Management → Live Tracking
       - Map shows all active drivers across all stores
       - Can filter by store (DOM001, DOM002, DOM003)
       - Driver markers color-coded by status

     Step 8.6: Driver Delivers Order

     1. Driver arrives at customer location
     2. In driver app, click "Mark as Arrived"
       - Status: IN_TRANSIT → ARRIVED
       - Customer notification: "Your driver has arrived!"
     3. Delivery Verification (OTP/Photo/Signature):
       - Enter customer OTP (if enabled): e.g., 1234
       - OR Take photo proof
       - OR Collect signature
     4. Click "Complete Delivery"
       - Status: ARRIVED → DELIVERED
       - Timestamp recorded
       - Customer notification: "Order delivered. Enjoy your meal!"

     Step 8.7: Repeat for DOM002 & DOM003 Deliveries

     1. DOM002:
       - Login as ramesh.driver@masova.com
       - Accept and deliver Priya's order
     2. DOM003:
       - Login as vijay.driver@masova.com
       - Accept and deliver Arjun's order

     What to Observe:
     - WebSocket live tracking works smoothly
     - Location updates every 5-10 seconds
     - Customer sees driver approaching in real-time
     - Manager can monitor all deliveries simultaneously
     - Delivery completion triggers rating request

     ---
     PHASE 9: Notification Flow Verification (15 mins)

     Step 9.1: Check WebSocket Notifications

     Throughout the entire flow, verify WebSocket messages in browser console:

     Customer Browser:
     // Should see messages like:
     Connected to order tracking for order #ORD-002
     Order status updated: PREPARING
     Order status updated: OVEN
     Order status updated: BAKED
     Driver assigned to your order
     Driver location updated: {lat: 17.4150, lng: 78.4450}
     Order delivered successfully

     Kitchen Display:
     New order received: #ORD-001
     Order #ORD-001 status: PREPARING
     Order #ORD-002 ready for dispatch

     Driver App:
     New delivery assigned: #ORD-002
     Order picked up successfully
     Delivery completed

     Step 9.2: Check Email/SMS Notifications (if configured)

     1. Customer Email Inbox:
       - Order confirmation email
       - "Order being prepared" email
       - "Driver assigned" email
       - "Order delivered" email
       - Rating request email (30 mins after delivery)
     2. Customer SMS:
       - Same notifications as email
       - OTP for delivery verification
     3. Manager Notifications:
       - New order alerts
       - Low stock alerts (if triggered)
       - Daily sales summary (at 11 PM)

     Note: SMS/Email require configuration in .env - may not work if not set up

     Step 9.3: Verify Notification Service Logs

     1. Check notification-service console logs
     2. Look for entries like:
     Sending notification: ORDER_RECEIVED to customer 673b9e1c...
     Rating request sent to aarav.customer@gmail.com for order #ORD-002

     ---
     PHASE 10: Review & Rating Submission (20 mins)

     Step 10.1: Automatic Rating Request Generation

     After order delivery, system automatically:
     1. Generates unique rating token (UUID)
     2. Token expires in 30 days
     3. Sends SMS + Email with link: http://localhost:5173/rate/{orderId}/{token}

     Verify Token Generation:
     # Check MongoDB collection: rating_tokens
     mongosh MaSoVa
     db.rating_tokens.find().pretty()
     # Should show tokens for 3 delivered orders

     Step 10.2: Customer Submits Rating (DOM001 Order)

     Option A: Via Rating Link (Recommended)
     1. Simulate SMS/Email link:
       - Get token from database (from step above)
       - Navigate to: http://localhost:5173/rate/{orderId}/{token}
       - Replace {orderId} and {token} with actual values
     2. Public Rating Page Loads:
       - Shows order details (order number, items, restaurant)
       - Pre-filled customer name (if token valid)
       - Rating form displayed
     3. Fill Rating Form:
       - Overall Rating: ⭐⭐⭐⭐⭐ (5 stars)
       - Comment: "Excellent food! Butter chicken was amazing. Delivery was fast."
       - Food Quality: ⭐⭐⭐⭐⭐ (5 stars)
       - Service Rating: ⭐⭐⭐⭐ (4 stars)
       - Delivery Rating: ⭐⭐⭐⭐⭐ (5 stars)
       - Driver Rating: ⭐⭐⭐⭐⭐ (5 stars)
       - Driver Comment: "Suresh was very polite and on time!"
       - Item Reviews:
           - Butter Chicken: ⭐⭐⭐⭐⭐ "Perfect spice level"
         - Butter Naan: ⭐⭐⭐⭐ "Fresh and soft"
         - Veg Biryani: ⭐⭐⭐⭐⭐ "Great flavor"
     4. Submit Rating:
       - Click "Submit Review"
       - Token marked as used (prevents duplicate submissions)
       - Thank you message displayed

     Option B: Authenticated Review (if customer logged in)
     1. Customer logs in
     2. Goes to "Order History"
     3. Finds delivered order
     4. Clicks "Rate This Order"
     5. Fills same form as above

     Step 10.3: Submit Ratings for DOM002 & DOM003

     DOM002 (Priya's Order):
     - Overall: 4 stars, "Good pizza but slightly cold on arrival"
     - Food Quality: 4, Service: 5, Delivery: 3
     - Driver (Ramesh): 4 stars, "Friendly but took longer than expected"

     DOM003 (Arjun's Order):
     - Overall: 5 stars, "Perfect office lunch! Hot and delicious."
     - Food Quality: 5, Service: 5, Delivery: 5
     - Driver (Vijay): 5 stars, "Very professional, called before arriving"

     Step 10.4: Verify Reviews in System

     1. Manager View:
       - Login as manager
       - Navigate to Review Management
       - Should see 3 new reviews
       - Can approve/flag/respond to reviews
     2. Driver Performance:
       - Go to Driver Management
       - Check each driver's rating:
           - Suresh: 5.0 (1 review)
         - Ramesh: 4.0 (1 review)
         - Vijay: 5.0 (1 review)
     3. Item Ratings:
       - Go to Product Analytics
       - Check menu item ratings:
           - Butter Chicken: 5.0
         - Margherita Pizza: (no rating yet from pickup order)
     4. Customer Reviews Page:
       - Navigate to public menu page
       - Reviews should be visible under rated items

     What to Observe:
     - Token validation prevents unauthorized access
     - One-time submission enforced (token marked as used)
     - Reviews linked to correct order, driver, items
     - Analytics updated in real-time
     - Manager can respond to reviews

     ---
     PHASE 11: Verification Checklist

     Customer Order Flow ✓

     - Customer registration creates user + customer profile
     - Customer profile is store-agnostic (can order from any store)
     - Customer can view order history across all stores
     - Delivery address validation (within 5km radius)
     - Delivery fee calculated based on distance
     - Order total includes items + delivery + taxes

     POS Order Flow ✓

     - Kitchen staff can clock in with PIN
     - POS staff ID tracked in order (createdByStaffId)
     - Walk-in customers do NOT create user accounts
     - Pickup orders skip delivery assignment
     - Staff performance metrics updated

     Kitchen Display System ✓

     - Orders appear on KDS immediately after creation
     - Status updates work: RECEIVED → PREPARING → OVEN → BAKED → READY
     - WebSocket updates in real-time (no page refresh needed)
     - Preparation timers display correctly
     - Orders can be filtered by status/type

     Manager Dashboard ✓

     - Store selector switches between DOM001/DOM002/DOM003
     - Metrics tiles show correct data (orders, revenue, avg value)
     - Order management shows all orders for selected store
     - Staff performance displays POS orders created
     - Customer management shows customer profiles
     - Customer order history visible in their profile
     - Customers linked to orders (not stores)

     Delivery & Tracking ✓

     - Driver login works for each store's drivers
     - Driver status toggles: AVAILABLE, BUSY, OFF_DUTY
     - Auto-dispatch or manual assignment works
     - Driver accepts/rejects delivery
     - Location sharing via WebSocket (every 5-10s)
     - Customer sees live driver location on map
     - Manager sees all drivers on delivery management map
     - Delivery completion with OTP/Photo/Signature proof
     - Order status updates to DELIVERED

     Notifications ✓

     - WebSocket notifications for order status changes
     - Customer receives updates (PREPARING, DISPATCHED, DELIVERED)
     - Driver receives assignment notifications
     - Manager receives new order alerts
     - Email/SMS notifications (if configured)
     - Rating request sent after delivery

     Review & Rating ✓

     - Rating token generated after delivery
     - Token-based anonymous rating works (via SMS/Email link)
     - Authenticated rating works (logged-in customers)
     - One-time submission enforced (token marked as used)
     - Reviews linked to order, driver, items
     - Driver ratings visible in driver management
     - Item ratings visible in product analytics
     - Manager can view and respond to reviews

     ---
     Critical Files Reference

     Backend Services

     - Order Service: order-service/src/main/java/com/MaSoVa/order/
       - controller/OrderController.java - Order creation, status updates
       - service/OrderService.java - Business logic
       - service/RatingTokenService.java - Token generation
       - websocket/OrderWebSocketController.java - WebSocket handling
     - Customer Service: customer-service/src/main/java/com/MaSoVa/customer/
       - controller/CustomerController.java - Customer CRUD, GDPR deletion
       - service/CustomerService.java - Profile management
     - Delivery Service: delivery-service/src/main/java/com/MaSoVa/delivery/
       - controller/TrackingController.java - Driver tracking
       - service/AutoDispatchService.java - Driver assignment
       - service/LiveTrackingService.java - WebSocket location updates
     - Review Service: review-service/src/main/java/com/MaSoVa/review/
       - controller/ReviewController.java - Review submission
       - service/ReviewService.java - Rating analytics
     - Notification Service: notification-service/src/main/java/com/MaSoVa/notification/
       - service/RatingRequestService.java - Rating email/SMS
       - service/ManagerNotificationService.java - Manager alerts

     Frontend Pages

     - Customer: frontend/src/pages/customer/
       - MenuPage.tsx - Browse menu, add to cart
       - OrderTrackingPage.tsx - Real-time order tracking with map
       - LiveTrackingPage.tsx - Driver location tracking
     - POS: frontend/src/apps/POSSystem/
       - POSSystem.tsx - Main POS interface
       - components/OrderPanel.tsx - Order creation
     - Kitchen: frontend/src/pages/kitchen/
       - KitchenDisplayPage.tsx - KDS interface
     - Manager: frontend/src/pages/manager/
       - DashboardPage.tsx - Manager overview
       - OrderManagementPage.tsx - Order monitoring
       - CustomerManagementPage.tsx - Customer profiles
       - DeliveryManagementPage.tsx - Driver tracking
       - ReviewManagementPage.tsx - Review moderation
     - Driver: frontend/src/apps/DriverApp/
       - DriverDashboard.tsx - Driver interface
       - pages/ActiveDeliveryPage.tsx - Active delivery management

     Database Scripts

     - scripts/cleanup-database.js - Delete all data (nuclear option)
     - scripts/check-and-delete-orders.js - Delete orders only
     - scripts/check-and-delete-customer.sh - Delete specific customer
     - scripts/seed-menu-complete.js - Seed menu items

     WebSocket Configuration

     - order-service/src/main/resources/application.yml - Order WebSocket config
     - delivery-service/src/main/resources/application.yml - Delivery WebSocket config
     - frontend/src/services/websocketService.ts - Frontend WebSocket client

     ---
     Expected Outcomes

     After completing all steps:

     1. 3 Stores Active: DOM001, DOM002, DOM003 each with staff and drivers
     2. 6 Orders Created: 3 POS pickup + 3 customer delivery
     3. 3 Customer Profiles: Linked to their delivery orders
     4. 3 Deliveries Completed: With driver tracking and proof of delivery
     5. 3 Reviews Submitted: Rating orders, drivers, and items
     6. Real-time Updates Working: WebSocket notifications throughout
     7. Manager Dashboard: Showing accurate metrics across all stores
     8. Complete Audit Trail: Orders, deliveries, ratings all interconnected

     ---
     Troubleshooting Tips

     WebSocket Not Connecting

     - Check browser console for connection errors
     - Verify CORS settings in gateway and service configs
     - Ensure services are running on correct ports

     Orders Not Appearing on KDS

     - Check store ID matches between order and KDS
     - Verify WebSocket subscription topic is correct
     - Refresh KDS page or check network tab for WebSocket frames

     Driver Location Not Updating

     - Check browser location permissions granted
     - Verify WebSocket connection to delivery service
     - Check delivery-service logs for location updates

     Rating Link Not Working

     - Verify token exists in database and not expired
     - Check token marked as used=false
     - Ensure order is in DELIVERED status

     Customer Profile Not Created

     - Check customer-service logs for errors
     - Verify customer profile creation endpoint called after registration
     - Check MongoDB customers collection

     Staff Attribution Not Working (Orders show no createdByStaffId)

     - **CRITICAL**: Verify staff was logged in via PIN before creating order
     - Check POS header shows staff name (confirms login success)
     - Inspect order in database: should have `createdByStaffId` and `createdByStaffName` fields
     - If fields are null: Staff wasn't logged in or frontend didn't send the data
     - Check browser console for any errors during order creation
     - Verify working session exists in `working_sessions` collection

     Staff Clock-In Fails: "Manager must be from same store"

     - This is a SECURITY FEATURE, not a bug!
     - Verify you're using the correct manager PIN for that store:
       - DOM001 staff → Use Suresh Kumar's PIN
       - DOM002 staff → Use Rajesh Manager's PIN (67865)
       - DOM003 staff → Use Vijay Manager's PIN (11236)
     - Cross-store clock-ins are intentionally blocked
     - If needed, create a manager account for each store (see manager table above)

     Active Session Not Showing Up

     - Check if session was created with correct storeId
     - Verify `working_sessions` collection in `masova_db` database
     - Session should have:
       - `storeId`: Employee's assigned store (from their profile)
       - `employeeName`: Employee's full name (cached for display)
       - `isActive`: true
       - `status`: "ACTIVE"
     - If storeId is wrong: Restart user-service (fix applied Dec 2025)
     - Sessions now use employee's profile storeId, not request header storeId

     ---
     Time Estimate

     - Phase 1 (Cleanup): 15 minutes
     - Phase 2 (Staff/Driver Creation): 20 minutes
     - Phase 3 (Customer Registration): 10 minutes
     - Phase 4 (POS Orders): 30 minutes
     - Phase 5 (Customer Orders): 45 minutes
     - Phase 6 (KDS Monitoring): 15 minutes
     - Phase 7 (Manager Dashboard): 20 minutes
     - Phase 8 (Delivery): 30 minutes
     - Phase 9 (Notifications): 15 minutes
     - Phase 10 (Reviews): 20 minutes
     - Phase 11 (Verification): 15 minutes

     Total: ~3.5 hours for complete end-to-end testing

⏺ Great! I've created a comprehensive step-by-step UI walkthrough guide for testing your entire MaSoVa system. The plan covers:

  Summary

  11 Phases totaling ~3.5 hours of complete end-to-end testing:

  1. Clean Up - Delete existing customers and orders (database scripts provided)
  2. Staff Setup - Create kitchen staff and drivers for all 3 stores
  3. Customer Registration - Create 3 test customer accounts
  4. POS Orders - Create 3 complex pickup orders (one per store)
  5. Customer Orders - Create 3 complex delivery orders (one per store)
  6. KDS Monitoring - Track orders through kitchen stages
  7. Manager Dashboard - Verify metrics, customer profiles, staff performance
  8. Delivery Tracking - Driver assignment, real-time GPS tracking, delivery completion
  9. Notifications - WebSocket real-time updates verification
  10. Reviews & Ratings - Token-based rating submission after delivery
  11. Verification Checklist - Complete system validation

  What You'll Test

  - ✅ Customer self-registration and profile creation (store-agnostic)
  - ✅ POS staff orders with PIN clock-in
  - ✅ Complex orders with multiple items and customizations
  - ✅ Kitchen Display System with real-time WebSocket updates
  - ✅ Manager dashboard across all 3 stores
  - ✅ Customer profiles showing order history
  - ✅ Driver GPS tracking with live map
  - ✅ Delivery workflow (accept → pickup → deliver with OTP/photo proof)
  - ✅ Rating token generation and review submission
  - ✅ Driver & item analytics