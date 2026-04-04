package com.MaSoVa.core.earnings.repository;

import com.MaSoVa.core.earnings.entity.StaffPayRateEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StaffPayRateRepository extends JpaRepository<StaffPayRateEntity, UUID> {

    /**
     * Finds the effective pay rate for an employee on a given date:
     * effective_from <= date AND (effective_to IS NULL OR effective_to >= date)
     */
    @Query("SELECT r FROM StaffPayRateEntity r WHERE r.employeeId = :employeeId " +
           "AND r.effectiveFrom <= :date " +
           "AND (r.effectiveTo IS NULL OR r.effectiveTo >= :date) " +
           "ORDER BY r.effectiveFrom DESC")
    Optional<StaffPayRateEntity> findEffectiveRate(
        @Param("employeeId") String employeeId,
        @Param("date") LocalDate date
    );

    Optional<StaffPayRateEntity> findTopByEmployeeIdOrderByEffectiveFromDesc(String employeeId);
}
