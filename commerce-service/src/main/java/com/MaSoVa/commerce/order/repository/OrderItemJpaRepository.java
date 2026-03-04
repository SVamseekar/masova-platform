package com.MaSoVa.commerce.order.repository;

import com.MaSoVa.commerce.order.entity.OrderItemJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * JPA repository for PostgreSQL order_items table (Phase 2 dual-write).
 * Used for re-syncing line items when updateOrderItems is called.
 * Line items are append-only in normal flow; this delete is only used
 * during the dual-write sync when items are modified before kitchen prep.
 */
@Repository
public interface OrderItemJpaRepository extends JpaRepository<OrderItemJpaEntity, String> {

    /**
     * Bulk-delete all line items for a given order.
     * MUST only be called from within an active transaction (i.e., OrderItemSyncService.syncOrderItems).
     * clearAutomatically=true flushes the L1 cache after the JPQL delete to prevent stale entity state.
     */
    @Modifying(clearAutomatically = true)
    @Query("DELETE FROM OrderItemJpaEntity i WHERE i.order.id = :orderId")
    void deleteByOrderId(@Param("orderId") String orderId);
}
