package com.MaSoVa.intelligence.dto;

import java.io.Serializable;
import java.math.BigDecimal;

public class SalesMetricsResponse implements Serializable {
    private static final long serialVersionUID = 1L;
    private BigDecimal todaySales;
    private BigDecimal yesterdaySalesAtSameTime;
    private BigDecimal lastYearSameDaySales;
    private Integer todayOrderCount;
    private Integer yesterdayOrderCountAtSameTime;
    private Integer lastYearSameDayOrderCount;
    private BigDecimal percentChangeFromYesterday;
    private BigDecimal percentChangeFromLastYear;
    private String trend; // "UP", "DOWN", "STABLE"

    public SalesMetricsResponse() {
    }

    public SalesMetricsResponse(BigDecimal todaySales, BigDecimal yesterdaySalesAtSameTime,
                                BigDecimal lastYearSameDaySales, Integer todayOrderCount,
                                Integer yesterdayOrderCountAtSameTime, Integer lastYearSameDayOrderCount,
                                BigDecimal percentChangeFromYesterday, BigDecimal percentChangeFromLastYear,
                                String trend) {
        this.todaySales = todaySales;
        this.yesterdaySalesAtSameTime = yesterdaySalesAtSameTime;
        this.lastYearSameDaySales = lastYearSameDaySales;
        this.todayOrderCount = todayOrderCount;
        this.yesterdayOrderCountAtSameTime = yesterdayOrderCountAtSameTime;
        this.lastYearSameDayOrderCount = lastYearSameDayOrderCount;
        this.percentChangeFromYesterday = percentChangeFromYesterday;
        this.percentChangeFromLastYear = percentChangeFromLastYear;
        this.trend = trend;
    }

    public BigDecimal getTodaySales() {
        return todaySales;
    }

    public void setTodaySales(BigDecimal todaySales) {
        this.todaySales = todaySales;
    }

    public BigDecimal getYesterdaySalesAtSameTime() {
        return yesterdaySalesAtSameTime;
    }

    public void setYesterdaySalesAtSameTime(BigDecimal yesterdaySalesAtSameTime) {
        this.yesterdaySalesAtSameTime = yesterdaySalesAtSameTime;
    }

    public BigDecimal getLastYearSameDaySales() {
        return lastYearSameDaySales;
    }

    public void setLastYearSameDaySales(BigDecimal lastYearSameDaySales) {
        this.lastYearSameDaySales = lastYearSameDaySales;
    }

    public Integer getTodayOrderCount() {
        return todayOrderCount;
    }

    public void setTodayOrderCount(Integer todayOrderCount) {
        this.todayOrderCount = todayOrderCount;
    }

    public Integer getYesterdayOrderCountAtSameTime() {
        return yesterdayOrderCountAtSameTime;
    }

    public void setYesterdayOrderCountAtSameTime(Integer yesterdayOrderCountAtSameTime) {
        this.yesterdayOrderCountAtSameTime = yesterdayOrderCountAtSameTime;
    }

    public Integer getLastYearSameDayOrderCount() {
        return lastYearSameDayOrderCount;
    }

    public void setLastYearSameDayOrderCount(Integer lastYearSameDayOrderCount) {
        this.lastYearSameDayOrderCount = lastYearSameDayOrderCount;
    }

    public BigDecimal getPercentChangeFromYesterday() {
        return percentChangeFromYesterday;
    }

    public void setPercentChangeFromYesterday(BigDecimal percentChangeFromYesterday) {
        this.percentChangeFromYesterday = percentChangeFromYesterday;
    }

    public BigDecimal getPercentChangeFromLastYear() {
        return percentChangeFromLastYear;
    }

    public void setPercentChangeFromLastYear(BigDecimal percentChangeFromLastYear) {
        this.percentChangeFromLastYear = percentChangeFromLastYear;
    }

    public String getTrend() {
        return trend;
    }

    public void setTrend(String trend) {
        this.trend = trend;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private BigDecimal todaySales;
        private BigDecimal yesterdaySalesAtSameTime;
        private BigDecimal lastYearSameDaySales;
        private Integer todayOrderCount;
        private Integer yesterdayOrderCountAtSameTime;
        private Integer lastYearSameDayOrderCount;
        private BigDecimal percentChangeFromYesterday;
        private BigDecimal percentChangeFromLastYear;
        private String trend;

        public Builder todaySales(BigDecimal todaySales) {
            this.todaySales = todaySales;
            return this;
        }

        public Builder yesterdaySalesAtSameTime(BigDecimal yesterdaySalesAtSameTime) {
            this.yesterdaySalesAtSameTime = yesterdaySalesAtSameTime;
            return this;
        }

        public Builder lastYearSameDaySales(BigDecimal lastYearSameDaySales) {
            this.lastYearSameDaySales = lastYearSameDaySales;
            return this;
        }

        public Builder todayOrderCount(Integer todayOrderCount) {
            this.todayOrderCount = todayOrderCount;
            return this;
        }

        public Builder yesterdayOrderCountAtSameTime(Integer yesterdayOrderCountAtSameTime) {
            this.yesterdayOrderCountAtSameTime = yesterdayOrderCountAtSameTime;
            return this;
        }

        public Builder lastYearSameDayOrderCount(Integer lastYearSameDayOrderCount) {
            this.lastYearSameDayOrderCount = lastYearSameDayOrderCount;
            return this;
        }

        public Builder percentChangeFromYesterday(BigDecimal percentChangeFromYesterday) {
            this.percentChangeFromYesterday = percentChangeFromYesterday;
            return this;
        }

        public Builder percentChangeFromLastYear(BigDecimal percentChangeFromLastYear) {
            this.percentChangeFromLastYear = percentChangeFromLastYear;
            return this;
        }

        public Builder trend(String trend) {
            this.trend = trend;
            return this;
        }

        public SalesMetricsResponse build() {
            return new SalesMetricsResponse(todaySales, yesterdaySalesAtSameTime, lastYearSameDaySales,
                    todayOrderCount, yesterdayOrderCountAtSameTime, lastYearSameDayOrderCount,
                    percentChangeFromYesterday, percentChangeFromLastYear, trend);
        }
    }
}
