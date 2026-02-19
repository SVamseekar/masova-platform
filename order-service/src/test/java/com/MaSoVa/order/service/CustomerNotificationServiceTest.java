package com.MaSoVa.order.service;

import com.MaSoVa.order.entity.Order;
import com.MaSoVa.order.entity.Order.OrderStatus;
import com.MaSoVa.order.entity.Order.OrderType;
import com.MaSoVa.order.websocket.OrderWebSocketController;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
@DisplayName("CustomerNotificationService Unit Tests")
class CustomerNotificationServiceTest {

    @Mock
    private OrderWebSocketController webSocketController;

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private OrderEventPublisher orderEventPublisher;

    private CustomerNotificationService notificationService;

    private Order sampleOrder;

    @BeforeEach
    void setUp() {
        notificationService = new CustomerNotificationService(
                webSocketController,
                restTemplate,
                "http://localhost:8095",
                "http://localhost:8091",
                "http://localhost:8081",
                "http://localhost:3000",
                orderEventPublisher
        );

        sampleOrder = new Order();
        sampleOrder.setId("order-1");
        sampleOrder.setOrderNumber("ORD123456");
        sampleOrder.setCustomerId("cust-1");
        sampleOrder.setCustomerName("Test Customer");
        sampleOrder.setCustomerPhone("9876543210");
        sampleOrder.setStatus(OrderStatus.PREPARING);
        sampleOrder.setOrderType(OrderType.DELIVERY);
        sampleOrder.setTotal(BigDecimal.valueOf(500));
        sampleOrder.setPreparationTime(20);
    }

    // ======================================================================
    // sendOrderStatusNotification
    // ======================================================================

    @Nested
    @DisplayName("sendOrderStatusNotification")
    class SendOrderStatusNotification {

        @Test
        @DisplayName("Given order with customer ID, should send WebSocket notification")
        void shouldSendWebSocketNotification() {
            notificationService.sendOrderStatusNotification(sampleOrder, OrderStatus.RECEIVED);

            verify(webSocketController).sendOrderUpdateToCustomer(anyString(), any(Order.class));
        }

        @Test
        @DisplayName("Given order without customer ID, should skip notification")
        void shouldSkipNotificationWithoutCustomerId() {
            sampleOrder.setCustomerId(null);

            notificationService.sendOrderStatusNotification(sampleOrder, OrderStatus.RECEIVED);

            verify(webSocketController, never()).sendOrderUpdateToCustomer(anyString(), any());
        }

        @Test
        @DisplayName("Given order with empty customer ID, should skip notification")
        void shouldSkipNotificationWithEmptyCustomerId() {
            sampleOrder.setCustomerId("");

            notificationService.sendOrderStatusNotification(sampleOrder, OrderStatus.RECEIVED);

            verify(webSocketController, never()).sendOrderUpdateToCustomer(anyString(), any());
        }

        @Test
        @DisplayName("Given CANCELLED status, should still send notification")
        void shouldSendNotificationForCancellation() {
            sampleOrder.setStatus(OrderStatus.CANCELLED);

            notificationService.sendOrderStatusNotification(sampleOrder, OrderStatus.PREPARING);

            verify(webSocketController).sendOrderUpdateToCustomer(anyString(), any(Order.class));
        }

        @Test
        @DisplayName("Given DELIVERED status, should send notification")
        void shouldSendNotificationForDelivery() {
            sampleOrder.setStatus(OrderStatus.DELIVERED);

            notificationService.sendOrderStatusNotification(sampleOrder, OrderStatus.DISPATCHED);

            verify(webSocketController).sendOrderUpdateToCustomer(anyString(), any(Order.class));
        }
    }

    // ======================================================================
    // sendDriverAssignmentNotification
    // ======================================================================

    @Nested
    @DisplayName("sendDriverAssignmentNotification")
    class SendDriverAssignmentNotification {

        @Test
        @DisplayName("Given order with customer ID, should send driver assignment notification")
        void shouldSendDriverAssignmentNotification() {
            notificationService.sendDriverAssignmentNotification(sampleOrder, "John", "1234567890");

            verify(webSocketController).sendOrderUpdateToCustomer(anyString(), any(Order.class));
        }

        @Test
        @DisplayName("Given null driver name, should send notification with default text")
        void shouldHandleNullDriverName() {
            notificationService.sendDriverAssignmentNotification(sampleOrder, null, null);

            verify(webSocketController).sendOrderUpdateToCustomer(anyString(), any(Order.class));
        }

        @Test
        @DisplayName("Given null customer ID, should skip notification")
        void shouldSkipWhenNoCustomerId() {
            sampleOrder.setCustomerId(null);

            notificationService.sendDriverAssignmentNotification(sampleOrder, "John", "1234567890");

            verify(webSocketController, never()).sendOrderUpdateToCustomer(anyString(), any());
        }
    }

    // ======================================================================
    // sendDeliveryOtpNotification
    // ======================================================================

    @Nested
    @DisplayName("sendDeliveryOtpNotification")
    class SendDeliveryOtpNotification {

        @Test
        @DisplayName("Given order with customer ID, should send OTP notification")
        void shouldSendOtpNotification() {
            notificationService.sendDeliveryOtpNotification(sampleOrder, "1234");

            verify(webSocketController).sendOrderUpdateToCustomer(anyString(), any(Order.class));
        }

        @Test
        @DisplayName("Given null customer ID, should skip OTP notification")
        void shouldSkipOtpForNullCustomer() {
            sampleOrder.setCustomerId(null);

            notificationService.sendDeliveryOtpNotification(sampleOrder, "1234");

            verify(webSocketController, never()).sendOrderUpdateToCustomer(anyString(), any());
        }
    }

    // ======================================================================
    // sendDriverNearbyNotification
    // ======================================================================

    @Nested
    @DisplayName("sendDriverNearbyNotification")
    class SendDriverNearbyNotification {

        @Test
        @DisplayName("Given order with customer, should send driver nearby notification")
        void shouldSendDriverNearbyNotification() {
            notificationService.sendDriverNearbyNotification(sampleOrder, "John", 5);

            verify(webSocketController).sendOrderUpdateToCustomer(anyString(), any(Order.class));
        }

        @Test
        @DisplayName("Given 1 minute ETA, should use singular 'minute'")
        void shouldHandleSingularMinute() {
            notificationService.sendDriverNearbyNotification(sampleOrder, "John", 1);

            verify(webSocketController).sendOrderUpdateToCustomer(anyString(), any(Order.class));
        }

        @Test
        @DisplayName("Given null customer ID, should skip notification")
        void shouldSkipForNullCustomer() {
            sampleOrder.setCustomerId(null);

            notificationService.sendDriverNearbyNotification(sampleOrder, "John", 5);

            verify(webSocketController, never()).sendOrderUpdateToCustomer(anyString(), any());
        }
    }

    // ======================================================================
    // sendDriverArrivedNotification
    // ======================================================================

    @Test
    @DisplayName("Given order with customer, should send driver arrived notification")
    void shouldSendDriverArrivedNotification() {
        notificationService.sendDriverArrivedNotification(sampleOrder, "John");

        verify(webSocketController).sendOrderUpdateToCustomer(anyString(), any(Order.class));
    }

    @Test
    @DisplayName("Given null customer ID, should skip driver arrived notification")
    void shouldSkipDriverArrivedForNullCustomer() {
        sampleOrder.setCustomerId(null);

        notificationService.sendDriverArrivedNotification(sampleOrder, "John");

        verify(webSocketController, never()).sendOrderUpdateToCustomer(anyString(), any());
    }
}
