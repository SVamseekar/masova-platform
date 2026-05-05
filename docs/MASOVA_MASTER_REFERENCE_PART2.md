# MaSoVa Platform — Master Reference Document
## Part 2 of 5: Frontend Web App & AI Support Agent

---

## 11. FRONTEND WEB APP

**Location:** `/frontend`
**Framework:** React 19, TypeScript, Vite
**State Management:** Redux Toolkit + RTK Query
**UI Library:** Material-UI (MUI) + custom neumorphic/dark-premium components
**Testing:** Vitest + React Testing Library + MSW (mock service worker) + Pact (contract tests)
**Port:** 3000 (Vite dev server)
**Proxy target:** `http://192.168.50.88:8080` (Dell backend via LAN)

---

### 11.1 Project Structure Overview

```
frontend/
├── src/
│   ├── pages/              # 7 page-level components
│   ├── components/         # Shared UI components
│   ├── store/              # Redux store + RTK Query APIs
│   │   ├── store.ts        # Root store configuration
│   │   ├── slices/         # authSlice, uiSlice, cartSlice, notificationSlice
│   │   └── api/            # 18 RTK Query API slices
│   ├── hooks/              # 21 custom hooks
│   ├── config/             # API endpoint config
│   ├── styles/             # Design tokens, themes, global CSS
│   ├── i18n/               # react-i18next (en, hi, de, fr)
│   └── test/               # Test fixtures, mocks, integration tests
├── vite.config.ts
├── package.json
└── .env.local              # VITE_API_BASE_URL=http://192.168.50.88:8080
```

---

### 11.2 Redux Store

#### Feature Slices (4)

**authSlice**
```typescript
{
  isAuthenticated: boolean
  accessToken: string | null
  refreshToken: string | null
  user: {
    id, name, email, phone, userType, storeId,
    employeeRole?, isKioskAccount?
  } | null
  loading: boolean
  error: string | null
}
```
Actions: `loginStart`, `loginSuccess`, `loginFailure`, `logout`, `refreshTokenSuccess`, `updateUserProfile`, `clearError`, `setLoading`

**cartSlice**
```typescript
{
  items: CartItem[]           // {menuItem, quantity, variant, customizations, specialInstructions, itemTotal}
  subtotal: number
  deliveryFeeINR: number      // ALWAYS from Redux — NEVER hardcode
  selectedStore: Store | null
  selectedStoreId: string | null
}
```
Selector: `selectDeliveryFeeINR` — every component that needs delivery fee MUST use this selector

**uiSlice**
```typescript
{
  modals: { [key: string]: boolean }
  drawers: { [key: string]: boolean }
  toastQueue: Toast[]
}
```

**notificationSlice**
```typescript
{
  notifications: Notification[]
  unreadCount: number
}
```

---

### 11.3 RTK Query API Slices (18)

Every slice uses the canonical base URL (no `/api/v1/` prefix — 194 live endpoints).

| Slice | Key Endpoints |
|-------|--------------|
| `authApi` | POST `/api/auth/login`, `/api/auth/register`, `/api/auth/logout`, `/api/auth/refresh`, `/api/auth/google` |
| `orderApi` | GET/POST `/api/orders`, POST `/api/orders/{id}/status`, GET `/api/orders/{id}`, WebSocket subscriptions |
| `userApi` | GET/PUT `/api/users`, `/api/users/{id}` |
| `sessionApi` | POST `/api/sessions`, POST `/api/sessions/end`, GET `/api/sessions` |
| `analyticsApi` | GET `/api/analytics` (query params: period, view, type), GET `/api/bi`, GET `/api/bi/reports` |
| `menuApi` | GET `/api/menu`, `/api/menu/{id}` |
| `storeApi` | GET `/api/stores`, `/api/stores/{storeId}` |
| `shiftApi` | GET `/api/shifts`, `/api/shifts/{id}`, POST `/api/shifts` |
| `paymentApi` | POST `/api/payments/initiate`, `/api/payments/verify`, `/api/payments/cash` |
| `equipmentApi` | GET `/api/equipment`, PATCH `/api/equipment/{id}` |
| `inventoryApi` | GET `/api/inventory`, PATCH `/api/inventory/{id}` |
| `customerApi` | GET/POST `/api/customers`, POST `/api/customers/{id}/loyalty` |
| `driverApi` | GET/PUT `/api/users/{driverId}/status`, GET `/api/delivery/driver/{id}/performance` |
| `deliveryApi` | GET `/api/delivery/track/{orderId}`, GET `/api/delivery/driver/{id}/pending` |
| `reviewApi` | GET/POST `/api/reviews`, GET `/api/reviews/public/token/{token}` |
| `notificationApi` | GET `/api/notifications`, PATCH `/api/notifications/{id}/read` |
| `kioskApi` | POST `/api/users/kiosk/auto-login` |
| `agentApi` | POST `/api/agents/{name}/trigger` — AI agent manual triggers |

