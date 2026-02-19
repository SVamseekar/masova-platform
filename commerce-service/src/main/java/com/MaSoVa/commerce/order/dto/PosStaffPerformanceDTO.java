package com.MaSoVa.commerce.order.dto;

import java.math.BigDecimal;

public class PosStaffPerformanceDTO {

    private Long totalOrders;
    private BigDecimal totalRevenue;
    private Long completedOrders;
    private Long cancelledOrders;
    private Double averageOrderValue;
    private String staffId;
    private String staffName;

    // Constructors
    public PosStaffPerformanceDTO() {}

    public PosStaffPerformanceDTO(Long totalOrders, BigDecimal totalRevenue, Long completedOrders,
                                  Long cancelledOrders, String staffId, String staffName) {
        this.totalOrders = totalOrders;
        this.totalRevenue = totalRevenue;
        this.completedOrders = completedOrders;
        this.cancelledOrders = cancelledOrders;
        this.staffId = staffId;
        this.staffName = staffName;
        this.averageOrderValue = totalOrders > 0 ? totalRevenue.doubleValue() / totalOrders : 0.0;
    }

    // Getters and Setters
    public Long getTotalOrders() { return totalOrders; }
    public void setTotalOrders(Long totalOrders) { this.totalOrders = totalOrders; }

    public BigDecimal getTotalRevenue() { return totalRevenue; }
    public void setTotalRevenue(BigDecimal totalRevenue) { this.totalRevenue = totalRevenue; }

    public Long getCompletedOrders() { return completedOrders; }
    public void setCompletedOrders(Long completedOrders) { this.completedOrders = completedOrders; }

    public Long getCancelledOrders() { return cancelledOrders; }
    public void setCancelledOrders(Long cancelledOrders) { this.cancelledOrders = cancelledOrders; }

    public Double getAverageOrderValue() { return averageOrderValue; }
    public void setAverageOrderValue(Double averageOrderValue) { this.averageOrderValue = averageOrderValue; }

    public String getStaffId() { return staffId; }
    public void setStaffId(String staffId) { this.staffId = staffId; }

    public String getStaffName() { return staffName; }
    public void setStaffName(String staffName) { this.staffName = staffName; }
}
