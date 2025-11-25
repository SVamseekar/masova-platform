package com.MaSoVa.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StaffPerformanceResponse {
    private String staffId;
    private String staffName;
    private Integer ordersProcessedToday;
    private BigDecimal salesGeneratedToday;
    private BigDecimal averageOrderValue;
    private Integer rank;
    private String performanceLevel; // "EXCELLENT", "GOOD", "AVERAGE", "NEEDS_IMPROVEMENT"
}
