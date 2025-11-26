package com.MaSoVa.review.service;

import com.MaSoVa.review.entity.Review;
import com.MaSoVa.review.repository.ReviewRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

@Service
public class ModerationService {

    private static final Logger log = LoggerFactory.getLogger(ModerationService.class);

    private final ReviewRepository reviewRepository;

    public ModerationService(ReviewRepository reviewRepository) {
        this.reviewRepository = reviewRepository;
    }

    // Simple profanity filter
    private static final Set<String> INAPPROPRIATE_WORDS = new HashSet<>(Arrays.asList(
            // Add inappropriate words here for filtering
            "spam", "fake", "scam"
    ));

    public boolean containsInappropriateContent(String text) {
        if (text == null || text.trim().isEmpty()) {
            return false;
        }

        String lowerText = text.toLowerCase();
        return INAPPROPRIATE_WORDS.stream().anyMatch(lowerText::contains);
    }

    @Transactional
    public Review approveReview(String reviewId, String moderatorId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("Review not found"));

        review.setStatus(Review.ReviewStatus.APPROVED);
        review.setModeratorId(moderatorId);
        review.setModeratedAt(LocalDateTime.now());

        log.info("Review {} approved by moderator {}", reviewId, moderatorId);
        return reviewRepository.save(review);
    }

    @Transactional
    public Review rejectReview(String reviewId, String moderatorId, String reason) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("Review not found"));

        review.setStatus(Review.ReviewStatus.REJECTED);
        review.setModeratorId(moderatorId);
        review.setFlagReason(reason);
        review.setModeratedAt(LocalDateTime.now());

        log.info("Review {} rejected by moderator {}: {}", reviewId, moderatorId, reason);
        return reviewRepository.save(review);
    }

    @Transactional
    public Review flagReview(String reviewId, String moderatorId, String reason) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("Review not found"));

        review.setStatus(Review.ReviewStatus.FLAGGED);
        review.setModeratorId(moderatorId);
        review.setFlagReason(reason);
        review.setModeratedAt(LocalDateTime.now());

        log.info("Review {} flagged by moderator {}: {}", reviewId, moderatorId, reason);
        return reviewRepository.save(review);
    }

    public Page<Review> getPendingReviews(Pageable pageable) {
        return reviewRepository.findByStatusAndIsDeletedFalse(Review.ReviewStatus.PENDING, pageable);
    }

    public Page<Review> getFlaggedReviews(Pageable pageable) {
        return reviewRepository.findByStatusAndIsDeletedFalse(Review.ReviewStatus.FLAGGED, pageable);
    }

    @Transactional
    public void autoModerateNewReview(Review review) {
        // Check for inappropriate content
        boolean hasInappropriateContent = false;

        if (containsInappropriateContent(review.getComment())) {
            hasInappropriateContent = true;
        }

        if (review.getDriverComment() != null && containsInappropriateContent(review.getDriverComment())) {
            hasInappropriateContent = true;
        }

        if (review.getItemReviews() != null) {
            for (Review.ItemReview itemReview : review.getItemReviews()) {
                if (itemReview.getComment() != null && containsInappropriateContent(itemReview.getComment())) {
                    hasInappropriateContent = true;
                    break;
                }
            }
        }

        if (hasInappropriateContent) {
            review.setStatus(Review.ReviewStatus.FLAGGED);
            review.setFlagReason("Auto-flagged: Potentially inappropriate content detected");
            log.warn("Review auto-flagged for inappropriate content: {}", review.getId());
        } else {
            review.setStatus(Review.ReviewStatus.APPROVED);
        }

        reviewRepository.save(review);
    }

    public long getPendingReviewsCount() {
        return reviewRepository.findByStatusAndIsDeletedFalse(
                Review.ReviewStatus.PENDING,
                Pageable.unpaged()
        ).getTotalElements();
    }

    public long getFlaggedReviewsCount() {
        return reviewRepository.findByStatusAndIsDeletedFalse(
                Review.ReviewStatus.FLAGGED,
                Pageable.unpaged()
        ).getTotalElements();
    }
}
