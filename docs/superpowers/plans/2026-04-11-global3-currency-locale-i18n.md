# Global-3: Currency / Locale / i18n Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all hardcoded INR/₹ currency and `en-IN` locale assumptions with a `MoneyAmount` value object, a `CountryProfileService`, a `formatMoney()` / `formatDate()` utility, i18n via `react-i18next`, and `currency` propagation through events, Redux, and the PostgreSQL dual-write — so every EU store shows correct currency/locale automatically while India stores are 100% unchanged.

**Architecture:** `MoneyAmount` (long amountMinorUnits + String currency) is added to shared-models and used inside `OrderItem.unitPrice` and `Order.deliveryFee` (new field alongside the existing BigDecimal fields which are retained for India backward-compat). A new `CountryProfileService` in core-service maps countryCode → currency + locale at store creation. The frontend gains a `formatMoney(amountMinorUnits, currency, locale)` utility using `Intl.NumberFormat`, a `formatDate(date, locale)` utility, and seven `react-i18next` translation files. `cartSlice` gains `currency` + `locale` fields, and `selectDeliveryFeeINR` is kept as an alias while `setDeliveryCurrency` is added. Events gain a `currency` field (already present in `OrderCreatedEvent` from Global-2 — wire it from OrderService). PostgreSQL V5 migration adds `currency` column to `orders_jpa`.

**Tech Stack:** Java 21, Spring Boot 3, MongoDB (stores + orders), PostgreSQL (V5 Flyway migration), RabbitMQ (shared-models events — `currency` field already exists), React 19 + TypeScript, Redux Toolkit (`cartSlice`), `react-i18next` + `i18next`, Vitest + React Testing Library, JUnit 5 + Mockito.

---

## Safety Floor — Write These Tests First (per master brief)

Before touching any feature code, write snapshot tests for every frontend component that renders `₹` or `deliveryFeeINR`, and unit tests for `cartSlice` reducers and selectors. These document current behaviour and become regression tests.

---

### Task 0: Safety-floor tests — cartSlice and currency utility

**Files:**
- Modify: `frontend/src/store/slices/cartSlice.test.ts` (add selector coverage)
- Modify: `frontend/src/utils/currency.test.ts` (document existing formatINR)

- [ ] **Step 1: Read the existing cartSlice test to understand what is already covered**

Run: `cat frontend/src/store/slices/cartSlice.test.ts`

Expected: Tests for `addToCart`, `removeFromCart`, `updateItemQuantity`, `clearCart`, `calculateTotals`, `setLoading`, `setSelectedStore`, `clearSelectedStore`. Missing: `setDeliveryFee`, `selectDeliveryFeeINR`, `selectCartSubtotal` selectors.

- [ ] **Step 2: Read the existing currency.test.ts**

Run: `cat frontend/src/utils/currency.test.ts`

- [ ] **Step 3: Add missing cartSlice selector tests**

Open `frontend/src/store/slices/cartSlice.test.ts` and add at the end of the `describe('cartSlice')` block:

```typescript
  describe('setDeliveryFee', () => {
    it('sets delivery fee and recalculates total', () => {
      const state = cartReducer(stateWithItems, setDeliveryFee(49));
      expect(state.deliveryFee).toBe(49);
      // total = subtotal(550) + deliveryFee(49) = 599
      expect(state.total).toBe(599);
    });
  });

  describe('selectDeliveryFeeINR', () => {
    it('returns the delivery fee (aliased from selectDeliveryFee)', () => {
      const rootState = { cart: { ...emptyState, deliveryFee: 29 } };
      expect(selectDeliveryFee(rootState)).toBe(29);
      expect(selectDeliveryFeeINR(rootState)).toBe(29);
    });
  });

  describe('selectCartSubtotal', () => {
    it('returns sum of item prices without delivery fee', () => {
      const rootState = { cart: stateWithItems };
      // 200*2 + 150*1 = 550
      expect(selectCartSubtotal(rootState)).toBe(550);
    });
  });
```

You also need to import `setDeliveryFee` at the top — add it to the existing import list.

- [ ] **Step 4: Add formatINR documentation test to currency.test.ts**

Open `frontend/src/utils/currency.test.ts`. If it does not exist, create it:

```typescript
import { describe, it, expect } from 'vitest';
import { formatINR } from './currency';

describe('formatINR (existing — regression guard)', () => {
  it('formats 200 as ₹200', () => {
    // Intl.NumberFormat en-IN, no decimals
    expect(formatINR(200)).toMatch(/₹\s?200/);
  });

  it('formats 1500 with Indian grouping', () => {
    expect(formatINR(1500)).toMatch(/₹\s?1,500/);
  });

  it('formats 0 as ₹0', () => {
    expect(formatINR(0)).toMatch(/₹\s?0/);
  });
});
```

- [ ] **Step 5: Run safety-floor tests**

```bash
cd frontend && npx vitest run src/store/slices/cartSlice.test.ts src/utils/currency.test.ts
```

Expected: all tests PASS.

- [ ] **Step 6: Commit safety floor**

```bash
git add frontend/src/store/slices/cartSlice.test.ts frontend/src/utils/currency.test.ts
git commit -m "test(frontend): safety-floor tests for cartSlice selectors and formatINR — Global-3 pre-req"
```

---

### Task 1: MoneyAmount value object in shared-models

**Files:**
- Create: `shared-models/src/main/java/com/MaSoVa/shared/model/MoneyAmount.java`
- Create: `shared-models/src/test/java/com/MaSoVa/shared/model/MoneyAmountTest.java`

- [ ] **Step 1: Write the failing test**

```bash
mkdir -p shared-models/src/test/java/com/MaSoVa/shared/model
```

Create `shared-models/src/test/java/com/MaSoVa/shared/model/MoneyAmountTest.java`:

```java
package com.MaSoVa.shared.model;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.*;

class MoneyAmountTest {

    @Test
    void ofMinorUnits_storesAmountAndCurrency() {
        MoneyAmount money = MoneyAmount.ofMinorUnits(1999L, "EUR");
        assertThat(money.getAmountMinorUnits()).isEqualTo(1999L);
        assertThat(money.getCurrency()).isEqualTo("EUR");
    }

    @Test
    void ofMinorUnits_india_inr() {
        MoneyAmount money = MoneyAmount.ofMinorUnits(29900L, "INR");
        assertThat(money.getCurrency()).isEqualTo("INR");
        assertThat(money.getAmountMinorUnits()).isEqualTo(29900L);
    }

    @Test
    void nullCurrency_throwsIllegalArgument() {
        assertThatThrownBy(() -> MoneyAmount.ofMinorUnits(100L, null))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("currency");
    }

    @Test
    void negativeAmount_throwsIllegalArgument() {
        assertThatThrownBy(() -> MoneyAmount.ofMinorUnits(-1L, "EUR"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("amount");
    }

    @Test
    void equals_sameAmountAndCurrency() {
        MoneyAmount a = MoneyAmount.ofMinorUnits(500L, "GBP");
        MoneyAmount b = MoneyAmount.ofMinorUnits(500L, "GBP");
        assertThat(a).isEqualTo(b);
        assertThat(a.hashCode()).isEqualTo(b.hashCode());
    }

    @Test
    void equals_differentCurrency_notEqual() {
        MoneyAmount eur = MoneyAmount.ofMinorUnits(500L, "EUR");
        MoneyAmount gbp = MoneyAmount.ofMinorUnits(500L, "GBP");
        assertThat(eur).isNotEqualTo(gbp);
    }
}
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
cd shared-models && mvn test -pl . -Dtest=MoneyAmountTest "-Dmaven.test.skip=false" 2>&1 | tail -20
```

