package com.MaSoVa.commerce.order.dto;

import com.MaSoVa.commerce.order.entity.Order.PaymentStatus;

/**
 * Request DTO for updating order payment status
 * Used by payment-service to notify order-service of payment completion
 */
public class UpdatePaymentStatusRequest {
    
    private PaymentStatus status;
    private String transactionId;
    
    public UpdatePaymentStatusRequest() {
    }
    
    public UpdatePaymentStatusRequest(PaymentStatus status, String transactionId) {
        this.status = status;
        this.transactionId = transactionId;
    }
    
    public PaymentStatus getStatus() {
        return status;
    }
    
    public void setStatus(PaymentStatus status) {
        this.status = status;
    }
    
    public String getTransactionId() {
        return transactionId;
    }
    
    public void setTransactionId(String transactionId) {
        this.transactionId = transactionId;
    }
}
