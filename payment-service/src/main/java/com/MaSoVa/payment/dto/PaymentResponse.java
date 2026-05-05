


package com.MaSoVa.payment.dto;

import com.MaSoVa.payment.entity.Transaction;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class PaymentResponse {

    private String transactionId;
    private String orderId;
    private String razorpayOrderId;
    private String razorpayPaymentId;
    private BigDecimal amount;
    private Transaction.PaymentStatus status;
    private Transaction.PaymentMethod paymentMethod;
    private String customerId;
    private String customerEmail;
    private String customerPhone;
    private String storeId;
    private String currency;
    private LocalDateTime createdAt;
    private LocalDateTime paidAt;

    // For initiate payment response
    private String razorpayKeyId; // Public key for frontend

    // Global-4 Stripe fields
    private String paymentGateway;        // "RAZORPAY" or "STRIPE"
    private String stripeClientSecret;    // Stripe PaymentIntent client_secret (null for Razorpay)
    private String stripePublishableKey;  // Stripe publishable key (null for Razorpay)
    private Long   stripeFeeMinorUnits;   // Stripe platform fee (null for Razorpay)
    private String paymentMethodType;     // Normalised payment method string (e.g. "card", "ideal", "upi")

    public PaymentResponse() {
    }

    public String getTransactionId() {
        return transactionId;
    }

    public void setTransactionId(String transactionId) {
        this.transactionId = transactionId;
    }

    public String getOrderId() {
        return orderId;
    }

    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }

    public String getRazorpayOrderId() {
        return razorpayOrderId;
    }

    public void setRazorpayOrderId(String razorpayOrderId) {
        this.razorpayOrderId = razorpayOrderId;
    }

    public String getRazorpayPaymentId() {
        return razorpayPaymentId;
    }

    public void setRazorpayPaymentId(String razorpayPaymentId) {
        this.razorpayPaymentId = razorpayPaymentId;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public Transaction.PaymentStatus getStatus() {
        return status;
    }

    public void setStatus(Transaction.PaymentStatus status) {
        this.status = status;
    }

    public Transaction.PaymentMethod getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(Transaction.PaymentMethod paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getCustomerId() {
        return customerId;
    }

    public void setCustomerId(String customerId) {
        this.customerId = customerId;
    }

    public String getCustomerEmail() {
        return customerEmail;
    }

    public void setCustomerEmail(String customerEmail) {
        this.customerEmail = customerEmail;
    }

    public String getCustomerPhone() {
        return customerPhone;
    }

    public void setCustomerPhone(String customerPhone) {
        this.customerPhone = customerPhone;
    }

    public String getStoreId() {
        return storeId;
    }

    public void setStoreId(String storeId) {
        this.storeId = storeId;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getPaidAt() {
        return paidAt;
    }

    public void setPaidAt(LocalDateTime paidAt) {
        this.paidAt = paidAt;
    }

    public String getRazorpayKeyId() {
        return razorpayKeyId;
    }

    public void setRazorpayKeyId(String razorpayKeyId) {
        this.razorpayKeyId = razorpayKeyId;
    }

    public String getPaymentGateway() { return paymentGateway; }
    public String getStripeClientSecret() { return stripeClientSecret; }
    public String getStripePublishableKey() { return stripePublishableKey; }
    public Long getStripeFeeMinorUnits() { return stripeFeeMinorUnits; }
    public String getPaymentMethodType() { return paymentMethodType; }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String transactionId;
        private String orderId;
        private String razorpayOrderId;
        private String razorpayPaymentId;
        private BigDecimal amount;
        private Transaction.PaymentStatus status;
        private Transaction.PaymentMethod paymentMethod;
        private String customerId;
        private String customerEmail;
        private String customerPhone;
        private String storeId;
        private String currency;
        private LocalDateTime createdAt;
        private LocalDateTime paidAt;
        private String razorpayKeyId;
        private String paymentGateway;
        private String stripeClientSecret;
        private String stripePublishableKey;
        private Long   stripeFeeMinorUnits;
        private String paymentMethodType;

        public Builder transactionId(String transactionId) {
            this.transactionId = transactionId;
            return this;
        }

        public Builder orderId(String orderId) {
            this.orderId = orderId;
            return this;
        }

        public Builder razorpayOrderId(String razorpayOrderId) {
            this.razorpayOrderId = razorpayOrderId;
            return this;
        }

        public Builder razorpayPaymentId(String razorpayPaymentId) {
            this.razorpayPaymentId = razorpayPaymentId;
            return this;
        }

        public Builder amount(BigDecimal amount) {
            this.amount = amount;
            return this;
        }

        public Builder status(Transaction.PaymentStatus status) {
            this.status = status;
            return this;
        }

        public Builder paymentMethod(Transaction.PaymentMethod paymentMethod) {
            this.paymentMethod = paymentMethod;
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

        public Builder currency(String currency) {
            this.currency = currency;
            return this;
        }

        public Builder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public Builder paidAt(LocalDateTime paidAt) {
            this.paidAt = paidAt;
            return this;
        }

        public Builder razorpayKeyId(String razorpayKeyId) {
            this.razorpayKeyId = razorpayKeyId;
            return this;
        }

        public Builder paymentGateway(String paymentGateway) {
            this.paymentGateway = paymentGateway; return this;
        }
        public Builder stripeClientSecret(String stripeClientSecret) {
            this.stripeClientSecret = stripeClientSecret; return this;
        }
        public Builder stripePublishableKey(String stripePublishableKey) {
            this.stripePublishableKey = stripePublishableKey; return this;
        }
        public Builder stripeFeeMinorUnits(Long stripeFeeMinorUnits) {
            this.stripeFeeMinorUnits = stripeFeeMinorUnits; return this;
        }
        public Builder paymentMethodType(String paymentMethodType) {
            this.paymentMethodType = paymentMethodType; return this;
        }

        public PaymentResponse build() {
            PaymentResponse response = new PaymentResponse();
            response.transactionId = this.transactionId;
            response.orderId = this.orderId;
            response.razorpayOrderId = this.razorpayOrderId;
            response.razorpayPaymentId = this.razorpayPaymentId;
            response.amount = this.amount;
            response.status = this.status;
            response.paymentMethod = this.paymentMethod;
            response.customerId = this.customerId;
            response.customerEmail = this.customerEmail;
            response.customerPhone = this.customerPhone;
            response.storeId = this.storeId;
            response.currency = this.currency;
            response.createdAt = this.createdAt;
            response.paidAt = this.paidAt;
            response.razorpayKeyId = this.razorpayKeyId;
            response.paymentGateway = this.paymentGateway;
            response.stripeClientSecret = this.stripeClientSecret;
            response.stripePublishableKey = this.stripePublishableKey;
            response.stripeFeeMinorUnits = this.stripeFeeMinorUnits;
            response.paymentMethodType = this.paymentMethodType;
            return response;
        }
    }
}
