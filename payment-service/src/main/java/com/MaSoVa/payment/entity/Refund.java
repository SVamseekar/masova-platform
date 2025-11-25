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
