# MaSoVa Global — Master Brief
**Date:** 2026-04-10  
**Status:** Brainstormed — ready for individual phase specs  
**Scope:** Full global multi-market expansion of MaSoVa Restaurant OS  
**Target markets:** Germany, France, Italy, Netherlands, Belgium, Hungary, Luxembourg, Ireland, Switzerland, UK, USA, Canada

---

## What MaSoVa Is Today

A full-stack restaurant operating system built for multi-store operations in India. It covers every operational layer of a restaurant from customer ordering to kitchen display, driver delivery, POS, staff management, and analytics.

### Current tech stack
- **Backend:** Java 21, Spring Boot 3, 6 microservices
- **Databases:** MongoDB (documents), PostgreSQL (financial), Redis (sessions + JWT blacklist)
- **Messaging:** RabbitMQ (`masova.orders.exchange`, `masova.notifications.exchange`)
- **Frontend:** React 19, TypeScript, Vite — 6 web apps in one repo
- **Mobile:** React Native 0.83 (MaSoVa Crew — staff), React Native 0.81 (masova-mobile — customer)
- **AI:** Python, Google ADK 1.25, FastAPI — masova-support
- **Deployment:** GCP Cloud Run + Firebase Hosting

### Current 6 backend services
| Service | Port | Owns |
|---|---|---|
| api-gateway | 8080 | JWT auth, rate limiting, routing |
| core-service | 8085 | Users, stores, shifts, customers, loyalty, GDPR, notifications, reviews, earnings |
| commerce-service | 8084 | Orders, menu, KDS, WebSocket, tips, kitchen equipment |
| payment-service | 8089 | Razorpay payments, refunds, webhooks |
| logistics-service | 8086 | Delivery dispatch, driver tracking, inventory, suppliers, purchase orders, waste |
| intelligence-service | 8087 | Analytics, BI, cost analysis, executive reporting, benchmarking |

### Current web apps (all in /frontend)
| App | Audience |
|---|---|
| Public Website | Customers — landing, menu browse |
| Customer App | Customers — ordering, tracking, cart, loyalty |
| POS System | Cashier staff — touch ordering, payment |
| Kitchen Display (KDS) | Kitchen staff — order queue, timers |
| Driver App | Drivers — deliveries, route, history |
| Manager Dashboard | Managers — full operations, analytics, staff, inventory |

### Current mobile apps
| App | Platform | Audience |
|---|---|---|
| MaSoVa Crew (MaSoVaCrewApp) | RN 0.83 | Staff — cashier, kitchen, driver, manager |
| masova-mobile | RN 0.81 | Customers — ordering, tracking, support chat |

### Current AI agents (masova-support)
- **Customer support agent** — LlmAgent with 5 tools, genuinely agentic
- **7 scheduled agents** — demand forecasting, dynamic pricing, churn prevention, inventory reorder, kitchen coach, review response, shift optimisation — currently automated workflows (cron + LLM), not truly agentic

### Current order lifecycle
```
RECEIVED → PREPARING → READY →
  DELIVERY:  DISPATCHED → OUT_FOR_DELIVERY → DELIVERED (OTP verified)
  DINE_IN:   SERVED
  TAKEAWAY:  COMPLETED
  any:       CANCELLED
```

### Current order types
`DINE_IN`, `TAKEAWAY`, `DELIVERY`

### Current payment methods
`CASH`, `CARD`, `UPI`, `WALLET` — all via Razorpay (India only)

### Current tax system
Indian GST — CGST/SGST split, per-state rates (5–28%), per-category rates, configurable via `TaxConfiguration` YAML

### Current delivery zones (India)
- ZONE_A: 0–3km → ₹29
- ZONE_B: 3–6km → ₹49
- ZONE_C: 6–10km → ₹79
- Out of area: >10km

### What is already strong
- GDPR — consent, erasure (anonymization not delete), audit logs, breach logging, retention policies
- Dual-write PostgreSQL + MongoDB for financial data
- WebSocket real-time order updates to all 4 channels simultaneously
- OTP delivery verification
- Proof of delivery (OTP, signature, photo, contactless)
- Loyalty points with full transaction history
- Waste recording and analysis
- Supplier + purchase order management
- Staff shift scheduling and clock-in/clock-out
- Tip pooling (direct or pool)
- Role-based access (Customer, Staff, Driver, Manager, Admin)
- Circuit breakers on all inter-service calls

### What is currently missing (identified in audit)
- No immutable event journal (order doc is mutable, events are fire-and-forget)
- No offline mode — system goes dark if backend unreachable
- Allergens stored as free-text List<String>, no enforcement gate
- No reservations / waitlist
- No delivery aggregator integration
- AI agents are workflows not agentic loops
- Analytics uses estimated ratios not real data for labor/food cost

---

## The Global Expansion Vision

MaSoVa Global is the transformation of MaSoVa from an India-only restaurant POS into a **multi-country, multi-store restaurant operating system** that operates correctly and legally in 12 countries across Europe and North America.

### Target countries
| Country | Region | Fiscal system | Currency |
|---|---|---|---|
| 🇩🇪 Germany | EU | TSE hardware (§146a AO) | EUR |
| 🇫🇷 France | EU | NF525 software certification | EUR |
| 🇮🇹 Italy | EU | RT Device hardware | EUR |
| 🇳🇱 Netherlands | EU | None required | EUR |
| 🇧🇪 Belgium | EU | FDM hardware | EUR |
| 🇭🇺 Hungary | EU | NTCA/OSCAR government API | HUF |
| 🇱🇺 Luxembourg | EU | None required | EUR |
| 🇮🇪 Ireland | EU | None required | EUR |
| 🇨🇭 Switzerland | Non-EU Europe | None required | CHF |
| 🇬🇧 UK | Post-Brexit | Making Tax Digital (HMRC) | GBP |
| 🇺🇸 USA | North America | None (Stripe Tax) | USD |
| 🇨🇦 Canada | North America | None (Stripe Tax) | CAD |

### Core design principle
**Country is set once at store creation. Everything derives from it.**

When a manager creates a store and selects a country, the system automatically derives:
- Currency
- Locale and language
- VAT/tax engine and rates
- Fiscal signing adapter
- Payment gateway configuration
- Enabled local payment methods
- Receipt language and format
- Allergen label language
- Pay period rules for payroll

The country field is **immutable after the first order is placed.**

---

## The 9 Global Phases

---

### Phase Global-1: Allergen Law Compliance
**Status:** ✅ COMPLETE — 2026-04-11 · PR #8 (`feature/global-1-allergen`) · 15 commits · 20 tests

**Legal basis:** EU Regulation 1169/2011 — 14 mandatory named allergens

**What changes:**
- Replace `List<String> allergens` in `MenuItem` with `Set<AllergenType>` — typed enum of exactly 14 values: CELERY, CEREALS_GLUTEN, CRUSTACEANS, EGGS, FISH, LUPIN, MILK, MOLLUSCS, MUSTARD, NUTS, PEANUTS, SESAME, SOYA, SULPHUR_DIOXIDE
- Remove duplicate allergen field from `NutritionalInfo` — single source of truth on `MenuItem`
- Enforcement gate: menu item cannot be set `isAvailable = true` unless allergen set has been explicitly declared
- KDS tickets show allergen icon badges per item — any of the 14 flash amber
- Customer app shows full allergen list on item detail — warns if item matches customer's flagged allergens
- POS shows allergen summary on order confirmation
- Manager dashboard recipe management — 14-checkbox grid replaces free-text input

**Backend:** shared-models, commerce-service MenuService + OrderService  
**Frontend:** KitchenDisplayPage, RecipeManagementPage, CustomerApp menu pages, POSSystem  
**Mobile:** masova-mobile item detail screen, MaSoVaCrewApp KitchenQueueScreen  
**Database:** MongoDB menu_items — allergens field migration from strings to enum names  
**RabbitMQ:** No new events — allergen data travels in existing order payload

---

### Phase Global-2: EU VAT Engine
**Legal basis:** EU VAT Directive 2006/112/EC — per-country, per-context rates

