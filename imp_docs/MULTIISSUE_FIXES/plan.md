User approved Claude's plan
  ⎿  Plan saved to: ~/.claude/plans/lazy-dazzling-panda.md · /plan to edit
     Implementation Plan: Complete System Improvements

     Executive Summary

     This comprehensive plan addresses 11 critical requirements for the MaSoVa restaurant management system. The implementation focuses on improving 
     operational workflows, user experience, and system reliability across session management, authentication, payment handling, real-time driver tracking,
     and staff scheduling.

     Key User Preferences Applied:
     - ✅ 4-digit PINs auto-generated from employee ID (last 4 digits)
     - ✅ Session cleanup only on service shutdown (no scheduled auto-close)
     - ✅ OpenStreetMap for all live tracking (free, no API keys)
     - ✅ In-app banner + push notifications for schedule reminders (no email)

     Overview:
     This plan addresses 11 critical requirements for the MaSoVa restaurant management system, focusing on session management, authentication, payment 
     handling, driver tracking, and staff scheduling improvements.

     ---
     Phase 1: Session Cleanup on Service Shutdown

     Requirement

     When all services are stopped (VSCode closed), automatically logout all users (staff, managers, drivers, customers) and clock out staff members with 
     proper working session closure.

     Implementation Strategy

     Backend - Lifecycle Hooks:
     1. Add Spring Boot Shutdown Hooks in User Service
       - File: user-service/src/main/java/com/MaSoVa/user/UserServiceApplication.java
       - Implement @PreDestroy method to handle cleanup
       - On shutdown:
           - Find all active working sessions (isActive=true)
         - Auto-close each session with status=AUTO_CLOSED
         - Calculate totalHours and mark logoutTime=now()
         - Add violation: AUTO_CLOSED_ON_SHUTDOWN
         - Set requiresApproval=true for manager review on restart
     2. Scheduled Session Auto-Close
       - NOT IMPLEMENTING: Per user preference, only close on shutdown
       - Note: Existing logic already handles 12+ hour sessions with violations
       - Manager must manually review and approve/close long sessions

     Frontend - Connection Loss Detection:
     3. WebSocket Disconnect Handler
     - File: frontend/src/services/websocketService.ts
     - Enhance disconnect callback to detect prolonged disconnection (>30 seconds)
     - Show warning banner: "Connection lost. Please refresh to continue."
     - Auto-logout after 60 seconds of disconnect

     4. API Connection Health Check
       - File: frontend/src/store/api/baseQueryWithAuth.ts
       - Add periodic health check endpoint ping (every 30 seconds)
       - On 3 consecutive failures, trigger auto-logout
       - Clear all localStorage/sessionStorage
       - Redirect to login with message: "Services unavailable. Please login again."
     5. Service Worker (Optional Enhancement)
       - Detect when browser is closed while logged in
       - Send logout beacon to backend before page unload
       - Uses navigator.sendBeacon() for guaranteed delivery

     Files to Modify:
     - user-service/src/main/java/com/MaSoVa/user/UserServiceApplication.java (add shutdown hook)
     - user-service/src/main/java/com/MaSoVa/user/service/WorkingSessionService.java (add closeAllActiveSessions() method)
     - frontend/src/services/websocketService.ts (enhance disconnect detection)
     - frontend/src/store/api/baseQueryWithAuth.ts (add health check interceptor)
     - frontend/src/utils/security.ts (add connection monitor utility)

     ---
     ✅ Phase 2: Unified Clock In/Out System in POS - COMPLETE

     Requirement

     - Manager logs in at /staff-login → auto clock-in starts
     - Manager clocks in other staff from POS using 4-digit PIN
     - Staff can only work after manager clocks them in
     - Driver cannot clock themselves in - only manager can activate them
     - 4-digit PIN derived from last 4 digits of employee ID (ensure uniqueness)

     Implementation Strategy

     Backend Changes:

     1. Generate Unique 4-Digit PIN (Auto-generated)
       - File: shared-models/src/main/java/com/MaSoVa/shared/entity/User.java
       - Add field: String employeePIN (4 digits, indexed unique)
       - Generation logic: Last 4 digits of MongoDB ObjectId (guaranteed unique)
       - Hash PIN before storage (BCrypt) for security
       - Generate on employee creation, store hashed version
       - Return plain PIN only once (during creation) for manager to share with employee
     2. PIN Verification Endpoint
       - File: user-service/src/main/java/com/MaSoVa/user/controller/WorkingSessionController.java
       - Add endpoint: POST /api/users/sessions/clock-in-with-pin
       - Request: { employeeId, pin, storeId, managerInitiated: true }
       - Verify PIN matches employee
       - Start working session with flag: clockedInBy: managerId
     3. Auto Clock-In for Managers on Login
       - File: user-service/src/main/java/com/MaSoVa/user/service/UserService.java
       - Method: login(LoginRequest)
       - After successful JWT generation:
           - If userType == MANAGER or ASSISTANT_MANAGER
         - Call workingSessionService.startSession(userId, storeId)
         - Return session details in login response
     4. Driver Activation Control
       - File: delivery-service/src/main/java/com/MaSoVa/delivery/service/DriverAvailabilityService.java
       - Add method: activateDriverByManager(driverId, managerId, storeId)
       - Require: Driver must have active working session
       - Only then allow driver to toggle online in driver app
       - Validation: Check working session exists before accepting deliveries

     Frontend Changes:

     5. PIN Input Modal in POS
       - File: frontend/src/apps/POSSystem/POSDashboard.tsx
       - Add "Clock In Staff" button in header/sidebar
       - Modal with:
           - Employee dropdown (staff from current store)
         - 4-digit PIN input (masked)
         - "Clock In" action button
       - On success: Show notification, refresh active sessions list
     6. Active Sessions Display in POS
       - File: frontend/src/apps/POSSystem/POSDashboard.tsx
       - Add widget/panel showing currently clocked-in staff
       - Display: Name, Role, Clock-in time, Duration (live updating)
       - "Clock Out" button next to each staff (manager only)
     7. Manager Auto Clock-In on Login
       - File: frontend/src/pages/staff/StaffLoginPage.tsx
       - After login success:
           - If user role is MANAGER/ASSISTANT_MANAGER
         - Session starts automatically (backend handles)
         - Show notification: "You are now clocked in"
         - Display session timer in app header
     8. Driver App Activation Gate
       - File: frontend/src/apps/DriverApp/DeliveryHomePage.tsx
       - Disable "Go Online" toggle unless working session is active
       - Check: GET /api/users/sessions/current before allowing toggle
       - Show message: "Manager must clock you in first"

     Files to Modify:
     - shared-models/src/main/java/com/MaSoVa/shared/entity/User.java (add employeePIN field)
     - user-service/src/main/java/com/MaSoVa/user/service/UserService.java (auto clock-in on manager login)
     - user-service/src/main/java/com/MaSoVa/user/controller/WorkingSessionController.java (PIN verification endpoint)
     - user-service/src/main/java/com/MaSoVa/user/service/WorkingSessionService.java (clock-in with PIN method)
     - frontend/src/apps/POSSystem/POSDashboard.tsx (PIN modal, active sessions widget)
     - frontend/src/apps/DriverApp/DeliveryHomePage.tsx (session gate for driver activation)
     - frontend/src/pages/staff/StaffLoginPage.tsx (manager auto clock-in notification)

     ---
     Phase 3: Working Session Display and Break Time Clarification

     Requirement

     - Active sessions should show: Employee name, Role, Clock-in time, Current duration
     - Clarify relationship between break time and current duration
     - Ensure accuracy of duration calculations

     Implementation Strategy

     Break Time and Duration Relationship:
     - Current Duration = now() - loginTime
     - Working Duration = Current Duration - breakDurationMinutes
     - Break Time = Accumulated break periods during shift
     - Example:
       - Clock in: 9:00 AM
       - Current time: 3:00 PM → Current Duration: 6 hours
       - Break taken: 30 minutes → Working Duration: 5.5 hours

     Frontend Display Enhancement:

     1. Active Sessions Component
       - File: frontend/src/pages/manager/StaffManagementPage.tsx
       - Display table with columns:
           - Name | Role | Clock-in Time | Break Time | Current Duration | Working Duration
       - Add tooltip explaining: "Working Duration = Current Duration - Break Time"
       - Live update every 60 seconds
     2. POS Dashboard Widget
       - File: frontend/src/apps/POSSystem/POSDashboard.tsx
       - Compact card view:
           - Avatar + Name + Role
         - Clock-in: HH:MM AM/PM
         - Duration: "5h 23m" (live updating)
         - Break indicator: "Break: 30m" (if break taken)
     3. Break Recording UI
       - Add "Record Break" button for each active session
       - Modal input: Break duration in minutes (default options: 15, 30, 60)
       - Calls: POST /api/users/sessions/{employeeId}/break with { durationMinutes }

     Backend Validation:

     4. Break Time Rules
       - File: user-service/src/main/java/com/MaSoVa/user/service/WorkingSessionService.java
       - Validation in addBreakTime():
           - Total breaks cannot exceed 25% of current duration
         - Maximum single break: 120 minutes (2 hours)
         - Minimum break for shifts >6 hours: 30 minutes (compliance)
       - Add violation if rules broken: INSUFFICIENT_BREAKS or EXCESSIVE_BREAKS
     5. Duration Calculation Consistency
       - Method: calculateTotalHours()
       - Formula: (logoutTime - loginTime) - (breakDurationMinutes / 60.0)
       - Store with 2 decimal precision
       - Add fields to response:
           - currentDurationMinutes (live)
         - workingDurationMinutes (excluding breaks)
         - breakDurationMinutes (total breaks)

     Files to Modify:
     - frontend/src/pages/manager/StaffManagementPage.tsx (enhanced session table)
     - frontend/src/apps/POSSystem/POSDashboard.tsx (active sessions widget)
     - user-service/src/main/java/com/MaSoVa/user/service/WorkingSessionService.java (break validation)
     - shared-models/src/main/java/com/MaSoVa/shared/entity/WorkingSession.java (add helper methods for duration calc)

     ---
     Phase 4: Live Driver Tracking on Maps

     Requirement

     - Manager: Click driver name on /manager/drivers → see live location on map
     - Customer: Track driver live for online delivery orders from /menu
     - Real-time location updates via WebSocket

     Implementation Strategy

     Manager Driver Tracking:

     1. Driver Row Click Handler
       - File: frontend/src/pages/manager/DriverManagementPage.tsx
       - Make driver name clickable in table
       - On click: Open modal with live map
       - Modal components:
           - Driver details (name, phone, status, current delivery)
         - Live map component (OpenStreetMap via React Leaflet)
         - Current location marker with auto-center
         - Delivery route if driver has active delivery
     2. Live Map Integration in Manager View (OpenStreetMap)
       - Create component: frontend/src/components/delivery/ManagerDriverTrackingMap.tsx
       - Uses OpenStreetMap tiles (free) - No API key required
       - React Leaflet library (already in dependencies)
       - Uses useDriverLocationWebSocket(driverId) hook
       - WebSocket topic: /topic/driver/{driverId}/location
       - Auto-updates marker position every location broadcast
       - Shows:
           - Driver marker (animated blue circle with vehicle icon)
         - Store marker (red pin - origin)
         - Delivery address marker (green pin - destination)
         - Route polyline if available (from OSRM routing)

     Customer Driver Tracking:

     3. Order Tracking Enhancement (OpenStreetMap)
       - File: frontend/src/pages/customer/LiveTrackingPage.tsx
       - Uses OpenStreetMap via React Leaflet (free alternative)
       - Already has WebSocket integration (confirmed in exploration)
       - Verify:
           - Only online delivery orders show tracking
         - Driver location updates in real-time
         - ETA updates based on OSRM routing (free)
       - Add restriction: Dine-in and takeaway orders don't show driver tracking
       - Display: Driver marker, customer location marker, route polyline
     4. Driver Location Broadcasting
       - Backend: delivery-service/src/main/java/com/MaSoVa/delivery/service/LiveTrackingService.java
       - Method: updateDriverLocation(DriverLocationUpdate)
       - Broadcasts to: /topic/driver/{driverId}/location
       - Already implemented (confirmed in exploration)
       - Ensure: Location updates every 10 seconds from driver app
       - Uses OSRM (Open Source Routing Machine) for routing - completely free

     Driver App Location Sharing:

     5. Enable Continuous Location Updates
       - File: frontend/src/apps/DriverApp/DeliveryHomePage.tsx
       - When driver goes online:
           - Request geolocation permissions
         - Start navigator.geolocation.watchPosition()
         - Send location to backend every 10 seconds
         - Endpoint: POST /api/delivery/location-update
     6. Location Update Payload
     {
       driverId: string,
       latitude: number,
       longitude: number,
       accuracy: number,
       speed: number,
       heading: number,
       timestamp: ISO8601
     }

     Files to Modify:
     - frontend/src/pages/manager/DriverManagementPage.tsx (add clickable driver names, map modal)
     - frontend/src/components/delivery/ManagerDriverTrackingMap.tsx (NEW - manager map component)
     - frontend/src/pages/customer/LiveTrackingPage.tsx (verify order type restrictions)
     - frontend/src/apps/DriverApp/DeliveryHomePage.tsx (continuous location broadcasting)
     - frontend/src/hooks/useDriverLocationWebSocket.ts (reusable WebSocket hook)

     ---
     Phase 5: Payment Method Restrictions

     Requirement

     - Online deliveries: No cash option, only card/UPI
     - Dine-in: Remove completely from POS and customer payment pages
     - Clear visibility into cash payment transactions

     Implementation Strategy

     Customer Payment Page:

     1. Remove Dine-In Option
       - File: frontend/src/pages/customer/PaymentPage.tsx
       - Order type dropdown: Remove "DINE_IN" option (line ~200)
       - Only show: "DELIVERY" and "TAKEAWAY"
       - Update validation to reject DINE_IN orders
     2. Conditional Payment Method Display
       - For DELIVERY orders:
           - Hide "CASH" radio button
         - Only show: CARD, UPI, NETBANKING, WALLET
       - For TAKEAWAY orders:
           - Show all payment methods including CASH
       - Logic:
       const availablePaymentMethods = orderType === 'DELIVERY'
       ? ['CARD', 'UPI', 'NETBANKING', 'WALLET']
       : ['CASH', 'CARD', 'UPI', 'NETBANKING', 'WALLET'];

     POS System:

     3. Remove Dine-In from POS
       - File: frontend/src/apps/POSSystem/components/CustomerPanel.tsx
       - Order type buttons: Remove DINE_IN button (line ~48-50)
       - Only show: DELIVERY and PICKUP
       - Update default payment method mapping:
           - DELIVERY → CARD
         - PICKUP → CASH or CARD
     4. Cash Transaction Visibility
       - File: frontend/src/apps/POSSystem/POSDashboard.tsx
       - Add widget: "Today's Cash Transactions"
       - Display:
           - Total cash collected
         - Number of cash transactions
         - Last cash transaction details
       - Query: useGetTransactionsByMethodQuery({ method: 'CASH', date: today })

     Backend Validation:

     5. Payment Method Validation
       - File: payment-service/src/main/java/com/MaSoVa/payment/service/PaymentService.java
       - Add validation in initiatePayment():
       if (orderType == OrderType.DELIVERY && paymentMethod == PaymentMethod.CASH) {
         throw new ValidationException("Cash payment not allowed for delivery orders");
     }
     6. Order Type Validation
       - File: order-service/src/main/java/com/MaSoVa/order/service/OrderService.java
       - Reject DINE_IN orders from API (return 400 Bad Request)
       - Message: "Dine-in orders are currently disabled"

     Cash Reconciliation Enhancement:

     7. Daily Cash Report
       - File: frontend/src/pages/manager/PaymentDashboardPage.tsx
       - Add section: "Cash Reconciliation"
       - Display:
           - Expected cash (from transactions)
         - Actual cash (manual entry by manager)
         - Difference (red if mismatch)
       - Export button: Download CSV of cash transactions

     Files to Modify:
     - frontend/src/pages/customer/PaymentPage.tsx (remove dine-in, conditional payment methods)
     - frontend/src/apps/POSSystem/components/CustomerPanel.tsx (remove dine-in option)
     - frontend/src/apps/POSSystem/POSDashboard.tsx (cash transaction widget)
     - frontend/src/pages/manager/PaymentDashboardPage.tsx (cash reconciliation section)
     - payment-service/src/main/java/com/MaSoVa/payment/service/PaymentService.java (payment method validation)
     - order-service/src/main/java/com/MaSoVa/order/service/OrderService.java (order type validation)

     ---
     Phase 6: Staff Profile Pages (Similar to Driver Profile)

     Requirement

     - Staff should have profile page showing:
       - Profile details (editable)
       - Working session history with dates, times, durations
       - Earnings/stats if applicable
     - Changes reflected in manager's staff management page

     Implementation Strategy

     Backend Endpoints:

     1. Staff Profile Endpoint
       - File: user-service/src/main/java/com/MaSoVa/user/controller/UserController.java
       - Add: GET /api/users/profile/{employeeId} - Get full profile
       - Add: PUT /api/users/profile/{employeeId} - Update profile
       - Returns: User details + recent sessions + stats
     2. Session History Endpoint
       - File: user-service/src/main/java/com/MaSoVa/user/controller/WorkingSessionController.java
       - Enhance: GET /api/users/sessions/{employeeId} to include pagination
       - Query params: ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&page=0&size=20
       - Response includes:
           - Session details (date, loginTime, logoutTime, totalHours, breaks)
         - Violations (if any)
         - Approval status
         - Total earnings (if applicable)

     Frontend Staff Profile Page:

     3. Create StaffProfilePage Component
       - File: frontend/src/pages/staff/StaffProfilePage.tsx (NEW)
       - Route: /staff/profile (for logged-in staff to view own profile)
       - Route: /manager/staff/{staffId}/profile (for managers to view staff profiles)
       - Sections:
           - Personal Information (editable)
               - Name, email, phone, address
           - Employee PIN display (masked)
           - Save button
         - Working Sessions (table)
               - Date | Clock-in | Clock-out | Duration | Break | Status
           - Pagination (20 per page)
           - Date range filter
         - Stats Cards
               - Total hours this month
           - Average hours per shift
           - Total breaks taken
           - Sessions requiring approval
         - Performance (if applicable)
               - Orders handled (for POS staff)
           - Customer ratings (if collected)
     4. Edit Profile Modal
       - Allow staff to edit:
           - Phone number
         - Address
         - Profile picture (optional)
       - Manager can edit:
           - All above + role + permissions + store assignment
     5. Link from Staff Management Page
       - File: frontend/src/pages/manager/StaffManagementPage.tsx
       - Make staff name clickable
       - On click: Navigate to /manager/staff/{staffId}/profile
       - Or open modal with profile details

     Files to Create/Modify:
     - frontend/src/pages/staff/StaffProfilePage.tsx (NEW - staff profile component)
     - user-service/src/main/java/com/MaSoVa/user/controller/UserController.java (profile endpoints)
     - frontend/src/pages/manager/StaffManagementPage.tsx (add profile links)
     - frontend/src/store/api/userApi.ts (profile CRUD operations)

     ---
     Phase 7: Staff Scheduling System

     Requirement

     - Manager can assign schedules to staff from Staff Management page
     - Clicking staff opens their profile with schedule tab
     - Manager gets notification Thursday-Sunday to create next week's schedule
     - 

     Implementation Strategy

     Backend Scheduling:

     1. Schedule Management Endpoints
       - File: user-service/src/main/java/com/MaSoVa/user/controller/ShiftController.java
       - Already has basic shift endpoints (confirmed in exploration)
       - Enhance: POST /api/shifts/bulk-create for weekly schedule creation
       - Add: GET /api/shifts/store/{storeId}/week?startDate=YYYY-MM-DD
       - Add: PUT /api/shifts/{shiftId} - Update shift
       - Add: DELETE /api/shifts/{shiftId} - Cancel shift (only if not started)
     2. Notification System (In-App Banner + Push)
       - Primary: In-App Banner (always shown)
       - Secondary: Browser Push Notification (if enabled)
       - No email notifications per user preference

     In-App Banner:
       - File: frontend/src/pages/manager/DashboardPage.tsx
       - Check if current day is Thu/Fri/Sat/Sun
       - Query next week's schedule existence
       - Show banner if incomplete: "⚠️ Create next week's schedule"

     Push Notification:
       - File: frontend/src/services/pushNotificationService.ts (NEW)
       - Request permission on manager first login
       - Send browser push on Thursday at 9 AM (via Service Worker)
       - Notification: "Time to create next week's schedule for your team"
       - Click opens: /manager/staff-scheduling

     Frontend Schedule Management:

     3. Weekly Schedule View
       - File: frontend/src/pages/manager/StaffSchedulingPage.tsx (NEW)
       - Route: /manager/staff-scheduling
       - Calendar-style grid view:
           - Rows: Staff members
         - Columns: Days of week (Mon-Sun)
         - Cells: Shift details (time range, type)
       - Features:
           - Week navigation (previous/next)
         - Drag-and-drop shifts (optional)
         - Bulk create shifts for entire week
         - Copy previous week's schedule
     4. Staff Profile Schedule Tab
       - File: frontend/src/pages/staff/StaffProfilePage.tsx
       - Add tab: "Schedule"
       - Display upcoming shifts:
           - Date | Day | Start Time | End Time | Type | Status
       - Manager can add/edit/remove shifts for this staff member
       - Staff can view only (no edit permissions)
     5. Notification Banner in Manager Dashboard
       - File: frontend/src/pages/manager/DashboardPage.tsx
       - Check current day: If Thursday, Friday, Saturday, or Sunday
       - Check if next week's schedule exists:
           - Query: GET /api/shifts/store/{storeId}/week?startDate={nextMonday}
         - If empty or incomplete: Show banner
       - Banner message: "⚠️ Create next week's schedule for your team"
       - Button: "Go to Scheduling" → Navigate to /manager/staff-scheduling

     Shift Template System:

     6. Create Shift Templates
       - File: frontend/src/pages/manager/StaffSchedulingPage.tsx
       - Allow manager to save recurring shift patterns:
           - Template name: "Morning Shift", "Evening Shift", "Full Day"
         - Time range: 9:00 AM - 5:00 PM
         - Days of week: Mon, Tue, Wed, Thu, Fri
       - Apply template to staff member with one click

     Files to Create/Modify:
     - frontend/src/pages/manager/StaffSchedulingPage.tsx (NEW - weekly schedule view)
     - frontend/src/pages/staff/StaffProfilePage.tsx (add schedule tab)
     - frontend/src/pages/manager/DashboardPage.tsx (schedule reminder banner)
     - notification-service/src/main/java/com/MaSoVa/notification/scheduler/ScheduleReminderScheduler.java (NEW - cron job)
     - user-service/src/main/java/com/MaSoVa/user/controller/ShiftController.java (bulk create endpoint)
     - frontend/src/store/api/shiftApi.ts (NEW - schedule API hooks)

     ---
     Phase 8: Driver Online Status Persistence

     Requirement

     - Driver toggles online in /driver app
     - On page refresh, driver should remain online (status persists)

     Implementation Strategy

     Backend Persistence:

     1. Driver Status Entity
       - File: shared-models/src/main/java/com/MaSoVa/shared/entity/User.java
       - Field already exists: EmployeeDetails.status (AVAILABLE, ON_DUTY, OFF_DUTY, BUSY)
       - Ensure: Status persisted to MongoDB on toggle
     2. Status Update Endpoint
       - File: delivery-service/src/main/java/com/MaSoVa/delivery/controller/DispatchController.java
       - Add: PUT /api/delivery/driver/status
       - Request: { driverId, status: "AVAILABLE" | "OFF_DUTY" }
       - Updates user.employeeDetails.status in database
       - Also update User entity in user-service via REST call
     3. Get Current Status Endpoint
       - Add: GET /api/delivery/driver/{driverId}/status
       - Returns current status from database
       - Used on page load to restore toggle state

     Frontend State Management:

     4. Persist Toggle State to Backend
       - File: frontend/src/apps/DriverApp/DeliveryHomePage.tsx
       - On toggle change:
           - Call: PUT /api/delivery/driver/status with new status
         - Wait for success response
         - Update local state only after backend confirms
       - On component mount:
           - Call: GET /api/delivery/driver/{driverId}/status
         - Set toggle state based on response
         - Start location broadcasting if status is AVAILABLE
     5. Redux State Sync
       - File: frontend/src/store/slices/driverSlice.ts
       - Add: driverStatus field in state
       - Actions: setDriverStatus, updateDriverStatus
       - Persist to localStorage as fallback

     Error Handling:

     6. Handle Status Update Failures
       - If backend call fails:
           - Revert toggle state
         - Show error: "Failed to update status. Please try again."
         - Don't start location broadcasting
     7. Stale Status Detection
       - On app initialization:
           - Check last status update timestamp
         - If >12 hours ago, reset to OFF_DUTY
         - Require driver to explicitly go online again

     Files to Modify:
     - frontend/src/apps/DriverApp/DeliveryHomePage.tsx (persist toggle state to backend)
     - delivery-service/src/main/java/com/MaSoVa/delivery/controller/DispatchController.java (status endpoints)
     - frontend/src/store/api/driverApi.ts (status update mutations)
     - frontend/src/store/slices/driverSlice.ts (driver state management)

     ---
     Phase 9: Delivery Metrics Verification

     Requirement

     - Verify satisfaction rate calculation (customer ratings)
     - Verify on-time rate calculation (distance/time based on maps)
     - Ensure max delivery time shown to customer and driver
     - Confirm all features are fully functional

     Implementation Strategy

     Satisfaction Rate Review:

     1. Customer Rating Collection
       - Verify endpoint exists: POST /api/reviews (in review-service)
       - After delivery completion, send rating request to customer
       - Rating: 1-5 stars + optional comment
       - Link rating to delivery tracking record
     2. Rating Integration in Delivery Tracking
       - File: delivery-service/src/main/java/com/MaSoVa/delivery/entity/DeliveryTracking.java
       - Add field: customerRating (Integer, 1-5)
       - Add field: ratingComment (String, optional)
       - Update when customer submits rating
     3. Satisfaction Calculation
       - File: delivery-service/src/main/java/com/MaSoVa/delivery/service/PerformanceService.java
       - Method: calculateSatisfactionRate(driverId, startDate, endDate)
       - Formula: AVG(customerRating) WHERE deliveredAt BETWEEN dates
       - Already implemented (confirmed in exploration)

     On-Time Rate Review:

     4. ETA Calculation
       - File: delivery-service/src/main/java/com/MaSoVa/delivery/service/RouteOptimizationService.java
       - Uses OSRM for distance calculation (confirmed)
       - ETA formula: distance / averageSpeed + preparationTime
       - Average speed: 30 km/h in urban areas (configurable)
       - Preparation time: Fetched from order-service
     5. On-Time Determination
       - File: delivery-service/src/main/java/com/MaSoVa/delivery/entity/DeliveryTracking.java
       - Field: onTime (boolean)
       - Set when delivery completed:
       onTime = actualDeliveryMinutes <= estimatedDeliveryMinutes + 5;
       - 5-minute buffer for tolerance
     6. Display ETA to Customer
       - File: frontend/src/pages/customer/LiveTrackingPage.tsx
       - Fetch ETA: GET /api/delivery/eta/{orderId}
       - Display: "Estimated delivery: 25-30 minutes" (range with buffer)
       - Update live as driver moves (recalculate based on remaining distance)
     7. Display ETA to Driver
       - File: frontend/src/apps/DriverApp/ActiveDeliveryPage.tsx
       - Show: "Expected arrival: 12 minutes" (based on remaining distance)
       - Update every minute based on current location

     Testing Plan:

     8. End-to-End Test Scenario
       - Create test order with known addresses
       - Assign to driver
       - Track delivery through all statuses
       - Verify ETA calculations at each stage
       - Complete delivery (on-time and late scenarios)
       - Submit customer rating
       - Check metrics in driver performance dashboard
       - Verify satisfaction and on-time rates update correctly

     Files to Verify/Modify:
     - delivery-service/src/main/java/com/MaSoVa/delivery/service/PerformanceService.java (verify calculations)
     - delivery-service/src/main/java/com/MaSoVa/delivery/service/RouteOptimizationService.java (verify ETA logic)
     - delivery-service/src/main/java/com/MaSoVa/delivery/entity/DeliveryTracking.java (verify rating fields)
     - frontend/src/pages/customer/LiveTrackingPage.tsx (verify ETA display)
     - frontend/src/apps/DriverApp/ActiveDeliveryPage.tsx (verify ETA display)
     - frontend/src/pages/manager/DeliveryManagementPage.tsx (verify metrics display)

     ---
     Phase 10: Kitchen Display System Order Flow

     Requirement

     - Fix: Order in "Ready" tab should go to "Dispatched" tab when sent to next stage
     - Manager assigns delivery driver from "Dispatched" tab
     - Order should not skip directly to "Out for Delivery" without driver assignment

     Implementation Strategy

     Backend Order Status Flow:

     1. Current Status Sequence (Confirmed from codebase)
       - File: shared-models/src/main/java/com/MaSoVa/shared/enums/OrderStatus.java
       - Actual Sequence: RECEIVED → PREPARING → OVEN → BAKED → DISPATCHED → DELIVERED
       - Kitchen Display uses: RECEIVED (new), PREPARING (cooking), OVEN (baking), BAKED (ready), DISPATCHED (waiting driver)
       - Issue: Missing OUT_FOR_DELIVERY status between DISPATCHED and DELIVERED
     2. Add Missing Status
       - File: shared-models/src/main/java/com/MaSoVa/shared/enums/OrderStatus.java
       - Add: OUT_FOR_DELIVERY between DISPATCHED and DELIVERED
       - New sequence: RECEIVED → PREPARING → OVEN → BAKED → DISPATCHED → OUT_FOR_DELIVERY → DELIVERED
       - DISPATCHED = Waiting for driver assignment
       - OUT_FOR_DELIVERY = Driver assigned and en route
     3. Status Transition Validation
       - File: order-service/src/main/java/com/MaSoVa/order/service/OrderService.java
       - Method: validateStatusTransition(currentStatus, newStatus)
       - Rules:
           - BAKED can only go to DISPATCHED
         - DISPATCHED can only go to OUT_FOR_DELIVERY (requires driver assignment)
         - OUT_FOR_DELIVERY can only go to DELIVERED
       - Throw exception if invalid transition attempted
     4. Driver Assignment Requirement
       - File: order-service/src/main/java/com/MaSoVa/order/service/OrderService.java
       - Method: updateOrderStatus(orderId, newStatus)
       - If newStatus == OUT_FOR_DELIVERY:
           - Check: Order has assigned driver (driverId not null)
         - If no driver: Reject with error "Driver must be assigned before marking as out for delivery"

     Frontend Kitchen Display:

     4. Fix Tab Structure
       - File: frontend/src/pages/kitchen/KitchenDisplayPage.tsx
       - Current tabs: RECEIVED, PREPARING, OVEN, BAKED, DISPATCHED
       - Add new tab: OUT_FOR_DELIVERY (between DISPATCHED and final tab)
       - Final tabs: RECEIVED → PREPARING → OVEN → BAKED → DISPATCHED → OUT_FOR_DELIVERY
     5. Fix Baked Tab Behavior
       - "Send to Next Stage" button for BAKED orders:
           - Should call: PUT /api/orders/{orderId}/status with status=DISPATCHED
         - NOT directly to OUT_FOR_DELIVERY or DELIVERED
       - On success: Order moves to "Dispatched" tab
     6. Dispatched Tab (Manager Assignment)
       - Display orders with status: DISPATCHED
       - Show: "Awaiting driver assignment" badge
       - "Assign Driver" button per order:
           - Opens driver selection modal
         - Options: Auto-dispatch or Manual selection
         - On assignment: Order status → OUT_FOR_DELIVERY
     7. Out for Delivery Tab
       - Display orders with status: OUT_FOR_DELIVERY
       - Show driver details (name, phone, status)
       - Track delivery progress
       - Auto-moves to DELIVERED when driver completes delivery

     Delivery Service Integration:

     7. Dispatch Notification
       - File: delivery-service/src/main/java/com/MaSoVa/delivery/service/AutoDispatchService.java
       - When driver assigned to order:
           - Update order status to OUT_FOR_DELIVERY via order-service client
         - Create delivery tracking record
         - Notify driver via push notification
         - Notify customer with driver details

     WebSocket Updates:

     8. Kitchen Display Real-Time Updates
       - File: order-service/src/main/java/com/MaSoVa/order/websocket/OrderWebSocketController.java
       - When order status changes:
           - Broadcast to: /topic/kitchen/{storeId}/orders
         - Frontend kitchen display listens and updates UI automatically

     Files to Modify:
     - frontend/src/pages/kitchen/KitchenDisplayPage.tsx (fix ready tab, add dispatched tab)
     - order-service/src/main/java/com/MaSoVa/order/service/OrderService.java (status transition validation)
     - delivery-service/src/main/java/com/MaSoVa/delivery/service/AutoDispatchService.java (update order status on assignment)
     - order-service/src/main/java/com/MaSoVa/order/websocket/OrderWebSocketController.java (verify broadcast logic)

     ---
     Phase 11: Store Selector Independence

     Requirement

     - Different management pages should allow different store selections
     - Selecting one store in one page should not affect other pages
     - Each page maintains its own store context

     Implementation Strategy

     Problem Analysis:
     Currently, store selection is saved globally in Redux (cartSlice.selectedStoreId), causing all pages to share the same store context.

     Solution: Page-Level Store Context

     1. Remove Global Store Selection
       - File: frontend/src/store/slices/cartSlice.ts
       - Keep selectedStoreId only for cart/customer-facing operations
       - Don't use for management pages
     2. Create Page-Specific Store Context
       - File: frontend/src/contexts/PageStoreContext.tsx (NEW)
       - Use React Context API for page-level store selection
       - Each management page wraps content in provider:
       <PageStoreProvider>
       {/* Page content */}
     </PageStoreProvider>
       - Context stores: selectedStoreId per page
       - Uses sessionStorage with page-specific keys
     3. Update Store Selector Component
       - File: frontend/src/components/StoreSelector.tsx
       - Add prop: contextKey (e.g., "staff-management", "inventory", "orders")
       - Store selection saves to: sessionStorage.setItem(contextKey, storeId)
       - On mount, reads from: sessionStorage.getItem(contextKey)
       - Each page uses unique contextKey
     4. Update Management Pages
       - Files:
           - frontend/src/pages/manager/StaffManagementPage.tsx
         - frontend/src/pages/manager/InventoryDashboardPage.tsx
         - frontend/src/pages/manager/OrderManagementPage.tsx
         - frontend/src/pages/manager/DeliveryManagementPage.tsx
       - Pass unique contextKey to StoreSelector:
       <StoreSelector contextKey="staff-management" />
     <StoreSelector contextKey="inventory" />
     <StoreSelector contextKey="orders" />
     5. Session Storage Structure
     sessionStorage:
       - store_context_staff-management: "STORE001"
       - store_context_inventory: "STORE002"
       - store_context_orders: "STORE001"
       - store_context_delivery: "STORE003"
     6. Cleanup on Logout
       - File: frontend/src/store/slices/authSlice.ts
       - On logout action:
           - Clear all store_context_* keys from sessionStorage
         - Reset to default behavior

     Files to Create/Modify:
     - frontend/src/contexts/PageStoreContext.tsx (NEW - page-specific context)
     - frontend/src/components/StoreSelector.tsx (add contextKey prop)
     - frontend/src/pages/manager/StaffManagementPage.tsx (use contextKey)
     - frontend/src/pages/manager/InventoryDashboardPage.tsx (use contextKey)
     - frontend/src/pages/manager/OrderManagementPage.tsx (use contextKey)
     - frontend/src/pages/manager/DeliveryManagementPage.tsx (use contextKey)
     - frontend/src/store/slices/authSlice.ts (cleanup on logout)

     ---
     Phase 12: Redirect After Re-Login from Management Page

     Requirement

     - If session expires while on management page (e.g., /manager/staff)
     - After re-login at /staff-login, should return to the same page
     - No need to navigate through all pages again

     Implementation Strategy

     Save Return URL Before Redirect:

     1. Enhanced Redirect Logic in Auth Guard
       - File: frontend/src/components/ProtectedRoute.tsx (or auth guard component)
       - Before redirecting to login:
       sessionStorage.setItem('returnUrl', window.location.pathname + window.location.search);
     navigate('/staff-login');
     2. Auth Error Interceptor
       - File: frontend/src/store/api/baseQueryWithAuth.ts
       - On 401 error after failed token refresh:
           - Save current URL: sessionStorage.setItem('returnUrl', window.location.pathname)
         - Logout and redirect to login
     3. Login Success Redirect
       - File: frontend/src/pages/staff/StaffLoginPage.tsx
       - After successful login:
       const returnUrl = sessionStorage.getItem('returnUrl');
     sessionStorage.removeItem('returnUrl');

     if (returnUrl && returnUrl !== '/staff-login') {
       navigate(returnUrl, { replace: true });
     } else {
       // Default redirect based on role
       navigate(getDefaultDashboard(userType), { replace: true });
     }
     4. Preserve Query Parameters
       - If URL has query params (e.g., /manager/orders?status=PENDING):
           - Save full URL including search params
         - Restore after login
     5. Security: Validate Return URL
       - Only allow internal paths (starts with /)
       - Reject external URLs
       - Validation:
       const isValidReturnUrl = (url: string) => {
       return url.startsWith('/') && !url.includes('//');
     };
     6. Handle Multiple Redirects
       - If user clicks logout then login again:
           - Clear returnUrl on explicit logout
       - Only use returnUrl for session timeouts

     Files to Modify:
     - frontend/src/components/ProtectedRoute.tsx (save returnUrl before redirect)
     - frontend/src/pages/staff/StaffLoginPage.tsx (restore returnUrl after login)
     - frontend/src/store/api/baseQueryWithAuth.ts (save returnUrl on 401)
     - frontend/src/store/slices/authSlice.ts (clear returnUrl on explicit logout)

     ---
     Implementation Priority and Order

     Phase Priority:

     1. High Priority (Immediate):
       - Phase 5: Payment restrictions (security concern)
       - Phase 10: Kitchen order flow fix (operational issue)
       - Phase 8: Driver status persistence (UX issue)
     2. Medium Priority:
       - Phase 2: Unified clock in/out system (core feature)
       - Phase 4: Live driver tracking (customer-facing)
       - Phase 12: Re-login redirect (UX improvement)
       - Phase 11: Store selector independence (UX improvement)
     3. Lower Priority:
       - Phase 1: Session cleanup on shutdown (nice-to-have)
       - Phase 3: Break time clarification (documentation)
       - Phase 6: Staff profile pages (enhancement)
       - Phase 7: Staff scheduling (enhancement)
       - Phase 9: Metrics verification (testing/validation)

     ---
     Testing Strategy

     Unit Tests:

     - PIN generation and validation
     - Break time calculations
     - Status transition validation
     - ETA calculations
     - Payment method restrictions

     Integration Tests:

     - Clock in/out flow end-to-end
     - Driver assignment and status updates
     - Payment flow for each order type
     - Session timeout and re-login
     - WebSocket connection and reconnection

     Manual Testing Checklist:

     - Manager auto clock-in on login
     - Staff clock-in via PIN in POS
     - Driver cannot go online without session
     - Live map tracking for managers and customers
     - Cash payment only available for takeaway
     - Dine-in option removed completely
     - Kitchen order progresses through correct statuses
     - Driver status persists on refresh
     - Different stores selected on different pages
     - Re-login returns to previous page
     - Session cleanup on service shutdown

     ---
     Critical Files Summary

     Backend Services:
     1. user-service/src/main/java/com/MaSoVa/user/service/WorkingSessionService.java
     2. user-service/src/main/java/com/MaSoVa/user/controller/WorkingSessionController.java
     3. order-service/src/main/java/com/MaSoVa/order/service/OrderService.java
     4. payment-service/src/main/java/com/MaSoVa/payment/service/PaymentService.java
     5. delivery-service/src/main/java/com/MaSoVa/delivery/service/LiveTrackingService.java

     Frontend Pages:
     1. frontend/src/apps/POSSystem/POSDashboard.tsx
     2. frontend/src/pages/manager/DriverManagementPage.tsx
     3. frontend/src/pages/kitchen/KitchenDisplayPage.tsx
     4. frontend/src/pages/customer/PaymentPage.tsx
     5. frontend/src/components/StoreSelector.tsx

     Shared Models:
     1. shared-models/src/main/java/com/MaSoVa/shared/entity/WorkingSession.java
     2. shared-models/src/main/java/com/MaSoVa/shared/entity/User.java
     3. shared-models/src/main/java/com/MaSoVa/shared/enums/OrderStatus.java

     ---
     Estimated Timeline

     - Phase 1-3: 2-3 days
     - Phase 4-6: 3-4 days
     - Phase 7-9: 3-4 days
     - Phase 10-12: 2-3 days

     Total: 10-14 days (with testing)

     ---
     Risk Mitigation

     1. Breaking Changes: All status transitions validated; backward compatibility maintained
     2. Data Migration: PIN generation for existing staff requires one-time migration script
     3. Performance: WebSocket connections monitored; implement connection pooling
     4. Security: All PINs hashed; payment validation on both frontend and backend

     ---
     Success Criteria

     - All 11 requirements fully implemented and tested
     - No regression in existing features
     - Performance metrics meet SLA (< 2s page load, < 200ms API response)
     - Zero critical bugs in production
     - Positive user feedback from managers, staff, and drivers

     ---
     End of Implementation Plan

