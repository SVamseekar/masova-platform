# Database Migration Implementation Plan: MongoDB → PostgreSQL + MongoDB + Redis

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate MaSoVa from a single MongoDB database to a polyglot architecture: PostgreSQL for financial/relational data, MongoDB for flexible-schema data, Redis for ephemeral/real-time data.

**Architecture:** 4-phase zero-downtime migration. Phase 1 adds PostgreSQL (dual-write). Phase 2 switches reads to PostgreSQL. Phase 3 cuts over. Phase 4 removes MongoDB for migrated collections. Each phase is independently deployable and reversible.

**Tech Stack:** Spring Boot 3, Spring Data JPA, Spring Data MongoDB, PostgreSQL 16, MongoDB (existing), Redis (existing), Flyway (migrations), Docker Compose (Dell infrastructure)

**Execution Order:** PostgreSQL setup → shared-models DTOs → core-service users/stores → core-service customers → commerce-service orders → payment-service → logistics-service delivery → logistics-service inventory → intelligence-service read layer

---

## Prerequisites

Read the design doc first:
- `docs/plans/2026-03-02-database-architecture-design.md`

Dell infrastructure:
- Docker Compose at project root
- Add PostgreSQL container alongside existing MongoDB, Redis, RabbitMQ
- PostgreSQL connection: `jdbc:postgresql://localhost:5432/masova_db`

---

## Task 1: Add PostgreSQL to Docker Compose

**Files:**
- Modify: `docker-compose.yml` (in project root)

**Step 1: Read current docker-compose.yml**

Before modifying, read the file to understand existing services.

**Step 2: Add PostgreSQL service**

Add to `docker-compose.yml`:
```yaml
  postgres:
    image: postgres:16-alpine
    container_name: masova-postgres
    environment:
      POSTGRES_DB: masova_db
      POSTGRES_USER: masova
      POSTGRES_PASSWORD: masova_dev_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U masova -d masova_db"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
    # (add to existing volumes section if it exists)
```

**Step 3: Start PostgreSQL on Dell**
```
docker compose up -d postgres
docker compose ps
```
Expected: `masova-postgres` container is `Up (healthy)`.

**Step 4: Verify connection**
```
docker exec -it masova-postgres psql -U masova -d masova_db -c "\l"
```
Expected: lists databases including `masova_db`.

**Step 5: Commit**
```bash
git add docker-compose.yml
git commit -m "infra: add PostgreSQL 16 to Docker Compose"
```

---

## Task 2: Add Flyway + PostgreSQL Dependencies to Each Service

**Files:**
- Modify: `core-service/pom.xml`
- Modify: `commerce-service/pom.xml`
- Modify: `payment-service/pom.xml`
- Modify: `logistics-service/pom.xml`

**Step 1: Add dependencies to each service's pom.xml**

Add to the `<dependencies>` section of each service:
```xml
<!-- PostgreSQL -->
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

> Note: `spring-boot-starter-data-jpa` pulls in Hibernate. This will conflict with existing `spring-boot-starter-data-mongodb` if both try to create an `EntityManagerFactory` for the same `@Entity` classes. Use separate packages (step 3 below resolves this).

**Step 2: Add configuration to application.yml for each service**

Add PostgreSQL datasource alongside existing MongoDB config in each `application.yml`:
```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/masova_db
    username: masova
    password: masova_dev_password
    driver-class-name: org.postgresql.Driver
  jpa:
    hibernate:
      ddl-auto: validate  # Flyway manages schema, Hibernate only validates
    show-sql: false
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
        default_schema: public
  flyway:
    enabled: true
    locations: classpath:db/migration
    baseline-on-migrate: true
```

**Step 3: Configure dual-database Spring setup**

Each service will have both `MongoRepository` and `JpaRepository`. Spring needs explicit config to avoid conflicts.

Create `PostgresConfig.java` in each service's `config/` package:
```java
@Configuration
@EnableJpaRepositories(
    basePackages = "com.MaSoVa.{service}.*.repository.jpa",
    entityManagerFactoryRef = "postgresEntityManagerFactory",
    transactionManagerRef = "postgresTransactionManager"
)
public class PostgresConfig {
    @Primary
    @Bean
    @ConfigurationProperties("spring.datasource")
    public DataSource dataSource() {
        return DataSourceBuilder.create().build();
    }

