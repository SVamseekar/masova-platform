package com.MaSoVa.payment.gateway;

import com.MaSoVa.payment.config.RazorpayConfig;
import com.MaSoVa.payment.service.RazorpayService;
import com.razorpay.Order;
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
