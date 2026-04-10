# Global-2: EU VAT Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add per-country EU VAT calculation to orders so that non-Indian stores charge correct VAT rates by country, order context (dine-in/takeaway/delivery), and item category — while India stores continue to use existing GST logic unchanged.

**Architecture:** `Store` gains `countryCode`, `vatNumber`, `currency`, `locale`. `Order` gains `vatCountryCode`, `vatBreakdown` (per line item), `totalNetAmount`, `totalVatAmount`, `totalGrossAmount`. A new `EuVatEngine` YAML-backed service resolves the rate for (country, orderContext, itemCategory). `OrderService.createOrder()` routes to `EuVatEngine` when `store.countryCode` is non-null, or falls back to existing `TaxConfiguration` GST logic for India. PostgreSQL migration V4 adds VAT columns to `commerce_schema.orders`. Events gain `vatCountryCode` and `totalVatAmount` fields.

**Tech Stack:** Java 21, Spring Boot 3, MongoDB (Store + Order), PostgreSQL (orders_jpa), RabbitMQ (shared-models events), Spring `@ConfigurationProperties` YAML binding, JUnit 5 + Mockito (unit tests), Flyway (migration).

---

## Safety Floor — Write These Tests First (per master brief)

Before touching any feature code, write tests that document current `TaxConfiguration` and `OrderService.createOrder()` behaviour. These tests must pass before any other task begins.

---

### Task 0: Safety-floor tests for existing tax and order creation

**Files:**
- Create: `commerce-service/src/test/java/com/MaSoVa/commerce/order/config/TaxConfigurationTest.java`
- Create: `commerce-service/src/test/java/com/MaSoVa/commerce/order/service/OrderServiceCreateOrderTest.java`

- [ ] **Step 1: Create the test source directory structure**

```bash
mkdir -p commerce-service/src/test/java/com/MaSoVa/commerce/order/config
mkdir -p commerce-service/src/test/java/com/MaSoVa/commerce/order/service
```

- [ ] **Step 2: Write TaxConfiguration unit tests**

Create `commerce-service/src/test/java/com/MaSoVa/commerce/order/config/TaxConfigurationTest.java`:

```java
package com.MaSoVa.commerce.order.config;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

class TaxConfigurationTest {

    private TaxConfiguration taxConfig;

    @BeforeEach
    void setUp() {
        taxConfig = new TaxConfiguration();
    }

    @Test
    void defaultGstRate_is_5_percent() {
        assertThat(taxConfig.getDefaultGstPercent()).isEqualTo(5.0);
    }

    @Test
    void maharashtra_state_rate_is_5_percent() {
        assertThat(taxConfig.getTaxRateForState("Maharashtra")).isEqualTo(5.0);
    }

    @Test
    void unknown_state_falls_back_to_default() {
        assertThat(taxConfig.getTaxRateForState("UnknownState")).isEqualTo(5.0);
    }

    @Test
    void null_state_falls_back_to_default() {
        assertThat(taxConfig.getTaxRateForState(null)).isEqualTo(5.0);
    }

    @Test
    void category_FOOD_rate_is_5_percent() {
        assertThat(taxConfig.getTaxRateForCategory("FOOD")).isEqualTo(5.0);
    }

    @Test
    void category_BEVERAGE_rate_is_12_percent() {
        assertThat(taxConfig.getTaxRateForCategory("BEVERAGE")).isEqualTo(12.0);
    }

    @Test
    void null_category_falls_back_to_FOOD_rate() {
        assertThat(taxConfig.getTaxRateForCategory(null)).isEqualTo(5.0);
    }

    @Test
    void calculateTax_on_100_in_maharashtra_returns_5() {
        double tax = taxConfig.calculateTax(100.0, "Maharashtra", true);
        assertThat(tax).isCloseTo(5.0, within(0.001));
    }

    @Test
    void calculateTaxBreakdown_splits_cgst_and_sgst_equally() {
        TaxConfiguration.TaxBreakdown breakdown = taxConfig.calculateTaxBreakdown(200.0, "Maharashtra");
        assertThat(breakdown.getCgst()).isCloseTo(5.0, within(0.001));
        assertThat(breakdown.getSgst()).isCloseTo(5.0, within(0.001));
        assertThat(breakdown.getTotalTax()).isCloseTo(10.0, within(0.001));
        assertThat(breakdown.getTotalPercent()).isEqualTo(5.0);
    }
}
```

- [ ] **Step 3: Write OrderService.createOrder safety-floor test**

Create `commerce-service/src/test/java/com/MaSoVa/commerce/order/service/OrderServiceCreateOrderTest.java`:

```java
package com.MaSoVa.commerce.order.service;

import com.MaSoVa.commerce.order.client.*;
import com.MaSoVa.commerce.order.config.DeliveryFeeConfiguration;
import com.MaSoVa.commerce.order.config.PreparationTimeConfiguration;
import com.MaSoVa.commerce.order.config.TaxConfiguration;
import com.MaSoVa.commerce.order.dto.CreateOrderRequest;
import com.MaSoVa.commerce.order.entity.Order;
import com.MaSoVa.commerce.order.entity.OrderItem;
import com.MaSoVa.commerce.order.entity.OrderJpaEntity;
import com.MaSoVa.commerce.order.repository.OrderJpaRepository;
import com.MaSoVa.commerce.order.repository.OrderRepository;
import com.MaSoVa.commerce.order.websocket.OrderWebSocketController;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceCreateOrderTest {

    @Mock OrderRepository orderRepository;
    @Mock OrderJpaRepository orderJpaRepository;
    @Mock OrderItemSyncService orderItemSyncService;
    @Mock OrderWebSocketController webSocketController;
    @Mock MenuServiceClient menuServiceClient;
    @Mock CustomerServiceClient customerServiceClient;
    @Mock CustomerNotificationService customerNotificationService;
    @Mock DeliveryServiceClient deliveryServiceClient;
    @Mock StoreServiceClient storeServiceClient;
    @Mock InventoryServiceClient inventoryServiceClient;
    @Mock OrderEventPublisher orderEventPublisher;

    private TaxConfiguration taxConfiguration;
    private PreparationTimeConfiguration prepTimeConfig;
    private DeliveryFeeConfiguration deliveryFeeConfig;
    private OrderService orderService;

    @BeforeEach
    void setUp() {
        taxConfiguration = new TaxConfiguration();
        prepTimeConfig = new PreparationTimeConfiguration();
        deliveryFeeConfig = new DeliveryFeeConfiguration();

        orderService = new OrderService(
            orderRepository, orderJpaRepository, orderItemSyncService,
            new ObjectMapper(), webSocketController,
            menuServiceClient, customerServiceClient,
            customerNotificationService, deliveryServiceClient,
            storeServiceClient, inventoryServiceClient,
            taxConfiguration, prepTimeConfig, deliveryFeeConfig,
            orderEventPublisher
        );

        // Default stub: save returns passed argument
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));
        when(orderJpaRepository.save(any(OrderJpaEntity.class))).thenAnswer(inv -> inv.getArgument(0));
        when(orderJpaRepository.findByMongoId(anyString())).thenReturn(java.util.Optional.empty());
    }

    private CreateOrderRequest buildTakeawayRequest() {
        CreateOrderRequest req = new CreateOrderRequest();
        req.setCustomerName("Test Customer");
        req.setCustomerPhone("9876543210");
        req.setStoreId("store-001");
        req.setOrderType(Order.OrderType.TAKEAWAY);
        req.setPaymentMethod(Order.PaymentMethod.CASH);

        CreateOrderRequest.OrderItemRequest item = new CreateOrderRequest.OrderItemRequest();
        item.setMenuItemId("item-001");
        item.setName("Burger");
        item.setQuantity(2);
        item.setPrice(new BigDecimal("100.00"));
        req.setItems(List.of(item));
        return req;
    }

    @Test
    void createOrder_sets_status_RECEIVED() {
        Order result = orderService.createOrder(buildTakeawayRequest());
        assertThat(result.getStatus()).isEqualTo(Order.OrderStatus.RECEIVED);
    }

    @Test
    void createOrder_calculates_subtotal_correctly() {
        // 2 items × ₹100 = ₹200
        Order result = orderService.createOrder(buildTakeawayRequest());
        assertThat(result.getSubtotal()).isEqualByComparingTo(new BigDecimal("200.00"));
    }

    @Test
    void createOrder_applies_5_percent_GST_for_india_store() {
        // Subtotal ₹200 × 5% GST = ₹10 tax
        Order result = orderService.createOrder(buildTakeawayRequest());
        assertThat(result.getTax().doubleValue()).isCloseTo(10.0, within(0.01));
    }

    @Test
    void createOrder_total_equals_subtotal_plus_tax_for_takeaway() {
        Order result = orderService.createOrder(buildTakeawayRequest());
        BigDecimal expected = result.getSubtotal().add(result.getTax());
        assertThat(result.getTotal()).isEqualByComparingTo(expected);
    }

    @Test
    void createOrder_generates_non_null_order_number() {
        Order result = orderService.createOrder(buildTakeawayRequest());
        assertThat(result.getOrderNumber()).isNotNull().isNotBlank();
    }

    @Test
    void createOrder_publishes_OrderCreatedEvent() {
        orderService.createOrder(buildTakeawayRequest());
        verify(orderEventPublisher).publishOrderCreated(any(Order.class));
    }
}
```

- [ ] **Step 4: Verify tests compile and run**

Run from project root (on Dell or via SSH — this is a Maven command):
```bash
cd commerce-service && mvn test -pl . -Dtest="TaxConfigurationTest,OrderServiceCreateOrderTest" "-Dmaven.test.skip=false" 2>&1 | tail -30
```
Expected: Both test classes compile and pass (all green). If `PreparationTimeConfiguration` or `DeliveryFeeConfiguration` constructors differ, adjust the `setUp()` method to match — check with `new PreparationTimeConfiguration()` first.

- [ ] **Step 5: Commit safety floor**

```bash
git add commerce-service/src/test/
git commit -m "test(commerce): safety-floor tests for TaxConfiguration and OrderService.createOrder — Global-2 pre-req"
```

---

## Phase Features

---

### Task 1: `EuVatConfiguration` — YAML-backed VAT rate lookup

**Files:**
- Create: `commerce-service/src/main/java/com/MaSoVa/commerce/order/config/EuVatConfiguration.java`
- Modify: `commerce-service/src/main/resources/application.yml`
- Create: `commerce-service/src/test/java/com/MaSoVa/commerce/order/config/EuVatConfigurationTest.java`

**What this does:** A `@ConfigurationProperties(prefix = "eu-vat")` bean holding a `Map<String, CountryVatProfile>` where each profile has rates by `(orderContext, itemCategory)`.

