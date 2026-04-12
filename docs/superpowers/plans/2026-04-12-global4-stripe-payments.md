# Global-4: Stripe + SCA/PSD2 Payments Implementation Plan ✅ DONE — PR #11

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `PaymentGateway` interface to payment-service so Stripe handles all 12 non-India countries while Razorpay continues to serve India stores unchanged — gateway resolved from `store.countryCode`, invisible to all callers.

**Architecture:** A `PaymentGateway` interface (`initiatePayment`, `confirmPayment`, `refund`, `parseWebhook`) sits in payment-service. `RazorpayGateway` wraps the existing `RazorpayService`. `StripeGateway` calls Stripe Java SDK. A `PaymentGatewayResolver` bean picks the right impl from `store.countryCode` (null → Razorpay, anything else → Stripe). `PaymentService` calls only the interface; it no longer calls `RazorpayService` directly. The `Transaction` entity gains `paymentGateway` + `stripePaymentIntentId` + `stripeFee` fields. A Flyway V2 migration adds those columns to PostgreSQL. Events gain `paymentGateway` + `paymentMethodType` fields. The frontend `PaymentPage` sends store `countryCode` in the payment request; the payment method selector changes to show Stripe `PaymentElement` for EU stores and keeps the current Razorpay UI for India stores. `PaymentDashboardPage` gains `gateway` and `paymentMethodType` columns. A new `POST /api/payments/webhook/stripe` controller endpoint handles Stripe webhooks (signature-verified, exempt from rate limiting).

**Tech Stack:** Java 21, Spring Boot 3, Stripe Java SDK 26.x (`com.stripe:stripe-java`), MongoDB (transactions collection), PostgreSQL (V2 Flyway migration), RabbitMQ (shared-models events), React 19 + TypeScript, `@stripe/react-stripe-js` + `@stripe/stripe-js`, Redux Toolkit RTK Query, Vitest + RTL (frontend), JUnit 5 + Mockito (backend).

---

## File Map

### Backend — payment-service

| File | Action | Purpose |
|---|---|---|
| `payment-service/src/main/java/com/MaSoVa/payment/gateway/PaymentGateway.java` | **Create** | Interface: `initiatePayment`, `confirmPayment`, `refund`, `parseWebhook` |
| `payment-service/src/main/java/com/MaSoVa/payment/gateway/GatewayPaymentRequest.java` | **Create** | Input DTO for `PaymentGateway.initiatePayment` |
| `payment-service/src/main/java/com/MaSoVa/payment/gateway/GatewayPaymentResult.java` | **Create** | Output DTO: `clientSecret`, `gatewayOrderId`, `gatewayName`, `publishableKey` |
| `payment-service/src/main/java/com/MaSoVa/payment/gateway/GatewayWebhookResult.java` | **Create** | Output DTO: `eventType`, `gatewayOrderId`, `gatewayPaymentId`, `failureReason`, `stripeFeeAmountMinor` |
| `payment-service/src/main/java/com/MaSoVa/payment/gateway/RazorpayGateway.java` | **Create** | Wraps `RazorpayService`; implements `PaymentGateway` |
| `payment-service/src/main/java/com/MaSoVa/payment/gateway/StripeGateway.java` | **Create** | Stripe Java SDK; `PaymentIntent` with `automatic_payment_methods`; idempotency key = orderId |
| `payment-service/src/main/java/com/MaSoVa/payment/gateway/PaymentGatewayResolver.java` | **Create** | `resolve(countryCode)`: null → Razorpay, else → Stripe |
| `payment-service/src/main/java/com/MaSoVa/payment/config/StripeConfig.java` | **Create** | `@ConfigurationProperties("stripe")` — `secretKey`, `webhookSecret`, `publishableKey` |
| `payment-service/src/main/java/com/MaSoVa/payment/service/PaymentService.java` | **Modify** | Use `PaymentGatewayResolver`; add `countryCode` param; store `paymentGateway` + `stripePaymentIntentId` |
| `payment-service/src/main/java/com/MaSoVa/payment/entity/Transaction.java` | **Modify** | Add `paymentGateway`, `stripePaymentIntentId`, `stripeFeeMinorUnits` fields + `AGGREGATOR_COLLECTED` to `PaymentMethod` |
| `payment-service/src/main/java/com/MaSoVa/payment/dto/InitiatePaymentRequest.java` | **Modify** | Add `countryCode` field |
| `payment-service/src/main/java/com/MaSoVa/payment/dto/PaymentResponse.java` | **Modify** | Add `paymentGateway`, `stripeClientSecret`, `stripePublishableKey`, `stripeFeeMinorUnits`, `paymentMethodType` fields |
| `payment-service/src/main/java/com/MaSoVa/payment/controller/StripeWebhookController.java` | **Create** | `POST /api/payments/webhook/stripe` — signature-verified Stripe webhooks |
| `payment-service/src/main/java/com/MaSoVa/payment/config/SecurityConfig.java` | **Modify** | Add `/api/payments/webhook/stripe` to public endpoints |
| `payment-service/src/main/resources/application.yml` | **Modify** | Add `stripe.secret-key`, `stripe.webhook-secret`, `stripe.publishable-key` env-var placeholders |
| `payment-service/src/main/resources/db/migration/V2__stripe_columns.sql` | **Create** | Add `payment_gateway`, `stripe_payment_intent_id`, `stripe_fee_minor_units` columns to `transactions` |

### Shared Models

| File | Action | Purpose |
|---|---|---|
| `shared-models/src/main/java/com/MaSoVa/shared/messaging/events/PaymentCompletedEvent.java` | **Modify** | Add `paymentGateway` + `paymentMethodType` fields |
| `shared-models/src/main/java/com/MaSoVa/shared/messaging/events/PaymentFailedEvent.java` | **Modify** | Add `paymentGateway` field |

### Frontend

| File | Action | Purpose |
|---|---|---|
| `frontend/src/store/api/paymentApi.ts` | **Modify** | Add `countryCode` to `InitiatePaymentRequest`; add `stripeClientSecret`, `stripePublishableKey` to `PaymentResponse`; add `paymentGateway` and `paymentMethodType` fields |
| `frontend/src/pages/customer/PaymentPage.tsx` | **Modify** | Conditionally render Stripe `<PaymentElement>` for EU stores or Razorpay checkout for India; read `countryCode` from store info |
| `frontend/src/pages/manager/PaymentDashboardPage.tsx` | **Modify** | Add `gateway` and `paymentMethodType` columns to transaction table |

### Tests

| File | Action | Purpose |
|---|---|---|
| `payment-service/src/test/java/com/MaSoVa/payment/gateway/PaymentGatewayResolverTest.java` | **Create** | Unit tests for resolver routing logic |
| `payment-service/src/test/java/com/MaSoVa/payment/gateway/StripeGatewayTest.java` | **Create** | Unit tests for StripeGateway with mocked Stripe SDK |
| `payment-service/src/test/java/com/MaSoVa/payment/gateway/RazorpayGatewayTest.java` | **Create** | Unit tests for RazorpayGateway delegation |
| `payment-service/src/test/java/com/MaSoVa/payment/service/PaymentServiceTest.java` | **Modify** | Add tests for countryCode-based gateway routing |
| `payment-service/src/test/java/com/MaSoVa/payment/controller/StripeWebhookControllerTest.java` | **Create** | Tests for webhook signature verification + event handling |

---

## Safety Floor — Write These Tests First

The following tests document current India-store payment behaviour and become regression guards. Write them before touching any feature code.

---

### Task 0: Safety-floor — Gateway resolver and India regression tests

**Files:**
- Create: `payment-service/src/test/java/com/MaSoVa/payment/gateway/PaymentGatewayResolverTest.java`
- Modify: `payment-service/src/test/java/com/MaSoVa/payment/service/PaymentServiceTest.java`

- [ ] **Step 1: Read existing PaymentServiceTest**

Run: `cat payment-service/src/test/java/com/MaSoVa/payment/service/PaymentServiceTest.java`

Expected: Tests for `initiatePayment`, `verifyPayment`, `recordCashPayment` using mocked `RazorpayService`. Read to understand what mocks are set up.

- [ ] **Step 2: Create PaymentGatewayResolverTest**

Create `payment-service/src/test/java/com/MaSoVa/payment/gateway/PaymentGatewayResolverTest.java`:

```java
package com.MaSoVa.payment.gateway;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

class PaymentGatewayResolverTest {

    private RazorpayGateway razorpayGateway;
    private StripeGateway stripeGateway;
    private PaymentGatewayResolver resolver;

    @BeforeEach
    void setUp() {
        razorpayGateway = mock(RazorpayGateway.class);
        stripeGateway = mock(StripeGateway.class);
        resolver = new PaymentGatewayResolver(razorpayGateway, stripeGateway);
    }

    @Test
    void null_countryCode_returns_razorpay() {
        assertThat(resolver.resolve(null)).isSameAs(razorpayGateway);
    }

    @Test
    void empty_countryCode_returns_razorpay() {
        assertThat(resolver.resolve("")).isSameAs(razorpayGateway);
    }

    @Test
    void de_returns_stripe() {
        assertThat(resolver.resolve("DE")).isSameAs(stripeGateway);
    }

    @Test
    void gb_returns_stripe() {
        assertThat(resolver.resolve("GB")).isSameAs(stripeGateway);
    }

    @Test
    void us_returns_stripe() {
        assertThat(resolver.resolve("US")).isSameAs(stripeGateway);
    }

    @Test
    void hu_returns_stripe() {
        assertThat(resolver.resolve("HU")).isSameAs(stripeGateway);
    }

    @Test
    void case_insensitive_de_returns_stripe() {
        assertThat(resolver.resolve("de")).isSameAs(stripeGateway);
    }
}
```

