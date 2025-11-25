package com.MaSoVa.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChurnPredictionResponse {

    private int totalCustomersAnalyzed;
    private int highRiskCustomers;
    private int mediumRiskCustomers;
    private int lowRiskCustomers;
    private BigDecimal predictedChurnRate; // Percentage
    private List<ChurnRiskCustomer> atRiskCustomers;
    private List<ChurnFactor> churnFactors;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChurnRiskCustomer {
        private String customerId;
        private String customerName;
        private String email;
        private String riskLevel; // "HIGH", "MEDIUM", "LOW"
        private BigDecimal churnProbability; // 0-100
        private int daysSinceLastOrder;
        private BigDecimal lifetimeValue;
        private int totalOrders;
        private LocalDateTime lastOrderDate;
        private List<String> riskFactors;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChurnFactor {
        private String factorName;
        private String description;
        private BigDecimal impactScore; // 0-100
        private int customersAffected;
    }
}
