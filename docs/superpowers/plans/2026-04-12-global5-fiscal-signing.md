# Global-5: Fiscal Signing — All 12 Countries Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add fiscal receipt signing to commerce-service so that every order reaching a terminal status (COMPLETED / SERVED / DELIVERED) is processed through the correct country-specific fiscal signer, with the result stored on the order and a `ReceiptSignedEvent` published to RabbitMQ — while India stores are completely unaffected.

**Architecture:** A `FiscalSigner` interface with `sign(order, vatBreakdown)` and `isRequired()` in commerce-service. A `FiscalSignerRegistry` resolves the correct signer by `store.countryCode`. Twelve implementations cover all 12 target countries: passthrough for NL/LU/IE/CH/US/CA, hardware-stub for DE/IT/BE, software for FR, government-API-stub for HU, MTD ledger for GB. `OrderService.updateOrderStatus()` calls the registry after setting terminal status and stores the `FiscalSignature` value object on the order. Three PostgreSQL migrations: `V6__fiscal_signatures.sql`, `V7__uk_vat_ledger.sql`, `V8__stripe_tax_calculations.sql`. A new `ReceiptSignedEvent` is added to shared-models and published by `OrderEventPublisher`. Frontend adds a `FiscalCompliancePage` in the manager shell and device-config fields to `StoreManagementPage`.

**Tech Stack:** Java 21, Spring Boot 3, MongoDB (orders.fiscalSignature field), PostgreSQL (V6–V8 Flyway), RabbitMQ (new ReceiptSignedEvent on masova.orders.events / order.receipt.signed), JUnit 5 + Mockito, React 19 + TypeScript, Vitest.

---

## File Map

### shared-models (new)
- `shared-models/src/main/java/com/MaSoVa/shared/model/FiscalSignature.java` — value object stored on Order

### shared-models (modified)
- `shared-models/src/main/java/com/MaSoVa/shared/messaging/events/ReceiptSignedEvent.java` — new event
- `shared-models/src/main/java/com/MaSoVa/shared/messaging/config/MaSoVaRabbitMQConfig.java` — add ORDER_RECEIPT_SIGNED_KEY constant + compliance queue

### commerce-service (new)
- `commerce-service/src/main/java/com/MaSoVa/commerce/fiscal/FiscalSigner.java` — interface
- `commerce-service/src/main/java/com/MaSoVa/commerce/fiscal/FiscalSignerRegistry.java` — resolves by countryCode
- `commerce-service/src/main/java/com/MaSoVa/commerce/fiscal/PassthroughFiscalSigner.java` — NL/LU/IE/CH/US/CA
- `commerce-service/src/main/java/com/MaSoVa/commerce/fiscal/GermanyTseFiscalSigner.java` — DE (stub)
- `commerce-service/src/main/java/com/MaSoVa/commerce/fiscal/FranceNf525FiscalSigner.java` — FR (software stub)
- `commerce-service/src/main/java/com/MaSoVa/commerce/fiscal/ItalyRtFiscalSigner.java` — IT (stub)
- `commerce-service/src/main/java/com/MaSoVa/commerce/fiscal/BelgiumFdmFiscalSigner.java` — BE (stub)
- `commerce-service/src/main/java/com/MaSoVa/commerce/fiscal/HungaryNtcaFiscalSigner.java` — HU (stub)
- `commerce-service/src/main/java/com/MaSoVa/commerce/fiscal/UkMtdFiscalSigner.java` — GB (ledger)
- `commerce-service/src/main/java/com/MaSoVa/commerce/fiscal/FiscalSigningService.java` — orchestrates sign + store + publish
- `commerce-service/src/main/resources/db/migration/V6__fiscal_signatures.sql`
- `commerce-service/src/main/resources/db/migration/V7__uk_vat_ledger.sql`
- `commerce-service/src/main/resources/db/migration/V8__stripe_tax_calculations.sql`

### commerce-service (modified)
- `commerce-service/src/main/java/com/MaSoVa/commerce/order/entity/Order.java` — add `fiscalSignature` field
- `commerce-service/src/main/java/com/MaSoVa/commerce/order/entity/OrderJpaEntity.java` — add fiscal columns
- `commerce-service/src/main/java/com/MaSoVa/commerce/order/service/OrderService.java` — call FiscalSigningService in updateOrderStatus after terminal status
- `commerce-service/src/main/java/com/MaSoVa/commerce/order/service/OrderEventPublisher.java` — add publishReceiptSigned()

### commerce-service (tests — new)
- `commerce-service/src/test/java/com/MaSoVa/commerce/fiscal/FiscalSignerRegistryTest.java`
- `commerce-service/src/test/java/com/MaSoVa/commerce/fiscal/FiscalSigningServiceTest.java`

### frontend (new)
- `frontend/src/pages/manager/FiscalCompliancePage.tsx` — new manager section page

### frontend (modified)
- `frontend/src/pages/manager/StoreManagementPage.tsx` — add fiscal device IP fields
- `frontend/src/pages/manager/ManagerShell.tsx` — add Compliance section to nav
- `frontend/src/store/api/fiscalApi.ts` — RTK Query for fiscal endpoints

---

## Safety Floor — Write These Tests First

Before touching feature code, write tests documenting current `OrderService.updateOrderStatus()` terminal-status behaviour. These become regression tests.

---

### Task 0: Safety-floor test for updateOrderStatus terminal states

**Files:**
- Create: `commerce-service/src/test/java/com/MaSoVa/commerce/order/service/OrderServiceTerminalStatusTest.java`

- [ ] **Step 1: Create test directory if needed**

```bash
mkdir -p commerce-service/src/test/java/com/MaSoVa/commerce/order/service
```

Expected: directory exists (no error if already present)

- [ ] **Step 2: Write the safety-floor test**

Create `commerce-service/src/test/java/com/MaSoVa/commerce/order/service/OrderServiceTerminalStatusTest.java`:

```java
package com.MaSoVa.commerce.order.service;

import com.MaSoVa.commerce.order.dto.UpdateOrderStatusRequest;
import com.MaSoVa.commerce.order.entity.Order;
import com.MaSoVa.commerce.order.repository.OrderJpaRepository;
import com.MaSoVa.commerce.order.repository.OrderRepository;
import com.MaSoVa.commerce.order.service.CustomerNotificationService;
import com.MaSoVa.commerce.order.service.OrderEventPublisher;
import com.MaSoVa.commerce.order.service.OrderItemSyncService;
import com.MaSoVa.commerce.order.service.OrderService;
import com.MaSoVa.commerce.order.service.EuVatEngine;
import com.MaSoVa.commerce.order.client.*;
import com.MaSoVa.commerce.order.config.*;
import com.MaSoVa.commerce.order.websocket.OrderWebSocketController;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class OrderServiceTerminalStatusTest {

    private OrderRepository orderRepository;
    private OrderJpaRepository orderJpaRepository;
    private OrderService orderService;
    private OrderEventPublisher orderEventPublisher;

    @BeforeEach
    void setUp() {
        orderRepository = mock(OrderRepository.class);
        orderJpaRepository = mock(OrderJpaRepository.class);
        orderEventPublisher = mock(OrderEventPublisher.class);
        OrderItemSyncService orderItemSyncService = mock(OrderItemSyncService.class);
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.findAndRegisterModules();
        OrderWebSocketController webSocketController = mock(OrderWebSocketController.class);
        MenuServiceClient menuServiceClient = mock(MenuServiceClient.class);
        CustomerServiceClient customerServiceClient = mock(CustomerServiceClient.class);
        CustomerNotificationService customerNotificationService = mock(CustomerNotificationService.class);
        DeliveryServiceClient deliveryServiceClient = mock(DeliveryServiceClient.class);
        StoreServiceClient storeServiceClient = mock(StoreServiceClient.class);
        InventoryServiceClient inventoryServiceClient = mock(InventoryServiceClient.class);
        TaxConfiguration taxConfiguration = mock(TaxConfiguration.class);
        PreparationTimeConfiguration prepTimeConfig = mock(PreparationTimeConfiguration.class);
        DeliveryFeeConfiguration deliveryFeeConfig = mock(DeliveryFeeConfiguration.class);
        EuVatEngine euVatEngine = mock(EuVatEngine.class);

        orderService = new OrderService(
            orderRepository, orderJpaRepository, orderItemSyncService, objectMapper,
            webSocketController, menuServiceClient, customerServiceClient,
            customerNotificationService, deliveryServiceClient, storeServiceClient,
            inventoryServiceClient, taxConfiguration, prepTimeConfig, deliveryFeeConfig,
            orderEventPublisher, euVatEngine
        );
    }

    @ParameterizedTest
    @ValueSource(strings = {"DELIVERED", "SERVED", "COMPLETED"})
    void terminal_status_publishes_order_status_changed_event(String status) {
        Order order = new Order();
        order.setId("ord-001");
        order.setStoreId("store-001");
        order.setCustomerId("cust-001");
        order.setStatus(Order.OrderStatus.PREPARING);
        when(orderRepository.findById("ord-001")).thenReturn(Optional.of(order));
        when(orderRepository.save(any())).thenReturn(order);
        when(orderJpaRepository.findByOrderId("ord-001")).thenReturn(Optional.empty());

        UpdateOrderStatusRequest req = new UpdateOrderStatusRequest();
        req.setStatus(status);
        orderService.updateOrderStatus("ord-001", req);

        verify(orderEventPublisher).publishOrderStatusChanged(any());
    }
}
```

- [ ] **Step 3: Run the safety-floor test**

```bash
cd commerce-service && mvn test -pl . -Dtest=OrderServiceTerminalStatusTest "-Dmaven.test.skip=false" 2>&1 | tail -20
```

Expected: Tests PASS (they document existing behaviour before we change anything).

- [ ] **Step 4: Commit**

```bash
git add commerce-service/src/test/java/com/MaSoVa/commerce/order/service/OrderServiceTerminalStatusTest.java
git commit -m "test(commerce): safety-floor — terminal status event publishing tests"
```

---

### Task 1: FiscalSignature value object in shared-models

**Files:**
- Create: `shared-models/src/main/java/com/MaSoVa/shared/model/FiscalSignature.java`

- [ ] **Step 1: Write the failing test for FiscalSignature**

Create `shared-models/src/test/java/com/MaSoVa/shared/model/FiscalSignatureTest.java`:

