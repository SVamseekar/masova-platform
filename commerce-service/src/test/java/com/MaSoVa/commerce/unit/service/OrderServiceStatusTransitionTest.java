package com.MaSoVa.commerce.unit.service;

import com.MaSoVa.commerce.order.client.*;
import com.MaSoVa.commerce.order.config.*;
import com.MaSoVa.commerce.order.dto.UpdateOrderStatusRequest;
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
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class OrderServiceStatusTransitionTest {

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

    private Order buildOrder(String id, OrderStatus status, OrderType type) {
        Order order = new Order();
        order.setId(id);
        order.setOrderNumber("ORD-001");
        order.setStoreId("store-1");
        order.setCustomerId("cust-1");
        order.setStatus(status);
        order.setOrderType(type);
        order.setPriority(Order.Priority.NORMAL);
        order.setItems(Collections.emptyList());
        order.setTotal(BigDecimal.valueOf(200));
        return order;
    }

    // PostgreSQL dual-write sync

    @Test
    void updateOrderStatus_syncs_to_postgres_when_pg_row_exists() {
        Order order = buildOrder("o1", OrderStatus.RECEIVED, OrderType.TAKEAWAY);
        when(orderRepository.findById("o1")).thenReturn(Optional.of(order));

        com.MaSoVa.commerce.order.entity.OrderJpaEntity pgOrder =
                com.MaSoVa.commerce.order.entity.OrderJpaEntity.builder().id("pg-1").mongoId("o1").build();
        when(orderJpaRepository.findByMongoId("o1")).thenReturn(Optional.of(pgOrder));

        UpdateOrderStatusRequest req = new UpdateOrderStatusRequest();
        req.setStatus(OrderStatus.PREPARING);
        Order result = orderService.updateOrderStatus("o1", req);

        verify(orderItemSyncService).syncOrderItems(pgOrder, result);
    }

    // updateOrderStatus — valid transitions

    @Test
    void updateOrderStatus_RECEIVED_to_PREPARING_succeeds() {
        Order order = buildOrder("o1", OrderStatus.RECEIVED, OrderType.TAKEAWAY);
        when(orderRepository.findById("o1")).thenReturn(Optional.of(order));

        UpdateOrderStatusRequest req = new UpdateOrderStatusRequest();
        req.setStatus(OrderStatus.PREPARING);
        Order result = orderService.updateOrderStatus("o1", req);

        assertThat(result.getStatus()).isEqualTo(OrderStatus.PREPARING);
        assertThat(result.getPreparingStartedAt()).isNotNull();
    }

    @Test
    void updateOrderStatus_PREPARING_to_OVEN_succeeds() {
        Order order = buildOrder("o1", OrderStatus.PREPARING, OrderType.TAKEAWAY);
        when(orderRepository.findById("o1")).thenReturn(Optional.of(order));

        UpdateOrderStatusRequest req = new UpdateOrderStatusRequest();
        req.setStatus(OrderStatus.OVEN);
        Order result = orderService.updateOrderStatus("o1", req);

        assertThat(result.getStatus()).isEqualTo(OrderStatus.OVEN);
    }

    @Test
    void updateOrderStatus_OVEN_to_BAKED_sets_bakedAt() {
        Order order = buildOrder("o1", OrderStatus.OVEN, OrderType.TAKEAWAY);
        when(orderRepository.findById("o1")).thenReturn(Optional.of(order));

        UpdateOrderStatusRequest req = new UpdateOrderStatusRequest();
        req.setStatus(OrderStatus.BAKED);
        Order result = orderService.updateOrderStatus("o1", req);

        assertThat(result.getStatus()).isEqualTo(OrderStatus.BAKED);
        assertThat(result.getBakedAt()).isNotNull();
    }

    @Test
    void updateOrderStatus_BAKED_to_READY_sets_readyAt() {
        Order order = buildOrder("o1", OrderStatus.BAKED, OrderType.TAKEAWAY);
        when(orderRepository.findById("o1")).thenReturn(Optional.of(order));

        UpdateOrderStatusRequest req = new UpdateOrderStatusRequest();
        req.setStatus(OrderStatus.READY);
        Order result = orderService.updateOrderStatus("o1", req);

        assertThat(result.getStatus()).isEqualTo(OrderStatus.READY);
        assertThat(result.getReadyAt()).isNotNull();
    }

    @Test
    void updateOrderStatus_READY_to_DISPATCHED_succeeds_for_delivery() {
        Order order = buildOrder("o1", OrderStatus.READY, OrderType.DELIVERY);
        when(orderRepository.findById("o1")).thenReturn(Optional.of(order));

        UpdateOrderStatusRequest req = new UpdateOrderStatusRequest();
        req.setStatus(OrderStatus.DISPATCHED);
        Order result = orderService.updateOrderStatus("o1", req);

        assertThat(result.getStatus()).isEqualTo(OrderStatus.DISPATCHED);
        assertThat(result.getDispatchedAt()).isNotNull();
    }

    @Test
    void updateOrderStatus_READY_to_COMPLETED_succeeds_for_takeaway() {
        Order order = buildOrder("o1", OrderStatus.READY, OrderType.TAKEAWAY);
        when(orderRepository.findById("o1")).thenReturn(Optional.of(order));

        UpdateOrderStatusRequest req = new UpdateOrderStatusRequest();
        req.setStatus(OrderStatus.COMPLETED);
        Order result = orderService.updateOrderStatus("o1", req);

        assertThat(result.getStatus()).isEqualTo(OrderStatus.COMPLETED);
    }

    @Test
    void updateOrderStatus_READY_to_SERVED_succeeds_for_dine_in() {
        Order order = buildOrder("o1", OrderStatus.READY, OrderType.DINE_IN);
        when(orderRepository.findById("o1")).thenReturn(Optional.of(order));

        UpdateOrderStatusRequest req = new UpdateOrderStatusRequest();
        req.setStatus(OrderStatus.SERVED);
        Order result = orderService.updateOrderStatus("o1", req);

        assertThat(result.getStatus()).isEqualTo(OrderStatus.SERVED);
    }

    @Test
    void updateOrderStatus_DISPATCHED_to_DELIVERED_triggers_fiscal_signing() {
        Order order = buildOrder("o1", OrderStatus.DISPATCHED, OrderType.DELIVERY);
        when(orderRepository.findById("o1")).thenReturn(Optional.of(order));

        UpdateOrderStatusRequest req = new UpdateOrderStatusRequest();
        req.setStatus(OrderStatus.DELIVERED);
        orderService.updateOrderStatus("o1", req);

        verify(fiscalSigningService).signOrder(any(Order.class));
    }

    @Test
    void updateOrderStatus_DELIVERED_to_anything_throws() {
        Order order = buildOrder("o1", OrderStatus.DELIVERED, OrderType.DELIVERY);
        when(orderRepository.findById("o1")).thenReturn(Optional.of(order));

        UpdateOrderStatusRequest req = new UpdateOrderStatusRequest();
        req.setStatus(OrderStatus.PREPARING);

        assertThatThrownBy(() -> orderService.updateOrderStatus("o1", req))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Cannot update status of completed order");
    }

    @Test
    void updateOrderStatus_CANCELLED_cannot_be_updated() {
        Order order = buildOrder("o1", OrderStatus.CANCELLED, OrderType.TAKEAWAY);
        when(orderRepository.findById("o1")).thenReturn(Optional.of(order));

        UpdateOrderStatusRequest req = new UpdateOrderStatusRequest();
        req.setStatus(OrderStatus.PREPARING);

        assertThatThrownBy(() -> orderService.updateOrderStatus("o1", req))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Cannot update status of completed order");
    }

    @Test
    void updateOrderStatus_invalid_transition_throws() {
        Order order = buildOrder("o1", OrderStatus.RECEIVED, OrderType.TAKEAWAY);
        when(orderRepository.findById("o1")).thenReturn(Optional.of(order));

        UpdateOrderStatusRequest req = new UpdateOrderStatusRequest();
        req.setStatus(OrderStatus.DELIVERED); // RECEIVED → DELIVERED is not valid

        assertThatThrownBy(() -> orderService.updateOrderStatus("o1", req))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Invalid status transition");
    }

    @Test
    void updateOrderStatus_DELIVERED_updates_customer_stats() {
        Order order = buildOrder("o1", OrderStatus.DISPATCHED, OrderType.DELIVERY);
        when(orderRepository.findById("o1")).thenReturn(Optional.of(order));

        UpdateOrderStatusRequest req = new UpdateOrderStatusRequest();
        req.setStatus(OrderStatus.DELIVERED);
        orderService.updateOrderStatus("o1", req);

        verify(customerServiceClient).updateOrderStats(eq("cust-1"), any(), any(), eq("COMPLETED"), anyDouble());
    }

    @Test
    void updateOrderStatus_sends_customer_notification() {
        Order order = buildOrder("o1", OrderStatus.RECEIVED, OrderType.TAKEAWAY);
        when(orderRepository.findById("o1")).thenReturn(Optional.of(order));

        UpdateOrderStatusRequest req = new UpdateOrderStatusRequest();
        req.setStatus(OrderStatus.PREPARING);
        orderService.updateOrderStatus("o1", req);

        verify(customerNotificationService).sendOrderStatusNotification(any(Order.class), eq(OrderStatus.RECEIVED));
    }

    @Test
    void updateOrderStatus_broadcasts_websocket_update() {
        Order order = buildOrder("o1", OrderStatus.RECEIVED, OrderType.TAKEAWAY);
        when(orderRepository.findById("o1")).thenReturn(Optional.of(order));

        UpdateOrderStatusRequest req = new UpdateOrderStatusRequest();
        req.setStatus(OrderStatus.PREPARING);
        orderService.updateOrderStatus("o1", req);

        verify(webSocketController).sendKitchenQueueUpdate(eq("store-1"), any(Order.class));
        verify(webSocketController).sendOrderUpdateToStore(eq("store-1"), any(Order.class));
        verify(webSocketController).sendOrderUpdateToCustomer(eq("cust-1"), any(Order.class));
    }

    @Test
    void updateOrderStatus_no_customer_websocket_when_customerId_null() {
        Order order = buildOrder("o1", OrderStatus.RECEIVED, OrderType.TAKEAWAY);
        order.setCustomerId(null);
        when(orderRepository.findById("o1")).thenReturn(Optional.of(order));

        UpdateOrderStatusRequest req = new UpdateOrderStatusRequest();
        req.setStatus(OrderStatus.PREPARING);
        orderService.updateOrderStatus("o1", req);

        verify(webSocketController, never()).sendOrderUpdateToCustomer(any(), any());
    }

    @Test
    void updateOrderStatus_publishes_status_changed_event() {
        Order order = buildOrder("o1", OrderStatus.RECEIVED, OrderType.TAKEAWAY);
        when(orderRepository.findById("o1")).thenReturn(Optional.of(order));

        UpdateOrderStatusRequest req = new UpdateOrderStatusRequest();
        req.setStatus(OrderStatus.PREPARING);
        orderService.updateOrderStatus("o1", req);

        verify(orderEventPublisher).publishOrderStatusChanged(any());
    }

    // moveOrderToNextStage

    @Test
    void moveOrderToNextStage_RECEIVED_advances_to_PREPARING() {
        Order order = buildOrder("o1", OrderStatus.RECEIVED, OrderType.TAKEAWAY);
        when(orderRepository.findById("o1")).thenReturn(Optional.of(order));

        Order result = orderService.moveOrderToNextStage("o1");

        assertThat(result.getStatus()).isEqualTo(OrderStatus.PREPARING);
    }

    @Test
    void moveOrderToNextStage_PREPARING_advances_to_OVEN() {
        Order order = buildOrder("o1", OrderStatus.PREPARING, OrderType.TAKEAWAY);
        when(orderRepository.findById("o1")).thenReturn(Optional.of(order));

        Order result = orderService.moveOrderToNextStage("o1");

        assertThat(result.getStatus()).isEqualTo(OrderStatus.OVEN);
    }

    @Test
    void moveOrderToNextStage_OVEN_advances_to_BAKED() {
        Order order = buildOrder("o1", OrderStatus.OVEN, OrderType.TAKEAWAY);
        when(orderRepository.findById("o1")).thenReturn(Optional.of(order));

        Order result = orderService.moveOrderToNextStage("o1");

        assertThat(result.getStatus()).isEqualTo(OrderStatus.BAKED);
    }

    @Test
    void moveOrderToNextStage_BAKED_advances_to_READY() {
        Order order = buildOrder("o1", OrderStatus.BAKED, OrderType.TAKEAWAY);
        when(orderRepository.findById("o1")).thenReturn(Optional.of(order));

        Order result = orderService.moveOrderToNextStage("o1");

        assertThat(result.getStatus()).isEqualTo(OrderStatus.READY);
    }

    @Test
    void moveOrderToNextStage_READY_advances_to_COMPLETED_for_takeaway() {
        Order order = buildOrder("o1", OrderStatus.READY, OrderType.TAKEAWAY);
        when(orderRepository.findById("o1")).thenReturn(Optional.of(order));

        Order result = orderService.moveOrderToNextStage("o1");

        assertThat(result.getStatus()).isEqualTo(OrderStatus.COMPLETED);
        assertThat(result.getCompletedAt()).isNotNull();
    }

    @Test
    void moveOrderToNextStage_READY_advances_to_SERVED_for_dine_in() {
        Order order = buildOrder("o1", OrderStatus.READY, OrderType.DINE_IN);
        when(orderRepository.findById("o1")).thenReturn(Optional.of(order));

        Order result = orderService.moveOrderToNextStage("o1");

        assertThat(result.getStatus()).isEqualTo(OrderStatus.SERVED);
    }

    @Test
    void moveOrderToNextStage_READY_advances_to_DISPATCHED_for_delivery() {
        Order order = buildOrder("o1", OrderStatus.READY, OrderType.DELIVERY);
        when(orderRepository.findById("o1")).thenReturn(Optional.of(order));

        Order result = orderService.moveOrderToNextStage("o1");

        assertThat(result.getStatus()).isEqualTo(OrderStatus.DISPATCHED);
    }

    @Test
    void moveOrderToNextStage_DISPATCHED_generates_delivery_otp_for_delivery() {
        Order order = buildOrder("o1", OrderStatus.READY, OrderType.DELIVERY);
        when(orderRepository.findById("o1")).thenReturn(Optional.of(order));

        Order dispatched = orderService.moveOrderToNextStage("o1");
        // Next stage from READY is DISPATCHED, and DISPATCHED triggers OTP
        // So we need to test from READY → DISPATCHED which auto-generates OTP
        assertThat(dispatched.getStatus()).isEqualTo(OrderStatus.DISPATCHED);
        // OTP auto-generated when status becomes DISPATCHED
        assertThat(dispatched.getDeliveryOtp()).isNotNull();
        assertThat(dispatched.getDeliveryOtpExpiresAt()).isNotNull();
    }

    @Test
    void moveOrderToNextStage_DISPATCHED_advances_to_DELIVERED() {
        Order order = buildOrder("o1", OrderStatus.DISPATCHED, OrderType.DELIVERY);
        when(orderRepository.findById("o1")).thenReturn(Optional.of(order));

        Order result = orderService.moveOrderToNextStage("o1");

        assertThat(result.getStatus()).isEqualTo(OrderStatus.DELIVERED);
        assertThat(result.getDeliveredAt()).isNotNull();
    }

    @Test
    void moveOrderToNextStage_terminal_status_throws() {
        Order order = buildOrder("o1", OrderStatus.DELIVERED, OrderType.DELIVERY);
        when(orderRepository.findById("o1")).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> orderService.moveOrderToNextStage("o1"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("final stage");
    }

    @Test
    void moveOrderToNextStage_terminal_updates_customer_stats() {
        Order order = buildOrder("o1", OrderStatus.READY, OrderType.TAKEAWAY);
        when(orderRepository.findById("o1")).thenReturn(Optional.of(order));

        orderService.moveOrderToNextStage("o1");

        verify(customerServiceClient).updateOrderStats(eq("cust-1"), any(), any(), eq("COMPLETED"), anyDouble());
    }

    // getKitchenQueue

    @Test
    void getKitchenQueue_returns_active_statuses_only() {
        Order o1 = buildOrder("o1", OrderStatus.RECEIVED, OrderType.TAKEAWAY);
        o1.setCreatedAt(LocalDateTime.now().minusMinutes(5));
        Order o2 = buildOrder("o2", OrderStatus.PREPARING, OrderType.TAKEAWAY);
        o2.setCreatedAt(LocalDateTime.now());
        when(orderRepository.findByStoreIdAndStatusIn(eq("store-1"), anyList()))
                .thenReturn(List.of(o1, o2));

        List<Order> queue = orderService.getKitchenQueue("store-1");

        assertThat(queue).hasSize(2);
    }

    // cancelOrder

    @Test
    void cancelOrder_sets_status_CANCELLED() {
        Order order = buildOrder("o1", OrderStatus.RECEIVED, OrderType.TAKEAWAY);
        when(orderRepository.findById("o1")).thenReturn(Optional.of(order));

        Order result = orderService.cancelOrder("o1", "Customer request");

        assertThat(result.getStatus()).isEqualTo(OrderStatus.CANCELLED);
        assertThat(result.getCancellationReason()).isEqualTo("Customer request");
        assertThat(result.getCancelledAt()).isNotNull();
    }

    @Test
    void cancelOrder_delivered_order_throws() {
        Order order = buildOrder("o1", OrderStatus.DELIVERED, OrderType.DELIVERY);
        when(orderRepository.findById("o1")).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> orderService.cancelOrder("o1", "reason"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Cannot cancel delivered order");
    }

    @Test
    void cancelOrder_publishes_event_and_notifies() {
        Order order = buildOrder("o1", OrderStatus.PREPARING, OrderType.TAKEAWAY);
        when(orderRepository.findById("o1")).thenReturn(Optional.of(order));

        orderService.cancelOrder("o1", "Change of mind");

        verify(orderEventPublisher).publishOrderStatusChanged(any());
        verify(customerNotificationService).sendOrderStatusNotification(any(Order.class), eq(OrderStatus.PREPARING));
    }

    // assignDriver

    @Test
    void assignDriver_sets_driverId_on_delivery_order() {
        Order order = buildOrder("o1", OrderStatus.READY, OrderType.DELIVERY);
        when(orderRepository.findById("o1")).thenReturn(Optional.of(order));

        Order result = orderService.assignDriver("o1", "driver-1", "John", "9999999999");

        assertThat(result.getAssignedDriverId()).isEqualTo("driver-1");
    }

    @Test
    void assignDriver_non_delivery_order_throws() {
        Order order = buildOrder("o1", OrderStatus.READY, OrderType.TAKEAWAY);
        when(orderRepository.findById("o1")).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> orderService.assignDriver("o1", "driver-1"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Cannot assign driver to non-delivery order");
    }

    @Test
    void assignDriver_sends_driver_notification_and_websocket() {
        Order order = buildOrder("o1", OrderStatus.READY, OrderType.DELIVERY);
        when(orderRepository.findById("o1")).thenReturn(Optional.of(order));

        orderService.assignDriver("o1", "driver-1", "John", "9999999999");

        verify(customerNotificationService).sendDriverAssignmentNotification(any(Order.class), eq("John"), eq("9999999999"));
        verify(webSocketController).sendOrderUpdateToDriver(eq("driver-1"), any(Order.class));
    }

    // updatePaymentStatus

    @Test
    void updatePaymentStatus_updates_payment_and_transactionId() {
        Order order = buildOrder("o1", OrderStatus.RECEIVED, OrderType.TAKEAWAY);
        when(orderRepository.findById("o1")).thenReturn(Optional.of(order));

        Order result = orderService.updatePaymentStatus("o1", Order.PaymentStatus.PAID, "txn-123");

        assertThat(result.getPaymentStatus()).isEqualTo(Order.PaymentStatus.PAID);
        assertThat(result.getPaymentTransactionId()).isEqualTo("txn-123");
    }

    // updateOrderItems

    @Test
    void updateOrderItems_recalculates_totals() {
        Order order = buildOrder("o1", OrderStatus.RECEIVED, OrderType.TAKEAWAY);
        when(orderRepository.findById("o1")).thenReturn(Optional.of(order));

        com.MaSoVa.commerce.order.entity.OrderItem item =
                com.MaSoVa.commerce.order.entity.OrderItem.builder()
                        .menuItemId("m1").name("Pizza").quantity(1).price(300.0).build();

        Order result = orderService.updateOrderItems("o1", List.of(item));

        assertThat(result.getSubtotal().doubleValue()).isGreaterThan(0);
        assertThat(result.getTotal().doubleValue()).isGreaterThan(300.0); // includes tax
    }

    @Test
    void updateOrderItems_after_PREPARING_throws() {
        Order order = buildOrder("o1", OrderStatus.PREPARING, OrderType.TAKEAWAY);
        when(orderRepository.findById("o1")).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> orderService.updateOrderItems("o1", List.of()))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Cannot modify order after preparation has started");
    }

    // updateOrderPriority

    @Test
    void updateOrderPriority_sets_priority() {
        Order order = buildOrder("o1", OrderStatus.RECEIVED, OrderType.TAKEAWAY);
        when(orderRepository.findById("o1")).thenReturn(Optional.of(order));

        Order result = orderService.updateOrderPriority("o1", Order.Priority.URGENT);

        assertThat(result.getPriority()).isEqualTo(Order.Priority.URGENT);
    }

    // searchOrders

    @Test
    void searchOrders_filters_by_order_number_substring() {
        Order o1 = buildOrder("o1", OrderStatus.RECEIVED, OrderType.TAKEAWAY);
        o1.setCustomerName("Alice");
        when(orderRepository.findByStoreIdOrderByCreatedAtDesc("store-1")).thenReturn(List.of(o1));

        List<Order> result = orderService.searchOrders("store-1", "ORD-001");

        assertThat(result).hasSize(1);
    }

    @Test
    void searchOrders_filters_by_customer_name() {
        Order o1 = buildOrder("o1", OrderStatus.RECEIVED, OrderType.TAKEAWAY);
        o1.setCustomerName("Alice");
        when(orderRepository.findByStoreIdOrderByCreatedAtDesc("store-1")).thenReturn(List.of(o1));

        List<Order> result = orderService.searchOrders("store-1", "alice");

        assertThat(result).hasSize(1);
    }

    @Test
    void searchOrders_returns_empty_when_no_match() {
        Order o1 = buildOrder("o1", OrderStatus.RECEIVED, OrderType.TAKEAWAY);
        o1.setCustomerName("Alice");
        when(orderRepository.findByStoreIdOrderByCreatedAtDesc("store-1")).thenReturn(List.of(o1));

        List<Order> result = orderService.searchOrders("store-1", "ZZZNOMATCH");

        assertThat(result).isEmpty();
    }

    // getOrderById / getOrderByNumber

    @Test
    void getOrderById_not_found_throws() {
        when(orderRepository.findById("missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> orderService.getOrderById("missing"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Order not found");
    }

    @Test
    void getOrderByNumber_not_found_throws() {
        when(orderRepository.findByOrderNumber("ORD-XXX")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> orderService.getOrderByNumber("ORD-XXX"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Order not found");
    }

    // getActiveDeliveryCount

    @Test
    void getActiveDeliveryCount_returns_size_of_active_deliveries() {
        Order o1 = buildOrder("o1", OrderStatus.DISPATCHED, OrderType.DELIVERY);
        when(orderRepository.findActiveDeliveriesByStoreId("store-1")).thenReturn(List.of(o1));

        Integer count = orderService.getActiveDeliveryCount("store-1");

        assertThat(count).isEqualTo(1);
    }
}
