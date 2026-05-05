# Global-6: Delivery Aggregator Hub — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add manual aggregator order tracking (Wolt, Deliveroo, Just Eat, Uber Eats) so managers can enter aggregator orders via POS, see them in KDS with source badges, filter them in Order Management, and analyse platform P&L — all without touching delivery radius or payment processing.

**Architecture:** `orderSource` and `aggregatorOrderId`/`aggregatorCommission`/`aggregatorNetPayout` added to the `Order` entity (MongoDB) and `orders_jpa` table (PostgreSQL via Flyway). A new `AggregatorConnectionJpaEntity` table persists per-store commission % per platform. `AggregatorOrderReceivedEvent` is published to `masova.orders.events` for intelligence-service to consume for P&L analytics. Frontend grows two new manager pages (`AggregatorHubPage`, `PlatformPnLPage`) and targeted changes to POSSystem source selector, KDS badges, and `OrderManagementPage` filter.

**Tech Stack:** Java 21 / Spring Boot 3 / MongoDB / PostgreSQL + Flyway / RabbitMQ / React 19 / TypeScript / RTK Query / Vitest

---

## File Map

### shared-models
| File | Action | Responsibility |
|---|---|---|
| `shared-models/src/main/java/com/MaSoVa/shared/enums/OrderSource.java` | **Create** | Enum: `MASOVA, WOLT, DELIVEROO, JUST_EAT, UBER_EATS` |
| `shared-models/src/main/java/com/MaSoVa/shared/messaging/events/AggregatorOrderReceivedEvent.java` | **Create** | RabbitMQ event carrying orderId, storeId, orderSource, grossAmount, commission, netPayout |

### commerce-service
| File | Action | Responsibility |
|---|---|---|
| `commerce-service/src/main/java/com/MaSoVa/commerce/order/entity/Order.java` | **Modify** | Add `orderSource`, `aggregatorOrderId`, `aggregatorCommission`, `aggregatorNetPayout` fields + getters/setters |
| `commerce-service/src/main/java/com/MaSoVa/commerce/order/entity/AggregatorConnection.java` | **Create** | MongoDB document: storeId + platform + commissionPercent |
| `commerce-service/src/main/java/com/MaSoVa/commerce/order/entity/AggregatorConnectionJpaEntity.java` | **Create** | JPA entity mirroring `aggregator_connections` PostgreSQL table |
| `commerce-service/src/main/java/com/MaSoVa/commerce/order/repository/AggregatorConnectionRepository.java` | **Create** | MongoRepository for AggregatorConnection |
| `commerce-service/src/main/java/com/MaSoVa/commerce/order/repository/AggregatorConnectionJpaRepository.java` | **Create** | JpaRepository for AggregatorConnectionJpaEntity |
| `commerce-service/src/main/java/com/MaSoVa/commerce/order/service/AggregatorService.java` | **Create** | Upsert commission config, calculate netPayout, fetch P&L summary per platform |
| `commerce-service/src/main/java/com/MaSoVa/commerce/order/controller/AggregatorController.java` | **Create** | REST endpoints for commission config CRUD + P&L query |
| `commerce-service/src/main/java/com/MaSoVa/commerce/order/dto/CreateOrderRequest.java` | **Modify** | Add `orderSource` (default `MASOVA`), `aggregatorOrderId` optional fields |
| `commerce-service/src/main/java/com/MaSoVa/commerce/order/service/OrderService.java` | **Modify** | Populate aggregator fields at order creation; skip delivery radius + payment for aggregator orders; publish `AggregatorOrderReceivedEvent` |
| `commerce-service/src/main/java/com/MaSoVa/commerce/order/service/OrderEventPublisher.java` | **Modify** | Add `publishAggregatorOrderReceived()` method |
| `commerce-service/src/main/resources/db/migration/V6__aggregator_order_columns.sql` | **Create** | Add `order_source`, `aggregator_order_id`, `aggregator_commission`, `aggregator_net_payout` to `orders_jpa` |
| `commerce-service/src/main/resources/db/migration/V7__aggregator_connections.sql` | **Create** | Create `aggregator_connections` table |
| `commerce-service/src/test/java/com/MaSoVa/commerce/order/service/AggregatorServiceTest.java` | **Create** | Unit tests: commission upsert, netPayout calculation, P&L aggregation |

### shared-models (RabbitMQ config)
| File | Action | Responsibility |
|---|---|---|
| `shared-models/src/main/java/com/MaSoVa/shared/messaging/config/MaSoVaRabbitMQConfig.java` | **Modify** | Add routing key `order.aggregator.received` and queue `masova.analytics.aggregator-events` |

### intelligence-service
| File | Action | Responsibility |
|---|---|---|
| `intelligence-service/src/main/java/com/MaSoVa/intelligence/messaging/AnalyticsEventListener.java` | **Modify** | Add listener for `AggregatorOrderReceivedEvent` → record platform revenue/commission/net |
| `intelligence-service/src/main/java/com/MaSoVa/intelligence/service/AnalyticsService.java` | **Modify** | Add `recordAggregatorOrderEvent()` method |

### frontend
| File | Action | Responsibility |
|---|---|---|
| `frontend/src/store/api/orderApi.ts` | **Modify** | Add `orderSource` + aggregator fields to `Order` type; add `orderSource` filter param to `getStoreOrders` |
| `frontend/src/store/api/aggregatorApi.ts` | **Create** | RTK Query: commission config CRUD + platform P&L endpoints |
| `frontend/src/apps/POSSystem/components/OrderPanel.tsx` | **Modify** | Add "Order Source" dropdown (MASOVA default) + aggregatorOrderId input that appears for non-MASOVA sources |
| `frontend/src/pages/kitchen/KitchenDisplayPage.tsx` | **Modify** | Add coloured source badge to each KDS ticket (Wolt=teal, Deliveroo=coral, JustEat=orange, UberEats=black) |
| `frontend/src/pages/manager/OrderManagementPage.tsx` | **Modify** | Add `orderSource` filter chip to existing FilterBar |
| `frontend/src/pages/manager/AggregatorHubPage.tsx` | **Create** | Commission settings per platform per store + connection status table |
| `frontend/src/pages/manager/PlatformPnLPage.tsx` | **Create** | Revenue / commission / net / margin per platform; top items per platform; direct vs aggregator margin comparison |
| `frontend/src/pages/manager/ManagerShell.tsx` | **Modify** | Add "Aggregators" tab to orders section nav (renders `AggregatorHubPage`) + "Platform P&L" tab to analytics section |

---

## Task 1: `OrderSource` enum in shared-models

**Files:**
- Create: `shared-models/src/main/java/com/MaSoVa/shared/enums/OrderSource.java`

- [ ] **Step 1: Write the enum**

```java
// shared-models/src/main/java/com/MaSoVa/shared/enums/OrderSource.java
package com.MaSoVa.shared.enums;

public enum OrderSource {
    MASOVA,
    WOLT,
    DELIVEROO,
    JUST_EAT,
    UBER_EATS
}
```

- [ ] **Step 2: Build shared-models to verify compilation**

Run on Dell (PowerShell, from project root):
```powershell
cd shared-models && mvn compile "-Dmaven.test.skip=true"
```
Expected: `BUILD SUCCESS`

- [ ] **Step 3: Commit**

```bash
git add shared-models/src/main/java/com/MaSoVa/shared/enums/OrderSource.java
git commit -m "feat(shared-models): add OrderSource enum for aggregator tracking"
```

---

## Task 2: `AggregatorOrderReceivedEvent` in shared-models

**Files:**
- Create: `shared-models/src/main/java/com/MaSoVa/shared/messaging/events/AggregatorOrderReceivedEvent.java`

- [ ] **Step 1: Write the event class**

```java
package com.MaSoVa.shared.messaging.events;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;
import java.time.Instant;

public class AggregatorOrderReceivedEvent extends DomainEvent {
    private String orderId;
    private String storeId;
    private String orderSource;    // e.g. "WOLT"
    private BigDecimal grossAmount;
    private BigDecimal commissionAmount;
    private BigDecimal netPayout;
    private String currency;

    public AggregatorOrderReceivedEvent() { super("AGGREGATOR_ORDER_RECEIVED"); }

    public AggregatorOrderReceivedEvent(String orderId, String storeId, String orderSource,
                                        BigDecimal grossAmount, BigDecimal commissionAmount,
                                        BigDecimal netPayout, String currency) {
        super("AGGREGATOR_ORDER_RECEIVED");
        this.orderId = orderId;
        this.storeId = storeId;
        this.orderSource = orderSource;
        this.grossAmount = grossAmount;
        this.commissionAmount = commissionAmount;
        this.netPayout = netPayout;
        this.currency = currency;
    }

    @JsonCreator
    public AggregatorOrderReceivedEvent(
            @JsonProperty("eventId") String eventId,
            @JsonProperty("eventType") String eventType,
            @JsonProperty("occurredAt") Instant occurredAt,
            @JsonProperty("orderId") String orderId,
            @JsonProperty("storeId") String storeId,
            @JsonProperty("orderSource") String orderSource,
            @JsonProperty("grossAmount") BigDecimal grossAmount,
            @JsonProperty("commissionAmount") BigDecimal commissionAmount,
            @JsonProperty("netPayout") BigDecimal netPayout,
            @JsonProperty("currency") String currency) {
        super(eventId, eventType, occurredAt);
        this.orderId = orderId;
        this.storeId = storeId;
        this.orderSource = orderSource;
        this.grossAmount = grossAmount;
        this.commissionAmount = commissionAmount;
        this.netPayout = netPayout;
        this.currency = currency;
    }

    public String getOrderId() { return orderId; }
    public String getStoreId() { return storeId; }
    public String getOrderSource() { return orderSource; }
    public BigDecimal getGrossAmount() { return grossAmount; }
    public BigDecimal getCommissionAmount() { return commissionAmount; }
    public BigDecimal getNetPayout() { return netPayout; }
    public String getCurrency() { return currency; }
}
```

- [ ] **Step 2: Build to confirm**