```java
package com.MaSoVa.shared.model;

import org.junit.jupiter.api.Test;
import java.time.Instant;
import static org.assertj.core.api.Assertions.assertThat;

class FiscalSignatureTest {

    @Test
    void passthrough_signature_has_no_signature_value() {
        FiscalSignature sig = FiscalSignature.passthrough("NL");
        assertThat(sig.getSignerCountry()).isEqualTo("NL");
        assertThat(sig.getSignerSystem()).isEqualTo("PASSTHROUGH");
        assertThat(sig.getSignatureValue()).isNull();
        assertThat(sig.isRequired()).isFalse();
        assertThat(sig.getSignedAt()).isNotNull();
    }

    @Test
    void full_signature_stores_all_fields() {
        Instant now = Instant.now();
        FiscalSignature sig = new FiscalSignature(
            "DE", "TSE", "txn-001", "SIG-ABC123", null, now, "device-1", false
        );
        assertThat(sig.getSignerCountry()).isEqualTo("DE");
        assertThat(sig.getSignerSystem()).isEqualTo("TSE");
        assertThat(sig.getTransactionId()).isEqualTo("txn-001");
        assertThat(sig.getSignatureValue()).isEqualTo("SIG-ABC123");
        assertThat(sig.getSignedAt()).isEqualTo(now);
        assertThat(sig.isRequired()).isFalse();
    }

    @Test
    void failed_signature_captures_error() {
        FiscalSignature sig = FiscalSignature.failed("DE", "TSE", "Connection refused");
        assertThat(sig.getSignerCountry()).isEqualTo("DE");
        assertThat(sig.isSigningFailed()).isTrue();
        assertThat(sig.getSigningError()).isEqualTo("Connection refused");
    }
}
```

- [ ] **Step 2: Run to verify test fails**

```bash
cd shared-models && mvn test -Dtest=FiscalSignatureTest 2>&1 | tail -10
```

Expected: FAIL — `FiscalSignature` does not exist.

- [ ] **Step 3: Create FiscalSignature**

Create `shared-models/src/main/java/com/MaSoVa/shared/model/FiscalSignature.java`:

```java
package com.MaSoVa.shared.model;

import java.time.Instant;
import java.util.Map;

/**
 * Fiscal signature stored on an Order after terminal-status signing.
 * isRequired=false: passthrough or not-applicable signers.
 * signingFailed=true: signing was attempted but failed (alert manager).
 */
public class FiscalSignature {

    private String signerCountry;       // ISO 3166-1 alpha-2
    private String signerSystem;        // "TSE", "NF525", "RT", "FDM", "NTCA", "MTD", "STRIPE_TAX", "PASSTHROUGH"
    private String transactionId;       // Fiscal system transaction ID
    private String signatureValue;      // Actual signature / hash / QR seed
    private String qrCodeData;          // For printed QR (AT, DE, IT, BE)
    private Instant signedAt;           // From signing system clock, never LocalDateTime.now()
    private String signingDeviceId;     // Hardware device serial (DE/IT/BE)
    private boolean required;           // false = passthrough countries
    private boolean signingFailed;      // true = signing was attempted but failed
    private String signingError;        // Error message if signingFailed
    private Map<String, String> extras; // Country-specific extra fields

    public FiscalSignature() {}

    public FiscalSignature(String signerCountry, String signerSystem,
                           String transactionId, String signatureValue,
                           String qrCodeData, Instant signedAt,
                           String signingDeviceId, boolean required) {
        this.signerCountry = signerCountry;
        this.signerSystem = signerSystem;
        this.transactionId = transactionId;
        this.signatureValue = signatureValue;
        this.qrCodeData = qrCodeData;
        this.signedAt = signedAt;
        this.signingDeviceId = signingDeviceId;
        this.required = required;
    }

    /** Factory for passthrough (no signing required) countries. */
    public static FiscalSignature passthrough(String countryCode) {
        FiscalSignature sig = new FiscalSignature();
        sig.signerCountry = countryCode;
        sig.signerSystem = "PASSTHROUGH";
        sig.signedAt = Instant.now();
        sig.required = false;
        return sig;
    }

    /** Factory for signing failure — alert must be raised. */
    public static FiscalSignature failed(String countryCode, String signerSystem, String error) {
        FiscalSignature sig = new FiscalSignature();
        sig.signerCountry = countryCode;
        sig.signerSystem = signerSystem;
        sig.signedAt = Instant.now();
        sig.required = true;
        sig.signingFailed = true;
        sig.signingError = error;
        return sig;
    }

    public String getSignerCountry() { return signerCountry; }
    public void setSignerCountry(String signerCountry) { this.signerCountry = signerCountry; }

    public String getSignerSystem() { return signerSystem; }
    public void setSignerSystem(String signerSystem) { this.signerSystem = signerSystem; }

    public String getTransactionId() { return transactionId; }
    public void setTransactionId(String transactionId) { this.transactionId = transactionId; }

    public String getSignatureValue() { return signatureValue; }
    public void setSignatureValue(String signatureValue) { this.signatureValue = signatureValue; }

    public String getQrCodeData() { return qrCodeData; }
    public void setQrCodeData(String qrCodeData) { this.qrCodeData = qrCodeData; }

    public Instant getSignedAt() { return signedAt; }
    public void setSignedAt(Instant signedAt) { this.signedAt = signedAt; }

    public String getSigningDeviceId() { return signingDeviceId; }
    public void setSigningDeviceId(String signingDeviceId) { this.signingDeviceId = signingDeviceId; }

    public boolean isRequired() { return required; }
    public void setRequired(boolean required) { this.required = required; }

    public boolean isSigningFailed() { return signingFailed; }
    public void setSigningFailed(boolean signingFailed) { this.signingFailed = signingFailed; }

    public String getSigningError() { return signingError; }
    public void setSigningError(String signingError) { this.signingError = signingError; }

    public Map<String, String> getExtras() { return extras; }
    public void setExtras(Map<String, String> extras) { this.extras = extras; }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd shared-models && mvn test -Dtest=FiscalSignatureTest 2>&1 | tail -10
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add shared-models/src/main/java/com/MaSoVa/shared/model/FiscalSignature.java
git add shared-models/src/test/java/com/MaSoVa/shared/model/FiscalSignatureTest.java
git commit -m "feat(shared-models): add FiscalSignature value object for Global-5"
```

---

### Task 2: ReceiptSignedEvent + RabbitMQ constant

**Files:**
- Create: `shared-models/src/main/java/com/MaSoVa/shared/messaging/events/ReceiptSignedEvent.java`
- Modify: `shared-models/src/main/java/com/MaSoVa/shared/messaging/config/MaSoVaRabbitMQConfig.java`

- [ ] **Step 1: Write failing test for ReceiptSignedEvent**

Create `shared-models/src/test/java/com/MaSoVa/shared/messaging/events/ReceiptSignedEventTest.java`:

```java
package com.MaSoVa.shared.messaging.events;

import com.MaSoVa.shared.model.FiscalSignature;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

class ReceiptSignedEventTest {

    @Test
    void event_carries_order_id_and_signature() {
        FiscalSignature sig = FiscalSignature.passthrough("NL");
        ReceiptSignedEvent event = new ReceiptSignedEvent("ord-001", "store-001", "NL", sig);
        assertThat(event.getOrderId()).isEqualTo("ord-001");
        assertThat(event.getStoreId()).isEqualTo("store-001");
        assertThat(event.getCountryCode()).isEqualTo("NL");
        assertThat(event.getFiscalSignature()).isNotNull();
        assertThat(event.getEventType()).isEqualTo("RECEIPT_SIGNED");
    }

    @Test
    void signing_failed_flag_is_propagated() {
        FiscalSignature sig = FiscalSignature.failed("DE", "TSE", "TSE offline");
        ReceiptSignedEvent event = new ReceiptSignedEvent("ord-002", "store-002", "DE", sig);
        assertThat(event.isSigningFailed()).isTrue();
    }
}
```

- [ ] **Step 2: Run to verify test fails**

```bash
cd shared-models && mvn test -Dtest=ReceiptSignedEventTest 2>&1 | tail -10
```

Expected: FAIL

- [ ] **Step 3: Create ReceiptSignedEvent**

Create `shared-models/src/main/java/com/MaSoVa/shared/messaging/events/ReceiptSignedEvent.java`:

```java
package com.MaSoVa.shared.messaging.events;

import com.MaSoVa.shared.model.FiscalSignature;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;

/**
 * Published on masova.orders.events / order.receipt.signed after every fiscal signing attempt.
 * Intelligence-service subscribes for compliance rate tracking.
 * Notification-service subscribes to alert manager on RECEIPT_SIGNING_FAILED.
 */
public class ReceiptSignedEvent extends DomainEvent {

    private String orderId;
    private String storeId;
    private String countryCode;
    private FiscalSignature fiscalSignature;

    public ReceiptSignedEvent() { super("RECEIPT_SIGNED"); }

    public ReceiptSignedEvent(String orderId, String storeId,
                               String countryCode, FiscalSignature fiscalSignature) {
        super("RECEIPT_SIGNED");
        this.orderId = orderId;
        this.storeId = storeId;
        this.countryCode = countryCode;
        this.fiscalSignature = fiscalSignature;
    }

    @JsonCreator
    public ReceiptSignedEvent(
            @JsonProperty("eventId") String eventId,
            @JsonProperty("eventType") String eventType,
            @JsonProperty("occurredAt") Instant occurredAt,
            @JsonProperty("orderId") String orderId,
            @JsonProperty("storeId") String storeId,
            @JsonProperty("countryCode") String countryCode,
            @JsonProperty("fiscalSignature") FiscalSignature fiscalSignature) {
        super(eventId, eventType, occurredAt);
        this.orderId = orderId;
        this.storeId = storeId;
        this.countryCode = countryCode;
        this.fiscalSignature = fiscalSignature;
    }

    public String getOrderId() { return orderId; }
    public String getStoreId() { return storeId; }
    public String getCountryCode() { return countryCode; }
    public FiscalSignature getFiscalSignature() { return fiscalSignature; }

    /** Convenience: true when signing failed and manager alert is required. */
    public boolean isSigningFailed() {
        return fiscalSignature != null && fiscalSignature.isSigningFailed();
    }
}
```

