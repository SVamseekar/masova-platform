package com.MaSoVa.core.unit.service;

import com.MaSoVa.core.review.dto.response.DriverRatingResponse;
import com.MaSoVa.core.review.dto.response.ItemRatingResponse;
import com.MaSoVa.core.review.dto.response.ReviewStatsResponse;
import com.MaSoVa.core.review.entity.Review;
import com.MaSoVa.core.review.repository.ReviewRepository;
import com.MaSoVa.core.review.service.AnalyticsService;
import com.MaSoVa.core.review.service.SentimentAnalysisService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.domain.PageImpl;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("AnalyticsService Unit Tests")
class AnalyticsServiceTest {

    @Mock private ReviewRepository reviewRepository;
    @Mock private SentimentAnalysisService sentimentAnalysisService;

    @InjectMocks private AnalyticsService analyticsService;

    private Review buildReview(int overallRating, Review.SentimentType sentiment) {
        Review r = new Review();
        r.setId("rev-" + overallRating);
        r.setOverallRating(overallRating);
        r.setSentiment(sentiment);
        r.setIsDeleted(false);
        r.setCreatedAt(LocalDateTime.now());
        r.setItemReviews(new ArrayList<>());
        return r;
    }

    private Review buildReviewWithDriverRating(String driverId, String driverName, int driverRating) {
        Review r = buildReview(driverRating, Review.SentimentType.POSITIVE);
        r.setDriverId(driverId);
        r.setDriverName(driverName);
        r.setDriverRating(driverRating);
        return r;
    }

    @Nested
    @DisplayName("getOverallStats")
    class GetOverallStats {

        @Test
        @DisplayName("returns zero stats when no reviews")
        void returnsZeroWhenNoReviews() {
            when(reviewRepository.findByIsDeletedFalseOrderByCreatedAtDesc(any()))
                    .thenReturn(new PageImpl<>(List.of()));

            ReviewStatsResponse result = analyticsService.getOverallStats();

            assertThat(result.getTotalReviews()).isEqualTo(0L);
            assertThat(result.getAverageRating()).isEqualTo(0.0);
        }

        @Test
        @DisplayName("calculates average rating from reviews")
        void calculatesAverage() {
            Review r1 = buildReview(4, Review.SentimentType.POSITIVE);
            Review r2 = buildReview(2, Review.SentimentType.NEGATIVE);
            when(reviewRepository.findByIsDeletedFalseOrderByCreatedAtDesc(any()))
                    .thenReturn(new PageImpl<>(List.of(r1, r2)));

            ReviewStatsResponse result = analyticsService.getOverallStats();

            assertThat(result.getTotalReviews()).isEqualTo(2L);
            assertThat(result.getAverageRating()).isEqualTo(3.0);
        }

        @Test
        @DisplayName("counts positive, neutral, and negative reviews by sentiment")
        void countsBySentiment() {
            Review pos = buildReview(5, Review.SentimentType.POSITIVE);
            Review neg = buildReview(1, Review.SentimentType.NEGATIVE);
            Review neu = buildReview(3, Review.SentimentType.NEUTRAL);
            when(reviewRepository.findByIsDeletedFalseOrderByCreatedAtDesc(any()))
                    .thenReturn(new PageImpl<>(List.of(pos, neg, neu)));

            ReviewStatsResponse result = analyticsService.getOverallStats();

            assertThat(result.getPositiveReviews()).isEqualTo(1L);
            assertThat(result.getNegativeReviews()).isEqualTo(1L);
            assertThat(result.getNeutralReviews()).isEqualTo(1L);
        }

        @Test
        @DisplayName("calculates sub-ratings (food, service, delivery) when present")
        void calculatesSubRatings() {
            Review r = buildReview(4, Review.SentimentType.POSITIVE);
            r.setFoodQualityRating(5);
            r.setServiceRating(4);
            r.setDeliveryRating(3);
            when(reviewRepository.findByIsDeletedFalseOrderByCreatedAtDesc(any()))
                    .thenReturn(new PageImpl<>(List.of(r)));

            ReviewStatsResponse result = analyticsService.getOverallStats();

            assertThat(result.getAverageFoodQualityRating()).isEqualTo(5.0);
            assertThat(result.getAverageServiceRating()).isEqualTo(4.0);
            assertThat(result.getAverageDeliveryRating()).isEqualTo(3.0);
        }

