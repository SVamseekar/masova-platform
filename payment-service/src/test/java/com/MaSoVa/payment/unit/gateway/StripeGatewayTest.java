package com.MaSoVa.payment.unit.gateway;

import com.MaSoVa.payment.gateway.StripeGateway;
import com.MaSoVa.payment.config.StripeConfig;
import com.stripe.model.PaymentIntent;
import com.stripe.net.RequestOptions;
import com.stripe.param.RefundCreateParams;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;

import org.junit.jupiter.api.Disabled;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
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
    @Disabled("Requires real Stripe test key — confirmPayment calls PaymentIntent.retrieve() which needs network access")
    void confirmPayment_stripe_always_true_signature_is_null() throws Exception {
        // Stripe PaymentElement confirms on the frontend; backend just records.
        // confirmPayment with null signature (Stripe webhook flow) must return true.
        assertThat(gateway.confirmPayment("pi_123", "ch_456", null)).isTrue();
    }

    @Test
    void refund_passes_idempotency_key_to_stripe_create() throws Exception {
        PaymentIntent intent = mock(PaymentIntent.class);
        when(intent.getCurrency()).thenReturn("eur");
        com.stripe.model.Refund created = mock(com.stripe.model.Refund.class);
        when(created.getId()).thenReturn("re_1");

        try (MockedStatic<PaymentIntent> intents = mockStatic(PaymentIntent.class);
             MockedStatic<com.stripe.model.Refund> refunds = mockStatic(com.stripe.model.Refund.class)) {
            intents.when(() -> PaymentIntent.retrieve("pi_1")).thenReturn(intent);
            refunds.when(() -> com.stripe.model.Refund.create(any(RefundCreateParams.class), any(RequestOptions.class)))
                    .thenReturn(created);

            String id = gateway.refund("pi_1", new BigDecimal("10.00"), "normal", "rfnd_stable");

            assertThat(id).isEqualTo("re_1");
            refunds.verify(() -> com.stripe.model.Refund.create(
                    any(RefundCreateParams.class),
                    argThat(opts -> "rfnd_stable".equals(opts.getIdempotencyKey()))));
        }
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

    @Test
    void parseWebhook_reads_event_whose_api_version_differs_from_the_sdk() throws Exception {
        // A webhook endpoint left on an older API version after an SDK upgrade must still yield the payment.
        String payload = """
                {"id":"evt_1","object":"event","api_version":"2020-08-27","type":"payment_intent.succeeded",
                 "data":{"object":{"id":"pi_123","object":"payment_intent","latest_charge":"ch_456"}}}
                """;
        long timestamp = java.time.Instant.now().getEpochSecond();
        javax.crypto.Mac mac = javax.crypto.Mac.getInstance("HmacSHA256");
        mac.init(new javax.crypto.spec.SecretKeySpec("whsec_test".getBytes(java.nio.charset.StandardCharsets.UTF_8), "HmacSHA256"));
        byte[] digest = mac.doFinal((timestamp + "." + payload).getBytes(java.nio.charset.StandardCharsets.UTF_8));
        String signature = "t=" + timestamp + ",v1=" + java.util.HexFormat.of().formatHex(digest);

        var result = gateway.parseWebhook(payload, signature);

        assertThat(result.getEventType()).isEqualTo(com.MaSoVa.payment.gateway.GatewayWebhookResult.EventType.PAYMENT_CAPTURED);
        assertThat(result.getGatewayOrderId()).isEqualTo("pi_123");
        assertThat(result.getGatewayPaymentId()).isEqualTo("ch_456");
    }
}
