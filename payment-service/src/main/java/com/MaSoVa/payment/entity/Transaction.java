package com.MaSoVa.payment.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "transactions")
public class Transaction {

    @Id
    private String id;

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
        OTHER
    }
}
