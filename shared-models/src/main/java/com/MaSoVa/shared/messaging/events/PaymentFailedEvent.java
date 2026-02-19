package com.MaSoVa.shared.messaging.events;

import java.math.BigDecimal;

public class PaymentFailedEvent extends DomainEvent {
    private String paymentId;
    private String orderId;
    private String customerId;
    private BigDecimal amount;
    private String failureReason;

    public PaymentFailedEvent() { super("PAYMENT_FAILED"); }

    public PaymentFailedEvent(String paymentId, String orderId, String customerId,
                               BigDecimal amount, String failureReason) {
        super("PAYMENT_FAILED");
        this.paymentId = paymentId;
        this.orderId = orderId;
        this.customerId = customerId;
        this.amount = amount;
        this.failureReason = failureReason;
    }

    public String getPaymentId() { return paymentId; }
    public String getOrderId() { return orderId; }
    public String getCustomerId() { return customerId; }
    public BigDecimal getAmount() { return amount; }
    public String getFailureReason() { return failureReason; }
}
