package com.MaSoVa.commerce.order.service;

import com.MaSoVa.commerce.order.entity.Order;
import com.MaSoVa.commerce.order.entity.Order.OrderStatus;
import com.MaSoVa.commerce.order.entity.OrderItem;
import com.MaSoVa.commerce.order.websocket.OrderWebSocketController;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.MaSoVa.shared.messaging.events.OrderCreatedEvent;
import com.MaSoVa.shared.messaging.events.OrderStatusChangedEvent;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Customer Notification Service
 *
 * Handles sending notifications to customers for order-related events.
 * Integrates with WebSocket for real-time updates and can be extended
 * for SMS/Email notifications.
 *
 * Production Readiness: This service provides the missing customer notification
 * integration identified in the audit.
 */
@Service
public class CustomerNotificationService {

    private static final Logger log = LoggerFactory.getLogger(CustomerNotificationService.class);

    private final OrderWebSocketController webSocketController;
    private final RestTemplate restTemplate;
    private final String notificationServiceUrl;
    private final String customerServiceUrl;
    private final String userServiceUrl;
    private final String frontendUrl;
    private final OrderEventPublisher orderEventPublisher;

    public CustomerNotificationService(
            OrderWebSocketController webSocketController,
            RestTemplate restTemplate,
            @Value("${services.notification.url:http://localhost:8085}") String notificationServiceUrl,
            @Value("${services.customer-service.url:http://localhost:8085}") String customerServiceUrl,
            @Value("${services.user.url:http://localhost:8085}") String userServiceUrl,
            @Value("${app.frontend.url:http://localhost:3000}") String frontendUrl,
            OrderEventPublisher orderEventPublisher
    ) {
        this.webSocketController = webSocketController;
        this.restTemplate = restTemplate;
        this.notificationServiceUrl = notificationServiceUrl;
        this.customerServiceUrl = customerServiceUrl;
        this.userServiceUrl = userServiceUrl;
        this.frontendUrl = frontendUrl;
        this.orderEventPublisher = orderEventPublisher;
    }

    /**
     * Send notification to customer when order status changes.
     * This is the main entry point called by OrderService.
     *
     * Note: NOT async to preserve request context (JWT token) for service-to-service calls
     */
    public void sendOrderStatusNotification(Order order, OrderStatus previousStatus) {
        if (order.getCustomerId() == null || order.getCustomerId().isEmpty()) {
            log.debug("No customer ID for order {}, skipping customer notification", order.getOrderNumber());
            return;
        }

        try {
            // Build notification based on new status
            CustomerNotification notification = buildStatusNotification(order, previousStatus);

            // Send via WebSocket for real-time updates
            sendWebSocketNotification(order.getCustomerId(), notification);

            // Send email only for important status updates (not RECEIVED)
            // Payment confirmation email from payment-service will handle initial order confirmation
            if (shouldSendStatusUpdateEmail(order.getStatus())) {
                sendOrderStatusUpdateEmail(order, notification);
            }

            // Log for audit
            log.info("Customer notification sent: orderId={}, customerId={}, status={}, message={}",
                    order.getId(), order.getCustomerId(), order.getStatus(), notification.getMessage());

            // [AMQP] Dual-publish status change event
            try {
                orderEventPublisher.publishOrderStatusChanged(new OrderStatusChangedEvent(
                    order.getId(), order.getCustomerId(),
                    previousStatus != null ? previousStatus.name() : null,
                    order.getStatus() != null ? order.getStatus().name() : null,
                    order.getStoreId()
                ));
            } catch (Exception e) {
                log.warn("[AMQP] dual-publish status change failed for order {}: {}", order.getId(), e.getMessage());
            }

        } catch (Exception e) {
            log.error("Failed to send customer notification for order: {}", order.getOrderNumber(), e);
            // Don't throw - notification failure shouldn't break order flow
        }
    }

    /**
     * Build notification based on order status
     */
    private CustomerNotification buildStatusNotification(Order order, OrderStatus previousStatus) {
        String message;
        String title;
        NotificationPriority priority = NotificationPriority.NORMAL;

        switch (order.getStatus()) {
            case RECEIVED:
                title = "Order Received";
                message = String.format("Your order #%s has been received. We'll start preparing it shortly.",
                        order.getOrderNumber());
                break;

            case PREPARING:
                title = "Order Being Prepared";
                message = String.format("Your order #%s is now being prepared. Estimated time: %d minutes.",
                        order.getOrderNumber(),
                        order.getPreparationTime() != null ? order.getPreparationTime() : 20);
                break;

            case OVEN:
                title = "Order in Oven";
                message = String.format("Your order #%s is now in the oven. Almost ready!",
                        order.getOrderNumber());
                break;

            case BAKED:
                title = "Order Ready for Pickup";
                if (order.getOrderType() == Order.OrderType.DELIVERY) {
                    message = String.format("Your order #%s is ready and will be dispatched shortly!",
                            order.getOrderNumber());
                } else {
                    message = String.format("Your order #%s is ready for pickup!",
                            order.getOrderNumber());
                }
                priority = NotificationPriority.HIGH;
                break;

            case DISPATCHED:
                title = "Order On The Way";
                message = String.format("Your order #%s is on its way! Driver has been assigned.",
                        order.getOrderNumber());
                priority = NotificationPriority.HIGH;
                break;

            case DELIVERED:
                title = "Order Delivered";
                message = String.format("Your order #%s has been delivered. Enjoy your meal! Thank you for ordering with us.",
                        order.getOrderNumber());
                priority = NotificationPriority.HIGH;
                break;

            case CANCELLED:
                title = "Order Cancelled";
                message = String.format("Your order #%s has been cancelled. If you didn't request this, please contact us.",
                        order.getOrderNumber());
                priority = NotificationPriority.URGENT;
                break;

            default:
                title = "Order Update";
                message = String.format("Your order #%s status has been updated to: %s",
                        order.getOrderNumber(), order.getStatus());
        }

        return CustomerNotification.builder()
                .orderId(order.getId())
                .orderNumber(order.getOrderNumber())
                .customerId(order.getCustomerId())
                .title(title)
                .message(message)
                .status(order.getStatus())
                .previousStatus(previousStatus)
                .priority(priority)
                .timestamp(LocalDateTime.now())
                .orderType(order.getOrderType())
                .estimatedDeliveryTime(order.getEstimatedDeliveryTime())
                .build();
    }

