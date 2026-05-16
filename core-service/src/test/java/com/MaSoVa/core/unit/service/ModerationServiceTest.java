package com.MaSoVa.core.unit.service;

import com.MaSoVa.core.review.entity.Review;
import com.MaSoVa.core.review.repository.ReviewRepository;
import com.MaSoVa.core.review.service.ModerationService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("ModerationService Unit Tests")
class ModerationServiceTest {

    @Mock private ReviewRepository reviewRepository;

    @InjectMocks private ModerationService moderationService;

    private Review buildReview(String id) {
        Review r = new Review();
        r.setId(id);
        r.setStatus(Review.ReviewStatus.PENDING);
        r.setIsDeleted(false);
        return r;
    }

    @Nested
    @DisplayName("containsInappropriateContent")
    class ContainsInappropriateContent {

        @Test
        @DisplayName("returns false for null text")
        void returnsFalseForNull() {
            assertThat(moderationService.containsInappropriateContent(null)).isFalse();
        }

        @Test
        @DisplayName("returns false for empty text")
        void returnsFalseForEmpty() {
            assertThat(moderationService.containsInappropriateContent("   ")).isFalse();
        }

        @Test
        @DisplayName("returns true when text contains spam keyword")
        void returnsTrueForSpam() {
            assertThat(moderationService.containsInappropriateContent("This is spam content")).isTrue();
        }

        @Test
        @DisplayName("returns false for clean text")
        void returnsFalseForCleanText() {
            assertThat(moderationService.containsInappropriateContent("Great food, loved it!")).isFalse();
        }
    }

    @Nested
    @DisplayName("approveReview")
    class ApproveReview {

        @Test
        @DisplayName("throws when review not found")
        void throwsWhenNotFound() {
            when(reviewRepository.findById("missing")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> moderationService.approveReview("missing", "mod-1"))
                    .isInstanceOf(IllegalArgumentException.class);
        }

        @Test
        @DisplayName("sets APPROVED status and moderatorId")
        void approvesReview() {
            Review review = buildReview("r1");
            when(reviewRepository.findById("r1")).thenReturn(Optional.of(review));
            when(reviewRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            Review result = moderationService.approveReview("r1", "mod-1");

            assertThat(result.getStatus()).isEqualTo(Review.ReviewStatus.APPROVED);
            assertThat(result.getModeratorId()).isEqualTo("mod-1");
            assertThat(result.getModeratedAt()).isNotNull();
        }
    }

    @Nested
    @DisplayName("rejectReview")
    class RejectReview {

        @Test
        @DisplayName("throws when review not found")
        void throwsWhenNotFound() {
            when(reviewRepository.findById("missing")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> moderationService.rejectReview("missing", "mod-1", "spam"))
                    .isInstanceOf(IllegalArgumentException.class);
        }

        @Test
        @DisplayName("sets REJECTED status with reason")
        void rejectsReview() {
            Review review = buildReview("r1");
            when(reviewRepository.findById("r1")).thenReturn(Optional.of(review));
            when(reviewRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            Review result = moderationService.rejectReview("r1", "mod-1", "spam");

            assertThat(result.getStatus()).isEqualTo(Review.ReviewStatus.REJECTED);
            assertThat(result.getFlagReason()).isEqualTo("spam");
        }
    }

    @Nested
    @DisplayName("flagReview")
    class FlagReview {

        @Test
        @DisplayName("throws when review not found")
        void throwsWhenNotFound() {
            when(reviewRepository.findById("missing")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> moderationService.flagReview("missing", "mod-1", "reason"))
                    .isInstanceOf(IllegalArgumentException.class);
        }

        @Test
        @DisplayName("sets FLAGGED status with reason")
        void flagsReview() {
            Review review = buildReview("r1");
            when(reviewRepository.findById("r1")).thenReturn(Optional.of(review));
            when(reviewRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            Review result = moderationService.flagReview("r1", "mod-1", "offensive");

            assertThat(result.getStatus()).isEqualTo(Review.ReviewStatus.FLAGGED);
            assertThat(result.getFlagReason()).isEqualTo("offensive");
        }
    }

    @Nested
    @DisplayName("autoModerateNewReview")
    class AutoModerate {

        @Test
        @DisplayName("approves review with clean content")
        void approvesCleanReview() {
            Review review = buildReview("r1");
            review.setComment("Excellent food, very tasty!");

            moderationService.autoModerateNewReview(review);

            verify(reviewRepository).save(argThat(r -> r.getStatus() == Review.ReviewStatus.APPROVED));
        }

        @Test
        @DisplayName("flags review containing inappropriate word")
        void flagsInappropriateReview() {
            Review review = buildReview("r1");
            review.setComment("This is spam");

            moderationService.autoModerateNewReview(review);

            verify(reviewRepository).save(argThat(r -> r.getStatus() == Review.ReviewStatus.FLAGGED));
        }

        @Test
        @DisplayName("flags review with inappropriate driver comment")
        void flagsInappropriateDriverComment() {
            Review review = buildReview("r1");
            review.setComment("Good food");
            review.setDriverComment("Fake driver");

            moderationService.autoModerateNewReview(review);

            verify(reviewRepository).save(argThat(r -> r.getStatus() == Review.ReviewStatus.FLAGGED));
        }
    }

    @Nested
    @DisplayName("getPendingReviewsCount and getFlaggedReviewsCount")
    class Counts {

        @Test
        @DisplayName("returns total pending review count")
        void returnsPendingCount() {
            Page<Review> page = new PageImpl<>(List.of(buildReview("r1"), buildReview("r2")));
            when(reviewRepository.findByStatusAndIsDeletedFalse(eq(Review.ReviewStatus.PENDING), any(Pageable.class)))
                    .thenReturn(page);

            assertThat(moderationService.getPendingReviewsCount()).isEqualTo(2L);
        }

        @Test
        @DisplayName("returns total flagged review count")
        void returnsFlaggedCount() {
            Page<Review> page = new PageImpl<>(List.of(buildReview("r1")));
            when(reviewRepository.findByStatusAndIsDeletedFalse(eq(Review.ReviewStatus.FLAGGED), any(Pageable.class)))
                    .thenReturn(page);

            assertThat(moderationService.getFlaggedReviewsCount()).isEqualTo(1L);
        }
    }
}
