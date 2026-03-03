# Phase 2 — Database Migration (MongoDB → Polyglot) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate financial/relational data from MongoDB to PostgreSQL using a dual-write pattern. MongoDB keeps flexible/geospatial collections. Redis keeps ephemeral state. Zero downtime, zero data loss.

**Architecture:** Dual-write for 2 weeks — write to PostgreSQL first (synchronous/transactional), write to MongoDB second (async, best-effort). Read from PostgreSQL for migrated entities. After validation, stop MongoDB writes and drop migrated collections.

**Migration Strategy: DO NOT RUSH.** Do one service at a time. Verify data consistency before cutting over. This is the riskiest phase — take it slowly.

**Tech Stack:** Spring Boot 3, Spring Data JPA, PostgreSQL 15, Flyway migrations, Docker, MongoDB (kept for Mongo-specific collections)

**Prerequisite:** Phase 0 must be complete. Phase 1 (API reduction) should be complete (cleaner codebase to migrate).

---

## Collections Migrating to PostgreSQL

| MongoDB Collection | New PostgreSQL Table(s) | Which Service |
|---|---|---|
| `users` | `users`, `user_auth_providers` | core-service |
| `customers` (core data) | `customers`, `customer_addresses`, `customer_store_memberships`, `customer_tags`, `loyalty_transactions` | core-service |
| `shifts` | `shifts` | core-service |
| `working_sessions` | `working_sessions`, `session_violations` | core-service |
| `notifications` | `notifications` | core-service |
| `review_responses` | `review_responses` | core-service |
| `gdpr_consents`, `gdpr_data_requests`, `gdpr_audit_logs` | `gdpr_consents`, `gdpr_data_requests`, `gdpr_audit_logs` | core-service |
| `orders` | `orders`, `order_items`, `order_quality_checkpoints` | commerce-service |
| `delivery_trackings` | `delivery_trackings` | logistics-service |
| `inventory_items` | `inventory_items` | logistics-service |
| `suppliers` | `suppliers`, `supplier_categories` | logistics-service |
| `purchase_orders` | `purchase_orders`, `purchase_order_items` | logistics-service |
| `waste_records` | `waste_records` | logistics-service |
| `transactions` | `transactions` | payment-service |
| `refunds` | `refunds` | payment-service |

## Collections STAYING in MongoDB

- `stores` — flexible delivery zone/hours config
- `menu_items` — variable variants, customizations
- `driver_locations` — GeoJSON + TTL
- `reviews` — nested itemReviews[], sentiment
- `campaigns` — dynamic filters
- `templates` — variable per-channel structure
- `user_preferences` — dynamic Map
- `kitchen_equipment` — operational state + notes
- `customer_loyalty_history` — unbounded arrays
- `customer_preferences` — dietary/favorites

---

## Task 2.1: Add PostgreSQL to Docker Compose

**Files:**
- Modify: `docker-compose.yml`

**Step 1: Read the current docker-compose.yml**

Check what services are defined. PostgreSQL is not there yet.

**Step 2: Add PostgreSQL service**

In `docker-compose.yml`, after the `rabbitmq` service, add:

```yaml
  postgres:
    image: postgres:15-alpine
    container_name: masova-postgres
    restart: unless-stopped
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: masova_db
      POSTGRES_USER: masova
      POSTGRES_PASSWORD: masova_secret
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./infrastructure/postgres/init.sql:/docker-entrypoint-initdb.d/01-init.sql:ro
    networks:
      - masova-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U masova -d masova_db"]
      interval: 10s
      timeout: 5s
      retries: 5
```

Add to the `volumes` section at the bottom:
```yaml
  postgres_data:
    driver: local
```

**Step 3: Create infrastructure/postgres directory and init.sql**

```bash
mkdir -p infrastructure/postgres
```