    /**
     * Send notification via WebSocket
     */
    private void sendWebSocketNotification(String customerId, CustomerNotification notification) {
        // Create payload for WebSocket
        Map<String, Object> payload = new HashMap<>();
        payload.put("type", "ORDER_STATUS_UPDATE");
        payload.put("orderId", notification.getOrderId());
        payload.put("orderNumber", notification.getOrderNumber());
        payload.put("title", notification.getTitle());
        payload.put("message", notification.getMessage());
        payload.put("status", notification.getStatus());
        payload.put("priority", notification.getPriority());
        payload.put("timestamp", notification.getTimestamp().toString());

        if (notification.getEstimatedDeliveryTime() != null) {
            payload.put("estimatedDeliveryTime", notification.getEstimatedDeliveryTime().toString());
        }

        // Send to customer's queue
        webSocketController.sendOrderUpdateToCustomer(customerId,
                createOrderUpdateFromNotification(notification));

        log.debug("WebSocket notification sent to customer: {}", customerId);
    }

    /**
     * Create Order-like object for WebSocket compatibility
     * In a real implementation, this might be a dedicated DTO
     */
    private Order createOrderUpdateFromNotification(CustomerNotification notification) {
        Order order = new Order();
        order.setId(notification.getOrderId());
        order.setOrderNumber(notification.getOrderNumber());
        order.setCustomerId(notification.getCustomerId());
        order.setStatus(notification.getStatus());
        order.setOrderType(notification.getOrderType());
        order.setEstimatedDeliveryTime(notification.getEstimatedDeliveryTime());
        return order;
    }

    /**
     * Send driver assignment notification to customer
     */
    @Async
    public void sendDriverAssignmentNotification(Order order, String driverName, String driverPhone) {
        if (order.getCustomerId() == null) {
            return;
        }

        try {
            String message = String.format(
                    "Your order #%s has been assigned to driver %s. They will deliver your order shortly.",
                    order.getOrderNumber(),
                    driverName != null ? driverName : "A driver"
            );

            CustomerNotification notification = CustomerNotification.builder()
                    .orderId(order.getId())
                    .orderNumber(order.getOrderNumber())
                    .customerId(order.getCustomerId())
                    .title("Driver Assigned")
                    .message(message)
                    .status(order.getStatus())
                    .priority(NotificationPriority.HIGH)
                    .timestamp(LocalDateTime.now())
                    .orderType(order.getOrderType())
                    .driverName(driverName)
                    .driverPhone(driverPhone)
                    .build();

            sendWebSocketNotification(order.getCustomerId(), notification);

            log.info("Driver assignment notification sent: orderId={}, customerId={}, driver={}",
                    order.getId(), order.getCustomerId(), driverName);

        } catch (Exception e) {
            log.error("Failed to send driver assignment notification for order: {}", order.getOrderNumber(), e);
        }
    }

    /**
     * Send delivery OTP notification to customer via WebSocket + Email (DELIV-002)
     */
    @Async
    public void sendDeliveryOtpNotification(Order order, String otp) {
        if (order.getCustomerId() == null) {
            return;
        }

        try {
            String message = String.format(
                    "Your delivery OTP for order #%s is: <strong>%s</strong>. " +
                    "Please share this code with the driver to confirm delivery. " +
                    "This code expires in 15 minutes.",
                    order.getOrderNumber(), otp
            );

            // WebSocket push
            CustomerNotification notification = CustomerNotification.builder()
                    .orderId(order.getId())
                    .orderNumber(order.getOrderNumber())
                    .customerId(order.getCustomerId())
                    .title("Delivery OTP: " + otp)
                    .message(message)
                    .status(order.getStatus())
                    .priority(NotificationPriority.HIGH)
                    .timestamp(LocalDateTime.now())
                    .orderType(order.getOrderType())
                    .build();

            sendWebSocketNotification(order.getCustomerId(), notification);

            // Email via core-service notification endpoint
            if (order.getCustomerEmail() != null && !order.getCustomerEmail().isEmpty()) {
                try {
                    Map<String, Object> emailPayload = new HashMap<>();
                    emailPayload.put("userId", order.getCustomerId());
                    emailPayload.put("title", "Your MaSoVa Delivery OTP for Order #" + order.getOrderNumber());
                    emailPayload.put("message", message);
                    emailPayload.put("type", "OTP");
                    emailPayload.put("channel", "EMAIL");
                    emailPayload.put("priority", "HIGH");
                    emailPayload.put("recipientEmail", order.getCustomerEmail());

                    HttpHeaders headers = new HttpHeaders();
                    headers.setContentType(MediaType.APPLICATION_JSON);
                    HttpEntity<Map<String, Object>> entity = new HttpEntity<>(emailPayload, headers);

                    restTemplate.postForObject(notificationServiceUrl + "/api/notifications/send", entity, Object.class);
                    log.info("Delivery OTP email sent to customer {} for order {}",
                            order.getCustomerId(), order.getOrderNumber());
                } catch (Exception emailEx) {
                    log.warn("Failed to send OTP email for order {}: {}", order.getOrderNumber(), emailEx.getMessage());
                }
            }

            log.info("Delivery OTP notification sent: orderId={}, customerId={}",
                    order.getId(), order.getCustomerId());

        } catch (Exception e) {
            log.error("Failed to send delivery OTP notification for order: {}", order.getOrderNumber(), e);
        }
    }

