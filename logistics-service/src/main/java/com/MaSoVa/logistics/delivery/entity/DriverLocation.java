package com.MaSoVa.logistics.delivery.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.GeoSpatialIndexType;
import org.springframework.data.mongodb.core.index.GeoSpatialIndexed;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * Entity to store driver real-time location updates
 */
@Document(collection = "driver_locations")
@CompoundIndexes({
    @CompoundIndex(def = "{'driverId': 1, 'timestamp': -1}")
})
public class DriverLocation {

    @Id
    private String id;

    @Indexed
    private String driverId;

    @GeoSpatialIndexed(type = GeoSpatialIndexType.GEO_2DSPHERE)
    private double[] location; // [longitude, latitude] for MongoDB GeoJSON

    private Double latitude;
    private Double longitude;
    private Double accuracy; // GPS accuracy in meters
    private Double speed; // Speed in km/h
    private Double heading; // Direction in degrees (0-360)

    @Indexed(expireAfterSeconds = 604800) // TTL: auto-delete after 7 days
    private LocalDateTime timestamp;

    private LocalDateTime createdAt;

    public DriverLocation() {
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getDriverId() {
        return driverId;
    }

    public void setDriverId(String driverId) {
        this.driverId = driverId;
    }

    public double[] getLocation() {
        return location;
    }

    public void setLocation(double[] location) {
        this.location = location;
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

    public Double getAccuracy() {
        return accuracy;
    }

    public void setAccuracy(Double accuracy) {
        this.accuracy = accuracy;
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String id;
        private String driverId;
        private double[] location;
        private Double latitude;
        private Double longitude;
        private Double accuracy;
        private Double speed;
        private Double heading;
        private LocalDateTime timestamp;
        private LocalDateTime createdAt;

        public Builder id(String id) {
            this.id = id;
            return this;
        }

        public Builder driverId(String driverId) {
            this.driverId = driverId;
            return this;
        }

        public Builder location(double[] location) {
            this.location = location;
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

        public Builder accuracy(Double accuracy) {
            this.accuracy = accuracy;
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

        public Builder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public DriverLocation build() {
            DriverLocation driverLocation = new DriverLocation();
            driverLocation.id = this.id;
            driverLocation.driverId = this.driverId;
            driverLocation.location = this.location;
            driverLocation.latitude = this.latitude;
            driverLocation.longitude = this.longitude;
            driverLocation.accuracy = this.accuracy;
            driverLocation.speed = this.speed;
            driverLocation.heading = this.heading;
            driverLocation.timestamp = this.timestamp;
            driverLocation.createdAt = this.createdAt;
            return driverLocation;
        }
    }
}
