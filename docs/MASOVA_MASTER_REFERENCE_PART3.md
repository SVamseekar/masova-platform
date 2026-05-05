# MaSoVa Platform — Master Reference Document
## Part 3 of 5: MaSoVa Crew (Staff Mobile App)

---

## 13. MASOVA CREW — STAFF MOBILE APP

**Location:** `/Users/souravamseekarmarti/Projects/MaSoVaCrewApp`
**App Name:** MaSoVa Crew
**Package:** `com.masovacrew`
**Platform:** React Native 0.83.1, React 19.2.0 (bare RN, NOT Expo Go)
**Metro port:** Default (no custom port)
**State Management:** Redux Toolkit (RTK Query) + AsyncStorage persistence
**Real-time:** STOMP WebSocket (SockJS)

---

### 13.1 Project Dependencies

```json
"react-native": "0.83.1",
"react": "19.2.0",
"@reduxjs/toolkit": "2.11.2",
"react-redux": "9.2.0",
"@react-navigation/native": "latest",
"@react-navigation/stack": "latest",
"@react-navigation/bottom-tabs": "latest",
"@notifee/react-native": "9.1.8",
"@react-native-community/geolocation": "latest",
"@react-native-community/netinfo": "latest",
"@stomp/stompjs": "7.2.1",
"sockjs-client": "1.6.1",
"react-native-image-picker": "8.2.1",
"axios": "1.13.2",
"redux-persist": "6.0.0",
"date-fns": "4.1.0"
```

---

### 13.2 API Configuration (src/config/api.config.ts)

```typescript
// Development
API_BASE_URL = 'http://192.168.50.88:8080/api'
WS_URL = 'http://192.168.50.88:8090/ws'

// Production
API_BASE_URL = 'https://api.masova.com/api'
WS_URL = 'wss://api.masova.com/ws'

TIMEOUT = 30000   // 30 seconds
```

---

### 13.3 Redux Store

**Root reducer combines:**
- `auth` — authReducer (persisted to AsyncStorage)
- `driverApi` — RTK Query slice
- `orderApi` — RTK Query slice
- `deliveryApi` — RTK Query slice
- `crewApi` — RTK Query slice

**Persist config:** Whitelist = `['auth']` only (no API cache persistence)

#### authSlice

```typescript
State {
  isAuthenticated: boolean
  accessToken: string | null
  refreshToken: string | null
  user: User | null
  loading: boolean
  error: string | null
  lastLoginAttempt: string | null
}
```

Actions: `loginStart`, `loginSuccess({accessToken, refreshToken, user})`, `loginFailure(error)`, `logout`, `refreshTokenSuccess(newToken)`, `updateUserProfile(updates)`, `clearError`, `setLoading`

Selectors: `selectAuth`, `selectCurrentUser`, `selectIsAuthenticated`, `selectAuthLoading`, `selectAuthError`

AsyncStorage keys: `auth_accessToken`, `auth_refreshToken`, `auth_user`

---

### 13.4 User Type Definitions

#### User Interface
```typescript
interface User {
  id: string
  type: 'CUSTOMER'|'STAFF'|'KITCHEN_STAFF'|'CASHIER'|'DRIVER'|'MANAGER'|'ASSISTANT_MANAGER'|'KIOSK'
  name: string
  email: string
  phone: string
  address?: Address
  isActive: boolean
  storeId?: string
  role?: string
  permissions?: string[]
  generatedPIN?: string
}
```

#### WorkingSession Interface
```typescript
interface WorkingSession {
  id: string
  employeeId: string
  storeId: string
  date: string
  loginTime: string
  logoutTime?: string
  totalHours?: number
  isActive: boolean
  breakTime: number
  status: 'ACTIVE'|'COMPLETED'|'PENDING_APPROVAL'
}
```

---

### 13.5 RTK Query API Slices

#### driverApi

**Types:** `Driver`, `DriverPerformance`, `DriverLocation`, `UpdateDriverRequest`, `LocationUpdateRequest`

