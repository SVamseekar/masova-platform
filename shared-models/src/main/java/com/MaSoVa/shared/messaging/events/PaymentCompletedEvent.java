package com.MaSoVa.shared.messaging.events;

import java.math.BigDecimal;

public class PaymentCompletedEvent extends DomainEvent {
    private String paymentId;
    private String orderId;
    private String customerId;
    private BigDecimal amount;
    private String currency;
    private String paymentMethod;
    private String transactionId;

    public PaymentCompletedEvent() { super("PAYMENT_COMPLETED"); }

    public PaymentCompletedEvent(String paymentId, String orderId, String customerId,
                                  BigDecimal amount, String currency,
                                  String paymentMethod, String transactionId) {
        super("PAYMENT_COMPLETED");
        this.paymentId = paymentId;
        this.orderId = orderId;
        this.customerId = customerId;
        this.amount = amount;
        this.currency = currency;
        this.paymentMethod = paymentMethod;
        this.transactionId = transactionId;
    }

    public String getPaymentId() { return paymentId; }
    public String getOrderId() { return orderId; }
    public String getCustomerId() { return customerId; }
    public BigDecimal getAmount() { return amount; }
    public String getCurrency() { return currency; }
    public String getPaymentMethod() { return paymentMethod; }
    public String getTransactionId() { return transactionId; }
}