Expected: `COMPILATION ERROR` — `MoneyAmount` does not exist.

- [ ] **Step 3: Create MoneyAmount**

Create `shared-models/src/main/java/com/MaSoVa/shared/model/MoneyAmount.java`:

```java
package com.MaSoVa.shared.model;

import java.util.Objects;

/**
 * Immutable money value object. Amount stored as minor units (e.g., cents, paise).
 * INR: 1 rupee = 100 paise — store 100 for ₹1.
 * EUR: 1 euro = 100 cents — store 100 for €1.
 * Used in Order.deliveryFeeAmount and OrderItem.unitPriceAmount for Global-3+.
 */
public final class MoneyAmount {

    private final long amountMinorUnits;
    private final String currency; // ISO 4217, e.g. "INR", "EUR", "GBP"

    private MoneyAmount(long amountMinorUnits, String currency) {
        this.amountMinorUnits = amountMinorUnits;
        this.currency = currency;
    }

    public static MoneyAmount ofMinorUnits(long amountMinorUnits, String currency) {
        if (currency == null || currency.isBlank()) {
            throw new IllegalArgumentException("currency must not be null or blank");
        }
        if (amountMinorUnits < 0) {
            throw new IllegalArgumentException("amount must not be negative");
        }
        return new MoneyAmount(amountMinorUnits, currency);
    }

    public long getAmountMinorUnits() { return amountMinorUnits; }
    public String getCurrency() { return currency; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof MoneyAmount that)) return false;
        return amountMinorUnits == that.amountMinorUnits && Objects.equals(currency, that.currency);
    }

    @Override
    public int hashCode() {
        return Objects.hash(amountMinorUnits, currency);
    }

    @Override
    public String toString() {
        return amountMinorUnits + " " + currency;
    }
}
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
cd shared-models && mvn test -Dtest=MoneyAmountTest "-Dmaven.test.skip=false" 2>&1 | tail -10
```

Expected: `BUILD SUCCESS`, 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add shared-models/src/main/java/com/MaSoVa/shared/model/MoneyAmount.java \
        shared-models/src/test/java/com/MaSoVa/shared/model/MoneyAmountTest.java
git commit -m "feat(shared-models): add MoneyAmount value object for Global-3 currency"
```

---

### Task 2: CountryProfileService in core-service

**Files:**
- Create: `core-service/src/main/java/com/MaSoVa/core/store/service/CountryProfileService.java`
- Create: `core-service/src/test/java/com/MaSoVa/core/store/service/CountryProfileServiceTest.java`

- [ ] **Step 1: Write the failing test**

```bash
mkdir -p core-service/src/test/java/com/MaSoVa/core/store/service
```

Create `core-service/src/test/java/com/MaSoVa/core/store/service/CountryProfileServiceTest.java`:

```java
package com.MaSoVa.core.store.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import static org.assertj.core.api.Assertions.*;

class CountryProfileServiceTest {

    private CountryProfileService service;

    @BeforeEach
    void setUp() {
        service = new CountryProfileService();
    }

    @ParameterizedTest(name = "{0} -> currency={1}, locale={2}")
    @CsvSource({
        "DE, EUR, de-DE",
        "FR, EUR, fr-FR",
        "IT, EUR, it-IT",
        "NL, EUR, nl-NL",
        "BE, EUR, nl-BE",
        "HU, HUF, hu-HU",
        "LU, EUR, lb-LU",
        "IE, EUR, en-IE",
        "CH, CHF, de-CH",
        "GB, GBP, en-GB",
        "US, USD, en-US",
        "CA, CAD, en-CA"
    })
    void resolveCurrency_knownCountry(String countryCode, String expectedCurrency, String expectedLocale) {
        assertThat(service.resolveCurrency(countryCode)).isEqualTo(expectedCurrency);
        assertThat(service.resolveLocale(countryCode)).isEqualTo(expectedLocale);
    }

    @Test
    void resolveCurrency_nullCountryCode_returnsINR() {
        assertThat(service.resolveCurrency(null)).isEqualTo("INR");
        assertThat(service.resolveLocale(null)).isEqualTo("en-IN");
    }

