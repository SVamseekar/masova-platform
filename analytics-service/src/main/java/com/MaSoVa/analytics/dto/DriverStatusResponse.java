package com.MaSoVa.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DriverStatusResponse {
    private Integer totalDrivers;
    private Integer availableDrivers;
    private Integer busyDrivers;
    private Integer activeDeliveries;
    private Integer completedTodayDeliveries;
}