- [ ] **Step 1: Write the failing test**

Create `commerce-service/src/test/java/com/MaSoVa/commerce/order/config/EuVatConfigurationTest.java`:

```java
package com.MaSoVa.commerce.order.config;

import org.junit.jupiter.api.Test;
import java.util.Map;
import static org.assertj.core.api.Assertions.assertThat;

class EuVatConfigurationTest {

    @Test
    void lookupRate_DE_DINE_IN_FOOD_returns_19() {
        EuVatConfiguration config = buildTestConfig();
        double rate = config.lookupRate("DE", "DINE_IN", "FOOD");
        assertThat(rate).isEqualTo(19.0);
    }

    @Test
    void lookupRate_DE_TAKEAWAY_FOOD_returns_7() {
        EuVatConfiguration config = buildTestConfig();
        double rate = config.lookupRate("DE", "TAKEAWAY", "FOOD");
        assertThat(rate).isEqualTo(7.0);
    }

    @Test
    void lookupRate_FR_DINE_IN_FOOD_returns_10() {
        EuVatConfiguration config = buildTestConfig();
        double rate = config.lookupRate("FR", "DINE_IN", "FOOD");
        assertThat(rate).isEqualTo(10.0);
    }

    @Test
    void lookupRate_FR_DINE_IN_ALCOHOL_returns_20() {
        EuVatConfiguration config = buildTestConfig();
        double rate = config.lookupRate("FR", "DINE_IN", "ALCOHOL");
        assertThat(rate).isEqualTo(20.0);
    }

    @Test
    void lookupRate_unknown_category_falls_back_to_FOOD_rate() {
        EuVatConfiguration config = buildTestConfig();
        double rate = config.lookupRate("DE", "DINE_IN", "MYSTERY_ITEM");
        assertThat(rate).isEqualTo(19.0); // DE DINE_IN FOOD default
    }

    @Test
    void lookupRate_unknown_country_returns_zero() {
        EuVatConfiguration config = buildTestConfig();
        double rate = config.lookupRate("XX", "DINE_IN", "FOOD");
        assertThat(rate).isEqualTo(0.0);
    }

    @Test
    void isEuStore_true_for_DE() {
        EuVatConfiguration config = buildTestConfig();
        assertThat(config.isEuStore("DE")).isTrue();
    }

    @Test
    void isEuStore_false_for_null() {
        EuVatConfiguration config = buildTestConfig();
        assertThat(config.isEuStore(null)).isFalse();
    }

    private EuVatConfiguration buildTestConfig() {
        EuVatConfiguration config = new EuVatConfiguration();

        EuVatConfiguration.CountryVatProfile de = new EuVatConfiguration.CountryVatProfile();
        de.setDefaultRate(19.0);
        de.setContextRates(Map.of(
            "DINE_IN", Map.of("FOOD", 19.0, "ALCOHOL", 19.0),
            "TAKEAWAY", Map.of("FOOD", 7.0, "ALCOHOL", 19.0),
            "DELIVERY", Map.of("FOOD", 7.0, "ALCOHOL", 19.0)
        ));

        EuVatConfiguration.CountryVatProfile fr = new EuVatConfiguration.CountryVatProfile();
        fr.setDefaultRate(10.0);
        fr.setContextRates(Map.of(
            "DINE_IN", Map.of("FOOD", 10.0, "ALCOHOL", 20.0),
            "TAKEAWAY", Map.of("FOOD", 5.5, "ALCOHOL", 20.0),
            "DELIVERY", Map.of("FOOD", 5.5, "ALCOHOL", 20.0)
        ));

        config.setCountries(Map.of("DE", de, "FR", fr));
        return config;
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd commerce-service && mvn test -Dtest="EuVatConfigurationTest" "-Dmaven.test.skip=false" 2>&1 | grep -E "ERROR|FAIL|cannot find"
```
Expected: Compilation error — `EuVatConfiguration` does not exist yet.

- [ ] **Step 3: Create EuVatConfiguration**

Create `commerce-service/src/main/java/com/MaSoVa/commerce/order/config/EuVatConfiguration.java`:

```java
package com.MaSoVa.commerce.order.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.HashMap;
import java.util.Map;

/**
 * EU VAT rates per country, order context, and item category.
 * Loaded from application.yml under prefix "eu-vat".
 *
 * Structure:
 * eu-vat:
 *   countries:
 *     DE:
 *       default-rate: 19.0
 *       context-rates:
 *         DINE_IN:
 *           FOOD: 19.0
 *           ALCOHOL: 19.0
 *         TAKEAWAY:
 *           FOOD: 7.0
 */
@Configuration
@ConfigurationProperties(prefix = "eu-vat")
public class EuVatConfiguration {

    private Map<String, CountryVatProfile> countries = new HashMap<>();

    /**
     * Returns the VAT rate for the given country, order context, and item category.
     * Falls back: category → FOOD rate for that context → defaultRate → 0.0
     */
    public double lookupRate(String countryCode, String orderContext, String itemCategory) {
        if (countryCode == null || !countries.containsKey(countryCode)) {
            return 0.0;
        }
        CountryVatProfile profile = countries.get(countryCode);

        if (profile.getContextRates() != null && profile.getContextRates().containsKey(orderContext)) {
            Map<String, Double> categoryRates = profile.getContextRates().get(orderContext);
            if (categoryRates.containsKey(itemCategory)) {
                return categoryRates.get(itemCategory);
            }
            // Fall back to FOOD rate for this context
            if (categoryRates.containsKey("FOOD")) {
                return categoryRates.get("FOOD");
            }
        }

        return profile.getDefaultRate();
    }

    /** Returns true when the countryCode is present in the configured EU countries map. */
    public boolean isEuStore(String countryCode) {
        return countryCode != null && countries.containsKey(countryCode);
    }

    public Map<String, CountryVatProfile> getCountries() { return countries; }
    public void setCountries(Map<String, CountryVatProfile> countries) { this.countries = countries; }

    public static class CountryVatProfile {
        private double defaultRate = 0.0;
        /** key: orderContext (DINE_IN / TAKEAWAY / DELIVERY), value: map of category → rate */
        private Map<String, Map<String, Double>> contextRates = new HashMap<>();

        public double getDefaultRate() { return defaultRate; }
        public void setDefaultRate(double defaultRate) { this.defaultRate = defaultRate; }

        public Map<String, Map<String, Double>> getContextRates() { return contextRates; }
        public void setContextRates(Map<String, Map<String, Double>> contextRates) {
            this.contextRates = contextRates;
        }
    }
}
```

- [ ] **Step 4: Add EU VAT rates to application.yml**

Open `commerce-service/src/main/resources/application.yml` and append this block at the end of the file (after all existing config):

```yaml
# EU VAT rates (Global-2)
eu-vat:
  countries:
    DE:
      default-rate: 19.0
      context-rates:
        DINE_IN:
          FOOD: 19.0
          ALCOHOL: 19.0
          BEVERAGE: 19.0
        TAKEAWAY:
          FOOD: 7.0
          ALCOHOL: 19.0
          BEVERAGE: 19.0
        DELIVERY:
          FOOD: 7.0
          ALCOHOL: 19.0
          BEVERAGE: 19.0
    FR:
      default-rate: 10.0
      context-rates:
        DINE_IN:
          FOOD: 10.0
          ALCOHOL: 20.0
          BEVERAGE: 10.0
        TAKEAWAY:
          FOOD: 5.5
          ALCOHOL: 20.0
          BEVERAGE: 5.5
        DELIVERY:
          FOOD: 5.5
          ALCOHOL: 20.0
          BEVERAGE: 5.5
    IT:
      default-rate: 10.0
      context-rates:
        DINE_IN:
          FOOD: 10.0
          ALCOHOL: 22.0
          BEVERAGE: 10.0
        TAKEAWAY:
          FOOD: 4.0
          ALCOHOL: 22.0
          BEVERAGE: 4.0
        DELIVERY:
          FOOD: 4.0
          ALCOHOL: 22.0
          BEVERAGE: 4.0
    NL:
      default-rate: 9.0
      context-rates:
        DINE_IN:
          FOOD: 9.0
          ALCOHOL: 21.0
          BEVERAGE: 9.0
        TAKEAWAY:
          FOOD: 9.0
          ALCOHOL: 21.0
          BEVERAGE: 9.0
        DELIVERY:
          FOOD: 9.0
          ALCOHOL: 21.0
          BEVERAGE: 9.0
    BE:
      default-rate: 12.0
      context-rates:
        DINE_IN:
          FOOD: 12.0
          ALCOHOL: 21.0
          BEVERAGE: 12.0
        TAKEAWAY:
          FOOD: 6.0
          ALCOHOL: 21.0
          BEVERAGE: 6.0
        DELIVERY:
          FOOD: 6.0
          ALCOHOL: 21.0
          BEVERAGE: 6.0
    HU:
      default-rate: 27.0
      context-rates:
        DINE_IN:
          FOOD: 27.0
          ALCOHOL: 27.0
          BEVERAGE: 27.0
        TAKEAWAY:
          FOOD: 5.0
          ALCOHOL: 27.0
          BEVERAGE: 5.0
        DELIVERY:
          FOOD: 5.0
          ALCOHOL: 27.0
          BEVERAGE: 5.0
    LU:
      default-rate: 17.0
      context-rates:
        DINE_IN:
          FOOD: 17.0
          ALCOHOL: 17.0
          BEVERAGE: 17.0
        TAKEAWAY:
          FOOD: 3.0
          ALCOHOL: 17.0
          BEVERAGE: 3.0
        DELIVERY:
          FOOD: 3.0
          ALCOHOL: 17.0
          BEVERAGE: 3.0
    IE:
      default-rate: 13.5
      context-rates:
        DINE_IN:
          FOOD: 13.5
          ALCOHOL: 23.0
          BEVERAGE: 13.5
        TAKEAWAY:
          FOOD: 13.5
          ALCOHOL: 23.0
          BEVERAGE: 13.5
        DELIVERY:
          FOOD: 13.5
          ALCOHOL: 23.0
          BEVERAGE: 13.5
    CH:
      default-rate: 8.1
      context-rates:
        DINE_IN:
          FOOD: 8.1
          ALCOHOL: 8.1
          BEVERAGE: 8.1
        TAKEAWAY:
          FOOD: 2.6
          ALCOHOL: 8.1
          BEVERAGE: 2.6
        DELIVERY:
          FOOD: 2.6
          ALCOHOL: 8.1
          BEVERAGE: 2.6
    GB:
      default-rate: 20.0
      context-rates:
        DINE_IN:
          FOOD: 20.0
          ALCOHOL: 20.0
          BEVERAGE: 20.0
        TAKEAWAY:
          FOOD: 0.0
          ALCOHOL: 20.0
          BEVERAGE: 20.0
        DELIVERY:
          FOOD: 0.0
          ALCOHOL: 20.0
          BEVERAGE: 20.0
    US:
      default-rate: 0.0
      context-rates:
        DINE_IN:
          FOOD: 0.0
          ALCOHOL: 0.0
          BEVERAGE: 0.0
        TAKEAWAY:
          FOOD: 0.0
          ALCOHOL: 0.0
          BEVERAGE: 0.0
        DELIVERY:
          FOOD: 0.0
          ALCOHOL: 0.0
          BEVERAGE: 0.0
    CA:
      default-rate: 0.0
      context-rates:
        DINE_IN:
          FOOD: 0.0
          ALCOHOL: 0.0
          BEVERAGE: 0.0
        TAKEAWAY:
          FOOD: 0.0
          ALCOHOL: 0.0
          BEVERAGE: 0.0
        DELIVERY:
          FOOD: 0.0
          ALCOHOL: 0.0
          BEVERAGE: 0.0
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
cd commerce-service && mvn test -Dtest="EuVatConfigurationTest" "-Dmaven.test.skip=false" 2>&1 | tail -20
```
Expected: BUILD SUCCESS, 8 tests passed.

