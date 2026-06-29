package com.MaSoVa.commerce.order.service;

import com.MaSoVa.commerce.order.entity.Order;
import com.MaSoVa.shared.messaging.events.OrderCreatedEvent;
import com.MaSoVa.shared.messaging.events.OrderStatusChangedEvent;

/**
 * Shared AMQP event construction with VAT and currency fields populated from orders.
 */
public final class OrderEventBuilder {

    private OrderEventBuilder() {
    }

    public static OrderStatusChangedEvent buildStatusChangedEvent(
            Order order,
            String previousStatus,
            String newStatus) {
        OrderStatusChangedEvent event = new OrderStatusChangedEvent(
                order.getId(),
                order.getCustomerId(),
                previousStatus,
                newStatus,
                order.getStoreId());
        enrichVatAndCurrency(order, event);
        return event;
    }

    public static OrderCreatedEvent buildOrderCreatedEvent(Order order) {
        OrderCreatedEvent event = new OrderCreatedEvent(
                order.getId(),
                order.getCustomerId(),
                order.getStoreId(),
                order.getOrderType() != null ? order.getOrderType().name() : "UNKNOWN",
                order.getTotal(),
                order.getCurrency() != null ? order.getCurrency() : "INR");
        if (order.getVatCountryCode() != null) {
            event.setVatCountryCode(order.getVatCountryCode());
            event.setTotalVatAmount(order.getTotalVatAmount());
        }
        return event;
    }

    private static void enrichVatAndCurrency(Order order, OrderStatusChangedEvent event) {
        if (order.getVatCountryCode() != null) {
            event.setVatCountryCode(order.getVatCountryCode());
            event.setTotalVatAmount(order.getTotalVatAmount());
        }
        if (order.getCurrency() != null) {
            event.setCurrency(order.getCurrency());
        }
    }
}