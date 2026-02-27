package com.MaSoVa.payment.controller;

import com.MaSoVa.payment.config.RazorpayConfig;
import com.MaSoVa.payment.service.PaymentService;
import com.MaSoVa.payment.service.RazorpayService;
import com.MaSoVa.payment.service.RefundService;
import org.json.JSONObject;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.bean.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(WebhookController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("WebhookController Integration Tests")
class WebhookControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private RazorpayService razorpayService;

    @MockBean
    private PaymentService paymentService;

    @MockBean
    private RefundService refundService;

    @MockBean
    private RazorpayConfig razorpayConfig;

    @Nested
    @DisplayName("POST /api/payments/webhook")
    class HandleWebhookTests {

        @Test
        @DisplayName("Should return 401 when webhook signature is invalid")
        void shouldReturn401WhenSignatureInvalid() throws Exception {
            // Given
            String payload = buildWebhookPayload("payment.captured");
            when(razorpayConfig.getWebhookSecret()).thenReturn("webhook_secret");
            when(razorpayService.verifyWebhookSignature(payload, "invalid_sig", "webhook_secret"))
                    .thenReturn(false);

            // When / Then
            mockMvc.perform(post("/api/payments/webhook")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(payload)
                            .header("X-Razorpay-Signature", "invalid_sig"))
                    .andExpect(status().isUnauthorized())
                    .andExpect(content().string("Invalid signature"));
        }

        @Test
        @DisplayName("Should return 200 and process payment.captured event")
        void shouldProcessPaymentCapturedEvent() throws Exception {
            // Given
            String payload = buildPaymentCapturedPayload();
            when(razorpayConfig.getWebhookSecret()).thenReturn("webhook_secret");
            when(razorpayService.verifyWebhookSignature(payload, "valid_sig", "webhook_secret"))
                    .thenReturn(true);

            // When / Then
            mockMvc.perform(post("/api/payments/webhook")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(payload)
                            .header("X-Razorpay-Signature", "valid_sig"))
                    .andExpect(status().isOk())
                    .andExpect(content().string("Webhook processed successfully"));
        }

        @Test
        @DisplayName("Should return 200 and process refund.processed event")
        void shouldProcessRefundProcessedEvent() throws Exception {
            // Given
            String payload = buildRefundProcessedPayload();
            when(razorpayConfig.getWebhookSecret()).thenReturn("webhook_secret");
            when(razorpayService.verifyWebhookSignature(payload, "valid_sig", "webhook_secret"))
                    .thenReturn(true);

            // When / Then
            mockMvc.perform(post("/api/payments/webhook")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(payload)
                            .header("X-Razorpay-Signature", "valid_sig"))
                    .andExpect(status().isOk())
                    .andExpect(content().string("Webhook processed successfully"));

            verify(refundService).updateRefundStatus("rfnd_webhook_001", "processed");
        }

        @Test
        @DisplayName("Should return 200 and process refund.failed event")
        void shouldProcessRefundFailedEvent() throws Exception {
            // Given
            String payload = buildRefundFailedPayload();
            when(razorpayConfig.getWebhookSecret()).thenReturn("webhook_secret");
            when(razorpayService.verifyWebhookSignature(payload, "valid_sig", "webhook_secret"))
                    .thenReturn(true);

            // When / Then
            mockMvc.perform(post("/api/payments/webhook")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(payload)
                            .header("X-Razorpay-Signature", "valid_sig"))
                    .andExpect(status().isOk());

            verify(refundService).updateRefundStatus("rfnd_fail_001", "failed");
        }

        @Test
        @DisplayName("Should return 200 for unhandled webhook event type")
        void shouldReturn200ForUnhandledEventType() throws Exception {
            // Given
            String payload = buildWebhookPayload("subscription.created");
            when(razorpayConfig.getWebhookSecret()).thenReturn("webhook_secret");
            when(razorpayService.verifyWebhookSignature(payload, "valid_sig", "webhook_secret"))
                    .thenReturn(true);

            // When / Then
            mockMvc.perform(post("/api/payments/webhook")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(payload)
                            .header("X-Razorpay-Signature", "valid_sig"))
                    .andExpect(status().isOk())
                    .andExpect(content().string("Webhook processed successfully"));

            verify(refundService, never()).updateRefundStatus(anyString(), anyString());
        }

        @Test
        @DisplayName("Should return 200 and process order.paid event")
        void shouldProcessOrderPaidEvent() throws Exception {
            // Given
            String payload = buildOrderPaidPayload();
            when(razorpayConfig.getWebhookSecret()).thenReturn("webhook_secret");
            when(razorpayService.verifyWebhookSignature(payload, "valid_sig", "webhook_secret"))
                    .thenReturn(true);

            // When / Then
            mockMvc.perform(post("/api/payments/webhook")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(payload)
                            .header("X-Razorpay-Signature", "valid_sig"))
                    .andExpect(status().isOk())
                    .andExpect(content().string("Webhook processed successfully"));
        }

        @Test
        @DisplayName("Should return 500 when exception occurs during webhook processing")
        void shouldReturn500OnProcessingException() throws Exception {
            // Given - malformed JSON that will fail during parsing after signature check
            String invalidPayload = "not-valid-json";
            when(razorpayConfig.getWebhookSecret()).thenReturn("webhook_secret");
            when(razorpayService.verifyWebhookSignature(invalidPayload, "valid_sig", "webhook_secret"))
                    .thenReturn(true);

            // When / Then
            mockMvc.perform(post("/api/payments/webhook")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(invalidPayload)
                            .header("X-Razorpay-Signature", "valid_sig"))
                    .andExpect(status().isInternalServerError())
                    .andExpect(content().string("Error processing webhook"));
        }
    }

    // --- Helper methods for building webhook payloads ---

    private String buildWebhookPayload(String event) {
        JSONObject payload = new JSONObject();
        payload.put("event", event);
        return payload.toString();
    }

    private String buildPaymentCapturedPayload() {
        JSONObject entity = new JSONObject();
        entity.put("id", "pay_webhook_001");
        entity.put("order_id", "order_razorpay_001");
        entity.put("status", "captured");

        JSONObject payment = new JSONObject();
        payment.put("entity", entity);

        JSONObject payloadInner = new JSONObject();
        payloadInner.put("payment", payment);

        JSONObject webhook = new JSONObject();
        webhook.put("event", "payment.captured");
        webhook.put("payload", payloadInner);

        return webhook.toString();
    }

    private String buildRefundProcessedPayload() {
        JSONObject entity = new JSONObject();
        entity.put("id", "rfnd_webhook_001");
        entity.put("payment_id", "pay_razorpay_001");
        entity.put("status", "processed");

        JSONObject refund = new JSONObject();
        refund.put("entity", entity);

        JSONObject payloadInner = new JSONObject();
        payloadInner.put("refund", refund);

        JSONObject webhook = new JSONObject();
        webhook.put("event", "refund.processed");
        webhook.put("payload", payloadInner);

        return webhook.toString();
    }

    private String buildRefundFailedPayload() {
        JSONObject entity = new JSONObject();
        entity.put("id", "rfnd_fail_001");
        entity.put("payment_id", "pay_razorpay_001");
        entity.put("status", "failed");

        JSONObject refund = new JSONObject();
        refund.put("entity", entity);

        JSONObject payloadInner = new JSONObject();
        payloadInner.put("refund", refund);

        JSONObject webhook = new JSONObject();
        webhook.put("event", "refund.failed");
        webhook.put("payload", payloadInner);

        return webhook.toString();
    }

    private String buildOrderPaidPayload() {
        JSONObject entity = new JSONObject();
        entity.put("id", "order_razorpay_001");
        entity.put("status", "paid");

        JSONObject order = new JSONObject();
        order.put("entity", entity);

        JSONObject payloadInner = new JSONObject();
        payloadInner.put("order", order);

        JSONObject webhook = new JSONObject();
        webhook.put("event", "order.paid");
        webhook.put("payload", payloadInner);

        return webhook.toString();
    }
}