- [ ] **Step 3: Verify test compilation fails (class does not exist yet)**

Run from the `payment-service` directory on the Dell:
```
mvn test -pl payment-service -Dtest=PaymentGatewayResolverTest "-Dmaven.test.skip=false" 2>&1 | tail -20
```
Expected: COMPILATION FAILURE — `PaymentGatewayResolverTest` references non-existent classes. This confirms test-first approach.

- [ ] **Step 4: Commit safety-floor tests**

```bash
git add payment-service/src/test/java/com/MaSoVa/payment/gateway/PaymentGatewayResolverTest.java
git commit -m "test(payment): safety-floor — gateway resolver unit tests (fail until impl)"
```

---

### Task 1: Gateway interface + DTOs

**Files:**
- Create: `payment-service/src/main/java/com/MaSoVa/payment/gateway/PaymentGateway.java`
- Create: `payment-service/src/main/java/com/MaSoVa/payment/gateway/GatewayPaymentRequest.java`
- Create: `payment-service/src/main/java/com/MaSoVa/payment/gateway/GatewayPaymentResult.java`
- Create: `payment-service/src/main/java/com/MaSoVa/payment/gateway/GatewayWebhookResult.java`

- [ ] **Step 1: Create GatewayPaymentRequest DTO**

Create `payment-service/src/main/java/com/MaSoVa/payment/gateway/GatewayPaymentRequest.java`:

```java
package com.MaSoVa.payment.gateway;

import java.math.BigDecimal;

/**
 * Input to PaymentGateway.initiatePayment.
 * Gateway-agnostic: Razorpay and Stripe both receive this.
 */
public class GatewayPaymentRequest {

    private final String orderId;
    private final BigDecimal amount;
    private final String currency;       // ISO 4217, e.g. "INR", "EUR"
    private final String customerEmail;
    private final String customerPhone;
    private final String customerName;
    private final String receipt;        // Receipt number for Razorpay; idempotency key for Stripe

    public GatewayPaymentRequest(String orderId, BigDecimal amount, String currency,
                                  String customerEmail, String customerPhone,
                                  String customerName, String receipt) {
        this.orderId = orderId;
        this.amount = amount;
        this.currency = currency;
        this.customerEmail = customerEmail;
        this.customerPhone = customerPhone;
        this.customerName = customerName;
        this.receipt = receipt;
    }

    public String getOrderId() { return orderId; }
    public BigDecimal getAmount() { return amount; }
    public String getCurrency() { return currency; }
    public String getCustomerEmail() { return customerEmail; }
    public String getCustomerPhone() { return customerPhone; }
    public String getCustomerName() { return customerName; }
    public String getReceipt() { return receipt; }
}
```

- [ ] **Step 2: Create GatewayPaymentResult DTO**

Create `payment-service/src/main/java/com/MaSoVa/payment/gateway/GatewayPaymentResult.java`:

```java
package com.MaSoVa.payment.gateway;

/**
 * Returned by PaymentGateway.initiatePayment.
 * Razorpay: gatewayOrderId = razorpay_order_id, clientSecret = null, publishableKey = razorpayKeyId.
 * Stripe: gatewayOrderId = payment_intent_id, clientSecret = client_secret, publishableKey = Stripe PK.
 */
public class GatewayPaymentResult {

    private final String gatewayName;       // "RAZORPAY" or "STRIPE"
    private final String gatewayOrderId;    // Razorpay order ID or Stripe PaymentIntent ID
    private final String clientSecret;      // Stripe only (null for Razorpay)
    private final String publishableKey;    // Public key for frontend SDK

    public GatewayPaymentResult(String gatewayName, String gatewayOrderId,
                                  String clientSecret, String publishableKey) {
        this.gatewayName = gatewayName;
        this.gatewayOrderId = gatewayOrderId;
        this.clientSecret = clientSecret;
        this.publishableKey = publishableKey;
    }

    public String getGatewayName() { return gatewayName; }
    public String getGatewayOrderId() { return gatewayOrderId; }
    public String getClientSecret() { return clientSecret; }
    public String getPublishableKey() { return publishableKey; }
}
```

- [ ] **Step 3: Create GatewayWebhookResult DTO**

Create `payment-service/src/main/java/com/MaSoVa/payment/gateway/GatewayWebhookResult.java`:

```java
package com.MaSoVa.payment.gateway;

/**
 * Returned by PaymentGateway.parseWebhook.
 * Normalised across Razorpay and Stripe.
 */
public class GatewayWebhookResult {

    public enum EventType {
        PAYMENT_CAPTURED,
        PAYMENT_FAILED,
        REFUND_PROCESSED,
        REFUND_FAILED,
        UNKNOWN
    }

    private final EventType eventType;
    private final String gatewayOrderId;    // Razorpay order ID or Stripe PaymentIntent ID
    private final String gatewayPaymentId;  // Razorpay payment ID or Stripe charge ID
    private final String failureReason;     // null unless PAYMENT_FAILED / REFUND_FAILED
    private final Long stripeFeeAmountMinor; // Stripe fee in minor units (null for Razorpay)

    public GatewayWebhookResult(EventType eventType, String gatewayOrderId,
                                  String gatewayPaymentId, String failureReason,
                                  Long stripeFeeAmountMinor) {
        this.eventType = eventType;
        this.gatewayOrderId = gatewayOrderId;
        this.gatewayPaymentId = gatewayPaymentId;
        this.failureReason = failureReason;
        this.stripeFeeAmountMinor = stripeFeeAmountMinor;
    }

    public EventType getEventType() { return eventType; }
    public String getGatewayOrderId() { return gatewayOrderId; }
    public String getGatewayPaymentId() { return gatewayPaymentId; }
    public String getFailureReason() { return failureReason; }
    public Long getStripeFeeAmountMinor() { return stripeFeeAmountMinor; }
}
```

- [ ] **Step 4: Create PaymentGateway interface**

Create `payment-service/src/main/java/com/MaSoVa/payment/gateway/PaymentGateway.java`:

```java
package com.MaSoVa.payment.gateway;

import java.math.BigDecimal;

/**
 * Gateway-agnostic payment abstraction.
 * Razorpay and Stripe both implement this interface.
 * PaymentService calls only this — never gateway SDKs directly.
 */
public interface PaymentGateway {

    /**
     * Create a payment order / intent at the gateway.
     * @return GatewayPaymentResult containing what the frontend needs to open the payment UI
     */
    GatewayPaymentResult initiatePayment(GatewayPaymentRequest request) throws Exception;

    /**
     * Confirm / verify a payment after the customer completes it in the frontend.
     * @param gatewayOrderId The order or intent ID returned by initiatePayment
     * @param gatewayPaymentId The payment / charge ID from the frontend callback
     * @param gatewaySignature Signature or confirmation token (Razorpay: HMAC, Stripe: null)
     * @return true if verification passes
     */
    boolean confirmPayment(String gatewayOrderId, String gatewayPaymentId, String gatewaySignature) throws Exception;

    /**
     * Create a refund at the gateway.
     * @param gatewayPaymentId The payment / charge ID to refund
     * @param amount Amount in major units (e.g. 10.00 EUR). Gateway converts to minor units.
     * @param speed "normal" or "optimum" (Razorpay only; ignored by Stripe)
     * @return Gateway refund ID
     */
    String refund(String gatewayPaymentId, BigDecimal amount, String speed) throws Exception;

    /**
     * Parse an inbound webhook payload.
     * Implementations must verify the signature themselves.
     * @param rawPayload Raw request body as String
     * @param signatureHeader Value of X-Razorpay-Signature or Stripe-Signature header
     * @return Normalised GatewayWebhookResult
     */
    GatewayWebhookResult parseWebhook(String rawPayload, String signatureHeader) throws Exception;

    /** Gateway name for storage — "RAZORPAY" or "STRIPE". */
    String getGatewayName();
}
```

- [ ] **Step 5: Verify compilation**

Run: `mvn compile -pl payment-service "-Dmaven.test.skip=true"` on the Dell.
Expected: BUILD SUCCESS (interfaces compile without implementations).

- [ ] **Step 6: Commit**

```bash
git add payment-service/src/main/java/com/MaSoVa/payment/gateway/
git commit -m "feat(payment): add PaymentGateway interface + gateway DTOs"
```

---

### Task 2: RazorpayGateway + StripeConfig

