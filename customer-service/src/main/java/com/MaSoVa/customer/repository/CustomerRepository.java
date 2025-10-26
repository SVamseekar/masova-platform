package com.MaSoVa.customer.repository;

import com.MaSoVa.customer.entity.Customer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerRepository extends MongoRepository<Customer, String> {

    // Basic lookups
    Optional<Customer> findByUserId(String userId);
    Optional<Customer> findByEmail(String email);
    Optional<Customer> findByPhone(String phone);

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
}