    /**
     * Send delivery confirmation notification to customer
     */
    @Async
    public void sendDeliveryConfirmationNotification(Order order) {
        if (order.getCustomerId() == null) {
            return;
        }

        try {
            String message = String.format(
                    "Your order #%s has been successfully delivered! Thank you for ordering with us. Enjoy your meal!",
                    order.getOrderNumber()
            );

            CustomerNotification notification = CustomerNotification.builder()
                    .orderId(order.getId())
                    .orderNumber(order.getOrderNumber())
                    .customerId(order.getCustomerId())
                    .title("Order Delivered")
                    .message(message)
                    .status(Order.OrderStatus.DELIVERED)
                    .priority(NotificationPriority.HIGH)
                    .timestamp(LocalDateTime.now())
                    .orderType(order.getOrderType())
                    .build();

            sendWebSocketNotification(order.getCustomerId(), notification);

            log.info("Delivery confirmation notification sent: orderId={}, customerId={}",
                    order.getId(), order.getCustomerId());

        } catch (Exception e) {
            log.error("Failed to send delivery confirmation notification for order: {}", order.getOrderNumber(), e);
        }
    }

    /**
     * Send "Driver 5 minutes away" notification to customer (NOTIF-005)
     * Called when driver's ETA is approximately 5 minutes
     */
    @Async
    public void sendDriverNearbyNotification(Order order, String driverName, int etaMinutes) {
        if (order.getCustomerId() == null) {
            return;
        }

        try {
            String message = String.format(
                    "Your order #%s is almost there! %s is approximately %d minute%s away. Please be ready to receive your order.",
                    order.getOrderNumber(),
                    driverName != null ? driverName : "Your driver",
                    etaMinutes,
                    etaMinutes == 1 ? "" : "s"
            );

            CustomerNotification notification = CustomerNotification.builder()
                    .orderId(order.getId())
                    .orderNumber(order.getOrderNumber())
                    .customerId(order.getCustomerId())
                    .title("Driver Almost There!")
                    .message(message)
                    .status(order.getStatus())
                    .priority(NotificationPriority.HIGH)
                    .timestamp(LocalDateTime.now())
                    .orderType(order.getOrderType())
                    .driverName(driverName)
                    .build();

            sendWebSocketNotification(order.getCustomerId(), notification);

            log.info("Driver nearby notification sent: orderId={}, customerId={}, eta={}min",
                    order.getId(), order.getCustomerId(), etaMinutes);

            // TODO: In production, also send via SMS for reliability
            // smsService.sendSms(order.getCustomerPhone(), message);

        } catch (Exception e) {
            log.error("Failed to send driver nearby notification for order: {}", order.getOrderNumber(), e);
        }
    }

