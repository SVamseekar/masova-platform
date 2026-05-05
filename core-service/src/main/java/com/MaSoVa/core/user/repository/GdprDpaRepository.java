package com.MaSoVa.core.user.repository;

import com.MaSoVa.shared.entity.GdprDpa;
import com.MaSoVa.shared.enums.DpaStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface GdprDpaRepository extends MongoRepository<GdprDpa, String> {

    Optional<GdprDpa> findByProcessorName(String processorName);

    List<GdprDpa> findByStatus(DpaStatus status);

    List<GdprDpa> findByIsActive(boolean isActive);

    List<GdprDpa> findByExpiresAtBefore(LocalDateTime dateTime);

    List<GdprDpa> findByExpiresAtBetween(LocalDateTime start, LocalDateTime end);
}
