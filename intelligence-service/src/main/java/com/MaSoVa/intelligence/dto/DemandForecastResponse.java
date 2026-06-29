package com.MaSoVa.intelligence.dto;

import java.io.Serializable;
import java.util.ArrayList;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class DemandForecastResponse implements Serializable {
    private static final long serialVersionUID = 1L;

    private String forecastPeriod; // "WEEKLY", "MONTHLY"
    private ArrayList<ItemDemandForecast> itemForecasts = new ArrayList<>();
    private ArrayList<CategoryDemandForecast> categoryForecasts = new ArrayList<>();
    private LocalDate forecastGeneratedAt;

    // Constructors
    public DemandForecastResponse() {}

    // Getters and Setters
    public String getForecastPeriod() { return forecastPeriod; }
    public void setForecastPeriod(String forecastPeriod) { this.forecastPeriod = forecastPeriod; }

    public List<ItemDemandForecast> getItemForecasts() { return itemForecasts; }
    public void setItemForecasts(List<ItemDemandForecast> itemForecasts) { this.itemForecasts = itemForecasts != null ? new ArrayList<>((itemForecasts)) : new ArrayList<>(); }

    public List<CategoryDemandForecast> getCategoryForecasts() { return categoryForecasts; }
    public void setCategoryForecasts(List<CategoryDemandForecast> categoryForecasts) { this.categoryForecasts = categoryForecasts != null ? new ArrayList<>((categoryForecasts)) : new ArrayList<>(); }

    public LocalDate getForecastGeneratedAt() { return forecastGeneratedAt; }
    public void setForecastGeneratedAt(LocalDate forecastGeneratedAt) { this.forecastGeneratedAt = forecastGeneratedAt; }

    // Builder pattern
    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private final DemandForecastResponse response = new DemandForecastResponse();

        public Builder forecastPeriod(String forecastPeriod) { response.forecastPeriod = forecastPeriod; return this; }
        public Builder itemForecasts(List<ItemDemandForecast> itemForecasts) { response.itemForecasts = itemForecasts != null ? new ArrayList<>((itemForecasts)) : new ArrayList<>(); return this; }
        public Builder categoryForecasts(List<CategoryDemandForecast> categoryForecasts) { response.categoryForecasts = categoryForecasts != null ? new ArrayList<>((categoryForecasts)) : new ArrayList<>(); return this; }
        public Builder forecastGeneratedAt(LocalDate forecastGeneratedAt) { response.forecastGeneratedAt = forecastGeneratedAt; return this; }

        public DemandForecastResponse build() { return response; }
    }

    public static class ItemDemandForecast implements Serializable {
        private static final long serialVersionUID = 1L;
        private String itemId;
        private String itemName;
        private String category;
        private int forecastedQuantity;
        private BigDecimal forecastedRevenue;
        private int historicalAverageQuantity;
        private BigDecimal growthTrend; // Percentage
        private String recommendation; // "Stock Up", "Normal", "Reduce Stock"
        private ArrayList<DailyForecast> dailyBreakdown = new ArrayList<>();

        // Constructors
        public ItemDemandForecast() {}

        // Getters and Setters
        public String getItemId() { return itemId; }
        public void setItemId(String itemId) { this.itemId = itemId; }

        public String getItemName() { return itemName; }
        public void setItemName(String itemName) { this.itemName = itemName; }

        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }

        public int getForecastedQuantity() { return forecastedQuantity; }
        public void setForecastedQuantity(int forecastedQuantity) { this.forecastedQuantity = forecastedQuantity; }

        public BigDecimal getForecastedRevenue() { return forecastedRevenue; }
        public void setForecastedRevenue(BigDecimal forecastedRevenue) { this.forecastedRevenue = forecastedRevenue; }

        public int getHistoricalAverageQuantity() { return historicalAverageQuantity; }
        public void setHistoricalAverageQuantity(int historicalAverageQuantity) { this.historicalAverageQuantity = historicalAverageQuantity; }

        public BigDecimal getGrowthTrend() { return growthTrend; }
        public void setGrowthTrend(BigDecimal growthTrend) { this.growthTrend = growthTrend; }

        public String getRecommendation() { return recommendation; }
        public void setRecommendation(String recommendation) { this.recommendation = recommendation; }

        public List<DailyForecast> getDailyBreakdown() { return dailyBreakdown; }
        public void setDailyBreakdown(List<DailyForecast> dailyBreakdown) { this.dailyBreakdown = dailyBreakdown != null ? new ArrayList<>((dailyBreakdown)) : new ArrayList<>(); }

        // Builder pattern
        public static Builder builder() { return new Builder(); }

        public static class Builder {
            private final ItemDemandForecast forecast = new ItemDemandForecast();

            public Builder itemId(String itemId) { forecast.itemId = itemId; return this; }
            public Builder itemName(String itemName) { forecast.itemName = itemName; return this; }
            public Builder category(String category) { forecast.category = category; return this; }
            public Builder forecastedQuantity(int forecastedQuantity) { forecast.forecastedQuantity = forecastedQuantity; return this; }
            public Builder forecastedRevenue(BigDecimal forecastedRevenue) { forecast.forecastedRevenue = forecastedRevenue; return this; }
            public Builder historicalAverageQuantity(int historicalAverageQuantity) { forecast.historicalAverageQuantity = historicalAverageQuantity; return this; }
            public Builder growthTrend(BigDecimal growthTrend) { forecast.growthTrend = growthTrend; return this; }
            public Builder recommendation(String recommendation) { forecast.recommendation = recommendation; return this; }
            public Builder dailyBreakdown(List<DailyForecast> dailyBreakdown) { forecast.dailyBreakdown = dailyBreakdown != null ? new ArrayList<>(dailyBreakdown) : new ArrayList<>(); return this; }

            public ItemDemandForecast build() { return forecast; }
        }
    }

    public static class CategoryDemandForecast implements Serializable {
        private static final long serialVersionUID = 1L;
        private String category;
        private int forecastedQuantity;
        private BigDecimal forecastedRevenue;
        private BigDecimal percentChange;
        private String trend; // "UP", "DOWN", "STABLE"

        // Constructors
        public CategoryDemandForecast() {}

        // Getters and Setters
        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }

        public int getForecastedQuantity() { return forecastedQuantity; }
        public void setForecastedQuantity(int forecastedQuantity) { this.forecastedQuantity = forecastedQuantity; }

        public BigDecimal getForecastedRevenue() { return forecastedRevenue; }
        public void setForecastedRevenue(BigDecimal forecastedRevenue) { this.forecastedRevenue = forecastedRevenue; }

        public BigDecimal getPercentChange() { return percentChange; }
        public void setPercentChange(BigDecimal percentChange) { this.percentChange = percentChange; }

        public String getTrend() { return trend; }
        public void setTrend(String trend) { this.trend = trend; }

        // Builder pattern
        public static Builder builder() { return new Builder(); }

        public static class Builder {
            private final CategoryDemandForecast forecast = new CategoryDemandForecast();

            public Builder category(String category) { forecast.category = category; return this; }
            public Builder forecastedQuantity(int forecastedQuantity) { forecast.forecastedQuantity = forecastedQuantity; return this; }
            public Builder forecastedRevenue(BigDecimal forecastedRevenue) { forecast.forecastedRevenue = forecastedRevenue; return this; }
            public Builder percentChange(BigDecimal percentChange) { forecast.percentChange = percentChange; return this; }
            public Builder trend(String trend) { forecast.trend = trend; return this; }

            public CategoryDemandForecast build() { return forecast; }
        }
    }

    public static class DailyForecast implements Serializable {
        private static final long serialVersionUID = 1L;
        private LocalDate date;
        private int quantity;
        private BigDecimal confidence; // 0-100

        // Constructors
        public DailyForecast() {}

        // Getters and Setters
        public LocalDate getDate() { return date; }
        public void setDate(LocalDate date) { this.date = date; }

        public int getQuantity() { return quantity; }
        public void setQuantity(int quantity) { this.quantity = quantity; }

        public BigDecimal getConfidence() { return confidence; }
        public void setConfidence(BigDecimal confidence) { this.confidence = confidence; }

        // Builder pattern
        public static Builder builder() { return new Builder(); }

        public static class Builder {
            private final DailyForecast forecast = new DailyForecast();

            public Builder date(LocalDate date) { forecast.date = date; return this; }
            public Builder quantity(int quantity) { forecast.quantity = quantity; return this; }
            public Builder confidence(BigDecimal confidence) { forecast.confidence = confidence; return this; }

            public DailyForecast build() { return forecast; }
        }
    }
}
