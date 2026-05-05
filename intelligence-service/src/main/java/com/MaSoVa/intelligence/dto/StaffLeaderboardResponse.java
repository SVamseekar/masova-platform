package com.MaSoVa.intelligence.dto;
import java.io.Serializable;


import java.math.BigDecimal;
import java.util.List;

public class StaffLeaderboardResponse implements Serializable {
    private static final long serialVersionUID = 1L;

    private List<StaffRanking> rankings;
    private String period; // "TODAY", "WEEK", "MONTH"
    private int totalStaff;

    public StaffLeaderboardResponse() {
    }

    public StaffLeaderboardResponse(List<StaffRanking> rankings, String period, int totalStaff) {
        this.rankings = rankings;
        this.period = period;
        this.totalStaff = totalStaff;
    }

    public List<StaffRanking> getRankings() {
        return rankings;
    }

    public void setRankings(List<StaffRanking> rankings) {
        this.rankings = rankings;
    }

    public String getPeriod() {
        return period;
    }

    public void setPeriod(String period) {
        this.period = period;
    }

    public int getTotalStaff() {
        return totalStaff;
    }

    public void setTotalStaff(int totalStaff) {
        this.totalStaff = totalStaff;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private List<StaffRanking> rankings;
        private String period;
        private int totalStaff;

        public Builder rankings(List<StaffRanking> rankings) {
            this.rankings = rankings;
            return this;
        }

        public Builder period(String period) {
            this.period = period;
            return this;
        }

        public Builder totalStaff(int totalStaff) {
            this.totalStaff = totalStaff;
            return this;
        }

        public StaffLeaderboardResponse build() {
            return new StaffLeaderboardResponse(rankings, period, totalStaff);
        }
    }

    public static class StaffRanking implements Serializable {
        private static final long serialVersionUID = 1L;

        private int rank;
        private String staffId;
        private String staffName;
        private int ordersProcessed;
        private BigDecimal salesGenerated;
        private BigDecimal averageOrderValue;
        private String performanceLevel; // "EXCELLENT", "GOOD", "AVERAGE", "NEEDS_IMPROVEMENT"
        private BigDecimal percentOfTotalSales;

        public StaffRanking() {
        }

        public StaffRanking(int rank, String staffId, String staffName, int ordersProcessed,
                           BigDecimal salesGenerated, BigDecimal averageOrderValue,
                           String performanceLevel, BigDecimal percentOfTotalSales) {
            this.rank = rank;
            this.staffId = staffId;
            this.staffName = staffName;
            this.ordersProcessed = ordersProcessed;
            this.salesGenerated = salesGenerated;
            this.averageOrderValue = averageOrderValue;
            this.performanceLevel = performanceLevel;
            this.percentOfTotalSales = percentOfTotalSales;
        }

        public int getRank() {
            return rank;
        }

        public void setRank(int rank) {
            this.rank = rank;
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

        public int getOrdersProcessed() {
            return ordersProcessed;
        }

        public void setOrdersProcessed(int ordersProcessed) {
            this.ordersProcessed = ordersProcessed;
        }

        public BigDecimal getSalesGenerated() {
            return salesGenerated;
        }

        public void setSalesGenerated(BigDecimal salesGenerated) {
            this.salesGenerated = salesGenerated;
        }

        public BigDecimal getAverageOrderValue() {
            return averageOrderValue;
        }

        public void setAverageOrderValue(BigDecimal averageOrderValue) {
            this.averageOrderValue = averageOrderValue;
        }

        public String getPerformanceLevel() {
            return performanceLevel;
        }

        public void setPerformanceLevel(String performanceLevel) {
            this.performanceLevel = performanceLevel;
        }

        public BigDecimal getPercentOfTotalSales() {
            return percentOfTotalSales;
        }

        public void setPercentOfTotalSales(BigDecimal percentOfTotalSales) {
            this.percentOfTotalSales = percentOfTotalSales;
        }

        public static Builder builder() {
            return new Builder();
        }

        public static class Builder {
            private int rank;
            private String staffId;
            private String staffName;
            private int ordersProcessed;
            private BigDecimal salesGenerated;
            private BigDecimal averageOrderValue;
            private String performanceLevel;
            private BigDecimal percentOfTotalSales;

            public Builder rank(int rank) {
                this.rank = rank;
                return this;
            }

            public Builder staffId(String staffId) {
                this.staffId = staffId;
                return this;
            }

            public Builder staffName(String staffName) {
                this.staffName = staffName;
                return this;
            }

            public Builder ordersProcessed(int ordersProcessed) {
                this.ordersProcessed = ordersProcessed;
                return this;
            }

            public Builder salesGenerated(BigDecimal salesGenerated) {
                this.salesGenerated = salesGenerated;
                return this;
            }

            public Builder averageOrderValue(BigDecimal averageOrderValue) {
                this.averageOrderValue = averageOrderValue;
                return this;
            }

            public Builder performanceLevel(String performanceLevel) {
                this.performanceLevel = performanceLevel;
                return this;
            }

            public Builder percentOfTotalSales(BigDecimal percentOfTotalSales) {
                this.percentOfTotalSales = percentOfTotalSales;
                return this;
            }

            public StaffRanking build() {
                return new StaffRanking(rank, staffId, staffName, ordersProcessed, salesGenerated,
                        averageOrderValue, performanceLevel, percentOfTotalSales);
            }
        }
    }
}