    /**
     * Send driver arrived notification to customer (NOTIF-005)
     */
    @Async
    public void sendDriverArrivedNotification(Order order, String driverName) {
        if (order.getCustomerId() == null) {
            return;
        }

        try {
            String message = String.format(
                    "Your order #%s has arrived! %s is at your delivery location. Please have your delivery OTP ready.",
                    order.getOrderNumber(),
                    driverName != null ? driverName : "Your driver"
            );

            CustomerNotification notification = CustomerNotification.builder()
                    .orderId(order.getId())
                    .orderNumber(order.getOrderNumber())
                    .customerId(order.getCustomerId())
                    .title("Driver Has Arrived!")
                    .message(message)
                    .status(order.getStatus())
                    .priority(NotificationPriority.URGENT)
                    .timestamp(LocalDateTime.now())
                    .orderType(order.getOrderType())
                    .driverName(driverName)
                    .build();

            sendWebSocketNotification(order.getCustomerId(), notification);

            log.info("Driver arrived notification sent: orderId={}, customerId={}",
                    order.getId(), order.getCustomerId());

        } catch (Exception e) {
            log.error("Failed to send driver arrived notification for order: {}", order.getOrderNumber(), e);
        }
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
     * Customer Notification DTO
     */
    public static class CustomerNotification {
        private String orderId;
        private String orderNumber;
        private String customerId;
        private String title;
        private String message;
        private OrderStatus status;
        private OrderStatus previousStatus;
        private NotificationPriority priority;
        private LocalDateTime timestamp;
        private Order.OrderType orderType;
        private LocalDateTime estimatedDeliveryTime;
        private String driverName;
        private String driverPhone;

        private CustomerNotification(Builder builder) {
            this.orderId = builder.orderId;
            this.orderNumber = builder.orderNumber;
            this.customerId = builder.customerId;
            this.title = builder.title;
            this.message = builder.message;
            this.status = builder.status;
            this.previousStatus = builder.previousStatus;
            this.priority = builder.priority;
            this.timestamp = builder.timestamp;
            this.orderType = builder.orderType;
            this.estimatedDeliveryTime = builder.estimatedDeliveryTime;
            this.driverName = builder.driverName;
            this.driverPhone = builder.driverPhone;
        }

        // Getters
        public String getOrderId() { return orderId; }
        public String getOrderNumber() { return orderNumber; }
        public String getCustomerId() { return customerId; }
        public String getTitle() { return title; }
        public String getMessage() { return message; }
        public OrderStatus getStatus() { return status; }
        public OrderStatus getPreviousStatus() { return previousStatus; }
        public NotificationPriority getPriority() { return priority; }
        public LocalDateTime getTimestamp() { return timestamp; }
        public Order.OrderType getOrderType() { return orderType; }
        public LocalDateTime getEstimatedDeliveryTime() { return estimatedDeliveryTime; }
        public String getDriverName() { return driverName; }
        public String getDriverPhone() { return driverPhone; }

        public static Builder builder() {
            return new Builder();
        }

        public static class Builder {
            private String orderId;
            private String orderNumber;
            private String customerId;
            private String title;
            private String message;
            private OrderStatus status;
            private OrderStatus previousStatus;
            private NotificationPriority priority = NotificationPriority.NORMAL;
            private LocalDateTime timestamp;
            private Order.OrderType orderType;
            private LocalDateTime estimatedDeliveryTime;
            private String driverName;
            private String driverPhone;

            public Builder orderId(String orderId) {
                this.orderId = orderId;
                return this;
            }

            public Builder orderNumber(String orderNumber) {
                this.orderNumber = orderNumber;
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

            public Builder status(OrderStatus status) {
                this.status = status;
                return this;
            }

            public Builder previousStatus(OrderStatus previousStatus) {
                this.previousStatus = previousStatus;
                return this;
            }

            public Builder priority(NotificationPriority priority) {
                this.priority = priority;
                return this;
            }

            public Builder timestamp(LocalDateTime timestamp) {
                this.timestamp = timestamp;
                return this;
            }

            public Builder orderType(Order.OrderType orderType) {
                this.orderType = orderType;
                return this;
            }

            public Builder estimatedDeliveryTime(LocalDateTime estimatedDeliveryTime) {
                this.estimatedDeliveryTime = estimatedDeliveryTime;
                return this;
            }

            public Builder driverName(String driverName) {
                this.driverName = driverName;
                return this;
            }

            public Builder driverPhone(String driverPhone) {
                this.driverPhone = driverPhone;
                return this;
            }

            public CustomerNotification build() {
                return new CustomerNotification(this);
            }
        }
    }

    /**
     * Send order confirmation email ONLY (not for every status change)
     * Includes tracking link for customer to monitor order progress
     */
    private void sendOrderConfirmationEmail(Order order) {
        try {
            // Fetch customer email (checks order first, then external services)
            String customerEmail = fetchCustomerEmailFromOrder(order);
            if (customerEmail == null || customerEmail.isEmpty()) {
                log.debug("No email found for order {}, skipping order confirmation email", order.getOrderNumber());
                return;
            }

            // Build tracking URL (public page, no auth required)
            String trackingUrl = String.format("%s/tracking/%s",
                    frontendUrl, order.getId());

            // Build order confirmation message
            String message = buildOrderConfirmationMessage(order, trackingUrl);
            String title = "Order Confirmed - " + order.getOrderNumber();

            // Build request payload matching NotificationRequest DTO
            Map<String, Object> request = new HashMap<>();
            request.put("userId", order.getCustomerId());
            request.put("type", "ORDER_CONFIRMED");
            request.put("title", title);
            request.put("message", message);
            request.put("channel", "EMAIL");
            request.put("priority", "HIGH");
            request.put("recipientEmail", customerEmail);

            // Add phone if available for potential SMS
            if (order.getCustomerPhone() != null) {
                request.put("recipientPhone", order.getCustomerPhone());
            }

            // POST to notification-service
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            // JWT token automatically added by JwtForwardingInterceptor

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);
            String url = notificationServiceUrl + "/api/notifications/send";

            restTemplate.postForEntity(url, entity, Map.class);
            log.info("Order confirmation email sent for order: {} to {}",
                    order.getOrderNumber(), customerEmail);

        } catch (Exception e) {
            // Don't throw - email failure shouldn't break order flow
            log.warn("Failed to send order confirmation email for order {}: {}",
                    order.getOrderNumber(), e.getMessage());
        }
    }

    /**
     * Build order confirmation email message with professional HTML template (Uber-style)
     */
    private String buildOrderConfirmationMessage(Order order, String trackingUrl) {
        String formattedAmount = String.format("%.2f", order.getTotal());
        String estimatedTime = order.getPreparationTime() != null ?
                order.getPreparationTime() + " minutes" : "20-30 minutes";
        String orderType = order.getOrderType().toString().replace("_", " ");

        // Build order items HTML
        StringBuilder itemsHtml = new StringBuilder();
        itemsHtml.append("<div style='background-color: #F7F7F7; border-radius: 8px; padding: 20px; margin: 24px 0;'>");
        itemsHtml.append("<h3 style='margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #333;'>Order Items</h3>");

        if (order.getItems() != null && !order.getItems().isEmpty()) {
            for (OrderItem item : order.getItems()) {
                double itemTotal = item.getPrice() * item.getQuantity();
                itemsHtml.append("<div style='display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #E5E5E5;'>");
                itemsHtml.append("<div style='flex: 1;'>");
                itemsHtml.append("<div style='font-weight: 600; color: #000; margin-bottom: 4px;'>");
                itemsHtml.append(item.getQuantity()).append("x ").append(item.getName());
                itemsHtml.append("</div>");

                // Add variant if present
                if (item.getVariant() != null && !item.getVariant().isEmpty()) {
                    itemsHtml.append("<div style='font-size: 13px; color: #666; margin-bottom: 4px;'>");
                    itemsHtml.append("Size: ").append(item.getVariant());
                    itemsHtml.append("</div>");
                }

                // Add customizations if present
                if (item.getCustomizations() != null && !item.getCustomizations().isEmpty()) {
                    itemsHtml.append("<div style='font-size: 13px; color: #666;'>");
                    itemsHtml.append("Customizations: ").append(String.join(", ", item.getCustomizations()));
                    itemsHtml.append("</div>");
                }

                itemsHtml.append("</div>");
                itemsHtml.append("<div style='font-weight: 600; color: #FF6B35; font-size: 15px;'>");
                itemsHtml.append("₹").append(String.format("%.2f", itemTotal));
                itemsHtml.append("</div>");
                itemsHtml.append("</div>");
            }
        }
        itemsHtml.append("</div>");

        // Build store information section
        String storeInfo = "";
        if (order.getStoreId() != null && !order.getStoreId().isEmpty()) {
            storeInfo = String.format(
                    "<div style='background-color: #FFF8F5; border-left: 4px solid #FF6B35; padding: 16px; margin: 0 0 24px 0; border-radius: 4px;'>" +
                    "  <div style='font-size: 14px; color: #666;'>Order from:</div>" +
                    "  <div style='font-size: 16px; font-weight: 600; color: #333; margin-top: 4px;'>MaSoVa - Store %s</div>" +
                    "</div>",
                    order.getStoreId()
            );
        }

        return buildHtmlEmail(
                "Order Confirmed",
                String.format(
                        "<h2 style='color: #00B14F; margin: 0 0 24px 0;'>Order Confirmed!</h2>" +
                        "<p style='font-size: 16px; line-height: 24px; margin: 0 0 16px 0; color: #333;'>" +
                        "Thank you for your order. We're getting it ready for you!" +
                        "</p>" +

                        "%s" + // Store information section
                        "%s" + // Order items section

                        "<div style='background-color: #F7F7F7; border-radius: 8px; padding: 24px; margin: 24px 0;'>" +
                        "  <div style='display: flex; justify-content: space-between; margin-bottom: 16px;'>" +
                        "    <span style='color: #666;'>Order Number</span>" +
                        "    <span style='font-weight: 600; color: #000; font-family: monospace;'>%s</span>" +
                        "  </div>" +
                        "  <div style='display: flex; justify-content: space-between; margin-bottom: 16px;'>" +
                        "    <span style='color: #666;'>Order Type</span>" +
                        "    <span style='color: #000;'>%s</span>" +
                        "  </div>" +
                        "  <div style='display: flex; justify-content: space-between; margin-bottom: 16px;'>" +
                        "    <span style='color: #666;'>Total Amount</span>" +
                        "    <span style='font-weight: 600; color: #000; font-size: 18px;'>₹%s</span>" +
                        "  </div>" +
                        "  <div style='display: flex; justify-content: space-between;'>" +
                        "    <span style='color: #666;'>Estimated Time</span>" +
                        "    <span style='color: #000;'>%s</span>" +
                        "  </div>" +
                        "</div>" +

                        "<div style='text-align: center; margin: 32px 0;'>" +
                        "  <a href='%s' style='display: inline-block; padding: 14px 32px; background-color: #FF6B35; color: #FFFFFF; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;'>Track Your Order</a>" +
                        "</div>" +

                        "<div style='background-color: #FFF8F5; border-left: 4px solid #FF6B35; padding: 16px; margin: 24px 0; border-radius: 4px;'>" +
                        "  <p style='margin: 0; color: #666; font-size: 14px;'>You'll receive another email once your payment is confirmed. Track your order in real-time using the button above.</p>" +
                        "</div>",
                        storeInfo,
                        itemsHtml.toString(),
                        order.getOrderNumber(),
                        orderType,
                        formattedAmount,
                        estimatedTime,
                        trackingUrl
                )
        );
    }

    /**
     * Send payment confirmation email with order items
     */
    public void sendPaymentConfirmationEmail(Order order, String transactionId) {
        try {
            String customerEmail = fetchCustomerEmailFromOrder(order);
            if (customerEmail == null || customerEmail.isEmpty()) {
                log.debug("No email found for order {}, skipping payment confirmation email", order.getOrderNumber());
                return;
            }

            String trackingUrl = String.format("%s/tracking/%s", frontendUrl, order.getId());
            String message = buildPaymentConfirmationMessage(order, transactionId, trackingUrl);

            Map<String, Object> request = new HashMap<>();
            request.put("userId", order.getCustomerId());
            request.put("title", "Payment Confirmed");
            request.put("message", message);
            request.put("type", "PAYMENT_CONFIRMED");
            request.put("channel", "EMAIL");
            request.put("priority", "HIGH");
            request.put("recipientEmail", customerEmail);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);

            String url = notificationServiceUrl + "/api/notifications/send";
            restTemplate.postForEntity(url, entity, Map.class);

            log.info("Payment confirmation email sent for order: {}", order.getOrderNumber());

            // [AMQP] Dual-publish order created event
            try {
                orderEventPublisher.publishOrderCreated(new OrderCreatedEvent(
                    order.getId(), order.getCustomerId(), order.getStoreId(),
                    order.getOrderType() != null ? order.getOrderType().name() : "UNKNOWN",
                    order.getTotal(), "INR"
                ));
            } catch (Exception e) {
                log.warn("[AMQP] dual-publish failed for order {}: {}", order.getId(), e.getMessage());
            }
        } catch (Exception e) {
            log.error("Failed to send payment confirmation email for order: {}", order.getOrderNumber(), e);
        }
    }

