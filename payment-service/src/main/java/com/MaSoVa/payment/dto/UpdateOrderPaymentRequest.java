package com.MaSoVa.payment.dto;

/**
 * Request DTO for updating order payment status
 * Matches the contract expected by order-service
 */
public class UpdateOrderPaymentRequest {
    
    private String status; // Payment status: PENDING, PAID, FAILED, REFUNDED
    private String transactionId; // Payment transaction ID
    
    public UpdateOrderPaymentRequest() {
    }
    
    public UpdateOrderPaymentRequest(String status, String transactionId) {
        this.status = status;
        this.transactionId = transactionId;
    }
    
    public String getStatus() {
        return status;
    }
    
    public void setStatus(String status) {
        this.status = status;
    }
    
    public String getTransactionId() {
        return transactionId;
    }
    
    public void setTransactionId(String transactionId) {
        this.transactionId = transactionId;
    }
}