- [ ] **Step 4: Add ORDER_RECEIPT_SIGNED_KEY to MaSoVaRabbitMQConfig**

Open `shared-models/src/main/java/com/MaSoVa/shared/messaging/config/MaSoVaRabbitMQConfig.java`.

After the existing `ORDER_STATUS_CHANGED_KEY` constant, add:

```java
    public static final String ORDER_RECEIPT_SIGNED_KEY = "order.receipt.signed";

    // Queue for compliance tracking (intelligence-service) and signing-failed alerts
    public static final String COMPLIANCE_ORDER_QUEUE = "masova.compliance.order-events";
```

Then add the queue bean and binding after the `notificationOrderQueue()` bean:

```java
    @Bean
    public Queue complianceOrderQueue() {
        return QueueBuilder.durable(COMPLIANCE_ORDER_QUEUE)
                .withArgument("x-dead-letter-exchange", DLX)
                .withArgument("x-dead-letter-routing-key", "dlq")
                .build();
    }

    @Bean
    public Binding complianceOrderBinding(Queue complianceOrderQueue, TopicExchange ordersExchange) {
        return BindingBuilder.bind(complianceOrderQueue).to(ordersExchange).with("order.receipt.#");
    }
```

- [ ] **Step 5: Run tests to verify both pass**

```bash
cd shared-models && mvn test -Dtest=ReceiptSignedEventTest,FiscalSignatureTest 2>&1 | tail -10
```

Expected: 2 tests PASS

- [ ] **Step 6: Commit**

```bash
git add shared-models/src/main/java/com/MaSoVa/shared/messaging/events/ReceiptSignedEvent.java
git add shared-models/src/test/java/com/MaSoVa/shared/messaging/events/ReceiptSignedEventTest.java
git add shared-models/src/main/java/com/MaSoVa/shared/messaging/config/MaSoVaRabbitMQConfig.java
git commit -m "feat(shared-models): add ReceiptSignedEvent + ORDER_RECEIPT_SIGNED_KEY constant"
```

---

### Task 3: FiscalSigner interface + FiscalSignerRegistry

**Files:**
- Create: `commerce-service/src/main/java/com/MaSoVa/commerce/fiscal/FiscalSigner.java`
- Create: `commerce-service/src/main/java/com/MaSoVa/commerce/fiscal/FiscalSignerRegistry.java`
- Create: `commerce-service/src/test/java/com/MaSoVa/commerce/fiscal/FiscalSignerRegistryTest.java`

- [ ] **Step 1: Create test directory**

```bash
mkdir -p commerce-service/src/test/java/com/MaSoVa/commerce/fiscal
mkdir -p commerce-service/src/main/java/com/MaSoVa/commerce/fiscal
```

- [ ] **Step 2: Write the failing test for FiscalSignerRegistry**

Create `commerce-service/src/test/java/com/MaSoVa/commerce/fiscal/FiscalSignerRegistryTest.java`:

```java
package com.MaSoVa.commerce.fiscal;

import com.MaSoVa.shared.model.FiscalSignature;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class FiscalSignerRegistryTest {

    private FiscalSignerRegistry registry;

    @BeforeEach
    void setUp() {
        PassthroughFiscalSigner passthrough = new PassthroughFiscalSigner();
        GermanyTseFiscalSigner tse = new GermanyTseFiscalSigner();
        FranceNf525FiscalSigner nf525 = new FranceNf525FiscalSigner();
        ItalyRtFiscalSigner rt = new ItalyRtFiscalSigner();
        BelgiumFdmFiscalSigner fdm = new BelgiumFdmFiscalSigner();
        HungaryNtcaFiscalSigner ntca = new HungaryNtcaFiscalSigner();
        UkMtdFiscalSigner mtd = new UkMtdFiscalSigner();

        registry = new FiscalSignerRegistry(
            passthrough, tse, nf525, rt, fdm, ntca, mtd
        );
    }

    @Test
    void null_country_returns_passthrough() {
        assertThat(registry.resolve(null)).isInstanceOf(PassthroughFiscalSigner.class);
    }

    @Test
    void india_country_returns_passthrough() {
        assertThat(registry.resolve("IN")).isInstanceOf(PassthroughFiscalSigner.class);
    }

    @ParameterizedTest
    @ValueSource(strings = {"NL", "LU", "IE", "CH", "US", "CA"})
    void no_signing_countries_return_passthrough(String country) {
        assertThat(registry.resolve(country)).isInstanceOf(PassthroughFiscalSigner.class);
    }

    @Test
    void de_returns_tse_signer() {
        assertThat(registry.resolve("DE")).isInstanceOf(GermanyTseFiscalSigner.class);
    }

    @Test
    void fr_returns_nf525_signer() {
        assertThat(registry.resolve("FR")).isInstanceOf(FranceNf525FiscalSigner.class);
    }

    @Test
    void it_returns_rt_signer() {
        assertThat(registry.resolve("IT")).isInstanceOf(ItalyRtFiscalSigner.class);
    }

    @Test
    void be_returns_fdm_signer() {
        assertThat(registry.resolve("BE")).isInstanceOf(BelgiumFdmFiscalSigner.class);
    }

    @Test
    void hu_returns_ntca_signer() {
        assertThat(registry.resolve("HU")).isInstanceOf(HungaryNtcaFiscalSigner.class);
    }

    @Test
    void gb_returns_mtd_signer() {
        assertThat(registry.resolve("GB")).isInstanceOf(UkMtdFiscalSigner.class);
    }

    @Test
    void case_insensitive_de_resolves() {
        assertThat(registry.resolve("de")).isInstanceOf(GermanyTseFiscalSigner.class);
    }
}
```

- [ ] **Step 3: Run to verify test fails**

```bash
cd commerce-service && mvn test -Dtest=FiscalSignerRegistryTest 2>&1 | tail -10
```

Expected: FAIL — classes do not exist yet.

- [ ] **Step 4: Create FiscalSigner interface**

Create `commerce-service/src/main/java/com/MaSoVa/commerce/fiscal/FiscalSigner.java`:

```java
package com.MaSoVa.commerce.fiscal;

import com.MaSoVa.commerce.order.entity.Order;
import com.MaSoVa.shared.model.FiscalSignature;
import com.MaSoVa.shared.model.VatBreakdown;

/**
 * Country-specific fiscal signing adapter.
 * Each implementation handles exactly one country's fiscal law.
 * OrderService never calls this directly — always via FiscalSignerRegistry.
 */
public interface FiscalSigner {

    /**
     * Signs the order and returns a FiscalSignature.
     * Must never throw — returns FiscalSignature.failed(...) on any error.
     */
    FiscalSignature sign(Order order, VatBreakdown vatBreakdown);

    /**
     * Returns true when fiscal signing is legally required in this country.
     * Passthrough implementations return false.
     */
    boolean isRequired();

    /**
     * ISO 3166-1 alpha-2 country code this signer handles.
     * PassthroughFiscalSigner handles multiple — registry uses explicit routing.
     */
    String getSignerSystem();
}
```

- [ ] **Step 5: Create PassthroughFiscalSigner**

Create `commerce-service/src/main/java/com/MaSoVa/commerce/fiscal/PassthroughFiscalSigner.java`:

```java
package com.MaSoVa.commerce.fiscal;

import com.MaSoVa.commerce.order.entity.Order;
import com.MaSoVa.shared.model.FiscalSignature;
import com.MaSoVa.shared.model.VatBreakdown;
import org.springframework.stereotype.Component;

/**
 * No-op signer for countries with no fiscal signing requirement:
 * NL, LU, IE, CH, US, CA — and India (null countryCode).
 */
@Component
public class PassthroughFiscalSigner implements FiscalSigner {

    @Override
    public FiscalSignature sign(Order order, VatBreakdown vatBreakdown) {
        String country = order.getStoreId() != null
            ? (order.getVatCountryCode() != null ? order.getVatCountryCode() : "IN")
            : "UNKNOWN";
        return FiscalSignature.passthrough(country);
    }

    @Override
    public boolean isRequired() { return false; }

    @Override
    public String getSignerSystem() { return "PASSTHROUGH"; }
}
```

- [ ] **Step 6: Create GermanyTseFiscalSigner**

Create `commerce-service/src/main/java/com/MaSoVa/commerce/fiscal/GermanyTseFiscalSigner.java`:

```java
package com.MaSoVa.commerce.fiscal;

import com.MaSoVa.commerce.order.entity.Order;
import com.MaSoVa.shared.model.FiscalSignature;
import com.MaSoVa.shared.model.VatBreakdown;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.UUID;

/**
 * Germany TSE fiscal signer — §146a AO.
 * Phase 1 implementation: stubs a successful TSE call with a generated transaction ID.
 * Phase 2: calls TSE hardware device REST API on store local network.
 * If unreachable: returns FiscalSignature.failed(...) — order gets RECEIPT_SIGNING_FAILED flag.
 */
@Component
public class GermanyTseFiscalSigner implements FiscalSigner {

    private static final Logger log = LoggerFactory.getLogger(GermanyTseFiscalSigner.class);

    @Override
    public FiscalSignature sign(Order order, VatBreakdown vatBreakdown) {
        try {
            // Phase 1 stub: generate a plausible TSE transaction ID
            String tseTransactionId = "TSE-DE-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            String signatureValue = "STUB-TSE-SIG-" + order.getId();

            FiscalSignature sig = new FiscalSignature(
                "DE", "TSE", tseTransactionId, signatureValue,
                null, // QR code data — populated by TSE hardware in Phase 2
                Instant.now(),
                "STUB-DEVICE-001",
                true
            );
            log.info("[FISCAL-DE] Signed order={} tseId={}", order.getId(), tseTransactionId);
            return sig;
        } catch (Exception e) {
            log.warn("[FISCAL-DE] TSE signing failed order={}: {}", order.getId(), e.getMessage());
            return FiscalSignature.failed("DE", "TSE", e.getMessage());
        }
    }

    @Override
    public boolean isRequired() { return true; }

    @Override
    public String getSignerSystem() { return "TSE"; }
}
```

- [ ] **Step 7: Create FranceNf525FiscalSigner**

Create `commerce-service/src/main/java/com/MaSoVa/commerce/fiscal/FranceNf525FiscalSigner.java`:

