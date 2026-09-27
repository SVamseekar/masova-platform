package com.MaSoVa.commerce.unit.service;

import com.MaSoVa.commerce.order.client.*;
import com.MaSoVa.commerce.order.config.*;
import com.MaSoVa.commerce.order.entity.Order;
import com.MaSoVa.commerce.order.entity.Order.OrderStatus;
import com.MaSoVa.commerce.order.entity.Order.OrderType;
import com.MaSoVa.commerce.order.entity.OrderJpaEntity;
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
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Tests OrderService.reprojectToPostgres(), the repair path used by OrderPostgresOutboxProjector
 * to replay a Mongo order snapshot into the PostgreSQL projection after a best-effort in-request
 * dual-write (createOrder/syncToPostgres) failed and left a pending outbox entry (B2b, D08).
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class OrderServicePostgresReprojectionTest {

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
    }

    private Order buildOrder(String id) {
        Order order = new Order();
        order.setId(id);
        order.setOrderNumber("ORD-001");
        order.setStoreId("store-1");
        order.setCustomerId("cust-1");
        order.setStatus(OrderStatus.RECEIVED);
        order.setOrderType(OrderType.TAKEAWAY);
        order.setPriority(Order.Priority.NORMAL);
        order.setItems(Collections.emptyList());
        order.setTotal(BigDecimal.valueOf(200));
        return order;
    }

    @Test
    void reprojectToPostgres_syncsExistingRow_whenPgRowAlreadyExists() {
        Order order = buildOrder("o1");
        when(orderRepository.findById("o1")).thenReturn(Optional.of(order));
        when(orderItemSyncService.syncOrderByMongoId(eq("o1"), eq(order))).thenReturn(true);

        orderService.reprojectToPostgres("o1");

        verify(orderItemSyncService).syncOrderByMongoId("o1", order);
        verify(orderJpaRepository, never()).save(any(OrderJpaEntity.class));
    }

    @Test
    void reprojectToPostgres_createsFreshRow_whenPgRowMissing() {
        Order order = buildOrder("o2");
        when(orderRepository.findById("o2")).thenReturn(Optional.of(order));
        when(orderItemSyncService.syncOrderByMongoId(eq("o2"), eq(order))).thenReturn(false);

        orderService.reprojectToPostgres("o2");

        verify(orderJpaRepository).save(argThat(entity ->
                "o2".equals(entity.getMongoId()) && "ORD-001".equals(entity.getOrderNumber())));
    }

    @Test
    void reprojectToPostgres_throwsWhenMongoOrderNoLongerExists() {
        when(orderRepository.findById("gone")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> orderService.reprojectToPostgres("gone"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("gone");

        verifyNoInteractions(orderItemSyncService);
        verify(orderJpaRepository, never()).save(any(OrderJpaEntity.class));
    }
}