**Endpoints:**
| Endpoint | Method | Path |
|----------|--------|------|
| `getDriverById(id)` | GET | `/users/{id}` |
| `getDriverByUserId(userId)` | GET | `/users/{userId}` |
| `updateDriver({id, data})` | PUT | `/users/{id}` |
| `updateDriverLocation(data)` | POST | `/delivery/location-update` |
| `getDriverPerformance({driverId, startDate?, endDate?})` | GET | `/delivery/driver/{id}/performance` |
| `getTodayDriverPerformance(driverId)` | GET | `/delivery/driver/{id}/performance?period=today` |
| `getDriverStatus(driverId)` | GET | `/users/{driverId}/status` |
| `updateDriverStatus({driverId, status})` | PUT | `/users/{driverId}/status` |

**DriverPerformance fields:**
```typescript
{
  totalDeliveries, completedDeliveries, cancelledDeliveries
  averageDeliveryTime (minutes), onTimeDeliveryPercentage
  totalDistanceCovered (km), averageRating
  totalEarnings, todayDeliveries, todayEarnings
  weekDeliveries, weekEarnings, monthDeliveries, monthEarnings
}
```

**Headers added per request:**
```
Authorization: Bearer {accessToken}
X-User-Id: {user.id}
X-User-Type: {user.type}
X-User-Store-Id: {user.storeId}
```

#### orderApi

**Types:** `KitchenOrder`, `MenuItem`, `StaffOrderRequest`, `TodayAnalytics`, `RecentOrder`

**Endpoints:**
| Endpoint | Method | Path |
|----------|--------|------|
| `getOrdersByStatus(status)` | GET | `/orders/status/{status}` |
| `updateOrderStatus({orderId, status})` | PATCH | `/orders/{orderId}/status` |
| `getKitchenOrders(storeId)` | GET | `/orders/kitchen?storeId={storeId}` |
| `advanceOrderStage(orderId)` | POST | `/orders/{orderId}/next-stage` |
| `getMenuItems(storeId)` | GET | `/menu?storeId={storeId}&available=true` |
| `placeStaffOrder(body)` | POST | `/orders` |
| `getTodayAnalytics(storeId)` | GET | `/analytics/sales?period=today&storeId={storeId}` |
| `getRecentOrders(storeId)` | GET | `/orders?storeId={storeId}&limit=5` |

**KitchenOrder fields:**
```typescript
{
  id, orderNumber, status, orderType: 'DINE_IN'|'TAKEAWAY'|'DELIVERY'
  tableNumber?, createdAt
  items: [{name, quantity, customizations?, allergens?}]
  specialInstructions?
}
```

#### deliveryApi

**Types:** `DeliveryTracking`

| Endpoint | Method | Path | Polling |
|----------|--------|------|---------|
| `getPendingDeliveries(driverId)` | GET | `/delivery/driver/{id}/pending` | 30s |
| `getActiveDeliveries(driverId)` | GET | `/delivery/driver/{id}/active` | 30s |
| `markAsPickedUp(trackingId)` | POST | `/delivery/{id}/pickup` | — |
| `markAsDelivered({trackingId, notes?})` | POST | `/delivery/{id}/deliver` | — |
| `updateLocation({driverId, lat, lng})` | POST | `/delivery/location-update` | — |
| `getDeliveryHistory({driverId, limit?})` | GET | `/delivery/driver/{id}/history` | — |

#### crewApi

**Types:** `WorkingSession`, `Shift`, `WeeklyEarnings`

| Endpoint | Method | Path |
|----------|--------|------|
| `getMyActiveSession(employeeId)` | GET | `/sessions/employee/{id}` (filters ACTIVE) |
| `getMySessionHistory({employeeId, limit?})` | GET | `/sessions/employee/{id}?limit=10&sort=date,desc` |
| `clockIn({employeeId, storeId})` | POST | `/sessions` |
| `clockOut({sessionId})` | POST | `/sessions/end` |
| `getMyUpcomingShifts({employeeId, storeId})` | GET | `/shifts?employeeId={id}&storeId={id}&upcoming=true` |
| `getMyShiftHistory({employeeId})` | GET | `/shifts?employeeId={id}&past=true` |
| `getMyWeeklyEarnings({employeeId, weekStart?})` | GET | `/staff/earnings/weekly?employeeId={id}` |
| `getMyEarningsHistory({employeeId, weeks?})` | GET | `/staff/earnings/history?employeeId={id}&weeks={n}` |

