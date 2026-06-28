package com.MaSoVa.core.review.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request body for agent/customer complaint submission (security remediation Task 4).
 * Complaints are recorded as reviews in PENDING status awaiting manager approval.
 */
public class CreateComplaintRequest {

    @NotBlank(message = "Order ID is required")
    private String orderId;

    @NotBlank(message = "Description is required")
    @Size(min = 10, max = 2000, message = "Description must be between 10 and 2000 characters")
    private String description;

    /** Optional — ignored when X-User-ID / X-User-Id header is present. */
    private String customerId;

    /** Informational only (e.g. "COMPLAINT"); not used for routing. */
    private String type;

    public CreateComplaintRequest() {
    }

    public String getOrderId() {
        return orderId;
    }

    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCustomerId() {
        return customerId;
    }

    public void setCustomerId(String customerId) {
        this.customerId = customerId;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }
}