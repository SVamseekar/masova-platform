package com.MaSoVa.commerce.tip.service;

import com.MaSoVa.commerce.order.entity.Order;
import com.MaSoVa.commerce.order.repository.OrderRepository;
import com.MaSoVa.commerce.tip.dto.TipRequest;
import com.MaSoVa.commerce.tip.dto.TipResponse;
import com.MaSoVa.commerce.tip.entity.OrderTipEntity;
import com.MaSoVa.commerce.tip.repository.OrderTipRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class TipService {

    private static final Logger log = LoggerFactory.getLogger(TipService.class);

    private final OrderTipRepository tipRepository;
    private final OrderRepository orderRepository;

    public TipService(OrderTipRepository tipRepository, OrderRepository orderRepository) {
        this.tipRepository = tipRepository;
        this.orderRepository = orderRepository;
    }

    public TipResponse addTipToOrder(String orderId, TipRequest request) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));

        // Idempotent: update existing tip if one already exists for this order
        OrderTipEntity tip = tipRepository.findByOrderId(orderId).orElseGet(OrderTipEntity::new);

        if (Boolean.TRUE.equals(tip.getDistributed())) {
            throw new IllegalStateException("Tip for order " + orderId + " has already been distributed and cannot be modified.");
        }

        tip.setOrderId(orderId);
        tip.setOrderNumber(order.getOrderNumber());
        tip.setStoreId(order.getStoreId());
        tip.setAmountInr(request.getAmountInr());
        tip.setTipType(request.getRecipientStaffId() != null ? "DIRECT" : "POOL");
        tip.setRecipientStaffId(request.getRecipientStaffId());
        tip.setDistributed(false);

        OrderTipEntity saved = tipRepository.save(tip);
        log.info("Tip recorded: orderId={} amount={} type={}", orderId, request.getAmountInr(), tip.getTipType());
        return new TipResponse(saved);
    }

    public List<TipResponse> getUndistributedTipsForStaff(String staffId) {
        return tipRepository.findUndistributedDirectTipsForStaff(staffId)
            .stream().map(TipResponse::new).collect(Collectors.toList());
    }
}