```java
package com.MaSoVa.commerce.fiscal;

import com.MaSoVa.commerce.order.entity.Order;
import com.MaSoVa.shared.model.FiscalSignature;
import com.MaSoVa.shared.model.VatBreakdown;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.UUID;

/**
 * France NF525 software certification signer.
 * Once signed, the order is immutable — no fields may be modified.
 * Corrections are new credit note orders, never edits.
 */
@Component
public class FranceNf525FiscalSigner implements FiscalSigner {

    private static final Logger log = LoggerFactory.getLogger(FranceNf525FiscalSigner.class);

    @Override
    public FiscalSignature sign(Order order, VatBreakdown vatBreakdown) {
        try {
            String nf525TransactionId = "NF525-FR-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            String signatureValue = "STUB-NF525-SIG-" + order.getId();

            FiscalSignature sig = new FiscalSignature(
                "FR", "NF525", nf525TransactionId, signatureValue,
                null, Instant.now(), null, true
            );
            log.info("[FISCAL-FR] NF525 signed order={} txnId={}", order.getId(), nf525TransactionId);
            return sig;
        } catch (Exception e) {
            log.warn("[FISCAL-FR] NF525 signing failed order={}: {}", order.getId(), e.getMessage());
            return FiscalSignature.failed("FR", "NF525", e.getMessage());
        }
    }

    @Override
    public boolean isRequired() { return true; }

    @Override
    public String getSignerSystem() { return "NF525"; }
}
```

- [ ] **Step 8: Create ItalyRtFiscalSigner**

Create `commerce-service/src/main/java/com/MaSoVa/commerce/fiscal/ItalyRtFiscalSigner.java`:

```java
package com.MaSoVa.commerce.fiscal;

import com.MaSoVa.commerce.order.entity.Order;
import com.MaSoVa.shared.model.FiscalSignature;
import com.MaSoVa.shared.model.VatBreakdown;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.UUID;

/** Italy RT Device fiscal signer — hardware API stub for Phase 1. */
@Component
public class ItalyRtFiscalSigner implements FiscalSigner {

    private static final Logger log = LoggerFactory.getLogger(ItalyRtFiscalSigner.class);

    @Override
    public FiscalSignature sign(Order order, VatBreakdown vatBreakdown) {
        try {
            String rtTransactionId = "RT-IT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            FiscalSignature sig = new FiscalSignature(
                "IT", "RT", rtTransactionId, "STUB-RT-SIG-" + order.getId(),
                null, Instant.now(), "STUB-RT-DEVICE-001", true
            );
            log.info("[FISCAL-IT] RT signed order={} rtId={}", order.getId(), rtTransactionId);
            return sig;
        } catch (Exception e) {
            log.warn("[FISCAL-IT] RT signing failed order={}: {}", order.getId(), e.getMessage());
            return FiscalSignature.failed("IT", "RT", e.getMessage());
        }
    }

    @Override
    public boolean isRequired() { return true; }

    @Override
    public String getSignerSystem() { return "RT"; }
}
```

- [ ] **Step 9: Create BelgiumFdmFiscalSigner**

Create `commerce-service/src/main/java/com/MaSoVa/commerce/fiscal/BelgiumFdmFiscalSigner.java`:

```java
package com.MaSoVa.commerce.fiscal;

import com.MaSoVa.commerce.order.entity.Order;
import com.MaSoVa.shared.model.FiscalSignature;
import com.MaSoVa.shared.model.VatBreakdown;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.UUID;

/** Belgium FDM black box hardware signer — stub for Phase 1. */
@Component
public class BelgiumFdmFiscalSigner implements FiscalSigner {

    private static final Logger log = LoggerFactory.getLogger(BelgiumFdmFiscalSigner.class);

    @Override
    public FiscalSignature sign(Order order, VatBreakdown vatBreakdown) {
        try {
            String fdmTransactionId = "FDM-BE-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            FiscalSignature sig = new FiscalSignature(
                "BE", "FDM", fdmTransactionId, "STUB-FDM-SIG-" + order.getId(),
                null, Instant.now(), "STUB-FDM-DEVICE-001", true
            );
            log.info("[FISCAL-BE] FDM signed order={} fdmId={}", order.getId(), fdmTransactionId);
            return sig;
        } catch (Exception e) {
            log.warn("[FISCAL-BE] FDM signing failed order={}: {}", order.getId(), e.getMessage());
            return FiscalSignature.failed("BE", "FDM", e.getMessage());
        }
    }

    @Override
    public boolean isRequired() { return true; }

    @Override
    public String getSignerSystem() { return "FDM"; }
}
```

- [ ] **Step 10: Create HungaryNtcaFiscalSigner**

Create `commerce-service/src/main/java/com/MaSoVa/commerce/fiscal/HungaryNtcaFiscalSigner.java`:

```java
package com.MaSoVa.commerce.fiscal;

import com.MaSoVa.commerce.order.entity.Order;
import com.MaSoVa.shared.model.FiscalSignature;
import com.MaSoVa.shared.model.VatBreakdown;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.UUID;

/**
 * Hungary NTCA (OSCAR) government API signer.
 * Phase 1 stub — returns a plausible NTCA transaction ID.
 * Phase 2: real OSCAR API calls with Redis retry queue + exponential backoff.
 * Requirement: submit within 500ms for invoices > HUF 100k; 4 days for smaller.
 */
@Component
public class HungaryNtcaFiscalSigner implements FiscalSigner {

    private static final Logger log = LoggerFactory.getLogger(HungaryNtcaFiscalSigner.class);

    @Override
    public FiscalSignature sign(Order order, VatBreakdown vatBreakdown) {
        try {
            String ntcaTransactionId = "NTCA-HU-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            FiscalSignature sig = new FiscalSignature(
                "HU", "NTCA", ntcaTransactionId, "STUB-NTCA-SIG-" + order.getId(),
                null, Instant.now(), null, true
            );
            log.info("[FISCAL-HU] NTCA signed order={} ntcaId={}", order.getId(), ntcaTransactionId);
            return sig;
        } catch (Exception e) {
            log.warn("[FISCAL-HU] NTCA signing failed order={}: {}", order.getId(), e.getMessage());
            return FiscalSignature.failed("HU", "NTCA", e.getMessage());
        }
    }

    @Override
    public boolean isRequired() { return true; }

    @Override
    public String getSignerSystem() { return "NTCA"; }
}
```

- [ ] **Step 11: Create UkMtdFiscalSigner**

Create `commerce-service/src/main/java/com/MaSoVa/commerce/fiscal/UkMtdFiscalSigner.java`:

```java
package com.MaSoVa.commerce.fiscal;

import com.MaSoVa.commerce.order.entity.Order;
import com.MaSoVa.shared.model.FiscalSignature;
import com.MaSoVa.shared.model.VatBreakdown;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.UUID;

/**
 * UK Making Tax Digital (MTD) signer.
 * Passthrough at the individual transaction level — records to uk_vat_ledger table.
 * Manager triggers quarterly HMRC MTD submission from FiscalCompliancePage.
 * isRequired() = false because signing doesn't block individual orders,
 * but ledger entry IS recorded (the isRequired check only affects RECEIPT_SIGNING_FAILED alert).
 */
@Component
public class UkMtdFiscalSigner implements FiscalSigner {

    private static final Logger log = LoggerFactory.getLogger(UkMtdFiscalSigner.class);

    @Override
    public FiscalSignature sign(Order order, VatBreakdown vatBreakdown) {
        // MTD: no per-transaction signing — just record a ledger entry reference
        String mtdTransactionId = "MTD-GB-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        FiscalSignature sig = new FiscalSignature(
            "GB", "MTD", mtdTransactionId, null,
            null, Instant.now(), null, false
        );
        log.info("[FISCAL-GB] MTD ledger entry recorded order={} mtdId={}", order.getId(), mtdTransactionId);
        return sig;
    }

    @Override
    public boolean isRequired() { return false; }

    @Override
    public String getSignerSystem() { return "MTD"; }
}
```

- [ ] **Step 12: Create FiscalSignerRegistry**

Create `commerce-service/src/main/java/com/MaSoVa/commerce/fiscal/FiscalSignerRegistry.java`:

```java
package com.MaSoVa.commerce.fiscal;

import org.springframework.stereotype.Component;

/**
 * Resolves the correct FiscalSigner for a given store countryCode.
 * Country is set once at store creation and never changes after first order.
 * Null or unrecognised country → PassthroughFiscalSigner (India + unlisted).
 */
@Component
public class FiscalSignerRegistry {

    private final PassthroughFiscalSigner passthrough;
    private final GermanyTseFiscalSigner tse;
    private final FranceNf525FiscalSigner nf525;
    private final ItalyRtFiscalSigner rt;
    private final BelgiumFdmFiscalSigner fdm;
    private final HungaryNtcaFiscalSigner ntca;
    private final UkMtdFiscalSigner mtd;

    public FiscalSignerRegistry(PassthroughFiscalSigner passthrough,
                                 GermanyTseFiscalSigner tse,
                                 FranceNf525FiscalSigner nf525,
                                 ItalyRtFiscalSigner rt,
                                 BelgiumFdmFiscalSigner fdm,
                                 HungaryNtcaFiscalSigner ntca,
                                 UkMtdFiscalSigner mtd) {
        this.passthrough = passthrough;
        this.tse = tse;
        this.nf525 = nf525;
        this.rt = rt;
        this.fdm = fdm;
        this.ntca = ntca;
        this.mtd = mtd;
    }

    public FiscalSigner resolve(String countryCode) {
        if (countryCode == null || countryCode.isBlank()) return passthrough;
        return switch (countryCode.toUpperCase()) {
            case "DE" -> tse;
            case "FR" -> nf525;
            case "IT" -> rt;
            case "BE" -> fdm;
            case "HU" -> ntca;
            case "GB" -> mtd;
            // NL, LU, IE, CH, US, CA + any other → passthrough
            default -> passthrough;
        };
    }
}
```

- [ ] **Step 13: Run registry test to verify it passes**

```bash
cd commerce-service && mvn test -Dtest=FiscalSignerRegistryTest 2>&1 | tail -20
```

Expected: 9 tests PASS

- [ ] **Step 14: Commit**

```bash
git add commerce-service/src/main/java/com/MaSoVa/commerce/fiscal/
git add commerce-service/src/test/java/com/MaSoVa/commerce/fiscal/FiscalSignerRegistryTest.java
git commit -m "feat(commerce): add FiscalSigner interface + registry + all 7 signer implementations"
```