    @Primary
    @Bean
    public LocalContainerEntityManagerFactoryBean postgresEntityManagerFactory(
        DataSource dataSource, JpaProperties jpaProperties
    ) {
        // standard JPA config
    }

    @Primary
    @Bean
    public PlatformTransactionManager postgresTransactionManager(...) { ... }
}
```

Create `MongoConfig.java` to keep MongoDB repositories in their existing packages:
```java
@Configuration
@EnableMongoRepositories(
    basePackages = "com.MaSoVa.{service}.*.repository.mongo"
)
public class MongoConfig { }
```

This means: existing MongoDB repositories move to a `.repository.mongo` package; new JPA repositories go in `.repository.jpa`.

**Step 4: Verify Maven compiles**
```
mvn compile "-Dmaven.test.skip=true"
```
Expected: `BUILD SUCCESS`

**Step 5: Commit**
```bash
git add core-service/pom.xml commerce-service/pom.xml payment-service/pom.xml logistics-service/pom.xml
git add core-service/src/main/resources/application.yml  # (etc for each service)
git commit -m "feat: add PostgreSQL/JPA/Flyway dependencies to all services"
```

---

## Task 3: Create Flyway Migration — Users Schema

**Files:**
- Create: `core-service/src/main/resources/db/migration/V1__create_users_schema.sql`

**Step 1: Create the migration file**

Copy the exact DDL from the design doc into this file:
```sql
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type          VARCHAR(20) NOT NULL CHECK (type IN ('CUSTOMER','STAFF','MANAGER','DRIVER','KIOSK','ADMIN')),
  name          VARCHAR(255) NOT NULL,
  email         VARCHAR(255) UNIQUE,
  phone         VARCHAR(20) UNIQUE,
  password_hash VARCHAR(255),
  store_id      UUID,  -- note: stores stays in MongoDB, so no FK constraint here
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

CREATE TABLE user_auth_providers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider    VARCHAR(50) NOT NULL,
  provider_id VARCHAR(255) NOT NULL,
  email       VARCHAR(255),
  UNIQUE (provider, provider_id)
);
```

> Note on store_id: `stores` collection stays in MongoDB. So `store_id` in PostgreSQL tables is a logical reference (UUID stored as string), not a foreign key with constraint. Do NOT add `REFERENCES stores(id)` — there is no PostgreSQL `stores` table.

**Step 2: Run Flyway migration on Dell**

Start core-service and Flyway will auto-run on startup:
```
mvn spring-boot:run "-Dmaven.test.skip=true"
```
Or run manually:
```
docker exec -it masova-postgres psql -U masova -d masova_db -c "\dt"
```
Expected: `users` and `user_auth_providers` tables exist.

**Step 3: Commit**
```bash
git add core-service/src/main/resources/db/migration/V1__create_users_schema.sql
git commit -m "feat: Flyway V1 — users and auth_providers schema"
```

---

## Task 4: Create JPA Entity for Users

**Files:**
- Create: `core-service/src/main/java/com/MaSoVa/core/user/entity/jpa/UserEntity.java`
- Create: `core-service/src/main/java/com/MaSoVa/core/user/repository/jpa/UserJpaRepository.java`

**Step 1: Create the JPA entity**

```java
@Entity
@Table(name = "users")
@EntityListeners(AuditingEntityListener.class)
public class UserEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 20)
    private String type;

    @Column(nullable = false)
    private String name;

    @Column(unique = true)
    private String email;

    @Column(unique = true)
    private String phone;

    @Column(name = "password_hash")
    private String passwordHash;

    @Column(name = "store_id")
    private UUID storeId;  // logical reference to MongoDB stores

    private String role;

    @Column(nullable = false, length = 20)
    private String status = "ACTIVE";

    @Column(name = "is_online")
    private Boolean isOnline = false;

    @Column(name = "pin_hash")
    private String pinHash;

    @Column(name = "pin_suffix")
    private String pinSuffix;

    @Column(name = "vehicle_type")
    private String vehicleType;

    @Column(name = "license_no")
    private String licenseNo;

    @Column(name = "is_kiosk")
    private Boolean isKiosk = false;

    @Column(name = "terminal_id")
    private String terminalId;

    @Column(name = "active_delivery_count")
    private Integer activeDeliveryCount = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "last_login")
    private OffsetDateTime lastLogin;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    // getters and setters
}
```

**Step 2: Create the JPA repository**

```java
@Repository
public interface UserJpaRepository extends JpaRepository<UserEntity, UUID> {
    Optional<UserEntity> findByEmail(String email);
    Optional<UserEntity> findByPhone(String phone);
    List<UserEntity> findByTypeAndStoreId(String type, UUID storeId);
    List<UserEntity> findByTypeAndIsOnline(String type, Boolean isOnline);
}
```

**Step 3: Compile**
```
mvn compile "-Dmaven.test.skip=true"
```
Expected: `BUILD SUCCESS`

**Step 4: Commit**
```bash
git add core-service/src/main/java/com/MaSoVa/core/user/entity/jpa/
git add core-service/src/main/java/com/MaSoVa/core/user/repository/jpa/
git commit -m "feat: add UserEntity JPA entity and UserJpaRepository"
```

---

## Task 5: Dual-Write Users to PostgreSQL (Phase 1)

**Files:**
- Modify: `core-service/src/main/java/com/MaSoVa/core/user/service/UserService.java`

**Step 1: Inject both repositories**

```java
@Service
public class UserService {
    private final UserMongoRepository userMongoRepo;  // existing
    private final UserJpaRepository userJpaRepo;       // new