- [ ] **Step 6: Commit**

```bash
git add commerce-service/src/main/java/com/MaSoVa/commerce/order/config/EuVatConfiguration.java \
        commerce-service/src/main/resources/application.yml \
        commerce-service/src/test/java/com/MaSoVa/commerce/order/config/EuVatConfigurationTest.java
git commit -m "feat(commerce): add EuVatConfiguration with per-country VAT rates for 12 countries"
```

---

### Task 2: `VatLineItem` and `VatBreakdown` value objects in shared-models

**Files:**
- Create: `shared-models/src/main/java/com/MaSoVa/shared/model/VatLineItem.java`
- Create: `shared-models/src/main/java/com/MaSoVa/shared/model/VatBreakdown.java`
- Create: `shared-models/src/test/java/com/MaSoVa/shared/model/VatBreakdownTest.java`

**What this does:** Typed value objects for per-line-item VAT stored on `Order`. Required before touching `Order` entity.

- [ ] **Step 1: Create the test directory**

```bash
mkdir -p shared-models/src/test/java/com/MaSoVa/shared/model
```

- [ ] **Step 2: Write failing test**

Create `shared-models/src/test/java/com/MaSoVa/shared/model/VatBreakdownTest.java`:

```java
package com.MaSoVa.shared.model;

import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import java.util.List;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

class VatBreakdownTest {

    @Test
    void totalVatAmount_sums_all_line_items() {
        VatLineItem line1 = new VatLineItem("item-1", "Burger", 19.0, new BigDecimal("100.00"),
                new BigDecimal("19.00"), new BigDecimal("119.00"));
        VatLineItem line2 = new VatLineItem("item-2", "Beer", 19.0, new BigDecimal("50.00"),
                new BigDecimal("9.50"), new BigDecimal("59.50"));

        VatBreakdown breakdown = new VatBreakdown("DE", "DINE_IN",
                new BigDecimal("150.00"), new BigDecimal("28.50"), new BigDecimal("178.50"),
                List.of(line1, line2));

        assertThat(breakdown.getTotalNetAmount()).isEqualByComparingTo(new BigDecimal("150.00"));
        assertThat(breakdown.getTotalVatAmount()).isEqualByComparingTo(new BigDecimal("28.50"));
        assertThat(breakdown.getTotalGrossAmount()).isEqualByComparingTo(new BigDecimal("178.50"));
    }

    @Test
    void vatLineItem_stores_all_fields() {
        VatLineItem item = new VatLineItem("item-1", "Schnitzel", 19.0,
                new BigDecimal("100.00"), new BigDecimal("19.00"), new BigDecimal("119.00"));
        assertThat(item.getMenuItemId()).isEqualTo("item-1");
        assertThat(item.getItemName()).isEqualTo("Schnitzel");
        assertThat(item.getVatRate()).isEqualTo(19.0);
        assertThat(item.getNetAmount()).isEqualByComparingTo(new BigDecimal("100.00"));
        assertThat(item.getVatAmount()).isEqualByComparingTo(new BigDecimal("19.00"));
        assertThat(item.getGrossAmount()).isEqualByComparingTo(new BigDecimal("119.00"));
    }
}
```

- [ ] **Step 3: Run to confirm it fails**

```bash
cd shared-models && mvn test -Dtest="VatBreakdownTest" "-Dmaven.test.skip=false" 2>&1 | grep -E "ERROR|FAIL|cannot find"
```
Expected: Compilation error — `VatLineItem` and `VatBreakdown` do not exist.

- [ ] **Step 4: Create VatLineItem**

Create `shared-models/src/main/java/com/MaSoVa/shared/model/VatLineItem.java`:

```java
package com.MaSoVa.shared.model;

import java.math.BigDecimal;

/**
 * VAT breakdown for a single order line item.
 * Stored in Order.vatBreakdown.lines — required for fiscal compliance.
 */
public class VatLineItem {

    private String menuItemId;
    private String itemName;
    private double vatRate;         // e.g. 19.0 for 19%
    private BigDecimal netAmount;   // price before VAT
    private BigDecimal vatAmount;   // VAT portion
    private BigDecimal grossAmount; // netAmount + vatAmount

    public VatLineItem() {}

    public VatLineItem(String menuItemId, String itemName, double vatRate,
                       BigDecimal netAmount, BigDecimal vatAmount, BigDecimal grossAmount) {
        this.menuItemId = menuItemId;
        this.itemName = itemName;
        this.vatRate = vatRate;
        this.netAmount = netAmount;
        this.vatAmount = vatAmount;
        this.grossAmount = grossAmount;
    }

    public String getMenuItemId() { return menuItemId; }
    public void setMenuItemId(String menuItemId) { this.menuItemId = menuItemId; }

    public String getItemName() { return itemName; }
    public void setItemName(String itemName) { this.itemName = itemName; }

    public double getVatRate() { return vatRate; }
    public void setVatRate(double vatRate) { this.vatRate = vatRate; }

    public BigDecimal getNetAmount() { return netAmount; }
    public void setNetAmount(BigDecimal netAmount) { this.netAmount = netAmount; }

    public BigDecimal getVatAmount() { return vatAmount; }
    public void setVatAmount(BigDecimal vatAmount) { this.vatAmount = vatAmount; }

    public BigDecimal getGrossAmount() { return grossAmount; }
    public void setGrossAmount(BigDecimal grossAmount) { this.grossAmount = grossAmount; }
}
```

- [ ] **Step 5: Create VatBreakdown**

Create `shared-models/src/main/java/com/MaSoVa/shared/model/VatBreakdown.java`:

```java
package com.MaSoVa.shared.model;

import java.math.BigDecimal;
import java.util.List;

/**
 * Full VAT breakdown for an order.
 * Stored on Order.vatBreakdown (MongoDB) and serialised to vatBreakdown JSONB column (PostgreSQL).
 */
public class VatBreakdown {

    private String vatCountryCode;   // e.g. "DE"
    private String orderContext;     // "DINE_IN" | "TAKEAWAY" | "DELIVERY"
    private BigDecimal totalNetAmount;
    private BigDecimal totalVatAmount;
    private BigDecimal totalGrossAmount;
    private List<VatLineItem> lines;

    public VatBreakdown() {}

    public VatBreakdown(String vatCountryCode, String orderContext,
                        BigDecimal totalNetAmount, BigDecimal totalVatAmount,
                        BigDecimal totalGrossAmount, List<VatLineItem> lines) {
        this.vatCountryCode = vatCountryCode;
        this.orderContext = orderContext;
        this.totalNetAmount = totalNetAmount;
        this.totalVatAmount = totalVatAmount;
        this.totalGrossAmount = totalGrossAmount;
        this.lines = lines;
    }

    public String getVatCountryCode() { return vatCountryCode; }
    public void setVatCountryCode(String vatCountryCode) { this.vatCountryCode = vatCountryCode; }

    public String getOrderContext() { return orderContext; }
    public void setOrderContext(String orderContext) { this.orderContext = orderContext; }

    public BigDecimal getTotalNetAmount() { return totalNetAmount; }
    public void setTotalNetAmount(BigDecimal totalNetAmount) { this.totalNetAmount = totalNetAmount; }

    public BigDecimal getTotalVatAmount() { return totalVatAmount; }
    public void setTotalVatAmount(BigDecimal totalVatAmount) { this.totalVatAmount = totalVatAmount; }

    public BigDecimal getTotalGrossAmount() { return totalGrossAmount; }
    public void setTotalGrossAmount(BigDecimal totalGrossAmount) { this.totalGrossAmount = totalGrossAmount; }

    public List<VatLineItem> getLines() { return lines; }
    public void setLines(List<VatLineItem> lines) { this.lines = lines; }
}
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
cd shared-models && mvn test -Dtest="VatBreakdownTest" "-Dmaven.test.skip=false" 2>&1 | tail -20
```
Expected: BUILD SUCCESS, 2 tests passed.

- [ ] **Step 7: Commit**

```bash
git add shared-models/src/main/java/com/MaSoVa/shared/model/VatLineItem.java \
        shared-models/src/main/java/com/MaSoVa/shared/model/VatBreakdown.java \
        shared-models/src/test/java/com/MaSoVa/shared/model/VatBreakdownTest.java
git commit -m "feat(shared-models): add VatLineItem and VatBreakdown value objects for Global-2"
```

---

### Task 3: Add VAT fields to `Store` entity (shared-models)

**Files:**
- Modify: `shared-models/src/main/java/com/MaSoVa/shared/entity/Store.java`
- Create: `shared-models/src/test/java/com/MaSoVa/shared/entity/StoreVatFieldsTest.java`

**What this does:** `Store` gains `countryCode` (e.g. "DE"), `vatNumber`, `currency` (e.g. "EUR"), `locale` (e.g. "de-DE"). All nullable — existing India stores continue working with null values.

- [ ] **Step 1: Write failing test**

Create `shared-models/src/test/java/com/MaSoVa/shared/entity/StoreVatFieldsTest.java`:

