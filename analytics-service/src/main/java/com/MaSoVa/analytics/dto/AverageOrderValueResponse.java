package com.MaSoVa.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AverageOrderValueResponse {
    private BigDecimal averageOrderValue;
    private BigDecimal yesterdayAverageOrderValue;
    private BigDecimal percentChange;
    private String trend; // "UP", "DOWN", "STABLE"
    private Integer totalOrders;
    private BigDecimal totalSales;
}
