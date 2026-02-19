package com.MaSoVa.payment.service;

import com.MaSoVa.payment.entity.Transaction;
import com.MaSoVa.shared.util.PiiMasker;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Payment Notification Service
 *
 * Handles sending notifications to customers for payment-related events.
 * This addresses NOTIF-003 from the production readiness audit.
 *
 * Notifications are sent for:
 * - Payment success
 * - Payment failure
 * - Refund processed
 */
@Service
public class PaymentNotificationService {

    private static final Logger log = LoggerFactory.getLogger(PaymentNotificationService.class);

    private final RestTemplate restTemplate;

    @Value("${notification.service.url:http://localhost:8085}")
    private String notificationServiceUrl;

    @Value("${services.order.url:http://localhost:8084}")
    private String orderServiceUrl;

    @Value("${notification.enabled:true}")
    private boolean notificationEnabled;

    public PaymentNotificationService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    /**
     * Send payment success notification to customer
     * Note: NOT async to preserve request context (JWT token) for service-to-service calls
     */
    public void sendPaymentSuccessNotification(Transaction transaction, String customerEmail, String customerPhone) {
        if (!notificationEnabled) {
            log.debug("Notifications disabled, skipping payment success notification");
            return;
        }

        if (transaction.getCustomerId() == null || transaction.getCustomerId().isEmpty()) {
            log.debug("No customer ID for transaction {}, skipping notification", transaction.getId());
            return;
        }

        try {
            String title = "Payment Successful";
            String message = buildPaymentSuccessMessage(transaction);

            PaymentNotification notification = PaymentNotification.builder()
                    .transactionId(transaction.getId())
                    .orderId(transaction.getOrderId())
                    .customerId(transaction.getCustomerId())
                    .title(title)
                    .message(message)
                    .notificationType(NotificationType.PAYMENT_SUCCESS)
                    .amount(transaction.getAmount())
                    .paymentMethod(transaction.getPaymentMethod() != null ?
                            transaction.getPaymentMethod().name() : "UNKNOWN")
                    .timestamp(LocalDateTime.now())
                    .priority(NotificationPriority.HIGH)
                    .build();

            // Send via notification service
            sendToNotificationService(notification, customerEmail, customerPhone);

            log.info("Payment success notification sent: transactionId={}, customerId={}, amount={}",
                    transaction.getId(), transaction.getCustomerId(), transaction.getAmount());

        } catch (Exception e) {
            log.error("Failed to send payment success notification for transaction: {}",
                    transaction.getId(), e);
            // Don't throw - notification failure shouldn't break payment flow
        }
    }

    /**
     * Send payment failure notification to customer
     * Note: NOT async to preserve request context (JWT token) for service-to-service calls
     */
    public void sendPaymentFailureNotification(Transaction transaction, String customerEmail,
                                                String customerPhone, String failureReason) {
        if (!notificationEnabled) {
            return;
        }

        if (transaction.getCustomerId() == null) {
            return;
        }

        try {
            String title = "Payment Failed";
            String message = buildPaymentFailureMessage(transaction, failureReason);

            PaymentNotification notification = PaymentNotification.builder()
                    .transactionId(transaction.getId())
                    .orderId(transaction.getOrderId())
                    .customerId(transaction.getCustomerId())
                    .title(title)
                    .message(message)
                    .notificationType(NotificationType.PAYMENT_FAILED)
                    .amount(transaction.getAmount())
                    .timestamp(LocalDateTime.now())
                    .priority(NotificationPriority.URGENT)
                    .build();

            sendToNotificationService(notification, customerEmail, customerPhone);

            log.info("Payment failure notification sent: transactionId={}, customerId={}, reason={}",
                    transaction.getId(), transaction.getCustomerId(), failureReason);

        } catch (Exception e) {
            log.error("Failed to send payment failure notification for transaction: {}",
                    transaction.getId(), e);
        }
    }