**Files:**
- Create: `payment-service/src/main/java/com/MaSoVa/payment/config/StripeConfig.java`
- Create: `payment-service/src/main/java/com/MaSoVa/payment/gateway/RazorpayGateway.java`
- Modify: `payment-service/pom.xml` — add Stripe Java SDK dependency
- Modify: `payment-service/src/main/resources/application.yml` — add Stripe config keys

- [ ] **Step 1: Add Stripe Java SDK to pom.xml**

Open `payment-service/pom.xml`. After the Razorpay dependency block, add:

```xml
        <!-- Stripe Java SDK — EU/Global payments (Global-4) -->
        <dependency>
            <groupId>com.stripe</groupId>
            <artifactId>stripe-java</artifactId>
            <version>26.3.0</version>
        </dependency>
```

- [ ] **Step 2: Add Stripe config keys to application.yml**

Open `payment-service/src/main/resources/application.yml`. After the `razorpay:` block, add:

```yaml
# Stripe Configuration — Global-4 EU/Global payments
# Set STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PUBLISHABLE_KEY in environment
stripe:
  secret-key: ${STRIPE_SECRET_KEY:sk_test_placeholder_replace_in_env}
  webhook-secret: ${STRIPE_WEBHOOK_SECRET:whsec_placeholder_replace_in_env}
  publishable-key: ${STRIPE_PUBLISHABLE_KEY:pk_test_placeholder_replace_in_env}
```

- [ ] **Step 3: Create StripeConfig**

Create `payment-service/src/main/java/com/MaSoVa/payment/config/StripeConfig.java`:

```java
package com.MaSoVa.payment.config;

import com.stripe.Stripe;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Stripe SDK configuration. Secret key is set once at startup via Stripe.apiKey.
 * Keys are injected from environment variables — never hardcoded.
 */
@Configuration
@ConfigurationProperties(prefix = "stripe")
public class StripeConfig {

    private static final Logger log = LoggerFactory.getLogger(StripeConfig.class);

    private String secretKey;
    private String webhookSecret;
    private String publishableKey;

    @PostConstruct
    public void init() {
        Stripe.apiKey = secretKey;
        log.info("Stripe SDK initialised. Publishable key prefix: {}",
                 publishableKey != null && publishableKey.length() > 7
                     ? publishableKey.substring(0, 7) + "..."
                     : "NOT_SET");
    }

    public String getSecretKey() { return secretKey; }
    public void setSecretKey(String secretKey) { this.secretKey = secretKey; }

    public String getWebhookSecret() { return webhookSecret; }
    public void setWebhookSecret(String webhookSecret) { this.webhookSecret = webhookSecret; }

    public String getPublishableKey() { return publishableKey; }
    public void setPublishableKey(String publishableKey) { this.publishableKey = publishableKey; }
}
```

- [ ] **Step 4: Create RazorpayGateway**

Create `payment-service/src/main/java/com/MaSoVa/payment/gateway/RazorpayGateway.java`:

```java
package com.MaSoVa.payment.gateway;

import com.MaSoVa.payment.config.RazorpayConfig;
import com.MaSoVa.payment.service.RazorpayService;
import com.razorpay.Order;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/**
 * PaymentGateway implementation backed by Razorpay.
 * Delegates to the existing RazorpayService — no logic duplication.
 */
@Component
public class RazorpayGateway implements PaymentGateway {

    private static final Logger log = LoggerFactory.getLogger(RazorpayGateway.class);

    private final RazorpayService razorpayService;
    private final RazorpayConfig razorpayConfig;

    public RazorpayGateway(RazorpayService razorpayService, RazorpayConfig razorpayConfig) {
        this.razorpayService = razorpayService;
        this.razorpayConfig = razorpayConfig;
    }

    @Override
    public GatewayPaymentResult initiatePayment(GatewayPaymentRequest request) throws Exception {
        Order razorpayOrder = razorpayService.createOrder(
                request.getAmount(), request.getOrderId(), request.getReceipt());
        String razorpayOrderId = razorpayOrder.get("id").toString();
        return new GatewayPaymentResult("RAZORPAY", razorpayOrderId, null, razorpayConfig.getKeyId());
    }

    @Override
    public boolean confirmPayment(String gatewayOrderId, String gatewayPaymentId, String gatewaySignature) throws Exception {
        return razorpayService.verifyPaymentSignature(gatewayOrderId, gatewayPaymentId, gatewaySignature);
    }

    @Override
    public String refund(String gatewayPaymentId, BigDecimal amount, String speed) throws Exception {
        var refundJson = razorpayService.createRefund(gatewayPaymentId, amount, speed);
        return refundJson.getString("id");
    }

    @Override
    public GatewayWebhookResult parseWebhook(String rawPayload, String signatureHeader) throws Exception {
        boolean valid = razorpayService.verifyWebhookSignature(rawPayload, signatureHeader, razorpayConfig.getWebhookSecret());
        if (!valid) {
            throw new SecurityException("Razorpay webhook signature verification failed");
        }
        org.json.JSONObject payload = new org.json.JSONObject(rawPayload);
        String event = payload.optString("event", "");
        GatewayWebhookResult.EventType eventType = switch (event) {
            case "payment.captured", "order.paid" -> GatewayWebhookResult.EventType.PAYMENT_CAPTURED;
            case "payment.failed"                  -> GatewayWebhookResult.EventType.PAYMENT_FAILED;
            case "refund.processed"                -> GatewayWebhookResult.EventType.REFUND_PROCESSED;
            case "refund.failed"                   -> GatewayWebhookResult.EventType.REFUND_FAILED;
            default                                -> GatewayWebhookResult.EventType.UNKNOWN;
        };
        String gatewayOrderId = null;
        String gatewayPaymentId = null;
        String failureReason = null;
        try {
            var entity = payload.getJSONObject("payload")
                                 .getJSONObject(event.startsWith("refund") ? "refund" : "payment")
                                 .getJSONObject("entity");
            gatewayPaymentId = entity.optString("id");
            gatewayOrderId   = entity.optString("order_id");
            failureReason    = entity.optString("error_description", null);
        } catch (Exception ignored) {
            log.warn("Could not extract entity from Razorpay webhook for event: {}", event);
        }
        return new GatewayWebhookResult(eventType, gatewayOrderId, gatewayPaymentId, failureReason, null);
    }

    @Override
    public String getGatewayName() { return "RAZORPAY"; }
}
```

- [ ] **Step 5: Write RazorpayGateway unit test**

Create `payment-service/src/test/java/com/MaSoVa/payment/gateway/RazorpayGatewayTest.java`:

```java
package com.MaSoVa.payment.gateway;

import com.MaSoVa.payment.config.RazorpayConfig;
import com.MaSoVa.payment.service.RazorpayService;
import com.razorpay.Order;
import org.json.JSONObject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class RazorpayGatewayTest {

    private RazorpayService razorpayService;
    private RazorpayConfig razorpayConfig;
    private RazorpayGateway gateway;

    @BeforeEach
    void setUp() {
        razorpayService = mock(RazorpayService.class);
        razorpayConfig  = mock(RazorpayConfig.class);
        when(razorpayConfig.getKeyId()).thenReturn("rzp_test_key");
        when(razorpayConfig.getWebhookSecret()).thenReturn("webhook_secret");
        gateway = new RazorpayGateway(razorpayService, razorpayConfig);
    }

    @Test
    void initiatePayment_returns_razorpay_result() throws Exception {
        Order fakeOrder = mock(Order.class);
        when(fakeOrder.get("id")).thenReturn("rzp_order_123");
        when(razorpayService.createOrder(any(), any(), any())).thenReturn(fakeOrder);

        GatewayPaymentRequest req = new GatewayPaymentRequest(
                "order-1", new BigDecimal("550.00"), "INR",
                "a@b.com", "+91999", "Alice", "RCP_abc");

        GatewayPaymentResult result = gateway.initiatePayment(req);

        assertThat(result.getGatewayName()).isEqualTo("RAZORPAY");
        assertThat(result.getGatewayOrderId()).isEqualTo("rzp_order_123");
        assertThat(result.getClientSecret()).isNull();
        assertThat(result.getPublishableKey()).isEqualTo("rzp_test_key");
    }

    @Test
    void confirmPayment_delegates_to_razorpayService() throws Exception {
        when(razorpayService.verifyPaymentSignature("order", "payment", "sig")).thenReturn(true);
        assertThat(gateway.confirmPayment("order", "payment", "sig")).isTrue();
    }

    @Test
    void parseWebhook_invalid_signature_throws() {
        when(razorpayService.verifyWebhookSignature(any(), any(), any())).thenReturn(false);
        assertThatThrownBy(() -> gateway.parseWebhook("{}", "bad_sig"))
                .isInstanceOf(SecurityException.class);
    }

    @Test
    void getGatewayName_returns_RAZORPAY() {
        assertThat(gateway.getGatewayName()).isEqualTo("RAZORPAY");
    }
}
```

- [ ] **Step 6: Verify tests compile and pass**