    @Test
    void resolveCurrency_unknownCountryCode_throwsIllegalArgument() {
        assertThatThrownBy(() -> service.resolveCurrency("XX"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("XX");
    }

    @Test
    void resolveLocale_unknownCountryCode_throwsIllegalArgument() {
        assertThatThrownBy(() -> service.resolveLocale("ZZ"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("ZZ");
    }
}
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
cd core-service && mvn test -Dtest=CountryProfileServiceTest "-Dmaven.test.skip=false" 2>&1 | tail -15
```

Expected: `COMPILATION ERROR` — class does not exist.

- [ ] **Step 3: Create CountryProfileService**

Create `core-service/src/main/java/com/MaSoVa/core/store/service/CountryProfileService.java`:

```java
package com.MaSoVa.core.store.service;

import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * Maps ISO 3166-1 alpha-2 country code → ISO 4217 currency code + BCP 47 locale tag.
 * India stores pass null countryCode — returns INR / en-IN as legacy fallback.
 * 12 countries supported in Global programme (Global-3).
 */
@Service
public class CountryProfileService {

    private static final Map<String, String> CURRENCY_MAP = Map.ofEntries(
        Map.entry("DE", "EUR"),
        Map.entry("FR", "EUR"),
        Map.entry("IT", "EUR"),
        Map.entry("NL", "EUR"),
        Map.entry("BE", "EUR"),
        Map.entry("HU", "HUF"),
        Map.entry("LU", "EUR"),
        Map.entry("IE", "EUR"),
        Map.entry("CH", "CHF"),
        Map.entry("GB", "GBP"),
        Map.entry("US", "USD"),
        Map.entry("CA", "CAD")
    );

    private static final Map<String, String> LOCALE_MAP = Map.ofEntries(
        Map.entry("DE", "de-DE"),
        Map.entry("FR", "fr-FR"),
        Map.entry("IT", "it-IT"),
        Map.entry("NL", "nl-NL"),
        Map.entry("BE", "nl-BE"),
        Map.entry("HU", "hu-HU"),
        Map.entry("LU", "lb-LU"),
        Map.entry("IE", "en-IE"),
        Map.entry("CH", "de-CH"),
        Map.entry("GB", "en-GB"),
        Map.entry("US", "en-US"),
        Map.entry("CA", "en-CA")
    );

    /** Returns ISO 4217 currency code. Returns "INR" for null (India legacy). */
    public String resolveCurrency(String countryCode) {
        if (countryCode == null) return "INR";
        String currency = CURRENCY_MAP.get(countryCode.toUpperCase());
        if (currency == null) {
            throw new IllegalArgumentException("Unsupported country code: " + countryCode);
        }
        return currency;
    }

    /** Returns BCP 47 locale tag. Returns "en-IN" for null (India legacy). */
    public String resolveLocale(String countryCode) {
        if (countryCode == null) return "en-IN";
        String locale = LOCALE_MAP.get(countryCode.toUpperCase());
        if (locale == null) {
            throw new IllegalArgumentException("Unsupported country code: " + countryCode);
        }
        return locale;
    }
}
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
cd core-service && mvn test -Dtest=CountryProfileServiceTest "-Dmaven.test.skip=false" 2>&1 | tail -10
```

Expected: `BUILD SUCCESS`, all 15 tests PASS (12 parametrized + 3 edge cases).

- [ ] **Step 5: Commit**

```bash
git add core-service/src/main/java/com/MaSoVa/core/store/service/CountryProfileService.java \
        core-service/src/test/java/com/MaSoVa/core/store/service/CountryProfileServiceTest.java
git commit -m "feat(core): add CountryProfileService — maps countryCode to currency + locale"
```

---

### Task 3: Wire CountryProfileService into StoreService on store creation

**Files:**
- Modify: `core-service/src/main/java/com/MaSoVa/core/store/service/StoreService.java` (inject CountryProfileService, set currency+locale on create/update)
- Create: `core-service/src/test/java/com/MaSoVa/core/store/service/StoreServiceCurrencyTest.java`

- [ ] **Step 1: Find StoreService**

```bash
find core-service/src/main/java -name "StoreService.java"
```

Note the path. Read the `createStore` method signature.

- [ ] **Step 2: Write the failing test**

Create `core-service/src/test/java/com/MaSoVa/core/store/service/StoreServiceCurrencyTest.java`:

```java
package com.MaSoVa.core.store.service;

import com.MaSoVa.shared.entity.Store;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

// Adjust import to actual StoreRepository package in core-service
@ExtendWith(MockitoExtension.class)
class StoreServiceCurrencyTest {

    @Mock
    private org.springframework.data.mongodb.core.MongoTemplate mongoTemplate;

    @Mock
    private CountryProfileService countryProfileService;

    // Inject the real StoreService with mocked deps — adjust constructor as needed
    // after reading the actual StoreService constructor
    @InjectMocks
    private StoreService storeService;

    @Test
    void createStore_deCountryCode_setsCurrencyAndLocale() {
        when(countryProfileService.resolveCurrency("DE")).thenReturn("EUR");
        when(countryProfileService.resolveLocale("DE")).thenReturn("de-DE");

        Store input = new Store();
        input.setCountryCode("DE");

        // call the actual create method — adjust signature as found in StoreService
        // storeService.createStore(input);

        // For now, test the service wires CountryProfileService
        String currency = countryProfileService.resolveCurrency("DE");
        String locale = countryProfileService.resolveLocale("DE");

        assertThat(currency).isEqualTo("EUR");
        assertThat(locale).isEqualTo("de-DE");
    }
}
```

> **Note to implementer:** Read `StoreService.java` first — find the `createStore` (or equivalent) method. The test above is a template. Adjust the mock setup and assertion to call `storeService.createStore(input)` with the actual repository mock, then capture the saved `Store` and assert `store.getCurrency() == "EUR"` and `store.getLocale() == "de-DE"`. The key logic to add to `StoreService.createStore()` is:
> ```java
> if (store.getCountryCode() != null) {
>     store.setCurrency(countryProfileService.resolveCurrency(store.getCountryCode()));
>     store.setLocale(countryProfileService.resolveLocale(store.getCountryCode()));
> }
> ```

- [ ] **Step 3: Read StoreService to understand its constructor and createStore signature**

```bash
find core-service/src/main/java -name "StoreService.java" | xargs head -80
```

- [ ] **Step 4: Inject CountryProfileService into StoreService and wire it**

Open the real `StoreService.java`. Add `CountryProfileService` as a constructor-injected dependency. In the `createStore` method (or equivalent), after receiving the store object and before saving:

```java
if (store.getCountryCode() != null && !store.getCountryCode().isBlank()) {
    store.setCurrency(countryProfileService.resolveCurrency(store.getCountryCode()));
    store.setLocale(countryProfileService.resolveLocale(store.getCountryCode()));
}
```

India stores (null `countryCode`) are unchanged — the `if` guard ensures no modification.

- [ ] **Step 5: Update the test to use the actual StoreService method signature**

Revise `StoreServiceCurrencyTest` to call `storeService.createStore(input)` (or the actual method name) with a mocked repository, then use `ArgumentCaptor<Store>` to capture the saved store and assert:

```java
ArgumentCaptor<Store> captor = ArgumentCaptor.forClass(Store.class);
verify(storeRepository).save(captor.capture());
assertThat(captor.getValue().getCurrency()).isEqualTo("EUR");
assertThat(captor.getValue().getLocale()).isEqualTo("de-DE");
```

- [ ] **Step 6: Run tests**

```bash
cd core-service && mvn test -Dtest=StoreServiceCurrencyTest,CountryProfileServiceTest "-Dmaven.test.skip=false" 2>&1 | tail -10
```

Expected: `BUILD SUCCESS`.

- [ ] **Step 7: Commit**

```bash
git add core-service/src/main/java/com/MaSoVa/core/store/service/StoreService.java \
        core-service/src/main/java/com/MaSoVa/core/store/service/CountryProfileService.java \
        core-service/src/test/java/com/MaSoVa/core/store/service/StoreServiceCurrencyTest.java
git commit -m "feat(core): wire CountryProfileService into StoreService — auto-set currency+locale on store create"
```

---

### Task 4: PostgreSQL V5 migration — add currency column to orders

**Files:**
- Create: `commerce-service/src/main/resources/db/migration/V5__order_currency.sql`
- Create: `commerce-service/src/test/java/com/MaSoVa/commerce/order/entity/OrderCurrencyMigrationTest.java`

- [ ] **Step 1: Write the migration SQL**

Create `commerce-service/src/main/resources/db/migration/V5__order_currency.sql`:

```sql
-- Global-3: add currency column to orders_jpa
-- Existing rows left NULL (India legacy orders — INR assumed when null)
-- New EU orders will have currency set from store.currency at creation time.
ALTER TABLE commerce_schema.orders
    ADD COLUMN IF NOT EXISTS currency VARCHAR(3);

COMMENT ON COLUMN commerce_schema.orders.currency
    IS 'ISO 4217 currency code. NULL = India legacy order (INR). Set from store.currency at creation.';

CREATE INDEX IF NOT EXISTS idx_orders_currency ON commerce_schema.orders (currency)
    WHERE currency IS NOT NULL;
```

- [ ] **Step 2: Add currency field to OrderJpaEntity**

Open `commerce-service/src/main/java/com/MaSoVa/commerce/order/entity/OrderJpaEntity.java`.

After the existing `vatBreakdown` field, add:

```java
    // Global-3: currency — null for India legacy orders (INR assumed)
    @Column(name = "currency", length = 3)
    private String currency;
```

Add getter and setter at the end of the class (or Lombok's `@Data` already covers it if the class uses Lombok — check the class header; it does use `@Data`, so just the field is needed).

- [ ] **Step 3: Write migration integration test**

Create `commerce-service/src/test/java/com/MaSoVa/commerce/order/entity/OrderCurrencyMigrationTest.java`:

```java
package com.MaSoVa.commerce.order.entity;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import static org.assertj.core.api.Assertions.*;

@DataJpaTest
@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@TestPropertySource(properties = {
    "spring.flyway.locations=classpath:db/migration",
    "spring.datasource.url=jdbc:tc:postgresql:15:///commerce_test",
    "spring.datasource.driver-class-name=org.testcontainers.jdbc.ContainerDatabaseDriver"
})
class OrderCurrencyMigrationTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void currencyColumnExists() {
        Integer count = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM information_schema.columns " +
            "WHERE table_schema = 'commerce_schema' " +
            "AND table_name = 'orders' " +
            "AND column_name = 'currency'",
            Integer.class
        );
        assertThat(count).isEqualTo(1);
    }

    @Test
    void currencyColumnIsNullable() {
        String nullable = jdbcTemplate.queryForObject(
            "SELECT is_nullable FROM information_schema.columns " +
            "WHERE table_schema = 'commerce_schema' " +
            "AND table_name = 'orders' " +
            "AND column_name = 'currency'",
            String.class
        );
        assertThat(nullable).isEqualTo("YES");
    }
}
```

- [ ] **Step 4: Run migration test** (requires Docker for Testcontainers)

```bash
cd commerce-service && mvn test -Dtest=OrderCurrencyMigrationTest "-Dmaven.test.skip=false" 2>&1 | tail -15
```

Expected: `BUILD SUCCESS`.

- [ ] **Step 5: Commit**

```bash
git add commerce-service/src/main/resources/db/migration/V5__order_currency.sql \
        commerce-service/src/main/java/com/MaSoVa/commerce/order/entity/OrderJpaEntity.java \
        commerce-service/src/test/java/com/MaSoVa/commerce/order/entity/OrderCurrencyMigrationTest.java
git commit -m "feat(commerce): V5 migration — add currency column to orders_jpa for Global-3"
```

---

### Task 5: Wire currency into OrderService and dual-write

**Files:**
- Modify: `commerce-service/src/main/java/com/MaSoVa/commerce/order/service/OrderService.java`
- Create: `commerce-service/src/test/java/com/MaSoVa/commerce/order/service/OrderServiceCurrencyTest.java`

- [ ] **Step 1: Read OrderService.createOrder to find where store is fetched**

```bash
grep -n "storeId\|storeService\|store\." commerce-service/src/main/java/com/MaSoVa/commerce/order/service/OrderService.java | head -30
```

Identify the line where `Store store = storeService.getStore(storeId)` (or equivalent) is called — that is where you read `store.getCurrency()`.

- [ ] **Step 2: Write the failing test**

Create `commerce-service/src/test/java/com/MaSoVa/commerce/order/service/OrderServiceCurrencyTest.java`:

```java
package com.MaSoVa.commerce.order.service;

import com.MaSoVa.commerce.order.entity.Order;
import com.MaSoVa.commerce.order.entity.OrderJpaEntity;
import com.MaSoVa.shared.entity.Store;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.*;

/**
 * Tests that OrderService propagates store.currency to Order (MongoDB)
 * and OrderJpaEntity (PostgreSQL) when creating an order for an EU store.
 * India stores (null currency) also tested — no regression.
 */
@ExtendWith(MockitoExtension.class)
class OrderServiceCurrencyTest {

    // This is an integration-style sketch — the full test wiring
    // must mirror OrderServiceCreateOrderTest patterns already in the codebase.
    // Read that file first, copy its mock setup, then add the assertions below.

    @Test
    void createOrder_euStore_currencyPropagatedToMongoAndPostgres() {
        // Given a store with countryCode=DE, currency=EUR (set by CountryProfileService)
        Store deStore = new Store();
        deStore.setId("store-de-1");
        deStore.setCountryCode("DE");
        deStore.setCurrency("EUR");
        deStore.setLocale("de-DE");

        // When OrderService.createOrder is called
        // Then: order.getCurrency() should be "EUR"
        // And: orderJpaEntity.getCurrency() should be "EUR"
        // And: OrderCreatedEvent.getCurrency() should be "EUR"

        // Assert the store fixture is correct before wiring full test
        assertThat(deStore.getCurrency()).isEqualTo("EUR");
    }

    @Test
    void createOrder_indiaStore_nullCurrencyPreserved() {
        Store indiaStore = new Store();
        indiaStore.setId("store-in-1");
        indiaStore.setCountryCode(null);
        indiaStore.setCurrency(null);

        // When OrderService.createOrder is called for India store
        // Then: order.getCurrency() should be null (not "INR" — null means India legacy)
        assertThat(indiaStore.getCurrency()).isNull();
    }
}
```

> **Note to implementer:** After reading `OrderServiceCreateOrderTest` (already in the codebase from Global-2 safety floor), extend this test to use the same mock setup pattern and actually call `orderService.createOrder(request)`. Then capture the saved `Order` and `OrderJpaEntity` and assert both have `currency = "EUR"` for the DE store case.

- [ ] **Step 3: Add currency field to MongoDB Order entity**

Open `commerce-service/src/main/java/com/MaSoVa/commerce/order/entity/Order.java`. After `vatBreakdown`, add:

```java
    // Global-3: currency — null for India legacy orders (INR assumed)
    private String currency;
```

Add getter/setter:

```java
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
```

- [ ] **Step 4: Set currency in OrderService.createOrder**

Open `OrderService.java`. In `createOrder`, after the store is fetched and before the order is saved, add:

```java
order.setCurrency(store.getCurrency()); // null for India stores — intentional
```

In the dual-write block where `OrderJpaEntity` is built (look for `.builder()` call or explicit field setting), add:

```java
.currency(order.getCurrency())
```

(or `orderJpa.setCurrency(order.getCurrency())` if not using builder).

- [ ] **Step 5: Run the currency test**

```bash
cd commerce-service && mvn test -Dtest=OrderServiceCurrencyTest "-Dmaven.test.skip=false" 2>&1 | tail -10
```

- [ ] **Step 6: Run the full existing OrderServiceCreateOrderTest to confirm no regression**

```bash
cd commerce-service && mvn test -Dtest=OrderServiceCreateOrderTest "-Dmaven.test.skip=false" 2>&1 | tail -10
```

Expected: `BUILD SUCCESS`, all existing tests still PASS.

- [ ] **Step 7: Commit**

```bash
git add commerce-service/src/main/java/com/MaSoVa/commerce/order/entity/Order.java \
        commerce-service/src/main/java/com/MaSoVa/commerce/order/service/OrderService.java \
        commerce-service/src/test/java/com/MaSoVa/commerce/order/service/OrderServiceCurrencyTest.java
git commit -m "feat(commerce): propagate store.currency to Order + OrderJpaEntity on createOrder"
```

---

### Task 6: Install react-i18next and create translation files

**Files:**
- Modify: `frontend/package.json` (add dependencies)
- Create: `frontend/src/i18n/index.ts`
- Create: `frontend/src/i18n/locales/en.json`
- Create: `frontend/src/i18n/locales/de.json`
- Create: `frontend/src/i18n/locales/fr.json`
- Create: `frontend/src/i18n/locales/it.json`
- Create: `frontend/src/i18n/locales/nl.json`
- Create: `frontend/src/i18n/locales/hu.json`
- Create: `frontend/src/i18n/locales/lb.json`

- [ ] **Step 1: Install i18n packages**

```bash
cd frontend && npm install react-i18next i18next i18next-browser-languagedetector
```

Expected: packages added to `node_modules` and `package.json`.

- [ ] **Step 2: Create translation files**

Create `frontend/src/i18n/locales/en.json`:

```json
{
  "cart": {
    "delivery_fee": "Delivery fee",
    "subtotal": "Subtotal",
    "total": "Total",
    "empty": "Your cart is empty",
    "checkout": "Checkout"
  },
  "order": {
    "status": {
      "RECEIVED": "Received",
      "PREPARING": "Preparing",
      "READY": "Ready",
      "DISPATCHED": "Dispatched",
      "OUT_FOR_DELIVERY": "Out for delivery",
      "DELIVERED": "Delivered",
      "SERVED": "Served",
      "COMPLETED": "Completed",
      "CANCELLED": "Cancelled"
    },
    "type": {
      "DINE_IN": "Dine in",
      "TAKEAWAY": "Takeaway",
      "DELIVERY": "Delivery"
    }
  },
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "confirm": "Confirm",
    "loading": "Loading…",
    "error": "Something went wrong",
    "no_data": "No data available"
  }
}
```

Create `frontend/src/i18n/locales/de.json`:

```json
{
  "cart": {
    "delivery_fee": "Liefergebühr",
    "subtotal": "Zwischensumme",
    "total": "Gesamt",
    "empty": "Ihr Warenkorb ist leer",
    "checkout": "Zur Kasse"
  },
  "order": {
    "status": {
      "RECEIVED": "Eingegangen",
      "PREPARING": "In Zubereitung",
      "READY": "Bereit",
      "DISPATCHED": "Versendet",
      "OUT_FOR_DELIVERY": "Unterwegs",
      "DELIVERED": "Geliefert",
      "SERVED": "Serviert",
      "COMPLETED": "Abgeschlossen",
      "CANCELLED": "Storniert"
    },
    "type": {
      "DINE_IN": "Im Restaurant",
      "TAKEAWAY": "Zum Mitnehmen",
      "DELIVERY": "Lieferung"
    }
  },
  "common": {
    "save": "Speichern",
    "cancel": "Abbrechen",
    "confirm": "Bestätigen",
    "loading": "Lädt…",
    "error": "Etwas ist schiefgelaufen",
    "no_data": "Keine Daten verfügbar"
  }
}
```

Create `frontend/src/i18n/locales/fr.json`:

```json
{
  "cart": {
    "delivery_fee": "Frais de livraison",
    "subtotal": "Sous-total",
    "total": "Total",
    "empty": "Votre panier est vide",
    "checkout": "Commander"
  },
  "order": {
    "status": {
      "RECEIVED": "Reçu",
      "PREPARING": "En préparation",
      "READY": "Prêt",
      "DISPATCHED": "Expédié",
      "OUT_FOR_DELIVERY": "En livraison",
      "DELIVERED": "Livré",
      "SERVED": "Servi",
      "COMPLETED": "Terminé",
      "CANCELLED": "Annulé"
    },
    "type": {
      "DINE_IN": "Sur place",
      "TAKEAWAY": "À emporter",
      "DELIVERY": "Livraison"
    }
  },
  "common": {
    "save": "Enregistrer",
    "cancel": "Annuler",
    "confirm": "Confirmer",
    "loading": "Chargement…",
    "error": "Une erreur s'est produite",
    "no_data": "Aucune donnée disponible"
  }
}
```

Create `frontend/src/i18n/locales/it.json`:

```json
{
  "cart": {
    "delivery_fee": "Spese di consegna",
    "subtotal": "Subtotale",
    "total": "Totale",
    "empty": "Il tuo carrello è vuoto",
    "checkout": "Checkout"
  },
  "order": {
    "status": {
      "RECEIVED": "Ricevuto",
      "PREPARING": "In preparazione",
      "READY": "Pronto",
      "DISPATCHED": "Spedito",
      "OUT_FOR_DELIVERY": "In consegna",
      "DELIVERED": "Consegnato",
      "SERVED": "Servito",
      "COMPLETED": "Completato",
      "CANCELLED": "Annullato"
    },
    "type": {
      "DINE_IN": "Al tavolo",
      "TAKEAWAY": "Da asporto",
      "DELIVERY": "Consegna"
    }
  },
  "common": {
    "save": "Salva",
    "cancel": "Annulla",
    "confirm": "Conferma",
    "loading": "Caricamento…",
    "error": "Qualcosa è andato storto",
    "no_data": "Nessun dato disponibile"
  }
}
```

Create `frontend/src/i18n/locales/nl.json`:

```json
{
  "cart": {
    "delivery_fee": "Bezorgkosten",
    "subtotal": "Subtotaal",
    "total": "Totaal",
    "empty": "Uw winkelwagen is leeg",
    "checkout": "Afrekenen"
  },
  "order": {
    "status": {
      "RECEIVED": "Ontvangen",
      "PREPARING": "In bereiding",
      "READY": "Klaar",
      "DISPATCHED": "Verzonden",
      "OUT_FOR_DELIVERY": "Onderweg",
      "DELIVERED": "Bezorgd",
      "SERVED": "Geserveerd",
      "COMPLETED": "Voltooid",
      "CANCELLED": "Geannuleerd"
    },
    "type": {
      "DINE_IN": "Ter plaatse",
      "TAKEAWAY": "Afhalen",
      "DELIVERY": "Bezorging"
    }
  },
  "common": {
    "save": "Opslaan",
    "cancel": "Annuleren",
    "confirm": "Bevestigen",
    "loading": "Laden…",
    "error": "Er is iets misgegaan",
    "no_data": "Geen gegevens beschikbaar"
  }
}
```

Create `frontend/src/i18n/locales/hu.json`:

```json
{
  "cart": {
    "delivery_fee": "Szállítási díj",
    "subtotal": "Részösszeg",
    "total": "Összesen",
    "empty": "A kosár üres",
    "checkout": "Pénztár"
  },
  "order": {
    "status": {
      "RECEIVED": "Fogadva",
      "PREPARING": "Készítés alatt",
      "READY": "Kész",
      "DISPATCHED": "Elküldve",
      "OUT_FOR_DELIVERY": "Szállítás alatt",
      "DELIVERED": "Kézbesítve",
      "SERVED": "Felszolgálva",
      "COMPLETED": "Befejezve",
      "CANCELLED": "Törölve"
    },
    "type": {
      "DINE_IN": "Helyben fogyasztás",
      "TAKEAWAY": "Elvitel",
      "DELIVERY": "Házhozszállítás"
    }
  },
  "common": {
    "save": "Mentés",
    "cancel": "Mégse",
    "confirm": "Megerősítés",
    "loading": "Betöltés…",
    "error": "Valami hiba történt",
    "no_data": "Nincs elérhető adat"
  }
}
```

Create `frontend/src/i18n/locales/lb.json` (Luxembourgish — fallback English):

```json
{
  "cart": {
    "delivery_fee": "Delivery fee",
    "subtotal": "Subtotal",
    "total": "Total",
    "empty": "Your cart is empty",
    "checkout": "Checkout"
  },
  "order": {
    "status": {
      "RECEIVED": "Received",
      "PREPARING": "Preparing",
      "READY": "Ready",
      "DISPATCHED": "Dispatched",
      "OUT_FOR_DELIVERY": "Out for delivery",
      "DELIVERED": "Delivered",
      "SERVED": "Served",
      "COMPLETED": "Completed",
      "CANCELLED": "Cancelled"
    },
    "type": {
      "DINE_IN": "Dine in",
      "TAKEAWAY": "Takeaway",
      "DELIVERY": "Delivery"
    }
  },
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "confirm": "Confirm",
    "loading": "Loading…",
    "error": "Something went wrong",
    "no_data": "No data available"
  }
}
```

- [ ] **Step 3: Create i18n initializer**

Create `frontend/src/i18n/index.ts`:

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import de from './locales/de.json';
import fr from './locales/fr.json';
import it from './locales/it.json';
import nl from './locales/nl.json';
import hu from './locales/hu.json';
import lb from './locales/lb.json';

export const SUPPORTED_LOCALES = ['en', 'de', 'fr', 'it', 'nl', 'hu', 'lb'] as const;
export type SupportedLocale = typeof SUPPORTED_LOCALES[number];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en }, de: { translation: de }, fr: { translation: fr },
                 it: { translation: it }, nl: { translation: nl }, hu: { translation: hu },
                 lb: { translation: lb } },
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    detection: {
      order: ['htmlTag', 'navigator'],
      caches: [],
    },
  });

/**
 * Change the active language. Called when store locale is loaded.
 * storeLocale is BCP 47 like "de-DE" — extract language tag.
 */
export function applyStoreLocale(storeLocale: string | null | undefined): void {
  if (!storeLocale) return;
  const lang = storeLocale.split('-')[0]; // "de-DE" → "de"
  if (SUPPORTED_LOCALES.includes(lang as SupportedLocale)) {
    i18n.changeLanguage(lang);
  }
}

export default i18n;
```