Create `infrastructure/postgres/init.sql`:
```sql
-- MaSoVa PostgreSQL Initialization
-- This runs once when the container first starts.
-- Flyway migrations handle schema creation.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- Enable pg_trgm for ILIKE search optimization
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

**Step 4: Start PostgreSQL on Dell**

```powershell
docker compose up -d postgres
docker compose ps  # verify masova-postgres is running
```

Expected: `masova-postgres` status `healthy`

**Step 5: Verify connection**

```powershell
docker exec -it masova-postgres psql -U masova -d masova_db -c "SELECT version();"
```

Expected: PostgreSQL 15.x version string.

**Step 6: Commit**

```bash
git add docker-compose.yml
git add infrastructure/postgres/init.sql
git commit -m "feat(infra): add PostgreSQL 15 to docker-compose, init.sql with uuid-ossp extension"
```

---

## Task 2.2: Add JPA + PostgreSQL + Flyway Dependencies to All Services

**Files:**
- Modify: `core-service/pom.xml`
- Modify: `commerce-service/pom.xml`
- Modify: `logistics-service/pom.xml`
- Modify: `payment-service/pom.xml`

**Step 1: Read core-service/pom.xml**

Note the Spring Boot version and existing dependencies.

**Step 2: Add to each service's pom.xml**

Add these dependencies to the `<dependencies>` section:

```xml
<!-- PostgreSQL + JPA -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
</dependency>
<dependency>
    <groupId>org.postgresql</groupId>
    <artifactId>postgresql</artifactId>
    <scope>runtime</scope>
</dependency>

<!-- Flyway for schema migrations -->
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-core</artifactId>
</dependency>
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-database-postgresql</artifactId>
</dependency>
```

**Step 3: Add PostgreSQL config to each service's application.yml**

In each service's `src/main/resources/application.yml`, add alongside the existing MongoDB config:

```yaml
# PostgreSQL (dual-write — primary store for migrated entities)
spring:
  datasource:
    url: jdbc:postgresql://${DB_HOST:192.168.50.88}:5432/masova_db
    username: ${DB_USER:masova}
    password: ${DB_PASSWORD:masova_secret}
    driver-class-name: org.postgresql.Driver
    hikari:
      maximum-pool-size: 10
      minimum-idle: 2
      connection-timeout: 30000
  jpa:
    hibernate:
      ddl-auto: validate  # Flyway manages schema — never let Hibernate create/drop
    show-sql: false
    open-in-view: false
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
        format_sql: true
  flyway:
    enabled: true
    baseline-on-migrate: true
    locations: classpath:db/migration
```

**Step 4: Build each service to verify no dependency errors**

```powershell
cd core-service && mvn compile "-Dmaven.test.skip=true"
```

If Flyway complains about no migration scripts yet → create the migration directory:
```bash
mkdir -p core-service/src/main/resources/db/migration
touch core-service/src/main/resources/db/migration/.gitkeep
```

**Step 5: Commit**

```bash
git add core-service/pom.xml commerce-service/pom.xml logistics-service/pom.xml payment-service/pom.xml
git add core-service/src/main/resources/application.yml
git add commerce-service/src/main/resources/application.yml
git add logistics-service/src/main/resources/application.yml
git add payment-service/src/main/resources/application.yml
git commit -m "feat(db): add Spring Data JPA + PostgreSQL + Flyway to all 4 services"
```

---

## Task 2.3: Flyway Migration V1 — Users + Auth Schema (Core-Service)

**Files:**
- Create: `core-service/src/main/resources/db/migration/V1__users_schema.sql`
- Create: `core-service/src/main/java/com/MaSoVa/core/user/entity/UserEntity.java` (JPA entity)
- Create: `core-service/src/main/java/com/MaSoVa/core/user/repository/UserJpaRepository.java`

**Step 1: Create V1 migration script**

Create `core-service/src/main/resources/db/migration/V1__users_schema.sql`:

```sql
-- V1: Users and authentication tables
-- MaSoVa Core Service — Initial PostgreSQL schema

CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255),
    role VARCHAR(50) NOT NULL,          -- MANAGER, KITCHEN_STAFF, DRIVER, CASHIER, CUSTOMER
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    store_id VARCHAR(36),
    pin VARCHAR(10),
    pin_generated_at TIMESTAMPTZ,
    kiosk_token VARCHAR(500),
    profile_image_url TEXT,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version BIGINT DEFAULT 0,
    mongo_id VARCHAR(36)                -- Source MongoDB _id for migration tracking
);

CREATE UNIQUE INDEX idx_users_email ON users (email);
CREATE UNIQUE INDEX idx_users_phone ON users (phone) WHERE phone IS NOT NULL;
CREATE INDEX idx_users_store_role ON users (store_id, role);
CREATE INDEX idx_users_status ON users (status);

