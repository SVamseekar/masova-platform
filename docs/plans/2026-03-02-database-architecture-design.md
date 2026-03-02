# Database Architecture Design: MongoDB → Polyglot
**Date:** 2026-03-02
**Author:** Senior DBA / Architecture Review
**Status:** Approved — implement after API reduction
**Current:** 28 MongoDB collections, single database
**Target:** PostgreSQL + MongoDB + Redis (polyglot persistence)

---

## Executive Summary

MaSoVa currently uses MongoDB for everything. This is a common early-stage shortcut — one database is simple to stand up. But at production scale, this creates serious problems:

- **Financial data** (transactions, refunds) has no ACID guarantees — a crash mid-payment can leave inconsistent state with zero recourse
- **Relational data** (orders → items → payments → customers) requires complex application-level joins across MongoDB documents
- **Querying** order history, customer spend, and analytics requires loading full documents when you only need 3 fields
- **No referential integrity** — you can delete a customer who has active orders and nothing stops you

The fix is not "migrate everything to PostgreSQL." The fix is **right tool for the right job** — the same pattern used by Swiggy, Zomato, Uber Eats, and every serious food-tech company.

---

## The Three-Database Decision

### PostgreSQL — Relational, Transactional, Financial
**Rule:** Any data where consistency, referential integrity, or complex joins matter.

### MongoDB — Document, Flexible Schema, Geospatial
**Rule:** Any data where the shape varies per record, or geospatial queries are needed.

### Redis — In-Memory, Ephemeral, Fast
**Rule:** Any data that is temporary, session-based, or needs sub-millisecond access.

---

## Collection-by-Collection Decision

| Collection | Current | Move To | Reason |
|---|---|---|---|
| `users` | MongoDB | **PostgreSQL** | Relational, fixed schema, auth data needs ACID |
| `stores` | MongoDB | **MongoDB** | Flexible config: delivery zones, operating hours vary per store |
| `menu_items` | MongoDB | **MongoDB** | Variable variants, customizations, nutritional data — document-perfect |
| `shifts` | MongoDB | **PostgreSQL** | Fixed schema, time-series HR data, joins to users/stores |
| `working_sessions` | MongoDB | **PostgreSQL** | Attendance ledger, financial implications (overtime), joins to shifts |
| `gdpr_consents` | MongoDB | **PostgreSQL** | Compliance records, must be ACID, immutable audit trail |
| `gdpr_data_requests` | MongoDB | **PostgreSQL** | Workflow with deadlines, must be consistent |
| `gdpr_audit_logs` | MongoDB | **PostgreSQL** | Immutable audit log, needs JOIN to users |
| `gdpr_data_breaches` | MongoDB | **PostgreSQL** | Compliance, fixed schema |
| `gdpr_dpa` | MongoDB | **PostgreSQL** | Contract documents, fixed schema |
| `gdpr_data_retention` | MongoDB | **PostgreSQL** | Configuration, fixed schema |
| `notifications` | MongoDB | **PostgreSQL** | Transactional records with retry state |
| `campaigns` | MongoDB | **MongoDB** | Dynamic segment filters, metadata varies |
| `templates` | MongoDB | **MongoDB** | Variable structure per channel type |
| `user_preferences` | MongoDB | **MongoDB** | Flexible per-notification-type settings map |
| `reviews` | MongoDB | **MongoDB** | Variable nested item reviews, sentiment data |
| `review_responses` | MongoDB | **PostgreSQL** | Simple relational: one response per review |
| `customers` | MongoDB | **PostgreSQL** (core) + **MongoDB** (loyalty/prefs) | Split: core identity in PG, flexible loyalty history in Mongo |
| `orders` | MongoDB | **PostgreSQL** | Financial transaction, ACID critical, complex status machine |
| `kitchen_equipment` | MongoDB | **MongoDB** | Operational state, flexible maintenance notes |
| `delivery_trackings` | MongoDB | **PostgreSQL** | Workflow state machine, joins to orders/users |
| `driver_locations` | MongoDB | **MongoDB** | Geospatial + TTL — MongoDB's native strength |
| `inventory_items` | MongoDB | **PostgreSQL** | Financial (unit cost, reserved stock), joins to suppliers |
| `purchase_orders` | MongoDB | **PostgreSQL** | Procurement workflow, financial, approval chain |
| `suppliers` | MongoDB | **PostgreSQL** | Master data, fixed schema, referenced by inventory |
| `waste_records` | MongoDB | **PostgreSQL** | Financial audit record, fixed schema |
| `transactions` | MongoDB | **PostgreSQL** | Financial ledger — ACID is non-negotiable |
| `refunds` | MongoDB | **PostgreSQL** | Financial ledger — ACID is non-negotiable |
| JWT blacklist | Redis (current) | **Redis** | Already correct |
| Driver online status | — | **Redis** | Ephemeral, sub-ms access needed |
| Session tokens | — | **Redis** | Already correct |
| Rate limiting | — | **Redis** | Already correct |

