package com.MaSoVa.core.earnings.repository;

import com.MaSoVa.core.earnings.entity.StaffEarningsSummaryEntity;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StaffEarningsSummaryRepository extends JpaRepository<StaffEarningsSummaryEntity, UUID> {

    Optional<StaffEarningsSummaryEntity> findByEmployeeIdAndWeekStart(String employeeId, LocalDate weekStart);

    @Query("SELECT e FROM StaffEarningsSummaryEntity e WHERE e.employeeId = :employeeId " +
           "ORDER BY e.weekStart DESC")
    List<StaffEarningsSummaryEntity> findRecentByEmployeeId(
        @Param("employeeId") String employeeId,
        Pageable pageable
    );
}
