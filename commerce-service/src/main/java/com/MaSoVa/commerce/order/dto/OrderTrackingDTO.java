package com.MaSoVa.commerce.order.dto;

import com.MaSoVa.commerce.order.entity.Order;
import com.MaSoVa.commerce.order.entity.OrderItem;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Redacted public order-tracking view — no customer PII or payment details (Task 13).
 */
public class OrderTrackingDTO {

    private String orderId;
    private String orderNumber;
    private String status;
    private LocalDateTime estimatedDeliveryTime;
    private List<TrackedItem> items = Collections.emptyList();

    public static OrderTrackingDTO fromOrder(Order order) {
        OrderTrackingDTO dto = new OrderTrackingDTO();
        dto.setOrderId(order.getId());
        dto.setOrderNumber(order.getOrderNumber());
        dto.setStatus(order.getStatus() != null ? order.getStatus().name() : null);
        dto.setEstimatedDeliveryTime(order.getEstimatedDeliveryTime());
        if (order.getItems() != null) {
            dto.setItems(order.getItems().stream()
                    .map(TrackedItem::fromOrderItem)
                    .collect(Collectors.toList()));
        }
        return dto;
    }

    public String getOrderId() {
        return orderId;
    }

    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }

    public String getOrderNumber() {
        return orderNumber;
    }

    public void setOrderNumber(String orderNumber) {
        this.orderNumber = orderNumber;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getEstimatedDeliveryTime() {
        return estimatedDeliveryTime;
    }

    public void setEstimatedDeliveryTime(LocalDateTime estimatedDeliveryTime) {
        this.estimatedDeliveryTime = estimatedDeliveryTime;
    }

    public List<TrackedItem> getItems() {
        return items;
    }

    public void setItems(List<TrackedItem> items) {
        this.items = items;
    }

    public static class TrackedItem {
        private String name;
        private Integer quantity;

        static TrackedItem fromOrderItem(OrderItem item) {
            TrackedItem tracked = new TrackedItem();
            tracked.setName(item.getName());
            tracked.setQuantity(item.getQuantity());
            return tracked;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public Integer getQuantity() {
            return quantity;
        }

        public void setQuantity(Integer quantity) {
            this.quantity = quantity;
        }
    }
}