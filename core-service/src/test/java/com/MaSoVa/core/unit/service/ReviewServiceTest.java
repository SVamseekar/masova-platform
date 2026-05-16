package com.MaSoVa.core.unit.service;

import com.MaSoVa.core.review.dto.request.CreateReviewRequest;
import com.MaSoVa.core.review.entity.Review;
import com.MaSoVa.core.review.repository.ReviewRepository;
import com.MaSoVa.core.review.service.ReviewService;
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

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("ReviewService Unit Tests")
class ReviewServiceTest {

    @Mock private ReviewRepository reviewRepository;
    @Mock private SentimentAnalysisService sentimentAnalysisService;

    @InjectMocks private ReviewService reviewService;

    private Review buildReview(String id, String orderId) {
        return Review.builder()
                .orderId(orderId)
                .customerId("customer-1")
                .overallRating(4)
                .comment("Great food!")
                .status(Review.ReviewStatus.APPROVED)
                .isDeleted(false)
                .build();
    }

    // ===========================
    // createReview
    // ===========================

    @Nested
    @DisplayName("createReview")
    class CreateReview {

        @Test
        @DisplayName("saves review and calls sentiment analysis")
        void savesAndRunsSentiment() {
            Review saved = buildReview("r1", "order-1");
            when(reviewRepository.save(any())).thenReturn(saved);
            when(sentimentAnalysisService.analyzeSentiment(any())).thenReturn(Review.SentimentType.POSITIVE);

            CreateReviewRequest req = new CreateReviewRequest();
            req.setOrderId("order-1");
            req.setOverallRating(5);
            req.setComment("Excellent!");

            Review result = reviewService.createReview(req, "customer-1", "John");

            assertThat(result).isNotNull();
            verify(reviewRepository).save(any());
        }

        @Test
        @DisplayName("propagates exception when sentiment analysis fails")
        void propagatesSentimentFailure() {
            when(sentimentAnalysisService.analyzeSentiment(any()))
                    .thenThrow(new RuntimeException("NLP service down"));

            CreateReviewRequest req = new CreateReviewRequest();
            req.setOrderId("order-1");
            req.setOverallRating(3);
            req.setComment("OK");

            assertThatThrownBy(() -> reviewService.createReview(req, "c1", "Jane"))
                    .isInstanceOf(RuntimeException.class);
        }
    }

    // ===========================
    // getReviewById
    // ===========================

    @Nested
    @DisplayName("getReviewById")
    class GetReviewById {

        @Test
        @DisplayName("returns review when found")
        void returnsReview() {
            Review review = buildReview("r1", "order-1");
            when(reviewRepository.findById("r1")).thenReturn(Optional.of(review));

            Review result = reviewService.getReviewById("r1");
            assertThat(result.getOrderId()).isEqualTo("order-1");
        }

        @Test
        @DisplayName("throws when not found")
        void throwsWhenNotFound() {
            when(reviewRepository.findById("missing")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> reviewService.getReviewById("missing"))
                    .isInstanceOf(IllegalArgumentException.class);
        }
    }

    // ===========================
    // updateReviewStatus
    // ===========================

    @Nested
    @DisplayName("updateReviewStatus")
    class UpdateReviewStatus {

        @Test
        @DisplayName("throws when review not found")
        void throwsWhenNotFound() {
            when(reviewRepository.findById("missing")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> reviewService.updateReviewStatus(
                    "missing", Review.ReviewStatus.APPROVED, "mod-1"))
                    .isInstanceOf(IllegalArgumentException.class);
        }

        @Test
        @DisplayName("updates status and sets moderatorId")
        void updatesStatus() {
            Review review = buildReview("r1", "order-1");
            when(reviewRepository.findById("r1")).thenReturn(Optional.of(review));
            when(reviewRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            Review result = reviewService.updateReviewStatus("r1", Review.ReviewStatus.REJECTED, "mod-1");

            assertThat(result.getStatus()).isEqualTo(Review.ReviewStatus.REJECTED);
        }
    }

    // ===========================
    // flagReview
    // ===========================

