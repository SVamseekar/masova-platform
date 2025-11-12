package com.MaSoVa.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderTypeBreakdownResponse {

    private List<OrderTypeData> breakdown;
    private BigDecimal totalSales;
    private int totalOrders;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderTypeData {
        private String orderType; // "DINE_IN", "PICKUP", "DELIVERY"
        private int count;
        private BigDecimal sales;
        private BigDecimal percentage;
        private BigDecimal averageOrderValue;
    }
}
