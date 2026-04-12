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
