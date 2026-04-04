package com.MaSoVa.core.earnings.dto;

import com.MaSoVa.core.earnings.entity.StaffEarningsSummaryEntity;

import java.math.BigDecimal;
import java.time.LocalDate;

public class WeeklyEarningsResponse {

    private String employeeId;
    private String storeId;
    private LocalDate weekStart;
    private LocalDate weekEnd;
    private BigDecimal hoursWorked;
    private BigDecimal basePayInr;
    private BigDecimal tipsInr;
    private BigDecimal totalInr;
    private BigDecimal hourlyRateInr;   // null if no pay rate configured

    public WeeklyEarningsResponse(StaffEarningsSummaryEntity e, BigDecimal hourlyRateInr) {
        this.employeeId = e.getEmployeeId();
        this.storeId = e.getStoreId();
        this.weekStart = e.getWeekStart();
        this.weekEnd = e.getWeekEnd();
        this.hoursWorked = e.getHoursWorked();
        this.basePayInr = e.getBasePayInr();
        this.tipsInr = e.getTipsInr();
        this.totalInr = e.getTotalInr();
        this.hourlyRateInr = hourlyRateInr;
    }

    public String getEmployeeId() { return employeeId; }
    public String getStoreId() { return storeId; }
    public LocalDate getWeekStart() { return weekStart; }
    public LocalDate getWeekEnd() { return weekEnd; }
    public BigDecimal getHoursWorked() { return hoursWorked; }
    public BigDecimal getBasePayInr() { return basePayInr; }
    public BigDecimal getTipsInr() { return tipsInr; }
    public BigDecimal getTotalInr() { return totalInr; }
    public BigDecimal getHourlyRateInr() { return hourlyRateInr; }
}
