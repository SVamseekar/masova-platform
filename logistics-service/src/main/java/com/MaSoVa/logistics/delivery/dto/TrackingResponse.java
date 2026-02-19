package com.MaSoVa.logistics.delivery.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Response DTO for customer order tracking
 */
public class TrackingResponse {

    private String orderId;
    private String orderStatus; // PREPARING, OUT_FOR_DELIVERY, DELIVERED
    private DriverInfo driver;
    private LocationInfo currentLocation;
    private Integer estimatedArrivalMinutes;
    private BigDecimal distanceRemainingKm;
    private LocalDateTime lastUpdated;

    public TrackingResponse() {
    }

    public static Builder builder() {
        return new Builder();
    }

    public String getOrderId() {
        return orderId;
    }

    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }

    public String getOrderStatus() {
        return orderStatus;
    }

    public void setOrderStatus(String orderStatus) {
        this.orderStatus = orderStatus;
    }

    public DriverInfo getDriver() {
        return driver;
    }

    public void setDriver(DriverInfo driver) {
        this.driver = driver;
    }

    public LocationInfo getCurrentLocation() {
        return currentLocation;
    }

    public void setCurrentLocation(LocationInfo currentLocation) {
        this.currentLocation = currentLocation;
    }

    public Integer getEstimatedArrivalMinutes() {
        return estimatedArrivalMinutes;
    }

    public void setEstimatedArrivalMinutes(Integer estimatedArrivalMinutes) {
        this.estimatedArrivalMinutes = estimatedArrivalMinutes;
    }

    public BigDecimal getDistanceRemainingKm() {
        return distanceRemainingKm;
    }

    public void setDistanceRemainingKm(BigDecimal distanceRemainingKm) {
        this.distanceRemainingKm = distanceRemainingKm;
    }

    public LocalDateTime getLastUpdated() {
        return lastUpdated;
    }

    public void setLastUpdated(LocalDateTime lastUpdated) {
        this.lastUpdated = lastUpdated;
    }

    public static class Builder {
        private String orderId;
        private String orderStatus;
        private DriverInfo driver;
        private LocationInfo currentLocation;
        private Integer estimatedArrivalMinutes;
        private BigDecimal distanceRemainingKm;
        private LocalDateTime lastUpdated;

        public Builder orderId(String orderId) {
            this.orderId = orderId;
            return this;
        }

        public Builder orderStatus(String orderStatus) {
            this.orderStatus = orderStatus;
            return this;
        }

        public Builder driver(DriverInfo driver) {
            this.driver = driver;
            return this;
        }

        public Builder currentLocation(LocationInfo currentLocation) {
            this.currentLocation = currentLocation;
            return this;
        }

        public Builder estimatedArrivalMinutes(Integer estimatedArrivalMinutes) {
            this.estimatedArrivalMinutes = estimatedArrivalMinutes;
            return this;
        }

        public Builder distanceRemainingKm(BigDecimal distanceRemainingKm) {
            this.distanceRemainingKm = distanceRemainingKm;
            return this;
        }

        public Builder lastUpdated(LocalDateTime lastUpdated) {
            this.lastUpdated = lastUpdated;
            return this;
        }

        public TrackingResponse build() {
            TrackingResponse response = new TrackingResponse();
            response.orderId = this.orderId;
            response.orderStatus = this.orderStatus;
            response.driver = this.driver;
            response.currentLocation = this.currentLocation;
            response.estimatedArrivalMinutes = this.estimatedArrivalMinutes;
            response.distanceRemainingKm = this.distanceRemainingKm;
            response.lastUpdated = this.lastUpdated;
            return response;
        }
    }

    public static class DriverInfo {
        private String driverId;
        private String driverName;
        private String driverPhone;
        private String vehicleInfo;

        public DriverInfo() {
        }

        public static Builder builder() {
            return new Builder();
        }

        public String getDriverId() {
            return driverId;
        }

        public void setDriverId(String driverId) {
            this.driverId = driverId;
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

        public String getVehicleInfo() {
            return vehicleInfo;
        }

        public void setVehicleInfo(String vehicleInfo) {
            this.vehicleInfo = vehicleInfo;
        }

        public static class Builder {
            private String driverId;
            private String driverName;
            private String driverPhone;
            private String vehicleInfo;

            public Builder driverId(String driverId) {
                this.driverId = driverId;
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

            public Builder vehicleInfo(String vehicleInfo) {
                this.vehicleInfo = vehicleInfo;
                return this;
            }

            public DriverInfo build() {
                DriverInfo driverInfo = new DriverInfo();
                driverInfo.driverId = this.driverId;
                driverInfo.driverName = this.driverName;
                driverInfo.driverPhone = this.driverPhone;
                driverInfo.vehicleInfo = this.vehicleInfo;
                return driverInfo;
            }
        }
    }

    public static class LocationInfo {
        private Double latitude;
        private Double longitude;
        private Double speed;
        private Double heading;
        private LocalDateTime timestamp;

        public LocationInfo() {
        }

        public static Builder builder() {
            return new Builder();
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

        public Double getSpeed() {
            return speed;
        }

        public void setSpeed(Double speed) {
            this.speed = speed;
        }

        public Double getHeading() {
            return heading;
        }

        public void setHeading(Double heading) {
            this.heading = heading;
        }

        public LocalDateTime getTimestamp() {
            return timestamp;
        }

        public void setTimestamp(LocalDateTime timestamp) {
            this.timestamp = timestamp;
        }

        public static class Builder {
            private Double latitude;
            private Double longitude;
            private Double speed;
            private Double heading;
            private LocalDateTime timestamp;

            public Builder latitude(Double latitude) {
                this.latitude = latitude;
                return this;
            }

            public Builder longitude(Double longitude) {
                this.longitude = longitude;
                return this;
            }

            public Builder speed(Double speed) {
                this.speed = speed;
                return this;
            }

            public Builder heading(Double heading) {
                this.heading = heading;
                return this;
            }

            public Builder timestamp(LocalDateTime timestamp) {
                this.timestamp = timestamp;
                return this;
            }

            public LocationInfo build() {
                LocationInfo locationInfo = new LocationInfo();
                locationInfo.latitude = this.latitude;
                locationInfo.longitude = this.longitude;
                locationInfo.speed = this.speed;
                locationInfo.heading = this.heading;
                locationInfo.timestamp = this.timestamp;
                return locationInfo;
            }
        }
    }
}
