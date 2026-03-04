package com.MaSoVa.commerce.order.service;

import com.MaSoVa.commerce.order.entity.Order;
import com.MaSoVa.commerce.order.entity.OrderItem;
import com.MaSoVa.commerce.order.entity.OrderItemJpaEntity;
import com.MaSoVa.commerce.order.entity.OrderJpaEntity;
import com.MaSoVa.commerce.order.repository.OrderItemJpaRepository;
import com.MaSoVa.commerce.order.repository.OrderJpaRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Handles the atomic delete-and-reinsert of PostgreSQL order_items during dual-write sync.
 *
 * Extracted into its own @Service so that the @Transactional(REQUIRES_NEW) annotation
 * is intercepted by the Spring proxy — self-invocation within OrderService would bypass
 * the proxy and silently ignore the propagation setting.
 *
 * REQUIRES_NEW ensures that if the save fails after deleteByOrderId, both operations
 * roll back atomically, independently of the outer MongoDB transaction context.
 */
@Service
public class OrderItemSyncService {

    private static final Logger log = LoggerFactory.getLogger(OrderItemSyncService.class);

    private static final ZoneId IST = ZoneId.of("Asia/Kolkata");

    private final OrderJpaRepository orderJpaRepository;
    private final OrderItemJpaRepository orderItemJpaRepository;
    private final ObjectMapper objectMapper;

    public OrderItemSyncService(OrderJpaRepository orderJpaRepository,
                                OrderItemJpaRepository orderItemJpaRepository,
                                ObjectMapper objectMapper) {
        this.orderJpaRepository = orderJpaRepository;
        this.orderItemJpaRepository = orderItemJpaRepository;
        this.objectMapper = objectMapper;
    }

    /**
     * Atomically sync order fields + replace line items for a PG order row.
     * Runs in its own transaction (REQUIRES_NEW) so a failure during save
     * rolls back the deleteByOrderId as well — preventing orphaned empty item sets.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void syncOrderItems(OrderJpaEntity pgOrder, Order order) {
        updateFields(pgOrder, order);
        orderItemJpaRepository.deleteByOrderId(pgOrder.getId());
        List<OrderItemJpaEntity> newItems = buildItemEntities(order.getItems(), pgOrder);
        pgOrder.setItems(newItems);
        orderJpaRepository.save(pgOrder);
    }

    private void updateFields(OrderJpaEntity pgOrder, Order order) {
        pgOrder.setStatus(order.getStatus() != null ? order.getStatus().name() : pgOrder.getStatus());
        pgOrder.setPaymentStatus(order.getPaymentStatus() != null ? order.getPaymentStatus().name() : pgOrder.getPaymentStatus());
        pgOrder.setPaymentMethod(order.getPaymentMethod() != null ? order.getPaymentMethod().name() : pgOrder.getPaymentMethod());
        pgOrder.setPaymentTransactionId(order.getPaymentTransactionId());
        pgOrder.setPriority(order.getPriority() != null ? order.getPriority().name() : pgOrder.getPriority());
        pgOrder.setAssignedDriverId(order.getAssignedDriverId());
        pgOrder.setSubtotal(order.getSubtotal());
        pgOrder.setDeliveryFee(order.getDeliveryFee());
        pgOrder.setTax(order.getTax());
        pgOrder.setTotal(order.getTotal());
        pgOrder.setTableNumber(order.getTableNumber());
        pgOrder.setGuestCount(order.getGuestCount());
        pgOrder.setPreparationTime(order.getPreparationTime());
        pgOrder.setDeliveryOtp(order.getDeliveryOtp());
        pgOrder.setDeliveryProofType(order.getDeliveryProofType());
        pgOrder.setCancellationReason(order.getCancellationReason());
        pgOrder.setReceivedAt(toOdt(order.getReceivedAt()));
        pgOrder.setPreparingStartedAt(toOdt(order.getPreparingStartedAt()));
        pgOrder.setReadyAt(toOdt(order.getReadyAt()));
        pgOrder.setDispatchedAt(toOdt(order.getDispatchedAt()));
        pgOrder.setDeliveredAt(toOdt(order.getDeliveredAt()));
        pgOrder.setCancelledAt(toOdt(order.getCancelledAt()));
    }

    List<OrderItemJpaEntity> buildItemEntities(List<OrderItem> items, OrderJpaEntity parentOrder) {
        return items.stream()
            .filter(item -> {
                if (item.getMenuItemId() == null) {
                    log.warn("PG dual-write: skipping item '{}' on order {} — menuItemId is null (non-null column constraint)",
                             item.getName(), parentOrder.getOrderNumber());
                    return false;
                }
                return true;
            })
            .map(item -> {
                String customizationsJson = null;
                if (item.getCustomizations() != null) {
                    try {
                        customizationsJson = objectMapper.writeValueAsString(item.getCustomizations());
                    } catch (Exception ex) {
                        log.warn("PG dual-write: failed to serialize customizations for item {}: {}", item.getName(), ex.getMessage());
                    }
                }
                return OrderItemJpaEntity.builder()
                    .menuItemId(item.getMenuItemId())
                    .name(item.getName())
                    .quantity(item.getQuantity())
                    .price(item.getPrice() != null ? BigDecimal.valueOf(item.getPrice()) : BigDecimal.ZERO)
                    .variant(item.getVariant())
                    .customizations(customizationsJson)
                    .order(parentOrder)
                    .build();
            }).collect(Collectors.toList());
    }

    private OffsetDateTime toOdt(java.time.LocalDateTime ldt) {
        return ldt != null ? ldt.atZone(IST).toOffsetDateTime() : null;
    }
}
