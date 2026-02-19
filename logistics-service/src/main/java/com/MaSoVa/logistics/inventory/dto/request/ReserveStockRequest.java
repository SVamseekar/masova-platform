package com.MaSoVa.logistics.inventory.dto.request;

/**
 * Request DTO for reserving/releasing/consuming stock
 */
public class ReserveStockRequest {
    private Double quantity;
    private String storeId;

    // Getters and Setters
    public Double getQuantity() { return quantity; }
    public void setQuantity(Double quantity) { this.quantity = quantity; }
    public String getStoreId() { return storeId; }
    public void setStoreId(String storeId) { this.storeId = storeId; }
}
