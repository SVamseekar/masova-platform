package com.MaSoVa.commerce.unit.service;

import com.MaSoVa.commerce.order.entity.Order;
import com.MaSoVa.commerce.order.entity.OrderItem;
import com.MaSoVa.commerce.order.entity.OrderJpaEntity;
import com.MaSoVa.commerce.order.repository.OrderItemJpaRepository;
import com.MaSoVa.commerce.order.repository.OrderJpaRepository;
import com.MaSoVa.commerce.order.service.OrderItemSyncService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderItemSyncServiceTest {

    @Mock private OrderJpaRepository orderJpaRepository;
    @Mock private OrderItemJpaRepository orderItemJpaRepository;

    private OrderItemSyncService syncService;

    @BeforeEach
    void setUp() {
        syncService = new OrderItemSyncService(orderJpaRepository, orderItemJpaRepository, new ObjectMapper());
    }

    private Order buildOrder(List<OrderItem> items) {
        Order order = new Order();
        order.setId("o1");
        order.setOrderNumber("ORD-001");
        order.setStatus(Order.OrderStatus.PREPARING);
        order.setPaymentStatus(Order.PaymentStatus.PAID);
        order.setPaymentMethod(Order.PaymentMethod.CASH);
        order.setPriority(Order.Priority.NORMAL);
        order.setSubtotal(BigDecimal.valueOf(200));
        order.setDeliveryFee(BigDecimal.ZERO);
        order.setTax(BigDecimal.valueOf(10));
        order.setTotal(BigDecimal.valueOf(210));
        order.setReceivedAt(LocalDateTime.now().minusMinutes(10));
        order.setPreparingStartedAt(LocalDateTime.now().minusMinutes(5));
        order.setItems(items);
        return order;
    }

    private OrderJpaEntity buildJpaOrder() {
        OrderJpaEntity jpa = new OrderJpaEntity();
        jpa.setId("jpa-order-1");
        jpa.setOrderNumber("ORD-001");
        jpa.setStoreId("store-1");
        return jpa;
    }

    @Test
    void syncOrderItems_calls_deleteByOrderId_and_save() {
        OrderJpaEntity jpa = buildJpaOrder();
        Order order = buildOrder(Collections.emptyList());
        when(orderJpaRepository.findById("jpa-order-1")).thenReturn(Optional.of(jpa));
        when(orderJpaRepository.save(any())).thenReturn(jpa);

        syncService.syncOrderItems(jpa, order);

        verify(orderItemJpaRepository).deleteByOrderId("jpa-order-1");
        verify(orderJpaRepository).save(jpa);
    }

    @Test
    void syncOrderByMongoId_loads_fresh_entity_and_syncs() {
        OrderJpaEntity jpa = buildJpaOrder();
        Order order = buildOrder(Collections.emptyList());
        when(orderJpaRepository.findByMongoId("o1")).thenReturn(Optional.of(jpa));
        when(orderJpaRepository.save(any())).thenReturn(jpa);

        boolean synced = syncService.syncOrderByMongoId("o1", order);

        assertThat(synced).isTrue();
        verify(orderItemJpaRepository).deleteByOrderId("jpa-order-1");
        verify(orderJpaRepository).save(jpa);
        assertThat(jpa.getStatus()).isEqualTo("PREPARING");
    }

    @Test
    void syncOrderByMongoId_returns_false_when_missing() {
        Order order = buildOrder(Collections.emptyList());
        when(orderJpaRepository.findByMongoId("missing")).thenReturn(Optional.empty());

        boolean synced = syncService.syncOrderByMongoId("missing", order);

        assertThat(synced).isFalse();
        verify(orderJpaRepository, never()).save(any());
    }

    @Test
    void syncOrderItems_updates_status_on_jpa_entity() {
        OrderJpaEntity jpa = buildJpaOrder();
        Order order = buildOrder(Collections.emptyList());
        when(orderJpaRepository.findById("jpa-order-1")).thenReturn(Optional.of(jpa));
        when(orderJpaRepository.save(any())).thenReturn(jpa);

        syncService.syncOrderItems(jpa, order);

        assertThat(jpa.getStatus()).isEqualTo("PREPARING");
    }

    @Test
    void syncOrderItems_updates_payment_status() {
        OrderJpaEntity jpa = buildJpaOrder();
        Order order = buildOrder(Collections.emptyList());
        when(orderJpaRepository.findById("jpa-order-1")).thenReturn(Optional.of(jpa));
        when(orderJpaRepository.save(any())).thenReturn(jpa);

        syncService.syncOrderItems(jpa, order);

        assertThat(jpa.getPaymentStatus()).isEqualTo("PAID");
    }

    @Test
    void syncOrderItems_maps_items_with_valid_menuItemId() {
        OrderJpaEntity jpa = buildJpaOrder();
        OrderItem item = OrderItem.builder()
                .menuItemId("m1").name("Pizza").quantity(2).price(150.0)
                .variant("Large").customizations(List.of("Extra Cheese"))
                .build();
        Order order = buildOrder(List.of(item));
        when(orderJpaRepository.findById("jpa-order-1")).thenReturn(Optional.of(jpa));
        when(orderJpaRepository.save(any())).thenReturn(jpa);

        syncService.syncOrderItems(jpa, order);

        verify(orderJpaRepository).save(argThat(saved ->
                saved.getItems() != null && saved.getItems().size() == 1 &&
                "m1".equals(saved.getItems().get(0).getMenuItemId())
        ));
    }

    @Test
    void syncOrderItems_skips_item_with_null_menuItemId() {
        OrderJpaEntity jpa = buildJpaOrder();
        OrderItem item = OrderItem.builder()
                .menuItemId(null).name("Unknown").quantity(1).price(100.0).build();
        Order order = buildOrder(List.of(item));
        when(orderJpaRepository.findById("jpa-order-1")).thenReturn(Optional.of(jpa));
        when(orderJpaRepository.save(any())).thenReturn(jpa);

        syncService.syncOrderItems(jpa, order);

        verify(orderJpaRepository).save(argThat(saved ->
                saved.getItems() != null && saved.getItems().isEmpty()
        ));
    }

    @Test
    void syncOrderItems_handles_null_customizations_in_item() {
        OrderJpaEntity jpa = buildJpaOrder();
        OrderItem item = OrderItem.builder()
                .menuItemId("m1").name("Pizza").quantity(1).price(100.0)
                .customizations(null).build();
        Order order = buildOrder(List.of(item));
        when(orderJpaRepository.findById("jpa-order-1")).thenReturn(Optional.of(jpa));
        when(orderJpaRepository.save(any())).thenReturn(jpa);

        syncService.syncOrderItems(jpa, order);

        verify(orderJpaRepository).save(argThat(saved ->
                saved.getItems().get(0).getCustomizations() == null
        ));
    }

    @Test
    void syncOrderItems_converts_timestamps_to_offset_datetime() {
        OrderJpaEntity jpa = buildJpaOrder();
        Order order = buildOrder(Collections.emptyList());
        when(orderJpaRepository.findById("jpa-order-1")).thenReturn(Optional.of(jpa));
        when(orderJpaRepository.save(any())).thenReturn(jpa);

        syncService.syncOrderItems(jpa, order);

        assertThat(jpa.getReceivedAt()).isNotNull();
        assertThat(jpa.getPreparingStartedAt()).isNotNull();
    }

    @Test
    void syncOrderItems_handles_null_timestamps_gracefully() {
        OrderJpaEntity jpa = buildJpaOrder();
        Order order = buildOrder(Collections.emptyList());
        order.setReceivedAt(null);
        order.setPreparingStartedAt(null);
        when(orderJpaRepository.findById("jpa-order-1")).thenReturn(Optional.of(jpa));
        when(orderJpaRepository.save(any())).thenReturn(jpa);

        syncService.syncOrderItems(jpa, order);

        assertThat(jpa.getReceivedAt()).isNull();
    }
}
