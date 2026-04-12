package com.MaSoVa.shared.messaging.events;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;
import java.time.Instant;

public class AggregatorOrderReceivedEvent extends DomainEvent {
    private String orderId;
    private String storeId;
    private String orderSource;    // e.g. "WOLT"
    private BigDecimal grossAmount;
    private BigDecimal commissionAmount;
    private BigDecimal netPayout;
    private String currency;

    public AggregatorOrderReceivedEvent() { super("AGGREGATOR_ORDER_RECEIVED"); }

    public AggregatorOrderReceivedEvent(String orderId, String storeId, String orderSource,
                                        BigDecimal grossAmount, BigDecimal commissionAmount,
                                        BigDecimal netPayout, String currency) {
        super("AGGREGATOR_ORDER_RECEIVED");
        this.orderId = orderId;
        this.storeId = storeId;
        this.orderSource = orderSource;
        this.grossAmount = grossAmount;
        this.commissionAmount = commissionAmount;
        this.netPayout = netPayout;
        this.currency = currency;
    }

    @JsonCreator
    public AggregatorOrderReceivedEvent(
            @JsonProperty("eventId") String eventId,
            @JsonProperty("eventType") String eventType,
            @JsonProperty("occurredAt") Instant occurredAt,
            @JsonProperty("orderId") String orderId,
            @JsonProperty("storeId") String storeId,
            @JsonProperty("orderSource") String orderSource,
            @JsonProperty("grossAmount") BigDecimal grossAmount,
            @JsonProperty("commissionAmount") BigDecimal commissionAmount,
            @JsonProperty("netPayout") BigDecimal netPayout,
            @JsonProperty("currency") String currency) {
        super(eventId, eventType, occurredAt);
        this.orderId = orderId;
        this.storeId = storeId;
        this.orderSource = orderSource;
        this.grossAmount = grossAmount;
        this.commissionAmount = commissionAmount;
        this.netPayout = netPayout;
        this.currency = currency;
    }

    public String getOrderId() { return orderId; }
    public String getStoreId() { return storeId; }
    public String getOrderSource() { return orderSource; }
    public BigDecimal getGrossAmount() { return grossAmount; }
    public BigDecimal getCommissionAmount() { return commissionAmount; }
    public BigDecimal getNetPayout() { return netPayout; }
    public String getCurrency() { return currency; }
}
