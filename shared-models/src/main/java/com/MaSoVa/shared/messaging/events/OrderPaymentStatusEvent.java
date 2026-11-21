package com.MaSoVa.shared.messaging.events;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * The payment status an order should now show (PAID, FAILED or REFUNDED).
 * Published by payment-service from its transaction outbox; consumed by commerce-service.
 * Delivery is at least once, so consumers must apply it idempotently.
 *
 * amount and currency are what the transaction charged. commerce-service only marks an order
 * PAID when they equal the order's own total and currency; otherwise it flags the order for review.
 * Unknown properties are ignored so publishers and consumers can be deployed in either order.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class OrderPaymentStatusEvent extends DomainEvent {

    private static final long serialVersionUID = 2L;

    private final String orderId;
    private final String transactionId;
    private final String paymentStatus;
    private final BigDecimal amount;
    private final String currency;

    public OrderPaymentStatusEvent(String eventId, String orderId, String transactionId, String paymentStatus,
                                   BigDecimal amount, String currency) {
        super(eventId, "ORDER_PAYMENT_STATUS", Instant.now());
        this.orderId = orderId;
        this.transactionId = transactionId;
        this.paymentStatus = paymentStatus;
        this.amount = amount;
        this.currency = currency;
    }

    @JsonCreator
    public OrderPaymentStatusEvent(
            @JsonProperty("eventId") String eventId,
            @JsonProperty("eventType") String eventType,
            @JsonProperty("occurredAt") Instant occurredAt,
            @JsonProperty("orderId") String orderId,
            @JsonProperty("transactionId") String transactionId,
            @JsonProperty("paymentStatus") String paymentStatus,
            @JsonProperty("amount") BigDecimal amount,
            @JsonProperty("currency") String currency) {
        super(eventId, eventType, occurredAt);
        this.orderId = orderId;
        this.transactionId = transactionId;
        this.paymentStatus = paymentStatus;
        this.amount = amount;
        this.currency = currency;
    }

    public String getOrderId() { return orderId; }
    public String getTransactionId() { return transactionId; }
    public String getPaymentStatus() { return paymentStatus; }
    public BigDecimal getAmount() { return amount; }
    public String getCurrency() { return currency; }
}
