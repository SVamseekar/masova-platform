package com.MaSoVa.core.earnings.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public class SetPayRateRequest {

    @NotBlank(message = "employeeId is required")
    private String employeeId;

    @NotBlank(message = "storeId is required")
    private String storeId;

    @NotNull(message = "hourlyRateInr is required")
    @DecimalMin(value = "1.00", message = "Hourly rate must be at least ₹1")
    private BigDecimal hourlyRateInr;

    @NotNull(message = "effectiveFrom is required")
    private LocalDate effectiveFrom;

    private LocalDate effectiveTo;

    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }

    public String getStoreId() { return storeId; }
    public void setStoreId(String storeId) { this.storeId = storeId; }

    public BigDecimal getHourlyRateInr() { return hourlyRateInr; }
    public void setHourlyRateInr(BigDecimal hourlyRateInr) { this.hourlyRateInr = hourlyRateInr; }

    public LocalDate getEffectiveFrom() { return effectiveFrom; }
    public void setEffectiveFrom(LocalDate effectiveFrom) { this.effectiveFrom = effectiveFrom; }

    public LocalDate getEffectiveTo() { return effectiveTo; }
    public void setEffectiveTo(LocalDate effectiveTo) { this.effectiveTo = effectiveTo; }
}