**What changes:**
- New `EuVatConfiguration` YAML replacing `TaxConfiguration` — covers all 27 EU members
- VAT rates vary by: country, order context (dine-in vs takeaway vs delivery), item category
- Key rates configured:
  - DE: dine-in 19%, takeaway food 7%
  - FR: dine-in 10%, takeaway food 5.5%, alcohol 20%
  - IT: dine-in 10%, takeaway food 4%
  - NL: food 9%, alcohol 21%
  - BE: dine-in 12%, takeaway 6%
  - HU: standard 27%, takeaway food 5%
  - LU: dine-in 17%, takeaway food 3%
  - IE: food 13.5%, alcohol 23%
- `Store` entity gains: `countryCode`, `vatNumber`, `currency`, `locale` — all derived from country selection
- `Order` entity gains: `vatCountryCode`, `vatBreakdown` (per line item), `totalNetAmount`, `totalVatAmount`, `totalGrossAmount`
- Old `tax` field retained for India stores — India fallback active when `countryCode` is null
- VAT breakdown stored per line item, not just order total — required for fiscal compliance
- `TaxConfiguration` deprecated but not removed

**Backend:** shared-models (new VatProfile, EuVatConfiguration), core-service Store entity, commerce-service OrderService  
**Frontend:** StoreManagementPage (country + VAT number fields), PaymentDashboardPage (VAT breakdown), AdvancedReportsPage (VAT CSV export), POSSystem receipt (line-item VAT)  
**Mobile:** No structural change — prices display correctly via EU-3 currency formatting  
**Database:** MongoDB stores + orders collections. PostgreSQL V9 migration — vat columns on orders_jpa  
**RabbitMQ:** OrderCreatedEvent + OrderStatusChangedEvent gain `vatCountryCode` and `totalVatAmount`

---

### Phase Global-3: Currency / Locale / Language
**What changes:**
- New `MoneyAmount` value object: `{amount: long, currency: String}` — replaces all raw price fields
- All monetary values stored as integers in smallest currency unit (cents, paise, grosz)
- Currency derived from store country — never manually entered
- `CountryProfileService` maps countryCode → currency + locale automatically at store creation
- Frontend `formatMoney(amount, currency, locale)` utility using `Intl.NumberFormat` — replaces every hardcoded ₹ symbol
- Frontend `formatDate(date, locale)` utility using `Intl.DateTimeFormat`
- `deliveryFeeINR` renamed to `deliveryFee` — currency carried alongside, never hardcoded
- Redux `cartSlice` stores `deliveryFeeCents` (integer) + `currency`
- i18n via `react-i18next` — translation files for: en, de, fr, it, es, nl, pl
- Active locale derived from store locale field — no manual language switcher for staff
- Customer-facing pages use browser language with store locale as fallback
- Cross-store reports spanning multiple currencies show per-currency subtotals — never silent conversion

**Backend:** shared-models MoneyAmount, commerce-service, payment-service, intelligence-service  
**Frontend:** Every price-displaying component. CartDrawer, CheckoutPage, POSSystem, OrderManagementPage, PaymentDashboardPage, AnalyticsDashboard  
**Mobile:** masova-mobile `useMoney()` hook, MaSoVaCrewApp QuickOrderScreen + receipt  
**Database:** MongoDB menu_items gains `currency` field. PostgreSQL V10 — currency column on orders_jpa  
**RabbitMQ:** OrderCreatedEvent + OrderStatusChangedEvent gain `currency` field

---

### Phase Global-4: Payments — Stripe + SCA/PSD2
**Legal basis:** EU PSD2 Directive — Strong Customer Authentication mandatory for online card payments

**What changes:**
- New `PaymentGateway` interface — `createPaymentIntent`, `confirmPayment`, `refund`, `parseWebhook`
- `RazorpayGateway` — existing logic moved here, India stores unchanged
- `StripeGateway` — new implementation for all 12 target countries
  - Stripe `PaymentIntent` with `automatic_payment_methods: enabled` — Stripe handles local method display automatically
  - SCA/3DS2 handled by Stripe's hosted Payment Element — no custom 3DS logic
  - Idempotency keys using orderId — prevents double-charge on retry
  - Webhook signature verified via `Stripe-Signature` header
- Gateway resolved by `store.countryCode` — invisible to all other services
- Frontend: EU stores render Stripe `<PaymentElement />` — automatically shows iDEAL (NL), Bancontact (BE), BLIK (PL), Giropay (DE), etc.
- India stores: existing Razorpay flow unchanged
- masova-mobile: `@stripe/stripe-react-native` for EU, existing Razorpay RN SDK for India
- MaSoVaCrewApp cashier: card-present terminal (Stripe Terminal) flagged as future phase — cash + manual for now
- New payment method enum value: `AGGREGATOR_COLLECTED` for aggregator orders
- PaymentDashboardPage gains: stripe_fee column, payment_method_type column

**Backend:** payment-service — PaymentGateway interface, RazorpayGateway, StripeGateway, updated controllers  
**Frontend:** CheckoutPage, PaymentPage — conditional gateway rendering  
**Mobile:** masova-mobile payment screens  
**Database:** PostgreSQL V11 — stripe columns on payments table. MongoDB payments collection gains gateway fields  
**RabbitMQ:** PaymentCompletedEvent + PaymentFailedEvent gain `paymentGateway` and `paymentMethodType`  
**Security:** STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET in environment variables. Webhook paths exempt from rate limiting.

---

### Phase Global-5: Fiscal Signing — All 12 Countries
**Legal basis:** Country-specific fiscal laws — see table below

**Architecture:** `FiscalSigner` interface + `FiscalSignerRegistry`. MaSoVa never implements signing directly — calls `sign(order, vatBreakdown)`, adapter handles country-specific logic.

**`FiscalSignature` value object:** signerCountry, signerSystem, transactionId, signatureValue, qrCodeData, signedAt (from signing system clock never app clock), signingDeviceId, extras map

**Per-country signing implementations:**

| Country | Signer | Type | Notes |
|---|---|---|---|
| DE | TseFiscalSigner | Hardware API | Calls TSE device REST API on local network. If offline, orders queue as PENDING_FISCAL_SIGNATURE, must flush before Z-report |
| FR | Nf525FiscalSigner | Software | Once signed, order is immutable — corrections are new credit note orders, never edits |
| IT | RtFiscalSigner | Hardware API | RT device on local network, same pattern as TSE |
| NL | PassthroughFiscalSigner | None | isRequired() = false |
| BE | FdmFiscalSigner | Hardware API | FDM black box device |
| HU | HungaryNtcaFiscalSigner | Government API | OSCAR API — submit within 500ms for invoices >HUF 100k, within 4 days for smaller. Retry queue in Redis with exponential backoff |
| LU | PassthroughFiscalSigner | None | isRequired() = false |
| CH | SwitzerlandFiscalSigner | Passthrough | Annual VAT return only |
| GB | UkMtdFiscalSigner | Software | Passthrough at transaction level. Builds quarterly VAT ledger in PostgreSQL. Manager triggers HMRC MTD submission quarterly |
| IE | PassthroughFiscalSigner | None | isRequired() = false |
| US | PassthroughFiscalSigner | Stripe Tax | Stripe Tax handles compliance |
| CA | PassthroughFiscalSigner | Stripe Tax | Stripe Tax handles compliance |

**Three tax engines:**
- `EuVatEngine` — covers DE, FR, IT, NL, BE, HU, LU, IE via YAML lookup
- `NonEuVatEngine` — covers CH (8.1%/2.6%/3.8%) and UK (0% cold food, 20% hot food + alcohol, per-item `ukVatCategory` field on MenuItem)
- `StripeTaxEngine` — covers US and CA. Calls Stripe Tax API, result cached in Redis 24h per store+item

**Signing flow:** Order reaches terminal status (COMPLETED/SERVED/DELIVERED) → build ReceiptPayload → call FiscalSignerRegistry.resolve(countryCode).sign() → store FiscalSignature on order → if signing fails and isRequired()=true → flag RECEIPT_SIGNING_FAILED → alert manager

**Receipt generation:** receipt-service module inside commerce-service. PDF + thermal printer format. QR code from fiscalSignature.qrCodeData on printed receipts (AT, DE, IT, BE). Locale-aware — German receipt in German.

**New FiscalCompliancePage in manager dashboard:**
- Signing success rate last 7 days
- RECEIPT_SIGNING_FAILED orders requiring resolution
- Device status (online/offline) for DE/IT/BE
- Daily Z-report for DE/AT/IT
- Monthly fiscal archive export (10-year legal retention)
- UK MTD: quarterly ledger + Submit to HMRC button
- HU NTCA: real-time submission status + retry queue

