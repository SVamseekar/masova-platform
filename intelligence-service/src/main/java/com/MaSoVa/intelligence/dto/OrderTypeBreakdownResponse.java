package com.MaSoVa.intelligence.dto;

import java.io.Serializable;
import java.util.ArrayList;
import java.math.BigDecimal;
import java.util.List;

public class OrderTypeBreakdownResponse implements Serializable {
    private static final long serialVersionUID = 1L;

    private ArrayList<OrderTypeData> breakdown = new ArrayList<>();
    private BigDecimal totalSales;
    private int totalOrders;

    public OrderTypeBreakdownResponse() {
    }

    public OrderTypeBreakdownResponse(List<OrderTypeData> breakdown, BigDecimal totalSales, int totalOrders) {
        this.breakdown = breakdown != null ? new ArrayList<>((breakdown)) : new ArrayList<>();
        this.totalSales = totalSales;
        this.totalOrders = totalOrders;
    }

    public List<OrderTypeData> getBreakdown() {
        return breakdown;
    }

    public void setBreakdown(List<OrderTypeData> breakdown) {
        this.breakdown = breakdown != null ? new ArrayList<>((breakdown)) : new ArrayList<>();
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

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private ArrayList<OrderTypeData> breakdown = new ArrayList<>();
        private BigDecimal totalSales;
        private int totalOrders;

        public Builder breakdown(List<OrderTypeData> breakdown) {
            this.breakdown = breakdown != null ? new ArrayList<>((breakdown)) : new ArrayList<>();
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

        public OrderTypeBreakdownResponse build() {
            return new OrderTypeBreakdownResponse(breakdown, totalSales, totalOrders);
        }
    }

    public static class OrderTypeData implements Serializable {
        private static final long serialVersionUID = 1L;
        private String orderType; // "DINE_IN", "PICKUP", "DELIVERY"
        private int count;
        private BigDecimal sales;
        private BigDecimal percentage;
        private BigDecimal averageOrderValue;

        public OrderTypeData() {
        }

        public OrderTypeData(String orderType, int count, BigDecimal sales, BigDecimal percentage, BigDecimal averageOrderValue) {
            this.orderType = orderType;
            this.count = count;
            this.sales = sales;
            this.percentage = percentage;
            this.averageOrderValue = averageOrderValue;
        }

        public String getOrderType() {
            return orderType;
        }

        public void setOrderType(String orderType) {
            this.orderType = orderType;
        }

        public int getCount() {
            return count;
        }

        public void setCount(int count) {
            this.count = count;
        }

        public BigDecimal getSales() {
            return sales;
        }

        public void setSales(BigDecimal sales) {
            this.sales = sales;
        }

        public BigDecimal getPercentage() {
            return percentage;
        }

        public void setPercentage(BigDecimal percentage) {
            this.percentage = percentage;
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
            private String orderType;
            private int count;
            private BigDecimal sales;
            private BigDecimal percentage;
            private BigDecimal averageOrderValue;

            public Builder orderType(String orderType) {
                this.orderType = orderType;
                return this;
            }

            public Builder count(int count) {
                this.count = count;
                return this;
            }

            public Builder sales(BigDecimal sales) {
                this.sales = sales;
                return this;
            }

            public Builder percentage(BigDecimal percentage) {
                this.percentage = percentage;
                return this;
            }

            public Builder averageOrderValue(BigDecimal averageOrderValue) {
                this.averageOrderValue = averageOrderValue;
                return this;
            }

            public OrderTypeData build() {
                return new OrderTypeData(orderType, count, sales, percentage, averageOrderValue);
            }
        }
    }
}
