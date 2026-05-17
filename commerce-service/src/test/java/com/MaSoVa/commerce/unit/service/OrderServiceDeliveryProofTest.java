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
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class OrderServiceDeliveryProofTest {

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
    }

    private Order buildDeliveryOrder(String id) {
        Order order = new Order();
        order.setId(id);
        order.setOrderNumber("ORD-DELIVERY-001");
        order.setStoreId("store-1");
        order.setCustomerId("cust-1");
        order.setCustomerEmail("test@example.com");
        order.setStatus(OrderStatus.DISPATCHED);
        order.setOrderType(OrderType.DELIVERY);
        order.setItems(Collections.emptyList());
        order.setTotal(BigDecimal.valueOf(300));
        return order;
    }

    @Test
    void setDeliveryOtp_stores_otp_and_expiry() {
        Order order = buildDeliveryOrder("o1");
        when(orderRepository.findById("o1")).thenReturn(Optional.of(order));

        LocalDateTime generatedAt = LocalDateTime.now();
        LocalDateTime expiresAt = generatedAt.plusMinutes(15);

        Order result = orderService.setDeliveryOtp("o1", "1234", generatedAt, expiresAt);

        assertThat(result.getDeliveryOtp()).isEqualTo("1234");
        assertThat(result.getDeliveryOtpGeneratedAt()).isEqualTo(generatedAt);
        assertThat(result.getDeliveryOtpExpiresAt()).isEqualTo(expiresAt);
    }

    @Test
    void setDeliveryOtp_sends_otp_notification() {
        Order order = buildDeliveryOrder("o1");
        when(orderRepository.findById("o1")).thenReturn(Optional.of(order));

        orderService.setDeliveryOtp("o1", "5678", LocalDateTime.now(), LocalDateTime.now().plusMinutes(15));

        verify(customerNotificationService).sendDeliveryOtpNotification(any(Order.class), eq("5678"));
    }

    @Test
    void setDeliveryProof_stores_photo_and_signature_urls() {
        Order order = buildDeliveryOrder("o1");
        when(orderRepository.findById("o1")).thenReturn(Optional.of(order));

        Order result = orderService.setDeliveryProof(
                "o1", "PHOTO", "http://cdn.example.com/photo.jpg", "http://cdn.example.com/sig.jpg", "Left at door");

        assertThat(result.getDeliveryProofType()).isEqualTo("PHOTO");
        assertThat(result.getDeliveryPhotoUrl()).isEqualTo("http://cdn.example.com/photo.jpg");
        assertThat(result.getDeliverySignatureUrl()).isEqualTo("http://cdn.example.com/sig.jpg");
        assertThat(result.getDeliveryNotes()).isEqualTo("Left at door");
    }

    @Test
    void setDeliveryProof_null_urls_not_overwritten() {
        Order order = buildDeliveryOrder("o1");
        order.setDeliveryPhotoUrl("existing-photo.jpg");
        when(orderRepository.findById("o1")).thenReturn(Optional.of(order));

        Order result = orderService.setDeliveryProof("o1", "OTP", null, null, "Handed to customer");

        // null args should not overwrite existing values
        assertThat(result.getDeliveryPhotoUrl()).isEqualTo("existing-photo.jpg");
        assertThat(result.getDeliveryNotes()).isEqualTo("Handed to customer");
    }

    @Test
    void markOrderDelivered_sets_delivered_status_and_timestamps() {
        Order order = buildDeliveryOrder("o1");
        when(orderRepository.findById("o1")).thenReturn(Optional.of(order));

        LocalDateTime deliveredAt = LocalDateTime.now();
        Order result = orderService.markOrderDelivered("o1", deliveredAt, "OTP");

        assertThat(result.getStatus()).isEqualTo(OrderStatus.DELIVERED);
        assertThat(result.getDeliveredAt()).isEqualTo(deliveredAt);
        assertThat(result.getCompletedAt()).isEqualTo(deliveredAt);
        assertThat(result.getDeliveryProofType()).isEqualTo("OTP");
    }

    @Test
    void markOrderDelivered_sends_status_notification() {
        Order order = buildDeliveryOrder("o1");
        when(orderRepository.findById("o1")).thenReturn(Optional.of(order));

        orderService.markOrderDelivered("o1", LocalDateTime.now(), "PHOTO");

        verify(customerNotificationService).sendOrderStatusNotification(any(Order.class), eq(OrderStatus.DELIVERED));
    }

    @Test
    void markOrderDelivered_broadcasts_websocket() {
        Order order = buildDeliveryOrder("o1");
        when(orderRepository.findById("o1")).thenReturn(Optional.of(order));

        orderService.markOrderDelivered("o1", LocalDateTime.now(), "OTP");

        verify(webSocketController).sendKitchenQueueUpdate(eq("store-1"), any(Order.class));
    }

    @Test
    void anonymizeCustomerOrders_replaces_pii_with_anonymized() {
        Order o1 = buildDeliveryOrder("o1");
        o1.setCustomerName("John Doe");
        o1.setCustomerPhone("9876543210");
        o1.setCustomerEmail("john@example.com");

        when(orderRepository.findByCustomerId("cust-1")).thenReturn(List.of(o1));

        orderService.anonymizeCustomerOrders("cust-1");

        verify(orderRepository).save(argThat(order ->
                "ANONYMIZED".equals(order.getCustomerName()) &&
                "ANONYMIZED".equals(order.getCustomerPhone()) &&
                "ANONYMIZED".equals(order.getCustomerEmail()) &&
                order.getDeliveryAddress() == null
        ));
    }

    @Test
    void anonymizeCustomerOrders_handles_no_orders_gracefully() {
        when(orderRepository.findByCustomerId("cust-999")).thenReturn(Collections.emptyList());

        orderService.anonymizeCustomerOrders("cust-999");

        verify(orderRepository, never()).save(any());
    }

    @Test
    void getAveragePreparationTime_returns_zero_when_no_data() {
        when(orderRepository.findByStoreIdAndCreatedAtBetween(eq("store-1"), any(), any()))
                .thenReturn(Collections.emptyList());

        Double result = orderService.getAveragePreparationTime("store-1", java.time.LocalDate.now());

        assertThat(result).isZero();
    }

    @Test
    void getAveragePreparationTime_averages_prep_times() {
        Order o1 = buildDeliveryOrder("o1");
        o1.setActualPreparationTime(20);
        Order o2 = buildDeliveryOrder("o2");
        o2.setActualPreparationTime(40);

        when(orderRepository.findByStoreIdAndCreatedAtBetween(eq("store-1"), any(), any()))
                .thenReturn(List.of(o1, o2));

        Double result = orderService.getAveragePreparationTime("store-1", java.time.LocalDate.now());

        assertThat(result).isEqualTo(30.0);
    }

    @Test
    void getPreparationTimeDistribution_returns_zero_map_when_empty() {
        when(orderRepository.findByStoreIdAndCreatedAtBetween(eq("store-1"), any(), any()))
                .thenReturn(Collections.emptyList());

        java.util.Map<String, Object> result = orderService.getPreparationTimeDistribution("store-1", java.time.LocalDate.now());

        assertThat(result.get("min")).isEqualTo(0);
        assertThat(result.get("max")).isEqualTo(0);
        assertThat((Double) result.get("average")).isZero();
    }

    @Test
    void getPreparationTimeDistribution_returns_correct_stats() {
        Order o1 = buildDeliveryOrder("o1");
        o1.setActualPreparationTime(10);
        Order o2 = buildDeliveryOrder("o2");
        o2.setActualPreparationTime(20);
        Order o3 = buildDeliveryOrder("o3");
        o3.setActualPreparationTime(30);

        when(orderRepository.findByStoreIdAndCreatedAtBetween(eq("store-1"), any(), any()))
                .thenReturn(List.of(o1, o2, o3));

        java.util.Map<String, Object> result = orderService.getPreparationTimeDistribution("store-1", java.time.LocalDate.now());

        assertThat(result.get("min")).isEqualTo(10);
        assertThat(result.get("max")).isEqualTo(30);
        assertThat((Double) result.get("average")).isEqualTo(20.0);
    }
}