    /**
     * Build payment confirmation message with order items
     */
    private String buildPaymentConfirmationMessage(Order order, String transactionId, String trackingUrl) {
        String formattedAmount = String.format("%.2f", order.getTotal());
        String orderType = order.getOrderType().toString().replace("_", " ");
        String paymentMethod = order.getPaymentMethod() != null ? order.getPaymentMethod().toString() : "CASH";

        // Build order items HTML
        StringBuilder itemsHtml = new StringBuilder();
        itemsHtml.append("<div style='background-color: #F7F7F7; border-radius: 8px; padding: 20px; margin: 24px 0;'>");
        itemsHtml.append("<h3 style='margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #333;'>Order Items</h3>");

        if (order.getItems() != null && !order.getItems().isEmpty()) {
            for (OrderItem item : order.getItems()) {
                double itemTotal = item.getPrice() * item.getQuantity();
                itemsHtml.append("<div style='display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #E5E5E5;'>");
                itemsHtml.append("<div style='flex: 1;'>");
                itemsHtml.append("<div style='font-weight: 600; color: #000; margin-bottom: 4px;'>");
                itemsHtml.append(item.getQuantity()).append("x ").append(item.getName());
                itemsHtml.append("</div>");

                if (item.getVariant() != null && !item.getVariant().isEmpty()) {
                    itemsHtml.append("<div style='font-size: 13px; color: #666; margin-bottom: 4px;'>");
                    itemsHtml.append("Size: ").append(item.getVariant());
                    itemsHtml.append("</div>");
                }

                if (item.getCustomizations() != null && !item.getCustomizations().isEmpty()) {
                    itemsHtml.append("<div style='font-size: 13px; color: #666;'>");
                    itemsHtml.append("Customizations: ").append(String.join(", ", item.getCustomizations()));
                    itemsHtml.append("</div>");
                }

                itemsHtml.append("</div>");
                itemsHtml.append("<div style='font-weight: 600; color: #FF6B35; font-size: 15px;'>");
                itemsHtml.append("₹").append(String.format("%.2f", itemTotal));
                itemsHtml.append("</div>");
                itemsHtml.append("</div>");
            }
        }
        itemsHtml.append("</div>");

        // Build store information
        String storeInfo = "";
        if (order.getStoreId() != null && !order.getStoreId().isEmpty()) {
            storeInfo = String.format(
                    "<div style='background-color: #FFF8F5; border-left: 4px solid #FF6B35; padding: 16px; margin: 0 0 24px 0; border-radius: 4px;'>" +
                    "  <div style='font-size: 14px; color: #666;'>Order from:</div>" +
                    "  <div style='font-size: 16px; font-weight: 600; color: #333; margin-top: 4px;'>MaSoVa - Store %s</div>" +
                    "</div>",
                    order.getStoreId()
            );
        }

        return buildHtmlEmail(
                "Payment Confirmed",
                String.format(
                        "<h2 style='color: #00B14F; margin: 0 0 24px 0;'>Payment Confirmed!</h2>" +
                        "<p style='font-size: 16px; line-height: 24px; margin: 0 0 16px 0; color: #333;'>" +
                        "Your payment has been successfully processed. We're preparing your order now!" +
                        "</p>" +

                        "%s" + // Store information
                        "%s" + // Order items section

                        "<div style='background-color: #F7F7F7; border-radius: 8px; padding: 24px; margin: 24px 0;'>" +
                        "  <div style='display: flex; justify-content: space-between; margin-bottom: 16px;'>" +
                        "    <span style='color: #666;'>Order Number</span>" +
                        "    <span style='font-weight: 600; color: #000; font-family: monospace;'>%s</span>" +
                        "  </div>" +
                        "  <div style='display: flex; justify-content: space-between; margin-bottom: 16px;'>" +
                        "    <span style='color: #666;'>Order Type</span>" +
                        "    <span style='color: #000;'>%s</span>" +
                        "  </div>" +
                        "  <div style='display: flex; justify-content: space-between; margin-bottom: 16px;'>" +
                        "    <span style='color: #666;'>Amount Paid</span>" +
                        "    <span style='font-weight: 600; color: #000; font-size: 18px;'>₹%s</span>" +
                        "  </div>" +
                        "  <div style='display: flex; justify-content: space-between; margin-bottom: 16px;'>" +
                        "    <span style='color: #666;'>Payment Method</span>" +
                        "    <span style='color: #000;'>%s</span>" +
                        "  </div>" +
                        "  <div style='display: flex; justify-content: space-between;'>" +
                        "    <span style='color: #666;'>Transaction ID</span>" +
                        "    <span style='color: #000; font-family: monospace; font-size: 12px;'>%s</span>" +
                        "  </div>" +
                        "</div>" +

                        "<div style='text-align: center; margin: 32px 0;'>" +
                        "  <a href='%s' style='display: inline-block; padding: 14px 32px; background-color: #FF6B35; color: #FFFFFF; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;'>Track Your Order</a>" +
                        "</div>",
                        storeInfo,
                        itemsHtml.toString(),
                        order.getOrderNumber(),
                        orderType,
                        formattedAmount,
                        paymentMethod,
                        transactionId != null ? transactionId : "N/A",
                        trackingUrl
                )
        );
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
     * Determine if status change should trigger an email notification
     * Send emails for important milestones, not every single status change
     */
    private boolean shouldSendStatusUpdateEmail(OrderStatus status) {
        switch (status) {
            case PREPARING:    // Order started cooking
            case BAKED:        // Order ready (important!)
            case DISPATCHED:   // Out for delivery (important!)
            case DELIVERED:    // Delivered (important!)
            case CANCELLED:    // Cancelled (important!)
                return true;
            case OVEN:         // Minor status, skip email (WebSocket is enough)
            case RECEIVED:     // Already handled separately
            default:
                return false;
        }
    }

    /**
     * Send order status update email (for status changes after order confirmation)
     */
    private void sendOrderStatusUpdateEmail(Order order, CustomerNotification notification) {
        try {
            // Fetch customer email (checks order first, then external services)
            String customerEmail = fetchCustomerEmailFromOrder(order);
            if (customerEmail == null || customerEmail.isEmpty()) {
                log.debug("No email found for order {}, skipping status update email", order.getOrderNumber());
                return;
            }

            // Build tracking URL (public page, no auth required)
            String trackingUrl = String.format("%s/tracking/%s",
                    frontendUrl, order.getId());

            // Build status update email content
            String emailContent = buildStatusUpdateEmailContent(order, notification, trackingUrl);
            String title = notification.getTitle() + " - Order " + order.getOrderNumber();

            // Build request payload matching NotificationRequest DTO
            Map<String, Object> request = new HashMap<>();
            request.put("userId", order.getCustomerId());
            request.put("type", "ORDER_STATUS_UPDATE");
            request.put("title", title);
            request.put("message", emailContent);
            request.put("channel", "EMAIL");
            request.put("priority", notification.getPriority().toString());
            request.put("recipientEmail", customerEmail);

            // Add phone if available for potential SMS
            if (order.getCustomerPhone() != null) {
                request.put("recipientPhone", order.getCustomerPhone());
            }

            // POST to notification-service
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            // JWT token automatically added by JwtForwardingInterceptor

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);
            String url = notificationServiceUrl + "/api/notifications/send";

            restTemplate.postForEntity(url, entity, Map.class);
            log.info("Order status update email sent for order: {} to {} (status: {})",
                    order.getOrderNumber(), customerEmail, order.getStatus());

        } catch (Exception e) {
            // Don't throw - email failure shouldn't break order flow
            log.warn("Failed to send status update email for order {}: {}",
                    order.getOrderNumber(), e.getMessage());
        }
    }