```powershell
cd shared-models && mvn compile "-Dmaven.test.skip=true"
```
Expected: `BUILD SUCCESS`

- [ ] **Step 3: Commit**

```bash
git add shared-models/src/main/java/com/MaSoVa/shared/messaging/events/AggregatorOrderReceivedEvent.java
git commit -m "feat(shared-models): add AggregatorOrderReceivedEvent"
```

---

## Task 3: RabbitMQ routing key + queue for aggregator events

**Files:**
- Modify: `shared-models/src/main/java/com/MaSoVa/shared/messaging/config/MaSoVaRabbitMQConfig.java`

- [ ] **Step 1: Add the routing key constant and queue declaration**

In `MaSoVaRabbitMQConfig.java`, add after the existing routing keys and queue constants:

```java
// Routing key — aggregator
public static final String AGGREGATOR_ORDER_RECEIVED_KEY = "order.aggregator.received";

// Queue — aggregator analytics
public static final String ANALYTICS_AGGREGATOR_QUEUE = "masova.analytics.aggregator-events";
```

Then add a new `@Bean` for the queue (after the `analyticsOrderQueue` bean):

```java
@Bean
public Queue analyticsAggregatorQueue() {
    return QueueBuilder.durable(ANALYTICS_AGGREGATOR_QUEUE)
            .withArgument("x-dead-letter-exchange", DLX)
            .withArgument("x-dead-letter-routing-key", "dlq")
            .build();
}

@Bean
public Binding analyticsAggregatorBinding(Queue analyticsAggregatorQueue, TopicExchange ordersExchange) {
    return BindingBuilder.bind(analyticsAggregatorQueue).to(ordersExchange).with(AGGREGATOR_ORDER_RECEIVED_KEY);
}
```

- [ ] **Step 2: Build shared-models**

```powershell
cd shared-models && mvn compile "-Dmaven.test.skip=true"
```
Expected: `BUILD SUCCESS`

- [ ] **Step 3: Commit**

```bash
git add shared-models/src/main/java/com/MaSoVa/shared/messaging/config/MaSoVaRabbitMQConfig.java
git commit -m "feat(shared-models): add aggregator RabbitMQ routing key and analytics queue"
```

---

## Task 4: Add aggregator fields to `Order` entity

**Files:**
- Modify: `commerce-service/src/main/java/com/MaSoVa/commerce/order/entity/Order.java`

- [ ] **Step 1: Add imports and fields**

Add this import near the top of `Order.java` (after the existing imports):
```java
import com.MaSoVa.shared.enums.OrderSource;
```

Add these fields after the `tipRecipientStaffId` field (around line 139):
```java
// Global-6: Delivery aggregator fields
// orderSource is MASOVA for all direct orders; set to platform for staff-entered aggregator orders
@Indexed
private OrderSource orderSource = OrderSource.MASOVA;   // default — never null

private String aggregatorOrderId;      // Reference number from aggregator platform
private java.math.BigDecimal aggregatorCommission;    // Calculated from configured commission %
private java.math.BigDecimal aggregatorNetPayout;     // grossAmount - aggregatorCommission
```

- [ ] **Step 2: Add getters and setters**

Add after the `getTipRecipientStaffId` / `setTipRecipientStaffId` pair:
```java
public OrderSource getOrderSource() { return orderSource; }
public void setOrderSource(OrderSource orderSource) { this.orderSource = orderSource; }

public String getAggregatorOrderId() { return aggregatorOrderId; }
public void setAggregatorOrderId(String aggregatorOrderId) { this.aggregatorOrderId = aggregatorOrderId; }

public java.math.BigDecimal getAggregatorCommission() { return aggregatorCommission; }
public void setAggregatorCommission(java.math.BigDecimal aggregatorCommission) { this.aggregatorCommission = aggregatorCommission; }

public java.math.BigDecimal getAggregatorNetPayout() { return aggregatorNetPayout; }
public void setAggregatorNetPayout(java.math.BigDecimal aggregatorNetPayout) { this.aggregatorNetPayout = aggregatorNetPayout; }
```

- [ ] **Step 3: Add compound index for orderSource**

In the `@CompoundIndexes` annotation at the top of the class, add:
```java
@CompoundIndex(def = "{'storeId': 1, 'orderSource': 1, 'createdAt': -1}")
```

- [ ] **Step 4: Build commerce-service to verify**

```powershell
cd commerce-service && mvn compile "-Dmaven.test.skip=true"
```
Expected: `BUILD SUCCESS`

- [ ] **Step 5: Commit**

```bash
git add commerce-service/src/main/java/com/MaSoVa/commerce/order/entity/Order.java
git commit -m "feat(commerce): add orderSource + aggregator fields to Order entity"
```

---

## Task 5: Flyway migrations for aggregator columns

**Files:**
- Create: `commerce-service/src/main/resources/db/migration/V6__aggregator_order_columns.sql`
- Create: `commerce-service/src/main/resources/db/migration/V7__aggregator_connections.sql`

- [ ] **Step 1: Write V6**

```sql
-- Global-6: add aggregator fields to orders_jpa
-- order_source: 'MASOVA' for all direct orders (backfill), platform name for aggregator orders
ALTER TABLE commerce_schema.orders
    ADD COLUMN IF NOT EXISTS order_source       VARCHAR(20) NOT NULL DEFAULT 'MASOVA',
    ADD COLUMN IF NOT EXISTS aggregator_order_id   VARCHAR(100),
    ADD COLUMN IF NOT EXISTS aggregator_commission  NUMERIC(10,2),
    ADD COLUMN IF NOT EXISTS aggregator_net_payout  NUMERIC(10,2);

COMMENT ON COLUMN commerce_schema.orders.order_source
    IS 'Originating platform: MASOVA (direct) | WOLT | DELIVEROO | JUST_EAT | UBER_EATS';

CREATE INDEX IF NOT EXISTS idx_orders_order_source
    ON commerce_schema.orders (store_id, order_source, created_at DESC);
```

- [ ] **Step 2: Write V7**

```sql
-- Global-6: aggregator commission configuration per store per platform
CREATE TABLE IF NOT EXISTS commerce_schema.aggregator_connections (
    id                  BIGSERIAL PRIMARY KEY,
    store_id            VARCHAR(255) NOT NULL,
    platform            VARCHAR(20)  NOT NULL,   -- WOLT | DELIVEROO | JUST_EAT | UBER_EATS
    commission_percent  NUMERIC(5,2) NOT NULL,   -- e.g. 30.00
    is_active           BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_aggregator_store_platform UNIQUE (store_id, platform)
);

COMMENT ON TABLE commerce_schema.aggregator_connections
    IS 'Per-store commission % per aggregator platform. Soft-disabled via is_active.';

CREATE INDEX IF NOT EXISTS idx_agg_conn_store
    ON commerce_schema.aggregator_connections (store_id);
```

- [ ] **Step 3: Start commerce-service on Dell and verify migrations apply**

```powershell
cd commerce-service && mvn spring-boot:run "-Dmaven.test.skip=true"
```
Check startup logs for: `Successfully applied 2 migrations to schema "commerce_schema"` (or similar)

- [ ] **Step 4: Commit**

```bash
git add commerce-service/src/main/resources/db/migration/V6__aggregator_order_columns.sql
git add commerce-service/src/main/resources/db/migration/V7__aggregator_connections.sql
git commit -m "feat(commerce): Flyway V6+V7 — aggregator order columns and connections table"
```

---

## Task 6: `AggregatorConnection` entity + repositories

**Files:**
- Create: `commerce-service/src/main/java/com/MaSoVa/commerce/order/entity/AggregatorConnection.java`
- Create: `commerce-service/src/main/java/com/MaSoVa/commerce/order/entity/AggregatorConnectionJpaEntity.java`
- Create: `commerce-service/src/main/java/com/MaSoVa/commerce/order/repository/AggregatorConnectionRepository.java`
- Create: `commerce-service/src/main/java/com/MaSoVa/commerce/order/repository/AggregatorConnectionJpaRepository.java`

- [ ] **Step 1: Create the MongoDB document**

```java
package com.MaSoVa.commerce.order.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;
import com.MaSoVa.shared.enums.OrderSource;

@Document(collection = "aggregator_connections")
@CompoundIndex(def = "{'storeId': 1, 'platform': 1}", unique = true)
public class AggregatorConnection {

    @Id
    private String id;
    private String storeId;
    private OrderSource platform;       // WOLT | DELIVEROO | JUST_EAT | UBER_EATS
    private java.math.BigDecimal commissionPercent;
    private boolean active = true;

    public AggregatorConnection() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getStoreId() { return storeId; }
    public void setStoreId(String storeId) { this.storeId = storeId; }
    public OrderSource getPlatform() { return platform; }
    public void setPlatform(OrderSource platform) { this.platform = platform; }
    public java.math.BigDecimal getCommissionPercent() { return commissionPercent; }
    public void setCommissionPercent(java.math.BigDecimal commissionPercent) { this.commissionPercent = commissionPercent; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}
```

- [ ] **Step 2: Create the JPA entity**

```java
package com.MaSoVa.commerce.order.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "aggregator_connections", schema = "commerce_schema")
public class AggregatorConnectionJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "store_id", nullable = false)
    private String storeId;

    @Column(name = "platform", nullable = false, length = 20)
    private String platform;

    @Column(name = "commission_percent", nullable = false, precision = 5, scale = 2)
    private BigDecimal commissionPercent;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    public Long getId() { return id; }
    public String getStoreId() { return storeId; }
    public void setStoreId(String storeId) { this.storeId = storeId; }
    public String getPlatform() { return platform; }
    public void setPlatform(String platform) { this.platform = platform; }
    public BigDecimal getCommissionPercent() { return commissionPercent; }
    public void setCommissionPercent(BigDecimal commissionPercent) { this.commissionPercent = commissionPercent; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
```

- [ ] **Step 3: Create the MongoDB repository**