CREATE TABLE user_auth_providers (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,      -- GOOGLE, FACEBOOK, LOCAL
    provider_user_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (provider, provider_user_id)
);

CREATE INDEX idx_auth_providers_user ON user_auth_providers (user_id);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Step 2: Create JPA entity**

Create `core-service/src/main/java/com/MaSoVa/core/user/entity/UserEntity.java`:

```java
package com.MaSoVa.core.user.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "users")
public class UserEntity {

    @Id
    private String id = UUID.randomUUID().toString();

    @Column(nullable = false, unique = true)
    private String email;

    private String phone;

    @Column(nullable = false)
    private String name;

    @Column(name = "password_hash")
    private String passwordHash;

    @Column(nullable = false)
    private String role;

    @Column(nullable = false)
    private String status = "ACTIVE";

    @Column(name = "store_id")
    private String storeId;

    private String pin;

    @Column(name = "pin_generated_at")
    private Instant pinGeneratedAt;

    @Column(name = "kiosk_token", length = 500)
    private String kioskToken;

    @Column(name = "profile_image_url", columnDefinition = "TEXT")
    private String profileImageUrl;

    @Column(name = "last_login_at")
    private Instant lastLoginAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @Version
    private Long version;

    @Column(name = "mongo_id")
    private String mongoId;  // Tracks source MongoDB _id during migration

    // Getters and setters — generate with your IDE (Lombok @Data not recommended
    // for JPA entities due to hashCode/equals issues with lazy-loaded collections)
    // ... [generate getters/setters]
}
```

**Step 3: Create JPA repository**

Create `core-service/src/main/java/com/MaSoVa/core/user/repository/UserJpaRepository.java`:

```java
package com.MaSoVa.core.user.repository;

import com.MaSoVa.core.user.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface UserJpaRepository extends JpaRepository<UserEntity, String> {
    Optional<UserEntity> findByEmail(String email);
    Optional<UserEntity> findByMongoId(String mongoId);
    List<UserEntity> findByStoreIdAndRole(String storeId, String role);
    boolean existsByEmail(String email);
}
```

**Step 4: Build to verify Flyway migration runs**

```powershell
cd core-service
mvn spring-boot:run "-Dmaven.test.skip=true" &
# Wait for startup, then check logs for "Successfully applied 1 migration"
```

Check PostgreSQL tables were created:
```powershell
docker exec -it masova-postgres psql -U masova -d masova_db -c "\dt"
```

Expected: `users` and `user_auth_providers` tables listed.

**Step 5: Commit**

```bash
git add core-service/src/main/resources/db/migration/V1__users_schema.sql
git add core-service/src/main/java/com/MaSoVa/core/user/entity/UserEntity.java
git add core-service/src/main/java/com/MaSoVa/core/user/repository/UserJpaRepository.java
git commit -m "feat(db): V1 migration — users + user_auth_providers tables in PostgreSQL"
```

---

## Task 2.4: Dual-Write for Users in UserService

**Files:**
- Modify: `core-service/src/main/java/com/MaSoVa/core/user/service/UserService.java`

**Step 1: Read UserService.java**

Find `createUser()`, `updateUser()`, and `deleteUser()` methods.

**Step 2: Inject UserJpaRepository**

Add `UserJpaRepository` to the `UserService` constructor. Keep existing `UserRepository` (MongoDB) intact.

**Step 3: Add dual-write in createUser()**

```java
// After saving to MongoDB:
User savedUser = userRepository.save(user);  // MongoDB — existing code

// Write to PostgreSQL (dual-write)
try {
    UserEntity pgUser = toUserEntity(savedUser);
    userJpaRepository.save(pgUser);
    log.debug("User {} written to PostgreSQL", savedUser.getId());
} catch (Exception e) {
    log.warn("PostgreSQL write failed for user {} (non-blocking): {}", savedUser.getId(), e.getMessage());
    // Non-blocking — MongoDB is primary until cutover
}

return savedUser;
```

**Step 4: Add toUserEntity() mapper**