    public UserService(UserMongoRepository userMongoRepo, UserJpaRepository userJpaRepo) {
        this.userMongoRepo = userMongoRepo;
        this.userJpaRepo = userJpaRepo;
    }
}
```

**Step 2: Add dual-write to create/update methods**

In `createUser()`:
```java
public UserDto createUser(CreateUserRequest request) {
    // Existing MongoDB write (unchanged)
    User mongoUser = userMongoRepo.save(mapToMongoUser(request));

    // New PostgreSQL write (best-effort — don't fail MongoDB on PG error)
    try {
        UserEntity pgUser = mapToJpaUser(request, mongoUser.getId());
        userJpaRepo.save(pgUser);
    } catch (Exception e) {
        log.warn("PostgreSQL dual-write failed for user {}: {}", mongoUser.getId(), e.getMessage());
        // Do not rethrow — MongoDB is still source of truth
    }

    return mapToDto(mongoUser);
}
```

Apply same pattern to `updateUser()` and `deleteUser()`.

**Step 3: Write a migration helper to backfill existing users**

Create `UserMigrationService.java`:
```java
@Service
@Profile("migration")  // only runs when migration profile is active
public class UserMigrationService {

    @EventListener(ApplicationReadyEvent.class)
    public void migrateUsers() {
        List<User> allMongoUsers = userMongoRepo.findAll();
        int migrated = 0;
        for (User u : allMongoUsers) {
            if (!userJpaRepo.existsByEmail(u.getEmail())) {
                try {
                    userJpaRepo.save(mapToJpaUser(u));
                    migrated++;
                } catch (Exception e) {
                    log.error("Migration failed for user {}: {}", u.getId(), e.getMessage());
                }
            }
        }
        log.info("User migration complete: {} users migrated to PostgreSQL", migrated);
    }
}
```

**Step 4: Run migration once**

On Dell, start core-service with migration profile:
```
mvn spring-boot:run "-Dmaven.test.skip=true" "-Dspring-boot.run.profiles=migration"
```
Expected log: `User migration complete: N users migrated to PostgreSQL`

**Step 5: Verify**
```
docker exec -it masova-postgres psql -U masova -d masova_db -c "SELECT count(*) FROM users;"
```
Expected: count matches MongoDB users collection.

**Step 6: Commit**
```bash
git add core-service/src/main/java/com/MaSoVa/core/user/service/UserService.java
git add core-service/src/main/java/com/MaSoVa/core/user/service/UserMigrationService.java
git commit -m "feat: dual-write users to PostgreSQL (Phase 1 — MongoDB still source of truth)"
```

---

## Task 6: Flyway Migrations — Customers, Orders, Payments Schemas

**Files:**
- Create: `core-service/src/main/resources/db/migration/V2__create_customers_schema.sql`
- Create: `commerce-service/src/main/resources/db/migration/V1__create_orders_schema.sql`
- Create: `payment-service/src/main/resources/db/migration/V1__create_transactions_schema.sql`

**Step 1: Create V2__create_customers_schema.sql for core-service**

Copy the customers DDL from the design doc (customers, customer_addresses, customer_store_memberships, customer_tags, loyalty_transactions tables).

**Step 2: Create V1__create_orders_schema.sql for commerce-service**

Copy the orders DDL from the design doc (orders, order_items, order_quality_checkpoints tables).

> Note: `orders.payment_transaction_id` references `transactions(id)` in the design doc. Since `transactions` is in payment-service's PostgreSQL and both services share the same PostgreSQL database (`masova_db`), the FK constraint works. If services have separate databases, remove the FK and make it a logical reference.

**Step 3: Create V1__create_transactions_schema.sql for payment-service**

Copy the transactions and refunds DDL from the design doc.

**Step 4: Run all migrations**

Start each service on Dell (they will auto-run Flyway on startup):
```
# In separate terminals:
mvn spring-boot:run "-Dmaven.test.skip=true"  # from core-service/
mvn spring-boot:run "-Dmaven.test.skip=true"  # from commerce-service/
mvn spring-boot:run "-Dmaven.test.skip=true"  # from payment-service/
```

**Step 5: Verify**
```
docker exec -it masova-postgres psql -U masova -d masova_db -c "\dt"
```
Expected: all tables from V1, V2 migrations visible.

**Step 6: Commit**
```bash
git add core-service/src/main/resources/db/migration/V2__create_customers_schema.sql
git add commerce-service/src/main/resources/db/migration/V1__create_orders_schema.sql
git add payment-service/src/main/resources/db/migration/V1__create_transactions_schema.sql
git commit -m "feat: Flyway migrations for customers, orders, transactions schemas"
```

---

## Task 7: Flyway Migrations — Delivery, Sessions, Inventory Schemas

**Files:**
- Create: `logistics-service/src/main/resources/db/migration/V1__create_delivery_schema.sql`
- Create: `logistics-service/src/main/resources/db/migration/V2__create_inventory_schema.sql`
- Create: `core-service/src/main/resources/db/migration/V3__create_sessions_schema.sql`

**Step 1: Create delivery migration**

Copy delivery_trackings DDL from design doc.

**Step 2: Create inventory migration**

Copy suppliers, supplier_categories, inventory_items, purchase_orders, purchase_order_items, waste_records DDL from design doc.

**Step 3: Create sessions migration**

Copy shifts, working_sessions, session_violations DDL from design doc.

**Step 4: Also create remaining core-service tables**

Create `V4__create_notifications_schema.sql`:
- notifications table

Create `V5__create_gdpr_schema.sql`:
- gdpr_consents, gdpr_data_requests, gdpr_audit_logs tables

Create `V6__create_review_responses_schema.sql`:
- review_responses table

**Step 5: Run all migrations and verify**
```
docker exec -it masova-postgres psql -U masova -d masova_db -c "\dt" | wc -l
```
Expected: all 22+ tables exist.

**Step 6: Commit**
```bash
git add logistics-service/src/main/resources/db/migration/
git add core-service/src/main/resources/db/migration/V3__create_sessions_schema.sql
git add core-service/src/main/resources/db/migration/V4__create_notifications_schema.sql
git add core-service/src/main/resources/db/migration/V5__create_gdpr_schema.sql
git add core-service/src/main/resources/db/migration/V6__create_review_responses_schema.sql
git commit -m "feat: Flyway migrations for delivery, sessions, inventory, notifications, GDPR schemas"
```

---

## Task 8: Dual-Write Orders to PostgreSQL (Phase 1 — Commerce Service)

**Files:**
- Create: `commerce-service/src/main/java/com/MaSoVa/commerce/order/entity/jpa/OrderEntity.java`
- Create: `commerce-service/src/main/java/com/MaSoVa/commerce/order/entity/jpa/OrderItemEntity.java`
- Create: `commerce-service/src/main/java/com/MaSoVa/commerce/order/repository/jpa/OrderJpaRepository.java`
- Modify: `commerce-service/src/main/java/com/MaSoVa/commerce/order/service/OrderService.java`

**Step 1: Create OrderEntity**

Follow same pattern as UserEntity in Task 4. Map all fields from the orders table DDL in the design doc. Include:
- `@OneToMany(cascade = CascadeType.ALL) List<OrderItemEntity> items`
- All timestamp fields (receivedAt, preparingStartedAt, readyAt, etc.)

**Step 2: Create OrderItemEntity**

```java
@Entity
@Table(name = "order_items")
public class OrderItemEntity {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private OrderEntity order;

