package com.MaSoVa.analytics.dto;

import java.math.BigDecimal;
import java.util.List;

public class PeakHoursResponse {

    private List<HourData> hourlyData;
    private int peakHour; // Hour of day (0-23)
    private int slowestHour;
    private BigDecimal peakHourSales;
    private int peakHourOrders;

    public PeakHoursResponse() {
    }

    public PeakHoursResponse(List<HourData> hourlyData, int peakHour, int slowestHour, BigDecimal peakHourSales, int peakHourOrders) {
        this.hourlyData = hourlyData;
        this.peakHour = peakHour;
        this.slowestHour = slowestHour;
        this.peakHourSales = peakHourSales;
        this.peakHourOrders = peakHourOrders;
    }

    public List<HourData> getHourlyData() {
        return hourlyData;
    }

    public void setHourlyData(List<HourData> hourlyData) {
        this.hourlyData = hourlyData;
    }

    public int getPeakHour() {
        return peakHour;
    }

    public void setPeakHour(int peakHour) {
        this.peakHour = peakHour;
    }

    public int getSlowestHour() {
        return slowestHour;
    }

    public void setSlowestHour(int slowestHour) {
        this.slowestHour = slowestHour;
    }

    public BigDecimal getPeakHourSales() {
        return peakHourSales;
    }

    public void setPeakHourSales(BigDecimal peakHourSales) {
        this.peakHourSales = peakHourSales;
    }

    public int getPeakHourOrders() {
        return peakHourOrders;
    }

    public void setPeakHourOrders(int peakHourOrders) {
        this.peakHourOrders = peakHourOrders;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private List<HourData> hourlyData;
        private int peakHour;
        private int slowestHour;
        private BigDecimal peakHourSales;
        private int peakHourOrders;

        public Builder hourlyData(List<HourData> hourlyData) {
            this.hourlyData = hourlyData;
            return this;
        }

        public Builder peakHour(int peakHour) {
            this.peakHour = peakHour;
            return this;
        }

        public Builder slowestHour(int slowestHour) {
            this.slowestHour = slowestHour;
            return this;
        }

        public Builder peakHourSales(BigDecimal peakHourSales) {
            this.peakHourSales = peakHourSales;
            return this;
        }

        public Builder peakHourOrders(int peakHourOrders) {
            this.peakHourOrders = peakHourOrders;
            return this;
        }

        public PeakHoursResponse build() {
            return new PeakHoursResponse(hourlyData, peakHour, slowestHour, peakHourSales, peakHourOrders);
        }
    }

    public static class HourData {
        private int hour; // 0-23
        private String label; // "12 AM", "1 PM", etc.
        private int orderCount;
        private BigDecimal sales;
        private BigDecimal averageOrderValue;

        public HourData() {
        }

        public HourData(int hour, String label, int orderCount, BigDecimal sales, BigDecimal averageOrderValue) {
            this.hour = hour;
            this.label = label;
            this.orderCount = orderCount;
            this.sales = sales;
            this.averageOrderValue = averageOrderValue;
        }

        public int getHour() {
            return hour;
        }

        public void setHour(int hour) {
            this.hour = hour;
        }

        public String getLabel() {
            return label;
        }

        public void setLabel(String label) {
            this.label = label;
        }

        public int getOrderCount() {
            return orderCount;
        }

        public void setOrderCount(int orderCount) {
            this.orderCount = orderCount;
        }

        public BigDecimal getSales() {
            return sales;
        }

        public void setSales(BigDecimal sales) {
            this.sales = sales;
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
            private int hour;
            private String label;
            private int orderCount;
            private BigDecimal sales;
            private BigDecimal averageOrderValue;

            public Builder hour(int hour) {
                this.hour = hour;
                return this;
            }

            public Builder label(String label) {
                this.label = label;
                return this;
            }

            public Builder orderCount(int orderCount) {
                this.orderCount = orderCount;
                return this;
            }

            public Builder sales(BigDecimal sales) {
                this.sales = sales;
                return this;
            }

            public Builder averageOrderValue(BigDecimal averageOrderValue) {
                this.averageOrderValue = averageOrderValue;
                return this;
            }

            public HourData build() {
                return new HourData(hour, label, orderCount, sales, averageOrderValue);
            }
        }
    }
}
