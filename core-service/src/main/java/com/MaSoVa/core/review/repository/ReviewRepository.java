package com.MaSoVa.core.review.repository;

import com.MaSoVa.core.review.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.Aggregation;
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

    // Count queries
    Long countByDriverIdAndIsDeletedFalseAndDriverRatingIsNotNull(String driverId);
    Long countByCustomerIdAndIsDeletedFalse(String customerId);

    @Query(value = "{ 'itemReviews.menuItemId': ?0, 'isDeleted': false }", count = true)
    Long countByMenuItemId(String menuItemId);

    // Verified purchases
    Page<Review> findByIsVerifiedPurchaseTrueAndIsDeletedFalseOrderByCreatedAtDesc(Pageable pageable);

    // Week 4: Store-aware queries for proper data isolation
    List<Review> findByStoreIdAndCreatedAtBetweenAndIsDeletedFalse(
            String storeId,
            LocalDateTime startDate,
            LocalDateTime endDate
    );

    List<Review> findByStoreIdAndSentimentAndIsDeletedFalse(String storeId, Review.SentimentType sentiment);

    Long countByStoreIdAndSentimentAndIsDeletedFalse(String storeId, Review.SentimentType sentiment);

    Page<Review> findByStoreIdAndStatusAndIsDeletedFalse(String storeId, Review.ReviewStatus status, Pageable pageable);

    Page<Review> findByStoreIdAndIsDeletedFalseOrderByCreatedAtDesc(String storeId, Pageable pageable);

    @Query("{ 'storeId': ?0, 'responseId': null, 'overallRating': { $lte: 3 }, 'status': 'APPROVED', 'isDeleted': false }")
    Page<Review> findByStoreIdReviewsNeedingResponse(String storeId, Pageable pageable);

    // Staff rating queries
    List<Review> findByStaffIdAndIsDeletedFalseAndStaffRatingIsNotNull(String staffId);
    Page<Review> findByStaffIdAndIsDeletedFalseAndStaffRatingIsNotNull(String staffId, Pageable pageable);
    Long countByStaffIdAndIsDeletedFalseAndStaffRatingIsNotNull(String staffId);

    // Staff average rating aggregation
    @Aggregation(pipeline = {
        "{ $match: { 'staffId': ?0, 'staffRating': { $exists: true, $ne: null }, 'isDeleted': false } }",
        "{ $group: { _id: null, avgRating: { $avg: '$staffRating' }, totalReviews: { $sum: 1 }, staffName: { $first: '$staffName' } } }"
    })
    List<StaffRatingAggregation> getStaffAverageRating(String staffId);

    // Inner interface for aggregation result
    interface StaffRatingAggregation {
        Double getAvgRating();
        Long getTotalReviews();
        String getStaffName();
    }
}