**StoreManagementPage additions:**
- DE/IT/BE: fiscal device IP + test connection button
- FR: NF525 software status + inalterability warning
- HU: NTCA API credentials (technical ID + exchange key)
- GB: MTD HMRC credentials + VAT registration number
- CH: Swiss VAT number + annual return button
- US/CA: Stripe Tax enabled indicator (automatic)

**Hard constraints:**
- FR NF525: order immutable after signing — no field modification allowed
- DE TSE: offline queue flushed before end-of-day Z-report
- AT RKSV: void = signed negative transaction, never a gap in chain
- All: fiscal timestamp from signing system clock, never LocalDateTime.now()
- All fiscal records: soft delete only, 10-year retention, never DELETE

**Backend:** commerce-service (FiscalSigner interface + adapters + receipt-service), shared-models (FiscalSignature)  
**Frontend:** StoreManagementPage, new FiscalCompliancePage, POSSystem receipt with QR, customer app order history receipt view  
**Mobile:** MaSoVaCrewApp cashier — digital receipt send button. masova-mobile — receipt with VAT breakdown + QR  
**Database:** MongoDB orders gains fiscalSignature field. PostgreSQL V12 fiscal_signatures table (never deleted). V13 uk_vat_ledger. V14 stripe_tax_calculations  
**RabbitMQ:** New ReceiptSignedEvent on masova.orders.exchange routing key `order.receipt.signed`. Intelligence-service subscribes for compliance rate tracking. Notification service subscribes for RECEIPT_SIGNING_FAILED alerts

---

### Phase Global-6: Delivery Aggregator Hub
**Aggregators:** Wolt, Deliveroo, Just Eat Takeaway, Uber Eats  
**Integration method (Phase 1):** Manual entry — staff enters aggregator orders into POS

**What changes:**
- `Order` entity gains `orderSource` field: `MASOVA, WOLT, DELIVEROO, JUST_EAT, UBER_EATS`
- POS order creation gains source selector — staff picks platform when entering an aggregator order
- Commission % configured per platform per store in AggregatorHubPage settings
- Net payout calculated automatically: gross revenue - configured commission %
- Aggregator orders skip delivery radius check and payment processing (already paid via aggregator)
- `paymentMethod: AGGREGATOR_COLLECTED` for aggregator orders
- KDS shows aggregator source badge per ticket (colour-coded per platform)
- OrderManagementPage gains orderSource filter
- Manager dashboard gains `AggregatorHubPage`: commission settings per platform, platform connection status
- Manager dashboard gains `PlatformPnLPage`: revenue/commission/net/margin per platform, per period, top items per platform, order volume by hour, direct vs aggregator margin comparison
- `Order` entity also gains: `aggregatorOrderId` (manually entered by staff for reference), `aggregatorCommission`, `aggregatorNetPayout`

**Phase 2 (future — not built now):** Direct webhook integrations with Wolt, Deliveroo, Just Eat, Uber Eats via their POS partner programs. Architecture already designed — `AggregatorOrderAdapter` interface, four implementations, menu mapping system, status feedback callbacks, API Gateway webhook endpoints. Requires 2–6 month certification process per aggregator.

**Backend:** commerce-service Order entity + OrderService + new aggregator-adapter module (stubbed for Phase 2)  
**Frontend:** POSSystem source selector, KitchenDisplayPage badges, OrderManagementPage filter, new AggregatorHubPage, new PlatformPnLPage  
**Mobile:** MaSoVaCrewApp KitchenQueueScreen source badge, QuickOrderScreen read-only aggregator orders  
**Database:** MongoDB orders gains orderSource + aggregator fields + new index. PostgreSQL V15 aggregator columns on orders_jpa. V16 aggregator_connections table  
**RabbitMQ:** New AggregatorOrderReceivedEvent on masova.orders.exchange. Intelligence-service subscribes for P&L. Notification service subscribes for unmapped item alerts

---

### Phase Global-7: Agentic AI — The Manager That Never Sleeps
**Vision:** Replace the cognitive load of being a manager. The human becomes an approver, not an analyst.

**Architecture: Three layers**
```
Manager Interface (chat + proposal cards)
         ↓
Orchestrator Agent (perceives, delegates, decides, executes)
         ↓
7 Specialist Agents (domain experts, return findings only)
```

**Orchestrator Agent**
- Runs every 5 minutes per active store via APScheduler
- Each store has its own orchestrator instance with its own `StoreMemory`
- Cycle: Perceive → Reason → Delegate → Aggregate → Decide → Execute → Observe → loop
- `StoreMemory` in Redis (30-day TTL, daily MongoDB snapshot): baseline metrics, supplier patterns, manager approval history, action outcomes, platform P&L trends
- Large tool set: perception tools (read-only), action tools (write, gated by risk), memory tools, delegation tools

**Risk classification — every action classified before execution:**
| Action | Risk level | Approval |
|---|---|---|
| Send restock reminder | AUTO | None |
| Post positive review response | AUTO | None |
| Create PO < €200 (pre-approved supplier) | AUTO | None |
| Pause menu item | PROPOSE | Manager tap |
| Price increase > 5% | PROPOSE | Manager tap |
| Create PO > €200 | PROPOSE | Manager tap |
| Adjust staff shift | DISCUSS | Conversation |
| Modify fiscal config | BLOCKED | Never |
| Delete any data | BLOCKED | Never |

**7 Specialist Agents** — rebuilt as proper LlmAgent instances, invoked by orchestrator not independently scheduled. Each returns structured `SpecialistFinding`: domain, severity (LOW/MEDIUM/HIGH/CRITICAL), finding text, recommended_action, action_params, confidence, auto_executable flag.

**ProposalService** — creates `ManagerProposal` documents: title, reasoning, proposed actions, alternative actions, confidence, expiry (24 hours). Published to `masova.agents.exchange` → push notification to manager.

**ConversationalManagerAgent** — persistent chat with full StoreMemory access. Manager asks free-form questions, gets answers backed by real store data. Can approve proposals inline in chat. Agent shows tool call reasoning ("how I know this").

**Example conversation:**
> Manager: "Why is food cost up this week?"  
> Agent: [calls get_sales_summary, get_waste_log, get_inventory_snapshot]  
> Agent: "Chicken breast yield dropped from 78% to 61% — three waste logs this Tuesday prep. Also Wolt orders for Tikka Masala spiked 40% but no PO adjustment. I've drafted a PO for 25kg — want me to send it?"  
> Manager: "Yes"  
> Agent: [calls create_purchase_order]  
> Agent: "Done. PO-2026-0847 sent to Fresh Farms. Delivery Thursday."

**New internal endpoints** (not via gateway, authenticated via X-Agent-API-Key):
- commerce-service: pause/resume menu item, adjust price
- logistics-service: create purchase order, send supplier message
- core-service: adjust shift, create campaign
- intelligence-service: refresh benchmarks

**New AgentControlCenterPage in manager dashboard:**
- Live feed: everything orchestrator did in last 24 hours with 30-minute undo window for AUTO actions
- Proposal cards: approve/reject/discuss buttons, confidence score, full reasoning expandable
- Conversational chat panel: full side panel, not a popup widget
- Per-agent status: last run, last severity, memory size, action counts

**MaSoVaCrewApp manager role:** Proposal notification badge, mobile proposal cards, chat as bottom sheet.

**Customer support agent upgrade:** Gemini 2.0 Flash, aware of aggregator orders, responds in customer's browser language, failed escalations create support ticket visible in AgentControlCenterPage.

**Safety constraints (non-negotiable):**
1. Agents never touch fiscal configuration
2. Agents never delete data — pause not delete, adjust not remove
3. Agents never contact customers directly — goes through CustomerNotificationService
4. Every AUTO action has 30-minute undo window in Redis
5. If Gemini fails — agents go silent, no fallback write actions
6. Manager can pause all agents with single API call, effective within 5 minutes
7. Unactioned proposals expire in 24 hours — never auto-execute expired proposals