```java
package com.MaSoVa.shared.entity;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

class StoreVatFieldsTest {

    @Test
    void new_store_has_null_countryCode_by_default() {
        Store store = new Store("Test Store", "DOM001", null, "9876543210");
        assertThat(store.getCountryCode()).isNull();
    }

    @Test
    void countryCode_can_be_set_and_retrieved() {
        Store store = new Store("DE Store", "DOM002", null, "9876543210");
        store.setCountryCode("DE");
        assertThat(store.getCountryCode()).isEqualTo("DE");
    }

    @Test
    void vatNumber_can_be_set_and_retrieved() {
        Store store = new Store("DE Store", "DOM002", null, "9876543210");
        store.setVatNumber("DE123456789");
        assertThat(store.getVatNumber()).isEqualTo("DE123456789");
    }

    @Test
    void currency_can_be_set_and_retrieved() {
        Store store = new Store("DE Store", "DOM002", null, "9876543210");
        store.setCurrency("EUR");
        assertThat(store.getCurrency()).isEqualTo("EUR");
    }

    @Test
    void locale_can_be_set_and_retrieved() {
        Store store = new Store("DE Store", "DOM002", null, "9876543210");
        store.setLocale("de-DE");
        assertThat(store.getLocale()).isEqualTo("de-DE");
    }

    @Test
    void india_store_with_null_countryCode_is_valid() {
        // India stores must continue working — countryCode null is fine
        Store store = new Store("Mumbai Store", "DOM003", null, "9876543210");
        assertThat(store.getCountryCode()).isNull();
        assertThat(store.getCurrency()).isNull();
    }
}
```

- [ ] **Step 2: Run to confirm it fails**

```bash
cd shared-models && mvn test -Dtest="StoreVatFieldsTest" "-Dmaven.test.skip=false" 2>&1 | grep -E "ERROR|FAIL|cannot find|getCountryCode"
```
Expected: Compilation error — `getCountryCode()` method does not exist on `Store`.

- [ ] **Step 3: Add VAT fields to Store.java**

In `shared-models/src/main/java/com/MaSoVa/shared/entity/Store.java`, add these four fields after the `lastModified` field (around line 82):

```java
    /** ISO 3166-1 alpha-2 country code, e.g. "DE", "FR". Null for India stores (legacy). */
    @Field("countryCode")
    @Indexed
    private String countryCode;

    /** VAT registration number for EU/UK/CH stores. Null for India stores. */
    @Field("vatNumber")
    private String vatNumber;

    /** ISO 4217 currency code, e.g. "EUR", "GBP", "INR". Null = legacy India (INR assumed). */
    @Field("currency")
    private String currency;

    /** BCP 47 locale tag, e.g. "de-DE", "fr-FR". Null = legacy India (en-IN assumed). */
    @Field("locale")
    private String locale;
```

Then add getters/setters after the existing `getLastModified` / `setLastModified` methods (around line 175):

```java
    public String getCountryCode() { return countryCode; }
    public void setCountryCode(String countryCode) { this.countryCode = countryCode; }

    public String getVatNumber() { return vatNumber; }
    public void setVatNumber(String vatNumber) { this.vatNumber = vatNumber; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public String getLocale() { return locale; }
    public void setLocale(String locale) { this.locale = locale; }
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd shared-models && mvn test -Dtest="StoreVatFieldsTest" "-Dmaven.test.skip=false" 2>&1 | tail -20
```
Expected: BUILD SUCCESS, 6 tests passed.

- [ ] **Step 5: Commit**

```bash
git add shared-models/src/main/java/com/MaSoVa/shared/entity/Store.java \
        shared-models/src/test/java/com/MaSoVa/shared/entity/StoreVatFieldsTest.java
git commit -m "feat(shared-models): add countryCode, vatNumber, currency, locale fields to Store entity"
```

---

### Task 4: Add VAT fields to `Order` entity (MongoDB) and `OrderJpaEntity` (PostgreSQL)

**Files:**
- Modify: `commerce-service/src/main/java/com/MaSoVa/commerce/order/entity/Order.java`
- Modify: `commerce-service/src/main/java/com/MaSoVa/commerce/order/entity/OrderJpaEntity.java`
- Create: `commerce-service/src/main/resources/db/migration/V4__order_vat_columns.sql`
- Create: `commerce-service/src/test/java/com/MaSoVa/commerce/order/entity/OrderVatFieldsTest.java`

**What this does:** `Order` (MongoDB) gains `vatCountryCode`, `vatBreakdown`, `totalNetAmount`, `totalVatAmount`, `totalGrossAmount`. `OrderJpaEntity` (PostgreSQL) gains the same columns. Old `tax` field kept for India backwards compatibility.

- [ ] **Step 1: Write failing test**

Create `commerce-service/src/test/java/com/MaSoVa/commerce/order/entity/OrderVatFieldsTest.java`:

```java
package com.MaSoVa.commerce.order.entity;

import com.MaSoVa.shared.model.VatBreakdown;
import com.MaSoVa.shared.model.VatLineItem;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import java.util.List;
import static org.assertj.core.api.Assertions.assertThat;

class OrderVatFieldsTest {

    @Test
    void new_order_has_null_vatCountryCode_by_default() {
        Order order = new Order();
        assertThat(order.getVatCountryCode()).isNull();
    }

    @Test
    void vatCountryCode_can_be_set() {
        Order order = new Order();
        order.setVatCountryCode("DE");
        assertThat(order.getVatCountryCode()).isEqualTo("DE");
    }

    @Test
    void totalNetAmount_can_be_set_and_retrieved() {
        Order order = new Order();
        order.setTotalNetAmount(new BigDecimal("100.00"));
        assertThat(order.getTotalNetAmount()).isEqualByComparingTo(new BigDecimal("100.00"));
    }

    @Test
    void totalVatAmount_can_be_set_and_retrieved() {
        Order order = new Order();
        order.setTotalVatAmount(new BigDecimal("19.00"));
        assertThat(order.getTotalVatAmount()).isEqualByComparingTo(new BigDecimal("19.00"));
    }

    @Test
    void totalGrossAmount_can_be_set_and_retrieved() {
        Order order = new Order();
        order.setTotalGrossAmount(new BigDecimal("119.00"));
        assertThat(order.getTotalGrossAmount()).isEqualByComparingTo(new BigDecimal("119.00"));
    }

    @Test
    void vatBreakdown_can_be_set_and_retrieved() {
        Order order = new Order();
        VatLineItem line = new VatLineItem("item-1", "Burger", 19.0,
                new BigDecimal("10.00"), new BigDecimal("1.90"), new BigDecimal("11.90"));
        VatBreakdown breakdown = new VatBreakdown("DE", "DINE_IN",
                new BigDecimal("10.00"), new BigDecimal("1.90"), new BigDecimal("11.90"), List.of(line));
        order.setVatBreakdown(breakdown);
        assertThat(order.getVatBreakdown()).isNotNull();
        assertThat(order.getVatBreakdown().getVatCountryCode()).isEqualTo("DE");
    }

    @Test
    void india_order_without_vatCountryCode_still_has_tax_field() {
        // India orders use .getTax() not vatBreakdown — must still work
        Order order = new Order();
        order.setTax(new BigDecimal("10.00"));
        assertThat(order.getTax()).isEqualByComparingTo(new BigDecimal("10.00"));
        assertThat(order.getVatCountryCode()).isNull();
    }
}
```

- [ ] **Step 2: Run to confirm it fails**

```bash
cd commerce-service && mvn test -Dtest="OrderVatFieldsTest" "-Dmaven.test.skip=false" 2>&1 | grep -E "ERROR|cannot find|getVatCountryCode"
```
Expected: Compilation error.

- [ ] **Step 3: Add VAT fields to Order.java (MongoDB entity)**

In `commerce-service/src/main/java/com/MaSoVa/commerce/order/entity/Order.java`, add these fields after the `total` field (around line 49):

```java
    // Global-2: EU VAT fields — null for India stores (use tax field instead)
    private String vatCountryCode;        // ISO country code when EU VAT applies, e.g. "DE"
    private BigDecimal totalNetAmount;    // order total before VAT
    private BigDecimal totalVatAmount;    // total VAT charged
    private BigDecimal totalGrossAmount;  // totalNetAmount + totalVatAmount
    private VatBreakdown vatBreakdown;    // per-line-item VAT detail
```

Add the import at the top of the file (after existing imports):
```java
import com.MaSoVa.shared.model.VatBreakdown;
```

Add getters/setters after `setTotal()` (around line 169):
```java
    public String getVatCountryCode() { return vatCountryCode; }
    public void setVatCountryCode(String vatCountryCode) { this.vatCountryCode = vatCountryCode; }

    public BigDecimal getTotalNetAmount() { return totalNetAmount; }
    public void setTotalNetAmount(BigDecimal totalNetAmount) { this.totalNetAmount = totalNetAmount; }

    public BigDecimal getTotalVatAmount() { return totalVatAmount; }
    public void setTotalVatAmount(BigDecimal totalVatAmount) { this.totalVatAmount = totalVatAmount; }

    public BigDecimal getTotalGrossAmount() { return totalGrossAmount; }
    public void setTotalGrossAmount(BigDecimal totalGrossAmount) { this.totalGrossAmount = totalGrossAmount; }

    public VatBreakdown getVatBreakdown() { return vatBreakdown; }
    public void setVatBreakdown(VatBreakdown vatBreakdown) { this.vatBreakdown = vatBreakdown; }
```

- [ ] **Step 4: Add VAT fields to OrderJpaEntity.java (PostgreSQL)**

In `commerce-service/src/main/java/com/MaSoVa/commerce/order/entity/OrderJpaEntity.java`, add after the `total` column (after line 103):

```java
    // Global-2: EU VAT columns — null for India orders
    @Column(name = "vat_country_code", length = 2)
    private String vatCountryCode;

    @Column(name = "total_net_amount", precision = 12, scale = 2)
    private java.math.BigDecimal totalNetAmount;

    @Column(name = "total_vat_amount", precision = 12, scale = 2)
    private java.math.BigDecimal totalVatAmount;

    @Column(name = "total_gross_amount", precision = 12, scale = 2)
    private java.math.BigDecimal totalGrossAmount;

    /** Per-line VAT breakdown stored as JSONB. */
    @Column(name = "vat_breakdown", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String vatBreakdown;
```

Add getters/setters at the bottom of `OrderJpaEntity` (before the closing `}`):

```java
    public String getVatCountryCode() { return vatCountryCode; }
    public void setVatCountryCode(String vatCountryCode) { this.vatCountryCode = vatCountryCode; }

    public java.math.BigDecimal getTotalNetAmount() { return totalNetAmount; }
    public void setTotalNetAmount(java.math.BigDecimal totalNetAmount) { this.totalNetAmount = totalNetAmount; }

    public java.math.BigDecimal getTotalVatAmount() { return totalVatAmount; }
    public void setTotalVatAmount(java.math.BigDecimal totalVatAmount) { this.totalVatAmount = totalVatAmount; }

    public java.math.BigDecimal getTotalGrossAmount() { return totalGrossAmount; }
    public void setTotalGrossAmount(java.math.BigDecimal totalGrossAmount) { this.totalGrossAmount = totalGrossAmount; }

    public String getVatBreakdown() { return vatBreakdown; }
    public void setVatBreakdown(String vatBreakdown) { this.vatBreakdown = vatBreakdown; }
```

