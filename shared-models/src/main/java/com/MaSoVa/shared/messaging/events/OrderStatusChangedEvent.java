package com.MaSoVa.shared.messaging.events;

public class OrderStatusChangedEvent extends DomainEvent {
    private String orderId;
    private String customerId;
    private String previousStatus;
    private String newStatus;
    private String storeId;

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

    public String getOrderId() { return orderId; }
    public String getCustomerId() { return customerId; }
    public String getPreviousStatus() { return previousStatus; }
    public String getNewStatus() { return newStatus; }
    public String getStoreId() { return storeId; }
}