---

### 11.4 Pages (7)

#### HomePage.tsx
- Landing page — public menu browse, hero section, store selector
- Store picker with Haversine distance calculation from user's geolocation
- Featured categories, promotional banners
- No auth required

#### CustomerApp.tsx
- Main customer ordering interface
- Menu browsing with cuisine/category filters
- Cart management (add/remove/update quantities)
- Checkout flow (guest or authenticated)
- Order placement via `useCreateOrder()` mutation
- Real-time order tracking with WebSocket subscription (`useOrderTrackingWebSocket`)
- Post-delivery rating form (token-based, public)

#### DashboardPage.tsx
- Manager analytics dashboard
- Sales KPIs: revenue, order count, AOV, GMV
- Staff overview: active sessions, shifts
- Inventory alerts: low stock items
- Kitchen performance: prep times, throughput
- All data via `analyticsApi` RTK Query endpoints
- Protected: MANAGER | ASSISTANT_MANAGER only

#### PublicMenuPage.tsx
- Unauthenticated menu access
- No cart, no checkout — browse only
- SEO-optimised (static rendering possible)

#### PublicRatingPage.tsx
- Post-delivery anonymous review submission
- URL: `/rate/{token}` (token from email/SMS)
- GET `/api/reviews/public/token/{token}` to validate
- POST `/api/reviews` to submit rating
- 1–5 star rating + text comment
- No auth required

#### GdprRequests.tsx
- Data subject request form (access/deletion/portability/objection)
- Public — no auth required
- Submits to GDPR controller

#### PrivacyPolicy.tsx
- Static privacy policy & terms of service page

---

### 11.5 Custom Hooks (21)

#### Authentication & Session
| Hook | Purpose |
|------|---------|
| `useSecureAuth()` | Secure auth token management, expiry checks |
| `useTokenRefresh()` | Automatic token refresh on 401 — tested |

#### Real-Time Data (WebSocket)
| Hook | Topic Subscribed |
|------|-----------------|
| `useWebSocket()` | Generic STOMP connection management |
| `useOrderWebSocket()` | `/topic/store/{storeId}/orders` — new orders |
| `useKitchenWebSocket()` | `/topic/store/{storeId}/kitchen` — KDS updates |
| `useOrderTrackingWebSocket()` | `/topic/delivery/{orderId}` — delivery tracking |
| `useCustomerOrdersWebSocket()` | `/queue/customer/{customerId}/orders` — customer orders |
| `useDriverLocationWebSocket()` | `/topic/driver/{driverId}/location` — driver GPS (tested) |

#### UI Utilities
| Hook | Purpose |
|------|---------|
| `useToast()` | Toast notification queue management |
| `useKioskMode()` | Fullscreen kiosk mode toggle (tested) |
| `useSmartBackNavigation()` | Context-aware browser back button (tested) |

#### Data Management
| Hook | Purpose |
|------|---------|
| `useOrderTracking()` | Order state machine, progress calculation |
| `useGeocoding()` | Address ↔ lat/lng via Google Maps API (tested) |

#### Storage
| Hook | Purpose |
|------|---------|
| `useLocalStorage()` | Type-safe persistent local storage |

---

### 11.6 Design System

