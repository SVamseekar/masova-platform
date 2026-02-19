package com.MaSoVa.notification.service;

import com.MaSoVa.shared.messaging.events.OrderCreatedEvent;
import com.MaSoVa.shared.messaging.events.OrderStatusChangedEvent;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderEventListenerTest {

    @Mock
    private NotificationService notificationService;

    private OrderEventListener listener;

    @BeforeEach
    void setUp() {
        listener = new OrderEventListener(notificationService);
    }

    @Test
    void onOrderCreated_delegatesToNotificationService() {
        OrderCreatedEvent event = new OrderCreatedEvent(
                "order-1", "customer-1", "store-1", "DELIVERY",
                new BigDecimal("29.99"), "INR");

        listener.onOrderCreated(event);

        verify(notificationService).handleOrderCreatedEvent(event);
    }

    @Test
    void onOrderStatusChanged_delegatesToNotificationService() {
        OrderStatusChangedEvent event = new OrderStatusChangedEvent(
                "order-1", "customer-1", "PENDING", "PREPARING", "store-1");

        listener.onOrderStatusChanged(event);

        verify(notificationService).handleOrderStatusChangedEvent(event);
    }

    @Test
    void onOrderCreated_whenNotificationServiceThrows_doesNotPropagate() {
        OrderCreatedEvent event = new OrderCreatedEvent(
                "order-1", "customer-1", "store-1", "DELIVERY",
                new BigDecimal("29.99"), "INR");
        doThrow(new RuntimeException("DB error")).when(notificationService).handleOrderCreatedEvent(event);

        // Should not throw — message must be ACK'd to prevent infinite DLQ loop
        org.junit.jupiter.api.Assertions.assertDoesNotThrow(() -> listener.onOrderCreated(event));
    }
}