---

## PostgreSQL Schema (New)

### Database: `masova_db`

---

#### `users`
```sql
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type          VARCHAR(20) NOT NULL CHECK (type IN ('CUSTOMER','STAFF','MANAGER','DRIVER','KIOSK','ADMIN')),
  name          VARCHAR(255) NOT NULL,
  email         VARCHAR(255) UNIQUE,
  phone         VARCHAR(20) UNIQUE,
  password_hash VARCHAR(255),
  store_id      UUID REFERENCES stores(id),
  role          VARCHAR(50),
  status        VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE','SUSPENDED')),
  is_online     BOOLEAN DEFAULT FALSE,
  pin_hash      VARCHAR(255),
  pin_suffix    VARCHAR(10),
  vehicle_type  VARCHAR(50),
  license_no    VARCHAR(50),
  is_kiosk      BOOLEAN DEFAULT FALSE,
  terminal_id   VARCHAR(100),
  active_delivery_count INT DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login    TIMESTAMPTZ,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_users_type_store ON users(type, store_id);
CREATE INDEX idx_users_status ON users(status);
```

#### `user_auth_providers`
```sql
CREATE TABLE user_auth_providers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider    VARCHAR(50) NOT NULL,  -- GOOGLE, EMAIL
  provider_id VARCHAR(255) NOT NULL,
  email       VARCHAR(255),
  UNIQUE (provider, provider_id)
);
```

#### `stores`
> Stays in **MongoDB** — see MongoDB schema below.

---

#### `shifts`
```sql
CREATE TABLE shifts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id        UUID NOT NULL,  -- logical FK to MongoDB stores
  employee_id     UUID NOT NULL REFERENCES users(id),
  type            VARCHAR(30) NOT NULL CHECK (type IN ('OPENING','CLOSING','PEAK','REGULAR','MAINTENANCE','TRAINING','EMERGENCY')),
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end   TIMESTAMPTZ NOT NULL,
  actual_start    TIMESTAMPTZ,
  actual_end      TIMESTAMPTZ,
  status          VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED','CONFIRMED','IN_PROGRESS','COMPLETED','CANCELLED','NO_SHOW')),
  role_required   VARCHAR(50),
  is_mandatory    BOOLEAN DEFAULT FALSE,
  notes           TEXT,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_shifts_store_start ON shifts(store_id, scheduled_start);
CREATE INDEX idx_shifts_employee_start ON shifts(employee_id, scheduled_start);
CREATE INDEX idx_shifts_status ON shifts(status);
```

