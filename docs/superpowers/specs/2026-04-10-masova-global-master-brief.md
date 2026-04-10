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

*Each phase gets its own brainstorm → spec → implementation plan cycle.*  
*This document is the master brief — the entry point for all 9 phase specs.*
