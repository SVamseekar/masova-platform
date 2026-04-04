package com.MaSoVa.commerce.tip.dto;

import com.MaSoVa.commerce.tip.entity.OrderTipEntity;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public class TipResponse {

    private String tipId;
    private String orderId;
    private String orderNumber;
    private BigDecimal amountInr;
    private String tipType;
    private String recipientStaffId;
    private boolean distributed;
    private OffsetDateTime createdAt;

    public TipResponse(OrderTipEntity e) {
        this.tipId = e.getId().toString();
        this.orderId = e.getOrderId();
        this.orderNumber = e.getOrderNumber();
        this.amountInr = e.getAmountInr();
        this.tipType = e.getTipType();
        this.recipientStaffId = e.getRecipientStaffId();
        this.distributed = Boolean.TRUE.equals(e.getDistributed());
        this.createdAt = e.getCreatedAt();
    }

    public String getTipId() { return tipId; }
    public String getOrderId() { return orderId; }
    public String getOrderNumber() { return orderNumber; }
    public BigDecimal getAmountInr() { return amountInr; }
    public String getTipType() { return tipType; }
    public String getRecipientStaffId() { return recipientStaffId; }
    public boolean isDistributed() { return distributed; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
}
