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
public class SalesMetricsResponse {
    private BigDecimal todaySales;
    private BigDecimal yesterdaySalesAtSameTime;
    private BigDecimal lastYearSameDaySales;
    private Integer todayOrderCount;
    private Integer yesterdayOrderCountAtSameTime;
    private Integer lastYearSameDayOrderCount;
    private BigDecimal percentChangeFromYesterday;
    private BigDecimal percentChangeFromLastYear;
    private String trend; // "UP", "DOWN", "STABLE"
}
