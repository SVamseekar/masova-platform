package com.MaSoVa.core.review.controller;

import com.MaSoVa.core.review.dto.request.CreateResponseRequest;
import com.MaSoVa.core.review.dto.request.CreateReviewRequest;
import com.MaSoVa.core.review.dto.request.FlagReviewRequest;
import com.MaSoVa.core.review.dto.response.ReviewStatsResponse;
import com.MaSoVa.core.review.entity.Review;
import com.MaSoVa.core.review.entity.ReviewResponse;
import com.MaSoVa.core.review.service.AnalyticsService;
import com.MaSoVa.core.review.service.ModerationService;
import com.MaSoVa.core.review.service.ReviewResponseService;
import com.MaSoVa.core.review.service.ReviewService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Reviews — 10 canonical endpoints at /api/reviews.
 * Merges ResponseController (/api/responses) into this controller.
 * Replaces: /api/reviews/order/*, /customer/*, /driver/*, /staff/*, /item/*,
 *           /recent, /rating, /needs-response, /stats/*, /pending, /flagged,
 *           /{id}/approve, /{id}/reject, /{id}/flag, /{id}/status,
 *           /public/item/*/average, /api/responses/**, /api/ratings/**
 */
@RestController
@RequestMapping("/api/reviews")
@Tag(name = "Reviews", description = "Customer reviews, moderation, and manager responses")
@SecurityRequirement(name = "bearerAuth")
public class ReviewController {

    private static final Logger log = LoggerFactory.getLogger(ReviewController.class);

    private final ReviewService reviewService;
    private final AnalyticsService analyticsService;
    private final ModerationService moderationService;
    private final ReviewResponseService responseService;

    public ReviewController(ReviewService reviewService, AnalyticsService analyticsService,
                            ModerationService moderationService, ReviewResponseService responseService) {
        this.reviewService = reviewService;
        this.analyticsService = analyticsService;
        this.moderationService = moderationService;
        this.responseService = responseService;
    }

    // ── LIST ─────────────────────────────────────────────────────────────────────

