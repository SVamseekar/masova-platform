package com.MaSoVa.commerce.unit.service;

import com.MaSoVa.commerce.order.client.*;
import com.MaSoVa.commerce.order.config.*;
import com.MaSoVa.commerce.order.entity.Order;
import com.MaSoVa.commerce.order.entity.Order.OrderStatus;
import com.MaSoVa.commerce.order.entity.Order.OrderType;
import com.MaSoVa.commerce.order.repository.OrderJpaRepository;
import com.MaSoVa.commerce.order.repository.OrderRepository;
import com.MaSoVa.commerce.order.service.*;
import com.MaSoVa.commerce.order.websocket.OrderWebSocketController;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/**
 * Security remediation Task 4 — Part A: order cancellation approval gate.
 * Requesting cancellation must NOT change order status; only a manager approval cancels it.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class OrderServiceCancellationRequestTest {

    @Mock private OrderRepository orderRepository;
    @Mock private OrderJpaRepository orderJpaRepository;
    @Mock private OrderItemSyncService orderItemSyncService;
    @Mock private OrderWebSocketController webSocketController;
    @Mock private MenuServiceClient menuServiceClient;
    @Mock private CustomerServiceClient customerServiceClient;
    @Mock private CustomerNotificationService customerNotificationService;
    @Mock private DeliveryServiceClient deliveryServiceClient;
    @Mock private StoreServiceClient storeServiceClient;
    @Mock private InventoryServiceClient inventoryServiceClient;
    @Mock private OrderEventPublisher orderEventPublisher;
    @Mock private AggregatorService aggregatorService;
    @Mock private com.MaSoVa.commerce.fiscal.FiscalSigningService fiscalSigningService;

    private OrderService orderService;

    @BeforeEach
    void setUp() {
        orderService = new OrderService(
                orderRepository, orderJpaRepository, orderItemSyncService,
                new ObjectMapper(), webSocketController, menuServiceClient,
                customerServiceClient, customerNotificationService, deliveryServiceClient,
                storeServiceClient, inventoryServiceClient,
                new TaxConfiguration(), new PreparationTimeConfiguration(),
                new DeliveryFeeConfiguration(), orderEventPublisher,
                new EuVatEngine(new EuVatConfiguration()), aggregatorService, fiscalSigningService
        );
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));
        when(orderJpaRepository.findByMongoId(any())).thenReturn(Optional.empty());
    }

    private Order buildOrder(String id, OrderStatus status) {
        Order order = new Order();
        order.setId(id);
        order.setOrderNumber("ORD-001");
        order.setStoreId("store-1");
        order.setCustomerId("cust-1");
        order.setStatus(status);
        order.setOrderType(OrderType.DELIVERY);
        order.setPriority(Order.Priority.NORMAL);
        order.setItems(Collections.emptyList());
        order.setTotal(BigDecimal.valueOf(200));
        return order;
    }

    @Test
    void requestCancellation_doesNotChangeStatus_andSetsPendingFlag() {
        Order order = buildOrder("o1", OrderStatus.PREPARING);
        when(orderRepository.findById("o1")).thenReturn(Optional.of(order));

        Order result = orderService.requestCancellation("o1", "Changed my mind", "cust-1");

        assertThat(result.getStatus()).isEqualTo(OrderStatus.PREPARING); // unchanged
        assertThat(result.isCancellationRequested()).isTrue();
        assertThat(result.getCancellationRequestReason()).isEqualTo("Changed my mind");
        assertThat(result.getCancellationRequestedBy()).isEqualTo("cust-1");
        assertThat(result.getCancellationRequestedAt()).isNotNull();
        assertThat(result.getCancelledAt()).isNull();
    }

    @Test
    void requestCancellation_rejectsDuplicatePendingRequest() {
        Order order = buildOrder("o1", OrderStatus.PREPARING);
        order.setCancellationRequested(true);
        when(orderRepository.findById("o1")).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> orderService.requestCancellation("o1", "again", "cust-1"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("already pending");
    }

    @Test
    void requestCancellation_rejectsDeliveredOrder() {
        Order order = buildOrder("o1", OrderStatus.DELIVERED);
        when(orderRepository.findById("o1")).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> orderService.requestCancellation("o1", "too late", "cust-1"))
                .isInstanceOf(RuntimeException.class);
    }

    @Test
    void approveCancellationRequest_cancelsTheOrder() {
        Order order = buildOrder("o1", OrderStatus.PREPARING);
        order.setCancellationRequested(true);
        order.setCancellationRequestReason("Changed my mind");
        when(orderRepository.findById("o1")).thenReturn(Optional.of(order));

        Order result = orderService.approveCancellationRequest("o1");

        assertThat(result.getStatus()).isEqualTo(OrderStatus.CANCELLED);
        assertThat(result.getCancelledAt()).isNotNull();
        assertThat(result.getCancellationReason()).isEqualTo("Changed my mind");
        assertThat(result.isCancellationRequested()).isFalse();
    }

    @Test
    void approveCancellationRequest_failsWhenNoPendingRequest() {
        Order order = buildOrder("o1", OrderStatus.PREPARING);
        when(orderRepository.findById("o1")).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> orderService.approveCancellationRequest("o1"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("No pending cancellation request");
    }

    @Test
    void rejectCancellationRequest_clearsFlagAndKeepsStatus() {
        Order order = buildOrder("o1", OrderStatus.PREPARING);
        order.setCancellationRequested(true);
        order.setCancellationRequestReason("Changed my mind");
        order.setCancellationRequestedBy("cust-1");
        when(orderRepository.findById("o1")).thenReturn(Optional.of(order));

        Order result = orderService.rejectCancellationRequest("o1", "Order already in oven");

        assertThat(result.getStatus()).isEqualTo(OrderStatus.PREPARING); // unchanged
        assertThat(result.isCancellationRequested()).isFalse();
        assertThat(result.getCancellationRequestReason()).isNull();
        assertThat(result.getCancellationRequestedBy()).isNull();
        assertThat(result.getCancelledAt()).isNull();
    }

    @Test
    void rejectCancellationRequest_failsWhenNoPendingRequest() {
        Order order = buildOrder("o1", OrderStatus.PREPARING);
        when(orderRepository.findById("o1")).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> orderService.rejectCancellationRequest("o1", "x"))
                .isInstanceOf(RuntimeException.class);
    }
}
