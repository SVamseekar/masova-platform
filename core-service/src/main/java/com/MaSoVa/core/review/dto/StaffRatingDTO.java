package com.MaSoVa.core.review.dto;

public class StaffRatingDTO {

    private String staffId;
    private String staffName;
    private Double averageRating; // Average staff rating (1-5 stars)
    private Long totalReviews; // Total number of reviews with staff rating

    // Constructor
    public StaffRatingDTO() {}

    public StaffRatingDTO(String staffId, String staffName, Double averageRating, Long totalReviews) {
        this.staffId = staffId;
        this.staffName = staffName;
        this.averageRating = averageRating;
        this.totalReviews = totalReviews;
    }

    // Getters and Setters
    public String getStaffId() { return staffId; }
    public void setStaffId(String staffId) { this.staffId = staffId; }

    public String getStaffName() { return staffName; }
    public void setStaffName(String staffName) { this.staffName = staffName; }

    public Double getAverageRating() { return averageRating; }
    public void setAverageRating(Double averageRating) { this.averageRating = averageRating; }

    public Long getTotalReviews() { return totalReviews; }
    public void setTotalReviews(Long totalReviews) { this.totalReviews = totalReviews; }
}
