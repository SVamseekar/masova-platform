package com.MaSoVa.customer.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public class UpdateOrderStatsRequest {

    @NotBlank(message = "Order ID is required")
    private String orderId;

    @Min(value = 0, message = "Order total must be non-negative")
    private double orderTotal;

    @NotBlank(message = "Order type is required")
    private String orderType; // DINE_IN, TAKEAWAY, DELIVERY

    @NotBlank(message = "Status is required")
    private String status; // COMPLETED, CANCELLED

    public UpdateOrderStatsRequest() {}

    public UpdateOrderStatsRequest(String orderId, double orderTotal, String orderType, String status) {
        this.orderId = orderId;
        this.orderTotal = orderTotal;
        this.orderType = orderType;
        this.status = status;
    }

    // Getters and Setters
    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }

    public double getOrderTotal() { return orderTotal; }
    public void setOrderTotal(double orderTotal) { this.orderTotal = orderTotal; }

    public String getOrderType() { return orderType; }
    public void setOrderType(String orderType) { this.orderType = orderType; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
