# MaSoVa Demo Guide

> Written for the person running the demo. Plain language — no jargon. Every step is exact: what URL to open, what to click, what to say. The restaurant owner does not need to understand the tech — they need to see their problems being solved.

---

## Audience Profiles

**Restaurant owner / founder** — Cares about revenue, staff efficiency, and not juggling 5 tablets. Lead with the aggregator unification and AI insights. Skip deep tech.

**Restaurant manager** — Cares about day-to-day operations: kitchen flow, delivery, staff scheduling. Lead with KDS, driver OTP, and the AI schedule recommendation.

**Tech-savvy buyer / CTO** — Cares about architecture and reliability. Lead with the event-driven order lifecycle, dual-write persistence, and multi-tenancy. Point them to the README for system design highlights.

---

## Pre-Demo Setup Checklist

Do this **before** the meeting. Takes ~10 minutes.

### 1. Start all services
```bash
# Infrastructure (Dell / Docker)
docker compose up -d mongodb redis rabbitmq postgres

# Backend services (each in its own terminal)
cd api-gateway      && mvn spring-boot:run "-Dmaven.test.skip=true"   # :8080
cd core-service     && mvn spring-boot:run "-Dmaven.test.skip=true"   # :8085
cd commerce-service && mvn spring-boot:run "-Dmaven.test.skip=true"   # :8084
cd payment-service  && mvn spring-boot:run "-Dmaven.test.skip=true"   # :8089
cd logistics-service && mvn spring-boot:run "-Dmaven.test.skip=true"  # :8086
cd intelligence-service && mvn spring-boot:run "-Dmaven.test.skip=true" # :8087

# AI Agent (Mac)
cd /Users/souravamseekarmarti/Projects/masova-support
uvicorn src.masova_agent.main:app --host 0.0.0.0 --port 8000 --reload

# Frontend (Mac)
cd frontend && npm run dev   # :3000
```

### 2. Verify everything is up
```bash
curl http://localhost:8080/actuator/health   # → {"status":"UP"}
curl http://localhost:8085/actuator/health   # → {"status":"UP"}
curl http://localhost:8084/actuator/health   # → {"status":"UP"}
curl http://localhost:8000/health            # → AI agent up
```

### 3. Seed demo data (if not already seeded)
```powershell
# Run on Dell (PowerShell)
cd scripts
.\populate-menu.ps1     # populates menu items
```

### 4. Pre-open browser windows/tabs

Set up this exact layout before the call — switching tabs live looks messy:

| Window / Tab | URL | Logged in as |
|---|---|---|
| Tab 1 — Public site | http://localhost:3000 | Not logged in |
| Tab 2 — Customer | http://localhost:3000/customer-login | customer@demo.com |
| Tab 3 — KDS | http://localhost:3000/kitchen | No login needed (public route) |
| Tab 4 — POS / Kiosk | http://localhost:3000/pos | PIN per order (PIN: 1234) |
| Tab 5 — Driver | http://localhost:3000/driver | driver@demo.com |
| Tab 6 — Manager | http://localhost:3000/manager?section=dashboard | manager@demo.com |

> **Pro tip:** Use two monitors or a split screen. Keep the Customer tab and KDS tab side by side for the live order demo — this is the single most impressive moment.

### 5. Pre-load the AI agent
Send one warm-up message via the chat widget before the demo so the first response isn't slow:
> *"What are your opening hours?"*

### 6. Mobile apps (optional but impressive)
- **masova-mobile** (Metro on `:8888`): `cd /Users/souravamseekarmarti/Projects/masova-mobile && npx react-native start --port 8888` then `npx react-native run-android` or `run-ios`
- **MaSoVa Crew:** `cd /Users/souravamseekarmarti/Projects/MaSoVaCrewApp && npx react-native start` then run on a second device or simulator
- Both apps connect to backend at `192.168.50.88:8080` — ensure Dell is reachable on your LAN

---

## Demo Credentials

