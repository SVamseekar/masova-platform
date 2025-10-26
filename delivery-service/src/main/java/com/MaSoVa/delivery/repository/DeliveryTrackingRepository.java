package com.MaSoVa.delivery.repository;

import com.MaSoVa.delivery.entity.DeliveryTracking;
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
}