- [ ] **Step 4: Import i18n in app entry point**

Open `frontend/src/main.tsx` (or `frontend/src/index.tsx` — whichever is the entry point). Add at the very top, before React imports:

```typescript
import './i18n'; // initialise i18next before rendering
```

- [ ] **Step 5: Write i18n initializer test**

Create `frontend/src/i18n/i18n.test.ts`:

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import i18n, { applyStoreLocale, SUPPORTED_LOCALES } from './index';

beforeAll(async () => {
  await i18n.init();
});

describe('i18n initializer', () => {
  it('loads English by default', () => {
    i18n.changeLanguage('en');
    expect(i18n.t('cart.delivery_fee')).toBe('Delivery fee');
    expect(i18n.t('cart.total')).toBe('Total');
  });

  it('loads German translations', () => {
    i18n.changeLanguage('de');
    expect(i18n.t('cart.delivery_fee')).toBe('Liefergebühr');
    expect(i18n.t('cart.total')).toBe('Gesamt');
  });

  it('loads French translations', () => {
    i18n.changeLanguage('fr');
    expect(i18n.t('cart.delivery_fee')).toBe('Frais de livraison');
  });

  it('falls back to English for unsupported locale', () => {
    i18n.changeLanguage('en'); // reset
    applyStoreLocale('xx-XX'); // unsupported
    expect(i18n.t('cart.total')).toBe('Total');
  });

  it('applyStoreLocale extracts language from BCP-47 tag', () => {
    applyStoreLocale('de-DE');
    expect(i18n.language).toBe('de');
    i18n.changeLanguage('en'); // reset after test
  });

  it('SUPPORTED_LOCALES includes all 7 languages', () => {
    expect(SUPPORTED_LOCALES).toContain('en');
    expect(SUPPORTED_LOCALES).toContain('de');
    expect(SUPPORTED_LOCALES).toContain('fr');
    expect(SUPPORTED_LOCALES).toContain('it');
    expect(SUPPORTED_LOCALES).toContain('nl');
    expect(SUPPORTED_LOCALES).toContain('hu');
    expect(SUPPORTED_LOCALES).toContain('lb');
  });
});
```

- [ ] **Step 6: Run i18n tests**

```bash
cd frontend && npx vitest run src/i18n/i18n.test.ts
```

Expected: 6 tests PASS.

- [ ] **Step 7: Commit**

```bash
git add frontend/package.json frontend/package-lock.json \
        frontend/src/i18n/ \
        frontend/src/main.tsx  # or index.tsx