| Role | Login | How to access | Notes |
|---|---|---|---|
| **Customer (web)** | customer@demo.com / demo1234 | http://localhost:3000/customer-login | JWT stored in localStorage/sessionStorage |
| **Manager** | manager@demo.com / demo1234 | http://localhost:3000/manager?section=dashboard | user.type = MANAGER |
| **Kitchen staff** | No login needed | http://localhost:3000/kitchen | Public route — no auth |
| **Cashier / POS** | PIN: `1234` | http://localhost:3000/pos | PIN auth per order, not session |
| **Staff login (shared)** | staff@demo.com / demo1234 | http://localhost:3000/staff-login | For DRIVER, MANAGER, STAFF roles |
| **Driver (web)** | driver@demo.com / demo1234 | http://localhost:3000/driver | user.type = DRIVER |
| **Customer (mobile)** | customer@demo.com / demo1234 | masova-mobile app | Token key: `masova_auth_token` |
| **Driver (mobile)** | driver@demo.com / demo1234 | MaSoVa Crew app → DriverTabNavigator | |
| **Kitchen (mobile)** | kitchen@demo.com / demo1234 | MaSoVa Crew app → KitchenTabNavigator | user.type = KITCHEN_STAFF |

---

## The Three Wow Moments

Before the full walkthrough, know these three moments — they reliably land with every restaurant owner:

**Wow #1 — Live order → KDS in real time**
Customer places order on Tab 2. Switch to Tab 3 (KDS). The order appears instantly, no refresh. If you have two monitors, keep both visible simultaneously. Say: *"This is what your kitchen team sees the second a customer taps 'Place Order' — from anywhere, any channel."*

**Wow #2 — All aggregator orders in one queue**
In Manager Dashboard → Orders (`/manager?section=orders&tab=orders`), show orders tagged with `WOLT`, `DELIVEROO`, `JUST_EAT`, `UBER_EATS` and `MASOVA` sitting in the same queue. Say: *"Your kitchen gets one screen. Not a Wolt tablet, a Deliveroo tablet, a website tablet, and a phone. One screen."*

**Wow #3 — AI draft schedule on Sunday night**
In Manager Dashboard → AI Insights → Shift Recommendations. Show a draft schedule that the manager can approve or edit. Say: *"Every Sunday at 8pm, MaSoVa drafts next week's staff schedule based on forecasted demand. You review it, adjust if needed, and approve — that's it."*

> **Demo note:** All 8 agents are fully operational. Trigger any agent manually via `POST /agents/{name}/trigger` if you want to show a live response during the demo.

---

## Full Demo Walkthrough — 25 Minutes

---

### Step 1 — The Public Face (2 min)

**Tab 1:** http://localhost:3000 (not logged in)

What to show:
- The landing page hero — restaurant name, tagline, "Order Now" CTA
- Scroll down to the public menu — categories, item images with prices
- Store info — opening hours, address, delivery zones
- Any active promotions

What to say:
> *"This is what a customer sees before they even create an account. Your menu, your branding, your promotions — no Wolt or Deliveroo commission on this traffic."*

---

### Step 2 — Customer Orders (3 min)

**Tab 2:** http://localhost:3000/customer (logged in as customer@demo.com)

Step by step:
1. Browse the menu — click into a category, open an item
2. **Point out allergen info on the item** — 14 allergens listed, legally required in the EU. Say: *"Every item has mandatory allergen declarations. A manager cannot set an item to 'available' until allergens are confirmed. Your staff are protected from liability."*
3. Add 2–3 items to cart
4. Go to cart — show the delivery fee calculating automatically based on address zone (0–3km / 3–6km / 6–10km). The cart also shows VAT applied at the correct rate for the store's country. Say: *"Delivery fee and tax are both calculated server-side. Zone rates are configured once per store in the local currency — MaSoVa calculates it every time, no staff doing mental maths. And the VAT rate adjusts automatically for dine-in vs takeaway."*
5. Proceed to checkout — show address input (Google Places autocomplete)
6. Show the payment screen — Stripe (SCA/3D Secure) for EU stores. Say: *"Stripe is selected automatically based on your store's country — SCA compliant, supports EUR, GBP, CHF, HUF. If you expand to a new market, you set the country code once. No code changes."*
7. **Place the order** — this triggers Wow #1

---

### Step 3 — Kitchen Display System (2 min) ⭐ WOW #1

**Immediately switch to Tab 3 (KDS)** after placing the order in Step 2.

