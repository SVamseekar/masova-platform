package com.MaSoVa.payment.dto;

import com.MaSoVa.payment.entity.Refund;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public class RefundRequest {

    @NotBlank(message = "Transaction ID is required")
    private String transactionId;

    @NotNull(message = "Refund amount is required")
    @Positive(message = "Refund amount must be positive")
    private BigDecimal amount;

    @NotNull(message = "Refund type is required")
    private Refund.RefundType type;

    @NotBlank(message = "Reason is required")
    private String reason;

    @NotBlank(message = "Initiated by user ID is required")
    private String initiatedBy;

    private String notes;

    private String speed; // "normal" or "optimum"

    // No-arg constructor
    public RefundRequest() {
    }

    // All-args constructor
    public RefundRequest(String transactionId, BigDecimal amount, Refund.RefundType type,
                         String reason, String initiatedBy, String notes, String speed) {
        this.transactionId = transactionId;
        this.amount = amount;
        this.type = type;
        this.reason = reason;
        this.initiatedBy = initiatedBy;
        this.notes = notes;
        this.speed = speed;
    }

    // Getters
    public String getTransactionId() {
        return transactionId;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public Refund.RefundType getType() {
        return type;
    }

    public String getReason() {
        return reason;
    }

    public String getInitiatedBy() {
        return initiatedBy;
    }

    public String getNotes() {
        return notes;
    }

    public String getSpeed() {
        return speed;
    }

    // Setters
    public void setTransactionId(String transactionId) {
        this.transactionId = transactionId;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public void setType(Refund.RefundType type) {
        this.type = type;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public void setInitiatedBy(String initiatedBy) {
        this.initiatedBy = initiatedBy;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public void setSpeed(String speed) {
        this.speed = speed;
    }

    // Builder
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String transactionId;
        private BigDecimal amount;
        private Refund.RefundType type;
        private String reason;
        private String initiatedBy;
        private String notes;
        private String speed;

        public Builder transactionId(String transactionId) {
            this.transactionId = transactionId;
            return this;
        }

        public Builder amount(BigDecimal amount) {
            this.amount = amount;
            return this;
        }

        public Builder type(Refund.RefundType type) {
            this.type = type;
            return this;
        }

        public Builder reason(String reason) {
            this.reason = reason;
            return this;
        }

        public Builder initiatedBy(String initiatedBy) {
            this.initiatedBy = initiatedBy;
            return this;
        }

        public Builder notes(String notes) {
            this.notes = notes;
            return this;
        }

        public Builder speed(String speed) {
            this.speed = speed;
            return this;
        }

        public RefundRequest build() {
            return new RefundRequest(transactionId, amount, type, reason, initiatedBy, notes, speed);
        }
    }
}
