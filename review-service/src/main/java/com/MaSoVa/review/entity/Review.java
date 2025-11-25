package com.MaSoVa.review.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "reviews")
public class Review {

    @Id
    private String id;

    private String orderId;
    private String customerId;
    private String customerName;

    // Overall rating
    private Integer overallRating; // 1-5 stars
    private String comment;

    // Specific ratings
    private Integer foodQualityRating; // 1-5 stars
    private Integer serviceRating; // 1-5 stars
    private Integer deliveryRating; // 1-5 stars (only for delivery orders)

    // Driver review (for delivery orders)
    private String driverId;
    private String driverName;
    private Integer driverRating; // 1-5 stars
    private String driverComment;

    // Item-specific reviews
    @Builder.Default
    private List<ItemReview> itemReviews = new ArrayList<>();

    // Review metadata
    private Boolean isAnonymous;
    private Boolean isVerifiedPurchase;

    // Photos
    @Builder.Default
    private List<String> photoUrls = new ArrayList<>();

    // Moderation
    private ReviewStatus status;
    private String flagReason;
    private String moderatorId;
    private LocalDateTime moderatedAt;

    // Response
    private String responseId; // Link to ReviewResponse

    // Sentiment analysis
    private SentimentType sentiment;
    private Double sentimentScore; // -1.0 to 1.0

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    private Boolean isDeleted;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ItemReview {
        private String menuItemId;
        private String menuItemName;
        private Integer rating; // 1-5 stars
        private String comment;
    }

    public enum ReviewStatus {
        PENDING,
        APPROVED,
        REJECTED,
        FLAGGED,
        DELETED
    }

    public enum SentimentType {
        POSITIVE,
        NEUTRAL,
        NEGATIVE,
        MIXED
    }
}
