package com.MaSoVa.analytics.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public class CustomerBehaviorResponse {

    private int totalCustomers;
    private int activeCustomers; // Ordered in last 30 days
    private int newCustomers; // Registered in last 30 days
    private BigDecimal averageLifetimeValue;
    private BigDecimal averageOrderFrequency; // Orders per month
    private List<CustomerSegment> segments;
    private List<BehaviorPattern> patterns;

    public CustomerBehaviorResponse() {}

    public int getTotalCustomers() {
        return totalCustomers;
    }

    public void setTotalCustomers(int totalCustomers) {
        this.totalCustomers = totalCustomers;
    }

    public int getActiveCustomers() {
        return activeCustomers;
    }

    public void setActiveCustomers(int activeCustomers) {
        this.activeCustomers = activeCustomers;
    }

    public int getNewCustomers() {
        return newCustomers;
    }

    public void setNewCustomers(int newCustomers) {
        this.newCustomers = newCustomers;
    }

    public BigDecimal getAverageLifetimeValue() {
        return averageLifetimeValue;
    }

    public void setAverageLifetimeValue(BigDecimal averageLifetimeValue) {
        this.averageLifetimeValue = averageLifetimeValue;
    }

    public BigDecimal getAverageOrderFrequency() {
        return averageOrderFrequency;
    }

    public void setAverageOrderFrequency(BigDecimal averageOrderFrequency) {
        this.averageOrderFrequency = averageOrderFrequency;
    }

    public List<CustomerSegment> getSegments() {
        return segments;
    }

    public void setSegments(List<CustomerSegment> segments) {
        this.segments = segments;
    }

    public List<BehaviorPattern> getPatterns() {
        return patterns;
    }

    public void setPatterns(List<BehaviorPattern> patterns) {
        this.patterns = patterns;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private final CustomerBehaviorResponse obj = new CustomerBehaviorResponse();

        public Builder totalCustomers(int totalCustomers) {
            obj.totalCustomers = totalCustomers;
            return this;
        }

        public Builder activeCustomers(int activeCustomers) {
            obj.activeCustomers = activeCustomers;
            return this;
        }

        public Builder newCustomers(int newCustomers) {
            obj.newCustomers = newCustomers;
            return this;
        }

        public Builder averageLifetimeValue(BigDecimal averageLifetimeValue) {
            obj.averageLifetimeValue = averageLifetimeValue;
            return this;
        }

        public Builder averageOrderFrequency(BigDecimal averageOrderFrequency) {
            obj.averageOrderFrequency = averageOrderFrequency;
            return this;
        }

        public Builder segments(List<CustomerSegment> segments) {
            obj.segments = segments;
            return this;
        }

        public Builder patterns(List<BehaviorPattern> patterns) {
            obj.patterns = patterns;
            return this;
        }

        public CustomerBehaviorResponse build() {
            return obj;
        }
    }

    public static class CustomerSegment {
        private String segmentName; // "VIP", "Regular", "Occasional", "At Risk", "New"
        private int customerCount;
        private BigDecimal percentOfTotal;
        private BigDecimal averageOrderValue;
        private BigDecimal totalRevenue;
        private int averageOrdersPerMonth;

        public CustomerSegment() {}

        public String getSegmentName() {
            return segmentName;
        }

        public void setSegmentName(String segmentName) {
            this.segmentName = segmentName;
        }

        public int getCustomerCount() {
            return customerCount;
        }

        public void setCustomerCount(int customerCount) {
            this.customerCount = customerCount;
        }

        public BigDecimal getPercentOfTotal() {
            return percentOfTotal;
        }

        public void setPercentOfTotal(BigDecimal percentOfTotal) {
            this.percentOfTotal = percentOfTotal;
        }

        public BigDecimal getAverageOrderValue() {
            return averageOrderValue;
        }

        public void setAverageOrderValue(BigDecimal averageOrderValue) {
            this.averageOrderValue = averageOrderValue;
        }

        public BigDecimal getTotalRevenue() {
            return totalRevenue;
        }

        public void setTotalRevenue(BigDecimal totalRevenue) {
            this.totalRevenue = totalRevenue;
        }

        public int getAverageOrdersPerMonth() {
            return averageOrdersPerMonth;
        }

        public void setAverageOrdersPerMonth(int averageOrdersPerMonth) {
            this.averageOrdersPerMonth = averageOrdersPerMonth;
        }

        public static Builder builder() {
            return new Builder();
        }

        public static class Builder {
            private final CustomerSegment obj = new CustomerSegment();

            public Builder segmentName(String segmentName) {
                obj.segmentName = segmentName;
                return this;
            }

            public Builder customerCount(int customerCount) {
                obj.customerCount = customerCount;
                return this;
            }

            public Builder percentOfTotal(BigDecimal percentOfTotal) {
                obj.percentOfTotal = percentOfTotal;
                return this;
            }

            public Builder averageOrderValue(BigDecimal averageOrderValue) {
                obj.averageOrderValue = averageOrderValue;
                return this;
            }

            public Builder totalRevenue(BigDecimal totalRevenue) {
                obj.totalRevenue = totalRevenue;
                return this;
            }

            public Builder averageOrdersPerMonth(int averageOrdersPerMonth) {
                obj.averageOrdersPerMonth = averageOrdersPerMonth;
                return this;
            }

            public CustomerSegment build() {
                return obj;
            }
        }
    }

    public static class BehaviorPattern {
        private String patternType; // "Peak Ordering Time", "Preferred Order Type", "Favorite Category"
        private String description;
        private Map<String, Object> data;
        private BigDecimal significance; // 0-100

        public BehaviorPattern() {}

        public String getPatternType() {
            return patternType;
        }

        public void setPatternType(String patternType) {
            this.patternType = patternType;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }

        public Map<String, Object> getData() {
            return data;
        }

        public void setData(Map<String, Object> data) {
            this.data = data;
        }

        public BigDecimal getSignificance() {
            return significance;
        }

        public void setSignificance(BigDecimal significance) {
            this.significance = significance;
        }

        public static Builder builder() {
            return new Builder();
        }

        public static class Builder {
            private final BehaviorPattern obj = new BehaviorPattern();

            public Builder patternType(String patternType) {
                obj.patternType = patternType;
                return this;
            }

            public Builder description(String description) {
                obj.description = description;
                return this;
            }

            public Builder data(Map<String, Object> data) {
                obj.data = data;
                return this;
            }

            public Builder significance(BigDecimal significance) {
                obj.significance = significance;
                return this;
            }

            public BehaviorPattern build() {
                return obj;
            }
        }
    }
}
