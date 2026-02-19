package com.MaSoVa.logistics.inventory.dto.request;

/**
 * Request DTO for operations requiring only storeId
 */
public class StoreIdRequest {
    private String storeId;

    public String getStoreId() { return storeId; }
    public void setStoreId(String storeId) { this.storeId = storeId; }
}