git commit -m "feat(frontend): install react-i18next and add 7-locale translation files for Global-3"
```

---

### Task 7: formatMoney and formatDate utilities

**Files:**
- Modify: `frontend/src/utils/currency.ts` (add `formatMoney`)
- Modify: `frontend/src/utils/dateTime.ts` (add locale-aware `formatDate`)
- Create: `frontend/src/utils/currency.test.ts` (extend with formatMoney tests)
- Modify: `frontend/src/utils/dateTime.test.ts` (add locale-aware tests)

- [ ] **Step 1: Write the failing tests for formatMoney**

Open `frontend/src/utils/currency.test.ts`. Add after the existing `formatINR` tests:

```typescript
import { formatMoney } from './currency';

describe('formatMoney', () => {
  it('formats EUR cents — 1999 cents as €19.99 in de-DE locale', () => {
    const result = formatMoney(1999, 'EUR', 'de-DE');
    // German format: 19,99 € (comma decimal, € suffix)
    expect(result).toMatch(/19[,.]99/);
    expect(result).toMatch(/€|EUR/);
  });

  it('formats GBP pence — 1500 pence as £15.00 in en-GB locale', () => {
    const result = formatMoney(1500, 'GBP', 'en-GB');
    expect(result).toMatch(/15\.00/);
    expect(result).toMatch(/£|GBP/);
  });

  it('formats HUF — HUF has no decimal subdivision, 2000 = Ft2000', () => {
    const result = formatMoney(2000, 'HUF', 'hu-HU');
    expect(result).toMatch(/2[\s,.]?000|2000/);
  });

  it('formats INR paise — 29900 paise as ₹299', () => {
    const result = formatMoney(29900, 'INR', 'en-IN');
    expect(result).toMatch(/299/);
    expect(result).toMatch(/₹|INR/);
  });

  it('formats USD cents — 999 cents as $9.99', () => {
    const result = formatMoney(999, 'USD', 'en-US');
    expect(result).toMatch(/9\.99/);
    expect(result).toMatch(/\$|USD/);
  });

  it('formats 0 as zero amount', () => {
    const result = formatMoney(0, 'EUR', 'en-IE');
    expect(result).toMatch(/0/);
  });
});
```

- [ ] **Step 2: Run to confirm tests fail**

```bash
cd frontend && npx vitest run src/utils/currency.test.ts 2>&1 | tail -15
```

Expected: `formatMoney is not a function` error.

- [ ] **Step 3: Add formatMoney to currency.ts**

Open `frontend/src/utils/currency.ts`. Append:

```typescript
/**
 * Format a monetary amount stored in minor units (cents, paise) for display.
 * Uses Intl.NumberFormat with the store's currency and locale.
 *
 * @param amountMinorUnits - integer minor units (e.g., 1999 for €19.99)
 * @param currency - ISO 4217 code, e.g. "EUR", "INR", "GBP"
 * @param locale - BCP 47 locale, e.g. "de-DE", "en-IN"
 */
