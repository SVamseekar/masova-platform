package com.MaSoVa.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StaffLeaderboardResponse {

    private List<StaffRanking> rankings;
    private String period; // "TODAY", "WEEK", "MONTH"
    private int totalStaff;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StaffRanking {
        private int rank;
        private String staffId;
        private String staffName;
        private int ordersProcessed;
        private BigDecimal salesGenerated;
        private BigDecimal averageOrderValue;
        private String performanceLevel; // "EXCELLENT", "GOOD", "AVERAGE", "NEEDS_IMPROVEMENT"
        private BigDecimal percentOfTotalSales;
    }
}
