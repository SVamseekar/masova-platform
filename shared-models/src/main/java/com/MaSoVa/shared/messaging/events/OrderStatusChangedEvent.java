package com.MaSoVa.shared.messaging.events;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;
import java.time.Instant;

public class OrderStatusChangedEvent extends DomainEvent {
    private String orderId;
    private String customerId;
    private String previousStatus;
    private String newStatus;
    private String storeId;
    private String vatCountryCode;
    private BigDecimal totalVatAmount;

    public OrderStatusChangedEvent() { super("ORDER_STATUS_CHANGED"); }

    public OrderStatusChangedEvent(String orderId, String customerId,
                                    String previousStatus, String newStatus, String storeId) {
        super("ORDER_STATUS_CHANGED");
        this.orderId = orderId;
        this.customerId = customerId;
        this.previousStatus = previousStatus;
        this.newStatus = newStatus;
        this.storeId = storeId;
    }

    @JsonCreator
    public OrderStatusChangedEvent(
            @JsonProperty("eventId") String eventId,
            @JsonProperty("eventType") String eventType,
            @JsonProperty("occurredAt") Instant occurredAt,
            @JsonProperty("orderId") String orderId,
            @JsonProperty("customerId") String customerId,
            @JsonProperty("previousStatus") String previousStatus,
            @JsonProperty("newStatus") String newStatus,
            @JsonProperty("storeId") String storeId,
            @JsonProperty("vatCountryCode") String vatCountryCode,
            @JsonProperty("totalVatAmount") BigDecimal totalVatAmount) {
        super(eventId, eventType, occurredAt);
        this.orderId = orderId;
        this.customerId = customerId;
        this.previousStatus = previousStatus;
        this.newStatus = newStatus;
        this.storeId = storeId;
        this.vatCountryCode = vatCountryCode;
        this.totalVatAmount = totalVatAmount;
    }

    public String getOrderId() { return orderId; }
    public String getCustomerId() { return customerId; }
    public String getPreviousStatus() { return previousStatus; }
    public String getNewStatus() { return newStatus; }
    public String getStoreId() { return storeId; }
    public String getVatCountryCode() { return vatCountryCode; }
    public void setVatCountryCode(String vatCountryCode) { this.vatCountryCode = vatCountryCode; }
    public BigDecimal getTotalVatAmount() { return totalVatAmount; }
    public void setTotalVatAmount(BigDecimal totalVatAmount) { this.totalVatAmount = totalVatAmount; }
}
