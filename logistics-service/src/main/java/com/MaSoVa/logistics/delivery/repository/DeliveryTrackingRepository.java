package com.MaSoVa.logistics.delivery.repository;

import com.MaSoVa.logistics.delivery.entity.DeliveryTracking;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository for DeliveryTracking entity
 */
@Repository
public interface DeliveryTrackingRepository extends MongoRepository<DeliveryTracking, String> {

    Optional<DeliveryTracking> findByOrderId(String orderId);

    List<DeliveryTracking> findByDriverIdAndStatus(String driverId, String status);

    List<DeliveryTracking> findByDriverIdAndCreatedAtBetween(
            String driverId,
            LocalDateTime start,
            LocalDateTime end
    );

    List<DeliveryTracking> findByStatusAndStoreId(String status, String storeId);

    Long countByDriverIdAndStatusAndCreatedAtBetween(
            String driverId,
            String status,
            LocalDateTime start,
            LocalDateTime end
    );

    // Week 4: Store-aware queries for performance metrics
    List<DeliveryTracking> findByDriverIdAndStoreIdAndCreatedAtBetween(
            String driverId,
            String storeId,
            LocalDateTime start,
            LocalDateTime end
    );

    List<DeliveryTracking> findByStoreIdAndCreatedAtBetween(
            String storeId,
            LocalDateTime start,
            LocalDateTime end
    );
}
