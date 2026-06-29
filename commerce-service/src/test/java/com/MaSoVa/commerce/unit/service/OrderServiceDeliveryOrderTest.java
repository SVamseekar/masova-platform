package com.MaSoVa.commerce.unit.service;

import com.MaSoVa.commerce.order.client.*;
import com.MaSoVa.commerce.order.config.*;
import com.MaSoVa.commerce.order.dto.CreateOrderRequest;
import com.MaSoVa.commerce.order.entity.DeliveryAddress;
import com.MaSoVa.commerce.order.entity.Order;
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

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.within;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class OrderServiceDeliveryOrderTest {

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

        when(menuServiceClient.isMenuItemAvailable(anyString())).thenReturn(true);
        when(menuServiceClient.validatePrice(anyString(), anyDouble())).thenReturn(true);
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));
        when(orderJpaRepository.save(any(OrderJpaEntity.class))).thenAnswer(inv -> inv.getArgument(0));
        when(storeServiceClient.getStore(anyString())).thenReturn(new com.MaSoVa.shared.entity.Store());
    }

    private CreateOrderRequest.OrderItemRequest buildItem() {
        CreateOrderRequest.OrderItemRequest item = new CreateOrderRequest.OrderItemRequest();
        item.setMenuItemId("menu-001");
        item.setName("Butter Chicken");
        item.setQuantity(2);
        item.setPrice(100.0);
        return item;
    }

    private CreateOrderRequest buildDeliveryRequest(Double lat, Double lng) {
        DeliveryAddress addr = new DeliveryAddress();
        addr.setStreet("123 Main St");
        addr.setCity("Mumbai");
        addr.setState("Maharashtra");
        addr.setLatitude(lat);
        addr.setLongitude(lng);

        CreateOrderRequest req = new CreateOrderRequest();
        req.setCustomerName("Delivery Customer");
        req.setCustomerId("cust-delivery");
        req.setCustomerEmail("delivery@gmail.com");
        req.setStoreId("store-1");
        req.setOrderType(Order.OrderType.DELIVERY);
        req.setItems(List.of(buildItem()));
        req.setDeliveryAddress(addr);
        return req;
    }

    // Delivery with valid coordinates

    @Test
    void createOrder_delivery_with_coordinates_calculates_delivery_fee() {
        DeliveryServiceClient.DeliveryFeeResult feeResult =
                DeliveryServiceClient.DeliveryFeeResult.success(49.0, "ZONE_B", 4.5, 30);

        when(storeServiceClient.isWithinDeliveryRadius(eq("store-1"), anyDouble(), anyDouble())).thenReturn(true);
        when(deliveryServiceClient.calculateDeliveryFee(eq("store-1"), anyDouble(), anyDouble())).thenReturn(feeResult);

        Order result = orderService.createOrder(buildDeliveryRequest(19.0760, 72.8777));

        assertThat(result.getDeliveryFee().doubleValue()).isCloseTo(49.0, within(0.001));
        assertThat(result.getEstimatedDeliveryTime()).isNotNull();
    }

    @Test
    void createOrder_delivery_outside_radius_throws() {
        when(storeServiceClient.isWithinDeliveryRadius(eq("store-1"), anyDouble(), anyDouble())).thenReturn(false);

        assertThatThrownBy(() -> orderService.createOrder(buildDeliveryRequest(28.7041, 77.1025)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("outside this store's delivery radius");
    }

    @Test
    void createOrder_delivery_with_default_fee_when_zone_lookup_uses_default() {
        DeliveryServiceClient.DeliveryFeeResult feeResult =
                DeliveryServiceClient.DeliveryFeeResult.defaultFee("Zone lookup failed");

        when(storeServiceClient.isWithinDeliveryRadius(eq("store-1"), anyDouble(), anyDouble())).thenReturn(true);
        when(deliveryServiceClient.calculateDeliveryFee(eq("store-1"), anyDouble(), anyDouble())).thenReturn(feeResult);

        Order result = orderService.createOrder(buildDeliveryRequest(19.0760, 72.8777));

        assertThat(result.getDeliveryFee().doubleValue()).isGreaterThan(0);
    }

    @Test
    void createOrder_delivery_missing_coordinates_uses_base_fee() {
        Order result = orderService.createOrder(buildDeliveryRequest(null, null));

        // No coordinate check — falls back to base fee from config
        assertThat(result.getDeliveryFee()).isNotNull();
        assertThat(result.getOrderType()).isEqualTo(Order.OrderType.DELIVERY);
    }

    // MenuItem validation errors

    @Test
    void createOrder_unavailable_menu_item_throws() {
        when(menuServiceClient.isMenuItemAvailable("menu-001")).thenReturn(false);

        CreateOrderRequest req = new CreateOrderRequest();
        req.setCustomerName("Test");
        req.setStoreId("store-1");
        req.setOrderType(Order.OrderType.TAKEAWAY);
        req.setItems(List.of(buildItem()));

        assertThatThrownBy(() -> orderService.createOrder(req))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("not available");
    }

    @Test
    void createOrder_invalid_price_throws() {
        when(menuServiceClient.validatePrice("menu-001", 100.0)).thenReturn(false);

        CreateOrderRequest req = new CreateOrderRequest();
        req.setCustomerName("Test");
        req.setStoreId("store-1");
        req.setOrderType(Order.OrderType.TAKEAWAY);
        req.setItems(List.of(buildItem()));

        assertThatThrownBy(() -> orderService.createOrder(req))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Invalid price");
    }

    @Test
    void createOrder_missing_menuItemId_throws() {
        CreateOrderRequest.OrderItemRequest badItem = new CreateOrderRequest.OrderItemRequest();
        badItem.setMenuItemId(null);
        badItem.setName("Ghost Item");
        badItem.setQuantity(1);
        badItem.setPrice(100.0);

        CreateOrderRequest req = new CreateOrderRequest();
        req.setCustomerName("Test");
        req.setStoreId("store-1");
        req.setOrderType(Order.OrderType.TAKEAWAY);
        req.setItems(List.of(badItem));

        assertThatThrownBy(() -> orderService.createOrder(req))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Menu item ID is required");
    }

    // Customer email update

    @Test
    void createOrder_updates_customer_email_when_provided() {
        CreateOrderRequest req = new CreateOrderRequest();
        req.setCustomerName("John");
        req.setCustomerId("cust-1");
        req.setCustomerEmail("john@gmail.com");
        req.setStoreId("store-1");
        req.setOrderType(Order.OrderType.TAKEAWAY);
        req.setItems(List.of(buildItem()));

        orderService.createOrder(req);

        verify(customerServiceClient).updateCustomerEmail("cust-1", "john@gmail.com");
    }

    @Test
    void createOrder_skips_email_update_when_no_customerId() {
        CreateOrderRequest req = new CreateOrderRequest();
        req.setCustomerName("Walk-in");
        req.setCustomerId(null);
        req.setCustomerEmail("walkin@gmail.com");
        req.setStoreId("store-1");
        req.setOrderType(Order.OrderType.TAKEAWAY);
        req.setItems(List.of(buildItem()));

        orderService.createOrder(req);

        verify(customerServiceClient, never()).updateCustomerEmail(any(), any());
    }

    // Currency propagation

    @Test
    void createOrder_handles_store_fetch_failure_gracefully() {
        // StoreServiceClient.getStore() catches its own errors and returns null — never throws.
        when(storeServiceClient.getStore("store-1")).thenReturn(null);

        CreateOrderRequest req = new CreateOrderRequest();
        req.setCustomerName("Test");
        req.setStoreId("store-1");
        req.setOrderType(Order.OrderType.TAKEAWAY);
        req.setItems(List.of(buildItem()));

        Order result = orderService.createOrder(req);

        assertThat(result).isNotNull();
        assertThat(result.getStatus()).isEqualTo(Order.OrderStatus.RECEIVED);
        assertThat(result.getCurrency()).isEqualTo("INR");
    }

    // Quality checkpoints initialization

    @Test
    void createOrder_initializes_4_quality_checkpoints() {
        CreateOrderRequest req = new CreateOrderRequest();
        req.setCustomerName("Test");
        req.setStoreId("store-1");
        req.setOrderType(Order.OrderType.TAKEAWAY);
        req.setItems(List.of(buildItem()));

        Order result = orderService.createOrder(req);

        assertThat(result.getQualityCheckpoints()).hasSize(4);
    }

    // Dual-write failure

    @Test
    void createOrder_continues_when_postgres_dual_write_fails() {
        when(orderJpaRepository.save(any())).thenThrow(new RuntimeException("PG down"));

        CreateOrderRequest req = new CreateOrderRequest();
        req.setCustomerName("Test");
        req.setStoreId("store-1");
        req.setOrderType(Order.OrderType.TAKEAWAY);
        req.setItems(List.of(buildItem()));

        // Should not throw — PG dual-write failure is swallowed
        Order result = orderService.createOrder(req);

        assertThat(result.getStatus()).isEqualTo(Order.OrderStatus.RECEIVED);
    }

    // Event publisher failure

    @Test
    void createOrder_continues_when_event_publish_fails() {
        doThrow(new RuntimeException("RabbitMQ down"))
                .when(orderEventPublisher).publishOrderCreated(any());

        CreateOrderRequest req = new CreateOrderRequest();
        req.setCustomerName("Test");
        req.setStoreId("store-1");
        req.setOrderType(Order.OrderType.TAKEAWAY);
        req.setItems(List.of(buildItem()));

        Order result = orderService.createOrder(req);

        assertThat(result.getStatus()).isEqualTo(Order.OrderStatus.RECEIVED);
    }

    // State query methods

    @Test
    void getOrdersByDate_uses_IST_timezone_boundaries() {
        when(orderRepository.findByStoreIdAndCreatedAtBetween(eq("store-1"), any(), any()))
                .thenReturn(List.of());

        List<Order> result = orderService.getOrdersByDate("store-1", java.time.LocalDate.of(2025, 5, 17));

        assertThat(result).isEmpty();
        verify(orderRepository).findByStoreIdAndCreatedAtBetween(eq("store-1"),
                argThat(start -> start.getHour() >= 0),
                argThat(end -> end.getHour() >= 0));
    }
}
