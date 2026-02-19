package com.MaSoVa.core.user.repository;

import com.MaSoVa.shared.entity.GdprDataBreach;
import com.MaSoVa.shared.enums.BreachSeverity;
import com.MaSoVa.shared.enums.BreachStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface GdprDataBreachRepository extends MongoRepository<GdprDataBreach, String> {

    List<GdprDataBreach> findByStatus(BreachStatus status);

    List<GdprDataBreach> findBySeverity(BreachSeverity severity);

    List<GdprDataBreach> findByDetectedAtBetween(LocalDateTime start, LocalDateTime end);

    List<GdprDataBreach> findByAffectedUserIdsContaining(String userId);

    List<GdprDataBreach> findByNotifiedAuthorityAtIsNull();

    List<GdprDataBreach> findByNotifiedUsersAtIsNull();

    // Find breaches where authority notification is overdue (detected >72h ago, not yet notified, high/critical severity)
    @org.springframework.data.mongodb.repository.Query(
        "{ 'notifiedAuthorityAt': null, 'severity': { $in: ['HIGH', 'CRITICAL'] }, 'detectedAt': { $lt: ?0 } }"
    )
    List<GdprDataBreach> findOverdueAuthorityNotifications(LocalDateTime overdueThreshold);
}
