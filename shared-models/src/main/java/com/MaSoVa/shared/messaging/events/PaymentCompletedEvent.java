package com.MaSoVa.shared.messaging.events;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;
import java.time.Instant;

public class PaymentCompletedEvent extends DomainEvent {
    private String paymentId;
    private String orderId;
    private String customerId;
    private BigDecimal amount;
    private String currency;
    private String paymentMethod;
    private String transactionId;
    private String paymentGateway;    // "RAZORPAY" or "STRIPE"
    private String paymentMethodType; // e.g. "card", "upi", "ideal", "bancontact"

    public PaymentCompletedEvent() { super("PAYMENT_COMPLETED"); }

    public PaymentCompletedEvent(String paymentId, String orderId, String customerId,
                                  BigDecimal amount, String currency,
                                  String paymentMethod, String transactionId,
                                  String paymentGateway, String paymentMethodType) {
        super("PAYMENT_COMPLETED");
        this.paymentId = paymentId;
        this.orderId = orderId;
        this.customerId = customerId;
        this.amount = amount;
        this.currency = currency;
        this.paymentMethod = paymentMethod;
        this.transactionId = transactionId;
        this.paymentGateway = paymentGateway;
        this.paymentMethodType = paymentMethodType;
    }

    @JsonCreator
    public PaymentCompletedEvent(
            @JsonProperty("eventId") String eventId,
            @JsonProperty("eventType") String eventType,
            @JsonProperty("occurredAt") Instant occurredAt,
            @JsonProperty("paymentId") String paymentId,
            @JsonProperty("orderId") String orderId,
            @JsonProperty("customerId") String customerId,
            @JsonProperty("amount") BigDecimal amount,
            @JsonProperty("currency") String currency,
            @JsonProperty("paymentMethod") String paymentMethod,
            @JsonProperty("transactionId") String transactionId,
            @JsonProperty("paymentGateway") String paymentGateway,
            @JsonProperty("paymentMethodType") String paymentMethodType) {
        super(eventId, eventType, occurredAt);
        this.paymentId = paymentId;
        this.orderId = orderId;
        this.customerId = customerId;
        this.amount = amount;
        this.currency = currency;
        this.paymentMethod = paymentMethod;
        this.transactionId = transactionId;
        this.paymentGateway = paymentGateway;
        this.paymentMethodType = paymentMethodType;
    }

    public String getPaymentId() { return paymentId; }
    public String getOrderId() { return orderId; }
    public String getCustomerId() { return customerId; }
    public BigDecimal getAmount() { return amount; }
    public String getCurrency() { return currency; }
    public String getPaymentMethod() { return paymentMethod; }
    public String getTransactionId() { return transactionId; }
    public String getPaymentGateway() { return paymentGateway; }
    public String getPaymentMethodType() { return paymentMethodType; }
}