    @Column(name = "menu_item_id", nullable = false)
    private String menuItemId;  // MongoDB ObjectId reference as String

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "unit_price", nullable = false)
    private BigDecimal unitPrice;

    @Column(name = "total_price", nullable = false)
    private BigDecimal totalPrice;

    private String variant;
    private String customizations;  // JSON string
}
```

**Step 3: Add dual-write to OrderService**

Same pattern as UserService — write to MongoDB first (existing), then PostgreSQL as best-effort:
```java
public OrderDto createOrder(CreateOrderRequest request) {
    Order mongoOrder = orderMongoRepo.save(mapToMongoOrder(request));

    try {
        OrderEntity pgOrder = mapToJpaOrder(request, mongoOrder.getId().toString());
        orderJpaRepo.save(pgOrder);
    } catch (Exception e) {
        log.warn("PostgreSQL dual-write failed for order {}: {}", mongoOrder.getId(), e.getMessage());
    }

    return mapToDto(mongoOrder);
}
```

**Step 4: Add order migration backfill**

Create `OrderMigrationService.java` (same pattern as UserMigrationService) with `@Profile("migration")`.

Run migration once:
```
mvn spring-boot:run "-Dmaven.test.skip=true" "-Dspring-boot.run.profiles=migration"
```

**Step 5: Commit**
```bash
git add commerce-service/src/main/java/com/MaSoVa/commerce/order/entity/jpa/
git add commerce-service/src/main/java/com/MaSoVa/commerce/order/repository/jpa/
git add commerce-service/src/main/java/com/MaSoVa/commerce/order/service/OrderService.java
git commit -m "feat: dual-write orders to PostgreSQL (Phase 1)"
```

---

## Task 9: Dual-Write Payments and Transactions (Phase 1 — Payment Service)

**Files:**
- Create: `payment-service/src/main/java/com/MaSoVa/payment/entity/jpa/TransactionEntity.java`
- Create: `payment-service/src/main/java/com/MaSoVa/payment/entity/jpa/RefundEntity.java`
- Create: `payment-service/src/main/java/com/MaSoVa/payment/repository/jpa/TransactionJpaRepository.java`
- Create: `payment-service/src/main/java/com/MaSoVa/payment/repository/jpa/RefundJpaRepository.java`
- Modify: `payment-service/src/main/java/com/MaSoVa/payment/service/PaymentService.java`

**Step 1: Create TransactionEntity and RefundEntity**

Map all fields from the transactions and refunds DDL in the design doc. Note:
- `amount` is `BIGINT` (paise, not rupees) — use `Long` in Java, not `BigDecimal`
- `razorpaySignature` is `VARCHAR(500)` — could be long

**Step 2: Add dual-write to PaymentService**

This service handles real money. Extra care required:

```java
@Transactional  // PostgreSQL transaction
public TransactionDto recordPayment(PaymentRequest request) {
    // 1. Write to PostgreSQL FIRST (ACID guaranteed)
    TransactionEntity pgTx = transactionJpaRepo.save(mapToJpa(request));

    // 2. Write to MongoDB (best-effort backup during migration phase)
    try {
        transactionMongoRepo.save(mapToMongo(request, pgTx.getId()));
    } catch (Exception e) {
        log.warn("MongoDB dual-write failed for transaction {}: {}", pgTx.getId(), e.getMessage());
        // MongoDB failure is acceptable — PostgreSQL is now source of truth for payments
    }

    return mapToDto(pgTx);
}
```

> Note: Unlike other services, **payment-service flips immediately** — PostgreSQL is source of truth from day one for new transactions. MongoDB is the backup, not the primary. This is the financially safe decision.

**Step 3: Update PaymentService reads to use PostgreSQL**

For payment-service, immediately read from PostgreSQL (not dual-read):
```java
public TransactionDto getTransaction(String id) {
    return transactionJpaRepo.findById(UUID.fromString(id))
        .map(this::mapToDto)
        .orElseThrow(() -> new NotFoundException("Transaction not found: " + id));
}
```

**Step 4: Run transaction history migration**

Backfill existing MongoDB transactions to PostgreSQL using a migration service.

**Step 5: Commit**
```bash
git add payment-service/src/main/java/com/MaSoVa/payment/entity/jpa/
git add payment-service/src/main/java/com/MaSoVa/payment/repository/jpa/
git add payment-service/src/main/java/com/MaSoVa/payment/service/PaymentService.java
git commit -m "feat: payment-service writes to PostgreSQL as primary, MongoDB as backup (Phase 1+2 combined)"
```

---

## Task 10: Phase 2 — Switch Reads to PostgreSQL (Users + Customers)

**Files:**
- Modify: `core-service/src/main/java/com/MaSoVa/core/user/service/UserService.java`
- Modify: `core-service/src/main/java/com/MaSoVa/core/customer/service/CustomerService.java`

**Step 1: Switch UserService reads to PostgreSQL**

Change all `userMongoRepo.find*()` calls to `userJpaRepo.find*()`:
```java
public UserDto getUser(String id) {
    // Phase 2: read from PostgreSQL
    return userJpaRepo.findById(UUID.fromString(id))
        .map(this::mapToDto)
        .orElseThrow(() -> new NotFoundException("User not found: " + id));
}