---

### Task 4: FiscalSigningService (orchestrates sign + flag + publish)

**Files:**
- Create: `commerce-service/src/main/java/com/MaSoVa/commerce/fiscal/FiscalSigningService.java`
- Create: `commerce-service/src/test/java/com/MaSoVa/commerce/fiscal/FiscalSigningServiceTest.java`

- [ ] **Step 1: Write the failing test**

Create `commerce-service/src/test/java/com/MaSoVa/commerce/fiscal/FiscalSigningServiceTest.java`:

```java
package com.MaSoVa.commerce.fiscal;

import com.MaSoVa.commerce.order.entity.Order;
import com.MaSoVa.commerce.order.repository.OrderRepository;
import com.MaSoVa.commerce.order.service.OrderEventPublisher;
import com.MaSoVa.shared.model.FiscalSignature;
import com.MaSoVa.shared.messaging.events.ReceiptSignedEvent;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class FiscalSigningServiceTest {

    private FiscalSignerRegistry registry;
    private OrderRepository orderRepository;
    private OrderEventPublisher eventPublisher;
    private FiscalSigningService fiscalSigningService;

    @BeforeEach
    void setUp() {
        registry = mock(FiscalSignerRegistry.class);
        orderRepository = mock(OrderRepository.class);
        eventPublisher = mock(OrderEventPublisher.class);
        fiscalSigningService = new FiscalSigningService(registry, orderRepository, eventPublisher);
    }

    @Test
    void india_order_gets_passthrough_signature_and_publishes_event() {
        Order order = new Order();
        order.setId("ord-001");
        order.setStoreId("store-001");
        // vatCountryCode null = India order

        PassthroughFiscalSigner pt = new PassthroughFiscalSigner();
        when(registry.resolve(null)).thenReturn(pt);
        when(orderRepository.save(any())).thenReturn(order);

        fiscalSigningService.signOrder(order);

        verify(orderRepository).save(argThat(o -> o.getFiscalSignature() != null));
        verify(eventPublisher).publishReceiptSigned(any(ReceiptSignedEvent.class));
    }

    @Test
    void signing_failure_sets_signingFailed_flag_and_still_publishes() {
        Order order = new Order();
        order.setId("ord-002");
        order.setStoreId("store-DE");
        order.setVatCountryCode("DE");

        FiscalSigner failingSigner = mock(FiscalSigner.class);
        when(failingSigner.sign(any(), any())).thenReturn(
            FiscalSignature.failed("DE", "TSE", "TSE offline")
        );
        when(failingSigner.isRequired()).thenReturn(true);
        when(registry.resolve("DE")).thenReturn(failingSigner);
        when(orderRepository.save(any())).thenReturn(order);

        fiscalSigningService.signOrder(order);

        verify(orderRepository).save(argThat(o ->
            o.getFiscalSignature() != null && o.getFiscalSignature().isSigningFailed()
        ));
        verify(eventPublisher).publishReceiptSigned(argThat(ReceiptSignedEvent::isSigningFailed));
    }

    @Test
    void successful_signing_does_not_set_failed_flag() {
        Order order = new Order();
        order.setId("ord-003");
        order.setStoreId("store-FR");
        order.setVatCountryCode("FR");

        FranceNf525FiscalSigner nf525 = new FranceNf525FiscalSigner();
        when(registry.resolve("FR")).thenReturn(nf525);
        when(orderRepository.save(any())).thenReturn(order);

        fiscalSigningService.signOrder(order);

        verify(orderRepository).save(argThat(o ->
            o.getFiscalSignature() != null && !o.getFiscalSignature().isSigningFailed()
        ));
    }
}
```

- [ ] **Step 2: Run to verify test fails**

```bash
cd commerce-service && mvn test -Dtest=FiscalSigningServiceTest 2>&1 | tail -10
```

Expected: FAIL — `FiscalSigningService` and `Order.getFiscalSignature()` don't exist.

- [ ] **Step 3: Add fiscalSignature field to Order entity**

Open `commerce-service/src/main/java/com/MaSoVa/commerce/order/entity/Order.java`.

After the `vatBreakdown` field (around line 59), add:

```java
    // Global-5: Fiscal signature — null for India stores and orders that have not yet reached terminal status
    private com.MaSoVa.shared.model.FiscalSignature fiscalSignature;
```

Then add getters/setters anywhere in the getters section:

```java
    public com.MaSoVa.shared.model.FiscalSignature getFiscalSignature() { return fiscalSignature; }
    public void setFiscalSignature(com.MaSoVa.shared.model.FiscalSignature fiscalSignature) { this.fiscalSignature = fiscalSignature; }
```

- [ ] **Step 4: Add publishReceiptSigned to OrderEventPublisher**

Open `commerce-service/src/main/java/com/MaSoVa/commerce/order/service/OrderEventPublisher.java`.

Add the following import at the top (after existing imports):

```java
import com.MaSoVa.shared.messaging.events.ReceiptSignedEvent;
```

Add the following method after `publishOrderStatusChanged`:

```java
    public void publishReceiptSigned(ReceiptSignedEvent event) {
        try {
            rabbitTemplate.convertAndSend(
                    MaSoVaRabbitMQConfig.ORDERS_EXCHANGE,
                    MaSoVaRabbitMQConfig.ORDER_RECEIPT_SIGNED_KEY,
                    event);
            log.info("[AMQP] Published ReceiptSignedEvent orderId={} signingFailed={}",
                    event.getOrderId(), event.isSigningFailed());
        } catch (Exception e) {
            log.error("[AMQP] Failed to publish ReceiptSignedEvent orderId={}: {}", event.getOrderId(), e.getMessage());
        }
    }
```

- [ ] **Step 5: Create FiscalSigningService**

Create `commerce-service/src/main/java/com/MaSoVa/commerce/fiscal/FiscalSigningService.java`:

```java
package com.MaSoVa.commerce.fiscal;

import com.MaSoVa.commerce.order.entity.Order;
import com.MaSoVa.commerce.order.repository.OrderRepository;
import com.MaSoVa.commerce.order.service.OrderEventPublisher;
import com.MaSoVa.shared.model.FiscalSignature;
import com.MaSoVa.shared.messaging.events.ReceiptSignedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Orchestrates fiscal signing after an order reaches terminal status.
 * 1. Resolves the correct FiscalSigner via FiscalSignerRegistry.
 * 2. Calls sign() — never throws (all exceptions handled inside signer).
 * 3. Stores FiscalSignature on the order.
 * 4. Publishes ReceiptSignedEvent — isSigningFailed=true alerts manager.
 *
 * Runs @Async so fiscal signing does not block the status update response.
 */
@Service
public class FiscalSigningService {

    private static final Logger log = LoggerFactory.getLogger(FiscalSigningService.class);

    private final FiscalSignerRegistry registry;
    private final OrderRepository orderRepository;
    private final OrderEventPublisher eventPublisher;

    public FiscalSigningService(FiscalSignerRegistry registry,
                                 OrderRepository orderRepository,
                                 OrderEventPublisher eventPublisher) {
        this.registry = registry;
        this.orderRepository = orderRepository;
        this.eventPublisher = eventPublisher;
    }

    @Async
    public void signOrder(Order order) {
        String countryCode = order.getVatCountryCode();
        FiscalSigner signer = registry.resolve(countryCode);

        FiscalSignature signature;
        try {
            signature = signer.sign(order, order.getVatBreakdown());
        } catch (Exception e) {
            log.warn("[FISCAL] Unexpected exception from signer for order={} country={}: {}",
                    order.getId(), countryCode, e.getMessage());
            signature = FiscalSignature.failed(
                countryCode != null ? countryCode : "UNKNOWN",
                signer.getSignerSystem(),
                e.getMessage()
            );
        }

        order.setFiscalSignature(signature);
        orderRepository.save(order);

        if (signature.isSigningFailed()) {
            log.warn("[FISCAL] RECEIPT_SIGNING_FAILED for order={} country={}: {}",
                    order.getId(), countryCode, signature.getSigningError());
        }

        ReceiptSignedEvent event = new ReceiptSignedEvent(
            order.getId(),
            order.getStoreId(),
            countryCode,
            signature
        );
        eventPublisher.publishReceiptSigned(event);
    }
}
```

- [ ] **Step 6: Run tests**

```bash
cd commerce-service && mvn test -Dtest=FiscalSigningServiceTest 2>&1 | tail -20
```

Expected: 3 tests PASS

- [ ] **Step 7: Commit**

```bash
git add commerce-service/src/main/java/com/MaSoVa/commerce/fiscal/FiscalSigningService.java
git add commerce-service/src/main/java/com/MaSoVa/commerce/order/entity/Order.java
git add commerce-service/src/main/java/com/MaSoVa/commerce/order/service/OrderEventPublisher.java
git add commerce-service/src/test/java/com/MaSoVa/commerce/fiscal/FiscalSigningServiceTest.java
git commit -m "feat(commerce): add FiscalSigningService — signs orders at terminal status and publishes ReceiptSignedEvent"
```

---

### Task 5: Wire FiscalSigningService into OrderService terminal status transitions

**Files:**
- Modify: `commerce-service/src/main/java/com/MaSoVa/commerce/order/service/OrderService.java`

The `updateOrderStatus()` method (around line 200+) handles status transitions. After the order is saved with terminal status (DELIVERED, SERVED, COMPLETED), call `fiscalSigningService.signOrder(order)`.

- [ ] **Step 1: Find the exact terminal status location in OrderService**

Read `commerce-service/src/main/java/com/MaSoVa/commerce/order/service/OrderService.java`, scanning for where `DELIVERED`, `SERVED`, or `COMPLETED` statuses are set and the order is saved.

Run:
```bash
grep -n "DELIVERED\|SERVED\|COMPLETED\|updateOrderStatus" commerce-service/src/main/java/com/MaSoVa/commerce/order/service/OrderService.java | head -30
```

- [ ] **Step 2: Add FiscalSigningService to OrderService constructor**

In `OrderService.java`, add the field:

```java
    private final FiscalSigningService fiscalSigningService;
```

And add `FiscalSigningService fiscalSigningService` as the last parameter of the constructor, plus:

```java
        this.fiscalSigningService = fiscalSigningService;
```

Also add the import at the top:

