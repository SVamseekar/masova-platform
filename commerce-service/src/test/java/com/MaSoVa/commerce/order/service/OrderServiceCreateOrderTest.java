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
import com.MaSoVa.shared.entity.Store;
import com.MaSoVa.commerce.order.dto.CreateOrderRequest;
import com.MaSoVa.commerce.order.entity.Order;
import com.MaSoVa.commerce.order.entity.OrderJpaEntity;
import com.MaSoVa.commerce.order.repository.OrderJpaRepository;
import com.MaSoVa.commerce.order.repository.OrderRepository;
import com.MaSoVa.commerce.order.websocket.OrderWebSocketController;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Safety-floor tests for OrderService.createOrder().
 *
 * These tests document existing behaviour BEFORE any Global-2 (EU VAT Engine) changes land.
 * They must continue to pass unchanged after Global-2 is wired in.
 *
 * Scope: TAKEAWAY order, single item, no delivery, no authenticated customer context.
 */
@ExtendWith(MockitoExtension.class)
class OrderServiceCreateOrderTest {

    // ---- Dependencies ----
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

    // Real instances — these are pure value-object configs with no external deps
    private TaxConfiguration taxConfiguration;
    private PreparationTimeConfiguration preparationTimeConfiguration;
    private DeliveryFeeConfiguration deliveryFeeConfiguration;
    private EuVatEngine euVatEngine;
    private ObjectMapper objectMapper;

    private OrderService orderService;

    @BeforeEach
    void setUp() {
        taxConfiguration = new TaxConfiguration();
        preparationTimeConfiguration = new PreparationTimeConfiguration();
        deliveryFeeConfiguration = new DeliveryFeeConfiguration();
        objectMapper = new ObjectMapper();

        // Empty EuVatConfiguration — no countries configured, so lookupRate returns 0.0
        // India store tests never reach it (countryCode == null routes to GST path)
        euVatEngine = new EuVatEngine(new EuVatConfiguration());

        orderService = new OrderService(
                orderRepository,
                orderJpaRepository,
                orderItemSyncService,
                objectMapper,
                webSocketController,
                menuServiceClient,
                customerServiceClient,
                customerNotificationService,
                deliveryServiceClient,
                storeServiceClient,
                inventoryServiceClient,
                taxConfiguration,
                preparationTimeConfiguration,
                deliveryFeeConfiguration,
                orderEventPublisher,
                euVatEngine,
                aggregatorService
        );

        // Stub menu client to pass validation (fails-open, but explicit here for clarity)
        when(menuServiceClient.isMenuItemAvailable(anyString())).thenReturn(true);
        when(menuServiceClient.validatePrice(anyString(), anyDouble())).thenReturn(true);

        // Stub storeServiceClient.getStore() to return an India store (null countryCode → GST path)
        when(storeServiceClient.getStore(anyString())).thenReturn(new Store());

        // Stub repositories: return the entity passed in (pass-through)
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));
        // orderJpaRepository.save() is called in a non-blocking try/catch — default mock return (null) is fine,
        // but an explicit stub avoids any NPE if code inspects the return value in future.
        when(orderJpaRepository.save(any(OrderJpaEntity.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    // ---- Helper ----

    private CreateOrderRequest buildTakeawayRequest() {
        CreateOrderRequest.OrderItemRequest item = new CreateOrderRequest.OrderItemRequest();
        item.setMenuItemId("menu-item-001");
        item.setName("Butter Chicken");
        item.setQuantity(2);
        item.setPrice(100.0);

        CreateOrderRequest request = new CreateOrderRequest();
        request.setCustomerName("Test Customer");
        request.setStoreId("store-001");
        request.setOrderType(Order.OrderType.TAKEAWAY);
        request.setItems(List.of(item));
        // No customerId / email / deliveryAddress — pure walk-in TAKEAWAY
        return request;
    }

    // ---- Tests ----

    @Test
    void createOrder_sets_status_RECEIVED() {
        Order result = orderService.createOrder(buildTakeawayRequest());
        assertThat(result.getStatus()).isEqualTo(Order.OrderStatus.RECEIVED);
    }

    @Test
    void createOrder_calculates_subtotal_correctly() {
        // 2 items × ₹100 = ₹200
        Order result = orderService.createOrder(buildTakeawayRequest());
        assertThat(result.getSubtotal().doubleValue()).isCloseTo(200.0, within(0.001));
    }

    @Test
    void createOrder_applies_5_percent_GST_for_india_store() {
        // Default state is Maharashtra = 5% GST; subtotal = 200 → tax = 10
        Order result = orderService.createOrder(buildTakeawayRequest());
        assertThat(result.getTax().doubleValue()).isCloseTo(10.0, within(0.001));
    }

    @Test
    void createOrder_total_equals_subtotal_plus_tax_for_takeaway() {
        // TAKEAWAY has no delivery fee → total = subtotal + tax = 200 + 10 = 210
        Order result = orderService.createOrder(buildTakeawayRequest());
        double expectedTotal = result.getSubtotal().doubleValue() + result.getTax().doubleValue();
        assertThat(result.getTotal().doubleValue()).isCloseTo(expectedTotal, within(0.001));
    }

    @Test
    void createOrder_generates_non_null_order_number() {
        Order result = orderService.createOrder(buildTakeawayRequest());
        assertThat(result.getOrderNumber()).isNotNull().isNotBlank();
    }

    @Test
    void createOrder_publishes_OrderCreatedEvent() {
        orderService.createOrder(buildTakeawayRequest());
        verify(orderEventPublisher).publishOrderCreated(any());
    }
}
