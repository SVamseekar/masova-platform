package com.MaSoVa.core.review.dto.response;

import java.util.List;
import java.util.Map;

public class ItemRatingResponse {

    private String menuItemId;
    private String menuItemName;

    private Long totalReviews;
    private Double averageRating;
    private Map<Integer, Long> ratingDistribution;

    // Sentiment analysis
    private Long positiveReviews;
    private Long neutralReviews;
    private Long negativeReviews;

    // Common feedback themes
    private List<String> commonPraises; // e.g., "delicious", "great portion"
    private List<String> commonComplaints; // e.g., "too spicy", "cold"

    // Trending
    private String trendStatus; // TRENDING_UP, TRENDING_DOWN, STABLE
    private Double recentRatingChange;

    // Constructors
    public ItemRatingResponse() {}

    // Getters and Setters
    public String getMenuItemId() { return menuItemId; }
    public void setMenuItemId(String menuItemId) { this.menuItemId = menuItemId; }

    public String getMenuItemName() { return menuItemName; }
    public void setMenuItemName(String menuItemName) { this.menuItemName = menuItemName; }

    public Long getTotalReviews() { return totalReviews; }
    public void setTotalReviews(Long totalReviews) { this.totalReviews = totalReviews; }

    public Double getAverageRating() { return averageRating; }
    public void setAverageRating(Double averageRating) { this.averageRating = averageRating; }

    public Map<Integer, Long> getRatingDistribution() { return ratingDistribution; }
    public void setRatingDistribution(Map<Integer, Long> ratingDistribution) { this.ratingDistribution = ratingDistribution; }

    public Long getPositiveReviews() { return positiveReviews; }
    public void setPositiveReviews(Long positiveReviews) { this.positiveReviews = positiveReviews; }

    public Long getNeutralReviews() { return neutralReviews; }
    public void setNeutralReviews(Long neutralReviews) { this.neutralReviews = neutralReviews; }

    public Long getNegativeReviews() { return negativeReviews; }
    public void setNegativeReviews(Long negativeReviews) { this.negativeReviews = negativeReviews; }

    public List<String> getCommonPraises() { return commonPraises; }
    public void setCommonPraises(List<String> commonPraises) { this.commonPraises = commonPraises; }

    public List<String> getCommonComplaints() { return commonComplaints; }
    public void setCommonComplaints(List<String> commonComplaints) { this.commonComplaints = commonComplaints; }

    public String getTrendStatus() { return trendStatus; }
    public void setTrendStatus(String trendStatus) { this.trendStatus = trendStatus; }

    public Double getRecentRatingChange() { return recentRatingChange; }
    public void setRecentRatingChange(Double recentRatingChange) { this.recentRatingChange = recentRatingChange; }

    // Builder pattern
    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private final ItemRatingResponse response = new ItemRatingResponse();

        public Builder menuItemId(String menuItemId) { response.menuItemId = menuItemId; return this; }
        public Builder menuItemName(String menuItemName) { response.menuItemName = menuItemName; return this; }
        public Builder totalReviews(Long totalReviews) { response.totalReviews = totalReviews; return this; }
        public Builder averageRating(Double averageRating) { response.averageRating = averageRating; return this; }
        public Builder ratingDistribution(Map<Integer, Long> ratingDistribution) { response.ratingDistribution = ratingDistribution; return this; }
        public Builder positiveReviews(Long positiveReviews) { response.positiveReviews = positiveReviews; return this; }
        public Builder neutralReviews(Long neutralReviews) { response.neutralReviews = neutralReviews; return this; }
        public Builder negativeReviews(Long negativeReviews) { response.negativeReviews = negativeReviews; return this; }
        public Builder commonPraises(List<String> commonPraises) { response.commonPraises = commonPraises; return this; }
        public Builder commonComplaints(List<String> commonComplaints) { response.commonComplaints = commonComplaints; return this; }
        public Builder trendStatus(String trendStatus) { response.trendStatus = trendStatus; return this; }
        public Builder recentRatingChange(Double recentRatingChange) { response.recentRatingChange = recentRatingChange; return this; }

        public ItemRatingResponse build() { return response; }
    }
}
