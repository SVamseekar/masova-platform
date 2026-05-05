package com.MaSoVa.payment.controller;

import com.MaSoVa.payment.config.RazorpayConfig;
import com.MaSoVa.payment.service.PaymentService;
import com.MaSoVa.payment.service.RazorpayService;
import com.MaSoVa.payment.service.RefundService;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments/webhook")
public class WebhookController {

    private static final Logger log = LoggerFactory.getLogger(WebhookController.class);

    private final RazorpayService razorpayService;
    @SuppressWarnings("unused")
    private final PaymentService paymentService;
    private final RefundService refundService;
    private final RazorpayConfig razorpayConfig;

    public WebhookController(RazorpayService razorpayService, PaymentService paymentService,
                            RefundService refundService, RazorpayConfig razorpayConfig) {
        this.razorpayService = razorpayService;
        this.paymentService = paymentService;
        this.refundService = refundService;
        this.razorpayConfig = razorpayConfig;
    }

    /**
     * POST /api/payments/webhook - Handle Razorpay webhooks
     * This endpoint receives payment and refund status updates from Razorpay
     */
    @PostMapping
    public ResponseEntity<String> handleWebhook(
            @RequestBody String payload,
            @RequestHeader("X-Razorpay-Signature") String signature) {

        log.info("Received webhook from Razorpay");

        try {
            // Verify webhook signature
            boolean isValid = razorpayService.verifyWebhookSignature(
                    payload,
                    signature,
                    razorpayConfig.getWebhookSecret()
            );

            if (!isValid) {
                log.error("Webhook signature verification failed");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid signature");
            }

            log.info("Webhook signature verified successfully");

            // Parse webhook payload
            JSONObject webhookData = new JSONObject(payload);
            String event = webhookData.getString("event");

            log.info("Webhook event: {}", event);

            // Handle different webhook events
            switch (event) {
                case "payment.captured":
                    handlePaymentCaptured(webhookData);
                    break;

                case "payment.failed":
                    handlePaymentFailed(webhookData);
                    break;

                case "refund.processed":
                    handleRefundProcessed(webhookData);
                    break;

                case "refund.failed":
                    handleRefundFailed(webhookData);
                    break;

                case "order.paid":
                    handleOrderPaid(webhookData);
                    break;

                default:
                    log.info("Unhandled webhook event: {}", event);
            }

            return ResponseEntity.ok("Webhook processed successfully");

        } catch (Exception e) {
            log.error("Error processing webhook", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error processing webhook");
        }
    }

    private void handlePaymentCaptured(JSONObject webhookData) {
        try {
            JSONObject payload = webhookData.getJSONObject("payload");
            JSONObject payment = payload.getJSONObject("payment");
            JSONObject entity = payment.getJSONObject("entity");

            String razorpayPaymentId = entity.getString("id");
            String razorpayOrderId = entity.getString("order_id");
            String status = entity.getString("status");

            log.info("Payment captured webhook - Payment ID: {}, Order ID: {}, Status: {}",
                     razorpayPaymentId, razorpayOrderId, status);

            // Payment will be updated via verify endpoint
            // This webhook is mainly for logging and monitoring

        } catch (Exception e) {
            log.error("Error handling payment.captured webhook", e);
        }
    }

    private void handlePaymentFailed(JSONObject webhookData) {
        try {
            JSONObject payload = webhookData.getJSONObject("payload");
            JSONObject payment = payload.getJSONObject("payment");
            JSONObject entity = payment.getJSONObject("entity");

            String razorpayPaymentId = entity.getString("id");
            String razorpayOrderId = entity.getString("order_id");
            String errorCode = entity.optString("error_code");
            String errorDescription = entity.optString("error_description");

            log.error("Payment failed webhook - Payment ID: {}, Order ID: {}, Error: {} - {}",
                      razorpayPaymentId, razorpayOrderId, errorCode, errorDescription);

            // Update transaction status to FAILED
            // This would require implementing a method in PaymentService

        } catch (Exception e) {
            log.error("Error handling payment.failed webhook", e);
        }
    }

    private void handleRefundProcessed(JSONObject webhookData) {
        try {
            JSONObject payload = webhookData.getJSONObject("payload");
            JSONObject refund = payload.getJSONObject("refund");
            JSONObject entity = refund.getJSONObject("entity");

            String razorpayRefundId = entity.getString("id");
            String razorpayPaymentId = entity.getString("payment_id");
            String status = entity.getString("status");

            log.info("Refund processed webhook - Refund ID: {}, Payment ID: {}, Status: {}",
                     razorpayRefundId, razorpayPaymentId, status);

            // Update refund status
            refundService.updateRefundStatus(razorpayRefundId, status);

        } catch (Exception e) {
            log.error("Error handling refund.processed webhook", e);
        }
    }

    private void handleRefundFailed(JSONObject webhookData) {
        try {
            JSONObject payload = webhookData.getJSONObject("payload");
            JSONObject refund = payload.getJSONObject("refund");
            JSONObject entity = refund.getJSONObject("entity");

            String razorpayRefundId = entity.getString("id");
            String razorpayPaymentId = entity.getString("payment_id");
            String status = entity.getString("status");

            log.error("Refund failed webhook - Refund ID: {}, Payment ID: {}, Status: {}",
                      razorpayRefundId, razorpayPaymentId, status);

            // Update refund status
            refundService.updateRefundStatus(razorpayRefundId, "failed");

        } catch (Exception e) {
            log.error("Error handling refund.failed webhook", e);
        }
    }

    private void handleOrderPaid(JSONObject webhookData) {
        try {
            JSONObject payload = webhookData.getJSONObject("payload");
            JSONObject order = payload.getJSONObject("order");
            JSONObject entity = order.getJSONObject("entity");

            String razorpayOrderId = entity.getString("id");
            String status = entity.getString("status");

            log.info("Order paid webhook - Order ID: {}, Status: {}", razorpayOrderId, status);

        } catch (Exception e) {
            log.error("Error handling order.paid webhook", e);
        }
    }
}