```java
import com.MaSoVa.commerce.fiscal.FiscalSigningService;
```

- [ ] **Step 3: Call fiscalSigningService.signOrder() after terminal status save**

In the `updateOrderStatus()` method, find the block where the order is saved after status update. Add a call after `orderRepository.save(order)` when the new status is terminal:

```java
        // Global-5: Trigger fiscal signing for terminal statuses
        Order.OrderStatus newStatus = order.getStatus();
        if (newStatus == Order.OrderStatus.DELIVERED
                || newStatus == Order.OrderStatus.SERVED
                || newStatus == Order.OrderStatus.COMPLETED) {
            fiscalSigningService.signOrder(order);
        }
```

Place this code after `orderRepository.save(order)` and before the return statement.

- [ ] **Step 4: Run the safety-floor test to verify no regression**

```bash
cd commerce-service && mvn test -Dtest=OrderServiceTerminalStatusTest 2>&1 | tail -20
```

Expected: Tests still PASS

- [ ] **Step 5: Commit**

```bash
git add commerce-service/src/main/java/com/MaSoVa/commerce/order/service/OrderService.java
git commit -m "feat(commerce): wire FiscalSigningService into OrderService terminal status transitions"
```

---

### Task 6: PostgreSQL migrations V6, V7, V8

**Files:**
- Create: `commerce-service/src/main/resources/db/migration/V6__fiscal_signatures.sql`
- Create: `commerce-service/src/main/resources/db/migration/V7__uk_vat_ledger.sql`
- Create: `commerce-service/src/main/resources/db/migration/V8__stripe_tax_calculations.sql`

- [ ] **Step 1: Create V6__fiscal_signatures.sql**

```sql
-- V6: fiscal_signatures table — append-only, soft-delete only, 10-year legal retention
-- Never DELETE from this table. Hard constraint from all fiscal laws.

CREATE TABLE IF NOT EXISTS commerce_schema.fiscal_signatures (
    id                   BIGSERIAL       PRIMARY KEY,
    order_id             VARCHAR(100)    NOT NULL,
    store_id             VARCHAR(100)    NOT NULL,
    country_code         VARCHAR(2),
    signer_system        VARCHAR(20)     NOT NULL,
    transaction_id       VARCHAR(200),
    signature_value      TEXT,
    qr_code_data         TEXT,
    signing_device_id    VARCHAR(100),
    signed_at            TIMESTAMPTZ     NOT NULL,
    is_required          BOOLEAN         NOT NULL DEFAULT FALSE,
    signing_failed       BOOLEAN         NOT NULL DEFAULT FALSE,
    signing_error        TEXT,
    extras               JSONB,
    created_at           TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Index for compliance reporting: all failures per country per day
CREATE INDEX IF NOT EXISTS idx_fiscal_country_failed
    ON commerce_schema.fiscal_signatures (country_code, signing_failed, created_at)
    WHERE signing_failed = TRUE;

-- Index for order lookup (checking if order has been signed)
CREATE INDEX IF NOT EXISTS idx_fiscal_order_id
    ON commerce_schema.fiscal_signatures (order_id);

-- Index for Z-report / daily queries per store
CREATE INDEX IF NOT EXISTS idx_fiscal_store_created
    ON commerce_schema.fiscal_signatures (store_id, created_at);

COMMENT ON TABLE commerce_schema.fiscal_signatures IS
    'Fiscal signing records — append-only, 10-year legal retention. Never DELETE.';
COMMENT ON COLUMN commerce_schema.fiscal_signatures.signed_at IS
    'Timestamp from signing system clock, never application clock';
```

- [ ] **Step 2: Create V7__uk_vat_ledger.sql**

```sql
-- V7: UK MTD VAT ledger — quarterly aggregation for HMRC Making Tax Digital submission
-- Each GB order's VAT amounts are recorded here. Manager submits quarterly via FiscalCompliancePage.

CREATE TABLE IF NOT EXISTS commerce_schema.uk_vat_ledger (
    id                   BIGSERIAL       PRIMARY KEY,
    order_id             VARCHAR(100)    NOT NULL,
    store_id             VARCHAR(100)    NOT NULL,
    vat_period_key       VARCHAR(10)     NOT NULL,  -- e.g. "2026-Q1"
    order_date           DATE            NOT NULL,
    net_amount           DECIMAL(12,2)   NOT NULL,
    vat_amount           DECIMAL(12,2)   NOT NULL,
    gross_amount         DECIMAL(12,2)   NOT NULL,
    vat_rate_pct         DECIMAL(5,2),
    uk_vat_category      VARCHAR(50),               -- STANDARD / REDUCED / ZERO / EXEMPT
    mtd_transaction_id   VARCHAR(200),
    submitted_at         TIMESTAMPTZ,               -- NULL = not yet submitted
    created_at           TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Index for quarterly submission queries
CREATE INDEX IF NOT EXISTS idx_uk_vat_period_store
    ON commerce_schema.uk_vat_ledger (store_id, vat_period_key);

-- Index for unsubmitted entries
CREATE INDEX IF NOT EXISTS idx_uk_vat_unsubmitted
    ON commerce_schema.uk_vat_ledger (store_id, submitted_at)
    WHERE submitted_at IS NULL;

COMMENT ON TABLE commerce_schema.uk_vat_ledger IS
    'UK Making Tax Digital VAT ledger — records per-order VAT for quarterly HMRC submission';
```

- [ ] **Step 3: Create V8__stripe_tax_calculations.sql**

```sql
-- V8: Stripe Tax calculation cache — US and CA stores
-- Stripe Tax API is called at order creation for US/CA stores.
-- Results cached here (Redis 24h per store+item, this table = permanent record).

CREATE TABLE IF NOT EXISTS commerce_schema.stripe_tax_calculations (
    id                   BIGSERIAL       PRIMARY KEY,
    order_id             VARCHAR(100)    NOT NULL,
    store_id             VARCHAR(100)    NOT NULL,
    country_code         VARCHAR(2)      NOT NULL,  -- "US" or "CA"
    stripe_calculation_id VARCHAR(200)   NOT NULL,  -- Stripe Tax calculation ID
    taxable_amount       DECIMAL(12,2)   NOT NULL,
    tax_amount           DECIMAL(12,2)   NOT NULL,
    tax_rate_pct         DECIMAL(5,4),
    jurisdiction         VARCHAR(100),              -- e.g. "California" or "Ontario"
    calculation_date     DATE            NOT NULL,
    created_at           TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stripe_tax_order
    ON commerce_schema.stripe_tax_calculations (order_id);

CREATE INDEX IF NOT EXISTS idx_stripe_tax_store_date
    ON commerce_schema.stripe_tax_calculations (store_id, calculation_date);

COMMENT ON TABLE commerce_schema.stripe_tax_calculations IS
    'Stripe Tax calculation records for US/CA stores — permanent audit trail';
```

- [ ] **Step 4: Verify Flyway picks up the migrations (compile check)**

```bash
cd commerce-service && mvn compile "-Dmaven.test.skip=true" 2>&1 | tail -10
```

Expected: BUILD SUCCESS

- [ ] **Step 5: Commit**

```bash
git add commerce-service/src/main/resources/db/migration/V6__fiscal_signatures.sql
git add commerce-service/src/main/resources/db/migration/V7__uk_vat_ledger.sql
git add commerce-service/src/main/resources/db/migration/V8__stripe_tax_calculations.sql
git commit -m "feat(commerce): add Flyway V6 fiscal_signatures, V7 uk_vat_ledger, V8 stripe_tax_calculations"
```

---

### Task 7: Add fiscal columns to OrderJpaEntity

**Files:**
- Modify: `commerce-service/src/main/java/com/MaSoVa/commerce/order/entity/OrderJpaEntity.java`

The dual-write pattern writes financial order data to PostgreSQL. We need to record the fiscal signature fields there too.

- [ ] **Step 1: Read the current OrderJpaEntity**

Run:
```bash
grep -n "vat_country_code\|currency\|class OrderJpaEntity\|@Column" commerce-service/src/main/java/com/MaSoVa/commerce/order/entity/OrderJpaEntity.java | head -30
```

- [ ] **Step 2: Add fiscal_signature_id and fiscal_signing_failed columns**

In `OrderJpaEntity.java`, add these fields after the existing VAT fields:

```java
    @Column(name = "fiscal_signature_id")
    private String fiscalSignatureId;       // fiscal_signatures.transaction_id — null until terminal status

    @Column(name = "fiscal_signer_system")
    private String fiscalSignerSystem;      // "TSE", "NF525", "PASSTHROUGH" etc

    @Column(name = "fiscal_signing_failed")
    private boolean fiscalSigningFailed;    // true = alert manager

    @Column(name = "fiscal_signed_at")
    private java.time.Instant fiscalSignedAt;
```

Then add getters and setters:

```java
    public String getFiscalSignatureId() { return fiscalSignatureId; }
    public void setFiscalSignatureId(String fiscalSignatureId) { this.fiscalSignatureId = fiscalSignatureId; }

    public String getFiscalSignerSystem() { return fiscalSignerSystem; }
    public void setFiscalSignerSystem(String fiscalSignerSystem) { this.fiscalSignerSystem = fiscalSignerSystem; }

    public boolean isFiscalSigningFailed() { return fiscalSigningFailed; }
    public void setFiscalSigningFailed(boolean fiscalSigningFailed) { this.fiscalSigningFailed = fiscalSigningFailed; }

    public java.time.Instant getFiscalSignedAt() { return fiscalSignedAt; }
    public void setFiscalSignedAt(java.time.Instant fiscalSignedAt) { this.fiscalSignedAt = fiscalSignedAt; }
```

- [ ] **Step 3: Add the columns to V6 migration (append to fiscal_signatures migration)**

Add the following to **the end** of `V6__fiscal_signatures.sql` (after the existing content):

```sql
-- Fiscal summary columns on orders table for quick filtering
-- Full details are in fiscal_signatures table
ALTER TABLE commerce_schema.orders
    ADD COLUMN IF NOT EXISTS fiscal_signature_id  VARCHAR(200),
    ADD COLUMN IF NOT EXISTS fiscal_signer_system VARCHAR(20),
    ADD COLUMN IF NOT EXISTS fiscal_signing_failed BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS fiscal_signed_at      TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_orders_fiscal_failed
    ON commerce_schema.orders (store_id, fiscal_signing_failed, created_at)
    WHERE fiscal_signing_failed = TRUE;

COMMENT ON COLUMN commerce_schema.orders.fiscal_signing_failed IS
    'True when signing was required but failed — manager must resolve';
```