What to show:
- The order appears instantly — no refresh. Full lifecycle visible: `RECEIVED → PREPARING → OVEN → BAKED → READY`
- Each item has a countdown timer
- Tap an item to advance its stage — it moves columns
- **Quality checkpoints** — at each stage a checkpoint can be logged (INGREDIENT_QUALITY, PORTION_SIZE, TEMPERATURE, PRESENTATION, PACKAGING, FINAL_INSPECTION) with PASSED/FAILED status and notes
- Once all items reach READY, the customer's tracking screen updates in real time via WebSocket

What to say:
> *"That order appeared here in under a second. No one called the kitchen. No one typed anything. The kitchen team taps items as they finish — and the customer's tracking screen updates automatically. Your floor staff know exactly when to collect orders without asking the kitchen."*

> **If they ask how:** *"Every order state change publishes an event that all connected screens receive instantly via WebSocket. There's no polling, no refresh."*

---

### Step 4 — POS / Kiosk for In-Store Orders (1 min)

**Tab 4:** http://localhost:3000/pos (PIN: 1234)

What to show:
- Touch-optimised ordering interface
- Dine-in vs takeaway toggle
- Add items quickly — designed for speed at a counter
- Receipt generation

What to say:
> *"Walk-in customers are handled here. Same menu, same inventory, same order queue in the kitchen. Cashier enters the PIN and starts taking orders — no training needed beyond the first 5 minutes."*

---

### Step 5 — Aggregator Orders (1 min) ⭐ WOW #2

**Tab 6:** http://localhost:3000/manager → Orders tab

What to show:
- The unified order queue — show orders with source badges: `MASOVA` (direct), `WOLT`, `DELIVEROO`, `JUST_EAT`, `UBER_EATS`
- All in one list, sorted by time
- Click a Wolt order — it has identical structure to a direct order, with `aggregatorOrderId` and `aggregatorCommission` fields for reconciliation

What to say:
> *"Wolt sends you an order. Deliveroo sends you an order. A customer orders on your website. A customer walks in. All four land in one queue — the kitchen sees one screen, not four tablets. MaSoVa normalises every channel."*

---

### Step 6 — Manager Dashboard & Analytics (3 min)

**Tab 6:** http://localhost:3000/manager (already open)

**Revenue Analytics section:**
- Today's total revenue, number of orders, average order value
- Top 5 selling items by revenue
- Period comparison — this week vs last week, with % change
- Revenue by channel (direct vs aggregator)

What to say:
> *"Every morning your manager has a complete picture of yesterday's performance before the first staff member arrives. No spreadsheets, no manual tallying."*

**Staff Management section:**
- Active staff list with roles
- Shift assignments for today
- Earnings per staff member (drivers, cashiers)

What to say:
> *"Driver earnings, cashier hours, kitchen throughput — all in one place. Payroll prep goes from half a day to 15 minutes."*

---

### Step 7 — AI Insights (3 min) ⭐ WOW #3

**Tab 6:** Manager Dashboard → AI Insights panel

Walk through each insight type:

**Demand Forecast** (fires daily at 2am)
> *"Based on your last 90 days, MaSoVa predicts which items will sell most this weekend — broken down by hour. Your kitchen preps the right amount. Less waste, fewer stockouts."*

**Inventory Alert** (checks every 6 hours)
> *"The inventory agent noticed your mozzarella stock is trending toward zero by Thursday at current order rates. It's drafted a purchase order — you just review and approve."*

**Churn Prevention** (fires daily at 10am)
> *"These 12 customers ordered every week for 3 months and then stopped. MaSoVa identified them and suggested a personalised offer. You approve the offer and it goes out automatically."*

**Review Response** (fires on every ≤3 star review)
> *"A 2-star review came in at midnight. By 9am, MaSoVa has drafted a personalised response for the manager to approve and send. No more ignoring reviews because there's no time."*

**Shift Recommendation** (every Sunday at 8pm)
> *"Every Sunday night, MaSoVa drafts next week's staff schedule based on forecasted demand. You review it, adjust if needed, and approve."*

**Kitchen Coach** (nightly 11pm)
> *"Every night MaSoVa analyses prep times and surfaces kitchen efficiency gaps. Your head chef gets a brief every morning."*

