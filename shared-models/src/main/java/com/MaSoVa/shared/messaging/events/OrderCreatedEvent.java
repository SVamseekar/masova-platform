package com.MaSoVa.shared.messaging.events;

import java.math.BigDecimal;

public class OrderCreatedEvent extends DomainEvent {
    private String orderId;
    private String customerId;
    private String storeId;
    private String orderType;
    private BigDecimal totalAmount;
    private String currency;

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

    public String getOrderId() { return orderId; }
    public String getCustomerId() { return customerId; }
    public String getStoreId() { return storeId; }
    public String getOrderType() { return orderType; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public String getCurrency() { return currency; }
}
