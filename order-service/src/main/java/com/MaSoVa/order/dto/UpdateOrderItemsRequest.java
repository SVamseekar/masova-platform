package com.MaSoVa.order.dto;

import com.MaSoVa.order.entity.OrderItem;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public class UpdateOrderItemsRequest {

    @NotEmpty(message = "Order must have at least one item")
    private List<OrderItem> items;

    private String modificationReason;

    public UpdateOrderItemsRequest() {}

    // Getters and Setters
    public List<OrderItem> getItems() { return items; }
    public void setItems(List<OrderItem> items) { this.items = items; }

    public String getModificationReason() { return modificationReason; }
    public void setModificationReason(String modificationReason) { this.modificationReason = modificationReason; }
}
