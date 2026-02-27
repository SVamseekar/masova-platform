package com.MaSoVa.shared.test.builders;

import com.MaSoVa.shared.test.TestDataBuilder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Builder for creating test delivery tracking and driver location data as Map representations.
 *
 * Mirrors the DeliveryTracking and DriverLocation entities from the delivery-service module.
 *
 * @example
 * <pre>
 * {@code
 * // Default pending delivery
 * Map<String, Object> delivery = DeliveryTestDataBuilder.aDeliveryTracking().build();
 *
 * // In-transit delivery
 * Map<String, Object> delivery = DeliveryTestDataBuilder.anInTransitDelivery().build();
 *
 * // Driver location update
 * Map<String, Object> location = DeliveryTestDataBuilder.aDriverLocation().build();
 * }
 * </pre>
 */
public class DeliveryTestDataBuilder {

    // --- DeliveryTracking fields ---

    private String id = TestDataBuilder.randomId();
    private String orderId = TestDataBuilder.randomId();
    private String driverId = TestDataBuilder.randomId();
    private String storeId = TestDataBuilder.defaultStoreId();
    private String driverName = "Test Driver";
    private String driverPhone = "+31687654321";
    private Map<String, Object> pickupAddress = defaultPickupAddress();
    private Map<String, Object> deliveryAddress = defaultDeliveryAddress();
    private String dispatchMethod = "AUTO";
    private String priorityLevel = "MEDIUM";
    private LocalDateTime assignedAt = LocalDateTime.now();
    private LocalDateTime acceptedAt = null;
    private LocalDateTime pickedUpAt = null;
    private LocalDateTime deliveredAt = null;
    private String status = "PENDING_ASSIGNMENT";
    private String rejectionReason = null;
    private LocalDateTime rejectedAt = null;
    private Integer reassignmentCount = 0;
    private Integer acceptanceTimeoutMinutes = 5;
    private BigDecimal distanceKm = BigDecimal.valueOf(3.5);
    private Integer estimatedDeliveryMinutes = 25;
    private Integer actualDeliveryMinutes = null;
    private Boolean onTime = null;
    private Integer customerRating = null;
    private String customerFeedback = null;
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();

    private DeliveryTestDataBuilder() {}

    public static DeliveryTestDataBuilder aDeliveryTracking() {
        return new DeliveryTestDataBuilder();
    }

    public static DeliveryTestDataBuilder anAssignedDelivery() {
        return new DeliveryTestDataBuilder()
                .withStatus("ASSIGNED")
                .withAssignedAt(LocalDateTime.now());
    }

    public static DeliveryTestDataBuilder anAcceptedDelivery() {
        LocalDateTime now = LocalDateTime.now();
        return new DeliveryTestDataBuilder()
                .withStatus("ACCEPTED")
                .withAssignedAt(now.minusMinutes(2))
                .withAcceptedAt(now);
    }

    public static DeliveryTestDataBuilder anInTransitDelivery() {
        LocalDateTime now = LocalDateTime.now();
        return new DeliveryTestDataBuilder()
                .withStatus("IN_TRANSIT")
                .withAssignedAt(now.minusMinutes(15))
                .withAcceptedAt(now.minusMinutes(13))
                .withPickedUpAt(now.minusMinutes(5));
    }

    public static DeliveryTestDataBuilder aCompletedDelivery() {
        LocalDateTime now = LocalDateTime.now();
        return new DeliveryTestDataBuilder()
                .withStatus("DELIVERED")
                .withAssignedAt(now.minusMinutes(40))
                .withAcceptedAt(now.minusMinutes(38))
                .withPickedUpAt(now.minusMinutes(25))
                .withDeliveredAt(now)
                .withActualDeliveryMinutes(40)
                .withOnTime(true)
                .withCustomerRating(5)
                .withCustomerFeedback("Great service");
    }

    public static DeliveryTestDataBuilder aRejectedDelivery() {
        return new DeliveryTestDataBuilder()
                .withStatus("REJECTED")
                .withRejectionReason("Too far away")
                .withRejectedAt(LocalDateTime.now())
                .withReassignmentCount(1);
    }

