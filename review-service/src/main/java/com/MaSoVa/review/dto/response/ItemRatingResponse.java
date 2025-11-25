package com.MaSoVa.review.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
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
}
