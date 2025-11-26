package com.MaSoVa.analytics.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class SalesForecastResponse {

    private String forecastPeriod; // "DAILY", "WEEKLY", "MONTHLY"
    private List<ForecastDataPoint> forecasts;
    private BigDecimal totalForecastedSales;
    private BigDecimal confidenceLevel; // 0-100
    private String modelAccuracy; // "HIGH", "MEDIUM", "LOW"
    private LocalDate forecastGeneratedAt;

    public SalesForecastResponse() {
    }

    public SalesForecastResponse(String forecastPeriod, List<ForecastDataPoint> forecasts,
                                BigDecimal totalForecastedSales, BigDecimal confidenceLevel,
                                String modelAccuracy, LocalDate forecastGeneratedAt) {
        this.forecastPeriod = forecastPeriod;
        this.forecasts = forecasts;
        this.totalForecastedSales = totalForecastedSales;
        this.confidenceLevel = confidenceLevel;
        this.modelAccuracy = modelAccuracy;
        this.forecastGeneratedAt = forecastGeneratedAt;
    }

    public String getForecastPeriod() {
        return forecastPeriod;
    }

    public void setForecastPeriod(String forecastPeriod) {
        this.forecastPeriod = forecastPeriod;
    }

    public List<ForecastDataPoint> getForecasts() {
        return forecasts;
    }

    public void setForecasts(List<ForecastDataPoint> forecasts) {
        this.forecasts = forecasts;
    }

    public BigDecimal getTotalForecastedSales() {
        return totalForecastedSales;
    }

    public void setTotalForecastedSales(BigDecimal totalForecastedSales) {
        this.totalForecastedSales = totalForecastedSales;
    }

    public BigDecimal getConfidenceLevel() {
        return confidenceLevel;
    }

    public void setConfidenceLevel(BigDecimal confidenceLevel) {
        this.confidenceLevel = confidenceLevel;
    }

    public String getModelAccuracy() {
        return modelAccuracy;
    }

    public void setModelAccuracy(String modelAccuracy) {
        this.modelAccuracy = modelAccuracy;
    }

    public LocalDate getForecastGeneratedAt() {
        return forecastGeneratedAt;
    }

    public void setForecastGeneratedAt(LocalDate forecastGeneratedAt) {
        this.forecastGeneratedAt = forecastGeneratedAt;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String forecastPeriod;
        private List<ForecastDataPoint> forecasts;
        private BigDecimal totalForecastedSales;
        private BigDecimal confidenceLevel;
        private String modelAccuracy;
        private LocalDate forecastGeneratedAt;

        public Builder forecastPeriod(String forecastPeriod) {
            this.forecastPeriod = forecastPeriod;
            return this;
        }

        public Builder forecasts(List<ForecastDataPoint> forecasts) {
            this.forecasts = forecasts;
            return this;
        }

        public Builder totalForecastedSales(BigDecimal totalForecastedSales) {
            this.totalForecastedSales = totalForecastedSales;
            return this;
        }

        public Builder confidenceLevel(BigDecimal confidenceLevel) {
            this.confidenceLevel = confidenceLevel;
            return this;
        }

        public Builder modelAccuracy(String modelAccuracy) {
            this.modelAccuracy = modelAccuracy;
            return this;
        }

        public Builder forecastGeneratedAt(LocalDate forecastGeneratedAt) {
            this.forecastGeneratedAt = forecastGeneratedAt;
            return this;
        }

        public SalesForecastResponse build() {
            return new SalesForecastResponse(forecastPeriod, forecasts, totalForecastedSales,
                    confidenceLevel, modelAccuracy, forecastGeneratedAt);
        }
    }

    public static class ForecastDataPoint {
        private LocalDate date;
        private String label;
        private BigDecimal forecastedSales;
        private BigDecimal forecastedOrders;
        private BigDecimal lowerBound; // Confidence interval
        private BigDecimal upperBound; // Confidence interval
        private BigDecimal historicalAverage;

        public ForecastDataPoint() {
        }

        public ForecastDataPoint(LocalDate date, String label, BigDecimal forecastedSales,
                                BigDecimal forecastedOrders, BigDecimal lowerBound,
                                BigDecimal upperBound, BigDecimal historicalAverage) {
            this.date = date;
            this.label = label;
            this.forecastedSales = forecastedSales;
            this.forecastedOrders = forecastedOrders;
            this.lowerBound = lowerBound;
            this.upperBound = upperBound;
            this.historicalAverage = historicalAverage;
        }

        public LocalDate getDate() {
            return date;
        }

        public void setDate(LocalDate date) {
            this.date = date;
        }

        public String getLabel() {
            return label;
        }

        public void setLabel(String label) {
            this.label = label;
        }

        public BigDecimal getForecastedSales() {
            return forecastedSales;
        }

        public void setForecastedSales(BigDecimal forecastedSales) {
            this.forecastedSales = forecastedSales;
        }

        public BigDecimal getForecastedOrders() {
            return forecastedOrders;
        }

        public void setForecastedOrders(BigDecimal forecastedOrders) {
            this.forecastedOrders = forecastedOrders;
        }

        public BigDecimal getLowerBound() {
            return lowerBound;
        }

        public void setLowerBound(BigDecimal lowerBound) {
            this.lowerBound = lowerBound;
        }

        public BigDecimal getUpperBound() {
            return upperBound;
        }

        public void setUpperBound(BigDecimal upperBound) {
            this.upperBound = upperBound;
        }

        public BigDecimal getHistoricalAverage() {
            return historicalAverage;
        }

        public void setHistoricalAverage(BigDecimal historicalAverage) {
            this.historicalAverage = historicalAverage;
        }

        public static Builder builder() {
            return new Builder();
        }

        public static class Builder {
            private LocalDate date;
            private String label;
            private BigDecimal forecastedSales;
            private BigDecimal forecastedOrders;
            private BigDecimal lowerBound;
            private BigDecimal upperBound;
            private BigDecimal historicalAverage;

            public Builder date(LocalDate date) {
                this.date = date;
                return this;
            }

            public Builder label(String label) {
                this.label = label;
                return this;
            }

            public Builder forecastedSales(BigDecimal forecastedSales) {
                this.forecastedSales = forecastedSales;
                return this;
            }

            public Builder forecastedOrders(BigDecimal forecastedOrders) {
                this.forecastedOrders = forecastedOrders;
                return this;
            }

            public Builder lowerBound(BigDecimal lowerBound) {
                this.lowerBound = lowerBound;
                return this;
            }

            public Builder upperBound(BigDecimal upperBound) {
                this.upperBound = upperBound;
                return this;
            }

            public Builder historicalAverage(BigDecimal historicalAverage) {
                this.historicalAverage = historicalAverage;
                return this;
            }

            public ForecastDataPoint build() {
                return new ForecastDataPoint(date, label, forecastedSales, forecastedOrders,
                        lowerBound, upperBound, historicalAverage);
            }
        }
    }
}