    /**
     * Build status update email content with professional HTML
     */
    private String buildStatusUpdateEmailContent(Order order, CustomerNotification notification, String trackingUrl) {
        String statusColor = getStatusColor(order.getStatus());
        String formattedAmount = String.format("%.2f", order.getTotal());

        // Additional info based on status
        String additionalInfo = "";
        if (order.getStatus() == OrderStatus.DISPATCHED && order.getEstimatedDeliveryTime() != null) {
            additionalInfo = String.format(
                    "<div style='background-color: #FFF8F5; border-left: 4px solid #FF6B35; padding: 16px; margin: 24px 0; border-radius: 4px;'>" +
                    "  <p style='margin: 0; color: #666; font-size: 14px;'>Expected delivery time: %s</p>" +
                    "</div>",
                    order.getEstimatedDeliveryTime().toString().substring(11, 16) // HH:mm format
            );
        } else if (order.getStatus() == OrderStatus.BAKED) {
            String pickupMessage = order.getOrderType() == Order.OrderType.DELIVERY ?
                    "Your order will be dispatched for delivery shortly!" :
                    "Your order is ready for pickup!";
            additionalInfo = String.format(
                    "<div style='background-color: #F0FFF4; border-left: 4px solid #00B14F; padding: 16px; margin: 24px 0; border-radius: 4px;'>" +
                    "  <p style='margin: 0; color: #666; font-size: 14px;'>%s</p>" +
                    "</div>",
                    pickupMessage
            );
        }

        return buildHtmlEmail(
                notification.getTitle(),
                String.format(
                        "<h2 style='color: %s; margin: 0 0 24px 0;'>%s</h2>" +
                        "<p style='font-size: 16px; line-height: 24px; margin: 0 0 16px 0; color: #333;'>" +
                        "%s" +
                        "</p>" +

                        "<div style='background-color: #F7F7F7; border-radius: 8px; padding: 24px; margin: 24px 0;'>" +
                        "  <div style='display: flex; justify-content: space-between; margin-bottom: 16px;'>" +
                        "    <span style='color: #666;'>Order Number</span>" +
                        "    <span style='font-weight: 600; color: #000; font-family: monospace;'>%s</span>" +
                        "  </div>" +
                        "  <div style='display: flex; justify-content: space-between; margin-bottom: 16px;'>" +
                        "    <span style='color: #666;'>Status</span>" +
                        "    <span style='font-weight: 600; color: %s;'>%s</span>" +
                        "  </div>" +
                        "  <div style='display: flex; justify-content: space-between;'>" +
                        "    <span style='color: #666;'>Total Amount</span>" +
                        "    <span style='color: #000;'>₹%s</span>" +
                        "  </div>" +
                        "</div>" +

                        "%s" +

                        "<div style='text-align: center; margin: 32px 0;'>" +
                        "  <a href='%s' style='display: inline-block; padding: 14px 32px; background-color: #FF6B35; color: #FFFFFF; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;'>Track Your Order</a>" +
                        "</div>",
                        statusColor,
                        notification.getTitle(),
                        notification.getMessage(),
                        order.getOrderNumber(),
                        statusColor,
                        getStatusDisplayName(order.getStatus()),
                        formattedAmount,
                        additionalInfo,
                        trackingUrl
                )
        );
    }