public List<UserDto> findUsers(String type, String storeId, Boolean available) {
    // Phase 2: read from PostgreSQL
    return userJpaRepo.findByTypeAndStoreId(type, UUID.fromString(storeId)).stream()
        .map(this::mapToDto)
        .collect(toList());
}
```

**Step 2: Verify consistency**

Run a consistency check: compare MongoDB user count vs PostgreSQL user count:
```
docker exec -it masova-postgres psql -U masova -d masova_db -c "SELECT count(*) FROM users;"
```
Compare with:
```
node -e "const {MongoClient} = require('mongodb'); ..."
```
Counts must match before switching reads.

**Step 3: Keep MongoDB writes for now (safety)**

Do NOT remove MongoDB writes yet. Continue dual-writing. Only reads are switched.

**Step 4: Compile and test**
```
mvn compile "-Dmaven.test.skip=true"
node scripts/test-api-full.js 2>&1 | grep -E "users|customers" | tail -20
```

**Step 5: Commit**
```bash
git add core-service/src/main/java/com/MaSoVa/core/user/service/UserService.java
git add core-service/src/main/java/com/MaSoVa/core/customer/service/CustomerService.java
git commit -m "feat: Phase 2 — switch users/customers reads to PostgreSQL"
```

---

## Task 11: Phase 2 — Switch Reads to PostgreSQL (Orders + Delivery)

**Files:**
- Modify: `commerce-service/src/main/java/com/MaSoVa/commerce/order/service/OrderService.java`
- Modify: `logistics-service/src/main/java/com/MaSoVa/logistics/delivery/service/TrackingService.java`

**Step 1: Switch OrderService reads to PostgreSQL**

```java
public OrderDto getOrder(String id) {
    return orderJpaRepo.findById(UUID.fromString(id))
        .map(this::mapToDto)
        .orElseThrow(() -> new NotFoundException("Order not found: " + id));
}

