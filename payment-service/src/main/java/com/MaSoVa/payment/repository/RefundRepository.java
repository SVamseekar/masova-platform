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

    @Query("{ 'createdAt' : { $gte: ?0, $lte: ?1 } }")
    List<Refund> findRefundsBetweenDates(LocalDateTime startDate, LocalDateTime endDate);

    List<Refund> findByInitiatedBy(String userId);
}
