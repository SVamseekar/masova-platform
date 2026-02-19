package com.MaSoVa.logistics.delivery.repository;

import com.MaSoVa.logistics.delivery.entity.DriverLocation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository for DriverLocation entity
 */
@Repository
public interface DriverLocationRepository extends MongoRepository<DriverLocation, String> {

    Optional<DriverLocation> findTopByDriverIdOrderByTimestampDesc(String driverId);

    List<DriverLocation> findByDriverIdAndTimestampBetween(
            String driverId,
            LocalDateTime start,
            LocalDateTime end
    );

    void deleteByTimestampBefore(LocalDateTime cutoffTime);
}
