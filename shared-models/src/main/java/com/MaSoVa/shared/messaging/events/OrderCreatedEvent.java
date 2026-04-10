package com.MaSoVa.shared.messaging.events;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;
import java.time.Instant;

public class OrderCreatedEvent extends DomainEvent {
    private String orderId;
    private String customerId;
    private String storeId;
    private String orderType;
    private BigDecimal totalAmount;
    private String currency;
    private String vatCountryCode;
    private BigDecimal totalVatAmount;

    public OrderCreatedEvent() { super("ORDER_CREATED"); }

    public OrderCreatedEvent(String orderId, String customerId, String storeId,
                              String orderType, BigDecimal totalAmount, String currency) {
        super("ORDER_CREATED");
        this.orderId = orderId;
        this.customerId = customerId;
        this.storeId = storeId;
        this.orderType = orderType;
        this.totalAmount = totalAmount;
        this.currency = currency;
    }

    @JsonCreator
    public OrderCreatedEvent(
            @JsonProperty("eventId") String eventId,
            @JsonProperty("eventType") String eventType,
            @JsonProperty("occurredAt") Instant occurredAt,
            @JsonProperty("orderId") String orderId,
            @JsonProperty("customerId") String customerId,
            @JsonProperty("storeId") String storeId,
            @JsonProperty("orderType") String orderType,
            @JsonProperty("totalAmount") BigDecimal totalAmount,
            @JsonProperty("currency") String currency,
            @JsonProperty("vatCountryCode") String vatCountryCode,
            @JsonProperty("totalVatAmount") BigDecimal totalVatAmount) {
        super(eventId, eventType, occurredAt);
        this.orderId = orderId;
        this.customerId = customerId;
        this.storeId = storeId;
        this.orderType = orderType;
        this.totalAmount = totalAmount;
        this.currency = currency;
        this.vatCountryCode = vatCountryCode;
        this.totalVatAmount = totalVatAmount;
    }

    public String getOrderId() { return orderId; }
    public String getCustomerId() { return customerId; }
    public String getStoreId() { return storeId; }
    public String getOrderType() { return orderType; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public String getCurrency() { return currency; }
    public String getVatCountryCode() { return vatCountryCode; }
    public void setVatCountryCode(String vatCountryCode) { this.vatCountryCode = vatCountryCode; }
    public BigDecimal getTotalVatAmount() { return totalVatAmount; }
    public void setTotalVatAmount(BigDecimal totalVatAmount) { this.totalVatAmount = totalVatAmount; }
}
