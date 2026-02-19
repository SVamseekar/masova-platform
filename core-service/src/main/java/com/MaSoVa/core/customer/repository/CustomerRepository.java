package com.MaSoVa.core.customer.repository;

import com.MaSoVa.core.customer.entity.Customer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerRepository extends MongoRepository<Customer, String> {

    // Basic lookups
    Optional<Customer> findByUserId(String userId);
    Optional<Customer> findByEmail(String email);
    Optional<Customer> findByPhone(String phone);
    boolean existsByStoreIdAndEmail(String storeId, String email);
    boolean existsByStoreIdAndPhone(String storeId, String phone);

    // Active customers
    List<Customer> findByActiveTrue();
    long countByActiveTrue();

    // Search
    @Query("{ $or: [ " +
           "{ 'name': { $regex: ?0, $options: 'i' } }, " +
           "{ 'email': { $regex: ?0, $options: 'i' } }, " +
           "{ 'phone': { $regex: ?0, $options: 'i' } } " +
           "] }")
    Page<Customer> searchCustomers(String searchTerm, Pageable pageable);

    // Loyalty tier queries
    @Query("{ 'loyaltyInfo.tier': ?0, 'active': true }")
    List<Customer> findByLoyaltyTier(String tier);

    @Query("{ 'loyaltyInfo.totalPoints': { $gte: ?0 }, 'active': true }")
    List<Customer> findByMinimumLoyaltyPoints(int minPoints);

    // Order statistics
    @Query("{ 'orderStats.totalOrders': { $gte: ?0 }, 'active': true }")
    List<Customer> findByMinimumOrderCount(int minOrders);

    @Query("{ 'orderStats.totalSpent': { $gte: ?0 }, 'active': true }")
    List<Customer> findByMinimumSpending(double minSpending);

    // High-value customers (top spenders)
    @Query(value = "{ 'active': true }", sort = "{ 'orderStats.totalSpent': -1 }")
    List<Customer> findTopSpenders(Pageable pageable);

    // Recently active customers
    @Query("{ 'lastOrderDate': { $gte: ?0 }, 'active': true }")
    List<Customer> findRecentlyActiveCustomers(LocalDateTime since);

    // Inactive customers (no orders since date)
    @Query("{ $or: [ { 'lastOrderDate': { $lt: ?0 } }, { 'lastOrderDate': null } ], 'active': true }")
    List<Customer> findInactiveCustomersSince(LocalDateTime since);

    // Birthday customers
    @Query("{ $expr: { $and: [ " +
           "{ $eq: [ { $month: '$dateOfBirth' }, ?1 ] }, " +
           "{ $eq: [ { $dayOfMonth: '$dateOfBirth' }, ?2 ] } " +
           "] }, 'active': true }")
    List<Customer> findBirthdayCustomers(int month, int dayOfMonth);

    // Customers by date range
    List<Customer> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    // Tag-based queries
    @Query("{ 'tags': { $in: ?0 }, 'active': true }")
    List<Customer> findByTags(List<String> tags);

    // Email/SMS preferences
    @Query("{ 'marketingOptIn': true, 'emailVerified': true, 'active': true }")
    List<Customer> findMarketingOptInCustomers();

    @Query("{ 'smsOptIn': true, 'phoneVerified': true, 'active': true }")
    List<Customer> findSmsOptInCustomers();

    // Verification status
    List<Customer> findByEmailVerifiedFalse();
    List<Customer> findByPhoneVerifiedFalse();

    // Count queries
    long countByLoyaltyInfo_Tier(String tier);

    @Query(value = "{ 'orderStats.totalSpent': { $gte: ?0 }, 'active': true }", count = true)
    long countHighValueCustomers(double minSpending);

    // Count verified emails/phones
    long countByEmailVerifiedTrue();
    long countByPhoneVerifiedTrue();

    @Query(value = "{ 'storeId': ?0, 'emailVerified': true }", count = true)
    long countByStoreIdAndEmailVerifiedTrue(String storeId);

    @Query(value = "{ 'storeId': ?0, 'phoneVerified': true }", count = true)
    long countByStoreIdAndPhoneVerifiedTrue(String storeId);

    // Average total spent
    @Query(value = "{ 'active': true }", fields = "{ 'orderStats.totalSpent': 1 }")
    List<Customer> findAllWithOrderStats();

    // Store-based queries
    List<Customer> findByStoreId(String storeId);

    @Query("{ 'storeId': ?0, 'active': true }")
    List<Customer> findActiveCustomersByStoreId(String storeId);

    @Query("{ 'storeId': ?0, $or: [ " +
           "{ 'name': { $regex: ?1, $options: 'i' } }, " +
           "{ 'email': { $regex: ?1, $options: 'i' } }, " +
           "{ 'phone': { $regex: ?1, $options: 'i' } } " +
           "] }")
    Page<Customer> searchCustomersByStoreId(String storeId, String searchTerm, Pageable pageable);

    @Query("{ 'storeId': ?0, 'loyaltyInfo.tier': ?1, 'active': true }")
    List<Customer> findByStoreIdAndLoyaltyTier(String storeId, String tier);

    @Query("{ 'storeId': ?0, 'orderStats.totalSpent': { $gte: ?1 }, 'active': true }")
    List<Customer> findHighValueCustomersByStoreId(String storeId, double minSpending);

    @Query(value = "{ 'storeId': ?0, 'active': true }", sort = "{ 'orderStats.totalSpent': -1 }")
    List<Customer> findTopSpendersByStoreId(String storeId, Pageable pageable);

    @Query("{ 'storeId': ?0, 'lastOrderDate': { $gte: ?1 }, 'active': true }")
    List<Customer> findRecentlyActiveCustomersByStoreId(String storeId, LocalDateTime since);

    @Query("{ 'storeId': ?0, $or: [ { 'lastOrderDate': { $lt: ?1 } }, { 'lastOrderDate': null } ], 'active': true }")
    List<Customer> findInactiveCustomersByStoreId(String storeId, LocalDateTime since);

    @Query("{ 'storeId': ?0, $expr: { $and: [ " +
           "{ $eq: [ { $month: '$dateOfBirth' }, ?1 ] }, " +
           "{ $eq: [ { $dayOfMonth: '$dateOfBirth' }, ?2 ] } " +
           "] }, 'active': true }")
    List<Customer> findBirthdayCustomersByStoreId(String storeId, int month, int dayOfMonth);

    @Query("{ 'storeId': ?0, 'tags': { $in: ?1 }, 'active': true }")
    List<Customer> findByStoreIdAndTags(String storeId, List<String> tags);

    @Query("{ 'storeId': ?0, 'marketingOptIn': true, 'emailVerified': true, 'active': true }")
    List<Customer> findMarketingOptInCustomersByStoreId(String storeId);

    @Query("{ 'storeId': ?0, 'smsOptIn': true, 'phoneVerified': true, 'active': true }")
    List<Customer> findSmsOptInCustomersByStoreId(String storeId);

    @Query(value = "{ 'storeId': ?0, 'active': true }", count = true)
    long countActiveCustomersByStoreId(String storeId);

    @Query(value = "{ 'storeId': ?0, 'orderStats.totalSpent': { $gte: ?1 }, 'active': true }", count = true)
    long countHighValueCustomersByStoreId(String storeId, double minSpending);

    // ==========================================
    // Multi-Store Support Queries (using storeIds array)
    // ==========================================

    /**
     * Find all customers who have ordered from a specific store (multi-store support)
     */
    @Query("{ 'storeIds': ?0 }")
    List<Customer> findByStoreIdsContaining(String storeId);

    /**
     * Find active customers who have ordered from a specific store
     */
    @Query("{ 'storeIds': ?0, 'active': true }")
    List<Customer> findActiveCustomersByStoreIdsContaining(String storeId);

    /**
     * Search customers by store (multi-store support)
     */
    @Query("{ 'storeIds': ?0, $or: [ " +
           "{ 'name': { $regex: ?1, $options: 'i' } }, " +
           "{ 'email': { $regex: ?1, $options: 'i' } }, " +
           "{ 'phone': { $regex: ?1, $options: 'i' } } " +
           "] }")
    Page<Customer> searchCustomersByStoreIdsContaining(String storeId, String searchTerm, Pageable pageable);

    /**
     * Count active customers by store (multi-store support)
     */
    @Query(value = "{ 'storeIds': ?0, 'active': true }", count = true)
    long countActiveCustomersByStoreIdsContaining(String storeId);

    /**
     * Find top spenders by store (multi-store support)
     */
    @Query(value = "{ 'storeIds': ?0, 'active': true }", sort = "{ 'orderStats.totalSpent': -1 }")
    List<Customer> findTopSpendersByStoreIdsContaining(String storeId, Pageable pageable);

    /**
     * Find recently active customers by store (multi-store support)
     */
    @Query("{ 'storeIds': ?0, 'lastOrderDate': { $gte: ?1 }, 'active': true }")
    List<Customer> findRecentlyActiveCustomersByStoreIdsContaining(String storeId, LocalDateTime since);

    /**
     * Find customers by store and loyalty tier (multi-store support)
     */
    @Query("{ 'storeIds': ?0, 'loyaltyInfo.tier': ?1, 'active': true }")
    List<Customer> findByStoreIdsContainingAndLoyaltyTier(String storeId, String tier);

    /**
     * Find marketing opt-in customers by store (multi-store support)
     */
    @Query("{ 'storeIds': ?0, 'marketingOptIn': true, 'emailVerified': true, 'active': true }")
    List<Customer> findMarketingOptInCustomersByStoreIdsContaining(String storeId);

    /**
     * Find SMS opt-in customers by store (multi-store support)
     */
    @Query("{ 'storeIds': ?0, 'smsOptIn': true, 'phoneVerified': true, 'active': true }")
    List<Customer> findSmsOptInCustomersByStoreIdsContaining(String storeId);

    // ==========================================
    // GDPR Data Retention Queries
    // ==========================================

    /**
     * Find soft-deleted customers ready for hard deletion.
     * Used by retention service to purge records past retention period.
     */
    @Query("{ 'active': false, 'deletedAt': { $lt: ?1 } }")
    List<Customer> findByActiveAndDeletedAtBefore(boolean active, LocalDateTime cutoff);

    /**
     * Count soft-deleted customers ready for hard deletion.
     */
    @Query(value = "{ 'active': false, 'deletedAt': { $lt: ?1 } }", count = true)
    long countByActiveAndDeletedAtBefore(boolean active, LocalDateTime cutoff);

    /**
     * Find active customers with last order date before cutoff (inactive customers).
     */
    @Query("{ 'active': ?0, 'lastOrderDate': { $lt: ?1 } }")
    List<Customer> findByActiveAndLastOrderDateBefore(boolean active, LocalDateTime cutoff);

    /**
     * Count inactive customers for retention reporting.
     */
    @Query(value = "{ 'active': ?0, 'lastOrderDate': { $lt: ?1 } }", count = true)
    long countByActiveAndLastOrderDateBefore(boolean active, LocalDateTime cutoff);

    /**
     * Find active customers with no orders ever and created before cutoff.
     */
    @Query("{ 'active': ?0, 'lastOrderDate': null, 'createdAt': { $lt: ?1 } }")
    List<Customer> findByActiveAndLastOrderDateIsNullAndCreatedAtBefore(boolean active, LocalDateTime cutoff);

    /**
     * Find customers with loyalty points and no activity since cutoff.
     */
    @Query("{ 'loyaltyInfo.totalPoints': { $gt: ?0 }, 'lastOrderDate': { $lt: ?1 }, 'active': true }")
    List<Customer> findByLoyaltyInfoPointsGreaterThanAndLastOrderDateBefore(int minPoints, LocalDateTime cutoff);

    /**
     * Count customers with expiring loyalty points.
     */
    @Query(value = "{ 'loyaltyInfo.totalPoints': { $gt: ?0 }, 'lastOrderDate': { $lt: ?1 }, 'active': true }", count = true)
    long countByLoyaltyInfoPointsGreaterThanAndLastOrderDateBefore(int minPoints, LocalDateTime cutoff);

    /**
     * Count all active customers.
     */
    long countByActive(boolean active);
}
