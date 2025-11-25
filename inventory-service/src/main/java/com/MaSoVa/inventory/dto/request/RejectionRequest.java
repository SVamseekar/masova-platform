package com.MaSoVa.inventory.dto.request;

/**
 * Request DTO for rejecting purchase orders
 */
public class RejectionRequest {
    private String rejectionReason;
    private String storeId;

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }
    public String getStoreId() { return storeId; }
    public void setStoreId(String storeId) { this.storeId = storeId; }
}