**Dynamic Pricing** (every 30 min, 9am–10pm)
> *"During peak hours, MaSoVa suggests small price adjustments on high-demand items. You control what gets approved — it never changes a price without your sign-off."*

What to say:
> *"Every single one of these is a suggestion. Nothing changes in your restaurant without a manager approving it. MaSoVa is your analyst and drafter — you're still in charge."*

---

### Step 8 — AI Support Chat (2 min)

**Tab 2:** Customer app → chat bubble (bottom right)

Type these messages live:
1. *"Where is my order?"* → Agent checks order status in real time and responds with the current stage
2. *"Do you have anything without gluten?"* → Agent filters menu by allergens and responds
3. *"I want to cancel my order"* → Agent captures intent, explains the policy, and escalates to the manager queue if within cancellation window
4. *"I want a refund"* → Agent logs the request and routes it; customer gets a reference number

What to say:
> *"This runs 24/7. 3am on a Sunday, a customer asks where their order is — they get an answer instantly, without waking anyone up. Your staff answer meaningful questions. The repetitive ones are handled here."*

Show: the chat is also in the mobile app (masova-mobile → ChatScreen). Same session — if a customer starts on the website and switches to the app, the conversation continues.

---

### Step 9 — Driver Flow (2 min)

**Tab 5:** http://localhost:3000/driver (driver@demo.com)

What to show:
- Active delivery assigned to this driver
- Customer name, address, order summary
- Map view showing the route
- OTP input field — 4-digit code generated at dispatch, valid for 15 minutes. Customer shows the driver a code on their screen, driver enters it to confirm delivery. Can be regenerated if expired.
- Proof type options: OTP, SIGNATURE, PHOTO, CONTACTLESS

What to say:
> *"Proof of delivery is OTP-verified. No more 'I never received it' disputes — the system records the exact moment the driver entered the correct code at the door, plus the delivery type used."*

**On MaSoVa Crew app (if mobile is running):**
- Show the same driver view on the mobile app
- Background location tracking — manager can see driver position in real time
- Works offline — if signal drops, delivery actions queue and sync when connectivity returns

---

### Step 10 — Mobile: Customer App (masova-mobile) (2 min)

*Run on device or simulator. Metro runs on :8888.*

Walk through:
1. HomeScreen — store selection (customer picks nearest location), personalised menu
2. ItemDetailScreen — image, description, quantity selector, allergen list
3. CartScreen — items, delivery fee by zone, promo code field
4. CheckoutScreen — saved address or new address with Google Places, Stripe payment (SCA/3D Secure for EU stores)
5. OrderTrackingScreen — live map of driver location, order lifecycle stages, ETA
6. ChatScreen — AI support, session shared with web

What to say:
> *"This is the app your customers download. Your brand, your menu, your loyalty programme. Every order through this app is a direct order — zero commission to Wolt or Deliveroo."*

---

### Step 11 — Mobile: Staff App (MaSoVa Crew) (2 min)

*Run on a second device or simulator.*

Log in as each role to show the automatic role-routing:

**Driver (green):** Active delivery screen with map, OTP confirmation, delivery history with earnings breakdown.

**Kitchen (orange):** Mobile KDS — same live queue as the web display. Kitchen staff can check the queue while moving around the kitchen, not just at the fixed screen.

**Cashier (blue):** QuickOrderScreen — streamlined POS for fast counter service.

**Manager (purple):** QuickDashboardScreen — key today metrics at a glance, shift overview, earnings summary. Full management on the go.

What to say:
> *"One app, every role. A staff member downloads MaSoVa Crew, logs in, and sees exactly what they need and nothing they don't. A driver doesn't see the kitchen queue. A kitchen chef doesn't see delivery assignments."*

---

### Step 12 — Multi-Store (1 min)

**Tab 6:** Manager Dashboard → Store Selector (top of page)

Switch between Store A and Store B:
- Each store has its own menu, staff, delivery zones, and analytics
- Revenue view can show combined or per-store
- Staff are scoped to their store — a cashier at Store A cannot see Store B orders

What to say:
> *"Whether you have one location or ten, the platform is the same. No extra subscriptions per location, no separate systems to maintain. Your head office gets the combined view; each store manager sees only their store."*

---

## Allergen Compliance Highlight (EU Restaurants)