    /**
     * Send refund processed notification to customer
     * Note: NOT async to preserve request context (JWT token) for service-to-service calls
     */
    public void sendRefundNotification(Transaction transaction, String customerEmail,
                                        String customerPhone, BigDecimal refundAmount) {
        if (!notificationEnabled) {
            return;
        }

        if (transaction.getCustomerId() == null) {
            return;
        }

        try {
            String title = "Refund Processed";
            String message = buildRefundMessage(transaction, refundAmount);

            PaymentNotification notification = PaymentNotification.builder()
                    .transactionId(transaction.getId())
                    .orderId(transaction.getOrderId())
                    .customerId(transaction.getCustomerId())
                    .title(title)
                    .message(message)
                    .notificationType(NotificationType.REFUND_PROCESSED)
                    .amount(refundAmount)
                    .timestamp(LocalDateTime.now())
                    .priority(NotificationPriority.HIGH)
                    .build();

            sendToNotificationService(notification, customerEmail, customerPhone);

            log.info("Refund notification sent: transactionId={}, customerId={}, refundAmount={}",
                    transaction.getId(), transaction.getCustomerId(), refundAmount);

        } catch (Exception e) {
            log.error("Failed to send refund notification for transaction: {}",
                    transaction.getId(), e);
        }
    }

    /**
     * Build payment success message with professional HTML template (Uber-style)
     */
    private String buildPaymentSuccessMessage(Transaction transaction) {
        String transactionIdShort = transaction.getId().substring(0, Math.min(8, transaction.getId().length()));
        String formattedAmount = String.format("%.2f", transaction.getAmount());
        String paymentMethod = transaction.getPaymentMethod() != null ?
                transaction.getPaymentMethod().name() : "Online Payment";
        String dateTime = transaction.getCreatedAt() != null ?
                transaction.getCreatedAt().toString().substring(0, 16).replace("T", " ") :
                LocalDateTime.now().toString().substring(0, 16).replace("T", " ");

        // Fetch order items if orderId is available
        String orderItemsHtml = "";
        if (transaction.getOrderId() != null && !transaction.getOrderId().isEmpty()) {
            orderItemsHtml = fetchOrderItems(transaction.getOrderId());
        }

        return buildHtmlEmail(
                "Payment Successful",
                String.format(
                        "<h2 style='color: #00B14F; margin: 0 0 24px 0;'>Payment Confirmed</h2>" +
                        "<p style='font-size: 16px; line-height: 24px; margin: 0 0 16px 0; color: #333;'>" +
                        "Your payment has been successfully processed." +
                        "</p>" +

                        "%s" + // Order items section

                        "<div style='background-color: #F7F7F7; border-radius: 8px; padding: 24px; margin: 24px 0;'>" +
                        "  <table width='100%%' cellpadding='0' cellspacing='0' style='width: 100%%;'>" +
                        "    <tr>" +
                        "      <td style='padding: 8px 0; color: #666; font-size: 14px;'>Amount Paid</td>" +
                        "      <td style='padding: 8px 0; text-align: right; font-weight: 600; color: #000; font-size: 18px;'>₹%s</td>" +
                        "    </tr>" +
                        "    <tr>" +
                        "      <td style='padding: 8px 0; color: #666; font-size: 14px;'>Payment Method</td>" +
                        "      <td style='padding: 8px 0; text-align: right; color: #000; font-size: 14px;'>%s</td>" +
                        "    </tr>" +
                        "    <tr>" +
                        "      <td style='padding: 8px 0; color: #666; font-size: 14px;'>Transaction ID</td>" +
                        "      <td style='padding: 8px 0; text-align: right; color: #000; font-family: monospace; font-size: 14px;'>%s</td>" +
                        "    </tr>" +
                        "    <tr>" +
                        "      <td style='padding: 8px 0; color: #666; font-size: 14px;'>Date & Time</td>" +
                        "      <td style='padding: 8px 0; text-align: right; color: #000; font-size: 14px;'>%s</td>" +
                        "    </tr>" +
                        "  </table>" +
                        "</div>" +

                        "<p style='font-size: 14px; line-height: 20px; margin: 24px 0 0 0; color: #666;'>" +
                        "We're preparing your order now. You'll receive updates as your order progresses." +
                        "</p>",
                        orderItemsHtml,
                        formattedAmount,
                        paymentMethod,
                        transactionIdShort,
                        dateTime
                )
        );
    }

