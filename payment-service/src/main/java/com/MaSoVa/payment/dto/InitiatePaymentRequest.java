package com.MaSoVa.payment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public class InitiatePaymentRequest {

    @NotBlank(message = "Order ID is required")
    private String orderId;

    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be positive")
    private BigDecimal amount;

    @NotBlank(message = "Customer ID is required")
    private String customerId;

    private String customerEmail;

    private String customerPhone;

    @NotBlank(message = "Store ID is required")
    private String storeId;

    private String notes;

    private String orderType; // DELIVERY, TAKEAWAY, DINE_IN

    private String paymentMethod; // CASH, CARD, UPI, etc.

    // No-arg constructor
    public InitiatePaymentRequest() {
    }

    // All-args constructor
    public InitiatePaymentRequest(String orderId, BigDecimal amount, String customerId,
                                  String customerEmail, String customerPhone, String storeId, String notes,
                                  String orderType, String paymentMethod) {
        this.orderId = orderId;
        this.amount = amount;
        this.customerId = customerId;
        this.customerEmail = customerEmail;
        this.customerPhone = customerPhone;
        this.storeId = storeId;
        this.notes = notes;
        this.orderType = orderType;
        this.paymentMethod = paymentMethod;
    }

    // Getters
    public String getOrderId() {
        return orderId;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public String getCustomerId() {
        return customerId;
    }

    public String getCustomerEmail() {
        return customerEmail;
    }

    public String getCustomerPhone() {
        return customerPhone;
    }

    public String getStoreId() {
        return storeId;
    }

    public String getNotes() {
        return notes;
    }

    public String getOrderType() {
        return orderType;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    // Setters
    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public void setCustomerId(String customerId) {
        this.customerId = customerId;
    }

    public void setCustomerEmail(String customerEmail) {
        this.customerEmail = customerEmail;
    }

    public void setCustomerPhone(String customerPhone) {
        this.customerPhone = customerPhone;
    }

    public void setStoreId(String storeId) {
        this.storeId = storeId;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public void setOrderType(String orderType) {
        this.orderType = orderType;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    // Builder
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String orderId;
        private BigDecimal amount;
        private String customerId;
        private String customerEmail;
        private String customerPhone;
        private String storeId;
        private String notes;
        private String orderType;
        private String paymentMethod;

        public Builder orderId(String orderId) {
            this.orderId = orderId;
            return this;
        }

        public Builder amount(BigDecimal amount) {
            this.amount = amount;
            return this;
        }

        public Builder customerId(String customerId) {
            this.customerId = customerId;
            return this;
        }

        public Builder customerEmail(String customerEmail) {
            this.customerEmail = customerEmail;
            return this;
        }

        public Builder customerPhone(String customerPhone) {
            this.customerPhone = customerPhone;
            return this;
        }

        public Builder storeId(String storeId) {
            this.storeId = storeId;
            return this;
        }

        public Builder notes(String notes) {
            this.notes = notes;
            return this;
        }

        public Builder orderType(String orderType) {
            this.orderType = orderType;
            return this;
        }

        public Builder paymentMethod(String paymentMethod) {
            this.paymentMethod = paymentMethod;
            return this;
        }

        public InitiatePaymentRequest build() {
            return new InitiatePaymentRequest(orderId, amount, customerId, customerEmail,
                                             customerPhone, storeId, notes, orderType, paymentMethod);
        }
    }
}
