package com.MaSoVa.commerce.order.service;

import com.MaSoVa.commerce.order.client.CustomerServiceClient;
import com.MaSoVa.commerce.order.client.DeliveryServiceClient;
import com.MaSoVa.commerce.order.client.InventoryServiceClient;
import com.MaSoVa.commerce.order.client.MenuServiceClient;
import com.MaSoVa.commerce.order.client.StoreServiceClient;
import com.MaSoVa.commerce.order.config.DeliveryFeeConfiguration;
import com.MaSoVa.commerce.order.config.EuVatConfiguration;
import com.MaSoVa.commerce.order.config.PreparationTimeConfiguration;
import com.MaSoVa.commerce.order.config.TaxConfiguration;
import com.MaSoVa.commerce.order.dto.UpdateOrderStatusRequest;
import com.MaSoVa.commerce.order.entity.Order;
import com.MaSoVa.commerce.order.repository.OrderJpaRepository;
import com.MaSoVa.commerce.order.repository.OrderRepository;
import com.MaSoVa.commerce.order.websocket.OrderWebSocketController;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Safety-floor tests for OrderService.updateOrderStatus() terminal state behaviour.
 * Written BEFORE Global-5 fiscal signing is wired in.
 * These tests must continue to pass unchanged after FiscalSigningService is added.
 */
@ExtendWith(MockitoExtension.class)
class OrderServiceTerminalStatusTest {

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
    @Mock private com.MaSoVa.commerce.fiscal.FiscalSigningService fiscalSigningService;

    private OrderService orderService;

    @BeforeEach
    void setUp() {
        EuVatEngine euVatEngine = new EuVatEngine(new EuVatConfiguration());

        orderService = new OrderService(
                orderRepository,
                orderJpaRepository,
                orderItemSyncService,
                new ObjectMapper(),
                webSocketController,
                menuServiceClient,
                customerServiceClient,
                customerNotificationService,
                deliveryServiceClient,
                storeServiceClient,
                inventoryServiceClient,
                new TaxConfiguration(),
                new PreparationTimeConfiguration(),
                new DeliveryFeeConfiguration(),
                orderEventPublisher,
                euVatEngine,
                fiscalSigningService
        );
    }

    @ParameterizedTest
    @ValueSource(strings = {"DELIVERED", "SERVED", "COMPLETED"})
    void terminal_status_publishes_order_status_changed_event(String statusStr) {
        Order order = new Order();
        order.setId("ord-safety-001");
        order.setStoreId("store-001");
        order.setCustomerId("cust-001");
        order.setOrderType(Order.OrderType.TAKEAWAY);
        order.setStatus(Order.OrderStatus.READY);
        order.setItems(Collections.emptyList());
        order.setTotal(BigDecimal.valueOf(100));

        when(orderRepository.findById("ord-safety-001")).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));
        when(orderJpaRepository.findByMongoId(any())).thenReturn(Optional.empty());

        UpdateOrderStatusRequest req = new UpdateOrderStatusRequest();
        req.setStatus(statusStr);
        orderService.updateOrderStatus("ord-safety-001", req);

        verify(orderEventPublisher).publishOrderStatusChanged(any());
    }
}
