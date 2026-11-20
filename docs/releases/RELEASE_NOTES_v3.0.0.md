# MaSoVa 3.0 — The European Restaurant Operating System

**Release date:** 2026-09-17
**Previous release:** [v2.1.0](https://github.com/SVamseekar/masova-platform/releases/tag/v2.1.0) — December 2025

---

## Executive Summary

Nine months ago, MaSoVa was a 12-microservice prototype proving out core order-to-kitchen mechanics for a single market. Today, it is a production-grade restaurant operating system built for multi-store European restaurant groups — spanning tax and fiscal compliance in seven jurisdictions, native integration with the continent's four largest delivery marketplaces, a Toast-class point of sale and kitchen display system, and a dark-luxury guest ordering experience.

This release consolidates that transformation into a single, coherent platform: six core microservices, a dual-database architecture built for both throughput and financial integrity, and an event-driven backbone connecting every order from the moment it's placed to the moment it's served or handed to a courier.

MaSoVa 3.0 is the foundation for operating a restaurant brand across borders — one platform, any country, any channel.

---

## Release By The Numbers

| Metric | Value |
|---|---|
| Commits merged since v2.1.0 | 680 |
| Files changed | 4,574 |
| Core microservices (consolidated from 12) | 6 |
| European fiscal jurisdictions supported | 7 |
| Delivery aggregators natively integrated | 4 (Wolt, Deliveroo, Just Eat, Uber Eats) |
| EU allergens tracked and filtered | 14 |
| Canonical REST endpoints | 207 |
| Database engines | 2 (MongoDB + PostgreSQL, Flyway V1–V8) |

---

## Deep-Dive Feature Pillars

### Pillar 1: European Regulatory & Financial Engine

**14-Allergen Safety**
Mandatory EU food safety labeling on every menu item, with an ingredient-level audit trail and customer-facing allergen exclusion filters on the ordering menu — so diners with dietary restrictions can browse with confidence.

**Intelligent EU VAT Matrix**
Real-time tax calculation that factors in per-country VAT rates, reduced food brackets, and the dine-in vs. takeaway/delivery rate differential many EU jurisdictions require — applied automatically at the order line level, no manual tax entry.

**Certified Fiscal Signing (7 Countries)**
Tamper-proof, cryptographically signed audit logs compliant with:
- Germany — TSE (KassenSichV)
- Austria — RKSV
- France — NF525
- Spain — TicketBAI
- Italy — RT
- Poland
- Portugal

Every terminal order status transition is signed and published as a verifiable receipt event, giving operators an audit trail that satisfies local tax authority requirements without manual bookkeeping.

**Multi-Currency Engine**
Dynamic currency resolution and locale-aware formatting for EUR (€), GBP (£), HUF (Ft), and other regional currencies, driven directly by each store's country configuration — no hardcoded currency symbols anywhere in the product.

### Pillar 2: Omnichannel Delivery Aggregator Hub

Direct two-way order injection and webhook synchronization for **Wolt, Deliveroo, Just Eat, and Uber Eats** — orders placed on any of these marketplaces flow straight into the same kitchen routing and POS boards used for in-house orders, eliminating aggregator tablet clutter at the counter. Menu availability and store status are reported back to each partner in real time, keeping listings accurate without duplicate manual updates.

### Pillar 3: Toast-Class POS & Live-Shift Kitchen Display System

**High-Speed Cashier POS (`/pos`)**
A touch-optimized counter terminal built for speed: fast modifier flows, split billing, table assignment, and cover counts — designed for high-volume front-of-house use.

**Live-Shift KDS (`/kitchen`)**
Station routing (grill, fryer, bar, packaging), color-coded order urgency countdowns, sound alerts on new tickets, and a dedicated `SERVED` state for dine-in tables — giving kitchen staff a real-time, full-screen view of every ticket in flight.

**Digital Tip Collection**
Gratuity collection at checkout with per-staff attribution and shift-level payout reporting, feeding directly into staff earnings.

### Pillar 4: Operations, Governance & Business Intelligence

**Truthful Real-Time Analytics**
A MongoDB aggregation pipeline delivers verified KPIs — gross/net revenue, average order value, peak order windows, and best-selling items — replacing estimated or client-computed figures with numbers sourced directly from order data.

**Manager Authorization Safeguards**
Role-gated approval is now required for high-risk operations: refunds, order cancellations, and agent-raised customer disputes all route through a manager sign-off step before taking effect.

**Smart Driver Dispatch**
An interactive driver dispatch modal replaces manual assignment, enforcing delivery radius boundaries so orders outside a store's serviceable zone are caught before dispatch.

**Quick PIN Authentication**
Rapid staff switching for shared front-of-house terminals, with double-submit locking to prevent duplicate PIN submissions on unreliable connections.

### Pillar 5: Consumer Dining & Guest Experience

**Dark-Luxury Web App (`/order`)**
A modern European restaurant aesthetic — high-resolution food photography, fluid category browsing, and a dark-premium visual language across every customer-facing screen.

**Frictionless Guest Checkout**
Instant ordering without account creation, alongside Google Sign-In and Google Places address autocomplete for returning customers who want a saved profile.

**Real-Time Order Tracking**
A visual status tracker following an order from kitchen prep through to courier handoff.

**AI Dining Concierge**
An integrated customer assistant for menu suggestions, dietary inquiries, and live order status — available directly in the ordering app.

### Pillar 6: Commercial B2B Showcase & Privacy

A dedicated marketing portal (`/`) featuring live interactive AI agent previews and transparent pricing tiers for prospective restaurant group customers, backed by a GDPR-compliant cookie consent banner and production Google Analytics 4 telemetry that only activates post-consent.

---

## Architectural & Infrastructure Foundation

- **12-to-6 microservice consolidation** on Spring Boot 3.5 and Spring Cloud 2025 — api-gateway, core-service, commerce-service, payment-service, logistics-service, intelligence-service.
- **Dual-write architecture**: MongoDB for high-throughput transactional catalog and order data, PostgreSQL for financial and fiscal records requiring relational integrity (Flyway migrations V1–V8).
- **Event-driven backbone**: RabbitMQ exchanges (`masova.orders.exchange`, `masova.notifications.exchange`) decouple cross-service business events from synchronous HTTP calls.
- **Redis JWT blacklist**: token revocation on logout, checked on every authenticated request.
- **Testcontainers integration suite** and multi-stage Docker builds (dependency-cached, non-root runtime, health-checked) across all 6 services.

---

## Breaking Changes & Upgrade Guide

- **Port mappings and gateway routes updated** — services now route exclusively through api-gateway (`:8080`); direct per-service ports remain available for internal/test use only.
- **Flyway database migrations required** — PostgreSQL schemas must be brought up to V8 before deploying this release; run `mvn flyway:migrate` per service or allow Spring Boot's auto-migration on startup.
- **New required environment variables**:
  - Stripe: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
  - Fiscal signing providers: per-country signer credentials (see `payment-service` configuration)
  - Delivery aggregators: Wolt, Deliveroo, Just Eat, and Uber Eats API credentials

---

*For the condensed version of these notes, see `CHANGELOG.md`.*