⏺ Perfect! The plan has been approved. Now let me create a comprehensive todo list to track our progress through all 12 phases:

⏺ Excellent! I've created a comprehensive implementation plan and organized the work into 12 phases with a prioritized todo list. Let me start with the highest priority items:

  Summary of the Plan:

  The plan addresses all 11 requirements you've listed, incorporating your preferences:
  - ✅ Auto-generated 4-digit PINs from employee IDs
  - ✅ Session cleanup only on shutdown (no auto-scheduled cleanup)
  - ✅ OpenStreetMap for all tracking (free, no API costs)
  - ✅ In-app banner + push notifications for scheduling

  Implementation Order (High Priority First):

  1. Phase 5 - Payment restrictions (remove dine-in, restrict cash for delivery)
  2. Phase 10 - Kitchen order flow fix (add OUT_FOR_DELIVERY status)
  3. Phase 8 - Driver status persistence
  4. Phase 2 - Unified clock in/out with PIN system
  5. Phases 4, 11, 12 - Live tracking, store selector, return URL redirect
  6. Phases 1, 3, 6, 7, 9 - Session cleanup, break time, profiles, scheduling, metrics

  Let me start implementing Phase 5 (Payment Restrictions) as it's marked as a security concern. Shall I proceed?

  Todos
  ☐ Phase 5: Remove dine-in option and restrict cash payment for deliveries
  ☐ Phase 10: Fix kitchen order flow and add OUT_FOR_DELIVERY status
  ☐ Phase 8: Persist driver online status across page refreshes
  ☐ Phase 2: Implement unified clock in/out system with PIN authentication
  ☐ Phase 4: Add live driver tracking on maps for managers and customers
  ☐ Phase 12: Implement redirect to previous page after re-login
  ☐ Phase 11: Make store selector independent per management page
  ☐ Phase 1: Add session cleanup on service shutdown
  ☐ Phase 3: Enhance working session display with break time clarification
  ☐ Phase 6: Create staff profile pages similar to driver profile
  ☐ Phase 7: Implement staff scheduling system with notifications
  ☐ Phase 9: Verify and test delivery metrics calculations