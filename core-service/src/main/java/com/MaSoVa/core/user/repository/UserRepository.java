package com.MaSoVa.core.user.repository;

import com.MaSoVa.shared.entity.User;
import com.MaSoVa.shared.enums.UserType;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends MongoRepository<User, String> {

    @Query("{'personalInfo.email': ?0}")
    Optional<User> findByPersonalInfoEmail(String email);

    @Query("{'personalInfo.phone': ?0}")
    Optional<User> findByPersonalInfoPhone(String phone);

    @Query(value = "{'personalInfo.email': ?0}", exists = true)
    boolean existsByPersonalInfoEmail(String email);

    @Query(value = "{'personalInfo.phone': ?0}", exists = true)
    boolean existsByPersonalInfoPhone(String phone);
    
    List<User> findByType(UserType type);
    
    List<User> findByTypeAndIsActive(UserType type, boolean isActive);
    
    @Query("{'employeeDetails.storeId': ?0}")
    List<User> findByStoreId(String storeId);
    
    @Query("{'employeeDetails.storeId': ?0, 'type': ?1}")
    List<User> findByStoreIdAndType(String storeId, UserType type);
    
    @Query("{'employeeDetails.storeId': ?0, 'type': {$in: ?1}}")
    List<User> findByStoreIdAndTypeIn(String storeId, List<UserType> types);

    @Query("{'type': ?0, 'employeeDetails.storeId': ?1}")
    List<User> findByTypeAndEmployeeDetailsStoreId(UserType type, String storeId);

    @Query("{'type': {$in: [?0, ?1]}, 'isActive': true}")
    List<User> findActiveManagersAndAssistants(UserType manager, UserType assistantManager);
    
    @Query("{'lastLogin': {$gte: ?0}}")
    List<User> findUsersLoggedInAfter(LocalDateTime dateTime);
    
    @Query("{'type': {$ne: 'CUSTOMER'}, 'isActive': true}")
    List<User> findAllActiveEmployees();

    // Count queries for statistics
    long countByType(UserType type);

    long countByIsActive(boolean isActive);

    @Query(value = "{'lastLogin': {$gte: ?0}}", count = true)
    long countByLastLoginAfter(LocalDateTime dateTime);

    // Search support - add pagination-friendly methods
    @Query("{'personalInfo.name': {$regex: ?0, $options: 'i'}}")
    List<User> findByNameContainingIgnoreCase(String name);

    @Query("{'personalInfo.email': {$regex: ?0, $options: 'i'}}")
    List<User> findByEmailContainingIgnoreCase(String email);

    @Query("{'personalInfo.phone': {$regex: ?0}}")
    List<User> findByPhoneContaining(String phone);

    // Inactive users for GDPR
    @Query("{'isActive': ?0, 'lastLogin': {$lt: ?1}}")
    List<User> findByActiveAndLastLoginBefore(boolean active, LocalDateTime cutoff);

    // PIN-related queries for 5-digit PIN system
    @Query(value = "{'employeeDetails.storeId': ?0, 'employeeDetails.employeePINHash': ?1}", exists = true)
    boolean existsByStoreIdAndEmployeeDetailsPINHash(String storeId, String pinHash);

    // Find employees by type for PIN validation
    @Query("{'type': {$in: ?0}}")
    List<User> findByTypeIn(List<UserType> types);

    // Kiosk-specific queries
    @Query("{'employeeDetails.storeId': ?0, 'employeeDetails.terminalId': ?1}")
    Optional<User> findByEmployeeDetailsStoreIdAndEmployeeDetailsTerminalId(String storeId, String terminalId);

    // Optimized PIN lookup - query by suffix first (reduces candidates from ~100 to ~1)
    @Query("{'employeeDetails.pinSuffix': ?0}")
    List<User> findByEmployeeDetailsPinSuffix(String pinSuffix);
}