#### Design Pattern 1: Neumorphic (Staff Web Pages)
- Applied to: DashboardPage, session management, shift management, all staff-facing UI
- Tokens defined in: `frontend/src/styles/design-tokens.ts`
- CSS variables: `--nm-light: #e0e5ec`, `--nm-dark: #a3b1c6`
- Shadow pattern: `box-shadow: inset 2px 2px 5px rgba(163,177,198,0.5), inset -2px -2px 5px rgba(255,255,255,0.6)`
- **Rule:** Use neumorphic tokens ONLY on staff pages — never mix with dark-premium vars

#### Design Pattern 2: Dark-Premium (Customer Web Pages)
- Applied to: CustomerApp, PublicMenuPage, PublicRatingPage, HomePage
- Tokens defined in: `frontend/src/styles/theme.ts` (MUI theme overrides)
- CSS vars scoped to `.dark-premium-theme` class (NOT `:root`)
- Primary: `--dp-primary: #FF6B35` (Tangerine orange)
- Background: `--dp-bg: #0F0E17` (deep black)
- Accent glow effects, neon highlights
- **Rule:** Use `--dp-*` CSS vars only — never hardcode `#` hex colours or `px` spacing

#### Localization (i18n)
- Framework: `react-i18next`
- Languages: English (en), Hindi (hi), German (de), French (fr)
- Namespaces: `common`, `orders`, `menu`, `notifications`, `errors`
- Usage: `const { t } = useTranslation(); t('orders.status.PREPARING')`

---

### 11.7 API Configuration

**File:** `src/config/api.config.ts`

```typescript
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

// Canonical paths (194 live endpoints — no /api/v1/ prefix)
export const API_PATHS = {
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    logout: '/api/auth/logout',
    refresh: '/api/auth/refresh',
    google: '/api/auth/google',
  },
  orders: {
    base: '/api/orders',
    byId: (id: string) => `/api/orders/${id}`,
    status: (id: string) => `/api/orders/${id}/status`,
    track: (id: string) => `/api/orders/track/${id}`,
    kitchen: '/api/orders/kitchen',
  },
  sessions: {
    start: '/api/sessions',
    end: '/api/sessions/end',
    list: '/api/sessions',        // GET with query params: employeeId, storeId, active
  },
  // ... all 194 canonical paths — see MASOVA_MASTER_REFERENCE_ENDPOINTS.md
}
```

**Headers added to every request:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Staff pages also add:**
```
X-User-Store-Id: {user.storeId}
```

---

### 11.8 Testing Architecture

#### Test File Organization
```
src/
├── hooks/__tests__/
│   ├── useGeocoding.test.tsx
│   ├── useKioskMode.test.tsx
│   ├── useTokenRefresh.test.tsx
│   └── useSmartBackNavigation.test.tsx
├── pages/__tests__/
│   ├── CustomerApp.test.tsx
│   ├── DashboardPage.test.tsx
│   ├── HomePage.test.tsx
│   └── PublicMenuPage.test.tsx
├── components/__tests__/
│   └── StoreSelector.test.tsx
└── test/
    ├── integration/
    │   ├── order-creation-flow.test.ts
    │   └── delivery-dispatch-flow.test.ts
    ├── mocks/
    │   ├── server.ts          # MSW server setup
    │   └── handlers.ts        # HTTP request mock handlers
    ├── fixtures/
    │   ├── mockOrders.ts
    │   ├── mockUsers.ts
    │   ├── mockMenu.ts
    │   ├── mockPayments.ts
    │   └── mockDelivery.ts
    └── utils/
        └── testUtils.tsx      # Render with Redux + React Query providers
```

#### Test Types
- **Unit:** Hooks, utility functions (currency, validation, date formatting)
- **Integration:** Full flow tests (order creation → payment → tracking, delivery dispatch)
- **Contract (Pact):** Consumer-driven contracts between frontend and each backend API
- **MSW:** All HTTP calls intercepted — no real network in tests

#### Test Wrapper (TestWrapper.tsx)
Wraps components with: `Redux Provider + QueryClientProvider + MemoryRouter + ThemeProvider`

---

### 11.9 Build & Deployment

```bash
# Development
npm run dev           # Vite HMR on :3000

# Production build
npm run build         # Output: /dist (optimised, code-split)

# Test
npm run test          # Vitest
npm run test:coverage # Coverage report

# Lint
npm run lint
```

**Production deploy:** Firebase Hosting
**Staging/preview:** Vercel
**CI/CD:** GitHub Actions on push to main