```java
private UserEntity toUserEntity(User mongoUser) {
    UserEntity entity = new UserEntity();
    entity.setMongoId(mongoUser.getId());
    entity.setEmail(mongoUser.getEmail());
    entity.setPhone(mongoUser.getPhone());
    entity.setName(mongoUser.getName());
    entity.setPasswordHash(mongoUser.getPassword());
    entity.setRole(mongoUser.getType() != null ? mongoUser.getType().toString() : "CUSTOMER");
    entity.setStatus(mongoUser.isActive() ? "ACTIVE" : "INACTIVE");
    entity.setStoreId(mongoUser.getStoreId());
    entity.setPin(mongoUser.getPin());
    entity.setKioskToken(mongoUser.getKioskToken());
    entity.setProfileImageUrl(mongoUser.getProfileImageUrl());
    return entity;
}
```

**Step 5: Build and verify no errors**

```powershell
mvn compile "-Dmaven.test.skip=true"
```

**Step 6: Test — create a user, check PostgreSQL**

```bash
curl -X POST http://192.168.50.88:8080/api/users \
  -H "Authorization: Bearer <manager_token>" \
  -H "Content-Type: application/json" \
  -d '{"email":"test_pg@masova.com","name":"PG Test","type":"CASHIER","storeId":"STORE001"}'
```

Verify in PostgreSQL:
```powershell
docker exec -it masova-postgres psql -U masova -d masova_db -c "SELECT email, role FROM users WHERE email='test_pg@masova.com';"
```

Expected: row found.

**Step 7: Commit**

```bash
git add core-service/src/main/java/com/MaSoVa/core/user/service/UserService.java
git commit -m "feat(db): dual-write users to PostgreSQL (non-blocking), MongoDB remains primary"
```

---

## Task 2.5: Flyway V2 — Orders + OrderItems Schema (Commerce-Service)

**Files:**
- Create: `commerce-service/src/main/resources/db/migration/V1__orders_schema.sql`

**Step 1: Create orders migration**

Create `commerce-service/src/main/resources/db/migration/V1__orders_schema.sql`:

```sql
-- V1: Orders and order items
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE orders (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    customer_id VARCHAR(36),
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20),
    customer_email VARCHAR(255),
    store_id VARCHAR(36) NOT NULL,
    status VARCHAR(50) NOT NULL,
    order_type VARCHAR(20) NOT NULL,     -- DINE_IN, TAKEAWAY, DELIVERY
    payment_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    payment_method VARCHAR(50),
    payment_transaction_id VARCHAR(255),
    priority VARCHAR(20) DEFAULT 'NORMAL',
    subtotal DECIMAL(10,2) NOT NULL,
    delivery_fee DECIMAL(10,2) DEFAULT 0,
    tax DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    special_instructions TEXT,
    table_number VARCHAR(20),
    guest_count INTEGER,
    assigned_driver_id VARCHAR(36),
    created_by_staff_id VARCHAR(36),
    created_by_staff_name VARCHAR(255),
    preparation_time INTEGER,
    estimated_delivery_time TIMESTAMPTZ,
    received_at TIMESTAMPTZ,
    preparing_started_at TIMESTAMPTZ,
    ready_at TIMESTAMPTZ,
    dispatched_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    delivery_otp VARCHAR(10),
    delivery_proof_type VARCHAR(50),
    delivery_proof_url TEXT,
    make_table_flag BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version BIGINT DEFAULT 0,
    mongo_id VARCHAR(36)
);

CREATE INDEX idx_orders_store_status ON orders (store_id, status);
CREATE INDEX idx_orders_store_created ON orders (store_id, created_at DESC);
CREATE INDEX idx_orders_customer ON orders (customer_id, created_at DESC);
CREATE INDEX idx_orders_driver ON orders (assigned_driver_id, status);
CREATE INDEX idx_orders_number ON orders (order_number);

CREATE TABLE order_items (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    order_id VARCHAR(36) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    variant VARCHAR(255),
    customizations TEXT,                -- JSON stored as TEXT
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON order_items (order_id);

CREATE TABLE order_quality_checkpoints (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    order_id VARCHAR(36) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    passed BOOLEAN,
    notes TEXT,
    checked_at TIMESTAMPTZ,
    checked_by VARCHAR(255)
);

CREATE INDEX idx_checkpoints_order ON order_quality_checkpoints (order_id);

-- Address stored as JSONB for flexibility (varies by order)
ALTER TABLE orders ADD COLUMN delivery_address JSONB;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ language 'plpgsql';

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Step 2: Create OrderJpaEntity.java**

Create `commerce-service/src/main/java/com/MaSoVa/commerce/order/entity/OrderJpaEntity.java`:

```java
package com.MaSoVa.commerce.order.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Entity
@Table(name = "orders")
public class OrderJpaEntity {
    @Id
    private String id;

