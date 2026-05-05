# MaSoVa Platform — Master Reference Document
## Part 4 of 5: Customer Mobile App (masova-mobile)

---

## 14. MASOVA CUSTOMER MOBILE APP

**Location:** `/Users/souravamseekarmarti/Projects/masova-mobile`
**App Name:** MaSoVa
**Package:** `com.masovamobile`
**Platform:** React Native 0.81.5, React 19.1.0, Expo 54.0.33 (bare workflow — NOT Expo Go)
**Metro port:** 8888 (`npm run start`)
**State Management:** React Context API (Auth, Cart, Store, Theme) + TanStack React Query v5
**Real-time:** STOMP WebSocket (native, not SockJS — Hermes limitation)

---

### 14.1 Project Dependencies

```json
"react-native": "0.81.5",
"react": "19.1.0",
"expo": "54.0.33",
"@react-navigation/bottom-tabs": "7.9.0",
"@react-navigation/native": "7.1.26",
"@react-navigation/native-stack": "7.9.0",
"@tanstack/react-query": "5.90.16",
"axios": "1.13.2",
"expo-linear-gradient": "latest",
"expo-blur": "latest",
"expo-haptics": "latest",
"expo-location": "latest",
"react-native-maps": "1.20.1",
"@stomp/stompjs": "7.2.1",
"suncalc": "1.9.0",
"@react-native-async-storage/async-storage": "2.2.0"
```

**Scripts:** `npm run android`, `npm run ios`, `npm start` (port 8888), `npm run build:android`, `npm run clean`

---

### 14.2 App Configuration (app.json)

```json
{
  "name": "MaSoVa",
  "package": "com.masovamobile",
  "splash": { "backgroundColor": "#0F0F0F" },
  "extra": {
    "apiUrl": "https://api.masova.app",
    "agentUrl": "https://agent.masova.app",
    "easProjectId": "masova-customer"
  },
  "android": { "edgeToEdgeEnabled": true, "adaptiveIcon": { "backgroundColor": "#0F0F0F" } },
  "ios": { "bundleIdentifier": "com.masovamobile", "supportsTablet": true }
}
```

---

### 14.3 Root Application (App.tsx)

**Provider stack (outer → inner):**
```
QueryClientProvider (staleTime: 5min, retry: 2)
  → ThemeProvider (sunrise/sunset-based dark/light switching)
    → AuthProvider (JWT + AsyncStorage persistence)
      → StoreProvider (selected store + AsyncStorage)
        → CartProvider (cart items + AsyncStorage)
          → RootNavigator (navigationRef)
```

**Font loading:** PlusJakartaSans-Regular, Medium, SemiBold, Bold, ExtraBold

**StatusBar:** Dynamic style (light-content for dark theme, dark-content for light theme)

---

### 14.4 Contexts

#### AuthContext

```typescript
interface User {
  id: string
  name: string
  email: string
  phone: string
  type: string    // NOTE: Backend returns 'type', not 'role'
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login(email, password): Promise<void>
  loginWithGoogle(idToken): Promise<void>
  register(data: {name, email, phone, password}): Promise<void>
  logout(): Promise<void>
  refreshUser(): Promise<void>
}
```

**AsyncStorage keys:** `masova_auth_token`, `masova_refresh_token`, `masova_user`

**Features:** Token persistence on mount, auto-login after registration, Google Sign-In support

#### CartContext

```typescript
interface CartItem {
  id: string              // Generated: menuItemId_vVARIANT_cCUSTOM1_CUSTOM2 (sorted)
  menuItem: MenuItem
  quantity: number
  selectedVariant?: MenuVariant
  selectedCustomizations?: Map<string, CustomizationOption[]>
  specialInstructions?: string
  itemTotal: number       // price × quantity (all modifiers applied)
}

interface CartContextType {
  items: CartItem[]
  itemCount: number
  subtotal: number
  deliveryFee: number     // ₹0 if subtotal ≥ ₹500, else ₹40
  taxes: number           // 5% GST on subtotal
  total: number           // subtotal + taxes (delivery added at checkout)
  addItem(menuItem, quantity, variant?, customizations?, specialInstructions?): void
  removeItem(cartItemId): void
  updateQuantity(cartItemId, quantity): void
  clearCart(): void
  getItemById(cartItemId): CartItem | undefined
}
```

