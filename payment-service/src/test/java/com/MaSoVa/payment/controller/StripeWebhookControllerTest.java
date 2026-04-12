package com.MaSoVa.payment.controller;

import com.MaSoVa.payment.gateway.GatewayWebhookResult;
import com.MaSoVa.payment.gateway.PaymentGateway;
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
