package com.MaSoVa.payment.unit.controller;

import com.MaSoVa.payment.config.RazorpayConfig;
import com.MaSoVa.payment.controller.WebhookController;
import com.MaSoVa.payment.service.RazorpayService;
import com.MaSoVa.payment.service.RefundService;
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

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("WebhookController Unit Tests")
class WebhookControllerTest extends BaseServiceTest {

    @Mock private RazorpayService razorpayService;
    @Mock private RefundService refundService;
    @Mock private RazorpayConfig razorpayConfig;

    @InjectMocks private WebhookController webhookController;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(webhookController)
            .setMessageConverters(new StringHttpMessageConverter(), new MappingJackson2HttpMessageConverter())
            .build();
    }

    @Test
    @DisplayName("POST /api/payments/webhook returns 401 with invalid signature")
    void handleWebhook_returns401OnInvalidSignature() throws Exception {
        when(razorpayConfig.getWebhookSecret()).thenReturn("secret");
        when(razorpayService.verifyWebhookSignature(anyString(), anyString(), anyString())).thenReturn(false);

        mockMvc.perform(post("/api/payments/webhook")
                .contentType(MediaType.APPLICATION_JSON)
                .header("X-Razorpay-Signature", "bad-signature")
                .content("{\"event\":\"payment.captured\",\"payload\":{}}"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /api/payments/webhook returns 200 for payment.captured event")
    void handleWebhook_paymentCaptured_returns200() throws Exception {
        when(razorpayConfig.getWebhookSecret()).thenReturn("secret");
        when(razorpayService.verifyWebhookSignature(anyString(), anyString(), anyString())).thenReturn(true);

        String payload = "{\"event\":\"payment.captured\",\"payload\":{\"payment\":{\"entity\":{\"id\":\"pay_123\",\"order_id\":\"order_123\",\"status\":\"captured\"}}}}";

        mockMvc.perform(post("/api/payments/webhook")
                .contentType(MediaType.APPLICATION_JSON)
                .header("X-Razorpay-Signature", "valid-sig")
                .content(payload))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /api/payments/webhook returns 200 for payment.failed event")
    void handleWebhook_paymentFailed_returns200() throws Exception {
        when(razorpayConfig.getWebhookSecret()).thenReturn("secret");
        when(razorpayService.verifyWebhookSignature(anyString(), anyString(), anyString())).thenReturn(true);

        String payload = "{\"event\":\"payment.failed\",\"payload\":{\"payment\":{\"entity\":{\"id\":\"pay_123\",\"order_id\":\"order_123\",\"error_code\":\"BAD_REQUEST_ERROR\",\"error_description\":\"Declined\"}}}}";

        mockMvc.perform(post("/api/payments/webhook")
                .contentType(MediaType.APPLICATION_JSON)
                .header("X-Razorpay-Signature", "valid-sig")
                .content(payload))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /api/payments/webhook returns 200 for refund.processed event")
    void handleWebhook_refundProcessed_returns200() throws Exception {
        when(razorpayConfig.getWebhookSecret()).thenReturn("secret");
        when(razorpayService.verifyWebhookSignature(anyString(), anyString(), anyString())).thenReturn(true);
        org.mockito.Mockito.doNothing().when(refundService).updateRefundStatus(anyString(), anyString());

        String payload = "{\"event\":\"refund.processed\",\"payload\":{\"refund\":{\"entity\":{\"id\":\"rfnd_123\",\"payment_id\":\"pay_123\",\"status\":\"processed\"}}}}";

        mockMvc.perform(post("/api/payments/webhook")
                .contentType(MediaType.APPLICATION_JSON)
                .header("X-Razorpay-Signature", "valid-sig")
                .content(payload))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /api/payments/webhook returns 200 for refund.failed event")
    void handleWebhook_refundFailed_returns200() throws Exception {
        when(razorpayConfig.getWebhookSecret()).thenReturn("secret");
        when(razorpayService.verifyWebhookSignature(anyString(), anyString(), anyString())).thenReturn(true);
        org.mockito.Mockito.doNothing().when(refundService).updateRefundStatus(anyString(), anyString());

        String payload = "{\"event\":\"refund.failed\",\"payload\":{\"refund\":{\"entity\":{\"id\":\"rfnd_456\",\"payment_id\":\"pay_123\",\"status\":\"failed\"}}}}";

        mockMvc.perform(post("/api/payments/webhook")
                .contentType(MediaType.APPLICATION_JSON)
                .header("X-Razorpay-Signature", "valid-sig")
                .content(payload))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /api/payments/webhook returns 200 for order.paid event")
    void handleWebhook_orderPaid_returns200() throws Exception {
        when(razorpayConfig.getWebhookSecret()).thenReturn("secret");
        when(razorpayService.verifyWebhookSignature(anyString(), anyString(), anyString())).thenReturn(true);

        String payload = "{\"event\":\"order.paid\",\"payload\":{\"order\":{\"entity\":{\"id\":\"order_razorpay_123\",\"status\":\"paid\"}}}}";

        mockMvc.perform(post("/api/payments/webhook")
                .contentType(MediaType.APPLICATION_JSON)
                .header("X-Razorpay-Signature", "valid-sig")
                .content(payload))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /api/payments/webhook returns 200 for unknown event type")
    void handleWebhook_unknownEvent_returns200() throws Exception {
        when(razorpayConfig.getWebhookSecret()).thenReturn("secret");
        when(razorpayService.verifyWebhookSignature(anyString(), anyString(), anyString())).thenReturn(true);

        mockMvc.perform(post("/api/payments/webhook")
                .contentType(MediaType.APPLICATION_JSON)
                .header("X-Razorpay-Signature", "valid-sig")
                .content("{\"event\":\"some.unknown.event\",\"payload\":{}}"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /api/payments/webhook returns 500 when JSON parsing fails")
    void handleWebhook_returns500OnParseError() throws Exception {
        when(razorpayConfig.getWebhookSecret()).thenReturn("secret");
        when(razorpayService.verifyWebhookSignature(anyString(), anyString(), anyString())).thenReturn(true);

        mockMvc.perform(post("/api/payments/webhook")
                .contentType(MediaType.APPLICATION_JSON)
                .header("X-Razorpay-Signature", "valid-sig")
                .content("NOT_VALID_JSON"))
            .andExpect(status().isInternalServerError());
    }
}