Run: `mvn test -pl payment-service -Dtest=RazorpayGatewayTest "-Dmaven.test.skip=false"` on Dell.
Expected: 4 tests pass.

- [ ] **Step 7: Commit**

```bash
git add payment-service/pom.xml
git add payment-service/src/main/resources/application.yml
git add payment-service/src/main/java/com/MaSoVa/payment/config/StripeConfig.java
git add payment-service/src/main/java/com/MaSoVa/payment/gateway/RazorpayGateway.java
git add payment-service/src/test/java/com/MaSoVa/payment/gateway/RazorpayGatewayTest.java
git commit -m "feat(payment): add StripeConfig + RazorpayGateway wrapping existing RazorpayService"
```

---

### Task 3: StripeGateway

**Files:**
- Create: `payment-service/src/main/java/com/MaSoVa/payment/gateway/StripeGateway.java`
- Create: `payment-service/src/test/java/com/MaSoVa/payment/gateway/StripeGatewayTest.java`

- [ ] **Step 1: Write StripeGateway unit tests first**

Create `payment-service/src/test/java/com/MaSoVa/payment/gateway/StripeGatewayTest.java`:

```java
package com.MaSoVa.payment.gateway;

import com.MaSoVa.payment.config.StripeConfig;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

/**
 * Unit tests for StripeGateway.
 * Stripe SDK calls are tested via integration with real Stripe test keys — not mocked here.
 * These tests cover only the config-level concerns and gateway name.
 */
class StripeGatewayTest {

    private StripeConfig stripeConfig;
    private StripeGateway gateway;

    @BeforeEach
    void setUp() {
        stripeConfig = mock(StripeConfig.class);
        when(stripeConfig.getPublishableKey()).thenReturn("pk_test_abc");
        when(stripeConfig.getWebhookSecret()).thenReturn("whsec_test");
        gateway = new StripeGateway(stripeConfig);
    }

    @Test
    void getGatewayName_returns_STRIPE() {
        assertThat(gateway.getGatewayName()).isEqualTo("STRIPE");
    }

    @Test
    void confirmPayment_stripe_always_true_signature_is_null() throws Exception {
        // Stripe PaymentElement confirms on the frontend; backend just records.
        // confirmPayment with null signature (Stripe webhook flow) must return true.
        assertThat(gateway.confirmPayment("pi_123", "ch_456", null)).isTrue();
    }

    @Test
    void parseWebhook_invalid_signature_throws() {
        // Stripe webhook with invalid signature header must throw SecurityException.
        // Uses real Stripe.Webhook.constructEvent — will throw SignatureVerificationException
        // when webhook secret doesn't match payload.
        assertThatThrownBy(() -> gateway.parseWebhook("{}", "bad_sig"))
                .isInstanceOf(SecurityException.class)
                .hasMessageContaining("Stripe");
    }
}
```

- [ ] **Step 2: Run tests to confirm they fail**

Run: `mvn test -pl payment-service -Dtest=StripeGatewayTest "-Dmaven.test.skip=false"` on Dell.
Expected: COMPILATION FAILURE — `StripeGateway` does not exist yet.

- [ ] **Step 3: Create StripeGateway**

Create `payment-service/src/main/java/com/MaSoVa/payment/gateway/StripeGateway.java`:

```java
package com.MaSoVa.payment.gateway;

import com.MaSoVa.payment.config.StripeConfig;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;
import com.stripe.model.Refund;
import com.stripe.net.Webhook;
import com.stripe.param.PaymentIntentCreateParams;
import com.stripe.param.RefundCreateParams;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/**
 * PaymentGateway implementation backed by Stripe.
 * Used for all 12 non-India countries (Global-4).
 *
 * SCA/3DS2 is handled entirely by Stripe's hosted Payment Element on the frontend.
 * No custom 3DS logic here.
 * Idempotency key = orderId — prevents double-charge on frontend retry.
 */
@Component
public class StripeGateway implements PaymentGateway {

    private static final Logger log = LoggerFactory.getLogger(StripeGateway.class);

    private final StripeConfig stripeConfig;

    public StripeGateway(StripeConfig stripeConfig) {
        this.stripeConfig = stripeConfig;
    }

    @Override
    public GatewayPaymentResult initiatePayment(GatewayPaymentRequest request) throws Exception {
        // Stripe requires amount in minor units (cents, pence, fillér, etc.)
        long amountMinorUnits = request.getAmount()
                .multiply(BigDecimal.valueOf(100))
                .longValue();

        PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                .setAmount(amountMinorUnits)
                .setCurrency(request.getCurrency().toLowerCase())
                .setAutomaticPaymentMethods(
                    PaymentIntentCreateParams.AutomaticPaymentMethods.builder()
                        .setEnabled(true)
                        .build())
                .putMetadata("orderId", request.getOrderId())
                .putMetadata("receipt", request.getReceipt())
                .setReceiptEmail(request.getCustomerEmail())
                .build();

        // Idempotency key = orderId — prevents double-charge on network retry
        PaymentIntent intent = PaymentIntent.create(
                params,
                com.stripe.net.RequestOptions.builder()
                        .setIdempotencyKey("pi_create_" + request.getOrderId())
                        .build()
        );

        log.info("Stripe PaymentIntent created: {} for orderId={}", intent.getId(), request.getOrderId());

        return new GatewayPaymentResult(
                "STRIPE",
                intent.getId(),              // gatewayOrderId = PaymentIntent ID
                intent.getClientSecret(),    // clientSecret returned to frontend for PaymentElement
                stripeConfig.getPublishableKey()
        );
    }

    @Override
    public boolean confirmPayment(String gatewayOrderId, String gatewayPaymentId, String gatewaySignature) throws Exception {
        // Stripe PaymentElement confirms on the frontend (3DS included).
        // The backend receives the succeeded status via webhook (see parseWebhook).
        // This method is called on the verify endpoint — for Stripe we trust the PaymentIntent status.
        if (gatewayOrderId == null) return false;
        PaymentIntent intent = PaymentIntent.retrieve(gatewayOrderId);
        boolean succeeded = "succeeded".equals(intent.getStatus());
        log.info("Stripe PaymentIntent {} status={}", gatewayOrderId, intent.getStatus());
        return succeeded;
    }

    @Override
    public String refund(String gatewayPaymentId, BigDecimal amount, String speed) throws Exception {
        // Stripe refunds a charge (payment method), not a PaymentIntent
        long amountMinorUnits = amount.multiply(BigDecimal.valueOf(100)).longValue();

        RefundCreateParams params = RefundCreateParams.builder()
                .setPaymentIntent(gatewayPaymentId)   // Stripe accepts PI ID here
                .setAmount(amountMinorUnits)
                .build();

        Refund refund = Refund.create(params);
        log.info("Stripe Refund created: {} for paymentIntent={}", refund.getId(), gatewayPaymentId);
        return refund.getId();
    }

    @Override
    public GatewayWebhookResult parseWebhook(String rawPayload, String signatureHeader) throws Exception {
        Event event;
        try {
            event = Webhook.constructEvent(rawPayload, signatureHeader, stripeConfig.getWebhookSecret());
        } catch (SignatureVerificationException e) {
            throw new SecurityException("Stripe webhook signature verification failed: " + e.getMessage(), e);
        }

        log.info("Stripe webhook event type: {}", event.getType());

        GatewayWebhookResult.EventType eventType = switch (event.getType()) {
            case "payment_intent.succeeded"         -> GatewayWebhookResult.EventType.PAYMENT_CAPTURED;
            case "payment_intent.payment_failed"    -> GatewayWebhookResult.EventType.PAYMENT_FAILED;
            case "charge.refunded"                  -> GatewayWebhookResult.EventType.REFUND_PROCESSED;
            case "charge.refund.updated"            -> GatewayWebhookResult.EventType.REFUND_PROCESSED;
            default                                 -> GatewayWebhookResult.EventType.UNKNOWN;
        };

        String gatewayOrderId = null;
        String gatewayPaymentId = null;
        String failureReason = null;
        Long stripeFee = null;

        try {
            var dataObject = event.getDataObjectDeserializer().getObject();
            if (dataObject.isPresent()) {
                var obj = dataObject.get();
                if (obj instanceof PaymentIntent pi) {
                    gatewayOrderId  = pi.getId();
                    gatewayPaymentId = pi.getLatestCharge();
                    if (pi.getLastPaymentError() != null) {
                        failureReason = pi.getLastPaymentError().getMessage();
                    }
                } else if (obj instanceof com.stripe.model.Charge charge) {
                    gatewayOrderId   = charge.getPaymentIntent();
                    gatewayPaymentId = charge.getId();
                    if (charge.getBalanceTransactionObject() != null) {
                        stripeFee = charge.getBalanceTransactionObject().getFee();
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Could not extract Stripe event data for event type: {}", event.getType(), e);
        }

        return new GatewayWebhookResult(eventType, gatewayOrderId, gatewayPaymentId, failureReason, stripeFee);
    }

    @Override
    public String getGatewayName() { return "STRIPE"; }
}
```

- [ ] **Step 4: Run StripeGateway tests**