#### `working_sessions`
```sql
CREATE TABLE working_sessions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id           UUID NOT NULL REFERENCES users(id),
  store_id              UUID NOT NULL,  -- logical FK to MongoDB stores
  shift_id              UUID REFERENCES shifts(id),
  date                  DATE NOT NULL,
  login_time            TIMESTAMPTZ NOT NULL,
  logout_time           TIMESTAMPTZ,
  total_hours           DECIMAL(5,2),
  break_minutes         INT DEFAULT 0,
  status                VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','COMPLETED','PENDING_APPROVAL','APPROVED','REJECTED')),
  clock_in_lat          DECIMAL(10,7),
  clock_in_lng          DECIMAL(10,7),
  clock_out_lat         DECIMAL(10,7),
  clock_out_lng         DECIMAL(10,7),
  requires_approval     BOOLEAN DEFAULT FALSE,
  approved_by           UUID REFERENCES users(id),
  approval_time         TIMESTAMPTZ,
  is_emergency          BOOLEAN DEFAULT FALSE,
  overtime_approved     BOOLEAN DEFAULT FALSE,
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_sessions_employee_date ON working_sessions(employee_id, date DESC);
CREATE INDEX idx_sessions_store_date ON working_sessions(store_id, date DESC);
CREATE INDEX idx_sessions_status ON working_sessions(status);

CREATE TABLE session_violations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID NOT NULL REFERENCES working_sessions(id) ON DELETE CASCADE,
  violation_type VARCHAR(50) NOT NULL,
  description   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### `customers`
```sql
CREATE TABLE customers (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID UNIQUE REFERENCES users(id),
  name                 VARCHAR(255) NOT NULL,
  email                VARCHAR(255),
  phone                VARCHAR(20),
  date_of_birth        DATE,
  gender               VARCHAR(20),
  active               BOOLEAN DEFAULT TRUE,
  email_verified       BOOLEAN DEFAULT FALSE,
  phone_verified       BOOLEAN DEFAULT FALSE,
  marketing_opt_in     BOOLEAN DEFAULT FALSE,
  sms_opt_in           BOOLEAN DEFAULT FALSE,
  -- Loyalty (frequently queried, needs indexes)
  loyalty_points       INT DEFAULT 0,
  loyalty_tier         VARCHAR(20) DEFAULT 'BRONZE' CHECK (loyalty_tier IN ('BRONZE','SILVER','GOLD','PLATINUM')),
  tier_expiry          DATE,
  points_earned        INT DEFAULT 0,
  points_redeemed      INT DEFAULT 0,
  -- Order stats (denormalized for performance)
  total_orders         INT DEFAULT 0,
  completed_orders     INT DEFAULT 0,
  cancelled_orders     INT DEFAULT 0,
  total_spent          DECIMAL(12,2) DEFAULT 0,
  avg_order_value      DECIMAL(10,2) DEFAULT 0,
  last_order_date      DATE,
  first_order_date     DATE,
  -- GDPR
  deleted_at           TIMESTAMPTZ,
  deletion_reason      TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_loyalty_tier ON customers(loyalty_tier) WHERE active = TRUE;
CREATE INDEX idx_customers_user_id ON customers(user_id);

CREATE TABLE customer_addresses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id   UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  label         VARCHAR(50),  -- HOME, WORK, OTHER
  address_line1 VARCHAR(255) NOT NULL,
  address_line2 VARCHAR(255),
  city          VARCHAR(100) NOT NULL,
  state         VARCHAR(100) NOT NULL,
  postal_code   VARCHAR(20) NOT NULL,
  country       VARCHAR(50) DEFAULT 'India',
  latitude      DECIMAL(10,7),
  longitude     DECIMAL(10,7),
  landmark      VARCHAR(255),
  is_default    BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE customer_store_memberships (
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  store_id    UUID NOT NULL,  -- logical FK to MongoDB stores
  PRIMARY KEY (customer_id, store_id)
);

CREATE TABLE customer_tags (
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  tag         VARCHAR(100) NOT NULL,
  PRIMARY KEY (customer_id, tag)
);

CREATE TABLE loyalty_transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  points      INT NOT NULL,
  type        VARCHAR(20) NOT NULL CHECK (type IN ('EARNED','REDEEMED','EXPIRED','BONUS')),
  description TEXT,
  order_id    UUID,  -- logical FK to orders
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_loyalty_customer ON loyalty_transactions(customer_id, created_at DESC);
```

#### `orders`
```sql
CREATE TABLE orders (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number            VARCHAR(50) UNIQUE NOT NULL,
  customer_id             UUID REFERENCES customers(id),
  customer_name           VARCHAR(255) NOT NULL,
  customer_phone          VARCHAR(20),
  customer_email          VARCHAR(255),
  store_id                UUID NOT NULL,  -- logical FK to MongoDB stores
  status                  VARCHAR(30) NOT NULL DEFAULT 'RECEIVED',
  order_type              VARCHAR(20) NOT NULL CHECK (order_type IN ('DINE_IN','TAKEAWAY','DELIVERY')),
  payment_status          VARCHAR(30) NOT NULL DEFAULT 'PENDING',
  payment_method          VARCHAR(30),
  payment_transaction_id  UUID REFERENCES transactions(id),
  subtotal                DECIMAL(10,2) NOT NULL,
  delivery_fee            DECIMAL(10,2) DEFAULT 0,
  tax                     DECIMAL(10,2) DEFAULT 0,
  total                   DECIMAL(10,2) NOT NULL,
  priority                VARCHAR(20) DEFAULT 'NORMAL',
  estimated_prep_minutes  INT,
  actual_prep_minutes     INT,
  special_instructions    TEXT,
  -- Delivery fields
  delivery_street         VARCHAR(255),
  delivery_city           VARCHAR(100),
  delivery_state          VARCHAR(100),
  delivery_zip            VARCHAR(20),
  delivery_lat            DECIMAL(10,7),
  delivery_lng            DECIMAL(10,7),
  assigned_driver_id      UUID REFERENCES users(id),
  -- OTP / proof
  delivery_otp            VARCHAR(10),
  delivery_otp_expires_at TIMESTAMPTZ,
  delivery_proof_type     VARCHAR(30),
  delivery_photo_url      TEXT,
  delivery_signature_url  TEXT,
  contactless_delivery    BOOLEAN DEFAULT FALSE,
  -- Kitchen assignment
  make_table_station      VARCHAR(50),
  kitchen_staff_id        UUID REFERENCES users(id),
  assigned_to_kitchen_at  TIMESTAMPTZ,
  -- Staff
  created_by_staff_id     UUID REFERENCES users(id),
  -- Timestamps for each stage
  received_at             TIMESTAMPTZ,
  preparing_started_at    TIMESTAMPTZ,
  ready_at                TIMESTAMPTZ,
  dispatched_at           TIMESTAMPTZ,
  delivered_at            TIMESTAMPTZ,
  completed_at            TIMESTAMPTZ,
  cancelled_at            TIMESTAMPTZ,
  cancellation_reason     TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_orders_store_status ON orders(store_id, status);
CREATE INDEX idx_orders_store_created ON orders(store_id, created_at DESC);
CREATE INDEX idx_orders_customer ON orders(customer_id, created_at DESC);
CREATE INDEX idx_orders_driver_status ON orders(assigned_driver_id, status);
CREATE INDEX idx_orders_status ON orders(status);

CREATE TABLE order_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id    VARCHAR(24) NOT NULL,  -- MongoDB ObjectId reference
  name            VARCHAR(255) NOT NULL,
  quantity        INT NOT NULL,
  unit_price      DECIMAL(10,2) NOT NULL,
  total_price     DECIMAL(10,2) NOT NULL,
  variant         VARCHAR(100),
  customizations  TEXT  -- JSON string for flexibility
);

CREATE TABLE order_quality_checkpoints (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  checkpoint_name VARCHAR(100) NOT NULL,
  type            VARCHAR(50) NOT NULL,
  status          VARCHAR(30) NOT NULL DEFAULT 'PENDING',
  checked_by      UUID REFERENCES users(id),
  checked_at      TIMESTAMPTZ,
  notes           TEXT
);
```

#### `transactions`
```sql
CREATE TABLE transactions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id            UUID UNIQUE NOT NULL,  -- logical FK (orders could be in same DB)
  razorpay_order_id   VARCHAR(100) UNIQUE,
  razorpay_payment_id VARCHAR(100),
  razorpay_signature  VARCHAR(500),
  amount              BIGINT NOT NULL,  -- in paise (₹1 = 100 paise)
  currency            CHAR(3) DEFAULT 'INR',
  status              VARCHAR(30) NOT NULL DEFAULT 'INITIATED',
  payment_method      VARCHAR(30) NOT NULL,
  customer_id         UUID REFERENCES customers(id),
  customer_email      VARCHAR(255),
  customer_phone      VARCHAR(20),
  store_id            UUID NOT NULL,
  error_code          VARCHAR(100),
  error_description   TEXT,
  error_source        VARCHAR(100),
  error_step          VARCHAR(100),
  error_reason        VARCHAR(100),
  reconciled          BOOLEAN DEFAULT FALSE,
  reconciled_at       TIMESTAMPTZ,
  reconciled_by       UUID REFERENCES users(id),
  paid_at             TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_transactions_store_status ON transactions(store_id, status);
CREATE INDEX idx_transactions_store_created ON transactions(store_id, created_at DESC);
CREATE INDEX idx_transactions_customer ON transactions(customer_id, created_at DESC);
CREATE INDEX idx_transactions_razorpay ON transactions(razorpay_payment_id);

CREATE TABLE refunds (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id      UUID NOT NULL REFERENCES transactions(id),
  order_id            UUID NOT NULL,
  store_id            UUID NOT NULL,
  razorpay_refund_id  VARCHAR(100) UNIQUE,
  razorpay_payment_id VARCHAR(100),
  amount              BIGINT NOT NULL,  -- in paise
  status              VARCHAR(30) NOT NULL DEFAULT 'INITIATED',
  type                VARCHAR(20) NOT NULL CHECK (type IN ('FULL','PARTIAL')),
  reason              TEXT NOT NULL,
  initiated_by        UUID REFERENCES users(id),
  customer_id         UUID REFERENCES customers(id),
  speed               VARCHAR(20) DEFAULT 'normal',
  notes               TEXT,
  error_code          VARCHAR(100),
  error_description   TEXT,
  processed_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_refunds_transaction ON refunds(transaction_id);
CREATE INDEX idx_refunds_store ON refunds(store_id, created_at DESC);
```

#### `delivery_trackings`
```sql
CREATE TABLE delivery_trackings (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id                  UUID UNIQUE NOT NULL,
  driver_id                 UUID NOT NULL REFERENCES users(id),
  store_id                  UUID NOT NULL,
  driver_name               VARCHAR(255),  -- denormalized
  driver_phone              VARCHAR(20),   -- denormalized
  dispatch_method           VARCHAR(30),
  priority_level            VARCHAR(20),
  status                    VARCHAR(30) NOT NULL DEFAULT 'PENDING_ASSIGNMENT',
  rejection_reason          TEXT,
  reassignment_count        INT DEFAULT 0,
  acceptance_timeout_mins   INT DEFAULT 5,
  distance_km               DECIMAL(6,2),
  estimated_delivery_mins   INT,
  actual_delivery_mins      INT,
  on_time                   BOOLEAN,
  customer_rating           INT,
  customer_feedback         TEXT,
  assigned_at               TIMESTAMPTZ,
  accepted_at               TIMESTAMPTZ,
  picked_up_at              TIMESTAMPTZ,
  delivered_at              TIMESTAMPTZ,
  rejected_at               TIMESTAMPTZ,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_delivery_driver_status ON delivery_trackings(driver_id, status);
CREATE INDEX idx_delivery_store_status ON delivery_trackings(store_id, status);
CREATE INDEX idx_delivery_store_created ON delivery_trackings(store_id, created_at DESC);
```

#### `notifications`
```sql
CREATE TABLE notifications (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID REFERENCES users(id),
  title                 VARCHAR(255) NOT NULL,
  message               TEXT NOT NULL,
  type                  VARCHAR(50) NOT NULL,
  channel               VARCHAR(20) NOT NULL CHECK (channel IN ('SMS','EMAIL','PUSH','IN_APP')),
  status                VARCHAR(30) NOT NULL DEFAULT 'PENDING',
  priority              VARCHAR(20) DEFAULT 'NORMAL',
  template_id           VARCHAR(50),
  recipient_email       VARCHAR(255),
  recipient_phone       VARCHAR(20),
  recipient_device_token TEXT,
  scheduled_for         TIMESTAMPTZ,
  sent_at               TIMESTAMPTZ,
  read_at               TIMESTAMPTZ,
  error_message         TEXT,
  retry_count           INT DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_notifications_user_status ON notifications(user_id, status);
CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_scheduled ON notifications(scheduled_for, status);
```

#### `review_responses`
```sql
CREATE TABLE review_responses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id     VARCHAR(24) NOT NULL UNIQUE,  -- MongoDB ObjectId
  manager_id    UUID NOT NULL REFERENCES users(id),
  manager_name  VARCHAR(255),
  response_text TEXT NOT NULL,
  response_type VARCHAR(30) NOT NULL,
  is_template   BOOLEAN DEFAULT FALSE,
  is_edited     BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### GDPR Tables
```sql
CREATE TABLE gdpr_consents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id),
  consent_type  VARCHAR(50) NOT NULL,
  status        VARCHAR(20) NOT NULL CHECK (status IN ('GRANTED','REVOKED','EXPIRED')),
  version       VARCHAR(20) NOT NULL,
  granted_at    TIMESTAMPTZ,
  revoked_at    TIMESTAMPTZ,
  expires_at    TIMESTAMPTZ,
  ip_address    INET,
  user_agent    TEXT,
  consent_text  TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_gdpr_consent_user ON gdpr_consents(user_id, consent_type);

CREATE TABLE gdpr_data_requests (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES users(id),
  request_type        VARCHAR(30) NOT NULL CHECK (request_type IN ('ACCESS','ERASURE','PORTABILITY','RECTIFICATION')),
  status              VARCHAR(30) NOT NULL DEFAULT 'PENDING',
  requested_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at        TIMESTAMPTZ,
  due_date            TIMESTAMPTZ NOT NULL,  -- 30-day SLA
  ip_address          INET,
  reason              TEXT,
  data_export_url     TEXT,
  export_expires_at   TIMESTAMPTZ,
  verification_token  VARCHAR(255),
  verified_at         TIMESTAMPTZ,
  processed_by        UUID REFERENCES users(id),
  processing_notes    TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE gdpr_audit_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id),
  action_type     VARCHAR(50) NOT NULL,
  performed_by    UUID REFERENCES users(id),
  performed_by_type VARCHAR(20),
  timestamp       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address      INET,
  data_type       VARCHAR(50),
  description     TEXT,
  legal_basis     VARCHAR(100),
  success         BOOLEAN NOT NULL DEFAULT TRUE,
  error_message   TEXT
  -- Note: before/after state stored as JSONB to preserve flexibility
  ,before_state   JSONB,
  after_state     JSONB
);
CREATE INDEX idx_gdpr_audit_user ON gdpr_audit_logs(user_id, timestamp DESC);

-- Suppliers, Inventory, Purchase Orders, Waste
CREATE TABLE suppliers (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_code       VARCHAR(50) UNIQUE NOT NULL,
  supplier_name       VARCHAR(255) NOT NULL,
  contact_person      VARCHAR(255),
  phone               VARCHAR(20),
  email               VARCHAR(255),
  city                VARCHAR(100),
  state               VARCHAR(100),
  gst_number          VARCHAR(50),
  payment_terms       VARCHAR(100),
  credit_days         INT DEFAULT 0,
  status              VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE','BLACKLISTED')),
  is_preferred        BOOLEAN DEFAULT FALSE,
  total_orders        INT DEFAULT 0,
  on_time_rate        DECIMAL(5,2),
  quality_rating      DECIMAL(3,2),
  total_purchase_value DECIMAL(15,2) DEFAULT 0,
  avg_lead_days       INT,
  last_order_date     DATE,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE supplier_categories (
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  category    VARCHAR(100) NOT NULL,
  PRIMARY KEY (supplier_id, category)
);

CREATE TABLE inventory_items (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id            UUID NOT NULL,
  item_name           VARCHAR(255) NOT NULL,
  item_code           VARCHAR(100),
  category            VARCHAR(100),
  unit                VARCHAR(50) NOT NULL,
  current_stock       DECIMAL(10,3) DEFAULT 0,
  reserved_stock      DECIMAL(10,3) DEFAULT 0,
  minimum_stock       DECIMAL(10,3) NOT NULL,
  maximum_stock       DECIMAL(10,3),
  reorder_quantity    DECIMAL(10,3),
  unit_cost           DECIMAL(10,2),
  average_cost        DECIMAL(10,2),
  last_purchase_cost  DECIMAL(10,2),
  primary_supplier_id UUID REFERENCES suppliers(id),
  is_perishable       BOOLEAN DEFAULT FALSE,
  expiry_date         DATE,
  shelf_life_days     INT,
  status              VARCHAR(20) DEFAULT 'ACTIVE',
  auto_reorder        BOOLEAN DEFAULT FALSE,
  storage_location    VARCHAR(100),
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_inventory_store_status ON inventory_items(store_id, status);
CREATE INDEX idx_inventory_low_stock ON inventory_items(store_id, current_stock, minimum_stock);
CREATE INDEX idx_inventory_expiry ON inventory_items(is_perishable, expiry_date) WHERE is_perishable = TRUE;

CREATE TABLE purchase_orders (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number          VARCHAR(50) UNIQUE NOT NULL,
  store_id              UUID NOT NULL,
  supplier_id           UUID NOT NULL REFERENCES suppliers(id),
  supplier_name         VARCHAR(255),  -- denormalized
  order_date            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expected_delivery     DATE,
  actual_delivery       DATE,
  status                VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
  subtotal              DECIMAL(12,2) DEFAULT 0,
  tax_amount            DECIMAL(10,2) DEFAULT 0,
  shipping_cost         DECIMAL(10,2) DEFAULT 0,
  discount_amount       DECIMAL(10,2) DEFAULT 0,
  total_amount          DECIMAL(12,2) DEFAULT 0,
  payment_status        VARCHAR(30),
  requested_by          UUID REFERENCES users(id),
  approved_by           UUID REFERENCES users(id),
  approved_at           TIMESTAMPTZ,
  rejection_reason      TEXT,
  received_by           UUID REFERENCES users(id),
  received_at           TIMESTAMPTZ,
  auto_generated        BOOLEAN DEFAULT FALSE,
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_po_store_status ON purchase_orders(store_id, status);
CREATE INDEX idx_po_status_delivery ON purchase_orders(status, expected_delivery);

CREATE TABLE purchase_order_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  inventory_item_id UUID REFERENCES inventory_items(id),
  item_name         VARCHAR(255) NOT NULL,
  item_code         VARCHAR(100),
  quantity          DECIMAL(10,3) NOT NULL,
  unit              VARCHAR(50) NOT NULL,
  unit_price        DECIMAL(10,2) NOT NULL,
  total_price       DECIMAL(12,2) NOT NULL,
  received_qty      DECIMAL(10,3) DEFAULT 0,
  notes             TEXT
);

CREATE TABLE waste_records (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id          UUID NOT NULL,
  inventory_item_id UUID REFERENCES inventory_items(id),
  item_name         VARCHAR(255) NOT NULL,
  item_code         VARCHAR(100),
  quantity          DECIMAL(10,3) NOT NULL,
  unit              VARCHAR(50) NOT NULL,
  unit_cost         DECIMAL(10,2),
  total_cost        DECIMAL(10,2),
  waste_category    VARCHAR(30) NOT NULL CHECK (waste_category IN ('EXPIRED','DAMAGED','SPOILED','CONTAMINATED','OVERPRODUCTION','OTHER')),
  waste_reason      TEXT,
  waste_date        DATE NOT NULL,
  reported_by       UUID REFERENCES users(id),
  approved_by       UUID REFERENCES users(id),
  approved_at       TIMESTAMPTZ,
  preventable       BOOLEAN DEFAULT FALSE,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_waste_store_date ON waste_records(store_id, waste_date DESC);
CREATE INDEX idx_waste_store_category ON waste_records(store_id, waste_category);
```

---

## MongoDB Schema (Remaining)

### Database: `masova_mongo`

#### `stores` collection
Stays exactly as-is. The flexible nested config (delivery zones, polygon coordinates, weekly schedule with special hours, multi-zone delivery fees) is a perfect document use case. No change needed.

#### `menu_items` collection
Stays exactly as-is. Variable variants, customizations, allergen lists, nutritional info, preparation instructions — pure document data. Add a sparse index on `storeId + isAvailable` (already exists).

#### `driver_locations` collection
Stays exactly as-is. Geospatial GeoJSON with TTL index — MongoDB's strongest native feature. No SQL database handles this as cleanly.

#### `reviews` collection
Stays exactly as-is. Variable nested `itemReviews[]`, sentiment data, per-review structure varies. Keep `responseId` as a reference to PostgreSQL `review_responses.id`.

#### `campaigns` collection
Stays exactly as-is. The `CustomerSegment.filters` is a dynamic Map that changes per campaign type — document-perfect.

#### `templates` collection
Stays exactly as-is. Per-channel structure varies (htmlBody only for email, smsBody only for SMS).

#### `user_preferences` collection
Stays exactly as-is. The `typePreferences` Map<String, ChannelPreference> is dynamic and hard to model in SQL without a complex EAV table.

#### `kitchen_equipment` collection
Stays exactly as-is. Operational state with flexible maintenance notes.

#### `customer_loyalty_history` (new — split from customers)
Loyalty point transaction history moves OUT of the embedded `pointHistory` array in `customers` (which grows unbounded) into a dedicated collection:
```json
{
  "_id": "ObjectId",
  "customerId": "UUID (PG reference)",
  "type": "EARNED | REDEEMED | EXPIRED | BONUS",
  "points": 50,
  "description": "Order #ORD-2026-0123",
  "orderId": "UUID (PG reference)",
  "createdAt": "ISODate"
}
```
TTL index: auto-expire records older than 3 years.

#### `customer_preferences` (new — split from customers)
Flexible preferences (favorite items, cuisine preferences, dietary restrictions) move to their own document since the shape varies per customer:
```json
{
  "_id": "ObjectId",
  "customerId": "UUID (PG reference)",
  "favoriteMenuItems": ["menuItemId1"],
  "cuisinePreferences": ["SOUTH_INDIAN"],
  "dietaryRestrictions": ["VEGETARIAN"],
  "allergens": ["NUTS"],
  "preferredPaymentMethod": "UPI",
  "spiceLevel": "MEDIUM",
  "notifyOnOffers": true,
  "notifyOnOrderStatus": true
}
```

---

## Redis Schema (Existing + New)

### Existing (already in use)
- `jwt:blacklist:{token}` — JWT revocation (TTL = token expiry)
- `session:{sessionId}` — User session data

### Add
- `driver:online:{driverId}` — Driver online/offline status (TTL 5 min, heartbeat refreshes)
- `driver:location:{driverId}` — Latest driver location (TTL 10 min, driver pushes updates)
- `store:status:{storeId}` — Store operational status (TTL 1 min, cached)
- `order:status:{orderId}` — Order status for fast polling (TTL 30 min)
- `rate:limit:{userId}:{endpoint}` — Rate limiting counter
- `otp:{orderId}` — Delivery OTP (TTL 30 min)

---

## Migration Strategy

### Phase 1 — Dual-write (no downtime)
1. Stand up PostgreSQL alongside MongoDB (Docker Compose on Dell)
2. Add Spring `@Transactional` support to services that need it
3. Write to both databases simultaneously — PostgreSQL is primary, MongoDB is read fallback
4. Verify data consistency for 1 week

### Phase 2 — Migrate reads
1. Switch read queries to PostgreSQL for migrated collections
2. Keep MongoDB writes as backup
3. Run both in parallel, compare query results

### Phase 3 — Cut over
1. Stop MongoDB writes for migrated collections
2. PostgreSQL is sole source of truth for PG collections
3. MongoDB serves only its designated collections (stores, menu, reviews, campaigns, etc.)

### Phase 4 — Cleanup
1. Drop migrated collections from MongoDB
2. Update all Spring Data repositories (`MongoRepository` → `JpaRepository` for PG collections)
3. Update `test-api-full.js` and Pact contracts

---

## Summary

| Database | Collections/Tables | Responsibility |
|---|---|---|
| **PostgreSQL** | 22 tables | Users, auth, customers, orders, payments, refunds, delivery, shifts, sessions, inventory, GDPR |
| **MongoDB** | 8 collections | Stores, menu, driver locations, reviews, campaigns, templates, preferences, equipment |
| **Redis** | 8 key patterns | JWT blacklist, sessions, driver status, OTP, rate limiting, caching |

### Why this is right

**PostgreSQL for financial data** — A payment of ₹500 that crashes halfway through cannot leave half a transaction. MongoDB has no multi-document ACID. PostgreSQL has it built-in. This is non-negotiable for any fintech or commerce platform.

**PostgreSQL for relational data** — An order joins to a customer, store, driver, staff member, items, payment, and quality checkpoints. In MongoDB you load the entire order document and manually look up each related ID. In PostgreSQL, one JOIN query does it in microseconds.

**MongoDB for flexible schema** — A store's delivery zone polygon, a menu item's customization options, a campaign's dynamic filter criteria — these change shape per record. SQL's rigid schema fights you here. MongoDB embraces it.

**Redis for real-time** — Driver location updates every 5 seconds from a moving vehicle. Writing that to PostgreSQL is 200ms per write, 12 writes/minute per driver. Redis handles this at sub-millisecond. MongoDB's TTL collection is the fallback for persistence.

This is exactly how Swiggy, Zomato, and Dunzo architect their data layers.