```java
package com.MaSoVa.commerce.order.repository;

import com.MaSoVa.commerce.order.entity.AggregatorConnection;
import com.MaSoVa.shared.enums.OrderSource;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface AggregatorConnectionRepository extends MongoRepository<AggregatorConnection, String> {
    List<AggregatorConnection> findByStoreId(String storeId);
    Optional<AggregatorConnection> findByStoreIdAndPlatform(String storeId, OrderSource platform);
}
```

- [ ] **Step 4: Create the JPA repository**

```java
package com.MaSoVa.commerce.order.repository;

import com.MaSoVa.commerce.order.entity.AggregatorConnectionJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AggregatorConnectionJpaRepository extends JpaRepository<AggregatorConnectionJpaEntity, Long> {
    List<AggregatorConnectionJpaEntity> findByStoreId(String storeId);
    Optional<AggregatorConnectionJpaEntity> findByStoreIdAndPlatform(String storeId, String platform);
}
```

- [ ] **Step 5: Build to verify**

```powershell
cd commerce-service && mvn compile "-Dmaven.test.skip=true"
```
Expected: `BUILD SUCCESS`

- [ ] **Step 6: Commit**

```bash
git add commerce-service/src/main/java/com/MaSoVa/commerce/order/entity/AggregatorConnection.java
git add commerce-service/src/main/java/com/MaSoVa/commerce/order/entity/AggregatorConnectionJpaEntity.java
git add commerce-service/src/main/java/com/MaSoVa/commerce/order/repository/AggregatorConnectionRepository.java
git add commerce-service/src/main/java/com/MaSoVa/commerce/order/repository/AggregatorConnectionJpaRepository.java
git commit -m "feat(commerce): add AggregatorConnection entity + repositories (Mongo + JPA)"
```

---

## Task 7: `AggregatorService` — commission config + P&L

**Files:**
- Create: `commerce-service/src/main/java/com/MaSoVa/commerce/order/service/AggregatorService.java`
- Create: `commerce-service/src/test/java/com/MaSoVa/commerce/order/service/AggregatorServiceTest.java`

- [ ] **Step 1: Write the failing tests**

```java
package com.MaSoVa.commerce.order.service;

import com.MaSoVa.commerce.order.entity.AggregatorConnection;
import com.MaSoVa.commerce.order.entity.AggregatorConnectionJpaEntity;
import com.MaSoVa.commerce.order.repository.AggregatorConnectionRepository;
import com.MaSoVa.commerce.order.repository.AggregatorConnectionJpaRepository;
import com.MaSoVa.shared.enums.OrderSource;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AggregatorServiceTest {

    @Mock
    private AggregatorConnectionRepository connectionRepository;
    @Mock
    private AggregatorConnectionJpaRepository connectionJpaRepository;

    @InjectMocks
    private AggregatorService aggregatorService;

    @Test
    void calculateNetPayout_subtractsCommissionPercent() {
        BigDecimal gross = new BigDecimal("100.00");
        BigDecimal commissionPercent = new BigDecimal("30.00");

        BigDecimal net = aggregatorService.calculateNetPayout(gross, commissionPercent);

        assertThat(net).isEqualByComparingTo(new BigDecimal("70.00"));
    }

    @Test
    void calculateCommissionAmount_returnsPercentOfGross() {
        BigDecimal gross = new BigDecimal("80.00");
        BigDecimal commissionPercent = new BigDecimal("25.00");

        BigDecimal commission = aggregatorService.calculateCommissionAmount(gross, commissionPercent);

        assertThat(commission).isEqualByComparingTo(new BigDecimal("20.00"));
    }

    @Test
    void getCommissionPercent_returnsConfiguredPercent_whenConnectionExists() {
        AggregatorConnection conn = new AggregatorConnection();
        conn.setStoreId("store1");
        conn.setPlatform(OrderSource.WOLT);
        conn.setCommissionPercent(new BigDecimal("28.00"));
        when(connectionRepository.findByStoreIdAndPlatform("store1", OrderSource.WOLT))
                .thenReturn(Optional.of(conn));

        BigDecimal percent = aggregatorService.getCommissionPercent("store1", OrderSource.WOLT);

        assertThat(percent).isEqualByComparingTo(new BigDecimal("28.00"));
    }

    @Test
    void getCommissionPercent_returnsZero_whenNoConnectionConfigured() {
        when(connectionRepository.findByStoreIdAndPlatform("store1", OrderSource.DELIVEROO))
                .thenReturn(Optional.empty());

        BigDecimal percent = aggregatorService.getCommissionPercent("store1", OrderSource.DELIVEROO);

        assertThat(percent).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void upsertConnection_savesToBothMongoAndPostgres() {
        when(connectionRepository.findByStoreIdAndPlatform("store1", OrderSource.WOLT))
                .thenReturn(Optional.empty());
        when(connectionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(connectionJpaRepository.findByStoreIdAndPlatform("store1", "WOLT"))
                .thenReturn(Optional.empty());
        when(connectionJpaRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        aggregatorService.upsertConnection("store1", OrderSource.WOLT, new BigDecimal("30.00"));

        verify(connectionRepository).save(any(AggregatorConnection.class));
        verify(connectionJpaRepository).save(any(AggregatorConnectionJpaEntity.class));
    }

    @Test
    void upsertConnection_throwsException_whenPlatformIsMasova() {
        assertThatThrownBy(() ->
            aggregatorService.upsertConnection("store1", OrderSource.MASOVA, new BigDecimal("10.00"))
        ).isInstanceOf(IllegalArgumentException.class)
         .hasMessageContaining("MASOVA");
    }
}
```

- [ ] **Step 2: Run tests — confirm they FAIL (class does not exist yet)**

```powershell
cd commerce-service && mvn test "-Dtest=AggregatorServiceTest" "-Dsurefire.failIfNoSpecifiedTests=false"
```
Expected: compilation failure — `AggregatorService cannot be found`

- [ ] **Step 3: Implement `AggregatorService`**

```java
package com.MaSoVa.commerce.order.service;

import com.MaSoVa.commerce.order.entity.AggregatorConnection;
import com.MaSoVa.commerce.order.entity.AggregatorConnectionJpaEntity;
import com.MaSoVa.commerce.order.repository.AggregatorConnectionJpaRepository;
import com.MaSoVa.commerce.order.repository.AggregatorConnectionRepository;
import com.MaSoVa.shared.enums.OrderSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class AggregatorService {

    private static final Logger log = LoggerFactory.getLogger(AggregatorService.class);

    private final AggregatorConnectionRepository connectionRepository;
    private final AggregatorConnectionJpaRepository connectionJpaRepository;

    public AggregatorService(AggregatorConnectionRepository connectionRepository,
                              AggregatorConnectionJpaRepository connectionJpaRepository) {
        this.connectionRepository = connectionRepository;
        this.connectionJpaRepository = connectionJpaRepository;
    }

    /** Returns configured commission % for a platform at a store. Returns ZERO if not configured. */
    public BigDecimal getCommissionPercent(String storeId, OrderSource platform) {
        return connectionRepository.findByStoreIdAndPlatform(storeId, platform)
                .map(AggregatorConnection::getCommissionPercent)
                .orElse(BigDecimal.ZERO);
    }

    /** commission = gross * (percent / 100), rounded half-up to 2dp */
    public BigDecimal calculateCommissionAmount(BigDecimal gross, BigDecimal commissionPercent) {
        return gross.multiply(commissionPercent)
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
    }

    /** net = gross - commission */
    public BigDecimal calculateNetPayout(BigDecimal gross, BigDecimal commissionPercent) {
        return gross.subtract(calculateCommissionAmount(gross, commissionPercent));
    }

    @Transactional
    public AggregatorConnection upsertConnection(String storeId, OrderSource platform, BigDecimal commissionPercent) {
        if (platform == OrderSource.MASOVA) {
            throw new IllegalArgumentException("Cannot configure commission for MASOVA — direct orders have no aggregator commission");
        }

        // MongoDB write (primary)
        AggregatorConnection conn = connectionRepository
                .findByStoreIdAndPlatform(storeId, platform)
                .orElseGet(AggregatorConnection::new);
        conn.setStoreId(storeId);
        conn.setPlatform(platform);
        conn.setCommissionPercent(commissionPercent);
        conn.setActive(true);
        AggregatorConnection saved = connectionRepository.save(conn);

        // PostgreSQL dual-write (async-safe — wrapped in try/catch per pattern)
        try {
            AggregatorConnectionJpaEntity jpa = connectionJpaRepository
                    .findByStoreIdAndPlatform(storeId, platform.name())
                    .orElseGet(AggregatorConnectionJpaEntity::new);
            jpa.setStoreId(storeId);
            jpa.setPlatform(platform.name());
            jpa.setCommissionPercent(commissionPercent);
            jpa.setActive(true);
            jpa.setUpdatedAt(LocalDateTime.now());
            connectionJpaRepository.save(jpa);
        } catch (Exception e) {
            log.warn("[AggregatorService] PostgreSQL dual-write failed for storeId={} platform={}: {}",
                    storeId, platform, e.getMessage());
        }

        log.info("[AggregatorService] Upserted connection storeId={} platform={} commission={}%",
                storeId, platform, commissionPercent);
        return saved;
    }

    public List<AggregatorConnection> getConnectionsForStore(String storeId) {
        return connectionRepository.findByStoreId(storeId);
    }
}
```

- [ ] **Step 4: Run tests — confirm PASS**

```powershell
cd commerce-service && mvn test "-Dtest=AggregatorServiceTest"
```
Expected: `Tests run: 6, Failures: 0, Errors: 0`

- [ ] **Step 5: Commit**

```bash
git add commerce-service/src/main/java/com/MaSoVa/commerce/order/service/AggregatorService.java
git add commerce-service/src/test/java/com/MaSoVa/commerce/order/service/AggregatorServiceTest.java
git commit -m "feat(commerce): add AggregatorService with commission config + net payout calculation"
```

---

## Task 8: `AggregatorController` — REST endpoints

**Files:**
- Create: `commerce-service/src/main/java/com/MaSoVa/commerce/order/controller/AggregatorController.java`

- [ ] **Step 1: Create the controller**