---

## 12. AI SUPPORT AGENT (masova-support)

**Location:** `/Users/souravamseekarmarti/Projects/masova-support`
**Technology:** Python 3.9–3.12, Google ADK 1.25, FastAPI, APScheduler
**Port:** 8000
**Run command:** `uvicorn src.masova_agent.main:app --host 0.0.0.0 --port 8000 --reload`
**Version:** 0.3.0

---

### 12.1 Architecture Overview

```
masova-support/
├── src/masova_agent/
│   ├── main.py                   # FastAPI app, lifespan, all HTTP endpoints
│   ├── agent.py                  # Root LlmAgent, send_message_async()
│   ├── core/
│   │   ├── agent.py              # MaSoVaAgent class (singleton)
│   │   └── redis_session_service.py  # Redis-backed session persistence
│   ├── tools/
│   │   ├── backend_tools.py      # 8 tool functions (HTTP → Spring backend)
│   │   └── system_briefing.py    # SystemBriefingTool (mock data)
│   ├── agents/                   # 7 background agents
│   │   ├── demand_forecasting_agent.py
│   │   ├── inventory_reorder_agent.py
│   │   ├── churn_prevention_agent.py
│   │   ├── review_response_agent.py
│   │   ├── shift_optimisation_agent.py  # stub
│   │   ├── kitchen_coach_agent.py       # stub
│   │   └── dynamic_pricing_agent.py     # stub
│   ├── scheduler/
│   │   └── scheduler.py          # APScheduler job registration
│   ├── services/
│   │   ├── customer_service.py   # CustomerService (mock data)
│   │   ├── order_service.py      # OrderService (mock data)
│   │   └── location_service.py   # IP geolocation with caching
│   ├── data/
│   │   ├── models.py             # Customer, Order, Location dataclasses
│   │   └── repositories.py       # In-memory mock repositories
│   ├── utils/
│   │   ├── config.py             # Config dataclasses + singleton
│   │   └── logger.py             # Logger setup
│   └── exceptions/
│       └── __init__.py           # All custom exceptions
├── tests/
│   ├── test_scenarios.py
│   ├── test_connection.py
│   └── test_redis_session.py
├── config/
│   └── logging.yaml
├── requirements.txt
└── pyproject.toml
```

---

### 12.2 Core Dependencies

```
google-adk==1.25.0
fastapi==0.115.6
uvicorn[standard]==0.34.0
google-genai==1.63.0
httpx==0.28.1
python-dotenv==1.2.1
redis==5.2.1
apscheduler==3.10.4
aio-pika==9.4.1
google-cloud-aiplatform==1.137.0
```

---

### 12.3 FastAPI Application (main.py)

#### Data Models
```python
class ChatRequest(BaseModel):
    message: str
    sessionId: Optional[str] = None
    customerId: Optional[str] = None

class ChatResponse(BaseModel):
    reply: str
    sessionId: str
```

#### Lifespan
1. Start APScheduler with all registered jobs
2. Start RabbitMQ consumer for Agent 5 (review.created events with rating ≤ 3)
3. On shutdown: graceful stop of both

#### All HTTP Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Health check → `{"status": "ok"}` |
| POST | `/agent/chat` | Customer support chat (primary) |
| POST | `/agents/demand-forecast/trigger` | Manual trigger Agent 2 |
| POST | `/agents/inventory-reorder/trigger` | Manual trigger Agent 3 |
| POST | `/agents/churn-prevention/trigger` | Manual trigger Agent 4 |
| POST | `/agents/review-response/trigger` | Manual trigger Agent 5 (body: review_data) |
| POST | `/agents/shift-optimisation/trigger` | Manual trigger Agent 6 |
| POST | `/agents/kitchen-coach/trigger` | Manual trigger Agent 7 |
| POST | `/agents/dynamic-pricing/trigger` | Manual trigger Agent 8 |

**CORS origins:** `http://localhost:5173`, `http://localhost:3000`, `http://localhost:8080`

---

### 12.4 Root LlmAgent (agent.py)

```python
root_agent = LlmAgent(
    name="MaSoVa_Support",
    model="gemini-2.0-flash",
    instruction="[detailed system prompt]"
)
```

