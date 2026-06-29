package com.MaSoVa.commerce.unit.service;

import com.MaSoVa.commerce.order.entity.Order;
import com.MaSoVa.commerce.order.entity.Order.OrderStatus;
import com.MaSoVa.commerce.order.entity.Order.OrderType;
import com.MaSoVa.commerce.order.service.CustomerNotificationService;
import com.MaSoVa.commerce.order.service.OrderEventPublisher;
import com.MaSoVa.shared.messaging.events.OrderStatusChangedEvent;
import com.MaSoVa.commerce.order.websocket.OrderWebSocketController;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.HttpMethod;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import org.mockito.ArgumentCaptor;
import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@SuppressWarnings("unchecked")
class CustomerNotificationServiceTest {

    @Mock private OrderWebSocketController webSocketController;
    @Mock private RestTemplate restTemplate;
    @Mock private OrderEventPublisher orderEventPublisher;

    private CustomerNotificationService notificationService;

    @BeforeEach
    void setUp() {
        notificationService = new CustomerNotificationService(
                webSocketController,
                restTemplate,
                "http://localhost:8085",
                "http://localhost:8085",
                "http://localhost:8085",
                "http://localhost:3000",
                orderEventPublisher
        );
    }

    private Order buildOrder(String id, OrderStatus status, OrderType type) {
        Order order = new Order();
        order.setId(id);
        order.setOrderNumber("ORD-001");
        order.setCustomerId("cust-1");
        order.setCustomerEmail("customer@gmail.com");
        order.setCustomerPhone("9876543210");
        order.setStoreId("store-1");
        order.setStatus(status);
        order.setOrderType(type);
        order.setTotal(BigDecimal.valueOf(200));
        order.setPreparationTime(20);
        return order;
    }

    @Test
    void sendOrderStatusNotification_sends_websocket_for_customer() {
        Order order = buildOrder("o1", OrderStatus.PREPARING, OrderType.TAKEAWAY);

        notificationService.sendOrderStatusNotification(order, OrderStatus.RECEIVED);

        verify(webSocketController).sendOrderUpdateToCustomer(eq("cust-1"), any(Order.class));
    }

    @Test
    void sendOrderStatusNotification_skips_when_no_customerId() {
        Order order = buildOrder("o1", OrderStatus.PREPARING, OrderType.TAKEAWAY);
        order.setCustomerId(null);

        notificationService.sendOrderStatusNotification(order, OrderStatus.RECEIVED);

        verify(webSocketController, never()).sendOrderUpdateToCustomer(any(), any());
    }

    @Test
    void sendOrderStatusNotification_skips_when_empty_customerId() {
        Order order = buildOrder("o1", OrderStatus.PREPARING, OrderType.TAKEAWAY);
        order.setCustomerId("");

        notificationService.sendOrderStatusNotification(order, OrderStatus.RECEIVED);

        verify(webSocketController, never()).sendOrderUpdateToCustomer(any(), any());
    }

    @Test
    void sendOrderStatusNotification_publishes_amqp_event() {
        Order order = buildOrder("o1", OrderStatus.DISPATCHED, OrderType.DELIVERY);

        notificationService.sendOrderStatusNotification(order, OrderStatus.BAKED);

        verify(orderEventPublisher).publishOrderStatusChanged(any());
    }

    @Test
    void sendOrderStatusNotification_publishes_vat_fields_on_amqp_event() {
        Order order = buildOrder("o1", OrderStatus.DISPATCHED, OrderType.DELIVERY);
        order.setVatCountryCode("DE");
        order.setTotalVatAmount(BigDecimal.valueOf(1.90));
        order.setCurrency("EUR");

        notificationService.sendOrderStatusNotification(order, OrderStatus.BAKED);

        ArgumentCaptor<OrderStatusChangedEvent> captor = ArgumentCaptor.forClass(OrderStatusChangedEvent.class);
        verify(orderEventPublisher).publishOrderStatusChanged(captor.capture());
        OrderStatusChangedEvent event = captor.getValue();
        assertThat(event.getVatCountryCode()).isEqualTo("DE");
        assertThat(event.getTotalVatAmount().doubleValue()).isCloseTo(1.90, org.assertj.core.data.Offset.offset(0.01));
        assertThat(event.getCurrency()).isEqualTo("EUR");
    }

    @Test
    void sendOrderStatusNotification_does_not_throw_on_exception() {
        Order order = buildOrder("o1", OrderStatus.PREPARING, OrderType.TAKEAWAY);
        doThrow(new RuntimeException("WebSocket error"))
                .when(webSocketController).sendOrderUpdateToCustomer(any(), any());

        // Must not propagate exception
        notificationService.sendOrderStatusNotification(order, OrderStatus.RECEIVED);
    }

