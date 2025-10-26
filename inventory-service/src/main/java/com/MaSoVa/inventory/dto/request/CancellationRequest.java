package com.MaSoVa.inventory.dto.request;

/**
 * Request DTO for cancelling purchase orders
 */
public class CancellationRequest {
    private String reason;
    private String storeId;

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public String getStoreId() { return storeId; }
    public void setStoreId(String storeId) { this.storeId = storeId; }
}