---

### 13.6 Navigation Structure

#### AppNavigator (Root)
```
Not authenticated → LoginScreen
Authenticated →
  DRIVER            → DriverTabNavigator
  KITCHEN_STAFF     → KitchenTabNavigator
  STAFF             → KitchenTabNavigator
  CASHIER           → CashierTabNavigator
  KIOSK             → CashierTabNavigator
  MANAGER           → ManagerTabNavigator
  ASSISTANT_MANAGER → ManagerTabNavigator
  Other             → StaffTabNavigator (generic fallback)
  Unsupported       → "Access Denied" screen
```

**Critical rule:** `RoleRouter` reads `user.type` from JWT — NEVER hardcode role checks inline in screens

#### DriverTabNavigator (7 tabs)

| # | Tab Label | Screen | Icon | Accent |
|---|-----------|--------|------|--------|
| 1 | Home | DeliveryHomeScreen | home | #00B14F |
| 2 | Active | ActiveDeliveryScreen | local-shipping | |
| 3 | History | DeliveryHistoryScreen | history | |
| 4 | Shifts | MyShiftsScreen | timer | |
| 5 | Schedule | MyScheduleScreen | event | |
| 6 | Earnings | MyEarningsScreen | payments | |
| 7 | Profile | MyProfileScreen | person | |

**Tab bar:** Height 64px, active colour #00B14F (driver green)

#### KitchenTabNavigator (3 tabs)

| Tab | Screen | Icon | Accent |
|-----|--------|------|--------|
| Queue | KitchenQueueScreen | restaurant | #FF6B35 |
| Shifts | MyShiftsScreen | timer | |
| Profile | MyProfileScreen | person | |

#### CashierTabNavigator (3 tabs)

| Tab | Screen | Icon | Accent |
|-----|--------|------|--------|
| Orders | QuickOrderScreen | add-circle | #2196F3 |
| Shifts | MyShiftsScreen | timer | |
| Profile | MyProfileScreen | person | |

#### ManagerTabNavigator (3 tabs)

| Tab | Screen | Icon | Accent |
|-----|--------|------|--------|
| Dashboard | QuickDashboardScreen | dashboard | #7B1FA2 |
| Staff | MyShiftsScreen (manager view) | people | |
| Profile | MyProfileScreen | person | |

#### StaffTabNavigator (4 tabs — generic fallback)

| Tab | Screen | Icon |
|-----|--------|------|
| Shifts | MyShiftsScreen | timer |
| Schedule | MyScheduleScreen | event |
| Earnings | MyEarningsScreen | payments |
| Profile | MyProfileScreen | person |

---

### 13.7 Role Colours (NEVER change these)

```typescript
DRIVER:            #00B14F  (green)
KITCHEN_STAFF:     #FF6B35  (orange)
CASHIER / KIOSK:   #2196F3  (blue)
MANAGER:           #7B1FA2  (purple)
ASSISTANT_MANAGER: #FF9800  (amber)
```

---

### 13.8 Screens — Complete Specifications

#### LoginScreen

**State:** `email`, `password`, `showPassword`, `rememberMe`, `gpsPermission`, `isCheckingGPS`

**Features:**
- Email/password form with validation (email format, password ≥ 6 chars)
- GPS permission check before login (required for drivers)
- Demo credentials preset button
- Show/hide password toggle
- Features grid (capabilities overview)
- Entrance animations (fade + slide)

**API:** POST `/api/users/login` → `{accessToken, refreshToken, user}`

**On success:** AppNavigator auto-routes via RoleRouter based on `user.type`

---

#### DeliveryHomeScreen (Driver)

**State:** `location`, `isOnline`, `sessionStartTime`, `elapsedTime`, `locationMode: 'auto'|'manual'`, `performanceData`

