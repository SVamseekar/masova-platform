package com.MaSoVa.logistics.delivery.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Version;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entity to track delivery assignments and status
 */
@Document(collection = "delivery_trackings")
@CompoundIndexes({
    @CompoundIndex(def = "{'driverId': 1, 'status': 1}"),
    @CompoundIndex(def = "{'storeId': 1, 'status': 1}"),
    @CompoundIndex(def = "{'driverId': 1, 'createdAt': -1}"),
    @CompoundIndex(def = "{'storeId': 1, 'createdAt': -1}"),
    @CompoundIndex(def = "{'driverId': 1, 'storeId': 1, 'createdAt': -1}")
})
public class DeliveryTracking {

    @Id
    private String id;

    @Version
    private Long version;

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
    private String priorityLevel; // LOW, MEDIUM, HIGH, URGENT
    private LocalDateTime assignedAt;
    private LocalDateTime acceptedAt;
    private LocalDateTime pickedUpAt;
    private LocalDateTime deliveredAt;

    // Status
    @Indexed
    private String status; // PENDING_ASSIGNMENT, ASSIGNED, ACCEPTED, REJECTED, PICKED_UP, IN_TRANSIT, ARRIVED, DELIVERED, FAILED, CANCELLED

    // Rejection tracking (for DELIV-003)
    private String rejectionReason;
    private LocalDateTime rejectedAt;
    private Integer reassignmentCount;  // How many times this delivery has been reassigned
    private Integer acceptanceTimeoutMinutes;  // Max time to accept before auto-reassignment

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

    public DeliveryTracking() {
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getOrderId() {
        return orderId;
    }

    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }

    public String getDriverId() {
        return driverId;
    }

    public void setDriverId(String driverId) {
        this.driverId = driverId;
    }

    public String getStoreId() {
        return storeId;
    }

    public void setStoreId(String storeId) {
        this.storeId = storeId;
    }

    public String getDriverName() {
        return driverName;
    }

    public void setDriverName(String driverName) {
        this.driverName = driverName;
    }

    public String getDriverPhone() {
        return driverPhone;
    }

    public void setDriverPhone(String driverPhone) {
        this.driverPhone = driverPhone;
    }

    public DeliveryAddress getPickupAddress() {
        return pickupAddress;
    }

    public void setPickupAddress(DeliveryAddress pickupAddress) {
        this.pickupAddress = pickupAddress;
    }

    public DeliveryAddress getDeliveryAddress() {
        return deliveryAddress;
    }

    public void setDeliveryAddress(DeliveryAddress deliveryAddress) {
        this.deliveryAddress = deliveryAddress;
    }

    public String getDispatchMethod() {
        return dispatchMethod;
    }

    public void setDispatchMethod(String dispatchMethod) {
        this.dispatchMethod = dispatchMethod;
    }

    public String getPriorityLevel() {
        return priorityLevel;
    }

    public void setPriorityLevel(String priorityLevel) {
        this.priorityLevel = priorityLevel;
    }

    public LocalDateTime getAssignedAt() {
        return assignedAt;
    }

    public void setAssignedAt(LocalDateTime assignedAt) {
        this.assignedAt = assignedAt;
    }

    public LocalDateTime getAcceptedAt() {
        return acceptedAt;
    }

    public void setAcceptedAt(LocalDateTime acceptedAt) {
        this.acceptedAt = acceptedAt;
    }

    public LocalDateTime getPickedUpAt() {
        return pickedUpAt;
    }

    public void setPickedUpAt(LocalDateTime pickedUpAt) {
        this.pickedUpAt = pickedUpAt;
    }

    public LocalDateTime getDeliveredAt() {
        return deliveredAt;
    }

