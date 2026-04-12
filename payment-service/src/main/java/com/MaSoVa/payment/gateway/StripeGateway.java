package com.MaSoVa.payment.gateway;

import com.MaSoVa.payment.config.StripeConfig;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;
import com.stripe.model.Refund;
import com.stripe.net.Webhook;
import com.stripe.param.PaymentIntentCreateParams;
import com.stripe.param.RefundCreateParams;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/**
 * PaymentGateway implementation backed by Stripe.
 * Used for all 12 non-India countries (Global-4).
 *
 * SCA/3DS2 is handled entirely by Stripe's hosted Payment Element on the frontend.
 * No custom 3DS logic here.
 * Idempotency key = orderId — prevents double-charge on frontend retry.
 */
@Component
public class StripeGateway implements PaymentGateway {

    private static final Logger log = LoggerFactory.getLogger(StripeGateway.class);

    private final StripeConfig stripeConfig;

    public StripeGateway(StripeConfig stripeConfig) {
        this.stripeConfig = stripeConfig;
    }

    @Override
    public GatewayPaymentResult initiatePayment(GatewayPaymentRequest request) throws Exception {
        // Stripe requires amount in minor units (cents, pence, fillér, etc.)
        long amountMinorUnits = request.getAmount()
                .multiply(BigDecimal.valueOf(100))
                .longValue();

        PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                .setAmount(amountMinorUnits)
                .setCurrency(request.getCurrency().toLowerCase())
                .setAutomaticPaymentMethods(
                    PaymentIntentCreateParams.AutomaticPaymentMethods.builder()
                        .setEnabled(true)
                        .build())
                .putMetadata("orderId", request.getOrderId())
                .putMetadata("receipt", request.getReceipt())
                .setReceiptEmail(request.getCustomerEmail())
                .build();

        // Idempotency key = orderId — prevents double-charge on network retry
        PaymentIntent intent = PaymentIntent.create(
                params,
                com.stripe.net.RequestOptions.builder()
                        .setIdempotencyKey("pi_create_" + request.getOrderId())
                        .build()
        );

        log.info("Stripe PaymentIntent created: {} for orderId={}", intent.getId(), request.getOrderId());

        return new GatewayPaymentResult(
                "STRIPE",
                intent.getId(),              // gatewayOrderId = PaymentIntent ID
                intent.getClientSecret(),    // clientSecret returned to frontend for PaymentElement
                stripeConfig.getPublishableKey()
        );
    }

    @Override
    public boolean confirmPayment(String gatewayOrderId, String gatewayPaymentId, String gatewaySignature) throws Exception {
        // Stripe PaymentElement confirms on the frontend (3DS included).
        // The backend receives the succeeded status via webhook (see parseWebhook).
        // This method is called on the verify endpoint — for Stripe we trust the PaymentIntent status.
        if (gatewayOrderId == null) return false;
        PaymentIntent intent = PaymentIntent.retrieve(gatewayOrderId);
        boolean succeeded = "succeeded".equals(intent.getStatus());
        log.info("Stripe PaymentIntent {} status={}", gatewayOrderId, intent.getStatus());
        return succeeded;
    }

    @Override
    public String refund(String gatewayPaymentId, BigDecimal amount, String speed) throws Exception {
        // Stripe refunds a charge (payment method), not a PaymentIntent
        long amountMinorUnits = amount.multiply(BigDecimal.valueOf(100)).longValue();

        RefundCreateParams params = RefundCreateParams.builder()
                .setPaymentIntent(gatewayPaymentId)   // Stripe accepts PI ID here
                .setAmount(amountMinorUnits)
                .build();

        Refund refund = Refund.create(params);
        log.info("Stripe Refund created: {} for paymentIntent={}", refund.getId(), gatewayPaymentId);
        return refund.getId();
    }

    @Override
    public GatewayWebhookResult parseWebhook(String rawPayload, String signatureHeader) throws Exception {
        Event event;
        try {
            event = Webhook.constructEvent(rawPayload, signatureHeader, stripeConfig.getWebhookSecret());
        } catch (SignatureVerificationException e) {
            throw new SecurityException("Stripe webhook signature verification failed: " + e.getMessage(), e);
        }

        log.info("Stripe webhook event type: {}", event.getType());

        GatewayWebhookResult.EventType eventType = switch (event.getType()) {
            case "payment_intent.succeeded"         -> GatewayWebhookResult.EventType.PAYMENT_CAPTURED;
            case "payment_intent.payment_failed"    -> GatewayWebhookResult.EventType.PAYMENT_FAILED;
            case "charge.refunded"                  -> GatewayWebhookResult.EventType.REFUND_PROCESSED;
            case "charge.refund.updated"            -> GatewayWebhookResult.EventType.REFUND_PROCESSED;
            default                                 -> GatewayWebhookResult.EventType.UNKNOWN;
        };

        String gatewayOrderId = null;
        String gatewayPaymentId = null;
        String failureReason = null;
        Long stripeFee = null;

        try {
            var dataObject = event.getDataObjectDeserializer().getObject();
            if (dataObject.isPresent()) {
                var obj = dataObject.get();
                if (obj instanceof PaymentIntent pi) {
                    gatewayOrderId  = pi.getId();
                    gatewayPaymentId = pi.getLatestCharge();
                    if (pi.getLastPaymentError() != null) {
                        failureReason = pi.getLastPaymentError().getMessage();
                    }
                } else if (obj instanceof com.stripe.model.Charge charge) {
                    gatewayOrderId   = charge.getPaymentIntent();
                    gatewayPaymentId = charge.getId();
                    if (charge.getBalanceTransactionObject() != null) {
                        stripeFee = charge.getBalanceTransactionObject().getFee();
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Could not extract Stripe event data for event type: {}", event.getType(), e);
        }

        return new GatewayWebhookResult(eventType, gatewayOrderId, gatewayPaymentId, failureReason, stripeFee);
    }

    @Override
    public String getGatewayName() { return "STRIPE"; }
}
