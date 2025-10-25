package com.MaSoVa.payment.dto;

import com.MaSoVa.payment.entity.Transaction;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
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
}
