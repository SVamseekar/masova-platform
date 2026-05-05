package com.MaSoVa.core.notification.repository;

import com.MaSoVa.core.notification.entity.UserPreferences;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserPreferencesRepository extends MongoRepository<UserPreferences, String> {
    Optional<UserPreferences> findByUserId(String userId);
    boolean existsByUserId(String userId);

    // Find users who have opted in for promotional messages
    @Query("{ 'promotionalEnabled': true }")
    List<UserPreferences> findByPromotionalEnabledTrue();

    // Find users who have opted in for email notifications
    @Query("{ 'emailEnabled': true }")
    List<UserPreferences> findByEmailEnabledTrue();

    // Find users who have opted in for SMS notifications
    @Query("{ 'smsEnabled': true }")
    List<UserPreferences> findBySmsEnabledTrue();
}
