package com.MaSoVa.inventory.dto.response;

import java.math.BigDecimal;

/**
 * Response DTO for waste cost summary
 */
public class WasteSummaryResponse {
    private BigDecimal totalWasteCost;

    public WasteSummaryResponse() {}

    public WasteSummaryResponse(BigDecimal totalWasteCost) {
        this.totalWasteCost = totalWasteCost;
    }

    public BigDecimal getTotalWasteCost() { return totalWasteCost; }
    public void setTotalWasteCost(BigDecimal totalWasteCost) { this.totalWasteCost = totalWasteCost; }
}