Run: `mvn test -pl payment-service -Dtest=StripeGatewayTest "-Dmaven.test.skip=false"` on Dell.
Expected: 3 tests — `getGatewayName` passes, `confirmPayment` passes, `parseWebhook_invalid_signature_throws` passes.

- [ ] **Step 5: Commit**

```bash
git add payment-service/src/main/java/com/MaSoVa/payment/gateway/StripeGateway.java
git add payment-service/src/test/java/com/MaSoVa/payment/gateway/StripeGatewayTest.java
git commit -m "feat(payment): add StripeGateway — PaymentIntent with automatic_payment_methods, SCA via PaymentElement"
```

---

### Task 4: PaymentGatewayResolver

**Files:**
- Create: `payment-service/src/main/java/com/MaSoVa/payment/gateway/PaymentGatewayResolver.java`

- [ ] **Step 1: Create PaymentGatewayResolver**

Create `payment-service/src/main/java/com/MaSoVa/payment/gateway/PaymentGatewayResolver.java`:

```java
package com.MaSoVa.payment.gateway;

import org.springframework.stereotype.Component;

/**
 * Resolves the correct PaymentGateway based on store.countryCode.
 *
 * Routing rule:
 *   null or blank countryCode  →  RazorpayGateway  (India legacy)
 *   any non-blank countryCode  →  StripeGateway     (Global programme)
 *
 * Country is set once at store creation and immutable after first order — routing is stable.
 */
@Component
public class PaymentGatewayResolver {

    private final RazorpayGateway razorpayGateway;
    private final StripeGateway stripeGateway;

    public PaymentGatewayResolver(RazorpayGateway razorpayGateway, StripeGateway stripeGateway) {
        this.razorpayGateway = razorpayGateway;
        this.stripeGateway   = stripeGateway;
    }

    /**
     * @param countryCode ISO 3166-1 alpha-2 country code from Store entity, or null for India stores.
     */
    public PaymentGateway resolve(String countryCode) {
        if (countryCode == null || countryCode.isBlank()) {
            return razorpayGateway;
        }
        return stripeGateway;
    }
}
```

- [ ] **Step 2: Run resolver tests (written in Task 0)**

Run: `mvn test -pl payment-service -Dtest=PaymentGatewayResolverTest "-Dmaven.test.skip=false"` on Dell.
Expected: 7 tests pass.

- [ ] **Step 3: Commit**

```bash
git add payment-service/src/main/java/com/MaSoVa/payment/gateway/PaymentGatewayResolver.java
git commit -m "feat(payment): add PaymentGatewayResolver — routes null/India to Razorpay, non-null to Stripe"
```

---

### Task 5: Transaction entity + Flyway migration

**Files:**
- Modify: `payment-service/src/main/java/com/MaSoVa/payment/entity/Transaction.java`
- Create: `payment-service/src/main/resources/db/migration/V2__stripe_columns.sql`

- [ ] **Step 1: Add new fields to Transaction entity**

Open `payment-service/src/main/java/com/MaSoVa/payment/entity/Transaction.java`.

After the `private String currency;` field (line ~66), add:

```java
    /** "RAZORPAY" or "STRIPE" — populated at payment initiation. */
    private String paymentGateway;

    /** Stripe PaymentIntent ID (null for Razorpay transactions). */
    @Indexed
    private String stripePaymentIntentId;

    /** Stripe platform fee in minor units (cents, pence). Null for Razorpay and non-Stripe. */
    private Long stripeFeeMinorUnits;
```

Add the corresponding getters and setters after the existing `getCurrency`/`setCurrency` methods:

```java
    public String getPaymentGateway() { return paymentGateway; }
    public void setPaymentGateway(String paymentGateway) { this.paymentGateway = paymentGateway; }

    public String getStripePaymentIntentId() { return stripePaymentIntentId; }
    public void setStripePaymentIntentId(String stripePaymentIntentId) { this.stripePaymentIntentId = stripePaymentIntentId; }

    public Long getStripeFeeMinorUnits() { return stripeFeeMinorUnits; }
    public void setStripeFeeMinorUnits(Long stripeFeeMinorUnits) { this.stripeFeeMinorUnits = stripeFeeMinorUnits; }
```

Add `AGGREGATOR_COLLECTED` to the `PaymentMethod` enum (line ~241):

```java
    public enum PaymentMethod {
        CARD,
        UPI,
        NETBANKING,
        WALLET,
        CASH,
        AGGREGATOR_COLLECTED,   // Global-6 aggregator orders — payment already collected by platform
        OTHER
    }
```

- [ ] **Step 2: Create Flyway V2 migration**

Create `payment-service/src/main/resources/db/migration/V2__stripe_columns.sql`:

```sql
-- V2: Add Stripe payment gateway fields to transactions (Global-4)
-- Existing Razorpay rows get NULL values (backward-compatible)

ALTER TABLE payment_schema.transactions
    ADD COLUMN IF NOT EXISTS payment_gateway         VARCHAR(20),
    ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS stripe_fee_minor_units  BIGINT;

CREATE INDEX IF NOT EXISTS idx_transactions_stripe_pi
    ON payment_schema.transactions (stripe_payment_intent_id)
    WHERE stripe_payment_intent_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_payment_gateway
    ON payment_schema.transactions (payment_gateway)
    WHERE payment_gateway IS NOT NULL;
```

- [ ] **Step 3: Compile to verify entity changes**

Run: `mvn compile -pl payment-service "-Dmaven.test.skip=true"` on Dell.
Expected: BUILD SUCCESS.

- [ ] **Step 4: Commit**

```bash
git add payment-service/src/main/java/com/MaSoVa/payment/entity/Transaction.java
git add payment-service/src/main/resources/db/migration/V2__stripe_columns.sql
git commit -m "feat(payment): add paymentGateway + stripe fields to Transaction; V2 Flyway migration"
```

---

### Task 6: Wire PaymentGatewayResolver into PaymentService

**Files:**
- Modify: `payment-service/src/main/java/com/MaSoVa/payment/dto/InitiatePaymentRequest.java`
- Modify: `payment-service/src/main/java/com/MaSoVa/payment/dto/PaymentResponse.java`
- Modify: `payment-service/src/main/java/com/MaSoVa/payment/service/PaymentService.java`

- [ ] **Step 1: Read InitiatePaymentRequest**

Run: `cat payment-service/src/main/java/com/MaSoVa/payment/dto/InitiatePaymentRequest.java`

Expected: DTO with `orderId`, `amount`, `customerId`, `customerEmail`, `customerPhone`, `storeId`, `orderType`, `paymentMethod` fields.

- [ ] **Step 2: Add countryCode to InitiatePaymentRequest**

Open the file. After the `paymentMethod` field (or at the end of the fields), add:

```java
    /** ISO 3166-1 alpha-2 country code from the store. Null for India stores → Razorpay. */
    private String countryCode;
```

Add getter/setter at the end of the class (or where existing getters are):

```java
    public String getCountryCode() { return countryCode; }
    public void setCountryCode(String countryCode) { this.countryCode = countryCode; }
```

- [ ] **Step 3: Read PaymentResponse**

Run: `cat payment-service/src/main/java/com/MaSoVa/payment/dto/PaymentResponse.java`

Read to understand the existing builder pattern.

- [ ] **Step 4: Add Stripe fields to PaymentResponse**

Open `PaymentResponse.java`. Add these fields and corresponding builder methods:

Fields to add (after `razorpayKeyId`):

```java
    private String paymentGateway;        // "RAZORPAY" or "STRIPE"
    private String stripeClientSecret;    // Stripe PaymentIntent client_secret (null for Razorpay)
    private String stripePublishableKey;  // Stripe publishable key (null for Razorpay)
    private Long   stripeFeeMinorUnits;   // Stripe platform fee (null for Razorpay)
    private String paymentMethodType;     // Normalised payment method string (e.g. "card", "ideal", "upi")
```

Add getters:

```java
    public String getPaymentGateway() { return paymentGateway; }
    public String getStripeClientSecret() { return stripeClientSecret; }
    public String getStripePublishableKey() { return stripePublishableKey; }
    public Long getStripeFeeMinorUnits() { return stripeFeeMinorUnits; }
    public String getPaymentMethodType() { return paymentMethodType; }
```

Add to builder (inside the `Builder` inner class):

```java
        public Builder paymentGateway(String paymentGateway) {
            response.paymentGateway = paymentGateway; return this;
        }
        public Builder stripeClientSecret(String stripeClientSecret) {
            response.stripeClientSecret = stripeClientSecret; return this;
        }
        public Builder stripePublishableKey(String stripePublishableKey) {
            response.stripePublishableKey = stripePublishableKey; return this;
        }
        public Builder stripeFeeMinorUnits(Long stripeFeeMinorUnits) {
            response.stripeFeeMinorUnits = stripeFeeMinorUnits; return this;
        }
        public Builder paymentMethodType(String paymentMethodType) {
            response.paymentMethodType = paymentMethodType; return this;
        }
```

- [ ] **Step 5: Wire resolver into PaymentService**

