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
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Global-3: Verifies that store.currency is propagated to Order (MongoDB)
 * and OrderJpaEntity (PostgreSQL) when creating an order.
 * India stores (null currency) are also tested — no regression.
 */
@ExtendWith(MockitoExtension.class)
class OrderServiceCurrencyTest {

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
        TaxConfiguration taxConfiguration = new TaxConfiguration();
        PreparationTimeConfiguration prepConfig = new PreparationTimeConfiguration();
        DeliveryFeeConfiguration deliveryFeeConfig = new DeliveryFeeConfiguration();
        ObjectMapper objectMapper = new ObjectMapper();
        EuVatEngine euVatEngine = new EuVatEngine(new EuVatConfiguration());

        orderService = new OrderService(
                orderRepository, orderJpaRepository, orderItemSyncService,
                objectMapper, webSocketController, menuServiceClient,
                customerServiceClient, customerNotificationService,
                deliveryServiceClient, storeServiceClient, inventoryServiceClient,
                taxConfiguration, prepConfig, deliveryFeeConfig,
                orderEventPublisher, euVatEngine, fiscalSigningService
        );

        when(menuServiceClient.isMenuItemAvailable(anyString())).thenReturn(true);
        when(menuServiceClient.validatePrice(anyString(), anyDouble())).thenReturn(true);
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));
        when(orderJpaRepository.save(any(OrderJpaEntity.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    private CreateOrderRequest buildTakeawayRequest() {
        CreateOrderRequest.OrderItemRequest item = new CreateOrderRequest.OrderItemRequest();
        item.setMenuItemId("menu-item-001");
        item.setName("Burger");
        item.setQuantity(1);
        item.setPrice(100.0);

        CreateOrderRequest request = new CreateOrderRequest();
        request.setCustomerName("Test Customer");
        request.setStoreId("store-001");
        request.setOrderType(Order.OrderType.TAKEAWAY);
        request.setItems(List.of(item));
        return request;
    }

    @Test
    void createOrder_euStore_currencyPropagatedToMongoOrder() {
        Store deStore = new Store();
        deStore.setCountryCode("DE");
        deStore.setCurrency("EUR");
        deStore.setLocale("de-DE");
        when(storeServiceClient.getStore("store-001")).thenReturn(deStore);

        Order result = orderService.createOrder(buildTakeawayRequest());

        assertThat(result.getCurrency()).isEqualTo("EUR");
    }

    @Test
    void createOrder_euStore_currencyPropagatedToJpaEntity() {
        Store gbStore = new Store();
        gbStore.setCountryCode("GB");
        gbStore.setCurrency("GBP");
        gbStore.setLocale("en-GB");
        when(storeServiceClient.getStore("store-001")).thenReturn(gbStore);

        orderService.createOrder(buildTakeawayRequest());

        ArgumentCaptor<OrderJpaEntity> captor = ArgumentCaptor.forClass(OrderJpaEntity.class);
        verify(orderJpaRepository).save(captor.capture());
        assertThat(captor.getValue().getCurrency()).isEqualTo("GBP");
    }

    @Test
    void createOrder_indiaStore_currencyRemainsNull() {
        // India store: countryCode = null, currency = null
        Store indiaStore = new Store();
        when(storeServiceClient.getStore("store-001")).thenReturn(indiaStore);

        Order result = orderService.createOrder(buildTakeawayRequest());

        assertThat(result.getCurrency()).isNull();
    }

    @Test
    void createOrder_indiaStore_jpaEntityCurrencyIsNull() {
        Store indiaStore = new Store();
        when(storeServiceClient.getStore("store-001")).thenReturn(indiaStore);

        orderService.createOrder(buildTakeawayRequest());

        ArgumentCaptor<OrderJpaEntity> captor = ArgumentCaptor.forClass(OrderJpaEntity.class);
        verify(orderJpaRepository).save(captor.capture());
        assertThat(captor.getValue().getCurrency()).isNull();
    }
}