Note: `OrderJpaEntity` uses `@Data` from Lombok which auto-generates getters/setters, but adding explicit ones is fine since Lombok's `@Data` will be superseded. Alternatively if `@Data` is present and causes duplicate method errors, remove the explicit getters/setters and rely on Lombok — but the fields MUST be added.

- [ ] **Step 5: Create Flyway migration V4**

Create `commerce-service/src/main/resources/db/migration/V4__order_vat_columns.sql`:

```sql
-- V4: EU VAT columns on orders table (Global-2)
-- These columns are nullable — India orders remain unchanged (vat_country_code IS NULL)

ALTER TABLE commerce_schema.orders
    ADD COLUMN IF NOT EXISTS vat_country_code    VARCHAR(2),
    ADD COLUMN IF NOT EXISTS total_net_amount    DECIMAL(12,2),
    ADD COLUMN IF NOT EXISTS total_vat_amount    DECIMAL(12,2),
    ADD COLUMN IF NOT EXISTS total_gross_amount  DECIMAL(12,2),
    ADD COLUMN IF NOT EXISTS vat_breakdown       JSONB;

-- Index for VAT reporting queries (filter by country + date range)
CREATE INDEX IF NOT EXISTS idx_orders_vat_country_created
    ON commerce_schema.orders (vat_country_code, created_at)
    WHERE vat_country_code IS NOT NULL;

COMMENT ON COLUMN commerce_schema.orders.vat_country_code   IS 'ISO 3166-1 alpha-2 — NULL for India GST orders';
COMMENT ON COLUMN commerce_schema.orders.total_net_amount   IS 'Order total before VAT — NULL for India orders';
COMMENT ON COLUMN commerce_schema.orders.total_vat_amount   IS 'Total VAT charged — NULL for India orders';
COMMENT ON COLUMN commerce_schema.orders.total_gross_amount IS 'total_net_amount + total_vat_amount';
COMMENT ON COLUMN commerce_schema.orders.vat_breakdown      IS 'Per-line-item VAT as JSONB (VatBreakdown)';
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
cd commerce-service && mvn test -Dtest="OrderVatFieldsTest" "-Dmaven.test.skip=false" 2>&1 | tail -20
```
Expected: BUILD SUCCESS, 7 tests passed.

- [ ] **Step 7: Commit**

```bash
git add commerce-service/src/main/java/com/MaSoVa/commerce/order/entity/Order.java \
        commerce-service/src/main/java/com/MaSoVa/commerce/order/entity/OrderJpaEntity.java \
        commerce-service/src/main/resources/db/migration/V4__order_vat_columns.sql \
        commerce-service/src/test/java/com/MaSoVa/commerce/order/entity/OrderVatFieldsTest.java
git commit -m "feat(commerce): add VAT fields to Order (MongoDB) and OrderJpaEntity (PostgreSQL V4 migration)"
```

---

### Task 5: `EuVatEngine` service — calculates VAT breakdown for an order

**Files:**
- Create: `commerce-service/src/main/java/com/MaSoVa/commerce/order/service/EuVatEngine.java`
- Create: `commerce-service/src/test/java/com/MaSoVa/commerce/order/service/EuVatEngineTest.java`

