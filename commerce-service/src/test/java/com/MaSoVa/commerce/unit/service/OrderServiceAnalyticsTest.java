package com.MaSoVa.commerce.unit.service;

import com.MaSoVa.commerce.order.client.*;
import com.MaSoVa.commerce.order.config.*;
import com.MaSoVa.commerce.order.dto.PosStaffPerformanceDTO;
import com.MaSoVa.commerce.order.entity.Order;
import com.MaSoVa.commerce.order.entity.Order.OrderStatus;
import com.MaSoVa.commerce.order.entity.Order.OrderType;
import com.MaSoVa.commerce.order.entity.QualityCheckpoint;
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
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class OrderServiceAnalyticsTest {

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

    private Order buildOrder(String id, OrderStatus status, OrderType type) {
        Order o = new Order();
        o.setId(id);
        o.setOrderNumber("ORD-" + id);
        o.setStoreId("store-1");
        o.setCustomerId("cust-1");
        o.setStatus(status);
        o.setOrderType(type);
        o.setTotal(BigDecimal.valueOf(200));
        o.setItems(Collections.emptyList());
        return o;
    }

    // getOrdersByDate

    @Test
    void getOrdersByDate_queries_with_IST_boundaries() {
        when(orderRepository.findByStoreIdAndCreatedAtBetween(eq("store-1"), any(), any()))
                .thenReturn(Collections.emptyList());

        List<Order> result = orderService.getOrdersByDate("store-1", LocalDate.of(2025, 5, 17));

        assertThat(result).isEmpty();
        verify(orderRepository).findByStoreIdAndCreatedAtBetween(eq("store-1"), any(LocalDateTime.class), any(LocalDateTime.class));
    }

    @Test
    void getOrdersByDate_returns_orders_from_repository() {
        Order o = buildOrder("o1", OrderStatus.DELIVERED, OrderType.TAKEAWAY);
        when(orderRepository.findByStoreIdAndCreatedAtBetween(eq("store-1"), any(), any()))
                .thenReturn(List.of(o));

        List<Order> result = orderService.getOrdersByDate("store-1", LocalDate.now());

        assertThat(result).hasSize(1);
    }

    // getOrdersByDateRange

    @Test
    void getOrdersByDateRange_delegates_to_repository() {
        LocalDateTime start = LocalDateTime.now().minusDays(7);
        LocalDateTime end = LocalDateTime.now();
        when(orderRepository.findByStoreIdAndCreatedAtBetween("store-1", start, end))
                .thenReturn(Collections.emptyList());

        List<Order> result = orderService.getOrdersByDateRange("store-1", start, end);

        assertThat(result).isEmpty();
    }

    // getOrdersByStaffAndDate

    @Test
    void getOrdersByStaffAndDate_uses_IST_boundaries() {
        when(orderRepository.findByStoreIdAndCreatedByAndCreatedAtBetween(
                eq("store-1"), eq("staff-1"), any(), any()))
                .thenReturn(Collections.emptyList());

        List<Order> result = orderService.getOrdersByStaffAndDate("store-1", "staff-1", LocalDate.now());

        assertThat(result).isEmpty();
        verify(orderRepository).findByStoreIdAndCreatedByAndCreatedAtBetween(
                eq("store-1"), eq("staff-1"), any(LocalDateTime.class), any(LocalDateTime.class));
    }

    // getCustomerOrders / getStoreOrders / getOrdersByStatus

    @Test
    void getCustomerOrders_delegates_to_repository() {
        when(orderRepository.findByCustomerIdOrderByCreatedAtDesc("cust-1"))
                .thenReturn(Collections.emptyList());

        List<Order> result = orderService.getCustomerOrders("cust-1");

        assertThat(result).isEmpty();
    }

    @Test
    void getStoreOrders_delegates_to_repository() {
        when(orderRepository.findByStoreIdOrderByCreatedAtDesc("store-1"))
                .thenReturn(Collections.emptyList());

        List<Order> result = orderService.getStoreOrders("store-1");

        assertThat(result).isEmpty();
    }

    @Test
    void getOrdersByStatus_filters_by_status() {
        Order o = buildOrder("o1", OrderStatus.PREPARING, OrderType.TAKEAWAY);
        when(orderRepository.findByStoreIdAndStatus("store-1", OrderStatus.PREPARING))
                .thenReturn(List.of(o));

        List<Order> result = orderService.getOrdersByStatus("store-1", OrderStatus.PREPARING);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getStatus()).isEqualTo(OrderStatus.PREPARING);
    }

    // getPosStaffPerformance

    @Test
    void getPosStaffPerformance_returns_correct_metrics() {
        Order delivered = buildOrder("o1", OrderStatus.DELIVERED, OrderType.TAKEAWAY);
        delivered.setCreatedByStaffId("staff-1");
        delivered.setCreatedByStaffName("Alice");
        delivered.setTotal(BigDecimal.valueOf(300));

        Order cancelled = buildOrder("o2", OrderStatus.CANCELLED, OrderType.TAKEAWAY);
        cancelled.setCreatedByStaffId("staff-1");
        cancelled.setCreatedByStaffName("Alice");
        cancelled.setTotal(BigDecimal.valueOf(100));

        when(orderRepository.findByCreatedByStaffIdAndCreatedAtBetween(
                eq("staff-1"), any(), any())).thenReturn(List.of(delivered, cancelled));

        PosStaffPerformanceDTO dto = orderService.getPosStaffPerformance(
                "staff-1", LocalDate.now().minusDays(7), LocalDate.now());

        assertThat(dto.getTotalOrders()).isEqualTo(2);
        assertThat(dto.getCompletedOrders()).isEqualTo(1);
        assertThat(dto.getCancelledOrders()).isEqualTo(1);
        assertThat(dto.getTotalRevenue()).isEqualByComparingTo(BigDecimal.valueOf(400));
        assertThat(dto.getStaffName()).isEqualTo("Alice");
    }

    @Test
    void getPosStaffPerformance_returns_null_staff_name_when_no_orders() {
        when(orderRepository.findByCreatedByStaffIdAndCreatedAtBetween(
                eq("staff-2"), any(), any())).thenReturn(Collections.emptyList());

        PosStaffPerformanceDTO dto = orderService.getPosStaffPerformance(
                "staff-2", LocalDate.now().minusDays(1), LocalDate.now());

        assertThat(dto.getTotalOrders()).isZero();
        assertThat(dto.getStaffName()).isNull();
    }

    // getKitchenStaffPerformance

    @Test
    void getKitchenStaffPerformance_returns_correct_metrics() {
        Order o1 = buildOrder("o1", OrderStatus.DELIVERED, OrderType.DELIVERY);
        o1.setActualPreparationTime(25);

        Order o2 = buildOrder("o2", OrderStatus.DISPATCHED, OrderType.DELIVERY);
        o2.setActualPreparationTime(15);

        Order o3 = buildOrder("o3", OrderStatus.PREPARING, OrderType.TAKEAWAY);

        when(orderRepository.findByAssignedKitchenStaffIdAndCreatedAtBetween(
                eq("staff-1"), any(), any())).thenReturn(List.of(o1, o2, o3));

        Map<String, Object> result = orderService.getKitchenStaffPerformance("staff-1", LocalDate.now());

        assertThat(result.get("totalOrders")).isEqualTo(3);
        assertThat(result.get("completedOrders")).isEqualTo(2);
        assertThat((Double) result.get("averagePreparationTime")).isEqualTo(20.0);
        assertThat(result.get("staffId")).isEqualTo("staff-1");
    }

    @Test
    void getKitchenStaffPerformance_counts_failed_quality_checks() {
        Order o = buildOrder("o1", OrderStatus.DELIVERED, OrderType.DELIVERY);
        QualityCheckpoint failedCp = QualityCheckpoint.builder()
                .checkpointName("Temperature")
                .type(QualityCheckpoint.CheckpointType.TEMPERATURE)
                .status(QualityCheckpoint.CheckpointStatus.FAILED)
                .build();
        o.setQualityCheckpoints(new ArrayList<>(List.of(failedCp)));

        when(orderRepository.findByAssignedKitchenStaffIdAndCreatedAtBetween(
                eq("staff-1"), any(), any())).thenReturn(List.of(o));

        Map<String, Object> result = orderService.getKitchenStaffPerformance("staff-1", LocalDate.now());

        assertThat(result.get("failedQualityChecks")).isEqualTo(1);
    }

    @Test
    void getKitchenStaffPerformance_zero_completion_rate_when_no_orders() {
        when(orderRepository.findByAssignedKitchenStaffIdAndCreatedAtBetween(
                eq("staff-1"), any(), any())).thenReturn(Collections.emptyList());

        Map<String, Object> result = orderService.getKitchenStaffPerformance("staff-1", LocalDate.now());

        assertThat((Double) result.get("completionRate")).isZero();
    }

    // getAveragePreparationTimeByMenuItem

    @Test
    void getAveragePreparationTimeByMenuItem_returns_per_item_averages() {
        Order o = buildOrder("o1", OrderStatus.DELIVERED, OrderType.TAKEAWAY);
        o.setActualPreparationTime(30);
        com.MaSoVa.commerce.order.entity.OrderItem item =
                com.MaSoVa.commerce.order.entity.OrderItem.builder()
                        .menuItemId("m1").name("Butter Chicken").quantity(1).price(200.0).build();
        o.setItems(List.of(item));

        when(orderRepository.findByStoreIdAndCreatedAtBetween(eq("store-1"), any(), any()))
                .thenReturn(List.of(o));

        Map<String, Double> result = orderService.getAveragePreparationTimeByMenuItem("store-1", LocalDate.now());

        assertThat(result).containsKey("Butter Chicken");
        assertThat(result.get("Butter Chicken")).isEqualTo(30.0);
    }

    @Test
    void getAveragePreparationTimeByMenuItem_skips_orders_with_zero_prep_time() {
        Order o = buildOrder("o1", OrderStatus.DELIVERED, OrderType.TAKEAWAY);
        o.setActualPreparationTime(0);
        com.MaSoVa.commerce.order.entity.OrderItem item =
                com.MaSoVa.commerce.order.entity.OrderItem.builder()
                        .menuItemId("m1").name("Pizza").quantity(1).price(150.0).build();
        o.setItems(List.of(item));

        when(orderRepository.findByStoreIdAndCreatedAtBetween(eq("store-1"), any(), any()))
                .thenReturn(List.of(o));

        Map<String, Double> result = orderService.getAveragePreparationTimeByMenuItem("store-1", LocalDate.now());

        assertThat(result).isEmpty();
    }
}
