package com.MaSoVa.payment.unit.controller;

import com.MaSoVa.payment.controller.StripeWebhookController;
import com.MaSoVa.payment.gateway.GatewayWebhookResult;
import com.MaSoVa.payment.gateway.PaymentGateway;
import com.MaSoVa.shared.test.BaseServiceTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.http.converter.StringHttpMessageConverter;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("StripeWebhookController Unit Tests")
class StripeWebhookControllerTest extends BaseServiceTest {

    @Mock private PaymentGateway stripeGateway;
    @InjectMocks private StripeWebhookController stripeWebhookController;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(stripeWebhookController)
            .setMessageConverters(new StringHttpMessageConverter(), new MappingJackson2HttpMessageConverter())
            .build();
    }

    @Test
    @DisplayName("POST /api/payments/webhook/stripe returns 200 with valid signature")
    void handleStripeWebhook_returns200OnSuccess() throws Exception {
        GatewayWebhookResult result = new GatewayWebhookResult(
            GatewayWebhookResult.EventType.PAYMENT_CAPTURED, "pi_test_123", "ch_test_123", null, null);
        when(stripeGateway.parseWebhook(any(), any())).thenReturn(result);

        mockMvc.perform(post("/api/payments/webhook/stripe")
                .contentType(org.springframework.http.MediaType.TEXT_PLAIN)
                .header("Stripe-Signature", "t=12345,v1=abc123")
                .content("{\"type\":\"payment_intent.succeeded\"}"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /api/payments/webhook/stripe returns 500 on parse error")
    void handleStripeWebhook_returns500OnError() throws Exception {
        when(stripeGateway.parseWebhook(any(), any()))
            .thenThrow(new RuntimeException("Error processing"));

        mockMvc.perform(post("/api/payments/webhook/stripe")
                .contentType(org.springframework.http.MediaType.TEXT_PLAIN)
                .header("Stripe-Signature", "invalid-sig")
                .content("{\"type\":\"payment_intent.succeeded\"}"))
            .andExpect(status().isInternalServerError());
    }
}