    /**
     * Get color for order status
     */
    private String getStatusColor(OrderStatus status) {
        switch (status) {
            case RECEIVED:
                return "#3498DB"; // Blue
            case PREPARING:
            case OVEN:
                return "#F39C12"; // Orange
            case BAKED:
                return "#00B14F"; // Green
            case DISPATCHED:
                return "#9B59B6"; // Purple
            case DELIVERED:
                return "#00B14F"; // Green
            case CANCELLED:
                return "#E74C3C"; // Red
            default:
                return "#95A5A6"; // Gray
        }
    }

    /**
     * Get display name for order status
     */
    private String getStatusDisplayName(OrderStatus status) {
        switch (status) {
            case RECEIVED:
                return "Order Received";
            case PREPARING:
                return "Preparing";
            case OVEN:
                return "In Oven";
            case BAKED:
                return "Ready";
            case DISPATCHED:
                return "Out for Delivery";
            case DELIVERED:
                return "Delivered";
            case CANCELLED:
                return "Cancelled";
            default:
                return status.toString();
        }
    }

    /**
     * Fetch customer email - check order first, then customer-service, then user-service
     * This approach works for all customer types (walk-in, registered, guest)
     */
    private String fetchCustomerEmail(String customerId) {
        // PRIORITY 1: Check if email is stored directly on the order (most reliable for walk-in customers)
        // This will be populated when the method is called with Order context
        // Note: This method signature needs to be updated to accept Order parameter
        // For now, we handle this in the calling methods

        // PRIORITY 2: Try customer-service (for POS walk-in customers)
        try {
            String customerUrl = customerServiceUrl + "/api/customers/" + customerId;
            log.debug("Fetching customer email from customer-service: {}", customerUrl);

            @SuppressWarnings("unchecked")
            Map<String, Object> customerResponse = restTemplate.getForObject(customerUrl, Map.class);

            if (customerResponse != null && customerResponse.containsKey("email")) {
                String email = (String) customerResponse.get("email");

                // Filter out placeholder walk-in emails
                if (email != null && email.endsWith("@walkin.local")) {
                    log.debug("Customer {} has placeholder walk-in email, skipping notification", customerId);
                    return null;
                }

                log.debug("Found valid email in customer-service for customer {}: {}", customerId, email);
                return email;
            }
        } catch (Exception e) {
            log.debug("Customer not found in customer-service: {}, trying user-service", customerId);
        }

        // PRIORITY 3: Fall back to user-service (for registered users)
        try {
            String userUrl = userServiceUrl + "/api/users/" + customerId;
            log.debug("Fetching customer email from user-service: {}", userUrl);

            @SuppressWarnings("unchecked")
            Map<String, Object> userResponse = restTemplate.getForObject(userUrl, Map.class);

            if (userResponse != null && userResponse.containsKey("email")) {
                String email = (String) userResponse.get("email");

                // Filter out placeholder walk-in emails
                if (email != null && email.endsWith("@walkin.local")) {
                    log.debug("User {} has placeholder walk-in email, skipping notification", customerId);
                    return null;
                }

                log.debug("Found valid email in user-service for customer {}: {}", customerId, email);
                return email;
            }

            log.warn("No email found in user response for customer: {}", customerId);
            return null;

        } catch (Exception e) {
            log.warn("Failed to fetch customer email from both services for customerId {}: {}",
                    customerId, e.getMessage());
            return null;
        }
    }