**System instruction defines:**
- Assistant is MaSoVa's friendly customer support for a multi-branch restaurant chain
- Menus: South Indian, North Indian, Indo-Chinese, Italian, American, Continental, Beverages
- Tone: warm, concise, max 150 words unless listing items
- Protocol: confirm details before actions, never surface raw API errors

**Tools registered:**
1. `get_order_status`
2. `get_menu_items`
3. `get_store_hours`
4. `submit_complaint`
5. `request_refund`
6. `get_loyalty_points`
7. `get_store_wait_time`
8. `cancel_order`

**Session flow:**
```python
async def send_message_async(message, user_id, session_id) -> str:
    session_id = await _ensure_session(user_id, session_id)
    runner = Runner(agent=root_agent, app_name="masova_support", session_service=_session_service)
    content = genai_types.Content(role="user", parts=[genai_types.Part(text=message)])
    # stream events, accumulate text parts
    return response_text
```

**ADK exports (for ADK discovery):**
```python
agent = root_agent
app = root_agent
```

---

### 12.5 Tool Functions (backend_tools.py)

All tools call Spring Boot backend via `httpx`. Base URL: `MASOVA_BACKEND_URL` env (default: `http://localhost:8080/api`). All calls: 8-second timeout.

#### Tool 1: get_order_status(order_id: str) → str
- GET `/api/orders/public/{order_id}`
- Returns: `"Order #ORD123 is PREPARING. ETA: 15 min. Items: Chicken Biryani, Garlic Naan."`
- Status messages for all 10 OrderStatus values
- Friendly "Order not found" if 404

#### Tool 2: get_menu_items(store_id: str, category: str = "") → str
- GET `/api/menu/items?storeId={storeId}&available=true[&category={category}]`
- Returns up to 10 items: `"- Masala Dosa[Medium]: ₹89 — Crispy rice crepe with potato filling..."`
- Shows count of remaining if > 10: `"...and 5 more items."`

#### Tool 3: get_store_hours(store_id: str) → str
- GET `/api/stores/{store_id}`
- Returns: `"MaSoVa Store 1 is currently OPEN. Hours: 08:00 – 23:00."`

#### Tool 4: submit_complaint(customer_id: str, order_id: str, description: str) → str
- Validates: description ≥ 10 chars
- POST `/api/reviews/complaints` with `{customerId, orderId, description, type: "COMPLAINT"}`
- Returns: ticket reference

#### Tool 5: get_loyalty_points(customer_id: str) → str
- GET `/api/customers/{customer_id}/stats`
- Returns points, tier, progress to next tier
- Tier thresholds: BRONZE→SILVER 500 pts, SILVER→GOLD 2000 pts, GOLD→PLATINUM 5000 pts

#### Tool 6: get_store_wait_time(store_id: str) → str
- GET `/api/orders/kitchen/queue?storeId={storeId}&status=RECEIVED,PREPARING,OVEN`
- Maps active order count to wait estimate:
  - 0 orders → "very fast service"
  - 1–5 → "15–20 minutes"
  - 6–10 → "25–35 minutes"
  - >10 → "40–50 minutes"

#### Tool 7: cancel_order(order_id: str, reason: str) → str
- First: GET `/api/orders/public/{order_id}` — validates status is PENDING or RECEIVED
- Then: POST `/api/orders/{order_id}/cancel` with reason
- Returns confirmation or error (e.g. "Order is already being prepared and cannot be cancelled")

#### Tool 8: request_refund(order_id: str, reason: str) → str
- Validates: reason ≥ 5 chars
- POST `/api/payments/refund/request` with `{orderId, reason}`
- Returns: `"Refund request submitted for Order #ORD123. Processing takes 3-5 business days."`

---

### 12.6 Redis Session Service (redis_session_service.py)

```python
SESSION_TTL_SECONDS = 3600   # 1 hour
MAX_HISTORY_TURNS = 10
REDIS_KEY_PREFIX = "masova:session:"
```

**Fallback:** If Redis unavailable (socket timeout 2s), falls back to `InMemorySessionService`

**SessionData dataclass:**
```python
@dataclass
class SessionData:
    id: str
    app_name: str
    user_id: str
    history: list = field(default_factory=list)
```

