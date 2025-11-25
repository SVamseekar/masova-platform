package com.MaSoVa.inventory.dto.request;

import java.math.BigDecimal;

/**
 * Request DTO for stock adjustment
 */
public class StockAdjustmentRequest {
    private Double quantityChange;
    private String storeId;
    private BigDecimal unitCost;
    private String updatedBy;
    private String reason;

    // Getters and Setters
    public Double getQuantityChange() { return quantityChange; }
    public void setQuantityChange(Double quantityChange) { this.quantityChange = quantityChange; }
    public String getStoreId() { return storeId; }
    public void setStoreId(String storeId) { this.storeId = storeId; }
    public BigDecimal getUnitCost() { return unitCost; }
    public void setUnitCost(BigDecimal unitCost) { this.unitCost = unitCost; }
    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
