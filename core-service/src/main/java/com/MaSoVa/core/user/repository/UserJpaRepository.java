package com.MaSoVa.core.user.repository;

import com.MaSoVa.core.user.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * JPA repository for PostgreSQL users table (Phase 2 dual-write).
 * MongoDB UserRepository remains the primary source during dual-write period.
 */
@Repository
public interface UserJpaRepository extends JpaRepository<UserEntity, UUID> {

    Optional<UserEntity> findByEmailAndDeletedAtIsNull(String email);

    Optional<UserEntity> findByMongoId(String mongoId);

    boolean existsByEmailAndDeletedAtIsNull(String email);

    List<UserEntity> findByStoreIdAndUserTypeAndDeletedAtIsNull(String storeId, String userType);

    @Query("SELECT u FROM UserEntity u WHERE u.storeId = :storeId AND u.isActive = true AND u.deletedAt IS NULL")
    List<UserEntity> findActiveByStoreId(@Param("storeId") String storeId);
}
