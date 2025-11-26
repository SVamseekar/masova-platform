package com.MaSoVa.payment.entity;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Document(collection = "refunds")
public class Refund {

    @Id
    private String id;

    @Indexed
    private String transactionId;

    @Indexed
    private String orderId;

    @Indexed(unique = true)
    private String razorpayRefundId;

    @Indexed
    private String razorpayPaymentId;

    private BigDecimal amount; // refund amount in INR

    @Indexed
    private RefundStatus status;

    private RefundType type;

    private String reason;

    private String initiatedBy; // user ID of person who initiated refund

    private String customerId;

    // Error details (if refund failed)
    private String errorCode;
    private String errorDescription;

    // Speed of refund (normal/optimum)
    private String speed;

    // Metadata
    private String notes;

    // Timestamps
    @CreatedDate
    @Indexed
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    private LocalDateTime processedAt;

    // Constructors
    public Refund() {}

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTransactionId() { return transactionId; }
    public void setTransactionId(String transactionId) { this.transactionId = transactionId; }

    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }

    public String getRazorpayRefundId() { return razorpayRefundId; }
    public void setRazorpayRefundId(String razorpayRefundId) { this.razorpayRefundId = razorpayRefundId; }

    public String getRazorpayPaymentId() { return razorpayPaymentId; }
    public void setRazorpayPaymentId(String razorpayPaymentId) { this.razorpayPaymentId = razorpayPaymentId; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public RefundStatus getStatus() { return status; }
    public void setStatus(RefundStatus status) { this.status = status; }

    public RefundType getType() { return type; }
    public void setType(RefundType type) { this.type = type; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getInitiatedBy() { return initiatedBy; }
    public void setInitiatedBy(String initiatedBy) { this.initiatedBy = initiatedBy; }

    public String getCustomerId() { return customerId; }
    public void setCustomerId(String customerId) { this.customerId = customerId; }

    public String getErrorCode() { return errorCode; }
    public void setErrorCode(String errorCode) { this.errorCode = errorCode; }

    public String getErrorDescription() { return errorDescription; }
    public void setErrorDescription(String errorDescription) { this.errorDescription = errorDescription; }

    public String getSpeed() { return speed; }
    public void setSpeed(String speed) { this.speed = speed; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public LocalDateTime getProcessedAt() { return processedAt; }
    public void setProcessedAt(LocalDateTime processedAt) { this.processedAt = processedAt; }

    // Builder pattern
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Refund refund = new Refund();

        public Builder transactionId(String transactionId) {
            refund.transactionId = transactionId;
            return this;
        }

        public Builder orderId(String orderId) {
            refund.orderId = orderId;
            return this;
        }

        public Builder razorpayPaymentId(String razorpayPaymentId) {
            refund.razorpayPaymentId = razorpayPaymentId;
            return this;
        }

        public Builder amount(BigDecimal amount) {
            refund.amount = amount;
            return this;
        }

        public Builder status(RefundStatus status) {
            refund.status = status;
            return this;
        }

        public Builder type(RefundType type) {
            refund.type = type;
            return this;
        }

        public Builder reason(String reason) {
            refund.reason = reason;
            return this;
        }

        public Builder initiatedBy(String initiatedBy) {
            refund.initiatedBy = initiatedBy;
            return this;
        }

        public Builder customerId(String customerId) {
            refund.customerId = customerId;
            return this;
        }

        public Builder speed(String speed) {
            refund.speed = speed;
            return this;
        }

        public Builder notes(String notes) {
            refund.notes = notes;
            return this;
        }

        public Builder razorpayRefundId(String razorpayRefundId) {
            refund.razorpayRefundId = razorpayRefundId;
            return this;
        }

        public Refund build() {
            return refund;
        }
    }

    public enum RefundStatus {
        INITIATED,   // Refund initiated
        PROCESSING,  // Refund being processed
        PROCESSED,   // Refund processed successfully
        FAILED       // Refund failed
    }

    public enum RefundType {
        FULL,        // Full refund
        PARTIAL      // Partial refund
    }
}
