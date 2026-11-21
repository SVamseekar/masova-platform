package com.MaSoVa.commerce.unit.service;

import com.MaSoVa.commerce.order.service.OrderService;
import com.MaSoVa.commerce.order.service.OrderItemSyncService;
import com.MaSoVa.commerce.order.service.CustomerNotificationService;
import com.MaSoVa.commerce.order.service.OrderEventPublisher;
import com.MaSoVa.commerce.order.service.AggregatorService;
import com.MaSoVa.commerce.order.service.EuVatEngine;
import com.MaSoVa.commerce.order.client.CustomerServiceClient;
import com.MaSoVa.commerce.order.client.DeliveryServiceClient;
import com.MaSoVa.commerce.order.client.InventoryServiceClient;
import com.MaSoVa.commerce.order.client.MenuServiceClient;
import com.MaSoVa.commerce.order.client.StoreServiceClient;
import com.MaSoVa.commerce.order.config.DeliveryFeeConfiguration;
import com.MaSoVa.commerce.order.config.EuVatConfiguration;
import com.MaSoVa.commerce.order.config.PreparationTimeConfiguration;
import com.MaSoVa.commerce.order.config.TaxConfiguration;
import com.MaSoVa.commerce.order.entity.Order;
import com.MaSoVa.commerce.order.repository.OrderJpaRepository;
import com.MaSoVa.commerce.order.repository.OrderRepository;
import com.MaSoVa.commerce.order.websocket.OrderWebSocketController;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * A payment status event may only mark an order PAID when the charged amount and
 * currency match the order's own total and currency. The browser chooses the amount
 * it sends to payment-service, so the order is the source of truth.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("OrderService.applyPaymentStatusEvent amount check")
class OrderServicePaymentAmountTest {

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
    @Mock private AggregatorService aggregatorService;
    @Mock private OrderEventPublisher orderEventPublisher;
    @Mock private com.MaSoVa.commerce.fiscal.FiscalSigningService fiscalSigningService;

    private OrderService orderService;
    private Order order;

    @BeforeEach
    void setUp() {
        orderService = new OrderService(orderRepository, orderJpaRepository, orderItemSyncService,
                new ObjectMapper(), webSocketController, menuServiceClient, customerServiceClient,
                customerNotificationService, deliveryServiceClient, storeServiceClient, inventoryServiceClient,
                new TaxConfiguration(), new PreparationTimeConfiguration(), new DeliveryFeeConfiguration(),
                orderEventPublisher, new EuVatEngine(new EuVatConfiguration()), aggregatorService,
                fiscalSigningService);

        order = new Order();
        order.setId("ord-1");
        order.setCustomerId("cust-1");
        order.setTotal(new BigDecimal("25.5"));
        order.setCurrency("EUR");
        order.setPaymentStatus(Order.PaymentStatus.PENDING);
        when(orderRepository.findById("ord-1")).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));
        when(orderJpaRepository.findByMongoId(any())).thenReturn(Optional.empty());
    }

    private void assertFlaggedNotPaid() {
        assertThat(order.getPaymentStatus()).isEqualTo(Order.PaymentStatus.PENDING);
        assertThat(order.getPaymentReviewReason()).isNotBlank();
        assertThat(order.getPaymentTransactionId()).isEqualTo("txn-1");
        verify(orderRepository).save(order);
        verify(webSocketController).sendKitchenQueueUpdate(any(), any());
    }

    @Test
    @DisplayName("PAID with a lower amount than the order total keeps the order unpaid and flags it for review")
    void underpaymentIsFlagged() {
        orderService.applyPaymentStatusEvent("ord-1", "PAID", "txn-1", new BigDecimal("1.00"), "EUR");
        assertFlaggedNotPaid();
    }

    @Test
    @DisplayName("PAID in a different currency is flagged, not PAID")
    void wrongCurrencyIsFlagged() {
        orderService.applyPaymentStatusEvent("ord-1", "PAID", "txn-1", new BigDecimal("25.50"), "INR");
        assertFlaggedNotPaid();
    }

    @Test
    @DisplayName("PAID without an amount (old event schema) is flagged, not PAID and not lost")
    void missingAmountIsFlagged() {
        orderService.applyPaymentStatusEvent("ord-1", "PAID", "txn-1", null, null);
        assertFlaggedNotPaid();
    }

    @Test
    @DisplayName("a double-built India total matches the charge rounded to two decimals")
    void roundedIndiaTotalMatches() {
        order.setCurrency(null);
        order.setTotal(BigDecimal.valueOf(450.50 + 0.0 + 450.50 * 0.05)); // 473.025 as a double
        orderService.applyPaymentStatusEvent("ord-1", "PAID", "txn-1",
                BigDecimal.valueOf(450.50 + 450.50 * 0.05).setScale(2, java.math.RoundingMode.HALF_UP), "INR");
        assertThat(order.getPaymentStatus()).isEqualTo(Order.PaymentStatus.PAID);
        assertThat(order.getPaymentReviewReason()).isNull();
    }

    @Test
    @DisplayName("PAID with the order's total and currency marks the order PAID")
    void matchingPaymentMarksPaid() {
        orderService.applyPaymentStatusEvent("ord-1", "PAID", "txn-1", new BigDecimal("25.50"), "eur");
        assertThat(order.getPaymentStatus()).isEqualTo(Order.PaymentStatus.PAID);
    }

    @Test
    @DisplayName("an order with no currency is an India order and matches INR")
    void legacyOrderWithoutCurrencyMatchesInr() {
        order.setCurrency(null);
        orderService.applyPaymentStatusEvent("ord-1", "PAID", "txn-1", new BigDecimal("25.50"), "INR");
        assertThat(order.getPaymentStatus()).isEqualTo(Order.PaymentStatus.PAID);
    }

    @Test
    @DisplayName("FAILED needs no amount check")
    void failedIsNotAmountChecked() {
        orderService.applyPaymentStatusEvent("ord-1", "FAILED", "txn-1", null, null);
        assertThat(order.getPaymentStatus()).isEqualTo(Order.PaymentStatus.FAILED);
    }

    @Test
    @DisplayName("a later matching PAID clears an earlier review flag")
    void matchingPaidClearsReviewFlag() {
        order.setPaymentReviewReason("Charged 1.00 EUR but the order total is 25.5 EUR");
        orderService.applyPaymentStatusEvent("ord-1", "PAID", "txn-2", new BigDecimal("25.50"), "EUR");
        assertThat(order.getPaymentStatus()).isEqualTo(Order.PaymentStatus.PAID);
        assertThat(order.getPaymentReviewReason()).isNull();
    }
}