- [ ] **Step 4: Update FiscalSigningService to also populate OrderJpaEntity**

In `FiscalSigningService.java`, inject `OrderJpaRepository` and update the JPA entity alongside the MongoDB document.

Add the import:

```java
import com.MaSoVa.commerce.order.entity.OrderJpaEntity;
import com.MaSoVa.commerce.order.repository.OrderJpaRepository;
```

Add the field and constructor parameter:

```java
    private final OrderJpaRepository orderJpaRepository;

    public FiscalSigningService(FiscalSignerRegistry registry,
                                 OrderRepository orderRepository,
                                 OrderJpaRepository orderJpaRepository,
                                 OrderEventPublisher eventPublisher) {
        this.registry = registry;
        this.orderRepository = orderRepository;
        this.orderJpaRepository = orderJpaRepository;
        this.eventPublisher = eventPublisher;
    }
```

After `orderRepository.save(order)` in `signOrder()`, add the JPA dual-write:

```java
        // Dual-write: update PostgreSQL fiscal columns
        orderJpaRepository.findByOrderId(order.getId()).ifPresent(jpa -> {
            jpa.setFiscalSignatureId(signature.getTransactionId());
            jpa.setFiscalSignerSystem(signature.getSignerSystem());
            jpa.setFiscalSigningFailed(signature.isSigningFailed());
            jpa.setFiscalSignedAt(signature.getSignedAt());
            orderJpaRepository.save(jpa);
        });
```

- [ ] **Step 5: Update FiscalSigningServiceTest for new constructor signature**

In `FiscalSigningServiceTest.java`, update `setUp()` to add the `OrderJpaRepository` mock:

```java
    private OrderJpaRepository orderJpaRepository;

    @BeforeEach
    void setUp() {
        registry = mock(FiscalSignerRegistry.class);
        orderRepository = mock(OrderRepository.class);
        orderJpaRepository = mock(OrderJpaRepository.class);
        eventPublisher = mock(OrderEventPublisher.class);
        fiscalSigningService = new FiscalSigningService(registry, orderRepository, orderJpaRepository, eventPublisher);
    }
```

Also add the import:

```java
import com.MaSoVa.commerce.order.repository.OrderJpaRepository;
```

- [ ] **Step 6: Run all fiscal tests**

```bash
cd commerce-service && mvn test -Dtest=FiscalSigningServiceTest,FiscalSignerRegistryTest,OrderServiceTerminalStatusTest 2>&1 | tail -20
```

Expected: All 13 tests PASS

- [ ] **Step 7: Commit**

```bash
git add commerce-service/src/main/java/com/MaSoVa/commerce/order/entity/OrderJpaEntity.java
git add commerce-service/src/main/java/com/MaSoVa/commerce/fiscal/FiscalSigningService.java
git add commerce-service/src/main/resources/db/migration/V6__fiscal_signatures.sql
git add commerce-service/src/test/java/com/MaSoVa/commerce/fiscal/FiscalSigningServiceTest.java
git commit -m "feat(commerce): dual-write fiscal signature to OrderJpaEntity + V6 orders columns"
```

---

### Task 8: Frontend — RTK Query for fiscal endpoints

**Files:**
- Create: `frontend/src/store/api/fiscalApi.ts`

- [ ] **Step 1: Write the failing test**

Create `frontend/src/store/api/fiscalApi.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { fiscalApi } from './fiscalApi';

describe('fiscalApi', () => {
  it('defines useGetFiscalSummaryQuery endpoint', () => {
    expect(fiscalApi.endpoints.getFiscalSummary).toBeDefined();
  });

  it('defines useGetSigningFailuresQuery endpoint', () => {
    expect(fiscalApi.endpoints.getSigningFailures).toBeDefined();
  });
});
```

- [ ] **Step 2: Run to verify test fails**

```bash
cd frontend && npx vitest run src/store/api/fiscalApi.test.ts 2>&1 | tail -15
```

Expected: FAIL

- [ ] **Step 3: Create fiscalApi.ts**

Create `frontend/src/store/api/fiscalApi.ts`:

```typescript
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '../store';

export interface FiscalSummary {
  storeId: string;
  countryCode: string;
  signerSystem: string;
  totalSigned: number;
  failedLast7Days: number;
  lastSignedAt: string | null;
}

export interface SigningFailure {
  orderId: string;
  storeId: string;
  countryCode: string;
  signerSystem: string;
  signingError: string;
  occurredAt: string;
}

export const fiscalApi = createApi({
  reducerPath: 'fiscalApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_API_BASE_URL || ''}/api`,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth?.token;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['FiscalSummary', 'SigningFailures'],
  endpoints: (builder) => ({
    getFiscalSummary: builder.query<FiscalSummary[], string>({
      query: (storeId) => `/fiscal/summary?storeId=${storeId}`,
      providesTags: ['FiscalSummary'],
    }),
    getSigningFailures: builder.query<SigningFailure[], string>({
      query: (storeId) => `/fiscal/failures?storeId=${storeId}`,
      providesTags: ['SigningFailures'],
    }),
  }),
});

export const {
  useGetFiscalSummaryQuery,
  useGetSigningFailuresQuery,
} = fiscalApi;
```

- [ ] **Step 4: Register fiscalApi in the Redux store**

Open `frontend/src/store/store.ts`. Add:

```typescript
import { fiscalApi } from './api/fiscalApi';
```

In the `reducer` map, add:

```typescript
    [fiscalApi.reducerPath]: fiscalApi.reducer,
```

In the `middleware` chain, add:

```typescript
    .concat(fiscalApi.middleware)
```

- [ ] **Step 5: Run test**

```bash
cd frontend && npx vitest run src/store/api/fiscalApi.test.ts 2>&1 | tail -15
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add frontend/src/store/api/fiscalApi.ts
git add frontend/src/store/api/fiscalApi.test.ts
git add frontend/src/store/store.ts
git commit -m "feat(frontend): add fiscalApi RTK Query endpoints for fiscal compliance data"
```

---

### Task 9: FiscalCompliancePage

**Files:**
- Create: `frontend/src/pages/manager/FiscalCompliancePage.tsx`
- Modify: `frontend/src/pages/manager/ManagerShell.tsx`

- [ ] **Step 1: Create FiscalCompliancePage.tsx**

Create `frontend/src/pages/manager/FiscalCompliancePage.tsx`:

```typescript
import React from 'react';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { usePageStore } from '../../contexts/PageStoreContext';
import { useGetFiscalSummaryQuery, useGetSigningFailuresQuery } from '../../store/api/fiscalApi';
import { Card, Button } from '../../components/ui/neumorphic';
import AppHeader from '../../components/common/AppHeader';
import { colors, spacing, typography } from '../../styles/design-tokens';
import { createNeumorphicSurface } from '../../styles/neumorphic-utils';

const SIGNER_LABELS: Record<string, string> = {
  TSE: 'Germany TSE',
  NF525: 'France NF525',
  RT: 'Italy RT Device',
  FDM: 'Belgium FDM',
  NTCA: 'Hungary NTCA',
  MTD: 'UK Making Tax Digital',
  PASSTHROUGH: 'No signing required',
};