**Backend:** masova-support complete architectural overhaul. New internal endpoints across 4 services.  
**Frontend:** New AgentControlCenterPage, AIAgentsSection updated, proposal cards system-wide  
**Mobile:** MaSoVaCrewApp manager role updated, masova-mobile support agent upgrade  
**Database:** MongoDB — new manager_proposals collection, new agent_action_log collection (append-only, never deleted), new store_memory_snapshots collection. Redis — store_memory:{storeId} long-TTL keys  
**RabbitMQ:** New exchange `masova.agents.exchange` with routing keys: agent.proposal.created, agent.proposal.approved, agent.proposal.rejected, agent.action.completed, agent.alert.critical

---

### Phase Global-8: Payroll
**Vision:** Staff work, system calculates, manager approves, money arrives in bank accounts. Manager never touches a spreadsheet.

**Industry standard:** Manager-approved with optional auto-run after 48 hours of no response (Square/Toast pattern). Agent prepares, human approves.

**Integration:** Deel API — covers all 12 target countries, handles tax deduction per country, bank transfers, legally compliant payslips

**What MaSoVa provides to Deel:**
- Employee details (name, country, bank account/IBAN, tax ID)
- Hours worked (from WorkingSession clock-in/clock-out data)
- Gross pay = base rate × hours + overtime + pooled tips + direct tips
- Pay period (monthly DE/FR/IT/LU/HU/IE/CH, weekly or monthly UK, bi-weekly US/CA)

**What Deel returns to MaSoVa:**
- Net pay amount after all deductions
- Payslip PDF (legally compliant per country)
- Transaction ID and bank transfer confirmation

**Payroll flow:**
1. Orchestrator agent (EU-7) calculates gross pay at period end
2. Creates payroll proposal with full breakdown per employee
3. Manager reviews in PayrollReviewPage — sees gross, deductions, net per person
4. Manager approves → sent to Deel API → Deel transfers + files taxes
5. EarningsService updated with net paid + payslip stored
6. If no approval in 48 hours and auto-run enabled → executes automatically

**Tip pooling rules** — configurable per store:
- By hours worked (Germany default)
- Direct to server (UK default)
- Equal split among shift staff
- Custom % split by role

**Staff self-onboarding:**
- Manager sends invite link to new employee
- Employee enters: bank details/IBAN, tax ID, emergency contact, preferred language
- Manager approves — staff member activated

**What requires new backend endpoints:**
- `POST /api/payroll/calculate` — trigger gross pay calculation for period
- `POST /api/payroll/submit` — send approved payroll to Deel
- `GET /api/payroll/history` — past payroll runs
- `GET /api/staff/{id}/payslips` — payslip history per staff member
- `POST /api/staff/onboard-invite` — send self-onboarding link

**New PayrollManagementPage in manager dashboard:**
- Pay period selector
- Per-employee breakdown: base pay, overtime, tips, gross, estimated deductions, net
- Edit corrections before approval
- Approve all / approve individual
- History of past payroll runs
- Download all payslips as ZIP

**Staff profile update (MaSoVaCrewApp):**
- Self-onboarding flow
- View own payslips
- View own hours and earnings breakdown
- Update bank details (triggers re-verification)

**Accountant export:**
- DATEV format for Germany
- MTD-compatible for UK
- Standard CSV for all others
- Option: auto-email accountant at month end

**Backend:** core-service new PayrollController + PayrollService + Deel API client. EarningsService updated.  
**Frontend:** New PayrollManagementPage, StaffManagementPage gains payroll columns  
**Mobile:** MaSoVaCrewApp staff profile — payslips, hours, self-onboarding  
**Database:** PostgreSQL V17 payroll_runs table. V18 payslips table (store PDF reference + Deel transaction ID). MongoDB staff documents gain bankDetails (encrypted) + taxId (encrypted)  
**RabbitMQ:** New PayrollApprovedEvent on masova.agents.exchange

---

### Phase Global-9: Operator Experience
**Vision:** Things that make a multi-store operator recommend MaSoVa to every other restaurant owner they know.

**9.1 — Offline Mode**
The single most-demanded feature by restaurant operators. System must work if internet is down.

- Local service worker (PWA) caches menu, current staff, and order templates
- IndexedDB queue for orders created while offline
- POS and KDS remain functional offline
- Orders sync when connectivity restored — CRDT merge to handle conflicts
- Fiscal signing queued locally, flushed on reconnect
- Stripe payments queued as offline authorisations, processed on reconnect
- Redis replaced by local SQLite for session state during outage
- Manager dashboard shows connectivity status banner
- Offline duration limit: 4 hours (fiscal law constraint in some countries)

**9.2 — 86 Button (Item Availability Toggle)**
One tap removes an item from everywhere simultaneously:
- Marks item `isAvailable = false` in MongoDB
- Propagates to all KDS screens via WebSocket immediately
- Propagates to customer app and kiosk in real time
- In Phase 2 aggregator integration: pushes unavailability to Wolt/Deliveroo menus via their APIs
- In Phase 1 (manual aggregator): shows banner reminding staff to manually update aggregator tablets
- Orchestrator agent can trigger 86 as an AUTO action when inventory reaches zero

**9.3 — Store Clone**
Multi-store operators opening a new location in the same country:
- "Clone from existing store" in StoreManagementPage
- Copies: menu, VAT configuration, allergen data, commission settings, staff roles, tip pooling rules
- Does not copy: staff members, inventory levels, fiscal device credentials (must be set fresh)
- Reduces new store setup from hours to minutes

**9.4 — Accountant Direct Integration**
- Auto-email accountant at configurable interval (monthly, quarterly)
- Email contains: VAT summary, payroll summary, P&L report — in their preferred format
- DATEV export for Germany
- MTD-compatible JSON for UK HMRC
- Standard CSV for all others
- Xero and QuickBooks webhook push (future)

**9.5 — 24/7 Operator Support**
- ConversationalManagerAgent handles operational questions at any hour
- Escalation to human support creates a ticket (business hours)
- Critical alerts (TSE offline, NTCA submission failed, payroll error) send SMS + push + email simultaneously
- Status page (public) showing system health per region

**9.6 — Executive Mobile View**
For restaurant group owners managing 10+ stores:
- Native mobile dashboard (MaSoVaCrewApp manager role enhanced)
- Single screen: all stores traffic light status
- Revenue today vs yesterday vs same day last week
- Active alerts requiring approval
- One-tap approve pending proposals from any store

**Backend:** Various services — offline sync engine is the largest new component  
**Frontend:** PWA service worker, offline queue, 86 button everywhere item availability shown  
**Mobile:** MaSoVaCrewApp manager role — executive multi-store view  
**Database:** IndexedDB (browser) for offline queue. SQLite (local) for offline session state  
**RabbitMQ:** No new events — existing events gain replay-on-reconnect handling

---

## Full Phase Summary

| Phase | Name | Core value | Key dependency |
|---|---|---|---|
| Global-1 | Allergen Law | Legal compliance | None — do first |
| Global-2 | EU VAT Engine | Financial foundation | None — do second |
| Global-3 | Currency / Locale / i18n | Correct money display | Global-2 |
| Global-4 | Stripe + SCA/PSD2 | EU payments | Global-2 + Global-3 |
| Global-5 | Fiscal Signing | Legal receipt compliance | Global-2 + Global-4 |
| Global-6 | Aggregator Hub | New revenue channels | Global-2 |
| Global-7 | Agentic AI | Replace manager workload | Global-6 for full data |
| Global-8 | Payroll | Staff salary disbursement | Global-3 (currency) |
| Global-9 | Operator Experience | Retention + referrals | All phases |

---

## What the Operator Expects (Customer POV)

### Day 1 — Onboarding
Guided store setup wizard. Select country, enter VAT number, enter device IP if needed. System configures everything else. Bulk store import via CSV for chains. Clone configuration from existing same-country store.

### Day 2 — First service
Staff tap PIN or NFC to clock in. KDS shows unified queue from all sources. Allergen badges visible without tapping. Sub-second response. System works if internet drops.

### End of first week — Dashboard
47 stores at a glance. Revenue by store, country, day. Food cost %. Labor %. Platform P&L showing commission paid and net margin. Numbers in correct currency per country. Traffic light status per store — green/amber/red.

### End of first month — Payroll
System knows exact hours, overtime, tips per staff member. Agent prepares payroll summary. Manager reviews, approves. Money in staff accounts in 2 business days. Legally compliant payslip per employee. Zero spreadsheets.

