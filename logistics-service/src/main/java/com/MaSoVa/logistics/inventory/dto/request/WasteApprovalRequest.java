package com.MaSoVa.logistics.inventory.dto.request;

/**
 * Request DTO for approving waste records (without storeId)
 */
public class WasteApprovalRequest {
    private String approverId;

    public String getApproverId() { return approverId; }
    public void setApproverId(String approverId) { this.approverId = approverId; }
}
