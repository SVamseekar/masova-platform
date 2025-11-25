package com.MaSoVa.review.service;

import com.MaSoVa.review.dto.request.CreateReviewRequest;
import com.MaSoVa.review.entity.Review;
import com.MaSoVa.review.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final SentimentAnalysisService sentimentAnalysisService;

    @Transactional
    public Review createReview(CreateReviewRequest request, String customerId, String customerName) {
        log.info("Creating review for order: {} by customer: {}", request.getOrderId(), customerId);

        // Check if customer already reviewed this order
        reviewRepository.findByOrderIdAndCustomerIdAndIsDeletedFalse(request.getOrderId(), customerId)
                .ifPresent(existing -> {
                    throw new IllegalStateException("You have already reviewed this order");
                });

        // Build item reviews
        List<Review.ItemReview> itemReviews = new ArrayList<>();
        if (request.getItemReviews() != null) {
            itemReviews = request.getItemReviews().stream()
                    .map(ir -> Review.ItemReview.builder()
                            .menuItemId(ir.getMenuItemId())
                            .rating(ir.getRating())
                            .comment(ir.getComment())
                            .build())
                    .collect(Collectors.toList());
        }

        // Analyze sentiment
        Review.SentimentType sentiment = sentimentAnalysisService.analyzeSentiment(request.getComment());
        Double sentimentScore = sentimentAnalysisService.calculateSentimentScore(request.getComment());

        // Create review
        Review review = Review.builder()
                .orderId(request.getOrderId())
                .customerId(customerId)
                .customerName(customerName)
                .overallRating(request.getOverallRating())
                .comment(request.getComment())
                .foodQualityRating(request.getFoodQualityRating())
                .serviceRating(request.getServiceRating())
                .deliveryRating(request.getDeliveryRating())
                .driverId(request.getDriverId())
                .driverRating(request.getDriverRating())
                .driverComment(request.getDriverComment())
                .itemReviews(itemReviews)
                .isAnonymous(request.getIsAnonymous() != null ? request.getIsAnonymous() : false)
                .isVerifiedPurchase(true)
                .photoUrls(request.getPhotoUrls() != null ? request.getPhotoUrls() : new ArrayList<>())
                .status(Review.ReviewStatus.APPROVED) // Auto-approve for now
                .sentiment(sentiment)
                .sentimentScore(sentimentScore)
                .isDeleted(false)
                .build();

        review = reviewRepository.save(review);
        log.info("Review created successfully with ID: {}", review.getId());

        return review;
    }

    public Review getReviewById(String reviewId) {
        return reviewRepository.findById(reviewId)
                .filter(review -> !review.getIsDeleted())
                .orElseThrow(() -> new IllegalArgumentException("Review not found with ID: " + reviewId));
    }

    public List<Review> getReviewsByOrderId(String orderId) {
        return reviewRepository.findByOrderIdAndIsDeletedFalse(orderId);
    }

    public Page<Review> getReviewsByCustomerId(String customerId, Pageable pageable) {
        return reviewRepository.findByCustomerIdAndIsDeletedFalse(customerId, pageable);
    }

    public Page<Review> getReviewsByDriverId(String driverId, Pageable pageable) {
        return reviewRepository.findByDriverIdAndIsDeletedFalseAndDriverRatingIsNotNull(driverId, pageable);
    }

    public Page<Review> getReviewsByMenuItemId(String menuItemId, Pageable pageable) {
        return reviewRepository.findByMenuItemId(menuItemId, pageable);
    }

    public Page<Review> getRecentReviews(Pageable pageable) {
        return reviewRepository.findByIsDeletedFalseOrderByCreatedAtDesc(pageable);
    }

    public Page<Review> getReviewsByRating(Integer minRating, Integer maxRating, Pageable pageable) {
        return reviewRepository.findByOverallRatingBetweenAndIsDeletedFalse(minRating, maxRating, pageable);
    }

    public Page<Review> getReviewsByStatus(Review.ReviewStatus status, Pageable pageable) {
        return reviewRepository.findByStatusAndIsDeletedFalse(status, pageable);
    }

    public Page<Review> getReviewsNeedingResponse(Pageable pageable) {
        return reviewRepository.findReviewsNeedingResponse(pageable);
    }

    @Transactional
    public Review updateReviewStatus(String reviewId, Review.ReviewStatus newStatus, String moderatorId) {
        Review review = getReviewById(reviewId);
        review.setStatus(newStatus);
        review.setModeratorId(moderatorId);
        review.setModeratedAt(LocalDateTime.now());
        return reviewRepository.save(review);
    }

    @Transactional
    public Review flagReview(String reviewId, String reason, String moderatorId) {
        Review review = getReviewById(reviewId);
        review.setStatus(Review.ReviewStatus.FLAGGED);
        review.setFlagReason(reason);
        review.setModeratorId(moderatorId);
        review.setModeratedAt(LocalDateTime.now());
        return reviewRepository.save(review);
    }

    @Transactional
    public void deleteReview(String reviewId) {
        Review review = getReviewById(reviewId);
        review.setIsDeleted(true);
        reviewRepository.save(review);
        log.info("Review deleted: {}", reviewId);
    }

    @Transactional
    public Review addResponseToReview(String reviewId, String responseId) {
        Review review = getReviewById(reviewId);
        review.setResponseId(responseId);
        return reviewRepository.save(review);
    }

    public List<Review> getReviewsInDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        return reviewRepository.findByCreatedAtBetweenAndIsDeletedFalse(startDate, endDate);
    }

    public Long countReviewsByDriver(String driverId) {
        return reviewRepository.countByDriverIdAndIsDeletedFalseAndDriverRatingIsNotNull(driverId);
    }

    public Long countReviewsByCustomer(String customerId) {
        return reviewRepository.countByCustomerIdAndIsDeletedFalse(customerId);
    }

    public Long countReviewsByMenuItem(String menuItemId) {
        return reviewRepository.countByMenuItemId(menuItemId);
    }
}