**Price calculation:**
```
itemPrice = basePrice OR discountedPrice
          + variant.priceModifier
          + sum(selectedCustomizations.options.priceModifier)

Cart ID = menuItemId_v{variantId}_c{sorted(customizationOptionIds).join('_')}
```

**Persistence:** AsyncStorage with Map↔Object serialisation

#### StoreContext

```typescript
interface StoreContextType {
  selectedStore: Store | null
  selectedStoreId: string | null    // Prefers storeCode (DOM001) over id
  isLoading: boolean
  setSelectedStore(store): Promise<void>
  refreshStore(): Promise<void>
}
```

**AsyncStorage key:** `@masova_selected_store`

**On store change:** Invalidates all menu React Query caches

**Header added to API requests:** `X-Selected-Store-Id: {storeCode || storeId}`

#### ThemeContext (useTheme hook)

```typescript
interface ThemeContextType {
  theme: Theme
  themeMode: 'light' | 'dark'
  isDark: boolean
  toggleTheme(): void     // No-op (kept for compatibility)
  setThemeMode(mode): void  // No-op
}
```

**Theme switching:** Automatic via `useSunriseTheme` — uses SunCalc + expo-location to calculate actual sunrise/sunset for user's coordinates. Falls back to 6am–8pm (light) / 8pm–6am (dark) if location denied.

---

### 14.5 Navigation

#### RootNavigator (RootStackParamList)

**Main Screens (always available):**
```
Main → MainTabNavigator
ItemDetail({ itemId }) — modal, slide_from_bottom
CheckoutOptions — modal, slide_from_bottom
GuestCheckout({ returnFromAuth? })
Checkout({ guestInfo? })
Search — fade animation
```

**Auth Screen:**
```
Auth → AuthNavigator — modal, presentation: modal
```

**Payment Flows:**
```
PaymentSuccess({ orderId }) — no gesture, no header
PaymentFailed({ orderId, error? })
```

**Protected Screens (require auth):**
```
OrderTracking({ orderId }) — fullScreenModal
OrderHistory
OrderDetail({ orderId })
OrderReview({ orderId }) — modal
AddressManagement
AddAddress({ address? }) — modal
Notifications
Chat — modal
```

#### AuthNavigator (AuthStackParamList)
```
Login → LoginScreen
Register → RegisterScreen
```

#### MainTabNavigator (5 tabs)

| Tab | Screen | Icon (active/inactive) | Active Tint |
|-----|--------|----------------------|-------------|
| Home | HomeScreen | home / home-outline | dark: #FFD000, light: #0F0F0F |
| Search | SearchScreen | search / search-outline | |
| Orders | OrderHistoryScreen | receipt / receipt-outline | |
| Saved | SavedScreen | heart / heart-outline | |
| Account | ProfileScreen | person / person-outline | |

**Tab bar:** Height 56px + safe area, inactive tint: #606060, font: PlusJakartaSans-Medium 12px

---

### 14.6 API Service (src/services/api.ts)

**Base config:**
```typescript
DEV_URL:  'http://192.168.50.88:8080/api'
PROD_URL: 'https://api.masova.com/api'
TIMEOUT:  30000ms
```

**Request interceptor adds:**
```
Authorization: Bearer {masova_auth_token}
X-Selected-Store-Id: {storeCode || storeId}
X-User-Type: CUSTOMER
Content-Type: application/json
Accept: application/json
```

**Response interceptor:** On 401 — attempts token refresh, clears auth on failure

---

### 14.7 All API Endpoints

#### Auth API (`/api/auth/*`)

| Method | Path | Auth | Rate Limit |
|--------|------|------|-----------|
| POST | `/api/auth/login` | Public | 10/min |
| POST | `/api/auth/register` | Public | 5/min |
| POST | `/api/auth/refresh` | Public | 20/min |
| POST | `/api/auth/logout` | JWT | — |
| POST | `/api/auth/google` | Public | — |

**Login response:** `{accessToken, refreshToken, user: {id, email, name, phone, type, profilePicture, storeId}}`

