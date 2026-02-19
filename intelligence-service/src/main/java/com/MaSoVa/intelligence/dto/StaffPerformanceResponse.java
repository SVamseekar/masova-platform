package com.MaSoVa.intelligence.dto;
import java.io.Serializable;


import java.math.BigDecimal;

public class StaffPerformanceResponse implements Serializable {
    private static final long serialVersionUID = 1L;
    private String staffId;
    private String staffName;
    private Integer ordersProcessedToday;
    private BigDecimal salesGeneratedToday;
    private BigDecimal averageOrderValue;
    private Integer rank;
    private String performanceLevel; // "EXCELLENT", "GOOD", "AVERAGE", "NEEDS_IMPROVEMENT"

    public StaffPerformanceResponse() {
    }

    public StaffPerformanceResponse(String staffId, String staffName, Integer ordersProcessedToday,
                                    BigDecimal salesGeneratedToday, BigDecimal averageOrderValue,
                                    Integer rank, String performanceLevel) {
        this.staffId = staffId;
        this.staffName = staffName;
        this.ordersProcessedToday = ordersProcessedToday;
        this.salesGeneratedToday = salesGeneratedToday;
        this.averageOrderValue = averageOrderValue;
        this.rank = rank;
        this.performanceLevel = performanceLevel;
    }

    public String getStaffId() {
        return staffId;
    }

    public void setStaffId(String staffId) {
        this.staffId = staffId;
    }

    public String getStaffName() {
        return staffName;
    }

    public void setStaffName(String staffName) {
        this.staffName = staffName;
    }

    public Integer getOrdersProcessedToday() {
        return ordersProcessedToday;
    }

    public void setOrdersProcessedToday(Integer ordersProcessedToday) {
        this.ordersProcessedToday = ordersProcessedToday;
    }

    public BigDecimal getSalesGeneratedToday() {
        return salesGeneratedToday;
    }

    public void setSalesGeneratedToday(BigDecimal salesGeneratedToday) {
        this.salesGeneratedToday = salesGeneratedToday;
    }

    public BigDecimal getAverageOrderValue() {
        return averageOrderValue;
    }

    public void setAverageOrderValue(BigDecimal averageOrderValue) {
        this.averageOrderValue = averageOrderValue;
    }

    public Integer getRank() {
        return rank;
    }

    public void setRank(Integer rank) {
        this.rank = rank;
    }

    public String getPerformanceLevel() {
        return performanceLevel;
    }

    public void setPerformanceLevel(String performanceLevel) {
        this.performanceLevel = performanceLevel;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String staffId;
        private String staffName;
        private Integer ordersProcessedToday;
        private BigDecimal salesGeneratedToday;
        private BigDecimal averageOrderValue;
        private Integer rank;
        private String performanceLevel;

        public Builder staffId(String staffId) {
            this.staffId = staffId;
            return this;
        }

        public Builder staffName(String staffName) {
            this.staffName = staffName;
            return this;
        }

        public Builder ordersProcessedToday(Integer ordersProcessedToday) {
            this.ordersProcessedToday = ordersProcessedToday;
            return this;
        }

        public Builder salesGeneratedToday(BigDecimal salesGeneratedToday) {
            this.salesGeneratedToday = salesGeneratedToday;
            return this;
        }

        public Builder averageOrderValue(BigDecimal averageOrderValue) {
            this.averageOrderValue = averageOrderValue;
            return this;
        }

        public Builder rank(Integer rank) {
            this.rank = rank;
            return this;
        }

        public Builder performanceLevel(String performanceLevel) {
            this.performanceLevel = performanceLevel;
            return this;
        }

        public StaffPerformanceResponse build() {
            return new StaffPerformanceResponse(staffId, staffName, ordersProcessedToday,
                    salesGeneratedToday, averageOrderValue, rank, performanceLevel);
        }
    }
}
