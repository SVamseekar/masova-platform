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
public class DemandForecastResponse {

    private String forecastPeriod; // "WEEKLY", "MONTHLY"
    private List<ItemDemandForecast> itemForecasts;
    private List<CategoryDemandForecast> categoryForecasts;
    private LocalDate forecastGeneratedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ItemDemandForecast {
        private String itemId;
        private String itemName;
        private String category;
        private int forecastedQuantity;
        private BigDecimal forecastedRevenue;
        private int historicalAverageQuantity;
        private BigDecimal growthTrend; // Percentage
        private String recommendation; // "Stock Up", "Normal", "Reduce Stock"
        private List<DailyForecast> dailyBreakdown;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryDemandForecast {
        private String category;
        private int forecastedQuantity;
        private BigDecimal forecastedRevenue;
        private BigDecimal percentChange;
        private String trend; // "UP", "DOWN", "STABLE"
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyForecast {
        private LocalDate date;
        private int quantity;
        private BigDecimal confidence; // 0-100
    }
}
