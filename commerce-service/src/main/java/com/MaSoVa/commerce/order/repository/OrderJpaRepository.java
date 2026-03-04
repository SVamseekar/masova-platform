package com.MaSoVa.commerce.order.repository;

import com.MaSoVa.commerce.order.entity.OrderJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * JPA repository for PostgreSQL orders table (Phase 2 dual-write).
 * MongoDB OrderRepository remains the primary read source during dual-write period.
 */
@Repository
public interface OrderJpaRepository extends JpaRepository<OrderJpaEntity, String> {

    Optional<OrderJpaEntity> findByMongoId(String mongoId);

    Optional<OrderJpaEntity> findByOrderNumber(String orderNumber);

    List<OrderJpaEntity> findByStoreIdAndStatus(String storeId, String status);

    @Query("SELECT o FROM OrderJpaEntity o WHERE o.storeId = :storeId ORDER BY o.createdAt DESC")
    List<OrderJpaEntity> findByStoreIdOrderByCreatedAtDesc(@Param("storeId") String storeId);
}