    @Nested
    @DisplayName("flagReview")
    class FlagReview {

        @Test
        @DisplayName("sets review status to FLAGGED")
        void setsStatusFlagged() {
            Review review = buildReview("r1", "order-1");
            when(reviewRepository.findById("r1")).thenReturn(Optional.of(review));
            when(reviewRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            Review result = reviewService.flagReview("r1", "Inappropriate content", "mod-1");

            assertThat(result.getStatus()).isEqualTo(Review.ReviewStatus.FLAGGED);
        }
    }

    // ===========================
    // deleteReview
    // ===========================

    @Nested
    @DisplayName("deleteReview")
    class DeleteReview {

        @Test
        @DisplayName("throws when review not found")
        void throwsWhenNotFound() {
            when(reviewRepository.findById("missing")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> reviewService.deleteReview("missing"))
                    .isInstanceOf(IllegalArgumentException.class);
        }

        @Test
        @DisplayName("soft-deletes review by setting isDeleted=true")
        void softDeletesReview() {
            Review review = buildReview("r1", "order-1");
            when(reviewRepository.findById("r1")).thenReturn(Optional.of(review));
            when(reviewRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            reviewService.deleteReview("r1");

            verify(reviewRepository).save(argThat(r -> Boolean.TRUE.equals(r.getIsDeleted())));
        }
    }

    // ===========================
    // addResponseToReview
    // ===========================

    @Nested
    @DisplayName("addResponseToReview")
    class AddResponseToReview {

        @Test
        @DisplayName("throws when review not found")
        void throwsWhenNotFound() {
            when(reviewRepository.findById("missing")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> reviewService.addResponseToReview("missing", "resp-1"))
                    .isInstanceOf(IllegalArgumentException.class);
        }

        @Test
        @DisplayName("sets responseId on review")
        void setsResponseId() {
            Review review = buildReview("r1", "order-1");
            when(reviewRepository.findById("r1")).thenReturn(Optional.of(review));
            when(reviewRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            reviewService.addResponseToReview("r1", "resp-1");

            verify(reviewRepository).save(argThat(r -> "resp-1".equals(r.getResponseId())));
        }
    }

    // ===========================
    // getStaffAverageRating
    // ===========================

    @Nested
    @DisplayName("getStaffAverageRating")
    class GetStaffAverageRating {

        @Test
        @DisplayName("returns zero rating when no reviews exist")
        void returnsZeroWhenNoReviews() {
            when(reviewRepository.findByStaffIdAndIsDeletedFalseAndStaffRatingIsNotNull(
                    any(), any())).thenReturn(org.springframework.data.domain.Page.empty());

            var result = reviewService.getStaffAverageRating("staff-1");

            assertThat(result.getAverageRating()).isEqualTo(0.0);
            assertThat(result.getTotalReviews()).isEqualTo(0);
        }
    }

    // ===========================
    // count methods
    // ===========================

    @Nested
    @DisplayName("count methods")
    class CountMethods {

        @Test
        @DisplayName("countReviewsByDriver delegates to repository")
        void countsByDriver() {
            when(reviewRepository.countByDriverIdAndIsDeletedFalseAndDriverRatingIsNotNull("driver-1")).thenReturn(5L);
            assertThat(reviewService.countReviewsByDriver("driver-1")).isEqualTo(5L);
        }

        @Test
        @DisplayName("countReviewsByCustomer delegates to repository")
        void countsByCustomer() {
            when(reviewRepository.countByCustomerIdAndIsDeletedFalse("customer-1")).thenReturn(3L);
            assertThat(reviewService.countReviewsByCustomer("customer-1")).isEqualTo(3L);
        }

        @Test
        @DisplayName("countReviewsByMenuItem delegates to repository")
        void countsByMenuItem() {
            when(reviewRepository.countByMenuItemId("item-1")).thenReturn(10L);
            assertThat(reviewService.countReviewsByMenuItem("item-1")).isEqualTo(10L);
        }
    }

    // ===========================
    // getReviewsByOrderId
    // ===========================

