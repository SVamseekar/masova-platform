package com.MaSoVa.intelligence.dto;
import java.io.Serializable;


import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class SalesTrendResponse implements Serializable {
    private static final long serialVersionUID = 1L;

    private String period; // "WEEKLY" or "MONTHLY"
    private List<DailyDataPoint> dataPoints;
    private BigDecimal totalSales;
    private int totalOrders;
    private BigDecimal averageOrderValue;
    private BigDecimal percentChangeFromPreviousPeriod;
    private String trend; // "UP", "DOWN", "STABLE"

    public SalesTrendResponse() {
    }

    public SalesTrendResponse(String period, List<DailyDataPoint> dataPoints, BigDecimal totalSales, int totalOrders,
                             BigDecimal averageOrderValue, BigDecimal percentChangeFromPreviousPeriod, String trend) {
        this.period = period;
        this.dataPoints = dataPoints;
        this.totalSales = totalSales;
        this.totalOrders = totalOrders;
        this.averageOrderValue = averageOrderValue;
        this.percentChangeFromPreviousPeriod = percentChangeFromPreviousPeriod;
        this.trend = trend;
    }

    public String getPeriod() {
        return period;
    }

    public void setPeriod(String period) {
        this.period = period;
    }

    public List<DailyDataPoint> getDataPoints() {
        return dataPoints;
    }

    public void setDataPoints(List<DailyDataPoint> dataPoints) {
        this.dataPoints = dataPoints;
    }

    public BigDecimal getTotalSales() {
        return totalSales;
    }

    public void setTotalSales(BigDecimal totalSales) {
        this.totalSales = totalSales;
    }

    public int getTotalOrders() {
        return totalOrders;
    }

    public void setTotalOrders(int totalOrders) {
        this.totalOrders = totalOrders;
    }

    public BigDecimal getAverageOrderValue() {
        return averageOrderValue;
    }

    public void setAverageOrderValue(BigDecimal averageOrderValue) {
        this.averageOrderValue = averageOrderValue;
    }

    public BigDecimal getPercentChangeFromPreviousPeriod() {
        return percentChangeFromPreviousPeriod;
    }

    public void setPercentChangeFromPreviousPeriod(BigDecimal percentChangeFromPreviousPeriod) {
        this.percentChangeFromPreviousPeriod = percentChangeFromPreviousPeriod;
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
        private String period;
        private List<DailyDataPoint> dataPoints;
        private BigDecimal totalSales;
        private int totalOrders;
        private BigDecimal averageOrderValue;
        private BigDecimal percentChangeFromPreviousPeriod;
        private String trend;

        public Builder period(String period) {
            this.period = period;
            return this;
        }

        public Builder dataPoints(List<DailyDataPoint> dataPoints) {
            this.dataPoints = dataPoints;
            return this;
        }

        public Builder totalSales(BigDecimal totalSales) {
            this.totalSales = totalSales;
            return this;
        }

        public Builder totalOrders(int totalOrders) {
            this.totalOrders = totalOrders;
            return this;
        }

        public Builder averageOrderValue(BigDecimal averageOrderValue) {
            this.averageOrderValue = averageOrderValue;
            return this;
        }

        public Builder percentChangeFromPreviousPeriod(BigDecimal percentChangeFromPreviousPeriod) {
            this.percentChangeFromPreviousPeriod = percentChangeFromPreviousPeriod;
            return this;
        }

        public Builder trend(String trend) {
            this.trend = trend;
            return this;
        }

        public SalesTrendResponse build() {
            return new SalesTrendResponse(period, dataPoints, totalSales, totalOrders,
                    averageOrderValue, percentChangeFromPreviousPeriod, trend);
        }
    }

    public static class DailyDataPoint implements Serializable {
        private static final long serialVersionUID = 1L;

        private LocalDate date;
        private String label; // e.g., "Mon", "Jan 15"
        private BigDecimal sales;
        private int orderCount;
        private BigDecimal averageOrderValue;

        public DailyDataPoint() {
        }

        public DailyDataPoint(LocalDate date, String label, BigDecimal sales, int orderCount, BigDecimal averageOrderValue) {
            this.date = date;
            this.label = label;
            this.sales = sales;
            this.orderCount = orderCount;
            this.averageOrderValue = averageOrderValue;
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

        public BigDecimal getSales() {
            return sales;
        }

        public void setSales(BigDecimal sales) {
            this.sales = sales;
        }

        public int getOrderCount() {
            return orderCount;
        }

        public void setOrderCount(int orderCount) {
            this.orderCount = orderCount;
        }

        public BigDecimal getAverageOrderValue() {
            return averageOrderValue;
        }

        public void setAverageOrderValue(BigDecimal averageOrderValue) {
            this.averageOrderValue = averageOrderValue;
        }

        public static Builder builder() {
            return new Builder();
        }

        public static class Builder {
            private LocalDate date;
            private String label;
            private BigDecimal sales;
            private int orderCount;
            private BigDecimal averageOrderValue;

            public Builder date(LocalDate date) {
                this.date = date;
                return this;
            }

            public Builder label(String label) {
                this.label = label;
                return this;
            }

            public Builder sales(BigDecimal sales) {
                this.sales = sales;
                return this;
            }

            public Builder orderCount(int orderCount) {
                this.orderCount = orderCount;
                return this;
            }

            public Builder averageOrderValue(BigDecimal averageOrderValue) {
                this.averageOrderValue = averageOrderValue;
                return this;
            }

            public DailyDataPoint build() {
                return new DailyDataPoint(date, label, sales, orderCount, averageOrderValue);
            }
        }
    }
}