    @Column(name = "order_number", nullable = false, unique = true)
    private String orderNumber;

    @Column(name = "customer_id")
    private String customerId;

    @Column(name = "customer_name", nullable = false)
    private String customerName;

    @Column(name = "store_id", nullable = false)
    private String storeId;

    @Column(nullable = false)
    private String status;

    @Column(name = "order_type", nullable = false)
    private String orderType;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal subtotal;

    @Column(name = "delivery_fee", precision = 10, scale = 2)
    private BigDecimal deliveryFee = BigDecimal.ZERO;

    @Column(precision = 10, scale = 2)
    private BigDecimal tax = BigDecimal.ZERO;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal total;

    @Column(name = "received_at")
    private Instant receivedAt;

    @Column(name = "preparing_started_at")
    private Instant preparingStartedAt;

    @Column(name = "ready_at")
    private Instant readyAt;

    @Column(name = "delivered_at")
    private Instant deliveredAt;

    @Column(name = "delivery_address", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String deliveryAddress;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @Version
    private Long version;

    @Column(name = "mongo_id")
    private String mongoId;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItemJpaEntity> items;

    // Getters and setters...
}
```

**Step 3: Build and verify migration runs**

```powershell
cd commerce-service
mvn spring-boot:run "-Dmaven.test.skip=true"
```

Check PostgreSQL:
```powershell
docker exec -it masova-postgres psql -U masova -d masova_db -c "\dt orders*"
```

Expected: `orders`, `order_items`, `order_quality_checkpoints` tables.

**Step 4: Commit**

```bash
git add commerce-service/src/main/resources/db/migration/V1__orders_schema.sql
git add commerce-service/src/main/java/com/MaSoVa/commerce/order/entity/OrderJpaEntity.java
git commit -m "feat(db): V1 orders schema in PostgreSQL — orders/items/checkpoints tables + indexes"
```

---

## Task 2.6: Dual-Write for Orders in OrderService

**Files:**
- Modify: `commerce-service/src/main/java/com/MaSoVa/commerce/order/service/OrderService.java`

**Step 1: Create OrderJpaRepository**

```java
@Repository
public interface OrderJpaRepository extends JpaRepository<OrderJpaEntity, String> {
    Optional<OrderJpaEntity> findByMongoId(String mongoId);
    Optional<OrderJpaEntity> findByOrderNumber(String orderNumber);
    List<OrderJpaEntity> findByStoreIdAndStatus(String storeId, String status);
}
```

**Step 2: Add dual-write to createOrder()**

After `Order savedOrder = orderRepository.save(order);`:

```java
// Dual-write to PostgreSQL (non-blocking)
try {
    OrderJpaEntity pgOrder = toOrderJpaEntity(savedOrder);
    orderJpaRepository.save(pgOrder);
} catch (Exception e) {
    log.warn("PostgreSQL dual-write failed for order {}: {}", savedOrder.getOrderNumber(), e.getMessage());
}
```

**Step 3: Add dual-write to updateOrderStatus()**

After each `orderRepository.save(order)` call in `updateOrderStatus()`:

```java
// Sync status to PostgreSQL
try {
    orderJpaRepository.findByMongoId(order.getId()).ifPresent(pgOrder -> {
        pgOrder.setStatus(order.getStatus().toString());
        pgOrder.setUpdatedAt(Instant.now());
        // Set timestamp fields based on new status
        if (OrderStatus.PREPARING.equals(order.getStatus()) && pgOrder.getPreparingStartedAt() == null) {
            pgOrder.setPreparingStartedAt(Instant.now());
        }
        if (OrderStatus.READY.equals(order.getStatus())) pgOrder.setReadyAt(Instant.now());
        if (OrderStatus.DELIVERED.equals(order.getStatus())) pgOrder.setDeliveredAt(Instant.now());
        orderJpaRepository.save(pgOrder);
    });
} catch (Exception e) {
    log.warn("PostgreSQL order status sync failed for {}: {}", order.getOrderNumber(), e.getMessage());
}
```

**Step 4: Build and test**

Create an order, advance its status, verify both MongoDB and PostgreSQL show the same status.

**Step 5: Commit**

```bash
git add commerce-service/src/main/java/com/MaSoVa/commerce/order/service/OrderService.java
git add commerce-service/src/main/java/com/MaSoVa/commerce/order/repository/OrderJpaRepository.java
git commit -m "feat(db): dual-write orders to PostgreSQL — createOrder + updateOrderStatus"
```

---

## Task 2.7: Flyway Migrations — Payment + Logistics (Transactions, Inventory, Suppliers)

**Files:**
- Create: `payment-service/src/main/resources/db/migration/V1__transactions_schema.sql`
- Create: `logistics-service/src/main/resources/db/migration/V1__logistics_schema.sql`

**Step 1: Create payment transactions schema**

`payment-service/src/main/resources/db/migration/V1__transactions_schema.sql`:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE transactions (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    order_id VARCHAR(36) NOT NULL,
    store_id VARCHAR(36) NOT NULL,
    customer_id VARCHAR(36),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    payment_method VARCHAR(50) NOT NULL,
    payment_gateway VARCHAR(50),
    gateway_transaction_id VARCHAR(255),
    gateway_order_id VARCHAR(255),
    status VARCHAR(50) NOT NULL,
    failure_reason TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    mongo_id VARCHAR(36)
);

CREATE UNIQUE INDEX idx_transactions_gateway_txn ON transactions (gateway_transaction_id)
    WHERE gateway_transaction_id IS NOT NULL;
CREATE INDEX idx_transactions_order ON transactions (order_id);
CREATE INDEX idx_transactions_store_created ON transactions (store_id, created_at DESC);
CREATE INDEX idx_transactions_customer ON transactions (customer_id, created_at DESC);

CREATE TABLE refunds (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    transaction_id VARCHAR(36) NOT NULL REFERENCES transactions(id),
    order_id VARCHAR(36) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    reason TEXT,
    status VARCHAR(50) NOT NULL,
    gateway_refund_id VARCHAR(255),
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    mongo_id VARCHAR(36)
);

CREATE INDEX idx_refunds_transaction ON refunds (transaction_id);
CREATE INDEX idx_refunds_order ON refunds (order_id);
```

**Step 2: Create logistics schema (suppliers + inventory + PO)**

`logistics-service/src/main/resources/db/migration/V1__logistics_schema.sql`:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE suppliers (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    is_preferred BOOLEAN DEFAULT FALSE,
    lead_time_days INTEGER DEFAULT 3,
    reliability_score DECIMAL(3,2) DEFAULT 0.80,
    on_time_delivery_rate DECIMAL(3,2) DEFAULT 0.85,
    quality_rating DECIMAL(3,2) DEFAULT 0.80,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    mongo_id VARCHAR(36)
);

CREATE INDEX idx_suppliers_status ON suppliers (status);
CREATE INDEX idx_suppliers_preferred ON suppliers (is_preferred);

CREATE TABLE supplier_categories (
    supplier_id VARCHAR(36) NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    PRIMARY KEY (supplier_id, category)
);

CREATE TABLE inventory_items (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    store_id VARCHAR(36) NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    unit VARCHAR(50),
    current_stock DECIMAL(10,3) NOT NULL DEFAULT 0,
    minimum_stock DECIMAL(10,3) NOT NULL DEFAULT 0,
    maximum_stock DECIMAL(10,3),
    reorder_quantity DECIMAL(10,3),
    unit_cost DECIMAL(10,2) DEFAULT 0,
    preferred_supplier_id VARCHAR(36) REFERENCES suppliers(id),
    expiry_date DATE,
    location VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    mongo_id VARCHAR(36)
);

CREATE INDEX idx_inventory_store ON inventory_items (store_id);
CREATE INDEX idx_inventory_low_stock ON inventory_items (store_id, current_stock, minimum_stock);

CREATE TABLE purchase_orders (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    store_id VARCHAR(36) NOT NULL,
    supplier_id VARCHAR(36) NOT NULL REFERENCES suppliers(id),
    po_number VARCHAR(50) NOT NULL UNIQUE,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    auto_generated BOOLEAN DEFAULT FALSE,
    total_amount DECIMAL(10,2),
    expected_delivery_date DATE,
    actual_delivery_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    mongo_id VARCHAR(36)
);

CREATE INDEX idx_po_store_status ON purchase_orders (store_id, status);
CREATE INDEX idx_po_supplier ON purchase_orders (supplier_id, created_at DESC);

CREATE TABLE purchase_order_items (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    po_id VARCHAR(36) NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    inventory_item_id VARCHAR(36) REFERENCES inventory_items(id),
    item_name VARCHAR(255) NOT NULL,
    quantity DECIMAL(10,3) NOT NULL,
    unit_cost DECIMAL(10,2),
    received_quantity DECIMAL(10,3) DEFAULT 0,
    received_at TIMESTAMPTZ
);

CREATE INDEX idx_poi_po ON purchase_order_items (po_id);

CREATE TABLE waste_records (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    store_id VARCHAR(36) NOT NULL,
    inventory_item_id VARCHAR(36) REFERENCES inventory_items(id),
    item_name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    quantity DECIMAL(10,3) NOT NULL,
    unit VARCHAR(50),
    unit_cost DECIMAL(10,2),
    total_cost DECIMAL(10,2),
    reason VARCHAR(100),
    notes TEXT,
    is_preventable BOOLEAN DEFAULT FALSE,
    approved_by VARCHAR(255),
    approved_at TIMESTAMPTZ,
    waste_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    mongo_id VARCHAR(36)
);

CREATE INDEX idx_waste_store_date ON waste_records (store_id, waste_date DESC);
```

**Step 3: Start both services to verify migrations run**

```powershell
cd payment-service && mvn spring-boot:run "-Dmaven.test.skip=true" &
cd logistics-service && mvn spring-boot:run "-Dmaven.test.skip=true" &
```

Verify tables:
```powershell
docker exec -it masova-postgres psql -U masova -d masova_db -c "\dt"
```

Expected: all tables listed.

**Step 4: Commit**

```bash
git add payment-service/src/main/resources/db/migration/V1__transactions_schema.sql
git add logistics-service/src/main/resources/db/migration/V1__logistics_schema.sql
git commit -m "feat(db): V1 payment transactions + logistics schema in PostgreSQL"
```

---

## Task 2.8: One-Time Data Migration Script

After dual-write is running for 1 week with no errors, run this to backfill historical data.

**Files:**
- Create: `scripts/migrate-to-postgres.js`

```javascript
/**
 * One-time MongoDB → PostgreSQL data migration
 * Run AFTER dual-write has been running for 1 week
 * Run: MONGO_URL=... PG_URL=... node scripts/migrate-to-postgres.js
 */
const { MongoClient } = require('mongodb');
const { Client: PgClient } = require('pg');

async function migrate() {
  const mongo = new MongoClient(process.env.MONGO_URL || 'mongodb://192.168.50.88:27017');
  const pg = new PgClient({ connectionString: process.env.PG_URL || 'postgresql://masova:masova_secret@192.168.50.88:5432/masova_db' });

  await mongo.connect();
  await pg.connect();

  const db = mongo.db('masova_db');
  console.log('Connected to both databases');

  // Migrate users (skip those already migrated via dual-write)
  console.log('\n--- Migrating users ---');
  const users = await db.collection('users').find({}).toArray();
  let usersMigrated = 0;
  for (const user of users) {
    const existing = await pg.query('SELECT id FROM users WHERE mongo_id = $1', [user._id.toString()]);
    if (existing.rows.length > 0) continue;  // Already migrated via dual-write

    try {
      await pg.query(
        `INSERT INTO users (id, email, phone, name, password_hash, role, status, store_id, created_at, mongo_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (email) DO NOTHING`,
        [
          user._id.toString(), user.email, user.phone, user.name,
          user.password, user.type || 'CUSTOMER', user.active ? 'ACTIVE' : 'INACTIVE',
          user.storeId, user.createdAt || new Date(), user._id.toString()
        ]
      );
      usersMigrated++;
    } catch (e) {
      console.warn(`  Skip user ${user.email}: ${e.message}`);
    }
  }
  console.log(`  Migrated ${usersMigrated} of ${users.length} users`);

  // Migrate orders
  console.log('\n--- Migrating orders ---');
  const orders = await db.collection('orders').find({}).toArray();
  let ordersMigrated = 0;
  for (const order of orders) {
    const existing = await pg.query('SELECT id FROM orders WHERE mongo_id = $1', [order._id.toString()]);
    if (existing.rows.length > 0) continue;

    try {
      await pg.query(
        `INSERT INTO orders (id, order_number, customer_id, customer_name, store_id, status, order_type,
                            subtotal, delivery_fee, tax, total, received_at, created_at, mongo_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         ON CONFLICT (order_number) DO NOTHING`,
        [
          order._id.toString(), order.orderNumber, order.customerId, order.customerName,
          order.storeId, order.status, order.orderType,
          order.subtotal, order.deliveryFee || 0, order.tax || 0, order.total,
          order.receivedAt, order.createdAt || new Date(), order._id.toString()
        ]
      );
      ordersMigrated++;
    } catch (e) {
      console.warn(`  Skip order ${order.orderNumber}: ${e.message}`);
    }
  }
  console.log(`  Migrated ${ordersMigrated} of ${orders.length} orders`);

  await mongo.close();
  await pg.end();
  console.log('\n✅ Migration complete');
}

migrate().catch(e => { console.error(e); process.exit(1); });
```

**Step 2: Add pg driver for migration script**

```bash
npm install pg --save-dev
```

**Step 3: Run migration**

```bash
MONGO_URL=mongodb://192.168.50.88:27017 \
PG_URL=postgresql://masova:masova_secret@192.168.50.88:5432/masova_db \
node scripts/migrate-to-postgres.js
```

**Step 4: Commit script**

```bash
git add scripts/migrate-to-postgres.js
git commit -m "chore(db): one-time MongoDB to PostgreSQL migration script"
```

---

## Task 2.9: Cutover — Switch Reads to PostgreSQL for Orders

**DO THIS ONLY AFTER:**
1. Dual-write has run for at least 1 week with no errors in logs
2. Migration script has backfilled all historical data
3. Manual spot-checks confirm PG and MongoDB have same data for 20+ orders

**Step 1: Update OrderService to read from PostgreSQL**

In `OrderService.getOrderById()`, change:
```java
// Before (MongoDB read):
return orderRepository.findById(orderId)
    .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));

