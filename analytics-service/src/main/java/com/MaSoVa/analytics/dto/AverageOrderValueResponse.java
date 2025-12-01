package com.MaSoVa.analytics.dto;

import java.io.Serializable;
import java.math.BigDecimal;

public class AverageOrderValueResponse implements Serializable {
    private static final long serialVersionUID = 1L;
    private BigDecimal averageOrderValue;
    private BigDecimal yesterdayAverageOrderValue;
    private BigDecimal percentChange;
    private String trend; // "UP", "DOWN", "STABLE"
    private Integer totalOrders;
    private BigDecimal totalSales;

    public AverageOrderValueResponse() {
    }

    public AverageOrderValueResponse(BigDecimal averageOrderValue, BigDecimal yesterdayAverageOrderValue,
                                     BigDecimal percentChange, String trend, Integer totalOrders, BigDecimal totalSales) {
        this.averageOrderValue = averageOrderValue;
        this.yesterdayAverageOrderValue = yesterdayAverageOrderValue;
        this.percentChange = percentChange;
        this.trend = trend;
        this.totalOrders = totalOrders;
        this.totalSales = totalSales;
    }

    public BigDecimal getAverageOrderValue() {
        return averageOrderValue;
    }

    public void setAverageOrderValue(BigDecimal averageOrderValue) {
        this.averageOrderValue = averageOrderValue;
    }

    public BigDecimal getYesterdayAverageOrderValue() {
        return yesterdayAverageOrderValue;
    }

    public void setYesterdayAverageOrderValue(BigDecimal yesterdayAverageOrderValue) {
        this.yesterdayAverageOrderValue = yesterdayAverageOrderValue;
    }

    public BigDecimal getPercentChange() {
        return percentChange;
    }

    public void setPercentChange(BigDecimal percentChange) {
        this.percentChange = percentChange;
    }

    public String getTrend() {
        return trend;
    }

    public void setTrend(String trend) {
        this.trend = trend;
    }

    public Integer getTotalOrders() {
        return totalOrders;
    }

    public void setTotalOrders(Integer totalOrders) {
        this.totalOrders = totalOrders;
    }

    public BigDecimal getTotalSales() {
        return totalSales;
    }

    public void setTotalSales(BigDecimal totalSales) {
        this.totalSales = totalSales;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private BigDecimal averageOrderValue;
        private BigDecimal yesterdayAverageOrderValue;
        private BigDecimal percentChange;
        private String trend;
        private Integer totalOrders;
        private BigDecimal totalSales;

        public Builder averageOrderValue(BigDecimal averageOrderValue) {
            this.averageOrderValue = averageOrderValue;
            return this;
        }

        public Builder yesterdayAverageOrderValue(BigDecimal yesterdayAverageOrderValue) {
            this.yesterdayAverageOrderValue = yesterdayAverageOrderValue;
            return this;
        }

        public Builder percentChange(BigDecimal percentChange) {
            this.percentChange = percentChange;
            return this;
        }

        public Builder trend(String trend) {
            this.trend = trend;
            return this;
        }

        public Builder totalOrders(Integer totalOrders) {
            this.totalOrders = totalOrders;
            return this;
        }

        public Builder totalSales(BigDecimal totalSales) {
            this.totalSales = totalSales;
            return this;
        }

        public AverageOrderValueResponse build() {
            return new AverageOrderValueResponse(averageOrderValue, yesterdayAverageOrderValue,
                    percentChange, trend, totalOrders, totalSales);
        }
    }
}
