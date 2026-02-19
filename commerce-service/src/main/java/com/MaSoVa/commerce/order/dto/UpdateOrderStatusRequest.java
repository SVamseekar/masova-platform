package com.MaSoVa.commerce.order.dto;

import com.MaSoVa.commerce.order.entity.Order.OrderStatus;
import jakarta.validation.constraints.NotNull;

public class UpdateOrderStatusRequest {

    @NotNull(message = "Status is required")
    private OrderStatus status;

    private String notes;

    public UpdateOrderStatusRequest() {}

    // Getters and Setters
    public OrderStatus getStatus() { return status; }
    public void setStatus(OrderStatus status) { this.status = status; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
