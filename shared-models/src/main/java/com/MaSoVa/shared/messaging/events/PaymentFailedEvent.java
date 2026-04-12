package com.MaSoVa.shared.messaging.events;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;
import java.time.Instant;

public class PaymentFailedEvent extends DomainEvent {
    private String paymentId;
    private String orderId;
    private String customerId;
    private BigDecimal amount;
    private String failureReason;
    private String paymentGateway;    // "RAZORPAY" or "STRIPE"

    public PaymentFailedEvent() { super("PAYMENT_FAILED"); }

    public PaymentFailedEvent(String paymentId, String orderId, String customerId,
                               BigDecimal amount, String failureReason, String paymentGateway) {
        super("PAYMENT_FAILED");
        this.paymentId = paymentId;
        this.orderId = orderId;
        this.customerId = customerId;
        this.amount = amount;
        this.failureReason = failureReason;
        this.paymentGateway = paymentGateway;
    }

    @JsonCreator
    public PaymentFailedEvent(
            @JsonProperty("eventId") String eventId,
            @JsonProperty("eventType") String eventType,
            @JsonProperty("occurredAt") Instant occurredAt,
            @JsonProperty("paymentId") String paymentId,
            @JsonProperty("orderId") String orderId,
            @JsonProperty("customerId") String customerId,
            @JsonProperty("amount") BigDecimal amount,
            @JsonProperty("failureReason") String failureReason,
            @JsonProperty("paymentGateway") String paymentGateway) {
        super(eventId, eventType, occurredAt);
        this.paymentId = paymentId;
        this.orderId = orderId;
        this.customerId = customerId;
        this.amount = amount;
        this.failureReason = failureReason;
        this.paymentGateway = paymentGateway;
    }

    public String getPaymentId() { return paymentId; }
    public String getOrderId() { return orderId; }
    public String getCustomerId() { return customerId; }
    public BigDecimal getAmount() { return amount; }
    public String getFailureReason() { return failureReason; }
    public String getPaymentGateway() { return paymentGateway; }
}
