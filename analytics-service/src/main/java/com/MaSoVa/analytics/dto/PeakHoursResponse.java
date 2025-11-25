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
public class PeakHoursResponse {

    private List<HourData> hourlyData;
    private int peakHour; // Hour of day (0-23)
    private int slowestHour;
    private BigDecimal peakHourSales;
    private int peakHourOrders;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HourData {
        private int hour; // 0-23
        private String label; // "12 AM", "1 PM", etc.
        private int orderCount;
        private BigDecimal sales;
        private BigDecimal averageOrderValue;
    }
}
