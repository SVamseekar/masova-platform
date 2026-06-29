package com.MaSoVa.commerce.unit.service;

import com.MaSoVa.commerce.order.client.CustomerServiceClient;
import com.MaSoVa.commerce.order.client.DeliveryServiceClient;
import com.MaSoVa.commerce.order.client.InventoryServiceClient;
import com.MaSoVa.commerce.order.client.MenuServiceClient;
import com.MaSoVa.commerce.order.client.StoreServiceClient;
import com.MaSoVa.commerce.order.config.DeliveryFeeConfiguration;
import com.MaSoVa.commerce.order.config.EuVatConfiguration;
import com.MaSoVa.commerce.order.config.PreparationTimeConfiguration;
import com.MaSoVa.commerce.order.config.TaxConfiguration;
import com.MaSoVa.commerce.order.dto.CreateOrderRequest;
import com.MaSoVa.commerce.order.entity.Order;
import com.MaSoVa.commerce.order.entity.OrderJpaEntity;
import com.MaSoVa.commerce.order.repository.OrderJpaRepository;
import com.MaSoVa.commerce.order.repository.OrderRepository;
import com.MaSoVa.commerce.order.service.AggregatorService;
import com.MaSoVa.commerce.order.service.CustomerNotificationService;
import com.MaSoVa.commerce.order.service.EuVatEngine;
import com.MaSoVa.commerce.order.service.OrderEventPublisher;
import com.MaSoVa.commerce.order.service.OrderItemSyncService;
import com.MaSoVa.commerce.order.service.OrderService;
import com.MaSoVa.commerce.order.websocket.OrderWebSocketController;
import com.MaSoVa.shared.entity.Store;
import com.MaSoVa.shared.messaging.events.OrderCreatedEvent;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class OrderServiceEuVatTest {

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
        EuVatConfiguration euVatConfig = new EuVatConfiguration();
        EuVatConfiguration.CountryVatProfile de = new EuVatConfiguration.CountryVatProfile();
        de.setDefaultRate(19.0);
        de.setContextRates(Map.of(
            "DINE_IN", Map.of("FOOD", 19.0, "ALCOHOL", 19.0),
            "TAKEAWAY", Map.of("FOOD", 7.0, "ALCOHOL", 19.0),
            "DELIVERY", Map.of("FOOD", 7.0, "ALCOHOL", 19.0)
        ));
        euVatConfig.setCountries(Map.of("DE", de));

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
                new EuVatEngine(euVatConfig),
                aggregatorService,
                fiscalSigningService
        );

        when(menuServiceClient.isMenuItemAvailable(anyString())).thenReturn(true);
        when(menuServiceClient.validatePrice(anyString(), anyDouble())).thenReturn(true);
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));
        when(orderJpaRepository.save(any(OrderJpaEntity.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    private Store buildDeStore() {
        Store store = new Store("Berlin Store", "DOM010", null, "4915112345678");
        store.setCountryCode("DE");
        store.setCurrency("EUR");
        store.setLocale("de-DE");
        return store;
    }

    private CreateOrderRequest buildDineInRequest() {
        CreateOrderRequest.OrderItemRequest item = new CreateOrderRequest.OrderItemRequest();
        item.setMenuItemId("item-001");
        item.setName("Schnitzel");
        item.setQuantity(1);
        item.setPrice(10.0);
        item.setCategory("FOOD");

        CreateOrderRequest request = new CreateOrderRequest();
        request.setCustomerName("Hans Müller");
        request.setCustomerPhone("4915112345678");
        request.setStoreId("store-de-001");
        request.setOrderType(Order.OrderType.DINE_IN);
        request.setPaymentMethod(Order.PaymentMethod.CARD);
        request.setItems(List.of(item));
        return request;
    }

    @Test
    void EU_store_order_sets_vatCountryCode() {
        when(storeServiceClient.getStore("store-de-001")).thenReturn(buildDeStore());

        Order result = orderService.createOrder(buildDineInRequest());

        assertThat(result.getVatCountryCode()).isEqualTo("DE");
    }

    @Test
    void EU_store_order_populates_vatBreakdown() {
        when(storeServiceClient.getStore("store-de-001")).thenReturn(buildDeStore());

        Order result = orderService.createOrder(buildDineInRequest());

        assertThat(result.getVatBreakdown()).isNotNull();
        assertThat(result.getVatBreakdown().getOrderContext()).isEqualTo("DINE_IN");
    }

    @Test
    void EU_store_DINE_IN_applies_19_percent_vat() {
        when(storeServiceClient.getStore("store-de-001")).thenReturn(buildDeStore());

        Order result = orderService.createOrder(buildDineInRequest());

        assertThat(result.getTotalVatAmount().doubleValue()).isCloseTo(1.90, within(0.01));
        assertThat(result.getTotalGrossAmount().doubleValue()).isCloseTo(11.90, within(0.01));
        assertThat(result.getTotal().doubleValue()).isCloseTo(11.90, within(0.01));
        assertThat(result.getTax().doubleValue()).isCloseTo(0.0, within(0.01));
    }

    @Test
    void EU_store_publishes_vat_fields_on_OrderCreatedEvent() {
        when(storeServiceClient.getStore("store-de-001")).thenReturn(buildDeStore());

        orderService.createOrder(buildDineInRequest());

        ArgumentCaptor<OrderCreatedEvent> captor = ArgumentCaptor.forClass(OrderCreatedEvent.class);
        verify(orderEventPublisher).publishOrderCreated(captor.capture());
        OrderCreatedEvent event = captor.getValue();
        assertThat(event.getVatCountryCode()).isEqualTo("DE");
        assertThat(event.getTotalVatAmount().doubleValue()).isCloseTo(1.90, within(0.01));
        assertThat(event.getCurrency()).isEqualTo("EUR");
    }

    @Test
    void EU_store_enriches_missing_category_from_menu_for_beverage_vat() {
        when(storeServiceClient.getStore("store-de-001")).thenReturn(buildDeStore());
        when(menuServiceClient.resolveVatCategory("item-beer")).thenReturn("ALCOHOL");

        CreateOrderRequest.OrderItemRequest item = new CreateOrderRequest.OrderItemRequest();
        item.setMenuItemId("item-beer");
        item.setName("House Lager");
        item.setQuantity(1);
        item.setPrice(10.0);

        CreateOrderRequest request = new CreateOrderRequest();
        request.setCustomerName("Hans Müller");
        request.setCustomerPhone("4915112345678");
        request.setStoreId("store-de-001");
        request.setOrderType(Order.OrderType.TAKEAWAY);
        request.setPaymentMethod(Order.PaymentMethod.CARD);
        request.setItems(List.of(item));

        Order result = orderService.createOrder(request);

        assertThat(result.getItems().get(0).getCategory()).isEqualTo("ALCOHOL");
        assertThat(result.getTotalVatAmount().doubleValue()).isCloseTo(1.90, within(0.01));
    }

    @Test
    void India_store_without_countryCode_still_uses_GST() {
        Store indiaStore = new Store("Mumbai Store", "DOM001", null, "9876543210");
        when(storeServiceClient.getStore("store-001")).thenReturn(indiaStore);

        CreateOrderRequest.OrderItemRequest item = new CreateOrderRequest.OrderItemRequest();
        item.setMenuItemId("item-001");
        item.setName("Biryani");
        item.setQuantity(1);
        item.setPrice(200.0);

        CreateOrderRequest request = new CreateOrderRequest();
        request.setCustomerName("Raj Kumar");
        request.setCustomerPhone("9876543210");
        request.setStoreId("store-001");
        request.setOrderType(Order.OrderType.TAKEAWAY);
        request.setPaymentMethod(Order.PaymentMethod.CASH);
        request.setItems(List.of(item));

        Order result = orderService.createOrder(request);

        assertThat(result.getVatCountryCode()).isNull();
        assertThat(result.getTax().doubleValue()).isCloseTo(10.0, within(0.01));
    }
}