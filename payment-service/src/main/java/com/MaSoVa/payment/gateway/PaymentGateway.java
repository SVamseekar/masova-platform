package com.MaSoVa.payment.gateway;

import java.math.BigDecimal;

/**
 * Gateway-agnostic payment abstraction.
 * Razorpay and Stripe both implement this interface.
 * PaymentService calls only this — never gateway SDKs directly.
 */
public interface PaymentGateway {

    /**
     * Create a payment order / intent at the gateway.
     * @return GatewayPaymentResult containing what the frontend needs to open the payment UI
     */
    GatewayPaymentResult initiatePayment(GatewayPaymentRequest request) throws Exception;

    /**
     * Confirm / verify a payment after the customer completes it in the frontend.
     * @param gatewayOrderId The order or intent ID returned by initiatePayment
     * @param gatewayPaymentId The payment / charge ID from the frontend callback
     * @param gatewaySignature Signature or confirmation token (Razorpay: HMAC, Stripe: null)
     * @return true if verification passes
     */
    boolean confirmPayment(String gatewayOrderId, String gatewayPaymentId, String gatewaySignature) throws Exception;

    /**
     * Create a refund at the gateway.
     * @param gatewayPaymentId The payment / charge ID to refund
     * @param amount Amount in major units (e.g. 10.00 EUR). Gateway converts to minor units.
     * @param speed "normal" or "optimum" (Razorpay only; ignored by Stripe)
     * @return Gateway refund ID
     */
    String refund(String gatewayPaymentId, BigDecimal amount, String speed) throws Exception;

    /**
     * Parse an inbound webhook payload.
     * Implementations must verify the signature themselves.
     * @param rawPayload Raw request body as String
     * @param signatureHeader Value of X-Razorpay-Signature or Stripe-Signature header
     * @return Normalised GatewayWebhookResult
     */
    GatewayWebhookResult parseWebhook(String rawPayload, String signatureHeader) throws Exception;

    /** Gateway name for storage — "RAZORPAY" or "STRIPE". */
    String getGatewayName();
}