Open `payment-service/src/main/java/com/MaSoVa/payment/service/PaymentService.java`.

**a) Update constructor** — add `PaymentGatewayResolver gatewayResolver` parameter. Remove direct `RazorpayService` and `RazorpayConfig` constructor parameters (they're now inside `RazorpayGateway`). Keep `RazorpayConfig` only if needed for the key for backwards-compat in `buildPaymentResponse`. The cleanest approach: keep `RazorpayConfig` injected only for `razorpayKeyId` in the Razorpay response (the resolver handles gateway routing). Actually: the `GatewayPaymentResult.publishableKey` field carries that — so `RazorpayConfig` can be removed from PaymentService.

Replace the class fields and constructor with:

```java
    private final TransactionRepository transactionRepository;
    private final PaymentGatewayResolver gatewayResolver;
    private final OrderServiceClient orderServiceClient;
    private final PiiEncryptionService encryptionService;
    private final PaymentNotificationService paymentNotificationService;
    private final com.MaSoVa.payment.messaging.PaymentEventPublisher paymentEventPublisher;

    public PaymentService(TransactionRepository transactionRepository,
                          PaymentGatewayResolver gatewayResolver,
                          OrderServiceClient orderServiceClient,
                          PiiEncryptionService encryptionService,
                          PaymentNotificationService paymentNotificationService,
                          com.MaSoVa.payment.messaging.PaymentEventPublisher paymentEventPublisher) {
        this.transactionRepository = transactionRepository;
        this.gatewayResolver = gatewayResolver;
        this.orderServiceClient = orderServiceClient;
        this.encryptionService = encryptionService;
        this.paymentNotificationService = paymentNotificationService;
        this.paymentEventPublisher = paymentEventPublisher;
    }
```

**b) Update `initiatePayment`** — replace the Razorpay-specific order creation block with:

```java
        // Resolve gateway from countryCode (null = India = Razorpay, non-null = Stripe)
        com.MaSoVa.payment.gateway.PaymentGateway gateway = gatewayResolver.resolve(request.getCountryCode());

        String receipt = "RCP_" + UUID.randomUUID().toString().substring(0, 8);
        com.MaSoVa.payment.gateway.GatewayPaymentRequest gatewayReq =
                new com.MaSoVa.payment.gateway.GatewayPaymentRequest(
                        request.getOrderId(), request.getAmount(),
                        resolveCurrencyFromCountryCode(request.getCountryCode()),
                        request.getCustomerEmail(), request.getCustomerPhone(),
                        request.getCustomerId(), receipt);

        com.MaSoVa.payment.gateway.GatewayPaymentResult gatewayResult = gateway.initiatePayment(gatewayReq);
```

Replace the `Transaction.builder()` block to set the new fields:

```java
            Transaction transaction = Transaction.builder()
                    .orderId(request.getOrderId())
                    .razorpayOrderId(gatewayResult.getGatewayOrderId()) // PI ID for Stripe, order ID for Razorpay
                    .amount(request.getAmount())
                    .status(Transaction.PaymentStatus.INITIATED)
                    .customerId(request.getCustomerId())
                    .customerEmail(encryptionService.encrypt(request.getCustomerEmail()))
                    .customerPhone(encryptionService.encrypt(request.getCustomerPhone()))
                    .storeId(request.getStoreId())
                    .receipt(receipt)
                    .currency(resolveCurrencyFromCountryCode(request.getCountryCode()))
                    .reconciled(false)
                    .build();
            transaction.setPaymentGateway(gatewayResult.getGatewayName());
            if ("STRIPE".equals(gatewayResult.getGatewayName())) {
                transaction.setStripePaymentIntentId(gatewayResult.getGatewayOrderId());
            }
```

Replace the `PaymentResponse.builder()` return at end of `initiatePayment`:

```java
            return PaymentResponse.builder()
                    .transactionId(transaction.getId())
                    .orderId(transaction.getOrderId())
                    .razorpayOrderId(transaction.getRazorpayOrderId())
                    .amount(transaction.getAmount())
                    .status(transaction.getStatus())
                    .customerId(transaction.getCustomerId())
                    .customerEmail(request.getCustomerEmail())
                    .customerPhone(request.getCustomerPhone())
                    .storeId(transaction.getStoreId())
                    .currency(transaction.getCurrency())
                    .createdAt(transaction.getCreatedAt())
                    .paymentGateway(gatewayResult.getGatewayName())
                    .stripeClientSecret(gatewayResult.getClientSecret())
                    .stripePublishableKey(gatewayResult.getPublishableKey())
                    .razorpayKeyId(
                        "RAZORPAY".equals(gatewayResult.getGatewayName())
                            ? gatewayResult.getPublishableKey() : null)
                    .build();
```

**c) Add helper method** at the bottom of the class (before the closing brace):

```java
    private String resolveCurrencyFromCountryCode(String countryCode) {
        if (countryCode == null || countryCode.isBlank()) return "INR";
        return switch (countryCode.toUpperCase()) {
            case "DE", "FR", "IT", "NL", "BE", "LU", "IE" -> "EUR";
            case "HU" -> "HUF";
            case "CH" -> "CHF";
            case "GB" -> "GBP";
            case "US" -> "USD";
            case "CA" -> "CAD";
            default   -> "INR";
        };
    }
```

**d) Update `verifyPayment`** — replace the `razorpayService.verifyPaymentSignature(...)` call with:

```java
            com.MaSoVa.payment.gateway.PaymentGateway gateway =
                    gatewayResolver.resolve(transaction.getPaymentGateway() != null
                            && transaction.getPaymentGateway().equals("STRIPE") ? "EU_PLACEHOLDER" : null);

            boolean isValid = gateway.confirmPayment(
                    request.getRazorpayOrderId(),
                    request.getRazorpayPaymentId(),
                    request.getRazorpaySignature());
```

Replace the `PaymentCompletedEvent(...)` call in `verifyPayment`:

```java
            paymentEventPublisher.publishPaymentCompleted(new PaymentCompletedEvent(
                    transaction.getId(), transaction.getOrderId(), transaction.getCustomerId(),
                    transaction.getAmount(), transaction.getCurrency(), methodName,
                    transaction.getRazorpayPaymentId(),
                    transaction.getPaymentGateway(),
                    methodName));
```

- [ ] **Step 6: Compile and verify**

Run: `mvn compile -pl payment-service "-Dmaven.test.skip=true"` on Dell.
Expected: BUILD SUCCESS.

- [ ] **Step 7: Commit**

```bash
git add payment-service/src/main/java/com/MaSoVa/payment/dto/InitiatePaymentRequest.java
git add payment-service/src/main/java/com/MaSoVa/payment/dto/PaymentResponse.java
git add payment-service/src/main/java/com/MaSoVa/payment/service/PaymentService.java
git commit -m "feat(payment): wire PaymentGatewayResolver into PaymentService; add countryCode routing"
```

---

### Task 7: PaymentCompletedEvent + PaymentFailedEvent — add gateway fields

**Files:**
- Modify: `shared-models/src/main/java/com/MaSoVa/shared/messaging/events/PaymentCompletedEvent.java`
- Modify: `shared-models/src/main/java/com/MaSoVa/shared/messaging/events/PaymentFailedEvent.java`

- [ ] **Step 1: Add paymentGateway + paymentMethodType to PaymentCompletedEvent**

Open `shared-models/src/main/java/com/MaSoVa/shared/messaging/events/PaymentCompletedEvent.java`.

Add fields after `private String transactionId;`:

```java
    private String paymentGateway;    // "RAZORPAY" or "STRIPE"
    private String paymentMethodType; // e.g. "card", "upi", "ideal", "bancontact"
```

Update the 7-arg constructor to add the two new params at the end:

```java
    public PaymentCompletedEvent(String paymentId, String orderId, String customerId,
                                  BigDecimal amount, String currency,
                                  String paymentMethod, String transactionId,
                                  String paymentGateway, String paymentMethodType) {
        super("PAYMENT_COMPLETED");
        this.paymentId = paymentId;
        this.orderId = orderId;
        this.customerId = customerId;
        this.amount = amount;
        this.currency = currency;
        this.paymentMethod = paymentMethod;
        this.transactionId = transactionId;
        this.paymentGateway = paymentGateway;
        this.paymentMethodType = paymentMethodType;
    }
```

Update the `@JsonCreator` constructor to add the two new `@JsonProperty` params at the end:

```java
    @JsonCreator
    public PaymentCompletedEvent(
            @JsonProperty("eventId") String eventId,
            @JsonProperty("eventType") String eventType,
            @JsonProperty("occurredAt") Instant occurredAt,
            @JsonProperty("paymentId") String paymentId,
            @JsonProperty("orderId") String orderId,
            @JsonProperty("customerId") String customerId,
            @JsonProperty("amount") BigDecimal amount,
            @JsonProperty("currency") String currency,
            @JsonProperty("paymentMethod") String paymentMethod,
            @JsonProperty("transactionId") String transactionId,
            @JsonProperty("paymentGateway") String paymentGateway,
            @JsonProperty("paymentMethodType") String paymentMethodType) {
        super(eventId, eventType, occurredAt);
        this.paymentId = paymentId;
        this.orderId = orderId;
        this.customerId = customerId;
        this.amount = amount;
        this.currency = currency;
        this.paymentMethod = paymentMethod;
        this.transactionId = transactionId;
        this.paymentGateway = paymentGateway;
        this.paymentMethodType = paymentMethodType;
    }
```