**Key methods:**
- `create_session(app_name, user_id, session_id=None)` → SessionData (stores in Redis with TTL)
- `get_session(app_name, user_id, session_id)` → Optional[SessionData]
- `append_turn(session_id, role, text)` → None (trims to MAX_HISTORY_TURNS, refreshes TTL)

Redis key format: `masova:session:{session_id}`

---

### 12.7 Background Agents — APScheduler

**Scheduler config:**
```python
AsyncIOScheduler(
    executors={"default": AsyncIOExecutor()},
    job_defaults={"coalesce": True, "max_instances": 1},
    timezone="Asia/Kolkata"
)
```

**All 6 scheduled jobs:**

| Agent | Schedule | Status |
|-------|----------|--------|
| Agent 2: Demand Forecasting | Nightly 2am IST | Live |
| Agent 3: Inventory Reorder | Every 6 hours | Live |
| Agent 4: Churn Prevention | Daily 10am IST | Live |
| Agent 5: Review Response | RabbitMQ event (rating ≤ 3) | Live |
| Agent 6: Shift Optimisation | Sundays 8pm IST | Stub |
| Agent 7: Kitchen Coach | Nightly 11pm IST | Stub |
| Agent 8: Dynamic Pricing | Every 30 min, 9am–10pm IST | Stub |

**Architecture rules for all agents:**
- `async def` functions, return `dict`
- NEVER auto-write to database — agents propose (DRAFT status), manager approves
- If LLM call fails: fall back to rule-based response — never surface raw API errors
- Every action logged: agent name, trigger type (scheduled/manual), store_id, output summary
- APScheduler jobs share the FastAPI event loop — never create `asyncio.run()` inside a job

---

### 12.8 Agent 2: Demand Forecasting

**File:** `agents/demand_forecasting_agent.py`
**Schedule:** Nightly 2am IST
**Returns:** `{"forecasts": total_count, "stores": store_count, "generated_at": timestamp}`

**Algorithm:**
1. Fetch all stores from backend
2. For each store: fetch 90-day order history
3. Aggregate: `{menuItemId: {day_of_week: {hour: [quantities]}}}`
4. Generate forecast for tomorrow using weighted moving average
   - Weights: `1, 1 + (n-1)/n` (recent days weighted higher)
   - Considers day-of-week seasonality
5. POST forecasts to `/api/analytics/forecast`

---

### 12.9 Agent 3: Inventory Reorder

**File:** `agents/inventory_reorder_agent.py`
**Schedule:** Every 6 hours
**Returns:** `{"pos_drafted": count, "items_checked": count}`

**Logic:**
1. GET low-stock items per store (`currentStock < minStock`)
2. Group by preferred supplier
3. Draft PO: `{"storeId", "supplierId", "status": "DRAFT", "autoGenerated": True, "items": [...]}`
4. POST `/api/purchase-orders/auto-generate`
5. Notify managers with INVENTORY_ALERT notification

---

### 12.10 Agent 4: Churn Prevention

**File:** `agents/churn_prevention_agent.py`
**Schedule:** Daily 10am IST
**Returns:** `{"campaigns_created": count, "customers_targeted": count}`

**Constants:**
```python
CHURN_WINDOW_DAYS = 14          # No order in last 14 days = churned
QUALIFYING_ORDER_COUNT = 3       # Must have had 3+ orders to be "high value"
QUALIFYING_PERIOD_DAYS = 60      # Within last 60 days
RECOVERY_DISCOUNT_PERCENT = 15   # 15% win-back discount
```

**Campaign payload:**
```python
{
    "storeId": store_id,
    "name": "Win-Back Campaign — {date}",
    "type": "WIN_BACK",
    "status": "DRAFT",
    "autoGenerated": True,
    "targetSegment": "CHURNED_HIGH_VALUE",
    "customerIds": [...],
    "discountPercent": 15,
    "message": "We miss you! Come back and enjoy 15% off...",
    "expiresInDays": 7,
    "generatedBy": "churn_prevention_agent"
}
```

---

### 12.11 Agent 5: Review Response

