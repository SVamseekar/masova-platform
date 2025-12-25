package com.MaSoVa.payment.repository;

import com.MaSoVa.payment.entity.Transaction;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends MongoRepository<Transaction, String> {

    Optional<Transaction> findByOrderId(String orderId);

    Optional<Transaction> findByRazorpayOrderId(String razorpayOrderId);

    Optional<Transaction> findByRazorpayPaymentId(String razorpayPaymentId);

    List<Transaction> findByCustomerId(String customerId);

    List<Transaction> findByStoreId(String storeId);

    List<Transaction> findByStatus(Transaction.PaymentStatus status);

    List<Transaction> findByStoreIdAndStatus(String storeId, Transaction.PaymentStatus status);

    /**
     * @deprecated Use findByStoreIdAndCreatedAtBetween instead for store data isolation
     */
    @Deprecated
    @Query("{ 'createdAt' : { $gte: ?0, $lte: ?1 } }")
    List<Transaction> findTransactionsBetweenDates(LocalDateTime startDate, LocalDateTime endDate);

    @Query("{ 'storeId': ?0, 'createdAt' : { $gte: ?1, $lte: ?2 } }")
    List<Transaction> findByStoreIdAndCreatedAtBetween(String storeId, LocalDateTime startDate, LocalDateTime endDate);

    @Query("{ 'storeId': ?0, 'status': 'SUCCESS', 'createdAt' : { $gte: ?1, $lte: ?2 } }")
    List<Transaction> findSuccessfulTransactionsByStoreAndDateRange(String storeId, LocalDateTime startDate, LocalDateTime endDate);

    List<Transaction> findByReconciledFalse();
}
