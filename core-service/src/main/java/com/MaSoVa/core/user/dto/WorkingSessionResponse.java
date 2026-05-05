package com.MaSoVa.core.user.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Duration;

public class WorkingSessionResponse {
    private String id;
    private String employeeId;
    private String employeeName;  // Employee name for display
    private String role;           // Employee role for display
    private String storeId;
    private LocalDate date;
    private LocalDateTime loginTime;
    private LocalDateTime logoutTime;
    private Double totalHours;

    @JsonProperty("isActive")
    private boolean isActive;

    private Long breakDurationMinutes;
    private String notes;
    private Duration currentWorkingDuration;

    // Phase 3: Enhanced duration fields
    private Long currentDurationMinutes;  // Total time since clock in (including breaks)
    private Long workingDurationMinutes;  // Working time (excluding breaks)

    public WorkingSessionResponse() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }

    public String getEmployeeName() { return employeeName; }
    public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getStoreId() { return storeId; }
    public void setStoreId(String storeId) { this.storeId = storeId; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public LocalDateTime getLoginTime() { return loginTime; }
    public void setLoginTime(LocalDateTime loginTime) { this.loginTime = loginTime; }

    public LocalDateTime getLogoutTime() { return logoutTime; }
    public void setLogoutTime(LocalDateTime logoutTime) { this.logoutTime = logoutTime; }

    public Double getTotalHours() { return totalHours; }
    public void setTotalHours(Double totalHours) { this.totalHours = totalHours; }

    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }

    public Long getBreakDurationMinutes() { return breakDurationMinutes; }
    public void setBreakDurationMinutes(Long breakDurationMinutes) { this.breakDurationMinutes = breakDurationMinutes; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public Duration getCurrentWorkingDuration() { return currentWorkingDuration; }
    public void setCurrentWorkingDuration(Duration currentWorkingDuration) { this.currentWorkingDuration = currentWorkingDuration; }

    // Phase 3: New getters and setters
    public Long getCurrentDurationMinutes() { return currentDurationMinutes; }
    public void setCurrentDurationMinutes(Long currentDurationMinutes) { this.currentDurationMinutes = currentDurationMinutes; }

    public Long getWorkingDurationMinutes() { return workingDurationMinutes; }
    public void setWorkingDurationMinutes(Long workingDurationMinutes) { this.workingDurationMinutes = workingDurationMinutes; }
}