**Sections:**

1. **GPS Tracking Section**
   - Toggle: Auto GPS / Manual location mode
   - Real-time coordinates with accuracy display
   - Session timer (HH:MM:SS, live)
   - Location error handling with retry

2. **Location Update Flow**
   - Foreground: `Geolocation.watchPosition()` (10m distanceFilter, 5s interval)
   - Background (Android): `BackgroundLocationModule.startTracking(driverId)`
   - WebSocket: `sendLocationUpdate()` on every GPS change
   - Offline queue: queues location updates if no network

3. **Today's Performance Stats** (4 metric cards)
   - Deliveries count
   - Earnings (₹)
   - Distance (km)
   - Avg delivery time (minutes)

4. **Actions**
   - My Location → LocationMapModal (OpenStreetMap embed)
   - Support → alert with phone/email

**API polling:** GET `/api/delivery/driver/{driverId}/performance` (30s)

**WebSocket:** subscribes to `/topic/driver/{driverId}/orders` for new assignment notifications

---

#### ActiveDeliveryScreen (Driver)

**State:** `viewMode: 'list'|'map'`, `myDeliveries`, `uploadingPhoto`

**Features:**
1. **Delivery List** — FlatList of active DISPATCHED orders for current driver
2. **DeliveryCard** shows: order number, customer name+phone, address, ETA, total ₹

3. **Mark Delivered Flow:**
   - Alert: "Skip Photo" or "Take Photo"
   - Photo capture: quality 0.8, max 5MB, max 1920×1080
   - Upload via photoUploadService
   - If offline: enqueue for retry via offlineQueueService
   - Status update PATCH `/api/orders/{orderId}/status` → DELIVERED
   - Success notification via notificationService

4. **OTP Verification** (OtpVerificationScreen modal)
   - 4-digit OTP input
   - POST `/api/delivery/verify-otp` with `{orderId, otp}`

**API polling:** GET `/api/orders/status/DISPATCHED` (30s)

---

#### DeliveryHistoryScreen (Driver)

**State:** `timeFilter: 'today'|'week'|'month'|'all'`, `searchQuery`, `expandedOrder`

**Features:**
- Search by order number or customer name
- Time filter dropdown
- Grouped by date (timeline view with dot + vertical line)
- Expandable cards: time, amount, address, items (first 3, "+N more")
- **Earnings calculation: 20% commission** (`orderTotal * 0.20`)

**API polling:** GET `/api/orders/status/DELIVERED` (60s)

---

#### KitchenQueueScreen (Kitchen Staff)

**State:** `orders: KitchenOrder[]`, `advancing: string | null`

**Features:**