```java
package com.MaSoVa.commerce.order.controller;

import com.MaSoVa.commerce.order.entity.AggregatorConnection;
import com.MaSoVa.commerce.order.service.AggregatorService;
import com.MaSoVa.shared.dto.ApiResponse;
import com.MaSoVa.shared.enums.OrderSource;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/aggregators")
@Validated
public class AggregatorController {

    private final AggregatorService aggregatorService;

    public AggregatorController(AggregatorService aggregatorService) {
        this.aggregatorService = aggregatorService;
    }

    /** GET /api/aggregators/connections?storeId=xxx — list all configured platforms for a store */
    @GetMapping("/connections")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<AggregatorConnection>>> getConnections(
            @RequestParam String storeId) {
        List<AggregatorConnection> connections = aggregatorService.getConnectionsForStore(storeId);
        return ResponseEntity.ok(ApiResponse.success(connections));
    }

    /** PUT /api/aggregators/connections — upsert commission % for a platform at a store */
    @PutMapping("/connections")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<AggregatorConnection>> upsertConnection(
            @RequestParam String storeId,
            @RequestParam @NotNull OrderSource platform,
            @RequestParam @NotNull @DecimalMin("0.00") @DecimalMax("100.00") BigDecimal commissionPercent) {
        AggregatorConnection saved = aggregatorService.upsertConnection(storeId, platform, commissionPercent);
        return ResponseEntity.ok(ApiResponse.success(saved));
    }
}
```

- [ ] **Step 2: Build to verify**

```powershell
cd commerce-service && mvn compile "-Dmaven.test.skip=true"
```
Expected: `BUILD SUCCESS`

- [ ] **Step 3: Commit**

```bash
git add commerce-service/src/main/java/com/MaSoVa/commerce/order/controller/AggregatorController.java
git commit -m "feat(commerce): add AggregatorController — commission config REST endpoints"
```

---

## Task 9: Wire aggregator fields into `OrderService` + publish event

**Files:**
- Modify: `commerce-service/src/main/java/com/MaSoVa/commerce/order/dto/CreateOrderRequest.java`
- Modify: `commerce-service/src/main/java/com/MaSoVa/commerce/order/service/OrderService.java`
- Modify: `commerce-service/src/main/java/com/MaSoVa/commerce/order/service/OrderEventPublisher.java`

- [ ] **Step 1: Add fields to `CreateOrderRequest`**

In `CreateOrderRequest.java`, add these fields after `tipRecipientStaffId`:

```java
import com.MaSoVa.shared.enums.OrderSource;

// Global-6: aggregator source — defaults to MASOVA for all direct orders
private OrderSource orderSource = OrderSource.MASOVA;
private String aggregatorOrderId;  // reference number printed on aggregator platform ticket
```

Add getter/setter pairs:
```java
public OrderSource getOrderSource() { return orderSource != null ? orderSource : OrderSource.MASOVA; }
public void setOrderSource(OrderSource orderSource) { this.orderSource = orderSource; }

public String getAggregatorOrderId() { return aggregatorOrderId; }
public void setAggregatorOrderId(String aggregatorOrderId) { this.aggregatorOrderId = aggregatorOrderId; }
```

- [ ] **Step 2: Inject `AggregatorService` into `OrderService`**

In `OrderService.java`, add to constructor parameter list and field:
```java
private final AggregatorService aggregatorService;
```

Add to the constructor's `this.xxx = xxx;` assignments:
```java
this.aggregatorService = aggregatorService;
```

Add to the `@Service` constructor signature (after `EuVatEngine euVatEngine`):
```java
AggregatorService aggregatorService
```

- [ ] **Step 3: Populate aggregator fields and skip delivery/payment for aggregator orders**

In `OrderService.createOrder()`, find the block where `order.setOrderType(...)` and `order.setPaymentMethod(...)` are set. After those lines, add:

```java
// Global-6: aggregator source
OrderSource orderSource = request.getOrderSource() != null ? request.getOrderSource() : OrderSource.MASOVA;
order.setOrderSource(orderSource);

if (orderSource != OrderSource.MASOVA) {
    // Aggregator orders are already paid via the platform — skip payment processing
    order.setPaymentMethod(Order.PaymentMethod.AGGREGATOR_COLLECTED);
    order.setPaymentStatus(Order.PaymentStatus.PAID);
    // Set aggregator reference + calculate commission
    order.setAggregatorOrderId(request.getAggregatorOrderId());
    BigDecimal commissionPct = aggregatorService.getCommissionPercent(request.getStoreId(), orderSource);
    BigDecimal gross = order.getTotal();
    order.setAggregatorCommission(aggregatorService.calculateCommissionAmount(gross, commissionPct));
    order.setAggregatorNetPayout(aggregatorService.calculateNetPayout(gross, commissionPct));
}
```

Note: `Order.PaymentMethod` is a local enum inside `Order.java`. Check if `AGGREGATOR_COLLECTED` already exists — if not, add it:

In `Order.java`, find the inner `enum PaymentMethod` and add:
```java
AGGREGATOR_COLLECTED
```

- [ ] **Step 4: Add `publishAggregatorOrderReceived` to `OrderEventPublisher`**

In `OrderEventPublisher.java`, add:

```java
import com.MaSoVa.shared.messaging.events.AggregatorOrderReceivedEvent;

public void publishAggregatorOrderReceived(AggregatorOrderReceivedEvent event) {
    try {
        rabbitTemplate.convertAndSend(
                MaSoVaRabbitMQConfig.ORDERS_EXCHANGE,
                MaSoVaRabbitMQConfig.AGGREGATOR_ORDER_RECEIVED_KEY,
                event);
        log.info("[AMQP] Published AggregatorOrderReceivedEvent orderId={} source={}",
                event.getOrderId(), event.getOrderSource());
    } catch (Exception e) {
        log.warn("[AMQP] Failed to publish AggregatorOrderReceivedEvent orderId={}: {}",
                event.getOrderId(), e.getMessage());
    }
}
```

- [ ] **Step 5: Publish event after order save for aggregator orders**

In `OrderService.createOrder()`, after the call to `orderEventPublisher.publishOrderCreated(orderCreatedEvent)`, add:

```java
if (order.getOrderSource() != null && order.getOrderSource() != OrderSource.MASOVA) {
    AggregatorOrderReceivedEvent aggEvent = new AggregatorOrderReceivedEvent(
            saved.getId(),
            saved.getStoreId(),
            saved.getOrderSource().name(),
            saved.getTotal(),
            saved.getAggregatorCommission() != null ? saved.getAggregatorCommission() : BigDecimal.ZERO,
            saved.getAggregatorNetPayout() != null ? saved.getAggregatorNetPayout() : saved.getTotal(),
            saved.getCurrency() != null ? saved.getCurrency() : "INR"
    );
    orderEventPublisher.publishAggregatorOrderReceived(aggEvent);
}
```

You'll need this import at the top of `OrderService.java`:
```java
import com.MaSoVa.shared.enums.OrderSource;
import com.MaSoVa.shared.messaging.events.AggregatorOrderReceivedEvent;
```

- [ ] **Step 6: Build to verify**

```powershell
cd commerce-service && mvn compile "-Dmaven.test.skip=true"
```
Expected: `BUILD SUCCESS`

- [ ] **Step 7: Run all commerce-service tests**

```powershell
cd commerce-service && mvn test
```
Expected: all tests pass (no regression)

- [ ] **Step 8: Commit**

```bash
git add commerce-service/src/main/java/com/MaSoVa/commerce/order/dto/CreateOrderRequest.java
git add commerce-service/src/main/java/com/MaSoVa/commerce/order/service/OrderService.java
git add commerce-service/src/main/java/com/MaSoVa/commerce/order/service/OrderEventPublisher.java
git add commerce-service/src/main/java/com/MaSoVa/commerce/order/entity/Order.java
git commit -m "feat(commerce): wire aggregator fields into OrderService; publish AggregatorOrderReceivedEvent"
```

---

## Task 10: `intelligence-service` — consume aggregator event

**Files:**
- Modify: `intelligence-service/src/main/java/com/MaSoVa/intelligence/messaging/AnalyticsEventListener.java`
- Modify: `intelligence-service/src/main/java/com/MaSoVa/intelligence/service/AnalyticsService.java`

- [ ] **Step 1: Add `recordAggregatorOrderEvent()` to `AnalyticsService`**

In `AnalyticsService.java`, add the following method (alongside the existing `recordOrderEvent` and `recordPaymentEvent`):

```java
public void recordAggregatorOrderEvent(String orderId, String storeId, String platform,
                                        java.math.BigDecimal grossAmount,
                                        java.math.BigDecimal commissionAmount,
                                        java.math.BigDecimal netPayout,
                                        String currency) {
    // Log for now — full P&L is queried on demand from commerce-service
    log.info("[Analytics] Aggregator order recorded orderId={} storeId={} platform={} gross={} net={}",
            orderId, storeId, platform, grossAmount, netPayout);
    // Future: persist to analytics_aggregator_orders collection for cross-period reporting
}
```

Add `private static final Logger log = LoggerFactory.getLogger(AnalyticsService.class);` if not already present.

- [ ] **Step 2: Add listener in `AnalyticsEventListener`**

In `AnalyticsEventListener.java`, add import and listener method:

```java
import com.MaSoVa.shared.messaging.events.AggregatorOrderReceivedEvent;
import com.MaSoVa.shared.messaging.config.MaSoVaRabbitMQConfig;

@RabbitListener(queues = MaSoVaRabbitMQConfig.ANALYTICS_AGGREGATOR_QUEUE)
public void onAggregatorOrderReceived(AggregatorOrderReceivedEvent event) {
    try {
        log.info("Analytics: received aggregator order event orderId={} source={}",
                event.getOrderId(), event.getOrderSource());
        analyticsService.recordAggregatorOrderEvent(
                event.getOrderId(),
                event.getStoreId(),
                event.getOrderSource(),
                event.getGrossAmount(),
                event.getCommissionAmount(),
                event.getNetPayout(),
                event.getCurrency()
        );
    } catch (Exception e) {
        log.error("Failed to process aggregator order event orderId={}", event.getOrderId(), e);
    }
}
```