### Three months in — AI agent
Agent knows the specific restaurant. Not generic advice — "Store 12 Rotterdam underperforming vs other NL stores specifically Thursday evenings — here is why, here is what I would do." Manager asks free-form questions, gets answers from real data. Approves actions with one tap. Agent handles supplier communications.

### Six months in — Compliance
Never thought about fiscal compliance once since setup. TSE signs silently. NF525 chain intact. UK MTD quarterly submission prepared automatically — manager taps approve. Hungary NTCA real-time without awareness. Year-end: click export, download ZIP, send to accountant.

### Reasons to cancel
1. System down during service — twice unforgivable
2. Payroll error — wrong amount, wrong account, late
3. Fiscal compliance failure triggering tax authority inquiry
4. AI agent takes costly action without knowledge
5. No support at 8pm Friday

---

## What Is Not In Scope (Explicitly Excluded)

- Table reservations / waitlist system
- Direct aggregator webhook integration (Phase 1 is manual entry only)
- Stripe Terminal card-present hardware for POS (cashier uses cash/manual for now)
- Xero / QuickBooks direct API push (export only for now)
- Additional countries beyond the 12 named above
- Self-order kiosk hardware (software exists, hardware integration excluded)
- Franchise management / royalty tracking
- Multi-currency conversion (cross-store reports show per-currency subtotals, never convert)

---

## Recommended Build Order

```
Global-1 (Allergen) ──────────────────────────────► done
Global-2 (VAT) ───────────────────────────────────► done
Global-3 (Currency) ──── depends on 2 ────────────► done
Global-4 (Payments) ──── depends on 2+3 ──────────► done
Global-5 (Fiscal) ─────── depends on 2+4 ─────────► done
Global-6 (Aggregators) ── depends on 2 ───────────► done (parallel with 3-5)
Global-7 (Agentic AI) ─── depends on 6 for data ──► done (parallel with 5)
Global-8 (Payroll) ──────── depends on 3 ─────────► done (parallel with 5-7)
Global-9 (Operator UX) ── depends on all ─────────► last
```

---

## Test Debt — Current State and Resolution Strategy

### Honest current state

The project has complete test infrastructure — JUnit 5, Mockito, Testcontainers, Vitest, React Testing Library, Pact, Playwright, and Maestro are all configured and wired into the build. Test builder classes exist (`OrderTestDataBuilder`, `MenuTestDataBuilder`, `PaymentTestDataBuilder`, `DeliveryTestDataBuilder`). `BaseServiceTest` and `BaseIntegrationTest` base classes exist.

However, actual test coverage across the codebase is near zero. The test runner passes because there is almost nothing to fail. The infrastructure is there. The safety net is not.

This is not unusual for a project that moved fast through 8 phases of feature development. It is a known liability that must be addressed systematically.

---

### Chosen strategy: Test-as-you-touch (Option B with a safety floor)

**The rule:**

> Every time a Global phase implementation touches an existing class, that class gets fully tested as part of that phase's work. New code written in any phase gets tests written alongside it — never after. A pull request that touches a class without adding or updating its tests will not be merged.

**Why not retrofit everything first:**
Writing tests for `TaxConfiguration` right before Global-2 replaces it entirely is wasted effort. Writing tests for `OrderController` before Global-2 modifies it means rewriting those tests immediately. Retrofitting all existing tests before starting any phase delays real progress by weeks and tests code that is about to change.

**Why not skip retrofitting entirely:**
Building 9 phases on a foundation with hidden bugs is reckless. The safety floor exists to catch the most dangerous existing bugs before new code depends on them.

---

### The safety floor — existing tests required before each phase starts

These are not optional. A phase cannot begin until the safety floor tests for that phase are written and passing.

| Phase | Safety floor — write these existing tests first |
|---|---|
| **Global-1** | `MenuService` — existing CRUD methods · `MenuItem` entity validation · `MenuController` happy path + validation errors |
| **Global-2** | `OrderService.createOrder()` full path · `TaxConfiguration` — document current behaviour before replacing it · `Store` entity validation · `OrderRepository` core queries |
| **Global-3** | All frontend components that render `₹` or `deliveryFeeINR` — snapshot tests capturing current output · `cartSlice` Redux state — all reducers and selectors |
| **Global-4** | `PaymentController` happy path + error responses · `PaymentService` existing Razorpay flow · `WebhookController` signature verification |
| **Global-5** | `OrderService` terminal status transitions (COMPLETED, SERVED, DELIVERED, CANCELLED) · `OrderController` status change endpoint · `OrderJpaEntity` dual-write correctness |
| **Global-6** | `OrderService.createOrder()` complete path with all order types · `OrderRepository` store + status queries · `OrderWebSocketController` broadcast methods |
| **Global-7** | All 7 existing agent Python files — input/output contract tests · `AnalyticsService` — verify current queries return expected shapes · `CostAnalysisService` — document the hardcoded ratio behaviour before replacing it |
| **Global-8** | `EarningsService` all methods · `ShiftController` clock-in/clock-out endpoints · `WorkingSession` entity · `TipController` + `StaffTipController` |
| **Global-9** | `OrderWebSocketController` all broadcast channels · `OrderRepository` most-used queries · `InventoryService` depletion logic |

---

### The test-as-you-touch rule in practice

When implementing any Global phase, the developer follows this sequence for every class touched:

```
1. Read the existing class
2. Write tests that document its current behaviour (these become regression tests)
3. Make the changes required by the phase
4. Add tests for the new behaviour
5. Verify all tests — old and new — pass
6. Submit for review — reviewer checks both implementation and test completeness
```

If a class is being deleted or fully replaced (e.g. `TaxConfiguration` → `EuVatEngine`), step 2 still applies — write tests that document what the old class did so you have a reference for what the new class must reproduce or intentionally change.

---

### Classes at highest risk if untested

These are the classes most likely to contain silent bugs that would surface in production. They are listed in order of risk.

**Critical — must be covered by safety floor before any phase that touches them:**

`OrderService` — 800+ lines, most complex class in the system. Touches every other service. State machine transitions, inventory deduction, event publishing, OTP generation, driver assignment. Any bug here affects every order in production.

`PaymentService` + `PaymentController` — money movement. A silent bug here means wrong amounts charged, double charges, or failed payments with no recovery path.

`GdprDataRequestService` — legal requirement. Erasure that silently fails, or that deletes fiscal records it should preserve, is a regulatory violation.

`AuthService` + JWT handling in `shared-security` — security foundation. An untested auth bypass is a critical vulnerability.

`OrderEventPublisher` — fire-and-forget with a catch/log. Tests needed to verify the catch path does not silently drop events that are required for downstream consistency.

`InventoryService` — stock depletion is called on every order. Silent incorrect depletion corrupts inventory data that the agentic AI will reason against.

`EarningsService` — staff pay calculations. Wrong earnings data flows directly into payroll. Must be correct before Global-8.

**High risk — cover during the phase that first touches them:**

`OrderRepository` core queries — wrong queries return wrong data to analytics, KDS, and manager dashboard simultaneously.

`cartSlice` Redux — delivery fee, tax display, order total. Wrong totals shown to customers before payment.

`TaxConfiguration` — being replaced in Global-2, but document its current behaviour first so the new engine reproduces it correctly for India stores.

`CustomerService` — loyalty point calculations, allergen preferences, GDPR export.

`WasteAnalysisService` — feeds the agentic AI's kitchen coach agent. Wrong waste data produces wrong recommendations.

---

### What good looks like at the end

When all 9 Global phases are complete, the test suite should look like this:

| Metric | Target |
|---|---|
| Backend unit test count | ~800 |
| Backend integration test count | ~200 |
| Frontend unit test count (Vitest) | ~300 |
| Pact contract tests | ~30 (one per major endpoint) |
| Playwright E2E journeys | ~50 |
| Maestro mobile flows | ~20 |
| Business logic coverage | ≥ 90% line coverage |
| Critical path coverage (fiscal, VAT, payroll, auth) | 100% branch coverage |
| Known untested classes in production build | 0 |

These numbers are not aspirational — they are the exit criteria for the entire Global programme. The system is not ready for multi-country production deployment until all of them are met.

---

## Testing Strategy

### Guiding principle

A feature without tests is not complete — it is a liability. Tests are written alongside implementation, never after. Every phase is blocked from shipping until its full test slice is green. This is not a quality aspiration — it is a hard gate.

