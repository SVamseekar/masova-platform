package com.MaSoVa.shared.messaging.events;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.Instant;

/**
 * The payment status an order should now show (PAID, FAILED or REFUNDED).
 * Published by payment-service from its transaction outbox; consumed by commerce-service.
 * Delivery is at least once, so consumers must apply it idempotently.
 */
public class OrderPaymentStatusEvent extends DomainEvent {

    private static final long serialVersionUID = 1L;

    private final String orderId;
    private final String transactionId;
    private final String paymentStatus;

    public OrderPaymentStatusEvent(String eventId, String orderId, String transactionId, String paymentStatus) {
        super(eventId, "ORDER_PAYMENT_STATUS", Instant.now());
        this.orderId = orderId;
        this.transactionId = transactionId;
        this.paymentStatus = paymentStatus;
    }

    @JsonCreator
    public OrderPaymentStatusEvent(
            @JsonProperty("eventId") String eventId,
            @JsonProperty("eventType") String eventType,
            @JsonProperty("occurredAt") Instant occurredAt,
            @JsonProperty("orderId") String orderId,
            @JsonProperty("transactionId") String transactionId,
            @JsonProperty("paymentStatus") String paymentStatus) {
        super(eventId, eventType, occurredAt);
        this.orderId = orderId;
        this.transactionId = transactionId;
        this.paymentStatus = paymentStatus;
    }

    public String getOrderId() { return orderId; }
    public String getTransactionId() { return transactionId; }
    public String getPaymentStatus() { return paymentStatus; }
}
