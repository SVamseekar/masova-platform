package com.MaSoVa.payment.service;

import com.razorpay.Order;
import com.razorpay.Payment;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Utils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Slf4j
@Service
@RequiredArgsConstructor
public class RazorpayService {

    private final RazorpayClient razorpayClient;

    /**
     * Create Razorpay order
     * @param amount Amount in INR (will be converted to paisa)
     * @param orderId Internal order ID
     * @param receipt Receipt number
     * @return Razorpay Order object
     */
    public Order createOrder(BigDecimal amount, String orderId, String receipt) throws RazorpayException {
        try {
            // Convert amount to paisa (Razorpay requires amount in smallest currency unit)
            int amountInPaisa = amount.multiply(BigDecimal.valueOf(100)).intValue();

            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", amountInPaisa);
            orderRequest.put("currency", "INR");
            orderRequest.put("receipt", receipt);
            orderRequest.put("notes", new JSONObject().put("order_id", orderId));

            log.info("Creating Razorpay order for amount: {} INR ({}  paisa), receipt: {}",
                     amount, amountInPaisa, receipt);

            Order order = razorpayClient.orders.create(orderRequest);

            log.info("Razorpay order created successfully. Order ID: {}", order.get("id").toString());

            return order;
        } catch (RazorpayException e) {
            log.error("Failed to create Razorpay order for amount: {}, receipt: {}", amount, receipt, e);
            throw e;
        }
    }

    /**
     * Verify payment signature
     * @param razorpayOrderId Razorpay order ID
     * @param razorpayPaymentId Razorpay payment ID
     * @param razorpaySignature Razorpay signature
     * @return true if signature is valid
     */
    public boolean verifyPaymentSignature(String razorpayOrderId, String razorpayPaymentId, String razorpaySignature) {
        try {
            JSONObject attributes = new JSONObject();
            attributes.put("razorpay_order_id", razorpayOrderId);
            attributes.put("razorpay_payment_id", razorpayPaymentId);
            attributes.put("razorpay_signature", razorpaySignature);

            boolean isValid = Utils.verifyPaymentSignature(attributes, getRazorpaySecret());

            if (isValid) {
                log.info("Payment signature verified successfully for payment: {}", razorpayPaymentId);
            } else {
                log.error("Payment signature verification failed for payment: {}", razorpayPaymentId);
            }

            return isValid;
        } catch (RazorpayException e) {
            log.error("Error verifying payment signature for payment: {}", razorpayPaymentId, e);
            return false;
        }
    }

    /**
     * Fetch payment details
     * @param paymentId Razorpay payment ID
     * @return Payment object
     */
    public Payment fetchPayment(String paymentId) throws RazorpayException {
        try {
            log.info("Fetching payment details for payment: {}", paymentId);
            Payment payment = razorpayClient.payments.fetch(paymentId);
            log.info("Payment details fetched successfully for: {}", paymentId);
            return payment;
        } catch (RazorpayException e) {
            log.error("Failed to fetch payment details for: {}", paymentId, e);
            throw e;
        }
    }

    /**
     * Create refund
     * @param paymentId Razorpay payment ID
     * @param amount Refund amount in INR (will be converted to paisa)
     * @param speed Refund speed (normal or optimum)
     * @return Refund object as JSONObject
     */
    public JSONObject createRefund(String paymentId, BigDecimal amount, String speed) throws RazorpayException {
        try {
            // Convert amount to paisa
            int amountInPaisa = amount.multiply(BigDecimal.valueOf(100)).intValue();

            JSONObject refundRequest = new JSONObject();
            refundRequest.put("amount", amountInPaisa);
            if (speed != null && !speed.isEmpty()) {
                refundRequest.put("speed", speed);
            }

            log.info("Creating refund for payment: {}, amount: {} INR ({} paisa), speed: {}",
                     paymentId, amount, amountInPaisa, speed);

            // Create refund using the Razorpay client's refund API
            com.razorpay.Refund refund = razorpayClient.payments.refund(paymentId, refundRequest);
            JSONObject refundJson = refund.toJson();

            log.info("Refund created successfully. Refund ID: {}", refundJson.get("id"));

            return refundJson;
        } catch (RazorpayException e) {
            log.error("Failed to create refund for payment: {}, amount: {}", paymentId, amount, e);
            throw e;
        }
    }

    /**
     * Fetch refund details
     * @param paymentId Razorpay payment ID
     * @param refundId Razorpay refund ID
     * @return Refund object as JSONObject
     */
    public JSONObject fetchRefund(String paymentId, String refundId) throws RazorpayException {
        try {
            log.info("Fetching refund details for refund: {}", refundId);
            // Fetch refund using the Razorpay client's refund API
            com.razorpay.Refund refund = razorpayClient.payments.fetchRefund(paymentId, refundId);
            JSONObject refundJson = refund.toJson();
            log.info("Refund details fetched successfully for: {}", refundId);
            return refundJson;
        } catch (RazorpayException e) {
            log.error("Failed to fetch refund details for: {}", refundId, e);
            throw e;
        }
    }

    /**
     * Verify webhook signature
     * @param payload Webhook payload
     * @param signature Webhook signature
     * @param secret Webhook secret
     * @return true if signature is valid
     */
    public boolean verifyWebhookSignature(String payload, String signature, String secret) {
        try {
            return Utils.verifyWebhookSignature(payload, signature, secret);
        } catch (RazorpayException e) {
            log.error("Error verifying webhook signature", e);
            return false;
        }
    }

    private String getRazorpaySecret() {
        // This should be injected from config
        // For now, we'll get it from the RazorpayClient instance
        // In a real implementation, inject this from RazorpayConfig
        return System.getenv("RAZORPAY_KEY_SECRET");
    }
}
