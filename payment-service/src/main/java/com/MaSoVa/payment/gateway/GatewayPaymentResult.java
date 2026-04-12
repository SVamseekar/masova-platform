package com.MaSoVa.payment.gateway;

/**
 * Returned by PaymentGateway.initiatePayment.
 * Razorpay: gatewayOrderId = razorpay_order_id, clientSecret = null, publishableKey = razorpayKeyId.
 * Stripe: gatewayOrderId = payment_intent_id, clientSecret = client_secret, publishableKey = Stripe PK.
 */
public class GatewayPaymentResult {

    private final String gatewayName;       // "RAZORPAY" or "STRIPE"
    private final String gatewayOrderId;    // Razorpay order ID or Stripe PaymentIntent ID
    private final String clientSecret;      // Stripe only (null for Razorpay)
    private final String publishableKey;    // Public key for frontend SDK

    public GatewayPaymentResult(String gatewayName, String gatewayOrderId,
                                  String clientSecret, String publishableKey) {
        this.gatewayName = gatewayName;
        this.gatewayOrderId = gatewayOrderId;
        this.clientSecret = clientSecret;
        this.publishableKey = publishableKey;
    }

    public String getGatewayName() { return gatewayName; }
    public String getGatewayOrderId() { return gatewayOrderId; }
    public String getClientSecret() { return clientSecret; }
    public String getPublishableKey() { return publishableKey; }
}