    /**
     * GET /api/reviews?status=&entityType=&entityId=&rating=&flagged=
     * Replaces: /order/*, /customer/*, /driver/*, /staff/*, /item/*,
     *           /recent, /rating, /needs-response, /pending, /flagged
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'ASSISTANT_MANAGER', 'STAFF')")
    @Operation(summary = "List reviews (query: status, entityType, entityId, rating, flagged)")
    public ResponseEntity<?> getReviews(
            @RequestParam(required = false) Review.ReviewStatus status,
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) String entityId,
            @RequestParam(required = false) Integer rating,
            @RequestParam(required = false) Boolean flagged,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        if (Boolean.TRUE.equals(flagged)) {
            return ResponseEntity.ok(moderationService.getFlaggedReviews(PageRequest.of(page, size, Sort.by("createdAt").ascending())));
        }
        if (status == Review.ReviewStatus.PENDING) {
            return ResponseEntity.ok(moderationService.getPendingReviews(PageRequest.of(page, size, Sort.by("createdAt").ascending())));
        }
        if (status != null) {
            return ResponseEntity.ok(reviewService.getReviewsByStatus(status, PageRequest.of(page, size, Sort.by("createdAt").descending())));
        }
        if ("ORDER".equalsIgnoreCase(entityType) && entityId != null) {
            return ResponseEntity.ok(reviewService.getReviewsByOrderId(entityId));
        }
        if ("DRIVER".equalsIgnoreCase(entityType) && entityId != null) {
            return ResponseEntity.ok(reviewService.getReviewsByDriverId(entityId, PageRequest.of(page, size, Sort.by("createdAt").descending())));
        }
        if ("STAFF".equalsIgnoreCase(entityType) && entityId != null) {
            return ResponseEntity.ok(reviewService.getReviewsByStaffId(entityId, PageRequest.of(page, size, Sort.by("createdAt").descending())));
        }
        if ("MENU_ITEM".equalsIgnoreCase(entityType) && entityId != null) {
            return ResponseEntity.ok(reviewService.getReviewsByMenuItemId(entityId, PageRequest.of(page, size, Sort.by("createdAt").descending())));
        }
        if ("CUSTOMER".equalsIgnoreCase(entityType) && entityId != null) {
            return ResponseEntity.ok(reviewService.getReviewsByCustomerId(entityId, PageRequest.of(page, size, Sort.by("createdAt").descending())));
        }
        return ResponseEntity.ok(reviewService.getRecentReviews(PageRequest.of(page, size)));
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Create review")
    public ResponseEntity<?> createReview(
            @Valid @RequestBody CreateReviewRequest request,
            @RequestHeader("X-User-ID") String customerId,
            @RequestHeader(value = "X-User-Name", required = false) String customerName) {
        try {
            // X-User-Name is not injected by the gateway — fall back to customer ID as display name
            String resolvedName = (customerName != null && !customerName.isBlank()) ? customerName : customerId;
            Review review = reviewService.createReview(request, customerId, resolvedName);
            return ResponseEntity.status(HttpStatus.CREATED).body(review);
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET /api/reviews/stats?entityType=&entityId=
     * Replaces: /stats/overall, /stats/driver/{id}, /stats/item/{id}
     */
    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('MANAGER', 'ASSISTANT_MANAGER')")
    @Operation(summary = "Review stats (query: entityType, entityId)")
    public ResponseEntity<?> getStats(
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) String entityId) {
        if ("DRIVER".equalsIgnoreCase(entityType) && entityId != null) {
            return ResponseEntity.ok(analyticsService.getDriverRating(entityId));
        }
        if ("MENU_ITEM".equalsIgnoreCase(entityType) && entityId != null) {
            return ResponseEntity.ok(analyticsService.getItemRating(entityId));
        }
        return ResponseEntity.ok(analyticsService.getOverallStats());
    }

    // ── PUBLIC TOKEN ─────────────────────────────────────────────────────────────

    @GetMapping("/public/token/{token}")
    @Operation(summary = "Rating page via token (no auth)")
    public ResponseEntity<?> getTokenDetails(@PathVariable String token) {
        try {
            return ResponseEntity.ok(reviewService.getTokenDetails(token));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid or expired rating link"));
        }
    }

    @PostMapping("/public/submit")
    @Operation(summary = "Submit public rating (no auth)")
    public ResponseEntity<?> submitPublicRating(
            @Valid @RequestBody CreateReviewRequest request,
            @RequestParam String token) {
        try {
            Review review = reviewService.createPublicReview(request, token);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "success", true,
                    "message", "Thank you for your feedback!",
                    "reviewId", review.getId()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid or expired rating link"));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── SINGLE REVIEW ────────────────────────────────────────────────────────────

    @GetMapping("/{reviewId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get review by ID")
    public ResponseEntity<?> getReview(@PathVariable String reviewId) {
        try {
            return ResponseEntity.ok(reviewService.getReviewById(reviewId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * PATCH /api/reviews/{id} — update status, flag, approve, reject via body
     * Body: { status?: "APPROVED"|"REJECTED"|"FLAGGED", reason?: "...", flagReason?: "..." }
     * Replaces: /{id}/flag, /{id}/status, /{id}/approve, /{id}/reject
     */
    @PatchMapping("/{reviewId}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ASSISTANT_MANAGER')")
    @Operation(summary = "Update review (status, flag, approve, reject via body)")
    public ResponseEntity<?> updateReview(
            @PathVariable String reviewId,
            @RequestBody Map<String, String> body,
            @RequestHeader("X-User-ID") String moderatorId) {
        try {
            String action = body.getOrDefault("status", "").toUpperCase();
            switch (action) {
                case "APPROVED":
                    return ResponseEntity.ok(moderationService.approveReview(reviewId, moderatorId));
                case "REJECTED":
                    return ResponseEntity.ok(moderationService.rejectReview(reviewId, moderatorId, body.get("reason")));
                case "FLAGGED":
                    return ResponseEntity.ok(reviewService.flagReview(reviewId, body.get("flagReason"), moderatorId));
                default:
                    if (body.containsKey("flagReason")) {
                        return ResponseEntity.ok(reviewService.flagReview(reviewId, body.get("flagReason"), moderatorId));
                    }
                    String status = body.get("status");
                    if (status != null) {
                        Review.ReviewStatus reviewStatus = Review.ReviewStatus.valueOf(status);
                        return ResponseEntity.ok(reviewService.updateReviewStatus(reviewId, reviewStatus, moderatorId));
                    }
                    return ResponseEntity.badRequest().body(Map.of("error", "status or flagReason required"));
            }
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{reviewId}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ASSISTANT_MANAGER')")
    @Operation(summary = "Delete review")
    public ResponseEntity<?> deleteReview(@PathVariable String reviewId) {
        try {
            reviewService.deleteReview(reviewId);
            return ResponseEntity.ok(Map.of("message", "Review deleted successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // ── MANAGER RESPONSE (merged from ResponseController) ────────────────────────

    /**
     * POST /api/reviews/{id}/response — add or update manager response
     * Replaces: POST /api/responses/review/{id} and PUT /api/responses/{id}
     */
    @PostMapping("/{reviewId}/response")
    @PreAuthorize("hasAnyRole('MANAGER', 'ASSISTANT_MANAGER')")
    @Operation(summary = "Add or update manager response")
    public ResponseEntity<?> addOrUpdateResponse(
            @PathVariable String reviewId,
            @Valid @RequestBody CreateResponseRequest request,
            @RequestHeader("X-User-ID") String managerId,
            @RequestHeader(value = "X-User-Name", required = false) String managerName) {
        try {
            String resolvedName = (managerName != null && !managerName.isBlank()) ? managerName : managerId;
            // Check if response already exists; update if so
            return responseService.getResponseByReviewId(reviewId)
                    .map(existing -> {
                        ReviewResponse updated = responseService.updateResponse(
                                existing.getId(),
                                request.getResponseText(),
                                managerId);
                        return ResponseEntity.ok(updated);
                    })
                    .orElseGet(() -> {
                        ReviewResponse created = responseService.createResponse(reviewId, request, managerId, resolvedName);
                        return ResponseEntity.status(HttpStatus.CREATED).body(created);
                    });
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET /api/reviews/response-templates
     * Replaces: GET /api/responses/templates
     */
    @GetMapping("/response-templates")
    @PreAuthorize("hasAnyRole('MANAGER', 'ASSISTANT_MANAGER')")
    @Operation(summary = "Get response templates")
    public ResponseEntity<Map<ReviewResponse.ResponseType, String>> getResponseTemplates() {
        return ResponseEntity.ok(responseService.getAllTemplates());
    }
}
