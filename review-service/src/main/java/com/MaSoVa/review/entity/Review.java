package com.MaSoVa.review.entity;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Version;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "reviews")
@CompoundIndexes({
    @CompoundIndex(def = "{'orderId': 1, 'customerId': 1}", unique = true),
    @CompoundIndex(def = "{'storeId': 1, 'status': 1}"),
    @CompoundIndex(def = "{'storeId': 1, 'createdAt': -1}"),
    @CompoundIndex(def = "{'status': 1, 'createdAt': -1}")
})
public class Review {

    @Id
    private String id;

    @Version
    private Long version;

    @Indexed
    private String storeId;

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

    // Staff review (for POS and kitchen staff)
    @Indexed
    private String staffId;
    private String staffName;
    private Integer staffRating; // 1-5 stars
    private String staffComment;

    // Item-specific reviews
    private List<ItemReview> itemReviews = new ArrayList<>();

    // Review metadata
    private Boolean isAnonymous;
    private Boolean isVerifiedPurchase;

    // Photos
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

    // Constructor
    public Review() {}

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getStoreId() { return storeId; }
    public void setStoreId(String storeId) { this.storeId = storeId; }

    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }

    public String getCustomerId() { return customerId; }
    public void setCustomerId(String customerId) { this.customerId = customerId; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public Integer getOverallRating() { return overallRating; }
    public void setOverallRating(Integer overallRating) { this.overallRating = overallRating; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }

    public Integer getFoodQualityRating() { return foodQualityRating; }
    public void setFoodQualityRating(Integer foodQualityRating) { this.foodQualityRating = foodQualityRating; }

    public Integer getServiceRating() { return serviceRating; }
    public void setServiceRating(Integer serviceRating) { this.serviceRating = serviceRating; }

    public Integer getDeliveryRating() { return deliveryRating; }
    public void setDeliveryRating(Integer deliveryRating) { this.deliveryRating = deliveryRating; }

    public String getDriverId() { return driverId; }
    public void setDriverId(String driverId) { this.driverId = driverId; }

    public String getDriverName() { return driverName; }
    public void setDriverName(String driverName) { this.driverName = driverName; }

    public Integer getDriverRating() { return driverRating; }
    public void setDriverRating(Integer driverRating) { this.driverRating = driverRating; }

    public String getDriverComment() { return driverComment; }
    public void setDriverComment(String driverComment) { this.driverComment = driverComment; }

    public String getStaffId() { return staffId; }
    public void setStaffId(String staffId) { this.staffId = staffId; }

    public String getStaffName() { return staffName; }
    public void setStaffName(String staffName) { this.staffName = staffName; }

    public Integer getStaffRating() { return staffRating; }
    public void setStaffRating(Integer staffRating) { this.staffRating = staffRating; }

    public String getStaffComment() { return staffComment; }
    public void setStaffComment(String staffComment) { this.staffComment = staffComment; }

    public List<ItemReview> getItemReviews() { return itemReviews; }
    public void setItemReviews(List<ItemReview> itemReviews) { this.itemReviews = itemReviews; }

    public Boolean getIsAnonymous() { return isAnonymous; }
    public void setIsAnonymous(Boolean isAnonymous) { this.isAnonymous = isAnonymous; }

    public Boolean getIsVerifiedPurchase() { return isVerifiedPurchase; }
    public void setIsVerifiedPurchase(Boolean isVerifiedPurchase) { this.isVerifiedPurchase = isVerifiedPurchase; }

    public List<String> getPhotoUrls() { return photoUrls; }
    public void setPhotoUrls(List<String> photoUrls) { this.photoUrls = photoUrls; }

    public ReviewStatus getStatus() { return status; }
    public void setStatus(ReviewStatus status) { this.status = status; }

    public String getFlagReason() { return flagReason; }
    public void setFlagReason(String flagReason) { this.flagReason = flagReason; }

    public String getModeratorId() { return moderatorId; }
    public void setModeratorId(String moderatorId) { this.moderatorId = moderatorId; }

    public LocalDateTime getModeratedAt() { return moderatedAt; }
    public void setModeratedAt(LocalDateTime moderatedAt) { this.moderatedAt = moderatedAt; }

    public String getResponseId() { return responseId; }
    public void setResponseId(String responseId) { this.responseId = responseId; }

    public SentimentType getSentiment() { return sentiment; }
    public void setSentiment(SentimentType sentiment) { this.sentiment = sentiment; }

    public Double getSentimentScore() { return sentimentScore; }
    public void setSentimentScore(Double sentimentScore) { this.sentimentScore = sentimentScore; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public Boolean getIsDeleted() { return isDeleted; }
    public void setIsDeleted(Boolean isDeleted) { this.isDeleted = isDeleted; }

    // Builder pattern
    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private final Review review = new Review();

        public Builder id(String id) { review.id = id; return this; }
        public Builder storeId(String storeId) { review.storeId = storeId; return this; }
        public Builder orderId(String orderId) { review.orderId = orderId; return this; }
        public Builder customerId(String customerId) { review.customerId = customerId; return this; }
        public Builder customerName(String customerName) { review.customerName = customerName; return this; }
        public Builder overallRating(Integer overallRating) { review.overallRating = overallRating; return this; }
        public Builder comment(String comment) { review.comment = comment; return this; }
        public Builder foodQualityRating(Integer foodQualityRating) { review.foodQualityRating = foodQualityRating; return this; }
        public Builder serviceRating(Integer serviceRating) { review.serviceRating = serviceRating; return this; }
        public Builder deliveryRating(Integer deliveryRating) { review.deliveryRating = deliveryRating; return this; }
        public Builder driverId(String driverId) { review.driverId = driverId; return this; }
        public Builder driverName(String driverName) { review.driverName = driverName; return this; }
        public Builder driverRating(Integer driverRating) { review.driverRating = driverRating; return this; }
        public Builder driverComment(String driverComment) { review.driverComment = driverComment; return this; }
        public Builder staffId(String staffId) { review.staffId = staffId; return this; }
        public Builder staffName(String staffName) { review.staffName = staffName; return this; }
        public Builder staffRating(Integer staffRating) { review.staffRating = staffRating; return this; }
        public Builder staffComment(String staffComment) { review.staffComment = staffComment; return this; }
        public Builder itemReviews(List<ItemReview> itemReviews) { review.itemReviews = itemReviews; return this; }
        public Builder isAnonymous(Boolean isAnonymous) { review.isAnonymous = isAnonymous; return this; }
        public Builder isVerifiedPurchase(Boolean isVerifiedPurchase) { review.isVerifiedPurchase = isVerifiedPurchase; return this; }
        public Builder photoUrls(List<String> photoUrls) { review.photoUrls = photoUrls; return this; }
        public Builder status(ReviewStatus status) { review.status = status; return this; }
        public Builder flagReason(String flagReason) { review.flagReason = flagReason; return this; }
        public Builder moderatorId(String moderatorId) { review.moderatorId = moderatorId; return this; }
        public Builder moderatedAt(LocalDateTime moderatedAt) { review.moderatedAt = moderatedAt; return this; }
        public Builder responseId(String responseId) { review.responseId = responseId; return this; }
        public Builder sentiment(SentimentType sentiment) { review.sentiment = sentiment; return this; }
        public Builder sentimentScore(Double sentimentScore) { review.sentimentScore = sentimentScore; return this; }
        public Builder createdAt(LocalDateTime createdAt) { review.createdAt = createdAt; return this; }
        public Builder updatedAt(LocalDateTime updatedAt) { review.updatedAt = updatedAt; return this; }
        public Builder isDeleted(Boolean isDeleted) { review.isDeleted = isDeleted; return this; }

        public Review build() { return review; }
    }

    public static class ItemReview {
        private String menuItemId;
        private String menuItemName;
        private Integer rating; // 1-5 stars
        private String comment;

        // Constructor
        public ItemReview() {}

        // Getters and Setters
        public String getMenuItemId() { return menuItemId; }
        public void setMenuItemId(String menuItemId) { this.menuItemId = menuItemId; }

        public String getMenuItemName() { return menuItemName; }
        public void setMenuItemName(String menuItemName) { this.menuItemName = menuItemName; }

        public Integer getRating() { return rating; }
        public void setRating(Integer rating) { this.rating = rating; }

        public String getComment() { return comment; }
        public void setComment(String comment) { this.comment = comment; }

        // Builder pattern
        public static Builder builder() { return new Builder(); }

        public static class Builder {
            private final ItemReview itemReview = new ItemReview();

            public Builder menuItemId(String menuItemId) { itemReview.menuItemId = menuItemId; return this; }
            public Builder menuItemName(String menuItemName) { itemReview.menuItemName = menuItemName; return this; }
            public Builder rating(Integer rating) { itemReview.rating = rating; return this; }
            public Builder comment(String comment) { itemReview.comment = comment; return this; }

            public ItemReview build() { return itemReview; }
        }
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
