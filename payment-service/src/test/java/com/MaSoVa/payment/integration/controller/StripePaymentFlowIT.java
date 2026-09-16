package com.MaSoVa.payment.integration.controller;

import com.MaSoVa.payment.gateway.GatewayPaymentResult;
import com.MaSoVa.payment.gateway.GatewayWebhookResult;
import com.MaSoVa.payment.gateway.StripeGateway;
import com.MaSoVa.payment.service.RazorpayService;
import com.MaSoVa.shared.test.BaseFullIntegrationTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Stripe payment flow integration tests (MockMvc + Testcontainers).
 * Uses mocked StripeGateway — no live Stripe API keys required in CI.
 */
@DisplayName("Stripe payment flow integration tests")
class StripePaymentFlowIT extends BaseFullIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private StripeGateway stripeGateway;

    @MockBean
    private RazorpayService razorpayService;

    @Test
    @WithMockUser(roles = "CUSTOMER")
    @DisplayName("POST /api/payments/initiate routes DE store to Stripe with EUR")
    void initiateGermany_returnsStripePaymentIntent() throws Exception {
        when(stripeGateway.initiatePayment(any())).thenReturn(
                new GatewayPaymentResult("STRIPE", "pi_test_de", "pi_test_de_secret", "pk_test_de"));

        String body = """
                {
                  "orderId": "ord-stripe-de-1",
                  "amount": 42.50,
                  "customerId": "cust-1",
                  "customerEmail": "stripe-it@masova.com",
                  "customerPhone": "+49123456789",
                  "storeId": "store-de-1",
                  "orderType": "DELIVERY",
                  "paymentMethod": "CARD",
                  "countryCode": "DE",
                  "currency": "EUR"
                }
                """;

        mockMvc.perform(post("/api/payments/initiate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body)
                        .header("X-User-Type", "CUSTOMER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paymentGateway").value("STRIPE"))
                .andExpect(jsonPath("$.currency").value("EUR"))
                .andExpect(jsonPath("$.stripeClientSecret").value("pi_test_de_secret"))
                .andExpect(jsonPath("$.stripePublishableKey").value("pk_test_de"))
                .andExpect(jsonPath("$.razorpayKeyId").isEmpty());
    }

    @Test
    @WithMockUser(roles = "CUSTOMER")
    @DisplayName("POST /api/payments/initiate resolves HUF for Hungary when currency omitted")
    void initiateHungary_resolvesHufFromCountry() throws Exception {
        when(stripeGateway.initiatePayment(any())).thenAnswer(invocation -> {
            var req = invocation.getArgument(0, com.MaSoVa.payment.gateway.GatewayPaymentRequest.class);
            assertThat(req.getCurrency()).isEqualTo("HUF");
            assertThat(req.getAmount()).isEqualByComparingTo(new BigDecimal("5000"));
            return new GatewayPaymentResult("STRIPE", "pi_test_hu", "pi_test_hu_secret", "pk_test_hu");
        });

        String body = """
                {
                  "orderId": "ord-stripe-hu-1",
                  "amount": 5000,
                  "customerId": "cust-2",
                  "customerEmail": "hu@masova.com",
                  "customerPhone": "+3612345678",
                  "storeId": "store-hu-1",
                  "orderType": "TAKEAWAY",
                  "paymentMethod": "CARD",
                  "countryCode": "HU"
                }
                """;

        mockMvc.perform(post("/api/payments/initiate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body)
                        .header("X-User-Type", "CUSTOMER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paymentGateway").value("STRIPE"))
                .andExpect(jsonPath("$.currency").value("HUF"));
    }

    @Test
    @DisplayName("POST /api/payments/webhook/stripe rejects invalid signature with 401")
    void stripeWebhook_invalidSignature_returns401() throws Exception {
        when(stripeGateway.parseWebhook(anyString(), anyString()))
                .thenThrow(new SecurityException("Invalid Stripe webhook signature"));

        mockMvc.perform(post("/api/payments/webhook/stripe")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"type\":\"payment_intent.succeeded\"}")
                        .header("Stripe-Signature", "invalid"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /api/payments/webhook/stripe accepts valid webhook payload")
    void stripeWebhook_validPayload_returns200() throws Exception {
        when(stripeGateway.parseWebhook(anyString(), anyString())).thenReturn(
                new GatewayWebhookResult(
                        GatewayWebhookResult.EventType.PAYMENT_CAPTURED,
                        "pi_unknown_it",
                        "ch_unknown_it",
                        null,
                        100L,
                        "card"));

        mockMvc.perform(post("/api/payments/webhook/stripe")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"type\":\"payment_intent.succeeded\"}")
                        .header("Stripe-Signature", "t=1,v1=test"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "MANAGER")
    @DisplayName("POST /api/payments/refund executes Stripe refund for SUCCESS DE transaction")
    void refundGermany_usesStripeGateway() throws Exception {
        when(stripeGateway.initiatePayment(any())).thenReturn(
                new GatewayPaymentResult("STRIPE", "pi_refund_de", "pi_refund_de_secret", "pk_test_de"));
        when(stripeGateway.getGatewayName()).thenReturn("STRIPE");
        when(stripeGateway.refund(anyString(), any(), anyString())).thenReturn("re_test_de_1");

        String initiateBody = """
                {
                  "orderId": "ord-stripe-refund-1",
                  "amount": 30.00,
                  "customerId": "cust-ref",
                  "customerEmail": "ref@masova.com",
                  "customerPhone": "+49111111111",
                  "storeId": "DOM001",
                  "orderType": "DELIVERY",
                  "paymentMethod": "CARD",
                  "countryCode": "DE",
                  "currency": "EUR"
                }
                """;

        String initiateJson = mockMvc.perform(post("/api/payments/initiate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(initiateBody)
                        .header("X-User-Type", "CUSTOMER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paymentGateway").value("STRIPE"))
                .andReturn().getResponse().getContentAsString();

        // Mark SUCCESS via webhook (confirm path)
        when(stripeGateway.parseWebhook(anyString(), anyString())).thenReturn(
                new GatewayWebhookResult(
                        GatewayWebhookResult.EventType.PAYMENT_CAPTURED,
                        "pi_refund_de",
                        "ch_refund_de",
                        null,
                        80L,
                        "card"));
        mockMvc.perform(post("/api/payments/webhook/stripe")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"type\":\"payment_intent.succeeded\"}")
                        .header("Stripe-Signature", "t=1,v1=ok"))
                .andExpect(status().isOk());

        // Extract transactionId from initiate response (simple parse)
        String txnId = initiateJson.replaceAll("(?s).*\"transactionId\"\\s*:\\s*\"([^\"]+)\".*", "$1");

        String refundBody = """
                {
                  "transactionId": "%s",
                  "amount": 10.00,
                  "type": "PARTIAL",
                  "reason": "IT partial refund",
                  "initiatedBy": "manager-it"
                }
                """.formatted(txnId);

        mockMvc.perform(post("/api/payments/refund")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(refundBody)
                        .header("X-User-Type", "MANAGER")
                        .header("X-Selected-Store-Id", "DOM001"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PROCESSED"))
                .andExpect(jsonPath("$.razorpayRefundId").value("re_test_de_1"))
                .andExpect(jsonPath("$.amount").value(10.00));
    }
}