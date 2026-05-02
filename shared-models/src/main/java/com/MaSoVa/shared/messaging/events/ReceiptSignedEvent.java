package com.MaSoVa.shared.messaging.events;

import com.MaSoVa.shared.model.FiscalSignature;

/**
 * Published on masova.orders.events / order.receipt.signed after every fiscal signing attempt.
 * Intelligence-service subscribes for compliance rate tracking.
 * Notification-service subscribes to alert manager on isSigningFailed=true.
 */
public class ReceiptSignedEvent extends DomainEvent {

    private String orderId;
    private String storeId;
    private String countryCode;
    private FiscalSignature fiscalSignature;

    public ReceiptSignedEvent() {
        super("RECEIPT_SIGNED");
    }

    public ReceiptSignedEvent(String orderId, String storeId,
                               String countryCode, FiscalSignature fiscalSignature) {
        super("RECEIPT_SIGNED");
        this.orderId = orderId;
        this.storeId = storeId;
        this.countryCode = countryCode;
        this.fiscalSignature = fiscalSignature;
    }

    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }

    public String getStoreId() { return storeId; }
    public void setStoreId(String storeId) { this.storeId = storeId; }

    public String getCountryCode() { return countryCode; }
    public void setCountryCode(String countryCode) { this.countryCode = countryCode; }

    public FiscalSignature getFiscalSignature() { return fiscalSignature; }
    public void setFiscalSignature(FiscalSignature fiscalSignature) { this.fiscalSignature = fiscalSignature; }

    /** Convenience: true when signing failed and manager alert is required. */
    public boolean isSigningFailed() {
        return fiscalSignature != null && fiscalSignature.isSigningFailed();
    }
}
