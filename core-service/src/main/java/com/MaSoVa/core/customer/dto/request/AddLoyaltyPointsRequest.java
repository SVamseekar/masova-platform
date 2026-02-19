package com.MaSoVa.core.customer.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public class AddLoyaltyPointsRequest {

    @Min(value = 1, message = "Points must be at least 1")
    private int points;

    @NotBlank(message = "Type is required")
    private String type; // EARNED, REDEEMED, BONUS, EXPIRED

    @NotBlank(message = "Description is required")
    private String description;

    private String orderId;

    public AddLoyaltyPointsRequest() {}

    public AddLoyaltyPointsRequest(int points, String type, String description) {
        this.points = points;
        this.type = type;
        this.description = description;
    }

    // Getters and Setters
    public int getPoints() { return points; }
    public void setPoints(int points) { this.points = points; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }
}
