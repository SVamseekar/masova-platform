package com.MaSoVa.payment.unit.gateway;

import com.MaSoVa.payment.gateway.RazorpayGateway;
import com.MaSoVa.payment.gateway.GatewayPaymentRequest;
import com.MaSoVa.payment.gateway.GatewayPaymentResult;
import com.MaSoVa.payment.gateway.GatewayWebhookResult;
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

    @Test
    void refund_returns_razorpay_refund_id() throws Exception {
        org.json.JSONObject refundJson = new org.json.JSONObject();
        refundJson.put("id", "rfnd_test_001");
        when(razorpayService.createRefund(eq("pay_123"), any(), anyString())).thenReturn(refundJson);

        String refundId = gateway.refund("pay_123", new java.math.BigDecimal("100.00"), "normal");

        assertThat(refundId).isEqualTo("rfnd_test_001");
    }

    @Test
    void parseWebhook_valid_payment_captured_event() throws Exception {
        when(razorpayService.verifyWebhookSignature(any(), any(), any())).thenReturn(true);
        String payload = "{\"event\":\"payment.captured\",\"payload\":{\"payment\":{\"entity\":{\"id\":\"pay_123\",\"order_id\":\"order_123\"}}}}";

        GatewayWebhookResult result = gateway.parseWebhook(payload, "valid_sig");

        assertThat(result.getEventType()).isEqualTo(GatewayWebhookResult.EventType.PAYMENT_CAPTURED);
    }

    @Test
    void parseWebhook_valid_refund_processed_event() throws Exception {
        when(razorpayService.verifyWebhookSignature(any(), any(), any())).thenReturn(true);
        String payload = "{\"event\":\"refund.processed\",\"payload\":{\"refund\":{\"entity\":{\"id\":\"rfnd_123\",\"payment_id\":\"pay_123\"}}}}";

        GatewayWebhookResult result = gateway.parseWebhook(payload, "valid_sig");

        assertThat(result.getEventType()).isEqualTo(GatewayWebhookResult.EventType.REFUND_PROCESSED);
    }

    @Test
    void parseWebhook_order_paid_maps_to_payment_captured() throws Exception {
        when(razorpayService.verifyWebhookSignature(any(), any(), any())).thenReturn(true);
        String payload = "{\"event\":\"order.paid\",\"payload\":{\"payment\":{\"entity\":{\"id\":\"pay_123\",\"order_id\":\"order_123\"}}}}";

        GatewayWebhookResult result = gateway.parseWebhook(payload, "valid_sig");

        assertThat(result.getEventType()).isEqualTo(GatewayWebhookResult.EventType.PAYMENT_CAPTURED);
    }

    @Test
    void parseWebhook_unknown_event_returns_unknown_type() throws Exception {
        when(razorpayService.verifyWebhookSignature(any(), any(), any())).thenReturn(true);
        String payload = "{\"event\":\"some.unknown\",\"payload\":{}}";

        GatewayWebhookResult result = gateway.parseWebhook(payload, "valid_sig");

        assertThat(result.getEventType()).isEqualTo(GatewayWebhookResult.EventType.UNKNOWN);
    }

    @Test
    void parseWebhook_refund_failed_event() throws Exception {
        when(razorpayService.verifyWebhookSignature(any(), any(), any())).thenReturn(true);
        String payload = "{\"event\":\"refund.failed\",\"payload\":{\"refund\":{\"entity\":{\"id\":\"rfnd_123\",\"payment_id\":\"pay_123\"}}}}";

        GatewayWebhookResult result = gateway.parseWebhook(payload, "valid_sig");

        assertThat(result.getEventType()).isEqualTo(GatewayWebhookResult.EventType.REFUND_FAILED);
    }

    @Test
    void parseWebhook_payment_failed_event() throws Exception {
        when(razorpayService.verifyWebhookSignature(any(), any(), any())).thenReturn(true);
        String payload = "{\"event\":\"payment.failed\",\"payload\":{\"payment\":{\"entity\":{\"id\":\"pay_123\",\"order_id\":\"order_123\",\"error_description\":\"Declined\"}}}}";

        GatewayWebhookResult result = gateway.parseWebhook(payload, "valid_sig");

        assertThat(result.getEventType()).isEqualTo(GatewayWebhookResult.EventType.PAYMENT_FAILED);
    }
}