        @Test
        @DisplayName("returns STABLE trend when recent and overall rating are similar")
        void returnStableTrend() {
            Review r = buildReview(4, Review.SentimentType.POSITIVE);
            r.setCreatedAt(LocalDateTime.now().minusDays(5));
            when(reviewRepository.findByIsDeletedFalseOrderByCreatedAtDesc(any()))
                    .thenReturn(new PageImpl<>(List.of(r)));

            ReviewStatsResponse result = analyticsService.getOverallStats();

            assertThat(result.getTrendDirection()).isEqualTo("STABLE");
        }
    }

    @Nested
    @DisplayName("getDriverRating")
    class GetDriverRating {

        @Test
        @DisplayName("returns zero stats when driver has no reviews")
        void returnsZeroWhenNoReviews() {
            when(reviewRepository.findByDriverIdAndIsDeletedFalseAndDriverRatingIsNotNull("driver-1"))
                    .thenReturn(List.of());

            DriverRatingResponse result = analyticsService.getDriverRating("driver-1");

            assertThat(result.getDriverId()).isEqualTo("driver-1");
            assertThat(result.getTotalReviews()).isEqualTo(0L);
            assertThat(result.getAverageRating()).isEqualTo(0.0);
        }

        @Test
        @DisplayName("calculates average driver rating correctly")
        void calculatesAverage() {
            Review r1 = buildReviewWithDriverRating("driver-1", "John", 5);
            Review r2 = buildReviewWithDriverRating("driver-1", "John", 3);
            when(reviewRepository.findByDriverIdAndIsDeletedFalseAndDriverRatingIsNotNull("driver-1"))
                    .thenReturn(List.of(r1, r2));

            DriverRatingResponse result = analyticsService.getDriverRating("driver-1");

            assertThat(result.getTotalReviews()).isEqualTo(2L);
            assertThat(result.getAverageRating()).isEqualTo(4.0);
            assertThat(result.getDriverName()).isEqualTo("John");
        }

        @Test
        @DisplayName("counts positive (>=4) and negative (<=2) reviews")
        void countsPositiveAndNegative() {
            Review pos = buildReviewWithDriverRating("driver-1", "John", 5);
            Review neg = buildReviewWithDriverRating("driver-1", "John", 2);
            Review mid = buildReviewWithDriverRating("driver-1", "John", 3);
            when(reviewRepository.findByDriverIdAndIsDeletedFalseAndDriverRatingIsNotNull("driver-1"))
                    .thenReturn(List.of(pos, neg, mid));

            DriverRatingResponse result = analyticsService.getDriverRating("driver-1");

            assertThat(result.getPositiveReviews()).isEqualTo(1L);
            assertThat(result.getNegativeReviews()).isEqualTo(1L);
        }

        @Test
        @DisplayName("returns IMPROVING trend when recent rating is much higher")
        void returnsImprovingTrend() {
            Review old = buildReviewWithDriverRating("driver-1", "John", 2);
            old.setCreatedAt(LocalDateTime.now().minusDays(60));
            Review recent = buildReviewWithDriverRating("driver-1", "John", 5);
            recent.setCreatedAt(LocalDateTime.now().minusDays(5));
            when(reviewRepository.findByDriverIdAndIsDeletedFalseAndDriverRatingIsNotNull("driver-1"))
                    .thenReturn(List.of(old, recent));

            DriverRatingResponse result = analyticsService.getDriverRating("driver-1");

            assertThat(result.getPerformanceTrend()).isEqualTo("IMPROVING");
        }

        @Test
        @DisplayName("returns DECLINING trend when recent rating is much lower")
        void returnsDecliningTrend() {
            Review old = buildReviewWithDriverRating("driver-1", "John", 5);
            old.setCreatedAt(LocalDateTime.now().minusDays(60));
            Review recent = buildReviewWithDriverRating("driver-1", "John", 1);
            recent.setCreatedAt(LocalDateTime.now().minusDays(5));
            when(reviewRepository.findByDriverIdAndIsDeletedFalseAndDriverRatingIsNotNull("driver-1"))
                    .thenReturn(List.of(old, recent));

            DriverRatingResponse result = analyticsService.getDriverRating("driver-1");

            assertThat(result.getPerformanceTrend()).isEqualTo("DECLINING");
        }
    }