**File:** `agents/review_response_agent.py`
**Trigger:** RabbitMQ event (`review.created`, rating ≤ 3)
**Returns:** `{"reviewId": id, "draftGenerated": True, "responseLength": len}`

**Logic:**
1. Extract complaint keywords from review text (cold, slow, late, wrong, missing, rude, dirty, overpriced, raw, burnt, stale, hair, wait, cancelled, never arrived, incorrect)
2. Call Gemini 2.0 Flash Lite to generate draft response (max 100 words, no marketing language)
3. On LLM failure: rule-based fallback:
   `"Thank you for your honest feedback. We're sorry to hear about {issue}. Our team is looking into this and we'll take steps to improve. We'd love the chance to make it right — please visit us again soon."`
4. Notify managers with REVIEW_DRAFT_RESPONSE notification

**Prompt instructions:**
- Acknowledge specific feedback (mention items if identifiable)
- Apologise sincerely
- State action to be taken
- Invite customer back with goodwill
- Max 100 words, no marketing language

---

### 12.12 Agents 6, 7, 8 (Stubs)

All three return `{"status": "stub", "message": "Requires Phase 2 PostgreSQL migration"}`.

Future functionality:
- **Agent 6 (Shift Optimisation):** Draft shift schedule based on demand forecasts + staff availability (Sunday 8pm)
- **Agent 7 (Kitchen Coach):** Nightly performance summary + coaching tips for kitchen staff
- **Agent 8 (Dynamic Pricing):** Suggest price adjustments based on real-time demand vs forecast (every 30 min during business hours)

---

### 12.13 Environment Variables

| Variable | Default | Required |
|----------|---------|----------|
| `GOOGLE_API_KEY` | — | YES |
| `GOOGLE_GENAI_USE_VERTEXAI` | `"0"` | No |
| `MASOVA_BACKEND_URL` | `http://localhost:8080/api` | No |
| `MASOVA_INTERNAL_TOKEN` | `""` | No |
| `REDIS_URL` | `redis://192.168.50.88:6379/1` | No |
| `AGENT_TOKEN` | `""` | No |
| `RABBITMQ_URL` | `amqp://guest:guest@192.168.50.88:5672/` | No |
| `BACKEND_URL` | `http://192.168.50.88:8080` | No |
| `LOG_LEVEL` | `INFO` | No |
| `LOG_FILE` | — | No |
| `LOCATION_API_URL` | `http://ip-api.com/json/` | No |
| `LOCATION_TIMEOUT` | `5.0` | No |

---

### 12.14 Data Models

#### Customer (dataclass)
```python
customer_id: str
name: str
tier: CustomerTier    # BRONZE, SILVER, GOLD, PLATINUM
loyalty_points: int
email: str
phone: str
created_at: str
```

#### Order (dataclass)
```python
order_id: str
customer_id: str
item: str
status: OrderStatus   # PENDING, CONFIRMED, PREPARING, OUT_FOR_DELIVERY, DELIVERED, CANCELLED
quantity: int
total_amount: float
created_at: str
updated_at: str
```

#### Location (dataclass)
```python
city: str
country: str
latitude: float
longitude: float
region: str
# __str__ returns "city, country"
```

---

### 12.15 LocationService

- Fetches geolocation via `http://ip-api.com/json/` (5s timeout)
- In-memory cache with 1h TTL, max 1000 entries (LRU eviction)
- Cache keyed by customer_id (optional)

---

### 12.16 Custom Exceptions

```python
MaSoVaException (base)
├── CustomerNotFoundError("Customer not found: {identifier}")
├── OrderNotFoundError("Order not found: {order_id}")
├── LocationServiceError("Location service unavailable")
├── ConfigurationError
└── AgentError
```

---

### 12.17 Test Suite

**test_scenarios.py** — 4 scenario smoke tests (user ID, menu inquiry, item availability, order placement)

**test_connection.py** — Google GenAI API connectivity check

**test_redis_session.py** (pytest-asyncio) — 3 unit tests:
1. `test_create_session_stores_in_redis` — verifies setex called
2. `test_session_ttl_is_one_hour` — verifies TTL = 3600
3. `test_fallback_to_in_memory_when_redis_unavailable` — verifies fallback path

---

*Continued in Part 3: MaSoVa Crew (Staff Mobile App)*