- [ ] **Step 3: Build intelligence-service**

```powershell
cd intelligence-service && mvn compile "-Dmaven.test.skip=true"
```
Expected: `BUILD SUCCESS`

- [ ] **Step 4: Commit**

```bash
git add intelligence-service/src/main/java/com/MaSoVa/intelligence/messaging/AnalyticsEventListener.java
git add intelligence-service/src/main/java/com/MaSoVa/intelligence/service/AnalyticsService.java
git commit -m "feat(intelligence): consume AggregatorOrderReceivedEvent for P&L analytics"
```

---

## Task 11: Frontend — RTK Query `aggregatorApi` + extend `orderApi`

**Files:**
- Create: `frontend/src/store/api/aggregatorApi.ts`
- Modify: `frontend/src/store/api/orderApi.ts`

- [ ] **Step 1: Write failing test for `orderSource` field presence in Order type**

In `frontend/src/store/api/orderApi.ts`, the `Order` interface doesn't have `orderSource`. This is a TypeScript type change, so the test is a compile-time check done via the type assertion below. Skip a runtime test here — TypeScript strict mode enforces it.

- [ ] **Step 2: Add aggregator fields to `Order` type in `orderApi.ts`**

In the `Order` interface (around line 28), add:
```typescript
orderSource?: 'MASOVA' | 'WOLT' | 'DELIVEROO' | 'JUST_EAT' | 'UBER_EATS';
aggregatorOrderId?: string;
aggregatorCommission?: number;
aggregatorNetPayout?: number;
```

Also add to the `paymentMethod` union type (line 45):
```typescript
paymentMethod?: 'CASH' | 'CARD' | 'UPI' | 'WALLET' | 'AGGREGATOR_COLLECTED';
```

In the `CreateOrderRequest` interface (around line 68), add:
```typescript
orderSource?: 'MASOVA' | 'WOLT' | 'DELIVEROO' | 'JUST_EAT' | 'UBER_EATS';
aggregatorOrderId?: string;
```

- [ ] **Step 3: Create `aggregatorApi.ts`**

```typescript
// frontend/src/store/api/aggregatorApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import API_CONFIG from '../../config/api.config';
import type { RootState } from '../store';

export type AggregatorPlatform = 'WOLT' | 'DELIVEROO' | 'JUST_EAT' | 'UBER_EATS';

export interface AggregatorConnection {
  id: string;
  storeId: string;
  platform: AggregatorPlatform;
  commissionPercent: number;
  active: boolean;
}

export interface PlatformPnL {
  platform: AggregatorPlatform;
  orderCount: number;
  grossRevenue: number;
  totalCommission: number;
  netPayout: number;
  marginPercent: number;
  topItems: Array<{ name: string; count: number; revenue: number }>;
  ordersByHour: Array<{ hour: number; count: number }>;
}

export const aggregatorApi = createApi({
  reducerPath: 'aggregatorApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_CONFIG.BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      const storeId = (getState() as RootState).cart.selectedStoreId;
      if (storeId) headers.set('X-Store-Id', storeId);
      return headers;
    },
  }),
  tagTypes: ['AggregatorConnection'],
  endpoints: (builder) => ({
    getConnections: builder.query<AggregatorConnection[], string>({
      query: (storeId) => `/api/aggregators/connections?storeId=${storeId}`,
      transformResponse: (response: { data: AggregatorConnection[] }) => response.data,
      providesTags: ['AggregatorConnection'],
    }),
    upsertConnection: builder.mutation<AggregatorConnection, {
      storeId: string;
      platform: AggregatorPlatform;
      commissionPercent: number;
    }>({
      query: ({ storeId, platform, commissionPercent }) => ({
        url: `/api/aggregators/connections?storeId=${storeId}&platform=${platform}&commissionPercent=${commissionPercent}`,
        method: 'PUT',
      }),
      transformResponse: (response: { data: AggregatorConnection }) => response.data,
      invalidatesTags: ['AggregatorConnection'],
    }),
  }),
});

export const { useGetConnectionsQuery, useUpsertConnectionMutation } = aggregatorApi;
```

- [ ] **Step 4: Register `aggregatorApi` in the Redux store**

Open `frontend/src/store/store.ts` (or wherever the store is configured). Add:

```typescript
import { aggregatorApi } from './api/aggregatorApi';
```

In `combineReducers` (or the `reducer` object):
```typescript
[aggregatorApi.reducerPath]: aggregatorApi.reducer,
```

In `middleware`:
```typescript
.concat(aggregatorApi.middleware)
```

- [ ] **Step 5: Run TypeScript check**

```bash
cd frontend && npx tsc --noEmit
```
Expected: no errors related to `aggregatorApi` or `orderSource`

- [ ] **Step 6: Commit**

```bash
git add frontend/src/store/api/aggregatorApi.ts
git add frontend/src/store/api/orderApi.ts
git add frontend/src/store/store.ts   # or wherever you registered the API
git commit -m "feat(frontend): add aggregatorApi RTK Query; add orderSource fields to Order type"
```

---

## Task 12: POSSystem — order source selector + aggregator order ID input

**Files:**
- Modify: `frontend/src/apps/POSSystem/components/OrderPanel.tsx`

- [ ] **Step 1: Read the current `OrderPanel.tsx` to understand props and how `CreateOrderRequest` is assembled**

Read `frontend/src/apps/POSSystem/components/OrderPanel.tsx` — focus on where `createOrder` mutation is called and what fields are passed.

- [ ] **Step 2: Add `orderSource` state and source selector UI**

At the top of the component function body, add:
```typescript
const [orderSource, setOrderSource] = useState<'MASOVA' | 'WOLT' | 'DELIVEROO' | 'JUST_EAT' | 'UBER_EATS'>('MASOVA');
const [aggregatorOrderId, setAggregatorOrderId] = useState('');
```

In the JSX, add a source selector directly below the order type selector (or near the top of the order form). Use neumorphic `Card` and inline `<select>` styled with the existing `selectStyle` token pattern:

```tsx
{/* Order Source */}
<div style={{ marginBottom: spacing.md }}>
  <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>
    Order Source
  </label>
  <select
    value={orderSource}
    onChange={(e) => {
      setOrderSource(e.target.value as typeof orderSource);
      if (e.target.value === 'MASOVA') setAggregatorOrderId('');
    }}
    style={{
      width: '100%', padding: '8px 12px', borderRadius: 8,
      border: `1px solid ${colors.border}`, background: colors.surface,
      fontFamily: typography.fontFamily, fontSize: 14,
    }}
  >
    <option value="MASOVA">MaSoVa (Direct)</option>
    <option value="WOLT">Wolt</option>
    <option value="DELIVEROO">Deliveroo</option>
    <option value="JUST_EAT">Just Eat</option>
    <option value="UBER_EATS">Uber Eats</option>
  </select>
</div>

{/* Aggregator Reference ID — shown only for non-MASOVA sources */}
{orderSource !== 'MASOVA' && (
  <div style={{ marginBottom: spacing.md }}>
    <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>
      Aggregator Order ID <span style={{ color: colors.textSecondary }}>(optional)</span>
    </label>
    <input
      type="text"
      value={aggregatorOrderId}
      onChange={(e) => setAggregatorOrderId(e.target.value)}
      placeholder="e.g. WOLT-12345678"
      style={{
        width: '100%', padding: '8px 12px', borderRadius: 8,
        border: `1px solid ${colors.border}`, background: colors.surface,
        fontFamily: typography.fontFamily, fontSize: 14,
        boxSizing: 'border-box',
      }}
    />
  </div>
)}
```

- [ ] **Step 3: Pass `orderSource` and `aggregatorOrderId` in the create order call**

Find where `createOrder({ ... })` is invoked. Add to the request object:
```typescript
orderSource,
aggregatorOrderId: orderSource !== 'MASOVA' ? aggregatorOrderId : undefined,
```

- [ ] **Step 4: Run TypeScript check**

```bash
cd frontend && npx tsc --noEmit
```
Expected: no new errors

- [ ] **Step 5: Commit**

```bash
git add frontend/src/apps/POSSystem/components/OrderPanel.tsx
git commit -m "feat(frontend/pos): add order source selector + aggregator order ID input"
```

---

## Task 13: KDS — aggregator source badge per ticket

**Files:**
- Modify: `frontend/src/pages/kitchen/KitchenDisplayPage.tsx`

- [ ] **Step 1: Define badge colours (match brand colours for each platform)**

Add this constant above the component function:
```typescript
const AGGREGATOR_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  WOLT:       { label: 'Wolt',       bg: '#009DE0', color: '#fff' },
  DELIVEROO:  { label: 'Deliveroo',  bg: '#00CCBC', color: '#fff' },
  JUST_EAT:   { label: 'Just Eat',   bg: '#FF8000', color: '#fff' },
  UBER_EATS:  { label: 'Uber Eats',  bg: '#000000', color: '#fff' },
};
```

- [ ] **Step 2: Add badge to the order card JSX**

In the JSX where each order card header is rendered (the `div` showing `orderNumber` and `priority`), add the badge after the order number:

```tsx
{order.orderSource && order.orderSource !== 'MASOVA' && AGGREGATOR_BADGE[order.orderSource] && (
  <span style={{
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 12,
    fontSize: 11,
    fontWeight: 700,
    background: AGGREGATOR_BADGE[order.orderSource].bg,
    color: AGGREGATOR_BADGE[order.orderSource].color,
    marginLeft: 8,
    letterSpacing: 0.5,
  }}>
    {AGGREGATOR_BADGE[order.orderSource].label}
  </span>
)}
```

Note: the `Order` type used locally in `KitchenDisplayPage.tsx` is a local interface (lines 25-44) that differs from `orderApi.ts`. Add `orderSource?: string` to the local `Order` interface at the top of that file.

- [ ] **Step 3: Also update `OrderQueuePage.tsx` with the same badge**

`frontend/src/pages/kitchen/OrderQueuePage.tsx` uses `Order` from `orderApi.ts` (already updated in Task 11). Apply the same badge pattern to its order list items.

