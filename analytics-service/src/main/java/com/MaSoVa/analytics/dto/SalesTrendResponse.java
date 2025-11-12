package com.MaSoVa.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SalesTrendResponse {

    private String period; // "WEEKLY" or "MONTHLY"
    private List<DailyDataPoint> dataPoints;
    private BigDecimal totalSales;
    private int totalOrders;
    private BigDecimal averageOrderValue;
    private BigDecimal percentChangeFromPreviousPeriod;
    private String trend; // "UP", "DOWN", "STABLE"

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyDataPoint {
        private LocalDate date;
        private String label; // e.g., "Mon", "Jan 15"
        private BigDecimal sales;
        private int orderCount;
        private BigDecimal averageOrderValue;
    }
}
