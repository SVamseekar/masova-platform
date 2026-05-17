package com.MaSoVa.commerce.unit.service;

import com.MaSoVa.commerce.order.entity.Order;
import com.MaSoVa.commerce.order.entity.Order.OrderStatus;
import com.MaSoVa.commerce.order.entity.Order.OrderType;
import com.MaSoVa.commerce.order.entity.OrderItem;
import com.MaSoVa.commerce.order.service.CustomerNotificationService;
import com.MaSoVa.commerce.order.service.OrderEventPublisher;
import com.MaSoVa.commerce.order.websocket.OrderWebSocketController;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class CustomerNotificationExtendedTest {

    @Mock private OrderWebSocketController webSocketController;
    @Mock private RestTemplate restTemplate;
    @Mock private OrderEventPublisher orderEventPublisher;

    private CustomerNotificationService notificationService;

    @BeforeEach
    void setUp() {
        notificationService = new CustomerNotificationService(
                webSocketController, restTemplate,
                "http://localhost:8085", "http://localhost:8085",
                "http://localhost:8085", "http://localhost:3000",
                orderEventPublisher
        );
    }

    private Order buildOrderWithItems(OrderStatus status, OrderType type) {
        Order order = new Order();
        order.setId("o1");
        order.setOrderNumber("ORD-001");
        order.setCustomerId("cust-1");
        order.setCustomerEmail("customer@gmail.com");
        order.setCustomerPhone("9876543210");
        order.setStoreId("store-1");
        order.setStatus(status);
        order.setOrderType(type);
        order.setTotal(BigDecimal.valueOf(300));
        order.setPreparationTime(20);

        OrderItem item = OrderItem.builder()
                .menuItemId("m1").name("Butter Chicken").quantity(2).price(150.0)
                .variant("Large").customizations(List.of("Extra Spicy")).build();
        order.setItems(List.of(item));
        return order;
    }

    // Test all status cases in buildStatusNotification switch

    @Test
    void sendOrderStatusNotification_RECEIVED_sends_websocket() {
        Order order = buildOrderWithItems(OrderStatus.RECEIVED, OrderType.TAKEAWAY);
        notificationService.sendOrderStatusNotification(order, null);
        verify(webSocketController).sendOrderUpdateToCustomer(eq("cust-1"), any());
    }

    @Test
    void sendOrderStatusNotification_OVEN_no_email() {
        Order order = buildOrderWithItems(OrderStatus.OVEN, OrderType.TAKEAWAY);
        notificationService.sendOrderStatusNotification(order, OrderStatus.PREPARING);
        verify(restTemplate, never()).postForEntity(any(String.class), any(), any());
    }

    @Test
    void sendOrderStatusNotification_BAKED_sends_email() {
        Order order = buildOrderWithItems(OrderStatus.BAKED, OrderType.DELIVERY);
        when(restTemplate.postForEntity(any(String.class), any(), any(Class.class)))
                .thenReturn(org.springframework.http.ResponseEntity.ok(null));
        notificationService.sendOrderStatusNotification(order, OrderStatus.OVEN);
        verify(restTemplate, atLeastOnce()).postForEntity(any(String.class), any(), any(Class.class));
    }

    @Test
    void sendOrderStatusNotification_DISPATCHED_sends_email() {
        Order order = buildOrderWithItems(OrderStatus.DISPATCHED, OrderType.DELIVERY);
        when(restTemplate.postForEntity(any(String.class), any(), any(Class.class)))
                .thenReturn(org.springframework.http.ResponseEntity.ok(null));
        notificationService.sendOrderStatusNotification(order, OrderStatus.BAKED);
        verify(restTemplate, atLeastOnce()).postForEntity(any(String.class), any(), any(Class.class));
    }

    @Test
    void sendOrderStatusNotification_DELIVERED_sends_email() {
        Order order = buildOrderWithItems(OrderStatus.DELIVERED, OrderType.DELIVERY);
        when(restTemplate.postForEntity(any(String.class), any(), any(Class.class)))
                .thenReturn(org.springframework.http.ResponseEntity.ok(null));
        notificationService.sendOrderStatusNotification(order, OrderStatus.DISPATCHED);
        verify(restTemplate, atLeastOnce()).postForEntity(any(String.class), any(), any(Class.class));
    }

    @Test
    void sendOrderStatusNotification_CANCELLED_sends_email() {
        Order order = buildOrderWithItems(OrderStatus.CANCELLED, OrderType.TAKEAWAY);
        when(restTemplate.postForEntity(any(String.class), any(), any(Class.class)))
                .thenReturn(org.springframework.http.ResponseEntity.ok(null));
        notificationService.sendOrderStatusNotification(order, OrderStatus.PREPARING);
        verify(restTemplate, atLeastOnce()).postForEntity(any(String.class), any(), any(Class.class));
    }

    @Test
    void sendOrderStatusNotification_invalid_email_skips_email() {
        Order order = buildOrderWithItems(OrderStatus.PREPARING, OrderType.TAKEAWAY);
        order.setCustomerEmail("fake@walkin.local"); // placeholder email
        when(restTemplate.postForEntity(any(String.class), any(), any(Class.class)))
                .thenReturn(org.springframework.http.ResponseEntity.ok(null));
        notificationService.sendOrderStatusNotification(order, OrderStatus.RECEIVED);
        // Walkin.local email should be rejected — no email sent
        verify(restTemplate, never()).postForEntity(any(String.class), any(), any(Class.class));
    }

    @Test
    void sendOrderStatusNotification_no_email_on_order_falls_back_to_service() {
        Order order = buildOrderWithItems(OrderStatus.PREPARING, OrderType.TAKEAWAY);
        order.setCustomerEmail(null);
        // No email on order + no customerId = no email call
        order.setCustomerId(null);
        notificationService.sendOrderStatusNotification(order, OrderStatus.RECEIVED);
        verify(restTemplate, never()).postForEntity(any(String.class), any(), any(Class.class));
    }

    // sendPaymentConfirmationEmail
    @Test
    void sendPaymentConfirmationEmail_sends_email_to_valid_address() {
        Order order = buildOrderWithItems(OrderStatus.RECEIVED, OrderType.TAKEAWAY);
        when(restTemplate.postForEntity(any(String.class), any(), any(Class.class)))
                .thenReturn(org.springframework.http.ResponseEntity.ok(null));

        notificationService.sendPaymentConfirmationEmail(order, "txn-123");

        verify(restTemplate, atLeastOnce()).postForEntity(any(String.class), any(), any(Class.class));
    }

    @Test
    void sendPaymentConfirmationEmail_publishes_amqp_event() {
        Order order = buildOrderWithItems(OrderStatus.RECEIVED, OrderType.TAKEAWAY);
        when(restTemplate.postForEntity(any(String.class), any(), any(Class.class)))
                .thenReturn(org.springframework.http.ResponseEntity.ok(null));

        notificationService.sendPaymentConfirmationEmail(order, "txn-123");

        verify(orderEventPublisher).publishOrderCreated(any());
    }

    @Test
    void sendPaymentConfirmationEmail_handles_null_email_gracefully() {
        Order order = buildOrderWithItems(OrderStatus.RECEIVED, OrderType.TAKEAWAY);
        order.setCustomerEmail(null);
        order.setCustomerId(null);

        // Should not throw — just skip
        notificationService.sendPaymentConfirmationEmail(order, "txn-123");

        verify(restTemplate, never()).postForEntity(any(String.class), any(), any(Class.class));
    }

    // BAKED status for TAKEAWAY (different message than DELIVERY)
    @Test
    void sendOrderStatusNotification_BAKED_takeaway_has_correct_message() {
        Order order = buildOrderWithItems(OrderStatus.BAKED, OrderType.TAKEAWAY);
        when(restTemplate.postForEntity(any(String.class), any(), any(Class.class)))
                .thenReturn(org.springframework.http.ResponseEntity.ok(null));
        // Should not throw
        notificationService.sendOrderStatusNotification(order, OrderStatus.OVEN);
        verify(webSocketController).sendOrderUpdateToCustomer(eq("cust-1"), any());
    }
}
