package com.MaSoVa.logistics.inventory.dto.request;

/**
 * Request DTO for updating supplier performance metrics
 */
public class PerformanceUpdateRequest {
    private Integer completedOrders;
    private Integer cancelledOrders;
    private Double onTimeDeliveryRate;
    private Double qualityRating;

    public Integer getCompletedOrders() { return completedOrders; }
    public void setCompletedOrders(Integer completedOrders) { this.completedOrders = completedOrders; }
    public Integer getCancelledOrders() { return cancelledOrders; }
    public void setCancelledOrders(Integer cancelledOrders) { this.cancelledOrders = cancelledOrders; }
    public Double getOnTimeDeliveryRate() { return onTimeDeliveryRate; }
    public void setOnTimeDeliveryRate(Double onTimeDeliveryRate) { this.onTimeDeliveryRate = onTimeDeliveryRate; }
    public Double getQualityRating() { return qualityRating; }
    public void setQualityRating(Double qualityRating) { this.qualityRating = qualityRating; }
}
