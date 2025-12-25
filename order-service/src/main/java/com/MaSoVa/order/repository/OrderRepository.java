package com.MaSoVa.order.repository;

import com.MaSoVa.order.entity.Order;
import com.MaSoVa.order.entity.Order.OrderStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends MongoRepository<Order, String> {

    Optional<Order> findByOrderNumber(String orderNumber);

    List<Order> findByStoreIdAndStatusIn(String storeId, List<OrderStatus> statuses);

    List<Order> findByStoreIdAndStatus(String storeId, OrderStatus status);

    List<Order> findByStoreIdOrderByCreatedAtDesc(String storeId);

    List<Order> findByCustomerId(String customerId);

    List<Order> findByCustomerIdOrderByCreatedAtDesc(String customerId);

    List<Order> findByAssignedDriverId(String driverId);

    @Query("{ 'storeId': ?0, 'createdAt': { $gte: ?1, $lte: ?2 } }")
    List<Order> findByStoreIdAndDateRange(String storeId, LocalDateTime startDate, LocalDateTime endDate);

    Long countByStoreIdAndStatus(String storeId, OrderStatus status);

    @Query("{ 'storeId': ?0, 'status': { $in: ?1 } }")
    List<Order> findActiveOrdersByStore(String storeId, List<String> statuses);

    boolean existsByOrderNumber(String orderNumber);

    // Analytics queries - ALL queries MUST filter by storeId for data isolation

    /**
     * @deprecated Use findByStoreIdAndCreatedAtBetween instead for store data isolation
     */
    @Deprecated
    @Query("{ 'createdAt': { $gte: ?0, $lte: ?1 } }")
    List<Order> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    @Query("{ 'storeId': ?0, 'createdAt': { $gte: ?1, $lte: ?2 } }")
    List<Order> findByStoreIdAndCreatedAtBetween(String storeId, LocalDateTime start, LocalDateTime end);

    @Query("{ 'storeId': ?0, 'createdByStaffId': ?1, 'createdAt': { $gte: ?2, $lte: ?3 } }")
    List<Order> findByStoreIdAndCreatedByAndCreatedAtBetween(String storeId, String createdBy, LocalDateTime start, LocalDateTime end);

    /**
     * @deprecated Use findByStoreIdAndCreatedByAndCreatedAtBetween instead for store data isolation
     */
    @Deprecated
    @Query("{ 'createdByStaffId': ?0, 'createdAt': { $gte: ?1, $lte: ?2 } }")
    List<Order> findByCreatedByAndCreatedAtBetween(String createdBy, LocalDateTime start, LocalDateTime end);

    @Query("{ 'storeId': ?0, 'orderType': 'DELIVERY', 'status': { $in: ['PREPARING', 'OVEN', 'BAKED', 'DISPATCHED'] } }")
    List<Order> findActiveDeliveriesByStoreId(String storeId);

    /**
     * @deprecated Use findActiveDeliveriesByStoreId instead for store data isolation
     */
    @Deprecated
    @Query("{ 'orderType': 'DELIVERY', 'status': { $in: ['PREPARING', 'OVEN', 'BAKED', 'DISPATCHED'] } }")
    List<Order> findActiveDeliveries();

    // Kitchen staff performance queries
    @Query("{ 'assignedKitchenStaffId': ?0, 'createdAt': { $gte: ?1, $lte: ?2 } }")
    List<Order> findByAssignedKitchenStaffIdAndCreatedAtBetween(String staffId, LocalDateTime start, LocalDateTime end);

    @Query("{ 'storeId': ?0, 'assignedKitchenStaffId': ?1, 'createdAt': { $gte: ?2, $lte: ?3 } }")
    List<Order> findByStoreIdAndAssignedKitchenStaffIdAndCreatedAtBetween(String storeId, String staffId, LocalDateTime start, LocalDateTime end);

    // POS staff performance queries
    @Query("{ 'createdByStaffId': ?0, 'createdAt': { $gte: ?1, $lte: ?2 } }")
    List<Order> findByCreatedByStaffIdAndCreatedAtBetween(String staffId, LocalDateTime start, LocalDateTime end);

    @Query("{ 'storeId': ?0, 'createdByStaffId': ?1, 'createdAt': { $gte: ?2, $lte: ?3 } }")
    List<Order> findByStoreIdAndCreatedByStaffIdAndCreatedAtBetween(String storeId, String staffId, LocalDateTime start, LocalDateTime end);
}