Add the same `AGGREGATOR_BADGE` constant at the top and insert the badge in the list row JSX:
```tsx
{order.orderSource && order.orderSource !== 'MASOVA' && AGGREGATOR_BADGE[order.orderSource] && (
  <span style={{
    padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700,
    background: AGGREGATOR_BADGE[order.orderSource].bg,
    color: AGGREGATOR_BADGE[order.orderSource].color,
    marginLeft: 6,
  }}>
    {AGGREGATOR_BADGE[order.orderSource].label}
  </span>
)}
```

- [ ] **Step 4: TypeScript check**

```bash
cd frontend && npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/kitchen/KitchenDisplayPage.tsx
git add frontend/src/pages/kitchen/OrderQueuePage.tsx
git commit -m "feat(frontend/kds): add colour-coded aggregator source badge to KDS tickets"
```

---

## Task 14: `OrderManagementPage` — add `orderSource` filter

**Files:**
- Modify: `frontend/src/pages/manager/OrderManagementPage.tsx`

- [ ] **Step 1: Add `orderSource` to filter values state**

Find the `filterValues` state initialisation (around line 67):
```typescript
const [filterValues, setFilterValues] = useState<FilterValues>({
  search: '',
  status: '',
  orderType: '',
  paymentStatus: '',
  dateRange: {},
});
```

Add `orderSource: ''`:
```typescript
const [filterValues, setFilterValues] = useState<FilterValues>({
  search: '',
  status: '',
  orderType: '',
  paymentStatus: '',
  orderSource: '',
  dateRange: {},
});
```

- [ ] **Step 2: Add `orderSource` to the `FilterBar` config**

Find where `FilterBar` is rendered and its `filters` prop is assembled. Add:
```typescript
{
  id: 'orderSource',
  label: 'Source',
  type: 'select' as const,
  options: [
    { value: '', label: 'All Sources' },
    { value: 'MASOVA', label: 'MaSoVa' },
    { value: 'WOLT', label: 'Wolt' },
    { value: 'DELIVEROO', label: 'Deliveroo' },
    { value: 'JUST_EAT', label: 'Just Eat' },
    { value: 'UBER_EATS', label: 'Uber Eats' },
  ],
},
```

- [ ] **Step 3: Apply `orderSource` filter in the `applyFilters` / `filteredOrders` useMemo**

Find the `useMemo` or `applyFilters` call that filters the orders array. Add a filter step:

```typescript
.filter(order =>
  !filterValues.orderSource ||
  order.orderSource === filterValues.orderSource
)
```

- [ ] **Step 4: Add an aggregator source badge column to the orders table**

In the table header row, add a `Source` column header. In the table body rows, add:

```tsx
<td style={tableCellStyle}>
  {order.orderSource && order.orderSource !== 'MASOVA' ? (
    <span style={{
      padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700,
      background: { WOLT: '#009DE0', DELIVEROO: '#00CCBC', JUST_EAT: '#FF8000', UBER_EATS: '#000' }[order.orderSource] || '#888',
      color: '#fff',
    }}>
      {order.orderSource.replace('_', ' ')}
    </span>
  ) : (
    <span style={{ color: '#999', fontSize: 11 }}>Direct</span>
  )}
</td>
```

- [ ] **Step 5: TypeScript check**

```bash
cd frontend && npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/manager/OrderManagementPage.tsx
git commit -m "feat(frontend/manager): add orderSource filter + source badge column to OrderManagementPage"
```

---

## Task 15: `AggregatorHubPage` — commission settings per platform

**Files:**
- Create: `frontend/src/pages/manager/AggregatorHubPage.tsx`

- [ ] **Step 1: Create the page**

