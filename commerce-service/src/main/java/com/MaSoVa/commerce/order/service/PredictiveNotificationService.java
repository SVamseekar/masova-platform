package com.MaSoVa.commerce.order.service;

import com.MaSoVa.commerce.order.entity.Order;
import com.MaSoVa.commerce.order.entity.Order.OrderStatus;
import com.MaSoVa.commerce.order.entity.Order.PaymentStatus;
import com.MaSoVa.commerce.order.websocket.OrderWebSocketController;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.concurrent.CompletableFuture;

/**
 * Predictive Make-Table Notifications
 * Alerts kitchen to start preparation before payment completion
 * Based on MaSoVa real-world operational requirements
 */
@Service
public class PredictiveNotificationService {

    private static final Logger log = LoggerFactory.getLogger(PredictiveNotificationService.class);

    private final OrderWebSocketController webSocketController;

    public PredictiveNotificationService(OrderService orderService, OrderWebSocketController webSocketController) {
        this.webSocketController = webSocketController;
    }

    /**
     * Check for orders that need predictive kitchen alerts
     * Runs every 30 seconds
     */
    @Scheduled(fixedRate = 30000)
    public void checkPredictiveAlerts() {
        log.debug("Checking for predictive make-table alerts...");
        // Implementation would query orders in RECEIVED status with PENDING payment
        // In real production, this would be more sophisticated
    }

    /**
     * Trigger predictive notification for order
     * This is called when order is created with certain criteria
     */
    @Async
    public CompletableFuture<Void> triggerPredictiveAlert(Order order) {
        // Predictive logic: Alert kitchen if order meets criteria
        if (shouldTriggerPredictiveAlert(order)) {
            log.info("Triggering predictive make-table alert for order: {}", order.getOrderNumber());

            // Broadcast to kitchen
            webSocketController.sendKitchenQueueUpdate(order.getStoreId(), order);

            log.info("Predictive alert sent for order: {}", order.getOrderNumber());
        }

        return CompletableFuture.completedFuture(null);
    }

    /**
     * Determine if order qualifies for predictive alert
     *
     * Criteria:
     * - Order type is DELIVERY or TAKEAWAY (high confidence)
     * - Payment status is PENDING
     * - Order is in RECEIVED status
     * - Customer has good order history (future enhancement)
     */
    private boolean shouldTriggerPredictiveAlert(Order order) {
        // Basic criteria
        boolean isDeliveryOrTakeaway = order.getOrderType() == Order.OrderType.DELIVERY ||
                                       order.getOrderType() == Order.OrderType.TAKEAWAY;

        boolean isPendingPayment = order.getPaymentStatus() == PaymentStatus.PENDING;

        boolean isReceived = order.getStatus() == OrderStatus.RECEIVED;

        // Time-based: If order is fresh (within last 2 minutes)
        long minutesSinceCreation = ChronoUnit.MINUTES.between(order.getCreatedAt(), LocalDateTime.now());
        boolean isFreshOrder = minutesSinceCreation <= 2;

        return isDeliveryOrTakeaway && isPendingPayment && isReceived && isFreshOrder;
    }

    /**
     * Cancel predictive alert if payment fails
     */
    @Async
    public CompletableFuture<Void> cancelPredictiveAlert(Order order) {
        log.info("Cancelling predictive alert for order: {}", order.getOrderNumber());

        // Broadcast cancellation to kitchen
        webSocketController.sendKitchenQueueUpdate(order.getStoreId(), order);

        return CompletableFuture.completedFuture(null);
    }

    /**
     * Confirm predictive alert when payment succeeds
     */
    @Async
    public CompletableFuture<Void> confirmPredictiveAlert(Order order) {
        log.info("Confirming predictive alert for order: {}", order.getOrderNumber());

        // Broadcast confirmation to kitchen
        webSocketController.sendKitchenQueueUpdate(order.getStoreId(), order);

        return CompletableFuture.completedFuture(null);
    }

}
