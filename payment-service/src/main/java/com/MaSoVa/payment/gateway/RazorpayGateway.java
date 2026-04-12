package com.MaSoVa.payment.gateway;

import com.MaSoVa.payment.config.RazorpayConfig;
import com.MaSoVa.payment.service.RazorpayService;
import com.razorpay.Order;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/**
 * PaymentGateway implementation backed by Razorpay.
 * Delegates to the existing RazorpayService — no logic duplication.
 */
@Component
public class RazorpayGateway implements PaymentGateway {

    private static final Logger log = LoggerFactory.getLogger(RazorpayGateway.class);

    private final RazorpayService razorpayService;
    private final RazorpayConfig razorpayConfig;

    public RazorpayGateway(RazorpayService razorpayService, RazorpayConfig razorpayConfig) {
        this.razorpayService = razorpayService;
        this.razorpayConfig = razorpayConfig;
    }

    @Override
    public GatewayPaymentResult initiatePayment(GatewayPaymentRequest request) throws Exception {
        Order razorpayOrder = razorpayService.createOrder(
                request.getAmount(), request.getOrderId(), request.getReceipt());
        String razorpayOrderId = razorpayOrder.get("id").toString();
        return new GatewayPaymentResult("RAZORPAY", razorpayOrderId, null, razorpayConfig.getKeyId());
    }

    @Override
    public boolean confirmPayment(String gatewayOrderId, String gatewayPaymentId, String gatewaySignature) throws Exception {
        return razorpayService.verifyPaymentSignature(gatewayOrderId, gatewayPaymentId, gatewaySignature);
    }

    @Override
    public String refund(String gatewayPaymentId, BigDecimal amount, String speed) throws Exception {
        var refundJson = razorpayService.createRefund(gatewayPaymentId, amount, speed);
        return refundJson.getString("id");
    }

    @Override
    public GatewayWebhookResult parseWebhook(String rawPayload, String signatureHeader) throws Exception {
        boolean valid = razorpayService.verifyWebhookSignature(rawPayload, signatureHeader, razorpayConfig.getWebhookSecret());
        if (!valid) {
            throw new SecurityException("Razorpay webhook signature verification failed");
        }
        org.json.JSONObject payload = new org.json.JSONObject(rawPayload);
        String event = payload.optString("event", "");
        GatewayWebhookResult.EventType eventType = switch (event) {
            case "payment.captured", "order.paid" -> GatewayWebhookResult.EventType.PAYMENT_CAPTURED;
            case "payment.failed"                  -> GatewayWebhookResult.EventType.PAYMENT_FAILED;
            case "refund.processed"                -> GatewayWebhookResult.EventType.REFUND_PROCESSED;
            case "refund.failed"                   -> GatewayWebhookResult.EventType.REFUND_FAILED;
            default                                -> GatewayWebhookResult.EventType.UNKNOWN;
        };
        String gatewayOrderId = null;
        String gatewayPaymentId = null;
        String failureReason = null;
        try {
            var entity = payload.getJSONObject("payload")
                                 .getJSONObject(event.startsWith("refund") ? "refund" : "payment")
                                 .getJSONObject("entity");
            gatewayPaymentId = entity.optString("id");
            gatewayOrderId   = entity.optString("order_id");
            failureReason    = entity.optString("error_description", null);
        } catch (Exception ignored) {
            log.warn("Could not extract entity from Razorpay webhook for event: {}", event);
        }
        return new GatewayWebhookResult(eventType, gatewayOrderId, gatewayPaymentId, failureReason, null);
    }

    @Override
    public String getGatewayName() { return "RAZORPAY"; }
}