> This section is especially relevant for restaurants in the UK, EU, or Ireland.

On any menu item in the Manager Dashboard → Menu Management:

- Every item has a mandatory allergen declaration section (14 EU allergens: gluten, crustaceans, eggs, fish, peanuts, soybeans, milk, nuts, celery, mustard, sesame, sulphites, lupin, molluscs)
- An item **cannot be set to Available** until a manager has explicitly confirmed the allergen status for each allergen type
- This is enforced at the API level — not just a UI reminder
- Customer menus display allergen icons on every item
- Customers can filter the menu by allergens

What to say:
> *"Allergen misdeclaration is a criminal offence in the UK and EU. MaSoVa makes compliance automatic — your team cannot accidentally mark an item available without declaring its allergens first. Your legal exposure is dramatically reduced."*

---

## Post-Demo: What to Do Next

After a successful demo, don't leave without agreeing on a next step:

1. **Send them the README** — link to your GitHub repo. Technical buyers will read the system design section.
2. **Offer a trial deployment** — one store, Docker Compose, their own data, 2-week trial.
3. **Walk them through the roadmap** — Phase 7 (GCP Cloud Run deployment) and Phase 8 (quality/testing) show this is production-bound, not a prototype.
4. **Ask about their current setup** — how many aggregators, how many locations, what POS they use now. Map MaSoVa's features to their specific pain points.

---

## Live Demo Troubleshooting

| Problem | Fix |
|---|---|
| Order doesn't appear on KDS | Check RabbitMQ is running: `docker compose ps`. Restart commerce-service. |
| AI chat responds slowly | First response after cold start is slow — always warm up the agent before the demo |
| Payment screen errors | Use Stripe test card: `4242 4242 4242 4242`, any future date, any 3-digit CVV, any postcode |
| Service health check fails | Check the Dell is on the network: `ping 192.168.50.88`. Ensure all 6 services started. |
| masova-mobile won't connect | Check `src/services/api.ts` — `API_BASE_URL` must be `http://192.168.50.88:8080/api` on a real device |
| MaSoVa Crew won't connect | Check `src/config/api.config.ts` — `API_GATEWAY_URL` must be `http://192.168.50.88:8080/api` |
| masova-mobile WebSocket fails | Dev WS URLs: `ws://192.168.50.88:8083/ws/orders` and `ws://192.168.50.88:8090/ws/delivery` — verify ports open |
| Driver map doesn't show | Google Maps API key must be valid and have Maps SDK for Android/iOS enabled |

---

## Common Questions from Restaurant Owners

**"How is this different from a normal POS?"**
> A POS only handles in-store billing. MaSoVa is the entire operation — customer app, kitchen display, delivery management, EU VAT compliance, fiscal signing, and AI — all connected. Your POS doesn't know what your Wolt or Deliveroo orders are doing. MaSoVa does.

**"Do I need to replace my Wolt/Deliveroo?"**
> No. MaSoVa connects to them — it pulls those orders into your own system. You keep the aggregator channel open while also building your own direct-order customer base where you pay zero commission.

**"Can I keep my current payment provider?"**
> MaSoVa uses Stripe (SCA-compliant, supports EUR/GBP/CHF/HUF) out of the box, selected automatically by your store's country. Razorpay is available for India stores. If you need a different provider, it's an integration — not a platform change.

**"What if the internet goes down?"**
> The POS and MaSoVa Crew app operate in offline mode for in-store operations. Orders are queued locally and synced the moment connectivity returns. No order is lost.

**"Is my customer data safe?"**
> All data is scoped to your store. No other restaurant can see your orders or customers. Financial records are stored in a relational database with full audit trails and are never deleted — only archived. JWT sessions are invalidated server-side on logout.

**"How long to set up?"**
> A single-store deployment with Docker Compose takes under an hour on any machine with Java 21 and Docker. The production deployment to GCP Cloud Run is fully automated.

**"What does it cost to run?"**
> Infrastructure cost on GCP Cloud Run scales to zero when idle. For a typical single-location EU restaurant, estimated cloud cost is €50–100/month. There are no per-order or per-transaction fees from MaSoVa itself — only Stripe's standard rates apply (typically 1.5% + €0.25 for European cards).
