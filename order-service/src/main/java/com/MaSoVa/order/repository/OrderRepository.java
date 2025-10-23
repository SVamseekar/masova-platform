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
}