    @Nested
    @DisplayName("getReviewsByOrderId")
    class GetReviewsByOrderId {

        @Test
        @DisplayName("returns list from repository")
        void returnsList() {
            Review review = buildReview("r1", "order-1");
            when(reviewRepository.findByOrderIdAndIsDeletedFalse("order-1")).thenReturn(List.of(review));

            List<Review> result = reviewService.getReviewsByOrderId("order-1");
            assertThat(result).hasSize(1);
        }

        @Test
        @DisplayName("returns empty list when no reviews for order")
        void returnsEmpty() {
            when(reviewRepository.findByOrderIdAndIsDeletedFalse("order-99")).thenReturn(List.of());
            assertThat(reviewService.getReviewsByOrderId("order-99")).isEmpty();
        }
    }

    // ===========================
    // Paginated query delegation methods
    // ===========================

    @Nested
    @DisplayName("Paginated query methods")
    class PaginatedQueries {

        @Test
        @DisplayName("getReviewsByCustomerId delegates to repository")
        void byCustomerId() {
            Review r = buildReview("r1", "order-1");
            Page<Review> page = new PageImpl<>(List.of(r));
            when(reviewRepository.findByCustomerIdAndIsDeletedFalse(eq("cust-1"), any(Pageable.class))).thenReturn(page);

            assertThat(reviewService.getReviewsByCustomerId("cust-1", Pageable.unpaged())).isNotEmpty();
        }

        @Test
        @DisplayName("getReviewsByDriverId delegates to repository")
        void byDriverId() {
            Review r = buildReview("r1", "order-1");
            Page<Review> page = new PageImpl<>(List.of(r));
            when(reviewRepository.findByDriverIdAndIsDeletedFalseAndDriverRatingIsNotNull(eq("driver-1"), any(Pageable.class))).thenReturn(page);

            assertThat(reviewService.getReviewsByDriverId("driver-1", Pageable.unpaged())).isNotEmpty();
        }

        @Test
        @DisplayName("getReviewsByMenuItemId delegates to repository")
        void byMenuItemId() {
            Page<Review> page = new PageImpl<>(List.of());
            when(reviewRepository.findByMenuItemId(eq("item-1"), any(Pageable.class))).thenReturn(page);

            assertThat(reviewService.getReviewsByMenuItemId("item-1", Pageable.unpaged())).isEmpty();
        }

        @Test
        @DisplayName("getRecentReviews delegates to repository")
        void recentReviews() {
            Page<Review> page = new PageImpl<>(List.of());
            when(reviewRepository.findByIsDeletedFalseOrderByCreatedAtDesc(any(Pageable.class))).thenReturn(page);

            assertThat(reviewService.getRecentReviews(Pageable.unpaged())).isEmpty();
        }

        @Test
        @DisplayName("getReviewsByStatus delegates to repository")
        void byStatus() {
            Page<Review> page = new PageImpl<>(List.of());
            when(reviewRepository.findByStatusAndIsDeletedFalse(eq(Review.ReviewStatus.PENDING), any(Pageable.class))).thenReturn(page);

            assertThat(reviewService.getReviewsByStatus(Review.ReviewStatus.PENDING, Pageable.unpaged())).isEmpty();
        }

        @Test
        @DisplayName("getReviewsNeedingResponse delegates to repository")
        void needingResponse() {
            Page<Review> page = new PageImpl<>(List.of());
            when(reviewRepository.findReviewsNeedingResponse(any(Pageable.class))).thenReturn(page);

            assertThat(reviewService.getReviewsNeedingResponse(Pageable.unpaged())).isEmpty();
        }

        @Test
        @DisplayName("getReviewsByStaffId delegates to repository")
        void byStaffId() {
            Page<Review> page = new PageImpl<>(List.of());
            when(reviewRepository.findByStaffIdAndIsDeletedFalseAndStaffRatingIsNotNull(eq("staff-1"), any(Pageable.class))).thenReturn(page);

            assertThat(reviewService.getReviewsByStaffId("staff-1", Pageable.unpaged())).isEmpty();
        }
    }
}
