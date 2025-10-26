package com.MaSoVa.delivery.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entity to track delivery assignments and status
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "delivery_trackings")
public class DeliveryTracking {

    @Id
    private String id;

    @Indexed(unique = true)
    private String orderId;

    @Indexed
    private String driverId;

    private String storeId;

    // Driver details (cached)
    private String driverName;
    private String driverPhone;

    // Location details
    private DeliveryAddress pickupAddress;
    private DeliveryAddress deliveryAddress;

    // Dispatch details
    private String dispatchMethod; // AUTO, MANUAL
    private LocalDateTime assignedAt;
    private LocalDateTime acceptedAt;
    private LocalDateTime pickedUpAt;
    private LocalDateTime deliveredAt;

    // Status
    @Indexed
    private String status; // ASSIGNED, ACCEPTED, PICKED_UP, OUT_FOR_DELIVERY, DELIVERED, CANCELLED

    // Metrics
    private BigDecimal distanceKm;
    private Integer estimatedDeliveryMinutes;
    private Integer actualDeliveryMinutes;
    private Boolean onTime;

    // Ratings
    private Integer customerRating; // 1-5 stars
    private String customerFeedback;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DeliveryAddress {
        private String street;
        private String city;
        private String state;
        private String zipCode;
        private Double latitude;
        private Double longitude;
    }
}