    /**
     * Build payment failure message with professional HTML template
     */
    private String buildPaymentFailureMessage(Transaction transaction, String failureReason) {
        String formattedAmount = String.format("%.2f", transaction.getAmount());
        String reason = failureReason != null ? failureReason : "Payment declined";

        return buildHtmlEmail(
                "Payment Failed",
                String.format(
                        "<h2 style='color: #E74C3C; margin: 0 0 24px 0;'>Payment Could Not Be Processed</h2>" +
                        "<p style='font-size: 16px; line-height: 24px; margin: 0 0 16px 0; color: #333;'>" +
                        "Unfortunately, we couldn't process your payment of <strong>₹%s</strong>." +
                        "</p>" +

                        "<div style='background-color: #FEF5F5; border-left: 4px solid #E74C3C; padding: 16px; margin: 24px 0; border-radius: 4px;'>" +
                        "  <p style='margin: 0; color: #666; font-size: 14px;'><strong>Reason:</strong> %s</p>" +
                        "</div>" +

                        "<p style='font-size: 14px; line-height: 20px; margin: 16px 0 0 0; color: #666;'>" +
                        "Please try again or use a different payment method. Your order is still waiting for payment." +
                        "</p>",
                        formattedAmount,
                        reason
                )
        );
    }

    /**
     * Build refund message with professional HTML template
     */
    private String buildRefundMessage(Transaction transaction, BigDecimal refundAmount) {
        String formattedAmount = String.format("%.2f", refundAmount);

        return buildHtmlEmail(
                "Refund Processed",
                String.format(
                        "<h2 style='color: #3498DB; margin: 0 0 24px 0;'>Refund Initiated</h2>" +
                        "<p style='font-size: 16px; line-height: 24px; margin: 0 0 16px 0; color: #333;'>" +
                        "Your refund has been processed successfully." +
                        "</p>" +

                        "<div style='background-color: #F7F7F7; border-radius: 8px; padding: 24px; margin: 24px 0;'>" +
                        "  <div style='display: flex; justify-content: space-between; margin-bottom: 16px;'>" +
                        "    <span style='color: #666;'>Refund Amount</span>" +
                        "    <span style='font-weight: 600; color: #000; font-size: 18px;'>₹%s</span>" +
                        "  </div>" +
                        "  <div style='display: flex; justify-content: space-between;'>" +
                        "    <span style='color: #666;'>Processing Time</span>" +
                        "    <span style='color: #000;'>5-7 business days</span>" +
                        "  </div>" +
                        "</div>" +

                        "<p style='font-size: 14px; line-height: 20px; margin: 24px 0 0 0; color: #666;'>" +
                        "The refund will be credited to your original payment method. If you don't see it within 7 business days, please contact your bank." +
                        "</p>",
                        formattedAmount
                )
        );
    }

    /**
     * Fetch order items from order-service and build HTML
     */
    private String fetchOrderItems(String orderId) {
        try {
            String url = orderServiceUrl + "/api/orders/track/" + orderId;
            @SuppressWarnings("unchecked")
            Map<String, Object> orderResponse = restTemplate.getForObject(url, Map.class);

            if (orderResponse == null || !orderResponse.containsKey("items")) {
                return "";
            }

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> items = (List<Map<String, Object>>) orderResponse.get("items");

            if (items == null || items.isEmpty()) {
                return "";
            }

            StringBuilder itemsHtml = new StringBuilder();
            itemsHtml.append("<div style='margin: 24px 0;'>");
            itemsHtml.append("  <h3 style='margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #333;'>Your Order</h3>");
            itemsHtml.append("  <table width='100%' cellpadding='0' cellspacing='0' style='border-top: 1px solid #E5E5E5;'>");

            for (Map<String, Object> item : items) {
                String itemName = (String) item.get("name");  // Fixed: was "itemName", should be "name"
                Integer quantity = (Integer) item.get("quantity");
                Double price = item.get("price") instanceof Integer ?
                    ((Integer) item.get("price")).doubleValue() :
                    (Double) item.get("price");

                if (itemName != null && quantity != null && price != null) {
                    double itemTotal = quantity * price;
                    itemsHtml.append(String.format(
                        "    <tr>" +
                        "      <td style='padding: 12px 0; border-bottom: 1px solid #F0F0F0;'>" +
                        "        <div style='font-size: 14px; color: #333; font-weight: 500;'>%s</div>" +
                        "        <div style='font-size: 12px; color: #999; margin-top: 4px;'>Qty: %d × ₹%.2f</div>" +
                        "      </td>" +
                        "      <td style='padding: 12px 0; border-bottom: 1px solid #F0F0F0; text-align: right;'>" +
                        "        <span style='font-size: 14px; color: #333; font-weight: 500;'>₹%.2f</span>" +
                        "      </td>" +
                        "    </tr>",
                        itemName, quantity, price, itemTotal
                    ));
                }
            }

            itemsHtml.append("  </table>");
            itemsHtml.append("</div>");

            return itemsHtml.toString();

        } catch (Exception e) {
            log.warn("Failed to fetch order items for orderId {}: {}", orderId, e.getMessage());
            return "";
        }
    }