    // Builder methods

    public DeliveryTestDataBuilder withId(String id) {
        this.id = id;
        return this;
    }

    public DeliveryTestDataBuilder withOrderId(String orderId) {
        this.orderId = orderId;
        return this;
    }

    public DeliveryTestDataBuilder withDriverId(String driverId) {
        this.driverId = driverId;
        return this;
    }

    public DeliveryTestDataBuilder withStoreId(String storeId) {
        this.storeId = storeId;
        return this;
    }

    public DeliveryTestDataBuilder withDriverName(String driverName) {
        this.driverName = driverName;
        return this;
    }

    public DeliveryTestDataBuilder withDriverPhone(String driverPhone) {
        this.driverPhone = driverPhone;
        return this;
    }

    public DeliveryTestDataBuilder withPickupAddress(Map<String, Object> pickupAddress) {
        this.pickupAddress = pickupAddress;
        return this;
    }

    public DeliveryTestDataBuilder withDeliveryAddress(Map<String, Object> deliveryAddress) {
        this.deliveryAddress = deliveryAddress;
        return this;
    }

    public DeliveryTestDataBuilder withDispatchMethod(String dispatchMethod) {
        this.dispatchMethod = dispatchMethod;
        return this;
    }

    public DeliveryTestDataBuilder withPriorityLevel(String priorityLevel) {
        this.priorityLevel = priorityLevel;
        return this;
    }

    public DeliveryTestDataBuilder withAssignedAt(LocalDateTime assignedAt) {
        this.assignedAt = assignedAt;
        return this;
    }

    public DeliveryTestDataBuilder withAcceptedAt(LocalDateTime acceptedAt) {
        this.acceptedAt = acceptedAt;
        return this;
    }

    public DeliveryTestDataBuilder withPickedUpAt(LocalDateTime pickedUpAt) {
        this.pickedUpAt = pickedUpAt;
        return this;
    }

    public DeliveryTestDataBuilder withDeliveredAt(LocalDateTime deliveredAt) {
        this.deliveredAt = deliveredAt;
        return this;
    }

    public DeliveryTestDataBuilder withStatus(String status) {
        this.status = status;
        return this;
    }