    @Test
    void sendOrderStatusNotification_sends_email_for_PREPARING_status() {
        Order order = buildOrder("o1", OrderStatus.PREPARING, OrderType.TAKEAWAY);
        when(restTemplate.exchange(any(String.class), eq(HttpMethod.POST), any(), any(Class.class)))
                .thenReturn(org.springframework.http.ResponseEntity.ok(null));

        notificationService.sendOrderStatusNotification(order, OrderStatus.RECEIVED);

        verify(restTemplate, atLeastOnce()).exchange(any(String.class), eq(HttpMethod.POST), any(), any(Class.class));
    }

    @Test
    void sendOrderStatusNotification_skips_email_for_OVEN_status() {
        Order order = buildOrder("o1", OrderStatus.OVEN, OrderType.TAKEAWAY);

        notificationService.sendOrderStatusNotification(order, OrderStatus.PREPARING);

        // OVEN is not an important status milestone — no email
        verify(restTemplate, never()).exchange(any(String.class), eq(HttpMethod.POST), any(), any(Class.class));
    }

    @Test
    void sendDriverAssignmentNotification_sends_websocket() {
        Order order = buildOrder("o1", OrderStatus.DISPATCHED, OrderType.DELIVERY);

        notificationService.sendDriverAssignmentNotification(order, "John Driver", "9999999999");

        verify(webSocketController).sendOrderUpdateToCustomer(eq("cust-1"), any(Order.class));
    }

    @Test
    void sendDriverAssignmentNotification_skips_when_no_customerId() {
        Order order = buildOrder("o1", OrderStatus.DISPATCHED, OrderType.DELIVERY);
        order.setCustomerId(null);

        notificationService.sendDriverAssignmentNotification(order, "John", "9999999999");

        verify(webSocketController, never()).sendOrderUpdateToCustomer(any(), any());
    }

    @Test
    void sendDriverAssignmentNotification_handles_null_driver_name() {
        Order order = buildOrder("o1", OrderStatus.DISPATCHED, OrderType.DELIVERY);

        // Should not throw with null driver name
        notificationService.sendDriverAssignmentNotification(order, null, null);

        verify(webSocketController).sendOrderUpdateToCustomer(eq("cust-1"), any(Order.class));
    }

    @Test
    void sendDeliveryOtpNotification_sends_websocket_and_email() {
        Order order = buildOrder("o1", OrderStatus.DISPATCHED, OrderType.DELIVERY);
        when(restTemplate.exchange(any(String.class), eq(HttpMethod.POST), any(), any(Class.class)))
                .thenReturn(org.springframework.http.ResponseEntity.ok(null));

        notificationService.sendDeliveryOtpNotification(order, "1234");

        verify(webSocketController).sendOrderUpdateToCustomer(eq("cust-1"), any(Order.class));
        // Email sent since customerEmail is set
        verify(restTemplate).exchange(any(String.class), eq(HttpMethod.POST), any(), any(Class.class));
    }

    @Test
    void sendDeliveryOtpNotification_skips_when_no_customerId() {
        Order order = buildOrder("o1", OrderStatus.DISPATCHED, OrderType.DELIVERY);
        order.setCustomerId(null);

        notificationService.sendDeliveryOtpNotification(order, "5678");

        verify(webSocketController, never()).sendOrderUpdateToCustomer(any(), any());
    }

    @Test
    void sendDeliveryOtpNotification_skips_email_when_no_customer_email() {
        Order order = buildOrder("o1", OrderStatus.DISPATCHED, OrderType.DELIVERY);
        order.setCustomerEmail(null);

        notificationService.sendDeliveryOtpNotification(order, "9999");

        verify(webSocketController).sendOrderUpdateToCustomer(eq("cust-1"), any(Order.class));
        verify(restTemplate, never()).exchange(any(String.class), eq(HttpMethod.POST), any(), any(Class.class));
    }

    @Test
    void sendDriverNearbyNotification_sends_websocket() {
        Order order = buildOrder("o1", OrderStatus.DISPATCHED, OrderType.DELIVERY);

        notificationService.sendDriverNearbyNotification(order, "John", 5);

        verify(webSocketController).sendOrderUpdateToCustomer(eq("cust-1"), any(Order.class));
    }

    @Test
    void sendDriverArrivedNotification_sends_websocket() {
        Order order = buildOrder("o1", OrderStatus.DISPATCHED, OrderType.DELIVERY);

        notificationService.sendDriverArrivedNotification(order, "Jane Driver");

        verify(webSocketController).sendOrderUpdateToCustomer(eq("cust-1"), any(Order.class));
    }

    @Test
    void sendDeliveryConfirmationNotification_sends_websocket() {
        Order order = buildOrder("o1", OrderStatus.DELIVERED, OrderType.DELIVERY);

        notificationService.sendDeliveryConfirmationNotification(order);

        verify(webSocketController).sendOrderUpdateToCustomer(eq("cust-1"), any(Order.class));
    }
}
