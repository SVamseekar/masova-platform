package com.MaSoVa.payment.entity;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Version;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Document(collection = "transactions")
@CompoundIndexes({
    @CompoundIndex(def = "{'storeId': 1, 'status': 1}"),
    @CompoundIndex(def = "{'storeId': 1, 'createdAt': -1}"),
    @CompoundIndex(def = "{'customerId': 1, 'createdAt': -1}"),
    @CompoundIndex(def = "{'customerId': 1, 'status': 1}"),
    @CompoundIndex(def = "{'status': 1, 'createdAt': -1}")
})
public class Transaction {

    @Id
    private String id;

    @Version
    private Long version;

    @Indexed(unique = true)
    private String orderId;

    @Indexed(unique = true)
    private String razorpayOrderId;

    @Indexed
    private String razorpayPaymentId;

    private String razorpaySignature;

    private BigDecimal amount; // in INR (paisa for Razorpay)

    @Indexed
    private PaymentStatus status;

    private PaymentMethod paymentMethod;

    private String customerId;

    private String customerEmail;

    private String customerPhone;

    private String storeId;

    // Error details (if payment failed)
    private String errorCode;
    private String errorDescription;
    private String errorSource;
    private String errorStep;
    private String errorReason;

    // Metadata
    private String receipt;
    private String currency; // INR by default

    /** "RAZORPAY" or "STRIPE" — populated at payment initiation. */
    private String paymentGateway;

    /** Stripe PaymentIntent ID (null for Razorpay transactions). */
    @Indexed
    private String stripePaymentIntentId;

    /** Stripe platform fee in minor units (cents, pence). Null for Razorpay and non-Stripe. */
    private Long stripeFeeMinorUnits;

    // Timestamps
    @CreatedDate
    @Indexed
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    private LocalDateTime paidAt;

    // Reconciliation
    private boolean reconciled;
    private LocalDateTime reconciledAt;
    private String reconciledBy;

    // Constructors
    public Transaction() {}

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }

    public String getRazorpayOrderId() { return razorpayOrderId; }
    public void setRazorpayOrderId(String razorpayOrderId) { this.razorpayOrderId = razorpayOrderId; }

    public String getRazorpayPaymentId() { return razorpayPaymentId; }
    public void setRazorpayPaymentId(String razorpayPaymentId) { this.razorpayPaymentId = razorpayPaymentId; }

    public String getRazorpaySignature() { return razorpaySignature; }
    public void setRazorpaySignature(String razorpaySignature) { this.razorpaySignature = razorpaySignature; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public PaymentStatus getStatus() { return status; }
    public void setStatus(PaymentStatus status) { this.status = status; }

    public PaymentMethod getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(PaymentMethod paymentMethod) { this.paymentMethod = paymentMethod; }

    public String getCustomerId() { return customerId; }
    public void setCustomerId(String customerId) { this.customerId = customerId; }

    public String getCustomerEmail() { return customerEmail; }
    public void setCustomerEmail(String customerEmail) { this.customerEmail = customerEmail; }

    public String getCustomerPhone() { return customerPhone; }
    public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }

    public String getStoreId() { return storeId; }
    public void setStoreId(String storeId) { this.storeId = storeId; }

    public String getErrorCode() { return errorCode; }
    public void setErrorCode(String errorCode) { this.errorCode = errorCode; }

    public String getErrorDescription() { return errorDescription; }
    public void setErrorDescription(String errorDescription) { this.errorDescription = errorDescription; }

    public String getErrorSource() { return errorSource; }
    public void setErrorSource(String errorSource) { this.errorSource = errorSource; }

    public String getErrorStep() { return errorStep; }
    public void setErrorStep(String errorStep) { this.errorStep = errorStep; }

    public String getErrorReason() { return errorReason; }
    public void setErrorReason(String errorReason) { this.errorReason = errorReason; }

    public String getReceipt() { return receipt; }
    public void setReceipt(String receipt) { this.receipt = receipt; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public String getPaymentGateway() { return paymentGateway; }
    public void setPaymentGateway(String paymentGateway) { this.paymentGateway = paymentGateway; }

    public String getStripePaymentIntentId() { return stripePaymentIntentId; }
    public void setStripePaymentIntentId(String stripePaymentIntentId) { this.stripePaymentIntentId = stripePaymentIntentId; }

    public Long getStripeFeeMinorUnits() { return stripeFeeMinorUnits; }
    public void setStripeFeeMinorUnits(Long stripeFeeMinorUnits) { this.stripeFeeMinorUnits = stripeFeeMinorUnits; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public LocalDateTime getPaidAt() { return paidAt; }
    public void setPaidAt(LocalDateTime paidAt) { this.paidAt = paidAt; }

    public boolean isReconciled() { return reconciled; }
    public void setReconciled(boolean reconciled) { this.reconciled = reconciled; }

    public LocalDateTime getReconciledAt() { return reconciledAt; }
    public void setReconciledAt(LocalDateTime reconciledAt) { this.reconciledAt = reconciledAt; }

    public String getReconciledBy() { return reconciledBy; }
    public void setReconciledBy(String reconciledBy) { this.reconciledBy = reconciledBy; }

    // Builder pattern
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Transaction transaction = new Transaction();

        public Builder orderId(String orderId) {
            transaction.orderId = orderId;
            return this;
        }

        public Builder razorpayOrderId(String razorpayOrderId) {
            transaction.razorpayOrderId = razorpayOrderId;
            return this;
        }

        public Builder amount(BigDecimal amount) {
            transaction.amount = amount;
            return this;
        }

        public Builder status(PaymentStatus status) {
            transaction.status = status;
            return this;
        }

        public Builder customerId(String customerId) {
            transaction.customerId = customerId;
            return this;
        }

        public Builder customerEmail(String customerEmail) {
            transaction.customerEmail = customerEmail;
            return this;
        }

        public Builder customerPhone(String customerPhone) {
            transaction.customerPhone = customerPhone;
            return this;
        }

        public Builder storeId(String storeId) {
            transaction.storeId = storeId;
            return this;
        }

        public Builder currency(String currency) {
            transaction.currency = currency;
            return this;
        }

        public Builder receipt(String receipt) {
            transaction.receipt = receipt;
            return this;
        }

        public Builder reconciled(boolean reconciled) {
            transaction.reconciled = reconciled;
            return this;
        }

        public Transaction build() {
            return transaction;
        }
    }

    public enum PaymentStatus {
        INITIATED,      // Payment order created
        PENDING,        // Awaiting customer payment
        PROCESSING,     // Payment being processed
        SUCCESS,        // Payment successful
        FAILED,         // Payment failed
        CANCELLED,      // Payment cancelled
        REFUNDED,       // Payment refunded (full)
        PARTIAL_REFUND  // Payment partially refunded
    }

    public enum PaymentMethod {
        CARD,
        UPI,
        NETBANKING,
        WALLET,
        CASH,
        AGGREGATOR_COLLECTED,   // Global-6 aggregator orders — payment already collected by platform
        OTHER
    }
}