    /**
     * Build professional HTML email wrapper (Uber-style)
     */
    private String buildHtmlEmail(String heading, String content) {
        return "<!DOCTYPE html>" +
                "<html lang='en'>" +
                "<head>" +
                "  <meta charset='UTF-8'>" +
                "  <meta name='viewport' content='width=device-width, initial-scale=1.0'>" +
                "  <title>" + heading + "</title>" +
                "</head>" +
                "<body style='margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif; background-color: #F5F5F5;'>" +
                "  <table width='100%' cellpadding='0' cellspacing='0' style='background-color: #F5F5F5; padding: 40px 0;'>" +
                "    <tr>" +
                "      <td align='center'>" +
                "        <table width='600' cellpadding='0' cellspacing='0' style='background-color: #FFFFFF; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);'>" +

                "          <!-- Header -->" +
                "          <tr>" +
                "            <td style='padding: 32px 40px; border-bottom: 1px solid #E5E5E5;'>" +
                "              <h1 style='margin: 0; font-size: 28px; font-weight: 700; color: #FF6B35;'>MaSoVa</h1>" +
                "              <p style='margin: 4px 0 0 0; font-size: 14px; color: #999;'>Restaurant Management System</p>" +
                "            </td>" +
                "          </tr>" +

                "          <!-- Content -->" +
                "          <tr>" +
                "            <td style='padding: 40px;'>" +
                content +
                "            </td>" +
                "          </tr>" +

                "          <!-- Footer -->" +
                "          <tr>" +
                "            <td style='padding: 32px 40px; border-top: 1px solid #E5E5E5; background-color: #FAFAFA;'>" +
                "              <p style='margin: 0 0 8px 0; font-size: 12px; color: #999;'>Need help? Contact us at support@masova.com</p>" +
                "              <p style='margin: 0; font-size: 12px; color: #999;'>© " + java.time.Year.now().getValue() + " MaSoVa. All rights reserved.</p>" +
                "            </td>" +
                "          </tr>" +

                "        </table>" +
                "      </td>" +
                "    </tr>" +
                "  </table>" +
                "</body>" +
                "</html>";
    }

    /**
     * Send notification via notification service REST API
     * IMPORTANT: Only sends email if valid email is provided (not empty, not placeholder)
     */
    private void sendToNotificationService(PaymentNotification notification,
                                            String customerEmail, String customerPhone) {
        try {
            // CRITICAL: Validate email before sending - only send if real email provided
            boolean hasValidEmail = isValidEmail(customerEmail);

            if (!hasValidEmail) {
                log.debug("No valid email for notification {}, skipping email notification",
                    notification.getTransactionId());
                return; // Don't send if no valid email
            }

            Map<String, Object> request = new HashMap<>();
            request.put("userId", notification.getCustomerId());
            request.put("type", notification.getNotificationType().name());
            request.put("title", notification.getTitle());
            request.put("message", notification.getMessage());
            request.put("priority", notification.getPriority().name());
            // Use EMAIL channel as primary
            request.put("channel", "EMAIL");

            Map<String, Object> templateData = new HashMap<>();
            templateData.put("transactionId", notification.getTransactionId());
            templateData.put("orderId", notification.getOrderId());
            templateData.put("amount", notification.getAmount());
            templateData.put("paymentMethod", notification.getPaymentMethod());
            request.put("templateData", templateData);

            // Add recipient info (already validated above)
            request.put("recipientEmail", customerEmail);

            if (customerPhone != null && !customerPhone.trim().isEmpty()) {
                request.put("recipientPhone", customerPhone);
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);

            String url = notificationServiceUrl + "/api/notifications/send";
            restTemplate.postForEntity(url, entity, Map.class);

            log.debug("Notification sent to notification-service for customer: {}",
                    PiiMasker.mask(notification.getCustomerId(), 4));

        } catch (Exception e) {
            log.warn("Failed to send notification via notification-service: {}. " +
                    "Notification will be logged only.", e.getMessage());
            // Log the notification for manual processing if needed
            logNotificationForRecovery(notification, customerEmail);
        }
    }