    public void setDeliveredAt(LocalDateTime deliveredAt) {
        this.deliveredAt = deliveredAt;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public BigDecimal getDistanceKm() {
        return distanceKm;
    }

    public void setDistanceKm(BigDecimal distanceKm) {
        this.distanceKm = distanceKm;
    }

    public Integer getEstimatedDeliveryMinutes() {
        return estimatedDeliveryMinutes;
    }

    public void setEstimatedDeliveryMinutes(Integer estimatedDeliveryMinutes) {
        this.estimatedDeliveryMinutes = estimatedDeliveryMinutes;
    }

    public Integer getActualDeliveryMinutes() {
        return actualDeliveryMinutes;
    }

    public void setActualDeliveryMinutes(Integer actualDeliveryMinutes) {
        this.actualDeliveryMinutes = actualDeliveryMinutes;
    }

    public Boolean getOnTime() {
        return onTime;
    }

    public void setOnTime(Boolean onTime) {
        this.onTime = onTime;
    }

    public Integer getCustomerRating() {
        return customerRating;
    }

    public void setCustomerRating(Integer customerRating) {
        this.customerRating = customerRating;
    }

    public String getCustomerFeedback() {
        return customerFeedback;
    }

    public void setCustomerFeedback(String customerFeedback) {
        this.customerFeedback = customerFeedback;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }

    public LocalDateTime getRejectedAt() {
        return rejectedAt;
    }

    public void setRejectedAt(LocalDateTime rejectedAt) {
        this.rejectedAt = rejectedAt;
    }

    public Integer getReassignmentCount() {
        return reassignmentCount;
    }

    public void setReassignmentCount(Integer reassignmentCount) {
        this.reassignmentCount = reassignmentCount;
    }

    public Integer getAcceptanceTimeoutMinutes() {
        return acceptanceTimeoutMinutes;
    }

    public void setAcceptanceTimeoutMinutes(Integer acceptanceTimeoutMinutes) {
        this.acceptanceTimeoutMinutes = acceptanceTimeoutMinutes;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String id;
        private String orderId;
        private String driverId;
        private String storeId;
        private String driverName;
        private String driverPhone;
        private DeliveryAddress pickupAddress;
        private DeliveryAddress deliveryAddress;
        private String dispatchMethod;
        private String priorityLevel;
        private LocalDateTime assignedAt;
        private LocalDateTime acceptedAt;
        private LocalDateTime pickedUpAt;
        private LocalDateTime deliveredAt;
        private String status;
        private BigDecimal distanceKm;
        private Integer estimatedDeliveryMinutes;
        private Integer actualDeliveryMinutes;
        private Boolean onTime;
        private Integer customerRating;
        private String customerFeedback;
        private String rejectionReason;
        private LocalDateTime rejectedAt;
        private Integer reassignmentCount;
        private Integer acceptanceTimeoutMinutes;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public Builder id(String id) {
            this.id = id;
            return this;
        }

        public Builder orderId(String orderId) {
            this.orderId = orderId;
            return this;
        }

        public Builder driverId(String driverId) {
            this.driverId = driverId;
            return this;
        }

        public Builder storeId(String storeId) {
            this.storeId = storeId;
            return this;
        }

        public Builder driverName(String driverName) {
            this.driverName = driverName;
            return this;
        }

        public Builder driverPhone(String driverPhone) {
            this.driverPhone = driverPhone;
            return this;
        }

        public Builder pickupAddress(DeliveryAddress pickupAddress) {
            this.pickupAddress = pickupAddress;
            return this;
        }

        public Builder deliveryAddress(DeliveryAddress deliveryAddress) {
            this.deliveryAddress = deliveryAddress;
            return this;
        }

        public Builder dispatchMethod(String dispatchMethod) {
            this.dispatchMethod = dispatchMethod;
            return this;
        }

        public Builder priorityLevel(String priorityLevel) {
            this.priorityLevel = priorityLevel;
            return this;
        }

        public Builder assignedAt(LocalDateTime assignedAt) {
            this.assignedAt = assignedAt;
            return this;
        }

        public Builder acceptedAt(LocalDateTime acceptedAt) {
            this.acceptedAt = acceptedAt;
            return this;
        }

        public Builder pickedUpAt(LocalDateTime pickedUpAt) {
            this.pickedUpAt = pickedUpAt;
            return this;
        }

        public Builder deliveredAt(LocalDateTime deliveredAt) {
            this.deliveredAt = deliveredAt;
            return this;
        }

        public Builder status(String status) {
            this.status = status;
            return this;
        }

        public Builder distanceKm(BigDecimal distanceKm) {
            this.distanceKm = distanceKm;
            return this;
        }

        public Builder estimatedDeliveryMinutes(Integer estimatedDeliveryMinutes) {
            this.estimatedDeliveryMinutes = estimatedDeliveryMinutes;
            return this;
        }

        public Builder actualDeliveryMinutes(Integer actualDeliveryMinutes) {
            this.actualDeliveryMinutes = actualDeliveryMinutes;
            return this;
        }

        public Builder onTime(Boolean onTime) {
            this.onTime = onTime;
            return this;
        }

        public Builder customerRating(Integer customerRating) {
            this.customerRating = customerRating;
            return this;
        }

        public Builder customerFeedback(String customerFeedback) {
            this.customerFeedback = customerFeedback;
            return this;
        }

        public Builder rejectionReason(String rejectionReason) {
            this.rejectionReason = rejectionReason;
            return this;
        }

        public Builder rejectedAt(LocalDateTime rejectedAt) {
            this.rejectedAt = rejectedAt;
            return this;
        }

        public Builder reassignmentCount(Integer reassignmentCount) {
            this.reassignmentCount = reassignmentCount;
            return this;
        }

        public Builder acceptanceTimeoutMinutes(Integer acceptanceTimeoutMinutes) {
            this.acceptanceTimeoutMinutes = acceptanceTimeoutMinutes;
            return this;
        }

        public Builder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public Builder updatedAt(LocalDateTime updatedAt) {
            this.updatedAt = updatedAt;
            return this;
        }

        public DeliveryTracking build() {
            DeliveryTracking tracking = new DeliveryTracking();
            tracking.id = this.id;
            tracking.orderId = this.orderId;
            tracking.driverId = this.driverId;
            tracking.storeId = this.storeId;
            tracking.driverName = this.driverName;
            tracking.driverPhone = this.driverPhone;
            tracking.pickupAddress = this.pickupAddress;
            tracking.deliveryAddress = this.deliveryAddress;
            tracking.dispatchMethod = this.dispatchMethod;
            tracking.priorityLevel = this.priorityLevel;
            tracking.assignedAt = this.assignedAt;
            tracking.acceptedAt = this.acceptedAt;
            tracking.pickedUpAt = this.pickedUpAt;
            tracking.deliveredAt = this.deliveredAt;
            tracking.status = this.status;
            tracking.distanceKm = this.distanceKm;
            tracking.estimatedDeliveryMinutes = this.estimatedDeliveryMinutes;
            tracking.actualDeliveryMinutes = this.actualDeliveryMinutes;
            tracking.onTime = this.onTime;
            tracking.customerRating = this.customerRating;
            tracking.customerFeedback = this.customerFeedback;
            tracking.rejectionReason = this.rejectionReason;
            tracking.rejectedAt = this.rejectedAt;
            tracking.reassignmentCount = this.reassignmentCount;
            tracking.acceptanceTimeoutMinutes = this.acceptanceTimeoutMinutes;
            tracking.createdAt = this.createdAt;
            tracking.updatedAt = this.updatedAt;
            return tracking;
        }
    }

    public static class DeliveryAddress {
        private String street;
        private String city;
        private String state;
        private String zipCode;
        private Double latitude;
        private Double longitude;

        public DeliveryAddress() {
        }

        public String getStreet() {
            return street;
        }

        public void setStreet(String street) {
            this.street = street;
        }

        public String getCity() {
            return city;
        }

        public void setCity(String city) {
            this.city = city;
        }

        public String getState() {
            return state;
        }

        public void setState(String state) {
            this.state = state;
        }

        public String getZipCode() {
            return zipCode;
        }

        public void setZipCode(String zipCode) {
            this.zipCode = zipCode;
        }

        public Double getLatitude() {
            return latitude;
        }

        public void setLatitude(Double latitude) {
            this.latitude = latitude;
        }

        public Double getLongitude() {
            return longitude;
        }

        public void setLongitude(Double longitude) {
            this.longitude = longitude;
        }

        public static Builder builder() {
            return new Builder();
        }

        public static class Builder {
            private String street;
            private String city;
            private String state;
            private String zipCode;
            private Double latitude;
            private Double longitude;

            public Builder street(String street) {
                this.street = street;
                return this;
            }

            public Builder city(String city) {
                this.city = city;
                return this;
            }

            public Builder state(String state) {
                this.state = state;
                return this;
            }

            public Builder zipCode(String zipCode) {
                this.zipCode = zipCode;
                return this;
            }

            public Builder latitude(Double latitude) {
                this.latitude = latitude;
                return this;
            }

            public Builder longitude(Double longitude) {
                this.longitude = longitude;
                return this;
            }

            public DeliveryAddress build() {
                DeliveryAddress address = new DeliveryAddress();
                address.street = this.street;
                address.city = this.city;
                address.state = this.state;
                address.zipCode = this.zipCode;
                address.latitude = this.latitude;
                address.longitude = this.longitude;
                return address;
            }
        }
    }
}
