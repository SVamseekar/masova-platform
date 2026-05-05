package com.MaSoVa.logistics.inventory.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class CancellationRequest {
    private String reason;
    private String storeId;

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public String getStoreId() { return storeId; }
    public void setStoreId(String storeId) { this.storeId = storeId; }
}
