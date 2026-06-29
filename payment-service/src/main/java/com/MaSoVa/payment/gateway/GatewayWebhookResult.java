package com.MaSoVa.payment.gateway;

/**
 * Returned by PaymentGateway.parseWebhook.
 * Normalised across Razorpay and Stripe.
 */
public class GatewayWebhookResult {

    public enum EventType {
        PAYMENT_CAPTURED,
        PAYMENT_FAILED,
        REFUND_PROCESSED,
        REFUND_FAILED,
        UNKNOWN
    }

    private final EventType eventType;
    private final String gatewayOrderId;    // Razorpay order ID or Stripe PaymentIntent ID
    private final String gatewayPaymentId;  // Razorpay payment ID or Stripe charge ID
    private final String failureReason;     // null unless PAYMENT_FAILED / REFUND_FAILED
    private final Long stripeFeeAmountMinor; // Stripe fee in minor units (null for Razorpay)
    /** Stripe: card, ideal, bancontact, etc. Razorpay: upi, card, netbanking, etc. */
    private final String paymentMethodType;

    public GatewayWebhookResult(EventType eventType, String gatewayOrderId,
                                  String gatewayPaymentId, String failureReason,
                                  Long stripeFeeAmountMinor) {
        this(eventType, gatewayOrderId, gatewayPaymentId, failureReason, stripeFeeAmountMinor, null);
    }

    public GatewayWebhookResult(EventType eventType, String gatewayOrderId,
                                  String gatewayPaymentId, String failureReason,
                                  Long stripeFeeAmountMinor, String paymentMethodType) {
        this.eventType = eventType;
        this.gatewayOrderId = gatewayOrderId;
        this.gatewayPaymentId = gatewayPaymentId;
        this.failureReason = failureReason;
        this.stripeFeeAmountMinor = stripeFeeAmountMinor;
        this.paymentMethodType = paymentMethodType;
    }

    public EventType getEventType() { return eventType; }
    public String getGatewayOrderId() { return gatewayOrderId; }
    public String getGatewayPaymentId() { return gatewayPaymentId; }
    public String getFailureReason() { return failureReason; }
    public Long getStripeFeeAmountMinor() { return stripeFeeAmountMinor; }
    public String getPaymentMethodType() { return paymentMethodType; }
}
