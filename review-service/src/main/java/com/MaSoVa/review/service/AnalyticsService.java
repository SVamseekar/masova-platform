package com.MaSoVa.review.service;

import com.MaSoVa.review.dto.response.DriverRatingResponse;
import com.MaSoVa.review.dto.response.ItemRatingResponse;
import com.MaSoVa.review.dto.response.ReviewStatsResponse;
import com.MaSoVa.review.entity.Review;
import com.MaSoVa.review.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalyticsService {

    private final ReviewRepository reviewRepository;
    private final SentimentAnalysisService sentimentAnalysisService;

    public ReviewStatsResponse getOverallStats() {
        List<Review> allReviews = reviewRepository.findByIsDeletedFalseOrderByCreatedAtDesc(
                org.springframework.data.domain.PageRequest.of(0, 1000)
        ).getContent();

        return calculateStats(allReviews);
    }

    public DriverRatingResponse getDriverRating(String driverId) {
        List<Review> driverReviews = reviewRepository.findByDriverIdAndIsDeletedFalseAndDriverRatingIsNotNull(driverId);

        if (driverReviews.isEmpty()) {
            return DriverRatingResponse.builder()
                    .driverId(driverId)
                    .totalReviews(0L)
                    .averageRating(0.0)
                    .build();
        }

        double averageRating = driverReviews.stream()
                .mapToInt(Review::getDriverRating)
                .average()
                .orElse(0.0);

        Map<Integer, Long> ratingDistribution = driverReviews.stream()
                .collect(Collectors.groupingBy(Review::getDriverRating, Collectors.counting()));

        long positiveReviews = driverReviews.stream()
                .filter(r -> r.getDriverRating() >= 4)
                .count();

        long negativeReviews = driverReviews.stream()
                .filter(r -> r.getDriverRating() <= 2)
                .count();

        // Calculate last 30 days rating
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        double last30DaysRating = driverReviews.stream()
                .filter(r -> r.getCreatedAt().isAfter(thirtyDaysAgo))
                .mapToInt(Review::getDriverRating)
                .average()
                .orElse(averageRating);

        String performanceTrend = "STABLE";
        if (last30DaysRating > averageRating + 0.3) {
            performanceTrend = "IMPROVING";
        } else if (last30DaysRating < averageRating - 0.3) {
            performanceTrend = "DECLINING";
        }

        // Get driver name from first review
        String driverName = driverReviews.isEmpty() ? null : driverReviews.get(0).getDriverName();

        return DriverRatingResponse.builder()
                .driverId(driverId)
                .driverName(driverName)
                .totalReviews((long) driverReviews.size())
                .averageRating(Math.round(averageRating * 100.0) / 100.0)
                .ratingDistribution(ratingDistribution)
                .positiveReviews(positiveReviews)
                .negativeReviews(negativeReviews)
                .last30DaysRating(Math.round(last30DaysRating * 100.0) / 100.0)
                .performanceTrend(performanceTrend)
                .build();
    }

    public ItemRatingResponse getItemRating(String menuItemId) {
        List<Review> allReviews = reviewRepository.findByMenuItemId(menuItemId);

        List<Review.ItemReview> itemReviews = allReviews.stream()
                .flatMap(r -> r.getItemReviews().stream())
                .filter(ir -> ir.getMenuItemId().equals(menuItemId))
                .collect(Collectors.toList());

        if (itemReviews.isEmpty()) {
            return ItemRatingResponse.builder()
                    .menuItemId(menuItemId)
                    .totalReviews(0L)
                    .averageRating(0.0)
                    .build();
        }

        double averageRating = itemReviews.stream()
                .mapToInt(Review.ItemReview::getRating)
                .average()
                .orElse(0.0);

        Map<Integer, Long> ratingDistribution = itemReviews.stream()
                .collect(Collectors.groupingBy(Review.ItemReview::getRating, Collectors.counting()));

        long positiveReviews = itemReviews.stream()
                .filter(ir -> ir.getRating() >= 4)
                .count();

        long negativeReviews = itemReviews.stream()
                .filter(ir -> ir.getRating() <= 2)
                .count();

        long neutralReviews = itemReviews.size() - positiveReviews - negativeReviews;

        // Extract common themes from comments
        List<String> comments = itemReviews.stream()
                .map(Review.ItemReview::getComment)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        List<String> commonThemes = sentimentAnalysisService.extractCommonThemes(comments);

        // Determine trend
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        double recentRating = itemReviews.stream()
                .filter(ir -> {
                    // Find parent review to check date
                    return allReviews.stream()
                            .anyMatch(r -> r.getItemReviews().contains(ir) &&
                                    r.getCreatedAt().isAfter(thirtyDaysAgo));
                })
                .mapToInt(Review.ItemReview::getRating)
                .average()
                .orElse(averageRating);

        double recentRatingChange = recentRating - averageRating;
        String trendStatus = "STABLE";
        if (recentRatingChange > 0.3) {
            trendStatus = "TRENDING_UP";
        } else if (recentRatingChange < -0.3) {
            trendStatus = "TRENDING_DOWN";
        }

        String menuItemName = itemReviews.isEmpty() ? null : itemReviews.get(0).getMenuItemName();

        return ItemRatingResponse.builder()
                .menuItemId(menuItemId)
                .menuItemName(menuItemName)
                .totalReviews((long) itemReviews.size())
                .averageRating(Math.round(averageRating * 100.0) / 100.0)
                .ratingDistribution(ratingDistribution)
                .positiveReviews(positiveReviews)
                .neutralReviews(neutralReviews)
                .negativeReviews(negativeReviews)
                .commonPraises(new ArrayList<>())
                .commonComplaints(new ArrayList<>())
                .trendStatus(trendStatus)
                .recentRatingChange(Math.round(recentRatingChange * 100.0) / 100.0)
                .build();
    }

    private ReviewStatsResponse calculateStats(List<Review> reviews) {
        if (reviews.isEmpty()) {
            return ReviewStatsResponse.builder()
                    .totalReviews(0L)
                    .averageRating(0.0)
                    .ratingDistribution(new HashMap<>())
                    .build();
        }

        double averageRating = reviews.stream()
                .mapToInt(Review::getOverallRating)
                .average()
                .orElse(0.0);

        Map<Integer, Long> ratingDistribution = reviews.stream()
                .collect(Collectors.groupingBy(Review::getOverallRating, Collectors.counting()));

        double avgFoodQuality = reviews.stream()
                .filter(r -> r.getFoodQualityRating() != null)
                .mapToInt(Review::getFoodQualityRating)
                .average()
                .orElse(0.0);

        double avgService = reviews.stream()
                .filter(r -> r.getServiceRating() != null)
                .mapToInt(Review::getServiceRating)
                .average()
                .orElse(0.0);

        double avgDelivery = reviews.stream()
                .filter(r -> r.getDeliveryRating() != null)
                .mapToInt(Review::getDeliveryRating)
                .average()
                .orElse(0.0);

        long positiveReviews = reviewRepository.countBySentimentAndIsDeletedFalse(Review.SentimentType.POSITIVE);
        long neutralReviews = reviewRepository.countBySentimentAndIsDeletedFalse(Review.SentimentType.NEUTRAL);
        long negativeReviews = reviewRepository.countBySentimentAndIsDeletedFalse(Review.SentimentType.NEGATIVE);

        // Calculate trend
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        double recentAvgRating = reviews.stream()
                .filter(r -> r.getCreatedAt().isAfter(thirtyDaysAgo))
                .mapToInt(Review::getOverallRating)
                .average()
                .orElse(averageRating);

        double trendPercentage = ((recentAvgRating - averageRating) / averageRating) * 100;
        String trendDirection = "STABLE";
        if (trendPercentage > 5) {
            trendDirection = "UP";
        } else if (trendPercentage < -5) {
            trendDirection = "DOWN";
        }

        return ReviewStatsResponse.builder()
                .totalReviews((long) reviews.size())
                .averageRating(Math.round(averageRating * 100.0) / 100.0)
                .ratingDistribution(ratingDistribution)
                .averageFoodQualityRating(Math.round(avgFoodQuality * 100.0) / 100.0)
                .averageServiceRating(Math.round(avgService * 100.0) / 100.0)
                .averageDeliveryRating(Math.round(avgDelivery * 100.0) / 100.0)
                .positiveReviews(positiveReviews)
                .neutralReviews(neutralReviews)
                .negativeReviews(negativeReviews)
                .recentTrendPercentage(Math.round(trendPercentage * 100.0) / 100.0)
                .trendDirection(trendDirection)
                .build();
    }
}