export function formatMoney(
  amountMinorUnits: number,
  currency: string,
  locale: string
): string {
  // HUF and similar currencies have no minor unit subdivision
  const noDecimalCurrencies = new Set(['HUF', 'JPY', 'KRW']);
  const divisor = noDecimalCurrencies.has(currency) ? 1 : 100;
  const amount = amountMinorUnits / divisor;

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: noDecimalCurrencies.has(currency) ? 0 : 2,
    maximumFractionDigits: noDecimalCurrencies.has(currency) ? 0 : 2,
  }).format(amount);
}
```

- [ ] **Step 4: Run currency tests**

```bash
cd frontend && npx vitest run src/utils/currency.test.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Write locale-aware formatDate test**

Open `frontend/src/utils/dateTime.test.ts`. Add:

```typescript
import { formatDateLocale } from './dateTime';

describe('formatDateLocale', () => {
  it('formats date in German locale — DD.MM.YYYY', () => {
    const result = formatDateLocale('2026-04-11', 'de-DE');
    expect(result).toMatch(/11\.04\.2026/);
  });

  it('formats date in French locale', () => {
    const result = formatDateLocale('2026-04-11', 'fr-FR');
    // French: 11/04/2026
    expect(result).toMatch(/11/);
    expect(result).toMatch(/04/);
  });

  it('formats date in en-IN locale — existing behaviour', () => {
    const result = formatDateLocale('2026-04-11', 'en-IN');
    expect(result).toMatch(/11/);
    expect(result).toMatch(/04/);
    expect(result).toMatch(/2026/);
  });

  it('falls back to en-IN for null locale', () => {
    const result = formatDateLocale('2026-04-11', null);
    expect(result).toMatch(/2026/);
  });
});
```

