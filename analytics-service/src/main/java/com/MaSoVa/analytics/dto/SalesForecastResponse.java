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
public class SalesForecastResponse {

    private String forecastPeriod; // "DAILY", "WEEKLY", "MONTHLY"
    private List<ForecastDataPoint> forecasts;
    private BigDecimal totalForecastedSales;
    private BigDecimal confidenceLevel; // 0-100
    private String modelAccuracy; // "HIGH", "MEDIUM", "LOW"
    private LocalDate forecastGeneratedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ForecastDataPoint {
        private LocalDate date;
        private String label;
        private BigDecimal forecastedSales;
        private BigDecimal forecastedOrders;
        private BigDecimal lowerBound; // Confidence interval
        private BigDecimal upperBound; // Confidence interval
        private BigDecimal historicalAverage;
    }
}
