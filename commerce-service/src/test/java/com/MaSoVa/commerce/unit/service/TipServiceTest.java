package com.MaSoVa.commerce.unit.service;

import com.MaSoVa.commerce.order.entity.Order;
import com.MaSoVa.commerce.order.entity.Order.OrderStatus;
import com.MaSoVa.commerce.order.entity.Order.OrderType;
import com.MaSoVa.commerce.order.repository.OrderRepository;
import com.MaSoVa.commerce.tip.dto.TipRequest;
import com.MaSoVa.commerce.tip.dto.TipResponse;
import com.MaSoVa.commerce.tip.entity.OrderTipEntity;
import com.MaSoVa.commerce.tip.repository.OrderTipRepository;
import com.MaSoVa.commerce.tip.service.TipService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TipServiceTest {

    @Mock private OrderTipRepository tipRepository;
    @Mock private OrderRepository orderRepository;
    @InjectMocks private TipService tipService;

    private Order buildOrder(String id) {
        Order order = new Order();
        order.setId(id);
        order.setOrderNumber("ORD-001");
        order.setStoreId("store-1");
        order.setStatus(OrderStatus.DELIVERED);
        order.setOrderType(OrderType.DELIVERY);
        order.setTotal(BigDecimal.valueOf(300));
        return order;
    }

    @Test
    void addTipToOrder_creates_pool_tip_when_no_staff_specified() {
        Order order = buildOrder("o1");
        when(orderRepository.findById("o1")).thenReturn(Optional.of(order));
        when(tipRepository.findByOrderId("o1")).thenReturn(Optional.empty());
        when(tipRepository.save(any())).thenAnswer(inv -> {
            OrderTipEntity entity = inv.getArgument(0);
            entity.setId(UUID.randomUUID());
            return entity;
        });

        TipRequest req = new TipRequest();
        req.setAmountInr(BigDecimal.valueOf(50));
        req.setRecipientStaffId(null);

        TipResponse result = tipService.addTipToOrder("o1", req);

        assertThat(result).isNotNull();
        verify(tipRepository).save(argThat(tip -> "POOL".equals(tip.getTipType())));
    }

    @Test
    void addTipToOrder_creates_direct_tip_when_staff_specified() {
        Order order = buildOrder("o1");
        when(orderRepository.findById("o1")).thenReturn(Optional.of(order));
        when(tipRepository.findByOrderId("o1")).thenReturn(Optional.empty());
        when(tipRepository.save(any())).thenAnswer(inv -> {
            OrderTipEntity entity = inv.getArgument(0);
            entity.setId(UUID.randomUUID());
            return entity;
        });

        TipRequest req = new TipRequest();
        req.setAmountInr(BigDecimal.valueOf(100));
        req.setRecipientStaffId("staff-1");

        tipService.addTipToOrder("o1", req);

        verify(tipRepository).save(argThat(tip ->
                "DIRECT".equals(tip.getTipType()) && "staff-1".equals(tip.getRecipientStaffId())));
    }

    @Test
    void addTipToOrder_updates_existing_tip_idempotently() {
        Order order = buildOrder("o1");
        when(orderRepository.findById("o1")).thenReturn(Optional.of(order));

        OrderTipEntity existing = new OrderTipEntity();
        existing.setId(UUID.randomUUID());
        existing.setOrderId("o1");
        existing.setAmountInr(BigDecimal.valueOf(30));
        existing.setDistributed(false);
        when(tipRepository.findByOrderId("o1")).thenReturn(Optional.of(existing));
        when(tipRepository.save(any())).thenAnswer(inv -> {
            OrderTipEntity entity = inv.getArgument(0);
            if (entity.getId() == null) entity.setId(UUID.randomUUID());
            return entity;
        });

        TipRequest req = new TipRequest();
        req.setAmountInr(BigDecimal.valueOf(75));

        tipService.addTipToOrder("o1", req);

        verify(tipRepository).save(argThat(tip -> BigDecimal.valueOf(75).equals(tip.getAmountInr())));
    }

    @Test
    void addTipToOrder_throws_when_already_distributed() {
        Order order = buildOrder("o1");
        when(orderRepository.findById("o1")).thenReturn(Optional.of(order));

        OrderTipEntity distributed = new OrderTipEntity();
        distributed.setOrderId("o1");
        distributed.setDistributed(true);
        when(tipRepository.findByOrderId("o1")).thenReturn(Optional.of(distributed));

        TipRequest req = new TipRequest();
        req.setAmountInr(BigDecimal.valueOf(50));

        assertThatThrownBy(() -> tipService.addTipToOrder("o1", req))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("already been distributed");
    }

    @Test
    void addTipToOrder_throws_when_order_not_found() {
        when(orderRepository.findById("missing")).thenReturn(Optional.empty());

        TipRequest req = new TipRequest();
        req.setAmountInr(BigDecimal.valueOf(50));

        assertThatThrownBy(() -> tipService.addTipToOrder("missing", req))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Order not found");
    }

    @Test
    void getUndistributedTipsForStaff_returns_mapped_responses() {
        OrderTipEntity tip = new OrderTipEntity();
        tip.setId(UUID.randomUUID());
        tip.setOrderId("o1");
        tip.setOrderNumber("ORD-001");
        tip.setStoreId("store-1");
        tip.setAmountInr(BigDecimal.valueOf(50));
        tip.setTipType("DIRECT");
        tip.setRecipientStaffId("staff-1");
        tip.setDistributed(false);

        when(tipRepository.findUndistributedDirectTipsForStaff("staff-1")).thenReturn(List.of(tip));

        List<TipResponse> result = tipService.getUndistributedTipsForStaff("staff-1");

        assertThat(result).hasSize(1);
    }

    @Test
    void getUndistributedTipsForStaff_returns_empty_list_when_none() {
        when(tipRepository.findUndistributedDirectTipsForStaff("staff-2")).thenReturn(Collections.emptyList());

        List<TipResponse> result = tipService.getUndistributedTipsForStaff("staff-2");

        assertThat(result).isEmpty();
    }
}
