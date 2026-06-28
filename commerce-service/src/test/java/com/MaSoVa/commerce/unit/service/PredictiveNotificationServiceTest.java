package com.MaSoVa.commerce.unit.service;

import com.MaSoVa.commerce.order.entity.Order;
import com.MaSoVa.commerce.order.service.OrderService;
import com.MaSoVa.commerce.order.service.PredictiveNotificationService;
import com.MaSoVa.commerce.order.websocket.OrderWebSocketController;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.concurrent.CompletableFuture;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class PredictiveNotificationServiceTest {

    @Mock private OrderService orderService;
    @Mock private OrderWebSocketController webSocketController;

    private PredictiveNotificationService buildService() {
        return new PredictiveNotificationService(orderService, webSocketController);
    }

    private Order buildDeliveryOrder(boolean fresh) {
        Order order = new Order();
        order.setId("o1");
        order.setOrderNumber("ORD-001");
        order.setStoreId("store-1");
        order.setOrderType(Order.OrderType.DELIVERY);
        order.setPaymentStatus(Order.PaymentStatus.PENDING);
        order.setStatus(Order.OrderStatus.RECEIVED);
        order.setPriority(Order.Priority.NORMAL);
        order.setTotal(BigDecimal.valueOf(200));
        order.setItems(Collections.emptyList());
        // Fresh = created within last 2 minutes, stale = 10 minutes ago
        order.setCreatedAt(fresh ? LocalDateTime.now().minusSeconds(30) : LocalDateTime.now().minusMinutes(10));
        return order;
    }

    @Test
    void triggerPredictiveAlert_sends_websocket_for_qualifying_delivery_order() throws Exception {
        PredictiveNotificationService svc = buildService();
        Order order = buildDeliveryOrder(true);

        CompletableFuture<Void> future = svc.triggerPredictiveAlert(order);
        future.get();

        verify(webSocketController).sendKitchenQueueUpdate(eq("store-1"), eq(order));
    }

    @Test
    void triggerPredictiveAlert_skips_stale_order() throws Exception {
        PredictiveNotificationService svc = buildService();
        Order order = buildDeliveryOrder(false); // 10 mins ago = not fresh

        CompletableFuture<Void> future = svc.triggerPredictiveAlert(order);
        future.get();

        verify(webSocketController, never()).sendKitchenQueueUpdate(any(), any());
    }

    @Test
    void triggerPredictiveAlert_skips_dine_in_order() throws Exception {
        PredictiveNotificationService svc = buildService();
        Order order = buildDeliveryOrder(true);
        order.setOrderType(Order.OrderType.DINE_IN);

        CompletableFuture<Void> future = svc.triggerPredictiveAlert(order);
        future.get();

        verify(webSocketController, never()).sendKitchenQueueUpdate(any(), any());
    }

    @Test
    void triggerPredictiveAlert_skips_paid_order() throws Exception {
        PredictiveNotificationService svc = buildService();
        Order order = buildDeliveryOrder(true);
        order.setPaymentStatus(Order.PaymentStatus.PAID);

        CompletableFuture<Void> future = svc.triggerPredictiveAlert(order);
        future.get();

        verify(webSocketController, never()).sendKitchenQueueUpdate(any(), any());
    }

    @Test
    void triggerPredictiveAlert_skips_non_received_order() throws Exception {
        PredictiveNotificationService svc = buildService();
        Order order = buildDeliveryOrder(true);
        order.setStatus(Order.OrderStatus.PREPARING);

        CompletableFuture<Void> future = svc.triggerPredictiveAlert(order);
        future.get();

        verify(webSocketController, never()).sendKitchenQueueUpdate(any(), any());
    }

    @Test
    void triggerPredictiveAlert_works_for_takeaway_order() throws Exception {
        PredictiveNotificationService svc = buildService();
        Order order = buildDeliveryOrder(true);
        order.setOrderType(Order.OrderType.TAKEAWAY);

        CompletableFuture<Void> future = svc.triggerPredictiveAlert(order);
        future.get();

        verify(webSocketController).sendKitchenQueueUpdate(eq("store-1"), eq(order));
    }

    @Test
    void cancelPredictiveAlert_broadcasts_cancellation() throws Exception {
        PredictiveNotificationService svc = buildService();
        Order order = buildDeliveryOrder(true);

        CompletableFuture<Void> future = svc.cancelPredictiveAlert(order);
        future.get();

        verify(webSocketController).sendKitchenQueueUpdate(eq("store-1"), eq(order));
    }

    @Test
    void confirmPredictiveAlert_broadcasts_confirmation() throws Exception {
        PredictiveNotificationService svc = buildService();
        Order order = buildDeliveryOrder(true);

        CompletableFuture<Void> future = svc.confirmPredictiveAlert(order);
        future.get();

        verify(webSocketController).sendKitchenQueueUpdate(eq("store-1"), eq(order));
    }

    @Test
    void checkPredictiveAlerts_does_not_throw() {
        PredictiveNotificationService svc = buildService();
        // Scheduled method — just verify it doesn't throw
        svc.checkPredictiveAlerts();
    }
}