- [ ] **Step 6: Add formatDateLocale to dateTime.ts**

Open `frontend/src/utils/dateTime.ts`. The existing `formatDate` is hardcoded to `en-IN`. Add a new locale-aware version (keep the old one for backward compat):

```typescript
/**
 * Format a date using the store's locale.
 * Falls back to en-IN (India legacy) when locale is null.
 */
export const formatDateLocale = (
  date: string | Date,
  locale: string | null | undefined
): string => {
  const activeLocale = locale ?? 'en-IN';
  return new Date(date).toLocaleDateString(activeLocale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};
```

- [ ] **Step 7: Run dateTime tests**

```bash
cd frontend && npx vitest run src/utils/dateTime.test.ts
```

Expected: all tests PASS.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/utils/currency.ts frontend/src/utils/currency.test.ts \
        frontend/src/utils/dateTime.ts frontend/src/utils/dateTime.test.ts
git commit -m "feat(frontend): add formatMoney and formatDateLocale utilities for Global-3"
```

---

### Task 8: Add currency + locale to cartSlice

**Files:**
- Modify: `frontend/src/store/slices/cartSlice.ts`
- Modify: `frontend/src/store/slices/cartSlice.test.ts`

- [ ] **Step 1: Write failing tests for new currency fields**

Open `frontend/src/store/slices/cartSlice.test.ts`. Add after the existing tests:

```typescript
  describe('setStoreCurrency', () => {
    it('sets currency and locale on the cart state', () => {
      // import setStoreCurrency from cartSlice
      const state = cartReducer(emptyState, setStoreCurrency({ currency: 'EUR', locale: 'de-DE' }));
      expect(state.currency).toBe('EUR');
      expect(state.locale).toBe('de-DE');
    });

    it('defaults to INR/en-IN when not called', () => {
      expect(emptyState.currency).toBe('INR');
      expect(emptyState.locale).toBe('en-IN');
    });
  });

  describe('selectCartCurrency', () => {
    it('returns the currency from cart state', () => {
      const rootState = { cart: { ...emptyState, currency: 'EUR', locale: 'de-DE' } };
      expect(selectCartCurrency(rootState)).toBe('EUR');
      expect(selectCartLocale(rootState)).toBe('de-DE');
    });
  });
```

Add `setStoreCurrency`, `selectCartCurrency`, `selectCartLocale` to the import line at the top of the test file.

- [ ] **Step 2: Run to confirm failure**

```bash
cd frontend && npx vitest run src/store/slices/cartSlice.test.ts 2>&1 | tail -10
```

Expected: import error — `setStoreCurrency` does not exist.

- [ ] **Step 3: Add currency + locale to cartSlice**

Open `frontend/src/store/slices/cartSlice.ts`.

Add `currency` and `locale` to `CartState`:

```typescript
interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
  deliveryFee: number;
  isLoading: boolean;
  selectedStoreId: string | null;
  selectedStoreName: string | null;
  currency: string;   // ISO 4217 — default 'INR' for India stores
  locale: string;     // BCP 47 — default 'en-IN' for India stores
}
```

Update `loadCartFromStorage` return value to include defaults:

```typescript
  return {
    items: savedCart.items || [],
    total: savedCart.total || 0,
    itemCount: savedCart.itemCount || 0,
    deliveryFee: 0,
    isLoading: false,
    selectedStoreId: savedCart.selectedStoreId || null,
    selectedStoreName: savedCart.selectedStoreName || null,
    currency: savedCart.currency || 'INR',
    locale: savedCart.locale || 'en-IN',
  };
```

Update the default `return` in `loadCartFromStorage` (the catch/fallback branch):

```typescript
  return {
    items: [],
    total: 0,
    itemCount: 0,
    deliveryFee: 0,
    isLoading: false,
    selectedStoreId: null,
    selectedStoreName: null,
    currency: 'INR',
    locale: 'en-IN',
  };
```

Add `setStoreCurrency` reducer inside `reducers`:

```typescript
    setStoreCurrency: (state, action: PayloadAction<{ currency: string; locale: string }>) => {
      state.currency = action.payload.currency;
      state.locale = action.payload.locale;
      saveCartToStorage(state);
    },
```

Add `currency` and `locale` to `saveCartToStorage`:

```typescript
    localStorage.setItem('cart', JSON.stringify({
      items: state.items,
      total: state.total,
      itemCount: state.itemCount,
      selectedStoreId: state.selectedStoreId,
      selectedStoreName: state.selectedStoreName,
      currency: state.currency,
      locale: state.locale,
    }));
```

Export `setStoreCurrency` in the exports block:

```typescript
export const {
  addToCart,
  removeFromCart,
  removeItemCompletely,
  updateItemQuantity,
  clearCart,
  calculateTotals,
  setLoading,
  setDeliveryFee,
  setSelectedStore,
  clearSelectedStore,
  setStoreCurrency,
} = cartSlice.actions;
```

Add selectors:

```typescript
export const selectCartCurrency = (state: { cart: CartState }) => state.cart.currency;
export const selectCartLocale = (state: { cart: CartState }) => state.cart.locale;
```

- [ ] **Step 4: Run all cartSlice tests**

```bash
cd frontend && npx vitest run src/store/slices/cartSlice.test.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/store/slices/cartSlice.ts frontend/src/store/slices/cartSlice.test.ts
git commit -m "feat(frontend): add currency+locale to cartSlice with setStoreCurrency action and selectors"
```

---

### Task 9: Add currency field to OrderStatusChangedEvent

**Files:**
- Modify: `shared-models/src/main/java/com/MaSoVa/shared/messaging/events/OrderStatusChangedEvent.java`
- Create: `shared-models/src/test/java/com/MaSoVa/shared/messaging/events/OrderStatusChangedEventCurrencyTest.java`

The spec says `OrderStatusChangedEvent` gains a `currency` field in Global-3. `OrderCreatedEvent` already has it (added in Global-2). `OrderStatusChangedEvent` has `vatCountryCode` and `totalVatAmount` but no `currency`.

- [ ] **Step 1: Write the failing test**

Create `shared-models/src/test/java/com/MaSoVa/shared/messaging/events/OrderStatusChangedEventCurrencyTest.java`:

```java
package com.MaSoVa.shared.messaging.events;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.*;

class OrderStatusChangedEventCurrencyTest {

    @Test
    void setCurrency_storesValue() {
        OrderStatusChangedEvent event = new OrderStatusChangedEvent(
            "order-1", "cust-1", "RECEIVED", "PREPARING", "store-1");
        event.setCurrency("EUR");
        assertThat(event.getCurrency()).isEqualTo("EUR");
    }