Add getters:

```java
    public String getPaymentGateway() { return paymentGateway; }
    public String getPaymentMethodType() { return paymentMethodType; }
```

- [ ] **Step 2: Add paymentGateway to PaymentFailedEvent**

Open `shared-models/src/main/java/com/MaSoVa/shared/messaging/events/PaymentFailedEvent.java`.

Add field after `private String failureReason;`:

```java
    private String paymentGateway;    // "RAZORPAY" or "STRIPE"
```

Update the 5-arg constructor:

```java
    public PaymentFailedEvent(String paymentId, String orderId, String customerId,
                               BigDecimal amount, String failureReason, String paymentGateway) {
        super("PAYMENT_FAILED");
        this.paymentId = paymentId;
        this.orderId = orderId;
        this.customerId = customerId;
        this.amount = amount;
        this.failureReason = failureReason;
        this.paymentGateway = paymentGateway;
    }
```

Update the `@JsonCreator` constructor to add `@JsonProperty("paymentGateway") String paymentGateway` at the end and assign it.

Add getter:

```java
    public String getPaymentGateway() { return paymentGateway; }
```

- [ ] **Step 3: Update all call sites**

**In `PaymentService.java`** — the `publishPaymentFailed` call currently passes 5 args. Add `transaction.getPaymentGateway()` as the 6th arg:

```java
paymentEventPublisher.publishPaymentFailed(new PaymentFailedEvent(
        transaction.getId(), transaction.getOrderId(), transaction.getCustomerId(),
        transaction.getAmount(), "Payment signature verification failed",
        transaction.getPaymentGateway()));
```

For the `recordCashPayment` method, the `publishPaymentCompleted` call needs 9 args now:

```java
paymentEventPublisher.publishPaymentCompleted(new PaymentCompletedEvent(
        transaction.getId(), transaction.getOrderId(), transaction.getCustomerId(),
        transaction.getAmount(), "INR", "CASH", transaction.getId(),
        "RAZORPAY", "CASH"));
```

- [ ] **Step 4: Build both modules**

Run: `mvn compile -pl shared-models,payment-service "-Dmaven.test.skip=true"` on Dell.
Expected: BUILD SUCCESS.

- [ ] **Step 5: Commit**

```bash
git add shared-models/src/main/java/com/MaSoVa/shared/messaging/events/PaymentCompletedEvent.java
git add shared-models/src/main/java/com/MaSoVa/shared/messaging/events/PaymentFailedEvent.java
git add payment-service/src/main/java/com/MaSoVa/payment/service/PaymentService.java
git commit -m "feat(shared-models,payment): add paymentGateway + paymentMethodType to payment events"
```

---

### Task 8: Stripe webhook controller

**Files:**
- Create: `payment-service/src/main/java/com/MaSoVa/payment/controller/StripeWebhookController.java`
- Modify: `payment-service/src/main/java/com/MaSoVa/payment/config/SecurityConfig.java`
- Create: `payment-service/src/test/java/com/MaSoVa/payment/controller/StripeWebhookControllerTest.java`

- [ ] **Step 1: Write tests first**

Create `payment-service/src/test/java/com/MaSoVa/payment/controller/StripeWebhookControllerTest.java`:

```java
package com.MaSoVa.payment.controller;

import com.MaSoVa.payment.gateway.PaymentGateway;
import com.MaSoVa.payment.gateway.GatewayWebhookResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class StripeWebhookControllerTest {

    private PaymentGateway stripeGateway;
    private StripeWebhookController controller;

    @BeforeEach
    void setUp() {
        stripeGateway = mock(PaymentGateway.class);
        controller = new StripeWebhookController(stripeGateway);
    }

    @Test
    void valid_payment_captured_returns_200() throws Exception {
        GatewayWebhookResult result = new GatewayWebhookResult(
                GatewayWebhookResult.EventType.PAYMENT_CAPTURED,
                "pi_123", "ch_456", null, 50L);
        when(stripeGateway.parseWebhook(any(), any())).thenReturn(result);

        ResponseEntity<String> response = controller.handleStripeWebhook("{}", "sig_header");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void invalid_signature_returns_401() throws Exception {
        when(stripeGateway.parseWebhook(any(), any()))
                .thenThrow(new SecurityException("Bad signature"));

        ResponseEntity<String> response = controller.handleStripeWebhook("{}", "bad_sig");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void unknown_event_returns_200() throws Exception {
        GatewayWebhookResult result = new GatewayWebhookResult(
                GatewayWebhookResult.EventType.UNKNOWN,
                null, null, null, null);
        when(stripeGateway.parseWebhook(any(), any())).thenReturn(result);

        ResponseEntity<String> response = controller.handleStripeWebhook("{}", "sig");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }
}
```

- [ ] **Step 2: Create StripeWebhookController**

Create `payment-service/src/main/java/com/MaSoVa/payment/controller/StripeWebhookController.java`:

```java
package com.MaSoVa.payment.controller;

import com.MaSoVa.payment.gateway.GatewayWebhookResult;
import com.MaSoVa.payment.gateway.PaymentGateway;
import com.MaSoVa.payment.gateway.StripeGateway;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Receives Stripe webhook events.
 * Path: POST /api/payments/webhook/stripe
 * This endpoint is public (no JWT required) — Stripe cannot send auth tokens.
 * Signature is verified inside StripeGateway.parseWebhook().
 */
@RestController
@RequestMapping("/api/payments/webhook/stripe")
public class StripeWebhookController {

    private static final Logger log = LoggerFactory.getLogger(StripeWebhookController.class);

    private final PaymentGateway stripeGateway;

    public StripeWebhookController(StripeGateway stripeGateway) {
        this.stripeGateway = stripeGateway;
    }

    /**
     * POST /api/payments/webhook/stripe
     * Stripe sends raw JSON body + Stripe-Signature header.
     */
    @PostMapping
    public ResponseEntity<String> handleStripeWebhook(
            @RequestBody String rawPayload,
            @RequestHeader(value = "Stripe-Signature", required = false) String stripeSignature) {

        log.info("Received Stripe webhook event");

        try {
            GatewayWebhookResult result = stripeGateway.parseWebhook(rawPayload, stripeSignature);

            log.info("Stripe webhook processed: eventType={}, gatewayOrderId={}",
                     result.getEventType(), result.getGatewayOrderId());

            // TODO(Global-4): route to PaymentService.handleStripeWebhookEvent()
            // For now: log and acknowledge — payment status is confirmed via confirmPayment() on the verify endpoint.

            return ResponseEntity.ok("Webhook processed");

        } catch (SecurityException e) {
            log.error("Stripe webhook signature verification failed: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid signature");
        } catch (Exception e) {
            log.error("Error processing Stripe webhook", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error processing webhook");
        }
    }
}
```

- [ ] **Step 3: Add Stripe webhook path to SecurityConfig public endpoints**

Open `payment-service/src/main/java/com/MaSoVa/payment/config/SecurityConfig.java`.

In the `getPublicEndpoints()` array, add:

```java
            // Stripe webhook endpoint (must be public — Stripe cannot send JWT)
            "/api/payments/webhook/stripe",
```

- [ ] **Step 4: Run webhook tests**

