package com.MaSoVa.payment.unit.controller;

import com.MaSoVa.payment.config.RazorpayConfig;
import com.MaSoVa.payment.controller.WebhookController;
import com.MaSoVa.payment.service.PaymentService;
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
    @Mock private PaymentService paymentService;
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
}