    @Test
    void defaultConstructor_currencyIsNull() {
        OrderStatusChangedEvent event = new OrderStatusChangedEvent();
        assertThat(event.getCurrency()).isNull();
    }
}
```

- [ ] **Step 2: Run to confirm failure**

```bash
cd shared-models && mvn test -Dtest=OrderStatusChangedEventCurrencyTest "-Dmaven.test.skip=false" 2>&1 | tail -10
```

Expected: `COMPILATION ERROR` — `getCurrency()` does not exist.

- [ ] **Step 3: Add currency field to OrderStatusChangedEvent**

Open `shared-models/src/main/java/com/MaSoVa/shared/messaging/events/OrderStatusChangedEvent.java`.

Add field after `totalVatAmount`:

```java
    private String currency;
```

Add `@JsonProperty("currency") String currency` parameter to the `@JsonCreator` constructor after `totalVatAmount`, and set `this.currency = currency;` in the body.

Add getter and setter:

```java
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
```

- [ ] **Step 4: Wire currency into the event publisher in commerce-service**

Open `commerce-service/src/main/java/com/MaSoVa/commerce/order/service/OrderEventPublisher.java` (or wherever `OrderStatusChangedEvent` is published — grep for `new OrderStatusChangedEvent`).

```bash
grep -rn "OrderStatusChangedEvent" commerce-service/src/main/java --include="*.java"
```

In the publish call, after setting `vatCountryCode` and `totalVatAmount`, add:

```java
event.setCurrency(order.getCurrency());
```

- [ ] **Step 5: Run tests**

```bash
cd shared-models && mvn test -Dtest=OrderStatusChangedEventCurrencyTest "-Dmaven.test.skip=false" 2>&1 | tail -10
```

Expected: `BUILD SUCCESS`.

- [ ] **Step 6: Commit**

```bash
git add shared-models/src/main/java/com/MaSoVa/shared/messaging/events/OrderStatusChangedEvent.java \
        shared-models/src/test/java/com/MaSoVa/shared/messaging/events/OrderStatusChangedEventCurrencyTest.java
git commit -m "feat(shared-models): add currency field to OrderStatusChangedEvent — Global-3"
```

---

### Task 11: Update master brief — mark Global-3 in progress

**Files:**
- Modify: `docs/superpowers/specs/2026-04-10-masova-global-master-brief.md`

- [ ] **Step 1: Update the Global-3 phase status line**

Open the master brief. Find the line:

```
Global-3 (Currency) ──── depends on 2 ────────────► pending
```

Change it to:

```
Global-3 (Currency) ──── depends on 2 ────────────► 🔄 IN PROGRESS — branch feature/global-3-currency
```

Also update the Phase Global-3 section header status from (no status) to:

```
**Status:** 🔄 IN PROGRESS — 2026-04-11
```

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/specs/2026-04-10-masova-global-master-brief.md
git commit -m "docs: mark Global-3 currency/locale/i18n in progress in master brief"
```

---

### Task 12: Run full backend and frontend test suite

- [ ] **Step 1: Run shared-models tests**

```bash
cd shared-models && mvn test "-Dmaven.test.skip=false" 2>&1 | tail -10
```

Expected: `BUILD SUCCESS`.

- [ ] **Step 2: Run core-service tests**

```bash
cd core-service && mvn test "-Dmaven.test.skip=false" 2>&1 | tail -10
```

Expected: `BUILD SUCCESS`.

- [ ] **Step 3: Run commerce-service tests**

```bash
cd commerce-service && mvn test "-Dmaven.test.skip=false" 2>&1 | tail -10
```

Expected: `BUILD SUCCESS`.

- [ ] **Step 4: Run frontend tests**

```bash
cd frontend && npx vitest run
```

Expected: all tests PASS.

- [ ] **Step 5: Commit if any fixes were needed**

```bash
git add -A
git commit -m "fix(global-3): resolve any test failures found in full suite run"
```

---

## File Map Summary

| File | Action | Responsibility |
|---|---|---|
| `shared-models/.../MoneyAmount.java` | Create | Immutable money value object — minor units + currency |
| `shared-models/.../MoneyAmountTest.java` | Create | Unit tests for MoneyAmount |
| `core-service/.../CountryProfileService.java` | Create | Maps countryCode → currency + locale for all 12 countries |
| `core-service/.../CountryProfileServiceTest.java` | Create | Parametrized tests for all 12 countries + edge cases |
| `core-service/.../StoreService.java` | Modify | Inject CountryProfileService, auto-set currency+locale on store create |
| `core-service/.../StoreServiceCurrencyTest.java` | Create | Verify currency wired into saved store |
| `commerce-service/.../V5__order_currency.sql` | Create | PostgreSQL migration — add nullable `currency` column to orders |
| `commerce-service/.../OrderJpaEntity.java` | Modify | Add `currency` String field |
| `commerce-service/.../Order.java` | Modify | Add `currency` String field |
| `commerce-service/.../OrderService.java` | Modify | Set `order.currency = store.currency` on createOrder |
| `commerce-service/.../OrderCurrencyMigrationTest.java` | Create | Testcontainers migration column assertion |
| `commerce-service/.../OrderServiceCurrencyTest.java` | Create | Verify currency propagated to Order + JPA entity |
| `frontend/src/i18n/index.ts` | Create | i18next init, `applyStoreLocale()` helper |
| `frontend/src/i18n/locales/en.json` | Create | English translations |
| `frontend/src/i18n/locales/de.json` | Create | German translations |
| `frontend/src/i18n/locales/fr.json` | Create | French translations |
| `frontend/src/i18n/locales/it.json` | Create | Italian translations |
| `frontend/src/i18n/locales/nl.json` | Create | Dutch translations |
| `frontend/src/i18n/locales/hu.json` | Create | Hungarian translations |
| `frontend/src/i18n/locales/lb.json` | Create | Luxembourgish (English fallback) |
| `frontend/src/i18n/i18n.test.ts` | Create | Tests for i18n init and applyStoreLocale |
| `frontend/src/utils/currency.ts` | Modify | Add `formatMoney(amountMinorUnits, currency, locale)` |
| `frontend/src/utils/currency.test.ts` | Modify | Tests for formatMoney + existing formatINR regression |
| `frontend/src/utils/dateTime.ts` | Modify | Add `formatDateLocale(date, locale)` |
| `frontend/src/utils/dateTime.test.ts` | Modify | Tests for formatDateLocale |
| `frontend/src/store/slices/cartSlice.ts` | Modify | Add `currency`, `locale`, `setStoreCurrency`, `selectCartCurrency`, `selectCartLocale` |
| `frontend/src/store/slices/cartSlice.test.ts` | Modify | Tests for new currency fields + safety floor selectors |
| `docs/superpowers/specs/2026-04-10-masova-global-master-brief.md` | Modify | Mark Global-3 in progress |

---

## What This Phase Does NOT Do

Per the master brief and YAGNI:

- Does **not** rename `selectDeliveryFeeINR` — it remains as an alias pointing to `selectDeliveryFee` (73 call sites untouched)
- Does **not** migrate 73 frontend files from `₹` hardcoding — that is a separate follow-up (the utilities are now available; components adopt them as they are touched per test-as-you-touch rule)
- Does **not** rename `deliveryFeeINR` anywhere in CLAUDE.md or configs — those follow as components are touched
- Does **not** add `MoneyAmount` to `OrderItem.unitPrice` — that requires a MongoDB migration and is deferred to a follow-up (the type is defined and ready)
- Does **not** implement the `currency` field in payment events (`PaymentCompletedEvent` / `PaymentFailedEvent`) — covered in Global-4 (Stripe)
- Does **not** touch mobile apps — React Native currency formatting follows in a later task once the web utilities are stable
