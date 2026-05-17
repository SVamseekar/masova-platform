package com.MaSoVa.commerce.unit.service;

import com.MaSoVa.commerce.order.client.*;
import com.MaSoVa.commerce.order.config.*;
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
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class OrderServiceQualityCheckpointTest {

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

    private Order buildOrder(String id) {
        Order order = new Order();
        order.setId(id);
        order.setOrderNumber("ORD-001");
        order.setStoreId("store-1");
        order.setStatus(OrderStatus.RECEIVED);
        order.setOrderType(OrderType.TAKEAWAY);
        order.setPriority(Order.Priority.NORMAL);
        order.setItems(Collections.emptyList());
        order.setTotal(BigDecimal.valueOf(200));
        return order;
    }

    @Test
    void addQualityCheckpoint_adds_checkpoint_to_order() {
        Order order = buildOrder("o1");
        when(orderRepository.findById("o1")).thenReturn(Optional.of(order));

        QualityCheckpoint cp = QualityCheckpoint.builder()
                .checkpointName("Temperature Check")
                .type(QualityCheckpoint.CheckpointType.TEMPERATURE)
                .status(QualityCheckpoint.CheckpointStatus.PENDING)
                .build();

        Order result = orderService.addQualityCheckpoint("o1", cp);

        assertThat(result.getQualityCheckpoints()).hasSize(1);
        assertThat(result.getQualityCheckpoints().get(0).getCheckpointName()).isEqualTo("Temperature Check");
        assertThat(result.getQualityCheckpoints().get(0).getCheckedAt()).isNotNull();
    }

    @Test
    void addQualityCheckpoint_initializes_list_when_null() {
        Order order = buildOrder("o1");
        order.setQualityCheckpoints(null);
        when(orderRepository.findById("o1")).thenReturn(Optional.of(order));

        QualityCheckpoint cp = QualityCheckpoint.builder()
                .checkpointName("Portion Check")
                .type(QualityCheckpoint.CheckpointType.PORTION_SIZE)
                .status(QualityCheckpoint.CheckpointStatus.PENDING)
                .build();

        Order result = orderService.addQualityCheckpoint("o1", cp);

        assertThat(result.getQualityCheckpoints()).isNotNull().hasSize(1);
    }

    @Test
    void addQualityCheckpoint_broadcasts_websocket() {
        Order order = buildOrder("o1");
        when(orderRepository.findById("o1")).thenReturn(Optional.of(order));

        QualityCheckpoint cp = QualityCheckpoint.builder()
                .checkpointName("Final Inspection")
                .type(QualityCheckpoint.CheckpointType.FINAL_INSPECTION)
                .status(QualityCheckpoint.CheckpointStatus.PENDING)
                .build();

        orderService.addQualityCheckpoint("o1", cp);

        verify(webSocketController).sendKitchenQueueUpdate(eq("store-1"), any(Order.class));
    }

    @Test
    void updateQualityCheckpoint_updates_status_and_notes() {
        Order order = buildOrder("o1");
        List<QualityCheckpoint> checkpoints = new ArrayList<>();
        QualityCheckpoint cp = QualityCheckpoint.builder()
                .checkpointName("Ingredient Quality Check")
                .type(QualityCheckpoint.CheckpointType.INGREDIENT_QUALITY)
                .status(QualityCheckpoint.CheckpointStatus.PENDING)
                .build();
        checkpoints.add(cp);
        order.setQualityCheckpoints(checkpoints);
        when(orderRepository.findById("o1")).thenReturn(Optional.of(order));

        Order result = orderService.updateQualityCheckpoint(
                "o1", "Ingredient Quality Check", QualityCheckpoint.CheckpointStatus.PASSED, "Looks good");

        QualityCheckpoint updated = result.getQualityCheckpoints().get(0);
        assertThat(updated.getStatus()).isEqualTo(QualityCheckpoint.CheckpointStatus.PASSED);
        assertThat(updated.getNotes()).isEqualTo("Looks good");
        assertThat(updated.getCheckedAt()).isNotNull();
    }

    @Test
    void updateQualityCheckpoint_missing_checkpoint_throws() {
        Order order = buildOrder("o1");
        order.setQualityCheckpoints(new ArrayList<>());
        when(orderRepository.findById("o1")).thenReturn(Optional.of(order));

        assertThatThrownBy(() ->
            orderService.updateQualityCheckpoint("o1", "Nonexistent", QualityCheckpoint.CheckpointStatus.PASSED, ""))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Checkpoint not found");
    }

    @Test
    void updateQualityCheckpoint_null_list_throws() {
        Order order = buildOrder("o1");
        order.setQualityCheckpoints(null);
        when(orderRepository.findById("o1")).thenReturn(Optional.of(order));

        assertThatThrownBy(() ->
            orderService.updateQualityCheckpoint("o1", "check", QualityCheckpoint.CheckpointStatus.PASSED, ""))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("No checkpoints found");
    }

    @Test
    void getQualityCheckpoints_returns_checkpoints() {
        Order order = buildOrder("o1");
        List<QualityCheckpoint> checkpoints = List.of(
                QualityCheckpoint.builder()
                        .checkpointName("Temperature Check")
                        .type(QualityCheckpoint.CheckpointType.TEMPERATURE)
                        .status(QualityCheckpoint.CheckpointStatus.PENDING)
                        .build()
        );
        order.setQualityCheckpoints(new ArrayList<>(checkpoints));
        when(orderRepository.findById("o1")).thenReturn(Optional.of(order));

        List<QualityCheckpoint> result = orderService.getQualityCheckpoints("o1");

        assertThat(result).hasSize(1);
    }

    @Test
    void getQualityCheckpoints_returns_empty_list_when_null() {
        Order order = buildOrder("o1");
        order.setQualityCheckpoints(null);
        when(orderRepository.findById("o1")).thenReturn(Optional.of(order));

        List<QualityCheckpoint> result = orderService.getQualityCheckpoints("o1");

        assertThat(result).isEmpty();
    }

    @Test
    void getOrdersWithFailedQualityChecks_returns_orders_with_failures() {
        Order o1 = buildOrder("o1");
        QualityCheckpoint failed = QualityCheckpoint.builder()
                .checkpointName("Temperature")
                .type(QualityCheckpoint.CheckpointType.TEMPERATURE)
                .status(QualityCheckpoint.CheckpointStatus.FAILED)
                .build();
        o1.setQualityCheckpoints(new ArrayList<>(List.of(failed)));

        Order o2 = buildOrder("o2");
        QualityCheckpoint passed = QualityCheckpoint.builder()
                .checkpointName("Portion")
                .type(QualityCheckpoint.CheckpointType.PORTION_SIZE)
                .status(QualityCheckpoint.CheckpointStatus.PASSED)
                .build();
        o2.setQualityCheckpoints(new ArrayList<>(List.of(passed)));

        when(orderRepository.findByStoreIdOrderByCreatedAtDesc("store-1")).thenReturn(List.of(o1, o2));

        List<Order> result = orderService.getOrdersWithFailedQualityChecks("store-1");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getId()).isEqualTo("o1");
    }

    @Test
    void assignToMakeTable_sets_station_and_staff() {
        Order order = buildOrder("o1");
        when(orderRepository.findById("o1")).thenReturn(Optional.of(order));

        Order result = orderService.assignToMakeTable("o1", "STATION-A", "staff-1", "Chef Bob");

        assertThat(result.getAssignedMakeTableStation()).isEqualTo("STATION-A");
        assertThat(result.getAssignedKitchenStaffId()).isEqualTo("staff-1");
        assertThat(result.getAssignedKitchenStaffName()).isEqualTo("Chef Bob");
        assertThat(result.getAssignedToKitchenAt()).isNotNull();
    }

    @Test
    void getOrdersByMakeTableStation_filters_by_station() {
        Order o1 = buildOrder("o1");
        o1.setStatus(OrderStatus.PREPARING);
        o1.setAssignedMakeTableStation("STATION-A");
        o1.setCreatedAt(java.time.LocalDateTime.now().minusMinutes(5));

        Order o2 = buildOrder("o2");
        o2.setStatus(OrderStatus.PREPARING);
        o2.setAssignedMakeTableStation("STATION-B");
        o2.setCreatedAt(java.time.LocalDateTime.now());

        when(orderRepository.findByStoreIdAndStatusIn(eq("store-1"), anyList()))
                .thenReturn(List.of(o1, o2));

        List<Order> result = orderService.getOrdersByMakeTableStation("store-1", "STATION-A");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getId()).isEqualTo("o1");
    }
}