    @Nested
    @DisplayName("getItemRating")
    class GetItemRating {

        @Test
        @DisplayName("returns zero stats when no item reviews found")
        void returnsZeroWhenNoReviews() {
            when(reviewRepository.findByMenuItemId("item-1")).thenReturn(List.of());

            ItemRatingResponse result = analyticsService.getItemRating("item-1");

            assertThat(result.getMenuItemId()).isEqualTo("item-1");
            assertThat(result.getTotalReviews()).isEqualTo(0L);
            assertThat(result.getAverageRating()).isEqualTo(0.0);
        }

        @Test
        @DisplayName("calculates item average rating from item reviews")
        void calculatesAverageRating() {
            Review.ItemReview ir1 = new Review.ItemReview();
            ir1.setMenuItemId("item-1");
            ir1.setMenuItemName("Burger");
            ir1.setRating(5);

            Review.ItemReview ir2 = new Review.ItemReview();
            ir2.setMenuItemId("item-1");
            ir2.setMenuItemName("Burger");
            ir2.setRating(3);

            Review r = buildReview(4, Review.SentimentType.POSITIVE);
            r.setItemReviews(List.of(ir1, ir2));

            when(reviewRepository.findByMenuItemId("item-1")).thenReturn(List.of(r));
            when(sentimentAnalysisService.extractCommonThemes(any())).thenReturn(List.of());

            ItemRatingResponse result = analyticsService.getItemRating("item-1");

            assertThat(result.getTotalReviews()).isEqualTo(2L);
            assertThat(result.getAverageRating()).isEqualTo(4.0);
            assertThat(result.getMenuItemName()).isEqualTo("Burger");
        }

        @Test
        @DisplayName("counts positive (>=4), negative (<=2), and neutral reviews")
        void countsReviewBreakdown() {
            Review.ItemReview pos = new Review.ItemReview();
            pos.setMenuItemId("item-1");
            pos.setMenuItemName("Pizza");
            pos.setRating(5);

            Review.ItemReview neg = new Review.ItemReview();
            neg.setMenuItemId("item-1");
            neg.setMenuItemName("Pizza");
            neg.setRating(1);

            Review.ItemReview mid = new Review.ItemReview();
            mid.setMenuItemId("item-1");
            mid.setMenuItemName("Pizza");
            mid.setRating(3);

            Review r = buildReview(3, Review.SentimentType.NEUTRAL);
            r.setItemReviews(List.of(pos, neg, mid));

            when(reviewRepository.findByMenuItemId("item-1")).thenReturn(List.of(r));
            when(sentimentAnalysisService.extractCommonThemes(any())).thenReturn(List.of());

            ItemRatingResponse result = analyticsService.getItemRating("item-1");

            assertThat(result.getPositiveReviews()).isEqualTo(1L);
            assertThat(result.getNegativeReviews()).isEqualTo(1L);
            assertThat(result.getNeutralReviews()).isEqualTo(1L);
        }

        @Test
        @DisplayName("delegates theme extraction to SentimentAnalysisService")
        void delegatesThemeExtraction() {
            Review.ItemReview ir = new Review.ItemReview();
            ir.setMenuItemId("item-1");
            ir.setMenuItemName("Sushi");
            ir.setRating(4);
            ir.setComment("Excellent quality fresh fish");

            Review r = buildReview(4, Review.SentimentType.POSITIVE);
            r.setItemReviews(List.of(ir));

            when(reviewRepository.findByMenuItemId("item-1")).thenReturn(List.of(r));
            when(sentimentAnalysisService.extractCommonThemes(any())).thenReturn(List.of("Food Quality"));

            ItemRatingResponse result = analyticsService.getItemRating("item-1");

            // Called once for praise comments (rating >= 4) and once for complaint comments (rating <= 2)
            verify(sentimentAnalysisService).extractCommonThemes(List.of("Excellent quality fresh fish"));
            verify(sentimentAnalysisService).extractCommonThemes(List.of());
            assertThat(result.getCommonPraises()).containsExactly("Food Quality");
        }
    }
}
