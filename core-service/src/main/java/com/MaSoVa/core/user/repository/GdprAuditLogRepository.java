package com.MaSoVa.core.user.repository;

import com.MaSoVa.shared.entity.GdprAuditLog;
import com.MaSoVa.shared.enums.GdprActionType;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface GdprAuditLogRepository extends MongoRepository<GdprAuditLog, String> {

    List<GdprAuditLog> findByUserId(String userId);

    List<GdprAuditLog> findByUserIdAndTimestampBetween(String userId, LocalDateTime start, LocalDateTime end);

    List<GdprAuditLog> findByActionType(GdprActionType actionType);

    List<GdprAuditLog> findByPerformedBy(String performedBy);

    List<GdprAuditLog> findByTimestampBetween(LocalDateTime start, LocalDateTime end);

    long countByUserIdAndActionType(String userId, GdprActionType actionType);
}
