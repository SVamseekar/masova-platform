package com.MaSoVa.review.controller;

import com.MaSoVa.review.dto.request.CreateReviewRequest;
import com.MaSoVa.review.dto.request.FlagReviewRequest;
import com.MaSoVa.review.dto.response.DriverRatingResponse;
import com.MaSoVa.review.dto.response.ItemRatingResponse;
import com.MaSoVa.review.dto.response.ReviewStatsResponse;
import com.MaSoVa.review.entity.Review;
import com.MaSoVa.review.service.AnalyticsService;
import com.MaSoVa.review.service.ModerationService;
import com.MaSoVa.review.service.ReviewService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class ReviewController {

    private static final Logger log = LoggerFactory.getLogger(ReviewController.class);

    private final ReviewService reviewService;
    private final AnalyticsService analyticsService;
    private final ModerationService moderationService;

    public ReviewController(ReviewService reviewService, AnalyticsService analyticsService, ModerationService moderationService) {
        this.reviewService = reviewService;
        this.analyticsService = analyticsService;
        this.moderationService = moderationService;
    }

    @PostMapping
    public ResponseEntity<?> createReview(
            @Valid @RequestBody CreateReviewRequest request,
            @RequestHeader("X-User-ID") String customerId,
            @RequestHeader("X-User-Name") String customerName
    ) {
        try {
            Review review = reviewService.createReview(request, customerId, customerName);
            return ResponseEntity.status(HttpStatus.CREATED).body(review);
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error creating review", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to create review"));
        }
    }

    @GetMapping("/{reviewId}")
    public ResponseEntity<?> getReviewById(@PathVariable String reviewId) {
        try {
            Review review = reviewService.getReviewById(reviewId);
            return ResponseEntity.ok(review);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/order/{orderId}")
    public ResponseEntity<List<Review>> getReviewsByOrderId(@PathVariable String orderId) {
        List<Review> reviews = reviewService.getReviewsByOrderId(orderId);
        return ResponseEntity.ok(reviews);
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<Page<Review>> getReviewsByCustomerId(
            @PathVariable String customerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Review> reviews = reviewService.getReviewsByCustomerId(customerId, pageable);
        return ResponseEntity.ok(reviews);
    }

    @GetMapping("/driver/{driverId}")
    public ResponseEntity<Page<Review>> getReviewsByDriverId(
            @PathVariable String driverId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Review> reviews = reviewService.getReviewsByDriverId(driverId, pageable);
        return ResponseEntity.ok(reviews);
    }

    @GetMapping("/item/{menuItemId}")
    public ResponseEntity<Page<Review>> getReviewsByMenuItemId(
            @PathVariable String menuItemId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Review> reviews = reviewService.getReviewsByMenuItemId(menuItemId, pageable);
        return ResponseEntity.ok(reviews);
    }

    @GetMapping("/recent")
    public ResponseEntity<Page<Review>> getRecentReviews(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Review> reviews = reviewService.getRecentReviews(pageable);
        return ResponseEntity.ok(reviews);
    }

    @GetMapping("/rating")
    public ResponseEntity<Page<Review>> getReviewsByRating(
            @RequestParam(defaultValue = "1") Integer minRating,
            @RequestParam(defaultValue = "5") Integer maxRating,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Review> reviews = reviewService.getReviewsByRating(minRating, maxRating, pageable);
        return ResponseEntity.ok(reviews);
    }

    @GetMapping("/needs-response")
    public ResponseEntity<Page<Review>> getReviewsNeedingResponse(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").ascending());
        Page<Review> reviews = reviewService.getReviewsNeedingResponse(pageable);
        return ResponseEntity.ok(reviews);
    }

    @PatchMapping("/{reviewId}/flag")
    public ResponseEntity<?> flagReview(
            @PathVariable String reviewId,
            @Valid @RequestBody FlagReviewRequest request,
            @RequestHeader("X-User-ID") String moderatorId
    ) {
        try {
            Review review = reviewService.flagReview(reviewId, request.getReason(), moderatorId);
            return ResponseEntity.ok(review);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error flagging review", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to flag review"));
        }
    }

    @PatchMapping("/{reviewId}/status")
    public ResponseEntity<?> updateReviewStatus(
            @PathVariable String reviewId,
            @RequestParam Review.ReviewStatus status,
            @RequestHeader("X-User-ID") String moderatorId
    ) {
        try {
            Review review = reviewService.updateReviewStatus(reviewId, status, moderatorId);
            return ResponseEntity.ok(review);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{reviewId}")
    public ResponseEntity<?> deleteReview(
            @PathVariable String reviewId,
            @RequestHeader("X-User-ID") String userId
    ) {
        try {
            reviewService.deleteReview(reviewId);
            return ResponseEntity.ok(Map.of("message", "Review deleted successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Analytics endpoints
    @GetMapping("/stats/overall")
    public ResponseEntity<ReviewStatsResponse> getOverallStats() {
        ReviewStatsResponse stats = analyticsService.getOverallStats();
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/stats/driver/{driverId}")
    public ResponseEntity<DriverRatingResponse> getDriverRating(@PathVariable String driverId) {
        DriverRatingResponse rating = analyticsService.getDriverRating(driverId);
        return ResponseEntity.ok(rating);
    }

    @GetMapping("/stats/item/{menuItemId}")
    public ResponseEntity<ItemRatingResponse> getItemRating(@PathVariable String menuItemId) {
        ItemRatingResponse rating = analyticsService.getItemRating(menuItemId);
        return ResponseEntity.ok(rating);
    }

    // Moderation endpoints
    @GetMapping("/pending")
    public ResponseEntity<Page<Review>> getPendingReviews(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").ascending());
        Page<Review> reviews = moderationService.getPendingReviews(pageable);
        return ResponseEntity.ok(reviews);
    }

    @GetMapping("/flagged")
    public ResponseEntity<Page<Review>> getFlaggedReviews(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").ascending());
        Page<Review> reviews = moderationService.getFlaggedReviews(pageable);
        return ResponseEntity.ok(reviews);
    }

    @PostMapping("/{reviewId}/approve")
    public ResponseEntity<?> approveReview(
            @PathVariable String reviewId,
            @RequestHeader("X-User-ID") String moderatorId
    ) {
        try {
            Review review = moderationService.approveReview(reviewId, moderatorId);
            return ResponseEntity.ok(review);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{reviewId}/reject")
    public ResponseEntity<?> rejectReview(
            @PathVariable String reviewId,
            @RequestParam String reason,
            @RequestHeader("X-User-ID") String moderatorId
    ) {
        try {
            Review review = moderationService.rejectReview(reviewId, moderatorId, reason);
            return ResponseEntity.ok(review);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/public/item/{menuItemId}/average")
    public ResponseEntity<Map<String, Object>> getPublicItemRating(@PathVariable String menuItemId) {
        ItemRatingResponse rating = analyticsService.getItemRating(menuItemId);
        Map<String, Object> result = new HashMap<>();
        result.put("menuItemId", rating.getMenuItemId());
        result.put("averageRating", rating.getAverageRating());
        result.put("totalReviews", rating.getTotalReviews());
        return ResponseEntity.ok(result);
    }
}