#### Menu API (`/api/menu/*`)

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/api/menu/public` | Public | Query: category?, cuisine?, dietary?, page?, size? |
| GET | `/api/menu/public/{id}` | Public | Item detail |
| GET | `/api/menu/public/recommended` | Public | Recommended items |
| GET | `/api/menu/public/search` | Public | Query: q (search string) |
| GET | `/api/menu/items` | Public | All items |

#### Order API (`/api/orders/*`)

| Method | Path | Auth | Rate Limit |
|--------|------|------|-----------|
| POST | `/api/orders` | JWT | 200/min |
| GET | `/api/orders/{orderId}` | JWT | — |
| GET | `/api/orders/track/{orderId}` | Public | 100/min |
| GET | `/api/orders/customer/{customerId}` | JWT | — |
| DELETE | `/api/orders/{orderId}` | JWT | — |
| PATCH | `/api/orders/{orderId}/status` | JWT | — |

**Create order payload:**
```typescript
{
  items: [{menuItemId, quantity, variant?, customizations?, specialInstructions?}]
  deliveryAddress?: {street, city, coordinates?, instructions?}
  paymentMethod: 'ONLINE' | 'CASH' | 'CARD' | 'UPI'
  orderType: 'DELIVERY' | 'TAKEAWAY' | 'DINE_IN'
  customerId?: string
  storeId: string
  customerName, customerEmail, customerPhone
}
```

#### Payment API (`/api/payments/*`)

| Method | Path | Auth | Rate Limit |
|--------|------|------|-----------|
| POST | `/api/payments/initiate` | JWT | 50/min |
| POST | `/api/payments/verify` | JWT | — |
| POST | `/api/payments/cash` | JWT | — |
| GET | `/api/payments/{transactionId}` | JWT | — |
| GET | `/api/payments/order/{orderId}` | JWT | — |

**Initiate response:** `{razorpayOrderId, razorpayKeyId, amount, currency}`
**Verify payload:** `{orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature}`

#### Delivery API (`/api/delivery/*`)

| Method | Path | Auth | Rate Limit |
|--------|------|------|-----------|
| GET | `/api/delivery/track/{orderId}` | JWT | 150/min |
| GET | `/api/delivery/eta/{orderId}` | JWT | — |
| POST | `/api/delivery/{orderId}/generate-otp` | JWT | — |
| POST | `/api/delivery/verify-otp` | JWT | — |

#### Customer API (`/api/customers/*`)

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/customers/get-or-create` | Public (internal) |
| GET | `/api/customers/{customerId}` | JWT |
| GET | `/api/customers/user/{userId}` | JWT |
| PATCH | `/api/customers/{customerId}` | JWT |
| POST | `/api/customers/{customerId}/addresses` | JWT |
| PATCH | `/api/customers/{customerId}/addresses/{addressId}` | JWT |
| DELETE | `/api/customers/{customerId}/addresses/{addressId}` | JWT |
| PATCH | `/api/customers/{customerId}/addresses/{addressId}/set-default` | JWT |

**Address schema:**
```typescript
{
  id, label, addressLine1, addressLine2?, city, state, postalCode,
  country?, latitude?, longitude?, landmark?, instructions?, isDefault?
}
```

#### Notification API (`/api/notifications/*`)

| Method | Path | Auth |
|--------|------|------|
| GET | `/api/notifications/user/{userId}` | JWT |
| GET | `/api/notifications/user/{userId}/unread` | JWT |
| PATCH | `/api/notifications/{id}/read` | JWT |
| PATCH | `/api/notifications/user/{userId}/read-all` | JWT |
| DELETE | `/api/notifications/{id}` | JWT |
| POST | `/api/notifications/device-token` | JWT |

#### Review API (`/api/reviews/*`)

| Method | Path | Auth |
|--------|------|------|
| GET | `/api/reviews/public/{orderId}` | Public |
| POST | `/api/reviews` | JWT |
| GET | `/api/reviews/public/item/{itemId}` | Public |

#### Store API (`/api/stores/*`)

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/api/stores/public` | Public | |
| GET | `/api/stores/public/{storeId}` | Public | |
| GET | `/api/stores/public/nearest` | Public | Query: latitude, longitude |

---

### 14.8 WebSocket Configuration

```typescript
// Development
ordersUrl:   'ws://192.168.50.88:8083/ws/orders'
deliveryUrl: 'ws://192.168.50.88:8090/ws/delivery'

// Production
ordersUrl:   'wss://api.masova.com/ws/orders'
deliveryUrl: 'wss://api.masova.com/ws/delivery'

// Main gateway WS
wsUrl:       'ws://192.168.50.88:8080/ws'  // dev
             'wss://api.masova.com/ws'       // prod
```

**WebSocket implementation:** Native WebSocket (not SockJS — Hermes JS engine limitation)

**STOMP topics subscribed:**
```
/topic/store/{storeId}/orders       — new orders for store
/queue/customer/{customerId}/orders — customer-specific order updates
/topic/store/{storeId}/kitchen      — kitchen display updates
/topic/delivery/{orderId}           — delivery tracking updates
```

**Connection config:**
- Max reconnection attempts: 5
- Reconnect delay: 5000ms
- Heartbeat: 4000ms incoming/outgoing
- Auth header: `Authorization: Bearer {token}`

---

### 14.9 Payment Service (paymentService.ts)

**Razorpay flow:**
```
1. initiatePayment(orderId, amount, customerId, email, phone, storeId)
   → POST /api/payments/initiate
   → Returns {razorpayOrderId, razorpayKeyId, amount, currency}

2. openRazorpayCheckout(options)
   → Opens native Razorpay checkout modal
   → Returns {razorpay_payment_id, razorpay_order_id, razorpay_signature}

3. verifyPayment({orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature})
   → POST /api/payments/verify
   → Backend verifies HMAC signature
   → Returns {status: 'SUCCESS' | 'FAILED'}
```

---

### 14.10 Screens — Complete Specifications

#### LoginScreen (auth/LoginScreen.tsx)

**State:** `email`, `password`, `loading`, `googleLoading`, `error`

**Features:**
- Email/password form
- Google Sign-In (@react-native-google-signin)
- Social login buttons (Google, Facebook placeholder)
- Forgot password link (not implemented)
- Haptic feedback on login/error
- Navigate to Register

---

#### RegisterScreen (auth/RegisterScreen.tsx)

**State:** `name`, `email`, `phone`, `password`, `loading`, `error`

**Validations:** All fields required, password ≥ 6 chars, email regex, terms acknowledgement

**On success:** Auto-login (calls `login()` after successful register)

---

#### HomeScreen (home/HomeScreen.tsx)

**State:** `currentSlide` (hero carousel), animated values

**Sections:**
1. **Hero Carousel** — 3 slides, 4s auto-advance, animated dot indicators
2. **Categories** (6): Biryani, Pizza, Burger, Dosa, Noodles, Beverages (spring animations)
3. **Store Cards** (3 mock): name, rating, ETA, delivery fee (slide-up entrance animations)
4. **Floating Chat Bubble** (FloatingChatBubble component)

---

#### SearchScreen (home/SearchScreen.tsx)

**State:** `searchQuery`, `searchResults`, `recentSearches`

**Features:**
- SearchBar component
- Recent searches history
- Results as items grid (useMenuSearch hook, enabled when query.length > 2)
- Tap item → navigate('ItemDetail', {itemId})

---

#### MenuScreen (menu/MenuScreen.tsx)

**State:** `selectedCuisine`, `selectedCategory`, `filteredItems`

**Cuisine → Category mapping:**
```
SOUTH_INDIAN:  DOSA, IDLY_VADA, SOUTH_INDIAN_MEALS, RICE_VARIETIES, BIRYANI
NORTH_INDIAN:  CURRY_GRAVY, DAL_DISHES, NORTH_INDIAN_MEALS, RICE_VARIETIES, CHAPATI_ROTI, NAAN_KULCHA
INDO_CHINESE:  FRIED_RICE, NOODLES, MANCHURIAN
ITALIAN:       PIZZA, PASTA, SIDES
AMERICAN:      BURGER, SANDWICH, SIDES
CONTINENTAL:   GRILLED, BAKED, SIZZLERS
BEVERAGES:     HOT_DRINKS, COLD_DRINKS, TEA_CHAI, JUICES
DESSERTS:      COOKIES_BROWNIES, ICE_CREAM, DESSERT_SPECIALS
```

**Features:**
- StoreSelector at top (store picker with modal)
- Horizontal cuisine scroll
- Category chips for selected cuisine
- Items grid with dietary badge, price, rating

---

#### ItemDetailScreen (menu/ItemDetailScreen.tsx)

**Props:** `{itemId}` via route

**State:** `quantity`, `selectedVariant`, `selectedOptions: Map<customizationId, options[]>`, `isFavorite`

**Sections:**
1. Full-screen item image with gradient overlay
2. Header: close button, wishlist heart
3. Item name + dietary badges (VEG/NON-VEG indicator dot)
4. Description, spice level indicator
5. Nutritional info (calories, protein, carbs, fat)
6. Allergen declarations (all 14 EU allergens)
7. Rating + review count
8. Variants section (single selection, radio-style)
9. Customisations section:
   - Grouped by customizationId
   - `maxSelections = 1` → radio buttons
   - `maxSelections > 1` → checkboxes
   - Price modifiers displayed per option
10. Quantity selector
11. Price total (calculated with all modifiers)
12. "Add to Cart" button + haptic feedback

---

#### CartScreen (cart/CartScreen.tsx)

**State:** `couponCode`, `appliedCoupon`, `couponDiscount`

**Cart Item Display:**
- Image, name, variant name, customisation names
- Price per item, quantity selector (delete at 0), remove button

**Pricing summary:**
```
Subtotal:          ₹{subtotal}
Delivery Fee:      ₹{deliveryFee}
Taxes (5% GST):    ₹{taxes}
Coupon Discount:  -₹{couponDiscount}
─────────────────
Total:             ₹{total}
```

**Features:**
- Coupon input (demo: `WELCOME50` → 50% off, max ₹200 discount)
- Empty cart state with "Browse Menu" CTA
- Floating chat bubble
- "Checkout" button → navigate('CheckoutOptions')

---

#### CheckoutOptionsScreen (cart/CheckoutOptionsScreen.tsx)

**Logic:** If `isAuthenticated` → immediately navigate('Checkout')

**3 options shown to guests:**
1. **Login** → navigate('Auth', {screen: 'Login'})
2. **Create Account** → navigate('Auth', {screen: 'Register'})
3. **Continue as Guest** (primary, #FFD000) → navigate('GuestCheckout')

---

#### GuestCheckoutScreen (cart/GuestCheckoutScreen.tsx)

**For guests:** firstName, lastName, email, phone, street, city, state, pincode, deliveryInstructions

**For authenticated users:** Saved addresses list + "Add New" option

**Validations:**
- Email: regex
- Phone: 10-digit Indian mobile (first digit 6–9)
- PIN: 6 digits
- All required fields

**On continue:** Validate → construct GuestInfo → navigate('Checkout', {guestInfo})

---

#### CheckoutScreen (cart/CheckoutScreen.tsx)

**Props:** `guestInfo?` (from route.params)

**State:** `savedAddresses`, `selectedAddress`, `paymentMethod: 'ONLINE'|'CASH'|'UPI'`, `orderType: 'DELIVERY'|'TAKEAWAY'`

**Pricing:**
```typescript
actualDeliveryFee = orderType === 'TAKEAWAY' ? 0 : deliveryFee
actualTaxes       = Math.round((subtotal + actualDeliveryFee) * 0.05)
actualTotal       = subtotal + actualDeliveryFee + actualTaxes
```

**Order placement flow:**
```
1. Validate (cart not empty, address if DELIVERY)
2. Guest: POST /api/customers/get-or-create → customerId
   Auth: use user.id
3. POST /api/orders → {orderId}
4. If ONLINE/UPI: paymentService.processPayment()
   → navigate('PaymentSuccess') or navigate('PaymentFailed')
5. If CASH: navigate('OrderTracking', {orderId})
6. clearCart()
```

---

#### OrderTrackingScreen (order/OrderTrackingScreen.tsx)

**Props:** `{orderId}` via route

**Hooks used:** `useOrderTracking({orderId, enableWebSocket: true})`
- Returns: `{order, isLoading, error, wsConnected, wsState, refetch}`
- Combines WebSocket (real-time) + React Query polling (fallback, 5s)

**Order stages by type:**

| Status | DELIVERY | TAKEAWAY | DINE_IN |
|--------|----------|---------|---------|
| RECEIVED | Order Received | Order Received | Order Received |
| PREPARING | Preparing | Preparing | Preparing |
| OVEN | In Oven | In Oven | In Oven |
| BAKED | Ready | Ready for Pickup | Ready to Serve |
| DISPATCHED | On the Way | — | — |
| DELIVERED | Delivered | — | — |
| COMPLETED | — | Picked Up | — |
| SERVED | — | — | Served |

**Features:**
- Progress bar with connected dots + lines
- Current stage: highlighted + pulsing animation (Animated.Value)
- Completed stages: green with checkmark
- ETA countdown (updates every 60s)
- Delivery map (if DISPATCHED) — DeliveryMap component with driver marker
- Driver info card: name, phone (call button), vehicle
- Order summary with items
- Floating chat bubble

---

#### OrderHistoryScreen (order/OrderHistoryScreen.tsx)

**Guest prompt:** "Sign in to view your past orders"

**Order list:** FlatList, sorted by createdAt desc, pull-to-refresh

**Status display:**
- Active: RECEIVED, PREPARING, OVEN, BAKED, DISPATCHED
- Completed: DELIVERED, COMPLETED, SERVED, CANCELLED

**Date formatting:** "Today", "Yesterday", "X days ago", "DD MMM"

**API:** GET `/api/orders/customer/{customerId}`

---

#### PaymentSuccessScreen (payment/PaymentSuccessScreen.tsx)

**Props:** `{orderId}` via route

**Features:**
- Scale + fade entrance animation
- Large green checkmark
- Order ID (selectable, #FFD000 colour)
- Haptic feedback on mount
- Stores active order ID for 60 seconds
- "Track Order" → navigate('OrderTracking', {orderId})
- "Continue Shopping" → navigate('Main', {screen: 'Menu'})

---

#### ProfileScreen (profile/ProfileScreen.tsx)

**Guest prompt:** GuestPromptView with sign-in/register buttons

**Loyalty info** (if customer data available):
- Tier badge: BRONZE/SILVER/GOLD/PLATINUM with colours
- Total points
- Progress bar to next tier
- Order stats: total orders, total spent, average order value

**Menu items:**
1. My Addresses → navigate('AddressManagement')
2. Order History → navigate('OrderHistory')
3. Saved Items → navigate('Saved')
4. Notifications → navigate('Notifications')
5. Chat with Support → navigate('Chat')
6. Theme Toggle (visual only, sunrise auto-switching)
7. Logout (confirmation alert)

---

#### AddressManagementScreen (profile/AddressManagementScreen.tsx)

**Features:**
- List all saved addresses
- Each: label, full address, default badge
- Set default, Edit (→ AddAddressScreen with address param), Delete buttons
- Add new address button

**API:** GET `/api/customers/user/{userId}` → addresses[]

---

#### AddAddressScreen (profile/AddAddressScreen.tsx)

**Fields:** Label (Home/Work/Other), Street (addressLine1), addressLine2?, City, State, PIN code, Landmark?, Set as default checkbox

**Modes:** Create (no params) or Edit (address param → pre-fill)

**API:** POST `/api/customers/{customerId}/addresses` or PATCH `/api/customers/{customerId}/addresses/{addressId}`

---

### 14.11 React Query Hooks

#### useMenuQueries.ts

```typescript
useMenuItems(params?) → MenuItem[]
  // QueryKey: ['menu', 'items', selectedStoreId, params]
  // staleTime: 5min

useMenuItem(id) → MenuItem
  // QueryKey: ['menu', 'item', id], enabled: !!id

useRecommendedItems() → MenuItem[]
  // QueryKey: ['menu', 'recommended', selectedStoreId], staleTime: 10min

useMenuSearch(query) → MenuItem[]
  // QueryKey: ['menu', 'search', query], enabled: query.length > 2, staleTime: 2min

useMenuByCategory(category) → MenuItem[]
useMenuByCuisine(cuisine) → MenuItem[]
```

#### useOrderQueries.ts

```typescript
useOrder(orderId) → Order
  // refetchInterval: 5000ms, staleTime: 0

useTrackOrder(orderId) → Order
  // refetchInterval: 15000ms, public endpoint

useCustomerOrders(customerId, page?) → Order[]
  // staleTime: 2min

useDeliveryTracking(orderId) → DeliveryTracking
  // refetchInterval: 10000ms

// Mutations:
useCreateOrder() → useMutation
  // Invalidates: ['orders', 'customer'], sets cache for new order

useCancelOrder() → useMutation
  // Invalidates: ['orders', orderId], ['orders', 'customer']
```

#### useOrderTracking.ts

```typescript
interface UseOrderTrackingOptions {
  orderId: string
  enableWebSocket?: boolean
  pollingInterval?: number
}

interface UseOrderTrackingResult {
  order: Order | undefined
  isLoading: boolean
  error: Error | null
  wsConnected: boolean
  wsState: 'disconnected' | 'connecting' | 'connected' | 'error'
  refetch(): void
}
```

**Behaviour:** WebSocket takes priority; falls back to React Query polling when disconnected. Tracks status changes, fires notifications on transition.

#### useSunriseTheme.ts

- Requests expo-location ForegroundPermission
- Uses SunCalc to get actual sunrise/sunset coordinates for user
- Switches theme automatically at sunrise/sunset
- Fallback: 6am–8pm = light, 8pm–6am = dark (if location denied)
- Schedules next transition via setTimeout, cleans up on unmount

---

### 14.12 Type Definitions (src/types/index.ts)

#### MenuItem (complete)
```typescript
interface MenuItem {
  id, name, description
  cuisine: Cuisine           // 8 types
  category: Category         // 40+ types
  basePrice: number          // in paise
  discountedPrice?: number
  variants: MenuVariant[]    // [{id, name, priceModifier}]
  customizations: MenuCustomization[]
  dietaryInfo: DietaryType[] // VEGETARIAN | VEGAN | NON_VEGETARIAN | JAIN | HALAL | GLUTEN_FREE | DAIRY_FREE
  spiceLevel?: SpiceLevel    // MILD | MEDIUM | HOT | EXTRA_HOT
  nutritionalInfo?: { calories, protein, carbs, fat }
  imageUrl, isAvailable, preparationTime (minutes), isRecommended
  rating?, reviewCount?, allergens?, allergensDeclared?
}
```

#### Order (complete)
```typescript
interface Order {
  id, orderNumber, customerId, storeId
  items: OrderItem[]
  subtotal, deliveryFee, tax, total
  status: OrderStatus        // PENDING|RECEIVED|PREPARING|OVEN|BAKED|READY|DISPATCHED|DELIVERED|COMPLETED|SERVED|CANCELLED
  paymentStatus: PaymentStatus  // PENDING|SUCCESS|FAILED|REFUNDED
  paymentMethod: 'ONLINE'|'CASH'|'CARD'|'UPI'
  orderType: 'DINE_IN'|'DELIVERY'|'TAKEAWAY'|'COLLECTION'
  preparationTime, estimatedDeliveryTime?
  deliveryAddress?: DeliveryAddress
  assignedDriverId?
  createdAt, updatedAt, completedAt?
  deliveryOtp?
}
```

#### DeliveryTracking (complete)
```typescript
interface DeliveryTracking {
  id, orderId, driverId, driverName, driverPhone, driverPhoto?
  status: 'PENDING_ASSIGNMENT'|'ASSIGNED'|'ACCEPTED'|'PICKED_UP'|'IN_TRANSIT'|'ARRIVED'|'DELIVERED'|'CANCELLED'
  currentLocation?: {latitude, longitude}
  restaurantLocation?: {latitude, longitude}
  estimatedDeliveryMinutes, distanceKm
  assignedAt, acceptedAt?, pickedUpAt?, deliveredAt?
  // Flat field aliases (backend compatibility):
  driverLat?, driverLon?, restaurantLat?, restaurantLon?
}
```

#### Store (complete)
```typescript
interface Store {
  id
  storeCode?: string         // DOM001, DOM002 (preferred for menu filtering)
  name, address: StoreAddress
  phone, email
  isOpen, openingTime, closingTime
  deliveryRadius, minimumOrderAmount, deliveryFee
  coordinates?: {latitude, longitude}
}
```

#### Customer (complete)
```typescript
interface Customer {
  id, userId, name, email, phone?
  profilePicture?, addresses: DeliveryAddress[]
  loyaltyInfo?: {
    totalPoints, pointsEarned, pointsRedeemed
    tier: 'BRONZE'|'SILVER'|'GOLD'|'PLATINUM'
    tierExpiryDate?, lastPointsUpdate?
  }
  orderStats?: {totalOrders, completedOrders, cancelledOrders, totalSpent, averageOrderValue}
  isActive
  preferences?: CustomerPreferences
}
```

---

### 14.13 UI Components

#### Button
```typescript
Props: { title, onPress, variant?: 'primary'|'secondary'|'ghost'|'danger',
         size?: 'sm'|'md'|'lg', disabled?, loading?, fullWidth?, leftIcon?, rightIcon? }

primary:   #FFD000 bg, #000 text
secondary: transparent bg, #FFD000 border
ghost:     transparent bg
danger:    error colour bg, white text

Heights: sm=36, md=48, lg=56
```

#### QuantitySelector
```typescript
Props: { value, onChange, size?, min?, max? }
// At value=0 with min=0: shows delete/remove icon
// Haptic feedback on every change
```

#### StoreSelector
```typescript
Props: { onStoreChange? }
// Button → modal with scrollable store list
// Each store: name, open/closed status, address, hours, delivery fee, checkmark if selected
// Saves to AsyncStorage, fires onStoreChange callback, invalidates menu queries
```

#### GuestPromptView
```typescript
Props: { screenName, icon, description }
// Large icon + heading + description + "Sign In" button + "Create Account" button
```

#### DeliveryMap (order/DeliveryMap.tsx)
```typescript
Props: { deliveryInfo: DeliveryTracking, order: Order }
// MapView (Google Maps provider)
// Markers: restaurant, driver (moves in real-time), delivery address
// Polyline: restaurant → delivery address
```

#### FloatingChatBubble
- FAB (floating action button) for chat support → navigate('Chat')
- Visible on HomeScreen, CartScreen, OrderTrackingScreen

---

### 14.14 Design System (src/styles/tokens.ts)

#### Brand Colour
```
accent:    #FFD000 (yellow gold)
onAccent:  #000000
```

#### Dark Mode Surfaces
```
bg:        #0F0F0F
surface1:  #1A1A1A
surface2:  #242424
surface3:  #2E2E2E
surface4:  #383838
text1:     #FFFFFF
text2:     #A0A0A0
text3:     #606060
border:    rgba(255,255,255,0.08)
```

#### Light Mode Surfaces
```
bg:        #FFFFFF
surface1:  #F5F5F5
surface2:  #EFEFEF
surface3:  #E5E5E5
surface4:  #DCDCDC
text1:     #0F0F0F
text2:     #606060
text3:     #A0A0A0
border:    rgba(0,0,0,0.08)
```

#### Semantic Colours
```
error:   dark=#FF4444, light=#D32F2F
success: dark=#22C55E, light=#2E7D32
warning: #F59E0B
```

#### Typography (PlusJakartaSans font family)
```
Weights: regular 400, medium 500, semibold 600, bold 700, extrabold 800

Sizes:
  display:  36px  (line-height 44)
  headline: 28px  (36)
  title:    22px  (28)
  titleSm:  18px  (24)
  body:     16px  (24)
  bodySm:   14px  (20)
  label:    12px  (16)
  caption:  11px  (14)
```

#### Spacing (4px grid)
```
xs=4, sm=8, md=12, lg=16, xl=24, xxl=32, xxxl=48, xxxxl=64
screenPadding=16, cardPadding=16, sectionGap=24, listItemGap=12, touchTarget=48

Numeric aliases: 0=0, 1=4, 2=8, 3=12, 4=16, 5=20, 6=24, 8=32, 10=40, 12=48, 16=64, 20=80
```

#### Border Radius
```
sm=8, md=12, lg=16, xl=20, xxl=24, pill=9999
card=16, button=12, input=12, chip=20, image=12, bottomSheet=24
```

#### Shadows
```
sm:  shadowOpacity 0.10, radius 2, elevation 1
md:  shadowOpacity 0.12, radius 4, elevation 2
lg:  shadowOpacity 0.15, radius 8, elevation 4
xl:  shadowOpacity 0.18, radius 16, elevation 8
```

#### Z-Index
```
base=0, dropdown=10, sticky=20, overlay=30, modal=40, toast=50
```

#### Tab Bar
```
height: 56px
iconSize: 24px
labelSize: 12px
activeTint:   dark=#FFD000, light=#0F0F0F
inactiveTint: #606060
```

---

### 14.15 Allergens (constants/allergens.ts)

Same 14 EU Regulation 1169/2011 allergens as Crew app:
```
CELERY, CEREALS_GLUTEN, CRUSTACEANS, EGGS, FISH, LUPIN,
MILK, MOLLUSCS, MUSTARD, NUTS, PEANUTS, SESAME, SOYA, SULPHUR_DIOXIDE
```

Full names displayed: Celery, Gluten, Crustaceans, Eggs, Fish, Lupin, Milk, Molluscs, Mustard, Tree Nuts, Peanuts, Sesame, Soya, Sulphur Dioxide

---

### 14.16 Build & Dev Commands

```bash
# Start Metro (port 8888)
npm start

# Run on device/emulator
npm run android
npm run ios

# Build release APK
npm run build:android

# Clean (clear Metro cache + build artefacts)
npm run clean

# Install APK to connected device
npm run install:android
```

---

*Continued in Part 5: Security, Events, Operations & Cross-Cutting Concerns*