**What this does:** `EuVatEngine` takes a `countryCode`, `orderContext`, and `List<OrderItem>` and returns a fully-populated `VatBreakdown` with per-line VAT calculated. Each `OrderItem` carries a `category` field (mapped from menu item's `MenuCategory` enum name). If category is null, defaults to "FOOD".

- [ ] **Step 1: Check what MenuCategory values exist**

```bash
grep -n "enum MenuCategory" shared-models/src/main/java/com/MaSoVa/shared/enums/MenuCategory.java
cat shared-models/src/main/java/com/MaSoVa/shared/enums/MenuCategory.java
```
Note the enum values — these map to VAT category keys. FOOD, BEVERAGE, ALCOHOL are the three VAT-relevant categories.

- [ ] **Step 2: Write failing test**

Create `commerce-service/src/test/java/com/MaSoVa/commerce/order/service/EuVatEngineTest.java`:

```java
package com.MaSoVa.commerce.order.service;

import com.MaSoVa.commerce.order.config.EuVatConfiguration;
import com.MaSoVa.commerce.order.entity.OrderItem;
import com.MaSoVa.shared.model.VatBreakdown;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

class EuVatEngineTest {

    private EuVatEngine engine;

    @BeforeEach
    void setUp() {
        EuVatConfiguration config = new EuVatConfiguration();

        EuVatConfiguration.CountryVatProfile de = new EuVatConfiguration.CountryVatProfile();
        de.setDefaultRate(19.0);
        de.setContextRates(Map.of(
            "DINE_IN", Map.of("FOOD", 19.0, "ALCOHOL", 19.0),
            "TAKEAWAY", Map.of("FOOD", 7.0, "ALCOHOL", 19.0),
            "DELIVERY", Map.of("FOOD", 7.0, "ALCOHOL", 19.0)
        ));
        config.setCountries(Map.of("DE", de));

        engine = new EuVatEngine(config);
    }

    @Test
    void calculate_single_food_item_DE_DINE_IN_at_19_percent() {
        OrderItem item = new OrderItem();
        item.setMenuItemId("item-1");
        item.setName("Schnitzel");
        item.setPrice(new BigDecimal("10.00"));
        item.setQuantity(1);
        item.setCategory("FOOD");

        VatBreakdown result = engine.calculate("DE", "DINE_IN", List.of(item));

        assertThat(result.getVatCountryCode()).isEqualTo("DE");
        assertThat(result.getOrderContext()).isEqualTo("DINE_IN");
        // net = 10.00, vat = 10.00 * 19% = 1.90, gross = 11.90
        assertThat(result.getTotalNetAmount()).isEqualByComparingTo(new BigDecimal("10.00"));
        assertThat(result.getTotalVatAmount().doubleValue()).isCloseTo(1.90, within(0.01));
        assertThat(result.getTotalGrossAmount().doubleValue()).isCloseTo(11.90, within(0.01));
        assertThat(result.getLines()).hasSize(1);
    }

    @Test
    void calculate_two_items_different_quantities() {
        // 2 × Burger @ ₹10 = net 20, vat 19% = 3.80, gross 23.80
        OrderItem item = new OrderItem();
        item.setMenuItemId("item-1");
        item.setName("Burger");
        item.setPrice(new BigDecimal("10.00"));
        item.setQuantity(2);
        item.setCategory("FOOD");

        VatBreakdown result = engine.calculate("DE", "DINE_IN", List.of(item));
        assertThat(result.getTotalNetAmount()).isEqualByComparingTo(new BigDecimal("20.00"));
        assertThat(result.getTotalVatAmount().doubleValue()).isCloseTo(3.80, within(0.01));
    }

    @Test
    void calculate_DE_TAKEAWAY_applies_7_percent_for_food() {
        OrderItem item = new OrderItem();
        item.setMenuItemId("item-1");
        item.setName("Wrap");
        item.setPrice(new BigDecimal("10.00"));
        item.setQuantity(1);
        item.setCategory("FOOD");

        VatBreakdown result = engine.calculate("DE", "TAKEAWAY", List.of(item));
        assertThat(result.getTotalVatAmount().doubleValue()).isCloseTo(0.70, within(0.01));
    }

    @Test
    void null_category_defaults_to_FOOD_rate() {
        OrderItem item = new OrderItem();
        item.setMenuItemId("item-1");
        item.setName("Special");
        item.setPrice(new BigDecimal("10.00"));
        item.setQuantity(1);
        item.setCategory(null);  // null category → FOOD fallback

        VatBreakdown result = engine.calculate("DE", "DINE_IN", List.of(item));
        assertThat(result.getTotalVatAmount().doubleValue()).isCloseTo(1.90, within(0.01));
    }

    @Test
    void line_items_populated_per_order_item() {
        OrderItem item1 = new OrderItem();
        item1.setMenuItemId("item-1");
        item1.setName("Steak");
        item1.setPrice(new BigDecimal("20.00"));
        item1.setQuantity(1);
        item1.setCategory("FOOD");

        OrderItem item2 = new OrderItem();
        item2.setMenuItemId("item-2");
        item2.setName("Beer");
        item2.setPrice(new BigDecimal("5.00"));
        item2.setQuantity(2);
        item2.setCategory("ALCOHOL");

        VatBreakdown result = engine.calculate("DE", "DINE_IN", List.of(item1, item2));
        assertThat(result.getLines()).hasSize(2);
        // steak net=20, vat=3.80; beer net=10, vat=1.90; total net=30, total vat=5.70
        assertThat(result.getTotalNetAmount()).isEqualByComparingTo(new BigDecimal("30.00"));
        assertThat(result.getTotalVatAmount().doubleValue()).isCloseTo(5.70, within(0.01));
    }
}
```

- [ ] **Step 3: Run to confirm it fails**

```bash
cd commerce-service && mvn test -Dtest="EuVatEngineTest" "-Dmaven.test.skip=false" 2>&1 | grep -E "ERROR|cannot find|EuVatEngine"
```
Expected: Compilation error — `EuVatEngine` does not exist, `OrderItem.setCategory` may not exist either.

- [ ] **Step 4: Check if OrderItem has a category field**

```bash
grep -n "category" commerce-service/src/main/java/com/MaSoVa/commerce/order/entity/OrderItem.java
```

If `category` field does not exist in `OrderItem`, add it:

In `commerce-service/src/main/java/com/MaSoVa/commerce/order/entity/OrderItem.java`, find the field list and add:
```java
    private String category;  // MenuCategory name, e.g. "FOOD", "BEVERAGE", "ALCOHOL" — for VAT routing
```
And add getter/setter:
```java
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
```

- [ ] **Step 5: Create EuVatEngine**

Create `commerce-service/src/main/java/com/MaSoVa/commerce/order/service/EuVatEngine.java`:

```java
package com.MaSoVa.commerce.order.service;

import com.MaSoVa.commerce.order.config.EuVatConfiguration;
import com.MaSoVa.commerce.order.entity.OrderItem;
import com.MaSoVa.shared.model.VatBreakdown;
import com.MaSoVa.shared.model.VatLineItem;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

/**
 * Calculates EU VAT breakdown for an order.
 * Used by OrderService when store.countryCode is non-null (EU/non-India store).
 * India stores continue to use TaxConfiguration (GST) — this class is not called.
 */
@Service
public class EuVatEngine {

    private final EuVatConfiguration euVatConfig;

    public EuVatEngine(EuVatConfiguration euVatConfig) {
        this.euVatConfig = euVatConfig;
    }

    /**
     * Calculates VAT breakdown for the given order items.
     *
     * @param countryCode ISO country code, e.g. "DE"
     * @param orderContext "DINE_IN", "TAKEAWAY", or "DELIVERY"
     * @param items        list of order items (each may have a category field)
     * @return VatBreakdown with per-line items and totals
     */
    public VatBreakdown calculate(String countryCode, String orderContext, List<OrderItem> items) {
        List<VatLineItem> lines = new ArrayList<>();
        BigDecimal totalNet = BigDecimal.ZERO;
        BigDecimal totalVat = BigDecimal.ZERO;

        for (OrderItem item : items) {
            String category = item.getCategory() != null ? item.getCategory().toUpperCase() : "FOOD";
            double vatRatePct = euVatConfig.lookupRate(countryCode, orderContext, category);

            // net = price × quantity
            BigDecimal net = item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity()))
                    .setScale(2, RoundingMode.HALF_UP);
            // vat = net × (rate / 100)
            BigDecimal vat = net.multiply(BigDecimal.valueOf(vatRatePct / 100.0))
                    .setScale(2, RoundingMode.HALF_UP);
            BigDecimal gross = net.add(vat);

            lines.add(new VatLineItem(item.getMenuItemId(), item.getName(), vatRatePct, net, vat, gross));
            totalNet = totalNet.add(net);
            totalVat = totalVat.add(vat);
        }

        BigDecimal totalGross = totalNet.add(totalVat);
        return new VatBreakdown(countryCode, orderContext, totalNet, totalVat, totalGross, lines);
    }
}
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
cd commerce-service && mvn test -Dtest="EuVatEngineTest" "-Dmaven.test.skip=false" 2>&1 | tail -20
```
Expected: BUILD SUCCESS, 5 tests passed.

- [ ] **Step 7: Commit**

```bash
git add commerce-service/src/main/java/com/MaSoVa/commerce/order/service/EuVatEngine.java \
        commerce-service/src/main/java/com/MaSoVa/commerce/order/entity/OrderItem.java \
        commerce-service/src/test/java/com/MaSoVa/commerce/order/service/EuVatEngineTest.java
git commit -m "feat(commerce): add EuVatEngine service — per-line VAT calculation for EU stores"
```

---

### Task 6: Wire `EuVatEngine` into `OrderService.createOrder()`

**Files:**
- Modify: `commerce-service/src/main/java/com/MaSoVa/commerce/order/service/OrderService.java`
- Modify: `commerce-service/src/main/java/com/MaSoVa/commerce/order/service/OrderItemSyncService.java`
- Create: `commerce-service/src/test/java/com/MaSoVa/commerce/order/service/OrderServiceEuVatTest.java`

**What this does:** In `createOrder()`, after fetching the store, check `store.getCountryCode()`. If non-null → call `euVatEngine.calculate(...)`, set `order.vatCountryCode`, `order.vatBreakdown`, `order.totalNetAmount`, `order.totalVatAmount`, `order.totalGrossAmount`, and use `totalGrossAmount` as the order total. If null → use existing India GST path unchanged. Also updates `OrderItemSyncService.toJpaEntity()` to map VAT fields.

- [ ] **Step 1: Write failing test**

Create `commerce-service/src/test/java/com/MaSoVa/commerce/order/service/OrderServiceEuVatTest.java`:

```java
package com.MaSoVa.commerce.order.service;

import com.MaSoVa.commerce.order.client.*;
import com.MaSoVa.commerce.order.config.*;
import com.MaSoVa.commerce.order.dto.CreateOrderRequest;
import com.MaSoVa.commerce.order.entity.Order;
import com.MaSoVa.commerce.order.entity.OrderJpaEntity;
import com.MaSoVa.commerce.order.repository.OrderJpaRepository;
import com.MaSoVa.commerce.order.repository.OrderRepository;
import com.MaSoVa.commerce.order.websocket.OrderWebSocketController;
import com.MaSoVa.shared.entity.Store;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceEuVatTest {

    @Mock OrderRepository orderRepository;
    @Mock OrderJpaRepository orderJpaRepository;
    @Mock OrderItemSyncService orderItemSyncService;
    @Mock OrderWebSocketController webSocketController;
    @Mock MenuServiceClient menuServiceClient;
    @Mock CustomerServiceClient customerServiceClient;
    @Mock CustomerNotificationService customerNotificationService;
    @Mock DeliveryServiceClient deliveryServiceClient;
    @Mock StoreServiceClient storeServiceClient;
    @Mock InventoryServiceClient inventoryServiceClient;
    @Mock OrderEventPublisher orderEventPublisher;

    private OrderService orderService;

    @BeforeEach
    void setUp() {
        TaxConfiguration taxConfig = new TaxConfiguration();
        PreparationTimeConfiguration prepConfig = new PreparationTimeConfiguration();
        DeliveryFeeConfiguration deliveryFeeConfig = new DeliveryFeeConfiguration();

        EuVatConfiguration euVatConfig = new EuVatConfiguration();
        EuVatConfiguration.CountryVatProfile de = new EuVatConfiguration.CountryVatProfile();
        de.setDefaultRate(19.0);
        de.setContextRates(Map.of(
            "DINE_IN", Map.of("FOOD", 19.0),
            "TAKEAWAY", Map.of("FOOD", 7.0),
            "DELIVERY", Map.of("FOOD", 7.0)
        ));
        euVatConfig.setCountries(Map.of("DE", de));
        EuVatEngine euVatEngine = new EuVatEngine(euVatConfig);

        orderService = new OrderService(
            orderRepository, orderJpaRepository, orderItemSyncService,
            new ObjectMapper(), webSocketController,
            menuServiceClient, customerServiceClient,
            customerNotificationService, deliveryServiceClient,
            storeServiceClient, inventoryServiceClient,
            taxConfig, prepConfig, deliveryFeeConfig,
            orderEventPublisher, euVatEngine
        );

        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));
        when(orderJpaRepository.save(any(OrderJpaEntity.class))).thenAnswer(inv -> inv.getArgument(0));
        when(orderJpaRepository.findByMongoId(anyString())).thenReturn(java.util.Optional.empty());
    }

    private Store buildDeStore() {
        Store store = new Store("Berlin Store", "DOM010", null, "4915112345678");
        store.setCountryCode("DE");
        store.setCurrency("EUR");
        store.setLocale("de-DE");
        return store;
    }

    private CreateOrderRequest buildDineInRequest() {
        CreateOrderRequest req = new CreateOrderRequest();
        req.setCustomerName("Hans Müller");
        req.setCustomerPhone("4915112345678");
        req.setStoreId("store-de-001");
        req.setOrderType(Order.OrderType.DINE_IN);
        req.setPaymentMethod(Order.PaymentMethod.CARD);

        CreateOrderRequest.OrderItemRequest item = new CreateOrderRequest.OrderItemRequest();
        item.setMenuItemId("item-001");
        item.setName("Schnitzel");
        item.setQuantity(1);
        item.setPrice(new BigDecimal("10.00"));
        item.setCategory("FOOD");
        req.setItems(List.of(item));
        return req;
    }

    @Test
    void EU_store_order_sets_vatCountryCode() {
        when(storeServiceClient.getStore("store-de-001")).thenReturn(buildDeStore());

        Order result = orderService.createOrder(buildDineInRequest());

        assertThat(result.getVatCountryCode()).isEqualTo("DE");
    }

    @Test
    void EU_store_order_populates_vatBreakdown() {
        when(storeServiceClient.getStore("store-de-001")).thenReturn(buildDeStore());

        Order result = orderService.createOrder(buildDineInRequest());

        assertThat(result.getVatBreakdown()).isNotNull();
        assertThat(result.getVatBreakdown().getOrderContext()).isEqualTo("DINE_IN");
    }

    @Test
    void EU_store_DINE_IN_applies_19_percent_vat() {
        when(storeServiceClient.getStore("store-de-001")).thenReturn(buildDeStore());

        // item €10 × 19% VAT = €1.90 vat, total gross = €11.90
        Order result = orderService.createOrder(buildDineInRequest());

        assertThat(result.getTotalVatAmount().doubleValue()).isCloseTo(1.90, within(0.01));
        assertThat(result.getTotalGrossAmount().doubleValue()).isCloseTo(11.90, within(0.01));
        // total field on order == totalGrossAmount for EU stores
        assertThat(result.getTotal().doubleValue()).isCloseTo(11.90, within(0.01));
    }

    @Test
    void India_store_without_countryCode_still_uses_GST() {
        // storeServiceClient returns null or store without countryCode
        Store indiaStore = new Store("Mumbai Store", "DOM001", null, "9876543210");
        // countryCode is null — India fallback
        when(storeServiceClient.getStore("store-001")).thenReturn(indiaStore);

        CreateOrderRequest req = new CreateOrderRequest();
        req.setCustomerName("Raj Kumar");
        req.setCustomerPhone("9876543210");
        req.setStoreId("store-001");
        req.setOrderType(Order.OrderType.TAKEAWAY);
        req.setPaymentMethod(Order.PaymentMethod.CASH);
        CreateOrderRequest.OrderItemRequest item = new CreateOrderRequest.OrderItemRequest();
        item.setMenuItemId("item-001");
        item.setName("Biryani");
        item.setQuantity(1);
        item.setPrice(new BigDecimal("200.00"));
        req.setItems(List.of(item));

        Order result = orderService.createOrder(req);

        assertThat(result.getVatCountryCode()).isNull();
        // India GST 5% on ₹200 = ₹10
        assertThat(result.getTax().doubleValue()).isCloseTo(10.0, within(0.01));
    }
}
```

- [ ] **Step 2: Run to confirm it fails**

```bash
cd commerce-service && mvn test -Dtest="OrderServiceEuVatTest" "-Dmaven.test.skip=false" 2>&1 | grep -E "ERROR|cannot find|constructor"
```
Expected: Compilation error — `OrderService` constructor doesn't accept `EuVatEngine` yet, `CreateOrderRequest.OrderItemRequest` may not have `setCategory`.

- [ ] **Step 3: Check CreateOrderRequest.OrderItemRequest for category field**

```bash
grep -n "category\|OrderItemRequest" commerce-service/src/main/java/com/MaSoVa/commerce/order/dto/CreateOrderRequest.java | head -20
```

If `category` is missing from `OrderItemRequest`, add it:
- Find the inner `OrderItemRequest` class in `CreateOrderRequest.java`
- Add field: `private String category;`
- Add getter/setter: `public String getCategory() { return category; } public void setCategory(String c) { this.category = c; }`

- [ ] **Step 4: Check if StoreServiceClient has a getStore method**

```bash
grep -n "getStore\|Store" commerce-service/src/main/java/com/MaSoVa/commerce/order/client/StoreServiceClient.java | head -10
```

If `getStore(String storeId)` does not exist, add it to `StoreServiceClient.java`:
```java
    public Store getStore(String storeId) {
        // Feign client call to core-service GET /api/stores/{storeId}
        // If circuit open, return Store with null countryCode (India fallback)
        try {
            return storeClient.getStoreById(storeId);
        } catch (Exception e) {
            log.warn("StoreServiceClient.getStore failed for storeId={}: {}", storeId, e.getMessage());
            return new Store(); // null countryCode → India GST fallback
        }
    }
```

Check the existing Feign interface in StoreServiceClient — adapt to the actual method name present.

- [ ] **Step 5: Add EuVatEngine to OrderService constructor**

In `commerce-service/src/main/java/com/MaSoVa/commerce/order/service/OrderService.java`:

Add field after `orderEventPublisher`:
```java
    private final EuVatEngine euVatEngine;
```

Add `EuVatEngine euVatEngine` as the last parameter in the constructor signature and assign it:
```java
                       EuVatEngine euVatEngine) {
        // ... existing assignments ...
        this.euVatEngine = euVatEngine;
    }
```

Add the import at the top:
```java
import com.MaSoVa.commerce.order.service.EuVatEngine;
import com.MaSoVa.shared.entity.Store;
```

- [ ] **Step 6: Replace tax calculation block in createOrder()**

In `OrderService.createOrder()`, find the existing tax calculation block (around line 162–172):

```java
        // HARD-002: Dynamic tax calculation using TaxConfiguration
        // Get state from delivery address or default
        String state = (request.getDeliveryAddress() != null && request.getDeliveryAddress().getState() != null)
                ? request.getDeliveryAddress().getState()
                : "Maharashtra"; // Default state

        double tax = taxConfiguration.calculateTax(subtotal, state, true); // Assuming AC restaurant
        log.debug("Tax calculated for state {}: ₹{} ({} GST)",
                state, tax, taxConfiguration.getTaxRateForState(state));

        double total = subtotal + deliveryFee + tax;
```

Replace it with:

```java
        // Global-2: Route to EU VAT engine for non-India stores, GST for India stores
        Store store = null;
        try {
            store = storeServiceClient.getStore(request.getStoreId());
        } catch (Exception e) {
            log.warn("Could not fetch store for tax routing storeId={}: {}", request.getStoreId(), e.getMessage());
        }

        String countryCode = (store != null) ? store.getCountryCode() : null;
        double tax;
        double total;
        com.MaSoVa.shared.model.VatBreakdown vatBreakdown = null;
        String vatCountryCode = null;

        if (countryCode != null && euVatEngine != null) {
            // EU / non-India store — use VAT engine
            String orderContext = request.getOrderType() != null ? request.getOrderType().name() : "TAKEAWAY";
            vatBreakdown = euVatEngine.calculate(countryCode, orderContext, orderItems);
            vatCountryCode = countryCode;
            tax = 0.0; // VAT is embedded in gross; tax field unused for EU
            total = vatBreakdown.getTotalGrossAmount().add(BigDecimal.valueOf(deliveryFee)).doubleValue();
            log.info("EU VAT applied for country={} context={} totalVat={}", countryCode, orderContext, vatBreakdown.getTotalVatAmount());
        } else {
            // India store — use existing GST calculation
            String state = (request.getDeliveryAddress() != null && request.getDeliveryAddress().getState() != null)
                    ? request.getDeliveryAddress().getState()
                    : "Maharashtra";
            tax = taxConfiguration.calculateTax(subtotal, state, true);
            total = subtotal + deliveryFee + tax;
            log.debug("India GST applied for state={}: tax={}", state, tax);
        }
```

- [ ] **Step 7: Set VAT fields on the Order object being built**

After the `Order order = Order.builder()...build();` block, add:

```java
        // Set EU VAT fields if applicable
        if (vatBreakdown != null) {
            order.setVatCountryCode(vatCountryCode);
            order.setVatBreakdown(vatBreakdown);
            order.setTotalNetAmount(vatBreakdown.getTotalNetAmount());
            order.setTotalVatAmount(vatBreakdown.getTotalVatAmount());
            order.setTotalGrossAmount(vatBreakdown.getTotalGrossAmount());
        }
```

- [ ] **Step 8: Map VAT fields in OrderItemSyncService (dual-write to PostgreSQL)**

Find `commerce-service/src/main/java/com/MaSoVa/commerce/order/service/OrderItemSyncService.java` and look for the method that maps `Order` → `OrderJpaEntity`. Add VAT field mapping:

```bash
grep -n "toJpa\|buildJpa\|OrderJpaEntity" commerce-service/src/main/java/com/MaSoVa/commerce/order/service/OrderItemSyncService.java | head -20
```

In the method that constructs or updates `OrderJpaEntity` from `Order`, add:

```java
            // Global-2: VAT fields
            jpaEntity.setVatCountryCode(order.getVatCountryCode());
            jpaEntity.setTotalNetAmount(order.getTotalNetAmount());
            jpaEntity.setTotalVatAmount(order.getTotalVatAmount());
            jpaEntity.setTotalGrossAmount(order.getTotalGrossAmount());
            if (order.getVatBreakdown() != null) {
                try {
                    jpaEntity.setVatBreakdown(objectMapper.writeValueAsString(order.getVatBreakdown()));
                } catch (Exception e) {
                    log.warn("Failed to serialize vatBreakdown for order {}: {}", order.getId(), e.getMessage());
                }
            }
```

(Adjust `objectMapper` reference to match whatever `ObjectMapper` bean is injected in `OrderItemSyncService`.)

- [ ] **Step 9: Run all tests**

```bash
cd commerce-service && mvn test -Dtest="OrderServiceEuVatTest,OrderServiceCreateOrderTest,EuVatEngineTest,EuVatConfigurationTest,OrderVatFieldsTest" "-Dmaven.test.skip=false" 2>&1 | tail -30
```
Expected: All tests pass.

- [ ] **Step 10: Commit**

```bash
git add commerce-service/src/main/java/com/MaSoVa/commerce/order/service/OrderService.java \
        commerce-service/src/main/java/com/MaSoVa/commerce/order/service/OrderItemSyncService.java \
        commerce-service/src/main/java/com/MaSoVa/commerce/order/dto/CreateOrderRequest.java \
        commerce-service/src/test/java/com/MaSoVa/commerce/order/service/OrderServiceEuVatTest.java
git commit -m "feat(commerce): wire EuVatEngine into OrderService — EU VAT routing with India GST fallback"
```

---

### Task 7: Enrich RabbitMQ events with VAT fields

**Files:**
- Modify: `shared-models/src/main/java/com/MaSoVa/shared/messaging/events/OrderCreatedEvent.java`
- Modify: `shared-models/src/main/java/com/MaSoVa/shared/messaging/events/OrderStatusChangedEvent.java`
- Modify: `commerce-service/src/main/java/com/MaSoVa/commerce/order/service/OrderEventPublisher.java`
- Create: `shared-models/src/test/java/com/MaSoVa/shared/messaging/events/OrderCreatedEventVatTest.java`

**What this does:** `OrderCreatedEvent` gains `vatCountryCode` and `totalVatAmount`. `OrderStatusChangedEvent` gains `vatCountryCode` and `totalVatAmount`. Both are nullable — India events continue to work with null values.

- [ ] **Step 1: Write failing test**

Create `shared-models/src/test/java/com/MaSoVa/shared/messaging/events/OrderCreatedEventVatTest.java`:

```java
package com.MaSoVa.shared.messaging.events;

import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import static org.assertj.core.api.Assertions.assertThat;

class OrderCreatedEventVatTest {

    @Test
    void orderCreatedEvent_carries_vatCountryCode_and_totalVatAmount() {
        OrderCreatedEvent event = new OrderCreatedEvent(
            "order-1", "customer-1", "store-de-001",
            "DINE_IN", new BigDecimal("119.00"), "EUR"
        );
        event.setVatCountryCode("DE");
        event.setTotalVatAmount(new BigDecimal("19.00"));

        assertThat(event.getVatCountryCode()).isEqualTo("DE");
        assertThat(event.getTotalVatAmount()).isEqualByComparingTo(new BigDecimal("19.00"));
    }

    @Test
    void orderCreatedEvent_vatFields_are_null_by_default() {
        OrderCreatedEvent event = new OrderCreatedEvent(
            "order-2", "customer-2", "store-001",
            "TAKEAWAY", new BigDecimal("200.00"), "INR"
        );
        assertThat(event.getVatCountryCode()).isNull();
        assertThat(event.getTotalVatAmount()).isNull();
    }

    @Test
    void orderStatusChangedEvent_carries_vatCountryCode() {
        OrderStatusChangedEvent event = new OrderStatusChangedEvent(
            "order-1", "customer-1", "RECEIVED", "PREPARING", "store-de-001"
        );
        event.setVatCountryCode("DE");
        event.setTotalVatAmount(new BigDecimal("19.00"));

        assertThat(event.getVatCountryCode()).isEqualTo("DE");
        assertThat(event.getTotalVatAmount()).isEqualByComparingTo(new BigDecimal("19.00"));
    }
}
```

- [ ] **Step 2: Run to confirm it fails**

```bash
cd shared-models && mvn test -Dtest="OrderCreatedEventVatTest" "-Dmaven.test.skip=false" 2>&1 | grep -E "ERROR|cannot find|getVatCountryCode"
```
Expected: Compilation error.

- [ ] **Step 3: Add VAT fields to OrderCreatedEvent**

In `shared-models/src/main/java/com/MaSoVa/shared/messaging/events/OrderCreatedEvent.java`, add fields after `currency`:

```java
    private String vatCountryCode;       // null for India stores
    private java.math.BigDecimal totalVatAmount;  // null for India stores
```

Add getters/setters:
```java
    public String getVatCountryCode() { return vatCountryCode; }
    public void setVatCountryCode(String vatCountryCode) { this.vatCountryCode = vatCountryCode; }

    public java.math.BigDecimal getTotalVatAmount() { return totalVatAmount; }
    public void setTotalVatAmount(java.math.BigDecimal totalVatAmount) { this.totalVatAmount = totalVatAmount; }
```

- [ ] **Step 4: Add VAT fields to OrderStatusChangedEvent**

In `shared-models/src/main/java/com/MaSoVa/shared/messaging/events/OrderStatusChangedEvent.java`, add fields after `storeId`:

```java
    private String vatCountryCode;
    private java.math.BigDecimal totalVatAmount;
```

Add getters/setters:
```java
    public String getVatCountryCode() { return vatCountryCode; }
    public void setVatCountryCode(String vatCountryCode) { this.vatCountryCode = vatCountryCode; }

    public java.math.BigDecimal getTotalVatAmount() { return totalVatAmount; }
    public void setTotalVatAmount(java.math.BigDecimal totalVatAmount) { this.totalVatAmount = totalVatAmount; }
```

- [ ] **Step 5: Update OrderEventPublisher to populate VAT fields**

In `commerce-service/src/main/java/com/MaSoVa/commerce/order/service/OrderEventPublisher.java`, find `publishOrderCreated(Order order)` and add after constructing the event:

```java
        if (order.getVatCountryCode() != null) {
            event.setVatCountryCode(order.getVatCountryCode());
            event.setTotalVatAmount(order.getTotalVatAmount());
        }
```

Find `publishOrderStatusChanged(Order order, String previousStatus)` (or equivalent method) and add:
```java
        if (order.getVatCountryCode() != null) {
            event.setVatCountryCode(order.getVatCountryCode());
            event.setTotalVatAmount(order.getTotalVatAmount());
        }
```

- [ ] **Step 6: Run all tests**

```bash
cd shared-models && mvn test -Dtest="OrderCreatedEventVatTest" "-Dmaven.test.skip=false" 2>&1 | tail -20
```
Expected: BUILD SUCCESS.

- [ ] **Step 7: Run full commerce-service build**

```bash
cd commerce-service && mvn compile "-Dmaven.test.skip=true" 2>&1 | tail -20
```
Expected: BUILD SUCCESS — no compilation errors.

- [ ] **Step 8: Commit**

```bash
git add shared-models/src/main/java/com/MaSoVa/shared/messaging/events/OrderCreatedEvent.java \
        shared-models/src/main/java/com/MaSoVa/shared/messaging/events/OrderStatusChangedEvent.java \
        commerce-service/src/main/java/com/MaSoVa/commerce/order/service/OrderEventPublisher.java \
        shared-models/src/test/java/com/MaSoVa/shared/messaging/events/OrderCreatedEventVatTest.java
git commit -m "feat(shared-models): add vatCountryCode and totalVatAmount to order events for Global-2"
```

---

### Task 8: Store management — expose countryCode and vatNumber via core-service

**Files:**
- Modify: `core-service/src/main/java/com/MaSoVa/core/user/controller/StoreController.java`
- Modify: `core-service/src/main/java/com/MaSoVa/core/user/service/StoreService.java`
- Create: `core-service/src/test/java/com/MaSoVa/core/user/service/StoreServiceVatTest.java`

**What this does:** `StoreService.createStore()` and `updateStore()` accept and persist `countryCode`, `vatNumber`, `currency`, `locale`. Core service already persists `Store` document to MongoDB — the fields are already on the entity from Task 3, so this just ensures the service methods don't strip them.

- [ ] **Step 1: Check existing StoreService create/update**

```bash
grep -n "createStore\|updateStore\|save\|countryCode" core-service/src/main/java/com/MaSoVa/core/user/service/StoreService.java | head -20
```

- [ ] **Step 2: Check existing StoreController**

```bash
grep -n "createStore\|updateStore\|POST\|PUT\|PATCH" core-service/src/main/java/com/MaSoVa/core/user/controller/StoreController.java | head -20
```

- [ ] **Step 3: Write failing test**

Create `core-service/src/test/java/com/MaSoVa/core/user/service/StoreServiceVatTest.java`:

```java
package com.MaSoVa.core.user.service;

import com.MaSoVa.core.user.repository.StoreRepository;
import com.MaSoVa.shared.entity.Store;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StoreServiceVatTest {

    @Mock StoreRepository storeRepository;
    private StoreService storeService;

    @BeforeEach
    void setUp() {
        storeService = new StoreService();
        // Inject mock via reflection since StoreService uses @Autowired
        org.springframework.test.util.ReflectionTestUtils.setField(storeService, "storeRepository", storeRepository);
    }

    @Test
    void getStore_returns_store_with_countryCode() {
        Store store = new Store("Berlin Store", "DOM010", null, "4915112345678");
        store.setId("store-de-001");
        store.setCountryCode("DE");
        store.setVatNumber("DE123456789");
        store.setCurrency("EUR");
        store.setLocale("de-DE");

        when(storeRepository.findById("store-de-001")).thenReturn(Optional.of(store));

        Store result = storeService.getStore("store-de-001");

        assertThat(result.getCountryCode()).isEqualTo("DE");
        assertThat(result.getVatNumber()).isEqualTo("DE123456789");
        assertThat(result.getCurrency()).isEqualTo("EUR");
        assertThat(result.getLocale()).isEqualTo("de-DE");
    }

    @Test
    void india_store_without_countryCode_returns_null_countryCode() {
        Store store = new Store("Mumbai Store", "DOM001", null, "9876543210");
        store.setId("store-in-001");
        // countryCode not set — null

        when(storeRepository.findById("store-in-001")).thenReturn(Optional.of(store));

        Store result = storeService.getStore("store-in-001");
        assertThat(result.getCountryCode()).isNull();
    }
}
```

- [ ] **Step 4: Run to confirm it fails**

```bash
cd core-service && mvn test -Dtest="StoreServiceVatTest" "-Dmaven.test.skip=false" 2>&1 | grep -E "ERROR|FAIL|cannot find"
```

If it fails because the test directory doesn't exist:
```bash
mkdir -p core-service/src/test/java/com/MaSoVa/core/user/service
```

- [ ] **Step 5: Verify StoreService.getStore() passes VAT fields through**

If `storeService.getStore()` currently just calls `storeRepository.findById()` and returns the entity (which it does per the code we read), no changes needed — the fields pass through automatically since they're on the `Store` entity.

If the service strips or re-constructs `Store` objects, patch the create/update methods to pass through `countryCode`, `vatNumber`, `currency`, `locale`.

- [ ] **Step 6: Run tests to verify they pass**

```bash
cd core-service && mvn test -Dtest="StoreServiceVatTest" "-Dmaven.test.skip=false" 2>&1 | tail -20
```
Expected: BUILD SUCCESS.

- [ ] **Step 7: Commit**

```bash
git add core-service/src/test/java/com/MaSoVa/core/user/service/StoreServiceVatTest.java
git commit -m "test(core): add StoreService VAT field passthrough tests for Global-2"
```

---

### Task 9: Run full build and verify

**What this does:** Compile all modules, run all tests written in this plan to confirm the full Global-2 implementation compiles and passes.

- [ ] **Step 1: Build shared-models**

```bash
cd shared-models && mvn clean install "-Dmaven.test.skip=false" 2>&1 | tail -30
```
Expected: BUILD SUCCESS, all tests pass.

- [ ] **Step 2: Build commerce-service**

```bash
cd commerce-service && mvn clean compile "-Dmaven.test.skip=true" 2>&1 | tail -20
```
Expected: BUILD SUCCESS — no compilation errors.

- [ ] **Step 3: Run all commerce-service tests**

```bash
cd commerce-service && mvn test "-Dmaven.test.skip=false" 2>&1 | tail -40
```
Expected: BUILD SUCCESS — all test classes pass. (Note: tests that require a live MongoDB/PostgreSQL/Redis will be skipped or fail if infrastructure is not running — that is acceptable at this stage.)

- [ ] **Step 4: Build core-service**

```bash
cd core-service && mvn clean compile "-Dmaven.test.skip=true" 2>&1 | tail -20
```
Expected: BUILD SUCCESS.

- [ ] **Step 5: Final commit if anything was missed**

```bash
git status
# Stage any unstaged files from this task
git add -p  # review and stage any missed files
git commit -m "chore(global-2): final build verification — all modules compile"
```

---

## File Change Summary

| File | Action | Purpose |
|---|---|---|
| `shared-models/.../VatLineItem.java` | Create | Per-line VAT value object |
| `shared-models/.../VatBreakdown.java` | Create | Order-level VAT breakdown |
| `shared-models/.../Store.java` | Modify | Add countryCode, vatNumber, currency, locale |
| `shared-models/.../OrderCreatedEvent.java` | Modify | Add vatCountryCode, totalVatAmount |
| `shared-models/.../OrderStatusChangedEvent.java` | Modify | Add vatCountryCode, totalVatAmount |
| `commerce-service/.../EuVatConfiguration.java` | Create | YAML-backed VAT rate lookup for 12 countries |
| `commerce-service/.../EuVatEngine.java` | Create | Calculates per-line VAT breakdown |
| `commerce-service/.../Order.java` | Modify | Add vatCountryCode, vatBreakdown, net/vat/gross totals |
| `commerce-service/.../OrderJpaEntity.java` | Modify | Add VAT columns (mapped to V4 migration) |
| `commerce-service/.../OrderService.java` | Modify | Route to EuVatEngine vs TaxConfiguration |
| `commerce-service/.../OrderItemSyncService.java` | Modify | Map VAT fields in dual-write to PostgreSQL |
| `commerce-service/.../OrderEventPublisher.java` | Modify | Set VAT fields on published events |
| `commerce-service/.../OrderItem.java` | Modify | Add category field for VAT routing |
| `commerce-service/.../CreateOrderRequest.java` | Modify | Add category to OrderItemRequest |
| `commerce-service/db/migration/V4__order_vat_columns.sql` | Create | Add VAT columns to PostgreSQL orders table |
| `commerce-service/application.yml` | Modify | Add eu-vat rates block for all 12 countries |

## Test Summary

| Test file | Tests | Covers |
|---|---|---|
| `TaxConfigurationTest` | 8 | Existing India GST behaviour documented |
| `OrderServiceCreateOrderTest` | 6 | Existing createOrder() safety floor |
| `EuVatConfigurationTest` | 8 | Rate lookup logic for DE, FR, fallback |
| `VatBreakdownTest` | 2 | Value object correctness |
| `StoreVatFieldsTest` | 6 | New Store fields |
| `OrderVatFieldsTest` | 7 | New Order fields |
| `EuVatEngineTest` | 5 | VAT calculation math, context routing, fallback |
| `OrderServiceEuVatTest` | 4 | EU routing vs India GST fallback in createOrder() |
| `OrderCreatedEventVatTest` | 3 | Event field presence and null safety |
| `StoreServiceVatTest` | 2 | Store passthrough |
| **Total** | **51** | |
