package com.MaSoVa.payment.repository;

import com.MaSoVa.payment.entity.Refund;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface RefundRepository extends MongoRepository<Refund, String> {

    Optional<Refund> findByRazorpayRefundId(String razorpayRefundId);

    List<Refund> findByTransactionId(String transactionId);

    List<Refund> findByOrderId(String orderId);

    List<Refund> findByCustomerId(String customerId);

    List<Refund> findByStatus(Refund.RefundStatus status);

    List<Refund> findByInitiatedBy(String userId);

    // Week 4: Store-aware queries for proper data isolation
    List<Refund> findByStoreId(String storeId);

    List<Refund> findByStoreIdAndStatus(String storeId, Refund.RefundStatus status);

    @Query("{ 'storeId': ?0, 'createdAt' : { $gte: ?1, $lte: ?2 } }")
    List<Refund> findByStoreIdAndCreatedAtBetween(String storeId, LocalDateTime startDate, LocalDateTime endDate);

    List<Refund> findByStoreIdAndCustomerId(String storeId, String customerId);
}
