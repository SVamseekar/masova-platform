package com.MaSoVa.inventory.dto.request;

/**
 * Request DTO for approving purchase orders or waste records
 */
public class ApprovalRequest {
    private String approverId;
    private String storeId;

    public String getApproverId() { return approverId; }
    public void setApproverId(String approverId) { this.approverId = approverId; }
    public String getStoreId() { return storeId; }
    public void setStoreId(String storeId) { this.storeId = storeId; }
}