public Page<OrderDto> getOrders(OrderFilter filter, Pageable pageable) {
    // Use JPA Specification for dynamic filtering
    return orderJpaRepo.findAll(OrderSpecification.from(filter), pageable)
        .map(this::mapToDto);
}
```

Create `OrderSpecification.java` for dynamic WHERE clause building.

**Step 2: Add JPA Specification for dynamic order queries**

```java
public class OrderSpecification {
    public static Specification<OrderEntity> from(OrderFilter filter) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (filter.getStoreId() != null)
                predicates.add(cb.equal(root.get("storeId"), filter.getStoreId()));
            if (filter.getStatus() != null)
                predicates.add(cb.equal(root.get("status"), filter.getStatus()));
            if (filter.getCustomerId() != null)
                predicates.add(cb.equal(root.get("customerId"), filter.getCustomerId()));
            // ... add other filters
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
```

**Step 3: Switch delivery reads to PostgreSQL**

Similar pattern for TrackingService — switch `findById` and `findByDriverId` to JPA repository.

**Step 4: Run full test suite**
```
node scripts/test-api-full.js
```

**Step 5: Commit**
```bash
git add commerce-service/src/main/java/com/MaSoVa/commerce/order/
git add logistics-service/src/main/java/com/MaSoVa/logistics/delivery/service/
git commit -m "feat: Phase 2 — switch orders/delivery reads to PostgreSQL"
```

---

## Task 12: Phase 3 — Cut Over (Stop MongoDB Writes for Migrated Collections)

> ⚠️ **Only proceed after verifying data consistency for at least 1 week of dual-write. Check daily counts match.**

**Files:**
- Modify: All services' service layer files that have dual-write

**Step 1: Verify consistency before cut over**

Run this check for each migrated collection:
```
docker exec -it masova-postgres psql -U masova -d masova_db \
  -c "SELECT count(*) FROM users; SELECT count(*) FROM orders; SELECT count(*) FROM transactions;"
```
Compare against MongoDB collection counts via:
```
docker exec -it masova-mongodb mongosh masova_db --eval "db.users.countDocuments(); db.orders.countDocuments();"
```

**Step 2: Remove MongoDB writes from service layer**

For each service, remove the `try { mongoRepo.save(...) } catch { }` blocks that were writing to MongoDB.

Leave only PostgreSQL writes. Example for UserService:
```java
public UserDto createUser(CreateUserRequest request) {
    UserEntity pgUser = userJpaRepo.save(mapToJpaUser(request));
    // No more MongoDB write
    return mapToDto(pgUser);
}
```

**Step 3: Compile all services**
```
mvn compile "-Dmaven.test.skip=true"  # run in each service directory
```

**Step 4: Run full integration test**
```
node scripts/test-api-full.js
```
Expected: all 125 endpoints pass (or same pass rate as before cut over).

**Step 5: Commit**
```bash
git add core-service/ commerce-service/ payment-service/ logistics-service/
git commit -m "feat: Phase 3 — cut over, stop MongoDB writes for migrated collections"
```

---

## Task 13: Phase 4 — Remove Migrated Collections from MongoDB

> ⚠️ **Only proceed after running Phase 3 for at least 2 weeks with zero issues.**

**Files:**
- Modify: All service `MongoRepository` interfaces for migrated collections
- Modify: All service entity classes for migrated collections

**Step 1: Delete MongoDB entity files for migrated collections**

Remove (or archive) MongoDB entity/repository files for:
- `core-service`: `User.java` (Mongo entity), `UserMongoRepository.java`
- `commerce-service`: `Order.java` (Mongo entity), `OrderMongoRepository.java`
- `payment-service`: Transaction/Refund Mongo entities and repos
- `logistics-service`: DeliveryTracking Mongo entity and repo

> **Keep** MongoDB entities for: stores, menu_items, driver_locations, reviews, campaigns, templates, user_preferences, kitchen_equipment — these stay in MongoDB.

**Step 2: Remove migration service classes**

Delete all `*MigrationService.java` files (they ran once, no longer needed).

**Step 3: Final compile and test**
```
mvn compile "-Dmaven.test.skip=true"
node scripts/test-api-full.js
```

**Step 4: Drop migrated collections from MongoDB**

On Dell MongoDB:
```
docker exec -it masova-mongodb mongosh masova_db --eval "
  db.users.drop();
  db.orders.drop();
  db.transactions.drop();
  db.refunds.drop();
  db.customers.drop();
  db.delivery_trackings.drop();
  db.shifts.drop();
  db.working_sessions.drop();
  db.notifications.drop();
  db.inventory_items.drop();
  db.suppliers.drop();
  db.purchase_orders.drop();
  db.waste_records.drop();
  db.gdpr_consents.drop();
  db.gdpr_data_requests.drop();
  db.gdpr_audit_logs.drop();
  db.review_responses.drop();
"
```

**Step 5: Final commit**
```bash
git add .
git commit -m "feat: Phase 4 — remove migrated MongoDB collections, polyglot migration complete"
```

---

## Task 14: Add Redis Keys for Driver Status and OTP

**Files:**
- Modify: `logistics-service/src/main/java/com/MaSoVa/logistics/delivery/service/DispatchService.java`
- Create: `logistics-service/src/main/java/com/MaSoVa/logistics/delivery/service/DriverStatusService.java`

**Step 1: Create DriverStatusService using Redis**

```java
@Service
public class DriverStatusService {
    private static final String DRIVER_ONLINE_KEY = "driver:online:";
    private static final Duration DRIVER_TTL = Duration.ofMinutes(5);