// After (PostgreSQL read, MongoDB fallback):
return orderJpaRepository.findById(orderId)
    .map(this::fromOrderJpaEntity)
    .orElseGet(() ->
        orderRepository.findById(orderId)  // MongoDB fallback
            .orElseThrow(() -> new RuntimeException("Order not found: " + orderId))
    );
```

**Step 2: Verify no data discrepancies for 1 week**

Run this check daily:
```sql
-- In PostgreSQL: count orders by status
SELECT status, COUNT(*) FROM orders GROUP BY status ORDER BY status;
```

Compare with MongoDB:
```javascript
// In MongoDB shell:
db.orders.aggregate([{$group: {_id: "$status", count: {$sum: 1}}}])
```

Both should match. If they don't, do NOT proceed to cutover.

**Step 3: After 1 week clean reads — disable MongoDB writes**

In `OrderService.createOrder()`, remove the dual-write try/catch block (stop writing to MongoDB).

**Step 4: Commit**

```bash
git commit -m "feat(db): switch order reads to PostgreSQL, remove MongoDB writes for orders (cutover complete)"
```

---

## Execution Timeline

| Week | Action |
|------|--------|
| Week 1 | Tasks 2.1–2.4: PostgreSQL up, users dual-write |
| Week 2 | Tasks 2.5–2.7: Orders, payments, logistics dual-write |
| Week 3 | Task 2.8: Run migration script for historical data |
| Week 4 | Verify consistency, spot-check 20+ records manually |
| Week 5 | Task 2.9: Cutover reads to PostgreSQL for one service (orders) |
| Week 6 | Cutover remaining services |
| Week 7 | Stop MongoDB writes, drop migrated collections |

**This is the slowest phase intentionally.** Financial data migration cannot be rushed.

## MongoDB Collections Being KEPT (do not touch these)

- `stores`, `menu_items`, `driver_locations`, `reviews`, `campaigns`, `templates`, `user_preferences`, `kitchen_equipment`, `customer_loyalty_history`, `customer_preferences`

These services do NOT get JPA/PostgreSQL added to them.
