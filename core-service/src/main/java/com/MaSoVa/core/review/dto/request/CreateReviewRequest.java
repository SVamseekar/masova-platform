package com.MaSoVa.core.review.dto.request;

import jakarta.validation.constraints.*;
import java.util.List;

public class CreateReviewRequest {

    @NotBlank(message = "Order ID is required")
    private String orderId;

    @NotNull(message = "Overall rating is required")
    @Min(value = 1, message = "Rating must be at least 1")
    @Max(value = 5, message = "Rating must be at most 5")
    private Integer overallRating;

    @Size(max = 2000, message = "Comment cannot exceed 2000 characters")
    private String comment;

    // Specific ratings
    @Min(value = 1, message = "Food quality rating must be at least 1")
    @Max(value = 5, message = "Food quality rating must be at most 5")
    private Integer foodQualityRating;

    @Min(value = 1, message = "Service rating must be at least 1")
    @Max(value = 5, message = "Service rating must be at most 5")
    private Integer serviceRating;

    @Min(value = 1, message = "Delivery rating must be at least 1")
    @Max(value = 5, message = "Delivery rating must be at most 5")
    private Integer deliveryRating;

    // Driver review
    private String driverId;

    @Min(value = 1, message = "Driver rating must be at least 1")
    @Max(value = 5, message = "Driver rating must be at most 5")
    private Integer driverRating;

    @Size(max = 1000, message = "Driver comment cannot exceed 1000 characters")
    private String driverComment;

    // Item-specific reviews
    private List<ItemReviewRequest> itemReviews;

    private Boolean isAnonymous;
    private List<String> photoUrls;

    public CreateReviewRequest() {
    }

    public CreateReviewRequest(String orderId, Integer overallRating, String comment, Integer foodQualityRating,
                               Integer serviceRating, Integer deliveryRating, String driverId, Integer driverRating,
                               String driverComment, List<ItemReviewRequest> itemReviews, Boolean isAnonymous,
                               List<String> photoUrls) {
        this.orderId = orderId;
        this.overallRating = overallRating;
        this.comment = comment;
        this.foodQualityRating = foodQualityRating;
        this.serviceRating = serviceRating;
        this.deliveryRating = deliveryRating;
        this.driverId = driverId;
        this.driverRating = driverRating;
        this.driverComment = driverComment;
        this.itemReviews = itemReviews;
        this.isAnonymous = isAnonymous;
        this.photoUrls = photoUrls;
    }

    public String getOrderId() {
        return orderId;
    }

    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }

    public Integer getOverallRating() {
        return overallRating;
    }

    public void setOverallRating(Integer overallRating) {
        this.overallRating = overallRating;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public Integer getFoodQualityRating() {
        return foodQualityRating;
    }

    public void setFoodQualityRating(Integer foodQualityRating) {
        this.foodQualityRating = foodQualityRating;
    }

    public Integer getServiceRating() {
        return serviceRating;
    }

    public void setServiceRating(Integer serviceRating) {
        this.serviceRating = serviceRating;
    }

    public Integer getDeliveryRating() {
        return deliveryRating;
    }

    public void setDeliveryRating(Integer deliveryRating) {
        this.deliveryRating = deliveryRating;
    }

    public String getDriverId() {
        return driverId;
    }

    public void setDriverId(String driverId) {
        this.driverId = driverId;
    }

    public Integer getDriverRating() {
        return driverRating;
    }

    public void setDriverRating(Integer driverRating) {
        this.driverRating = driverRating;
    }

    public String getDriverComment() {
        return driverComment;
    }

    public void setDriverComment(String driverComment) {
        this.driverComment = driverComment;
    }

    public List<ItemReviewRequest> getItemReviews() {
        return itemReviews;
    }

    public void setItemReviews(List<ItemReviewRequest> itemReviews) {
        this.itemReviews = itemReviews;
    }

    public Boolean getIsAnonymous() {
        return isAnonymous;
    }

    public void setIsAnonymous(Boolean isAnonymous) {
        this.isAnonymous = isAnonymous;
    }

    public List<String> getPhotoUrls() {
        return photoUrls;
    }

    public void setPhotoUrls(List<String> photoUrls) {
        this.photoUrls = photoUrls;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String orderId;
        private Integer overallRating;
        private String comment;
        private Integer foodQualityRating;
        private Integer serviceRating;
        private Integer deliveryRating;
        private String driverId;
        private Integer driverRating;
        private String driverComment;
        private List<ItemReviewRequest> itemReviews;
        private Boolean isAnonymous;
        private List<String> photoUrls;

        public Builder orderId(String orderId) {
            this.orderId = orderId;
            return this;
        }

        public Builder overallRating(Integer overallRating) {
            this.overallRating = overallRating;
            return this;
        }

        public Builder comment(String comment) {
            this.comment = comment;
            return this;
        }

        public Builder foodQualityRating(Integer foodQualityRating) {
            this.foodQualityRating = foodQualityRating;
            return this;
        }

        public Builder serviceRating(Integer serviceRating) {
            this.serviceRating = serviceRating;
            return this;
        }

        public Builder deliveryRating(Integer deliveryRating) {
            this.deliveryRating = deliveryRating;
            return this;
        }

        public Builder driverId(String driverId) {
            this.driverId = driverId;
            return this;
        }

        public Builder driverRating(Integer driverRating) {
            this.driverRating = driverRating;
            return this;
        }

        public Builder driverComment(String driverComment) {
            this.driverComment = driverComment;
            return this;
        }

        public Builder itemReviews(List<ItemReviewRequest> itemReviews) {
            this.itemReviews = itemReviews;
            return this;
        }

        public Builder isAnonymous(Boolean isAnonymous) {
            this.isAnonymous = isAnonymous;
            return this;
        }

        public Builder photoUrls(List<String> photoUrls) {
            this.photoUrls = photoUrls;
            return this;
        }

        public CreateReviewRequest build() {
            return new CreateReviewRequest(orderId, overallRating, comment, foodQualityRating, serviceRating,
                    deliveryRating, driverId, driverRating, driverComment, itemReviews, isAnonymous, photoUrls);
        }
    }

    public static class ItemReviewRequest {
        @NotBlank(message = "Menu item ID is required")
        private String menuItemId;

        @NotNull(message = "Rating is required")
        @Min(value = 1, message = "Rating must be at least 1")
        @Max(value = 5, message = "Rating must be at most 5")
        private Integer rating;

        @Size(max = 1000, message = "Comment cannot exceed 1000 characters")
        private String comment;

        public ItemReviewRequest() {
        }

        public ItemReviewRequest(String menuItemId, Integer rating, String comment) {
            this.menuItemId = menuItemId;
            this.rating = rating;
            this.comment = comment;
        }

        public String getMenuItemId() {
            return menuItemId;
        }

        public void setMenuItemId(String menuItemId) {
            this.menuItemId = menuItemId;
        }

        public Integer getRating() {
            return rating;
        }

        public void setRating(Integer rating) {
            this.rating = rating;
        }

        public String getComment() {
            return comment;
        }

        public void setComment(String comment) {
            this.comment = comment;
        }

        public static Builder builder() {
            return new Builder();
        }

        public static class Builder {
            private String menuItemId;
            private Integer rating;
            private String comment;

            public Builder menuItemId(String menuItemId) {
                this.menuItemId = menuItemId;
                return this;
            }

            public Builder rating(Integer rating) {
                this.rating = rating;
                return this;
            }

            public Builder comment(String comment) {
                this.comment = comment;
                return this;
            }

            public ItemReviewRequest build() {
                return new ItemReviewRequest(menuItemId, rating, comment);
            }
        }
    }
}