---

### Definition of Done — per phase

A phase is considered complete only when all of the following are true:

1. All unit tests pass with zero failures
2. All integration tests pass against real test-container databases
3. All Pact contract tests pass — no frontend/backend schema drift
4. All Playwright E2E journeys for that phase pass in CI
5. All mobile tests for that phase pass on both apps
6. Test coverage on new business logic classes is ≥ 90% line coverage
7. No `@Disabled`, `@Ignore`, or skipped tests without a filed issue
8. `TestDataController` seeding covers all new entities and states
9. All external dependencies are mocked — no test calls a real Stripe, Deel, or fiscal device API
10. Code review has verified test completeness alongside implementation correctness

---

### Coverage targets

| Layer | Minimum coverage |
|---|---|
| Business logic (services, engines, calculators) | 90% line coverage |
| Controllers | 80% — happy path + all error responses |
| Repositories | 70% — key queries tested via integration tests |
| Frontend components | 80% — Vitest + React Testing Library |
| Critical paths (fiscal signing, VAT calculation, payroll) | 100% — no untested branch |

---

### Test pyramid

```
         ▲
        / \
       /E2E\          Playwright (web) + Maestro (mobile)
      /─────\         ~50 journeys — one per critical user flow per country
     / Integ \
    /─────────\       Spring Boot Test + Testcontainers
   /           \      ~200 tests — full wiring, real DBs, mocked externals
  /   Unit      \
 /───────────────\    JUnit 5 + Mockito (Java) · Vitest (frontend) · pytest (Python)
                       ~800 tests — every class with logic, every edge case
```

---

### Unit tests

Every class with business logic has unit tests. Every edge case has a dedicated test method with a descriptive name. No logic tested implicitly through a higher layer.

**Global-1 — Allergen**
- `AllergenType` — exactly 14 values, names match EU 1169/2011 official list, no duplicates
- `MenuService.setAvailable()` — throws `AllergenDeclarationRequiredException` when allergens not explicitly set
- `MenuService.setAvailable()` — succeeds when allergens set to empty set (deliberately declared as none)
- `OrderService.buildKitchenTicket()` — allergen set correctly attached per order item

**Global-2 — VAT Engine**
- `EuVatEngine` — one test per country × context × category combination (full matrix, ~96 test cases)
- `EuVatEngine` — unknown country falls back to default, does not throw
- `EuVatEngine` — dine-in vs takeaway produces different rates for DE, FR, IT, BE, LU
- `NonEuVatEngine` — CH three-tier rates applied correctly
- `NonEuVatEngine` — UK `ukVatCategory: ZERO_RATED` produces 0% rate
- `NonEuVatEngine` — UK `ukVatCategory: STANDARD_RATED` produces 20% rate
- `NonEuVatEngine` — UK missing `ukVatCategory` throws `UkVatCategoryRequiredException`
- `StripeTaxEngine` — correct API request constructed, response mapped to `TaxCalculationResult`
- `StripeTaxEngine` — cached result served without calling Stripe API on second request
- `StripeTaxEngine` — cache invalidated when store address changes
- `TaxEngineRegistry` — each of 12 countries resolves to correct engine implementation

**Global-3 — Currency / Locale**
- `MoneyAmount` — addition of two amounts with same currency succeeds
- `MoneyAmount` — addition of two amounts with different currencies throws `CurrencyMismatchException`
- `MoneyAmount` — zero amount is valid
- `MoneyAmount` — negative amount throws `IllegalArgumentException`
- `CountryProfileService` — each of 12 countries maps to correct currency, locale, and language code
- `formatMoney()` (frontend) — DE locale formats 4999 EUR as "49,99 €"
- `formatMoney()` (frontend) — FR locale formats 4999 EUR as "49,99 €" (different spacing from DE)
- `formatMoney()` (frontend) — PL locale formats 4999 PLN as "49,99 zł"
- `formatMoney()` (frontend) — IN locale formats 4999 INR as "₹49.99"
- `formatDate()` (frontend) — DE locale formats ISO date as "dd.MM.yyyy"
- `formatDate()` (frontend) — FR locale formats ISO date as "dd/MM/yyyy"

**Global-4 — Payments**
- `PaymentGatewayRegistry` — EU country resolves to `StripeGateway`
- `PaymentGatewayRegistry` — IN resolves to `RazorpayGateway`
- `StripeGateway.createPaymentIntent()` — idempotency key equals orderId
- `StripeGateway.createPaymentIntent()` — `automatic_payment_methods: enabled` set on every request
- `StripeGateway.parseWebhook()` — invalid signature throws `WebhookSignatureException`
- `StripeGateway.parseWebhook()` — valid signature returns correct `WebhookEvent`
- `RazorpayGateway` — existing tests retained, no regression

**Global-5 — Fiscal Signing**
See dedicated fiscal signing test section below — highest priority.

**Global-6 — Aggregator Hub**
- `AggregatorNormaliser` — Wolt order with all fields → correctly mapped MaSoVa Order
- `AggregatorNormaliser` — Deliveroo order → correctly mapped
- `AggregatorNormaliser` — Just Eat order → correctly mapped
- `AggregatorNormaliser` — Uber Eats order → correctly mapped
- `AggregatorNormaliser` — all aggregator orders: `orderType = DELIVERY`, `paymentStatus = PAID`, `paymentMethod = AGGREGATOR_COLLECTED`
- `AggregatorNormaliser` — aggregator order skips delivery radius check
- `PlatformPnLService` — commission % applied correctly to gross revenue to produce net payout
- `PlatformPnLService` — unconfigured commission % defaults to 0, does not throw

**Global-7 — Agentic AI**
- `RiskClassificationEngine` — every defined action type returns correct risk level
- `RiskClassificationEngine` — BLOCKED actions cannot be overridden by any input
- `ProposalService` — proposal created with all required fields populated
- `ProposalService` — expiry set to exactly 24 hours from creation time
- `ProposalService` — expired proposal cannot be approved
- `ProposalService` — expired proposal status set to EXPIRED, not PENDING
- `OrchestratorAgent` — returns no write actions when Gemini client throws an exception
- `StoreMemoryService` — memory updated correctly after action outcome
- `StoreMemoryService` — memory survives Redis flush via MongoDB snapshot restore

**Global-8 — Payroll**
- `GrossPayCalculator` — base hourly rate × hours worked = correct gross
- `GrossPayCalculator` — overtime hours (>8/day in DE, >40/week in US) calculated at correct multiplier per country
- `GrossPayCalculator` — tips added correctly to gross before Deel submission
- `TipPoolingService` — by-hours pooling distributes proportionally to hours worked
- `TipPoolingService` — direct-to-server leaves tip with named server
- `TipPoolingService` — equal-split divides evenly, remainder goes to longest-serving staff member on shift
- `TipPoolingService` — custom-% respects configured percentages per role, total must equal 100%
- `PayPeriodService` — DE/FR/IT/LU/HU/IE/CH pay period is monthly
- `PayPeriodService` — UK pay period is configurable (weekly or monthly)
- `PayPeriodService` — US/CA pay period is bi-weekly
- `DeelApiClient` — correct payload shape sent for each of 12 countries
- `DeelApiClient` — failed API call throws `PayrollSubmissionException`, not swallowed

**Global-9 — Operator Experience**
- `OfflineSyncService` — order created offline is queued in IndexedDB
- `OfflineSyncService` — on reconnect, all queued orders sync in creation order
- `OfflineSyncService` — duplicate detection: same orderId not inserted twice on reconnect
- `ItemAvailabilityService` — 86 toggle sets `isAvailable = false`, WebSocket event published immediately
- `StoreCloneService` — cloned store has identical menu, VAT config, commission settings
- `StoreCloneService` — cloned store has empty inventory levels, no staff members, no device credentials

---

### Integration tests

Run with Spring Boot Test + Testcontainers (MongoDB, PostgreSQL, Redis, RabbitMQ). Real database state, real Spring context. External APIs mocked via `@MockBean` or `@Profile("dev")` mock implementations.

**Order lifecycle — one test per country**
For each of 12 countries: create store → create menu item with allergens → place order → progress through all statuses → verify at each step: VAT amount correct, fiscal signature present (or absent for passthrough), status events published to RabbitMQ, order document correct in MongoDB, financial record correct in PostgreSQL.