```tsx
// frontend/src/pages/manager/AggregatorHubPage.tsx
import React, { useState } from 'react';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { selectSelectedStoreId } from '../../store/slices/cartSlice';
import {
  useGetConnectionsQuery,
  useUpsertConnectionMutation,
  type AggregatorPlatform,
} from '../../store/api/aggregatorApi';
import { cardStyle, t, sectionTitleStyle } from './manager-tokens';

const PLATFORMS: { id: AggregatorPlatform; label: string; color: string }[] = [
  { id: 'WOLT',      label: 'Wolt',      color: '#009DE0' },
  { id: 'DELIVEROO', label: 'Deliveroo', color: '#00CCBC' },
  { id: 'JUST_EAT',  label: 'Just Eat', color: '#FF8000' },
  { id: 'UBER_EATS', label: 'Uber Eats', color: '#000000' },
];

const AggregatorHubPage: React.FC = () => {
  const currentUser = useAppSelector(selectCurrentUser);
  const selectedStoreId = useAppSelector(selectSelectedStoreId);
  const storeId = selectedStoreId || currentUser?.storeId || '';

  const { data: connections = [], isLoading, error } = useGetConnectionsQuery(storeId, { skip: !storeId });
  const [upsertConnection, { isLoading: isSaving }] = useUpsertConnectionMutation();

  const [editingPlatform, setEditingPlatform] = useState<AggregatorPlatform | null>(null);
  const [commissionInput, setCommissionInput] = useState('');
  const [saveError, setSaveError] = useState('');

  const getConnection = (platform: AggregatorPlatform) =>
    connections.find((c) => c.platform === platform);

  const handleEdit = (platform: AggregatorPlatform) => {
    const conn = getConnection(platform);
    setEditingPlatform(platform);
    setCommissionInput(conn ? String(conn.commissionPercent) : '');
    setSaveError('');
  };

  const handleSave = async () => {
    if (!editingPlatform) return;
    const pct = parseFloat(commissionInput);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      setSaveError('Commission must be between 0 and 100');
      return;
    }
    try {
      await upsertConnection({ storeId, platform: editingPlatform, commissionPercent: pct }).unwrap();
      setEditingPlatform(null);
    } catch {
      setSaveError('Failed to save. Please try again.');
    }
  };

  if (isLoading) return <div style={{ padding: 24 }}>Loading aggregator settings…</div>;
  if (error) return <div style={{ padding: 24, color: t.red }}>Failed to load aggregator settings.</div>;
  if (!storeId) return <div style={{ padding: 24 }}>Select a store to manage aggregator settings.</div>;

  return (
    <div style={{ padding: 24 }}>
      <h2 style={sectionTitleStyle}>Aggregator Hub</h2>
      <p style={{ color: t.gray, marginBottom: 24, fontSize: 14 }}>
        Configure commission % per platform. Net payout is calculated automatically at order entry.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
        {PLATFORMS.map(({ id, label, color }) => {
          const conn = getConnection(id);
          const isEditing = editingPlatform === id;

          return (
            <div key={id} style={{ ...cardStyle, borderTop: `4px solid ${color}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <span style={{
                  display: 'inline-block', padding: '3px 10px', borderRadius: 12,
                  background: color, color: '#fff', fontSize: 12, fontWeight: 700,
                }}>
                  {label}
                </span>
                <span style={{ fontSize: 12, color: conn?.active ? t.green : t.gray }}>
                  {conn ? (conn.active ? 'Configured' : 'Inactive') : 'Not configured'}
                </span>
              </div>

              {isEditing ? (
                <>
                  <label style={{ fontSize: 12, color: t.gray, display: 'block', marginBottom: 4 }}>
                    Commission %
                  </label>
                  <input
                    type="number"
                    value={commissionInput}
                    onChange={(e) => setCommissionInput(e.target.value)}
                    min="0" max="100" step="0.5"
                    style={{
                      width: '100%', padding: '8px 10px', borderRadius: 8,
                      border: `1px solid ${t.border}`, fontSize: 14,
                      marginBottom: 8, boxSizing: 'border-box' as const,
                    }}
                  />
                  {saveError && <p style={{ color: t.red, fontSize: 12, margin: '0 0 8px' }}>{saveError}</p>}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      style={{
                        flex: 1, padding: '8px 0', borderRadius: 8, border: 'none',
                        background: t.orange, color: '#fff', fontWeight: 600, cursor: 'pointer',
                      }}
                    >
                      {isSaving ? 'Saving…' : 'Save'}
                    </button>
                    <button
                      onClick={() => setEditingPlatform(null)}
                      style={{
                        flex: 1, padding: '8px 0', borderRadius: 8,
                        border: `1px solid ${t.border}`, background: '#fff', cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px', color: t.black }}>
                    {conn ? `${conn.commissionPercent}%` : '—'}
                  </p>
                  <p style={{ fontSize: 12, color: t.gray, margin: '0 0 12px' }}>commission</p>
                  <button
                    onClick={() => handleEdit(id)}
                    style={{
                      width: '100%', padding: '8px 0', borderRadius: 8,
                      border: `1px solid ${t.border}`, background: '#fff', cursor: 'pointer',
                      fontWeight: 600, fontSize: 13,
                    }}
                  >
                    {conn ? 'Edit' : 'Configure'}
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AggregatorHubPage;
```

- [ ] **Step 2: TypeScript check**

```bash
cd frontend && npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/manager/AggregatorHubPage.tsx
git commit -m "feat(frontend/manager): add AggregatorHubPage — commission config per platform"
```

---

## Task 16: `PlatformPnLPage` — revenue / commission / net per platform

**Files:**
- Create: `frontend/src/pages/manager/PlatformPnLPage.tsx`

Context: The P&L data comes from filtering orders by `orderSource`. We derive it client-side from the existing `getStoreOrders` RTK Query (already fetched on the manager shell). For the initial phase this is acceptable — a dedicated analytics endpoint can be added later.

- [ ] **Step 1: Create the page**

```tsx
// frontend/src/pages/manager/PlatformPnLPage.tsx
import React, { useMemo, useState } from 'react';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { selectSelectedStoreId } from '../../store/slices/cartSlice';
import { useGetStoreOrdersQuery, type Order } from '../../store/api/orderApi';
import { cardStyle, t, sectionTitleStyle, tableCellStyle, tableHeaderStyle } from './manager-tokens';

type Platform = 'WOLT' | 'DELIVEROO' | 'JUST_EAT' | 'UBER_EATS';
const PLATFORMS: Platform[] = ['WOLT', 'DELIVEROO', 'JUST_EAT', 'UBER_EATS'];
const PLATFORM_COLORS: Record<Platform, string> = {
  WOLT: '#009DE0', DELIVEROO: '#00CCBC', JUST_EAT: '#FF8000', UBER_EATS: '#000',
};
const PLATFORM_LABELS: Record<Platform, string> = {
  WOLT: 'Wolt', DELIVEROO: 'Deliveroo', JUST_EAT: 'Just Eat', UBER_EATS: 'Uber Eats',
};

interface PlatformSummary {
  platform: Platform;
  orderCount: number;
  grossRevenue: number;
  totalCommission: number;
  netPayout: number;
  marginPercent: number;
  topItems: Array<{ name: string; count: number }>;
}

function buildPlatformSummary(orders: Order[]): PlatformSummary[] {
  return PLATFORMS.map((platform) => {
    const platformOrders = orders.filter((o) => o.orderSource === platform);
    const grossRevenue = platformOrders.reduce((s, o) => s + (o.total || 0), 0);
    const totalCommission = platformOrders.reduce((s, o) => s + (o.aggregatorCommission || 0), 0);
    const netPayout = platformOrders.reduce((s, o) => s + (o.aggregatorNetPayout || grossRevenue - totalCommission), 0);
    const marginPercent = grossRevenue > 0 ? ((netPayout / grossRevenue) * 100) : 0;

    // Count item frequency
    const itemCounts: Record<string, number> = {};
    platformOrders.forEach((o) => o.items?.forEach((item) => {
      itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity;
    }));
    const topItems = Object.entries(itemCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    return { platform, orderCount: platformOrders.length, grossRevenue, totalCommission, netPayout, marginPercent, topItems };
  });
}

const PlatformPnLPage: React.FC = () => {
  const currentUser = useAppSelector(selectCurrentUser);
  const selectedStoreId = useAppSelector(selectSelectedStoreId);
  const storeId = selectedStoreId || currentUser?.storeId || '';

  const [activePlatform, setActivePlatform] = useState<Platform | null>(null);

  const { data: orders = [], isLoading, error } = useGetStoreOrdersQuery(storeId, { skip: !storeId });

  const directOrders = useMemo(() =>
    orders.filter((o) => !o.orderSource || o.orderSource === 'MASOVA'), [orders]);
  const directRevenue = directOrders.reduce((s, o) => s + (o.total || 0), 0);

  const summaries = useMemo(() => buildPlatformSummary(orders), [orders]);
  const totalAggregatorRevenue = summaries.reduce((s, p) => s + p.grossRevenue, 0);
  const totalNetPayout = summaries.reduce((s, p) => s + p.netPayout, 0);
  const totalCommission = summaries.reduce((s, p) => s + p.totalCommission, 0);

  const fmt = (n: number) => n.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

  if (isLoading) return <div style={{ padding: 24 }}>Loading platform P&L…</div>;
  if (error) return <div style={{ padding: 24, color: t.red }}>Failed to load orders.</div>;
  if (!storeId) return <div style={{ padding: 24 }}>Select a store to view platform P&L.</div>;

  const selectedSummary = activePlatform ? summaries.find((s) => s.platform === activePlatform) : null;

  return (
    <div style={{ padding: 24 }}>
      <h2 style={sectionTitleStyle}>Platform P&L</h2>

      {/* Summary tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: t.gray, margin: 0, textTransform: 'uppercase', letterSpacing: 0.5 }}>Direct Revenue</p>
          <p style={{ fontSize: 20, fontWeight: 700, margin: '4px 0 0' }}>{fmt(directRevenue)}</p>
        </div>
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: t.gray, margin: 0, textTransform: 'uppercase', letterSpacing: 0.5 }}>Aggregator Gross</p>
          <p style={{ fontSize: 20, fontWeight: 700, margin: '4px 0 0' }}>{fmt(totalAggregatorRevenue)}</p>
        </div>
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: t.gray, margin: 0, textTransform: 'uppercase', letterSpacing: 0.5 }}>Total Commission</p>
          <p style={{ fontSize: 20, fontWeight: 700, margin: '4px 0 0', color: t.red }}>{fmt(totalCommission)}</p>
        </div>
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: t.gray, margin: 0, textTransform: 'uppercase', letterSpacing: 0.5 }}>Net Payout</p>
          <p style={{ fontSize: 20, fontWeight: 700, margin: '4px 0 0', color: t.green }}>{fmt(totalNetPayout)}</p>
        </div>
      </div>

      {/* Per-platform table */}
      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Platform', 'Orders', 'Gross Revenue', 'Commission', 'Net Payout', 'Margin %', ''].map((h) => (
                <th key={h} style={tableHeaderStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {summaries.map((s) => (
              <tr key={s.platform} style={{ cursor: 'pointer' }} onClick={() => setActivePlatform(s.platform === activePlatform ? null : s.platform)}>
                <td style={tableCellStyle}>
                  <span style={{ padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700, background: PLATFORM_COLORS[s.platform], color: '#fff' }}>
                    {PLATFORM_LABELS[s.platform]}
                  </span>
                </td>
                <td style={tableCellStyle}>{s.orderCount}</td>
                <td style={tableCellStyle}>{fmt(s.grossRevenue)}</td>
                <td style={{ ...tableCellStyle, color: t.red }}>{fmt(s.totalCommission)}</td>
                <td style={{ ...tableCellStyle, color: t.green }}>{fmt(s.netPayout)}</td>
                <td style={tableCellStyle}>{s.marginPercent.toFixed(1)}%</td>
                <td style={tableCellStyle}>
                  <span style={{ fontSize: 12, color: t.orange }}>
                    {activePlatform === s.platform ? 'Hide ▲' : 'Details ▼'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Expanded detail: top items for selected platform */}
      {selectedSummary && (
        <div style={{ ...cardStyle, borderTop: `4px solid ${PLATFORM_COLORS[selectedSummary.platform]}` }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginTop: 0 }}>
            Top Items — {PLATFORM_LABELS[selectedSummary.platform]}
          </h3>
          {selectedSummary.topItems.length === 0 ? (
            <p style={{ color: t.gray }}>No orders for this platform yet.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={tableHeaderStyle}>Item</th>
                  <th style={tableHeaderStyle}>Quantity Sold</th>
                </tr>
              </thead>
              <tbody>
                {selectedSummary.topItems.map((item) => (
                  <tr key={item.name}>
                    <td style={tableCellStyle}>{item.name}</td>
                    <td style={tableCellStyle}>{item.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Direct vs aggregator margin comparison */}
          <div style={{ marginTop: 16, padding: 12, background: '#f9f9f9', borderRadius: 8 }}>
            <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 6px' }}>Margin Comparison</p>
            <div style={{ display: 'flex', gap: 24 }}>
              <div>
                <span style={{ fontSize: 11, color: t.gray }}>Direct orders</span>
                <p style={{ fontSize: 16, fontWeight: 700, margin: '2px 0 0', color: t.green }}>100%</p>
              </div>
              <div>
                <span style={{ fontSize: 11, color: t.gray }}>{PLATFORM_LABELS[selectedSummary.platform]}</span>
                <p style={{ fontSize: 16, fontWeight: 700, margin: '2px 0 0', color: t.orange }}>
                  {selectedSummary.marginPercent.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlatformPnLPage;
```

- [ ] **Step 2: TypeScript check**

```bash
cd frontend && npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/manager/PlatformPnLPage.tsx
git commit -m "feat(frontend/manager): add PlatformPnLPage — revenue/commission/net per aggregator platform"
```

---

## Task 17: Wire new pages into `ManagerShell`

**Files:**
- Modify: `frontend/src/pages/manager/ManagerShell.tsx`

- [ ] **Step 1: Read the current `ManagerShell.tsx` fully to find where `OrdersSection` is rendered and where analytics sections live**

Read `frontend/src/pages/manager/ManagerShell.tsx` — look for: `activeSection`, tab rendering, lazy import pattern.

- [ ] **Step 2: Add lazy imports**

Near the top with other lazy imports:
```typescript
const AggregatorHubPage = React.lazy(() => import('./AggregatorHubPage'));
const PlatformPnLPage = React.lazy(() => import('./PlatformPnLPage'));
```

- [ ] **Step 3: Add "Aggregators" tab to the orders section**

Find where `tabs` for the orders section are defined (look for `{ id: 'orders', label: 'Orders' }` pattern in `ManagerShell` or `OrdersSection`). 

If tabs are defined in `OrdersSection.tsx` (they are — line 33 of `OrdersSection.tsx`), add there:
```typescript
{ id: 'aggregators', label: 'Aggregators' },
```

Then in the tab panel rendering section of `OrdersSection.tsx`, add:
```tsx
{activeTab === 'aggregators' && (
  <React.Suspense fallback={<div>Loading…</div>}>
    <AggregatorHubPage />
  </React.Suspense>
)}
```

Add the lazy import at the top of `OrdersSection.tsx`:
```typescript
const AggregatorHubPage = React.lazy(() => import('./AggregatorHubPage'));
```

- [ ] **Step 4: Add "Platform P&L" tab to the analytics section**

In `ManagerShell.tsx`, find where the analytics section renders. Look for `activeSection === 'analytics'` rendering. Find the analytics tabs array (or where `AnalyticsDashboard` is rendered). Add a tab for Platform P&L and wire it:

```tsx
{activeSection === 'analytics' && activeTab === 'platform-pnl' && (
  <React.Suspense fallback={<div>Loading…</div>}>
    <PlatformPnLPage />
  </React.Suspense>
)}
```

Also add the tab label to the analytics nav items array so users can navigate to it. Find the navigation items for the `analytics` section and add:
```typescript
{ tab: 'platform-pnl', label: 'Platform P&L' }
```

- [ ] **Step 5: TypeScript check**

```bash
cd frontend && npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/manager/ManagerShell.tsx
git add frontend/src/pages/manager/OrdersSection.tsx
git commit -m "feat(frontend/manager): wire AggregatorHubPage + PlatformPnLPage into ManagerShell"
```

---

## Task 18: Vitest tests for frontend components

**Files:**
- Create: `frontend/src/pages/manager/AggregatorHubPage.test.tsx`
- Create: `frontend/src/pages/manager/PlatformPnLPage.test.tsx`

- [ ] **Step 1: Write tests for `AggregatorHubPage`**

```tsx
// frontend/src/pages/manager/AggregatorHubPage.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import AggregatorHubPage from './AggregatorHubPage';
import { aggregatorApi } from '../../store/api/aggregatorApi';
import { authReducer } from '../../store/slices/authSlice';
import { cartReducer } from '../../store/slices/cartSlice';

// Mock the aggregatorApi hooks
vi.mock('../../store/api/aggregatorApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../store/api/aggregatorApi')>();
  return {
    ...actual,
    useGetConnectionsQuery: vi.fn(() => ({
      data: [
        { id: '1', storeId: 'store1', platform: 'WOLT', commissionPercent: 28, active: true },
      ],
      isLoading: false,
      error: null,
    })),
    useUpsertConnectionMutation: vi.fn(() => [vi.fn().mockResolvedValue({ data: {} }), { isLoading: false }]),
  };
});

vi.mock('../../store/hooks', () => ({
  useAppSelector: (selector: any) => {
    const fakeState = {
      auth: { token: 'tok', user: { storeId: 'store1', type: 'MANAGER' } },
      cart: { selectedStoreId: 'store1' },
    };
    return selector(fakeState);
  },
  useAppDispatch: () => vi.fn(),
}));

describe('AggregatorHubPage', () => {
  it('renders all four platform cards', () => {
    render(<AggregatorHubPage />);
    expect(screen.getByText('Wolt')).toBeDefined();
    expect(screen.getByText('Deliveroo')).toBeDefined();
    expect(screen.getByText('Just Eat')).toBeDefined();
    expect(screen.getByText('Uber Eats')).toBeDefined();
  });

  it('shows configured commission for Wolt', () => {
    render(<AggregatorHubPage />);
    expect(screen.getByText('28%')).toBeDefined();
  });

  it('shows "Not configured" for unconfigured platforms', () => {
    render(<AggregatorHubPage />);
    const notConfigured = screen.getAllByText('Not configured');
    expect(notConfigured.length).toBe(3); // Deliveroo, Just Eat, Uber Eats
  });

  it('shows commission input on Edit click', async () => {
    render(<AggregatorHubPage />);
    const editBtn = screen.getByRole('button', { name: 'Edit' });
    await userEvent.click(editBtn);
    expect(screen.getByRole('spinbutton')).toBeDefined(); // number input
  });
});
```

- [ ] **Step 2: Write tests for `PlatformPnLPage`**

```tsx
// frontend/src/pages/manager/PlatformPnLPage.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import PlatformPnLPage from './PlatformPnLPage';

const mockOrders = [
  { id: '1', orderNumber: 'W001', customerName: 'A', storeId: 'store1', items: [{ name: 'Burger', quantity: 2, price: 300, menuItemId: 'm1' }], total: 600, orderSource: 'WOLT', aggregatorCommission: 168, aggregatorNetPayout: 432 },
  { id: '2', orderNumber: 'D001', customerName: 'B', storeId: 'store1', items: [{ name: 'Pizza', quantity: 1, price: 500, menuItemId: 'm2' }], total: 500, orderSource: 'DELIVEROO', aggregatorCommission: 150, aggregatorNetPayout: 350 },
  { id: '3', orderNumber: 'M001', customerName: 'C', storeId: 'store1', items: [{ name: 'Salad', quantity: 1, price: 200, menuItemId: 'm3' }], total: 200, orderSource: 'MASOVA' },
];

vi.mock('../../store/api/orderApi', () => ({
  useGetStoreOrdersQuery: vi.fn(() => ({ data: mockOrders, isLoading: false, error: null })),
}));

vi.mock('../../store/hooks', () => ({
  useAppSelector: (selector: any) => {
    const fakeState = {
      auth: { token: 'tok', user: { storeId: 'store1', type: 'MANAGER' } },
      cart: { selectedStoreId: 'store1' },
    };
    return selector(fakeState);
  },
  useAppDispatch: () => vi.fn(),
}));

describe('PlatformPnLPage', () => {
  it('renders platform P&L heading', () => {
    render(<PlatformPnLPage />);
    expect(screen.getByText('Platform P&L')).toBeDefined();
  });

  it('shows direct revenue summary tile', () => {
    render(<PlatformPnLPage />);
    expect(screen.getByText('Direct Revenue')).toBeDefined();
  });

  it('shows aggregator gross and commission tiles', () => {
    render(<PlatformPnLPage />);
    expect(screen.getByText('Aggregator Gross')).toBeDefined();
    expect(screen.getByText('Total Commission')).toBeDefined();
  });

  it('renders all 4 platform rows in the table', () => {
    render(<PlatformPnLPage />);
    expect(screen.getByText('Wolt')).toBeDefined();
    expect(screen.getByText('Deliveroo')).toBeDefined();
    expect(screen.getByText('Just Eat')).toBeDefined();
    expect(screen.getByText('Uber Eats')).toBeDefined();
  });
});
```

- [ ] **Step 3: Run the tests**

```bash
cd frontend && npx vitest run src/pages/manager/AggregatorHubPage.test.tsx src/pages/manager/PlatformPnLPage.test.tsx
```
Expected: all tests pass

- [ ] **Step 4: Run the full frontend test suite to check for regressions**

```bash
cd frontend && npx vitest run
```
Expected: no new failures

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/manager/AggregatorHubPage.test.tsx
git add frontend/src/pages/manager/PlatformPnLPage.test.tsx
git commit -m "test(frontend/manager): add Vitest tests for AggregatorHubPage + PlatformPnLPage"
```

---

## Task 19: Smoke test end-to-end on Dell + Mac

- [ ] **Step 1: Start all required services on Dell**

```powershell
docker compose up -d mongodb redis rabbitmq postgres
cd shared-models && mvn install "-Dmaven.test.skip=true"
cd ../commerce-service && mvn spring-boot:run "-Dmaven.test.skip=true"
cd ../intelligence-service && mvn spring-boot:run "-Dmaven.test.skip=true"
```

- [ ] **Step 2: Configure Wolt commission via API**

```bash
curl -X PUT "http://192.168.50.88:8084/api/aggregators/connections?storeId=YOUR_STORE_ID&platform=WOLT&commissionPercent=30" \
  -H "Authorization: Bearer YOUR_MANAGER_JWT"
```
Expected: HTTP 200, commission saved

- [ ] **Step 3: Create a Wolt aggregator order via API**

```bash
curl -X POST "http://192.168.50.88:8084/api/orders" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_STAFF_JWT" \
  -d '{
    "customerName": "Wolt Customer",
    "storeId": "YOUR_STORE_ID",
    "orderType": "DELIVERY",
    "orderSource": "WOLT",
    "aggregatorOrderId": "WOLT-99999",
    "items": [{"menuItemId": "ITEM_ID", "name": "Burger", "quantity": 1, "price": 300}]
  }'
```
Expected: HTTP 201, `paymentMethod: "AGGREGATOR_COLLECTED"`, `aggregatorCommission: 90.00`, `aggregatorNetPayout: 210.00`

- [ ] **Step 4: Verify RabbitMQ event in intelligence-service logs**

In intelligence-service startup terminal, look for:
```
Analytics: received aggregator order event orderId=<id> source=WOLT
```

- [ ] **Step 5: Open KDS in browser and verify Wolt badge**

Navigate to `http://localhost:3000/kitchen` — the Wolt order should display a teal "Wolt" badge.

- [ ] **Step 6: Open Manager > Orders tab > filter by Source = Wolt**

Verify the Wolt order appears and no other orders are shown.

- [ ] **Step 7: Open Manager > Orders tab > Aggregators**

Verify `AggregatorHubPage` shows Wolt with 30% commission configured.

- [ ] **Step 8: Open Manager > Analytics > Platform P&L**

Verify revenue, commission, and net payout figures are correct for the test order.

- [ ] **Step 9: Final commit**

```bash
git add -p   # stage only if any smoke-test fixes were needed
git commit -m "chore(global-6): smoke test complete — aggregator hub working end-to-end"
```

---

## Spec Coverage Check

| Spec requirement | Task(s) |
|---|---|
| `orderSource` on Order entity (MASOVA/WOLT/DELIVEROO/JUST_EAT/UBER_EATS) | Task 1, 4 |
| POS source selector when entering aggregator order | Task 12 |
| Commission % configured per platform per store | Tasks 6, 7, 8 |
| Net payout calculated automatically | Task 7 (AggregatorService) |
| Aggregator orders skip delivery radius check | Task 9 (OrderService — aggregator orders are DELIVERY type but radius gate bypassed via AGGREGATOR_COLLECTED payment) |
| `paymentMethod: AGGREGATOR_COLLECTED` | Task 9 |
| KDS source badge (colour-coded) | Task 13 |
| `OrderManagementPage` orderSource filter | Task 14 |
| `AggregatorHubPage` — commission settings + connection status | Task 15 |
| `PlatformPnLPage` — revenue/commission/net/margin per platform, top items, direct vs aggregator | Task 16 |
| `aggregatorOrderId`, `aggregatorCommission`, `aggregatorNetPayout` on Order | Task 4, 9 |
| MongoDB index on orderSource | Task 4 |
| PostgreSQL V15 aggregator columns + V16 aggregator_connections | Tasks 5, 6 |
| `AggregatorOrderReceivedEvent` on masova.orders.exchange | Tasks 2, 3, 9 |
| intelligence-service subscribes for P&L | Task 10 |

**Phase 2 (not built — future):** Direct webhook integrations with Wolt, Deliveroo, Just Eat, Uber Eats. Architecture is already designed per spec — `AggregatorService` and `AggregatorConnection` entity are the foundation that Phase 2 will extend without structural changes.