    public DeliveryTestDataBuilder withRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
        return this;
    }

    public DeliveryTestDataBuilder withRejectedAt(LocalDateTime rejectedAt) {
        this.rejectedAt = rejectedAt;
        return this;
    }

    public DeliveryTestDataBuilder withReassignmentCount(Integer reassignmentCount) {
        this.reassignmentCount = reassignmentCount;
        return this;
    }

    public DeliveryTestDataBuilder withAcceptanceTimeoutMinutes(Integer acceptanceTimeoutMinutes) {
        this.acceptanceTimeoutMinutes = acceptanceTimeoutMinutes;
        return this;
    }

    public DeliveryTestDataBuilder withDistanceKm(BigDecimal distanceKm) {
        this.distanceKm = distanceKm;
        return this;
    }

    public DeliveryTestDataBuilder withEstimatedDeliveryMinutes(Integer estimatedDeliveryMinutes) {
        this.estimatedDeliveryMinutes = estimatedDeliveryMinutes;
        return this;
    }

    public DeliveryTestDataBuilder withActualDeliveryMinutes(Integer actualDeliveryMinutes) {
        this.actualDeliveryMinutes = actualDeliveryMinutes;
        return this;
    }

    public DeliveryTestDataBuilder withOnTime(Boolean onTime) {
        this.onTime = onTime;
        return this;
    }

    public DeliveryTestDataBuilder withCustomerRating(Integer customerRating) {
        this.customerRating = customerRating;
        return this;
    }

    public DeliveryTestDataBuilder withCustomerFeedback(String customerFeedback) {
        this.customerFeedback = customerFeedback;
        return this;
    }

    public Map<String, Object> build() {
        Map<String, Object> tracking = new HashMap<>();
        tracking.put("id", id);
        tracking.put("orderId", orderId);
        tracking.put("driverId", driverId);
        tracking.put("storeId", storeId);
        tracking.put("driverName", driverName);
        tracking.put("driverPhone", driverPhone);
        tracking.put("pickupAddress", pickupAddress);
        tracking.put("deliveryAddress", deliveryAddress);
        tracking.put("dispatchMethod", dispatchMethod);
        tracking.put("priorityLevel", priorityLevel);
        tracking.put("assignedAt", assignedAt != null ? assignedAt.toString() : null);
        tracking.put("status", status);
        tracking.put("reassignmentCount", reassignmentCount);
        tracking.put("acceptanceTimeoutMinutes", acceptanceTimeoutMinutes);
        tracking.put("distanceKm", distanceKm);
        tracking.put("estimatedDeliveryMinutes", estimatedDeliveryMinutes);
        tracking.put("createdAt", createdAt != null ? createdAt.toString() : null);
        tracking.put("updatedAt", updatedAt != null ? updatedAt.toString() : null);

        if (acceptedAt != null) {
            tracking.put("acceptedAt", acceptedAt.toString());
        }
        if (pickedUpAt != null) {
            tracking.put("pickedUpAt", pickedUpAt.toString());
        }
        if (deliveredAt != null) {
            tracking.put("deliveredAt", deliveredAt.toString());
        }
        if (rejectionReason != null) {
            tracking.put("rejectionReason", rejectionReason);
        }
        if (rejectedAt != null) {
            tracking.put("rejectedAt", rejectedAt.toString());
        }
        if (actualDeliveryMinutes != null) {
            tracking.put("actualDeliveryMinutes", actualDeliveryMinutes);
        }
        if (onTime != null) {
            tracking.put("onTime", onTime);
        }
        if (customerRating != null) {
            tracking.put("customerRating", customerRating);
        }
        if (customerFeedback != null) {
            tracking.put("customerFeedback", customerFeedback);
        }

        return tracking;
    }

    // --- DriverLocation builder ---

    /**
     * Build a driver location update map that mirrors the DriverLocation entity.
     */
    public static Map<String, Object> aDriverLocation() {
        return buildDriverLocation(
                TestDataBuilder.randomId(),
                TestDataBuilder.randomId(),
                52.3676,
                4.9041,
                10.0,
                30.0,
                180.0
        );
    }

    /**
     * Build a driver location update with specific coordinates.
     */
    public static Map<String, Object> buildDriverLocation(
            String id, String driverId,
            double latitude, double longitude,
            Double accuracy, Double speed, Double heading) {

        Map<String, Object> location = new HashMap<>();
        location.put("id", id);
        location.put("driverId", driverId);
        location.put("location", new double[]{longitude, latitude});
        location.put("latitude", latitude);
        location.put("longitude", longitude);
        location.put("accuracy", accuracy);
        location.put("speed", speed);
        location.put("heading", heading);
        location.put("timestamp", LocalDateTime.now().toString());
        location.put("createdAt", LocalDateTime.now().toString());
        return location;
    }

    // Address helpers

    private static Map<String, Object> defaultPickupAddress() {
        Map<String, Object> address = new HashMap<>();
        address.put("street", "456 Store Avenue");
        address.put("city", "Amsterdam");
        address.put("state", "North Holland");
        address.put("zipCode", "1013AA");
        address.put("latitude", 52.3792);
        address.put("longitude", 4.8994);
        return address;
    }

    private static Map<String, Object> defaultDeliveryAddress() {
        Map<String, Object> address = new HashMap<>();
        address.put("street", "789 Customer Lane");
        address.put("city", "Amsterdam");
        address.put("state", "North Holland");
        address.put("zipCode", "1017AB");
        address.put("latitude", 52.3600);
        address.put("longitude", 4.8852);
        return address;
    }

    /**
     * Build a custom address map for delivery tracking entities.
     */
    public static Map<String, Object> buildAddress(
            String street, String city, String state, String zipCode,
            Double latitude, Double longitude) {

        Map<String, Object> address = new HashMap<>();
        address.put("street", street);
        address.put("city", city);
        address.put("state", state);
        address.put("zipCode", zipCode);
        address.put("latitude", latitude);
        address.put("longitude", longitude);
        return address;
    }
}