    /**
     * Fetch customer email with Order context - checks order email first
     * Returns null if email is missing, empty, or a placeholder
     */
    private String fetchCustomerEmailFromOrder(Order order) {
        // PRIORITY 1: Check if email is stored directly on the order (most reliable)
        if (order.getCustomerEmail() != null && !order.getCustomerEmail().trim().isEmpty()) {
            String email = order.getCustomerEmail().trim();

            // Validate email - reject placeholders and invalid formats
            if (!isValidEmail(email)) {
                log.debug("Order {} has invalid/placeholder email, skipping notification", order.getOrderNumber());
                return null;
            }

            log.debug("Using email from order for {}: {}", order.getOrderNumber(), email);
            return email;
        }

        // PRIORITY 2 & 3: Fall back to service calls if order doesn't have email
        if (order.getCustomerId() != null && !order.getCustomerId().isEmpty()) {
            String email = fetchCustomerEmail(order.getCustomerId());
            // Validate the fetched email too
            if (email != null && !isValidEmail(email)) {
                log.debug("Fetched email for order {} is invalid/placeholder, skipping notification",
                    order.getOrderNumber());
                return null;
            }
            return email;
        }

        log.debug("No customer ID or email on order {}, cannot send email", order.getOrderNumber());
        return null;
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
}