    private final RedisTemplate<String, String> redisTemplate;

    public void setDriverOnline(String driverId) {
        redisTemplate.opsForValue().set(DRIVER_ONLINE_KEY + driverId, "online", DRIVER_TTL);
    }

    public void setDriverOffline(String driverId) {
        redisTemplate.delete(DRIVER_ONLINE_KEY + driverId);
    }

    public boolean isDriverOnline(String driverId) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(DRIVER_ONLINE_KEY + driverId));
    }

    public void heartbeat(String driverId) {
        redisTemplate.expire(DRIVER_ONLINE_KEY + driverId, DRIVER_TTL);
    }
}
```

**Step 2: Add OTP storage to Redis**

In the delivery OTP flow, store OTP in Redis instead of (or alongside) the orders table:
```java
private static final String OTP_KEY = "otp:";
private static final Duration OTP_TTL = Duration.ofMinutes(30);

public String generateOtp(String orderId) {
    String otp = String.format("%06d", random.nextInt(1000000));
    redisTemplate.opsForValue().set(OTP_KEY + orderId, otp, OTP_TTL);
    return otp;
}

public boolean verifyOtp(String orderId, String providedOtp) {
    String storedOtp = (String) redisTemplate.opsForValue().get(OTP_KEY + orderId);
    if (storedOtp != null && storedOtp.equals(providedOtp)) {
        redisTemplate.delete(OTP_KEY + orderId);  // one-time use
        return true;
    }
    return false;
}
```

**Step 3: Compile and test**
```
mvn compile "-Dmaven.test.skip=true"
```

**Step 4: Commit**
```bash
git add logistics-service/src/main/java/com/MaSoVa/logistics/delivery/service/DriverStatusService.java
git add logistics-service/src/main/java/com/MaSoVa/logistics/delivery/service/
git commit -m "feat: add Redis-backed driver online status and OTP storage"
```

---

## Task 15: Update test-api-full.js for New DB Architecture

**Files:**
- Modify: `scripts/test-api-full.js`

After database migration, the test suite behaviour doesn't change (same HTTP endpoints). But verify:

**Step 1: Run full suite post-migration**
```
node scripts/test-api-full.js
```

**Step 2: Fix any failures**

Common migration-related failures:
- UUID format: MongoDB uses `ObjectId` strings, PostgreSQL uses UUID. Check any hardcoded IDs in tests.
- Date format: MongoDB returns ISO strings, PostgreSQL returns different formats. Check date comparison logic.
- Nested objects: MongoDB documents have nested structures; JPA DTOs are flat. Verify response shape matches what tests expect.

**Step 3: Commit any fixes**
```bash
git add scripts/test-api-full.js
git commit -m "fix: update test-api-full.js for polyglot DB response formats"
```

---

## Rollback Plan

Each phase is independently reversible:

- **Phase 1 (dual-write):** Remove JPA repositories and PostgreSQL writes. MongoDB still has all data. Zero data loss.
- **Phase 2 (read switch):** Switch reads back to MongoDB. No data loss since both were being written.
- **Phase 3 (cut over):** Re-enable MongoDB writes. Historical gap filled by PostgreSQL; MongoDB will be behind but can catch up.
- **Phase 4 (collection drop):** Before dropping any collection, take a MongoDB dump:
  ```
  docker exec masova-mongodb mongodump --db masova_db --out /tmp/masova_backup_$(date +%Y%m%d)
  ```

## Monitoring Checklist

Before each phase transition, verify:
- [ ] Row counts match between PostgreSQL and MongoDB for all migrated collections
- [ ] No errors in Spring logs for dual-write operations
- [ ] All test-api-full.js tests pass
- [ ] Payment transactions reconcile (₹ totals match between databases)
- [ ] No foreign key violations in PostgreSQL (`SELECT * FROM information_schema.table_constraints WHERE constraint_type = 'FOREIGN KEY'`)
