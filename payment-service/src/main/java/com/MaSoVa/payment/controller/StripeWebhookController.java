package com.MaSoVa.payment.controller;

import com.MaSoVa.payment.gateway.GatewayWebhookResult;
import com.MaSoVa.payment.gateway.PaymentGateway;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Receives Stripe webhook events.
 * Path: POST /api/payments/webhook/stripe
 * This endpoint is public (no JWT required) — Stripe cannot send auth tokens.
 * Signature is verified inside StripeGateway.parseWebhook().
 */
@RestController
@RequestMapping("/api/payments/webhook/stripe")
public class StripeWebhookController {

    private static final Logger log = LoggerFactory.getLogger(StripeWebhookController.class);

    private final PaymentGateway stripeGateway;

    public StripeWebhookController(@Qualifier("stripeGateway") PaymentGateway stripeGateway) {
        this.stripeGateway = stripeGateway;
    }

    /**
     * POST /api/payments/webhook/stripe
     * Stripe sends raw JSON body + Stripe-Signature header.
     */
    @PostMapping
    public ResponseEntity<String> handleStripeWebhook(
            @RequestBody String rawPayload,
            @RequestHeader(value = "Stripe-Signature", required = false) String stripeSignature) {

        log.info("Received Stripe webhook event");

        try {
            GatewayWebhookResult result = stripeGateway.parseWebhook(rawPayload, stripeSignature);

            log.info("Stripe webhook processed: eventType={}, gatewayOrderId={}",
                     result.getEventType(), result.getGatewayOrderId());

            // TODO(Global-4): route to PaymentService.handleStripeWebhookEvent()
            // For now: log and acknowledge — payment status is confirmed via confirmPayment() on the verify endpoint.

            return ResponseEntity.ok("Webhook processed");

        } catch (SecurityException e) {
            log.error("Stripe webhook signature verification failed: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid signature");
        } catch (Exception e) {
            log.error("Error processing Stripe webhook", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error processing webhook");
        }
    }
}
