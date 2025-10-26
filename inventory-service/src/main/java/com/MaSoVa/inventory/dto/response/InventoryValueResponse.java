package com.MaSoVa.inventory.dto.response;

import java.math.BigDecimal;

/**
 * Response DTO for inventory value
 */
public class InventoryValueResponse {
    private BigDecimal totalValue;

    public InventoryValueResponse() {}

    public InventoryValueResponse(BigDecimal totalValue) {
        this.totalValue = totalValue;
    }

    public BigDecimal getTotalValue() { return totalValue; }
    public void setTotalValue(BigDecimal totalValue) { this.totalValue = totalValue; }
}
