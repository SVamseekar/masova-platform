package com.MaSoVa.review.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.*;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
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

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ItemReviewRequest {
        @NotBlank(message = "Menu item ID is required")
        private String menuItemId;

        @NotNull(message = "Rating is required")
        @Min(value = 1, message = "Rating must be at least 1")
        @Max(value = 5, message = "Rating must be at most 5")
        private Integer rating;

        @Size(max = 1000, message = "Comment cannot exceed 1000 characters")
        private String comment;
    }
}
