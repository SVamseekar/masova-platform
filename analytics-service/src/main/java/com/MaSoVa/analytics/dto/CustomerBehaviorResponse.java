package com.MaSoVa.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerBehaviorResponse {

    private int totalCustomers;
    private int activeCustomers; // Ordered in last 30 days
    private int newCustomers; // Registered in last 30 days
    private BigDecimal averageLifetimeValue;
    private BigDecimal averageOrderFrequency; // Orders per month
    private List<CustomerSegment> segments;
    private List<BehaviorPattern> patterns;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CustomerSegment {
        private String segmentName; // "VIP", "Regular", "Occasional", "At Risk", "New"
        private int customerCount;
        private BigDecimal percentOfTotal;
        private BigDecimal averageOrderValue;
        private BigDecimal totalRevenue;
        private int averageOrdersPerMonth;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BehaviorPattern {
        private String patternType; // "Peak Ordering Time", "Preferred Order Type", "Favorite Category"
        private String description;
        private Map<String, Object> data;
        private BigDecimal significance; // 0-100
    }
}
