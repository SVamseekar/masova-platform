package com.MaSoVa.review.repository;

import com.MaSoVa.review.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends MongoRepository<Review, String> {

    // Find by order
    List<Review> findByOrderIdAndIsDeletedFalse(String orderId);
    Optional<Review> findByOrderIdAndCustomerIdAndIsDeletedFalse(String orderId, String customerId);

    // Find by customer
    Page<Review> findByCustomerIdAndIsDeletedFalse(String customerId, Pageable pageable);

    // Find by driver
    Page<Review> findByDriverIdAndIsDeletedFalseAndDriverRatingIsNotNull(String driverId, Pageable pageable);
    List<Review> findByDriverIdAndIsDeletedFalseAndDriverRatingIsNotNull(String driverId);

    // Find by menu item
    @Query("{ 'itemReviews.menuItemId': ?0, 'isDeleted': false }")
    Page<Review> findByMenuItemId(String menuItemId, Pageable pageable);

    @Query("{ 'itemReviews.menuItemId': ?0, 'isDeleted': false }")
    List<Review> findByMenuItemId(String menuItemId);

    // Find by status
    Page<Review> findByStatusAndIsDeletedFalse(Review.ReviewStatus status, Pageable pageable);

    // Find by rating range
    Page<Review> findByOverallRatingBetweenAndIsDeletedFalse(Integer minRating, Integer maxRating, Pageable pageable);

    // Find recent reviews
    Page<Review> findByIsDeletedFalseOrderByCreatedAtDesc(Pageable pageable);

    // Find reviews needing response
    @Query("{ 'responseId': null, 'overallRating': { $lte: 3 }, 'status': 'APPROVED', 'isDeleted': false }")
    Page<Review> findReviewsNeedingResponse(Pageable pageable);

    // Find flagged reviews
    Page<Review> findByStatusAndIsDeletedFalse(Review.ReviewStatus status, Pageable pageable);

    // Date range queries
    List<Review> findByCreatedAtBetweenAndIsDeletedFalse(LocalDateTime startDate, LocalDateTime endDate);

    // Count queries
    Long countByDriverIdAndIsDeletedFalseAndDriverRatingIsNotNull(String driverId);
    Long countByCustomerIdAndIsDeletedFalse(String customerId);

    @Query(value = "{ 'itemReviews.menuItemId': ?0, 'isDeleted': false }", count = true)
    Long countByMenuItemId(String menuItemId);

    // Sentiment queries
    List<Review> findBySentimentAndIsDeletedFalse(Review.SentimentType sentiment);
    Long countBySentimentAndIsDeletedFalse(Review.SentimentType sentiment);

    // Verified purchases
    Page<Review> findByIsVerifiedPurchaseTrueAndIsDeletedFalseOrderByCreatedAtDesc(Pageable pageable);
}
