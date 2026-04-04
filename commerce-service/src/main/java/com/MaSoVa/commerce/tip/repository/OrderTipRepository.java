package com.MaSoVa.commerce.tip.repository;

import com.MaSoVa.commerce.tip.entity.OrderTipEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrderTipRepository extends JpaRepository<OrderTipEntity, UUID> {

    Optional<OrderTipEntity> findByOrderId(String orderId);

    /** All undistributed tips for a store — used by core-service weekly distribution job */
    @Query("SELECT t FROM OrderTipEntity t WHERE t.storeId = :storeId AND t.distributed = false AND t.deletedAt IS NULL")
    List<OrderTipEntity> findUndistributedByStore(@Param("storeId") String storeId);

    /** Undistributed direct tips for a specific staff member */
    @Query("SELECT t FROM OrderTipEntity t WHERE t.recipientStaffId = :staffId AND t.distributed = false AND t.deletedAt IS NULL")
    List<OrderTipEntity> findUndistributedDirectTipsForStaff(@Param("staffId") String staffId);
}
