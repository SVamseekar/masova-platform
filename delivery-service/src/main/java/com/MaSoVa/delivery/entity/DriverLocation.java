package com.MaSoVa.delivery.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.GeoSpatialIndexType;
import org.springframework.data.mongodb.core.index.GeoSpatialIndexed;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * Entity to store driver real-time location updates
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "driver_locations")
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

    @Indexed
    private LocalDateTime timestamp;

    private LocalDateTime createdAt;
}
