package com.MaSoVa.core.review.service;

import com.MaSoVa.core.review.dto.request.CreateReviewRequest;
import com.MaSoVa.core.review.entity.Review;
import com.MaSoVa.core.review.repository.ReviewRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ReviewService {

    private static final Logger log = LoggerFactory.getLogger(ReviewService.class);

    private final ReviewRepository reviewRepository;
    private final SentimentAnalysisService sentimentAnalysisService;

    public ReviewService(ReviewRepository reviewRepository, SentimentAnalysisService sentimentAnalysisService) {
        this.reviewRepository = reviewRepository;
        this.sentimentAnalysisService = sentimentAnalysisService;
    }

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

    public Long countReviewsByDriver(String driverId) {
        return reviewRepository.countByDriverIdAndIsDeletedFalseAndDriverRatingIsNotNull(driverId);
    }

    public Long countReviewsByCustomer(String customerId) {
        return reviewRepository.countByCustomerIdAndIsDeletedFalse(customerId);
    }

    public Long countReviewsByMenuItem(String menuItemId) {
        return reviewRepository.countByMenuItemId(menuItemId);
    }

    public com.MaSoVa.core.review.dto.StaffRatingDTO getStaffAverageRating(String staffId) {
        List<com.MaSoVa.core.review.repository.ReviewRepository.StaffRatingAggregation> results =
            reviewRepository.getStaffAverageRating(staffId);

        if (results.isEmpty()) {
            // No ratings found for this staff member
            return new com.MaSoVa.core.review.dto.StaffRatingDTO(staffId, null, 0.0, 0L);
        }

        com.MaSoVa.core.review.repository.ReviewRepository.StaffRatingAggregation result = results.get(0);
        return new com.MaSoVa.core.review.dto.StaffRatingDTO(
            staffId,
            result.getStaffName(),
            result.getAvgRating() != null ? result.getAvgRating() : 0.0,
            result.getTotalReviews() != null ? result.getTotalReviews() : 0L
        );
    }

    public Page<Review> getReviewsByStaffId(String staffId, Pageable pageable) {
        return reviewRepository.findByStaffIdAndIsDeletedFalseAndStaffRatingIsNotNull(staffId, pageable);
    }

    /**
     * Create review via public token (SMS/Email link)
     * Validates token with Order Service and creates anonymous review
     */
    @Transactional
    public Review createPublicReview(CreateReviewRequest request, String token) {
        log.info("Creating public review via token for order: {}", request.getOrderId());

        // Call Order Service to validate token and get customer details
        // For now, we'll create a simple HTTP client call
        try {
            // TODO: Make HTTP call to Order Service: GET /api/orders/rating-token/{token}
            // This should return: orderId, customerId, customerName, driverId, isValid

            // For now, we'll just check if order already has a review
            List<Review> existingReviews = reviewRepository.findByOrderIdAndIsDeletedFalse(request.getOrderId());
            if (!existingReviews.isEmpty()) {
                throw new IllegalStateException("This order has already been rated. Thank you!");
            }

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

            // Create review (anonymous)
            Review review = Review.builder()
                    .orderId(request.getOrderId())
                    .customerId("anonymous") // Will be updated by Order Service validation
                    .customerName("Customer") // Will be updated by Order Service validation
                    .overallRating(request.getOverallRating())
                    .comment(request.getComment())
                    .foodQualityRating(request.getFoodQualityRating())
                    .serviceRating(request.getServiceRating())
                    .deliveryRating(request.getDeliveryRating())
                    .driverId(request.getDriverId())
                    .driverRating(request.getDriverRating())
                    .driverComment(request.getDriverComment())
                    .itemReviews(itemReviews)
                    .isAnonymous(true) // Always anonymous for public submissions
                    .isVerifiedPurchase(true)
                    .photoUrls(request.getPhotoUrls() != null ? request.getPhotoUrls() : new ArrayList<>())
                    .status(Review.ReviewStatus.APPROVED)
                    .sentiment(sentiment)
                    .sentimentScore(sentimentScore)
                    .isDeleted(false)
                    .build();

            review = reviewRepository.save(review);
            log.info("Public review created successfully with ID: {}", review.getId());

            // TODO: Call Order Service to mark token as used

            return review;
        } catch (Exception e) {
            log.error("Error creating public review", e);
            throw e;
        }
    }

    /**
     * Get token details for displaying on rating page
     */
    public java.util.Map<String, Object> getTokenDetails(String token) {
        // TODO: Call Order Service to validate and get token details
        // For now, return minimal info
        java.util.Map<String, Object> details = new java.util.HashMap<>();
        details.put("valid", true);
        details.put("message", "Please rate your recent order");
        return details;
    }
}