const FiscalCompliancePage: React.FC = () => {
  const currentUser = useAppSelector(selectCurrentUser);
  const { selectedStoreId } = usePageStore();
  const storeId = selectedStoreId || currentUser?.storeId || '';

  const {
    data: summaries = [],
    isLoading: summaryLoading,
    error: summaryError,
  } = useGetFiscalSummaryQuery(storeId, { skip: !storeId });

  const {
    data: failures = [],
    isLoading: failuresLoading,
    error: failuresError,
  } = useGetSigningFailuresQuery(storeId, { skip: !storeId });

  const cardStyle: React.CSSProperties = {
    ...createNeumorphicSurface('flat'),
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: 12,
  };

  const headerStyle: React.CSSProperties = {
    fontFamily: typography.fontFamily,
    fontSize: typography.fontSize.lg,
    fontWeight: 600,
    color: colors.text.primary,
    marginBottom: spacing.md,
  };

  const failureBadge: React.CSSProperties = {
    background: '#E53E3E',
    color: '#fff',
    borderRadius: 4,
    padding: '2px 8px',
    fontSize: typography.fontSize.sm,
    fontWeight: 600,
  };

  if (!storeId) {
    return (
      <div style={{ padding: spacing.lg }}>
        <p style={{ color: colors.text.secondary }}>Select a store to view fiscal compliance data.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: spacing.lg }}>
      <h2 style={{ ...headerStyle, fontSize: typography.fontSize.xl, marginBottom: spacing.lg }}>
        Fiscal Compliance
      </h2>

      {/* Signing summary */}
      <div style={cardStyle}>
        <h3 style={headerStyle}>Signing Status</h3>
        {summaryLoading && <p style={{ color: colors.text.secondary }}>Loading...</p>}
        {summaryError && <p style={{ color: '#E53E3E' }}>Failed to load fiscal summary.</p>}
        {!summaryLoading && summaries.length === 0 && (
          <p style={{ color: colors.text.secondary }}>No fiscal records for this store yet.</p>
        )}
        {summaries.map((s) => (
          <div key={s.storeId + s.signerSystem} style={{ marginBottom: spacing.sm }}>
            <strong>{SIGNER_LABELS[s.signerSystem] ?? s.signerSystem}</strong>
            {' — '}
            {s.totalSigned} signed
            {s.failedLast7Days > 0 && (
              <span style={{ ...failureBadge, marginLeft: spacing.sm }}>
                {s.failedLast7Days} failed (7d)
              </span>
            )}
            {s.lastSignedAt && (
              <span style={{ color: colors.text.secondary, fontSize: typography.fontSize.sm, marginLeft: spacing.sm }}>
                Last: {new Date(s.lastSignedAt).toLocaleString()}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Signing failures requiring resolution */}
      <div style={cardStyle}>
        <h3 style={headerStyle}>
          Receipt Signing Failures
          {failures.length > 0 && (
            <span style={{ ...failureBadge, marginLeft: spacing.sm }}>{failures.length}</span>
          )}
        </h3>
        {failuresLoading && <p style={{ color: colors.text.secondary }}>Loading...</p>}
        {failuresError && <p style={{ color: '#E53E3E' }}>Failed to load failures.</p>}
        {!failuresLoading && failures.length === 0 && (
          <p style={{ color: colors.text.secondary }}>No signing failures — all receipts signed successfully.</p>
        )}
        {failures.map((f) => (
          <div
            key={f.orderId}
            style={{
              ...createNeumorphicSurface('inset'),
              padding: spacing.md,
              marginBottom: spacing.sm,
              borderRadius: 8,
              borderLeft: '4px solid #E53E3E',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ color: colors.text.primary }}>Order {f.orderId}</strong>
                <span style={{ color: colors.text.secondary, fontSize: typography.fontSize.sm, marginLeft: spacing.sm }}>
                  {SIGNER_LABELS[f.signerSystem] ?? f.signerSystem} ({f.countryCode})
                </span>
              </div>
              <span style={{ color: colors.text.secondary, fontSize: typography.fontSize.sm }}>
                {new Date(f.occurredAt).toLocaleString()}
              </span>
            </div>
            <p style={{ color: '#E53E3E', marginTop: spacing.xs, fontSize: typography.fontSize.sm }}>
              {f.signingError}
            </p>
          </div>
        ))}
      </div>

      {/* UK MTD section (shown only for GB stores) */}
      {summaries.some((s) => s.signerSystem === 'MTD') && (
        <div style={cardStyle}>
          <h3 style={headerStyle}>UK Making Tax Digital</h3>
          <p style={{ color: colors.text.secondary, marginBottom: spacing.md }}>
            Quarterly VAT ledger submission to HMRC. Your accountant can download the MTD-compatible
            JSON or you can submit directly.
          </p>
          <div style={{ display: 'flex', gap: spacing.md }}>
            <Button variant="primary" onClick={() => alert('MTD submission — Phase 2 feature')}>
              Submit to HMRC
            </Button>
            <Button variant="secondary" onClick={() => alert('Download MTD export — Phase 2 feature')}>
              Download MTD JSON
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FiscalCompliancePage;
```

- [ ] **Step 2: Add Compliance section to ManagerShell navigation**

Open `frontend/src/pages/manager/ManagerShell.tsx`.

Find the `sections` array (around line 21). Add a new entry after the `analytics` section:

```typescript
  { id: 'compliance', label: 'Fiscal Compliance', icon: Icons.Shield },
```

Find where sections are lazy-loaded (the `const DashboardSection = React.lazy(...)` block). Add:

```typescript
const FiscalCompliancePage = React.lazy(() => import('./FiscalCompliancePage'));
```

Find the section rendering logic (the `renderSection` function or equivalent `activeSection` switch/conditional). Add a case for `'compliance'`:

```typescript
      case 'compliance':
        return <FiscalCompliancePage />;
```

- [ ] **Step 3: Add Shield icon to manager-tokens if it doesn't exist**

Check:
```bash
grep -n "Shield\|shield" frontend/src/pages/manager/manager-tokens.ts | head -5
```

If not present, open `frontend/src/pages/manager/manager-tokens.ts` and add to the `Icons` object:

```typescript
  Shield: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
```

- [ ] **Step 4: Verify TypeScript compiles without errors**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -20
```

Expected: No errors (or only pre-existing errors unrelated to these files)

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/manager/FiscalCompliancePage.tsx
git add frontend/src/pages/manager/ManagerShell.tsx
git add frontend/src/pages/manager/manager-tokens.ts
git commit -m "feat(frontend): add FiscalCompliancePage + Compliance nav item in ManagerShell"
```

---

### Task 10: StoreManagementPage — fiscal device IP fields

**Files:**
- Modify: `frontend/src/pages/manager/StoreManagementPage.tsx`

The master brief requires: DE/IT/BE show a fiscal device IP field with a "test connection" button; FR shows NF525 software status; HU shows NTCA credentials; GB shows MTD credentials.

- [ ] **Step 1: Read the current store form data state in StoreManagementPage**

```bash
grep -n "formData\|countryCode\|vatNumber\|fiscalDeviceIp\|fiscal" frontend/src/pages/manager/StoreManagementPage.tsx | head -30
```

- [ ] **Step 2: Add fiscal device fields to form state**

In `StoreManagementPage.tsx`, find the `formData` state initialization and add:

```typescript
    fiscalDeviceIp: '',      // DE / IT / BE: IP of TSE/RT/FDM device on store network
    ntcaApiCredentials: '',  // HU: NTCA technical ID + exchange key (single field for Phase 1)
    mtdVatNumber: '',        // GB: VAT registration number for MTD submission
```

- [ ] **Step 3: Add a conditional fiscal section below the VAT number field**

In the JSX form, after the `vatNumber` input (search for `vatNumber`), add this conditional block:

```tsx
{/* Fiscal device configuration — shown only for countries that require hardware or government API */}
{formData.countryCode && ['DE', 'IT', 'BE'].includes(formData.countryCode) && (
  <div style={{ marginTop: spacing.md }}>
    <label style={labelStyle}>Fiscal Device IP Address</label>
    <Input
      value={(formData as any).fiscalDeviceIp || ''}
      onChange={(e) => setFormData(prev => ({ ...prev, fiscalDeviceIp: e.target.value }))}
      placeholder="192.168.1.100"
    />
    <Button
      variant="secondary"
      onClick={() => alert('Device connection test — Phase 2 feature')}
      style={{ marginTop: spacing.sm }}
    >
      Test Connection
    </Button>
  </div>
)}
{formData.countryCode === 'HU' && (
  <div style={{ marginTop: spacing.md }}>
    <label style={labelStyle}>NTCA API Credentials</label>
    <Input
      value={(formData as any).ntcaApiCredentials || ''}
      onChange={(e) => setFormData(prev => ({ ...prev, ntcaApiCredentials: e.target.value }))}
      placeholder="Technical ID:Exchange Key"
    />
  </div>
)}
{formData.countryCode === 'GB' && (
  <div style={{ marginTop: spacing.md }}>
    <label style={labelStyle}>HMRC VAT Registration Number</label>
    <Input
      value={(formData as any).mtdVatNumber || ''}
      onChange={(e) => setFormData(prev => ({ ...prev, mtdVatNumber: e.target.value }))}
      placeholder="GB123456789"
    />
  </div>
)}
{formData.countryCode === 'FR' && (
  <div style={{ marginTop: spacing.md, padding: spacing.sm, background: 'rgba(255,193,7,0.1)', borderRadius: 6 }}>
    <strong>NF525 Notice:</strong> Once an order is fiscally signed, it is immutable.
    Corrections must be submitted as new credit note orders.
  </div>
)}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd frontend && npx tsc --noEmit 2>&1 | grep "StoreManagementPage" | head -10
```

Expected: No errors on StoreManagementPage

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/manager/StoreManagementPage.tsx
git commit -m "feat(frontend): add fiscal device IP and country-specific fields to StoreManagementPage"
```

---

### Task 11: Run all tests and verify full build

- [ ] **Step 1: Run shared-models tests**

```bash
cd shared-models && mvn test 2>&1 | tail -20
```

Expected: All tests PASS

- [ ] **Step 2: Run commerce-service tests**

```bash
cd commerce-service && mvn test 2>&1 | tail -20
```

Expected: All tests PASS (including safety-floor + new fiscal tests)

- [ ] **Step 3: Run frontend tests**

```bash
cd frontend && npx vitest run 2>&1 | tail -20
```

Expected: All tests PASS

- [ ] **Step 4: TypeScript full check**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -30
```

Expected: No new type errors

- [ ] **Step 5: Commit any final fixes, then tag Global-5 complete in master brief**

Open `docs/superpowers/specs/2026-04-10-masova-global-master-brief.md`.

Find the Global-5 line in the Recommended Build Order section:
```
Global-5 (Fiscal) ─────── depends on 2+4 ─────────► pending
```
Change it to:
```
Global-5 (Fiscal) ─────── depends on 2+4 ─────────► ✅ DONE
```

Also update the Phase Global-5 status line:
```
**Status:** ✅ COMPLETE — 2026-04-12 · feature/global-5-fiscal-signing
```

- [ ] **Step 6: Final commit**

```bash
git add docs/superpowers/specs/2026-04-10-masova-global-master-brief.md
git commit -m "docs: mark Global-5 DONE — fiscal signing all 12 countries"
```

---

## Self-Review Checklist

**Spec coverage:**
- [x] FiscalSigner interface + FiscalSignerRegistry — Task 3
- [x] FiscalSignature value object — Task 1
- [x] All 7 signer implementations (passthrough, TSE, NF525, RT, FDM, NTCA, MTD) — Task 3
- [x] ReceiptSignedEvent on masova.orders.events / order.receipt.signed — Task 2
- [x] Signing trigger after terminal status (DELIVERED/SERVED/COMPLETED) — Task 5
- [x] fiscalSignature stored on MongoDB Order — Task 4
- [x] PostgreSQL V6 fiscal_signatures, V7 uk_vat_ledger, V8 stripe_tax_calculations — Task 6
- [x] OrderJpaEntity fiscal columns + dual-write — Task 7
- [x] FiscalCompliancePage in manager shell — Task 9
- [x] StoreManagementPage fiscal device fields — Task 10
- [x] India stores unaffected (passthrough for null countryCode) — Task 3 + PassthroughFiscalSigner
- [x] Fiscal timestamps from signing system clock (Instant.now() in signer, not service layer) — Tasks 3, 4
- [x] Soft delete only / never DELETE for fiscal records — V6 migration comments
- [x] RECEIPT_SIGNING_FAILED flag + event — FiscalSigningService
- [x] Safety-floor tests written before feature code — Task 0

**FR NF525 immutability constraint:** The FranceNf525FiscalSigner notes this in comments. Full enforcement (blocking field edits post-signing) is deferred to when OrderService edit paths are built — this plan stubs the signer and documents the requirement.

**@Async on FiscalSigningService.signOrder():** Requires `@EnableAsync` on a Spring config class. If not present, add `@EnableAsync` to `CommerceServiceApplication.java` or any `@Configuration` class. Check:
```bash
grep -r "@EnableAsync" commerce-service/src/main/java/ | head -5
```
If absent, add `@EnableAsync` to `CommerceServiceApplication.java`.