    /**
     * Validate if email is real and should receive notifications
     * Returns false for: null, empty, whitespace-only, @walkin.local, @test.local, placeholder emails
     */
    private boolean isValidEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            return false;
        }

        String trimmedEmail = email.trim();

        // Reject placeholder/test emails
        if (trimmedEmail.endsWith("@walkin.local") ||
            trimmedEmail.endsWith("@test.local") ||
            trimmedEmail.endsWith("@example.com") ||
            trimmedEmail.startsWith("noreply@") ||
            trimmedEmail.startsWith("no-reply@")) {
            return false;
        }

        // Basic email format validation (contains @ and .)
        if (!trimmedEmail.contains("@") || !trimmedEmail.contains(".")) {
            return false;
        }

        return true;
    }

    /**
     * Log notification for recovery if notification service is unavailable
     */
    private void logNotificationForRecovery(PaymentNotification notification, String customerEmail) {
        log.info("NOTIFICATION_RECOVERY: type={}, customerId={}, email={}, title={}, message={}",
                notification.getNotificationType(),
                notification.getCustomerId(),
                PiiMasker.maskEmail(customerEmail),
                notification.getTitle(),
                notification.getMessage());
    }

    /**
     * Notification types
     */
    public enum NotificationType {
        PAYMENT_SUCCESS,
        PAYMENT_FAILED,
        REFUND_PROCESSED,
        PAYMENT_REMINDER
    }

    /**
     * Notification priority levels
     */
    public enum NotificationPriority {
        LOW,
        NORMAL,
        HIGH,
        URGENT
    }

    /**
     * Payment Notification DTO
     */
    public static class PaymentNotification {
        private String transactionId;
        private String orderId;
        private String customerId;
        private String title;
        private String message;
        private NotificationType notificationType;
        private BigDecimal amount;
        private String paymentMethod;
        private LocalDateTime timestamp;
        private NotificationPriority priority;

        private PaymentNotification(Builder builder) {
            this.transactionId = builder.transactionId;
            this.orderId = builder.orderId;
            this.customerId = builder.customerId;
            this.title = builder.title;
            this.message = builder.message;
            this.notificationType = builder.notificationType;
            this.amount = builder.amount;
            this.paymentMethod = builder.paymentMethod;
            this.timestamp = builder.timestamp;
            this.priority = builder.priority;
        }

        // Getters
        public String getTransactionId() { return transactionId; }
        public String getOrderId() { return orderId; }
        public String getCustomerId() { return customerId; }
        public String getTitle() { return title; }
        public String getMessage() { return message; }
        public NotificationType getNotificationType() { return notificationType; }
        public BigDecimal getAmount() { return amount; }
        public String getPaymentMethod() { return paymentMethod; }
        public LocalDateTime getTimestamp() { return timestamp; }
        public NotificationPriority getPriority() { return priority; }

        public static Builder builder() {
            return new Builder();
        }

        public static class Builder {
            private String transactionId;
            private String orderId;
            private String customerId;
            private String title;
            private String message;
            private NotificationType notificationType;
            private BigDecimal amount;
            private String paymentMethod;
            private LocalDateTime timestamp;
            private NotificationPriority priority = NotificationPriority.NORMAL;

            public Builder transactionId(String transactionId) {
                this.transactionId = transactionId;
                return this;
            }

            public Builder orderId(String orderId) {
                this.orderId = orderId;
                return this;
            }

            public Builder customerId(String customerId) {
                this.customerId = customerId;
                return this;
            }

            public Builder title(String title) {
                this.title = title;
                return this;
            }

            public Builder message(String message) {
                this.message = message;
                return this;
            }

            public Builder notificationType(NotificationType notificationType) {
                this.notificationType = notificationType;
                return this;
            }

            public Builder amount(BigDecimal amount) {
                this.amount = amount;
                return this;
            }

            public Builder paymentMethod(String paymentMethod) {
                this.paymentMethod = paymentMethod;
                return this;
            }

            public Builder timestamp(LocalDateTime timestamp) {
                this.timestamp = timestamp;
                return this;
            }

            public Builder priority(NotificationPriority priority) {
                this.priority = priority;
                return this;
            }

            public PaymentNotification build() {
                return new PaymentNotification(this);
            }
        }
    }
}