1. **Order Cards** — left border colour indicates urgency:
   - <5 min ago: GREEN (#00B14F)
   - 5–10 min ago: ORANGE (#FFA726)
   - >10 min ago: RED (#F44336)

2. **Card content:**
   - Order number (large) + time ago (small)
   - Status (uppercase)
   - Table number (if DINE_IN)
   - Items: "Qty× Item Name" + customizations (indented)
   - Allergen badges (all 14 EU allergens, orange background)
   - Special instructions (emoji + text)
   - "▶ Advance Status" button

**API polling:** GET `/api/orders/kitchen?storeId={storeId}` (15s)
**API mutation:** POST `/api/orders/{orderId}/next-stage`

---

#### QuickOrderScreen (Cashier/Kiosk)

**State:** `cart: CartEntry[]`, `customerName`, `orderType: 'TAKEAWAY'|'DINE_IN'`, `tableNumber`, `menu`

**Features:**
1. Customer name input
2. Order type toggle: TAKEAWAY / DINE_IN
3. Table number input (visible only for DINE_IN)
4. Menu grid (2 columns): item name, price (kiosk blue), quantity badge if in cart
5. Sticky cart bar at bottom (when items exist): "N items · ₹Total" + "Place Order (Cash)"

**Validation:** customer name required, ≥1 item, table number required for DINE_IN

**StaffOrderRequest payload:**
```typescript
{
  storeId, customerName, orderType
  tableNumber? (DINE_IN only)
  paymentMethod: 'CASH'
  createdByStaffId, items: [{menuItemId, name, quantity, price}]
}
```

**API:** GET `/api/menu?storeId={storeId}&available=true`, POST `/api/orders`

---

#### QuickDashboardScreen (Manager)

**State:** `analytics: TodayAnalytics`, `recentOrders: RecentOrder[]`

**Sections:**
1. KPI grid (2×2): Today Revenue ₹, Active Orders, Avg Prep (min), Staff On Duty
2. Recent orders list: order number, type, customer, total ₹, status badge

**API polling:**
- GET `/api/analytics/sales?period=today&storeId={storeId}` (60s)
- GET `/api/orders?storeId={storeId}&limit=5` (30s)

---

#### MyShiftsScreen (Shared — all roles)

**State:** `activeSession`, `history`, `clockingIn`, `clockingOut`

**Features:**
1. **Clock-In Card:**
   - If active: green dot + "Clocked In" + "Since HH:MM" + live duration + red "Clock Out" button
   - If not: timer icon + "Not clocked in" + role-coloured "Clock In" button

2. **Recent Sessions list:**
   - Per row: date, time range (login→logout), total hours (bold, role colour), status badge

**API calls:**
- GET `/api/sessions/employee/{employeeId}` — filter for ACTIVE
- GET `/api/sessions/employee/{employeeId}?limit=10&sort=date,desc` — history
- POST `/api/sessions` with `{employeeId, storeId}` — clock in
- POST `/api/sessions/end` with `{sessionId}` — clock out

---

#### MyScheduleScreen (Shared)

**State:** `shifts: Shift[]`

**Features:**
- Cards per upcoming shift
- If today's shift: left border (4px, role colour) + "TODAY" badge
- Shift time range + duration (bold, role colour)
- Notes (grey italic if present)

**API:** GET `/api/shifts?employeeId={id}&storeId={id}&upcoming=true`

---

#### MyEarningsScreen (Shared)

**State:** `earnings: WeeklyEarnings`

**Sections:**
1. Week header: "Jan 15 – Jan 21"
2. Stats grid (2×2): Total This Week ₹, Hours Worked, Base Pay ₹, Tips Received ₹
3. Hourly rate row (if configured): "₹XXX / hr"
4. If rate not set: info banner "Pay rate not configured. Contact your manager."

**API polling:** GET `/api/staff/earnings/weekly?employeeId={id}` (300s / 5 min)

---

#### MyProfileScreen (Shared — all roles)

**Sections:**
1. Avatar (initials on role-coloured circle) + name + role pill + store ID
2. MY DETAILS: email, phone, employee ID (first 8 chars), store
3. SETTINGS: Push Notifications toggle (role colour when on)
4. APP: version 1.0.0, role label
5. Log Out button (red, confirmation alert)

**Role label mappings:**
```
DRIVER → 'Driver'
KITCHEN_STAFF | STAFF → 'Kitchen Staff'
CASHIER | KIOSK → 'Cashier'
MANAGER → 'Manager'
ASSISTANT_MANAGER → 'Asst. Manager'
```

**On logout:** clears `driver_online_{userId}`, `driver_session_start_{userId}`, `driver_default_location_{userId}` from AsyncStorage

---

#### OtpVerificationScreen (Driver)

**Props:** `{orderId, onVerified, onCancel}`
**State:** `otp: string (4 digits)`, `error`, `loading`

**Features:**
- Modal overlay (50% black transparent)
- 4-digit numeric OTP input (centred, large)
- "Verify & Complete Delivery" button
- "Cancel" button

**API:** POST `/api/delivery/verify-otp` with `{orderId, otp}` → `{verified: boolean}`

---

### 13.9 Services

#### locationService.ts

```typescript
class LocationService (singleton) {
  requestLocationPermission(): Promise<boolean>
    // Android: ACCESS_FINE_LOCATION + ACCESS_BACKGROUND_LOCATION

  getCurrentLocation(): Promise<Location>
    // enableHighAccuracy: true, timeout: 15s, maxAge: 10s

  startTracking(onUpdate, options?): Promise<void>
    // Geolocation.watchPosition(), distanceFilter: 10m, interval: 5s

  stopTracking(): void

  saveDefaultLocation(userId, location): Promise<void>
  getDefaultLocation(userId): Promise<Location | null>
    // AsyncStorage: `driver_default_location_{userId}`

  calculateDistance(loc1, loc2): number
    // Haversine formula, returns km

  formatForApi(driverId, location): LocationUpdate
    // GeoJSON Point: {driverId, location: {type: 'Point', coordinates: [lon, lat]}, timestamp}
}
```

#### websocketService.ts (STOMP/SockJS)

```typescript
class WebSocketService (singleton) {
  connect(): Promise<void>
    // SockJS to {WS_URL}/delivery, reconnectDelay: 5s, heartbeat: 4s

  disconnect(): void

  sendLocationUpdate(driverId, location)
    // Publishes to /app/location-update

  subscribeToDriverLocation(driverId, callback)
    // Topic: /topic/driver/{driverId}/location

  subscribeToOrderTracking(orderId, callback)
    // Topic: /topic/order/{orderId}/tracking

  subscribeToDriverOrders(driverId, callback)
    // Topic: /topic/driver/{driverId}/orders
    // Auto-shows push notification on new assignment
}
```

**Disconnect handling:**
- Warning after 30s disconnected
- Auto-logout after 60s disconnected
- Callbacks: `onConnectionLost()`, `onAutoLogout()`

#### notificationService.ts (@notifee/react-native)

```typescript
class NotificationService (singleton) {
  initialize(): Promise<void>
    // Creates Android channel "masova-driver-channel"
    // Importance: HIGH, Visibility: PUBLIC, Vibration: [300, 500]ms

  notifyNewDelivery(orderNumber, customerName, address, orderId)
    // Title: "New Delivery Assignment"
    // Actions: "View Details" | "Navigate"

  notifyDeliveryUpdate(orderNumber, status, orderId)
    // Status-specific messages: PICKED_UP / IN_TRANSIT / DELIVERED / CANCELLED

  notifyCustomerMessage(orderNumber, customerName, message, orderId)

  cancelNotification(notificationId)
  cancelAllNotifications()
  areNotificationsEnabled(): Promise<boolean>
}
```

#### cameraService.ts (react-native-image-picker)

```typescript
class CameraService (singleton) {
  takePhoto(options?): Promise<CapturedImage | null>
    // Defaults: quality 0.8, maxWidth 1920, maxHeight 1080, back camera

  pickFromGallery(options?): Promise<CapturedImage | null>
  selectPhoto(options?): Promise<CapturedImage | null>
    // Shows alert: Camera | Gallery | Cancel

  isValidSize(image, maxSizeMB=5): boolean
  createFormData(image, fieldName='photo'): FormData
    // Filename: `delivery-proof-{timestamp}.jpg`
}
```

#### photoUploadService.ts

```typescript
class PhotoUploadService (singleton) {
  uploadProofOfDelivery(orderId, photo, token): Promise<PhotoUploadResult>
    // POST /delivery/{orderId}/proof (multipart/form-data), timeout 30s
    // On network error: enqueues via offlineQueueService

  validatePhotoSize(photo, maxSizeMB=5): boolean
  estimateUploadTime(photo, uploadSpeedKBps=100): number
}
```

#### backgroundLocationService.ts (native Android module)

```typescript
class BackgroundLocationService (singleton) {
  startTracking(driverId): Promise<{success, message}>
    // Calls native BackgroundLocationModule.startTracking() (Android only)

  stopTracking(): Promise<{success, message}>
  isTracking(): Promise<boolean>

  onLocationUpdate(callback): {remove: () => void}
    // NativeEventEmitter 'onLocationUpdate' event
    // BackgroundLocation: {latitude, longitude, accuracy, altitude, speed, bearing, timestamp}

  onLocationError(callback): {remove: () => void}
  removeAllListeners(): void
  formatForAPI(location): GeoJSON Point
  isSupported(): boolean  // Android only
}
```

#### offlineQueueService.ts

```typescript
class OfflineQueueService (singleton) {
  // QueueActionTypes: LOCATION_UPDATE, ORDER_STATUS_UPDATE, DELIVERY_COMPLETE, PHOTO_UPLOAD

  enqueue(type, payload, maxRetries=3): Promise<void>
    // Adds to queue, saves to AsyncStorage '@masova_offline_queue'
    // Queue limit: 1000 items
    // Tries to process immediately if online

  processQueue(): Promise<void>
    // Per-type handler: locationUpdate → websocket, others → API
    // Increments retryCount on failure, removes on success or maxRetries exceeded

  getQueueSize(): number
  isNetworkOnline(): boolean
  clearQueue(): void
  stop(): void
}
```

**Network monitoring:** `NetInfo.addEventListener()` — auto-processes queue on reconnect, periodic sync every 30s

---

### 13.10 Shared Components

#### ActionButton
```typescript
Props: { title, onPress, variant?: 'primary'|'secondary'|'outline'|'danger',
         size?: 'small'|'medium'|'large', disabled?, loading?, icon?, fullWidth? }

Variants: primary=green, secondary=alt bg, outline=transparent+border, danger=red
Heights: small 36, medium 48, large 56
```

#### MetricCard
```typescript
Props: { label, value, icon?, trend?: 'up'|'down'|'neutral', trendValue?,
         variant?: 'default'|'success'|'warning'|'error' }

Features: icon with 20% opacity coloured bg, trend indicator (↑ green, ↓ red)
```

#### DeliveryCard
```typescript
Props: { delivery: Delivery, onPress?, showActions? }
// Shows: order number, status badge, customer name+address+phone, ETA, distance, total
```

#### StatusBadge
```typescript
Props: { status: 'online'|'offline'|'delivering'|'idle', label?, showPulse?, size? }
Colors: online=#00B14F, offline=#AFAFAF, delivering=#2196F3, idle=#FFA726
```

#### ErrorBoundary
```typescript
Props: { children, fallback?, onError? }
// Fallback: error icon + "Try Again" button
```

#### LocationMapModal
```typescript
Props: { visible, onClose, location }
// Shows: coordinates, OpenStreetMap embed (300px), Google Maps + OSM buttons, My Location recenter
```

---

### 13.11 Design Tokens (driverDesignTokens.ts)

#### Colours
```
Primary: black #000, white #FFF, green #00B14F, greenDark #009640, greenLight #E8F5E9
Surface: background #FFF, backgroundAlt #F6F6F6, border #E8E8E8
Text: primary #000, secondary #5E5E5E, tertiary #8E8E8E, disabled #AFAFAF, inverse #FFF
Semantic: success, error, warning, info (+ light backgrounds)
Status: online #00B14F, offline #AFAFAF, delivering #2196F3, idle #FFA726
Roles: driver #00B14F, kitchen #FF6B35, kiosk #2196F3, manager #7B1FA2, assistantManager #FF9800
```

#### Typography
```
Families: System (iOS), Roboto (Android)
Sizes: tiny 10, small 12, body 16, h2 18, h1 24, hero 32
Weights: regular 400, medium 500, semibold 600, bold 700
Line heights: tight 1.2, normal 1.5, relaxed 1.75
```

#### Spacing
```
xs 4, sm 8, md 12, base 16, lg 24, xl 32, xxl 48, xxxl 64
```

#### Border Radius
```
xs 4, sm 8, md 12, lg 16, xl 24, full 9999
```

#### Shadows
```
none (0 elevation)
subtle: shadow offset (0,2), opacity 0.08, radius 8, elevation 2
card: offset (0,4), opacity 0.10, radius 12, elevation 4
elevated: offset (0,8), opacity 0.12, radius 24, elevation 8
greenGlow: special driver online status
```

#### Animations
```
fast 150ms, normal 300ms, slow 500ms
```

#### Component Sizes
```
button heights: small 36, medium 48, large 56
avatar: small 32, medium 48, large 64, hero 120
statusBadge: height 32, dot 8px
bottomNav: height 64
topBar: height 64
```

**Helper:** `getRoleColor(type?)` → returns role-specific hex colour

---

### 13.12 Constants

#### Allergens (allergens.ts)
All 14 EU Regulation 1169/2011 mandatory allergens:
```
CELERY → 'Cel'     CEREALS_GLUTEN → 'Glu'   CRUSTACEANS → 'Cru'
EGGS → 'Egg'       FISH → 'Fish'             LUPIN → 'Lup'
MILK → 'Milk'      MOLLUSCS → 'Mol'          MUSTARD → 'Mus'
NUTS → 'Nuts'      PEANUTS → 'Pnt'           SESAME → 'Ses'
SOYA → 'Soy'       SULPHUR_DIOXIDE → 'SO₂'
```

#### Error Messages (errorMessages.ts)
Centralised UX error strings for all scenarios:
- Network: NETWORK_UNAVAILABLE, WEBSOCKET_CONNECTION_FAILED
- Location: LOCATION_PERMISSION_DENIED, GPS_UNAVAILABLE, GPS_TIMEOUT, GPS_SIGNAL_WEAK
- Camera: CAMERA_PERMISSION_DENIED, CAMERA_UNAVAILABLE, PHOTO_TOO_LARGE (max 5MB)
- Upload: UPLOAD_FAILED, UPLOAD_QUEUED (offline retry message)
- Auth: UNAUTHORIZED ("Session Expired"), SESSION_REQUIRED ("Clock In Required")

---

### 13.13 AsyncStorage Keys

```
auth_accessToken
auth_refreshToken
auth_user
driver_online_{userId}
driver_session_start_{userId}
driver_default_location_{userId}
@masova_offline_queue
```

---

### 13.14 Android Permissions

```xml
ACCESS_FINE_LOCATION (foreground GPS)
ACCESS_BACKGROUND_LOCATION (background GPS for drivers)
ACCESS_COARSE_LOCATION
CAMERA
POST_NOTIFICATIONS (Android 13+)
INTERNET
ACCESS_NETWORK_STATE
```

### iOS Permissions (Info.plist)
```
NSLocationWhenInUseUsageDescription
NSLocationAlwaysAndWhenInUseUsageDescription
NSCameraUsageDescription
NSPhotoLibraryUsageDescription
NSUserNotificationsUsageDescription
```

---

### 13.15 Role-Based Feature Matrix

| Feature | Driver | Kitchen | Cashier | Manager | Generic |
|---------|:------:|:-------:|:-------:|:-------:|:-------:|
| Delivery Home (GPS tracking) | ✓ | — | — | — | — |
| Active Deliveries | ✓ | — | — | — | — |
| Delivery History | ✓ | — | — | — | — |
| Kitchen Queue | — | ✓ | — | — | — |
| Quick Order (POS) | — | — | ✓ | — | — |
| Analytics Dashboard | — | — | — | ✓ | — |
| My Shifts (clock in/out) | ✓ | ✓ | ✓ | ✓ | ✓ |
| My Schedule | ✓ | — | — | — | ✓ |
| My Earnings | ✓ | — | — | — | ✓ |
| My Profile | ✓ | ✓ | ✓ | ✓ | ✓ |
| GPS Tracking | ✓ | — | — | — | — |
| Push Notifications | ✓ | ✓ | ✓ | ✓ | ✓ |

---

### 13.16 WebSocket Topics Summary

| Topic | Direction | Content |
|-------|-----------|---------|
| `/topic/driver/{driverId}/location` | Subscribe | `{driverId, lat, lng, accuracy, ...}` |
| `/topic/order/{orderId}/tracking` | Subscribe | `{orderId, status, driverName, driverLocation, eta, ...}` |
| `/topic/driver/{driverId}/orders` | Subscribe | `{orderId, orderNumber, customer, address, total, items, timestamp}` |
| `/app/location-update` | Publish | `{driverId, latitude, longitude, accuracy, speed, heading, timestamp}` |

---

*Continued in Part 4: Customer Mobile App (masova-mobile)*