**Payment flow**
- Stripe PaymentIntent created → Stripe CLI webhook delivered → `PaymentCompletedEvent` published → order `paymentStatus = PAID`
- Stripe webhook with invalid signature → rejected with 400, no event published
- Razorpay flow unchanged — existing integration tests retained

**Allergen enforcement**
- `POST /api/menu-items` with `isAvailable: true` and no allergens set → 400 response with clear error
- `POST /api/menu-items` with `isAvailable: true` and `allergens: []` (empty, deliberate) → 200 success
- Order item ticket payload contains allergen set from menu item

**Aggregator order creation**
- POS creates order with `orderSource: WOLT` → stored correctly → Platform P&L query returns correct net payout
- POS creates order with `orderSource: MASOVA` → not included in aggregator commission calculations

**Payroll calculation**
- Seed 20 staff with shifts across 4 weeks → run `GrossPayCalculator` → verify each staff member's gross matches manual calculation → mock Deel client called with correct payload

**Agent orchestrator cycle**
- Seed `StoreMemory` with low inventory signal → run one orchestrator cycle → verify specialist finding generated → verify `ManagerProposal` created in MongoDB → verify `agent.proposal.created` event published to RabbitMQ

**Manager approves proposal**
- Create `ManagerProposal` with `type: PAUSE_MENU_ITEM` → POST approval → verify `pause_menu_item` internal endpoint called → verify menu item `isAvailable = false` → verify `agent.action.completed` event published

**GDPR erasure**
- Anonymize customer → verify personal fields nulled on User, Customer, Order documents → verify fiscal records (amounts, timestamps) intact — only personal identifiers removed

**Multi-currency report**
- Create stores in DE (EUR), GB (GBP), US (USD) → create orders in each → query executive dashboard → verify response contains three separate currency buckets, no combined total

---

### Contract tests (Pact)

Every new API endpoint has a consumer-driven Pact contract defined before the frontend implementation begins. No frontend code consumes an endpoint without a passing Pact test.

New contracts required across all phases:

| Endpoint | Consumer | Key assertion |
|---|---|---|
| `GET /api/stores/{id}` | Manager Dashboard | Response includes `countryCode`, `currency`, `locale`, `vatNumber` |
| `POST /api/stores` | Manager Dashboard | `countryCode` required, `currency` derived not accepted |
| `POST /api/orders` | POS, Customer App | Request accepts `orderSource`, response includes `vatBreakdown[]` |
| `GET /api/orders/{id}` | All apps | Response includes `fiscalSignature`, `aggregatorOrderId`, `orderSource` |
| `POST /api/payments/initiate` | Customer App | Response shape: `clientSecret` for EU, `razorpayOrderId` for IN |
| `GET /api/orders/{id}/receipt` | Customer App, POS | Response includes `fiscalSignature.qrCodeData`, `vatBreakdown[]` |
| `GET /api/analytics/platform-pnl` | Manager Dashboard | Response includes per-platform `grossRevenue`, `commission`, `netPayout` |
| `GET /api/payroll/calculate` | Manager Dashboard | Response includes per-employee `grossPay`, `estimatedDeductions`, `netPay` |
| `POST /api/payroll/submit` | Manager Dashboard | Request includes `payPeriod`, `employeePayments[]` |
| `GET /api/agents/proposals` | Manager Dashboard, Crew App | Response includes `title`, `reasoning`, `proposedActions[]`, `confidence`, `expiresAt` |
| `POST /api/agents/proposals/{id}/approve` | Manager Dashboard, Crew App | 200 on success, 409 if expired |
| `POST /api/aggregators/*/orders` | Aggregator webhooks | Schema validated per aggregator format |

---

### End-to-end tests (Playwright)

Full browser automation. One test file per critical user journey. Each test is independent — seeds its own data, cleans up after itself.

**Allergen journeys**
- Manager creates menu item without allergens → cannot set available → adds allergens → can set available → customer sees allergen list on item page → allergen warning shown in cart

**VAT journeys**
- German dine-in: order subtotal €20 → VAT line shows "MwSt 19%" → total €23.80
- French takeaway: order subtotal €20 → VAT line shows "TVA 5.5%" → total €21.10
- UK cold food: order subtotal £20 → VAT line shows "VAT 0%" → total £20.00
- Hungary: order subtotal HUF 5000 → VAT line shows "ÁFA 27%" → total HUF 6350

**Payment journeys**
- EU customer checkout → Stripe PaymentElement renders → test card 4242... → SCA challenge → order confirmed
- IN customer checkout → Razorpay modal renders → test payment → order confirmed
- Payment failure → clear error shown → order remains in PENDING state → retry available

**Fiscal journeys**
- DE order completed → FiscalCompliancePage shows signed receipt → receipt PDF contains QR code
- FR order completed → attempt to edit order price → blocked with explanation
- NL order completed → no QR on receipt → no fiscal section in store dashboard
- HU order completed → NTCA transaction ID visible on order detail

**Aggregator journeys**
- Cashier enters Wolt order → selects source WOLT → enters items → order appears in KDS with Wolt badge → Platform P&L shows commission deducted

**Payroll journeys**
- End of pay period → agent proposal appears → manager opens PayrollReviewPage → sees breakdown per employee → approves → confirmation shown → payslip downloadable

**Agent journeys**
- Manager opens AgentControlCenterPage → live feed shows last 24 hours → pending proposal visible → manager approves → feed updates with execution confirmation → undo button available for 30 minutes
- Manager opens chat → asks "why is food cost up?" → agent responds with specific store data → manager says "fix it" → agent proposes action → manager confirms → action executed

**Offline journey**
- POS in Chrome → DevTools → offline → create 3 orders → offline banner visible → go online → orders appear in KDS → no duplicates

**i18n journey**
- Set browser language to German → all staff-facing pages render in German → no raw translation keys visible
- Set browser language to French → same → clean
- Repeat for IT, NL, ES, PL

---

### Mobile tests (Maestro)

Maestro YAML flows for both React Native apps. Run on Android emulator in CI.

**masova-mobile**
- EU store: checkout → Stripe payment screen renders, not Razorpay
- India store: checkout → Razorpay screen renders, not Stripe
- Item detail: allergen list displayed
- Cart: allergen warning banner if item matches profile preference
- Order history: receipt shows VAT breakdown and QR code for fiscal countries
- Support chat: message sent → agent responds → escalation creates support ticket

**MaSoVaCrewApp**
- Kitchen screen: order card shows allergen badges
- Kitchen screen: Wolt order shows Wolt source badge
- Cashier screen: POS source selector present, Wolt order read-only after creation
- Manager screen: proposal notification badge visible → approve tap → confirmation
- Manager screen: executive dashboard shows traffic light per store
- Staff self-onboarding: enter bank IBAN → submit → manager receives approval request

---

### Fiscal signing tests — highest priority

These are the most critical tests in the entire system. A fiscal signing failure that is not caught in testing becomes a legal liability in production. Every signer must pass all of these before the corresponding country store type is available.