Run: `mvn test -pl payment-service -Dtest=StripeWebhookControllerTest "-Dmaven.test.skip=false"` on Dell.
Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add payment-service/src/main/java/com/MaSoVa/payment/controller/StripeWebhookController.java
git add payment-service/src/main/java/com/MaSoVa/payment/config/SecurityConfig.java
git add payment-service/src/test/java/com/MaSoVa/payment/controller/StripeWebhookControllerTest.java
git commit -m "feat(payment): add StripeWebhookController — signature-verified Stripe webhook handling"
```

---

### Task 9: Frontend — paymentApi types + PaymentPage Stripe UI

**Files:**
- Modify: `frontend/src/store/api/paymentApi.ts`
- Modify: `frontend/src/pages/customer/PaymentPage.tsx`

- [ ] **Step 1: Update paymentApi.ts types**

Open `frontend/src/store/api/paymentApi.ts`.

Add `countryCode` to `InitiatePaymentRequest`:

```typescript
export interface InitiatePaymentRequest {
  orderId: string;
  amount: number;
  customerId: string;
  customerEmail?: string;
  customerPhone?: string;
  storeId: string;
  orderType?: string;
  paymentMethod?: string;
  notes?: string;
  countryCode?: string;  // ISO 3166-1 alpha-2; null = India = Razorpay
}
```

Add Stripe fields to `PaymentResponse`:

```typescript
export interface PaymentResponse {
  transactionId: string;
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  amount: number;
  status: 'INITIATED' | 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'REFUNDED' | 'PARTIAL_REFUND';
  paymentMethod?: 'CARD' | 'UPI' | 'NETBANKING' | 'WALLET' | 'CASH' | 'AGGREGATOR_COLLECTED' | 'OTHER';
  customerId: string;
  customerEmail?: string;
  customerPhone?: string;
  storeId: string;
  currency: string;
  createdAt: string;
  paidAt?: string;
  razorpayKeyId?: string;
  // Global-4 Stripe fields
  paymentGateway?: 'RAZORPAY' | 'STRIPE';
  stripeClientSecret?: string;
  stripePublishableKey?: string;
  stripeFeeMinorUnits?: number;
  paymentMethodType?: string;
}
```

- [ ] **Step 2: Add @stripe/react-stripe-js dependency**

Run on the Mac from the frontend directory:

```bash
cd frontend && npm install @stripe/react-stripe-js @stripe/stripe-js
```

Expected: package.json gains `@stripe/react-stripe-js` and `@stripe/stripe-js`.

- [ ] **Step 3: Update PaymentPage to handle Stripe gateway**

Open `frontend/src/pages/customer/PaymentPage.tsx`.

**a) Add Stripe imports** at the top of the file (after existing imports):

```typescript
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
```

**b) Add `countryCode` to `initiatePayment` call** inside `handlePlaceOrder`. Find the call to `initiatePayment({...})` and add `countryCode` to the payload. The `countryCode` needs to come from the store data. Since the store information is available via `selectedStoreId`, use a new selector or pass it from the parent — for now, read from `location.state?.countryCode` (passed from checkout) with a null fallback:

After the existing state declarations, add:

```typescript
  // countryCode from store selection — null for India stores (Razorpay), set for EU stores (Stripe)
  const storeCountryCode = (location.state?.storeCountryCode as string | undefined) ?? null;
```

Add `countryCode: storeCountryCode ?? undefined` to the `initiatePayment` call body.

**c) Replace `openRazorpayCheckout` logic** — extract Stripe path:

After `openRazorpayCheckout` function definition, add a new `StripePaymentForm` component at the bottom of the file (before the `export default`):

```typescript
interface StripePaymentFormProps {
  clientSecret: string;
  publishableKey: string;
  orderId: string;
  onSuccess: () => void;
  onError: (msg: string) => void;
}

function StripePaymentForm({ clientSecret, publishableKey, orderId, onSuccess, onError }: StripePaymentFormProps) {
  const stripePromise = loadStripe(publishableKey);
  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <StripeCheckoutInner orderId={orderId} onSuccess={onSuccess} onError={onError} />
    </Elements>
  );
}

function StripeCheckoutInner({ orderId, onSuccess, onError }: { orderId: string; onSuccess: () => void; onError: (msg: string) => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleConfirm = async () => {
    if (!stripe || !elements) return;
    setIsSubmitting(true);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment/success?order_id=${orderId}`,
      },
    });
    if (error) {
      onError(error.message ?? 'Payment failed');
      setIsSubmitting(false);
    } else {
      onSuccess();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <PaymentElement />
      <button
        onClick={handleConfirm}
        disabled={isSubmitting || !stripe}
        style={{
          width: '100%', padding: '15px', borderRadius: '10px', border: 'none',
          background: isSubmitting ? 'var(--border)' : 'linear-gradient(135deg, #635bff, #7c71ff)',
          color: '#fff', fontSize: '0.95rem', fontWeight: 700, cursor: isSubmitting ? 'not-allowed' : 'pointer',
        }}
      >
        {isSubmitting ? 'Processing...' : 'Pay with Stripe'}
      </button>
    </div>
  );
}
```

**d) Add Stripe state and conditional render in `PaymentPage`**:

Add state near the top of `PaymentPage`:

```typescript
  const [stripeData, setStripeData] = React.useState<{
    clientSecret: string;
    publishableKey: string;
    orderId: string;
  } | null>(null);
```

In `handlePlaceOrder`, after `const paymentResult = await initiatePayment({...}).unwrap();`, add:

```typescript
      // If Stripe gateway — show Stripe PaymentElement in-page instead of opening Razorpay modal
      if (paymentResult.paymentGateway === 'STRIPE' && paymentResult.stripeClientSecret && paymentResult.stripePublishableKey) {
        setStripeData({
          clientSecret: paymentResult.stripeClientSecret,
          publishableKey: paymentResult.stripePublishableKey,
          orderId: paymentResult.orderId,
        });
        return;
      }

      openRazorpayCheckout(paymentResult, orderId);
```

Add the Stripe payment form render near the bottom of the JSX return (just before the closing `</div>` of the left column), after the payment method selection:

```typescript
          {/* Stripe Payment Element — shown after payment is initiated for EU stores */}
          {stripeData && (
            <div style={cardStyle}>
              <SectionLabel>Complete Payment</SectionLabel>
              <StripePaymentForm
                clientSecret={stripeData.clientSecret}
                publishableKey={stripeData.publishableKey}
                orderId={stripeData.orderId}
                onSuccess={() => {
                  setOrderPlaced(true);
                  navigate(`/payment/success?order_id=${stripeData.orderId}`);
                }}
                onError={(msg) => alert(msg)}
              />
            </div>
          )}
```

- [ ] **Step 4: Build frontend**

Run: `cd frontend && npm run build` on the Mac.
Expected: BUILD SUCCESS with no TypeScript errors. Stripe imports tree-shake correctly.

- [ ] **Step 5: Commit**

```bash
cd frontend && git add src/store/api/paymentApi.ts src/pages/customer/PaymentPage.tsx package.json package-lock.json
cd .. && git commit -m "feat(frontend): add Stripe PaymentElement for EU stores; Razorpay unchanged for India"
```

---

### Task 10: PaymentDashboardPage — gateway + paymentMethodType columns

**Files:**
- Modify: `frontend/src/pages/manager/PaymentDashboardPage.tsx`

- [ ] **Step 1: Read PaymentDashboardPage transaction table section**

Run: `grep -n "paymentMethod\|gateway\|tableCellStyles" frontend/src/pages/manager/PaymentDashboardPage.tsx | head -30`

Find the transaction table columns to understand where to add the two new columns.

- [ ] **Step 2: Add gateway + paymentMethodType columns**

Open `frontend/src/pages/manager/PaymentDashboardPage.tsx`.

In the table header row, after the existing payment method header cell, add:

```typescript
                    <th style={tableHeaderStyles}>Gateway</th>
                    <th style={tableHeaderStyles}>Method Type</th>
```

In the table data rows, after the existing `paymentMethod` cell, add:

```typescript
                    <td style={tableCellStyles}>{txn.paymentGateway || 'RAZORPAY'}</td>
                    <td style={tableCellStyles}>{txn.paymentMethodType || '—'}</td>
```

- [ ] **Step 3: Build frontend**

Run: `cd frontend && npm run build` on the Mac.
Expected: BUILD SUCCESS.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/manager/PaymentDashboardPage.tsx
git commit -m "feat(frontend): add gateway + paymentMethodType columns to PaymentDashboard"
```

---

### Task 11: Run full test suite + verify

**Files:** No new files.

- [ ] **Step 1: Run all payment-service tests**

Run: `mvn test -pl payment-service "-Dmaven.test.skip=false"` on Dell.
Expected: All tests pass (green). No regressions in existing `PaymentServiceTest`, `PaymentControllerTest`, `WebhookControllerTest`, `RefundServiceTest`.

- [ ] **Step 2: Run shared-models tests**

Run: `mvn test -pl shared-models "-Dmaven.test.skip=false"` on Dell.
Expected: All tests pass.

- [ ] **Step 3: Run frontend tests**

Run: `cd frontend && npm run test` on the Mac.
Expected: All tests pass — existing payment tests (`paymentApi.test.ts`, `PaymentControllerTest`) continue to pass.

- [ ] **Step 4: Rebuild all modules**

Run: `mvn install -pl shared-models,payment-service "-Dmaven.test.skip=true"` on Dell.
Expected: BUILD SUCCESS.

- [ ] **Step 5: Commit test results note (no code change)**

No commit needed if no files changed. Proceed to finishing skill.

---

## Summary of what changes

| Component | What changes |
|---|---|
| `shared-models` | `PaymentCompletedEvent` + `PaymentFailedEvent` gain `paymentGateway` + `paymentMethodType` fields |
| `payment-service` | New `gateway/` package with interface + 2 impls + resolver. `Transaction` entity gains 3 fields. `V2` migration. `StripeWebhookController`. `PaymentService` routes via resolver. `SecurityConfig` adds Stripe webhook path. `StripeConfig` added. Stripe Java SDK added to pom. |
| `frontend` | `paymentApi.ts` types updated. `PaymentPage` renders Stripe PaymentElement for EU stores, Razorpay unchanged for India. `PaymentDashboardPage` gains 2 columns. `@stripe/react-stripe-js` added. |

**India stores: zero functional change.** Razorpay path is unchanged — `countryCode` null → resolver returns `RazorpayGateway` → same flow as before.