**Universal assertions — every `FiscalSigner` implementation:**
- `sign()` returns a non-null `FiscalSignature`
- `fiscalSignature.signatureValue` is non-null and non-empty
- `fiscalSignature.signedAt` is non-null
- `fiscalSignature.signedAt` is NOT set via `LocalDateTime.now()` — verified by injecting a mock clock and confirming the signing system's timestamp is used, not the application clock
- `fiscalSignature.signerSystem` matches the expected constant for that country
- `fiscalSignature.signerCountry` matches the store's `countryCode`
- Calling `sign()` twice on the same order produces two distinct `transactionId` values (idempotency is caller's responsibility)

**Per-signer:**

`TseFiscalSigner` (DE):
- Happy path: device responds → signature stored → order status unchanged
- Device offline: order status set to `PENDING_FISCAL_SIGNATURE` → queued in Redis → no exception thrown to caller
- Device comes back online: queue flushed in order → all pending orders signed → status updated → manager alert cleared
- Queue not flushed before Z-report deadline: alert sent to manager with count of unsigned receipts

`Nf525FiscalSigner` (FR):
- Happy path: signature produced → order status unchanged
- Post-signing: attempt to modify `total` field via `OrderService` → `OrderImmutableAfterSigningException` thrown
- Post-signing: attempt to modify `items` → same exception
- Post-signing: void/correction creates a new credit note `Order` → original order untouched

`RksvFiscalSigner` (AT):
- Receipt 1: baseline signature produced
- Receipt 2: `previousSignatureHash` in Receipt 2 matches `signatureValue` of Receipt 1
- Receipt 3: same chain — Receipt 3 links to Receipt 2
- Void receipt: produced as signed negative transaction, not a gap in chain
- Chain gap test: manually remove Receipt 2 from store → verify chain validation fails on Receipt 3

`RtFiscalSigner` (IT):
- Same pattern as `TseFiscalSigner` — hardware device offline/online queue behaviour

`FdmFiscalSigner` (BE):
- Same pattern as `TseFiscalSigner`

`HungaryNtcaFiscalSigner` (HU):
- Invoice > HUF 100,000: submission attempted within 500ms of order completion
- Invoice < HUF 100,000: submission queued for batch within 4 days
- First submission fails (mock 500): retry after exponential backoff
- Three consecutive failures: manager alert sent
- After 4 hours unsubmitted: critical alert sent
- Valid submission: `transactionId` stored on `fiscalSignature`
- XML invoice format: validated against NTCA schema (XSD validation in test)

`UkMtdFiscalSigner` (GB):
- Order completed: entry written to `uk_vat_ledger` with correct `taxPeriod` (e.g. "2026-Q2")
- Quarterly submission: all ledger entries for period aggregated into correct MTD JSON format
- MTD JSON validated against HMRC's published schema
- Submission marked `submitted_to_hmrc = true` after successful HMRC sandbox call
- Already-submitted period cannot be re-submitted

`PassthroughFiscalSigner` (NL, LU, IE, US, CA):
- `isRequired()` returns false
- `sign()` returns a `FiscalSignature` with `signerSystem = PASSTHROUGH`
- Receipt PDF for these countries contains no QR code field
- No fiscal compliance section rendered in manager dashboard for these countries

**Receipt PDF assertions:**
- DE/AT/IT/BE: receipt PDF contains a scannable QR code image
- QR code content matches `fiscalSignature.qrCodeData`
- QR code is scannable (verified using ZXing decoder in test)
- NL/LU/IE/US/CA: receipt PDF contains no QR code

---

### Performance tests

Run in a dedicated performance environment. Not part of CI pipeline — run before each major release.

| Test | Tool | Target | Acceptable threshold |
|---|---|---|---|
| 50 concurrent orchestrator cycles | k6 | Complete within 5-minute heartbeat | p95 < 4 minutes |
| 200 concurrent WebSocket connections | k6 | Order update delivered to all | p95 < 500ms |
| Fiscal signing — software (FR/AT) | JMH | Sign one receipt | p99 < 500ms |
| Fiscal signing — hardware (DE/IT/BE) | JMH | Sign one receipt | p99 < 2000ms |
| Stripe Tax API cache hit | JMH | Cached response | p99 < 10ms |
| Stripe Tax API cache miss | k6 | Uncached Stripe call + cache write | p95 < 1000ms |
| Platform P&L query — 90 days | JMeter | 4 platforms, 90 days, 1 store | p95 < 3 seconds |
| Platform P&L query — 90 days, 50 stores | JMeter | Same query, 50 stores | p95 < 10 seconds |
| PostgreSQL fiscal_signatures — 10M rows | pgbench | Range query by country + date | p95 < 500ms |

---

### Mock strategy for external dependencies

Every external system that cannot be used in automated testing has a mock implementation. All mocks are in `src/test/java` or behind `@Profile("dev")`. No mock code is compiled into production builds.

| External system | Mock | Behaviour in tests |
|---|---|---|
| TSE device (DE) | `MockTseFiscalSigner` | Returns structurally valid `FiscalSignature` with deterministic fake `transactionId`. Configurable offline mode for queue tests. |
| RT device (IT) | `MockRtFiscalSigner` | Same pattern |
| FDM device (BE) | `MockFdmFiscalSigner` | Same pattern |
| Hungary NTCA API | `MockNtcaClient` | Returns fake `transactionId`. Configurable to return 401/500 for error path tests. Configurable delay for timing tests. |
| UK HMRC MTD API | HMRC developer sandbox | Register at `developer.service.hmrc.gov.uk` — takes 1–2 weeks. Use sandbox for integration + E2E tests. |
| Stripe payments | Stripe CLI (`stripe listen --forward-to localhost:8089/...`) | Forwards real Stripe test-mode webhooks to localhost. Use test cards from Stripe docs including SCA challenge cards. |
| Stripe Tax | `MockStripeTaxClient` | Returns configurable per-test tax amounts. Verifies correct request shape. |
| Deel payroll API | `MockDeelClient` | Returns fake payslip PDF URL and `transactionId`. Captures submitted payload for assertion. |
| Gemini LLM | `MockGeminiClient` | Returns scripted deterministic responses. Configurable to throw errors for silence tests. |
| Wolt webhook | JSON fixture `wolt-order-sample.json` | Hardcoded realistic Wolt webhook payload |
| Deliveroo webhook | JSON fixture `deliveroo-order-sample.json` | Same |
| Just Eat webhook | JSON fixture `justeat-order-sample.json` | Same |
| Uber Eats webhook | JSON fixture `ubereats-order-sample.json` | Same |

---

### Test data seeding

`TestDataController` (already exists, `@Profile("dev")` only) must be extended with the following seed endpoints:

`POST /test/seed/global` — seeds complete global dataset:
- 12 stores — one per country — with complete country configuration
- 1 menu per store — 20 items each, all 14 allergens represented across items, full allergen declaration on every item
- 30 days of synthetic order history per store — realistic hourly distribution (lunch/dinner peaks)
- 8 staff members per store — with hours worked across 4 weeks, mix of roles, fake IBANs, fake tax IDs
- Aggregator commission % configured: Wolt 28%, Deliveroo 32%, Just Eat 14%, Uber Eats 30%
- 10 aggregator orders per store (manually entered, `orderSource` set)
- `StoreMemory` pre-seeded per store with realistic baselines
- 3 pending `ManagerProposal` documents per store — one AUTO-eligible, one PROPOSE, one DISCUSS
- 1 `RECEIPT_SIGNING_FAILED` order per fiscal country (DE, FR, IT, BE, HU, AT)
- 1 `AGGREGATOR_ITEM_UNMAPPED` order per store
- 1 completed pay period with gross pay calculated, ready for Deel submission

`DELETE /test/seed/global` — tears down all seeded data cleanly

---

### Smoke testing sequence

After full implementation of all 9 phases, execute in this exact order. Each step must be fully green before proceeding to the next.

```
Step 1   Unit tests                  mvn test (all services)                         All green
Step 2   Integration tests           mvn verify (Testcontainers)                     All green
Step 3   Contract tests              npm run test:pact                               All green
Step 4   Seed test data              POST /test/seed/global                          200 OK
Step 5   i18n audit                  Run UI in DE, FR, IT, NL, ES, PL, EN           Zero raw keys visible on any screen
Step 6   Per-country order smoke     One full order lifecycle per country             12/12 countries pass
Step 7   Fiscal signing smoke        Verify QR present for DE/FR/IT/BE/HU/AT         6/6 fiscal countries signed
                                     Verify no QR for NL/LU/IE/US/CA/CH              5/5 passthrough countries clean
Step 8   Multi-store smoke           3 countries simultaneously                      No currency mixing in any report
Step 9   Aggregator smoke            Enter Wolt order via POS                        Commission deducted in P&L
Step 10  Payroll smoke               Complete pay period, approve                    Mock Deel called with correct payload
Step 11  Agent smoke                 Orchestrator cycle → proposal → approve → undo  All steps verified
Step 12  Offline smoke               Kill network → 3 orders → restore → verify      All 3 synced, zero duplicates
Step 13  Cross-currency smoke        EUR + GBP + USD stores in executive view        Never added together
Step 14  Performance tests           k6 + JMeter suite                               All targets met
Step 15  Playwright E2E suite        npm run test:e2e                                All journeys green
Step 16  Mobile test suite           Maestro on Android emulator                     All flows green
```

No phase ships to production until its slice of this sequence is green with zero exceptions, zero skipped tests, and zero known failures with open issues.

---

*Each phase gets its own brainstorm → spec → implementation plan cycle.*  
*This document is the master brief — the entry point for all 9 phase specs.*
